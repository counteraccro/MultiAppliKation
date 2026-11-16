import type { PolygonFigure } from '../core/quiz';
import { svg } from './number-line';

const WIDTH = 340;
const HEIGHT = 180;
/** Un croquis comme au tableau, pas à l'échelle : la même forme quelles que soient les mesures. */
const SHAPES = {
  rectangle: { width: 200, height: 110 },
  square: { width: 120, height: 120 },
} as const;
/** Écart entre un côté et sa mesure. */
const GAP = 10;

/**
 * L'indice des périmètres et des aires (leçons Mes 8 et Mes 9) : la figure, chaque côté avec sa mesure. Rectangle :
 * la longueur en haut et en bas, la largeur à gauche et à droite ; carré : le côté sur les quatre côtés.
 */
export function polygon(figure: PolygonFigure): SVGElement {
  const { kind, sides, inside } = figure.polygon;
  const root = svg('svg', { class: 'polygon', viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'img', 'aria-label': `Un ${kind === 'square' ? 'carré' : kind} et ses côtés` });
  const label = (x: number, y: number, text: string, anchor = 'middle') =>
    svg('text', { x, y, class: text === '?' ? 'polygon-label is-unknown' : 'polygon-label', 'text-anchor': anchor }, text);
  const middle = { x: WIDTH / 2, y: HEIGHT / 2 };
  if (kind === 'triangle') {
    const [a, b, c] = [
      { x: middle.x, y: 22 },
      { x: 70, y: HEIGHT - 32 },
      { x: WIDTH - 70, y: HEIGHT - 32 },
    ];
    const [left, right, base] = sides;
    root.append(
      svg('polygon', { points: `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`, class: 'polygon-shape' }),
      label((a.x + b.x) / 2 - GAP, (a.y + b.y) / 2, left ?? '', 'end'),
      label((a.x + c.x) / 2 + GAP, (a.y + c.y) / 2, right ?? '', 'start'),
      label(middle.x, b.y + GAP + 14, base ?? ''),
    );
  } else {
    const { width, height } = SHAPES[kind];
    const [x, y] = [middle.x - width / 2, middle.y - height / 2];
    const [long, short] = kind === 'square' ? [sides[0], sides[0]] : sides;
    root.append(
      svg('rect', { x, y, width, height, class: 'polygon-shape' }),
      label(middle.x, y - GAP, long ?? ''),
      label(middle.x, y + height + GAP + 14, long ?? ''),
      label(x - GAP, middle.y + 6, short ?? '', 'end'),
      label(x + width + GAP, middle.y + 6, short ?? '', 'start'),
    );
  }
  if (inside) root.append(svg('text', { x: middle.x, y: kind === 'triangle' ? HEIGHT - 50 : middle.y + 6, class: 'polygon-inside' }, inside));
  return root;
}
