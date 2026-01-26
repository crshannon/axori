import {
  BarChart3,
  Calculator,
  Shield,
  Zap,
  TrendingUp,
  PieChart,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor?: "violet" | "lime" | "blue" | "green";
}

function FeatureCard({
  icon,
  title,
  description,
  accentColor = "violet",
}: FeatureCardProps) {
  const accentClasses = {
    violet: "from-violet-500/10 to-violet-500/5 dark:from-violet-500/20",
    lime: "from-lime-500/10 to-lime-500/5 dark:from-[#E8FF4D]/20",
    blue: "from-blue-500/10 to-blue-500/5 dark:from-blue-500/20",
    green: "from-green-500/10 to-green-500/5 dark:from-green-500/20",
  };

  const iconBgClasses = {
    violet: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
    lime: "bg-lime-500/10 text-lime-600 dark:bg-[#E8FF4D]/20 dark:text-[#E8FF4D]",
    blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
    green: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-3xl p-8
        bg-gradient-to-br ${accentClasses[accentColor]} to-transparent
        border border-slate-200/50 dark:border-white/5
        hover:border-slate-300 dark:hover:border-white/10
        transition-all duration-300
      `}
    >
      {/* Icon */}
      <div
        className={`
          mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl
          ${iconBgClasses[accentColor]}
          transition-transform duration-300 group-hover:scale-110
        `}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className="
          mb-3 text-xl font-bold
          text-slate-900 dark:text-white
        "
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className="
          text-sm leading-relaxed
          text-slate-600 dark:text-white/60
        "
      >
        {description}
      </p>
    </div>
  );
}

/**
 * Value Proposition Section
 *
 * Showcases the key features and benefits of Axori for real estate investors.
 */
export function ValueProposition() {
  const features = [
    {
      icon: <BarChart3 className="h-7 w-7" />,
      title: "Portfolio Analytics",
      description:
        "See your entire portfolio at a glance. Track performance, cash flow, and equity across all your properties in real-time.",
      accentColor: "violet" as const,
    },
    {
      icon: <Calculator className="h-7 w-7" />,
      title: "Tax Optimization",
      description:
        "Built-in depreciation tracking, cost segregation tools, and tax shield calculations. Know exactly what you'll save.",
      accentColor: "lime" as const,
    },
    {
      icon: <TrendingUp className="h-7 w-7" />,
      title: "Investment Scoring",
      description:
        "Our proprietary 5-dimension scoring system analyzes Cash Flow, Equity, Risk, Tax Benefits, and Management Effort.",
      accentColor: "blue" as const,
    },
    {
      icon: <PieChart className="h-7 w-7" />,
      title: "Wealth Tracking",
      description:
        "Watch your freedom number grow. Track your path to financial independence with personalized milestones.",
      accentColor: "green" as const,
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title: "Smart Automation",
      description:
        "Connect your property management software and bank accounts. We'll handle the data entry and categorization.",
      accentColor: "violet" as const,
    },
    {
      icon: <Shield className="h-7 w-7" />,
      title: "Institutional Grade",
      description:
        "The same analytics and tools that large investors use, now accessible to individual portfolio owners.",
      accentColor: "lime" as const,
    },
  ];

  return (
    <section
      className="
        w-full py-24 md:py-32
        bg-white dark:bg-[#0F1115]
      "
    >
      <div className="mx-auto max-w-[1440px] px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <p
            className="
              mb-4 text-xs font-bold uppercase tracking-widest
              text-violet-600 dark:text-[#E8FF4D]
            "
          >
            Why Axori
          </p>
          <h2
            className="
              mb-6 text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter
              text-slate-900 dark:text-white
            "
          >
            Built for Real Estate Investors
          </h2>
          <p
            className="
              mx-auto max-w-2xl text-lg
              text-slate-600 dark:text-white/60
            "
          >
            Stop juggling spreadsheets and guessing at your numbers. Axori gives
            you the clarity and tools to make confident investment decisions.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
