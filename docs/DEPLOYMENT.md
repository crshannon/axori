# Deployment Guide

This guide covers setting up deployments for the Axori platform.

## Overview

| App | Directory | Platform | Production URL |
|-----|-----------|----------|----------------|
| Web | `apps/web` | Vercel | app.axori.com |
| Admin (Forge) | `apps/admin` | Vercel | admin.axori.com |
| API | `apps/api` | Railway | api.axori.com |

> **Note:** Staging deploys automatically when merging to `main` (uses Vercel preview URLs). Production deploys via tag releases (e.g., `v1.0.0`).

## Architecture

```
                    GitHub Actions
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │   Vercel    │ │   Railway   │ │  Supabase   │
   │  Web/Admin  │ │     API     │ │  Database   │
   └─────────────┘ └─────────────┘ └─────────────┘
```

## Prerequisites

- GitHub repository with Actions enabled
- Vercel account (free tier works)
- Railway account (Starter plan recommended)
- Supabase project
- Clerk application

---

## Part 1: Vercel Setup (Web & Admin)

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Create Vercel Projects

You need **two separate Vercel projects** - one for web, one for admin.

#### Web App

```bash
cd apps/web
vercel link
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your team/account
- Link to existing project? **N** (first time) or **Y** (if exists)
- Project name: `axori-web`
- Directory: `./` (current directory)

This creates `apps/web/.vercel/project.json`:
```json
{
  "orgId": "team_xxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxx"
}
```

**Save these values** - you'll need them for GitHub secrets.

#### Admin App

```bash
cd apps/admin
vercel link
```

Follow the same prompts:
- Project name: `axori-admin`

This creates `apps/admin/.vercel/project.json` with different project ID.

### Step 3: Get Vercel API Token

1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Name: `GitHub Actions - Axori`
4. Scope: Full Account (or specific team)
5. Expiration: No expiration (or set reminder to rotate)
6. **Copy the token immediately** - you won't see it again

### Step 4: Configure Vercel Project Settings

For each project in Vercel Dashboard:

#### Build Settings

1. Go to Project → **Settings** → **General**
2. Configure:

| Setting | Value |
|---------|-------|
| Framework Preset | TanStack Start |
| Root Directory | `apps/web` (or `apps/admin`) |
| Build Command | (use default) |
| Output Directory | (use default) |

#### Disable Auto-Deploy (Important!)

1. Go to **Settings** → **Git**
2. Scroll to **"Ignored Build Step"**
3. Select **"Custom"** and enter: `exit 0`
4. Click **Save**

This ensures deployments only happen through GitHub Actions.

---

## Part 2: Railway Setup (API)

### Step 1: Create Railway Project and Service

1. Go to https://railway.app/new
2. Create a new project named `axori-api`
3. Click **+ New Service** → **Empty Service**
4. Name the service `api` (or any name you prefer)
5. Note the **Project ID** from project settings
6. Note the **Service Name** for GitHub secrets

### Step 2: Get Railway Token

1. Go to https://railway.app/account/tokens
2. Create a new token named `GitHub Actions - Axori`
3. Copy the token immediately

### Step 3: Configure Railway Environment Variables

In Railway Dashboard → Your Project → **Variables** (use Shared Variables):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `CLERK_SECRET_KEY` | Clerk backend API key |
| `ALLOWED_ORIGINS` | Production URLs: `https://app.axori.com,https://admin.axori.com` |
| `STRIPE_SECRET_KEY` | Stripe API key (if using billing) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `RESEND_API_KEY` | Resend email API key |
| `ANTHROPIC_API_KEY` | Anthropic API key (for AI features) |
| `APP_URL` | `https://app.axori.com` |

> **Note:** `PORT` is set automatically by Railway.

### Step 4: Configure Custom Domain (Optional)

1. In Railway dashboard, go to service settings
2. Add custom domain: `api.axori.com`
3. Configure DNS CNAME record pointing to Railway's domain

---

## Part 3: GitHub Configuration

### Repository Secrets

Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **Secrets**

| Secret | Value | Description |
|--------|-------|-------------|
| `VERCEL_TOKEN` | `your-vercel-token` | Vercel API token |
| `VERCEL_ORG_ID` | `team_xxx` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID_WEB` | `prj_xxx` | From `apps/web/.vercel/project.json` |
| `VERCEL_PROJECT_ID_ADMIN` | `prj_xxx` | From `apps/admin/.vercel/project.json` |
| `RAILWAY_TOKEN` | `your-railway-token` | Railway API token |
| `RAILWAY_PROJECT_ID` | `xxx` | Railway project ID |
| `RAILWAY_SERVICE_NAME` | `api` | Name of your API service in Railway |
| `PROD_DATABASE_URL` | `postgresql://...` | Production Supabase connection |
| `FORGE_WEBHOOK_SECRET` | `xxx` | For deployment notifications (optional) |

### Repository Variables

Go to **Variables** tab:

| Variable | Value | Description |
|----------|-------|-------------|
| `PRODUCTION_DOMAIN` | `app.axori.com` | Web production domain |
| `PRODUCTION_ADMIN_DOMAIN` | `admin.axori.com` | Admin production domain |

---

## Deployment Flows

### Preview Deployments (Pull Requests)

```
PR opened/updated
    ↓
Detect changes (path filtering)
    ↓
CI: Type check → Lint → Test
    ↓
Deploy changed apps to Vercel preview
    ↓
Comment on PR with preview URLs
```

**Path filtering:** Only deploys apps that have changed:
- Web changes → Deploy web preview
- Admin changes → Deploy admin preview
- Both changed → Deploy both

### Staging Deployments (Merge to Main)

```
Merge PR to main
    ↓
Detect changes (path filtering)
    ↓
CI: Type check → Lint → Test
    ↓
Run database migrations (if db changed)
    ↓
Deploy to Vercel preview URLs (staging)
    ↓
Deploy API to Railway (if api changed)
```

> **Note:** Staging uses Vercel **preview URLs**, not custom domains. This works on Vercel's free tier.

### Production Deployments (Tag Release)

```
Create and push tag (e.g., v1.0.0)
    ↓
CI: Type check → Lint → Test
    ↓
Run database migrations
    ↓
Deploy Web/Admin to Vercel production (--prod)
    ↓
Deploy API to Railway production
    ↓
Create GitHub Release
```

### Creating a Release

```bash
# Create an annotated tag
git tag -a v1.0.0 -m "Release v1.0.0"

# Push the tag to trigger production deployment
git push origin v1.0.0
```

---

## Troubleshooting

### "VERCEL_TOKEN is not set"

Ensure the secret is added in GitHub repo settings, not just locally.

### "RAILWAY_TOKEN is not set"

Add Railway token to GitHub secrets.

### Build fails with "Cannot find module"

Check that the Root Directory is set correctly in Vercel project settings.

### API CORS errors

The API automatically allows:
- Origins listed in `ALLOWED_ORIGINS` environment variable
- All `*.vercel.app` URLs (for previews)
- `localhost` (for development)

### Database connection errors

1. Verify DATABASE_URL is correct
2. Check Supabase project is not paused
3. Ensure IP allowlist includes Railway's IPs

---

## Security Notes

1. **Never commit secrets** - Use GitHub Secrets and platform environment variables
2. **Rotate tokens periodically** - Set calendar reminders
3. **.env.local is gitignored** - Safe for local development secrets

---

## Quick Start Checklist

### Vercel (Web & Admin)
- [ ] Install Vercel CLI (`npm i -g vercel`)
- [ ] Run `vercel link` in `apps/web`
- [ ] Run `vercel link` in `apps/admin`
- [ ] Generate Vercel API token
- [ ] Disable Vercel auto-deploy (set "Ignored Build Step" to `exit 0`)

### Railway (API)
- [ ] Create Railway project
- [ ] Generate Railway API token
- [ ] Configure environment variables in Railway

### GitHub
- [ ] Add Vercel secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID_WEB, VERCEL_PROJECT_ID_ADMIN)
- [ ] Add Railway secrets (RAILWAY_TOKEN, RAILWAY_PROJECT_ID)
- [ ] Add database secret (PROD_DATABASE_URL)
- [ ] Add production domain variables

### Test
- [ ] Open a PR to test preview deployment
- [ ] Merge to main to test staging
- [ ] Create a tag to test production

---

## Admin App Role Setup

The admin app uses role-based access control (RBAC) stored in Clerk user metadata.

### Available Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access to all features |
| `admin` | User management, settings, billing |
| `developer` | Forge: tickets, agents, deployments, registry |
| `viewer` | Read-only access to Forge dashboards |

### Setting Up Initial Admin Roles

**Via Clerk Dashboard:**

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Users
2. Select the user you want to grant admin access
3. Go to the **Metadata** tab
4. Under **Public metadata**, add:
   ```json
   {
     "adminRoles": ["super_admin"]
   }
   ```
5. Save changes

---

## Future: Isolated PR Environments (Phase 5)

When you need fully isolated preview environments per PR:

1. **Enable Railway PR Environments** - Creates separate API for each PR
2. **Create staging Supabase project** - Isolated database for non-production
3. **Coordinate Vercel + Railway URLs** - Pass Railway PR URL to Vercel build

This gives each PR:
- Its own API instance on Railway
- Connected to staging database (not production)
- Full isolation for testing

**Prerequisites:**
- Staging Supabase project
- Railway Starter plan (for multiple environments)

See implementation details in the deployment strategy plan.
