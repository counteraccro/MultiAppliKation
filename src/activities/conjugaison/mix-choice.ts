import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import { mixSize, type MixChoice } from './mix-session';
import { TENSES, VERBS, type TenseId } from './verbs';

/** Écran « Mélange » : elle coche des temps et des verbes, puis lance la série. */
export function renderMixChoice(
  root: HTMLElement,
  ctx: ActivityContext,
  initial: MixChoice,
  { onStart, onBack }: { onStart(choice: MixChoice): void; onBack(): void },
): void {
  const tenses = new Set<TenseId>(initial.tenses);
  const verbs = new Set<string>(initial.verbs);
  const choice = (): MixChoice => ({
    tenses: TENSES.filter((t) => tenses.has(t.id)).map((t) => t.id),
    verbs: VERBS.filter((v) => verbs.has(v.id)).map((v) => v.id),
  });
  const toggle = <T>(set: Set<T>, value: T) => {
    if (set.has(value)) set.delete(value);
    else set.add(value);
    update();
  };

  const start = h('button', { class: 'button primary', type: 'button' });
  start.addEventListener('click', () => onStart(choice()));

  const tenseButtons = TENSES.map((t) => {
    const el = h('button', { class: 'tense-tab', type: 'button', onclick: () => toggle(tenses, t.id) }, t.label);
    return { id: t.id, el };
  });

  const verbTiles = VERBS.map((v) => {
    const el = h(
      'button',
      { class: 'tile verb-tile', type: 'button', 'aria-label': v.infinitive, onclick: () => toggle(verbs, v.id) },
      h('span', { class: 'check' }, '✓'),
      h('span', { class: 'verb-name' }, v.infinitive),
    );
    return { id: v.id, el };
  });

  // Les 20 verbes d'un coup : plus simple que 20 touches pour réviser « tout le futur ».
  const allVerbs = h('button', { class: 'button secondary', type: 'button' });
  allVerbs.addEventListener('click', () => {
    if (verbs.size === VERBS.length) verbs.clear();
    else for (const v of VERBS) verbs.add(v.id);
    update();
  });

  function update() {
    for (const { id, el } of tenseButtons) {
      el.classList.toggle('active', tenses.has(id));
      el.setAttribute('aria-pressed', String(tenses.has(id)));
    }
    for (const { id, el } of verbTiles) {
      el.classList.toggle('chosen', verbs.has(id));
      el.setAttribute('aria-pressed', String(verbs.has(id)));
    }
    allVerbs.textContent = verbs.size === VERBS.length ? 'Tout décocher' : 'Tous les verbes';
    const missing = tenses.size === 0 ? (verbs.size === 0 ? 'un temps et un verbe' : 'un temps') : verbs.size === 0 ? 'un verbe' : '';
    start.disabled = missing !== '';
    start.textContent = missing ? `Choisis ${missing}` : `C'est parti ! (${mixSize(choice())} questions)`;
  }

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Conjugaison', onBack, ctx.profile),
      h('h1', { class: 'title' }, 'Mélange'),
      h('p', { class: 'subtitle' }, 'Touche les temps, puis les verbes à mélanger.'),
      h('div', { class: 'tense-tabs mix-tenses', role: 'group', 'aria-label': 'Temps' }, ...tenseButtons.map((b) => b.el)),
      h('div', { class: 'verb-grid' }, ...verbTiles.map((t) => t.el)),
      allVerbs,
      h('div', { class: 'mix-start' }, start),
    ),
  );
  update();
}
