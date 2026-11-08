import type { ConversionFigure } from '../core/quiz';
import { svg } from './number-line';

const WIDTH = 340;
const HEAD = 30;
const ROW = 40;

/**
 * Le tableau de conversion de la leçon Mes 10 : une colonne par unité, le nombre un chiffre par colonne,
 * les 0 ajoutés en gris, la virgule dans la colonne de l'unité cherchée. Une colonne sans nom quand le nombre
 * déborde du tableau (23 km).
 */
export function conversionTable(figure: ConversionFigure): SVGElement {
  const { units, cells } = figure.conversion;
  const width = (WIDTH - 4) / units.length;
  const root = svg('svg', { class: 'conversion', viewBox: `0 0 ${WIDTH} ${HEAD + ROW + 4}`, role: 'img', 'aria-label': 'Un tableau de conversion' });
  units.forEach((unit, i) => {
    const x = 2 + i * width;
    const cell = cells[i]!;
    root.append(
      svg('rect', { x, y: 2, width, height: HEAD, class: unit === '' ? 'conversion-head is-outside' : 'conversion-head' }),
      svg('rect', { x, y: 2 + HEAD, width, height: ROW, class: 'conversion-cell' }),
      svg('text', { x: x + width / 2, y: 2 + HEAD - 9, class: 'conversion-unit' }, unit),
      svg('text', { x: x + width / 2, y: 2 + HEAD + ROW - 12, class: cell.added ? 'conversion-digit is-added' : 'conversion-digit' }, cell.text),
    );
  });
  return root;
}
