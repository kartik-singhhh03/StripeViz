import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../lib/middleware";

const prisma = new PrismaClient();

export const handleGetUser: RequestHandler = async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
        stripeConnection: {
          select: {
            stripeAccountId: true,
            tokenExpiresAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
