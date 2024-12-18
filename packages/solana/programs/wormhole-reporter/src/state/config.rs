use anchor_lang::prelude::*;

#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub struct WormholeAddresses {
    /// [BridgeData](wormhole_anchor_sdk::wormhole::BridgeData) address.
    ///
    /// The BridgeData account holds configuration and state information necessary
    /// for the Wormhole bridge operations.
    pub bridge: Pubkey,

    /// [FeeCollector](wormhole_anchor_sdk::wormhole::FeeCollector) address.
    ///
    /// The FeeCollector account is responsible for accumulating fees associated
    /// with Wormhole message dispatches. It ensures that the program can cover
    /// the costs of cross-chain messaging.
    pub fee_collector: Pubkey,

    /// [SequenceTracker](wormhole_anchor_sdk::wormhole::SequenceTracker) address.
    ///
    /// The SequenceTracker account maintains the sequence number for Wormhole messages,
    /// ensuring proper ordering and uniqueness. It is crucial for preventing replay
    /// attacks and maintaining message integrity.
    pub sequence: Pubkey,
}

impl WormholeAddresses {
    /// The total length of the `WormholeAddresses` structure in bytes.
    ///
    /// This constant is used to allocate sufficient space for the `WormholeAddresses`
    /// within other account structures, such as `Config`.
    pub const LEN: usize =
          32 // bridge
        + 32 // fee_collector
        + 32 // sequence
    ;
}

#[account]
#[derive(Default)]
pub struct Config {
    /// Program's owner.
    ///
    /// The `owner` field holds the public key of the entity that owns the program.
    /// This account is typically the signer who initializes the program and has administrative
    /// privileges over its operations.
    pub owner: Pubkey,

    /// Wormhole program's relevant addresses.
    ///
    /// The `wormhole` field contains a `WormholeAddresses` structure, which encapsulates
    /// all necessary Wormhole-related public keys required for cross-chain messaging.
    pub wormhole: WormholeAddresses,

    /// Batch identifier.
    ///
    /// The `batch_id` serves as an identifier for batches of operations or messages.
    /// It can be used to group related actions or track the program's state across different
    /// operational phases.
    pub batch_id: u32,

    /// Finality level.
    ///
    /// The `finality` field represents the consistency level for Solana transactions,
    /// typically corresponding to Solana's [Finality](wormhole_anchor_sdk::wormhole::Finality)
    /// enum. It determines how finalized a transaction should be before it's considered
    /// complete or irreversible.
    pub finality: u8,

    /// Snapshotter configuration address.
    ///
    /// The `snapshotter_config` holds the public key of the Snapshotter program's configuration
    /// account. This allows the program to interact with the Snapshotter for maintaining
    /// consistent states or snapshots of data as required.
    pub snapshotter_config: Pubkey,
}

impl Config {
    /// The maximum size of the `Config` account in bytes.
    ///
    /// This constant ensures that the `Config` account has enough allocated space to store
    /// all its fields, including the discriminator used by Anchor.
    pub const MAXIMUM_SIZE: usize = 8 // Discriminator
        + 32 // owner
        + WormholeAddresses::LEN // wormhole
        + 4 // batch_id
        + 1 // finality
        + 32 // snapshotter_config
    ;

    /// The seed prefix used for deriving the PDA (Program Derived Address) of the `Config` account.
    ///
    /// Using a consistent seed prefix ensures that the `Config` account can be reliably
    /// derived and accessed across different instructions and transactions.
    pub const SEED_PREFIX: &'static [u8; 6] = b"config";
}
