# syntax = docker/dockerfile:1

FROM node:20.11.1-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install OpenSSL, bash and other dependencies needed for Prisma
RUN apk add --no-cache libc6-compat openssl openssl-dev bash
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
# Install OpenSSL and bash for Prisma
RUN apk add --no-cache openssl openssl-dev bash
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client with explicit binary targets
RUN npx prisma generate

# Build the application
RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
# Install OpenSSL, bash, and su-exec (for privilege dropping) for runtime
RUN apk add --no-cache openssl bash su-exec
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files and deployment scripts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/scripts ./scripts

# Copy required dependencies for seed script
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy and make entrypoint script executable
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh scripts/deploy-db.sh

# NOTE: We intentionally remain root here so the Fly.io release_command (which runs the
# entrypoint + deploy-db.sh) can adjust ownership/permissions on the mounted volume /data.
# The application runtime will drop privileges to the 'nextjs' user inside docker-entrypoint.sh.

EXPOSE 3000

ENV PORT=3000

# Use custom entrypoint that can handle both release commands and normal startup
# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD []