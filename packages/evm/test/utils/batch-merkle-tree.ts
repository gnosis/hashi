import crypto from "crypto"

type Proof = Node[][]
type HexProof = `0x${string}`[][]

interface Node {
  data: Buffer
  position: "left" | "right" | null
}

class BatchMerkleTree {
  private _batches: Buffer[][]

  constructor() {
    this._batches = []
  }

  /**
   * Converts a proof into a hexadecimal format.
   * @param _leaf - The leaf node to generate the proof for.
   * @returns A HexProof containing the proof in hexadecimal format.
   */
  getHexProof(_leaf: Buffer): HexProof {
    const proof = this.getProof(_leaf)
    return proof.map((_batch) =>
      _batch.map((_node: Node) => {
        let position = null
        if (_node.position === "left") {
          position = "01"
        } else if (_node.position === "right") {
          position = "02"
        } else if (_node.position === null) {
          position = "00"
        } else {
          throw new Error("Invalid Position")
        }
        return `0x${Buffer.concat([_node.data, Buffer.from(position, "hex")]).toString("hex")}`
      }),
    ) as `0x${string}`[][]
  }

  /**
   * Generates a Merkle proof for a specific leaf node.
   * @param _leaf - The leaf node to generate the proof for.
   * @returns A proof consisting of nodes and their positions in the tree.
   */
  getProof(_leaf: Buffer): Proof {
    const batchContainingTargetNodeIndex = this._batches.findIndex((_leaves) =>
      _leaves.find((_l) => Buffer.compare(_l, _leaf) === 0),
    )

    const proof: Proof = []
    for (const [i, leaves] of this._batches.entries()) {
      if (batchContainingTargetNodeIndex != i) {
        proof.push([{ data: this._calculateBatchRoot(leaves), position: null }])
      } else {
        let index = -1
        for (let i = 0; i < leaves.length; i++) {
          if (Buffer.compare(_leaf, leaves[i]) === 0) {
            index = i
          }
        }
        if (index === -1) throw new Error("Leaf not found")

        const localProof: Node[] = []
        const layers = this._createLayersForBatch(leaves)
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i]
          const isRightNode = index % 2
          const pairIndex = isRightNode ? index - 1 : index + 1
          if (pairIndex < layer.length) {
            localProof.push({
              data: layer[pairIndex],
              position: isRightNode ? "left" : "right",
            })
          }
          index = (index / 2) | 0
        }
        proof.push(localProof)
      }
    }

    return proof
  }

  /**
   * Adds a batch of leaves to the tree.
   * @param _leaves - The array of leaves to add.
   */
  pushBatch(_leaves: Buffer[]) {
    this._batches.push(_leaves)
  }

  /**
   * Calculates the root hash of the entire tree.
   * @returns The root hash of the tree.
   */
  root() {
    return this._hashBatchRoots(this._batches.map(this._calculateBatchRoot.bind(this)))
  }

  /**
   * Verifies the validity of a proof for a given leaf node.
   * @param _proof - The proof to verify.
   * @param _targetNode - The leaf node being verified.
   * @returns True if the proof is valid, otherwise false.
   */
  verify(_proof: Proof, _targetNode: Buffer): boolean {
    const batchProof = _proof.find((_batch) => _batch.length != 1) // can be 0 or > 1
    if (!batchProof) throw new Error("Invalid Proof")

    let batchRoot = _targetNode
    for (let i = 0; i < batchProof.length; i++) {
      const node = batchProof[i]
      const data = node.data
      const isLeftNode = node.position === "left"
      const buffers = []
      buffers.push(batchRoot)
      buffers[isLeftNode ? "unshift" : "push"](data)
      batchRoot = this._hashNodes(buffers[0], buffers[1])
    }

    const batchRoots = _proof.flatMap((_batch, _index) =>
      _batch.length === 0 ? [_targetNode] : _batch.length === 1 ? _batch.map(({ data }: any) => data) : [batchRoot],
    )

    const calculatedRoot = this._hashBatchRoots(batchRoots)
    return Buffer.compare(calculatedRoot, this.root()) === 0
  }

  /**
   * Calculates the root hash for a batch of leaves.
   * @param _leaves - The leaves of the batch.
   * @returns The root hash of the batch.
   */
  private _calculateBatchRoot(_leaves: Buffer[]): Buffer {
    let currentLayer = _leaves

    while (currentLayer.length > 1) {
      let nextLayer: Buffer[] = []
      let i = 0
      while (i < currentLayer.length) {
        if (i + 1 < currentLayer.length) {
          nextLayer.push(this._hashNodes(currentLayer[i], currentLayer[i + 1]))
          i += 2
        } else {
          nextLayer.push(currentLayer[i])
          i += 1
        }
      }
      currentLayer = nextLayer
    }
    return currentLayer[0]
  }

  /**
   * Creates all layers of a batch for proof generation.
   * @param _nodes - The nodes in the batch.
   * @returns A 2D array representing the layers.
   */
  private _createLayersForBatch(_nodes: Buffer[]): Buffer[][] {
    const layers = [_nodes]
    while (_nodes.length > 1) {
      const layerIndex = layers.length
      layers.push([])
      const layerLimit = _nodes.length

      for (let i = 0; i < _nodes.length; i += 2) {
        if (i >= layerLimit) {
          layers[layerIndex].push(..._nodes.slice(layerLimit))
          break
        } else if (i + 1 === _nodes.length) {
          if (_nodes.length % 2 === 1) {
            layers[layerIndex].push(_nodes[i])
            continue
          }
        }

        const left = _nodes[i]
        const right = i + 1 === _nodes.length ? left : _nodes[i + 1]
        let hash = this._hashNodes(left, right)
        layers[layerIndex].push(hash)
      }
      _nodes = layers[layerIndex]
    }
    return layers
  }

  /**
   * Hashes two nodes together.
   * @param _node1 - The first node.
   * @param _node2 - The second node.
   * @returns The hash of the two nodes.
   */
  private _hashNodes(_node1: Buffer, _node2: Buffer) {
    const hash = crypto.createHash("sha-256")
    hash.update(_node1)
    hash.update(_node2)
    return hash.digest()
  }

  /**
   * Hashes all batch roots to calculate the tree root.
   * @param _batchRoots - The roots of the batches.
   * @returns The root of the tree.
   */
  private _hashBatchRoots(_batchRoots: Buffer[]) {
    let root = _batchRoots.length > 1 ? this._hashNodes(_batchRoots[0], _batchRoots[1]) : _batchRoots[0]
    let i = 2
    while (i < _batchRoots.length) {
      root = this._hashNodes(root, _batchRoots[i])
      i += 1
    }
    return root
  }
}

export default BatchMerkleTree
