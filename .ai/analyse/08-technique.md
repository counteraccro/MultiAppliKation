# Technique

## Pile

- Vite + TypeScript, sans framework (projet petit).
- Code en anglais, commentaires en français possibles.

## PWA

- Manifeste (nom « MultiAppliKation », nom court « MultiAppli », `standalone` :
  iOS ne connaît pas le vrai plein écran, `standalone` enlève déjà la barre de Safari).
- Icônes générées depuis `public/icon.svg` (`npm run icons`), dont `apple-touch-icon` pour iOS.
- Service worker pour le hors ligne (vite-plugin-pwa, mode `prompt`) :
  une nouvelle version attend le bouton « Mettre à jour » de la fenêtre obligatoire.
- Installation : Safari → Partager → « Sur l'écran d'accueil ».

## Hébergement

- GitHub Pages (gratuit, HTTPS, obligatoire pour le service worker),
  depuis le dépôt counteraccro/MultiAppliKation.

## Limites iOS

- Pas de vibration (Safari ne la permet pas).
- Sons (Web Audio) : ne jouent qu'après un premier appui, débloqués au premier toucher.
- Bloquer le zoom au double appui sur le pavé.
- Stockage séparé entre Safari et l'app installée (voir 06-profils-donnees.md).
