use anchor_lang::prelude::*;

declare_id!("4v78nFouRCT7q29cGUoUxeTrwLufsYETH6TFqdiFBonT");

pub mod contexts;
pub mod state;

pub use contexts::*;
pub use state::*;

#[program]
pub mod adapter {
    use super::*;

    /// Stores a hash in a `HashAccount` for later validation or retrieval.
    ///
    /// This function updates the provided `HashAccount` with the specified adapter ID, domain, ID, and hash.
    /// It is primarily used to persist hash data in a consistent and structured way for subsequent operations,
    /// such as validation or consensus checks.
    ///
    /// # Arguments
    ///
    /// - `ctx`: A `Context` object containing the `HashAccount` to be updated.
    /// - `adapter_id`: A 32-byte identifier representing the adapter associated with this hash.
    /// - `domain`: A 32-byte domain identifier that contextualizes the hash within a specific scope.
    /// - `id`: A 32-byte identifier uniquely identifying the subject or entity associated with this hash.
    /// - `hash`: A 32-byte hash value to be stored in the `HashAccount`.
    ///
    /// # Returns
    ///
    /// - `Ok(())`: If the hash is successfully stored in the `HashAccount`.
    ///
    /// # Notes
    ///
    /// - This function assumes that the provided `HashAccount` is correctly initialized and writable.
    /// - The emitted event allows external systems or users to monitor the stored hash details without
    ///   directly querying the on-chain state.
    pub fn store_hash(
        ctx: Context<StoreHash>,
        adapter_id: [u8; 32],
        domain: [u8; 32],
        id: [u8; 32],
        hash: [u8; 32],
    ) -> Result<()> {
        let hash_account = &mut ctx.accounts.hash_account;

        hash_account.adapter_id = adapter_id;
        hash_account.domain = domain;
        hash_account.id = id;
        hash_account.hash = hash;

        emit!(HashStored {
            adapter_id,
            domain,
            id,
            hash
        });

        Ok(())
    }
}

#[event]
pub struct HashStored {
    pub adapter_id: [u8; 32],
    pub domain: [u8; 32],
    pub id: [u8; 32],
    pub hash: [u8; 32],
}
