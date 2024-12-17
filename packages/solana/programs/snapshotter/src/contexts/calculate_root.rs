use crate::*;

#[derive(Accounts)]
pub struct CalculateRoot<'info> {
    // The `config` account will be accessed and potentially modified by this instruction.
    // The `#[account(...)]` attribute macro applies constraints to this account:
    //   - `seeds = [Config::SEED_PREFIX]`: The account is derived from a program-derived address (PDA)
    //     using `Config::SEED_PREFIX` as the seed. This ensures that the correct PDA is referenced.
    //   - `bump`: Used in combination with the seeds to find the PDA. The `bump` ensures a valid PDA
    //     that is not already taken by another account.
    //   - `mut`: The `mut` keyword indicates that this account will be mutated (written to)
    //     during the instruction execution.
    #[account(
        seeds = [Config::SEED_PREFIX],
        bump,
        mut
    )]
    pub config: Account<'info, Config>,

    // The `clock` field references the Sysvar `Clock` account, which provides the current
    // cluster time, slot, epoch, etc. It is read-only and used for time-based logic within
    // the instruction if necessary.
    pub clock: Sysvar<'info, Clock>,
}
