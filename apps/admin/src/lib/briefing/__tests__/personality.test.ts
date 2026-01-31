import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  generateBriefingCopy,
  greetings,
  quips,
  type BriefingData,
} from "../personality";

describe("generateBriefingCopy", () => {
  let mockData: BriefingData;

  beforeEach(() => {
    mockData = {
      greeting: {
        timeOfDay: "morning",
        hour: 8,
      },
      overnight: {
        completedTickets: [],
        prsReady: [],
        needsAttention: [],
      },
      todaysFocus: [],
      tokenBudget: {
        percentUsed: 50,
      },
    };
  });

  describe("greeting selection", () => {
    it("returns morning greeting when timeOfDay is morning", () => {
      mockData.greeting.timeOfDay = "morning";
      const result = generateBriefingCopy(mockData);

      expect(result.greeting).toBeTruthy();
      expect(greetings.morning).toContain(result.greeting);
    });

    it("returns afternoon greeting when timeOfDay is afternoon", () => {
      mockData.greeting.timeOfDay = "afternoon";
      const result = generateBriefingCopy(mockData);

      expect(result.greeting).toBeTruthy();
      expect(greetings.afternoon).toContain(result.greeting);
    });

    it("returns evening greeting when timeOfDay is evening", () => {
      mockData.greeting.timeOfDay = "evening";
      const result = generateBriefingCopy(mockData);

      expect(result.greeting).toBeTruthy();
      expect(greetings.evening).toContain(result.greeting);
    });
  });

  describe("status quip selection", () => {
    it("returns budgetExhausted quip when percentUsed >= 100", () => {
      mockData.tokenBudget.percentUsed = 100;
      const result = generateBriefingCopy(mockData);

      expect(result.statusQuip).toBeTruthy();
      expect(quips.budgetExhausted).toContain(result.statusQuip);
    });

    it("returns budgetExhausted quip when percentUsed > 100", () => {
      mockData.tokenBudget.percentUsed = 150;
      const result = generateBriefingCopy(mockData);

      expect(result.statusQuip).toBeTruthy();
      expect(quips.budgetExhausted).toContain(result.statusQuip);
    });

    it("returns budgetLow quip when percentUsed >= 80 and < 100", () => {
      mockData.tokenBudget.percentUsed = 85;
      const result = generateBriefingCopy(mockData);

      expect(result.statusQuip).toBeTruthy();
      expect(quips.budgetLow).toContain(result.statusQuip);
    });

    it("returns needsAttention quip when needsAttention array is not empty", () => {
      mockData.overnight.needsAttention = [{ id: "issue-1" }, { id: "issue-2" }];
      const result = generateBriefingCopy(mockData);

      expect(result.statusQuip).toBeTruthy();
      expect(result.statusQuip).toContain("2");
    });

    it("returns prsWaiting quip when prsReady array is not empty", () => {
      mockData.overnight.prsReady = [{ id: "pr-1" }];
      const result = generateBriefingCopy(mockData);

      expect(result.statusQuip).toBeTruthy();
      expect(result.statusQuip).toContain("1");
    });

    it("returns highActivity quip when completedTickets array is not empty", () => {
      mockData.overnight.completedTickets = [{ id: "ticket-1" }];
      const result = generateBriefingCopy(mockData);

      expect(result.statusQuip).toBeTruthy();
      expect(quips.highActivity).toContain(result.statusQuip);
    });

    it("returns ticketsInProgress quip when todaysFocus array is not empty", () => {
      mockData.todaysFocus = [{ id: "task-1" }];
      const result = generateBriefingCopy(mockData);

      expect(result.statusQuip).toBeTruthy();
      expect(result.statusQuip).toContain("1");
    });

    it("returns noActivity quip when all arrays are empty", () => {
      const result = generateBriefingCopy(mockData);

      expect(result.statusQuip).toBeTruthy();
      expect(quips.noActivity).toContain(result.statusQuip);
    });

    it("prioritizes needsAttention over prsReady", () => {
      mockData.overnight.needsAttention = [{ id: "issue-1" }];
      mockData.overnight.prsReady = [{ id: "pr-1" }];
      const result = generateBriefingCopy(mockData);

      expect(result.statusQuip).toContain("1");
      // Should use needsAttention quip which typically has "require your attention" or similar
    });

    it("prioritizes budgetExhausted over needsAttention", () => {
      mockData.tokenBudget.percentUsed = 100;
      mockData.overnight.needsAttention = [{ id: "issue-1" }];
      const result = generateBriefingCopy(mockData);

      expect(quips.budgetExhausted).toContain(result.statusQuip);
    });
  });

  describe("return structure", () => {
    it("returns object with greeting, statusQuip, and easterEgg properties", () => {
      const result = generateBriefingCopy(mockData);

      expect(result).toHaveProperty("greeting");
      expect(result).toHaveProperty("statusQuip");
      expect(result).toHaveProperty("easterEgg");
      expect(typeof result.greeting).toBe("string");
      expect(typeof result.statusQuip).toBe("string");
      expect(
        result.easterEgg === null || typeof result.easterEgg === "string"
      ).toBe(true);
    });
  });

  describe("easter eggs", () => {
    it("returns null easterEgg when conditions are not met", () => {
      const result = generateBriefingCopy(mockData);

      expect(result.easterEgg).toBeNull();
    });

    it("returns easterEgg when budget is 100%", () => {
      mockData.tokenBudget.percentUsed = 100;
      const result = generateBriefingCopy(mockData);

      expect(result.easterEgg).toBeTruthy();
    });
  });
});
