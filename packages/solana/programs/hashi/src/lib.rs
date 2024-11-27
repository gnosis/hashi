use anchor_lang::prelude::*;
use std::collections::HashMap;

declare_id!("EyqiZf8Yt2CgVU5yPsj5e4EiGXeKrLhefWBn7CSqKPMC");

#[program]
pub mod hashi {
    use super::*;

    pub fn check_hash_with_threshold_from_adapters(
        ctx: Context<ReadHashes>,
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
        for (hash, count) in hash_counts.iter() {
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

#[derive(Accounts)]
pub struct ReadHashes {}

#[account]
pub struct HashAccount {
    pub adapter_id: [u8; 32],
    pub domain: [u8; 32],
    pub id: [u8; 32],
    pub hash: [u8; 32],
}

#[error_code]
pub enum ErrorCode {
    #[msg("The majority threshold was not met.")]
    ThresholdNotMet,
    #[msg("Invalid threshold: greater than the number of accounts provided.")]
    InvalidThreshold,
    #[msg("No accounts were provided.")]
    NoAccountsProvided,
    #[msg("Invalid adapter id.")]
    InvalidAdapterId,
    #[msg("Invalid adapter ids length.")]
    InvalidAdapterIdsLength,
    #[msg("Invalid domain.")]
    InvalidId,
    #[msg("Invalid id.")]
    InvalidDomain,
}
