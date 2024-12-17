use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak::{hashv, Hash};

declare_id!("37298hWBczA1od9ytwgSYyhP42WLNiXieAVCxBxAeX9S");

pub mod contexts;
pub mod error;
pub mod state;

pub use contexts::*;
pub use error::ErrorCode;
pub use state::*;

pub fn account_hasher(
    pubkey: &Pubkey,
    lamports: u64,
    data: &[u8],
    owner: &Pubkey,
    rent_epoch: u64,
) -> Hash {
    hashv(&[
        pubkey.as_ref(),
        &lamports.to_le_bytes(),
        data,
        owner.as_ref(),
        &rent_epoch.to_le_bytes(),
    ])
}

#[program]
pub mod snapshotter {
    use super::*;

    // Determines how many accounts are processed per batch during root calculation.
    pub const BATCH_SIZE: usize = 10;

    // Initializes the `Config` account when the program is first set up.
    // Sets the root to a default value, marks it as not finalized, and
    // sets the expected batch to zero, preparing the system for future operations.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.root = Hash::default().to_bytes();
        config.root_finalized = false;
        config.expected_batch = 0;
        config.nonce = 0;

        Ok(())
    }

    // Subscribes a new account to the `subscribed_accounts` list within the `Config`.
    // This function ensures that the account is not already subscribed before adding it.
    pub fn subscribe(ctx: Context<Subscribe>, account_to_subscribe: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;

        if config.subscribed_accounts.contains(&account_to_subscribe) {
            return Err(error!(ErrorCode::AccountAlreadySubscribed));
        }

        config.subscribed_accounts.push(account_to_subscribe);

        Ok(())
    }

    // Calculates the Merkle root incrementally in batches.
    //
    // The `batch` parameter indicates which batch of accounts we are currently processing.
    // Each batch should process exactly `BATCH_SIZE` accounts (except possibly the last batch
    // if the total number of subscribed accounts is not a multiple of `BATCH_SIZE`).
    //
    // Steps:
    // 1. Verify that the batch provided matches the `expected_batch` in the `Config`.
    // 2. Ensure that the provided `remaining_accounts` length matches `BATCH_SIZE` for all
    //    but the last batch. For the last batch, it can be fewer accounts.
    // 3. If it's the last batch, finalize the root and reset `expected_batch` to 0;
    //    otherwise, increment `expected_batch` and mark the root as not finalized.
    // 4. Hash each account's state and update the Merkle Mountain Range (MMR) root.
    // 5. Store the updated root in the `config`.
    pub fn calculate_root(ctx: Context<CalculateRoot>, batch: u64) -> Result<()> {
        let config = &mut ctx.accounts.config;

        if batch != config.expected_batch {
            return Err(error!(ErrorCode::InvalidBatch));
        }

        let is_last_batch = ((config.subscribed_accounts.len() / BATCH_SIZE) as u64) == batch;
        if (is_last_batch && ctx.remaining_accounts.len() > BATCH_SIZE)
            || (!is_last_batch && ctx.remaining_accounts.len() != BATCH_SIZE)
        {
            return Err(error!(ErrorCode::InvalidRemainingAccountsLength));
        }

        if is_last_batch {
            config.root_finalized = true;
            config.expected_batch = 0;
            config.nonce += 1;
        } else {
            config.root_finalized = false;
            config.expected_batch += 1;
        }

        let mut account_hashes = Vec::new();
        let start_index: usize = (batch * BATCH_SIZE as u64).try_into().unwrap();

        for (index, account) in ctx.remaining_accounts.iter().enumerate() {
            if *account.key != config.subscribed_accounts[start_index + index] {
                return Err(error!(ErrorCode::InvalidSubscribedAccount));
            }

            let lamport_ref = account.lamports.borrow();
            let data_ref = account.data.borrow();

            account_hashes.push(account_hasher(
                &account.key,
                **lamport_ref,
                &data_ref,
                account.owner,
                account.rent_epoch,
            ));
        }

        let mut mmr = MerkleMountainRange::from(Hash::new_from_array(config.root));
        mmr.update_root(account_hashes)?;
        config.root = mmr.root.to_bytes();

        Ok(())
    }
}

pub struct MerkleMountainRange {
    pub root: Hash,
}

impl From<Hash> for MerkleMountainRange {
    fn from(root: Hash) -> Self {
        MerkleMountainRange { root: root }
    }
}

impl MerkleMountainRange {
    pub fn new() -> Self {
        MerkleMountainRange {
            root: Hash::default(),
        }
    }

    pub fn update_root(&mut self, new_leaves: Vec<Hash>) -> Result<()> {
        let mut current_layer = new_leaves;

        while current_layer.len() > 1 {
            let mut next_layer = Vec::new();
            let mut i = 0;
            while i < current_layer.len() {
                if i + 1 < current_layer.len() {
                    next_layer.push(hashv(&[
                        &current_layer[i].to_bytes(),
                        &current_layer[i + 1].to_bytes(),
                    ]));
                    i += 2;
                } else {
                    // If there's an odd one out, it becomes a peak as-is
                    next_layer.push(current_layer[i]);
                    i += 1;
                }
            }
            current_layer = next_layer;
        }

        self.root = if self.root == Hash::default() {
            current_layer[0]
        } else {
            hashv(&[&self.root.to_bytes(), &current_layer[0].to_bytes()])
        };

        Ok(())
    }
}
