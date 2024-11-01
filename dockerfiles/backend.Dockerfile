FROM node:22.11-alpine3.20

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY . .
RUN npm run build


FROM node:22.11-alpine3.20

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --omit=dev

COPY --from=0 /app/dist dist

CMD node dist/main.js
