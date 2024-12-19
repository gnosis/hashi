use anchor_lang::prelude::*;

pub mod contexts;
pub mod error;
pub mod state;

pub use contexts::*;
pub use error::ErrorCode;
pub use state::*;

declare_id!("48Vq4rpj7tiZKvpVkzmR5kHUTLy6KdL1c4zkFw17cNZw");

#[program]
pub mod wormhole_reporter {
    use super::*;
    use anchor_lang::solana_program;
    use message::Message;
    use snapshotter::state::Config as SnapshotterConfig;
    use wormhole_anchor_sdk::wormhole;

    /// Initializes the Wormhole Reporter program.
    ///
    /// This function sets up the initial configuration, initializes the Wormhole emitter,
    /// handles any necessary fee transfers, and posts an initial message to Wormhole to
    /// establish a SequenceTracker account.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context containing all the accounts required for initialization.
    ///
    /// # Returns
    ///
    /// * `Result<()>` - Returns `Ok(())` if successful, or an error otherwise.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;

        // Set the owner of the configuration to the provided owner account
        config.owner = ctx.accounts.owner.key();

        // Set the snapshotter configuration account
        config.snapshotter_config = ctx.accounts.snapshotter_config.key();

        {
            let wormhole = &mut config.wormhole;

            // wormhole::BridgeData (Wormhole's program data).
            wormhole.bridge = ctx.accounts.wormhole_bridge.key();

            // wormhole::FeeCollector (lamports collector for posting
            // messages).
            wormhole.fee_collector = ctx.accounts.wormhole_fee_collector.key();

            // wormhole::SequenceTracker (tracks # of messages posted by this
            // program).
            wormhole.sequence = ctx.accounts.wormhole_sequence.key();
        }

        // Set default values for posting Wormhole messages.
        // Zero means no batching.
        config.batch_id = 0;

        // Anchor IDL default coder cannot handle wormhole::Finality enum,
        // so this value is stored as u8.
        config.finality = wormhole::Finality::Confirmed as u8;

        // Initialize our Wormhole emitter account. It is not required by the
        // Wormhole program that there is an actual account associated with the
        // emitter PDA. The emitter PDA is just a mechanism to have the program
        // sign for the `wormhole::post_message` instruction.
        ctx.accounts.wormhole_emitter.bump = ctx.bumps.wormhole_emitter;

        {
            // If Wormhole requires a fee before posting a message, we need to
            // transfer lamports to the fee collector. Otherwise
            // `wormhole::post_message` will fail.
            let fee = ctx.accounts.wormhole_bridge.fee();
            if fee > 0 {
                solana_program::program::invoke(
                    &solana_program::system_instruction::transfer(
                        &ctx.accounts.owner.key(),
                        &ctx.accounts.wormhole_fee_collector.key(),
                        fee,
                    ),
                    &ctx.accounts.to_account_infos(),
                )?;
            }

            // Invoke `wormhole::post_message`. We are sending a Wormhole
            // message in the `initialize` instruction so the Wormhole program
            // can create a SequenceTracker account for our emitter. We will
            // deserialize this account for our `send_message` instruction so
            // we can find the next sequence number. More details about this in
            // `send_message`.
            //
            // `wormhole::post_message` requires two signers: one for the
            // emitter and another for the wormhole message data. Both of these
            // accounts are owned by this program.
            //
            // There are two ways to handle the wormhole message data account:
            //   1. Using an extra keypair. You may to generate a keypair
            //      outside of this instruction and pass that keypair as an
            //      additional signer for the transaction. An integrator might
            //      use an extra keypair if the message can be "thrown away"
            //      (not easily retrievable without going back to this
            //      transaction hash to retrieve the message's pubkey).
            //   2. Generate a PDA. If we want some way to deserialize the
            //      message data written by the Wormhole program, we can use an
            //      account with an address derived by this program so we can
            //      use the PDA to access and deserialize the message data.
            //
            // we use method #2.

            // Prepare to post an initial message to Wormhole during initialization
            // This allows Wormhole to create a SequenceTracker account for the emitter
            // which will be used to track message sequences in subsequent operations

            // References to the Wormhole emitter and the main config
            let wormhole_emitter = &ctx.accounts.wormhole_emitter;
            let config = &ctx.accounts.config;

            // Deserialize the snapshotter configuration data
            let mut data_slice: &[u8] = &ctx.accounts.snapshotter_config.data.borrow();
            let snapshotter_config: SnapshotterConfig =
                AccountDeserialize::try_deserialize(&mut data_slice)?;

            // Ensure that the root is finalized before proceeding
            if !snapshotter_config.root_finalized {
                return Err(error!(ErrorCode::RootNotFinalized));
            }

            // Create a Wormhole message from the snapshotter's nonce and root
            let message = Message::from((snapshotter_config.nonce, snapshotter_config.root));
            let mut payload: Vec<u8> = Vec::new();
            message.serialize(&mut payload)?;

            wormhole::post_message(
                CpiContext::new_with_signer(
                    ctx.accounts.wormhole_program.to_account_info(),
                    wormhole::PostMessage {
                        config: ctx.accounts.wormhole_bridge.to_account_info(),
                        message: ctx.accounts.wormhole_message.to_account_info(),
                        emitter: wormhole_emitter.to_account_info(),
                        sequence: ctx.accounts.wormhole_sequence.to_account_info(),
                        payer: ctx.accounts.owner.to_account_info(),
                        fee_collector: ctx.accounts.wormhole_fee_collector.to_account_info(),
                        clock: ctx.accounts.clock.to_account_info(),
                        rent: ctx.accounts.rent.to_account_info(),
                        system_program: ctx.accounts.system_program.to_account_info(),
                    },
                    &[
                        &[
                            SEED_PREFIX_SENT,
                            &wormhole::INITIAL_SEQUENCE.to_le_bytes()[..],
                            &[ctx.bumps.wormhole_message],
                        ],
                        &[wormhole::SEED_PREFIX_EMITTER, &[wormhole_emitter.bump]],
                    ],
                ),
                config.batch_id,
                payload,
                config.finality.try_into().unwrap(),
            )?;
        }

        Ok(())
    }

    /// Dispatches a root by posting a message to Wormhole.
    ///
    /// This function handles fee transfers if required and posts a new message to Wormhole
    /// containing the latest snapshotter root and nonce.
    ///
    /// # Arguments
    ///
    /// * `ctx` - The context containing all the accounts required for dispatching the root.
    ///
    /// # Returns
    ///
    /// * `Result<()>` - Returns `Ok(())` if successful, or an error otherwise.
    pub fn dispatch_root(ctx: Context<DispatchRoot>) -> Result<()> {
        // If Wormhole requires a fee before posting a message, we need to
        // transfer lamports to the fee collector. Otherwise
        // `wormhole::post_message` will fail.
        let fee = ctx.accounts.wormhole_bridge.fee();
        if fee > 0 {
            solana_program::program::invoke(
                &solana_program::system_instruction::transfer(
                    &ctx.accounts.payer.key(),
                    &ctx.accounts.wormhole_fee_collector.key(),
                    fee,
                ),
                &ctx.accounts.to_account_infos(),
            )?;
        }

        // Invoke `wormhole::post_message`.
        //
        // `wormhole::post_message` requires two signers: one for the emitter
        // and another for the wormhole message data. Both of these accounts
        // are owned by this program.
        //
        // There are two ways to handle the wormhole message data account:
        //   1. Using an extra keypair. You may to generate a keypair outside
        //      of this instruction and pass that keypair as an additional
        //      signer for the transaction. An integrator might use an extra
        //      keypair if the message can be "thrown away" (not easily
        //      retrievable without going back to this transaction hash to
        //      retrieve the message's pubkey).
        //   2. Generate a PDA. If we want some way to deserialize the message
        //      data written by the Wormhole program, we can use an account
        //      with an address derived by this program so we can use the PDA
        //      to access and deserialize the message data.
        //
        // we use method #2.
        let wormhole_emitter = &ctx.accounts.wormhole_emitter;
        let config = &ctx.accounts.config;

        // Deserialize the snapshotter configuration data
        let mut data_slice: &[u8] = &ctx.accounts.snapshotter_config.data.borrow();
        let snapshotter_config: SnapshotterConfig =
            AccountDeserialize::try_deserialize(&mut data_slice)?;

        // Ensure that the root is finalized before proceeding
        if !snapshotter_config.root_finalized {
            return Err(error!(ErrorCode::RootNotFinalized));
        }

        // Create a Wormhole message from the snapshotter's nonce and root
        let message = Message::from((snapshotter_config.nonce, snapshotter_config.root));
        let mut payload: Vec<u8> = Vec::new();
        message.serialize(&mut payload)?;

        wormhole::post_message(
            CpiContext::new_with_signer(
                ctx.accounts.wormhole_program.to_account_info(),
                wormhole::PostMessage {
                    config: ctx.accounts.wormhole_bridge.to_account_info(),
                    message: ctx.accounts.wormhole_message.to_account_info(),
                    emitter: wormhole_emitter.to_account_info(),
                    sequence: ctx.accounts.wormhole_sequence.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    fee_collector: ctx.accounts.wormhole_fee_collector.to_account_info(),
                    clock: ctx.accounts.clock.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[
                    &[
                        SEED_PREFIX_SENT,
                        &ctx.accounts.wormhole_sequence.next_value().to_le_bytes()[..],
                        &[ctx.bumps.wormhole_message],
                    ],
                    &[wormhole::SEED_PREFIX_EMITTER, &[wormhole_emitter.bump]],
                ],
            ),
            config.batch_id,
            payload,
            config.finality.try_into().unwrap(),
        )?;

        Ok(())
    }
}
