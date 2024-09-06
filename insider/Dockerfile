FROM node:20-alpine

WORKDIR /insider

COPY . .

# Required for node-pty
RUN apk add make python3 g++

RUN npm i
RUN npm run build

CMD npm run start
