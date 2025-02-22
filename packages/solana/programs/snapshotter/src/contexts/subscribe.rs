use crate::*;

#[derive(Accounts)]
pub struct Subscribe<'info> {
    /// The `config` account represents a piece of the program's state, previously initialized and stored on-chain.
    /// By including `seeds = [Config::SEED_PREFIX]` and `bump`, this indicates that the `config` account's
    /// public key is derived using a Program-Derived Address (PDA) approach. The `bump` is an auto-calculated
    /// value that ensures the generated PDA does not collide with an existing account.
    ///
    /// The `mut` keyword means that this account will be modified during the execution of the instruction.
    /// Common modifications may include incrementing counters, logging subscription events, or updating other
    /// relevant fields that track user subscriptions.
    #[account(
        seeds = [Config::SEED_PREFIX],
        bump,
        mut
    )]
    /// The `config` account that holds data relevant to the subscription logic.
    ///
    /// This account is expected to be pre-initialized and possibly managed by earlier steps in the program.
    ///
    /// ## Attributes
    ///
    /// - **`seeds = [Config::SEED_PREFIX]`**:
    ///     - **Purpose**: Defines the seed used to derive the PDA for the `config` account.
    ///     - **Function**: Ensures that the account address is uniquely and deterministically derived based on the provided seed.
    ///     - **Security**: Prevents unauthorized accounts from masquerading as the `config` account by enforcing a specific derivation path.
    ///
    /// - **`bump`**:
    ///     - **Purpose**: A nonce used alongside the seeds to find a valid PDA that does not collide with existing accounts.
    ///     - **Function**: Anchor automatically calculates and provides the bump value required for PDA derivation.
    ///
    /// - **`mut`**:
    ///     - **Purpose**: Marks the `config` account as mutable, allowing its data to be modified during instruction execution.
    ///     - **Function**: Enables the program to update fields within the `Config` account, such as adding a new subscription.
    pub config: Account<'info, Config>,
}
