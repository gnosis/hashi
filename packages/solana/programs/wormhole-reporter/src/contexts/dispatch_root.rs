use anchor_lang::prelude::*;
use wormhole_anchor_sdk::wormhole::{self, program::Wormhole};

use crate::{
    error::ErrorCode,
    state::{Config, WormholeEmitter},
};

/// AKA `b"sent"`.
const SEED_PREFIX_SENT: &[u8; 4] = b"sent";

#[derive(Accounts)]
pub struct DispatchRoot<'info> {
    /// The `payer` is responsible for paying the Wormhole fee to post a message.
    ///
    /// - **Type**: `Signer<'info>`
    /// - **Attributes**:
    ///   - **`mut`**: Indicates that the `payer` account may be mutated (e.g., lamports debited) during the instruction.
    ///
    /// ## Purpose:
    /// Ensures that the entity dispatching the root has the authority and funds to cover the necessary fees.
    ///
    /// ## Security Considerations:
    /// - **Authority**: Only authorized signers should be able to invoke this instruction to prevent unauthorized fee payments.
    /// - **Funds Management**: Ensures that the payer has sufficient lamports to cover the Wormhole fee.
    #[account(mut)]
    /// Payer will pay Wormhole fee to post a message.
    pub payer: Signer<'info>,

    /// The `config` account holds the snapshotter's configuration and state.
    ///
    /// - **Type**: `Account<'info, Config>`
    /// - **Attributes**:
    ///   - **`seeds = [Config::SEED_PREFIX]`**: Specifies that the `config` account is derived from a PDA using `Config::SEED_PREFIX` as the seed.
    ///   - **`bump`**: The bump seed used in conjunction with the seeds to find the PDA.
    ///
    /// ## Purpose:
    /// Acts as the central configuration hub, storing essential data required for dispatching roots,
    /// managing subscriptions, and maintaining program integrity.
    ///
    /// ## Security Considerations:
    /// - **PDA Derivation**: Ensures that the correct `config` account is accessed, preventing unauthorized access.
    /// - **Read-Only**: Not marked as mutable, indicating that it won't be modified during this instruction, enhancing security by preventing unintended state changes.
    #[account(
        seeds = [Config::SEED_PREFIX],
        bump,
    )]
    /// Config account. Wormhole PDAs specified in the config are checked
    /// against the Wormhole accounts in this context. Read-only.
    pub config: Account<'info, Config>,

    /// The `wormhole_program` is the Wormhole protocol's program.
    ///
    /// - **Type**: `Program<'info, Wormhole>`
    ///
    /// ## Purpose:
    /// Facilitates interactions with the Wormhole protocol, such as posting messages across chains.
    ///
    /// ## Security Considerations:
    /// - **Program Integrity**: Ensures that interactions are only made with the legitimate Wormhole program.
    pub wormhole_program: Program<'info, Wormhole>,

    /// The `wormhole_bridge` account holds the Wormhole bridge data.
    ///
    /// - **Type**: `Account<'info, wormhole::BridgeData>`
    /// - **Attributes**:
    ///   - **`mut`**: Indicates that the account may be mutated during the instruction.
    ///   - **`address = config.wormhole.bridge @ ErrorCode::InvalidWormholeConfig`**: Ensures that the provided `wormhole_bridge` account matches the expected bridge address stored in `config.wormhole.bridge`.
    ///
    /// ## Purpose:
    /// Maintains bridge-specific data required for posting messages via Wormhole.
    ///
    /// ## Security Considerations:
    /// - **Address Constraint**: Prevents unauthorized accounts from being used by enforcing that the `wormhole_bridge` matches the expected address.
    #[account(
        mut,
        address = config.wormhole.bridge @ ErrorCode::InvalidWormholeConfig
    )]
    /// Wormhole bridge data. [`wormhole::post_message`] requires this account
    /// be mutable.
    pub wormhole_bridge: Account<'info, wormhole::BridgeData>,

    /// The `wormhole_fee_collector` account collects fees associated with Wormhole messages.
    ///
    /// - **Type**: `Account<'info, wormhole::FeeCollector>`
    /// - **Attributes**:
    ///   - **`mut`**: Indicates that the account may be mutated during the instruction.
    ///   - **`address = config.wormhole.fee_collector @ ErrorCode::InvalidWormholeFeeCollector`**: Ensures that the provided `wormhole_fee_collector` account matches the expected fee collector address stored in `config.wormhole.fee_collector`.
    ///
    /// ## Purpose:
    /// Handles the collection and management of fees for Wormhole message dispatches.
    ///
    /// ## Security Considerations:
    /// - **Address Constraint**: Prevents unauthorized accounts from being used by enforcing that the `wormhole_fee_collector` matches the expected address.
    #[account(
        mut,
        address = config.wormhole.fee_collector @ ErrorCode::InvalidWormholeFeeCollector
    )]
    /// Wormhole fee collector. [`wormhole::post_message`] requires this
    /// account be mutable.
    pub wormhole_fee_collector: Account<'info, wormhole::FeeCollector>,

    /// The `wormhole_emitter` account is the program's emitter account.
    ///
    /// - **Type**: `Account<'info, WormholeEmitter>`
    /// - **Attributes**:
    ///   - **`seeds = [WormholeEmitter::SEED_PREFIX]`**: Specifies the seed used to derive the PDA for the `wormhole_emitter` account.
    ///   - **`bump`**: The bump seed used in conjunction with the seeds to find the PDA.
    ///
    /// ## Purpose:
    /// Acts as the emitter responsible for generating and managing Wormhole messages.
    ///
    /// ## Security Considerations:
    /// - **PDA Derivation**: Ensures that only the legitimate emitter account is accessed, preventing unauthorized message emissions.
    /// - **Read-Only**: Not marked as mutable, indicating that it won't be modified during this instruction, enhancing security by preventing unintended state changes.
    #[account(
        seeds = [WormholeEmitter::SEED_PREFIX],
        bump,
    )]
    /// Program's emitter account. Read-only.
    pub wormhole_emitter: Account<'info, WormholeEmitter>,

    /// The `wormhole_sequence` account tracks the sequence number for Wormhole messages.
    ///
    /// - **Type**: `Account<'info, wormhole::SequenceTracker>`
    /// - **Attributes**:
    ///   - **`mut`**: Indicates that the account may be mutated during the instruction.
    ///   - **`address = config.wormhole.sequence @ ErrorCode::InvalidWormholeSequence`**: Ensures that the provided `wormhole_sequence` account matches the expected sequence tracker address stored in `config.wormhole.sequence`.
    ///
    /// ## Purpose:
    /// Maintains and updates the sequence number for each Wormhole message, ensuring proper ordering and uniqueness.
    ///
    /// ## Security Considerations:
    /// - **Address Constraint**: Prevents unauthorized accounts from being used by enforcing that the `wormhole_sequence` matches the expected address.
    #[account(
        mut,
        address = config.wormhole.sequence @ ErrorCode::InvalidWormholeSequence
    )]
    /// Emitter's sequence account. [`wormhole::post_message`] requires this
    /// account be mutable.
    pub wormhole_sequence: Account<'info, wormhole::SequenceTracker>,

    /// The `wormhole_message` account represents the Wormhole message to be dispatched.
    ///
    /// - **Type**: `UncheckedAccount<'info>`
    /// - **Attributes**:
    ///   - **`mut`**: Indicates that the account may be mutated during the instruction.
    ///   - **`seeds = [SEED_PREFIX_SENT, &wormhole_sequence.next_value().to_le_bytes()[..]]`**: Specifies the seeds used to derive the PDA for the `wormhole_message` account, incorporating a dynamic component based on the sequence number.
    ///   - **`bump`**: The bump seed used in conjunction with the seeds to find the PDA.
    ///
    /// ## Purpose:
    /// Holds the serialized Wormhole message that will be dispatched to the target chain.
    ///
    /// ## Security Considerations:
    /// - **UncheckedAccount**: Since this is an `UncheckedAccount`, Anchor does not perform type or ownership checks. It is crucial to manually validate that this account is correctly derived and holds valid message data.
    /// - **Address Constraint**: Ensures that the `wormhole_message` account is uniquely derived based on the current sequence number, preventing message duplication or replay.
    #[account(
        mut,
        seeds = [
            SEED_PREFIX_SENT,
            &wormhole_sequence.next_value().to_le_bytes()[..]
        ],
        bump,
    )]
    /// CHECK: Wormhole Message. [`wormhole::post_message`] requires this
    /// account be mutable.
    pub wormhole_message: UncheckedAccount<'info>,

    /// The `snapshotter_config` account represents the snapshotter's configuration.
    ///
    /// - **Type**: `UncheckedAccount<'info>`
    /// - **Attributes**:
    ///   - **`mut`**: Indicates that the account may be mutated during the instruction.
    ///   - **`address = config.snapshotter_config @ ErrorCode::InvalidSnapshotterConfig`**: Ensures that the provided `snapshotter_config` account matches the expected snapshotter configuration address stored in `config.snapshotter_config`.
    ///
    /// ## Purpose:
    /// Maintains the snapshotter's configuration, ensuring that dispatch operations are consistent with the current configuration.
    ///
    /// ## Security Considerations:
    /// - **Address Constraint**: Enforces that the `snapshotter_config` account provided is the one expected by the `config` account, preventing unauthorized modifications.
    /// - **UncheckedAccount**: Requires manual validation to ensure that the account's data aligns with program expectations.
    #[account(
        mut,
        address = config.snapshotter_config @ ErrorCode::InvalidSnapshotterConfig
    )]
    /// CHECK: Snapshotter program
    pub snapshotter_config: UncheckedAccount<'info>,

    /// The `system_program` is the Solana System Program responsible for creating and allocating accounts.
    ///
    /// - **Type**: `Program<'info, System>`
    ///
    /// ## Purpose:
    /// Facilitates interactions with the Solana runtime, such as account creation, funding, and lamport transfers.
    ///
    /// ## Security Considerations:
    /// - **Standardization**: By referencing the standard System Program, the program ensures compatibility and reliability in account management operations.
    pub system_program: Program<'info, System>,

    /// The `clock` sysvar provides access to the Solana cluster's clock data.
    ///
    /// - **Type**: `Sysvar<'info, Clock>`
    ///
    /// ## Purpose:
    /// Allows the program to access time-related data, such as the current slot, epoch, and unix timestamp.
    ///
    /// ## Security Considerations:
    /// - **Immutable**: Sysvars like `Clock` are read-only, ensuring that programs cannot tamper with time data.
    pub clock: Sysvar<'info, Clock>,

    /// The `rent` sysvar provides access to the rent-related data of the Solana cluster.
    ///
    /// - **Type**: `Sysvar<'info, Rent>`
    ///
    /// ## Purpose:
    /// Allows the program to query rent rates and determine whether an account is rent-exempt.
    ///
    /// ## Security Considerations:
    /// - **Immutable**: Sysvars like `Rent` are read-only, ensuring that programs cannot tamper with rent data.
    pub rent: Sysvar<'info, Rent>,
}
