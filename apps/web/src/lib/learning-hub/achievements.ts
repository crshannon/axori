// Achievement system for Learning Hub

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  category: "exploration" | "mastery" | "engagement" | "milestone";
  requirement: {
    type: "terms_viewed" | "paths_completed" | "calculators_used" | "checklists_completed" | "articles_read" | "bookmarks" | "streak";
    count: number;
    specific?: Array<string>; // Specific items that count
  };
  rarity: "common" | "rare" | "epic" | "legendary";
  xp: number;
}

export const ACHIEVEMENTS: Array<Achievement> = [
  // Exploration Achievements
  {
    id: "first-steps",
    title: "First Steps",
    description: "View your first glossary term",
    icon: "Footprints",
    category: "exploration",
    requirement: { type: "terms_viewed", count: 1 },
    rarity: "common",
    xp: 10,
  },
  {
    id: "curious-mind",
    title: "Curious Mind",
    description: "View 10 different glossary terms",
    icon: "Lightbulb",
    category: "exploration",
    requirement: { type: "terms_viewed", count: 10 },
    rarity: "common",
    xp: 50,
  },
  {
    id: "glossary-explorer",
    title: "Glossary Explorer",
    description: "View 25 different glossary terms",
    icon: "Compass",
    category: "exploration",
    requirement: { type: "terms_viewed", count: 25 },
    rarity: "rare",
    xp: 100,
  },
  {
    id: "knowledge-seeker",
    title: "Knowledge Seeker",
    description: "View 50 different glossary terms",
    icon: "BookOpen",
    category: "exploration",
    requirement: { type: "terms_viewed", count: 50 },
    rarity: "epic",
    xp: 250,
  },
  {
    id: "walking-encyclopedia",
    title: "Walking Encyclopedia",
    description: "View 100 different glossary terms",
    icon: "GraduationCap",
    category: "exploration",
    requirement: { type: "terms_viewed", count: 100 },
    rarity: "legendary",
    xp: 500,
  },

  // Mastery Achievements (Learning Paths)
  {
    id: "path-starter",
    title: "Path Starter",
    description: "Complete your first learning path",
    icon: "Flag",
    category: "mastery",
    requirement: { type: "paths_completed", count: 1 },
    rarity: "rare",
    xp: 150,
  },
  {
    id: "dedicated-learner",
    title: "Dedicated Learner",
    description: "Complete 3 learning paths",
    icon: "Award",
    category: "mastery",
    requirement: { type: "paths_completed", count: 3 },
    rarity: "epic",
    xp: 300,
  },
  {
    id: "re-investing-101",
    title: "RE Investing Graduate",
    description: "Complete the Real Estate Investing 101 path",
    icon: "Home",
    category: "mastery",
    requirement: {
      type: "paths_completed",
      count: 1,
      specific: ["real-estate-investing-101"],
    },
    rarity: "rare",
    xp: 200,
  },
  {
    id: "brrrr-master",
    title: "BRRRR Master",
    description: "Complete the Mastering BRRRR path",
    icon: "Repeat",
    category: "mastery",
    requirement: {
      type: "paths_completed",
      count: 1,
      specific: ["mastering-brrrr"],
    },
    rarity: "epic",
    xp: 250,
  },
  {
    id: "tax-savvy",
    title: "Tax Savvy",
    description: "Complete the Tax Optimization path",
    icon: "Receipt",
    category: "mastery",
    requirement: {
      type: "paths_completed",
      count: 1,
      specific: ["tax-optimization-basics"],
    },
    rarity: "epic",
    xp: 250,
  },

  // Engagement Achievements
  {
    id: "number-cruncher",
    title: "Number Cruncher",
    description: "Use 3 different calculators",
    icon: "Calculator",
    category: "engagement",
    requirement: { type: "calculators_used", count: 3 },
    rarity: "common",
    xp: 50,
  },
  {
    id: "deal-analyzer",
    title: "Deal Analyzer",
    description: "Use all 5 calculators",
    icon: "PieChart",
    category: "engagement",
    requirement: { type: "calculators_used", count: 5 },
    rarity: "rare",
    xp: 100,
  },
  {
    id: "bookworm",
    title: "Bookworm",
    description: "Read 5 articles",
    icon: "BookMarked",
    category: "engagement",
    requirement: { type: "articles_read", count: 5 },
    rarity: "common",
    xp: 75,
  },
  {
    id: "organized-investor",
    title: "Organized Investor",
    description: "Complete a due diligence checklist",
    icon: "ClipboardCheck",
    category: "engagement",
    requirement: { type: "checklists_completed", count: 1 },
    rarity: "rare",
    xp: 100,
  },
  {
    id: "collector",
    title: "Collector",
    description: "Bookmark 10 items for quick reference",
    icon: "Bookmark",
    category: "engagement",
    requirement: { type: "bookmarks", count: 10 },
    rarity: "common",
    xp: 50,
  },

  // Milestone Achievements
  {
    id: "week-streak",
    title: "Consistent Learner",
    description: "Visit the Learning Hub 7 days in a row",
    icon: "Flame",
    category: "milestone",
    requirement: { type: "streak", count: 7 },
    rarity: "rare",
    xp: 150,
  },
  {
    id: "month-streak",
    title: "Learning Machine",
    description: "Visit the Learning Hub 30 days in a row",
    icon: "Zap",
    category: "milestone",
    requirement: { type: "streak", count: 30 },
    rarity: "legendary",
    xp: 500,
  },
];

// Storage keys
const ACHIEVEMENTS_KEY = "axori:learning-hub:achievements";
const PROGRESS_KEY = "axori:learning-hub:achievement-progress";
const STREAK_KEY = "axori:learning-hub:streak";

export interface AchievementProgress {
  termsViewed: Array<string>;
  pathsCompleted: Array<string>;
  calculatorsUsed: Array<string>;
  checklistsCompleted: Array<string>;
  articlesRead: Array<string>;
  bookmarksCount: number;
}

export interface StreakData {
  currentStreak: number;
  lastVisit: string | null;
  longestStreak: number;
}

// Get unlocked achievements
export function getUnlockedAchievements(): Array<string> {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save unlocked achievements
function saveUnlockedAchievements(achievements: Array<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
}

// Get achievement progress
export function getAchievementProgress(): AchievementProgress {
  if (typeof window === "undefined") {
    return {
      termsViewed: [],
      pathsCompleted: [],
      calculatorsUsed: [],
      checklistsCompleted: [],
      articlesRead: [],
      bookmarksCount: 0,
    };
  }
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          termsViewed: [],
          pathsCompleted: [],
          calculatorsUsed: [],
          checklistsCompleted: [],
          articlesRead: [],
          bookmarksCount: 0,
        };
  } catch {
    return {
      termsViewed: [],
      pathsCompleted: [],
      calculatorsUsed: [],
      checklistsCompleted: [],
      articlesRead: [],
      bookmarksCount: 0,
    };
  }
}

// Save achievement progress
function saveAchievementProgress(progress: AchievementProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// Get streak data
export function getStreakData(): StreakData {
  if (typeof window === "undefined") {
    return { currentStreak: 0, lastVisit: null, longestStreak: 0 };
  }
  try {
    const stored = localStorage.getItem(STREAK_KEY);
    return stored
      ? JSON.parse(stored)
      : { currentStreak: 0, lastVisit: null, longestStreak: 0 };
  } catch {
    return { currentStreak: 0, lastVisit: null, longestStreak: 0 };
  }
}

// Update streak
export function updateStreak(): StreakData {
  const streak = getStreakData();
  const today = new Date().toDateString();

  if (streak.lastVisit === today) {
    // Already visited today
    return streak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (streak.lastVisit === yesterday.toDateString()) {
    // Consecutive day
    streak.currentStreak += 1;
  } else if (streak.lastVisit !== today) {
    // Streak broken
    streak.currentStreak = 1;
  }

  streak.lastVisit = today;
  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);

  if (typeof window !== "undefined") {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
  }

  return streak;
}

// Track a term view
export function trackTermView(slug: string): Array<Achievement> {
  const progress = getAchievementProgress();
  if (!progress.termsViewed.includes(slug)) {
    progress.termsViewed.push(slug);
    saveAchievementProgress(progress);
  }
  return checkNewAchievements();
}

// Track a path completion
export function trackPathCompletion(slug: string): Array<Achievement> {
  const progress = getAchievementProgress();
  if (!progress.pathsCompleted.includes(slug)) {
    progress.pathsCompleted.push(slug);
    saveAchievementProgress(progress);
  }
  return checkNewAchievements();
}

// Track calculator usage
export function trackCalculatorUse(id: string): Array<Achievement> {
  const progress = getAchievementProgress();
  if (!progress.calculatorsUsed.includes(id)) {
    progress.calculatorsUsed.push(id);
    saveAchievementProgress(progress);
  }
  return checkNewAchievements();
}

// Track article read
export function trackArticleRead(slug: string): Array<Achievement> {
  const progress = getAchievementProgress();
  if (!progress.articlesRead.includes(slug)) {
    progress.articlesRead.push(slug);
    saveAchievementProgress(progress);
  }
  return checkNewAchievements();
}

// Track checklist completion
export function trackChecklistComplete(id: string): Array<Achievement> {
  const progress = getAchievementProgress();
  if (!progress.checklistsCompleted.includes(id)) {
    progress.checklistsCompleted.push(id);
    saveAchievementProgress(progress);
  }
  return checkNewAchievements();
}

// Update bookmark count
export function updateBookmarkCount(count: number): Array<Achievement> {
  const progress = getAchievementProgress();
  progress.bookmarksCount = count;
  saveAchievementProgress(progress);
  return checkNewAchievements();
}

// Check for newly unlocked achievements
function checkNewAchievements(): Array<Achievement> {
  const unlocked = getUnlockedAchievements();
  const progress = getAchievementProgress();
  const streak = getStreakData();
  const newlyUnlocked: Array<Achievement> = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlocked.includes(achievement.id)) continue;

    let earned = false;
    const req = achievement.requirement;

    switch (req.type) {
      case "terms_viewed":
        earned = progress.termsViewed.length >= req.count;
        break;
      case "paths_completed":
        if (req.specific) {
          earned = req.specific.every((slug) =>
            progress.pathsCompleted.includes(slug)
          );
        } else {
          earned = progress.pathsCompleted.length >= req.count;
        }
        break;
      case "calculators_used":
        earned = progress.calculatorsUsed.length >= req.count;
        break;
      case "checklists_completed":
        earned = progress.checklistsCompleted.length >= req.count;
        break;
      case "articles_read":
        earned = progress.articlesRead.length >= req.count;
        break;
      case "bookmarks":
        earned = progress.bookmarksCount >= req.count;
        break;
      case "streak":
        earned = streak.currentStreak >= req.count;
        break;
    }

    if (earned) {
      unlocked.push(achievement.id);
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievements(unlocked);
  }

  return newlyUnlocked;
}

// Get total XP
export function getTotalXP(): number {
  const unlocked = getUnlockedAchievements();
  return ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).reduce(
    (sum, a) => sum + a.xp,
    0
  );
}

// Get level from XP
export function getLevel(xp: number): { level: number; xpForNext: number; xpProgress: number } {
  // Level formula: Each level requires level * 100 XP
  let level = 1;
  let remainingXP = xp;
  let xpForCurrentLevel = 100;

  while (remainingXP >= xpForCurrentLevel) {
    remainingXP -= xpForCurrentLevel;
    level++;
    xpForCurrentLevel = level * 100;
  }

  return {
    level,
    xpForNext: xpForCurrentLevel,
    xpProgress: remainingXP,
  };
}

// Get achievement by ID
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

// Get achievements by category
export function getAchievementsByCategory(
  category: Achievement["category"]
): Array<Achievement> {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}
