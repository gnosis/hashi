use crate::*;

#[account]
#[derive(Default)]
pub struct Config {
    /// A list of `Pubkey`s (public keys) representing accounts that are subscribed to updates, notifications, or other relevant events
    /// within the context of this program.
    ///
    /// - **Purpose**: To keep track of all accounts that need to be monitored or included in snapshot calculations.
    /// - **Usage**: Other instructions can reference this list to perform actions like notifying subscribers or including their data in computations.
    pub subscribed_accounts: Vec<Pubkey>,

    /// A 32-byte array representing a cryptographic root, such as a Merkle root.
    ///
    /// - **Purpose**: To verify the integrity of a dataset or to provide a reference point for subsequent operations.
    /// - **Usage**: This root is used across multiple instructions to ensure consistency and validity of the data being processed.
    pub root: [u8; 32],

    /// A boolean flag indicating whether the current `root` has been finalized.
    ///
    /// - **Purpose**: To determine if the `root` is in a stable state and no further modifications are expected.
    /// - **Usage**: Finalized roots might trigger specific actions or prevent further changes to ensure data integrity.
    pub root_finalized: bool,

    /// An unsigned 64-bit integer representing the expected batch number for root calculations.
    ///
    /// - **Purpose**: To manage and track the progression of batch processing, ensuring that roots are calculated in the correct sequence.
    /// - **Usage**: Helps in synchronizing batch operations and preventing out-of-order processing.
    pub expected_batch: u64,

    /// An unsigned 64-bit integer serving as a nonce, representing the number of calculated roots.
    ///
    /// - **Purpose**: To provide a unique identifier for each root calculation cycle.
    /// - **Usage**: Incremented each time a new root is calculated, ensuring that each root is distinct and traceable.
    pub nonce: u64,
}

impl Config {
    /// `MAXIMUM_SIZE` defines the total byte size allocated for the `Config` account.
    ///
    /// Anchor requires specifying the exact account size to allocate storage on the blockchain.
    /// This constant ensures that the account is allocated enough space for all its fields.
    ///
    /// **Breakdown of `MAXIMUM_SIZE`:**
    /// - `8` bytes: Account discriminator (used by Anchor to identify account types).
    /// - `4` bytes: Length prefix for the `subscribed_accounts` vector (`Vec<Pubkey>`).
    /// - `32 * 256` bytes: Maximum storage for `subscribed_accounts`. Each `Pubkey` is `32` bytes, and the vector is limited to `256` entries.
    /// - `32` bytes: The `root` array.
    /// - `1` byte: The `root_finalized` boolean flag.
    /// - `8` bytes: The `expected_batch` (`u64`).
    /// - `8` bytes: The `nonce` (`u64`).
    ///
    /// **Total**: `8 + 4 + (32 * 256) + 32 + 1 + 8 + 8 = 8 + 4 + 8192 + 32 + 1 + 8 + 8 = 82653` bytes.
    ///
    /// **Note**: The maximum number of `Pubkey`s (`256`) can be adjusted based on program requirements. If more are needed,
    /// consider using dynamic allocation techniques or multiple accounts to store additional data.
    pub const MAXIMUM_SIZE: usize = 8   // discriminator
        + 4                             // subscribed_accounts vec length
        + (32 * 256)                    // max subscribed_accounts data
        + 32                            // root
        + 1                             // root_finalized
        + 8                             // expected_batch (u64)
        + 8; // nonce (u64)

    /// `SEED_PREFIX` is a static byte array used as a seed for deriving the Program Derived Address (PDA) of the `Config` account.
    ///
    /// - **Purpose**: To ensure that the PDA is uniquely and deterministically derived, preventing address collisions.
    /// - **Usage**: Combined with other seeds and a bump value to generate a secure PDA that the program can control.
    pub const SEED_PREFIX: &'static [u8; 6] = b"config";
}
