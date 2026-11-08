import { closestAnswer } from '../core/diff';
import { h } from '../core/dom';
import {
  acceptedAnswers,
  answerText,
  clockMinutes,
  groupDigits,
  isNumberLine,
  normalizeAnswer,
  shownAnswerFor,
  splitMeasure,
  type PartsFigure,
  type QuizQuestion,
  type QuizSession,
} from '../core/quiz';
import { sounds } from '../core/sound';
import { createChrono } from './chrono';
import { createCountdown } from './countdown';
import { answerWithFixes, typedWithMistakes } from './correction';
import { fraction, withFractions } from './fraction';
import { createKeyboard } from './keyboard';
import { createKeypad, type Keypad } from './keypad';
import { numberLine } from './number-line';
import { drawFigure, partsPicture } from './parts-picture';
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

/** Pavé de chiffres, clavier de lettres, boutons à toucher, dessin à colorier, nombres à ranger, nombre + unité, ou heures. */
type Mode = 'digits' | 'letters' | 'choices' | 'paint' | 'order' | 'measure' | 'clock';

/**
 * Pose les questions d'une série une à une. Une erreur affiche tout de suite
 * la bonne réponse, sans gronder ; l'enfant passe à la suite avec OK.
 * Chaque question peut dire comment y répondre (numération : pavé, lettres ou boutons).
 * Renvoie la fonction de nettoyage.
 */
export function renderQuestionScreen(root: HTMLElement, options: QuestionScreenOptions): () => void {
  const { session } = options;
  const modeOf = (question: QuizQuestion): Mode =>
    question.order ? 'order' : question.clock ? 'clock' : question.units ? 'measure' : question.choices ? 'choices' : (question.input ?? (options.input === 'letters' ? 'letters' : 'digits'));
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
  /** Mesures : ce qui est tapé est « nombre unité » ; le pavé ne change que le nombre. */
  const withNumber = (change: (number: string) => string) => {
    const { number, unit } = splitMeasure(typed);
    const changed = change(number);
    typed = unit === '' ? changed : `${changed} ${unit}`;
  };
  /**
   * Heures : ce qui est tapé est « 1 h 15 min », mot à mot. Un chiffre allonge le dernier nombre, ou en commence
   * un après « h » ; « h » et « min » suivent un nombre, une fois chacun, « h » en premier.
   */
  const clockWords = () => typed.split(' ').filter(Boolean);
  const clockDigit = (digit: string) => {
    const words = clockWords();
    const last = words.at(-1);
    if (last === 'min') return;
    if (last === undefined || last === 'h') words.push(digit);
    // Les minutes après « h » ont deux chiffres ; seules, jusqu'à quatre (205 min).
    else if (last.length < (words.includes('h') ? 2 : 4)) words[words.length - 1] = last + digit;
    typed = words.join(' ');
  };
  const clockUnit = (unit: 'h' | 'min') => {
    const words = clockWords();
    const last = words.at(-1);
    if (last === undefined || !/^\d+$/.test(last) || words.includes(unit) || (unit === 'h' && words.length > 1)) return;
    typed = [...words, unit].join(' ');
  };

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
    if (mode === 'paint' && asked) {
      // Le dessin revient colorié comme avant, à corriger.
      input?.destroy();
      input = createPaint(asked, Number(previous));
      keypadArea.replaceChildren(input.el);
      figure.replaceChildren(liveFigure!);
    }
    if (mode === 'order' && asked) {
      // Les nombres reviennent rangés comme avant.
      input?.destroy();
      input = createOrder(asked, previous.split(` ${asked.order} `));
      keypadArea.replaceChildren(input.el);
    }
    renderAnswer();
  }

  const handlers = {
    onChar(char: string) {
      if (state !== 'asking') return;
      if (mode === 'letters') {
        // Pas d'espace au début ni deux de suite : il ne se verrait pas.
        if (typed.length >= (options.maxLetters ?? MAX_LETTERS) || (char === ' ' && (typed === '' || typed.endsWith(' ')))) return;
        typed += char;
      } else if (mode === 'clock') {
        if (char !== ',') clockDigit(char);
      } else {
        withNumber((number) => {
          if (number.length >= (options.maxDigits ?? MAX_DIGITS)) return number;
          // Une seule virgule ; tapée en premier, elle suit un 0 (« 0,5 »).
          if (char === ',') return number.includes(',') ? number : (number || '0') + char;
          return number === '0' ? char : number + char;
        });
      }
      renderAnswer();
    },
    onBackspace() {
      if (state !== 'asking') return;
      if (mode === 'measure') withNumber((number) => number.slice(0, -1));
      else if (mode === 'clock') typed = typed.replace(/ ?(h|min|\d)$/, '');
      else typed = typed.slice(0, -1);
      renderAnswer();
    },
    onSubmit() {
      if (state === 'wrong') return next();
      if (state !== 'asking' || typed === '') return;
      const question = session.current();
      if (!question) return;
      // Ranger : tous les nombres d'abord.
      if (mode === 'order' && typed.split(` ${question.order} `).length < (question.choices?.length ?? 0)) return;
      // Une mesure : le nombre et l'unité.
      if (mode === 'measure' && Object.values(splitMeasure(typed)).includes('')) return;
      // Des heures : avec « h » ou « min ».
      if (mode === 'clock' && clockMinutes(typed) === undefined) return;
      chrono?.pause();
      countdown?.pause();
      const correct = session.answer(typed, performance.now() - shownAt);
      // Le dessin ne se colorie plus une fois la réponse donnée.
      liveFigure?.classList.add('is-locked');
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
        if (mode === 'paint') {
          // Colorier : le nombre de parts suffit, l'astuce dit comment partager.
          const told = `Tu en as colorié ${typed}, il en fallait ${answerText(question)}.`;
          feedback.replaceChildren(...withFractions(`${told} ${question.explain ? `${question.explain} ` : ''}${wrongHint}`));
        } else {
          // Dans la case : sa réponse en haut, ses fautes barrées ; la bonne en dessous, ce qui diffère surligné.
          const shown =
            mode === 'letters'
              ? closestAnswer(normalizeAnswer(typed), acceptedAnswers(question))
              : mode === 'measure' || mode === 'clock'
                ? shownAnswerFor(question, typed)
                : shownAnswer(question);
          const given = mode === 'letters' ? normalizeAnswer(typed) : typedLabel();
          answerBox.replaceChildren(
            ...((mode === 'letters' || mode === 'digits' || mode === 'measure' || mode === 'clock') && !shown.includes('/')
              ? [typedWithMistakes(given, shown), answerWithFixes(given, shown)]
              : [h('span', { class: 'typed-answer' }, h('s', {}, ...withFractions(given))), h('span', { class: 'fixed-answer' }, ...withFractions(shown))]),
          );
          // Boutons : le choisi barré, le bon mis en avant ; l'unité, si elle était fausse.
          if (mode === 'measure') {
            const [chosen, right] = [splitMeasure(typed).unit, splitMeasure(shown).unit];
            if (chosen !== right) {
              choiceButton(chosen)?.classList.add('is-wrong');
              choiceButton(right)?.classList.add('is-answer');
            }
          } else if (mode !== 'clock') {
            choiceButton(typed)?.classList.add('is-wrong');
            choiceButton(String(question.answer))?.classList.add('is-answer');
          }
          // Sans case (« Touche le chiffre des dizaines »), la phrase dit la bonne réponse.
          const told = equation.contains(answerBox) ? '' : `C’était ${mode === 'letters' ? `« ${shown} »` : shown}. `;
          feedback.replaceChildren(...withFractions(`${told}${question.explain ? `${question.explain} ` : ''}${wrongHint}`));
        }
        input?.setSubmitLabel('→');
        if (chrono) chrono.addPenalty(options.chrono!.penaltyMs);
      }
      race?.pause();
      renderProgress();
    },
  };
  let input: Keypad | undefined;
  /** Les boutons de la question en cours, par réponse (les graduations à toucher sont dans la droite). */
  let buttons = new Map<string, Element>();
  /** La figure qu'on touche (graduations, parts à colorier), faite avec la saisie de la question. */
  let liveFigure: SVGElement | undefined;
  const choiceButton = (value: string) => buttons.get(value);
  /** Le nombre dont on touche un chiffre, avec sa virgule. */
  let numberParts: Element[] = [];
  const keypadArea = h('div', { class: 'keypad-area' });

  /** Le pavé, le clavier ou les boutons de la question ; les boutons « nombre » vont dans la question. */
  function createInput(question: QuizQuestion): Keypad {
    if (mode === 'letters') return createKeyboard(handlers, { hyphen: options.hyphen });
    if (mode === 'paint') return createPaint(question);
    if (mode === 'order') return createOrder(question);
    if (mode === 'measure') return createMeasure(question);
    if (mode === 'clock') return createClock();
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
    const onLine = question.choiceLayout === 'line' && question.figure !== undefined && isNumberLine(question.figure);
    const count = question.choices?.length ?? 0;
    if (onLine) {
      // Placer une fraction : on touche la graduation sur la droite.
      liveFigure = numberLine(question.figure as Parameters<typeof numberLine>[0], {
        at: (question.choices ?? []).map((c) => Number(c.value)),
        onPick: (at) => choose(String(at)),
      });
      buttons = new Map([...liveFigure.querySelectorAll('.nl-pick')].map((el) => [el.getAttribute('data-value')!, el]));
    } else {
      // 597,4328 : la virgule est dans le nombre, mais ne se touche pas ; les classes ne comptent qu'avant elle.
      const comma = question.choices?.findIndex((c) => c.value === ',') ?? -1;
      const whole = comma === -1 ? count : comma;
      numberParts = (question.choices ?? []).map(({ label, value }, i) => {
        if (inNumber && value === ',') return h('span', { class: 'digit-comma' }, ',');
        const button = h('button', { class: inNumber ? 'digit-choice' : 'choice', type: 'button', onclick: () => choose(value) }, ...withFractions(label));
        // 15 824 000 : un écart entre les classes, comme l'espace des fiches.
        if (inNumber && i > 0 && i < whole && (whole - i) % 3 === 0) button.classList.add('class-start');
        return button;
      });
      buttons = new Map(
        (question.choices ?? []).flatMap(({ value }, i) => (inNumber && value === ',' ? [] : [[value, numberParts[i]!] as const])),
      );
    }
    // Après une erreur, on passe à la suite avec ce bouton (ou Entrée).
    const proceed = h('button', { class: 'button primary choice-next', type: 'button', hidden: true, onclick: handlers.onSubmit }, 'Continuer →');
    const el = h('div', { class: 'choices-input' });
    if (!inNumber && !onLine) {
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

  /**
   * Mesures : les unités à toucher au-dessus du pavé. Toucher une unité la choisit (une autre la remplace) ;
   * OK quand le nombre et l'unité y sont.
   */
  function createMeasure(question: QuizQuestion): Keypad {
    const units = question.units ?? [];
    const choose = (unit: string) => {
      if (state !== 'asking') return;
      const { number } = splitMeasure(typed);
      typed = `${number} ${unit}`;
      renderAnswer();
    };
    buttons = new Map(units.map((unit) => [unit, h('button', { class: 'choice unit-choice', type: 'button', onclick: () => choose(unit) }, unit)] as const));
    const row = h('div', { class: 'choice-buttons unit-buttons' }, ...buttons.values());
    row.style.setProperty('--choices', String(units.length));
    const keypad = createKeypad({
      ...handlers,
      onDigit: (digit) => handlers.onChar(String(digit)),
      onComma: options.decimal ? () => handlers.onChar(',') : undefined,
    });
    return { el: h('div', { class: 'choices-input measure-input' }, row, keypad.el), setSubmitLabel: keypad.setSubmitLabel, destroy: keypad.destroy };
  }

  /** Heures : « h » et « min » au-dessus du pavé, à toucher après leur nombre (aussi les touches h et m). */
  function createClock(): Keypad {
    const touch = (unit: 'h' | 'min') => {
      if (state !== 'asking') return;
      clockUnit(unit);
      renderAnswer();
    };
    buttons = new Map((['h', 'min'] as const).map((unit) => [unit, h('button', { class: 'choice unit-choice', type: 'button', onclick: () => touch(unit) }, unit)] as const));
    const row = h('div', { class: 'choice-buttons unit-buttons' }, ...buttons.values());
    row.style.setProperty('--choices', '2');
    const keypad = createKeypad({ ...handlers, onDigit: (digit) => handlers.onChar(String(digit)) });
    const onKeydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || document.querySelector('.overlay')) return;
      if (event.key === 'h' || event.key === 'm') touch(event.key === 'h' ? 'h' : 'min');
    };
    document.addEventListener('keydown', onKeydown);
    return {
      el: h('div', { class: 'choices-input measure-input' }, row, keypad.el),
      setSubmitLabel: keypad.setSubmitLabel,
      destroy: () => {
        keypad.destroy();
        document.removeEventListener('keydown', onKeydown);
      },
    };
  }

  /** Colorier en touchant le dessin, puis OK : la réponse est le nombre de parts coloriées. */
  function createPaint(question: QuizQuestion, colored = 0): Keypad {
    liveFigure = partsPicture({ ...(question.figure as PartsFigure), colored }, {
      onChange: (colored) => {
        if (state !== 'asking') return;
        typed = colored > 0 ? String(colored) : '';
        renderAnswer();
      },
    });
    const submit = h('button', { class: 'button primary paint-submit', type: 'button', onclick: handlers.onSubmit }, 'OK');
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || document.querySelector('.overlay')) return;
      event.preventDefault();
      handlers.onSubmit();
    };
    document.addEventListener('keydown', onKeydown);
    return {
      el: h('div', { class: 'choices-input' }, submit),
      setSubmitLabel: (label) => {
        submit.textContent = label === 'OK' ? 'OK' : 'Continuer →';
      },
      destroy: () => document.removeEventListener('keydown', onKeydown),
    };
  }

  /**
   * Ranger : on touche les nombres dans l'ordre, ils s'écrivent dans la case (« 4,4 > 4,36 ») ; retoucher
   * un nombre l'enlève, avec ceux d'après. OK quand ils y sont tous.
   */
  function createOrder(question: QuizQuestion, placed: string[] = []): Keypad {
    const choices = question.choices ?? [];
    const update = () => {
      typed = placed.join(` ${question.order} `);
      for (const [value, button] of numbers) {
        const rank = placed.indexOf(value);
        button.classList.toggle('is-chosen', rank !== -1);
        button.setAttribute('data-rank', rank === -1 ? '' : String(rank + 1));
      }
      renderAnswer();
    };
    const touch = (value: string) => {
      if (state !== 'asking') return;
      const rank = placed.indexOf(value);
      if (rank === -1) placed.push(value);
      else placed.splice(rank);
      update();
    };
    const numbers = new Map(
      choices.map(({ label, value }) => [value, h('button', { class: 'choice order-choice', type: 'button', onclick: () => touch(value) }, ...withFractions(label))] as const),
    );
    const row = h('div', { class: 'choice-buttons' }, ...numbers.values());
    row.style.setProperty('--choices', String(choices.length));
    const submit = h('button', { class: 'button primary paint-submit', type: 'button', onclick: handlers.onSubmit }, 'OK');
    const onKeydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || document.querySelector('.overlay')) return;
      if (event.key === 'Enter') handlers.onSubmit();
      else if (event.key === 'Backspace' && placed.length > 0 && state === 'asking') touch(placed.at(-1)!);
      else return;
      event.preventDefault();
    };
    document.addEventListener('keydown', onKeydown);
    update();
    return {
      el: h('div', { class: 'choices-input' }, row, submit),
      setSubmitLabel: (label) => {
        submit.textContent = label === 'OK' ? 'OK' : 'Continuer →';
      },
      destroy: () => document.removeEventListener('keydown', onKeydown),
    };
  }

  /** Ce qui est tapé, comme dans la case : un bouton touché écrit ce qu'il montre (« < »), pas sa valeur. */
  function typedLabel(): string {
    if (mode === 'measure') {
      const { number, unit } = splitMeasure(typed);
      return typed === '' ? '' : [number === '' ? '?' : groupDigits(number), unit].filter(Boolean).join(' ');
    }
    return mode === 'choices'
      ? (asked?.choices?.find((c) => c.value === typed)?.label ?? typed)
      : mode === 'digits' && options.classes
        ? groupDigits(typed)
        : typed;
  }

  function renderAnswer() {
    answerBox.replaceChildren(...withFractions(typedLabel() || '?'));
    answerBox.classList.toggle('is-empty', typed === '');
    if (mode === 'measure') {
      const { unit } = splitMeasure(typed);
      for (const [value, button] of buttons) button.classList.toggle('is-chosen', value === unit);
    }
    if (mode === 'clock') for (const [value, button] of buttons) button.classList.toggle('is-chosen', clockWords().includes(value));
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
    if (input === undefined || nextMode !== mode || ['choices', 'paint', 'order', 'measure', 'clock'].includes(nextMode)) {
      input?.destroy();
      mode = nextMode;
      liveFigure = undefined;
      input = createInput(question);
      keypadArea.replaceChildren(input.el);
    }
    section.classList.toggle('letters', mode === 'letters');
    if (mode !== 'choices' && mode !== 'measure' && mode !== 'clock') buttons = new Map();
    // Nombre caché : la case est au milieu (« 7 × ? = 56 »), l'opération plus longue s'affiche plus petit.
    // En mots ou avec des boutons, pas de « = » : « nous [ mangerons ] », « 92 [ > ] 29 ».
    prompt.replaceChildren(...withFractions(question.suffix === undefined && mode === 'digits' ? `${question.prompt} =` : question.prompt));
    context.textContent = question.context ?? '';
    figure.replaceChildren(...(question.figure ? [liveFigure ?? drawFigure(question.figure)] : []));
    figure.hidden = !question.figure;
    // « 8,37 = ?/100 » : la case est le numérateur d'une fraction.
    const denominator = /^\/(\d+)$/.exec(question.suffix ?? '')?.[1];
    suffix.replaceChildren(...withFractions(denominator === undefined ? (question.suffix ?? '') : ''));
    if (question.choiceLayout === 'number') {
      // « Touche le chiffre des dizaines » : les chiffres du nombre sont les boutons.
      equation.replaceChildren(h('span', { class: 'number-digits' }, ...numberParts));
    } else if ((mode === 'choices' || mode === 'paint') && question.suffix === undefined) {
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
    // Ranger : les quatre nombres et leurs signes tiennent sur une ligne.
    equation.classList.toggle('ordering', mode === 'order');
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
