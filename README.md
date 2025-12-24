# StripeViz - Stripe Analytics Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)

A beautiful, production-ready SaaS dashboard for viewing your Stripe metrics. See your MRR, ARR, active subscriptions, failed payments, and more — all in one place.

## ✨ Features

- **📊 Real-Time Metrics** — MRR, ARR, active subscriptions, failed payments, churn rate
- **📈 Interactive Charts** — Visualize revenue trends with beautiful charts
- **🔐 Secure Authentication** — Email/password + Google & GitHub OAuth
- **🔗 Stripe Integration** — Connect via OAuth or restricted API key
- **📤 CSV Export** — Export metrics for further analysis
- **💳 Subscription Billing** — Free, Pro, and Business tiers via Paddle
- **🌙 Dark Mode** — Beautiful dark-first design
- **📱 Responsive** — Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (Neon), Prisma ORM |
| **Auth** | JWT, bcrypt, OAuth 2.0 |
| **Payments** | Stripe API, Paddle (billing) |
| **UI** | Radix UI, Lucide Icons, Recharts |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database ([Neon](https://neon.tech) recommended)
- Stripe account

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/stripeviz.git
cd stripeviz
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your credentials. See [Environment Variables](#-environment-variables) below.

> ⚠️ **NEVER COMMIT `.env` TO GIT** — It contains secrets!

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:8080` 🎉

## 🔐 Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | 64-char random string for JWT signing | ✅ |
| `SESSION_SECRET` | 64-char random string for sessions | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ⚡ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ⚡ |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | ⚡ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | ⚡ |
| `STRIPE_SECRET_KEY` | Stripe secret key (for webhooks) | ⚡ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | ⚡ |
| `STRIPE_PRICE_*` | Subscription price IDs | ⚡ |

✅ = Required | ⚡ = Required for that feature

### Generate Secure Secrets

```bash
# Generate a secure random string
openssl rand -base64 64
```

## 📁 Project Structure

```
├── client/                  # React frontend
│   ├── pages/              # Route components
│   ├── components/         # UI components
│   │   └── ui/             # Shadcn/Radix components
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities
│
├── server/                  # Express backend
│   ├── routes/             # API endpoints
│   └── lib/                # Auth, middleware, Stripe
│
├── prisma/                  # Database
│   ├── schema.prisma       # Schema definition
│   └── migrations/         # Migration files
│
├── shared/                  # Shared TypeScript types
└── public/                  # Static assets
```

## 🔒 Security

This project follows security best practices:

- ✅ Passwords hashed with bcrypt (12 rounds)
- ✅ JWT tokens with expiration
- ✅ CSRF protection via state parameter
- ✅ Rate limiting on auth endpoints
- ✅ Input validation with Zod
- ✅ SQL injection prevention via Prisma
- ✅ XSS prevention via React
- ✅ Secure cookie settings in production
- ✅ Read-only Stripe API access

### Security Checklist for Production

- [ ] Change all secrets in `.env`
- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring/alerting

## 🧪 Development

```bash
# Start dev server
pnpm dev

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📦 Deployment

### Environment Variables

Set these in your deployment platform:

```bash
NODE_ENV=production
DATABASE_URL=<production-db-url>
JWT_SECRET=<strong-random-64-chars>
SESSION_SECRET=<strong-random-64-chars>
FRONTEND_URL=https://yourdomain.com
# ... other secrets
```

### Platforms

- **Netlify**: Uses `netlify.toml` config
- **Vercel**: Works out of the box
- **Railway/Render**: Use Dockerfile if provided

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## ⚠️ Important Notes

> **DO NOT** commit `.env` files — they contain secrets!  
> **DO NOT** hardcode API keys in source code.  
> **DO** use environment variables for all secrets.  
> **DO** review `.gitignore` before pushing.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Credits

Built with ❤️ by [Kartik Singh](https://x.com/kartik_singhhh)

---

**Need help?** Open an issue or reach out on [Twitter/X](https://x.com/kartik_singhhh).
