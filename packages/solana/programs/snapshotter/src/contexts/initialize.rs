use crate::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    // The `owner` is a Signer account, indicating that whoever calls this instruction
    // must sign the transaction with their private key. This ensures that the initializer
    // has authority.
    // `#[account(mut)]` is used here because the `payer` field below uses this account's
    // lamports to fund the creation of the `config` account.
    #[account(mut)]
    /// The owner of the program. Must sign the transaction, and pays for the account rent.
    pub owner: Signer<'info>,

    // The `config` account will be created (initialized) by this instruction.
    // The `init` attribute indicates that this account should be created (allocated and assigned)
    // and initialized with the given seeds, bump, and space.
    //
    // The `payer = owner` parameter means the `owner` account pays for the rent and creation cost
    // of this account.
    //
    // `seeds = [Config::SEED_PREFIX]` sets the PDA (program-derived address) seed that
    // uniquely identifies the `config` account. The `bump` is used to find a valid PDA
    // that isn't already taken.
    //
    // `space = Config::MAXIMUM_SIZE` sets the account size so that the Solana runtime
    // allocates the right amount of space in the ledger for this account's data.
    #[account(
        init,
        payer = owner,
        seeds = [Config::SEED_PREFIX],
        bump,
        space = Config::MAXIMUM_SIZE,
    )]
    /// The `config` account that stores program data needed for other instructions.
    /// It is created on initialization, ensuring that all subsequent operations
    /// have a consistent place to store relevant configuration information.
    pub config: Account<'info, Config>,

    // The `system_program` is the program that is responsible for creating and
    // allocating accounts. It is necessary whenever new accounts need to be
    // created and funded.
    /// The standard system program, required here to create and fund the `config` account.
    pub system_program: Program<'info, System>,
}
