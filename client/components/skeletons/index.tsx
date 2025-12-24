/**
 * Skeleton Loading Components (Premium Dynamic)
 * 
 * Premium skeleton UI with dynamic shimmer + pulse animation
 * for enhanced perceived performance and loading feel
 */

import { cn } from "@/lib/utils";

// Base skeleton with dynamic shimmer + pulse animation
export function Skeleton({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "wave" | "glow";
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        "bg-gradient-to-r from-white/[0.03] via-white/[0.06] to-white/[0.03]",
        "animate-skeleton-pulse",
        // Shimmer overlay
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent",
        // Variant styles
        variant === "wave" && "animate-skeleton-wave",
        variant === "glow" && "animate-skeleton-glow",
        className
      )}
      {...props}
    />
  );
}

// ========================
// KPI CARD SKELETONS
// ========================

export function KpiCardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      {/* Icon and label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      {/* Value */}
      <Skeleton className="h-8 w-32" />
      {/* Subtext */}
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

const staggerClass = (i: number) => `stagger-${Math.min(i + 1, 12)}`;

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-skeleton-pulse", staggerClass(i * 2))}>
          <KpiCardSkeleton />
        </div>
      ))}
    </div>
  );
}

// ========================
// CHART SKELETONS
// ========================

export function ChartSkeleton({ height = "h-80" }: { height?: string }) {
  // Deterministic bar heights for consistent look
  const barHeights = [45, 65, 35, 80, 50, 70, 40, 85, 55, 75, 60, 45];
  
  return (
    <div className={cn("glass-card p-6 space-y-4", height)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
      {/* Chart area - animated bars with stagger */}
      <div className="flex-1 flex items-end gap-2 pt-4">
        {barHeights.map((h, i) => (
          <Skeleton
            key={i}
            className={cn("flex-1 rounded-t-md", staggerClass(i))}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      {/* X-axis labels */}
      <div className="flex justify-between pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

export function AreaChartSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4 h-80">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      {/* Chart area - simulated wave */}
      <div className="flex-1 relative">
        <Skeleton className="absolute inset-0 rounded-lg opacity-30" />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.1)" />
              <stop offset="50%" stopColor="rgba(139, 92, 246, 0.2)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
            </linearGradient>
          </defs>
          <path
            d="M0,80 Q50,40 100,60 T200,50 T300,70 T400,40 T500,60 L500,100 L0,100 Z"
            fill="url(#shimmerGradient)"
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}

export function PieChartSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <Skeleton className="h-5 w-32" />
      {/* Pie chart placeholder */}
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          <Skeleton className="h-40 w-40 rounded-full" />
          <div className="absolute inset-4 rounded-full bg-[#1a1625]" />
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================
// TABLE SKELETONS
// ========================

export function TableRowCells({ columns = 5 }: { columns?: number }) {
  return (
    <>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton className={cn("h-4", i === 0 ? "w-32" : i === columns - 1 ? "w-20" : "w-24")} />
        </td>
      ))}
    </>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-white/5">
      <TableRowCells columns={columns} />
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/5">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="py-3 px-4 text-left">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className={cn("animate-skeleton-pulse border-b border-white/5", staggerClass(i))}>
              <TableRowCells columns={columns} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CustomerCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}

export function CustomerListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-skeleton-pulse", staggerClass(i))}>
          <CustomerCardSkeleton />
        </div>
      ))}
    </div>
  );
}

// ========================
// INVOICE SKELETONS
// ========================

export function InvoiceRowSkeleton() {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right space-y-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function InvoiceListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-skeleton-pulse", staggerClass(i))}>
          <InvoiceRowSkeleton />
        </div>
      ))}
    </div>
  );
}

// ========================
// SIDEBAR SKELETON
// ========================

export function SidebarSkeleton() {
  return (
    <div className="w-64 h-screen bg-[#0f0e1a] border-r border-white/5 p-4 space-y-6">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-24" />
      </div>
      {/* Nav items */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
      {/* Divider */}
      <Skeleton className="h-px w-full" />
      {/* Secondary items */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ========================
// INSIGHTS & SUMMARY SKELETONS
// ========================

export function InsightCardSkeleton() {
  return (
    <div className="glass-card p-4 flex items-start gap-4">
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function WeeklySummarySkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function HealthIndicatorSkeleton() {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

// ========================
// FULL PAGE SKELETONS
// ========================

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1a] via-[#1a1625] to-[#0f0e1a]">
      <div className="flex">
        {/* Sidebar */}
        <SidebarSkeleton />
        
        {/* Main content */}
        <div className="flex-1 p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </div>
          </div>
          
          {/* KPI Cards */}
          <KpiGridSkeleton count={4} />
          
          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AreaChartSkeleton />
            <PieChartSkeleton />
          </div>
          
          {/* Table */}
          <TableSkeleton rows={5} columns={5} />
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1a] via-[#1a1625] to-[#0f0e1a]">
      <div className="flex">
        <SidebarSkeleton />
        <div className="flex-1 p-8 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton height="h-96" />
            <ChartSkeleton height="h-96" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChartSkeleton height="h-80" />
            </div>
            <PieChartSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomersSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1a] via-[#1a1625] to-[#0f0e1a]">
      <div className="flex">
        <SidebarSkeleton />
        <div className="flex-1 p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-64 rounded-lg" />
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
          
          {/* Customer list */}
          <CustomerListSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}

export function InvoicesSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1a] via-[#1a1625] to-[#0f0e1a]">
      <div className="flex">
        <SidebarSkeleton />
        <div className="flex-1 p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-64 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
          
          {/* Invoice list */}
          <InvoiceListSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
