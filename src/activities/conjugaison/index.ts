import { renderQuestionScreen } from '../../components/question-screen';
import { renderResult } from '../../components/result';
import { stars } from '../../components/stars';
import type { Attempt } from '../../core/series';
import type { Activity } from '../types';
import { readConjugaisonData, recordAttempt, recordStars } from './data';
import { renderConjugaisonHome } from './home';
import { LearnSession, type LearnResult } from './learn-session';
import type { ConjugationQuestion } from './questions';
import type { Conjugation, TenseId } from './verbs';

const MESSAGES: Record<LearnResult['stars'], string> = {
  0: 'Continue, chaque essai te fait progresser !',
  1: 'Bien joué ! Encore un effort pour tout trouver.',
  2: 'Tout juste ! Plus vite pour la 3ᵉ étoile.',
  3: 'Parfait : tout juste et rapide !',
};

/** « j’ai chanté », « nous chantons » : pas d'espace après « j’ ». */
const sentence = (q: ConjugationQuestion) => `${q.prompt}${q.prompt.endsWith('’') ? '' : ' '}${q.answer}`;

// Étape 3 (voir .ai/analyse/10-conjugaison.md) : accueil par temps et mode « Apprendre ».
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

    const home = () => show(() => renderConjugaisonHome(root, ctx, load(), { onLearn: learn, onTense: chooseTense }));

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
