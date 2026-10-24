import { h } from '../core/dom';
import { countStickers, hasSticker, type Sticker, type WithStickers } from '../core/stickers';
import type { Profile } from '../core/storage';
import { topbar } from './topbar';

export interface AlbumOptions {
  /** Texte du bouton retour : « Les tables », « Conjugaison ». */
  backLabel: string;
  profile: Profile;
  stickers: readonly Sticker[];
  data: WithStickers;
  onBack(): void;
}

/** Album : les autocollants gagnés en couleur, les autres en ombre avec ce qu'il faut faire. */
export function renderAlbum(root: HTMLElement, { backLabel, profile, stickers, data, onBack }: AlbumOptions): void {
  const tiles = stickers.map((sticker) => {
    const won = hasSticker(data, sticker.id);
    return h(
      'li',
      { class: `sticker${won ? ' won' : ''}` },
      h('span', { class: 'sticker-emoji', 'aria-hidden': 'true' }, sticker.emoji),
      h('strong', {}, won ? sticker.name : '???'),
      h('small', {}, sticker.hint),
    );
  });

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar(backLabel, onBack, profile),
      h('h1', { class: 'title' }, 'Mes autocollants'),
      h('p', { class: 'subtitle' }, `${countStickers(data, stickers)} sur ${stickers.length}. Lequel sera le prochain ?`),
      h('ul', { class: 'album' }, ...tiles),
    ),
  );
}
