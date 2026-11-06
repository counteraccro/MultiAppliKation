import { diff, type DiffPart } from '../core/diff';
import { h } from '../core/dom';

/**
 * Ce qui a été tapé : les lettres en trop ou fausses barrées en rouge, et un petit trait rouge
 * là où il manque quelque chose (« huit[s]-cent-quarante_-un »).
 */
export function typedWithMistakes(typed: string, expected: string): HTMLElement {
  const parts = diff(typed, expected);
  const nextTo = (i: number, kind: DiffPart['kind']) => parts[i - 1]?.kind === kind || parts[i + 1]?.kind === kind;
  return h(
    'span',
    { class: 'typed-answer' },
    ...parts.map((part, i) =>
      part.kind === 'same'
        ? part.text
        : part.kind === 'extra'
          ? h('s', {}, part.text)
          : // Une lettre remplacée est déjà barrée : le trait ne sert qu'à un oubli.
            nextTo(i, 'extra')
            ? ''
            : h('span', { class: 'missing', 'aria-label': 'oubli' }),
    ),
  );
}

/** La bonne réponse, ce qui diffère de ce qui a été tapé surligné (« huit-cent-quarante-[et]-un »). */
export function answerWithFixes(typed: string, expected: string): HTMLElement {
  return h(
    'span',
    { class: 'fixed-answer' },
    ...diff(typed, expected).map((part) => (part.kind === 'same' ? part.text : part.kind === 'missing' ? h('mark', {}, part.text) : '')),
  );
}
