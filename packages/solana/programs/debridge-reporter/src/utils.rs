use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar;

use crate::error::ErrorCode;

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

pub fn u64_to_u8_32(number: u64) -> [u8; 32] {
    let mut bytes = [0u8; 32];
    let number_bytes = number.to_be_bytes(); // Convert u64 to a big-endian 8-byte array

    // Copy the 8 bytes of the u64 into the last 8 bytes of the 32-byte array
    bytes[24..].copy_from_slice(&number_bytes);

    bytes
}
