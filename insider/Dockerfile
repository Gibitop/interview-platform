FROM node:22.9-alpine3.20

# Required for node-pty
RUN apk add make python3 g++

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build


FROM node:22.9-alpine3.20

# Required for node-pty
RUN apk add make python3 g++

WORKDIR /app

COPY --from=0 /app/package.json package.json
COPY --from=0 /app/package-lock.json package-lock.json
RUN npm install --omit=dev

COPY --from=0 /app/dist dist

RUN mkdir -p /interview
RUN chown node:node /interview

USER node
RUN echo "// Hello World!" > /interview/index.ts

ENV WORKING_DIRECTORY=/interview
ENV START_ACTIVE_FILE_NAME=index.ts

CMD node dist/src/main.js
