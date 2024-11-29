use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};
use std::convert::From;

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Message {
    pub ids: Vec<[u8; 32]>,
    pub hashes: Vec<[u8; 32]>,
}

impl From<(u64, [u8; 32])> for Message {
    fn from(value: (u64, [u8; 32])) -> Self {
        let (id, hash) = value;
        Message {
            ids: vec![u64_to_u8_32(id)],
            hashes: vec![hash],
        }
    }
}

fn u64_to_u8_32(number: u64) -> [u8; 32] {
    let mut bytes = [0u8; 32];
    let number_bytes = number.to_be_bytes();
    bytes[24..].copy_from_slice(&number_bytes);
    bytes
}
