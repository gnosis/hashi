use anchor_lang::prelude::*;

use crate::state::Config;

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
    /// Whoever initializes the config will be the owner of the program. Signer
    /// for creating the [`Config`] account.
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
    #[account(
        init,
        payer = owner,
        seeds = [Config::SEED_PREFIX],
        bump,
        space = Config::MAXIMUM_SIZE,
    )]
    /// Config account, which saves program data useful for other instructions.
    ///
    /// It is created on initialization, ensuring that all subsequent operations
    /// have a consistent place to store relevant configuration information.
    pub config: Account<'info, Config>,

    /// The `snapshotter_config` account represents the snapshotter's configuration.
    ///
    /// - **UncheckedAccount**: The `snapshotter_config` is marked as `UncheckedAccount`, meaning that Anchor will
    ///   not perform any type or ownership checks on this account. It is the developer's responsibility to ensure
    ///   that this account is valid and correctly matches the expected configuration.
    ///
    /// - **Purpose**: Represents the snapshotter's configuration. Although marked as `UncheckedAccount`, it should be correctly associated with the `Config` account to maintain program integrity.
    /// CHECK: Snapshotter program
    pub snapshotter_config: UncheckedAccount<'info>,

    /// The `system_program` is the program responsible for creating and allocating accounts.
    ///
    /// It is necessary whenever new accounts need to be created and funded.
    ///
    /// ## Attributes
    ///
    /// - **Standard System Program**: Required here to create and fund the `config` account.
    pub system_program: Program<'info, System>,
}
