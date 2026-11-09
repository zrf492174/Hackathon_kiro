import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/Hackathon_kiro/',
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
