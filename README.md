# StudyHub

A university-structured educational platform where students and professors upload videos, notes, and study material organized by **University → Degree → Subject → Topic**.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma ORM** + PostgreSQL
- **NextAuth** (Google + Credentials)
- **Cloudflare R2** (S3-compatible file storage)
- **Mux** (video streaming & processing)
- **Stripe** (subscription payments)
- **Tailwind CSS**
- **Zod** (validation)

---

## Local Setup

### 1. Clone & install

```bash
git clone <repo>
cd studyhub
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in all values (see sections below).

### 3. Database

```bash
# Start PostgreSQL locally (Docker example)
docker run --name studyhub-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=studyhub -p 5432:5432 -d postgres

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `student@demo.com` | `demo123` | USER |
| `creator@demo.com` | `demo123` | CREATOR |
| `admin@demo.com`   | `demo123` | ADMIN |

---

## Environment Variables

### Database

```env
DATABASE_URL="postgresql://user:password@localhost:5432/studyhub"
```

### NextAuth

```env
NEXTAUTH_SECRET="generate with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### Google OAuth (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:3000/api/auth/callback/google` as redirect URI

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## Cloudflare R2 Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Create a bucket named `studyhub-uploads`
3. Go to **Manage R2 API Tokens** → Create token with **Object Read & Write** permissions
4. Enable **Public Access** on the bucket (or configure a custom domain)

```env
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="studyhub-uploads"
R2_PUBLIC_DOMAIN="pub-xxxx.r2.dev"  # from R2 public bucket settings
```

**CORS configuration** (required for direct browser uploads):

In R2 bucket → Settings → CORS:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Mux Setup

1. Sign up at [mux.com](https://mux.com)
2. Go to **Settings → API Access Tokens** → Create token

```env
MUX_TOKEN_ID="..."
MUX_TOKEN_SECRET="..."
```

### Mux Webhook

1. Go to **Settings → Webhooks** → Add endpoint
2. URL: `https://yourdomain.com/api/mux/webhook`
3. Events: `video.asset.ready`, `video.asset.errored`
4. Copy the signing secret

```env
MUX_WEBHOOK_SECRET="..."
```

For local development, use [ngrok](https://ngrok.com):
```bash
ngrok http 3000
# Use the https URL as your webhook endpoint
```

---

## Stripe Setup

1. Sign up at [stripe.com](https://stripe.com)
2. Go to **API keys** and copy secret key

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Create subscription product

1. Stripe Dashboard → **Products → Add product**
2. Set recurring price (e.g. €9.99/month)
3. Copy the Price ID

```env
STRIPE_PRICE_ID="price_..."
```

### Stripe Webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://yourdomain.com/api/stripe/webhook`
3. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Local testing with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Platform Structure

```
University
  └── Degree
        └── Subject
              └── Topic
                    └── Content (VIDEO | NOTES | PDF | EXERCISE_SOLUTIONS)
```

### User Roles

| Role | Capabilities |
|------|-------------|
| `USER` | Browse content, subscribe |
| `CREATOR` | Upload content, create subjects/topics |
| `ADMIN` | Approve/reject content, manage users |

Users can self-upgrade to CREATOR from the dashboard.

### Video Upload Flow

1. Creator submits form → content record created in DB (status: DRAFT)
2. Frontend requests presigned URL from `/api/upload/presigned`
3. File uploaded directly to Cloudflare R2 (bypasses server)
4. Frontend calls `/api/upload/complete` → backend submits video URL to Mux
5. Mux processes video → webhook fires `video.asset.ready`
6. DB updated with `muxPlaybackId`, status → `REVIEW`
7. Admin approves → status → `PUBLISHED`

### Subscription (Stripe)

- Free content: always accessible
- Premium content: requires active subscription
- POST `/api/stripe/checkout` → redirects to Stripe Checkout
- Webhooks update subscription status in DB automatically

---

## Key File Locations

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema |
| `src/lib/auth.ts` | NextAuth config |
| `src/lib/r2.ts` | R2 presigned URL helpers |
| `src/lib/mux.ts` | Mux asset creation |
| `src/lib/stripe.ts` | Stripe client |
| `src/app/api/` | All API routes |
| `src/app/(pages)/` | UI pages |
| `src/components/` | Reusable components |

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npx prisma studio    # Database GUI
npx prisma migrate dev  # Run new migrations
```
