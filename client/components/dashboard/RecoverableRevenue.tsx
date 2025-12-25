import { DollarSign, CreditCard, Clock, AlertCircle, ArrowRight } from "lucide-react";

interface RecoverableRevenueProps {
  totalRecoverable: number;
  failedInvoices: number;
  expiredCards: number;
  incompleteCheckouts: number;
  onTakeAction?: () => void;
}

/**
 * RecoverableRevenue - Highlight revenue that can be recovered
 * 
 * Design rules:
 * - Make the opportunity clear and prominent
 * - Break down into actionable categories
 * - Strong CTA for immediate action
 * - Human-friendly label: "Money lost to failed payments"
 */
export function RecoverableRevenue({
  totalRecoverable,
  failedInvoices,
  expiredCards,
  incompleteCheckouts,
  onTakeAction,
}: RecoverableRevenueProps) {
  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  // Don't render if nothing to recover
  if (totalRecoverable <= 0) {
    return null;
  }

  return (
    <div
      className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-emerald-800">
              Money You Can Recover
            </span>
          </div>
          
          <p className="text-3xl font-semibold text-emerald-900 mb-1 tabular-nums">
            {formatCurrency(totalRecoverable)}
          </p>
          <p className="text-sm text-emerald-700">
            Lost to payment issues — take action to get it back
          </p>
        </div>
        
        <button
          onClick={onTakeAction}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 whitespace-nowrap"
        >
          Take action
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Breakdown - what can be recovered */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-emerald-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900 tabular-nums">{failedInvoices}</p>
            <p className="text-xs text-emerald-600">Failed invoices</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <CreditCard className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900 tabular-nums">{expiredCards}</p>
            <p className="text-xs text-emerald-600">Expired cards</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900 tabular-nums">{incompleteCheckouts}</p>
            <p className="text-xs text-emerald-600">Incomplete checkouts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecoverableRevenue;
