import { h } from '../core/dom';

/** Une fraction en colonne, comme au cahier : le numérateur, le trait, le dénominateur. */
export function fraction(numerator: Node | string, denominator: string): HTMLElement {
  return h(
    'span',
    { class: 'fraction' },
    h('span', { class: 'fraction-top' }, numerator),
    h('span', { class: 'fraction-bottom' }, denominator),
  );
}

/** Le texte, avec chaque « 837/100 » écrit en colonne. */
export function withFractions(text: string): (HTMLElement | string)[] {
  return text
    .split(/(\d+\/\d+)/)
    .filter((part) => part !== '')
    .map((part) => {
      const match = /^(\d+)\/(\d+)$/.exec(part);
      return match ? fraction(match[1]!, match[2]!) : part;
    });
}
