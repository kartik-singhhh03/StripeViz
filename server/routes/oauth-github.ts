import { RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { OAUTH_CONFIG, generateOAuthState } from "../lib/oauth-config";
import { AuthRequest } from "../lib/middleware";
import { config } from "../lib/env";

const prisma = new PrismaClient();
const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRES_IN = "7d";

interface GitHubUserInfo {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

/**
 * STEP 1: Initiate GitHub OAuth flow
 */
export const initiateGitHubOAuth: RequestHandler = (req, res) => {
  try {
    const state = generateOAuthState();
    
    if (req.session) {
      req.session.oauthState = state;
    }

    const authUrl = new URL(OAUTH_CONFIG.github.authUrl);
    authUrl.searchParams.append('client_id', OAUTH_CONFIG.github.clientId);
    authUrl.searchParams.append('redirect_uri', OAUTH_CONFIG.github.redirectUri);
    authUrl.searchParams.append('scope', OAUTH_CONFIG.github.scopes.join(' '));
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('allow_signup', 'true');

    res.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('GitHub OAuth initiation error:', error);
    res.redirect(`${OAUTH_CONFIG.frontendUrl}/login?error=oauth_init_failed`);
  }
};

/**
 * STEP 2: Handle GitHub OAuth callback
 */
export const handleGitHubCallback: RequestHandler = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('GitHub OAuth error:', error);
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

    delete req.session.oauthState;

    // Exchange code for access token
    const tokenResponse = await fetch(OAUTH_CONFIG.github.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: OAUTH_CONFIG.github.clientId,
        client_secret: OAUTH_CONFIG.github.clientSecret,
        code,
        redirect_uri: OAUTH_CONFIG.github.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch user info
    const userInfoResponse = await fetch(OAUTH_CONFIG.github.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo: GitHubUserInfo = await userInfoResponse.json();

    // Handle missing public email - fetch from emails endpoint
    let userEmail = userInfo.email;
    
    if (!userEmail) {
      const emailsResponse = await fetch(OAUTH_CONFIG.github.emailsUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (emailsResponse.ok) {
        const emails: GitHubEmail[] = await emailsResponse.json();
        
        // Find primary verified email
        const primaryEmail = emails.find((e) => e.primary && e.verified);
        
        if (primaryEmail) {
          userEmail = primaryEmail.email;
        } else {
          // Fallback to any verified email
          const verifiedEmail = emails.find((e) => e.verified);
          if (verifiedEmail) {
            userEmail = verifiedEmail.email;
          }
        }
      }
    }

    // Require email
    if (!userEmail) {
      return res.redirect(
        `${OAUTH_CONFIG.frontendUrl}/login?error=no_email_found`
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (user) {
      // Update existing user
      if (!user.oauthProvider) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            oauthProvider: 'github',
            oauthProviderId: userInfo.id.toString(),
            emailVerified: true,
            avatar: userInfo.avatar_url,
            name: user.name || userInfo.name || userInfo.login,
          },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: userInfo.name || userInfo.login,
          avatar: userInfo.avatar_url,
          oauthProvider: 'github',
          oauthProviderId: userInfo.id.toString(),
          emailVerified: true,
          passwordHash: null,
        },
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.redirect(`${OAUTH_CONFIG.frontendUrl}/auth/callback?token=${token}`);
  } catch (error: any) {
    console.error('GitHub OAuth callback error:', error);
    res.redirect(`${OAUTH_CONFIG.frontendUrl}/login?error=oauth_failed`);
  }
};
