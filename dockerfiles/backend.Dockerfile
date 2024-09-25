FROM node:22.9-alpine3.20

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build


FROM node:22.9-alpine3.20

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install --omit=dev

COPY --from=0 /app/dist dist

CMD node dist/main.js
