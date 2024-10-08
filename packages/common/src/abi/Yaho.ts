export default [
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
    name: "InvalidMessage",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "threshold",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxThreshold",
        type: "uint256",
      },
    ],
    name: "InvalidThreshold",
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
    name: "MessageHashNotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "NoAdaptersGiven",
    type: "error",
  },
  {
    inputs: [],
    name: "NoMessageIdsGiven",
    type: "error",
  },
  {
    inputs: [],
    name: "NoMessagesGiven",
    type: "error",
  },
  {
    inputs: [],
    name: "NoReportersGiven",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "arrayOne",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "arrayTwo",
        type: "uint256",
      },
    ],
    name: "UnequalArrayLengths",
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
    name: "MessageDispatched",
    type: "event",
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
    inputs: [],
    name: "currentNonce",
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
    inputs: [
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
    name: "dispatchMessage",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
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
        internalType: "uint256",
        name: "threshold",
        type: "uint256",
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
    name: "dispatchMessageToAdapters",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
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
        internalType: "uint256[]",
        name: "thresholds",
        type: "uint256[]",
      },
      {
        internalType: "address[]",
        name: "receivers",
        type: "address[]",
      },
      {
        internalType: "bytes[]",
        name: "data",
        type: "bytes[]",
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
    name: "dispatchMessagesToAdapters",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "messageId",
        type: "uint256",
      },
    ],
    name: "getPendingMessageHash",
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
    name: "relayMessagesToAdapters",
    outputs: [
      {
        internalType: "bytes32[]",
        name: "",
        type: "bytes32[]",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
]
