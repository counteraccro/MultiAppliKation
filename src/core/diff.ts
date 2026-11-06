/** Un morceau de la comparaison : pareil des deux côtés, en trop dans ce qui a été tapé, ou qui y manque. */
export interface DiffPart {
  kind: 'same' | 'extra' | 'missing';
  text: string;
}

/**
 * Après une erreur : compare lettre par lettre ce qui a été tapé et la bonne réponse, et trouve
 * toutes les différences, même éloignées (« huits-cent-quarante-un » : le « s » en trop et le « et » oublié).
 */
export function diff(typed: string, expected: string): DiffPart[] {
  const [n, m] = [typed.length, expected.length];
  // common[i][j] : nombre de lettres communes (dans l'ordre) entre la fin de `typed` en i et celle de `expected` en j.
  const common = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      common[i]![j] = typed[i] === expected[j] ? common[i + 1]![j + 1]! + 1 : Math.max(common[i + 1]![j]!, common[i]![j + 1]!);
    }
  }
  const parts: DiffPart[] = [];
  const push = (kind: DiffPart['kind'], char: string) => {
    const last = parts.at(-1);
    if (last?.kind === kind) last.text += char;
    else parts.push({ kind, text: char });
  };
  let [i, j] = [0, 0];
  while (i < n || j < m) {
    if (i < n && j < m && typed[i] === expected[j]) {
      push('same', typed[i++]!);
      j++;
    } else if (j < m && (i === n || common[i]![j + 1]! >= common[i + 1]![j]!)) {
      push('missing', expected[j++]!);
    } else {
      push('extra', typed[i++]!);
    }
  }
  return parts;
}

/** Nombre de lettres à changer, ajouter ou enlever : une lettre remplacée compte pour une. */
function distance(typed: string, expected: string): number {
  let total = 0;
  let [extra, missing] = [0, 0];
  for (const part of [...diff(typed, expected), { kind: 'same', text: '' } as DiffPart]) {
    if (part.kind === 'extra') extra += part.text.length;
    else if (part.kind === 'missing') missing += part.text.length;
    else {
      total += Math.max(extra, missing);
      [extra, missing] = [0, 0];
    }
  }
  return total;
}

/**
 * Parmi les bonnes réponses, celle qui ressemble le plus à ce qui a été tapé :
 * le moins à changer, puis la longueur la plus proche (« allee » → « allée » plutôt que « allé »).
 */
export function closestAnswer(typed: string, answers: readonly string[]): string {
  const score = (answer: string) => [distance(typed, answer), Math.abs(answer.length - typed.length)];
  return answers.reduce((best, answer) => {
    const [a, b] = [score(answer), score(best)];
    return a[0]! < b[0]! || (a[0] === b[0] && a[1]! < b[1]!) ? answer : best;
  });
}
