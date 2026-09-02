# Build from the repo root: docker build -f apps/web/Dockerfile -t instantdrop-web .
#
# NEXT_PUBLIC_SERVER_URL is inlined at BUILD time (Next.js convention), so it
# must be passed as a build arg, not just a runtime env var.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace=@instantdrop/web --include-workspace-root

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
RUN npm run build --workspace=@instantdrop/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/next.config.mjs

EXPOSE 3000
WORKDIR /app/apps/web
CMD ["npm", "run", "start"]
