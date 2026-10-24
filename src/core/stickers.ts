// Autocollants : chaque activité a son album et ses règles, la mécanique est commune.

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  /** Comment le gagner : affiché aussi tant qu'il est caché. */
  hint: string;
}

/** Une règle : l'autocollant, et quand il est gagné (données déjà à jour, série qui vient de finir). */
export interface StickerRule<D, E> extends Sticker {
  won(data: D, event: E): boolean;
}

/** Autocollants gagnés : { "streak-10": date (ms) }. */
export interface WithStickers {
  stickers?: Record<string, number>;
}

export const toSticker = ({ id, emoji, name, hint }: Sticker): Sticker => ({ id, emoji, name, hint });

export function hasSticker(data: WithStickers, id: string): boolean {
  return data.stickers?.[id] !== undefined;
}

export function countStickers(data: WithStickers, stickers: readonly Sticker[]): number {
  return stickers.filter((s) => hasSticker(data, s.id)).length;
}

/** Colle les autocollants gagnés et renvoie les nouveaux, à fêter. */
export function unlockRules<D extends WithStickers, E>(
  rules: readonly StickerRule<D, E>[],
  data: D,
  event: E,
  now: number,
): Sticker[] {
  const fresh = rules.filter((rule) => !hasSticker(data, rule.id) && rule.won(data, event));
  data.stickers = { ...data.stickers };
  for (const rule of fresh) data.stickers[rule.id] = now;
  return fresh.map(toSticker);
}
