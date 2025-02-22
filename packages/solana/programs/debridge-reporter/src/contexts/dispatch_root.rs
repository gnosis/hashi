use anchor_lang::prelude::*;

use crate::{error::ErrorCode, state::Config};

#[derive(Accounts)]
pub struct DispatchRoot<'info> {
    /// The `config` account holds the snapshotter's configuration and state.
    ///
    /// - **PDA Derivation**: The account is a PDA derived using the `Config::SEED_PREFIX` as the seed. This ensures
    ///   that the account address is uniquely identified and securely accessed by the program.
    ///
    /// - **Bump Seed**: The `bump` attribute is used to derive the PDA alongside the seeds. It guarantees that the PDA
    ///   is valid and helps prevent collisions with other accounts.
    ///
    /// - **Read-Only**: The absence of the `mut` keyword indicates that this account will not be modified during
    ///   the instruction execution.
    #[account(
        seeds = [Config::SEED_PREFIX],
        bump,
    )]
    /// Config account.
    pub config: Account<'info, Config>,

    /// The `snapshotter_config` account represents the snapshotter's configuration.
    ///
    /// - **Mutability**: Marked as `mut` to allow modifications during the instruction execution.
    /// - **Address Constraint**: Ensures that the provided `snapshotter_config` account matches the
    ///   `snapshotter_config` specified within the `config` account. If there is a mismatch,
    ///   the program will throw the `InvalidSnapshotterConfig` error.
    ///
    /// - **CHECK Annotation**:
    ///   - **Purpose**: Indicates to Anchor that this account requires manual validation.
    ///   - **Reason**: Since `UncheckedAccount` bypasses Anchor's type and ownership checks, the developer
    ///     must ensure that the account is valid and correctly matches the expected configuration.
    ///
    /// ## Security Considerations:
    /// - **Manual Validation**: Developers must ensure that the `snapshotter_config` account is trustworthy
    ///   and correctly corresponds to the one stored in `config`. Failing to do so can lead to unauthorized
    ///   modifications or inconsistencies in the program's state.
    ///
    /// ## Error Handling:
    /// - **`ErrorCode::InvalidSnapshotterConfig`**:
    ///   - **Trigger**: Thrown when the `snapshotter_config` account's public key does not match the one specified in `config`.
    ///   - **Purpose**: Prevents unauthorized or incorrect accounts from being used, ensuring the integrity of the snapshotter's configuration.
    #[account(
        mut,
        address = config.snapshotter_config @ ErrorCode::InvalidSnapshotterConfig
    )]
    /// CHECK: Snapshotter program
    pub snapshotter_config: UncheckedAccount<'info>,
}
