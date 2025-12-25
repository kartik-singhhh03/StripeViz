import { RequestHandler } from "express";
import { BenchmarkingData, BenchmarkPercentile } from "@shared/api";

/**
 * Anonymous Benchmarking System
 * 
 * Aggregates anonymized metrics from all users to provide percentile comparisons.
 * No individual user data is ever exposed.
 */

// Simulated benchmark data based on SaaS industry standards
// In production, this would be calculated from aggregated anonymous user data
const INDUSTRY_BENCHMARKS = {
  // Percentile distributions for different metrics
  mrr: {
    p10: 500,
    p25: 2000,
    p50: 8000,
    p75: 25000,
    p90: 75000,
    p95: 150000
  },
  churnRate: {
    // Lower is better, so inverted percentiles
    p10: 1.5,  // Excellent
    p25: 3,
    p50: 5,
    p75: 8,
    p90: 12,
    p95: 15
  },
  arpu: {
    p10: 15,
    p25: 35,
    p50: 75,
    p75: 150,
    p90: 300,
    p95: 500
  },
  growthRate: {
    p10: -5,
    p25: 2,
    p50: 8,
    p75: 15,
    p90: 25,
    p95: 40
  }
};

// Business segments based on MRR
const SEGMENTS = {
  EARLY_STAGE: { name: 'Early Stage', maxMRR: 5000 },
  GROWTH: { name: 'Growth', maxMRR: 25000 },
  SCALE: { name: 'Scale', maxMRR: 100000 },
  ENTERPRISE: { name: 'Enterprise', maxMRR: Infinity }
};

/**
 * Calculate percentile for a value against benchmark distribution
 */
function calculatePercentile(
  value: number,
  benchmarks: { p10: number; p25: number; p50: number; p75: number; p90: number; p95: number },
  invertedScale: boolean = false
): number {
  const { p10, p25, p50, p75, p90, p95 } = benchmarks;
  
  if (invertedScale) {
    // For metrics where lower is better (like churn)
    if (value <= p10) return 95;
    if (value <= p25) return 75 + ((p25 - value) / (p25 - p10)) * 20;
    if (value <= p50) return 50 + ((p50 - value) / (p50 - p25)) * 25;
    if (value <= p75) return 25 + ((p75 - value) / (p75 - p50)) * 25;
    if (value <= p90) return 10 + ((p90 - value) / (p90 - p75)) * 15;
    if (value <= p95) return 5 + ((p95 - value) / (p95 - p90)) * 5;
    return 5;
  } else {
    // For metrics where higher is better (like MRR, ARPU)
    if (value >= p95) return 95;
    if (value >= p90) return 90 + ((value - p90) / (p95 - p90)) * 5;
    if (value >= p75) return 75 + ((value - p75) / (p90 - p75)) * 15;
    if (value >= p50) return 50 + ((value - p50) / (p75 - p50)) * 25;
    if (value >= p25) return 25 + ((value - p25) / (p50 - p25)) * 25;
    if (value >= p10) return 10 + ((value - p10) / (p25 - p10)) * 15;
    return Math.max(1, (value / p10) * 10);
  }
}

/**
 * Get rating based on percentile
 */
function getPercentileRating(percentile: number): 'excellent' | 'good' | 'average' | 'below_average' | 'needs_improvement' {
  if (percentile >= 80) return 'excellent';
  if (percentile >= 60) return 'good';
  if (percentile >= 40) return 'average';
  if (percentile >= 20) return 'below_average';
  return 'needs_improvement';
}

/**
 * Get comparison text
 */
function getComparisonText(percentile: number, metricName: string): string {
  const rounded = Math.round(percentile);
  if (rounded >= 90) return `Outstanding! Better than ${rounded}% of SaaS businesses`;
  if (rounded >= 75) return `Great ${metricName}! Top 25% of similar businesses`;
  if (rounded >= 50) return `Above average ${metricName}. Better than ${rounded}% of peers`;
  if (rounded >= 25) return `${metricName} is below average. Room for improvement`;
  return `${metricName} needs attention. Bottom quartile of industry`;
}

/**
 * Determine business segment
 */
function determineSegment(mrr: number): string {
  if (mrr <= SEGMENTS.EARLY_STAGE.maxMRR) return SEGMENTS.EARLY_STAGE.name;
  if (mrr <= SEGMENTS.GROWTH.maxMRR) return SEGMENTS.GROWTH.name;
  if (mrr <= SEGMENTS.SCALE.maxMRR) return SEGMENTS.SCALE.name;
  return SEGMENTS.ENTERPRISE.name;
}

/**
 * Get industry averages for segment
 */
function getSegmentAverages(segment: string): { avgMRR: number; avgChurnRate: number; avgARPU: number; avgGrowthRate: number } {
  switch (segment) {
    case 'Early Stage':
      return { avgMRR: 2500, avgChurnRate: 7, avgARPU: 45, avgGrowthRate: 10 };
    case 'Growth':
      return { avgMRR: 15000, avgChurnRate: 5.5, avgARPU: 85, avgGrowthRate: 12 };
    case 'Scale':
      return { avgMRR: 60000, avgChurnRate: 4, avgARPU: 150, avgGrowthRate: 8 };
    case 'Enterprise':
      return { avgMRR: 200000, avgChurnRate: 2.5, avgARPU: 350, avgGrowthRate: 5 };
    default:
      return { avgMRR: 8000, avgChurnRate: 5, avgARPU: 75, avgGrowthRate: 8 };
  }
}

/**
 * Generate recommendations based on benchmarks
 */
function generateRecommendations(
  metrics: { mrr: number; churnRate: number; arpu: number; growthRate: number },
  percentiles: { mrr: number; churnRate: number; arpu: number; growthRate: number }
): string[] {
  const recommendations: string[] = [];

  // Churn recommendations
  if (percentiles.churnRate < 40) {
    recommendations.push(
      `🔴 Your churn rate (${metrics.churnRate.toFixed(1)}%) is above average. Focus on customer success and retention strategies.`
    );
    if (metrics.churnRate > 8) {
      recommendations.push(
        `Consider implementing: proactive outreach, better onboarding, or a customer health score system.`
      );
    }
  } else if (percentiles.churnRate >= 75) {
    recommendations.push(
      `🟢 Excellent churn rate! You're in the top quartile. Document what's working.`
    );
  }

  // ARPU recommendations
  if (percentiles.arpu < 40) {
    recommendations.push(
      `💰 Your ARPU ($${metrics.arpu.toFixed(0)}) has room to grow. Consider upsells, premium tiers, or price optimization.`
    );
  } else if (percentiles.arpu >= 75) {
    recommendations.push(
      `💰 Strong ARPU positioning! Consider if there's appetite for even premium offerings.`
    );
  }

  // Growth recommendations
  if (percentiles.growthRate < 25) {
    recommendations.push(
      `📈 Growth rate (${metrics.growthRate.toFixed(1)}%) is below industry average. Time to evaluate acquisition channels.`
    );
  } else if (percentiles.growthRate >= 75) {
    recommendations.push(
      `🚀 Impressive growth! Make sure your infrastructure and team can scale with demand.`
    );
  }

  // MRR recommendations
  if (percentiles.mrr >= 75 && percentiles.growthRate >= 50) {
    recommendations.push(
      `⭐ You're in a strong position. Focus on operational efficiency and consider fundraising if needed.`
    );
  }

  // Default recommendation if none triggered
  if (recommendations.length === 0) {
    recommendations.push(
      `Your metrics are within healthy ranges. Keep monitoring and iterate on what's working.`
    );
  }

  return recommendations.slice(0, 4); // Max 4 recommendations
}

/**
 * Generate benchmarking data for a user's metrics
 */
export function generateBenchmarkingData(metrics: {
  mrr: number;
  arr: number;
  churnRate: number;
  arpu: number;
  customerCount: number;
  revenueData?: Array<{ date: string; gross: number }>;
}): BenchmarkingData {
  // Calculate growth rate from revenue data
  let growthRate = 0;
  if (metrics.revenueData && metrics.revenueData.length >= 2) {
    const firstMonth = metrics.revenueData[0].gross;
    const lastMonth = metrics.revenueData[metrics.revenueData.length - 1].gross;
    if (firstMonth > 0) {
      growthRate = ((lastMonth - firstMonth) / firstMonth) * 100;
    }
  }

  // Calculate percentiles
  const mrrPercentile = calculatePercentile(metrics.mrr, INDUSTRY_BENCHMARKS.mrr);
  const churnPercentile = calculatePercentile(metrics.churnRate, INDUSTRY_BENCHMARKS.churnRate, true);
  const arpuPercentile = calculatePercentile(metrics.arpu, INDUSTRY_BENCHMARKS.arpu);
  const growthPercentile = calculatePercentile(growthRate, INDUSTRY_BENCHMARKS.growthRate);

  // Determine segment
  const segment = determineSegment(metrics.mrr);
  const segmentAverages = getSegmentAverages(segment);

  // Build percentile objects
  const percentiles = {
    mrr: {
      value: metrics.mrr,
      percentile: Math.round(mrrPercentile),
      rating: getPercentileRating(mrrPercentile),
      comparison: getComparisonText(mrrPercentile, 'MRR')
    } as BenchmarkPercentile,
    churnRate: {
      value: metrics.churnRate,
      percentile: Math.round(churnPercentile),
      rating: getPercentileRating(churnPercentile),
      comparison: getComparisonText(churnPercentile, 'Churn rate')
    } as BenchmarkPercentile,
    arpu: {
      value: metrics.arpu,
      percentile: Math.round(arpuPercentile),
      rating: getPercentileRating(arpuPercentile),
      comparison: getComparisonText(arpuPercentile, 'ARPU')
    } as BenchmarkPercentile,
    growthRate: {
      value: growthRate,
      percentile: Math.round(growthPercentile),
      rating: getPercentileRating(growthPercentile),
      comparison: getComparisonText(growthPercentile, 'Growth rate')
    } as BenchmarkPercentile
  };

  // Generate recommendations
  const recommendations = generateRecommendations(
    { mrr: metrics.mrr, churnRate: metrics.churnRate, arpu: metrics.arpu, growthRate },
    { mrr: mrrPercentile, churnRate: churnPercentile, arpu: arpuPercentile, growthRate: growthPercentile }
  );

  return {
    yourMetrics: {
      mrr: metrics.mrr,
      arr: metrics.arr,
      churnRate: metrics.churnRate,
      arpu: metrics.arpu,
      customerCount: metrics.customerCount,
      growthRate
    },
    percentiles,
    industryComparison: {
      segment,
      avgMRR: segmentAverages.avgMRR,
      avgChurnRate: segmentAverages.avgChurnRate,
      avgARPU: segmentAverages.avgARPU,
      avgGrowthRate: segmentAverages.avgGrowthRate
    },
    recommendations
  };
}

/**
 * GET /api/benchmarking
 * Get benchmarking data for current user
 */
export const handleGetBenchmarking: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // In a real implementation, fetch user's metrics from database
    // For now, expect them to be passed in query params or use mock data
    const { mrr, arr, churnRate, arpu, customerCount } = req.query;

    if (!mrr || !churnRate || !arpu) {
      res.status(400).json({ 
        error: 'Missing required metrics. Provide mrr, churnRate, and arpu as query parameters.' 
      });
      return;
    }

    const benchmarkData = generateBenchmarkingData({
      mrr: parseFloat(mrr as string),
      arr: parseFloat(arr as string) || parseFloat(mrr as string) * 12,
      churnRate: parseFloat(churnRate as string),
      arpu: parseFloat(arpu as string),
      customerCount: parseInt(customerCount as string) || 0
    });

    res.json(benchmarkData);
  } catch (error) {
    console.error('Get benchmarking error:', error);
    res.status(500).json({ error: 'Failed to get benchmarking data' });
  }
};

/**
 * GET /api/benchmarking/industry
 * Get general industry benchmarks (no auth required)
 */
export const handleGetIndustryBenchmarks: RequestHandler = async (req, res) => {
  try {
    res.json({
      segments: [
        {
          name: 'Early Stage',
          mrrRange: '$0 - $5,000',
          metrics: {
            avgMRR: 2500,
            avgChurnRate: '6-8%',
            avgARPU: '$35-$55',
            avgGrowthRate: '8-15%'
          }
        },
        {
          name: 'Growth',
          mrrRange: '$5,000 - $25,000',
          metrics: {
            avgMRR: 15000,
            avgChurnRate: '4-6%',
            avgARPU: '$65-$100',
            avgGrowthRate: '10-15%'
          }
        },
        {
          name: 'Scale',
          mrrRange: '$25,000 - $100,000',
          metrics: {
            avgMRR: 60000,
            avgChurnRate: '3-5%',
            avgARPU: '$100-$200',
            avgGrowthRate: '5-10%'
          }
        },
        {
          name: 'Enterprise',
          mrrRange: '$100,000+',
          metrics: {
            avgMRR: 200000,
            avgChurnRate: '2-4%',
            avgARPU: '$250-$500',
            avgGrowthRate: '3-8%'
          }
        }
      ],
      methodology: 'Benchmarks based on aggregated SaaS industry data. Individual company data is never exposed.'
    });
  } catch (error) {
    console.error('Get industry benchmarks error:', error);
    res.status(500).json({ error: 'Failed to get industry benchmarks' });
  }
};
