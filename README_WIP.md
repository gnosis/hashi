# Overview

Hashi is an EVM Hash Oracle Aggregator, designed to facilitate a
[principled approach to cross-chain bridge security](https://ethresear.ch/t/a-principled-approach-to-bridges/14725?u=auryn).

The primary insight being that the vast majority of bridge-related security incidents could have had minimal impact if
the systems relying on them had built in some redundancy. In other words, it's much more secure to require messages be
validated by multiple independent mechanisms, rather than by just one.

We call this setup a **RAIHO** (Redundant Array of Independent Hash Oracles).

# Working with Hashi

**Node**
This repository targets v18 of node. We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage your node version.  
Once installed, you should change versions automatically with the `.nvmrc` file.

**Docker**
Make sure you have the correct version of [Docker](https://www.docker.com/) installed on your machine.  
You may refer to `Dockerfile` under each workspace and `docker-compose.yml` on the root for more details regarding the build process.

## Project Structure

1. `packages/common`: Common logic that will be used across multiple workspaces.
2. `packages/evm`: On chain components includes Solidity smart contracts, deploy tasks, tests. Built with [Hardhat](https://hardhat.org/).
3. `packages/executor`: A service utilized to execute messages once they have achieved consensus.
4. `packages/relayer`: A service used to relay batches of dispatched messages through Yaho to the reporter contracts.
5. `packages/reporter`: Script to call Reporter contract's `dispatchBlocks` function of different oracle from source chain to destination chain.

# Workspaces

This monorepo uses [Yarn Workspaces](https://yarnpkg.com/features/workspaces). Installing dependencies can be done from the root directory of the repository.

- Installing dependencies

  ```sh
  git clone https://github.com/gnosis/hashi # Clone the repo
  cd hashi
  nvm use
  yarn install
  ```

## Build & Run

To build & run each packages, navigate to each package separately, check the README.md in each workspace for more details.

## Run Docker

Before running docker for the workspace, insert the correct environment variable in .env.

```sh
cp .env.example .env
```

Build & run
Run the following command to build and run all the services.

```sh
docker compose up --build
```

## Audits

### v0.1

Hashi has been audited by the [G0 group](https://github.com/g0-group).

All issues and notes of the audit have been addressed as of commit hash [9f373635](https://github.com/gnosis/hashi/tree/9f373635730b59478bf23215906fdb5ad525d3b7/packages/evm/contracts).

The audit results are available as a [pdf in this repo](https://github.com/gnosis/hashi/blob/main/packages/evm/contracts/docs/audits/HashiMay2023.pdf).

Please note, there have been changes to contract code since this audit. A subsequent audit of the changed code is pending.

### v0.2

Hashi has been audited by the [G0 group](https://github.com/g0-group).

The audit results are available as a [pdf in this repo](https://github.com/g0-group/Audits/blob/master/HashiMar2024.pdf).

Please note, there have been changes to contract code since this audit. A subsequent audit of the changed code is pending.

## Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE.

## License

Created under the [LGPL-3.0+ license](LICENSE).
