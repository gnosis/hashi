use anchor_lang::prelude::error_code;

#[error_code]
/// Errors relevant to this program's malfunction.
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

    #[msg("RootNotFinalized")]
    /// Snapshotter root not finalized
    RootNotFinalized,

    #[msg("InvalidSnapshotterConfig")]
    /// Invalid Snapshotter config
    InvalidSnapshotterConfig,
}
