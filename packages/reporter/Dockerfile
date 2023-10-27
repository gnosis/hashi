FROM node:alpine

WORKDIR /usr/src/app

COPY package.json yarn.lock .env ./

RUN yarn install

ADD . /usr/src/app

RUN yarn compile

CMD ["node", "dist/index.js"]