# Mesure d'audience

Décidé le 31/10/2026 : savoir combien de personnes utilisent l'appli et ce qu'elles y font,
**sans rien savoir de qui elles sont**. Les utilisateurs sont des enfants.

## Outil

- **GoatCounter** (gratuit pour un usage non commercial, sans cookie, n'enregistre pas l'adresse IP).
- Compte : https://couteraccro.goatcounter.com (code `couteraccro`,
  à changer dans `src/core/analytics.ts` si le compte porte un autre nom).
- Pas de script tiers : l'appli appelle elle-même `…/count` avec une petite image.
- Rien ne part en développement, pendant les tests, ni hors ligne.

## Ce qui est envoyé

| Moment | Chemin | Exemple |
|---|---|---|
| « Qui joue ? » | `/` | |
| Nouveau profil | `/nouveau-profil` | |
| « À quoi on joue ? » | `/activites` | |
| Mon profil | `/profil` | |
| Ouverture d'une activité | `/<id de l'activité>` | `/tables` |
| Même moment, évènement | `<activité>/<classe>` | `tables/CM1` |

GoatCounter y ajoute de lui-même : navigateur, système, taille d'écran, pays, site d'où l'on vient.

**Jamais envoyé** : prénom, couleur, résultats, étoiles, ceintures, identifiant de profil.

## Ne pas compter un appareil

Pour ne pas se compter soi-même (ou un appareil de test) : ouvrir l'appli avec
`https://counteraccro.github.io/MultiAppliKation/#ne-pas-compter`.
L'appareil est marqué (clé `skipgc`, la même que le script officiel de GoatCounter).
`#compter` le démarque. Sur iOS, l'app installée a son propre stockage :
le marquage dans Safari ne vaut pas pour elle.

## Cadre (CNIL)

Mesure d'audience exemptée de consentement : pas de cookie, données anonymes,
seulement des statistiques pour le site lui-même. Il faudra tout de même **informer**
(une phrase dans le README ou une page « À propos »).

## Plus tard, si besoin

- Les écrans à l'intérieur des activités (modes, matières des Ceintures).
- Savoir si l'appli est installée sur l'écran d'accueil ou ouverte dans le navigateur.
- Par école ou par classe : un code saisi par la maîtresse, toujours sans prénom.
