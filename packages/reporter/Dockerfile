FROM node:18-alpine

WORKDIR /usr/src/app

# Copy root package.json and yarn.lock for dependency resolution
COPY ../../package.json ../../yarn.lock ./

COPY ./packages/reporter ./packages/reporter

RUN yarn install

WORKDIR /usr/src/app/packages/reporter
RUN yarn compile

CMD ["node", "dist/index.js"]