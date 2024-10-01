FROM node:22-alpine

WORKDIR /usr/src/app

# Copy root package.json and yarn.lock for dependency resolution
COPY ../../package.json ../../yarn.lock ./

COPY ./packages/common ./packages/common
COPY ./packages/rpc ./packages/rpc

RUN yarn install

WORKDIR /usr/src/app/packages/rpc
RUN yarn compile

EXPOSE 3000

CMD ["yarn", "start:prod"]