import { renderQuestionScreen } from '../../components/question-screen';
import { renderResult } from '../../components/result';
import { stars } from '../../components/stars';
import { h } from '../../core/dom';
import type { LeitnerState } from '../../core/leitner';
import type { Attempt } from '../../core/series';
import type { Activity } from '../types';
import { readConjugaisonData, recordAttempt, recordStars } from './data';
import { renderMixChoice } from './mix-choice';
import { MixSession, type MixChoice, type MixResult } from './mix-session';
import { renderConjugaisonHome } from './home';
import { LearnSession, type LearnResult } from './learn-session';
import type { ConjugationQuestion } from './questions';
import { knownCount, promotedCount, ReviewSession, type ReviewResult } from './review-session';
import { CONJUGATIONS, type Conjugation, type TenseId } from './verbs';

const MESSAGES: Record<LearnResult['stars'], string> = {
  0: 'Continue, chaque essai te fait progresser !',
  1: 'Bien joué ! Encore un effort pour tout trouver.',
  2: 'Tout juste ! Plus vite pour la 3ᵉ étoile.',
  3: 'Parfait : tout juste et rapide !',
};

/** « j’ai chanté », « nous chantons » : pas d'espace après « j’ ». */
const sentence = (q: ConjugationQuestion) => `${q.prompt}${q.prompt.endsWith('’') ? '' : ' '}${q.answer}`;

// Étapes 3 et 4 (voir .ai/analyse/10-conjugaison.md) : accueil par temps, « Apprendre », « Révision » et « Mélange ».
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

    const load = () => readConjugaisonData(ctx.load());

    // Chaque réponse range la forme dans sa boîte, tout de suite : rien n'est perdu si elle arrête en cours.
    const onFirstAttempt = (attempt: Attempt<ConjugationQuestion>) => {
      const data = load();
      recordAttempt(data, attempt);
      ctx.save(data);
    };

    const home = () => show(() => renderConjugaisonHome(root, ctx, load(), { onLearn: learn, onTense: chooseTense, onReview: review, onMix: mixChoice }));

    const chooseTense = (tense: TenseId) => {
      const data = load();
      data.tense = tense;
      ctx.save(data);
      home();
    };

    const learn = (conjugation: Conjugation) =>
      show(() => {
        const session = new LearnSession(conjugation, { onFirstAttempt });
        return renderQuestionScreen(root, {
          session,
          label: `${conjugation.verb.infinitive} · ${conjugation.tense.label}`,
          input: 'letters',
          onQuit: home,
          onDone: () => showResult(conjugation, session.result()),
        });
      });

    const review = () =>
      show(() => {
        const before = load().leitner;
        const session = new ReviewSession(before, { onFirstAttempt });
        return renderQuestionScreen(root, {
          session,
          label: 'Révision',
          input: 'letters',
          onQuit: home,
          onDone: () => showReviewResult(session.result(), before),
        });
      });

    // Première fois : le temps de l'onglet ouvert est déjà coché.
    const mixChoice = () =>
      show(() => {
        const data = load();
        const initial = data.mix ?? { tenses: [data.tense ?? 'present'], verbs: [] };
        renderMixChoice(root, ctx, initial, { onStart: mix, onBack: home });
      });

    const mix = (choice: MixChoice) =>
      show(() => {
        const data = load();
        data.mix = choice;
        ctx.save(data);
        const session = new MixSession(choice, { onFirstAttempt });
        return renderQuestionScreen(root, {
          session,
          label: 'Mélange',
          input: 'letters',
          onQuit: home,
          onDone: () => showMixResult(choice, session.result()),
        });
      });

    function showMixResult(choice: MixChoice, result: MixResult) {
      const all = result.correct === result.total;
      show(() =>
        renderResult(root, {
          title: 'Mélange',
          celebrate: all,
          highlight: h(
            'p',
            { class: 'big-count' },
            h('strong', {}, `${result.correct} / ${result.total}`),
            h('small', {}, 'du premier coup'),
          ),
          message: all ? 'Tout juste, bravo !' : 'Continue, chaque essai te fait progresser !',
          toPractice: result.toPractice.map((q) => `${sentence(q)} (${q.context})`),
          actions: [
            { label: 'Rejouer', primary: true, onClick: () => mix(choice) },
            { label: 'Autres verbes', onClick: mixChoice },
            { label: 'Conjugaison', onClick: home },
          ],
        }),
      );
    }

    function showReviewResult(result: ReviewResult, before: LeitnerState) {
      const after = load().leitner;
      // Ce qui a bougé pendant cette révision : visible dès la première fois,
      // alors qu'un verbe-temps n'est « connu » qu'après plusieurs révisions.
      const promoted = promotedCount(before, after);
      const known = knownCount(after);
      show(() =>
        renderResult(root, {
          title: 'Révision',
          celebrate: result.correct === result.total,
          highlight: h(
            'p',
            { class: 'big-count' },
            h('strong', {}, String(promoted)),
            h('small', {}, promoted > 1 ? 'formes montent d’une boîte' : 'forme monte d’une boîte'),
          ),
          message:
            `${result.correct} sur ${result.total} du premier coup.` +
            (known > 0 ? ` Tu connais ${known} verbe${known > 1 ? 's' : ''} sur ${CONJUGATIONS.length} (un verbe à un temps).` : ''),
          toPractice: result.toPractice.map((q) => `${sentence(q)} (${q.context})`),
          actions: [
            { label: 'Encore une révision', primary: true, onClick: review },
            { label: 'Conjugaison', onClick: home },
          ],
        }),
      );
    }

    function showResult(conjugation: Conjugation, result: LearnResult) {
      const data = load();
      const record = result.stars > 0 && recordStars(data, conjugation, result.stars);
      if (record) ctx.save(data);
      show(() =>
        renderResult(root, {
          title: `${conjugation.verb.infinitive} · ${conjugation.tense.label}`,
          highlight: stars(result.stars, 3, 'large'),
          record,
          celebrate: record || result.stars === 3,
          message: `${result.correct} sur ${result.total} du premier coup. ${MESSAGES[result.stars]}`,
          toPractice: result.toPractice.map(sentence),
          actions: [
            { label: 'Rejouer', primary: true, onClick: () => learn(conjugation) },
            { label: 'Conjugaison', onClick: home },
          ],
        }),
      );
    }

    home();
    return () => cleanup?.();
  },
};
