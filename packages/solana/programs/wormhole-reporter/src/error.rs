use anchor_lang::prelude::error_code;

#[error_code]
pub enum ErrorCode {
    #[msg("InvalidWormholeConfig")]
    /// Specified Wormhole bridge data PDA is wrong.
    InvalidWormholeConfig,

    #[msg("InvalidWormholeFeeCollector")]
    /// Specified Wormhole fee collector PDA is wrong.
    InvalidWormholeFeeCollector,

    #[msg("InvalidWormholeSequence")]
    /// Specified emitter's sequence PDA is wrong.
    InvalidWormholeSequence,

    #[msg("InvalidSysvar")]
    /// Specified sysvar is wrong.
    InvalidSysvar,

    #[msg("InvalidSnapshotterConfig")]
    /// Invalid Snapshotter config
    InvalidSnapshotterConfig,

    #[msg("RootNotFinalized")]
    /// Snapshotter root not finalized
    RootNotFinalized,
}
