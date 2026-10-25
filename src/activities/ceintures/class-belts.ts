import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import { dayOf } from '../../core/play-days';
import type { ActivityContext } from '../types';
import { beltOf, beltTextColor } from './belts';
import { highestPassed, progressOf, type CeinturesData } from './data';
import type { Subject } from './subjects';

export interface ClassBeltsActions {
  /** La dernière ceinture obtenue en classe (-1 : aucune) et le jour où elle l'a été. */
  onSave(highest: number, day: string): void;
  onBack(): void;
}

/**
 * Pour l'adulte (après la vérification) : la dernière ceinture obtenue en classe,
 * pour commencer directement au bon niveau. Les précédentes sont obtenues aussi.
 */
export function renderClassBelts(
  root: HTMLElement,
  ctx: ActivityContext,
  subject: Subject,
  data: CeinturesData,
  { onSave, onBack }: ClassBeltsActions,
): void {
  const today = dayOf(Date.now());
  const checked = highestPassed(subject, progressOf(data, subject));

  const option = (index: number, label: string, style?: string) =>
    h(
      'label',
      { class: 'class-belt', style },
      h('input', { type: 'radio', name: 'class-belt', value: String(index), checked: index === checked }),
      h('span', { class: index < 0 ? 'class-belt-none' : 'belt-chip' }, label),
      index >= 0 && h('span', { class: 'belt-skill' }, subject.belts[index]!.skill),
    );

  const dateInput = h('input', { class: 'date-input', type: 'date', value: today, max: today, required: true });

  const form = h(
    'form',
    { class: 'class-belts' },
    h(
      'fieldset',
      {},
      h('legend', {}, 'Dernière ceinture obtenue en classe'),
      option(-1, 'Aucune pour l’instant'),
      ...subject.belts.map((belt, index) => {
        const { label, color } = beltOf(belt.belt);
        return option(index, label, `--belt: ${color}; --belt-text: ${beltTextColor(color)}`);
      }),
    ),
    h('label', { class: 'date-row' }, 'Obtenue le', dateInput),
    h('p', { class: 'hint' }, 'Les ceintures d’en dessous sont notées aussi ; celles déjà notées gardent leur date.'),
    h(
      'div',
      { class: 'dialog-actions' },
      h('button', { class: 'button secondary', type: 'button', onclick: onBack }, 'Annuler'),
      h('button', { class: 'button primary', type: 'submit' }, 'Enregistrer'),
    ),
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const selected = form.querySelector<HTMLInputElement>('input[name="class-belt"]:checked');
    const day = dateInput.value && dateInput.value <= today ? dateInput.value : today;
    onSave(Number(selected?.value ?? -1), day);
  });

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar(subject.label, onBack, ctx.profile),
      h('h1', { class: 'title' }, 'En classe'),
      h('p', { class: 'subtitle' }, `${subject.label} : où en est ${ctx.profile.name} en classe ?`),
      form,
    ),
  );
}
