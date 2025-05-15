FROM oven/bun:1.2.13-alpine

WORKDIR /app

COPY package.json package.json
COPY bun.lock bun.lock
RUN bun install --frozen-lockfile

COPY . .

CMD bun drizzle-migrate
