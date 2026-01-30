import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode, command }) => {
  const isTest = process.env.VITEST || mode === "test";
  // Load env vars from root directory first, then app directory (app takes precedence)
  const rootEnv = loadEnv(mode, resolve(__dirname, "../.."), "");
  const appEnv = loadEnv(mode, __dirname, "");

  // Merge: root env first, then app env (app-specific overrides root)
  const env = { ...rootEnv, ...appEnv };

  // Make merged env vars available to Vite
  Object.keys(env).forEach((key) => {
    if (key.startsWith("VITE_")) {
      process.env[key] = env[key];
    }
  });

  return {
    envDir: resolve(__dirname, "../.."),
    optimizeDeps: {
      include: ["use-sync-external-store/shim/index.js", "@axori/permissions"],
      exclude: ["@axori/db"],
    },
    ssr: {
      noExternal: ["@axori/db", "@axori/permissions"],
      external: ["path", "fs", "dotenv"],
    },
    define: {
      "process.env": {},
    },
    build: {
      rollupOptions: {
        // Server-only modules that should not be in the client bundle
        // These contain Node.js-specific code (postgres driver, etc.)
        external: [
          "@axori/db",
          "postgres",
          "drizzle-orm",
        ],
      },
    },
    plugins: [
      {
        name: "ignore-node-modules-in-db",
        resolveId(id, importer) {
          if (
            (id === "path" ||
              id === "fs" ||
              id === "dotenv" ||
              id === "node:path" ||
              id === "node:fs") &&
            importer?.includes("@axori/db")
          ) {
            return { id, external: true };
          }
          return null;
        },
      },
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        exclude: [
          "fs",
          "path",
          "url",
          "stream",
          "util",
          "crypto",
          "http",
          "https",
          "os",
          "zlib",
          "events",
          "net",
          "tls",
          "child_process",
          "dgram",
          "dns",
          "readline",
          "repl",
          "querystring",
          "string_decoder",
          "timers",
          "tty",
          "vm",
        ],
        protocolImports: false,
      }),
      devtools(),
      // Exclude nitro during tests - it has compatibility issues with vitest
      !isTest && nitro(),
      viteTsConfigPaths({
        projects: ["./tsconfig.json"],
      }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  };
});
