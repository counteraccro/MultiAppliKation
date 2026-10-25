import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { ActivityContext } from '../types';
import { beltOf, beltTextColor } from './belts';
import { gradeGoal, gradeNote } from './grade';
import { beltStatuses, formatDay, isReady, mustPracticeFirst, progressOf, type BeltStatus, type CeinturesData, type SubjectProgress } from './data';
import type { HomophoneBelt } from './homophones';
import type { Subject } from './subjects';

export interface LadderActions {
  onLesson(belt: HomophoneBelt): void;
  onPractice(belt: HomophoneBelt): void;
  onTest(belt: HomophoneBelt): void;
  /** Un adulte note la ceinture en cours obtenue en classe. */
  onPassedInClass(belt: HomophoneBelt): void;
  onClassBelts(): void;
  onBack(): void;
}

/**
 * L'échelle d'une matière, de la blanche à la noire : obtenues (coloriées, avec la date),
 * en cours (« À toi ! »), puis fermées d'un cadenas, mais on peut lire ce qu'elles demandent.
 * Toucher une ceinture ouverte montre ses boutons ; celle en cours est ouverte d'office.
 */
export function renderLadder(
  root: HTMLElement,
  ctx: ActivityContext,
  subject: Subject,
  data: CeinturesData,
  actions: LadderActions,
): void {
  const progress = progressOf(data, subject);
  const statuses = beltStatuses(subject, progress);
  const rows: HTMLElement[] = [];

  const open = (row: HTMLElement) => {
    for (const other of rows) {
      const isOpen = other === row && !other.classList.contains('open');
      other.classList.toggle('open', isOpen);
      other.querySelector('.belt-row')?.setAttribute('aria-expanded', String(isOpen));
    }
  };

  const items: HTMLElement[] = [];
  const goal = gradeGoal(ctx.profile.grade);
  const note = gradeNote(ctx.profile.grade);
  subject.belts.forEach((belt, index) => {
    const status = statuses[index]!;
    const row = beltItem(belt, status, progress, actions, () => open(row));
    rows.push(row);
    items.push(row);
    // Repère du classeur, sous la ceinture à avoir en fin d'année ; celui de sa classe est mis en avant.
    if (belt.goal) {
      items.push(
        h('li', { class: `belt-goal${belt.goal === goal ? ' mine' : ''}` }, `🎯 Objectif de fin de ${belt.goal}`),
      );
    }
  });

  const allPassed = statuses.every((s) => s === 'passed');

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Ceintures', actions.onBack, ctx.profile),
      h('h1', { class: 'title' }, subject.label),
      h(
        'p',
        { class: 'subtitle' },
        allPassed ? 'Toutes les ceintures obtenues, bravo !' : 'Une ceinture après l’autre, comme en classe.',
      ),
      note && h('p', { class: 'grade-note' }, note),
      h('ol', { class: 'belt-list ladder' }, ...items),
      h('button', { class: 'link-button', type: 'button', onclick: actions.onClassBelts }, 'Ceintures obtenues en classe'),
    ),
  );
}

function beltItem(
  belt: HomophoneBelt,
  status: BeltStatus,
  progress: SubjectProgress,
  actions: LadderActions,
  onToggle: () => void,
): HTMLElement {
  const { label, color } = beltOf(belt.belt);
  const style = `--belt: ${color}; --belt-text: ${beltTextColor(color)}`;
  const chip = h('span', { class: 'belt-chip' }, label);
  const skill = h('span', { class: 'belt-skill' }, belt.skill);

  if (status === 'locked') {
    return h(
      'li',
      { class: 'belt-item locked', style },
      h(
        'div',
        { class: 'belt-row', 'aria-label': `Ceinture ${label}, ${belt.skill} : fermée` },
        chip,
        skill,
        h('span', { class: 'belt-state', 'aria-hidden': 'true' }, '🔒'),
      ),
    );
  }

  const isCurrent = status === 'current';
  const day = progress.passed[belt.belt];
  const practiceFirst = mustPracticeFirst(progress, belt.belt);
  const passedTest = progress.passedTest?.[belt.belt];
  const state = isCurrent
    ? h('span', { class: 'badge belt-badge' }, 'À toi !')
    : status === 'tested'
      ? h('span', { class: 'belt-state tested' }, `✓ réussie le ${formatDay(passedTest!)} · à passer en classe`)
      : h('span', { class: 'belt-state passed' }, `✓ obtenue le ${formatDay(day!)}`);
  return h(
    'li',
    { class: `belt-item ${status}${isCurrent ? ' open' : ''}`, style },
    h(
      'button',
      { class: 'belt-row', type: 'button', 'aria-expanded': String(isCurrent), onclick: onToggle },
      chip,
      h('span', { class: 'belt-text' }, skill, state),
    ),
    h(
      'div',
      { class: 'belt-actions' },
      status === 'tested' && h('p', { class: 'belt-ready' }, 'Examen blanc réussi : à toi de la passer en classe !'),
      isCurrent && isReady(progress, belt.belt) && h('p', { class: 'belt-ready' }, readyMessage(label)),
      h('button', { class: 'button secondary', type: 'button', onclick: () => actions.onLesson(belt) }, 'Leçon'),
      h('button', { class: 'button primary', type: 'button', onclick: () => actions.onPractice(belt) }, 'S’entraîner'),
      // Le test, seulement sur la ceinture en cours ; après un échec, on s'entraîne d'abord.
      isCurrent &&
        h(
          'button',
          { class: 'button mode primary belt-test', type: 'button', disabled: practiceFirst, onclick: () => actions.onTest(belt) },
          'Examen blanc',
          h('small', {}, practiceFirst ? 'Entraîne-toi d’abord' : '10 phrases, sans aide'),
        ),
      // Seul un adulte note la ceinture : elle se passe en classe.
      status !== 'passed' &&
        h(
          'button',
          { class: 'link-button belt-class', type: 'button', onclick: () => actions.onPassedInClass(belt) },
          '✓ Obtenue en classe ? Un adulte la note ici',
        ),
    ),
  );
}

/** Après 3 entraînements réussis sur la ceinture en cours. Sans « prêt / prête » : pour tous les enfants. */
export function readyMessage(beltLabel: string): string {
  return `🎉 Bravo, tu peux passer la ceinture ${beltLabel} !`;
}
