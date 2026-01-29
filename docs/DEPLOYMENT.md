# Deployment Guide

This guide covers setting up Vercel deployments for the Axori web and admin apps.

## Overview

| App | Directory | Production URL | Preview |
|-----|-----------|----------------|---------|
| Web | `apps/web` | app.axori.com | Auto-generated Vercel URLs |
| Admin (Forge) | `apps/admin` | admin.axori.com | Auto-generated Vercel URLs |

> **Note:** This guide covers production deployment + Vercel's built-in preview deployments. A separate staging environment can be added later with Vercel Pro.

## Prerequisites

- GitHub repository with Actions enabled
- Vercel account (free tier works for production + previews)
- Supabase project
- Clerk application

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

### Repository Secrets

**Path:** Settings → Secrets and variables → Actions → **Repository secrets** → New repository secret

| Secret | Value | Description |
|--------|-------|-------------|
| `VERCEL_TOKEN` | `your-token` | From Step 3 |
| `VERCEL_ORG_ID` | `team_xxx` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID_WEB` | `prj_xxx` | From `apps/web/.vercel/project.json` |
| `VERCEL_PROJECT_ID_ADMIN` | `prj_xxx` | From `apps/admin/.vercel/project.json` |
| `PROD_DATABASE_URL` | `postgresql://...` | Supabase connection string |
| `FORGE_WEBHOOK_SECRET` | `openssl rand -base64 32` | For deployment notifications (optional) |

### Repository Variables

**Path:** Settings → Secrets and variables → Actions → **Variables** tab → New repository variable

| Variable | Value | Description |
|----------|-------|-------------|
| `PRODUCTION_DOMAIN` | `app.axori.com` | Custom production domain (optional) |

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

Add these in Vercel Dashboard → Project → **Settings** → **Environment Variables**

| Variable | Value | Environments | Description |
|----------|-------|--------------|-------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | All | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | All | Supabase anon/public key |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_xxx...` | All | Clerk publishable key |
| `VITE_API_URL` | `https://api.axori.com` | Production | Production API URL |
| `VITE_API_URL` | `http://localhost:3001` | Preview, Development | Dev/preview API URL |
| `VITE_COMING_SOON_MODE` | `false` | All | Set to `true` to show landing page |

**Where to find these values:**

- **Supabase URL & Anon Key**: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
- **Clerk Publishable Key**: https://dashboard.clerk.com → Your app → API Keys

---

## Step 6: Configure Custom Domain (Production Only)

### In Vercel Dashboard

1. Go to Project → **Settings** → **Domains**
2. Add your production domain: `app.axori.com`

### DNS Configuration

Add this record in your DNS provider (Cloudflare, Namecheap, etc.):

| Type | Name | Value |
|------|------|-------|
| CNAME | app | cname.vercel-dns.com |

For admin app, repeat with `admin` subdomain.

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
Deploy to Vercel Preview URL
    ↓
Comment on PR with preview URL (e.g., axori-web-abc123.vercel.app)
```

### Production Deployments

```
Push/merge to main branch
    ↓
GitHub Actions runs
    ↓
Type check → Lint → Test → Build
    ↓
Deploy to app.axori.com
    ↓
Create GitHub Release
```

---

## Troubleshooting

### "VERCEL_TOKEN is not set"

Ensure the secret is added in GitHub repo settings, not just locally.

### Build fails with "Cannot find module"

Check that the Root Directory is set correctly in Vercel project settings.

### Preview URL not working

1. Check Vercel deployment logs
2. Check if build completed successfully
3. Ensure environment variables are set for "Preview" environment

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
3. **.env.local is gitignored** - Safe for local development secrets

---

## Quick Start Checklist

- [ ] Install Vercel CLI (`npm i -g vercel`)
- [ ] Run `vercel link` in `apps/web`
- [ ] Run `vercel link` in `apps/admin`
- [ ] Generate Vercel API token
- [ ] Add GitHub repository secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID_WEB, VERCEL_PROJECT_ID_ADMIN, PROD_DATABASE_URL)
- [ ] Set Root Directory in Vercel project settings
- [ ] Add environment variables in Vercel dashboard
- [ ] Configure custom domain (optional)
- [ ] Push to a feature branch to test preview deployment

---

## Future: Adding Staging Environment

When ready to upgrade to Vercel Pro for a dedicated staging environment:

1. Create `staging` branch in GitHub
2. Add staging environment in GitHub (Settings → Environments)
3. Add staging secrets (`STAGING_DATABASE_URL`, etc.)
4. Configure staging domain in Vercel (`staging.axori.com`)
5. Update workflows to deploy to staging on `staging` branch pushes
