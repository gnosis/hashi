# Hashi Relayer

The Relayer is a service used to relay batches of dispatched messages through Yaho to the reporter contracts.

## Getting Started

These instructions will cover the usage information and how to run the code locally for development or using Docker.

## Configuration

Before running the Relayer, you need to create an `.env` file. All parameters can be found within `.env.example`.

```sh
cp .env.example .env
```

## Usage

### Install

Please make sure you have run `yarn install` on the root level.

```sh
cd ../.. # To the root level
nvm use
yarn install
cd packages/relayer
```

Run mongoDB and export port 27017

```sh
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  mongo
```

To start Relayer, run the following command:

```sh
cd packages/relayer
yarn start
```

### Building and Running the Docker Image

Relayer needs to connect with MongoDB, the `docker-compose.yml` demonstrates how to run these images together.

Run the following command:

```sh
cd ../..  # To the root level
docker compose up --build mongodb hashi_relayer
```

### Viewing Logs

To view the logs from the running container, use:

```sh
docker logs -f [CONTAINER_ID or CONTAINER_NAME]
```

You can find the `CONTAINER_ID` or `CONTAINER_NAME` using `docker ps`.

### Stopping the relayer

To stop the running container:

```sh
docker stop [CONTAINER_ID or CONTAINER_NAME]
```
