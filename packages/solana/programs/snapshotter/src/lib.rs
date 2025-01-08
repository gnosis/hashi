use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::{hashv, Hash};

declare_id!("DbSgaTonU4UeQnZNKmKFM5odd5SUk9EVb1QRhyt2L42M");

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
    use batch_merkle_tree::BatchMerkleTree;

    // Determines how many accounts are processed per batch during root calculation.
    pub const BATCH_SIZE: usize = 10;

    /// Initializes the `Config` account when the program is first set up.
    ///
    /// This function sets the initial state of the `Config` account by:
    /// - Setting the `root` to a default hash value.
    /// - Marking the `root_finalized` flag as `false`.
    /// - Setting the `expected_batch` to `0`.
    /// - Initializing the `nonce` to `0`.
    ///
    /// These initializations prepare the system for future operations related to snapshotting.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context containing all the accounts required for initialization.
    ///
    /// # Returns
    ///
    /// * `Result<()>` - Returns `Ok(())` if successful, or an error otherwise.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;

        // Set the root to a default hash value (all zeros)
        config.root = Hash::default().to_bytes();
        // Mark the root as not finalized
        config.root_finalized = false;
        // Set the expected batch to zero, indicating that the first batch to process is batch 0
        config.expected_batch = 0;
        // Initialize the nonce to zero, which can be used for versioning
        config.nonce = 0;

        Ok(())
    }

    /// Subscribes a new account to the `subscribed_accounts` list within the `Config`.
    ///
    /// This function ensures that the account is not already subscribed before adding it to prevent duplicates.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context containing all the accounts required for subscription.
    /// * `account_to_subscribe` - The public key of the account to be subscribed.
    ///
    /// # Returns
    ///
    /// * `Result<()>` - Returns `Ok(())` if successful, or an error otherwise.
    pub fn subscribe(ctx: Context<Subscribe>, account_to_subscribe: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;

        // Check if the account is already subscribed to prevent duplicates
        if config.subscribed_accounts.contains(&account_to_subscribe) {
            return Err(error!(ErrorCode::AccountAlreadySubscribed));
        }

        // Add the new account to the list of subscribed accounts
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
    // 4. Hash each account's state and update the Batch Merkle Tree (BMT) root.
    // 5. Store the updated root in the `config`.
    pub fn calculate_root(ctx: Context<CalculateRoot>, batch: u64) -> Result<()> {
        let config = &mut ctx.accounts.config;

        // Step 1: Verify that the provided batch number matches the expected batch
        if batch != config.expected_batch {
            return Err(error!(ErrorCode::InvalidBatch));
        }

        // Determine if the current batch is the last batch
        let is_last_batch = ((config.subscribed_accounts.len() / BATCH_SIZE) as u64) == batch;
        // Step 2: Verify the number of remaining accounts
        if (is_last_batch && ctx.remaining_accounts.len() > BATCH_SIZE)
            || (!is_last_batch && ctx.remaining_accounts.len() != BATCH_SIZE)
        {
            return Err(error!(ErrorCode::InvalidRemainingAccountsLength));
        }

        // Step 3: Finalize or prepare for the next batch
        if is_last_batch {
            // If it's the last batch, finalize the root and reset for future operations
            config.root_finalized = true;
            config.expected_batch = 0;
            config.nonce += 1;
        } else {
            // If not the last batch, prepare for the next batch
            config.root_finalized = false;
            config.expected_batch += 1;
        }

        let mut account_hashes = Vec::new();
        // Calculate the starting index for the current batch
        let start_index: usize = (batch * BATCH_SIZE as u64).try_into().unwrap();

        // Step 4: Iterate over the accounts in the current batch
        for (index, account) in ctx.remaining_accounts.iter().enumerate() {
            // Verify that the account is indeed subscribed and in the correct order
            if *account.key != config.subscribed_accounts[start_index + index] {
                return Err(error!(ErrorCode::InvalidSubscribedAccount));
            }

            // Borrow the lamports (SOL balance) and data of the account for hashing
            let lamport_ref = account.lamports.borrow();
            let data_ref = account.data.borrow();

            // Compute the hash of the account's state
            account_hashes.push(account_hasher(
                &account.key,
                **lamport_ref,
                &data_ref,
                account.owner,
                account.rent_epoch,
            ));
        }

        // Step 5: Update the Batch Merkle Tree (BMT) with the new account hashes
        let mut tree = BatchMerkleTree::from(Hash::new_from_array(config.root));
        tree.push_batch(account_hashes)?;
        // Store the updated root back into the `Config`
        config.root = tree.root.to_bytes();

        Ok(())
    }
}
