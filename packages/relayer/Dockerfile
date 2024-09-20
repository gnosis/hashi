FROM node:18-alpine 

WORKDIR /usr/src/app

# Copy root package.json and yarn.lock for dependency resolution
COPY ../../package.json ../../yarn.lock ./

# Copy both executor and common package folders
COPY ./packages/common ./packages/common
COPY ./packages/relayer ./packages/relayer


# Install dependencies at root level
RUN yarn install

# Compile both common and executor packages
WORKDIR /usr/src/app/packages/common
RUN yarn compile

WORKDIR /usr/src/app/packages/relayer
RUN yarn compile

CMD ["yarn", "start"]