use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::{hashv, Hash};

pub struct BatchMerkleTree {
    pub root: Hash,
}

impl From<Hash> for BatchMerkleTree {
    fn from(root: Hash) -> Self {
        BatchMerkleTree { root: root }
    }
}

impl BatchMerkleTree {
    pub fn new() -> Self {
        BatchMerkleTree {
            root: Hash::default(),
        }
    }

    pub fn push_batch(&mut self, leaves: Vec<Hash>) -> Result<()> {
        let mut current_layer = leaves;

        while current_layer.len() > 1 {
            let mut next_layer = Vec::new();
            let mut i = 0;
            while i < current_layer.len() {
                if i + 1 < current_layer.len() {
                    next_layer.push(hashv(&[
                        &current_layer[i].to_bytes(),
                        &current_layer[i + 1].to_bytes(),
                    ]));
                    i += 2;
                } else {
                    next_layer.push(current_layer[i]);
                    i += 1;
                }
            }
            current_layer = next_layer;
        }

        self.root = if self.root == Hash::default() {
            current_layer[0]
        } else {
            hashv(&[&self.root.to_bytes(), &current_layer[0].to_bytes()])
        };

        Ok(())
    }
}
