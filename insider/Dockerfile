FROM node:20-alpine

WORKDIR /insider

COPY . .

RUN yarn install
RUN yarn build

CMD yarn start
