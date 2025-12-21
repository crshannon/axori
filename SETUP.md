# Setup Guide

## Prerequisites

- Node.js >= 18.0.0 (use `.nvmrc` for version management)
- pnpm >= 8.0.0
- PostgreSQL database (or Supabase account)

## Initial Setup

1. **Install pnpm** (if not already installed):

   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Set up environment variables**:

   ```bash
   cp .env.example .env
   ```

   Fill in the required values in `.env`:
   - Database connection string (Supabase or PostgreSQL)
   - Clerk authentication keys
   - API keys for external services (Rentcast, ATTOM, AppFolio, Plaid, etc.)
   - Resend API key for emails
   - PostHog keys for analytics

4. **Set up the database**:

   ```bash
   # Generate migrations
   pnpm --filter @axori/db db:generate

   # Push schema to database
   pnpm --filter @axori/db db:push

   # Or run migrations
   pnpm --filter @axori/db db:migrate
   ```

5. **Start development servers**:

   ```bash
   # Start all apps
   pnpm dev

   # Or start individually:
   pnpm --filter @axori/web dev      # Web app (port 3000)
   pnpm --filter @axori/mobile dev    # Mobile app
   pnpm --filter @axori/api dev       # API server (port 3001)
   ```

## External Service Setup

### Clerk Authentication

1. Create a Clerk account at https://clerk.com
2. Create a new application
3. Copy the publishable key and secret key to `.env`

### Supabase

1. Create a Supabase project at https://supabase.com
2. Get your database URL from Project Settings > Database
3. Add to `.env` as `DATABASE_URL`

### Rentcast API

1. Sign up at https://rentcast.io
2. Get your API key from the dashboard
3. Add to `.env` as `RENTCAST_API_KEY`

### ATTOM Data

1. Sign up at https://attomdata.com
2. Get your API key
3. Add to `.env` as `ATTOM_API_KEY`

### AppFolio

1. Set up AppFolio API access
2. Get client ID and secret
3. Add to `.env` as `APPFOLIO_CLIENT_ID` and `APPFOLIO_CLIENT_SECRET`

### Plaid

1. Create a Plaid account at https://plaid.com
2. Get your client ID and secret (sandbox for development)
3. Add to `.env` as `PLAID_CLIENT_ID`, `PLAID_SECRET`, and `PLAID_ENV`

### Resend

1. Create a Resend account at https://resend.com
2. Get your API key
3. Add to `.env` as `RESEND_API_KEY`

### PostHog

1. Create a PostHog account at https://posthog.com
2. Get your project API key
3. Add to `.env` as `NEXT_PUBLIC_POSTHOG_KEY`

## Testing

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm --filter @axori/web test:e2e:ui
```

## Building for Production

```bash
# Build all apps
pnpm build

# Build individual apps
pnpm --filter @axori/web build
pnpm --filter @axori/mobile build
pnpm --filter @axori/api build
```

## Deployment

### Vercel (Web App)

The project is configured for Vercel deployment. Connect your repository to Vercel and it will automatically detect the configuration.

### Mobile App

Build and deploy using Expo:

```bash
pnpm --filter @axori/mobile build
```

### API

Deploy the API server to your preferred hosting platform (Vercel, Railway, Fly.io, etc.)
