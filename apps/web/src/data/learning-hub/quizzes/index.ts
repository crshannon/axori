/**
 * Learning Hub Quizzes
 *
 * Quiz definitions for testing knowledge on real estate investing concepts.
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
  explanation: string;
  /** Optional link to related glossary term */
  relatedTermSlug?: string;
}

export interface Quiz {
  slug: string;
  title: string;
  description: string;
  category: string;
  /** Difficulty level */
  level: "beginner" | "intermediate" | "advanced";
  /** Estimated time in minutes */
  estimatedMinutes: number;
  /** Minimum passing score percentage */
  passingScore: number;
  questions: Array<QuizQuestion>;
  /** Related learning path slug */
  relatedPathSlug?: string;
}

/**
 * All quizzes
 */
export const allQuizzes: Array<Quiz> = [
  {
    slug: "investment-metrics-basics",
    title: "Investment Metrics Basics",
    description: "Test your knowledge of key real estate investment metrics like Cap Rate, NOI, and Cash-on-Cash Return.",
    category: "investment-metrics",
    level: "beginner",
    estimatedMinutes: 5,
    passingScore: 70,
    relatedPathSlug: "real-estate-investing-101",
    questions: [
      {
        id: "q1",
        question: "What does NOI stand for?",
        options: [
          { id: "a", text: "Net Operating Income" },
          { id: "b", text: "Net Overall Investment" },
          { id: "c", text: "Non-Operating Interest" },
          { id: "d", text: "National Owner Index" },
        ],
        correctOptionId: "a",
        explanation: "NOI stands for Net Operating Income, which is the total income from a property minus all operating expenses (excluding debt service).",
        relatedTermSlug: "noi",
      },
      {
        id: "q2",
        question: "How is Cap Rate calculated?",
        options: [
          { id: "a", text: "Purchase Price ÷ Annual Rent" },
          { id: "b", text: "NOI ÷ Property Value" },
          { id: "c", text: "Cash Flow ÷ Cash Invested" },
          { id: "d", text: "Property Value ÷ NOI" },
        ],
        correctOptionId: "b",
        explanation: "Cap Rate (Capitalization Rate) is calculated by dividing the Net Operating Income (NOI) by the property value. A 6% cap rate means the property generates 6% of its value in NOI annually.",
        relatedTermSlug: "cap-rate",
      },
      {
        id: "q3",
        question: "What does Cash-on-Cash Return measure?",
        options: [
          { id: "a", text: "Total appreciation of the property" },
          { id: "b", text: "Annual cash flow relative to cash invested" },
          { id: "c", text: "The loan interest rate" },
          { id: "d", text: "Monthly rent divided by purchase price" },
        ],
        correctOptionId: "b",
        explanation: "Cash-on-Cash Return measures your annual cash flow (after debt service) divided by the total cash you invested in the deal. It shows the actual return on your out-of-pocket investment.",
        relatedTermSlug: "cash-on-cash-return",
      },
      {
        id: "q4",
        question: "A property has $24,000 annual NOI and is valued at $300,000. What is the Cap Rate?",
        options: [
          { id: "a", text: "6%" },
          { id: "b", text: "8%" },
          { id: "c", text: "10%" },
          { id: "d", text: "12%" },
        ],
        correctOptionId: "b",
        explanation: "$24,000 ÷ $300,000 = 0.08 or 8% Cap Rate. This property generates 8% of its value in net operating income each year.",
      },
      {
        id: "q5",
        question: "Which metric is independent of financing?",
        options: [
          { id: "a", text: "Cash-on-Cash Return" },
          { id: "b", text: "DSCR" },
          { id: "c", text: "Cap Rate" },
          { id: "d", text: "Cash Flow" },
        ],
        correctOptionId: "c",
        explanation: "Cap Rate is independent of financing because it only looks at NOI and property value. Cash-on-Cash, DSCR, and Cash Flow all depend on your loan terms.",
        relatedTermSlug: "cap-rate",
      },
    ],
  },
  {
    slug: "financing-fundamentals",
    title: "Financing Fundamentals",
    description: "Test your understanding of real estate financing concepts including LTV, DSCR, and loan types.",
    category: "financing",
    level: "beginner",
    estimatedMinutes: 5,
    passingScore: 70,
    relatedPathSlug: "financing-fundamentals",
    questions: [
      {
        id: "q1",
        question: "What does LTV stand for?",
        options: [
          { id: "a", text: "Loan to Value" },
          { id: "b", text: "Long Term Value" },
          { id: "c", text: "Lender Term Verification" },
          { id: "d", text: "Lease to Vacancy" },
        ],
        correctOptionId: "a",
        explanation: "LTV stands for Loan to Value ratio, which compares the loan amount to the property's appraised value. An 80% LTV means the loan is 80% of the property value.",
        relatedTermSlug: "ltv",
      },
      {
        id: "q2",
        question: "What is DSCR typically required to be for investment property loans?",
        options: [
          { id: "a", text: "0.75 or higher" },
          { id: "b", text: "1.0 or higher" },
          { id: "c", text: "1.20-1.25 or higher" },
          { id: "d", text: "2.0 or higher" },
        ],
        correctOptionId: "c",
        explanation: "Most lenders require a DSCR of 1.20-1.25 or higher. This means your NOI should cover your debt payments by at least 20-25% cushion.",
        relatedTermSlug: "dscr",
      },
      {
        id: "q3",
        question: "Which loan type is specifically designed for investment properties based on rental income?",
        options: [
          { id: "a", text: "FHA Loan" },
          { id: "b", text: "VA Loan" },
          { id: "c", text: "DSCR Loan" },
          { id: "d", text: "USDA Loan" },
        ],
        correctOptionId: "c",
        explanation: "DSCR loans qualify borrowers based on the property's rental income rather than personal income, making them ideal for real estate investors.",
        relatedTermSlug: "dscr-loan",
      },
      {
        id: "q4",
        question: "A property generates $2,500/month NOI and has a $2,000/month mortgage payment. What is the DSCR?",
        options: [
          { id: "a", text: "0.80" },
          { id: "b", text: "1.00" },
          { id: "c", text: "1.25" },
          { id: "d", text: "1.50" },
        ],
        correctOptionId: "c",
        explanation: "$2,500 ÷ $2,000 = 1.25 DSCR. This means the property generates 25% more income than needed to cover the debt payments.",
      },
      {
        id: "q5",
        question: "What is the purpose of PMI (Private Mortgage Insurance)?",
        options: [
          { id: "a", text: "Protects the buyer if property values drop" },
          { id: "b", text: "Protects the lender if the borrower defaults" },
          { id: "c", text: "Covers property repairs" },
          { id: "d", text: "Insures against rental vacancies" },
        ],
        correctOptionId: "b",
        explanation: "PMI protects the lender (not the borrower) if you default on the loan. It's typically required when your down payment is less than 20%.",
        relatedTermSlug: "pmi",
      },
    ],
  },
  {
    slug: "tax-benefits-101",
    title: "Tax Benefits 101",
    description: "Learn about the tax advantages of real estate investing including depreciation and 1031 exchanges.",
    category: "taxation",
    level: "intermediate",
    estimatedMinutes: 5,
    passingScore: 70,
    relatedPathSlug: "tax-optimization-basics",
    questions: [
      {
        id: "q1",
        question: "Over how many years is residential rental property depreciated?",
        options: [
          { id: "a", text: "15 years" },
          { id: "b", text: "27.5 years" },
          { id: "c", text: "30 years" },
          { id: "d", text: "39 years" },
        ],
        correctOptionId: "b",
        explanation: "Residential rental property is depreciated over 27.5 years using straight-line depreciation. Commercial property uses 39 years.",
        relatedTermSlug: "depreciation",
      },
      {
        id: "q2",
        question: "What is the main benefit of a 1031 Exchange?",
        options: [
          { id: "a", text: "Eliminates property taxes" },
          { id: "b", text: "Provides a tax deduction for repairs" },
          { id: "c", text: "Defers capital gains taxes when exchanging properties" },
          { id: "d", text: "Reduces mortgage interest rates" },
        ],
        correctOptionId: "c",
        explanation: "A 1031 Exchange allows you to defer capital gains taxes by reinvesting the proceeds from a sold property into a like-kind replacement property.",
        relatedTermSlug: "1031-exchange",
      },
      {
        id: "q3",
        question: "What does cost segregation do?",
        options: [
          { id: "a", text: "Separates building costs from land costs" },
          { id: "b", text: "Accelerates depreciation by reclassifying property components" },
          { id: "c", text: "Reduces property taxes" },
          { id: "d", text: "Calculates closing costs" },
        ],
        correctOptionId: "b",
        explanation: "Cost segregation is an engineering study that reclassifies parts of a building (appliances, carpets, fixtures) into shorter depreciation schedules (5, 7, or 15 years), accelerating your tax deductions.",
        relatedTermSlug: "cost-segregation",
      },
      {
        id: "q4",
        question: "How much time do you have to identify replacement properties in a 1031 Exchange?",
        options: [
          { id: "a", text: "30 days" },
          { id: "b", text: "45 days" },
          { id: "c", text: "90 days" },
          { id: "d", text: "180 days" },
        ],
        correctOptionId: "b",
        explanation: "You have 45 days from the sale to identify potential replacement properties, and 180 days total to close on the replacement property.",
        relatedTermSlug: "1031-exchange",
      },
      {
        id: "q5",
        question: "What type of income from real estate is generally considered 'passive' for tax purposes?",
        options: [
          { id: "a", text: "Income from property management services" },
          { id: "b", text: "Income from house flipping" },
          { id: "c", text: "Rental income from investment properties" },
          { id: "d", text: "Real estate agent commissions" },
        ],
        correctOptionId: "c",
        explanation: "Rental income is generally considered passive income, which has different tax treatment. Passive losses can offset passive income, and real estate professionals may qualify for special rules.",
        relatedTermSlug: "passive-income",
      },
    ],
  },
];

/**
 * Get quiz by slug
 */
export function getQuizBySlug(slug: string): Quiz | undefined {
  return allQuizzes.find((q) => q.slug === slug);
}

/**
 * Get quizzes by category
 */
export function getQuizzesByCategory(category: string): Array<Quiz> {
  return allQuizzes.filter((q) => q.category === category);
}

/**
 * Get quizzes by level
 */
export function getQuizzesByLevel(level: "beginner" | "intermediate" | "advanced"): Array<Quiz> {
  return allQuizzes.filter((q) => q.level === level);
}

/**
 * Calculate score for quiz answers
 */
export function calculateQuizScore(
  quiz: Quiz,
  answers: Record<string, string>
): { score: number; maxScore: number; percentage: number; passed: boolean } {
  let correct = 0;
  const maxScore = quiz.questions.length;

  for (const question of quiz.questions) {
    if (answers[question.id] === question.correctOptionId) {
      correct++;
    }
  }

  const percentage = (correct / maxScore) * 100;
  return {
    score: correct,
    maxScore,
    percentage,
    passed: percentage >= quiz.passingScore,
  };
}
