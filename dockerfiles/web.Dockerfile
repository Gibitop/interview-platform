FROM node:22.11-alpine3.20

WORKDIR /app/backend
COPY backend/package.json ./package.json
COPY backend/package-lock.json ./package-lock.json
RUN npm install

WORKDIR /app/insider
COPY insider .

WORKDIR /app/web
COPY web/package.json ./package.json
COPY web/package-lock.json ./package-lock.json
RUN npm install

WORKDIR /app/backend
COPY backend .

WORKDIR /app/web
COPY web .
RUN npm run build


FROM caddy:2.8.4-alpine

COPY --from=0 /app/web/dist /srv
COPY web/Caddyfile /etc/caddy/Caddyfile
