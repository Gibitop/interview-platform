FROM oven/bun:1.2.13-alpine

WORKDIR /app/backend
COPY --from=ghcr.io/gibitop/interview-platform-backend:latest app .

WORKDIR /app/insider
COPY insider .

WORKDIR /app/web
COPY web/package.json ./package.json
COPY web/bun.lock ./bun.lock
RUN bun install --frozen-lockfile

WORKDIR /app/web
COPY web .
RUN bun run build


FROM caddy:2.8.4-alpine

COPY --from=0 /app/web/dist /srv
COPY web/Caddyfile /etc/caddy/Caddyfile
