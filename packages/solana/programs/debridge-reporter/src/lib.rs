use anchor_lang::prelude::*;

declare_id!("DkJFdedMeprFUzymuZpvXCTqcUt1zc8uz45UgajsKbWH");

pub mod contexts;
pub mod error;
pub mod state;

pub use contexts::*;
pub use error::ErrorCode;
pub use state::*;

#[program]
pub mod debridge_reporter {
    use super::*;
    use debridge_solana_sdk::sending;
    use message::Message;
    use snapshotter::state::Config as SnapshotterConfig;

    /// Initializes the `snapshotter_config` within the `Config` account.
    ///
    /// This function sets the `snapshotter_config` field in the `Config` account to point to the `Config` account's own public key.
    /// This establishes a direct reference, ensuring that the `snapshotter_config` is correctly linked.
    ///
    /// ## Arguments
    ///
    /// - `ctx`: The context containing the `Initialize` accounts.
    ///
    /// ## Returns
    ///
    /// - `Result<()>`: Returns `Ok(())` if successful, or an error otherwise.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;

        // Set the `snapshotter_config` field in the `Config` account to the public key of the `Config` account itself.
        // This creates a self-reference, establishing a direct link to the snapshotter's configuration.
        config.snapshotter_config = ctx.accounts.snapshotter_config.key();
        Ok(())
    }

    /// Dispatches a slot by sending a message via DeBridge to a target chain.
    ///
    /// This function performs the following steps:
    /// 1. Deserializes the `snapshotter_config` data to access the current configuration.
    /// 2. Checks if the current `root` is finalized. If not, it returns an error.
    /// 3. Creates a DeBridge `Message` containing the `nonce` and `root`.
    /// 4. Serializes the `Message` into a byte payload.
    /// 5. Invokes the DeBridge `send_message` function to dispatch the message to the target chain.
    ///
    /// ## Arguments
    ///
    /// - `ctx`: The context containing the `DispatchRoot` accounts.
    /// - `target_chain_id`: A 32-byte identifier representing the target blockchain where the message should be sent.
    /// - `receiver`: A vector of bytes representing the receiver's address on the target chain.
    ///
    /// ## Returns
    ///
    /// - `Result<()>`: Returns `Ok(())` if the message is successfully dispatched, or an error otherwise.
    pub fn dispatch_root(
        ctx: Context<DispatchRoot>,
        target_chain_id: [u8; 32],
        receiver: Vec<u8>,
    ) -> Result<()> {
        // Deserialize the snapshotter configuration data from the `snapshotter_config` account.
        // This allows access to fields like `nonce` and `root`.
        let mut data_slice: &[u8] = &ctx.accounts.snapshotter_config.data.borrow();
        let snapshotter_config: SnapshotterConfig =
            AccountDeserialize::try_deserialize(&mut data_slice)?;

        // Ensure that the `root` has been finalized before proceeding.
        // If the root is not finalized, return an error to prevent dispatching incomplete or unstable data.
        if !snapshotter_config.root_finalized {
            return Err(error!(ErrorCode::RootNotFinalized));
        }

        // Create a DeBridge `Message` from the snapshotter's `nonce` and `root`.
        // This message serves as a data payload to be sent to the target chain.
        let message = Message::from((snapshotter_config.nonce, snapshotter_config.root));

        // Serialize the `Message` into a byte vector (`payload`) for transmission.
        let mut payload: Vec<u8> = Vec::new();
        message.serialize(&mut payload)?;

        // Invoke the DeBridge `send_message` function to dispatch the serialized message.
        // Parameters:
        // - `payload`: The serialized message to be sent.
        // - `target_chain_id`: The identifier of the target blockchain.
        // - `receiver`: The address on the target chain that should receive the message.
        // - `0`: Execution fee. A value of `0` typically means that the fee is automatically handled or claimed.
        // - `vec![0u8; 32]`: Fallback address. This can be used in case the message fails to be processed on the target chain.
        // - `ctx.remaining_accounts`: Any additional accounts required for the DeBridge CPI (Cross-Program Invocation).
        sending::invoke_send_message(
            payload,
            target_chain_id,
            receiver,
            0,             // execution_fee = 0 means auto claim
            vec![0u8; 32], // fallback address
            ctx.remaining_accounts,
        )
        .map_err(ProgramError::from)?; // Convert any errors from the CPI into Anchor's error type.

        Ok(())
    }
}
