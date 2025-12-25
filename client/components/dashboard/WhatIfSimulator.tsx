import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Calculator, TrendingUp, Sparkles, RotateCcw } from "lucide-react";

interface SimulationResult {
  currentMRR: number;
  projectedMRR: number;
  currentARR: number;
  projectedARR: number;
  revenueImpact: number;
  percentageChange: number;
}

interface WhatIfSimulatorProps {
  baseMRR: number;
  baseChurnRate: number;
  baseAnnualRatio: number;
  className?: string;
}

/**
 * WhatIfSimulator - Interactive revenue projection tool
 * 
 * Design rules:
 * - Real-time feedback
 * - Clear cause-effect relationship
 * - Actionable insights
 * - Debounced API calls for performance
 */
export function WhatIfSimulator({
  baseMRR,
  baseChurnRate,
  baseAnnualRatio,
  className,
}: WhatIfSimulatorProps) {
  const [priceChange, setPriceChange] = useState(0);
  const [churnReduction, setChurnReduction] = useState(0);
  const [annualConversion, setAnnualConversion] = useState(0);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate projection locally for instant feedback
  const calculateProjection = useCallback(() => {
    const priceMultiplier = 1 + priceChange / 100;
    const effectiveChurnRate = Math.max(0, baseChurnRate - churnReduction);
    const annualBonus = annualConversion * 0.1; // 10% bonus per % converted to annual
    
    // 12-month projection with compounding effects
    const monthlyRetention = 1 - effectiveChurnRate / 100;
    const projectedMRR = baseMRR * priceMultiplier * Math.pow(monthlyRetention, 12) * (1 + annualBonus / 100);
    const revenueImpact = projectedMRR - baseMRR;
    const percentageChange = baseMRR > 0 ? ((projectedMRR - baseMRR) / baseMRR) * 100 : 0;

    setResult({
      currentMRR: baseMRR,
      projectedMRR,
      currentARR: baseMRR * 12,
      projectedARR: projectedMRR * 12,
      revenueImpact,
      percentageChange,
    });
  }, [baseMRR, baseChurnRate, priceChange, churnReduction, annualConversion]);

  // Debounced calculation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(calculateProjection, 150);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [calculateProjection]);

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
    if (absValue >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (absValue >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  const resetToDefaults = () => {
    setPriceChange(0);
    setChurnReduction(0);
    setAnnualConversion(0);
  };

  const hasChanges = priceChange !== 0 || churnReduction !== 0 || annualConversion !== 0;

  // Slider component
  const SliderInput = ({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    suffix = "%",
    description,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    description?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className={cn(
          "text-sm font-semibold tabular-nums",
          value > 0 ? "text-emerald-600" : value < 0 ? "text-red-600" : "text-slate-600"
        )}>
          {value > 0 ? "+" : ""}{value}{suffix}
        </span>
      </div>
      {description && (
        <p className="text-xs text-slate-500">{description}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label={label}
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-slate-200 p-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">What-If Simulator</h3>
            <p className="text-xs text-slate-500">See how changes affect your revenue</p>
          </div>
        </div>
        {hasChanges && (
          <button
            onClick={resetToDefaults}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-6">
          <SliderInput
            label="Price adjustment"
            value={priceChange}
            onChange={setPriceChange}
            min={-30}
            max={30}
            description="How would pricing changes affect revenue?"
          />
          
          <SliderInput
            label="Churn reduction"
            value={churnReduction}
            onChange={setChurnReduction}
            min={0}
            max={5}
            step={0.5}
            description="If you reduced churn by this much..."
          />
          
          <SliderInput
            label="Annual plan conversion"
            value={annualConversion}
            onChange={setAnnualConversion}
            min={0}
            max={50}
            description="% of monthly users switching to annual"
          />
        </div>

        {/* Results */}
        <div className="bg-slate-50 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">12-Month Projection</span>
          </div>

          {result && (
            <div className="space-y-4">
              {/* MRR Comparison */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-slate-500">Monthly Revenue</span>
                  <span className={cn(
                    "text-xs font-medium",
                    result.percentageChange > 0 ? "text-emerald-600" : result.percentageChange < 0 ? "text-red-600" : "text-slate-600"
                  )}>
                    {result.percentageChange > 0 ? "+" : ""}{result.percentageChange.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-slate-400 line-through tabular-nums">
                    {formatCurrency(result.currentMRR)}
                  </span>
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <span className="text-xl font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(result.projectedMRR)}
                  </span>
                </div>
              </div>

              {/* Revenue Impact - The key insight */}
              <div className={cn(
                "p-4 rounded-lg",
                result.revenueImpact > 0 ? "bg-emerald-100" : result.revenueImpact < 0 ? "bg-red-100" : "bg-slate-100"
              )}>
                <p className="text-xs text-slate-600 mb-1">Monthly Impact</p>
                <p className={cn(
                  "text-2xl font-bold tabular-nums",
                  result.revenueImpact > 0 ? "text-emerald-700" : result.revenueImpact < 0 ? "text-red-700" : "text-slate-700"
                )}>
                  {result.revenueImpact > 0 ? "+" : ""}{formatCurrency(result.revenueImpact)}
                </p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  {result.revenueImpact > 0 ? "+" : ""}{formatCurrency(result.revenueImpact * 12)}/year
                </p>
              </div>

              {/* Insight */}
              {hasChanges && (
                <p className="text-xs text-slate-600 italic">
                  {result.percentageChange > 10 
                    ? "💡 These changes could significantly boost your revenue"
                    : result.percentageChange > 0
                    ? "📈 Small improvements add up over time"
                    : result.percentageChange < -10
                    ? "⚠️ Consider the customer impact of these changes"
                    : "Adjust sliders to see projected impact"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WhatIfSimulator;
