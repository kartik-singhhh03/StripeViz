import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";
import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  question: string; // The ONE question this chart answers
  tooltip?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * ChartCard - Container for charts following design principles
 * 
 * Design rules:
 * - Charts must answer ONE question only
 * - No chart without a title that explains why it exists
 * - Title as question the chart answers
 */
export function ChartCard({
  title,
  question,
  tooltip,
  children,
  action,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-slate-200 p-6 transition-all duration-200",
        className
      )}
    >
      {/* Header with clear purpose */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-900">{title}</h3>
          <div className="flex items-center gap-2">
            {action}
            {tooltip && (
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-slate-400 cursor-help hover:text-slate-500 transition-colors" />
                <div className="absolute right-0 top-6 w-56 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg">
                  {tooltip}
                  <div className="absolute -top-1 right-2 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* The question this chart answers */}
        <p className="text-xs text-slate-500 mt-0.5">{question}</p>
      </div>
      
      {/* Chart content */}
      <div className="min-h-[200px]">
        {children}
      </div>
    </div>
  );
}

export default ChartCard;
