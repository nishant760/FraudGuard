import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";
import "./GaugeChart.css";

interface GaugeChartProps {
  showValue?: boolean;
  size?: number;
  gap?: number;
  progress?: number;
  trackClassName?: string;
  progressClassName?: string;
  circleWidth?: number;
  progressWidth?: number;
  rounded?: boolean;
  className?: string;
  children?: ReactNode;
  // Compatibility with existing ResultPanel usage
  value?: number;
  riskLevel?: RiskLevel | string;
  label?: string;
}

export default function GaugeChart({
  showValue = true,
  size = 140,
  progress,
  gap,
  progressClassName,
  trackClassName = "text-black/10 dark:text-white/10",
  circleWidth = 14,
  progressWidth = 14,
  rounded = true,
  className = "",
  children,
  value,
  riskLevel,
  label = "Risk Score",
}: GaugeChartProps) {
  const [shouldUseValue, setShouldUseValue] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldUseValue(true);
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  const actualProgress = progress !== undefined ? progress : (value ?? 0);
  const actualGap = gap !== undefined ? gap : Math.round(size * 0.45);

  const radius = size / 2 - Math.max(progressWidth, circleWidth);
  const circumference = Math.PI * radius * 2;
  const adjustedProgress = shouldUseValue ? actualProgress : 0;

  // Avoid values less than 0 and greater than 100
  const validatedProgress =
    adjustedProgress < 0 ? 0 : adjustedProgress > 100 ? 100 : adjustedProgress;

  // Calculate the stroke-dashoffset for the progress circle considering the gap
  const strokeDashoffsetProgress =
    circumference - (validatedProgress / 100) * (circumference - actualGap);

  // Dynamic risk color styling if not explicitly overridden
  const defaultProgressClass =
    riskLevel === "LOW" || (!riskLevel && actualProgress <= 30)
      ? "text-emerald-500"
      : riskLevel === "MEDIUM" || (!riskLevel && actualProgress <= 70)
      ? "text-amber-500"
      : "text-red-500";

  const effectiveProgressClass = progressClassName || defaultProgressClass;

  return (
    <div className={cn("gauge-chart-container", className)}>
      <div className="gauge-chart-relative relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Circle */}
          <circle
            r={radius}
            cx={size / 2}
            cy={size / 2}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={`${circleWidth}px`}
            strokeDasharray={circumference}
            strokeDashoffset={actualGap}
            strokeLinecap={rounded ? "round" : "butt"}
            className={cn("duration-500", trackClassName)}
            transform={`rotate(${90 + (actualGap / (2 * circumference)) * 360} ${size / 2} ${size / 2})`}
          />
          {/* Progress Circle */}
          <circle
            r={radius}
            cx={size / 2}
            cy={size / 2}
            stroke="currentColor"
            className={cn("duration-500", effectiveProgressClass)}
            strokeWidth={`${progressWidth}px`}
            strokeLinecap={rounded ? "round" : "butt"}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffsetProgress}
            transform={`rotate(${90 + (actualGap / (2 * circumference)) * 360} ${size / 2} ${size / 2})`}
          />
        </svg>

        {showValue && (
          <div className="gauge-center-content">
            <div className="gauge-value-number" style={{ fontSize: Math.round(size / 3.6) }}>
              {Math.round(actualProgress)}
            </div>
            <div className="gauge-value-sub">/100</div>
          </div>
        )}

        {children}
      </div>

      {label && <div className="gauge-bottom-label">{label}</div>}
    </div>
  );
}
