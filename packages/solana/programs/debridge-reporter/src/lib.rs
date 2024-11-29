use anchor_lang::prelude::*;

declare_id!("2TvQ6gqQGAifdV2cQ1f8zHGYV2t6wPUNTKzpcALt8rX7");

pub mod contexts;

pub use contexts::*;

#[program]
pub mod debridge_reporter {
    use super::*;
    use debridge_solana_sdk::sending;
    use message::Message;
    use slots::get_slot;

    pub fn dispatch_slot(
        ctx: Context<DispatchSlot>,
        target_chain_id: [u8; 32],
        receiver: Vec<u8>,
        slot_number: u64,
    ) -> Result<()> {
        let slot_hash = get_slot(&ctx.accounts.slot_hashes, slot_number)?;
        let message = Message::from((slot_number, slot_hash));
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
