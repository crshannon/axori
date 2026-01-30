import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // Bundle internal workspace packages
  noExternal: ["@axori/db", "@axori/shared", "@axori/permissions"],
  // Keep these external - pnpm symlinks cause resolution issues during bundling
  external: [
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "drizzle-orm/postgres-js",
    "postgres",
    "react",
    "react/jsx-runtime",
    "react-dom",
    "@react-email/components",
    "@react-email/render",
  ],
});
