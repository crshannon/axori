import { HTMLAttributes } from "react";
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
  /**
   * Whether rental income data is missing
   */
  missingRentalIncome?: boolean;
  /**
   * Whether current value data is missing
   */
  missingCurrentValue?: boolean;
  /**
   * Click handler for missing rental income (opens drawer)
   */
  onAddRentalIncome?: (propertyId: string) => void;
  /**
   * Click handler for missing current value (opens drawer)
   */
  onAddCurrentValue?: (propertyId: string) => void;
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
    <div className="
      relative inline-flex items-center justify-center transition-all
      duration-500
    ">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="-rotate-90 transform"
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
      <div className="absolute flex flex-col items-center text-center">
        <span
          className={cn(
            fontSize,
            `
              leading-none font-black tracking-tighter tabular-nums
              transition-colors
            `,
            theme === "dark" ? "text-white" : "text-slate-900"
          )}
        >
          {score}
        </span>
        {size === "lg" && (
          <span
            className={cn(
              subFontSize,
              `
                mt-3 font-black tracking-[0.3em] uppercase opacity-80
                transition-colors
              `,
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
  missingRentalIncome = false,
  missingCurrentValue = false,
  onAddRentalIncome,
  onAddCurrentValue,
  ...props
}: PropertyCardProps) => {
  const isDark = theme === "dark";
  
  // Determine if card should show missing data styling
  const hasMissingData = missingRentalIncome || missingCurrentValue;
  
  const cardClass = cn(
    `
      group flex cursor-pointer flex-col overflow-hidden p-0 transition-all
      duration-500
      hover:scale-[1.02] hover:shadow-2xl
    `,
    hasMissingData && `
      border-2 border-dashed
    `,
    hasMissingData && isDark
      ? "border-amber-500/30 bg-amber-500/5"
      : hasMissingData
        ? "border-amber-300 bg-amber-50/50"
        : "",
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
          className="
            size-full object-cover grayscale transition-transform duration-1000
            group-hover:scale-110 group-hover:grayscale-0
          "
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
              `
                rounded-full px-4 py-1.5 text-[9px] font-black tracking-widest
                uppercase shadow-sm backdrop-blur-md
              `,
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
      <div className="space-y-4 p-8">
        {/* Property Info */}
        <div>
          {nickname && (
            <h4
              className={cn(
                "mb-1 text-xs font-black tracking-widest uppercase",
                isDark ? "text-slate-400" : "text-slate-500"
              )}
            >
              {nickname}
            </h4>
          )}
          <h3
            className={cn(
              `line-clamp-1 text-xl/tight font-black tracking-tighter uppercase`,
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {address}
          </h3>
        </div>

        {/* Financial Metrics */}
        <div className="
          flex items-end justify-between border-t border-slate-500/10 pt-4
        ">
          <div
            className={cn(
              "flex-1",
              missingRentalIncome && "cursor-pointer"
            )}
            onClick={(e) => {
              if (missingRentalIncome && onAddRentalIncome) {
                e.stopPropagation();
                onAddRentalIncome(id);
              }
            }}
          >
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-[9px] font-black tracking-widest uppercase opacity-40",
                  isDark ? "text-white/40" : "text-slate-500/40"
                )}
              >
                Cash Flow
              </p>
              {missingRentalIncome && (
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isDark ? "bg-amber-400" : "bg-amber-500"
                  )}
                  title="Rental income missing"
                />
              )}
            </div>
            {missingRentalIncome ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddRentalIncome?.(id);
                }}
                className={cn(
                  "text-sm font-black tracking-tight uppercase mt-1 transition-colors",
                  isDark
                    ? "text-amber-400 hover:text-amber-300"
                    : "text-amber-600 hover:text-amber-700"
                )}
              >
                Add Rent
              </button>
            ) : (
              <p
                className={cn(
                  "text-xl font-black tracking-tighter tabular-nums",
                  cashFlowColor
                )}
              >
                {cashFlow}
              </p>
            )}
          </div>
          <div
            className={cn(
              "text-right flex-1",
              missingCurrentValue && "cursor-pointer"
            )}
            onClick={(e) => {
              if (missingCurrentValue && onAddCurrentValue) {
                e.stopPropagation();
                onAddCurrentValue(id);
              }
            }}
          >
            <div className="flex items-center justify-end gap-2">
              <p
                className={cn(
                  "text-[9px] font-black tracking-widest uppercase opacity-40",
                  isDark ? "text-white/40" : "text-slate-500/40"
                )}
              >
                Current Value
              </p>
              {missingCurrentValue && (
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isDark ? "bg-amber-400" : "bg-amber-500"
                  )}
                  title="Current value missing"
                />
              )}
            </div>
            {missingCurrentValue ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddCurrentValue?.(id);
                }}
                className={cn(
                  "text-sm font-black tracking-tight uppercase mt-1 transition-colors",
                  isDark
                    ? "text-amber-400 hover:text-amber-300"
                    : "text-amber-600 hover:text-amber-700"
                )}
              >
                Add Value
              </button>
            ) : (
              <p
                className={cn(
                  "text-xl font-black tracking-tighter tabular-nums",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {currentValue}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

