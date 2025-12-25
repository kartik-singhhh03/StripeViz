import { RequestHandler } from "express";
import { SmartAlert, AlertType, AlertPriority, AlertPreferences } from "@shared/api";
import { INSIGHT_THRESHOLDS } from "../lib/insights-engine";

// In-memory alert storage (in production, use database)
const alertsStore: Map<string, SmartAlert[]> = new Map();
const preferencesStore: Map<string, AlertPreferences> = new Map();

/**
 * Generate smart alerts based on metrics changes
 */
export function generateSmartAlerts(
  userId: string,
  currentMetrics: {
    mrr: number;
    churnRate: number;
    failedPayments: number;
    activeSubscriptions: number;
  },
  previousMetrics: {
    mrr: number;
    churnRate: number;
    failedPayments: number;
    activeSubscriptions: number;
  }
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const now = new Date().toISOString();

  // Get user preferences (or defaults)
  const prefs = preferencesStore.get(userId) || getDefaultPreferences(userId);

  // Revenue drop alert
  if (prefs.enabledTypes.includes('revenue_drop')) {
    const revenueChange = ((currentMetrics.mrr - previousMetrics.mrr) / previousMetrics.mrr) * 100;
    if (revenueChange < -prefs.thresholds.revenueDropPercent) {
      alerts.push({
        id: `alert_${Date.now()}_revenue_drop`,
        type: 'revenue_drop',
        priority: revenueChange < -20 ? 'critical' : 'high',
        title: 'Revenue Drop Detected',
        message: `MRR decreased by ${Math.abs(revenueChange).toFixed(1)}% compared to last period`,
        value: revenueChange,
        threshold: prefs.thresholds.revenueDropPercent,
        triggeredAt: now,
        isRead: false,
        actionUrl: '/dashboard',
        metadata: { previousMRR: previousMetrics.mrr, currentMRR: currentMetrics.mrr }
      });
    }
  }

  // Revenue spike alert (positive)
  if (prefs.enabledTypes.includes('revenue_spike')) {
    const revenueChange = ((currentMetrics.mrr - previousMetrics.mrr) / previousMetrics.mrr) * 100;
    if (revenueChange > prefs.thresholds.revenueSpikePercent) {
      alerts.push({
        id: `alert_${Date.now()}_revenue_spike`,
        type: 'revenue_spike',
        priority: 'low',
        title: '🎉 Revenue Spike!',
        message: `MRR increased by ${revenueChange.toFixed(1)}% - great momentum!`,
        value: revenueChange,
        threshold: prefs.thresholds.revenueSpikePercent,
        triggeredAt: now,
        isRead: false,
        actionUrl: '/dashboard',
        metadata: { previousMRR: previousMetrics.mrr, currentMRR: currentMetrics.mrr }
      });
    }
  }

  // Churn increase alert
  if (prefs.enabledTypes.includes('churn_increase')) {
    const churnChange = currentMetrics.churnRate - previousMetrics.churnRate;
    if (churnChange > prefs.thresholds.churnIncreasePercent) {
      alerts.push({
        id: `alert_${Date.now()}_churn`,
        type: 'churn_increase',
        priority: churnChange > 5 ? 'critical' : 'high',
        title: 'Churn Rate Increasing',
        message: `Churn rate increased from ${previousMetrics.churnRate.toFixed(1)}% to ${currentMetrics.churnRate.toFixed(1)}%`,
        value: churnChange,
        threshold: prefs.thresholds.churnIncreasePercent,
        triggeredAt: now,
        isRead: false,
        actionUrl: '/customers',
        metadata: { previousChurn: previousMetrics.churnRate, currentChurn: currentMetrics.churnRate }
      });
    }
  }

  // Failed payments spike
  if (prefs.enabledTypes.includes('failed_payments_spike')) {
    const failedChange = previousMetrics.failedPayments > 0
      ? ((currentMetrics.failedPayments - previousMetrics.failedPayments) / previousMetrics.failedPayments) * 100
      : currentMetrics.failedPayments > 0 ? 100 : 0;
    
    if (failedChange > prefs.thresholds.failedPaymentsSpikePercent) {
      alerts.push({
        id: `alert_${Date.now()}_failed`,
        type: 'failed_payments_spike',
        priority: 'high',
        title: 'Failed Payments Spike',
        message: `Failed payments increased by ${failedChange.toFixed(0)}% - consider dunning optimization`,
        value: failedChange,
        threshold: prefs.thresholds.failedPaymentsSpikePercent,
        triggeredAt: now,
        isRead: false,
        actionUrl: '/invoices',
        metadata: { count: currentMetrics.failedPayments }
      });
    }
  }

  // Subscription milestones
  if (prefs.enabledTypes.includes('subscription_milestone')) {
    const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    for (const milestone of milestones) {
      if (previousMetrics.activeSubscriptions < milestone && currentMetrics.activeSubscriptions >= milestone) {
        alerts.push({
          id: `alert_${Date.now()}_milestone_${milestone}`,
          type: 'subscription_milestone',
          priority: 'low',
          title: `🎊 ${milestone} Subscribers!`,
          message: `Congratulations! You've reached ${milestone} active subscriptions!`,
          value: milestone,
          triggeredAt: now,
          isRead: false,
          actionUrl: '/dashboard',
          metadata: { milestone }
        });
        break; // Only one milestone at a time
      }
    }
  }

  // Store alerts
  const existingAlerts = alertsStore.get(userId) || [];
  alertsStore.set(userId, [...alerts, ...existingAlerts].slice(0, 100)); // Keep last 100

  return alerts;
}

/**
 * Default alert preferences
 */
function getDefaultPreferences(userId: string): AlertPreferences {
  return {
    userId,
    enabledTypes: [
      'revenue_drop',
      'revenue_spike',
      'churn_increase',
      'failed_payments_spike',
      'subscription_milestone'
    ],
    channels: 'in_app',
    thresholds: {
      revenueDropPercent: 10,
      revenueSpikePercent: 15,
      churnIncreasePercent: 2,
      failedPaymentsSpikePercent: 20
    }
  };
}

/**
 * GET /api/alerts
 * Get user's alerts
 */
export const handleGetAlerts: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const alerts = alertsStore.get(userId) || [];
    const unreadCount = alerts.filter(a => !a.isRead).length;

    res.json({
      alerts,
      unreadCount,
      total: alerts.length
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
};

/**
 * POST /api/alerts/:id/read
 * Mark alert as read
 */
export const handleMarkAlertRead: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const alertId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const alerts = alertsStore.get(userId) || [];
    const alertIndex = alerts.findIndex(a => a.id === alertId);

    if (alertIndex === -1) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    alerts[alertIndex].isRead = true;
    alertsStore.set(userId, alerts);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark alert read error:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
};

/**
 * POST /api/alerts/read-all
 * Mark all alerts as read
 */
export const handleMarkAllAlertsRead: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const alerts = alertsStore.get(userId) || [];
    alerts.forEach(a => a.isRead = true);
    alertsStore.set(userId, alerts);

    res.json({ success: true, count: alerts.length });
  } catch (error) {
    console.error('Mark all alerts read error:', error);
    res.status(500).json({ error: 'Failed to mark alerts as read' });
  }
};

/**
 * GET /api/alerts/preferences
 * Get user's alert preferences
 */
export const handleGetAlertPreferences: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const prefs = preferencesStore.get(userId) || getDefaultPreferences(userId);
    res.json(prefs);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
};

/**
 * PUT /api/alerts/preferences
 * Update user's alert preferences
 */
export const handleUpdateAlertPreferences: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const updates = req.body as Partial<AlertPreferences>;
    const currentPrefs = preferencesStore.get(userId) || getDefaultPreferences(userId);

    const newPrefs: AlertPreferences = {
      ...currentPrefs,
      ...updates,
      userId, // Ensure userId doesn't change
      thresholds: {
        ...currentPrefs.thresholds,
        ...(updates.thresholds || {})
      }
    };

    preferencesStore.set(userId, newPrefs);
    res.json(newPrefs);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Export for use in metrics route
export { alertsStore, preferencesStore, getDefaultPreferences };
