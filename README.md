# Axori

A modern property management platform built with TanStack Start, React Native, and Supabase.

## Tech Stack

### Frontend
- **TanStack Start** - React framework
- **React Native/Expo** - Mobile app
- **TypeScript** with **Zod** - Type safety and validation
- **TanStack Query & Form** - Data fetching and form management
- **Tailwind CSS** - Styling

### Backend & Database
- **PostgreSQL** via **Supabase**
- **Drizzle ORM** - Database toolkit
- **Clerk** - Authentication

### Monorepo & Tooling
- **pnpm Workspaces** - Package management
- **Turborepo** - Build system
- **Playwright** - E2E testing

### Infrastructure
- **Vercel** - Hosting
- **Resend + React Email** - Transactional email
- **PostHog** - Analytics

### External Integrations
- **AppFolio** - Property management data
- **Rentcast API** - Primary property data
- **ATTOM Data** - Supplemental property info
- **Plaid** - Bank account integration
- **AI agents** via Tavily/Perplexity - Fallback data

## Getting Started

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Quick Start

1. **Prerequisites**
   - Node.js >= 18.0.0
   - pnpm >= 8.0.0

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Fill in your API keys and configuration
   ```

4. **Set up database**
   ```bash
   pnpm --filter @axori/db db:push
   ```

5. **Start development**
   ```bash
   pnpm dev
   ```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter web dev
pnpm --filter mobile dev
pnpm --filter api dev
```

### Building

```bash
pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

## Project Structure

```
axori/
├── apps/
│   ├── web/          # TanStack Start web app
│   ├── mobile/       # React Native/Expo app
│   └── api/          # Backend API (Hono)
├── packages/
│   ├── shared/       # Shared utilities, types, integrations
│   └── db/           # Drizzle schema and migrations
├── turbo.json        # Turborepo configuration
└── pnpm-workspace.yaml
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

## License

Private

