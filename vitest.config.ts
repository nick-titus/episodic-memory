import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 90000, // 90 seconds for embedding/indexing tests (model download on first run)
  },
});
