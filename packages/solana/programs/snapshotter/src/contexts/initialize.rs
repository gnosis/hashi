use crate::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// The `owner` is a Signer account, indicating that whoever calls this instruction
    /// must sign the transaction with their private key. This ensures that the initializer
    /// has authority.
    ///
    /// `#[account(mut)]` is used here because the `owner` account's lamports are used
    /// to fund the creation of the `config` account.
    ///
    /// ## Attributes
    ///
    /// - **`mut`**: Marks the `owner` account as mutable, allowing its lamports to be debited.
    #[account(mut)]
    /// The owner of the program. Must sign the transaction and pays for the account rent.
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
    /// - **`space = Config::MAXIMUM_SIZE`**: Allocates the appropriate amount of space for the `config` account's data.
    ///
    /// ## Attributes
    ///
    /// - **`init`**: Indicates that this account should be initialized by the instruction.
    /// - **`payer = owner`**: Specifies that the `owner` account will pay for the account's rent and creation.
    /// - **`seeds = [Config::SEED_PREFIX]`**: Defines the seed used to derive the PDA for the `config` account.
    /// - **`bump`**: Provides the bump seed necessary for PDA derivation.
    /// - **`space = Config::MAXIMUM_SIZE`**: Allocates sufficient space for the `config` account's data.
    #[account(
        init,
        payer = owner,
        seeds = [Config::SEED_PREFIX],
        bump,
        space = Config::MAXIMUM_SIZE,
    )]
    /// The `config` account that stores program data needed for other instructions.
    ///
    /// It is created on initialization, ensuring that all subsequent operations
    /// have a consistent place to store relevant configuration information.
    pub config: Account<'info, Config>,

    /// The `system_program` is the program responsible for creating and allocating accounts.
    ///
    /// It is necessary whenever new accounts need to be created and funded.
    ///
    /// ## Attributes
    ///
    /// - **Standard System Program**: Required here to create and fund the `config` account.
    pub system_program: Program<'info, System>,
}
