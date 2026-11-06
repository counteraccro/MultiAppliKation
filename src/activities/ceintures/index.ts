import { openAdultCheck } from '../../components/adult-check';
import { renderAlbum } from '../../components/album';
import { answerWithFixes, typedWithMistakes } from '../../components/correction';
import { fraction, withFractions } from '../../components/fraction';
import { renderQuestionScreen } from '../../components/question-screen';
import { renderResult } from '../../components/result';
import { closestAnswer } from '../../core/diff';
import { h } from '../../core/dom';
import { acceptedAnswers, answerText, groupDigits, normalizeAnswer, type QuizQuestion } from '../../core/quiz';
import { dayOf } from '../../core/play-days';
import type { Sticker } from '../../core/stickers';
import type { Activity } from '../types';
import { beltOf, beltTextColor } from './belts';
import { pickOperations, PRACTICE_SIZE as POSED_PRACTICE_SIZE, TEST_SIZE as POSED_TEST_SIZE, type PosedBelt } from './calcul-pose';
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
import { PosedSession, type PosedMistake } from './posed-session';
import { renderPosedScreen } from './posed-screen';
import { pickSentences, PracticeSession } from './practice-session';
import { capitalize, fullSentence, parseSentence, withNbsp } from './sentence';
import { renderSentenceScreen } from './sentence-screen';
import { STICKER_SECTIONS, STICKERS, unlockStickers } from './stickers';
import { isGrammarBelt, isHomophoneBelt, isMentalBelt, isNumerationBelt, isPosedBelt, isTableBelt, type Subject, type SubjectBelt } from './subjects';
import { decodeMarks, GRAMMAR_PRACTICE_SIZE, GRAMMAR_TEST_SIZE, pickGrammar, type GrammarBelt, type GrammarQuestion } from './grammaire';
import { drawSentence, renderGrammarScreen } from './grammar-screen';
import { MENTAL_PRACTICE_SIZE, MENTAL_TEST_SIZE, MENTAL_TEST_TIME_MS, passesMental, pickCalcs, type MentalBelt } from './calcul-mental';
import {
  NUMERATION_MAX_DIGITS,
  NUMERATION_MAX_LETTERS,
  NUMERATION_PRACTICE_SIZE,
  NUMERATION_TEST_SIZE,
  pickNumeration,
  type NumerationBelt,
  type NumerationQuestion,
} from './numeration';
import { CalcPracticeSession, CalcTestSession, factText, pickFacts, PRACTICE_SIZE, TablePracticeSession, TableTestSession, type TableMistake } from './table-practice';
import { TEST_TIME_MS, type TableBelt } from './tables';
import { isPassing, pickTestSentences, TestSession, type TestMistake } from './test-session';
import { pickExercises, VerbPracticeSession } from './verb-practice';
import { VerbTestSession, type VerbMistake } from './verb-test';

// Voir .ai/analyse/11-ceintures.md : les ceintures de la classe, homophones puis conjugaison (12-ceintures-conjugaison.md)
// tables (13-ceintures-tables.md), calcul posé (15-ceintures-calcul-pose.md), calcul mental (16-ceintures-calcul-mental.md)
// numération (18-ceintures-numeration.md) et grammaire (19-ceintures-grammaire.md).
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
    /** Calcul mental : 45 × 1000 = 45000, 0,5447 avec la virgule. */
    const MENTAL_MAX_DIGITS = 7;

    /** Une ceinture pas encore réussie (sauf juste après un échec, sans entraînement depuis). */
    const canTest = (subject: Subject, belt: SubjectBelt) => {
      const progress = progressOf(load(), subject);
      return !progress.passedTest?.[belt.belt] && canTakeTest(progress, belt.belt);
    };

    const practice = (subject: Subject, belt: SubjectBelt) =>
      isHomophoneBelt(belt)
        ? practiceSentences(subject, belt)
        : isTableBelt(belt)
          ? practiceTables(subject, belt)
          : isPosedBelt(belt)
            ? practicePosed(subject, belt)
            : isMentalBelt(belt)
              ? practiceMental(subject, belt)
              : isNumerationBelt(belt)
                ? practiceNumeration(subject, belt)
                : isGrammarBelt(belt)
                  ? practiceGrammar(subject, belt)
                  : practiceVerb(subject, belt);

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
        const session = new VerbPracticeSession(pickExercises(belt, seen));
        return renderQuestionScreen(root, {
          session,
          label: label(belt),
          input: 'letters',
          onQuit: () => ladder(subject),
          onDone: ({ bestStreak }) => {
            const result = session.result();
            practiceDone(subject, belt, session.exercises.map((e) => e.id), result, result.toPractice, bestStreak);
          },
        });
      });

    /** Tables : 10 calculs au pavé, corrigés tout de suite. */
    const practiceTables = (subject: Subject, belt: TableBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const keys = pickFacts(belt, PRACTICE_SIZE, seen);
        const session = new TablePracticeSession(keys);
        return renderQuestionScreen(root, {
          session,
          label: label(belt),
          onQuit: () => ladder(subject),
          onDone: ({ bestStreak }) => {
            const result = session.result();
            practiceDone(subject, belt, keys, result, result.toPractice, bestStreak);
          },
        });
      });

    /** Calcul posé : 3 opérations posées pas à pas, chaque étape corrigée tout de suite. */
    const practicePosed = (subject: Subject, belt: PosedBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const session = new PosedSession(pickOperations(belt, POSED_PRACTICE_SIZE, seen));
        return renderPosedScreen(root, {
          session,
          label: label(belt),
          onQuit: () => ladder(subject),
          onDone: ({ bestStreak }) => {
            const result = session.result();
            practiceDone(subject, belt, session.operations.map((o) => o.id), result, result.toPractice, bestStreak);
          },
        });
      });

    /** Calcul mental : 10 calculs au pavé, corrigés tout de suite avec l'astuce. */
    const practiceMental = (subject: Subject, belt: MentalBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const questions = pickCalcs(belt.drawCalc, MENTAL_PRACTICE_SIZE, seen);
        const session = new CalcPracticeSession(questions);
        return renderQuestionScreen(root, {
          session,
          label: label(belt),
          maxDigits: MENTAL_MAX_DIGITS,
          decimal: belt.decimal,
          onQuit: () => ladder(subject),
          onDone: ({ bestStreak }) => {
            const result = session.result();
            practiceDone(subject, belt, questions.map((q) => q.id), result, result.toPractice, bestStreak);
          },
        });
      });

    /** Numération : 10 questions (pavé, lettres ou boutons), corrigées tout de suite avec l'astuce. */
    const practiceNumeration = (subject: Subject, belt: NumerationBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const questions = pickNumeration(belt, NUMERATION_PRACTICE_SIZE, seen);
        const session = new CalcPracticeSession(questions);
        return renderQuestionScreen(root, {
          session,
          label: label(belt),
          maxDigits: NUMERATION_MAX_DIGITS,
          decimal: belt.decimal,
          maxLetters: NUMERATION_MAX_LETTERS,
          hyphen: true,
          classes: true,
          onQuit: () => ladder(subject),
          onDone: ({ bestStreak }) => {
            const result = session.result();
            practiceDone(subject, belt, questions.map((q) => q.id), result, result.toPractice, bestStreak);
          },
        });
      });

    /** Grammaire : 6 phrases à colorier, corrigées tout de suite ; une phrase ratée revient. */
    const practiceGrammar = (subject: Subject, belt: GrammarBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const questions = pickGrammar(belt, GRAMMAR_PRACTICE_SIZE, seen);
        const session = new CalcPracticeSession(questions);
        return renderGrammarScreen(root, {
          session,
          label: label(belt),
          onQuit: () => ladder(subject),
          onDone: ({ bestStreak }) => {
            const result = session.result();
            practiceDone(subject, belt, questions.map((q) => q.id), result, result.toPractice, bestStreak);
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
      isHomophoneBelt(belt)
        ? testSentences(subject, belt)
        : isTableBelt(belt)
          ? testTables(subject, belt)
          : isPosedBelt(belt)
            ? testPosed(subject, belt)
            : isMentalBelt(belt)
              ? testMental(subject, belt)
              : isNumerationBelt(belt)
                ? testNumeration(subject, belt)
                : isGrammarBelt(belt)
                  ? testGrammar(subject, belt)
                  : testVerbs(subject, belt);

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
        const session = new VerbTestSession(pickExercises(belt, seen));
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

    /** Tables : 20 calculs en une minute (30 à la brillante), comme en classe. */
    const testTables = (subject: Subject, belt: TableBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const session = new TableTestSession(pickFacts(belt, belt.testSize, seen));
        return renderQuestionScreen(root, {
          session,
          test: true,
          timeLimitMs: TEST_TIME_MS,
          label: `En conditions réelles · ${label(belt)}`,
          onQuit: () => ladder(subject),
          onDone: () => {
            const result = session.result();
            testDone(subject, belt, result, 'calculs justes', result.mistakes.length > 0 ? tableCorrections(result.mistakes) : undefined);
          },
        });
      });

    /** Calcul posé : 5 opérations, sans aide ; réussi à 90 % des étapes justes. */
    const testPosed = (subject: Subject, belt: PosedBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const session = new PosedSession(pickOperations(belt, POSED_TEST_SIZE, seen), true);
        return renderPosedScreen(root, {
          session,
          label: `En conditions réelles · ${label(belt)}`,
          onQuit: () => ladder(subject),
          onDone: () => {
            const result = session.result();
            testDone(subject, belt, result, 'étapes justes', result.mistakes.length > 0 ? posedCorrections(result.mistakes) : undefined);
          },
        });
      });

    /** Calcul mental : 20 calculs en 2 minutes, une erreur au plus, comme en classe. */
    const testMental = (subject: Subject, belt: MentalBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const session = new CalcTestSession(pickCalcs(belt.drawCalc, MENTAL_TEST_SIZE, seen), passesMental);
        return renderQuestionScreen(root, {
          session,
          test: true,
          timeLimitMs: MENTAL_TEST_TIME_MS,
          maxDigits: MENTAL_MAX_DIGITS,
          decimal: belt.decimal,
          label: `En conditions réelles · ${label(belt)}`,
          onQuit: () => ladder(subject),
          onDone: () => {
            const result = session.result();
            testDone(subject, belt, result, 'calculs justes', result.mistakes.length > 0 ? tableCorrections(result.mistakes) : undefined);
          },
        });
      });

    /** Numération : 10 questions sans aide, réussi à 9 justes (90 %), sans minuteur. */
    const testNumeration = (subject: Subject, belt: NumerationBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const session = new CalcTestSession(pickNumeration(belt, NUMERATION_TEST_SIZE, seen));
        return renderQuestionScreen(root, {
          session,
          test: true,
          maxDigits: NUMERATION_MAX_DIGITS,
          decimal: belt.decimal,
          maxLetters: NUMERATION_MAX_LETTERS,
          hyphen: true,
          classes: true,
          label: `En conditions réelles · ${label(belt)}`,
          onQuit: () => ladder(subject),
          onDone: () => {
            const result = session.result();
            testDone(subject, belt, result, 'réponses justes', result.mistakes.length > 0 ? numerationCorrections(result.mistakes) : undefined);
          },
        });
      });

    /** Grammaire : 10 phrases sans aide, réussi à 9 justes (90 %), sans minuteur. */
    const testGrammar = (subject: Subject, belt: GrammarBelt) =>
      show(() => {
        const seen = progressOf(load(), subject).lastPractice?.[belt.belt];
        const session = new CalcTestSession(pickGrammar(belt, GRAMMAR_TEST_SIZE, seen));
        return renderGrammarScreen(root, {
          session,
          test: true,
          label: `En conditions réelles · ${label(belt)}`,
          onQuit: () => ladder(subject),
          onDone: () => {
            const result = session.result();
            testDone(subject, belt, result, 'phrases justes', result.mistakes.length > 0 ? grammarCorrections(result.mistakes) : undefined);
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
          practiceAsSentences: !isTableBelt(belt) && !isPosedBelt(belt),
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

/** La correction d'un test de tables : les calculs faux (la réponse barrée), puis ceux qui n'ont pas eu le temps. */
function tableCorrections(mistakes: TableMistake[]): HTMLElement {
  const wrong = mistakes.filter((m) => m.typed !== undefined);
  const missing = mistakes.filter((m) => m.typed === undefined);
  return h(
    'div',
    { class: 'to-practice test-corrections' },
    h('h2', {}, 'La correction'),
    wrong.length > 0 &&
      h(
        'ul',
        { class: 'table-corrections' },
        ...wrong.map(({ question, typed }) =>
          h(
            'li',
            {},
            // « 37 + [12 63] = 100 » : la case au milieu pour un complément.
            ...withFractions(question.suffix === undefined ? `${question.prompt} = ` : `${question.prompt} `),
            ...correction(question, typed!),
          ),
        ),
      ),
    missing.length > 0 && h('p', { class: 'correction-context' }, 'Pas eu le temps :'),
    missing.length > 0 && h('ul', {}, ...missing.map(({ question }) => h('li', {}, ...withFractions(factText(question))))),
  );
}

/** « [12 63] = 100 », ou la fraction dont le numérateur est corrigé : « 8,37 = [873 837]/100 ». */
function correction(question: QuizQuestion, typed: string): (HTMLElement | string)[] {
  const fixed = h('span', { class: 'correction' }, h('s', {}, typed), h('mark', {}, answerText(question)));
  const denominator = /^\/(\d+)$/.exec(question.suffix ?? '')?.[1];
  if (denominator !== undefined) return [fraction(fixed, denominator)];
  return question.suffix === undefined ? [fixed] : [fixed, ` ${question.suffix}`];
}

/**
 * La correction d'un test de numération : pour chaque question fausse, ce qui avait été répondu, puis la
 * question résolue. Un nombre écrit en lettres : ses fautes barrées, et dans la correction ce qui diffère surligné.
 */
function numerationCorrections(mistakes: TableMistake<NumerationQuestion>[]): HTMLElement {
  return h(
    'div',
    { class: 'to-practice sentences test-corrections' },
    h('h2', {}, 'La correction'),
    h(
      'ul',
      {},
      ...mistakes.map(({ question, typed }) => {
        const solved = withNbsp(question.solved);
        if (typeof question.answer === 'string' && !question.choices && typed !== undefined) {
          const given = normalizeAnswer(typed);
          const shown = closestAnswer(given, acceptedAnswers(question));
          const at = solved.lastIndexOf(shown);
          return h(
            'li',
            {},
            h('small', { class: 'correction-context' }, 'Tu avais écrit : ', h('s', {}, typedWithMistakes(given, shown))),
            at === -1
              ? h('mark', {}, solved)
              : h('span', { class: 'correction-line' }, solved.slice(0, at), answerWithFixes(given, shown), solved.slice(at + shown.length)),
          );
        }
        // Un bouton touché : ce qu'il montrait (« < », le chiffre), pas sa valeur.
        // Un nombre tapé : par classes, comme la correction.
        const given = question.choices?.find((c) => c.value === typed)?.label ?? (typeof question.answer === 'number' && typed !== undefined ? groupDigits(typed) : typed);
        return h(
          'li',
          {},
          given !== undefined && h('small', { class: 'correction-context' }, 'Tu avais répondu : ', h('s', {}, ...withFractions(given))),
          h('mark', {}, ...withFractions(solved)),
        );
      }),
    ),
  );
}

/** La correction d'un test de grammaire : chaque phrase fausse telle qu'il l'a coloriée, les mots faux barrés, puis la bonne. */
function grammarCorrections(mistakes: TableMistake<GrammarQuestion>[]): HTMLElement {
  return h(
    'div',
    { class: 'to-practice sentences test-corrections' },
    h('h2', {}, 'La correction'),
    h(
      'ul',
      {},
      ...mistakes.map(({ question, typed }) => {
        const given = decodeMarks(typed ?? '', question.expected.length);
        const nature = question.exercise.mode === 'nature';
        return h(
          'li',
          { class: 'gram-correction' },
          h('small', { class: 'correction-context' }, question.exercise.instruction),
          h('span', { class: 'gram-sentence gram-given' }, ...drawSentence(question.pieces, given, { nature, expected: question.expected })),
          h('span', { class: 'gram-sentence gram-fixed' }, ...drawSentence(question.pieces, question.expected, { nature, given })),
        );
      }),
    ),
  );
}

/** La correction d'un test de calcul posé : chaque opération fausse, le résultat écrit barré et le bon surligné. */
function posedCorrections(mistakes: PosedMistake[]): HTMLElement {
  return h(
    'div',
    { class: 'to-practice test-corrections' },
    h('h2', {}, 'La correction'),
    h(
      'ul',
      { class: 'table-corrections' },
      ...mistakes.map(({ operation, written }) =>
        h(
          'li',
          {},
          `${operation.text} = `,
          written === operation.resultText
            ? h('mark', {}, operation.resultText)
            : h('span', { class: 'correction' }, h('s', {}, written), h('mark', {}, operation.resultText)),
        ),
      ),
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
              h(
                'span',
                { class: 'correction' },
                typed && h('s', {}, typedWithMistakes(normalizeAnswer(typed), question.answer)),
                answerWithFixes(normalizeAnswer(typed), question.answer),
              ),
              question.full.slice(at + question.answer.length),
            );
          }),
        ),
      ),
    ),
  );
}
