import type { App } from '../app';
import { openAdultCheck } from '../components/adult-check';
import { createProfileForm } from '../components/profile-form';
import { topbar } from '../components/topbar';
import { h } from '../core/dom';
import { GRADE_LABELS } from '../core/grades';
import type { Profile } from '../core/storage';
import { openDeleteProfile } from './delete-profile';

/**
 * Modifier son profil : prénom et couleur librement ; la classe seulement avec un adulte,
 * pour qu'elle ne descende pas d'une classe pour avoir plus facile.
 */
export function renderEditProfile(root: HTMLElement, app: App, profile: Profile): void {
  const back = () => app.go({ name: 'activity-choice', profileId: profile.id });

  const form = createProfileForm({
    initial: { name: profile.name, color: profile.color, grade: profile.grade },
    submitLabel: 'Enregistrer',
    validateName: (name) => app.store.validateName(name, profile.id),
    onSubmit(values) {
      const save = () => {
        app.store.update(profile.id, values);
        back();
      };
      if (profile.grade === undefined || values.grade === profile.grade) return save();
      openAdultCheck(
        root,
        {
          title: 'Changer de classe ?',
          message: `${profile.name} passe de ${GRADE_LABELS[profile.grade]} à ${GRADE_LABELS[values.grade]} : les questions s'adaptent, la progression reste.`,
          confirmLabel: 'Changer',
        },
        save,
      );
    },
  });

  const remove = () =>
    openDeleteProfile(root, profile, () => {
      app.store.remove(profile.id);
      app.go({ name: 'who-plays' });
    });

  root.append(
    h(
      'section',
      { class: 'screen' },
      topbar('Retour', back),
      h('h1', { class: 'title' }, 'Mon profil'),
      form.el,
      h('button', { class: 'link-danger', type: 'button', onclick: remove }, 'Supprimer ce profil (adulte)'),
    ),
  );
}
