use anchor_lang::prelude::error_code;

#[error_code]
pub enum ErrorCode {
    #[msg("InvalidSnapshotterConfig")]
    /// Invalid Snapshotter config
    InvalidSnapshotterConfig,

    #[msg("RootNotFinalized")]
    /// Snapshotter root not finalized
    RootNotFinalized,
}
