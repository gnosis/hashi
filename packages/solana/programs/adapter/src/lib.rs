use anchor_lang::prelude::*;

declare_id!("E31NDsJknUaJ1VKGBCePkcZysajUqqFw5pDFAz1fFAGu");

#[program]
pub mod adapter {
    use super::*;

    pub fn store_hash(
        ctx: Context<StoreHash>,
        adapter_id: [u8; 32],
        domain: [u8; 32],
        id: [u8; 32],
        hash: [u8; 32],
    ) -> Result<()> {
        let hash_account = &mut ctx.accounts.hash_account;

        hash_account.adapter_id = adapter_id;
        hash_account.domain = domain;
        hash_account.id = id;
        hash_account.hash = hash;

        emit!(HashStored {
            adapter_id,
            domain,
            id,
            hash
        });

        Ok(())
    }
}

#[account]
pub struct HashAccount {
    pub adapter_id: [u8; 32],
    pub domain: [u8; 32],
    pub id: [u8; 32],
    pub hash: [u8; 32],
}

impl HashAccount {
    pub const LEN: usize = 32 + 32 + 32 + 32;
}

#[derive(Accounts)]
#[instruction(adapter_id: [u8; 32], domain: [u8; 32], id: [u8; 32])]
pub struct StoreHash<'info> {
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + HashAccount::LEN,
        seeds = [
            "hash_account".as_bytes(),
            &adapter_id,
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
    pub adapter_id: [u8; 32],
    pub domain: [u8; 32],
    pub id: [u8; 32],
    pub hash: [u8; 32],
}
