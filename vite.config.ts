import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // GitHub Pages sert le site sous /MultiAppliKation/.
  base: command === 'build' ? '/MultiAppliKation/' : '/',
}));
