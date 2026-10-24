import { albumCard, progressCard } from '../../components/home-cards';
import { stars } from '../../components/stars';
import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import { countStickers } from '../../core/stickers';
import type { ActivityContext } from '../types';
import { starsOf, type ConjugaisonData } from './data';
import { gradeNote } from './grade';
import { MASTERY_LABELS, masteryCounts } from './mastery';
import { knownCount, seenForms } from './review-session';
import { STICKERS } from './stickers';
import { CONJUGATIONS, conjugationsOf, TENSES, type Conjugation, type TenseId } from './verbs';

/** Verbe conseillé dans un temps : le premier sans étoile (sinon pas encore à 3). */
export function suggestedConjugation(data: ConjugaisonData, tense: TenseId): Conjugation | undefined {
  const list = conjugationsOf(tense);
  return list.find((c) => starsOf(data, c) === 0) ?? list.find((c) => starsOf(data, c) < 3);
}

export interface ConjugaisonHomeActions {
  onLearn(conjugation: Conjugation): void;
  onTense(tense: TenseId): void;
  onReview(): void;
  onMix(): void;
  onProgress(): void;
  onAlbum(): void;
}

export function renderConjugaisonHome(
  root: HTMLElement,
  ctx: ActivityContext,
  data: ConjugaisonData,
  { onLearn, onTense, onReview, onMix, onProgress, onAlbum }: ConjugaisonHomeActions,
): void {
  const tense = data.tense ?? 'present';
  const suggested = suggestedConjugation(data, tense);
  const note = gradeNote(ctx.profile.grade);

  const tabs = TENSES.map((t) =>
    h(
      'button',
      {
        class: `tense-tab${t.id === tense ? ' active' : ''}`,
        type: 'button',
        role: 'tab',
        'aria-selected': String(t.id === tense),
        onclick: () => t.id !== tense && onTense(t.id),
      },
      t.label,
    ),
  );

  const tiles = conjugationsOf(tense).map((c) => {
    const isSuggested = c === suggested;
    return h(
      'button',
      {
        class: `tile verb-tile${isSuggested ? ' suggested' : ''}`,
        type: 'button',
        'aria-label': `${c.verb.infinitive}, ${c.tense.label}`,
        onclick: () => onLearn(c),
      },
      isSuggested && h('span', { class: 'badge' }, 'À toi !'),
      h('span', { class: 'verb-name' }, c.verb.infinitive),
      stars(starsOf(data, c)),
    );
  });

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Activités', ctx.exit, ctx.profile),
      h('h1', { class: 'title' }, 'Conjugaison'),
      h('p', { class: 'subtitle' }, 'Choisis un temps, puis un verbe pour gagner des étoiles.'),
      note && h('p', { class: 'grade-note' }, note),
      h('div', { class: 'tense-tabs', role: 'tablist', 'aria-label': 'Temps' }, ...tabs),
      h('div', { class: 'verb-grid', role: 'tabpanel' }, ...tiles),
      h(
        'div',
        { class: 'mode-buttons verb-modes' },
        reviewButton(data, onReview),
        h(
          'button',
          { class: 'button mode primary mix', type: 'button', onclick: onMix },
          'Mélange',
          h('small', {}, 'Temps et verbes au choix'),
        ),
      ),
      h(
        'div',
        { class: 'home-cards' },
        progressCard(masteryCounts(data.leitner), MASTERY_LABELS, onProgress),
        albumCard(countStickers(data, STICKERS), STICKERS.length, onAlbum),
      ),
    ),
  );
}

/** Révision : rien à réviser tant qu'aucun verbe n'a été joué en « Apprendre ». */
function reviewButton(data: ConjugaisonData, onReview: () => void): HTMLElement {
  const ready = seenForms(data.leitner).length > 0;
  return h(
    'button',
    { class: 'button mode primary', type: 'button', disabled: !ready, onclick: onReview },
    'Révision',
    h('small', {}, ready ? `${knownCount(data.leitner)} / ${CONJUGATIONS.length} connus` : 'Joue d’abord un verbe'),
  );
}
