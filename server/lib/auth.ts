import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { config } from "./env";

const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRES_IN = "7d";
const JWT_REFRESH_THRESHOLD = 24 * 60 * 60; // Refresh if token expires in less than 24 hours

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;  // Issued at
  exp?: number;  // Expiration
  jti?: string;  // JWT ID for revocation
}

// Token revocation list (in production, use Redis)
const revokedTokens = new Set<string>();

// Clean up old revoked tokens periodically
setInterval(() => {
  // In production, use Redis with TTL instead
  if (revokedTokens.size > 10000) {
    revokedTokens.clear();
  }
}, 24 * 60 * 60 * 1000);

export async function hashPassword(password: string): Promise<string> {
  // Use cost factor of 12 for better security (slightly slower but more secure)
  const salt = await bcryptjs.genSalt(12);
  return bcryptjs.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

/**
 * Generate a secure JWT token with unique ID for revocation support
 */
export function generateToken(payload: JWTPayload): string {
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign(
    { 
      userId: payload.userId, 
      email: payload.email,
      jti, // Unique token ID for revocation
    }, 
    JWT_SECRET, 
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'stripeviz',
      audience: 'stripeviz-users',
    }
  );
}

/**
 * Verify and decode a JWT token
 * Returns null if token is invalid, expired, or revoked
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'stripeviz',
      audience: 'stripeviz-users',
    }) as JWTPayload;
    
    // Check if token has been revoked
    if (decoded.jti && revokedTokens.has(decoded.jti)) {
      console.log('[Auth] Token has been revoked');
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token should be refreshed (expires soon)
 */
export function shouldRefreshToken(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded?.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    return timeUntilExpiry < JWT_REFRESH_THRESHOLD && timeUntilExpiry > 0;
  } catch {
    return false;
  }
}

/**
 * Revoke a token (for logout)
 */
export function revokeToken(token: string): void {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (decoded?.jti) {
      revokedTokens.add(decoded.jti);
    }
  } catch {
    // Token was invalid anyway
  }
}

/**
 * Refresh a token if it's valid and not expired
 * Returns a new token or null if refresh isn't possible
 */
export function refreshToken(oldToken: string): string | null {
  const payload = verifyToken(oldToken);
  if (!payload) return null;
  
  // Revoke the old token
  revokeToken(oldToken);
  
  // Generate a new token
  return generateToken({ userId: payload.userId, email: payload.email });
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
}

/**
 * Validate password strength
 * Returns null if valid, error message if invalid
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (password.length > 128) {
    return "Password must be less than 128 characters";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'letmein', 'welcome'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return "Password is too common, please choose a stronger password";
  }
  
  return null;
}
