/**
 * Après une erreur : découpe la bonne réponse en [début, partie à surligner, fin],
 * la partie du milieu étant ce qui diffère de ce qui a été tapé (« commen|ç|ons »).
 */
export function diffParts(typed: string, expected: string): [string, string, string] {
  let start = 0;
  while (start < typed.length && start < expected.length && typed[start] === expected[start]) start++;
  let end = 0;
  while (
    end < typed.length - start &&
    end < expected.length - start &&
    typed[typed.length - 1 - end] === expected[expected.length - 1 - end]
  ) {
    end++;
  }
  return [expected.slice(0, start), expected.slice(start, expected.length - end), expected.slice(expected.length - end)];
}

/**
 * Parmi les bonnes réponses, celle qui ressemble le plus à ce qui a été tapé :
 * le moins à surligner, puis la longueur la plus proche (« allee » → « allée » plutôt que « allé »).
 */
export function closestAnswer(typed: string, answers: readonly string[]): string {
  const distance = (answer: string) => [diffParts(typed, answer)[1].length, Math.abs(answer.length - typed.length)];
  return answers.reduce((best, answer) => {
    const [a, b] = [distance(answer), distance(best)];
    return a[0]! < b[0]! || (a[0] === b[0] && a[1]! < b[1]!) ? answer : best;
  });
}
