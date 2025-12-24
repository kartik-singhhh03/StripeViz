# OAuth Authentication Security Documentation

## 🔐 Security Architecture

This implementation follows **production-grade security best practices** for OAuth 2.0 authentication with Google and GitHub.

## Authentication Flow

### 1. **OAuth Initiation (Backend)**
```
User clicks "Continue with Google/GitHub"
  ↓
Frontend redirects to: /api/auth/google or /api/auth/github
  ↓
Backend generates CSRF state token (64-char random)
  ↓
Backend stores state in server-side session
  ↓
Backend redirects user to OAuth provider
```

### 2. **OAuth Provider Authentication**
```
User logs in at Google/GitHub
  ↓
User grants permissions (email, profile)
  ↓
Provider redirects back with authorization code + state
```

### 3. **OAuth Callback Processing (Backend)**
```
Backend receives callback at /api/auth/{provider}/callback
  ↓
Validates CSRF state (prevents attacks)
  ↓
Exchanges authorization code for access token
  ↓
Fetches user info from provider API
  ↓
Creates or updates user in database
  ↓
Generates JWT token (7-day expiry)
  ↓
Redirects to frontend with token
```

### 4. **Frontend Token Storage**
```
Frontend receives token via redirect
  ↓
Stores in localStorage (consider HTTP-only cookies for prod)
  ↓
Includes token in Authorization header for API calls
```

## 🛡️ Security Features Implemented

### 1. **CSRF Protection**
- **State Parameter**: Random 64-character hex string
- **Validation**: State must match session-stored value
- **Session-based**: State stored server-side, not in URL
- **Single-use**: State deleted after validation

### 2. **Secrets Management**
- ✅ All OAuth secrets stored on **backend only**
- ✅ Never exposed to frontend JavaScript
- ✅ Environment variables for configuration
- ✅ Different secrets per environment

### 3. **Token Security**
- **JWT Signing**: HS256 with secret key
- **Expiration**: 7-day lifetime (configurable)
- **Payload**: Minimal data (userId, email only)
- **Validation**: Every protected route checks token

### 4. **Session Security**
- **HTTP-only cookies**: Prevents XSS attacks
- **Secure flag**: HTTPS only in production
- **SameSite: lax**: CSRF protection
- **Short lifetime**: 10 minutes (OAuth flow only)

### 5. **Email Verification**
- **Google**: Requires `verified_email: true`
- **GitHub**: Falls back to verified emails endpoint
- **Multiple emails**: Prioritizes primary verified email

### 6. **Input Validation**
- ✅ Authorization code presence check
- ✅ State parameter validation
- ✅ Email format validation
- ✅ Provider response validation

### 7. **Error Handling**
- ✅ User-friendly error messages
- ✅ Secure error logging (no secrets in logs)
- ✅ Graceful fallbacks for provider issues
- ✅ Proper HTTP status codes

## 🔄 Edge Cases Handled

### 1. **Same User, Multiple Providers**
**Scenario**: User signs up with email/password, later uses Google OAuth with same email

**Handling**:
```typescript
if (user exists with email) {
  if (user has no oauthProvider) {
    // Upgrade account to OAuth
    update user with OAuth info
  }
  // Link accounts automatically
}
```

### 2. **GitHub Missing Public Email**
**Scenario**: GitHub user has email privacy enabled

**Handling**:
```typescript
if (!userInfo.email) {
  // Fetch from /user/emails endpoint
  const emails = await fetch('/user/emails')
  
  // Priority: primary verified > any verified
  const email = findPrimaryVerified(emails) || findAnyVerified(emails)
  
  if (!email) {
    return error: 'no_email_found'
  }
}
```

### 3. **OAuth Denial/Cancellation**
**Scenario**: User cancels OAuth consent screen

**Handling**:
```typescript
if (error in query params) {
  redirect to login with error message
  log: "User denied OAuth access"
}
```

### 4. **Provider Downtime**
**Scenario**: Google/GitHub API is unavailable

**Handling**:
```typescript
try {
  await fetch(provider API)
} catch (error) {
  redirect to login with "oauth_failed" error
  log full error for debugging
}
```

### 5. **Session Expiration**
**Scenario**: User takes >10 minutes to complete OAuth

**Handling**:
```typescript
if (session.oauthState expired) {
  return error: 'invalid_state'
  redirect to login
}
```

### 6. **Token Expiration**
**Scenario**: JWT expires after 7 days

**Handling**:
```typescript
// ProtectedRoute component
if (token expired) {
  localStorage.removeItem('token')
  redirect to /login
}
```

## 🚀 Production Deployment Checklist

### Environment Variables (CRITICAL)
```bash
# Generate secure random secrets (64+ characters)
JWT_SECRET="<generate-with-crypto.randomBytes(64).toString('hex')>"
SESSION_SECRET="<generate-with-crypto.randomBytes(64).toString('hex')>"

# OAuth Credentials (from provider dashboards)
GOOGLE_CLIENT_ID="your-production-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-production-secret"
GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"

GITHUB_CLIENT_ID="your-production-github-id"
GITHUB_CLIENT_SECRET="your-production-github-secret"
GITHUB_REDIRECT_URI="https://yourdomain.com/api/auth/github/callback"

FRONTEND_URL="https://yourdomain.com"
```

### OAuth Provider Configuration

#### Google Cloud Console
1. Enable Google+ API
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - Development: `http://localhost:8080/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
4. Verify domain ownership for production

#### GitHub OAuth Apps
1. Go to Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL:
   - Development: `http://localhost:8080/api/auth/github/callback`
   - Production: `https://yourdomain.com/api/auth/github/callback`
4. Note Client ID and generate Client Secret

### Security Hardening

#### 1. **Use HTTP-only Cookies (Recommended)**
Replace localStorage with HTTP-only cookies:
```typescript
// Backend: Set cookie instead of token in URL
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
res.redirect('/dashboard');
```

#### 2. **Rate Limiting**
```typescript
import rateLimit from 'express-rate-limit';

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many OAuth attempts, please try again later'
});

app.get('/api/auth/google', oauthLimiter, initiateGoogleOAuth);
```

#### 3. **HTTPS Enforcement**
```typescript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

#### 4. **Session Store (Production)**
Replace in-memory sessions with Redis:
```typescript
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  // ... other options
}));
```

#### 5. **Content Security Policy**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'https://accounts.google.com', 'https://github.com'],
    },
  },
}));
```

## 📊 Monitoring & Logging

### Events to Log
```typescript
// Successful OAuth sign-in
logger.info('OAuth login successful', {
  provider: 'google',
  userId: user.id,
  email: user.email,
  newUser: !existingUser,
});

// Failed OAuth attempts
logger.warn('OAuth failed', {
  provider: 'github',
  error: error.message,
  ip: req.ip,
});

// CSRF attempts
logger.error('CSRF state mismatch', {
  provider: 'google',
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});
```

### Metrics to Track
- OAuth success rate per provider
- Time to complete OAuth flow
- Failed state validations (CSRF attempts)
- Provider API latency
- Token expiration events

## 🧪 Testing Scenarios

### Unit Tests
- ✅ State generation uniqueness
- ✅ State validation (valid/invalid/missing)
- ✅ JWT token creation/verification
- ✅ Email extraction from providers

### Integration Tests
- ✅ Full OAuth flow (mocked provider)
- ✅ New user creation
- ✅ Existing user update
- ✅ CSRF attack prevention
- ✅ Protected route access

### Manual Testing
1. Sign up with Google
2. Sign up with GitHub
3. Sign in with email/password, then link Google
4. Cancel OAuth at provider screen
5. Try OAuth with unverified email
6. Test token expiration after 7 days
7. Test concurrent sessions
8. Test logout functionality

## 🔒 Database Schema

### User Model with OAuth
```prisma
model User {
  id               String    @id @default(cuid())
  email            String    @unique
  passwordHash     String?   // Nullable for OAuth users
  name             String?
  avatar           String?   // Profile picture URL
  
  // OAuth fields
  oauthProvider    String?   // "google" | "github" | null
  oauthProviderId  String?   // Provider's user ID
  emailVerified    Boolean   @default(false)
  
  @@unique([oauthProvider, oauthProviderId])
}
```

## 📞 Support & Troubleshooting

### Common Issues

**Issue**: "email_not_verified" error with Google
- **Solution**: Ensure email is verified in Google account settings

**Issue**: "no_email_found" error with GitHub
- **Solution**: Make at least one email public or verified in GitHub settings

**Issue**: "invalid_state" error
- **Cause**: Session expired or CSRF attack attempt
- **Solution**: Retry OAuth flow from beginning

**Issue**: Token not working across devices
- **Expected**: JWT is device-specific (stored in localStorage)
- **Solution**: User must sign in on each device

## 📚 References

- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [OWASP OAuth Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
