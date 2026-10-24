import { renderQuestionScreen } from '../../components/question-screen';
import { renderResult } from '../../components/result';
import { stars } from '../../components/stars';
import type { Activity, ActivityContext } from '../types';
import { readTablesData, recordStars } from './data';
import { renderTablesHome } from './home';
import { LearnSession, type LearnResult } from './learn-session';

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

    const home = () => show(() => renderTablesHome(root, ctx, readTablesData(ctx.load()), learn));

    const learn = (table: number) =>
      show(() => {
        const session = new LearnSession(table);
        return renderQuestionScreen(root, {
          session,
          label: `Table de ${table}`,
          onQuit: home,
          onDone: () => showLearnResult(ctx, table, session.result()),
        });
      });

    function showLearnResult(ctx: ActivityContext, table: number, result: LearnResult) {
      const data = readTablesData(ctx.load());
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

    home();
    return () => cleanup?.();
  },
};
