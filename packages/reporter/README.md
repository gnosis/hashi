# reporter

Script to call Header Reporter contracts of different oracle from source chain to destination chain.

## Run the script

1. Configure the correct node version by running `nvm use`
2. Installing packages by running `npm install`
3. Create `.env` file and define the configuration to run.
4. run `ts-node src/index.ts`

## Configuration

Configure the mode you want to run by editing the variable in `.env`

1. `REPORTERS_ENABLED` (name of reporter,separated by ',', with no space between): to enable the controller, i.e.
   amb,sygma
2. `AMB_GAS` (number): gas used in AMB reporter to pass block header.
3. `SYGMA_MSG_VALUE` (number): amount of ethers sent when bridging block header from sygma, similar to gas fee, i.e.
   0.001 (ethers).
4. `TIME_FETCH_BLOCKS_MS` (number): block reporter restart period (in ms), i.e. 60000 (ms).
5. `LC_TIME_STORE_HASHES_MS` (number): Light client based reporter (Telepathy) restart period (in ms), i.e. 60000 (ms).
6. `BLOCK_BUFFER` (number): the amount of blocks from source chain away from the latest block, in case the node provider
   is not sync up with the latest block, i.e. 10 (blocks).
7. `QUERY_BLOCK_LENGTH` (number): the amount of block headers from source chain to send to destination chain, should be
   less than 256 due to the limitation of Solidity
   [blockhash()](https://docs.soliditylang.org/en/v0.8.21/units-and-global-variables.html#block-and-transaction-properties).
8. `TELEPATHY_PROOF_API_URL` (string): url of telepathy proof api
9. `TELEPATHY_QUERY_BLOCK_LENGTH` (number): block range to query on `HeadUpdate` event, i.e. 1000 (blocks)
10. `TELEPATHY_BLOCK_BUFFER` (number): amount of blocks away from the latest block in destination chain, in case the
    node provider is not sync up with the latest block, i.e. 10 (blocks).

## Adding a new controller

1. Add a new file under `/controllers`, create the constructor and `onBlocks` function to call block header reporter
   contract periodically.
2. Configure the settings under `settings/index.ts`.
3. Add the new controller instant in `index.ts`.
4. Add the env variable in `.env.example`.
