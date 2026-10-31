import { closestAnswer, diffParts } from '../core/diff';
import { h } from '../core/dom';
import { acceptedAnswers, normalizeAnswer, type QuizSession } from '../core/quiz';
import { sounds } from '../core/sound';
import { createChrono } from './chrono';
import { createCountdown } from './countdown';
import { createKeyboard } from './keyboard';
import { createKeypad } from './keypad';
import { createRace } from './race';
import { soundToggle } from './sound-toggle';

const MAX_DIGITS = 3;
/** Assez pour « sommes allées », pas assez pour taper n'importe quoi. */
const MAX_LETTERS = 24;
/** Temps pendant lequel une bonne réponse reste affichée avant la suivante. */
const CORRECT_PAUSE_MS = 450;
/** Temps pendant lequel « Temps écoulé ! » reste affiché avant le résultat. */
const TIME_UP_PAUSE_MS = 1200;
/** Au-delà, des points de progression ne tiendraient pas sur un téléphone : on affiche « 5 / 20 ». */
const MAX_DOTS = 12;
/** Le compteur « d'affilée » apparaît à partir de là ; il fait la fête à chaque multiple de 5. */
const STREAK_SHOWN_FROM = 3;
const STREAK_MILESTONE = 5;

export interface SeriesSummary {
  /** Plus longue suite de bonnes réponses. */
  bestStreak: number;
}

export interface QuestionScreenOptions {
  session: QuizSession;
  /** Ex. « Table de 7 ». */
  label: string;
  /** Pavé de chiffres (par défaut) ou clavier de lettres, pour répondre en mots. */
  input?: 'digits' | 'letters';
  /** Chrono visible (défi) ; une erreur ajoute `penaltyMs`. */
  chrono?: { penaltyMs: number };
  /** Défi : course contre ce record (ms), s'il existe. */
  recordMs?: number;
  /** Phrase sous la bonne réponse après une erreur. */
  wrongHint?: string;
  /** Test (ceintures) : la réponse se place sans dire si elle est juste, tout est corrigé à la fin. */
  test?: boolean;
  /** Compte à rebours (ceintures de tables : une minute) ; à zéro, la série s'arrête là. */
  timeLimitMs?: number;
  /** Chiffres qu'on peut taper (3 par défaut ; calcul mental : 45 × 1000 = 45000). */
  maxDigits?: number;
  onDone(summary: SeriesSummary): void;
  onQuit(): void;
}

/**
 * Pose les questions d'une série une à une. Une erreur affiche tout de suite
 * la bonne réponse, sans gronder ; l'enfant passe à la suite avec OK.
 * Renvoie la fonction de nettoyage.
 */
export function renderQuestionScreen(root: HTMLElement, options: QuestionScreenOptions): () => void {
  const { session } = options;
  const letters = options.input === 'letters';
  let typed = '';
  let shownAt = 0;
  let state: 'asking' | 'correct' | 'wrong' | 'over' = 'asking';
  let timer: number | undefined;
  // « D'affilée » : seulement les bonnes réponses du premier coup ; une question ratée
  // qui revient ne fait ni monter ni retomber la série.
  let streak = 0;
  let bestStreak = 0;
  const missed = new Set<unknown>();

  const prompt = h('span', { class: 'prompt' });
  const suffix = h('span', { class: 'prompt' });
  const answerBox = h('span', { class: 'answer-box', 'aria-live': 'polite' });
  const equation = h('div', { class: `equation${letters ? ' words' : ''}` }, prompt, answerBox, suffix);
  const context = h('p', { class: 'question-context' });
  const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const progress = h('div', { class: 'progress', 'aria-hidden': 'true' });
  const progressText = h('span', { class: 'visually-hidden' });
  const chrono = options.chrono && createChrono();
  const countdown = options.timeLimitMs !== undefined ? createCountdown(options.timeLimitMs, timeUp) : undefined;
  const wrongHint = options.wrongHint ?? 'Elle reviendra un peu plus tard.';
  const streakEl = h('p', { class: 'streak', 'aria-live': 'polite' });
  const race =
    chrono && options.recordMs !== undefined
      ? createRace({
          recordMs: options.recordMs,
          total: session.total,
          elapsed: chrono.elapsed,
          attempted: () => session.attempted,
        })
      : undefined;

  const soundButton = soundToggle();
  // Test : revenir à la réponse d'avant (validée trop vite) ; elle revient dans la case, à corriger.
  const undoButton =
    options.test && session.undo
      ? h('button', { class: 'link-button undo', type: 'button', onclick: undo }, '← Revenir à la réponse d’avant')
      : undefined;

  /** Le temps est fini : ce qui est tapé sans être validé ne compte pas. */
  function timeUp() {
    window.clearTimeout(timer);
    state = 'over';
    answerBox.classList.add('is-placed');
    feedback.textContent = '⏰ Temps écoulé !';
    if (undoButton) undoButton.hidden = true;
    timer = window.setTimeout(() => options.onDone({ bestStreak }), TIME_UP_PAUSE_MS);
  }

  function undo() {
    if (state === 'over') return;
    const previous = session.undo?.();
    if (previous === undefined) return;
    next();
    typed = previous;
    renderAnswer();
  }

  const handlers = {
    onChar(char: string) {
      if (state !== 'asking') return;
      if (letters) {
        // Pas d'espace au début ni deux de suite : il ne se verrait pas.
        if (typed.length >= MAX_LETTERS || (char === ' ' && (typed === '' || typed.endsWith(' ')))) return;
        typed += char;
      } else {
        if (typed.length >= (options.maxDigits ?? MAX_DIGITS)) return;
        typed = typed === '0' ? char : typed + char;
      }
      renderAnswer();
    },
    onBackspace() {
      if (state !== 'asking') return;
      typed = typed.slice(0, -1);
      renderAnswer();
    },
    onSubmit() {
      if (state === 'wrong') return next();
      if (state !== 'asking' || typed === '') return;
      const question = session.current();
      if (!question) return;
      chrono?.pause();
      countdown?.pause();
      const correct = session.answer(typed, performance.now() - shownAt);
      if (options.test) {
        state = 'correct';
        answerBox.classList.add('is-placed');
        sounds.placed();
        timer = window.setTimeout(next, CORRECT_PAUSE_MS);
      } else if (correct) {
        state = 'correct';
        answerBox.classList.add('is-correct');
        feedback.textContent = 'Bravo !';
        const firstTry = !missed.has(question);
        if (firstTry) streak++;
        bestStreak = Math.max(bestStreak, streak);
        const milestone = firstTry && streak % STREAK_MILESTONE === 0;
        if (milestone) sounds.streak();
        else sounds.correct();
        renderStreak(milestone);
        timer = window.setTimeout(next, CORRECT_PAUSE_MS);
      } else {
        state = 'wrong';
        missed.add(question);
        streak = 0;
        sounds.wrong();
        renderStreak(false);
        answerBox.classList.add('is-wrong');
        if (letters) {
          // La bonne forme, avec ce qui diffère de ce qu'elle a tapé surligné (« commen[ç]ons »).
          const shown = closestAnswer(normalizeAnswer(typed), acceptedAnswers(question));
          const [start, diff, end] = diffParts(normalizeAnswer(typed), shown);
          answerBox.replaceChildren(start, diff ? h('mark', {}, diff) : '', end);
          feedback.textContent = `C’était « ${shown} ». ${wrongHint}`;
        } else {
          answerBox.textContent = String(question.answer);
          feedback.textContent = `C’était ${question.answer}. ${question.explain ? `${question.explain} ` : ''}${wrongHint}`;
        }
        keypad.setSubmitLabel('→');
        if (chrono) chrono.addPenalty(options.chrono!.penaltyMs);
      }
      race?.pause();
      renderProgress();
    },
  };
  const keypad = letters
    ? createKeyboard(handlers)
    : createKeypad({ ...handlers, onDigit: (digit) => handlers.onChar(String(digit)) });

  function renderAnswer() {
    answerBox.textContent = typed || '?';
    answerBox.classList.toggle('is-empty', typed === '');
  }

  function renderStreak(milestone: boolean) {
    streakEl.textContent = streak >= STREAK_SHOWN_FROM ? `🔥 ${streak} d’affilée !` : '';
    // Relance l'animation à chaque bonne réponse.
    streakEl.classList.remove('bump', 'milestone');
    void streakEl.offsetWidth;
    if (streak >= STREAK_SHOWN_FROM) streakEl.classList.add(milestone ? 'milestone' : 'bump');
  }

  function renderProgress() {
    // Numéro de la question à l'écran : pendant la correction, c'est encore celle qui vient d'être posée.
    const shown = Math.min(session.attempted + (state === 'asking' ? 1 : 0), session.total);
    if (session.total > MAX_DOTS) {
      progress.textContent = `${shown} / ${session.total}`;
    } else {
      progress.replaceChildren(
        ...Array.from({ length: session.total }, (_, i) =>
          h('span', { class: i < session.attempted ? 'dot done' : 'dot' }),
        ),
      );
    }
    progressText.textContent = `Question ${shown} sur ${session.total}`;
    if (undoButton) undoButton.hidden = session.attempted === 0;
  }

  function next() {
    window.clearTimeout(timer);
    const question = session.current();
    if (!question) return options.onDone({ bestStreak });
    state = 'asking';
    renderProgress();
    typed = '';
    // Nombre caché : la case est au milieu (« 7 × ? = 56 »), l'opération plus longue s'affiche plus petit.
    // En mots, pas de « = » : « nous [ mangerons ] ».
    prompt.textContent = question.suffix === undefined && !letters ? `${question.prompt} =` : question.prompt;
    context.textContent = question.context ?? '';
    suffix.textContent = question.suffix ?? '';
    equation.classList.toggle('long', question.suffix !== undefined);
    answerBox.className = 'answer-box';
    feedback.textContent = '';
    keypad.setSubmitLabel('OK');
    renderAnswer();
    shownAt = performance.now();
    chrono?.start();
    countdown?.start();
    race?.start();
  }

  root.append(
    h(
      'section',
      { class: `play${letters ? ' letters' : ''}` },
      h(
        'header',
        { class: 'play-bar' },
        h('button', { class: 'quit', type: 'button', 'aria-label': 'Arrêter', onclick: options.onQuit }, '✕'),
        h('span', { class: 'play-label' }, options.label),
        progress,
        progressText,
        soundButton,
      ),
      h(
        'div',
        { class: 'question' },
        chrono?.el,
        countdown?.el,
        race?.el,
        context,
        equation,
        feedback,
        streakEl,
        undoButton,
      ),
      h('div', { class: 'keypad-area' }, keypad.el),
    ),
  );

  next();

  return () => {
    window.clearTimeout(timer);
    keypad.destroy();
    chrono?.destroy();
    countdown?.destroy();
    race?.destroy();
  };
}
