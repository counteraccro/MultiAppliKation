import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Icônes générées depuis public/icon.svg : `npm run icons`.
// Le SVG remplit déjà tout le carré (fond compris) : aucune marge ajoutée.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: { ...minimal2023Preset.maskable, padding: 0 },
    apple: { ...minimal2023Preset.apple, padding: 0 },
  },
  images: ['public/icon.svg'],
});
