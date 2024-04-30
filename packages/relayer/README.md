# relayer

Script to relay batches of Hashi Messages to the underlying adapters.

&nbsp;

---

&nbsp;

## Getting Started

These instructions will cover the usage information and how to run the code using Docker.

### Create the .env file

Configure the mode you want to run by editing the variable in `.env` by checking `.env.example`

### Building the Docker Image

To build the Docker image, run the following command from the root of the project:

```sh
docker build -t relayer .
```

### Running the relayer

After building the image, you can run it using the following command:

```sh
docker run -d -p relayer
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
