use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The majority threshold was not met.")]
    ThresholdNotMet,
    #[msg("Invalid threshold: greater than the number of accounts provided.")]
    InvalidThreshold,
    #[msg("No accounts were provided.")]
    NoAccountsProvided,
    #[msg("Invalid adapter id.")]
    InvalidAdapterId,
    #[msg("Invalid adapter ids length.")]
    InvalidAdapterIdsLength,
    #[msg("Invalid domain.")]
    InvalidId,
    #[msg("Invalid id.")]
    InvalidDomain,
}
