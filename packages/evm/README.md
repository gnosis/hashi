# EVM

This workspace includes on chain components such as Solidity smart contracts, deploy tasks, and tests.  
The project is built with [Hardhat](https://hardhat.org/).

## Configuration

Create a new `.env` with the required environment variables.

```sh
cp .env.example .env
```

## Usage

### Install

Please make sure you have run `yarn install` on the root level.

```sh
cd ../.. # To the root level
nvm use
yarn install
cd packages/evm
```

### Compile the contracts

```sh
yarn build
```

### Deploy & Verify

To deploy a specific contract,

```sh
yarn hardhat ${task_name} --${arg1Name} ${arg1Value} --${arg2Name} ${arg2Value} --network ${network name}
```

Run `yarn hardhat` to check the available options.

To verify a contract,

```sh
yarn hardhat verify ${contract address} "${constructor arg1}" "${constructor arg2}" --network ${network name}
```

### Test

```sh
yarn test
```

## Adding a new adapter

1. Create Reporter and Adapter contracts:

   1. For General Message Passing oracle, there need to be a reporter contract on source chain, and adapter contract on
      destination chain.
   2. For Light Client based oracle, there is only an adapter contract on the destination chain.
   3. A reporter contract need to inherit `Reporter.sol`, and override `_dispatch()` function that will eventually call
      the relay logic of the bridge.
   4. An adapter contract need to inherit `Adapter.sol` contract, and call `_storeHashes` to store the hash w.r.t an id.

2. Add Deploy task
   1. Create a new file under `/tasks/deploy/adapters`, and name it ${oracle_name}.ts
   2. Add the reporter and adapter contracts deploy logic.
3. Add test
   1. Create a new file under `/test/adapters`.
   2. Add the test logic.
4. Create PR
