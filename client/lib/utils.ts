import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values with Indian number system (L, Cr)
 */
export function formatCurrency(value: number, currency = "INR"): string {
  if (currency === "INR") {
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";
    if (absValue >= 10000000) {
      return `${sign}₹${(absValue / 10000000).toFixed(2)}Cr`;
    }
    if (absValue >= 100000) {
      return `${sign}₹${(absValue / 100000).toFixed(1)}L`;
    }
    if (absValue >= 1000) {
      return `${sign}₹${(absValue / 1000).toFixed(1)}K`;
    }
    return `${sign}₹${absValue.toFixed(0)}`;
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers (K, M)
 */
export function formatNumber(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absValue >= 1000000) {
    return `${sign}${(absValue / 1000000).toFixed(1)}M`;
  }
  if (absValue >= 1000) {
    return `${sign}${(absValue / 1000).toFixed(1)}K`;
  }
  return `${sign}${absValue.toFixed(0)}`;
}

/**
 * Get status colors for UI
 */
export function getStatusColor(status: "good" | "warning" | "critical" | "neutral") {
  const colors = {
    good: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
    warning: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
    critical: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
    neutral: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  };
  return colors[status];
}

/**
 * Get health status based on value and thresholds
 */
export function getHealthStatus(
  value: number, 
  thresholds: { good: number; warning: number },
  inverted = false
): "good" | "warning" | "critical" {
  const effectiveValue = inverted ? -value : value;
  if (effectiveValue >= thresholds.good) return "good";
  if (effectiveValue >= thresholds.warning) return "warning";
  return "critical";
}

/**
 * Get change status for metrics (positive = good by default)
 */
export function getChangeStatus(
  change: number, 
  inverted = false
): "good" | "warning" | "critical" | "neutral" {
  const effectiveChange = inverted ? -change : change;
  if (effectiveChange > 5) return "good";
  if (effectiveChange < -5) return "critical";
  if (effectiveChange < 0) return "warning";
  return "neutral";
}

/**
 * Human-readable time ago string
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
