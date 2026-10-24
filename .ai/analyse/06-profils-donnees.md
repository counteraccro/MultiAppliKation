# Profils et données

## Profils

- Plusieurs profils sur un même appareil.
- Création : un prénom + une couleur (ou un avatar).
- Profils **communs à toutes les activités** ; chaque activité range sa
  progression dans le profil (étoiles, boîtes, records…).
- Suppression protégée, pour qu'un enfant n'efface pas la progression d'un autre :
  appui long, ou une multiplication « d'adulte » à résoudre.

## Où sont les données

- Dans `localStorage`, **sur l'appareil**.
- Sur iOS, l'app de l'écran d'accueil et Safari ont **chacun leur stockage** :
  toujours lancer l'app depuis son icône.
- Safari efface les données d'un site non visité depuis 7 jours,
  mais une app ajoutée à l'écran d'accueil n'est pas concernée.

## Entre appareils

Décision : **un appareil par enfant**. Pas de synchronisation.
En réserve si besoin : export / import d'un profil (code ou fichier).

## Format

- Les données sauvegardées portent un **numéro de version**, pour qu'un ajout
  (nouvelle activité, nouveau champ) ne fasse perdre aucune progression.
- Chaque activité a sa propre partie, sous son identifiant
  (par exemple `tables`).
