import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // Bundle workspace dependencies to avoid import issues
  noExternal: ["@axori/db", "@axori/shared", "@axori/permissions"],
  // Keep these as external - they'll be installed as runtime dependencies
  external: [
    "drizzle-orm",
    "drizzle-orm/*",
    "postgres",
    "react",
    "react/jsx-runtime",
    "react-dom",
    "@react-email/components",
  ],
});
