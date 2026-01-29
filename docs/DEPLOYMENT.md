# Deployment Guide

This guide covers setting up Vercel deployments for the Axori web and admin apps via GitHub Actions.

## Overview

| App | Directory | Production URL | Staging URL |
|-----|-----------|----------------|-------------|
| Web | `apps/web` | app.axori.com | staging.axori.com |
| Admin (Forge) | `apps/admin` | admin.axori.com | staging-admin.axori.com |

## Prerequisites

- GitHub repository with Actions enabled
- Vercel account (Pro plan recommended for team features)
- Supabase project(s) for staging and production
- Clerk application(s) for staging and production

---

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

---

## Step 2: Create Vercel Projects

You need **two separate Vercel projects** - one for web, one for admin.

### Web App

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

### Admin App

```bash
cd apps/admin
vercel link
```

Follow the same prompts:
- Project name: `axori-admin`

This creates `apps/admin/.vercel/project.json` with different project ID.

---

## Step 3: Get Vercel API Token

1. Go to https://vercel.com/account/tokens
2. Click **Create Token**
3. Name: `GitHub Actions - Axori`
4. Scope: Full Account (or specific team)
5. Expiration: No expiration (or set reminder to rotate)
6. **Copy the token immediately** - you won't see it again

---

## Step 4: Configure GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**

### Repository Secrets (Available to all workflows)

**Path:** Settings → Secrets and variables → Actions → **Repository secrets** → New repository secret

These are shared across all environments and workflows:

| Secret | Value | Description |
|--------|-------|-------------|
| `VERCEL_TOKEN` | `your-token` | From Step 3 |
| `VERCEL_ORG_ID` | `team_xxx` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID_WEB` | `prj_xxx` | From `apps/web/.vercel/project.json` |
| `VERCEL_PROJECT_ID_ADMIN` | `prj_xxx` | From `apps/admin/.vercel/project.json` |
| `FORGE_WEBHOOK_URL` | `https://admin.axori.com` | Admin app URL for webhooks (optional) |
| `FORGE_WEBHOOK_SECRET` | `random-secret` | Shared secret for webhook auth (optional) |

### Repository Variables (Not secrets - for non-sensitive config)

**Path:** Settings → Secrets and variables → Actions → **Variables** tab → New repository variable

| Variable | Value | Description |
|----------|-------|-------------|
| `STAGING_DOMAIN` | `staging.axori.com` | Custom staging domain (optional) |
| `PRODUCTION_DOMAIN` | `app.axori.com` | Custom production domain (optional) |

### Environment Secrets (Scoped to specific environments)

**Path:** Settings → Environments → Select environment → **Environment secrets** → Add secret

First, create the environments:
1. Go to Settings → **Environments**
2. Click **New environment**
3. Create: `staging` and `production`

Then add secrets to each environment:

#### Staging Environment Secrets

| Secret | Value | Description |
|--------|-------|-------------|
| `STAGING_DATABASE_URL` | `postgresql://...` | Supabase staging connection string |
| `STAGING_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase staging API URL |
| `STAGING_SUPABASE_ANON_KEY` | `eyJ...` | Supabase staging anon key |
| `STAGING_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk staging publishable key |
| `STAGING_API_URL` | `https://staging-api.axori.com` | Staging API endpoint |

#### Production Environment Secrets

| Secret | Value | Description |
|--------|-------|-------------|
| `PROD_DATABASE_URL` | `postgresql://...` | Supabase production connection string |
| `PROD_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase production API URL |
| `PROD_SUPABASE_ANON_KEY` | `eyJ...` | Supabase production anon key |
| `PROD_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk production publishable key |
| `PROD_API_URL` | `https://api.axori.com` | Production API endpoint |

> **Note:** Environment secrets provide additional security - you can add protection rules like required reviewers before deploying to production.

---

## Step 5: Configure Vercel Project Settings

For each project in Vercel Dashboard:

### Build Settings

1. Go to Project → **Settings** → **General**
2. Set:
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm build:web` (or `pnpm build:admin`)
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### Root Directory

1. Go to Project → **Settings** → **General**
2. Set **Root Directory**:
   - Web: `apps/web`
   - Admin: `apps/admin`

### Environment Variables

Add these environment variables in Vercel Dashboard for manual deployments:

1. Go to Project → **Settings** → **Environment Variables**
2. Add for each environment (Production, Preview, Development):

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `VITE_SUPABASE_URL` | `https://mullmlaoraflnvgbjdxx.supabase.co` | Your Supabase project URL (Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Supabase anon/public key (Project Settings → API → anon public) |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_xxx...` (staging) / `pk_live_xxx...` (prod) | Clerk publishable key (Clerk Dashboard → API Keys) |
| `VITE_API_URL` | `https://api.axori.com` | Your API server URL |
| `VITE_COMING_SOON_MODE` | `true` or `false` | Enable/disable coming soon landing page |

**Where to find these values:**

- **Supabase**: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
- **Clerk**: https://dashboard.clerk.com → Your app → API Keys

**Tip:** Use different Clerk apps for staging vs production to keep user data separate.

---

## Step 6: Configure Custom Domains

### In Vercel Dashboard

1. Go to Project → **Settings** → **Domains**
2. Add domains:
   - Web Production: `app.axori.com`
   - Web Staging: `staging.axori.com`
   - Admin Production: `admin.axori.com`
   - Admin Staging: `staging-admin.axori.com`

### DNS Configuration

Add these records in your DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | app | cname.vercel-dns.com |
| CNAME | staging | cname.vercel-dns.com |
| CNAME | admin | cname.vercel-dns.com |
| CNAME | staging-admin | cname.vercel-dns.com |

---

## Step 7: Update GitHub Workflows

Update the workflow files to support both apps:

### `.github/workflows/preview.yml`

The current workflow deploys web app. To deploy both apps, the workflow needs modification. See the workflows in `.github/workflows/` for current configuration.

---

## Deployment Flow

### Preview Deployments (Feature Branches)

```
Push to feature/* or fix/* branch
    ↓
GitHub Actions runs
    ↓
Type check → Lint → Test → Build
    ↓
Deploy to Vercel Preview
    ↓
Comment on PR with preview URL
```

### Staging Deployments

```
Push/merge to staging branch
    ↓
GitHub Actions runs
    ↓
Type check → Lint → Test → Migrations → Build
    ↓
Deploy to staging.axori.com
    ↓
Run E2E tests
```

### Production Deployments

```
Push/merge to main branch
    ↓
GitHub Actions runs
    ↓
Type check → Lint → Test → Migrations → Build
    ↓
Deploy to app.axori.com
    ↓
Create GitHub Release
    ↓
Notify Forge (update ticket status)
```

---

## Troubleshooting

### "VERCEL_TOKEN is not set"

Ensure the secret is added in GitHub repo settings, not just locally.

### Build fails with "Cannot find module"

Check that the Root Directory is set correctly in Vercel project settings.

### Preview URL not working

1. Check Vercel deployment logs
2. Verify domain configuration
3. Check if build completed successfully

### Database connection errors

1. Verify DATABASE_URL secret is correct
2. Check Supabase project is not paused (free tier pauses after 1 week)
3. Ensure IP allowlist includes Vercel's IPs (or allow all: `0.0.0.0/0`)

### Type errors in CI but not locally

Run `pnpm type-check` locally before pushing. CI uses strict checks.

---

## Security Notes

1. **Never commit secrets** - Use GitHub Secrets and Vercel Environment Variables
2. **Rotate tokens periodically** - Set calendar reminders
3. **Use separate Clerk/Supabase projects** for staging vs production
4. **Review PR previews** - They have access to staging secrets

---

## Quick Start Checklist

- [ ] Install Vercel CLI
- [ ] Create Vercel project for web app
- [ ] Create Vercel project for admin app
- [ ] Generate Vercel API token
- [ ] Add all GitHub secrets
- [ ] Configure Vercel project settings (root directory, build command)
- [ ] Add environment variables in Vercel dashboard
- [ ] Configure custom domains
- [ ] Update DNS records
- [ ] Test with a feature branch push
