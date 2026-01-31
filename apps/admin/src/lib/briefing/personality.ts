/**
 * Jarvis Personality Data for Morning Briefing
 *
 * Greetings, quips, and easter eggs for the dashboard
 */

// Types
export interface BriefingData {
  greeting: {
    timeOfDay: "morning" | "afternoon" | "evening";
    hour: number;
  };
  overnight: {
    completedTickets: Array<{ id: string }>;
    prsReady: Array<{ id: string }>;
    needsAttention: Array<{ id: string }>;
  };
  todaysFocus: Array<{ id: string }>;
  tokenBudget: {
    percentUsed: number;
  };
}

export interface BriefingCopy {
  greeting: string;
  statusQuip: string;
  easterEgg: string | null;
}

// Time-based greetings
export const greetings = {
  morning: [
    "Good morning, sir.",
    "Rise and shine, sir.",
    "Good morning. I trust you slept well.",
    "Ah, you're awake. Excellent timing.",
    "Morning, sir. The coffee is virtual, but the tasks are real.",
  ],
  afternoon: [
    "Good afternoon, sir.",
    "Welcome back, sir.",
    "Afternoon, sir. I hope lunch was productive.",
    "Good afternoon. Ready to resume operations?",
  ],
  evening: [
    "Good evening, sir.",
    "Burning the midnight oil, sir?",
    "Working late, I see. Shall I order coffee?",
    "Evening, sir. The night shift begins.",
    "Still here, sir? Dedication noted.",
  ],
};

// Status-aware quips
export const quips = {
  allClear: [
    "No fires to report.",
    "Smooth sailing, as they say.",
    "All systems nominal.",
    "A refreshingly uneventful period.",
  ],
  prsWaiting: [
    "{count} PRs await your discerning eye.",
    "{count} pull requests require your attention.",
    "I've prepared {count} PRs for your review.",
    "{count} PRs stand ready for inspection.",
  ],
  highActivity: [
    "I've been rather busy in your absence.",
    "A productive night, if I may say so.",
    "While you were unconscious, I was productive.",
    "Much was accomplished. You're welcome.",
  ],
  noActivity: [
    "A quiet night. Almost suspiciously so.",
    "Nothing to report. I found it unsettling.",
    "An uneventful evening. I kept myself entertained.",
    "The silence was deafening. I coped.",
  ],
  budgetLow: [
    "We're running a bit lean on tokens, sir.",
    "The token reserves are looking thin.",
    "I suggest we economize on the remaining tokens.",
    "Budget constraints are becoming relevant.",
  ],
  budgetExhausted: [
    "I regret to inform you the coffers are empty.",
    "We've exhausted today's token allocation.",
    "The budget is spent. I'll resume tomorrow.",
    "Alas, the tokens have run dry.",
  ],
  needsAttention: [
    "{count} items require your attention.",
    "There are {count} matters that need addressing.",
    "I hesitate to interrupt, but {count} issues have arisen.",
    "{count} situations await your wisdom.",
  ],
  ticketsInProgress: [
    "{count} tickets are currently in flight.",
    "We have {count} active workstreams.",
    "{count} matters are being attended to.",
  ],
};

// Easter eggs (rare, triggered by specific conditions)
export const easterEggs = {
  fridayDeploy: "Deploying on a Friday evening, sir? Bold strategy.",
  firstTicketDone: "Your first ticket, sir. They grow up so fast.",
  perfectWeek: "A flawless week. I'm almost impressed.",
  monday: "Ah, Monday. The universe's way of testing resolve.",
  emptyBoard:
    "No tickets await. A rare moment of peace. Suspicious, but peaceful.",
  hundredPercent: "Budget fully utilized. I regret nothing.",
  midnight:
    "Working at this hour? I admire your dedication. Or question your judgment.",
  newYear: "Happy New Year, sir. Shall we make this one count?",
  halloween: "Happy Halloween, sir. The only scary thing here is the backlog.",
  allDone: "All tickets complete. I scarcely know what to do with myself.",
};

/**
 * Picks a random item from the provided array.
 * @template T
 * @param {Array<T>} arr - Array to pick from
 * @returns {T} Randomly selected item from the array
 */
function pickRandom<T>(arr: Array<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Replaces {placeholder} patterns in a template string with provided values.
 * @param {string} template - Template string with {key} placeholders
 * @param {Record<string, unknown>} values - Object with replacement values
 * @returns {string} Interpolated string with placeholders replaced
 */
function interpolate(
  template: string,
  values: Record<string, unknown>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

/**
 * Checks if special easter egg conditions are met based on date, time, and data.
 * @param {BriefingData} data - Briefing data containing hour and budget information
 * @returns {string|null} Easter egg message if conditions are met, otherwise null
 */
function checkEasterEgg(data: BriefingData): string | null {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = data.greeting.hour;
  const month = now.getMonth();
  const date = now.getDate();

  // Friday evening deploy
  if (dayOfWeek === 5 && hour >= 17) {
    return easterEggs.fridayDeploy;
  }

  // Monday morning
  if (dayOfWeek === 1 && hour < 12) {
    return easterEggs.monday;
  }

  // Midnight worker
  if (hour >= 0 && hour < 5) {
    return easterEggs.midnight;
  }

  // New Year's Day
  if (month === 0 && date === 1) {
    return easterEggs.newYear;
  }

  // Halloween
  if (month === 9 && date === 31) {
    return easterEggs.halloween;
  }

  // Budget fully used
  if (data.tokenBudget.percentUsed >= 100) {
    return easterEggs.hundredPercent;
  }

  // Empty board
  if (
    data.todaysFocus.length === 0 &&
    data.overnight.needsAttention.length === 0
  ) {
    return easterEggs.emptyBoard;
  }

  return null;
}

/**
 * Generate briefing copy based on data
 */
export function generateBriefingCopy(data: BriefingData): BriefingCopy {
  // Select greeting based on time of day
  const greetingOptions = greetings[data.greeting.timeOfDay];
  const greeting = pickRandom(greetingOptions);

  // Determine status and select appropriate quip
  let statusQuip: string;
  const prsCount = data.overnight.prsReady.length;
  const attentionCount = data.overnight.needsAttention.length;
  const completedCount = data.overnight.completedTickets.length;
  const budgetPercent = data.tokenBudget.percentUsed;

  if (budgetPercent >= 100) {
    statusQuip = pickRandom(quips.budgetExhausted);
  } else if (budgetPercent >= 80) {
    statusQuip = pickRandom(quips.budgetLow);
  } else if (attentionCount > 0) {
    statusQuip = interpolate(pickRandom(quips.needsAttention), {
      count: attentionCount,
    });
  } else if (prsCount > 0) {
    statusQuip = interpolate(pickRandom(quips.prsWaiting), { count: prsCount });
  } else if (completedCount > 0) {
    statusQuip = pickRandom(quips.highActivity);
  } else if (data.todaysFocus.length > 0) {
    statusQuip = interpolate(pickRandom(quips.ticketsInProgress), {
      count: data.todaysFocus.length,
    });
  } else {
    statusQuip = pickRandom(quips.noActivity);
  }

  // Check for easter eggs
  const easterEgg = checkEasterEgg(data);

  return {
    greeting,
    statusQuip,
    easterEgg,
  };
}
