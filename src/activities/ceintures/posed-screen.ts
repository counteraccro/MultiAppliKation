import { createKeypad } from '../../components/keypad';
import { soundToggle } from '../../components/sound-toggle';
import { h } from '../../core/dom';
import { sounds } from '../../core/sound';
import { PosedAddition, PosedMultiplication, PosedSubtraction, type PosedOperation } from './posed';
import type { PosedSession } from './posed-session';

/** Temps pendant lequel une étape juste reste en vert avant la suivante. */
const CORRECT_PAUSE_MS = 350;
/** Le compteur « d'affilée » apparaît à partir de là ; il fait la fête à chaque multiple de 5. */
const STREAK_SHOWN_FROM = 3;
const STREAK_MILESTONE = 5;

export interface GridOptions {
  /** La case en cours : ce qui est tapé (vide : « ? »). */
  typed?: string;
  /** État de la dernière valeur écrite : juste (vert), corrigée (la bonne valeur, en orange). */
  last?: 'correct' | 'wrong';
  /** Étapes corrigées à l'entraînement, qui gardent leur couleur. */
  corrected?: ReadonlySet<number>;
}

/**
 * L'opération posée, comme sur le cahier : les nombres en colonnes, le trait, puis le résultat.
 * Addition : les retenues dans des ronds en haut. Soustraction (par compensation) : les retenues
 * dans des ronds sous le nombre du bas, et le 10 ajouté en haut (un petit 1 devant le chiffre).
 * Multiplication : les retenues en petit au-dessus du nombre, sans rond, comme sur la fiche.
 * La case en cours est encadrée.
 */
export function posedGrid(operation: PosedOperation, options: GridOptions = {}): HTMLElement {
  if (!(operation instanceof PosedAddition || operation instanceof PosedSubtraction || operation instanceof PosedMultiplication)) {
    throw new Error('Opération pas encore posée à l’écran');
  }
  const subtraction = operation instanceof PosedSubtraction;
  // Une colonne pour le signe, une de plus à gauche pour une dernière retenue (« 1 255 »).
  const width = operation.columns + 2;
  const at = (column: number) => width - column;
  const cells: HTMLElement[] = [];
  const cell = (row: number, column: number, text: string | (string | HTMLElement)[], extra = '') =>
    cells.push(h('span', { class: `pc ${extra}`, style: `grid-row: ${row}; grid-column: ${at(column)}` }, ...[text].flat()));

  const steps = operation.steps();
  const placed = operation.placed;
  // Soustraction : une retenue écrite sous la colonne suivante, c'est 10 ajouté en haut de celle-ci.
  const tens = new Set(
    subtraction ? steps.filter((step, i) => step.kind === 'carry' && i < placed.length).map((step) => step.column - 1) : [],
  );

  const firstTerm = subtraction ? 1 : 2;
  const carryRow = subtraction ? 3 : 1;
  const resultRow = firstTerm + operation.terms.length + (subtraction ? 1 : 0);
  operation.terms.forEach((term, i) => {
    const row = firstTerm + i;
    if (i > 0) cells.push(h('span', { class: 'pc pc-sign', style: `grid-row: ${row}; grid-column: 1` }, operation.sign));
    [...String(term)].reverse().forEach((digit, column) =>
      cell(row, column, i === 0 && tens.has(column) ? [h('small', { class: 'pc-ten' }, '1'), digit] : digit),
    );
  });
  cells.push(h('span', { class: 'pc-line', style: `grid-row: ${resultRow}; grid-column: 1 / -1` }));

  steps.forEach((step, i) => {
    const row = step.kind === 'carry' ? carryRow : resultRow;
    const carryKind = subtraction ? ' pc-carry-under' : operation instanceof PosedMultiplication ? ' pc-carry-small' : '';
    const kind = step.kind === 'carry' ? `pc-carry${carryKind}` : 'pc-result';
    if (i < placed.length) {
      const state = i === placed.length - 1 && options.last ? options.last : options.corrected?.has(i) ? 'wrong' : '';
      cell(row, step.column, String(placed[i]), `${kind} ${state && `is-${state}`}`);
    } else if (options.typed !== undefined) {
      cell(row, step.column, options.typed || '?', `${kind} pc-active${options.typed ? '' : ' is-empty'}`);
    }
  });

  return h('div', { class: 'posed', style: `grid-template-columns: repeat(${width}, 1fr)`, 'aria-label': operation.text }, ...cells);
}

export interface PosedScreenOptions {
  session: PosedSession;
  /** Ex. « Ceinture blanche ». */
  label: string;
  onDone(summary: { bestStreak: number }): void;
  onQuit(): void;
}

/**
 * Pose les opérations d'une série, une étape à la fois. À l'entraînement, une erreur montre tout de
 * suite la bonne valeur et l'explication ; en conditions réelles, la valeur s'écrit sans rien dire.
 * Renvoie la fonction de nettoyage.
 */
export function renderPosedScreen(root: HTMLElement, options: PosedScreenOptions): () => void {
  const { session } = options;
  let typed = '';
  let state: 'asking' | 'pause' | 'wrong' | 'finished' = 'asking';
  let timer: number | undefined;
  /** L'opération à l'écran : elle reste affichée finie jusqu'à « → ». */
  let shown: PosedOperation = session.operations[0]!;
  const corrected = new Map<PosedOperation, Set<number>>();
  let streak = 0;
  let bestStreak = 0;

  const board = h('div', { class: 'posed-board' });
  const ask = h('p', { class: 'question-context' });
  const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const streakEl = h('p', { class: 'streak', 'aria-live': 'polite' });
  const progress = h('div', { class: 'progress', 'aria-hidden': 'true' });
  const undoButton = session.test
    ? h('button', { class: 'link-button undo', type: 'button', onclick: undo }, '← Revenir à l’étape d’avant')
    : undefined;

  const keypad = createKeypad({
    onDigit(digit) {
      if (state !== 'asking') return;
      // Une étape, un chiffre : le nouveau remplace l'ancien.
      typed = String(digit);
      render();
    },
    onBackspace() {
      if (state !== 'asking') return;
      typed = '';
      render();
    },
    onSubmit,
  });

  function onSubmit() {
    if (state === 'wrong') return afterStep();
    if (state === 'finished') return nextOperation();
    if (state !== 'asking' || typed === '') return;
    const current = session.current();
    if (!current) return;
    const index = current.operation.placed.length;
    const correct = session.answer(Number(typed));
    typed = '';
    if (session.test) {
      sounds.placed();
      state = 'pause';
      render();
      timer = window.setTimeout(afterStep, CORRECT_PAUSE_MS);
    } else if (correct) {
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      const milestone = streak % STREAK_MILESTONE === 0;
      if (milestone) sounds.streak();
      else sounds.correct();
      renderStreak(milestone);
      state = 'pause';
      render('correct');
      timer = window.setTimeout(afterStep, CORRECT_PAUSE_MS);
    } else {
      streak = 0;
      renderStreak(false);
      sounds.wrong();
      corrected.set(current.operation, (corrected.get(current.operation) ?? new Set()).add(index));
      state = 'wrong';
      render('wrong');
      feedback.textContent = `C’était ${current.step.expected}. ${current.step.explain}`;
      keypad.setSubmitLabel('→');
    }
  }

  /** Étape suivante, ou l'opération finie reste affichée avec son résultat. */
  function afterStep() {
    window.clearTimeout(timer);
    if (shown.done) {
      state = 'finished';
      feedback.textContent = session.test ? 'Opération finie.' : `${shown.text} = ${shown.result} ✓`;
      keypad.setSubmitLabel(session.current() ? '→' : 'Terminer');
      render();
      return;
    }
    state = 'asking';
    feedback.textContent = '';
    keypad.setSubmitLabel('OK');
    render();
  }

  function nextOperation() {
    const current = session.current();
    if (!current) return options.onDone({ bestStreak });
    shown = current.operation;
    afterStep();
  }

  function undo() {
    window.clearTimeout(timer);
    const previous = session.undo();
    if (previous === undefined) return;
    shown = session.current()!.operation;
    state = 'asking';
    typed = String(previous);
    feedback.textContent = '';
    keypad.setSubmitLabel('OK');
    render();
  }

  function render(last?: 'correct' | 'wrong') {
    const step = state === 'asking' ? shown.current() : undefined;
    board.replaceChildren(
      posedGrid(shown, { typed: step ? typed : undefined, last, corrected: session.test ? undefined : corrected.get(shown) }),
    );
    ask.textContent = step?.ask ?? '';
    progress.replaceChildren(
      ...session.operations.map((o) => h('span', { class: o.done && (o !== shown || state === 'finished') ? 'dot done' : 'dot' })),
    );
    if (undoButton) undoButton.hidden = !session.operations.some((o) => o.placed.length > 0);
  }

  function renderStreak(milestone: boolean) {
    streakEl.textContent = streak >= STREAK_SHOWN_FROM ? `🔥 ${streak} d’affilée !` : '';
    streakEl.classList.remove('bump', 'milestone');
    void streakEl.offsetWidth;
    if (streak >= STREAK_SHOWN_FROM) streakEl.classList.add(milestone ? 'milestone' : 'bump');
  }

  root.append(
    h(
      'section',
      { class: 'play posed-play' },
      h(
        'header',
        { class: 'play-bar' },
        h('button', { class: 'quit', type: 'button', 'aria-label': 'Arrêter', onclick: options.onQuit }, '✕'),
        h('span', { class: 'play-label' }, options.label),
        progress,
        soundToggle(),
      ),
      h('div', { class: 'question' }, ask, board, feedback, streakEl, undoButton),
      h('div', { class: 'keypad-area' }, keypad.el),
    ),
  );

  render();

  return () => {
    window.clearTimeout(timer);
    keypad.destroy();
  };
}
