
import React from 'react';

interface Props {
  score: number;
  size?: "xs" | "sm" | "lg";
}

const PropertyScoreGauge: React.FC<Props> = ({ score, size = "lg" }) => {
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
    if (val > 80) return "#8B5CF6"; // violet-600, dark mode uses #E8FF4D via CSS
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
          stroke="rgba(0,0,0,0.1)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="dark:stroke-white/5"
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
          className="transition-all duration-1000 ease-out dark:stroke-[#E8FF4D]"
        />
        {score > 80 && (
          <circle
            stroke="rgba(139, 92, 246, 0.2)"
            fill="transparent"
            strokeWidth={stroke + 4}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset, filter: "blur(4px)" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-1000 ease-out dark:stroke-[#E8FF4D]/20"
          />
        )}
      </svg>
      <div className="absolute text-center flex flex-col items-center">
        <span
          className={`${fontSize} font-black tabular-nums leading-none tracking-tighter transition-colors text-slate-900 dark:text-white`}
        >
          {score}
        </span>
        {size === "lg" && (
          <span
            className={`${subFontSize} font-black uppercase tracking-[0.3em] mt-3 transition-colors text-violet-600 opacity-80 dark:text-[#E8FF4D] dark:opacity-60`}
          >
            IQ RATING
          </span>
        )}
      </div>
    </div>
  );
};

export default PropertyScoreGauge;
