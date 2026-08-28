import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@core': r('./src/core'),
      '@data': r('./src/data'),
      '@game': r('./src/game'),
      '@ui': r('./src/ui'),
      '@platform': r('./src/platform'),
      '@sim': r('./src/sim'),
    },
  },
  server: { host: true },
  preview: { host: true },
  build: {
    // Телефоны живут дольше десктопов: es2022 отсекает Safari 15 и
    // добрую часть андроидных вебвью, на которых страница просто
    // не парсится и остаётся чёрной.
    target: ['es2019', 'safari13', 'chrome80'],
    outDir: 'dist',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
