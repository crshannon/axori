# Build stage
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/permissions/package.json ./packages/permissions/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app ./

# Copy source files
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY tsconfig.json ./

# Build the API (tsup bundles everything)
RUN pnpm --filter @axori/api build

# Production stage
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built output and node_modules for external dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3001

CMD ["node", "dist/index.js"]
