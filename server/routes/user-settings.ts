/**
 * User Settings Routes
 * 
 * Handles:
 * - Profile updates (name, email)
 * - Password changes
 * - Account deletion (GDPR compliant)
 */

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../lib/middleware";
import { hashPassword, verifyPassword, validatePasswordStrength } from "../lib/auth";
import { auditLog } from "../lib/security";
import { 
  validateBody, 
  updateAccountSchema, 
  updatePasswordSchema,
  deleteAccountSchema 
} from "../lib/validation";

const router = Router();
const prisma = new PrismaClient();

/**
 * PUT /api/user/profile
 * Update user profile (name, email)
 */
router.put("/profile", authMiddleware, validateBody(updateAccountSchema), async (req: AuthRequest, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.userId!;

    // If changing email, check it's not already taken
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { 
          email,
          NOT: { id: userId }
        },
      });
      
      if (existing) {
        return res.status(400).json({ error: "Email is already in use" });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    auditLog({
      action: "profile_updated",
      userId,
      ip: req.ip,
      details: { name: !!name, email: !!email },
    });

    res.json({ user: updated });
  } catch (error) {
    console.error("[Settings] Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/**
 * PUT /api/user/password
 * Change password (requires current password)
 */
router.put("/password", authMiddleware, validateBody(updatePasswordSchema), async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId!;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, oauthProvider: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // OAuth users can't change password
    if (user.oauthProvider && !user.passwordHash) {
      return res.status(400).json({ 
        error: "Password change not available for OAuth accounts" 
      });
    }

    // Verify current password
    if (!user.passwordHash) {
      return res.status(400).json({ error: "No password set for this account" });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      auditLog({
        action: "password_change_failed",
        userId,
        ip: req.ip,
        details: { reason: "invalid_current_password" },
      });
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Validate new password strength
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      return res.status(400).json({ error: strengthError });
    }

    // Hash and update password
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    auditLog({
      action: "password_changed",
      userId,
      ip: req.ip,
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("[Settings] Password change error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

/**
 * DELETE /api/user/account
 * Delete account permanently (GDPR compliant)
 * Requires password confirmation
 */
router.delete("/account", authMiddleware, validateBody(deleteAccountSchema), async (req: AuthRequest, res) => {
  try {
    const { password, confirmation } = req.body;
    const userId = req.userId!;

    // Extra safety check
    if (confirmation !== "DELETE MY ACCOUNT") {
      return res.status(400).json({ error: "Invalid confirmation" });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, email: true, oauthProvider: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // For OAuth users without password, just verify they're authenticated (handled by middleware)
    // For password users, verify password
    if (user.passwordHash) {
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        auditLog({
          action: "account_deletion_failed",
          userId,
          ip: req.ip,
          details: { reason: "invalid_password" },
        });
        return res.status(401).json({ error: "Password is incorrect" });
      }
    }

    // Log before deletion
    auditLog({
      action: "account_deleted",
      userId,
      ip: req.ip,
      details: { email: user.email },
    });

    // Delete all user data (cascade should handle related records)
    // Order matters for foreign key constraints
    
    // 1. Delete Stripe connections (also cascades to Invoices)
    await prisma.stripeConnection.deleteMany({
      where: { userId },
    });

    // 2. Delete subscriptions
    await prisma.subscription.deleteMany({
      where: { userId },
    });

    // 3. Delete metric snapshots
    await prisma.metricSnapshot.deleteMany({
      where: { userId },
    });

    // 4. Finally, delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`[GDPR] Account deleted: ${userId}`);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("[Settings] Account deletion error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

/**
 * GET /api/user/data-export
 * Export all user data (GDPR data portability)
 */
router.get("/data-export", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Get all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stripeConnection: true,
        subscription: true,
        metricSnapshots: {
          orderBy: { date: 'desc' },
          take: 100, // Limit for export
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove sensitive fields
    const exportData = {
      account: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        oauthProvider: user.oauthProvider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        // Field name may vary depending on Prisma client version
        billingCycle: (user.subscription as any).billingCycle ?? (user.subscription as any).interval,
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      } : null,
      stripeConnection: user.stripeConnection ? {
        stripeAccountId: user.stripeConnection.stripeAccountId,
        connectedAt: user.stripeConnection.createdAt,
      } : null,
      metricSnapshots: user.metricSnapshots.map(s => ({
        mrr: s.mrr,
        arr: s.arr,
        activeSubscriptions: s.activeSubscriptions,
        totalRevenue: s.totalRevenue,
        date: s.date,
      })),
      exportedAt: new Date().toISOString(),
    };

    auditLog({
      action: "data_exported",
      userId,
      ip: req.ip,
    });

    res.json(exportData);
  } catch (error) {
    console.error("[Settings] Data export error:", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

export default router;
