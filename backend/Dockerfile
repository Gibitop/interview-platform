FROM node:22.9-alpine3.20

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build


FROM node:22.9-alpine3.20

WORKDIR /app

COPY --from=0 /app/package.json package.json
COPY --from=0 /app/package-lock.json /package-lock.json
RUN npm install --omit=dev

COPY --from=0 /app/dist dist

CMD node dist/main.js
