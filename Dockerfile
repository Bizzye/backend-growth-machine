# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# ---- build ----
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# ---- production dependencies only ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ---- runtime (non-root) ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3333

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node
EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3333/api/health > /dev/null || exit 1

CMD ["node", "dist/server.js"]
