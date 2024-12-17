use crate::*;

#[account]
#[derive(Default)]
pub struct Config {
    // A list of Pubkeys (addresses) that are considered to be subscribed
    // to something within the context of this program (e.g., updates, notifications, etc.).
    pub subscribed_accounts: Vec<Pubkey>,

    // A 32-byte value representing some form of root data. This could be, for example, a Merkle root
    // used to verify the integrity of a dataset or something similar that needs to be referenced
    // persistently across multiple instructions.
    pub root: [u8; 32],

    // A boolean flag indicating whether the `root` is finalized. If `true`, it might mean
    // no further changes to the `root` are allowed, or that some condition has been met.
    pub root_finalized: bool,

    // An unsigned 64-bit integer that might represent an expected batch number or
    // counter for a process that runs periodically or sequentially.
    pub expected_batch: u64,
}

// `impl Config` block provides associated functions for `Config`.
impl Config {
    // MAXIMUM_SIZE provides a static size allocation for this account’s storage.
    // Anchor requires specifying account size, and this constant ensures that the
    // account is allocated enough space for the data it holds.
    //
    // Explanation of each term:
    // - 8 bytes for the account discriminator (Anchor uses an 8-byte prefix to identify account types)
    // - 4 bytes for the `subscribed_accounts` vector's length (since the vector is variable-length,
    //   its length is stored as a 32-bit integer)
    // - (32 * 256) bytes for the maximum number of `Pubkey`s we anticipate storing. Each `Pubkey` is 32 bytes,
    //   and we’re currently limiting ourselves to 256 of them.
    // - 32 bytes for the `root` array
    // - 1 byte for the boolean `root_finalized`
    // - 8 bytes for the `expected_batch` (u64)
    //
    // In the future, if we need to store more than 256 `Pubkey`s, we might consider
    // reallocation (using `realloc` in Anchor) or a PDA-based approach to store additional data.
    pub const MAXIMUM_SIZE: usize = 8   // discriminator
        + 4                             // subscribed_accounts vec length
        + (32 * 256)                    // max subscribed_accounts data
        + 32                            // root
        + 1                             // root_finalized
        + 8; // expected_batch

    // The seed prefix is a static byte array used as part of the seeds to derive
    // the program's `Config` account's PDA (Program-Derived Address).
    // Using a well-known, stable prefix ensures that we can reliably find the `Config` PDA.
    pub const SEED_PREFIX: &'static [u8; 6] = b"config";
}
