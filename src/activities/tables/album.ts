import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import type { TablesData } from './data';
import { hasSticker, stickerCount, STICKERS } from './stickers';

/** Album : les autocollants gagnés en couleur, les autres en ombre avec ce qu'il faut faire. */
export function renderAlbum(root: HTMLElement, ctx: ActivityContext, data: TablesData, onBack: () => void): void {
  const tiles = STICKERS.map((sticker) => {
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
      topbar('Les tables', onBack, ctx.profile),
      h('h1', { class: 'title' }, 'Mes autocollants'),
      h('p', { class: 'subtitle' }, `${stickerCount(data)} sur ${STICKERS.length}. Lequel sera le prochain ?`),
      h('ul', { class: 'album' }, ...tiles),
    ),
  );
}
