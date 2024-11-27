# Hashi RPC

A RPC server to expose hashi APIs.

## Getting Started

These instructions will cover the usage information and how to run the code locally for development using Docker.

### Configuration

Configure the mode you want to run by editing the variable in `.env` by checking `.env.example`.

```sh
cp .env.example .env
```

To add a new chain, create a value in the .env file with the following name:

```sh
JSON_RPC_URL_<chain_id>="your rpc url"
```

### Install

Please make sure you have run `yarn install` on the root level.

```sh
cd ../.. # To the root level
nvm use
yarn install
cd packages/rpc
```

To start the RPC server, run the following command:

```sh
cd packages/rpc
yarn start:dev
```

### Building and Running the Docker Image

On the root's `docker-compose.yml`, run the following command:

```sh
cd ../..  # To the root level
docker compose up --build hashi_rpc
```

Make sure to set `PORT=3000` within `.env` file.

### Viewing Logs

To view the logs from the running container, use:

```sh
docker logs -f [CONTAINER_ID or CONTAINER_NAME]
```

You can find the `CONTAINER_ID` or `CONTAINER_NAME` using `docker ps`.

### Stopping the rpc

To stop the running container:

```sh
docker stop [CONTAINER_ID or CONTAINER_NAME]
```
