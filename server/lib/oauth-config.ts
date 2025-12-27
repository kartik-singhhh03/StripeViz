/**
 * OAuth Configuration for Google and GitHub
 * All secrets are kept on the backend - NEVER exposed to frontend
 */

import { config } from './env';

export const OAUTH_CONFIG = {
  google: {
    clientId: config.oauth.google.clientId,
    clientSecret: config.oauth.google.clientSecret,
    redirectUri: config.oauth.google.redirectUri,
    scopes: ['openid', 'email', 'profile'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    enabled: config.oauth.google.enabled,
  },
  github: {
    clientId: config.oauth.github.clientId,
    clientSecret: config.oauth.github.clientSecret,
    redirectUri: config.oauth.github.redirectUri,
    scopes: ['read:user', 'user:email'],
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    emailsUrl: 'https://api.github.com/user/emails',
    enabled: config.oauth.github.enabled,
  },
  // Frontend redirect after successful OAuth
  frontendUrl: config.frontendUrl,
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
