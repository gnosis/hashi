use anchor_lang::prelude::*;

declare_id!("77amskJVh59Y7uV5XCxU47rXuHLygXhY7F3PKa6NEUyV");

#[program]
pub mod adapter {
    use super::*;

    pub fn store_hash(
        ctx: Context<StoreHash>,
        domain: [u8; 32],
        id: [u8; 32],
        hash: [u8; 32],
    ) -> Result<()> {
        let hash_account = &mut ctx.accounts.hash_account;

        hash_account.domain = domain;
        hash_account.id = id;
        hash_account.hash = hash;

        emit!(HashStored { domain, id, hash });

        Ok(())
    }
}

#[account]
pub struct HashAccount {
    pub domain: [u8; 32],
    pub id: [u8; 32],
    pub hash: [u8; 32],
}

#[derive(Accounts)]
#[instruction(domain: [u8; 32], id: [u8; 32])]
pub struct StoreHash<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 32 + 32, // discriminator + domain + id + hash
        seeds = [
            b"hash_account".as_ref(),
            &domain,
            &id
        ],
        bump,
    )]
    pub hash_account: Account<'info, HashAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct HashStored {
    pub domain: [u8; 32],
    pub id: [u8; 32],
    pub hash: [u8; 32],
}
