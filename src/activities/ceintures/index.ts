import { openAdultCheck } from '../../components/adult-check';
import { renderResult } from '../../components/result';
import { h } from '../../core/dom';
import type { Activity } from '../types';
import { beltOf } from './belts';
import { renderClassBelts } from './class-belts';
import { readCeinturesData, setClassLevel } from './data';
import { renderCeinturesHome } from './home';
import type { HomophoneBelt } from './homophones';
import { renderLadder } from './ladder';
import { renderLesson } from './lesson';
import { pickSentences, PracticeSession, type PracticeResult } from './practice-session';
import { fullSentence, withNbsp } from './sentence';
import { renderSentenceScreen } from './sentence-screen';
import type { Subject } from './subjects';

// Voir .ai/analyse/11-ceintures.md : les ceintures de la classe, en commençant par les homophones.
// Accueil (les matières), échelle d'une matière, leçon et entraînement d'une ceinture.
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

    const load = () => readCeinturesData(ctx.load());

    const home = () => show(() => renderCeinturesHome(root, ctx, load(), ladder));

    const ladder = (subject: Subject) =>
      show(() =>
        renderLadder(root, ctx, subject, load(), {
          onLesson: (belt) => lesson(subject, belt),
          onPractice: (belt) => practice(subject, belt),
          onClassBelts: () => checkClassBelts(subject),
          onBack: home,
        }),
      );

    const lesson = (subject: Subject, belt: HomophoneBelt) =>
      show(() =>
        renderLesson(root, ctx, belt, subject.label, {
          onPractice: () => practice(subject, belt),
          onBack: () => ladder(subject),
        }),
      );

    // Noter une ceinture obtenue en classe fait monter l'enfant : c'est à un adulte de le faire.
    const checkClassBelts = (subject: Subject) =>
      openAdultCheck(
        root,
        {
          title: 'Ceintures de la classe',
          message: 'Pour noter les ceintures déjà obtenues en classe.',
          confirmLabel: 'Continuer',
        },
        () => classBelts(subject),
      );

    const classBelts = (subject: Subject) =>
      show(() =>
        renderClassBelts(root, ctx, subject, load(), {
          onSave: (highest, day) => {
            const data = load();
            setClassLevel(data, subject, highest, day);
            ctx.save(data);
            ladder(subject);
          },
          onBack: () => ladder(subject),
        }),
      );

    const label = (belt: HomophoneBelt) => `Ceinture ${beltOf(belt.belt).label}`;

    const practice = (subject: Subject, belt: HomophoneBelt) =>
      show(() => {
        const session = new PracticeSession(pickSentences(belt));
        return renderSentenceScreen(root, {
          session,
          label: label(belt),
          onQuit: () => ladder(subject),
          onDone: () => showResult(subject, belt, session.result()),
        });
      });

    function showResult(subject: Subject, belt: HomophoneBelt, result: PracticeResult) {
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
            { label: 'Encore', primary: true, onClick: () => practice(subject, belt) },
            { label: 'Leçon', onClick: () => lesson(subject, belt) },
            { label: subject.label, onClick: () => ladder(subject) },
          ],
        }),
      );
    }

    home();
    return () => cleanup?.();
  },
};
