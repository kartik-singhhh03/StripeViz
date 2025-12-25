import { cn } from "@/lib/utils";
import { RefreshCw, Download, Share2 } from "lucide-react";

interface DashboardHeaderProps {
  lastSync?: Date;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

/**
 * DashboardHeader - Main dashboard header with actions
 * 
 * Design rules:
 * - Clear title and context
 * - Last sync time for trust
 * - Quick actions accessible
 */
export function DashboardHeader({
  lastSync,
  isRefreshing,
  onRefresh,
  onExport,
  onShare,
}: DashboardHeaderProps) {
  const formatLastSync = (date?: Date) => {
    if (!date) return "Never synced";
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your business at a glance · Last updated {formatLastSync(lastSync)}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
            isRefreshing && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Sync data"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          <span className="hidden sm:inline">Sync</span>
        </button>
        
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Export data"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </button>
        
        <button
          onClick={onShare}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Share dashboard"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardHeader;
