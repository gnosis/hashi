> **⚠️ Warning ⚠️**
>
> **⚠️ This code is being actively developed and is not yet production ready.**
>
> **⚠️ DO NOT deploy this code or use deployments of this code for anything valuable.**

---

[![Github Actions][gha-badge]][gha] [![Coverage Status][coveralls-badge]][coveralls]
[![Hardhat][hardhat-badge]][hardhat] [![License: LGPL-3.0-only][license-badge]][license]

![Hashi](hashi.png)

# Hashi 橋

[coveralls]: https://coveralls.io/github/gnosis/hashi?branch=master
[coveralls-badge]: https://coveralls.io/repos/github/gnosis/hashi/badge.svg?branch=main
[gha]: https://github.com/gnosis/hashi/actions
[gha-badge]: https://github.com/gnosis/hashi/actions/workflows/ci.yml/badge.svg
[hardhat]: https://hardhat.org/
[hardhat-badge]: https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg
[license]: https://www.gnu.org/licenses/lgpl-3.0.en.html
[license-badge]: https://img.shields.io/badge/License-LGPL%20v3.0-blue

Hashi is an EVM Hash Oracle Aggregator, designed to facilitate a
[principled approach to cross-chain bridge security](https://ethresear.ch/t/a-principled-approach-to-bridges/14725?u=auryn).

The primary insight being that the vast majority of bridge-related security incidents could have had minimal impact if
the systems relying on them had built in some redundancy. In other words, it's much more secure to require messages be
validated by multiple independent mechanisms, rather than by just one.

We call this setup a **RAIHO** (Redundant Array of Independent Hash Oracles).

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

**GiriGiriBashi** (ギリギリ橋) allows:

- An `owner` account to:
  - Initialize the set of oracles for each domain.
  - Initialize the threshold of oracles that must agree on a hash for each domain.
  - Replace quarantined oracle adapters.
  - Set a challenge `bond` `recipient`.
- Anyone to:
  - Query for a unanimously agreed on hash from that full set of oracles.
  - Query for a hash agreed upon by a threshold of oracles for a given block on a given chain; the provided oracles must all agree on the hash for the ID, must all be enabled as oracles for the given domain, and must exceed the threshold for the domain.
  - Challenge an oracle to report on a hash.
  - Resolve a challenge, either returning the `bond` to the challenger and quarantining the given oracle, in the case that the oracle does not report in time or reports a conflicting hash, or forwarding the challenge `bond` to the `recipient`.
  - Declare a state of no confidence for a given domain, forcing the domain to be re-initialized by `owner`.

**Yaho** (ヤッホー) allows users to:

- dispatch arbitrary messages via Hashi, which:
  - emits the hash of arbitrary messages as events
  - stores the arbitrary message in storage
- relay previously stored messages to any number of message adapters
- dispatch messages and relay them to adapters in a single call

**Yaru** (やる) allows `owner` to:

- execute arbitrary messages passed from Yaho

**Hashi Zodiac Module** allows users to:

- Control an avatar (like a Safe) on one chain from a `controller` address on another chain, via messages passed over hashi.
- Define an instance of Yaho which can pass it messages.
- Define a `chainId` (usually called `domain` elsewhere in this repo).
- Define a foreign `controller` address.

Hashi's additional redundancy obviously comes with a higher gas cost, along with moving only as quickly as the slowest
oracle in a given set. However, this trade-off seems well worth it given the scope and frequency of past bridge-related
security incidents.

## Audits

Hashi has been audited by the [G0 group](https://github.com/g0-group).

All issues and notes of the audit have been addressed as of commit hash [9f373635](https://github.com/gnosis/hashi/tree/9f373635730b59478bf23215906fdb5ad525d3b7/packages/evm/contracts).

The audit results are available as a [pdf in this repo](https://github.com/gnosis/hashi/blob/main/packages/evm/contracts/docs/audits/HashiMay2023.pdf).

Please note, there have been changes to contract code since this audit. A subsequent audit of the changed code is pending.

## Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE.

## License

Created under the [LGPL-3.0+ license](LICENSE).
