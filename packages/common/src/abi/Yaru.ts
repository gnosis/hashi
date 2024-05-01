export default [
  {
    inputs: [
      {
        internalType: "address",
        name: "hashi",
        type: "address",
      },
      {
        internalType: "address",
        name: "yaho_",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "sourceChainId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "CallFailed",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "expectedChainId",
        type: "uint256",
      },
    ],
    name: "InvalidToChainId",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "messageId",
        type: "uint256",
      },
    ],
    name: "MessageIdAlreadyExecuted",
    type: "error",
  },
  {
    inputs: [],
    name: "ThresholdNotMet",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "messageId",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "targetChainId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "threshold",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "address",
            name: "receiver",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "contract IReporter[]",
            name: "reporters",
            type: "address[]",
          },
          {
            internalType: "contract IAdapter[]",
            name: "adapters",
            type: "address[]",
          },
        ],
        indexed: false,
        internalType: "struct Message",
        name: "message",
        type: "tuple",
      },
    ],
    name: "MessageExecuted",
    type: "event",
  },
  {
    inputs: [],
    name: "HASHI",
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
    name: "SOURCE_CHAIN_ID",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
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
        components: [
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "targetChainId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "threshold",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "address",
            name: "receiver",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "contract IReporter[]",
            name: "reporters",
            type: "address[]",
          },
          {
            internalType: "contract IAdapter[]",
            name: "adapters",
            type: "address[]",
          },
        ],
        internalType: "struct Message",
        name: "message",
        type: "tuple",
      },
    ],
    name: "calculateMessageHash",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "sourceChainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "dispatcherAddress",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "messageHash",
        type: "bytes32",
      },
    ],
    name: "calculateMessageId",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "targetChainId",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "threshold",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            internalType: "address",
            name: "receiver",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "contract IReporter[]",
            name: "reporters",
            type: "address[]",
          },
          {
            internalType: "contract IAdapter[]",
            name: "adapters",
            type: "address[]",
          },
        ],
        internalType: "struct Message[]",
        name: "messages",
        type: "tuple[]",
      },
    ],
    name: "executeMessages",
    outputs: [
      {
        internalType: "bytes[]",
        name: "",
        type: "bytes[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "executed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]
