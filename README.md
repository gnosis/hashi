> **⚠️ Warning ⚠️**
>
> **⚠️ This code is being actively developed and is not yet production ready.**
>
> **⚠️ DO NOT deploy this code or use deployments of this code for anything valuable.**

https://user-images.githubusercontent.com/4685781/235412791-2b61407e-ae92-4748-94c6-5515b0fd84e6.mp4

---
# L1StateOracle
> A trustless and affordable framework for storing L1 historical states on L2 using zkp and block headers'

Given a reliable L1 block header hash for a certain block number with Hashi on L2, this PoC proves that you can store a L1 state value on L2 trustlessly by using block headers as a source of truth.

This project was one of the finalists for [ZK Collective Hackathon 2023](https://zk-hacking.org/), we worked on the zk bridge track "Category6. Defense in Depth"

[PR contribution to Hashi](https://github.com/gnosis/hashi/pull/11)

## Problem

Currently, there is no way for L2s to access L1 state in a _trustless, cheap and easy way_. One option is to use arbitrary messaging bridges to send over the L1 state, but in this case you need to rely on the honesty of the messenger. Another option is to set up a specific purpose bridge (think ERC20 or ERC721 token bridge) so that you don't need to trust the messenger anymore. But this is not generalizable and costly since you need to create a bridge for every single purpose.

So our question was, is there a better way to send over L1 state to L2s?

## Our approach

Instead of creating an entirely new system from scratch, we took advantage of two existing systems to create a solution to this problem. We were inspired by the Hashi team ([ethresearch post](https://ethresear.ch/t/hashi-a-principled-approach-to-bridges/14725/1), [presentation](https://docs.google.com/presentation/d/1yMdO179XFJeeryIqsJg8L4RewH8jaA_p97iCO-vl9mY/edit#slide=id.g21cefba53b5_0_148)) to combine two existing systems to create a solution.

One is [Hashi](https://github.com/gnosis/hashi), which is a system that provides additive security for bridge systems. Essentially, it improves security by allowing L2 protocols to not rely on a single bridge system. Under the hood, it is connected to multiple bridges deployed on L2 and provide aggregate L1 block hash data to L2 protocols. As a result, L2 protocols that rely on a bridge system can avoid being hacked when a single bridge is compromised.

Another is [Axiom](https://www.axiom.xyz/), which enables accessing any historic state on-chain via smart contracts. Storing historic states requires a lot of storage, so it's normally unaffordable on-chain, but Axiom leverages ZK proofs to make this cheap. One thing to point out is that Axiom is currently intended to be used only on L1, but the system is modular so we were able to think about porting a part of it on L2.

## Solution

> Axiom ✍️ + Hashi 橋 => L1StateOracle (Time Travel 🚀 L1 state on L2)

Our approach is to take the proof module of Axiom and to integrate it with Hashi. Below you can check out our architecture and how it leverages Axiom and Hashi's existing architecture.

### L1StateOracle Architecture

<img src=https://i.imgur.com/5jiBMOM.png width=800>

As you can see in the flow chart above, we created new `AxiomStorageProof` and `AxiomProofVerifier` contracts and deployed them on L2.

Once a user creates a storage proof using [Axiom's backend](https://demo.axiom.xyz/custom), it can send the proof to the L2 contract, which will verify the block hash used in the proof against Hashi's `getHash` function.

When the ZK proof itself is also verified via the `AxiomProofVerifier`, we can safely store the storage proof on-chain, and _voilà_! **Any L2 protocol can confidently use the attested storage data without worrying about a single bridge being compromised.**

**How it works**

1) We used Axiom.xyz to create a ZK proof of a storage slot value associated with the block header at a desired block number.
2) On L2, we call `AxiomStorageProof` with the ZK storage proof that includes  `(storageSlot, slotValue, blockNumber, associatedBlockHeaderHash)`.
3) On L2,  `AxiomStorageProof` calls Hashi to get the reliable block hash for L1 at a desired block number.
4) We compare the hash returned from Hashi and the one from the proof.
5) If same, `AxiomStorageProof` calls the prover contract to verify the proof. The prover verifies the storage value with the associated block header.
6) `AxiomStorageProof`  retrieves the state value associated with the block header. This retrieved state value can be stored, and be used for any other contracts on L2.

**Terminology**: For simplicity, we used L1 as a term for the source chain, and L2 as a term for the target chain. L1 and L2 here do not imply any association like rollup between the two. L1 and L2 can be any EVM compatible chain supported by Gnosis Hashi.

**Limitation**: This currently can only check the state value of a contract stored on a EVM storage slot, not the returned value from a contract method.


# A Build and Run Guide

- Fork the following [PR codebase](https://github.com/gnosis/hashi/pull/11)
- Uncomment the following code in `hardhat.config.ts`:

```
      // Used for testing axiom
      // forking: {
      //   url: getChainConfig("mainnet").url,
      //   // block number of attestation block
      //   blockNumber: 10000000,
      // },
      ...
      // tests: "./test_axiom",
```

- Run `yarn` and `yarn test`

# Additional Resources

- [Presentation deck](./L1StateOracle.pdf)
- [Presentation video](https://www.youtube.com/watch?v=-EjeropREx8)
- https://hackmd.io/@mellowcroc/rJDwFTe7h
