import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig(({ mode }) => {
  // Load env vars from root directory first, then app directory (app takes precedence)
  const rootEnv = loadEnv(mode, resolve(__dirname, '../..'), '')
  const appEnv = loadEnv(mode, __dirname, '')

  // Merge: root env first, then app env (app-specific overrides root)
  // Only VITE_ prefixed vars are exposed to client code
  const env = { ...rootEnv, ...appEnv }

  // Make merged env vars available to Vite
  Object.keys(env).forEach((key) => {
    if (key.startsWith('VITE_')) {
      process.env[key] = env[key]
    }
  })

  return {
    // Tell Vite to also look for .env files in the root directory
    envDir: resolve(__dirname, '../..'),
    optimizeDeps: {
      include: ['use-sync-external-store/shim/index.js'],
      // Exclude @axori/db from client-side bundling (it uses Node.js modules)
      exclude: ['@axori/db'],
    },
    ssr: {
      // Externalize @axori/db for SSR (it uses Node.js modules like path, fs)
      noExternal: [],
      external: ['@axori/db'],
    },
    define: {
      'process.env': {},
    },
    build: {
      // Rollup options to externalize @axori/db in client builds
      rollupOptions: {
        external: (id) => {
          // Externalize @axori/db main export (uses Node.js modules)
          // But allow @axori/db/types (types-only, safe for client)
          if (id === '@axori/db') {
            return true;
          }
          // Allow types-only import (no runtime code)
          if (id === '@axori/db/types') {
            return false;
          }
          return false;
        },
      },
    },
    plugins: [
      // Node.js polyfills (minimal - only what we need)
      nodePolyfills({
        // Only enable Buffer polyfill (what we actually need)
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        // Don't polyfill modules we don't need (avoids CommonJS issues)
        exclude: [
          'fs',
          'path',
          'url',
          'stream',
          'util',
          'crypto',
          'http',
          'https',
          'os',
          'zlib',
          'events',
          'net',
          'tls',
          'child_process',
          'dgram',
          'dns',
          'readline',
          'repl',
          'querystring',
          'string_decoder',
          'timers',
          'tty',
          'vm',
        ],
        // Don't use protocol imports (causes issues)
        protocolImports: false,
      }),
      devtools(),
      nitro(),
      // this is the plugin that enables path aliases
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})
