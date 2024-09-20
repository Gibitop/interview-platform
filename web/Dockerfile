FROM node:22.9-alpine3.20

WORKDIR /app

COPY web web
COPY backend backend
COPY insider insider

# TODO: Make it so we don't need to install other projects' dependencies

WORKDIR /app/backend
RUN npm install

WORKDIR /app/insider
# Required for node-pty
RUN apk add make python3 g++
RUN npm install

WORKDIR /app/web
RUN npm install

RUN npm run build


FROM --platform=linux/amd64 caddy:2.8.4-alpine

COPY --from=0 /app/web/dist /srv
COPY web/Caddyfile /etc/caddy/Caddyfile
