import { openAdultCheck } from '../../components/adult-check';
import { renderAlbum } from '../../components/album';
import { renderQuestionScreen } from '../../components/question-screen';
import { renderResult } from '../../components/result';
import { h } from '../../core/dom';
import { dayOf } from '../../core/play-days';
import type { Sticker } from '../../core/stickers';
import type { Activity } from '../types';
import { beltOf, beltTextColor } from './belts';
import { renderClassBelts } from './class-belts';
import { TENSES, type ConjugationBelt } from './conjugaison';
import {
  canTakeTest,
  isReady,
  progressOf,
  readCeinturesData,
  recordPractice,
  recordTest,
  setClassLevel,
  type Score,
} from './data';
import { renderCeinturesHome } from './home';
import type { HomophoneBelt } from './homophones';
import { readyMessage, renderLadder } from './ladder';
import { renderLesson } from './lesson';
import { renderProgress } from './progress-screen';
import { pickSentences, PracticeSession } from './practice-session';
import { capitalize, fullSentence, parseSentence, withNbsp } from './sentence';
import { renderSentenceScreen } from './sentence-screen';
import { STICKER_SECTIONS, STICKERS, unlockStickers } from './stickers';
import { isHomophoneBelt, type Subject, type SubjectBelt } from './subjects';
import { isPassing, pickTestSentences, TestSession, type TestMistake } from './test-session';
import { pickExercise, VerbPracticeSession } from './verb-practice';
import { pickTestExercises, VerbTestSession, type VerbMistake } from './verb-test';

// Voir .ai/analyse/11-ceintures.md : les ceintures de la classe, homophones puis conjugaison (12-ceintures-conjugaison.md).
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

    const lesson = (subject: Subject, belt: SubjectBelt) =>
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
    const checkPassedInClass = (subject: Subject, belt: SubjectBelt) =>
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

    function showBeltWon(subject: Subject, belt: SubjectBelt, rewards: Sticker[]) {
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
            ? `Bravo pour ta ceinture ${name} ! À toi la ceinture ${beltOf(next.belt).label} !`
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

    const label = (belt: SubjectBelt) => `Ceinture ${beltOf(belt.belt).label}`;

    /** Une ceinture pas encore réussie (sauf juste après un échec, sans entraînement depuis). */
    const canTest = (subject: Subject, belt: SubjectBelt) => {
      const progress = progressOf(load(), subject);
      return !progress.passedTest?.[belt.belt] && canTakeTest(progress, belt.belt);
    };

    const practice = (subject: Subject, belt: SubjectBelt) =>
      isHomophoneBelt(belt) ? practiceSentences(subject, belt) : practiceVerb(subject, belt);

    const practiceSentences = (subject: Subject, belt: HomophoneBelt) =>
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
            const toPractice = result.toPractice.map((s) => withNbsp(fullSentence(s.text)));
            practiceDone(subject, belt, items.map((i) => i.sentence.id), result, toPractice, bestStreak);
          },
        });
      });

    /** Conjugaison : un verbe de la ceinture, ses formes tapées au clavier de lettres. */
    const practiceVerb = (subject: Subject, belt: ConjugationBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const session = new VerbPracticeSession(pickExercise(belt, seen));
        return renderQuestionScreen(root, {
          session,
          label: label(belt),
          input: 'letters',
          onQuit: () => ladder(subject),
          onDone: ({ bestStreak }) => {
            const result = session.result();
            practiceDone(subject, belt, [session.exercise.id], result, result.toPractice, bestStreak);
          },
        });
      });

    function practiceDone(subject: Subject, belt: SubjectBelt, ids: string[], result: Score, toPractice: string[], bestStreak: number) {
      const data = load();
      recordPractice(data, subject, belt.belt, ids, result);
      const rewards = unlockStickers(data, { subject: subject.id, mode: 'practice', bestStreak, correct: result.correct, total: result.total });
      ctx.save(data);
      showResult(subject, belt, result, toPractice, rewards);
    }

    const test = (subject: Subject, belt: SubjectBelt) =>
      isHomophoneBelt(belt) ? testSentences(subject, belt) : testVerbs(subject, belt);

    const testSentences = (subject: Subject, belt: HomophoneBelt) =>
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
            testDone(subject, belt, result, 'trous justes', result.mistakes.length > 0 ? corrections(result.mistakes) : undefined);
          },
        });
      });

    /** Conjugaison : 3 verbes, comme une fiche de passage. */
    const testVerbs = (subject: Subject, belt: ConjugationBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const session = new VerbTestSession(pickTestExercises(belt, seen));
        return renderQuestionScreen(root, {
          session,
          test: true,
          label: `En conditions réelles · ${label(belt)}`,
          input: 'letters',
          onQuit: () => ladder(subject),
          onDone: () => {
            const result = session.result();
            testDone(subject, belt, result, 'formes justes', result.mistakes.length > 0 ? verbCorrections(result.mistakes) : undefined);
          },
        });
      });

    function testDone(subject: Subject, belt: SubjectBelt, result: Score & { passed: boolean }, unit: string, details?: HTMLElement) {
      const data = load();
      recordTest(data, subject, belt.belt, result, result.passed, dayOf(Date.now()));
      const rewards = unlockStickers(data, { subject: subject.id, mode: 'test', bestStreak: 0, correct: result.correct, total: result.total });
      ctx.save(data);
      showTestResult(subject, belt, result, unit, details, rewards);
    }

    /** `unit` : « trous justes », « formes justes » ; `details` : la correction, s'il y a des erreurs. */
    function showTestResult(
      subject: Subject,
      belt: SubjectBelt,
      result: Score & { passed: boolean },
      unit: string,
      details: HTMLElement | undefined,
      rewards: Sticker[],
    ) {
      const { label: name, color } = beltOf(belt.belt);
      const count = h(
        'p',
        { class: 'big-count' },
        h('strong', {}, `${result.correct} / ${result.total}`),
        h('small', {}, unit),
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
              message: `Bravo, tu peux passer la ceinture ${name} en classe !`,
              details,
              actions: [{ label: subject.label, primary: true, onClick: () => ladder(subject) }],
            })
          : renderResult(root, {
              title: label(belt),
              highlight: count,
              rewards,
              message: 'Encore un peu d’entraînement ! Regarde la correction, puis entraîne-toi.',
              details,
              actions: [
                { label: 'S’entraîner', primary: true, onClick: () => practice(subject, belt) },
                { label: 'Leçon', onClick: () => lesson(subject, belt) },
                { label: subject.label, onClick: () => ladder(subject) },
              ],
            }),
      );
    }

    function showResult(subject: Subject, belt: SubjectBelt, result: Score, toPractice: string[], rewards: Sticker[]) {
      const all = result.correct === result.total;
      // Entraînement réussi, et le test ouvert : on le propose.
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
          toPractice,
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

/**
 * La correction d'un test de conjugaison, verbe par verbe : chaque forme fausse,
 * ce qui a été tapé barré et la bonne surlignée.
 */
function verbCorrections(mistakes: VerbMistake[]): HTMLElement {
  const byExercise = new Map<VerbMistake['exercise'], VerbMistake[]>();
  for (const mistake of mistakes) byExercise.set(mistake.exercise, [...(byExercise.get(mistake.exercise) ?? []), mistake]);
  return h(
    'div',
    { class: 'to-practice sentences test-corrections' },
    h('h2', {}, 'La correction'),
    h(
      'ul',
      {},
      ...[...byExercise].map(([exercise, wrong]) =>
        h(
          'li',
          {},
          h('small', { class: 'correction-context' }, `${capitalize(exercise.verb)} ${TENSES[exercise.tense].at}`),
          ...wrong.map(({ question, typed }) => {
            // « nous » + forme ; à l'impératif, forme + « ! ».
            const at = question.full.lastIndexOf(question.answer);
            return h(
              'span',
              { class: 'correction-line' },
              question.full.slice(0, at),
              h('span', { class: 'correction' }, typed && h('s', {}, typed), h('mark', {}, question.answer)),
              question.full.slice(at + question.answer.length),
            );
          }),
        ),
      ),
    ),
  );
}
