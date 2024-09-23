# relayer

The Relayer is a service used to relay batches of dispatched messages through Yaho to the adapters.

&nbsp;

---

&nbsp;

## Installation

To install the Relayer, follow these steps:

```bash
git clone https://github.com/gnosis/hashi
cd hashi
nvm use
yarn install
```

&nbsp;

---

&nbsp;

## Configuration

Before running the Relayer, you need to create an `.env` file. All parameters can be found within `.env.example`.

&nbsp;

---

&nbsp;

## Usage

To start Relayer, run the following command:

```bash
cd packages/relayer
```

```bash
yarn start dotenv_config_path="your env file"
```

### Building and Running the Docker Image

Relayer is usually run with Executor and MongoDB, the `docker-compose.yml` demonstrates how to run these three images
together.

Run the following command:

```sh
cd ../..  # To the root level
docker compose -f docker-compose.yml up -d --build
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
