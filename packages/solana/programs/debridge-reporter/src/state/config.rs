use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct Config {
    /// Snapshotter config address.
    ///
    /// - **Type**: `Pubkey`
    /// - **Purpose**:
    ///     - Stores the public key of the `snapshotter_config` account.
    ///     - This address is used to reference and interact with the snapshotter's configuration.
    ///     - Ensures that the program can locate and validate the snapshotter's configuration during operations.
    pub snapshotter_config: Pubkey,
}

impl Config {
    /// `MAXIMUM_SIZE` defines the total byte size allocated for the `Config` account.
    ///
    /// Anchor requires specifying the exact account size to allocate storage on the blockchain.
    /// This constant ensures that the account is allocated enough space for all its fields.
    ///
    /// **Breakdown of `MAXIMUM_SIZE`:**
    /// - `8` bytes: Account discriminator (used by Anchor to identify account types).
    /// - `32` bytes: The `snapshotter_config` field, which is a `Pubkey` (32 bytes).
    ///
    /// **Total `MAXIMUM_SIZE`**: `8 + 32 = 40` bytes.
    ///
    /// **Note**: Currently, the `Config` struct contains only one field. If additional fields are added in the future,
    /// update the `MAXIMUM_SIZE` accordingly to accommodate the new data.
    pub const MAXIMUM_SIZE: usize = 8 // discriminator
        + 32; // snapshotter_config

    /// `SEED_PREFIX` is a static byte array used as a seed for deriving the Program Derived Address (PDA) of the `Config` account.
    ///
    /// - **Type**: `&'static [u8; 6]`
    /// - **Value**: `b"config"`
    /// - **Purpose**:
    ///     - Provides a unique and consistent seed used in PDA derivation.
    ///     - Ensures that the PDA for the `Config` account is deterministic and can be reliably regenerated.
    ///     - Helps prevent address collisions by using a well-known, stable prefix.
    pub const SEED_PREFIX: &'static [u8; 6] = b"config";
}
