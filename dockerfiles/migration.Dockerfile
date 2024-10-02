FROM node:22.9-alpine3.20

WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY . .

CMD npm run drizzle-migrate
