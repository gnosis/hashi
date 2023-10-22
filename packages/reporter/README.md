# reporter

Script to call Header Reporter contracts of different oracle from source chain to destination chain.

## Run the script

1. Configure the correct node version by running `nvm use`
2. Installing packages by running `npm install`
3. Create `.env` file and define the configuration to run.
4. run `ts-node src/index.ts`

## Configuration

Configure the mode you want to run by editing the variable in `.env`

1. `_CONTROLLER` (true/false): to enable the controller
2. `SOURCE_CHAIN` (string value of chain): Define the source chain to collect the block header from.
3. `DEST_CHAIN` (string value of chain): Define the destination chain to report the source chain's block header to.

## Adding a new controller

1. Add a new file under `/controller`, create the constructor and `onBlocks` function to call block header reporter
   contract periodically.
2. Add the contract addresses under `utils/address.json`.
3. Add the new controller instant in `index.ts`.
4. Add the env variable in `.env.example`.
