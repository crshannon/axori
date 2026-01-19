import { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface PropertyCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  /**
   * Property ID
   */
  id: string;
  /**
   * Property image URL
   */
  image: string;
  /**
   * Property address
   */
  address: string;
  /**
   * Property nickname/label (optional)
   */
  nickname?: string;
  /**
   * Property status badge text
   */
  status: string;
  /**
   * Property score (0-100) for the gauge
   */
  score: number;
  /**
   * Cash flow value (formatted string, e.g., "+$450/mo" or "-$200/mo")
   */
  cashFlow: string;
  /**
   * Current value (formatted string, e.g., "$485k")
   */
  currentValue: string;
  /**
   * Click handler for the card
   */
  onClick?: (propertyId: string) => void;
  /**
   * Theme mode
   */
  theme?: "light" | "dark";
  /**
   * Additional card class name
   */
  cardClassName?: string;
}

/**
 * PropertyScoreGauge component - renders a circular progress gauge
 */
const PropertyScoreGauge = ({ 
  score, 
  size = "xs",
  theme = "light"
}: { 
  score: number; 
  size?: "xs" | "sm" | "lg";
  theme?: "light" | "dark";
}) => {
  const dimensions = {
    lg: { radius: 100, stroke: 14, fontSize: 'text-6xl', subFontSize: 'text-[10px]' },
    sm: { radius: 60, stroke: 8, fontSize: 'text-3xl', subFontSize: 'text-[8px]' },
    xs: { radius: 24, stroke: 4, fontSize: 'text-[11px]', subFontSize: '' }
  };

  const { radius, stroke, fontSize, subFontSize } = dimensions[size];
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStrokeColor = (val: number) => {
    if (val > 80) return theme === "dark" ? "#E8FF4D" : "#8B5CF6";
    if (val > 60) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="relative inline-flex items-center justify-center transition-all duration-500">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        <circle
          stroke={theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.1)"}
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={getStrokeColor(score)}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
        {score > 80 && (
          <circle
            stroke={theme === "dark" ? "rgba(232,255,77,0.2)" : "rgba(139, 92, 246, 0.2)"}
            fill="transparent"
            strokeWidth={stroke + 4}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset, filter: "blur(4px)" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out"
          />
        )}
      </svg>
      <div className="absolute text-center flex flex-col items-center">
        <span
          className={cn(
            fontSize,
            "font-black tabular-nums leading-none tracking-tighter transition-colors",
            theme === "dark" ? "text-white" : "text-slate-900"
          )}
        >
          {score}
        </span>
        {size === "lg" && (
          <span
            className={cn(
              subFontSize,
              "font-black uppercase tracking-[0.3em] mt-3 transition-colors opacity-80",
              theme === "dark" ? "text-[#E8FF4D] opacity-60" : "text-violet-600"
            )}
          >
            IQ RATING
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * PropertyCard - A reusable card component for displaying property information
 * Suitable for both explore cards and owner cards
 */
export const PropertyCard = ({
  id,
  image,
  address,
  nickname,
  status,
  score,
  cashFlow,
  currentValue,
  onClick,
  theme = "light",
  cardClassName,
  className,
  ...props
}: PropertyCardProps) => {
  const isDark = theme === "dark";
  
  const cardClass = cn(
    "overflow-hidden group p-0 cursor-pointer flex flex-col hover:shadow-2xl hover:scale-[1.02] transition-all duration-500",
    cardClassName
  );

  const handleClick = () => {
    onClick?.(id);
  };

  // Determine cash flow color based on positive/negative
  const cashFlowColor = cashFlow.startsWith('+') || !cashFlow.startsWith('-') 
    ? 'text-emerald-500' 
    : 'text-red-500';

  return (
    <div
      onClick={handleClick}
      className={cn(cardClass, className)}
      {...props}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
          alt={address}
        />
        
        {/* Score Gauge Overlay - Top Right */}
        <div className="absolute top-4 right-4">
          <PropertyScoreGauge score={score} size="xs" theme={theme} />
        </div>
        
        {/* Status Badge Overlay - Bottom Left */}
        <div className="absolute bottom-4 left-4">
          <span
            className={cn(
              "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm",
              isDark
                ? "bg-black/50 text-white"
                : "bg-white/70 text-slate-900"
            )}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 space-y-4">
        {/* Property Info */}
        <div>
          {nickname && (
            <h4
              className={cn(
                "text-xs font-black uppercase tracking-widest mb-1",
                isDark ? "text-slate-400" : "text-slate-500"
              )}
            >
              {nickname}
            </h4>
          )}
          <h3
            className={cn(
              "text-xl font-black uppercase tracking-tighter leading-tight line-clamp-1",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {address}
          </h3>
        </div>

        {/* Financial Metrics */}
        <div className="flex justify-between items-end pt-4 border-t border-slate-500/10">
          <div>
            <p
              className={cn(
                "text-[9px] font-black uppercase tracking-widest opacity-40",
                isDark ? "text-white/40" : "text-slate-500/40"
              )}
            >
              Cash Flow
            </p>
            <p
              className={cn(
                "text-xl font-black tabular-nums tracking-tighter",
                cashFlowColor
              )}
            >
              {cashFlow}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-[9px] font-black uppercase tracking-widest opacity-40",
                isDark ? "text-white/40" : "text-slate-500/40"
              )}
            >
              Current Value
            </p>
            <p
              className={cn(
                "text-xl font-black tabular-nums tracking-tighter",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {currentValue}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

