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

Hashi allows users to:

- Build custom oracle adapter contracts for any hash oracle mechanism they would like to use.
- Query an oracle for the hash for a given ID in a given domain. (e.g. header of a block on a given chainId)
- Query a set of oracles the hash for a given ID in a given domain.
- Query for a unanimously agreed upon block hash from a set of oracles for a given ID in a given domain.

ShoyuBashi allows users to:

- Define a set of oracles for each chainId.
- Define a threshold of oracles that must agree on a hash for each domain.
- Query for a unanimously agreed on hash from that full set of oracles.
- Query for a hash agreed upon by a threshold of oracles for a given block on a given chain; the provided oracles must
  all agree on the hash for the ID, must all be enabled as oracles for the given domain, and must exceed the threshold
  for the domain.

Hashi's additional redundancy obviously comes with a higher gas cost, along with moving only as quickly as the slowest
oracle in a given set. However, this trade-off seems well worth it given the scope and frequency of past bridge-related
security incidents.

## Audits

Hashi is currently unaudited. Proceed with caution, there are probably dragons. 🐲

## Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE.

## License

Created under the [LGPL-3.0+ license](LICENSE).
