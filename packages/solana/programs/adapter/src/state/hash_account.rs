use crate::*;

#[account]
pub struct HashAccount {
    pub adapter_id: [u8; 32],
    pub domain: [u8; 32],
    pub id: [u8; 32],
    pub hash: [u8; 32],
}

impl HashAccount {
    pub const LEN: usize = 32 + 32 + 32 + 32;
}
