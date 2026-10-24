import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

// Identifiant unique de chaque build : le commit sur GitHub, l'heure en local.
const build = process.env.GITHUB_SHA?.slice(0, 7) ?? `local-${Date.now().toString(36)}`;

/** Publie version.json : l'app le relit pour savoir si une nouvelle version est en ligne. */
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
  plugins: [versionFile()],
}));
