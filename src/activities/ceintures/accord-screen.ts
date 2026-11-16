import { answerWithFixes, typedWithMistakes } from '../../components/correction';
import { createKeyboard } from '../../components/keyboard';
import { soundToggle } from '../../components/sound-toggle';
import { h } from '../../core/dom';
import { sounds } from '../../core/sound';
import type { AccordSession } from './accord-session';
import { boxesOf, isRight, normalizeWords, parseAccord, shown, tipFor, type AccordExercise, type Box } from './accords';
import { withNbsp } from './sentence';

/** À la fin d'une phrase, un instant pour la relire ; entre deux cases, pas d'attente (on tape vite). */
const NEXT_SENTENCE_PAUSE_MS = 900;
/** Comme l'écran de question : « d'affilée » à partir de 3, fête tous les 5. */
const STREAK_SHOWN_FROM = 3;
const STREAK_MILESTONE = 5;
/** Assez pour « les étoiles », pas assez pour taper n'importe quoi. */
const MAX_LETTERS = 30;

export interface AccordScreenOptions {
  session: AccordSession;
  /** Conditions réelles : le mot se place sans dire s'il est juste, tout est corrigé à la fin. */
  test?: boolean;
  /** Ex. « Ceinture blanche ». */
  label: string;
  onDone(summary: { bestStreak: number }): void;
  onQuit(): void;
}

/**
 * Les cases d'une phrase, d'après ce qui y est tapé : `typed` (cases remplies), la case en cours
 * (`current`, et ce qui s'y tape), les suivantes avec leur mot de départ en gris. `checked` : montrer
 * si c'est juste (entraînement, correction) ; sinon le mot se place sans rien dire (conditions réelles).
 */
export function drawAccord(
  exercise: AccordExercise,
  typed: readonly string[],
  { checked, current, typing = '' }: { checked: boolean; current?: number; typing?: string },
): (string | HTMLElement)[] {
  let index = 0;
  return parseAccord(exercise.text).map((piece) => {
    if (typeof piece === 'string') return withNbsp(piece);
    const i = index++;
    const given = typed[i];
    if (given !== undefined) return filledBox(piece, given, checked);
    if (i === current) {
      return h(
        'span',
        { class: typing ? 'blank accord-box current' : 'blank accord-box current is-empty', 'aria-label': `à transformer : ${piece.start}` },
        typing ? shown(piece, typing) : piece.start,
      );
    }
    return h('span', { class: 'blank accord-box is-waiting' }, piece.start);
  });
}

/** Une case remplie : juste en vert ; fausse, sa réponse aux fautes barrées et la bonne en dessous. */
function filledBox(box: Box, given: string, checked: boolean): HTMLElement {
  const word = shown(box, normalizeWords(given));
  if (!checked) return h('span', { class: 'blank accord-box is-placed' }, word);
  if (isRight(box, given)) return h('span', { class: 'blank accord-box is-correct' }, word);
  return h(
    'span',
    { class: 'blank accord-box is-wrong' },
    typedWithMistakes(word, shown(box, box.answer)),
    answerWithFixes(word, shown(box, box.answer)),
  );
}

/**
 * Accords : la phrase transposée s'affiche, les mots à transformer dans des cases (leur mot de départ
 * en gris) ; l'enfant tape chaque case au clavier de lettres, dans l'ordre. À l'entraînement, une erreur
 * montre sa réponse aux fautes barrées, la bonne en dessous et l'astuce ; il continue avec « Continuer ».
 * Renvoie la fonction de nettoyage.
 */
export function renderAccordScreen(root: HTMLElement, options: AccordScreenOptions): () => void {
  const { session } = options;
  let exercise: AccordExercise | undefined;
  let typing = '';
  let state: 'asking' | 'paused' | 'wrong' = 'asking';
  let timer: number | undefined;
  let streak = 0;
  let bestStreak = 0;

  const instruction = h('p', { class: 'question-context accord-instruction' });
  const text = h('p', { class: 'cloze accord-text', 'aria-live': 'polite' });
  const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const streakEl = h('p', { class: 'streak', 'aria-live': 'polite' });
  const progress = h('div', { class: 'progress', 'aria-hidden': 'true' });
  const progressText = h('span', { class: 'visually-hidden' });
  const undoButton = options.test ? h('button', { class: 'link-button undo', type: 'button', onclick: undo }, '← Revenir au mot d’avant') : undefined;

  const keyboard = createKeyboard(
    {
      onChar(char) {
        if (state !== 'asking' || typing.length >= MAX_LETTERS) return;
        if (char === ' ' && (typing === '' || typing.endsWith(' '))) return;
        typing += char;
        renderText();
      },
      onBackspace() {
        if (state !== 'asking') return;
        typing = typing.slice(0, -1);
        renderText();
      },
      onSubmit() {
        if (state === 'wrong') return next();
        if (state === 'asking' && typing.trim() !== '') submit();
      },
    },
    { hyphen: true, apostrophe: true },
  );

  function submit() {
    const at = session.current();
    if (!at) return;
    const box = boxesOf(at.exercise.text)[at.index]!;
    const correct = session.answer(typing);
    typing = '';
    const sentenceDone = session.current()?.exercise !== at.exercise;
    if (options.test) {
      sounds.placed();
      pause(sentenceDone);
    } else if (correct) {
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      const milestone = streak % STREAK_MILESTONE === 0;
      if (milestone) sounds.streak();
      else sounds.correct();
      renderStreak(milestone);
      feedback.textContent = sentenceDone ? 'Bravo !' : '';
      pause(sentenceDone);
    } else {
      state = 'wrong';
      streak = 0;
      sounds.wrong();
      renderStreak(false);
      feedback.textContent = withNbsp(tipFor(box));
      keyboard.setSubmitLabel('Continuer');
    }
    renderText();
    renderProgress();
  }

  /** La case suivante tout de suite ; la phrase suivante après un instant. */
  function pause(sentenceDone: boolean) {
    if (!sentenceDone) return;
    state = 'paused';
    timer = window.setTimeout(next, NEXT_SENTENCE_PAUSE_MS);
  }

  function next() {
    window.clearTimeout(timer);
    const at = session.current();
    if (!at) return options.onDone({ bestStreak });
    exercise = at.exercise;
    state = 'asking';
    feedback.textContent = '';
    keyboard.setSubmitLabel('OK');
    instruction.textContent = exercise.instruction;
    renderText();
    renderProgress();
  }

  function undo() {
    if (state === 'wrong') return;
    const previous = session.undo();
    if (previous === undefined) return;
    next();
    typing = normalizeWords(previous);
    renderText();
  }

  function renderText() {
    if (!exercise) return;
    const at = session.current();
    const current = at?.exercise === exercise && state === 'asking' ? at.index : undefined;
    text.replaceChildren(...drawAccord(exercise, session.typedIn(exercise), { checked: !options.test, current, typing }));
  }

  function renderStreak(milestone: boolean) {
    streakEl.textContent = streak >= STREAK_SHOWN_FROM ? `🔥 ${streak} d’affilée !` : '';
    streakEl.classList.remove('bump', 'milestone');
    void streakEl.offsetWidth;
    if (streak >= STREAK_SHOWN_FROM) streakEl.classList.add(milestone ? 'milestone' : 'bump');
  }

  /** Un point par phrase. */
  function renderProgress() {
    const done = session.exercises.filter((e) => session.typedIn(e).length === boxesOf(e.text).length).length;
    progress.replaceChildren(...session.exercises.map((_, i) => h('span', { class: i < done ? 'dot done' : 'dot' })));
    progressText.textContent = `Phrase ${Math.min(done + 1, session.exercises.length)} sur ${session.exercises.length}`;
    if (undoButton) undoButton.hidden = session.attempted === 0;
  }

  root.append(
    h(
      'section',
      { class: 'play choices letters accord-play' },
      h(
        'header',
        { class: 'play-bar' },
        h('button', { class: 'quit', type: 'button', 'aria-label': 'Arrêter', onclick: options.onQuit }, '✕'),
        h('span', { class: 'play-label' }, options.label),
        progress,
        progressText,
        soundToggle(),
      ),
      h('div', { class: 'question' }, instruction, text, feedback, streakEl, undoButton),
      h('div', { class: 'keypad-area' }, keyboard.el),
    ),
  );

  next();

  return () => {
    window.clearTimeout(timer);
    keyboard.destroy();
  };
}
