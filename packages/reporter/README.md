# Hashi Reporter

Script to call Reporter contract's `dispatchBlocks` function of different oracle from source chain to destination chain.

## Getting Started

These instructions will cover the usage information and how to run the code locally for development using Docker.

### Configuration

Configure the mode you want to run by editing the variable in `.env` by checking `.env.example`

```sh
cp .env.example .env
```

### Install

Please make sure you have run `yarn install` on the root level.

```sh
cd ../.. # To the root level
nvm use
yarn install
cd packages/reporter
```

To start Reporter, run the following command:

```sh
cd packages/reporter
yarn start:dev
```

### Building and Running the Docker Image

On the root's `docker-compose.yml`, run the following command:

```sh
cd ../..  # To the root level
docker-compose up -d --build --no-deps hashi_reporter
```

### Viewing Logs

To view the logs from the running container, use:

```sh
docker logs -f [CONTAINER_ID or CONTAINER_NAME]
```

You can find the `CONTAINER_ID` or `CONTAINER_NAME` using `docker ps`.

### Stopping the reporter

To stop the running container:

```sh
docker stop [CONTAINER_ID or CONTAINER_NAME]
```

## How to add a new controller

1. Add a new file under `src/controllers`, create the constructor and `onBlocks` function to call reporter contract
   periodically.
2. Configure the settings under `settings/index.ts`.
3. Add the new controller instance in `index.ts`.
4. Add the env variable in `.env.example`.
