use crate::*;

#[derive(Accounts)]
pub struct Subscribe<'info> {
    // The `config` account represents a piece of the program's state, previously initialized and stored on-chain.
    // By including `seeds = [Config::SEED_PREFIX]` and `bump`, this indicates that the `config` account's
    // public key is derived using a Program-Derived Address (PDA) approach. The `bump` is an auto-calculated
    // value that ensures the generated PDA does not collide with an existing account.
    //
    // The `mut` keyword means that this account will be modified during the execution of the instruction.
    // Common modifications may include incrementing counters, logging subscription events, or updating other
    // relevant fields that track user subscriptions.
    #[account(
        seeds = [Config::SEED_PREFIX],
        bump,
        mut
    )]
    /// The `config` account that holds data relevant to the subscription logic. This
    /// account is expected to be pre-initialized and possibly managed by earlier steps in the program.
    pub config: Account<'info, Config>,
}
