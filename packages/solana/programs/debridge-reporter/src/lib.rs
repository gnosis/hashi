use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};
use debridge_solana_sdk::sending;
use slots::get_slot;

declare_id!("2TvQ6gqQGAifdV2cQ1f8zHGYV2t6wPUNTKzpcALt8rX7");

pub mod contexts;

pub use contexts::*;

#[derive(BorshSerialize)]
pub struct Message {
    pub ids: Vec<[u8; 32]>,
    pub hashes: Vec<[u8; 32]>,
}

#[program]
pub mod debridge_reporter {
    use super::*;

    pub fn dispatch_slot(
        ctx: Context<DispatchSlot>,
        target_chain_id: [u8; 32],
        receiver: Vec<u8>,
        slot_number: u64,
    ) -> Result<()> {
        let (number, hash) = get_slot(&ctx.accounts.slot_hashes, slot_number)?;

        let ids: Vec<[u8; 32]> = vec![u64_to_u8_32(number)];
        let hashes: Vec<[u8; 32]> = vec![hash];
        let message = Message { ids, hashes };

        sending::invoke_send_message(
            message.try_to_vec()?,
            target_chain_id,
            receiver,
            0,             // execution_fee = 0 means auto claim
            vec![0u8; 32], // fallback address
            ctx.remaining_accounts,
        )
        .map_err(ProgramError::from)?;

        Ok(())
    }
}

pub fn u64_to_u8_32(number: u64) -> [u8; 32] {
    let mut bytes = [0u8; 32];
    let number_bytes = number.to_be_bytes();
    bytes[24..].copy_from_slice(&number_bytes);
    bytes
}
