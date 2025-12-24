import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAUTH_CONFIG, generateOAuthState } from "../lib/oauth-config";
import { AuthRequest } from "../lib/middleware";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = "7d"; // 7 days

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture: string;
}

/**
 * STEP 1: Initiate Google OAuth flow
 * Generates authorization URL and redirects user to Google
 */
export const initiateGoogleOAuth: RequestHandler = (req, res) => {
  try {
    // Generate CSRF protection state
    const state = generateOAuthState();
    
    // Store state in session for validation (in production, use Redis or secure session store)
    if (req.session) {
      req.session.oauthState = state;
    }

    const authUrl = new URL(OAUTH_CONFIG.google.authUrl);
    authUrl.searchParams.append('client_id', OAUTH_CONFIG.google.clientId);
    authUrl.searchParams.append('redirect_uri', OAUTH_CONFIG.google.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', OAUTH_CONFIG.google.scopes.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('access_type', 'offline'); // For refresh token
    authUrl.searchParams.append('prompt', 'consent'); // Always show consent screen

    res.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error);
    res.redirect(`${OAUTH_CONFIG.frontendUrl}/login?error=oauth_init_failed`);
  }
};

/**
 * STEP 2: Handle Google OAuth callback
 * Exchanges authorization code for access token and creates/updates user
 */
export const handleGoogleCallback: RequestHandler = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Handle OAuth denial
    if (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(`${OAUTH_CONFIG.frontendUrl}/login?error=oauth_denied`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${OAUTH_CONFIG.frontendUrl}/login?error=missing_code`);
    }

    // Validate CSRF state
    const storedState = req.session?.oauthState;
    if (!storedState || state !== storedState) {
      console.error('OAuth state mismatch - possible CSRF attack');
      return res.redirect(`${OAUTH_CONFIG.frontendUrl}/login?error=invalid_state`);
    }

    // Clear used state
    delete req.session.oauthState;

    // Exchange authorization code for access token
    const tokenResponse = await fetch(OAUTH_CONFIG.google.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: OAUTH_CONFIG.google.clientId,
        client_secret: OAUTH_CONFIG.google.clientSecret,
        redirect_uri: OAUTH_CONFIG.google.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user info from Google
    const userInfoResponse = await fetch(OAUTH_CONFIG.google.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo: GoogleUserInfo = await userInfoResponse.json();

    // Require verified email
    if (!userInfo.verified_email) {
      return res.redirect(`${OAUTH_CONFIG.frontendUrl}/login?error=email_not_verified`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email },
    });

    if (user) {
      // Update existing user with OAuth info if not already set
      if (!user.oauthProvider) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            oauthProvider: 'google',
            oauthProviderId: userInfo.id,
            emailVerified: true,
            avatar: userInfo.picture,
            name: user.name || userInfo.name,
          },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          avatar: userInfo.picture,
          oauthProvider: 'google',
          oauthProviderId: userInfo.id,
          emailVerified: true,
          passwordHash: null, // OAuth users don't need password
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Redirect to frontend with token
    // In production, consider using HTTP-only cookies instead
    res.redirect(`${OAUTH_CONFIG.frontendUrl}/auth/callback?token=${token}`);
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${OAUTH_CONFIG.frontendUrl}/login?error=oauth_failed`);
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentOAuthUser: RequestHandler = async (req: AuthRequest, res) => {
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
        avatar: true,
        oauthProvider: true,
        emailVerified: true,
        createdAt: true,
        stripeConnection: {
          select: {
            stripeAccountId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};
