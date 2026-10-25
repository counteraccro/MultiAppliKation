import { openAdultCheck } from '../../components/adult-check';
import { renderResult } from '../../components/result';
import { h } from '../../core/dom';
import { dayOf } from '../../core/play-days';
import type { Activity } from '../types';
import { beltOf, beltTextColor } from './belts';
import { renderClassBelts } from './class-belts';
import { beltStatuses, mustPracticeFirst, progressOf, readCeinturesData, recordPractice, recordTest, setClassLevel } from './data';
import { renderCeinturesHome } from './home';
import type { HomophoneBelt } from './homophones';
import { renderLadder } from './ladder';
import { renderLesson } from './lesson';
import { pickSentences, PracticeSession, type PracticeResult } from './practice-session';
import { capitalize, fullSentence, parseSentence, withNbsp } from './sentence';
import { renderSentenceScreen } from './sentence-screen';
import type { Subject } from './subjects';
import { isPassing, pickTestSentences, TestSession, type TestMistake, type TestResult } from './test-session';

// Voir .ai/analyse/11-ceintures.md : les ceintures de la classe, en commençant par les homophones.
// Accueil (les matières), échelle d'une matière, leçon, entraînement et test d'une ceinture.
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
          onTest: (belt) => test(subject, belt),
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

    /** La ceinture en cours, celle dont on peut passer le test (si pas d'échec sans entraînement depuis). */
    const canTest = (subject: Subject, belt: HomophoneBelt) => {
      const progress = progressOf(load(), subject);
      const index = subject.belts.indexOf(belt);
      return beltStatuses(subject, progress)[index] === 'current' && !mustPracticeFirst(progress, belt.belt);
    };

    const practice = (subject: Subject, belt: HomophoneBelt) =>
      show(() => {
        const items = pickSentences(belt);
        const session = new PracticeSession(items);
        return renderSentenceScreen(root, {
          session,
          label: label(belt),
          onQuit: () => ladder(subject),
          onDone: () => {
            // Fini jusqu'au bout : le test peut être (re)passé, avec d'autres phrases.
            const data = load();
            recordPractice(data, subject, belt.belt, items.map((i) => i.sentence.id));
            ctx.save(data);
            showResult(subject, belt, session.result());
          },
        });
      });

    const test = (subject: Subject, belt: HomophoneBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const session = new TestSession(pickTestSentences(belt, seen));
        return renderSentenceScreen(root, {
          session,
          test: true,
          label: `Test · ${label(belt)}`,
          onQuit: () => ladder(subject),
          onDone: () => {
            const result = session.result();
            const data = load();
            recordTest(data, subject, belt.belt, result.passed, dayOf(Date.now()));
            ctx.save(data);
            showTestResult(subject, belt, result);
          },
        });
      });

    function showTestResult(subject: Subject, belt: HomophoneBelt, result: TestResult) {
      const { label: name, color } = beltOf(belt.belt);
      const next = subject.belts[subject.belts.indexOf(belt) + 1];
      const count = h(
        'p',
        { class: 'big-count' },
        h('strong', {}, `${result.correct} / ${result.total}`),
        h('small', {}, 'trous justes'),
      );
      show(() =>
        result.passed
          ? renderResult(root, {
              title: 'Ceinture obtenue !',
              celebrate: true,
              highlight: h(
                'div',
                { class: 'belt-won', style: `--belt: ${color}; --belt-text: ${beltTextColor(color)}` },
                h('span', { class: 'belt-chip' }, name),
                count,
              ),
              message: next
                ? `Bravo ! La ceinture ${beltOf(next.belt).label} s’ouvre.`
                : `Bravo ! Tu as toutes les ceintures de ${subject.label.toLowerCase()}.`,
              details: result.mistakes.length > 0 ? corrections(result.mistakes) : undefined,
              actions: [{ label: subject.label, primary: true, onClick: () => ladder(subject) }],
            })
          : renderResult(root, {
              title: label(belt),
              highlight: count,
              message: 'Encore un peu d’entraînement ! Regarde la correction, puis entraîne-toi.',
              details: corrections(result.mistakes),
              actions: [
                { label: 'S’entraîner', primary: true, onClick: () => practice(subject, belt) },
                { label: 'Leçon', onClick: () => lesson(subject, belt) },
                { label: subject.label, onClick: () => ladder(subject) },
              ],
            }),
      );
    }

    function showResult(subject: Subject, belt: HomophoneBelt, result: PracticeResult) {
      const all = result.correct === result.total;
      // Entraînement réussi sur la ceinture en cours : on propose le test.
      const offerTest = isPassing(result.correct, result.total) && canTest(subject, belt);
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
            ...(offerTest ? [{ label: 'Passer la ceinture', primary: true, onClick: () => test(subject, belt) }] : []),
            { label: 'Encore', primary: !offerTest, onClick: () => practice(subject, belt) },
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

/** La correction d'un test : chaque phrase fausse, le mot choisi barré et le bon surligné. */
function corrections(mistakes: TestMistake[]): HTMLElement {
  return h(
    'div',
    { class: 'to-practice sentences test-corrections' },
    h('h2', {}, 'La correction'),
    h(
      'ul',
      {},
      ...mistakes.map(({ sentence, chosen }) => {
        let blank = 0;
        return h(
          'li',
          {},
          ...parseSentence(sentence.text).map((segment) => {
            if (typeof segment === 'string') return withNbsp(segment);
            const word = (w: string) => (segment.capital ? capitalize(w) : w);
            const given = chosen[blank++];
            if (given === segment.answer) return word(segment.answer);
            return h(
              'span',
              { class: 'correction' },
              given !== undefined && h('s', {}, word(given)),
              h('mark', {}, word(segment.answer)),
            );
          }),
        );
      }),
    ),
  );
}
