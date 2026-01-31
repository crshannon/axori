import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateBriefingCopy, BriefingData } from "../personality";

describe("generateBriefingCopy", () => {
  let mockData: BriefingData;

  beforeEach(() => {
    // Reset mock data before each test
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

    // Mock Date to control easter eggs
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15 08:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns morning greeting when timeOfDay is morning", () => {
    mockData.greeting.timeOfDay = "morning";
    mockData.greeting.hour = 8;

    const result = generateBriefingCopy(mockData);

    expect(result.greeting).toBeDefined();
    expect(result.greeting).toMatch(
      /Good morning|Rise and shine|Ah, you're awake|Morning.*coffee/i
    );
  });

  it("returns budgetExhausted quip when percentUsed >= 100", () => {
    mockData.tokenBudget.percentUsed = 100;

    const result = generateBriefingCopy(mockData);

    expect(result.statusQuip).toBeDefined();
    expect(result.statusQuip).toMatch(
      /coffers are empty|exhausted.*token|budget is spent|tokens have run dry/i
    );
  });

  it("returns needsAttention quip when needsAttention array is not empty", () => {
    mockData.overnight.needsAttention = [
      { id: "issue-1" },
      { id: "issue-2" },
    ];
    mockData.tokenBudget.percentUsed = 50; // Below budget threshold

    const result = generateBriefingCopy(mockData);

    expect(result.statusQuip).toBeDefined();
    expect(result.statusQuip).toMatch(/require.*attention|need.*addressing|2/);
  });

  it("returns a BriefingCopy object with required properties", () => {
    const result = generateBriefingCopy(mockData);

    expect(result).toHaveProperty("greeting");
    expect(result).toHaveProperty("statusQuip");
    expect(result).toHaveProperty("easterEgg");
    expect(typeof result.greeting).toBe("string");
    expect(typeof result.statusQuip).toBe("string");
  });

  it("returns afternoon greeting when timeOfDay is afternoon", () => {
    mockData.greeting.timeOfDay = "afternoon";
    mockData.greeting.hour = 14;

    const result = generateBriefingCopy(mockData);

    expect(result.greeting).toBeDefined();
    expect(result.greeting).toMatch(/afternoon|lunch|Welcome back/i);
  });

  it("returns evening greeting when timeOfDay is evening", () => {
    mockData.greeting.timeOfDay = "evening";
    mockData.greeting.hour = 20;

    const result = generateBriefingCopy(mockData);

    expect(result.greeting).toBeDefined();
    expect(result.greeting).toMatch(/evening|midnight oil|Working late|night shift/i);
  });

  it("prioritizes budget exhausted over needsAttention", () => {
    mockData.tokenBudget.percentUsed = 100;
    mockData.overnight.needsAttention = [{ id: "issue-1" }];

    const result = generateBriefingCopy(mockData);

    expect(result.statusQuip).toMatch(
      /coffers are empty|exhausted.*token|budget is spent|tokens have run dry/i
    );
  });

  it("returns noActivity quip when no significant activity", () => {
    mockData.overnight.completedTickets = [];
    mockData.overnight.prsReady = [];
    mockData.overnight.needsAttention = [];
    mockData.todaysFocus = [];
    mockData.tokenBudget.percentUsed = 50;

    const result = generateBriefingCopy(mockData);

    expect(result.statusQuip).toBeDefined();
    expect(result.statusQuip).toMatch(/quiet|uneventful|suspiciously|deafening silence/i);
  });
});
