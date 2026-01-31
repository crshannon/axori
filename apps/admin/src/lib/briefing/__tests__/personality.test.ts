import { describe, expect, it } from "vitest";
import {
  generateBriefingCopy,
  greetings,
  quips,
} from "../personality";
import type {
  BriefingData} from "../personality";

/**
 * Create a minimal BriefingData object with sensible defaults
 */
function createTestData(overrides: Partial<BriefingData> = {}): BriefingData {
  return {
    greeting: {
      timeOfDay: "morning",
      hour: 9,
    },
    overnight: {
      completedTickets: [],
      prsReady: [],
      needsAttention: [],
    },
    todaysFocus: [],
    tokenBudget: {
      percentUsed: 0,
    },
    ...overrides,
  };
}

describe("generateBriefingCopy", () => {
  describe("morning greeting", () => {
    it("returns a morning greeting when timeOfDay is morning", () => {
      const data = createTestData({
        greeting: {
          timeOfDay: "morning",
          hour: 8,
        },
      });

      const result = generateBriefingCopy(data);

      expect(result.greeting).toBeTruthy();
      expect(greetings.morning).toContain(result.greeting);
    });
  });

  describe("budget exhausted", () => {
    it("returns budgetExhausted quip when percentUsed >= 100", () => {
      const data = createTestData({
        tokenBudget: {
          percentUsed: 100,
        },
      });

      const result = generateBriefingCopy(data);

      expect(result.statusQuip).toBeTruthy();
      expect(quips.budgetExhausted).toContain(result.statusQuip);
    });

    it("returns budgetExhausted quip when percentUsed > 100", () => {
      const data = createTestData({
        tokenBudget: {
          percentUsed: 125,
        },
      });

      const result = generateBriefingCopy(data);

      expect(result.statusQuip).toBeTruthy();
      expect(quips.budgetExhausted).toContain(result.statusQuip);
    });
  });

  describe("needs attention", () => {
    it("returns needsAttention quip when needsAttention array is not empty", () => {
      const data = createTestData({
        overnight: {
          completedTickets: [],
          prsReady: [],
          needsAttention: [{ id: "ISSUE-1" }, { id: "ISSUE-2" }],
        },
      });

      const result = generateBriefingCopy(data);

      expect(result.statusQuip).toContain("2");
      expect(result.statusQuip).toBeTruthy();
    });

    it("interpolates count correctly in needsAttention quip", () => {
      const data = createTestData({
        overnight: {
          completedTickets: [],
          prsReady: [],
          needsAttention: [
            { id: "ISSUE-1" },
            { id: "ISSUE-2" },
            { id: "ISSUE-3" },
            { id: "ISSUE-4" },
          ],
        },
      });

      const result = generateBriefingCopy(data);

      expect(result.statusQuip).toContain("4");
    });
  });

  describe("return structure", () => {
    it("returns BriefingCopy object with greeting, statusQuip, and easterEgg", () => {
      const data = createTestData();

      const result = generateBriefingCopy(data);

      expect(result).toHaveProperty("greeting");
      expect(result).toHaveProperty("statusQuip");
      expect(result).toHaveProperty("easterEgg");
    });

    it("easterEgg can be null when no conditions are met", () => {
      const data = createTestData();

      const result = generateBriefingCopy(data);

      expect(result.easterEgg === null || typeof result.easterEgg === "string").toBe(true);
    });
  });
});
