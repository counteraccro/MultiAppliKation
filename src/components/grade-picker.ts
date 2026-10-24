import { h } from '../core/dom';
import { GRADE_LABELS, GRADES, type Grade } from '../core/grades';

export interface GradePicker {
  el: HTMLElement;
  value(): Grade | undefined;
}

/** Choix de la classe : une rangée de pastilles (CP … 6ᵉ). */
export function createGradePicker(initial: Grade | undefined): GradePicker {
  let selected = initial;

  const pills = GRADES.map((grade) => {
    const radio = h('input', {
      class: 'grade-radio',
      type: 'radio',
      name: 'grade',
      value: grade,
      checked: grade === initial,
    });
    radio.addEventListener('change', () => {
      selected = grade;
    });
    return h('label', { class: 'grade-pill' }, radio, h('span', {}, GRADE_LABELS[grade]));
  });

  return {
    el: h('fieldset', { class: 'grades' }, h('legend', {}, 'Ta classe'), ...pills),
    value: () => selected,
  };
}
