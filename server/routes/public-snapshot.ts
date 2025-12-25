import { RequestHandler } from "express";
import { randomBytes } from "crypto";
import { PublicSnapshot, SnapshotSettings, PublicSnapshotData } from "@shared/api";

// In-memory snapshot storage (in production, use database)
const snapshotsStore: Map<string, PublicSnapshot> = new Map();
const snapshotDataStore: Map<string, any> = new Map(); // Store the actual metrics data

/**
 * Generate a secure share token
 */
function generateShareToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * POST /api/snapshot/create
 * Create a new public snapshot
 */
export const handleCreateSnapshot: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { settings, metrics } = req.body as {
      settings: SnapshotSettings;
      metrics: any;
    };

    if (!settings || !metrics) {
      res.status(400).json({ error: 'Missing settings or metrics' });
      return;
    }

    // Check if user already has an active snapshot
    let existingSnapshot: PublicSnapshot | undefined;
    for (const [token, snapshot] of snapshotsStore) {
      if (snapshot.userId === userId && snapshot.isActive) {
        existingSnapshot = snapshot;
        break;
      }
    }

    // Deactivate existing snapshot if any
    if (existingSnapshot) {
      existingSnapshot.isActive = false;
    }

    const shareToken = generateShareToken();
    const now = new Date();
    
    const snapshot: PublicSnapshot = {
      id: `snapshot_${Date.now()}`,
      userId,
      shareToken,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      isActive: true,
      createdAt: now.toISOString(),
      viewCount: 0,
      settings
    };

    snapshotsStore.set(shareToken, snapshot);
    snapshotDataStore.set(shareToken, metrics);

    res.json({
      success: true,
      snapshot,
      shareUrl: `/s/${shareToken}`,
      fullUrl: `${req.protocol}://${req.get('host')}/s/${shareToken}`
    });
  } catch (error) {
    console.error('Create snapshot error:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
};

/**
 * GET /api/snapshot/:token
 * Get public snapshot data (no auth required)
 */
export const handleGetPublicSnapshot: RequestHandler = async (req, res) => {
  try {
    const { token } = req.params;

    const snapshot = snapshotsStore.get(token);
    if (!snapshot) {
      res.status(404).json({ error: 'Snapshot not found' });
      return;
    }

    // Check if expired
    if (snapshot.expiresAt && new Date(snapshot.expiresAt) < new Date()) {
      res.status(410).json({ error: 'Snapshot has expired' });
      return;
    }

    // Check if active
    if (!snapshot.isActive) {
      res.status(410).json({ error: 'Snapshot is no longer available' });
      return;
    }

    // Get stored metrics
    const metrics = snapshotDataStore.get(token);
    if (!metrics) {
      res.status(404).json({ error: 'Snapshot data not found' });
      return;
    }

    // Increment view count
    snapshot.viewCount++;
    snapshotsStore.set(token, snapshot);

    // Apply privacy settings
    const publicData = applyPrivacySettings(metrics, snapshot.settings);

    res.json({
      title: snapshot.settings.customTitle || 'Business Metrics Snapshot',
      description: snapshot.settings.customDescription,
      generatedAt: snapshot.createdAt,
      viewCount: snapshot.viewCount,
      ...publicData
    });
  } catch (error) {
    console.error('Get public snapshot error:', error);
    res.status(500).json({ error: 'Failed to get snapshot' });
  }
};

/**
 * Apply privacy settings to metrics
 */
function applyPrivacySettings(metrics: any, settings: SnapshotSettings): PublicSnapshotData {
  const result: PublicSnapshotData = {
    title: settings.customTitle || 'Business Metrics',
    description: settings.customDescription,
    generatedAt: new Date().toISOString(),
    metrics: {}
  };

  // Apply visibility and anonymization settings
  if (settings.showMRR) {
    result.metrics.mrr = settings.anonymizeAmounts 
      ? 'Visible to owner' 
      : settings.blurSensitiveData 
        ? Math.round(metrics.mrr / 1000) * 1000 // Round to nearest $1000
        : metrics.mrr;
  }

  if (settings.showARR) {
    result.metrics.arr = settings.anonymizeAmounts 
      ? 'Visible to owner' 
      : settings.blurSensitiveData 
        ? Math.round(metrics.arr / 10000) * 10000 // Round to nearest $10k
        : metrics.arr;
  }

  if (settings.showCustomerCount) {
    result.metrics.customerCount = settings.blurSensitiveData 
      ? `${Math.floor(metrics.totalCustomers / 10) * 10}+`
      : metrics.totalCustomers;
  }

  if (settings.showChurnRate) {
    result.metrics.churnRate = settings.blurSensitiveData
      ? `~${Math.round(metrics.churnRate)}%`
      : metrics.churnRate;
  }

  if (settings.showGrowthTrend) {
    // Calculate growth trend from revenue data
    if (metrics.revenueData && metrics.revenueData.length >= 2) {
      const firstHalf = metrics.revenueData.slice(0, Math.floor(metrics.revenueData.length / 2));
      const secondHalf = metrics.revenueData.slice(Math.floor(metrics.revenueData.length / 2));
      
      const firstAvg = firstHalf.reduce((sum: number, d: any) => sum + d.gross, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum: number, d: any) => sum + d.gross, 0) / secondHalf.length;
      
      result.metrics.growthRate = ((secondAvg - firstAvg) / firstAvg) * 100;
      result.trends = {
        mrrTrend: secondAvg > firstAvg ? 'up' : secondAvg < firstAvg ? 'down' : 'stable',
        customerTrend: 'stable' // Would need historical customer data
      };
    }
  }

  // Add health score (always visible, it's relative)
  if (metrics.healthIndicator) {
    result.metrics.healthScore = metrics.healthIndicator.score;
  }

  // Add anonymized chart data if growth trend is enabled
  if (settings.showGrowthTrend && metrics.revenueData) {
    result.charts = {
      revenueGrowth: metrics.revenueData.slice(-6).map((d: any, i: number) => ({
        month: `Month ${i + 1}`,
        value: settings.anonymizeAmounts 
          ? Math.round((d.gross / metrics.revenueData[0].gross) * 100) // Percentage relative to first
          : d.gross
      }))
    };
  }

  return result;
}

/**
 * GET /api/snapshot/mine
 * Get user's active snapshot
 */
export const handleGetMySnapshot: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let userSnapshot: PublicSnapshot | undefined;
    for (const [token, snapshot] of snapshotsStore) {
      if (snapshot.userId === userId && snapshot.isActive) {
        userSnapshot = snapshot;
        break;
      }
    }

    if (!userSnapshot) {
      res.json({ hasSnapshot: false });
      return;
    }

    res.json({
      hasSnapshot: true,
      snapshot: userSnapshot,
      shareUrl: `/s/${userSnapshot.shareToken}`
    });
  } catch (error) {
    console.error('Get my snapshot error:', error);
    res.status(500).json({ error: 'Failed to get snapshot' });
  }
};

/**
 * DELETE /api/snapshot/:token
 * Deactivate/delete a snapshot
 */
export const handleDeleteSnapshot: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { token } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const snapshot = snapshotsStore.get(token);
    if (!snapshot) {
      res.status(404).json({ error: 'Snapshot not found' });
      return;
    }

    if (snapshot.userId !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this snapshot' });
      return;
    }

    snapshot.isActive = false;
    snapshotsStore.set(token, snapshot);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete snapshot error:', error);
    res.status(500).json({ error: 'Failed to delete snapshot' });
  }
};

/**
 * PUT /api/snapshot/:token/settings
 * Update snapshot settings
 */
export const handleUpdateSnapshotSettings: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { token } = req.params;
    const { settings } = req.body as { settings: Partial<SnapshotSettings> };

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const snapshot = snapshotsStore.get(token);
    if (!snapshot) {
      res.status(404).json({ error: 'Snapshot not found' });
      return;
    }

    if (snapshot.userId !== userId) {
      res.status(403).json({ error: 'Not authorized to update this snapshot' });
      return;
    }

    snapshot.settings = { ...snapshot.settings, ...settings };
    snapshotsStore.set(token, snapshot);

    res.json({ success: true, snapshot });
  } catch (error) {
    console.error('Update snapshot settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
