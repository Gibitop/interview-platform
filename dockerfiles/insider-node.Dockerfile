FROM imbios/bun-node:1.2.13-22.14.0-alpine

# Required for node-pty
RUN apk add make python3 g++

WORKDIR /app
COPY package.json package.json
COPY bun.lock bun.lock
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build


FROM imbios/bun-node:1.2.13-22.14.0-alpine

# Required for node-pty
RUN apk add make python3 g++

WORKDIR /app

COPY --from=0 /app/package.json package.json
COPY --from=0 /app/bun.lock bun.lock
RUN bun install --production --frozen-lockfile

COPY --from=0 /app/dist dist

ARG WORKING_DIRECTORY
ARG START_ACTIVE_FILE_NAME
ARG PERSISTENCE_DIRECTORY_PATH

RUN mkdir -p $WORKING_DIRECTORY
RUN chown node:node $WORKING_DIRECTORY

RUN mkdir -p $PERSISTENCE_DIRECTORY_PATH
RUN chown node:node $PERSISTENCE_DIRECTORY_PATH


USER node

RUN echo "Welcome" > "$WORKING_DIRECTORY/$START_ACTIVE_FILE_NAME"

CMD node dist/src/main.js
