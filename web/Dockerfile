FROM node:20-alpine as build

WORKDIR /app

COPY web web
COPY backend backend
COPY insider insider

WORKDIR /app/web

RUN npm install
RUN npm run build

FROM caddy:2.8.4-alpine as final

COPY --from=0 /app/web/dist /srv
COPY web/Caddyfile /etc/caddy/Caddyfile
