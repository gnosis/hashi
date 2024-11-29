use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid latest hash hash.")]
    InvalidLatestHashLength,
    #[msg("Invalid slot hashes sysvar.")]
    InvalidSlotHashesSysVar,
    #[msg("Slot hashes not available.")]
    SlotHashesNotAvailable,
    #[msg("Slot not found")]
    SlotNotFound,
}
