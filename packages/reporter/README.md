# reporter

Script to call Header Reporter contracts of different oracle from source chain to destination chain.

&nbsp;

---

&nbsp;

## Getting Started

These instructions will cover the usage information and how to run the code using Docker.

### Create the .env file

Configure the mode you want to run by editing the variable in `.env` by checking `.env.example`

### Building and Running the Docker Image

On the root, run the following command:

```sh
docker compose -f docker-compose-reporter.yml up -d --build
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

&nbsp;

---

&nbsp;

## How to add a new controller

1. Add a new file under `/controllers`, create the constructor and `onBlocks` function to call block header reporter
   contract periodically.
2. Configure the settings under `settings/index.ts`.
3. Add the new controller instant in `index.ts`.
4. Add the env variable in `.env.example`.
