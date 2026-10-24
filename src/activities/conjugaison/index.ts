import { renderQuestionScreen } from '../../components/question-screen';
import { renderResult } from '../../components/result';
import { topbar } from '../../components/topbar';
import { h } from '../../core/dom';
import type { Activity } from '../types';
import { TrialSession, type TrialResult } from './trial';

// Étape 1 (voir .ai/analyse/10-conjugaison.md) : le clavier de lettres, à essayer
// sur l'appareil avant d'écrire les 20 verbes. Rien n'est encore enregistré.
export const conjugaison: Activity = {
  id: 'conjugaison',
  title: 'Conjugaison',
  emoji: '✍️',
  color: '#f15bb5',
  mount(root, ctx) {
    let cleanup: (() => void) | void;

    function show(render: () => (() => void) | void) {
      cleanup?.();
      root.replaceChildren();
      window.scrollTo(0, 0);
      cleanup = render();
    }

    const home = () =>
      show(() =>
        root.append(
          h(
            'section',
            { class: 'screen' },
            topbar('Activités', ctx.exit, ctx.profile),
            h('h1', { class: 'title' }, 'Conjugaison'),
            h('p', { class: 'subtitle' }, 'Bientôt : les verbes du CM1. Pour l’instant, un essai du clavier.'),
            h('button', { class: 'button primary', type: 'button', onclick: trial }, 'Essayer'),
          ),
        ),
      );

    const trial = () =>
      show(() => {
        const session = new TrialSession();
        return renderQuestionScreen(root, {
          session,
          label: 'Essai',
          input: 'letters',
          onQuit: home,
          onDone: () => showResult(session.result()),
        });
      });

    function showResult(result: TrialResult) {
      const all = result.correct === result.total;
      show(() =>
        renderResult(root, {
          title: 'Essai',
          celebrate: all,
          highlight: h(
            'p',
            { class: 'big-count' },
            h('strong', {}, `${result.correct} / ${result.total}`),
            h('small', {}, 'du premier coup'),
          ),
          message: all ? 'Tout juste, bravo !' : 'Continue, chaque essai te fait progresser !',
          toPractice: result.toPractice.map((q) => `${q.prompt}${q.prompt.endsWith('’') ? '' : ' '}${q.answer} (${q.context})`),
          actions: [
            { label: 'Rejouer', primary: true, onClick: trial },
            { label: 'Conjugaison', onClick: home },
          ],
        }),
      );
    }

    home();
    return () => cleanup?.();
  },
};
