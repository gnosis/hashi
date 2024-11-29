use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;

pub fn get_slot(slot_hashes: &AccountInfo, slot_number: u64) -> Result<(u64, [u8; 32])> {
    if *slot_hashes.key != sysvar::slot_hashes::ID {
        return Err(error!(ErrorCode::InvalidSlotHashesSysVar));
    }

    let data = slot_hashes.try_borrow_data()?;
    let num_slot_hashes = u64::from_le_bytes(data[0..8].try_into().unwrap());
    let mut pos = 8;

    if num_slot_hashes == 0 {
        return Err(error!(ErrorCode::SlotHashesNotAvailable));
    }

    for _i in 0..num_slot_hashes {
        let current_slot_number = u64::from_le_bytes(data[pos..pos + 8].try_into().unwrap());
        pos += 8;

        let current_slot_hash: [u8; 32] = match &data[pos..pos + 32].try_into() {
            Ok(hash) => *hash,
            Err(_) => return Err(error!(ErrorCode::InvalidLatestHashLength)),
        };

        if current_slot_number == slot_number {
            return Ok((current_slot_number, current_slot_hash));
        }

        pos += 32;
    }

    Err(error!(ErrorCode::SlotNotFound))
}

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
