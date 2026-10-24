import { renderQuestionScreen } from '../../components/question-screen';
import { renderResult } from '../../components/result';
import { stars } from '../../components/stars';
import { h } from '../../core/dom';
import { boxOf, type LeitnerState } from '../../core/leitner';
import type { Attempt } from '../../core/series';
import { formatDuration } from '../../core/time';
import type { Activity } from '../types';
import { readTablesData, recordAttempt, recordDefi, recordMixTables, recordStars } from './data';
import { DefiSession, PENALTY_MS, type DefiResult } from './defi-session';
import { renderTablesHome } from './home';
import { LearnSession, type LearnResult } from './learn-session';
import { renderMixChoice } from './mix-choice';
import { MixSession, type MixResult } from './mix-session';
import { ALL_PAIRS, type Multiplication } from './questions';
import { knownCount, ReviewSession, type ReviewResult } from './review-session';

const MESSAGES: Record<LearnResult['stars'], string> = {
  0: 'Continue, chaque essai te fait progresser !',
  1: 'Bien joué ! Encore un effort pour tout trouver.',
  2: 'Tout juste ! Plus vite pour la 3ᵉ étoile.',
  3: 'Parfait : tout juste et rapide !',
};

export const tables: Activity = {
  id: 'tables',
  title: 'Les Tables',
  emoji: '×',
  color: '#4d96ff',
  mount(root, ctx) {
    let cleanup: (() => void) | void;

    // Navigation interne : accueil → série → résultat.
    function show(render: () => (() => void) | void) {
      cleanup?.();
      root.replaceChildren();
      window.scrollTo(0, 0);
      cleanup = render();
    }

    const load = () => readTablesData(ctx.load());

    // Chaque réponse, dans tous les modes, range la multiplication dans sa boîte.
    // Enregistré tout de suite : rien n'est perdu si l'enfant arrête en cours de série.
    const onFirstAttempt = (attempt: Attempt<Multiplication>) => {
      const data = load();
      recordAttempt(data, attempt);
      ctx.save(data);
    };

    const home = () => show(() => renderTablesHome(root, ctx, load(), { onLearn: learn, onReview: review, onDefi: defi, onMix: mixChoice }));

    const learn = (table: number) =>
      show(() => {
        const session = new LearnSession(table, { onFirstAttempt });
        return renderQuestionScreen(root, {
          session,
          label: `Table de ${table}`,
          onQuit: home,
          onDone: () => showLearnResult(table, session.result()),
        });
      });

    const review = () =>
      show(() => {
        const before = load().leitner;
        const session = new ReviewSession(before, { onFirstAttempt });
        return renderQuestionScreen(root, {
          session,
          label: 'Révision',
          onQuit: home,
          onDone: () => showReviewResult(session.result(), before),
        });
      });

    const defi = () =>
      show(() => {
        const session = new DefiSession({ onFirstAttempt });
        return renderQuestionScreen(root, {
          session,
          label: 'Défi',
          chrono: { penaltyMs: PENALTY_MS },
          wrongHint: `+${PENALTY_MS / 1000} s.`,
          onQuit: home,
          onDone: () => showDefiResult(session.result()),
        });
      });

    const mixChoice = () =>
      show(() => renderMixChoice(root, ctx, load().mixTables ?? [], { onStart: mix, onBack: home }));

    const mix = (chosen: number[]) =>
      show(() => {
        const data = load();
        recordMixTables(data, chosen);
        ctx.save(data);
        const session = new MixSession(chosen, { onFirstAttempt });
        return renderQuestionScreen(root, {
          session,
          label: 'Mélange',
          onQuit: home,
          onDone: () => showMixResult(chosen, session.result()),
        });
      });

    function showLearnResult(table: number, result: LearnResult) {
      const data = load();
      const record = result.stars > 0 && recordStars(data, table, result.stars);
      if (record) ctx.save(data);
      show(() =>
        renderResult(root, {
          title: `Table de ${table}`,
          highlight: stars(result.stars, 3, 'large'),
          record,
          message: `${result.correct} sur ${result.total} du premier coup. ${MESSAGES[result.stars]}`,
          toPractice: result.toPractice.map((q) => `${q.prompt} = ${q.answer}`),
          actions: [
            { label: 'Rejouer', primary: true, onClick: () => learn(table) },
            { label: 'Les tables', onClick: home },
          ],
        }),
      );
    }

    function showReviewResult(result: ReviewResult, before: LeitnerState) {
      const after = load().leitner;
      // Ce qui a bougé pendant cette révision : visible dès la première fois,
      // alors qu'une multiplication n'est « sue » qu'après plusieurs révisions.
      const promoted = ALL_PAIRS.filter((k) => boxOf(after, k) > boxOf(before, k)).length;
      const known = knownCount(after);
      show(() =>
        renderResult(root, {
          title: 'Révision',
          highlight: h(
            'p',
            { class: 'big-count' },
            h('strong', {}, String(promoted)),
            h('small', {}, promoted > 1 ? 'multiplications montent d’une boîte' : 'multiplication monte d’une boîte'),
          ),
          message:
            `${result.correct} sur ${result.total} du premier coup.` +
            (known > 0 ? ` Tu sais ${known} multiplication${known > 1 ? 's' : ''} sur ${ALL_PAIRS.length}.` : ''),
          toPractice: result.toPractice.map((q) => `${q.prompt} = ${q.answer}`),
          actions: [
            { label: 'Encore une révision', primary: true, onClick: review },
            { label: 'Les tables', onClick: home },
          ],
        }),
      );
    }

    function showDefiResult(result: DefiResult) {
      const data = load();
      const previous = data.defiRecordMs;
      const record = recordDefi(data, result.scoreMs);
      if (record) ctx.save(data);

      const penalties = result.errors * PENALTY_MS;
      const detail =
        result.errors === 0
          ? 'Aucune erreur !'
          : `${formatDuration(result.timeMs)} + ${result.errors} erreur${result.errors > 1 ? 's' : ''} (${formatDuration(penalties)})`;
      const message =
        previous === undefined
          ? 'Ton premier défi : c’est ton record à battre !'
          : record
            ? `Tu as battu ton record de ${formatDuration(previous - result.scoreMs)} !`
            : `Ton record : ${formatDuration(previous)}. Encore ${formatDuration(result.scoreMs - previous)} à gagner !`;

      show(() =>
        renderResult(root, {
          title: 'Défi',
          highlight: h('p', { class: 'big-count' }, h('strong', {}, formatDuration(result.scoreMs)), h('small', {}, detail)),
          record,
          message,
          toPractice: result.toPractice.map((q) => `${q.prompt} = ${q.answer}`),
          actions: [
            { label: 'Rejouer', primary: true, onClick: defi },
            { label: 'Les tables', onClick: home },
          ],
        }),
      );
    }

    function showMixResult(chosen: number[], result: MixResult) {
      const all = result.correct === result.total;
      show(() =>
        renderResult(root, {
          title: 'Mélange',
          highlight: h(
            'p',
            { class: 'big-count' },
            h('strong', {}, `${result.correct} / ${result.total}`),
            h('small', {}, 'du premier coup'),
          ),
          message: `${chosen.length > 1 ? 'Tables' : 'Table'} de ${chosen.join(', ')}. ` +
            (all ? 'Tout juste, bravo !' : 'Continue, chaque essai te fait progresser !'),
          toPractice: result.toPractice.map((q) => `${q.prompt} = ${q.answer}`),
          actions: [
            { label: 'Rejouer', primary: true, onClick: () => mix(chosen) },
            { label: 'Autres tables', onClick: mixChoice },
            { label: 'Les tables', onClick: home },
          ],
        }),
      );
    }

    home();
    return () => cleanup?.();
  },
};
