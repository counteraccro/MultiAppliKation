# MultiAppliKation

Application pour apprendre en jouant. Première activité : les tables de multiplication de 1 à 10.

**👉 [Ouvrir l'application](https://counteraccro.github.io/MultiAppliKation/)**

## L'installer sur iPhone ou iPad

1. Ouvrir le lien ci-dessus dans **Safari**.
2. Toucher **Partager** (carré avec une flèche vers le haut).
3. Choisir **« Sur l'écran d'accueil »**, puis **Ajouter**.

Toujours lancer l'app depuis son icône : sur iOS, l'app installée et Safari
ont chacun leur stockage (les profils de l'un ne se voient pas dans l'autre).

Une fois ouverte une première fois, l'app fonctionne **hors ligne**.

## Développement

```sh
npm install
npm run dev      # serveur local
npm test         # tests
npm run build    # version de production dans dist/
npm run preview  # sert dist/ comme sur GitHub Pages (service worker compris)
npm run icons    # régénère les icônes depuis public/icon.svg
```

Chaque push sur `main` lance les tests et publie le site sur GitHub Pages.

## Versions

- Le numéro de version est celui de `package.json` (`npm version minor --no-git-tag-version`
  avant de publier une nouveauté). Il s'affiche en bas de l'écran « Qui joue ? ».
- Chaque publication porte aussi un identifiant unique (le commit), écrit dans `version.json`.
- Le service worker garde l'app pour le hors ligne et cherche une nouvelle publication
  au démarrage, quand l'app revient au premier plan et toutes les 30 minutes.
  S'il en trouve une, une fenêtre oblige à mettre à jour (« 0.4.0 → 0.5.0 »).
  La progression est gardée (elle est enregistrée à chaque réponse).

L'analyse du projet (décisions, pédagogie, étapes) est dans [`.ai/analyse`](.ai/analyse/README.md).
