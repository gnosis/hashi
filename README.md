[![Github Actions][gha-badge]][gha] [![Coverage Status][coveralls-badge]][coveralls]
[![Hardhat][hardhat-badge]][hardhat] [![License: LGPL-3.0-only][license-badge]][license]

![Hashi](hashi.png)

[coveralls]: https://coveralls.io/github/gnosis/hashi?branch=master
[coveralls-badge]: https://coveralls.io/repos/github/gnosis/hashi/badge.svg?branch=main
[gha]: https://github.com/gnosis/hashi/actions
[gha-badge]: https://github.com/gnosis/hashi/actions/workflows/ci.yml/badge.svg
[hardhat]: https://hardhat.org/
[hardhat-badge]: https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg
[license]: https://www.gnu.org/licenses/lgpl-3.0.en.html
[license-badge]: https://img.shields.io/badge/License-LGPL%20v3.0-blue

# Overview

Hashi is an EVM Hash Oracle Aggregator, designed to facilitate a
[principled approach to cross-chain bridge security](https://ethresear.ch/t/a-principled-approach-to-bridges/14725?u=auryn).

The primary insight being that the vast majority of bridge-related security incidents could have had minimal impact if
the systems relying on them had built in some redundancy. In other words, it's much more secure to require messages be
validated by multiple independent mechanisms, rather than by just one.

We call this setup a **RAIHO** (Redundant Array of Independent Hash Oracles).

For more details: https://crosschain-alliance.gitbook.io/hashi

## Features

**Hashi** (橋) allows users to:

- Build custom oracle adapter contracts for any hash oracle mechanism they would like to use.
- Query an oracle for the hash for a given ID in a given domain. (e.g. header of a block on a given chainId)
- Query a set of oracles the hash for a given ID in a given domain.
- Query for a unanimously agreed upon block hash from a set of oracles for a given ID in a given domain.

**ShoyuBashi** (所有橋) allows:

- An `owner` account to:
  - Define an instance of Hashi to query.
  - Define a set of oracles for each domain.
  - Define a threshold of oracles that must agree on a hash for each domain.
  - Change any of the above settings at any time.
- Anyone to:
  - Query for a unanimously agreed on hash from that full set of oracles.
  - Query for a hash agreed upon by a threshold of oracles for a given block on a given chain; the provided oracles must all agree on the hash for the ID, must all be enabled as oracles for the given domain, and must exceed the threshold for the domain.

**Yaho** (ヤッホー) allows users to:

- dispatch arbitrary messages via Hashi, which:
  - emits the hash of arbitrary messages as events
  - stores the hash of arbitrary message in storage
- relay previously stored messages to any number of message adapters
- dispatch messages and relay them to adapters in a single call

**Yaru** (やる) allows `owner` to:

- execute arbitrary messages passed from Yaho

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

All issues and notes of the audit have been addressed as of commit hash [f1a9fdb](https://github.com/gnosis/hashi/tree/f1a9fdb2998c7024268e9c69777f4dc43d2f775e/packages/evm)

The audit results are available as a [pdf in this repo](https://github.com/g0-group/Audits/blob/master/HashiMar2024.pdf).

Please note, there have been changes to contract code since this audit. A subsequent audit of the changed code is pending.

## Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE.

## License

Created under the [LGPL-3.0+ license](LICENSE).
