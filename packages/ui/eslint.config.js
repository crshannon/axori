// @ts-check

import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const tailwindEntryPoint = resolve(__dirname, '../../apps/web/src/styles.css')

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'better-tailwindcss': betterTailwindcss,
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: tailwindEntryPoint,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'no-console': 'warn',
      // Tailwind CSS v4 rules from eslint-plugin-better-tailwindcss
      // See: https://github.com/schoero/eslint-plugin-better-tailwindcss
      ...betterTailwindcss.configs.recommended.rules,
    },
  },
]
