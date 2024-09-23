# executor

The Executor is a service utilized to execute messages once they have achieved consensus, meaning when adapters have
reached consensus on the message.

&nbsp;

---

&nbsp;

## Installation

To install the Executor, follow these steps:

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

Before running the Executor, you need to create an `.env` file. All parameters can be found within `.env.example`.

&nbsp;

---

&nbsp;

## Usage

To start Executor, run the following command:

```bash
cd packages/executor
```

```bash
yarn start dotenv_config_path="your env file"
```

### Building and Running the Docker Image

Executor is usually run with Relayer and MongoDB, the `docker-compose.yml` demonstrates how to run these three images
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
