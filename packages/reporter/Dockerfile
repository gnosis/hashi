FROM node:22-alpine

WORKDIR /usr/src/app

# Copy root package.json and yarn.lock for dependency resolution
COPY ../../package.json ../../yarn.lock ./

COPY ./packages/common ./packages/common
COPY ./packages/reporter ./packages/reporter

RUN yarn install

WORKDIR /usr/src/app/packages/reporter
RUN yarn compile

EXPOSE 8080

COPY ../../entrypoint.sh /usr/local/bin/entrypoint.sh 
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["yarn", "start:prod"]