use crate::*;

#[derive(Accounts)]
pub struct CalculateRoot<'info> {
    /// The `config` account holds the snapshotter's configuration and state.
    ///
    /// - **PDA Derivation**: The account is a PDA derived using the `Config::SEED_PREFIX` as the seed. This ensures
    ///   that the account is uniquely identified and securely accessed by the program.
    ///
    /// - **Bump Seed**: The `bump` attribute is used to derive the PDA alongside the seeds. It guarantees that the PDA
    ///   is valid and helps prevent collisions with other accounts.
    ///
    /// - **Mutability**: The `mut` keyword indicates that this account will be modified during the instruction execution.
    ///   Specifically, the `calculate_root` function updates fields within the `Config` account, such as the Merkle root,
    ///   finalization status, expected batch number, and nonce.
    ///
    /// ## Example Usage in `calculate_root` Function:
    ///
    /// ```rust
    /// pub fn calculate_root(ctx: Context<CalculateRoot>, batch: u64) -> Result<()> {
    ///     let config = &mut ctx.accounts.config;
    ///     // ... perform operations that modify `config` ...
    /// }
    /// ```
    ///
    #[account(
        seeds = [Config::SEED_PREFIX],
        bump,
        mut
    )]
    pub config: Account<'info, Config>,

    /// The `clock` Sysvar account provides access to the current cluster time, slot, epoch, etc.
    ///
    /// - **Purpose**: Useful for implementing time-based logic within the instruction, such as enforcing timeouts,
    ///   scheduling, or validating the timing of certain operations.
    ///
    /// - **Read-Only**: The `clock` account is read-only and cannot be modified by the program. It simply provides
    ///   information about the current state of the Solana cluster's timing parameters.
    ///
    /// ## Example Usage in `calculate_root` Function:
    ///
    /// ```rust
    /// let current_epoch = ctx.accounts.clock.epoch;
    /// ```
    ///
    pub clock: Sysvar<'info, Clock>,
}
