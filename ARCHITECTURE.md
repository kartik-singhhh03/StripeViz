# StripeViz - Architecture & Design Decisions

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   FRONTEND (React)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Landing → Signup → Login → Dashboard               │  │
│  │  (JWT token stored in localStorage)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────┐
│                   BACKEND (Express)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Auth Routes │ Stripe Routes │ Metrics Routes        │  │
│  │ ├─ signup   │ ├─ oauth      │ └─ GET /metrics       │  │
│  │ ├─ login    │ ├─ checkout   │                        │  │
│  │ └─ me       │ └─ webhooks   │                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Middleware: Auth, CORS, JSON parsing                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────┬──────────────┬──────────────────────────────┘
                 │              │
    ┌────────────▼─┐    ┌──────▼──────────┐
    │  PostgreSQL  │    │ Stripe API      │
    │  (Neon)      │    │ (OAuth, Rest)   │
    │              │    │                 │
    │ • Users      │    │ • Accounts      │
    │ • Stripe     │    │ • Invoices      │
    │   Tokens     │    │ • Subscriptions │
    │ • Invoices   │    │ • Webhooks      │
    │ • Metrics    │    └─────────────────┘
    └──────────────┘
```

---

## 🔐 Authentication Flow

### Signup
```
User enters email + password
        ↓
Validate input (Zod)
        ↓
Hash password (bcrypt)
        ↓
Save to database
        ↓
Create free subscription
        ↓
Generate JWT token
        ↓
Return token + user data
```

### Login
```
User enters email + password
        ↓
Find user in database
        ↓
Compare password hash (bcrypt)
        ↓
Generate JWT token
        ↓
Return token + user data
```

### Protected Requests
```
Client sends request with "Authorization: Bearer {token}"
        ↓
Server extracts token from header
        ↓
Verify JWT signature
        ↓
Extract userId from payload
        ↓
Process request with authenticated user
```

---

## 💳 Stripe OAuth Flow

```
User clicks "Connect Stripe"
        ↓
Frontend requests OAuth URL from backend
        ↓
Backend generates Stripe OAuth URL
        ↓
Frontend redirects to Stripe
        ↓
User authenticates with Stripe
        ↓
Stripe redirects back with authorization code
        ↓
Backend exchanges code for access token
        ↓
Backend stores token in database
        ↓
User can now view metrics
```

---

## 📊 Data Flow: Metrics to Dashboard

```
1. User navigates to dashboard
   ↓
2. Frontend calls GET /api/metrics?startDate=...&endDate=...
   ↓
3. Backend:
   a) Verifies JWT token
   b) Finds user's Stripe connection
   c) Queries invoices from database
   d) Calculates metrics (MRR, ARR, etc.)
   e) Aggregates daily revenue
   ↓
4. Returns JSON with:
   - KPI values
   - Invoice array
   - Daily revenue chart data
   ↓
5. Frontend:
   a) Renders KPI cards
   b) Displays revenue chart
   c) Shows invoice table
```

---

## 📡 Webhook Handling

```
Stripe event occurs (e.g., invoice.payment_succeeded)
        ↓
Stripe sends webhook to /api/stripe/webhook
        ↓
Server verifies webhook signature
        ↓
Extract event type and data
        ↓
Process based on event type:
   • invoice.payment_succeeded → Update invoice status
   • invoice.payment_failed → Mark as uncollectible
   • subscription.* → Update subscription status
        ↓
Return 200 OK to Stripe
```

---

## 🗄️ Database Schema

### User
```prisma
User {
  id: String @id
  email: String @unique
  passwordHash: String
  name: String?
  createdAt: DateTime
  updatedAt: DateTime
  
  // Relations
  stripeConnection: StripeConnection?
  subscription: Subscription?
  metricSnapshots: MetricSnapshot[]
}
```

### StripeConnection
```prisma
StripeConnection {
  id: String @id
  userId: String @unique
  stripeAccountId: String @unique
  accessToken: String
  refreshToken: String?
  tokenExpiresAt: DateTime?
  
  // Relations
  user: User
  invoices: Invoice[]
}
```

### Subscription
```prisma
Subscription {
  id: String @id
  userId: String @unique
  stripeCustomerId: String @unique
  plan: String ("free" | "pro")
  status: String ("active" | "canceled" | "past_due")
  currentPeriodStart: DateTime?
  currentPeriodEnd: DateTime?
  
  // Relations
  user: User
}
```

### Invoice
```prisma
Invoice {
  id: String @id
  stripeConnectionId: String
  stripeInvoiceId: String @unique
  customerId: String
  amount: Int
  currency: String
  status: String ("paid" | "unpaid" | "uncollectible")
  paidAt: DateTime?
  
  // Relations
  stripeConnection: StripeConnection
}
```

### MetricSnapshot
```prisma
MetricSnapshot {
  id: String @id
  userId: String
  mrr: Int
  arr: Int
  activeSubscriptions: Int
  failedPayments: Int
  totalRevenue: Int
  date: DateTime
  
  // Relations
  user: User
}
```

---

## 🛡️ Security Architecture

### Password Security
- Hashed with bcrypt (10 salt rounds)
- Never stored in plaintext
- Never returned in API responses

### Token Security
- JWT with HMAC signature
- 7-day expiration
- Signed with `JWT_SECRET`
- Verified on every protected request
- Only sent over HTTPS in production

### Stripe Token Security
- Stored encrypted in database (in production)
- Never exposed to frontend
- Only used server-side for API calls
- Rotated on reconnection

### Input Validation
- All inputs validated with Zod
- Email format validation
- Password minimum 8 characters
- Type checking throughout

### CORS Protection
- CORS enabled for same-origin
- No credentials in cross-origin requests
- API paths prefixed with `/api`

---

## 🎨 Frontend Architecture

### Page Structure
```
App.tsx
├── Landing.tsx          (Public)
├── Login.tsx            (Public)
├── Signup.tsx           (Public)
├── Dashboard.tsx        (Protected - checks token)
└── NotFound.tsx         (Catch-all)
```

### Component Hierarchy
```
ErrorBoundary
└── QueryClientProvider
    └── TooltipProvider
        ├── Toaster
        ├── Sonner (Notifications)
        └── BrowserRouter
            └── Routes
```

### State Management
- React hooks for local state
- localStorage for JWT token
- React Query for server state (prepared for future use)
- No global state library (keep simple)

---

## 🚀 Performance Optimizations

### Frontend
- Code splitting by route (automatic with Vite)
- Lazy loading components
- Chart library optimized (Recharts)
- CSS scoped to components
- Tailwind CSS for small bundle size

### Backend
- Database queries indexed
- Pagination ready for invoices
- Metrics cached (could add Redis)
- Connection pooling (Neon)
- Async/await for non-blocking I/O

### Network
- JSON compression enabled
- GZIP enabled on Express
- Minimal API payloads
- Efficient database queries

---

## 📈 Scalability Considerations

### Current MVP
- Single Express instance
- Single PostgreSQL database
- Can handle ~1,000 users

### Scale to 10,000 Users
- Add load balancer
- Horizontal scaling with multiple Express instances
- Database read replicas
- Caching layer (Redis)
- CDN for static assets

### Scale to 100,000+ Users
- Microservices architecture
- Event-driven webhooks
- Message queue (RabbitMQ)
- Separate metrics service
- Time-series database for metrics

---

## 🧪 Testing Strategy

### Unit Tests
- Utility functions (auth, validation)
- Database queries with test fixtures
- Stripe API mocking

### Integration Tests
- Auth flow (signup → login → dashboard)
- Stripe OAuth flow
- Webhook handling

### E2E Tests
- Full user journey
- Payment flow
- Error scenarios

---

## 📝 Code Conventions

### File Naming
- Components: PascalCase (e.g., `Dashboard.tsx`)
- Utilities: camelCase (e.g., `authUtils.ts`)
- Pages: PascalCase (e.g., `Landing.tsx`)

### Imports
- Absolute imports with `@/` alias
- Group imports: React, libraries, locals
- Sort alphabetically within groups

### Types
- Define in separate `types/` files
- Interface for objects
- Type for unions/aliases
- Export from one place

### Error Handling
- Try/catch in async functions
- Toast notifications for users
- Console logs for debugging
- Error boundary for UI crashes

---

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Start dev server
pnpm dev

# Make changes
# Changes hot-reload automatically
```

### 2. Database Changes
```bash
# Update prisma/schema.prisma
# Then run:
pnpm prisma migrate dev --name feature_name
```

### 3. Type Checking
```bash
pnpm typecheck
```

### 4. Production Build
```bash
pnpm build
pnpm start
```

---

## 🎯 Design Decisions

### Why Express + React?
- Lightweight and flexible
- Easy to deploy
- Perfect for MVP/startup
- Scales as needed

### Why Prisma?
- Type-safe ORM
- Great migrations
- Excellent DX
- Works with any SQL database

### Why Tailwind CSS?
- Small bundle size
- Utility-first
- Great for dark mode
- Responsive by default

### Why JWT + localStorage?
- Stateless authentication
- No server sessions needed
- Easy to understand
- Works well for SPAs

### Why separate auth + stripe routes?
- Clear separation of concerns
- Easy to test independently
- Modular code organization
- Can swap implementations

---

## 🚧 Future Improvements

### Short Term
- Add email verification
- Reset password flow
- Two-factor authentication
- Advanced filtering

### Medium Term
- Multiple Stripe accounts
- Team accounts
- Email reports
- Slack notifications

### Long Term
- AI insights
- Predictive analytics
- Advanced reporting
- API marketplace

---

**Architecture designed for simplicity, security, and scalability.**
