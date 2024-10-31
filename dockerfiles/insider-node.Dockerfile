FROM node:22.9-alpine3.20

# Required for node-pty
RUN apk add make python3 g++

WORKDIR /app
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY . .
RUN npm run build


FROM node:22.9-alpine3.20

# Required for node-pty
RUN apk add make python3 g++

WORKDIR /app

COPY --from=0 /app/package.json package.json
COPY --from=0 /app/package-lock.json package-lock.json
RUN npm install --omit=dev

COPY --from=0 /app/dist dist

ARG WORKING_DIRECTORY
ARG START_ACTIVE_FILE_NAME
ARG PERSISTENCE_DIRECTORY_PATH

RUN mkdir -p $WORKING_DIRECTORY
RUN chown node:node $WORKING_DIRECTORY

RUN mkdir -p $PERSISTENCE_DIRECTORY_PATH
RUN chown node:node $PERSISTENCE_DIRECTORY_PATH


USER node

RUN echo "// Hello World!" > "$WORKING_DIRECTORY/$START_ACTIVE_FILE_NAME"

CMD node dist/src/main.js
