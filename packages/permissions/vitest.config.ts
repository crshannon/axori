import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Inline workspace dependencies so vitest can process TypeScript files
    server: {
      deps: {
        inline: ['@axori/db'],
      },
    },
  },
})
