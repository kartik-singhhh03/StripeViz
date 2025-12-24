/**
 * OAuth Configuration for Google and GitHub
 * All secrets are kept on the backend - NEVER exposed to frontend
 */

export const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/api/auth/google/callback',
    scopes: ['openid', 'email', 'profile'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:8080/api/auth/github/callback',
    scopes: ['read:user', 'user:email'],
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    emailsUrl: 'https://api.github.com/user/emails',
  },
  // Frontend redirect after successful OAuth
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
};

/**
 * Generate random state parameter for CSRF protection
 */
export function generateOAuthState(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate OAuth state to prevent CSRF attacks
 */
export function validateOAuthState(state: string, storedState: string): boolean {
  return state === storedState && state.length === 64;
}
