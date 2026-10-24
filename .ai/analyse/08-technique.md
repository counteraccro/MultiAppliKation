# Technique

## Pile

- Vite + TypeScript, sans framework (projet petit).
- Code en anglais, commentaires en français possibles.

## PWA

- Manifeste (nom « MultiAppliKation », nom court « MultiAppli », plein écran).
- Icône `apple-touch-icon` pour iOS.
- Service worker pour le hors ligne (vite-plugin-pwa).
- Installation : Safari → Partager → « Sur l'écran d'accueil ».

## Hébergement

- GitHub Pages (gratuit, HTTPS, obligatoire pour le service worker),
  depuis le dépôt counteraccro/MultiAppliKation.

## Limites iOS

- Pas de vibration (Safari ne la permet pas).
- Sons (plus tard) : ne jouent qu'après un premier appui.
- Bloquer le zoom au double appui sur le pavé.
- Stockage séparé entre Safari et l'app installée (voir 06-profils-donnees.md).
