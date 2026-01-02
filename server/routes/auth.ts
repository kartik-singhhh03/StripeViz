import { RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../lib/env';

const prisma = new PrismaClient();
const JWT_SECRET = config.jwtSecret;

export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeConnection: {
          select: {
            stripeAccountId: true,
            stripeMode: true, // Include stripeMode (test/live) in response
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
