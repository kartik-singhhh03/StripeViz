# 🔐 OAuth Authentication Setup Guide

## ✅ What's Implemented

This application now has **production-ready OAuth authentication** with:

- ✅ **Google OAuth 2.0** - Fully functional
- ✅ **GitHub OAuth** - Ready (needs your credentials)
- ✅ **Email/Password** - Works alongside OAuth
- ✅ **CSRF Protection** - State validation
- ✅ **Secure Sessions** - HTTP-only cookies
- ✅ **JWT Tokens** - 7-day expiry
- ✅ **Protected Routes** - Auth verification
- ✅ **Edge Case Handling** - All scenarios covered

## 🚀 Quick Start

### 1. Configure Google OAuth

Add your Google OAuth credentials to `.env`:
```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"
```

**Get credentials from:** https://console.cloud.google.com/apis/credentials

**Test it:
1. Start the dev server: `pnpm dev`
2. Go to http://localhost:8080/login
3. Click "Continue with Google"
4. Sign in with any Google account
5. You'll be redirected to dashboard!

### 2. Setup GitHub OAuth (Optional)

#### Get GitHub OAuth App Credentials:

1. Go to https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `StripeViz Dev` (or your app name)
   - **Homepage URL**: `http://localhost:8080`
   - **Authorization callback URL**: `http://localhost:8080/api/auth/github/callback`
4. Click **"Register application"**
5. Copy **Client ID**
6. Click **"Generate a new client secret"**
7. Copy **Client Secret**

#### Update `.env`:
```bash
GITHUB_CLIENT_ID="your_client_id_here"
GITHUB_CLIENT_SECRET="your_client_secret_here"
```

**Test GitHub OAuth:**
1. Restart server: `pnpm dev`
2. Go to http://localhost:8080/login
3. Click "Continue with GitHub"
4. Authorize the app
5. Redirected to dashboard!

## 🎯 How It Works

### User Flow

```
1. User clicks "Continue with Google/GitHub"
   ↓
2. Redirected to provider (Google/GitHub)
   ↓
3. User authenticates and grants permissions
   ↓
4. Provider redirects back to our callback URL
   ↓
5. Backend verifies, creates/updates user
   ↓
6. JWT token generated and sent to frontend
   ↓
7. User automatically logged in to dashboard
```

### Technical Flow

**Backend Routes:**
- `GET /api/auth/google` - Initiates Google OAuth
- `GET /api/auth/google/callback` - Handles Google callback
- `GET /api/auth/github` - Initiates GitHub OAuth
- `GET /api/auth/github/callback` - Handles GitHub callback

**Frontend Routes:**
- `/login` - Login page with OAuth buttons
- `/auth/callback` - Handles OAuth redirect
- `/dashboard` - Protected route (requires auth)

**Security:**
- CSRF state tokens (64-char random hex)
- HTTP-only session cookies
- JWT tokens with 7-day expiry
- Secure redirect validation
- Email verification required

## 🔒 Security Features

### 1. No Secrets in Frontend
All OAuth secrets stay on backend:
- Client secrets never exposed to JavaScript
- OAuth flow handled entirely server-side
- Tokens generated securely on backend

### 2. CSRF Protection
```typescript
// Random 64-character state token
const state = crypto.randomBytes(32).toString('hex');

// Stored in server session (not URL)
req.session.oauthState = state;

// Validated on callback
if (state !== req.session.oauthState) {
  throw new Error('CSRF attack detected');
}
```

### 3. Token Security
```typescript
// JWT signed with secret
const token = jwt.sign(
  { userId, email },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// Validated on every protected route
const decoded = jwt.verify(token, JWT_SECRET);
```

## 📋 Testing Checklist

### ✅ Google OAuth
- [ ] Click "Continue with Google" on login page
- [ ] Redirected to Google sign-in
- [ ] Grant permissions
- [ ] Redirected to dashboard
- [ ] User info loaded correctly
- [ ] Can access protected routes
- [ ] Logout works

### ✅ GitHub OAuth
- [ ] Click "Continue with GitHub" on login page
- [ ] Redirected to GitHub authorization
- [ ] Grant permissions
- [ ] Redirected to dashboard
- [ ] User info loaded correctly
- [ ] Works with private email

### ✅ Edge Cases
- [ ] Cancel OAuth at provider → Returns to login with error
- [ ] Sign up with email, then use same email with Google → Account linked
- [ ] Try to use email/password for OAuth account → Helpful error message
- [ ] Token expires after 7 days → Redirects to login
- [ ] Access protected route without login → Redirects to login

## 🎨 UI Features

### Login Page Updates
- **OAuth Buttons**: Google and GitHub with provider logos
- **Divider**: "Or continue with" separator
- **Visual Hierarchy**: OAuth prominent, email/password secondary
- **Error Handling**: User-friendly error messages

### Auth Callback Page
- **Loading State**: Spinner while processing
- **Success State**: Checkmark with redirect message
- **Error State**: Error icon with details
- **Auto-redirect**: 1.5s success, 3s error

### Protected Routes
All dashboard pages now require authentication:
- `/dashboard` - Main analytics
- `/customers` - Customer list
- `/invoices` - Invoice management
- `/analytics` - Advanced analytics

## 🐛 Troubleshooting

### "email_not_verified" with Google
**Problem**: Google email not verified
**Solution**: Verify email in Google account settings

### "no_email_found" with GitHub
**Problem**: All GitHub emails are private
**Solution**: Make at least one email public in GitHub settings
Or grant `user:email` scope (already included)

### "invalid_state" error
**Problem**: Session expired or CSRF attempt
**Solution**: Start OAuth flow again from login page

### OAuth button does nothing
**Problem**: Missing credentials in `.env`
**Solution**: Check `.env` has correct CLIENT_ID and CLIENT_SECRET

### "Failed to exchange code for token"
**Problem**: Invalid redirect URI configuration
**Solution**: Ensure redirect URI in provider settings matches `.env`:
- Google: `http://localhost:8080/api/auth/google/callback`
- GitHub: `http://localhost:8080/api/auth/github/callback`

## 🚀 Production Deployment

### 1. Update Environment Variables

```bash
# Generate secure secrets (64+ characters)
JWT_SECRET="<use-crypto.randomBytes(64).toString('hex')>"
SESSION_SECRET="<use-crypto.randomBytes(64).toString('hex')>"

# Production URLs
FRONTEND_URL="https://yourdomain.com"
GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"
GITHUB_REDIRECT_URI="https://yourdomain.com/api/auth/github/callback"
```

### 2. Update OAuth Provider Settings

**Google Cloud Console:**
- Add production redirect URI
- Verify domain ownership
- Enable Google+ API

**GitHub OAuth Apps:**
- Create new OAuth App for production
- Set production callback URL
- Update `.env` with production credentials

### 3. Security Hardening

**Enable HTTPS:**
```typescript
// Already configured in server/index.ts
cookie: {
  secure: process.env.NODE_ENV === 'production', // ✅
  httpOnly: true, // ✅
  sameSite: 'lax', // ✅
}
```

**Use Redis for Sessions:**
```bash
pnpm add connect-redis redis
```

**Add Rate Limiting:**
```bash
pnpm add express-rate-limit
```

See `OAUTH_SECURITY.md` for complete production checklist.

## 📚 File Structure

```
server/
├── lib/
│   ├── oauth-config.ts          # OAuth configuration
│   └── middleware.ts             # Auth middleware
├── routes/
│   ├── oauth-google.ts          # Google OAuth handlers
│   ├── oauth-github.ts          # GitHub OAuth handlers
│   ├── login.ts                 # Email/password login
│   └── signup.ts                # Email/password signup
└── types/
    └── session.d.ts             # Session types

client/
├── pages/
│   ├── Login.tsx                # Login page with OAuth buttons
│   ├── AuthCallback.tsx         # OAuth callback handler
│   └── Dashboard.tsx            # Protected dashboard
└── components/
    ├── ProtectedRoute.tsx       # Route protection
    └── Sidebar.tsx              # Navigation sidebar

prisma/
└── schema.prisma                # Updated with OAuth fields
```

## 🎓 Learn More

- **Security Documentation**: `OAUTH_SECURITY.md`
- **Google OAuth Guide**: https://developers.google.com/identity/protocols/oauth2
- **GitHub OAuth Guide**: https://docs.github.com/en/developers/apps/building-oauth-apps
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

## 💬 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review `OAUTH_SECURITY.md` for detailed security info
3. Ensure all environment variables are set correctly
4. Check browser console for error messages
5. Check server logs for backend errors

## ✨ What's Next?

Suggested enhancements:
- [ ] Add more OAuth providers (Microsoft, Apple, etc.)
- [ ] Implement "Remember Me" functionality
- [ ] Add email verification for email/password signups
- [ ] Setup password reset flow
- [ ] Add 2FA support
- [ ] Implement refresh token rotation
- [ ] Add account linking UI
- [ ] Setup audit logs for security events
