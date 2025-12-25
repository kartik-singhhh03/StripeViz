import { cn } from "@/lib/utils";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Lightbulb,
  type LucideIcon
} from "lucide-react";

interface InsightCardProps {
  type: "positive" | "warning" | "critical" | "neutral";
  title: string;
  description: string;
  action?: string;
  actionHref?: string;
  onActionClick?: () => void;
  className?: string;
}

/**
 * InsightCard - Actionable insight presentation
 * 
 * Design rules:
 * - Insights as conclusions, not observations
 * - ❌ "Churn is 5.2%"
 * - ✅ "Churn increased and is slowing growth"
 * - Each insight implies an action
 */
export function InsightCard({
  type,
  title,
  description,
  action,
  actionHref,
  onActionClick,
  className,
}: InsightCardProps) {
  const config: Record<string, { 
    icon: LucideIcon; 
    bg: string; 
    border: string; 
    iconColor: string; 
    titleColor: string; 
  }> = {
    positive: {
      icon: TrendingUp,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      iconColor: "text-emerald-600",
      titleColor: "text-emerald-900",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
      titleColor: "text-amber-900",
    },
    critical: {
      icon: AlertTriangle,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-600",
      titleColor: "text-red-900",
    },
    neutral: {
      icon: Lightbulb,
      bg: "bg-slate-50",
      border: "border-slate-200",
      iconColor: "text-slate-600",
      titleColor: "text-slate-900",
    },
  };

  const { icon: Icon, bg, border, iconColor, titleColor } = config[type];

  const handleAction = () => {
    if (onActionClick) {
      onActionClick();
    } else if (actionHref) {
      window.location.href = actionHref;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all duration-200",
        bg,
        border,
        className
      )}
    >
      <div className="flex gap-3">
        <div className={cn("mt-0.5 flex-shrink-0", iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Conclusion-style title */}
          <h4 className={cn("font-medium text-sm", titleColor)}>
            {title}
          </h4>
          {/* Context */}
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {description}
          </p>
          {/* Action - What to do next */}
          {action && (
            <button
              onClick={handleAction}
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 mt-2 group transition-colors"
            >
              {action}
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InsightCard;
