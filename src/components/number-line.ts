import { numberText, type NumberLineFigure } from '../core/quiz';

const SVG = 'http://www.w3.org/2000/svg';
const WIDTH = 340;
const HEIGHT = 92;
/** Marges : la flèche à droite, de la place pour les nombres écrits au bord. */
const LEFT = 22;
const RIGHT = 34;
const LINE_Y = 40;

function svg(tag: string, attributes: Record<string, string | number>, text?: string): SVGElement {
  const el = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, String(value));
  if (text !== undefined) el.textContent = text;
  return el;
}

/**
 * Une droite graduée comme sur les fiches de la classe : les graduations, quelques nombres écrits
 * au-dessus, une flèche sous le repère à trouver (« A »).
 */
export function numberLine(figure: NumberLineFigure): SVGElement {
  const gap = (WIDTH - LEFT - RIGHT) / (figure.count - 1);
  const x = (i: number) => LEFT + i * gap;
  const root = svg('svg', {
    class: 'number-line',
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    role: 'img',
    'aria-label': `Droite graduée, repère ${figure.markerName}`,
  });
  root.append(
    svg('line', { x1: 4, y1: LINE_Y, x2: WIDTH - 6, y2: LINE_Y, class: 'nl-axis' }),
    svg('path', { d: `M ${WIDTH - 14} ${LINE_Y - 6} L ${WIDTH - 4} ${LINE_Y} L ${WIDTH - 14} ${LINE_Y + 6}`, class: 'nl-axis' }),
  );
  for (let i = 0; i < figure.count; i++) {
    const labelled = figure.labels.includes(i);
    const half = labelled ? 9 : 6;
    root.append(svg('line', { x1: x(i), y1: LINE_Y - half, x2: x(i), y2: LINE_Y + half, class: 'nl-tick' }));
    if (labelled) {
      root.append(svg('text', { x: x(i), y: LINE_Y - 15, class: 'nl-label' }, numberText(Math.round((figure.from + i * figure.step) * 1e6) / 1e6)));
    }
  }
  const mx = x(figure.marker);
  root.append(
    svg('path', { d: `M ${mx} ${LINE_Y + 10} l -6 9 h 4 v 9 h 4 v -9 h 4 z`, class: 'nl-marker' }),
    svg('text', { x: mx, y: LINE_Y + 46, class: 'nl-marker-name' }, figure.markerName),
  );
  return root;
}
