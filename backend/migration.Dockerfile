FROM --platform=linux/amd64 node:22.9-alpine3.20

WORKDIR /app

COPY . .

RUN npm install

CMD npm run drizzle-migrate
