// Une phrase à trous s'écrit avec la réponse entre accolades :
// « Le lion {est} un animal carnivore. », « Le chat a mang{é} la souris. »
// La réponse est en minuscules, comme sur les boutons : la majuscule de début
// de phrase est mise en plaçant le mot (« {à} la plage » → « À la plage »).

export type Segment = string | { answer: string; capital: boolean };

const BLANK = /\{([^{}]*)\}/g;

/** Coupe la phrase en morceaux de texte et en trous, dans l'ordre. */
export function parseSentence(text: string): Segment[] {
  const segments: Segment[] = [];
  let before = '';
  let last = 0;
  for (const match of text.matchAll(BLANK)) {
    const plain = text.slice(last, match.index);
    if (plain) segments.push(plain);
    before += plain;
    const answer = match[1] ?? '';
    segments.push({ answer, capital: startsSentence(before) });
    before += answer;
    last = match.index + match[0].length;
  }
  const rest = text.slice(last);
  if (rest) segments.push(rest);
  return segments;
}

/** Les réponses attendues, trou par trou. */
export function blanksOf(text: string): string[] {
  return [...text.matchAll(BLANK)].map((m) => m[1] ?? '');
}

/** Le trou est en début de phrase : rien avant, ou juste après . ! ? */
function startsSentence(before: string): boolean {
  const trimmed = before.trimEnd();
  return trimmed === '' || /[.!?]$/.test(trimmed);
}

export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** La phrase complète, chaque trou rempli par sa réponse : pour la correction. */
export function fullSentence(text: string): string {
  return parseSentence(text)
    .map((s) => (typeof s === 'string' ? s : s.capital ? capitalize(s.answer) : s.answer))
    .join('');
}
