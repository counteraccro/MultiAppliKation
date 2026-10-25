import { renderResult } from '../../components/result';
import { h } from '../../core/dom';
import type { Activity } from '../types';
import { beltOf } from './belts';
import { renderCeinturesHome } from './home';
import type { HomophoneBelt } from './homophones';
import { pickSentences, PracticeSession, type PracticeResult } from './practice-session';
import { fullSentence, withNbsp } from './sentence';
import { renderSentenceScreen } from './sentence-screen';

// Voir .ai/analyse/11-ceintures.md : les ceintures de la classe, en commençant par les homophones.
export const ceintures: Activity = {
  id: 'ceintures',
  title: 'Ceintures',
  emoji: '🥋',
  color: '#2ec4b6',
  mount(root, ctx) {
    let cleanup: (() => void) | void;

    function show(render: () => (() => void) | void) {
      cleanup?.();
      root.replaceChildren();
      window.scrollTo(0, 0);
      cleanup = render();
    }

    const home = () => show(() => renderCeinturesHome(root, ctx, practice));

    const label = (belt: HomophoneBelt) => `Ceinture ${beltOf(belt.belt).label}`;

    const practice = (belt: HomophoneBelt) =>
      show(() => {
        const session = new PracticeSession(pickSentences(belt));
        return renderSentenceScreen(root, {
          session,
          label: label(belt),
          onQuit: home,
          onDone: () => showResult(belt, session.result()),
        });
      });

    function showResult(belt: HomophoneBelt, result: PracticeResult) {
      const all = result.correct === result.total;
      show(() =>
        renderResult(root, {
          title: label(belt),
          celebrate: all,
          highlight: h(
            'p',
            { class: 'big-count' },
            h('strong', {}, `${result.correct} / ${result.total}`),
            h('small', {}, 'du premier coup'),
          ),
          message: all ? 'Tout juste, bravo !' : 'Continue, chaque essai te fait progresser !',
          toPractice: result.toPractice.map((s) => withNbsp(fullSentence(s.text))),
          practiceAsSentences: true,
          actions: [
            { label: 'Encore', primary: true, onClick: () => practice(belt) },
            { label: 'Ceintures', onClick: home },
          ],
        }),
      );
    }

    home();
    return () => cleanup?.();
  },
};
