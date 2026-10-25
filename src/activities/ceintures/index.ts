import { openAdultCheck } from '../../components/adult-check';
import { renderAlbum } from '../../components/album';
import { renderResult } from '../../components/result';
import { h } from '../../core/dom';
import { dayOf } from '../../core/play-days';
import type { Sticker } from '../../core/stickers';
import type { Activity } from '../types';
import { beltOf, beltTextColor } from './belts';
import { renderClassBelts } from './class-belts';
import {
  beltStatuses,
  isReady,
  mustPracticeFirst,
  progressOf,
  readCeinturesData,
  recordPractice,
  recordTest,
  setClassLevel,
} from './data';
import { renderCeinturesHome } from './home';
import type { HomophoneBelt } from './homophones';
import { readyMessage, renderLadder } from './ladder';
import { renderLesson } from './lesson';
import { renderProgress } from './progress-screen';
import { pickSentences, PracticeSession, type PracticeResult } from './practice-session';
import { capitalize, fullSentence, parseSentence, withNbsp } from './sentence';
import { renderSentenceScreen } from './sentence-screen';
import { STICKER_SECTIONS, STICKERS, unlockStickers } from './stickers';
import type { Subject } from './subjects';
import { isPassing, pickTestSentences, TestSession, type TestMistake, type TestResult } from './test-session';

// Voir .ai/analyse/11-ceintures.md : les ceintures de la classe, en commençant par les homophones.
// Accueil (les matières), échelle d'une matière, leçon, entraînement et test d'une ceinture,
// progrès et autocollants.
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

    const home = () =>
      show(() => renderCeinturesHome(root, ctx, load(), { onSubject: ladder, onProgress: progress, onAlbum: album }));

    const progress = () => show(() => renderProgress(root, ctx, load(), home));
    const album = () =>
      show(() =>
        renderAlbum(root, {
          backLabel: 'Ceintures',
          profile: ctx.profile,
          stickers: STICKERS,
          sections: STICKER_SECTIONS,
          data: load(),
          onBack: home,
        }),
      );

    const ladder = (subject: Subject) =>
      show(() =>
        renderLadder(root, ctx, subject, load(), {
          onLesson: (belt) => lesson(subject, belt),
          onPractice: (belt) => practice(subject, belt),
          onTest: (belt) => test(subject, belt),
          onPassedInClass: (belt) => checkPassedInClass(subject, belt),
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

    // La ceinture en cours, obtenue en classe aujourd'hui : un adulte la note, et c'est la fête.
    const checkPassedInClass = (subject: Subject, belt: HomophoneBelt) =>
      openAdultCheck(
        root,
        {
          title: `Ceinture ${beltOf(belt.belt).label}`,
          message: 'Pour noter cette ceinture obtenue en classe aujourd’hui.',
          confirmLabel: 'Noter',
        },
        () => {
          const data = load();
          setClassLevel(data, subject, subject.belts.indexOf(belt), dayOf(Date.now()));
          const rewards = unlockStickers(data, { subject: subject.id, mode: 'class', bestStreak: 0, correct: 0, total: 0 });
          ctx.save(data);
          showBeltWon(subject, belt, rewards);
        },
      );

    function showBeltWon(subject: Subject, belt: HomophoneBelt, rewards: Sticker[]) {
      const { label: name, color } = beltOf(belt.belt);
      const next = subject.belts[subject.belts.indexOf(belt) + 1];
      show(() =>
        renderResult(root, {
          title: 'Ceinture obtenue !',
          celebrate: true,
          rewards,
          highlight: h(
            'div',
            { class: 'belt-won', style: `--belt: ${color}; --belt-text: ${beltTextColor(color)}` },
            h('span', { class: 'belt-chip' }, name),
          ),
          message: next
            ? `Bravo pour ta ceinture ${name} ! La ceinture ${beltOf(next.belt).label} s’ouvre.`
            : `Bravo pour ta ceinture ${name} : tu as toutes les ceintures !`,
          actions: [{ label: subject.label, primary: true, onClick: () => ladder(subject) }],
        }),
      );
    }

    const classBelts = (subject: Subject) =>
      show(() =>
        renderClassBelts(root, ctx, subject, load(), {
          onSave: (highest, day) => {
            const data = load();
            setClassLevel(data, subject, highest, day);
            unlockStickers(data, { subject: subject.id, mode: 'class', bestStreak: 0, correct: 0, total: 0 });
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
          onDone: ({ bestStreak }) => {
            // Fini jusqu'au bout : le test peut être (re)passé, avec d'autres phrases.
            const result = session.result();
            const data = load();
            recordPractice(data, subject, belt.belt, items.map((i) => i.sentence.id), result);
            const rewards = unlockStickers(data, { subject: subject.id, mode: 'practice', bestStreak, correct: result.correct, total: result.total });
            ctx.save(data);
            showResult(subject, belt, result, rewards);
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
          label: `En conditions réelles · ${label(belt)}`,
          onQuit: () => ladder(subject),
          onDone: () => {
            const result = session.result();
            const data = load();
            recordTest(data, subject, belt.belt, result, result.passed, dayOf(Date.now()));
            const rewards = unlockStickers(data, { subject: subject.id, mode: 'test', bestStreak: 0, correct: result.correct, total: result.total });
            ctx.save(data);
            showTestResult(subject, belt, result, rewards);
          },
        });
      });

    function showTestResult(subject: Subject, belt: HomophoneBelt, result: TestResult, rewards: Sticker[]) {
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
              // La vraie ceinture se passe en classe : ici, l'enfant sait qu'il peut y aller.
              title: 'Réussi !',
              celebrate: true,
              rewards,
              highlight: h(
                'div',
                { class: 'belt-won', style: `--belt: ${color}; --belt-text: ${beltTextColor(color)}` },
                h('span', { class: 'belt-chip' }, name),
                count,
              ),
              message:
                `Bravo, tu peux passer la ceinture ${name} en classe !` +
                (next ? ` La ceinture ${beltOf(next.belt).label} s’ouvre.` : ''),
              details: result.mistakes.length > 0 ? corrections(result.mistakes) : undefined,
              actions: [{ label: subject.label, primary: true, onClick: () => ladder(subject) }],
            })
          : renderResult(root, {
              title: label(belt),
              highlight: count,
              rewards,
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

    function showResult(subject: Subject, belt: HomophoneBelt, result: PracticeResult, rewards: Sticker[]) {
      const all = result.correct === result.total;
      // Entraînement réussi sur la ceinture en cours : on propose le test.
      const offerTest = isPassing(result.correct, result.total) && canTest(subject, belt);
      const ready = canTest(subject, belt) && isReady(progressOf(load(), subject), belt.belt);
      show(() =>
        renderResult(root, {
          title: label(belt),
          celebrate: all,
          rewards,
          highlight: h(
            'p',
            { class: 'big-count' },
            h('strong', {}, `${result.correct} / ${result.total}`),
            h('small', {}, 'du premier coup'),
          ),
          message: ready
            ? readyMessage(beltOf(belt.belt).label)
            : all
              ? 'Tout juste, bravo !'
              : 'Continue, chaque essai te fait progresser !',
          toPractice: result.toPractice.map((s) => withNbsp(fullSentence(s.text))),
          practiceAsSentences: true,
          actions: [
            ...(offerTest
              ? [{ label: 'Entraînement en conditions réelles', primary: true, onClick: () => test(subject, belt) }]
              : []),
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
