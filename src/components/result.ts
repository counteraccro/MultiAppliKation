import { h } from '../core/dom';
import { sounds } from '../core/sound';
import { launchConfetti } from './confetti';

export interface ResultAction {
  label: string;
  primary?: boolean;
  onClick(): void;
}

export interface ResultOptions {
  title: string;
  /** Bloc mis en avant sous le titre (étoiles, temps…). */
  highlight?: HTMLElement;
  message: string;
  /** Badge « Nouveau record ! ». */
  record?: boolean;
  /** Questions à retravailler. */
  toPractice?: string[];
  /** Belle réussite : confettis et musique. */
  celebrate?: boolean;
  /** Autocollants gagnés pendant cette série. */
  rewards?: { emoji: string; name: string }[];
  actions: ResultAction[];
}

/** Écran de fin de série, commun à tous les modes et toutes les activités. */
export function renderResult(root: HTMLElement, options: ResultOptions): void {
  const practice = options.toPractice ?? [];
  const rewards = options.rewards ?? [];
  root.append(
    h(
      'section',
      { class: 'screen result' },
      h('h1', { class: 'title' }, options.title),
      options.highlight,
      options.record && h('p', { class: 'record' }, 'Nouveau record !'),
      h('p', { class: 'subtitle' }, options.message),
      rewards.length > 0 &&
        h(
          'div',
          { class: 'rewards' },
          h('h2', {}, rewards.length > 1 ? 'Nouveaux autocollants !' : 'Nouvel autocollant !'),
          h(
            'ul',
            {},
            ...rewards.map((r) => h('li', {}, h('span', { class: 'sticker-emoji', 'aria-hidden': 'true' }, r.emoji), r.name)),
          ),
        ),
      practice.length > 0 &&
        h(
          'div',
          { class: 'to-practice' },
          h('h2', {}, 'À retravailler'),
          h('ul', {}, ...practice.map((item) => h('li', {}, item))),
        ),
      h(
        'div',
        { class: 'result-actions' },
        ...options.actions.map((action) =>
          h(
            'button',
            { class: `button ${action.primary ? 'primary' : 'secondary'}`, type: 'button', onclick: action.onClick },
            action.label,
          ),
        ),
      ),
    ),
  );

  if (options.celebrate || rewards.length > 0) {
    launchConfetti();
    sounds.win();
  }
}
