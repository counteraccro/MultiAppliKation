import { isConversion, isNumberLine, isRuler, type Figure, type PartsFigure } from '../core/quiz';
import { conversionTable } from './conversion-table';
import { numberLine, svg, type LinePick } from './number-line';
import { ruler } from './ruler';

const WIDTH = 340;
const CELL = 30;
const MARBLE = 20;
/** Les billes, en vrac comme sur les fiches : six par ligne, décalées une ligne sur deux. */
const MARBLES_PER_ROW = 6;

/** Colorier en touchant : chaque part touchée change de couleur, `onChange` reçoit le nombre de parts coloriées. */
export interface PartsPaint {
  onChange(colored: number): void;
}

/**
 * Un dessin partagé en parts égales (fractions) : des billes, un rectangle quadrillé, ou des barres
 * (une barre par unité). Les `colored` premières parts sont coloriées ; avec `paint`, on les touche pour colorier.
 */
export function partsPicture(figure: PartsFigure, paint?: PartsPaint): SVGElement {
  const parts: { x: number; y: number }[] = [];
  let width: number;
  let height: number;
  if (figure.shape === 'marbles') {
    const rows = Math.ceil(figure.count / MARBLES_PER_ROW);
    width = WIDTH;
    height = rows * 52 + 10;
    for (let i = 0; i < figure.count; i++) {
      const [row, column] = [Math.floor(i / MARBLES_PER_ROW), i % MARBLES_PER_ROW];
      parts.push({ x: 30 + column * 50 + (row % 2) * 22, y: 28 + row * 52 + ((column * 7) % 3) * 3 });
    }
  } else if (figure.shape === 'bars' && figure.count > figure.columns) {
    // Plusieurs unités : des barres debout, côte à côte, comme sur la fiche n° 54.
    const bars = Math.ceil(figure.count / figure.columns);
    width = bars * (CELL + 10) - 6;
    height = figure.columns * CELL + 4;
    for (let i = 0; i < figure.count; i++) {
      parts.push({ x: 2 + Math.floor(i / figure.columns) * (CELL + 10), y: 2 + (figure.columns - 1 - (i % figure.columns)) * CELL });
    }
  } else {
    // Le rectangle quadrillé, ligne par ligne ; une barre seule, couchée.
    const rows = Math.ceil(figure.count / figure.columns);
    width = figure.columns * CELL + 4;
    height = rows * CELL + 4;
    for (let i = 0; i < figure.count; i++) {
      parts.push({ x: 2 + (i % figure.columns) * CELL, y: 2 + Math.floor(i / figure.columns) * CELL });
    }
  }
  const root = svg('svg', {
    class: `parts-picture parts-${figure.shape}${paint ? ' is-paintable' : ''}`,
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': `${figure.count} ${figure.shape === 'marbles' ? 'billes' : 'cases'}, ${figure.colored} coloriées`,
  });
  root.style.setProperty('--parts-width', `${width}px`);
  let colored = Math.min(figure.colored, figure.count);
  parts.forEach(({ x, y }, i) => {
    const part =
      figure.shape === 'marbles'
        ? svg('circle', { cx: x, cy: y, r: MARBLE, class: 'part' })
        : svg('rect', { x, y, width: CELL, height: CELL, class: 'part' });
    if (i < figure.colored) part.classList.add('is-colored');
    if (paint) {
      part.setAttribute('role', 'button');
      part.addEventListener('click', () => {
        if (root.classList.contains('is-locked')) return;
        colored += part.classList.toggle('is-colored') ? 1 : -1;
        paint.onChange(colored);
      });
    }
    root.append(part);
  });
  return root;
}

/** La figure d'une question : une droite graduée, une règle ou un dessin à parts. */
export function drawFigure(figure: Figure, options: { pick?: LinePick; paint?: PartsPaint } = {}): SVGElement {
  if (isRuler(figure)) return ruler(figure);
  if (isConversion(figure)) return conversionTable(figure);
  return isNumberLine(figure) ? numberLine(figure, options.pick) : partsPicture(figure, options.paint);
}
