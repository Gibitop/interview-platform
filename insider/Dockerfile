FROM node:20-alpine

WORKDIR /app

COPY . .

# Required for node-pty
RUN apk add make python3 g++

RUN npm i
RUN npm run build

RUN mkdir -p /app/wd
RUN echo "hello" > /app/wd/test.txt

CMD npm run start
