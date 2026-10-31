import { createActivityContext } from './activities/types';
import { findActivity } from './activities';
import { trackEvent, trackScreen } from './core/analytics';
import { GRADE_LABELS } from './core/grades';
import type { ProfileStore } from './core/profiles';
import { renderActivityChoice } from './screens/activity-choice';
import { renderChooseGrade } from './screens/choose-grade';
import { renderEditProfile } from './screens/edit-profile';
import { renderNewProfile } from './screens/new-profile';
import { renderWhoPlays } from './screens/who-plays';

// Parcours : Qui joue ? → choix de l'activité → l'activité.
export type Route =
  | { name: 'who-plays' }
  | { name: 'new-profile' }
  | { name: 'activity-choice'; profileId: string }
  | { name: 'edit-profile'; profileId: string }
  | { name: 'activity'; profileId: string; activityId: string };

export interface App {
  store: ProfileStore;
  go(route: Route): void;
}

export function startApp(root: HTMLElement, store: ProfileStore): App {
  let cleanup: (() => void) | void;

  const app: App = {
    store,
    go(route) {
      cleanup?.();
      cleanup = undefined;
      root.replaceChildren();
      window.scrollTo(0, 0);
      cleanup = render(route);
      track(route);
    },
  };

  // Mesure anonyme : l'écran, et pour une activité la classe, jamais le prénom.
  function track(route: Route): void {
    switch (route.name) {
      case 'who-plays':
        return trackScreen('/', 'Qui joue ?');
      case 'new-profile':
        return trackScreen('/nouveau-profil', 'Nouveau profil');
      case 'activity-choice':
        return trackScreen('/activites', 'À quoi on joue ?');
      case 'edit-profile':
        return trackScreen('/profil', 'Mon profil');
      case 'activity': {
        const activity = findActivity(route.activityId);
        if (!activity) return;
        trackScreen(`/${activity.id}`, activity.title);
        const grade = store.get(route.profileId)?.grade;
        if (grade) trackEvent(`${activity.id}/${grade}`, `${activity.title} en ${GRADE_LABELS[grade]}`);
        return;
      }
    }
  }

  function render(route: Route): (() => void) | void {
    switch (route.name) {
      case 'who-plays':
        return renderWhoPlays(root, app);
      case 'new-profile':
        return renderNewProfile(root, app);
      case 'activity-choice': {
        const profile = store.get(route.profileId);
        if (!profile) return render({ name: 'who-plays' });
        // Profil d'avant la classe : on la demande une fois avant de jouer.
        if (!profile.grade) return renderChooseGrade(root, app, profile);
        return renderActivityChoice(root, app, profile);
      }
      case 'edit-profile': {
        const profile = store.get(route.profileId);
        if (!profile) return render({ name: 'who-plays' });
        return renderEditProfile(root, app, profile);
      }
      case 'activity': {
        const profile = store.get(route.profileId);
        const activity = findActivity(route.activityId);
        if (!profile || !activity) return render({ name: 'who-plays' });
        const exit = () => app.go({ name: 'activity-choice', profileId: profile.id });
        return activity.mount(root, createActivityContext(store, profile, activity, exit));
      }
    }
  }

  app.go({ name: 'who-plays' });
  return app;
}
