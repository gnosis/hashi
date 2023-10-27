# reporter

Script to call Header Reporter contracts of different oracle from source chain to destination chain.

&nbsp;

---

&nbsp;

## Getting Started

These instructions will cover the usage information and how to run the code using Docker.

### Create the .env file

Configure the mode you want to run by editing the variable in `.env`

1. `REPORTERS_ENABLED` (name of reporter,separated by ',', with no space between): to enable the controller, i.e.
   amb,sygma
2. `AMB_REPORTER_HEADERS_GAS` (number): gas used in AMB reporter to pass block header.
3. `SYGMA_REPORT_HEADERS_TO_DOMAIN_MSG_VALUE` (number): amount of ethers sent when bridging block header from sygma,
   similar to reportHeadersGas fee, i.e. 0.001 (ethers).
4. `TIME_FETCH_BLOCKS_MS` (number): block reporter restart period (in ms), i.e. 60000 (ms).
5. `BLOCK_BUFFER` (number): the amount of blocks from source chain away from the latest block, in case the node provider
   is not sync up with the latest block, i.e. 10 (blocks).
6. `QUERY_BLOCK_LENGTH` (number): the amount of block headers from source chain to send to destination chain, should be
   less than 256 due to the limitation of Solidity
   [blockhash()](https://docs.soliditylang.org/en/v0.8.21/units-and-global-variables.html#block-and-transaction-properties).
7. `TELEPATHY_PROOF_API_URL` (string): url of telepathy proof api
8. `TELEPATHY_QUERY_BLOCK_LENGTH` (number): block range to query on `HeadUpdate` event, i.e. 1000 (blocks)
9. `TELEPATHY_BLOCK_BUFFER` (number): amount of blocks away from the latest block in destination chain, in case the node
   provider is not sync up with the latest block, i.e. 10 (blocks).
10. `TELEPATHY_TIME_FETCH_BLOCK_MS`: interval time for which the controller looks for new `HeadUpdate` events.
11. `SOURCE_CHAIN`: source chain `chainId`.
12. `DESTINATION_CHAINS`: destination chain `chainIds` separated by a comma.

### Building the Docker Image

To build the Docker image, run the following command from the root of the project:

```sh
docker build -t reporter .
```

### Running the reporter

After building the image, you can run it using the following command:

```sh
docker run -d -p reporter
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
