import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

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
    },
    plugins: [
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
