use anchor_lang::prelude::*;
use wormhole_anchor_sdk::wormhole::{self, program::Wormhole};

use crate::state::{Config, WormholeEmitter};

/// AKA `b"sent"`.
pub const SEED_PREFIX_SENT: &[u8; 4] = b"sent";

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The `owner` is a Signer account, indicating that whoever calls this instruction
    /// must sign the transaction with their private key. This ensures that the initializer
    /// has authority.
    ///
    /// `#[account(mut)]` is used here because the `owner` account's lamports are used
    /// to fund the creation of the `config` and `wormhole_emitter` accounts.
    ///
    /// ## Attributes
    ///
    /// - **`mut`**: Marks the `owner` account as mutable, allowing its lamports to be debited.
    #[account(mut)]
    /// Whoever initializes the config will be the owner of the program. Signer
    /// for creating the [`Config`] account and posting a Wormhole message
    /// indicating that the program is alive.
    pub owner: Signer<'info>,

    /// The `config` account will be created (initialized) by this instruction.
    ///
    /// The `init` attribute indicates that this account should be created (allocated and assigned)
    /// and initialized with the given seeds, bump, and space.
    ///
    /// - **`payer = owner`**: The `owner` account pays for the rent and creation cost of this account.
    /// - **`seeds = [Config::SEED_PREFIX]`**: Sets the PDA (program-derived address) seed that
    ///   uniquely identifies the `config` account. This ensures that the correct PDA is referenced.
    /// - **`bump`**: Used in combination with the seeds to find the PDA. The `bump` ensures a valid PDA
    ///   that is not already taken by another account.
    /// - **`space = Config::MAXIMUM_SIZE`**: Allocates the appropriate amount of space for the `config` account's data based on the `Config` structure.
    ///
    /// ## Attributes
    ///
    /// - **`init`**: Indicates that this account should be initialized by the instruction.
    /// - **`payer = owner`**: Specifies that the `owner` account will pay for the account's rent and creation.
    /// - **`seeds = [Config::SEED_PREFIX]`**: Defines the seed used to derive the PDA for the `config` account.
    /// - **`bump`**: Provides the bump seed necessary for PDA derivation.
    /// - **`space = Config::MAXIMUM_SIZE`**: Allocates sufficient space for the `config` account's data.
    ///
    /// ## Purpose:
    /// Acts as the central configuration hub, storing essential data required for dispatching roots,
    /// managing subscriptions, and maintaining program integrity.
    ///
    /// ## Security Considerations:
    /// - **PDA Derivation**: Ensures that the correct `config` account is accessed, preventing unauthorized access.
    /// - **Read-Only**: Not marked as mutable, indicating that it won't be modified during this instruction, enhancing security by preventing unintended state changes.
    #[account(
        init,
        payer = owner,
        seeds = [Config::SEED_PREFIX],
        bump,
        space = Config::MAXIMUM_SIZE,
    )]
    /// Config account, which saves program data useful for other instructions.
    /// Also saves the payer of the [`initialize`](crate::initialize) instruction
    /// as the program's owner.
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
    ///   - **`seeds = [wormhole::BridgeData::SEED_PREFIX]`**: Specifies the seed used to derive the PDA for the `wormhole_bridge` account.
    ///   - **`bump`**: The bump seed used in conjunction with the seeds to find the PDA.
    ///   - **`seeds::program = wormhole_program.key`**: Ensures that the PDA is derived using the Wormhole program's ID, preventing cross-program address collisions.
    ///
    /// ## Purpose:
    /// Maintains bridge-specific data required for posting messages via Wormhole.
    ///
    /// ## Security Considerations:
    /// - **Address Constraint**: Prevents unauthorized or incorrect bridge accounts from being used, ensuring that messages are routed through the legitimate bridge.
    #[account(
        mut,
        seeds = [wormhole::BridgeData::SEED_PREFIX],
        bump,
        seeds::program = wormhole_program.key
    )]
    /// Wormhole bridge data account (a.k.a. its config).
    /// [`wormhole::post_message`] requires this account be mutable.
    pub wormhole_bridge: Account<'info, wormhole::BridgeData>,

    /// The `wormhole_fee_collector` account collects fees associated with Wormhole messages.
    ///
    /// - **Type**: `Account<'info, wormhole::FeeCollector>`
    /// - **Attributes**:
    ///   - **`mut`**: Indicates that the account may be mutated during the instruction.
    ///   - **`seeds = [wormhole::FeeCollector::SEED_PREFIX]`**: Specifies the seed used to derive the PDA for the `wormhole_fee_collector` account.
    ///   - **`bump`**: The bump seed used in conjunction with the seeds to find the PDA.
    ///   - **`seeds::program = wormhole_program.key`**: Ensures that the PDA is derived using the Wormhole program's ID, preventing cross-program address collisions.
    ///
    /// ## Purpose:
    /// Handles the collection and management of fees for Wormhole message dispatches.
    ///
    /// ## Security Considerations:
    /// - **Address Constraint**: Prevents unauthorized accounts from intercepting or mismanaging fees by enforcing that the `wormhole_fee_collector` matches the expected address.
    #[account(
        mut,
        seeds = [wormhole::FeeCollector::SEED_PREFIX],
        bump,
        seeds::program = wormhole_program.key
    )]
    /// Wormhole fee collector account, which requires lamports before the
    /// program can post a message (if there is a fee).
    /// [`wormhole::post_message`] requires this account be mutable.
    pub wormhole_fee_collector: Account<'info, wormhole::FeeCollector>,

    /// The `wormhole_emitter` account is the program's emitter account.
    ///
    /// - **Type**: `Account<'info, WormholeEmitter>`
    /// - **Attributes**:
    ///   - **`init`**: Specifies that this account should be initialized (allocated and assigned) by this instruction.
    ///   - **`payer = owner`**: The `owner` account will pay for the rent and creation costs of the `wormhole_emitter` account.
    ///   - **`seeds = [WormholeEmitter::SEED_PREFIX]`**: Defines the seed used to derive the PDA for the `wormhole_emitter` account.
    ///   - **`bump`**: The bump seed used in conjunction with the seeds to find the PDA.
    ///   - **`space = WormholeEmitter::MAXIMUM_SIZE`**: Allocates sufficient space for the `wormhole_emitter` account's data based on the `WormholeEmitter` structure's maximum size.
    ///
    /// ## Purpose:
    /// Serves as the emitter responsible for generating and managing Wormhole messages.
    ///
    /// ## Security Considerations:
    /// - **PDA Derivation**: Ensures that only the legitimate emitter account is accessed, preventing unauthorized message emissions.
    /// - **Read-Only Access**: Not marked as mutable, preventing unintended state changes and enhancing security.
    #[account(
        init,
        payer = owner,
        seeds = [WormholeEmitter::SEED_PREFIX],
        bump,
        space = WormholeEmitter::MAXIMUM_SIZE
    )]
    /// This program's emitter account. We create this account in the
    /// [`initialize`](crate::initialize) instruction, but
    /// [`wormhole::post_message`] only needs it to be read-only.
    pub wormhole_emitter: Account<'info, WormholeEmitter>,

    /// The `wormhole_sequence` account tracks the sequence number for Wormhole messages.
    ///
    /// - **Type**: `UncheckedAccount<'info>`
    /// - **Attributes**:
    ///   - **`mut`**: Indicates that the account may be mutated during the instruction.
    ///   - **`seeds = [wormhole::SequenceTracker::SEED_PREFIX, wormhole_emitter.key().as_ref()]`**: Specifies the seeds used to derive the PDA for the `wormhole_sequence` account, incorporating the emitter's public key to ensure uniqueness.
    ///   - **`bump`**: The bump seed used in conjunction with the seeds to find the PDA.
    ///   - **`seeds::program = wormhole_program.key`**: Ensures that the PDA is derived using the Wormhole program's ID, preventing cross-program address collisions.
    ///
    /// ## Purpose:
    /// Maintains and updates the sequence number for each Wormhole message, ensuring proper ordering and uniqueness.
    ///
    /// ## Security Considerations:
    /// - **Address Constraint**: Enforces that the `wormhole_sequence` account matches the expected address stored in `config.wormhole.sequence`.
    /// - **UncheckedAccount**: Since this is an `UncheckedAccount`, Anchor does not perform type or ownership checks. It is crucial to manually validate that this account is correctly derived and holds valid sequence data.
    #[account(
        mut,
        seeds = [
            wormhole::SequenceTracker::SEED_PREFIX,
            wormhole_emitter.key().as_ref()
        ],
        bump,
        seeds::program = wormhole_program.key
    )]
    /// CHECK: Emitter's sequence account. This is not created until the first
    /// message is posted, so it needs to be an [UncheckedAccount] for the
    /// [`initialize`](crate::initialize) instruction.
    /// [`wormhole::post_message`] requires this account be mutable.
    pub wormhole_sequence: UncheckedAccount<'info>,

    /// The `wormhole_message` account represents the Wormhole message to be dispatched.
    ///
    /// - **Type**: `UncheckedAccount<'info>`
    /// - **Attributes**:
    ///   - **`mut`**: Indicates that the account may be mutated during the instruction.
    ///   - **`seeds = [SEED_PREFIX_SENT, &wormhole::INITIAL_SEQUENCE.to_le_bytes()[..]]`**: Specifies the seeds used to derive the PDA for the `wormhole_message` account, incorporating a static initial sequence to ensure uniqueness.
    ///   - **`bump`**: The bump seed used in conjunction with the seeds to find the PDA.
    ///
    /// ## Purpose:
    /// Holds the serialized Wormhole message that will be dispatched to the target chain.
    ///
    /// ## Security Considerations:
    /// - **UncheckedAccount**: Since this is an `UncheckedAccount`, Anchor does not perform type or ownership checks. It is crucial to manually validate that this account is correctly derived and holds valid message data.
    /// - **Address Derivation**: Incorporating a static initial sequence ensures that each message account is uniquely derived, preventing address collisions and replay attacks.
    #[account(
        mut,
        seeds = [
            SEED_PREFIX_SENT,
            &wormhole::INITIAL_SEQUENCE.to_le_bytes()[..]
        ],
        bump,
    )]
    /// CHECK: Wormhole message account. The Wormhole program writes to this
    /// account, which requires this program's signature.
    /// [`wormhole::post_message`] requires this account be mutable.
    pub wormhole_message: UncheckedAccount<'info>,

    /// The `snapshotter_config` account represents the snapshotter's configuration.
    ///
    /// - **Type**: `UncheckedAccount<'info>`
    ///
    /// ## Purpose:
    /// Maintains the snapshotter's configuration, ensuring that dispatch operations are consistent with the current configuration.
    ///
    /// ## Security Considerations:
    /// - **Address Constraint**: Enforces that the `snapshotter_config` account provided is the one expected by the `config` account, preventing unauthorized modifications.
    /// - **UncheckedAccount**: Requires manual validation to ensure that the account's data aligns with program expectations.
    /// CHECK: Snapshotter program
    pub snapshotter_config: UncheckedAccount<'info>,

    /// The `clock` sysvar provides access to the Solana cluster's clock data.
    ///
    /// - **Type**: `Sysvar<'info, Clock>`
    ///
    /// ## Purpose:
    /// Allows the program to access time-related data, such as the current slot, epoch, and Unix timestamp.
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

    /// The `system_program` is the Solana System Program responsible for creating and allocating accounts.
    ///
    /// - **Type**: `Program<'info, System>`
    ///
    /// ## Purpose:
    /// Facilitates interactions with the Solana runtime, such as creating and funding accounts.
    ///
    /// ## Security Considerations:
    /// - **Standardization**: By referencing the standard System Program, the program ensures compatibility and reliability in account management operations.
    pub system_program: Program<'info, System>,
}
