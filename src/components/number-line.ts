import { groupDigits, numberText, type NumberLineFigure } from '../core/quiz';

const SVG = 'http://www.w3.org/2000/svg';
const WIDTH = 340;
const HEIGHT = 92;
/** Marges : la flèche à droite, de la place pour les nombres écrits au bord. */
const LEFT = 22;
const RIGHT = 34;
const LINE_Y = 40;
/** Largeur d'un chiffre écrit au-dessus (15 px, gras), pour que « 460 000 000 » ne sorte pas au bord. */
const CHAR_WIDTH = 9.2;

export function svg(tag: string, attributes: Record<string, string | number>, text?: string): SVGElement {
  const el = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, String(value));
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Placer une fraction : les graduations `at` se touchent ; chacune est un `.nl-pick` (`data-value` : son rang). */
export interface LinePick {
  at: readonly number[];
  onPick(at: number): void;
}

/**
 * Une droite graduée comme sur les fiches de la classe : les graduations, quelques nombres écrits
 * au-dessus, une flèche sous chaque repère (« A », « B »…).
 */
export function numberLine(figure: NumberLineFigure, pick?: LinePick): SVGElement {
  const text = (i: number) => groupDigits(numberText(Math.round((figure.from + i * figure.step) * 1e6) / 1e6));
  // Un grand nombre écrit au bout de la droite : on la raccourcit pour qu'il tienne.
  const half = (i: number) => (text(i).length * CHAR_WIDTH) / 2;
  const left = Math.max(LEFT, ...figure.labels.filter((i) => i === 0).map(half));
  const right = Math.max(RIGHT, ...figure.labels.filter((i) => i === figure.count - 1).map(half));
  const gap = (WIDTH - left - right) / (figure.count - 1);
  const x = (i: number) => left + i * gap;
  const root = svg('svg', {
    class: 'number-line',
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    role: 'img',
    'aria-label': `Droite graduée${figure.markers.length > 0 ? `, repères ${figure.markers.map((m) => m.name).join(', ')}` : ''}`,
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
      root.append(svg('text', { x: x(i), y: LINE_Y - 15, class: 'nl-label' }, text(i)));
    }
  }
  for (const { at, name } of figure.markers) {
    const mx = x(at);
    root.append(
      svg('path', { d: `M ${mx} ${LINE_Y + 10} l -6 9 h 4 v 9 h 4 v -9 h 4 z`, class: 'nl-marker' }),
      svg('text', { x: mx, y: LINE_Y + 46, class: 'nl-marker-name' }, name),
    );
  }
  // Toucher une graduation : une zone large autour d'elle, et une pastille qui s'allume.
  for (const at of pick?.at ?? []) {
    const target = svg('g', { class: 'nl-pick', 'data-value': at, role: 'button', 'aria-label': `Graduation ${at}` });
    target.append(
      svg('rect', { x: x(at) - gap / 2, y: 0, width: gap, height: HEIGHT, class: 'nl-hit' }),
      svg('circle', { cx: x(at), cy: LINE_Y, r: Math.min(8, gap / 2.4), class: 'nl-spot' }),
    );
    target.addEventListener('click', () => pick!.onPick(at));
    root.append(target);
  }
  return root;
}
