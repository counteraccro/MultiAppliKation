import { createKeypad } from '../../components/keypad';
import { soundToggle } from '../../components/sound-toggle';
import { h } from '../../core/dom';
import { sounds } from '../../core/sound';
import { PosedAddition, PosedDivision, PosedLongMultiplication, PosedMultiplication, PosedSubtraction, type PosedOperation } from './posed';
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
 * Multiplication : les retenues en petit au-dessus du nombre, sans rond, comme sur la fiche ; à 2 chiffres,
 * deux lignes puis leur somme, et seules les retenues de la ligne en cours (les autres sont « barrées ») ;
 * celles de l'addition dans des ronds, sous le premier trait.
 * La case en cours est encadrée.
 */
export function posedGrid(operation: PosedOperation, options: GridOptions = {}): HTMLElement {
  if (operation instanceof PosedDivision) return divisionGrid(operation, options);
  if (
    !(
      operation instanceof PosedAddition ||
      operation instanceof PosedSubtraction ||
      operation instanceof PosedMultiplication ||
      operation instanceof PosedLongMultiplication
    )
  ) {
    throw new Error('Opération pas encore posée à l’écran');
  }
  const subtraction = operation instanceof PosedSubtraction;
  const long = operation instanceof PosedLongMultiplication;
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
  // À 2 chiffres : une rangée sous le trait pour les retenues de l'addition, puis les deux lignes.
  const linesRow = resultRow + (long ? 1 : 0);
  operation.terms.forEach((term, i) => {
    const row = firstTerm + i;
    if (i > 0) cells.push(h('span', { class: 'pc pc-sign', style: `grid-row: ${row}; grid-column: 1` }, operation.sign));
    [...String(term)].reverse().forEach((digit, column) =>
      cell(row, column, i === 0 && tens.has(column) ? [h('small', { class: 'pc-ten' }, '1'), digit] : digit),
    );
  });
  cells.push(h('span', { class: 'pc-line', style: `grid-row: ${resultRow}; grid-column: 1 / -1` }));
  if (long) {
    // Les deux lignes, puis le trait et leur somme.
    cells.push(h('span', { class: 'pc pc-sign', style: `grid-row: ${linesRow + 1}; grid-column: 1` }, '+'));
    cells.push(h('span', { class: 'pc-line', style: `grid-row: ${linesRow + 2}; grid-column: 1 / -1` }));
  }
  // À 2 chiffres : les retenues de la ligne en cours seulement.
  const activeLine = (steps[placed.length] ?? steps[placed.length - 1])?.line;
  // Pendant l'addition, la rangée de ses retenues garde sa place, même vide.
  if (long && activeLine === 2) {
    cells.push(h('span', { class: 'pc pc-carry', style: `grid-row: ${resultRow}; grid-column: ${at(0)}; visibility: hidden`, 'aria-hidden': 'true' }));
  }

  steps.forEach((step, i) => {
    if (long && step.kind === 'carry' && step.line !== activeLine) return;
    const sumCarry = step.kind === 'carry' && step.line === 2;
    const row = sumCarry ? resultRow : step.kind === 'carry' ? carryRow : linesRow + (step.line ?? 0);
    const carryKind = subtraction ? ' pc-carry-under' : operation instanceof PosedAddition || sumCarry ? '' : ' pc-carry-small';
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

/**
 * La division en potence, comme la leçon de la classe : le dividende et le diviseur, le quotient sous
 * le trait (des points pour ses chiffres, une fois comptés), et sous le dividende chaque produit
 * (« − 63 », souligné) puis le reste avec le chiffre abaissé. Le nombre en cours est mis en avant.
 */
function divisionGrid(operation: PosedDivision, options: GridOptions): HTMLElement {
  const { digits, firstLength } = operation;
  const n = digits.length;
  const count = n - firstLength + 1;
  // Une colonne à gauche pour le signe « − », puis les chiffres du dividende, la potence, le quotient.
  const col = (j: number) => j + 2;
  const bar = n + 2;
  const cells: HTMLElement[] = [];
  const cell = (row: number, column: number, text: string, extra = '', span = 1) =>
    cells.push(h('span', { class: `pc ${extra}`, style: `grid-row: ${row}; grid-column: ${column} / span ${span}` }, text));
  // Un nombre écrit sous le dividende, aligné à droite sur `end` : un chiffre par colonne, sauf la case en cours.
  const number = (row: number, end: number, text: string, extra: string, active: boolean) =>
    active ? cell(row, end - text.length + 1, text, extra, text.length) : [...text].forEach((d, j) => cell(row, end - text.length + 1 + j, d, extra));

  const steps = operation.steps();
  const placed = operation.placed;
  const state = (i: number) =>
    i === placed.length - 1 && options.last ? `is-${options.last}` : options.corrected?.has(i) ? 'is-wrong' : '';
  const current = options.typed !== undefined ? steps[placed.length] : undefined;
  // Le nombre en cours : les premiers chiffres, puis un reste et le chiffre abaissé.
  const focus = current?.partial !== undefined ? current.column : undefined;
  // Les chiffres pris d'abord, soulignés s'ils sont bien un début du dividende.
  const took = placed.length > 0 && String(operation.dividend).startsWith(String(placed[0])) ? String(placed[0]).length : 0;
  // Le dernier chiffre du nombre en cours k : sous lui s'alignent le produit et le reste.
  const end = (k: number) => col(firstLength - 1 + k);

  digits.forEach((digit, j) =>
    cell(1, col(j), String(digit), [j < took ? 'pd-took' : '', focus === 0 && j < firstLength ? 'pd-focus' : ''].join(' ')),
  );
  cells.push(h('span', { class: 'pd-bar', style: `grid-row: 1 / span ${2 * count + 1}; grid-column: ${bar}` }));
  cell(1, bar + 1, String(operation.divisor), 'pd-divisor', Math.max(count, 2));

  // Les points du quotient, une fois ses chiffres comptés.
  const sizeIndex = steps.findIndex((step) => step.kind === 'size');
  const size = sizeIndex >= 0 && sizeIndex < placed.length ? Math.min(placed[sizeIndex]!, 4) : 0;
  const quotients = new Set(steps.flatMap((step, i) => (step.kind === 'quotient' && (i < placed.length || step === current) ? [step.column] : [])));
  for (let k = 0; k < size; k++) if (!quotients.has(k)) cell(2, bar + 1 + k, '·', 'pd-dot');

  steps.forEach((step, i) => {
    const active = step === current;
    if (i >= placed.length && !active) return;
    const text = active ? options.typed || '?' : String(placed[i]);
    const extra = active ? `pc-active${options.typed ? '' : ' is-empty'}` : state(i);
    if (step.kind === 'first') {
      if (active) cell(2, col(0), text, `pd-first ${extra}`, n);
    } else if (step.kind === 'size') {
      if (active) cell(2, bar + 1, text, `pc-result ${extra}`);
    } else if (step.kind === 'quotient') {
      cell(2, bar + 1 + step.column, text, `pc-result ${extra}`);
    } else if (step.kind === 'product') {
      const row = 2 + 2 * step.column;
      const at = end(step.column) - text.length + 1;
      cells.push(h('span', { class: 'pc pc-sign', style: `grid-row: ${row}; grid-column: ${at - 1}` }, '−'));
      number(row, end(step.column), text, `pd-product ${extra}`, active);
    } else if (step.kind === 'remainder') {
      const row = 3 + 2 * step.column;
      const at = end(step.column);
      const highlighted = focus === step.column + 1 ? 'pd-focus' : '';
      number(row, at, text, `pd-rest ${extra} ${highlighted}`, active);
      // Le chiffre suivant s'abaisse à côté du reste.
      const next = digits[firstLength + step.column];
      if (!active && next !== undefined) cell(row, at + 1, String(next), `pd-down ${highlighted}`);
    }
  });

  return h(
    'div',
    {
      class: 'posed posed-division',
      style: `grid-template-columns: auto repeat(${n}, 1fr) 0.2em repeat(${Math.max(count, 2)}, 1fr)`,
      'aria-label': operation.text,
    },
    ...cells,
  );
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
      // En général un chiffre par étape : le nouveau remplace l'ancien. Plusieurs pour le nombre pris
      // d'abord dans une division (« 34 »), ou un reste.
      const max = shown.current()?.digits ?? 1;
      typed = max === 1 ? String(digit) : typed.length >= max ? typed : (typed === '0' ? '' : typed) + digit;
      render();
    },
    onBackspace() {
      if (state !== 'asking') return;
      typed = typed.slice(0, -1);
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
      const check = shown instanceof PosedDivision ? ` · Vérifie : ${shown.check}` : '';
      feedback.textContent = session.test ? 'Opération finie.' : `${shown.text} = ${shown.resultText} ✓${check}`;
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
