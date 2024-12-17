use anchor_lang::prelude::*;

#[error_code]
/// Errors relevant to this program's malfunction.
pub enum ErrorCode {
    #[msg("AccountAlreadySubscribed")]
    /// An account is already subscribed
    AccountAlreadySubscribed,

    #[msg("InvalidRemainingAccountsLength")]
    /// Invalid remaining accounts length
    InvalidRemainingAccountsLength,

    #[msg("InvalidSubscribedAccount")]
    /// Invalid subscribed account
    InvalidSubscribedAccount,

    #[msg("InvalidBatch")]
    /// Invalid batch
    InvalidBatch,
}
