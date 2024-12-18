use anchor_lang::prelude::*;
use wormhole_anchor_sdk::wormhole;

#[account]
#[derive(Default)]
pub struct WormholeEmitter {
    /// PDA bump.
    pub bump: u8,
}

impl WormholeEmitter {
    /// The maximum size of the `WormholeEmitter` account in bytes.
    ///
    /// This constant ensures that the account has enough allocated space to store
    /// all its fields, including the discriminator used by Anchor.
    pub const MAXIMUM_SIZE: usize = 8 // Discriminator (Anchor)
        + 1 // bump
        ;

    /// The seed prefix used for deriving the PDA (Program Derived Address) of the `WormholeEmitter` account.
    ///
    /// Using a consistent seed prefix ensures that the `WormholeEmitter` account can be reliably
    /// derived and accessed across different instructions and transactions.
    pub const SEED_PREFIX: &'static [u8; 7] = wormhole::SEED_PREFIX_EMITTER;
}
