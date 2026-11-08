import type { RulerFigure } from '../core/quiz';
import { svg } from './number-line';

const WIDTH = 340;
const HEIGHT = 96;
const LEFT = 14;
const RIGHT = 14;
/** Le segment au-dessus de la règle, la règle en dessous. */
const SEGMENT_Y = 20;
const RULER_TOP = 36;
const RULER_HEIGHT = 50;

/**
 * Mesurer un segment (leçon Mes 1, Géom 2) : le segment au-dessus d'un double décimètre, graduations en
 * millimètres, les centimètres numérotés. La règle dépasse d'un centimètre au bout du segment.
 */
export function ruler(figure: RulerFigure): SVGElement {
  const { start, length } = figure.ruler;
  const centimeters = Math.ceil((start + length) / 10) + 1;
  const mm = (WIDTH - LEFT - RIGHT) / (centimeters * 10);
  const x = (at: number) => LEFT + at * mm;
  const root = svg('svg', { class: 'ruler', viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'img', 'aria-label': 'Un segment sur une règle graduée' });
  root.append(svg('rect', { x: 2, y: RULER_TOP, width: WIDTH - 4, height: RULER_HEIGHT, rx: 6, class: 'ruler-body' }));
  for (let at = 0; at <= centimeters * 10; at++) {
    const tall = at % 10 === 0 ? 16 : at % 5 === 0 ? 11 : 7;
    root.append(svg('line', { x1: x(at), y1: RULER_TOP, x2: x(at), y2: RULER_TOP + tall, class: 'ruler-tick' }));
    if (at % 10 === 0) root.append(svg('text', { x: x(at), y: RULER_TOP + 32, class: 'ruler-label' }, String(at / 10)));
  }
  // Le segment, avec un petit trait à chaque bout, comme dans le cahier.
  const [a, b] = [x(start), x(start + length)];
  root.append(
    svg('line', { x1: a, y1: SEGMENT_Y, x2: b, y2: SEGMENT_Y, class: 'ruler-segment' }),
    svg('line', { x1: a, y1: SEGMENT_Y - 7, x2: a, y2: SEGMENT_Y + 7, class: 'ruler-segment' }),
    svg('line', { x1: b, y1: SEGMENT_Y - 7, x2: b, y2: SEGMENT_Y + 7, class: 'ruler-segment' }),
    svg('line', { x1: a, y1: SEGMENT_Y, x2: a, y2: RULER_TOP, class: 'ruler-guide' }),
    svg('line', { x1: b, y1: SEGMENT_Y, x2: b, y2: RULER_TOP, class: 'ruler-guide' }),
  );
  return root;
}
