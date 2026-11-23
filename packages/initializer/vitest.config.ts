import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.tsx',
      'tests/e2e/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/__tests__/**',
        'src/types/**',
        'src/**/index.ts',
        'src/cli.tsx',
        'src/ui/**',
      ],
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 75,
        branches: 75,
      },
    },
  },
});
