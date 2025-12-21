# Contributing to Axori

## Development Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   # Fill in your environment variables
   ```

3. Run database migrations:

   ```bash
   pnpm --filter @axori/db db:push
   ```

4. Start development servers:
   ```bash
   pnpm dev
   ```

## Project Structure

- `apps/web` - TanStack Start web application
- `apps/mobile` - React Native/Expo mobile application
- `apps/api` - Backend API server
- `packages/shared` - Shared utilities, types, and integrations
- `packages/db` - Database schema and migrations

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Run `pnpm lint` before committing
- Write tests for new features

## Commits

- Use conventional commits format
- Keep commits focused and atomic

