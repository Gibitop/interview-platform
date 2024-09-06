FROM node:20-alpine

WORKDIR /project

COPY . web
COPY ../insider insider
COPY ../backend backend

WORKDIR /project/web

RUN npm i
RUN npm run build

CMD npm run start
