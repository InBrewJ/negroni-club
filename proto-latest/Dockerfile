# syntax=docker/dockerfile:1.6
# Two-stage: install deps (with build toolchain for native modules), then a slim runtime.

FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine AS runtime
RUN apk add --no-cache tini
WORKDIR /app

# App files
COPY --from=deps /app/node_modules ./node_modules
COPY package.json server.js index.html sw.js manifest.json icon.svg ./

# SQLite + WAL files live here (mount a volume at /app/data to persist).
RUN mkdir -p /app/data && chown -R node:node /app /app/data

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATA_DIR=/app/data

USER node
EXPOSE 3000
VOLUME ["/app/data"]

ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","server.js"]
