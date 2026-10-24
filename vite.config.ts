import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// Identifiant unique de chaque build : le commit sur GitHub, l'heure en local.
const build = process.env.GITHUB_SHA?.slice(0, 7) ?? `local-${Date.now().toString(36)}`;

/** Publie version.json : la fenêtre de mise à jour y lit le numéro de la nouvelle version. */
function versionFile(): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version, build }),
      });
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages sert le site sous /MultiAppliKation/ (et `vite preview` sert ce même build).
  base: command === 'build' || isPreview ? '/MultiAppliKation/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_BUILD__: JSON.stringify(build),
  },
  plugins: [
    versionFile(),
    VitePWA({
      // La nouvelle version attend que l'on touche « Mettre à jour » (src/core/version.ts).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'MultiAppliKation',
        short_name: 'MultiAppli',
        description: 'Apprendre en jouant : les tables de multiplication.',
        lang: 'fr',
        display: 'standalone',
        theme_color: '#fff8ec',
        background_color: '#fff8ec',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tout le nécessaire pour jouer hors ligne. version.json n'y est pas : il doit venir du réseau.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
}));
