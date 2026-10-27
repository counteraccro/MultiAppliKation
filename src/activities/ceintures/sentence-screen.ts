import { soundToggle } from '../../components/sound-toggle';
import { h } from '../../core/dom';
import { sounds } from '../../core/sound';
import type { PracticeItem, PracticeSession } from './practice-session';
import type { TestSession } from './test-session';
import { capitalize, parseSentence, withNbsp } from './sentence';

/** Une bonne réponse reste affichée un instant ; plus longtemps à la fin d'une phrase, pour la relire. */
const NEXT_BLANK_PAUSE_MS = 300;
const NEXT_SENTENCE_PAUSE_MS = 800;
/** Comme l'écran de question : « d'affilée » à partir de 3, fête tous les 5. */
const STREAK_SHOWN_FROM = 3;
const STREAK_MILESTONE = 5;

export interface SentenceScreenOptions {
  session: PracticeSession | TestSession;
  /** Test de passage : le mot se place sans dire s'il est juste, tout est corrigé à la fin. */
  test?: boolean;
  /** Ex. « Ceinture blanche ». */
  label: string;
  onDone(summary: { bestStreak: number }): void;
  onQuit(): void;
}

interface Filled {
  /** Le mot choisi par l'enfant. */
  word: string;
  correct: boolean;
}

/**
 * Phrases à trous : l'enfant touche le bon mot pour chaque trou, dans l'ordre.
 * Une erreur montre le bon mot surligné et l'astuce de la famille de mots, sans gronder ;
 * l'enfant continue avec « Continuer ». En test, rien n'est corrigé pendant.
 * Renvoie la fonction de nettoyage.
 */
export function renderSentenceScreen(root: HTMLElement, options: SentenceScreenOptions): () => void {
  const { session } = options;
  let item: PracticeItem | undefined;
  let filled: Filled[] = [];
  let state: 'asking' | 'correct' | 'wrong' = 'asking';
  let timer: number | undefined;
  let streak = 0;
  let bestStreak = 0;

  const cloze = h('p', { class: 'cloze', 'aria-live': 'polite' });
  const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const streakEl = h('p', { class: 'streak', 'aria-live': 'polite' });
  const progress = h('div', { class: 'progress', 'aria-hidden': 'true' });
  const progressText = h('span', { class: 'visually-hidden' });
  const buttons = h('div', { class: 'choice-buttons' });
  // Test : revenir au trou d'avant (mot touché par erreur), au besoin dans la phrase d'avant.
  const testSession = options.test ? (session as TestSession) : undefined;
  const undoButton =
    testSession && h('button', { class: 'link-button undo', type: 'button', onclick: undo }, '← Revenir au mot d’avant');

  function undo() {
    if (!testSession || testSession.undo() === undefined) return;
    window.clearTimeout(timer);
    item = testSession.current();
    // En test, rien n'est corrigé : `correct` ne s'affiche pas.
    filled = testSession.chosen().map((word) => ({ word, correct: false }));
    nextBlank();
    renderProgress();
  }

  function choose(word: string) {
    if (state !== 'asking' || !item) return;
    const firstTry = !session.isRetry();
    const correct = session.choose(word);
    const answer = parseBlanks(item)[filled.length]!.answer;
    filled.push({ word, correct });
    const sentenceDone = filled.length === parseBlanks(item).length;
    if (options.test) {
      state = 'correct';
      sounds.placed();
      renderSentence();
      timer = window.setTimeout(sentenceDone ? nextSentence : nextBlank, sentenceDone ? NEXT_SENTENCE_PAUSE_MS : NEXT_BLANK_PAUSE_MS);
    } else if (correct) {
      state = 'correct';
      if (firstTry) streak++;
      bestStreak = Math.max(bestStreak, streak);
      const milestone = firstTry && streak % STREAK_MILESTONE === 0;
      if (milestone) sounds.streak();
      else sounds.correct();
      renderStreak(milestone);
      feedback.textContent = sentenceDone ? 'Bravo !' : '';
      renderSentence();
      timer = window.setTimeout(sentenceDone ? nextSentence : nextBlank, sentenceDone ? NEXT_SENTENCE_PAUSE_MS : NEXT_BLANK_PAUSE_MS);
    } else {
      state = 'wrong';
      streak = 0;
      sounds.wrong();
      renderStreak(false);
      feedback.textContent = withNbsp(`C’était « ${answer} ». ${item.group.tip}`);
      renderSentence();
      buttons.replaceChildren(
        h('button', { class: 'button primary continue', type: 'button', onclick: () => cont(sentenceDone) }, 'Continuer →'),
      );
    }
    renderProgress();
  }

  function cont(sentenceDone: boolean) {
    if (state !== 'wrong') return;
    if (sentenceDone) nextSentence();
    else nextBlank();
  }

  function nextBlank() {
    window.clearTimeout(timer);
    state = 'asking';
    feedback.textContent = '';
    renderSentence();
    renderButtons();
  }

  function nextSentence() {
    window.clearTimeout(timer);
    item = session.current();
    if (!item) return options.onDone({ bestStreak });
    filled = [];
    nextBlank();
    renderProgress();
  }

  function renderSentence() {
    if (!item) return;
    let blank = 0;
    cloze.replaceChildren(
      ...parseSentence(item.sentence.text).map((segment) => {
        if (typeof segment === 'string') return withNbsp(segment);
        const index = blank++;
        const done = filled[index];
        const word = segment.capital ? capitalize(segment.answer) : segment.answer;
        if (done && options.test) {
          return h('span', { class: 'blank is-placed' }, segment.capital ? capitalize(done.word) : done.word);
        }
        if (done) {
          return h('span', { class: `blank ${done.correct ? 'is-correct' : 'is-wrong'}` }, done.correct ? word : h('mark', {}, word));
        }
        const isCurrent = index === filled.length && state === 'asking';
        return h('span', { class: `blank${isCurrent ? ' current' : ''}`, 'aria-label': isCurrent ? 'trou à remplir' : 'trou' }, '…');
      }),
    );
  }

  function renderButtons() {
    if (!item) return;
    buttons.style.setProperty('--choices', String(item.group.choices.length));
    buttons.replaceChildren(
      ...item.group.choices.map((word) => h('button', { class: 'choice', type: 'button', onclick: () => choose(word) }, word)),
    );
  }

  function renderStreak(milestone: boolean) {
    streakEl.textContent = streak >= STREAK_SHOWN_FROM ? `🔥 ${streak} d’affilée !` : '';
    streakEl.classList.remove('bump', 'milestone');
    void streakEl.offsetWidth;
    if (streak >= STREAK_SHOWN_FROM) streakEl.classList.add(milestone ? 'milestone' : 'bump');
  }

  function renderProgress() {
    progress.replaceChildren(
      ...Array.from({ length: session.total }, (_, i) => h('span', { class: i < session.attempted ? 'dot done' : 'dot' })),
    );
    const shown = Math.min(session.attempted + 1, session.total);
    progressText.textContent = `Phrase ${shown} sur ${session.total}`;
    if (undoButton) undoButton.hidden = session.attempted === 0 && filled.length === 0;
  }

  // Au clavier d'ordinateur : 1, 2, 3 pour les boutons, Entrée pour continuer.
  const onKeydown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || document.querySelector('.overlay')) return;
    if (event.key === 'Enter' && state === 'wrong') {
      (buttons.querySelector('button') as HTMLButtonElement | null)?.click();
    } else if (/^[1-9]$/.test(event.key) && state === 'asking' && item) {
      const word = item.group.choices[Number(event.key) - 1];
      if (word) choose(word);
    } else {
      return;
    }
    event.preventDefault();
  };
  document.addEventListener('keydown', onKeydown);

  root.append(
    h(
      'section',
      { class: 'play choices' },
      h(
        'header',
        { class: 'play-bar' },
        h('button', { class: 'quit', type: 'button', 'aria-label': 'Arrêter', onclick: options.onQuit }, '✕'),
        h('span', { class: 'play-label' }, options.label),
        progress,
        progressText,
        soundToggle(),
      ),
      h('div', { class: 'question' }, cloze, feedback, streakEl, undoButton),
      h('div', { class: 'keypad-area' }, buttons),
    ),
  );

  nextSentence();

  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('keydown', onKeydown);
  };
}

function parseBlanks(item: PracticeItem) {
  return parseSentence(item.sentence.text).filter((s) => typeof s !== 'string');
}
