# Deployment Guide

This guide covers setting up Vercel deployments for the Axori web and admin apps.

## Overview

| App | Directory | Production URL | Preview |
|-----|-----------|----------------|---------|
| Web | `apps/web` | app.axori.com | Auto-generated Vercel URLs |
| Admin (Forge) | `apps/admin` | admin.axori.com | Auto-generated Vercel URLs |

> **Note:** Staging deploys automatically when merging to `main`. Production deploys via tag releases (e.g., `v1.0.0`).

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

### CI (All Branches)

```
Push to any branch (except main)
    ↓
GitHub Actions runs CI workflow
    ↓
Type check → Lint → Test
    ↓
Pass/Fail status reported
```

### Preview Deployments (Pull Requests)

```
Open/update PR against main
    ↓
GitHub Actions runs Preview workflow
    ↓
Type check → Lint → Test → Build
    ↓
Deploy to Vercel Preview URL
    ↓
Comment on PR with preview URL (e.g., axori-web-abc123.vercel.app)
```

### Staging Deployments (Merge to Main)

```
Merge PR to main
    ↓
GitHub Actions runs Staging workflow
    ↓
Type check → Lint → Test → Build
    ↓
Run database migrations
    ↓
Deploy to staging URL
    ↓
Run E2E tests (if staging domain configured)
```

### Production Deployments (Tag Release)

```
Create and push a release tag (e.g., v1.0.0)
    ↓
GitHub Actions runs Production workflow
    ↓
Type check → Lint → Test → Build
    ↓
Run database migrations
    ↓
Deploy to production URL
    ↓
Create GitHub Release with release notes
```

### Creating a Release

To deploy to production, create a tag:

```bash
# Create an annotated tag
git tag -a v1.0.0 -m "Release v1.0.0"

# Push the tag to trigger production deployment
git push origin v1.0.0
```

**Tag naming convention:** `v{major}.{minor}.{patch}` (e.g., `v1.0.0`, `v1.2.3`)

You can also trigger a manual production deployment from GitHub Actions → Production Deployment → Run workflow.

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

## Admin App Role Setup

The admin app uses role-based access control (RBAC) stored in Clerk user metadata.

### Available Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access to all features |
| `admin` | User management, settings, billing |
| `developer` | Forge: tickets, agents, deployments, registry |
| `viewer` | Read-only access to Forge dashboards |

Users can have multiple roles (e.g., `admin` + `developer`).

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

**For Developers:**
```json
{
  "adminRoles": ["developer"]
}
```

**For Combined Access:**
```json
{
  "adminRoles": ["admin", "developer"]
}
```

### Via Clerk API (Automation)

```typescript
import { clerkClient } from "@clerk/clerk-sdk-node";

// Grant developer role
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    adminRoles: ["developer"],
  },
});

// Grant multiple roles
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: {
    adminRoles: ["admin", "developer"],
  },
});
```

### Role Verification

After setting roles, the user should:
1. Sign out of the admin app
2. Sign back in
3. Verify they can see the appropriate navigation items

---

## Staging Environment Setup

Staging is automatically deployed when code is merged to `main`. To configure:

1. **GitHub Environment**: Create `staging` environment in GitHub (Settings → Environments)
2. **Secrets**: Add staging-specific secrets:
   - `STAGING_DATABASE_URL`
   - `STAGING_SUPABASE_URL`
   - `STAGING_SUPABASE_ANON_KEY`
   - `STAGING_CLERK_PUBLISHABLE_KEY`
   - `STAGING_API_URL`
3. **Variables**: Add `STAGING_DOMAIN` variable (e.g., `staging.axori.com`)
4. **Vercel**: Configure the staging domain alias in Vercel project settings

Note: Staging deployments use the same Vercel project as production but with a different domain alias.
