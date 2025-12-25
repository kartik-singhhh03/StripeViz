import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  status?: "good" | "warning" | "critical" | "neutral";
  subtitle?: string;
  className?: string;
}

/**
 * MetricCard - Professional KPI card following Stripe design principles
 * 
 * Design rules:
 * - Current value prominently displayed
 * - Change vs previous period (↑ ↓ %)
 * - Health indicator (good/warning/critical)
 * - Human-readable labels
 */
export function MetricCard({
  title,
  value,
  change,
  changeLabel = "vs last period",
  status = "neutral",
  subtitle,
  className,
}: MetricCardProps) {
  const statusColors = {
    good: "text-emerald-600 bg-emerald-50",
    warning: "text-amber-600 bg-amber-50",
    critical: "text-red-600 bg-red-50",
    neutral: "text-slate-600 bg-slate-50",
  };

  const statusBorder = {
    good: "border-l-emerald-500",
    warning: "border-l-amber-500",
    critical: "border-l-red-500",
    neutral: "border-l-slate-300",
  };

  const TrendIcon = 
    change && change > 0 ? TrendingUp : 
    change && change < 0 ? TrendingDown : 
    Minus;

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-slate-200 p-5 border-l-4 transition-all duration-200 hover:shadow-sm",
        statusBorder[status],
        className
      )}
    >
      {/* Title - Small, muted, uppercase for scanning */}
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
        {title}
      </p>
      
      {/* Value - Large, prominent, the main focus */}
      <p className="text-2xl font-semibold text-slate-900 mb-2 tabular-nums">
        {value}
      </p>
      
      {/* Change indicator - Most important for founders */}
      {change !== undefined && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
            statusColors[status]
          )}>
            <TrendIcon className="w-3.5 h-3.5" />
            {change > 0 ? "+" : ""}{change.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">{changeLabel}</span>
        </div>
      )}
      
      {/* Subtitle/Context - Additional info */}
      {subtitle && (
        <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
}

export default MetricCard;
