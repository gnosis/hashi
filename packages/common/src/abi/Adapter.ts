export default [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "blockHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "storedBlockHash",
        type: "bytes32",
      },
    ],
    name: "ConflictingBlockHeader",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "length",
        type: "uint256",
      },
    ],
    name: "InvalidBlockHeaderLength",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidBlockHeaderRLP",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "hash",
        type: "bytes32",
      },
    ],
    name: "HashStored",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "domain",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "getHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]
