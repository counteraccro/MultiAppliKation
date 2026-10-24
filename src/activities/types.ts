import type { ProfileStore } from '../core/profiles';
import type { Profile } from '../core/storage';

export interface ActivityContext {
  profile: Profile;
  /** Progression de cette activité pour ce profil (undefined au premier lancement). */
  load<T>(): T | undefined;
  save<T>(data: T): void;
  /** Retour au choix de l'activité. */
  exit(): void;
}

/** Une activité est un module à part : ses écrans, ses règles, ses données. */
export interface Activity {
  /** Identifiant stable : c'est la clé de ses données dans le profil. Ne jamais le changer. */
  id: string;
  title: string;
  emoji: string;
  color: string;
  /** Affiche l'activité dans `root`. Peut renvoyer une fonction de nettoyage. */
  mount(root: HTMLElement, ctx: ActivityContext): void | (() => void);
}

export function createActivityContext(
  store: ProfileStore,
  profile: Profile,
  activity: Activity,
  exit: () => void,
): ActivityContext {
  return {
    profile,
    load: <T>() => store.getActivityData<T>(profile.id, activity.id),
    save: <T>(data: T) => store.setActivityData(profile.id, activity.id, data),
    exit,
  };
}
