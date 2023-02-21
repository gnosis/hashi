[![Open in Gitpod][gitpod-badge]][gitpod] [![Github Actions][gha-badge]][gha] [![Hardhat][hardhat-badge]][hardhat]
[![License: LGPL-3.0-only][license-badge]][license]

# Hashi

[gitpod]: https://gitpod.io/#https://github.com/gnosis/hashi
[gitpod-badge]: https://img.shields.io/badge/Gitpod-Open%20in%20Gitpod-FFB45B?logo=gitpod
[gha]: https://github.com/gnosis/hashi/actions
[gha-badge]: https://github.com/gnosis/hashi/actions/workflows/ci.yml/badge.svg
[hardhat]: https://hardhat.org/
[hardhat-badge]: https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg
[license]: https://www.gnu.org/licenses/lgpl-3.0.en.html
[license-badge]: https://img.shields.io/badge/License-LGPL%20v3.0-blue

Hashi is an EVM Header Relay Aggregator, designed to facilitate a
[principled approach to cross-chain bridge security](https://ethresear.ch/t/a-principled-approach-to-bridges/14725?u=auryn).
The primary insight being that the vast majority of bridge-related security incidents could have had minimal impact if
the systems relying on them had built in some redundancy. In other words, it's much more secure to require messages be
validated by multiple independent mechanisms, rather than by just one.

## Features

Hashi allows users to:

- Build custom oracle adapter contracts for any header relay mechanism they would like to use.
- Query a header relay for the block header for a given block on a given chain.
- Query a set of header relays the block headers for a given block on a given chain.
- Query for a unanimously agreed upon block header from a set of oracles for a given block on a given chain.

ShikichiBashi allows users to:

- Define a set of oracles for each chainId.
- Define a threshold of oracles that must agree on a block header for each chain.
- Query for a unanimously agreed on header from that full set of oracles.
- Query for a block header agreed upon by a threshold of oracles for a given block on a given chain; the provided
  oracles must all agree on the header for the given block, must all be enabled as oracles for the given chain, and must
  exceed the threshold for the chain.

Hashi's additional redundancy obviously comes with a higher gas cost, along with moving only as quickly as the slowest
oracle in a given set. However, this trade-off seems well worth it given the scope and frequency of past bridge-related
security incidents.

## Audits

Hashi is currently unaudited. Proceed with caution, there is probably dragons. 🐲

## Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE.

## License

Created under the [LGPL-3.0+ license](LICENSE).
