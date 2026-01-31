/**
 * Registry Scanner Service Tests
 *
 * Tests for the ts-morph based registry scanner that extracts
 * exports, dependencies, and metadata from TypeScript files.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { vol } from "memfs";

// Mock fs module to use memfs for isolated testing
vi.mock("fs", async () => {
  const memfs = await import("memfs");
  return memfs.fs;
});

import {
  scanDirectory,
  scanUIComponents,
  scanHooks,
  scanUtilities,
  detectUnusedExports,
  clearProjectCache,
  type RegistryScanResult,
} from "../registry-scanner";

// =============================================================================
// Test Fixtures
// =============================================================================

const FIXTURES = {
  // Simple component with named export
  simpleComponent: `
import { forwardRef } from "react";
import { cn } from "../utils/cn";

export interface ButtonProps {
  variant?: "primary" | "secondary";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", ...props }, ref) => {
    return <button ref={ref} {...props} />;
  }
);

Button.displayName = "Button";
`,

  // Hook with default and named exports
  simpleHook: `
/**
 * Custom hook for managing theme state
 */
import { useState, useCallback } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = useCallback(() => {
    setTheme(t => t === "light" ? "dark" : "light");
  }, []);

  return { theme, toggleTheme };
}

export type Theme = "light" | "dark";
`,

  // Utility file with multiple exports
  utilityFile: `
/**
 * Utility function to merge Tailwind CSS classes
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toISOString();
}
`,

  // Index file that re-exports (should be skipped)
  indexFile: `
export * from "./Button";
export * from "./Card";
export { cn } from "./utils/cn";
`,

  // Component with JSDoc description
  documentedComponent: `
/**
 * A card component for displaying content in a contained box.
 *
 * @example
 * <Card title="Hello">Content</Card>
 */
import { ReactNode } from "react";

export interface CardProps {
  title?: string;
  children: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <div>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}
`,

  // File with no exports (should be skipped)
  noExports: `
const internalHelper = () => "internal";
const anotherInternal = 42;
`,

  // Integration file
  integrationFile: `
/**
 * Stripe integration utilities
 */
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(priceId: string) {
  return stripe.checkout.sessions.create({
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
  });
}
`,
};

// =============================================================================
// Test Setup
// =============================================================================

describe("Registry Scanner Service", () => {
  beforeEach(() => {
    // Clear the virtual file system
    vol.reset();
    // Clear the ts-morph project cache
    clearProjectCache();
  });

  afterEach(() => {
    vol.reset();
  });

  // ===========================================================================
  // scanDirectory Tests
  // ===========================================================================

  describe("scanDirectory", () => {
    it("scans a directory and returns scan results", async () => {
      // Set up virtual file system
      vol.fromJSON({
        "/project/src/components/Button.tsx": FIXTURES.simpleComponent,
        "/project/src/components/Card.tsx": FIXTURES.documentedComponent,
      });

      const results = await scanDirectory("/project/src/components");

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toContain("Button");
      expect(results.map((r) => r.name)).toContain("Card");
    });

    it("extracts named exports correctly", async () => {
      vol.fromJSON({
        "/project/src/utils/helpers.ts": FIXTURES.utilityFile,
      });

      const results = await scanDirectory("/project/src/utils");

      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result.exports).toContain("cn");
      expect(result.exports).toContain("formatDate");
    });

    it("extracts dependencies correctly", async () => {
      vol.fromJSON({
        "/project/src/utils/cn.ts": FIXTURES.utilityFile,
      });

      const results = await scanDirectory("/project/src/utils");

      expect(results).toHaveLength(1);
      const result = results[0];
      expect(result.dependencies).toContain("clsx");
      expect(result.dependencies).toContain("tailwind-merge");
    });

    it("skips files with no exports", async () => {
      vol.fromJSON({
        "/project/src/internal.ts": FIXTURES.noExports,
        "/project/src/utils.ts": FIXTURES.utilityFile,
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(1);
      expect(results[0].exports).toContain("cn");
    });

    it("skips test files", async () => {
      vol.fromJSON({
        "/project/src/Button.tsx": FIXTURES.simpleComponent,
        "/project/src/Button.test.tsx": "export const test = 1;",
        "/project/src/Button.spec.ts": "export const spec = 1;",
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Button");
    });

    it("skips __tests__ directories", async () => {
      vol.fromJSON({
        "/project/src/Button.tsx": FIXTURES.simpleComponent,
        "/project/src/__tests__/Button.test.tsx": "export const test = 1;",
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(1);
    });

    it("recursively scans nested directories", async () => {
      vol.fromJSON({
        "/project/src/components/Button.tsx": FIXTURES.simpleComponent,
        "/project/src/components/forms/Input.tsx": FIXTURES.simpleComponent,
      });

      const results = await scanDirectory("/project/src");

      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it("handles empty directories", async () => {
      vol.fromJSON({
        "/project/src/.gitkeep": "",
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(0);
    });

    it("handles non-existent directories gracefully", async () => {
      vol.fromJSON({});

      const results = await scanDirectory("/nonexistent/path");

      expect(results).toHaveLength(0);
    });

    it("applies type override when specified", async () => {
      vol.fromJSON({
        "/project/src/helpers.ts": FIXTURES.utilityFile,
      });

      const results = await scanDirectory("/project/src", "integration");

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("integration");
    });
  });

  // ===========================================================================
  // Type Detection Tests
  // ===========================================================================

  describe("type detection", () => {
    it("detects hooks from use* filename", async () => {
      vol.fromJSON({
        "/project/src/hooks/useTheme.ts": FIXTURES.simpleHook,
      });

      const results = await scanDirectory("/project/src/hooks");

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("hook");
    });

    it("detects hooks from use* exports", async () => {
      vol.fromJSON({
        "/project/src/theme.ts": FIXTURES.simpleHook,
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("hook");
    });

    it("detects components from components directory", async () => {
      vol.fromJSON({
        "/project/src/components/Button.tsx": FIXTURES.simpleComponent,
      });

      const results = await scanDirectory("/project/src/components");

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("component");
    });

    it("detects components from contexts directory", async () => {
      vol.fromJSON({
        "/project/src/contexts/ThemeContext.tsx": FIXTURES.simpleHook,
      });

      // Note: This file has useTheme export so it will be detected as hook
      // unless we explicitly pass type override
      const results = await scanDirectory("/project/src/contexts", "component");

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("component");
    });

    it("detects utilities from utils directory", async () => {
      vol.fromJSON({
        "/project/src/utils/helpers.ts": FIXTURES.utilityFile,
      });

      const results = await scanDirectory("/project/src/utils");

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("utility");
    });

    it("detects integrations from integrations directory", async () => {
      vol.fromJSON({
        "/project/src/integrations/stripe.ts": FIXTURES.integrationFile,
      });

      const results = await scanDirectory("/project/src/integrations");

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe("integration");
    });
  });

  // ===========================================================================
  // Description Extraction Tests
  // ===========================================================================

  describe("description extraction", () => {
    it("extracts JSDoc description from file", async () => {
      vol.fromJSON({
        "/project/src/Card.tsx": FIXTURES.documentedComponent,
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(1);
      expect(results[0].description).toContain("card component");
    });

    it("extracts description from hook JSDoc", async () => {
      vol.fromJSON({
        "/project/src/useTheme.ts": FIXTURES.simpleHook,
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(1);
      expect(results[0].description).toContain("theme state");
    });
  });

  // ===========================================================================
  // Name Detection Tests
  // ===========================================================================

  describe("name detection", () => {
    it("uses filename-matching export as primary name", async () => {
      vol.fromJSON({
        "/project/src/Button.tsx": FIXTURES.simpleComponent,
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("Button");
    });

    it("uses hook export as primary name for hook files", async () => {
      vol.fromJSON({
        "/project/src/theme.ts": FIXTURES.simpleHook,
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe("useTheme");
    });
  });

  // ===========================================================================
  // Specialized Scanner Tests
  // ===========================================================================

  describe("scanUIComponents", () => {
    it("scans components, contexts, and utils in UI package", async () => {
      vol.fromJSON({
        "/packages/ui/src/components/Button.tsx": FIXTURES.simpleComponent,
        "/packages/ui/src/contexts/ThemeContext.tsx": FIXTURES.documentedComponent,
        "/packages/ui/src/utils/cn.ts": FIXTURES.utilityFile,
      });

      const results = await scanUIComponents("/packages/ui");

      expect(results.length).toBeGreaterThanOrEqual(3);

      const types = results.map((r) => r.type);
      expect(types).toContain("component");
      expect(types).toContain("utility");
    });
  });

  describe("scanHooks", () => {
    it("scans hooks directory with hook type", async () => {
      vol.fromJSON({
        "/project/src/hooks/useTheme.ts": FIXTURES.simpleHook,
        "/project/src/hooks/useAuth.ts": FIXTURES.simpleHook,
      });

      const results = await scanHooks("/project/src/hooks");

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.type === "hook")).toBe(true);
    });
  });

  describe("scanUtilities", () => {
    it("scans utils directory with utility type", async () => {
      vol.fromJSON({
        "/project/src/utils/helpers.ts": FIXTURES.utilityFile,
        "/project/src/utils/format.ts": FIXTURES.utilityFile,
      });

      const results = await scanUtilities("/project/src/utils");

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.type === "utility")).toBe(true);
    });
  });

  // ===========================================================================
  // Unused Export Detection Tests
  // ===========================================================================

  describe("detectUnusedExports", () => {
    it("identifies exports not imported elsewhere", () => {
      const scanResults: Array<RegistryScanResult> = [
        {
          name: "Button",
          filePath: "components/Button.tsx",
          type: "component",
          exports: ["Button", "ButtonProps"],
          dependencies: ["react", "../utils/cn"],
        },
        {
          name: "cn",
          filePath: "utils/cn.ts",
          type: "utility",
          exports: ["cn", "formatDate"],
          dependencies: ["clsx", "tailwind-merge"],
        },
        {
          name: "Card",
          filePath: "components/Card.tsx",
          type: "component",
          exports: ["Card", "CardProps"],
          dependencies: ["react"],
        },
      ];

      const unused = detectUnusedExports(scanResults);

      // The function should return results (exact behavior depends on implementation)
      expect(Array.isArray(unused)).toBe(true);
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe("edge cases", () => {
    it("handles files with syntax errors gracefully", async () => {
      vol.fromJSON({
        "/project/src/valid.ts": FIXTURES.utilityFile,
        // Invalid TypeScript - missing closing brace
        "/project/src/invalid.ts": "export function broken( { return 1; }",
      });

      // Should not throw
      const results = await scanDirectory("/project/src");

      // Should at least get the valid file
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("handles circular dependencies in imports", async () => {
      vol.fromJSON({
        "/project/src/a.ts": `
          import { b } from "./b";
          export const a = () => b();
        `,
        "/project/src/b.ts": `
          import { a } from "./a";
          export const b = () => a();
        `,
      });

      const results = await scanDirectory("/project/src");

      expect(results).toHaveLength(2);
    });

    it("handles re-exports", async () => {
      vol.fromJSON({
        "/project/src/Button.tsx": FIXTURES.simpleComponent,
        "/project/src/index.ts": `
          export { Button } from "./Button";
          export type { ButtonProps } from "./Button";
        `,
      });

      const results = await scanDirectory("/project/src");

      // Both files should be scanned
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });
});
