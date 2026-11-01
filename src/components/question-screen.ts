import { closestAnswer, diffParts } from '../core/diff';
import { h } from '../core/dom';
import { acceptedAnswers, answerText, groupDigits, normalizeAnswer, type QuizQuestion, type QuizSession } from '../core/quiz';
import { sounds } from '../core/sound';
import { createChrono } from './chrono';
import { createCountdown } from './countdown';
import { fraction, withFractions } from './fraction';
import { createKeyboard } from './keyboard';
import { createKeypad, type Keypad } from './keypad';
import { numberLine } from './number-line';
import { createRace } from './race';
import { soundToggle } from './sound-toggle';

const MAX_DIGITS = 3;
/** Au-delà de ces caractères, la question s'écrit plus petit pour tenir sur une ligne. */
const LONG_PROMPT = 9;
/** Au-delà, une question en chiffres s'écrit aussi petit qu'une réponse en mots. */
const LONG_TEXT = 14;
/** Au-delà, encore plus petit : « 800 073 = 800 000 + … + 3 », une suite de grands nombres. */
const LONGEST_TEXT = 15;
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
  /** Nombres décimaux : la touche virgule au pavé (elle compte dans `maxDigits`). */
  decimal?: boolean;
  /** Lettres qu'on peut taper (24 par défaut ; plus pour un nombre en lettres). */
  maxLetters?: number;
  /** Nombres en lettres : une touche trait d'union au clavier. */
  hyphen?: boolean;
  /** Grands nombres (numération) : ce qui est tapé et la réponse s'écrivent par classes, « 57 842 ». */
  classes?: boolean;
  onDone(summary: SeriesSummary): void;
  onQuit(): void;
}

/** Pavé de chiffres, clavier de lettres ou boutons à toucher. */
type Mode = 'digits' | 'letters' | 'choices';

/**
 * Pose les questions d'une série une à une. Une erreur affiche tout de suite
 * la bonne réponse, sans gronder ; l'enfant passe à la suite avec OK.
 * Chaque question peut dire comment y répondre (numération : pavé, lettres ou boutons).
 * Renvoie la fonction de nettoyage.
 */
export function renderQuestionScreen(root: HTMLElement, options: QuestionScreenOptions): () => void {
  const { session } = options;
  const modeOf = (question: QuizQuestion): Mode =>
    question.choices ? 'choices' : (question.input ?? (options.input === 'letters' ? 'letters' : 'digits'));
  let mode: Mode = 'digits';
  let asked: QuizQuestion | undefined;
  let typed = '';
  let shownAt = 0;
  let state: 'asking' | 'correct' | 'wrong' | 'over' = 'asking';
  let timer: number | undefined;
  // « D'affilée » : seulement les bonnes réponses du premier coup ; une question ratée
  // qui revient ne fait ni monter ni retomber la série.
  let streak = 0;
  let bestStreak = 0;
  const missed = new Set<unknown>();
  /** La réponse attendue, par classes si on le demande. */
  const shownAnswer = (question: QuizQuestion) =>
    options.classes && typeof question.answer === 'number' ? groupDigits(answerText(question)) : answerText(question);

  const prompt = h('span', { class: 'prompt' });
  const suffix = h('span', { class: 'prompt' });
  const answerBox = h('span', { class: 'answer-box', 'aria-live': 'polite' });
  const equation = h('div', { class: 'equation' }, prompt, answerBox, suffix);
  const context = h('p', { class: 'question-context' });
  const figure = h('div', { class: 'question-figure' });
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
      if (mode === 'letters') {
        // Pas d'espace au début ni deux de suite : il ne se verrait pas.
        if (typed.length >= (options.maxLetters ?? MAX_LETTERS) || (char === ' ' && (typed === '' || typed.endsWith(' ')))) return;
        typed += char;
      } else {
        if (typed.length >= (options.maxDigits ?? MAX_DIGITS)) return;
        if (char === ',') {
          // Une seule virgule ; tapée en premier, elle suit un 0 (« 0,5 »).
          if (typed.includes(',')) return;
          typed = (typed || '0') + char;
        } else {
          typed = typed === '0' ? char : typed + char;
        }
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
        choiceButton(typed)?.classList.add('is-placed');
        sounds.placed();
        timer = window.setTimeout(next, CORRECT_PAUSE_MS);
      } else if (correct) {
        state = 'correct';
        answerBox.classList.add('is-correct');
        choiceButton(typed)?.classList.add('is-correct');
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
        if (mode === 'letters') {
          // La bonne forme, avec ce qui diffère de ce qu'elle a tapé surligné (« commen[ç]ons »).
          const shown = closestAnswer(normalizeAnswer(typed), acceptedAnswers(question));
          const [start, diff, end] = diffParts(normalizeAnswer(typed), shown);
          answerBox.replaceChildren(start, diff ? h('mark', {}, diff) : '', end);
          feedback.textContent = `C’était « ${shown} ». ${question.explain ? `${question.explain} ` : ''}${wrongHint}`;
        } else {
          answerBox.textContent = shownAnswer(question);
          // Boutons : le choisi barré, le bon mis en avant.
          choiceButton(typed)?.classList.add('is-wrong');
          choiceButton(String(question.answer))?.classList.add('is-answer');
          feedback.replaceChildren(
            ...withFractions(`C’était ${shownAnswer(question)}. ${question.explain ? `${question.explain} ` : ''}${wrongHint}`),
          );
        }
        input?.setSubmitLabel('→');
        if (chrono) chrono.addPenalty(options.chrono!.penaltyMs);
      }
      race?.pause();
      renderProgress();
    },
  };
  let input: Keypad | undefined;
  /** Les boutons de la question en cours, par réponse. */
  let buttons = new Map<string, HTMLButtonElement>();
  const choiceButton = (value: string) => buttons.get(value);
  const keypadArea = h('div', { class: 'keypad-area' });

  /** Le pavé, le clavier ou les boutons de la question ; les boutons « nombre » vont dans la question. */
  function createInput(question: QuizQuestion): Keypad {
    if (mode === 'letters') return createKeyboard(handlers, { hyphen: options.hyphen });
    if (mode === 'digits') {
      return createKeypad({
        ...handlers,
        onDigit: (digit) => handlers.onChar(String(digit)),
        onComma: options.decimal ? () => handlers.onChar(',') : undefined,
      });
    }
    return createChoices(question);
  }

  function createChoices(question: QuizQuestion): Keypad {
    const choose = (value: string) => {
      if (state !== 'asking') return;
      typed = value;
      renderAnswer();
      handlers.onSubmit();
    };
    const inNumber = question.choiceLayout === 'number';
    const count = question.choices?.length ?? 0;
    buttons = new Map(
      (question.choices ?? []).map(({ label, value }, i) => {
        const button = h('button', { class: inNumber ? 'digit-choice' : 'choice', type: 'button', onclick: () => choose(value) }, label);
        // 15 824 000 : un écart entre les classes, comme l'espace des fiches.
        if (inNumber && i > 0 && (count - i) % 3 === 0) button.classList.add('class-start');
        return [value, button];
      }),
    );
    // Après une erreur, on passe à la suite avec ce bouton (ou Entrée).
    const proceed = h('button', { class: 'button primary choice-next', type: 'button', hidden: true, onclick: handlers.onSubmit }, 'Continuer →');
    const el = h('div', { class: 'choices-input' });
    if (!inNumber) {
      const row = h('div', { class: 'choice-buttons' }, ...buttons.values());
      // Quatre grands nombres (« 70 900 000 ») : deux par ligne, plus petits.
      const wide = (question.choices ?? []).some((c) => c.label.length > 7);
      row.style.setProperty('--choices', String(wide && buttons.size > 3 ? 2 : buttons.size));
      row.classList.toggle('wide', wide);
      el.append(row);
    }
    el.append(proceed);
    const onKeydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || document.querySelector('.overlay')) return;
      // « < », « > », « = » au clavier d'ordinateur.
      const typedChoice = inNumber ? undefined : question.choices?.find((c) => c.label === event.key);
      if (event.key === 'Enter') handlers.onSubmit();
      else if (typedChoice) choose(typedChoice.value);
      else return;
      event.preventDefault();
    };
    document.addEventListener('keydown', onKeydown);
    return {
      el,
      setSubmitLabel: (label) => {
        proceed.hidden = label === 'OK';
      },
      destroy: () => document.removeEventListener('keydown', onKeydown),
    };
  }

  function renderAnswer() {
    // Un bouton touché : on écrit ce qu'il montre (« < »), pas sa valeur.
    const label =
      mode === 'choices'
        ? (asked?.choices?.find((c) => c.value === typed)?.label ?? typed)
        : mode === 'digits' && options.classes
          ? groupDigits(typed)
          : typed;
    answerBox.textContent = label || '?';
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
    asked = question;
    // Le pavé ou le clavier reste d'une question à l'autre ; les boutons changent à chaque fois.
    const nextMode = modeOf(question);
    if (input === undefined || nextMode !== mode || nextMode === 'choices') {
      input?.destroy();
      mode = nextMode;
      input = createInput(question);
      keypadArea.replaceChildren(input.el);
    }
    section.classList.toggle('letters', mode === 'letters');
    if (mode !== 'choices') buttons = new Map();
    // Nombre caché : la case est au milieu (« 7 × ? = 56 »), l'opération plus longue s'affiche plus petit.
    // En mots ou avec des boutons, pas de « = » : « nous [ mangerons ] », « 92 [ > ] 29 ».
    prompt.replaceChildren(...withFractions(question.suffix === undefined && mode === 'digits' ? `${question.prompt} =` : question.prompt));
    context.textContent = question.context ?? '';
    figure.replaceChildren(...(question.figure ? [numberLine(question.figure)] : []));
    figure.hidden = !question.figure;
    // « 8,37 = ?/100 » : la case est le numérateur d'une fraction.
    const denominator = /^\/(\d+)$/.exec(question.suffix ?? '')?.[1];
    suffix.textContent = denominator === undefined ? (question.suffix ?? '') : '';
    if (question.choiceLayout === 'number') {
      // « Touche le chiffre des dizaines » : les chiffres du nombre sont les boutons.
      equation.replaceChildren(h('span', { class: 'number-digits' }, ...buttons.values()));
    } else if (mode === 'choices' && question.suffix === undefined) {
      // « Ce nombre existe-t-il ? cinquante-douze » : pas de case, la réponse est le bouton.
      equation.replaceChildren(prompt);
    } else {
      equation.replaceChildren(prompt, denominator === undefined ? answerBox : fraction(answerBox, denominator), suffix);
    }
    // Des mots (« quatre-vingt-quinze », « Le double de 37 ») ou une suite (« 635, 535, 435, 335, ») :
    // plus petit, comme une réponse en mots.
    const wordy = /\p{L}{2}/u.test(question.prompt) || `${question.prompt}${question.suffix ?? ''}`.length > LONG_TEXT;
    equation.classList.toggle('words', mode === 'letters' || wordy);
    // Un nombre à toucher chiffre par chiffre prend plus de place : plus petit dès 7 chiffres.
    const longest = question.choiceLayout === 'number' ? (question.choices?.length ?? 0) >= 7 : `${question.prompt}${question.suffix ?? ''}`.length > LONGEST_TEXT;
    equation.classList.toggle('longest', mode !== 'letters' && longest);
    // Case au milieu, ou calcul long (« 25 % de 600 », « 47 + 77 + 33 ») : plus petit, sur une ligne.
    equation.classList.toggle('long', question.suffix !== undefined || (mode !== 'letters' && question.prompt.length > LONG_PROMPT));
    answerBox.className = 'answer-box';
    feedback.textContent = '';
    input.setSubmitLabel('OK');
    renderAnswer();
    shownAt = performance.now();
    chrono?.start();
    countdown?.start();
    race?.start();
  }

  const section = h(
    'section',
    { class: 'play' },
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
      figure,
      equation,
      feedback,
      streakEl,
      undoButton,
    ),
    keypadArea,
  );
  root.append(section);

  next();

  return () => {
    window.clearTimeout(timer);
    input?.destroy();
    chrono?.destroy();
    countdown?.destroy();
    race?.destroy();
  };
}
