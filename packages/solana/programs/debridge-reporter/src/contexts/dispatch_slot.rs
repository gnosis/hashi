use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;

#[derive(Accounts)]
pub struct DispatchSlot<'info> {
    /// CHECK: We are reading from SlotHashes sysvar the latest slot hash
    #[account(address = sysvar::slot_hashes::ID)]
    pub slot_hashes: AccountInfo<'info>,
}
