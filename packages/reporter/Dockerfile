FROM node:18-alpine

WORKDIR /usr/src/app

COPY package.json .env ./

RUN corepack enable && \
  corepack prepare --activate yarn@3.2.2 && \
  yarn install

ADD . /usr/src/app

RUN yarn install && \
  yarn compile

CMD ["node", "dist/index.js"]