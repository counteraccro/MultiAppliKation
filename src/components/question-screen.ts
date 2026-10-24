import { h } from '../core/dom';
import type { QuizSession } from '../core/quiz';
import { createChrono } from './chrono';
import { createKeypad } from './keypad';

const MAX_DIGITS = 3;
/** Temps pendant lequel une bonne réponse reste affichée avant la suivante. */
const CORRECT_PAUSE_MS = 450;
/** Au-delà, des points de progression ne tiendraient pas sur un téléphone : on affiche « 5 / 20 ». */
const MAX_DOTS = 12;

export interface QuestionScreenOptions {
  session: QuizSession;
  /** Ex. « Table de 7 ». */
  label: string;
  /** Chrono visible (défi) ; une erreur ajoute `penaltyMs`. */
  chrono?: { penaltyMs: number };
  /** Phrase sous la bonne réponse après une erreur. */
  wrongHint?: string;
  onDone(): void;
  onQuit(): void;
}

/**
 * Pose les questions d'une série une à une. Une erreur affiche tout de suite
 * la bonne réponse, sans gronder ; l'enfant passe à la suite avec OK.
 * Renvoie la fonction de nettoyage.
 */
export function renderQuestionScreen(root: HTMLElement, options: QuestionScreenOptions): () => void {
  const { session } = options;
  let typed = '';
  let shownAt = 0;
  let state: 'asking' | 'correct' | 'wrong' = 'asking';
  let timer: number | undefined;

  const prompt = h('span', { class: 'prompt' });
  const answerBox = h('span', { class: 'answer-box', 'aria-live': 'polite' });
  const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const progress = h('div', { class: 'progress', 'aria-hidden': 'true' });
  const progressText = h('span', { class: 'visually-hidden' });
  const chrono = options.chrono && createChrono();
  const wrongHint = options.wrongHint ?? 'Elle reviendra un peu plus tard.';

  const keypad = createKeypad({
    onDigit(digit) {
      if (state !== 'asking' || typed.length >= MAX_DIGITS) return;
      typed = typed === '0' ? String(digit) : typed + digit;
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
      const correct = session.answer(Number(typed), performance.now() - shownAt);
      if (correct) {
        state = 'correct';
        answerBox.classList.add('is-correct');
        feedback.textContent = 'Bravo !';
        timer = window.setTimeout(next, CORRECT_PAUSE_MS);
      } else {
        state = 'wrong';
        answerBox.classList.add('is-wrong');
        answerBox.textContent = String(question.answer);
        feedback.textContent = `C’était ${question.answer}. ${wrongHint}`;
        keypad.setSubmitLabel('→');
        if (chrono) chrono.addPenalty(options.chrono!.penaltyMs);
      }
      renderProgress();
    },
  });

  function renderAnswer() {
    answerBox.textContent = typed || '?';
    answerBox.classList.toggle('is-empty', typed === '');
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
  }

  function next() {
    window.clearTimeout(timer);
    const question = session.current();
    if (!question) return options.onDone();
    state = 'asking';
    renderProgress();
    typed = '';
    prompt.textContent = `${question.prompt} =`;
    answerBox.className = 'answer-box';
    feedback.textContent = '';
    keypad.setSubmitLabel('OK');
    renderAnswer();
    shownAt = performance.now();
    chrono?.start();
  }

  root.append(
    h(
      'section',
      { class: 'play' },
      h(
        'header',
        { class: 'play-bar' },
        h('button', { class: 'quit', type: 'button', 'aria-label': 'Arrêter', onclick: options.onQuit }, '✕'),
        h('span', { class: 'play-label' }, options.label),
        progress,
        progressText,
      ),
      h('div', { class: 'question' }, chrono?.el, h('div', { class: 'equation' }, prompt, answerBox), feedback),
      h('div', { class: 'keypad-area' }, keypad.el),
    ),
  );

  next();

  return () => {
    window.clearTimeout(timer);
    keypad.destroy();
    chrono?.destroy();
  };
}
