use crate::*;

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
