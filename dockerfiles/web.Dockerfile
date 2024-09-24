FROM node:22.9-alpine3.20

WORKDIR /app/backend
COPY backend .
RUN npm install

WORKDIR /app/insider
COPY insider .

WORKDIR /app/web
COPY web .
RUN npm install
RUN npm run build


FROM caddy:2.8.4-alpine

COPY --from=0 /app/web/dist /srv
COPY web/Caddyfile /etc/caddy/Caddyfile
