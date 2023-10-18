# reporter

Script to call Header Reporter contracts of different oracle from source chain to destination chain.

## Run the script

1. Configure the correct node version by running `nvm use`
2. Installing packages by running `npm install`
3. Create `.env` file and define the configuration to run.
4. run `ts-node src/index.ts`

## Configuration

Configure the mode you want to run by editing the variable in `.env`

1. `REPORTER` (true/false): to enable the reporter
2. `FREQUENCY` (cron job expression by default, seconds for telepathy reporterr): Define the frequency to run the
   reporter script
3. `SOURCE_CHAIN` (string value of chain): Define the source chain to collect the block header from. `DEST_CHAIN`
   (string value of chain): Define the destination chain to report the source chain's block header to.
