use anchor_lang::prelude::*;
use std::collections::HashMap;

use adapter::HashAccount;

declare_id!("76cEKq1qRhBLn56kZdG1Hj7UHXggcNfinbnKejXDnMpU");

pub mod contexts;
pub mod error;

pub use contexts::*;
pub use error::ErrorCode;

#[program]
pub mod hashi {
    use super::*;

    /// Verifies hashes against a threshold for validation.
    ///
    /// This function checks if the number of occurrences of any hash associated with the provided
    /// adapter IDs, domain, and ID meets or exceeds the specified threshold. It is used for consensus
    /// or validation mechanisms where a certain number of matching hashes are required to proceed.
    ///
    /// # Arguments
    ///
    /// - `ctx`: A `Context` object containing accounts and other data required for the validation process.
    /// - `adapter_ids`: A vector of adapter IDs, each uniquely identifying an adapter associated with
    ///   the hashes being validated.
    /// - `domain`: A 32-byte domain identifier for contextual validation of the hashes.
    /// - `id`: A 32-byte identifier associated with the hashes being validated.
    /// - `threshold`: The minimum number of occurrences a hash must have to pass validation.
    ///
    /// # Returns
    ///
    /// - `Ok(())`: If the validation succeeds and the threshold is met.
    /// - Relevant `ErrorCode` if validation fails due to mismatched IDs, domains, or insufficient hash occurrences.
    ///
    /// # Notes
    ///
    /// This function ensures data integrity by requiring alignment between the provided adapter IDs,
    /// domain, and ID with the deserialized `HashAccount` data. It is robust against invalid inputs
    /// and enforces a strict validation pipeline.
    pub fn check_hash_with_threshold(
        ctx: Context<CheckHashWithThreshold>,
        adapter_ids: Vec<[u8; 32]>,
        domain: [u8; 32],
        id: [u8; 32],
        threshold: u64,
    ) -> Result<()> {
        if threshold as usize > ctx.remaining_accounts.len() {
            return Err(error!(ErrorCode::InvalidThreshold));
        }

        if ctx.remaining_accounts.is_empty() {
            return Err(error!(ErrorCode::NoAccountsProvided));
        }

        if ctx.remaining_accounts.len() != adapter_ids.len() {
            return Err(error!(ErrorCode::InvalidAdapterIdsLength));
        }

        let mut hash_counts: HashMap<[u8; 32], u32> = HashMap::new();

        for (index, account_info) in ctx.remaining_accounts.iter().enumerate() {
            let data = account_info.try_borrow_data()?;
            let hash_account =
                HashAccount::try_deserialize(&mut data.as_ref()).expect("Error Deserializing Data");

            if hash_account.adapter_id != adapter_ids[index] {
                return Err(error!(ErrorCode::InvalidAdapterId));
            }

            if hash_account.domain != domain {
                return Err(error!(ErrorCode::InvalidDomain));
            }

            if hash_account.id != id {
                return Err(error!(ErrorCode::InvalidId));
            }

            let count = hash_counts.entry(hash_account.hash).or_insert(0);
            *count += 1;
        }

        let mut max_count = 0;
        for (_hash, count) in hash_counts.iter() {
            if *count > max_count {
                max_count = *count;
            }
        }

        if max_count >= threshold as u32 {
            Ok(())
        } else {
            Err(error!(ErrorCode::ThresholdNotMet))
        }
    }
}
