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
];
