FROM node:20-alpine

WORKDIR /app


COPY package.json package.json
COPY signalling.js signalling.js
RUN npm install

USER node

CMD node signalling.js
