export default [
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "expectedYaho",
        type: "address",
      },
    ],
    name: "NotYaho",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "targetChainId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "contract IAdapter",
        name: "adapter",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "blockHeader",
        type: "bytes32",
      },
    ],
    name: "BlockDispatched",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "targetChainId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "contract IAdapter",
        name: "adapter",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "messageId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "messageHash",
        type: "bytes32",
      },
    ],
    name: "MessageDispatched",
    type: "event",
  },
  {
    inputs: [],
    name: "HEADER_STORAGE",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "YAHO",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "targetChainId",
        type: "uint256",
      },
      {
        internalType: "contract IAdapter",
        name: "adapter",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "blockNumbers",
        type: "uint256[]",
      },
    ],
    name: "dispatchBlocks",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "targetChainId",
        type: "uint256",
      },
      {
        internalType: "contract IAdapter",
        name: "adapter",
        type: "address",
      },
      {
        internalType: "uint256[]",
        name: "messageIds",
        type: "uint256[]",
      },
      {
        internalType: "bytes32[]",
        name: "messageHashes",
        type: "bytes32[]",
      },
    ],
    name: "dispatchMessages",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
]
