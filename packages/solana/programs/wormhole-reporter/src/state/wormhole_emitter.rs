use anchor_lang::prelude::*;
use wormhole_anchor_sdk::wormhole;

#[account]
#[derive(Default)]
/// Wormhole emitter account.
pub struct WormholeEmitter {
    /// PDA bump.
    pub bump: u8,
}

impl WormholeEmitter {
    pub const MAXIMUM_SIZE: usize = 8 // discriminator
    + 1 // bump
    ;
    /// AKA `b"emitter` (see
    /// [`SEED_PREFIX_EMITTER`](wormhole::SEED_PREFIX_EMITTER)).
    pub const SEED_PREFIX: &'static [u8; 7] = wormhole::SEED_PREFIX_EMITTER;
}

#[cfg(test)]
mod test {
    use super::*;
    use std::mem::size_of;

    #[test]
    fn test_wormhole_emitter() -> Result<()> {
        assert_eq!(
            WormholeEmitter::MAXIMUM_SIZE,
            size_of::<u64>() + size_of::<u8>()
        );

        Ok(())
    }
}
