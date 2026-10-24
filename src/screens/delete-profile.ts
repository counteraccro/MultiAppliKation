import { openAdultCheck } from '../components/adult-check';
import type { Profile } from '../core/storage';

/**
 * Suppression protégée : pour qu'un enfant n'efface pas la progression d'un autre,
 * il faut résoudre une multiplication d'adulte.
 */
export function openDeleteProfile(root: HTMLElement, profile: Profile, onConfirm: () => void): void {
  openAdultCheck(
    root,
    {
      title: `Supprimer le profil de ${profile.name} ?`,
      message: 'Toute sa progression sera effacée.',
      confirmLabel: 'Supprimer',
      danger: true,
    },
    onConfirm,
  );
}
