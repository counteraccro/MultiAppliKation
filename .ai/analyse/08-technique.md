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
- « Chercher une mise à jour » (bas de « Qui joue ? ») : sur iPhone, l'app installée peut
  rester en veille et ne jamais voir la nouvelle version (un enfant n'a pas eu la Grammaire).
  Le lien compare `version.json` au build en cours ; si c'est différent, il relance la recherche
  (fenêtre habituelle), et si rien n'arrive en 10 s, il efface service worker et caches puis
  recharge. La progression (localStorage) n'est pas touchée.
- Installation : Safari → Partager → « Sur l'écran d'accueil ».

## Hébergement

- GitHub Pages (gratuit, HTTPS, obligatoire pour le service worker),
  depuis le dépôt counteraccro/MultiAppliKation.
- Mesure d'audience : GoatCounter, sans cookie (voir 17-mesure-audience.md).

## Limites iOS

- Pas de vibration (Safari ne la permet pas).
- Sons (Web Audio) : ne jouent qu'après un premier appui, débloqués au premier toucher.
- Bloquer le zoom au double appui sur le pavé.
- Stockage séparé entre Safari et l'app installée (voir 06-profils-donnees.md).
