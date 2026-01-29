//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";

export default [
  {
    ignores: [
      ".output/**",
      "dist/**",
      "build/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts",
    ],
  },
  ...tanstackConfig,
  {
    // Relax some strict rules for Forge agent code (new/experimental)
    files: ["src/lib/agents/**/*.ts", "src/lib/github/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
    },
  },
  {
    // Relax optional chain checks for components
    files: ["src/components/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
];
