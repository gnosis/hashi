use anchor_lang::prelude::*;

pub mod contexts;
pub mod error;
pub mod state;

pub use contexts::*;
pub use error::ErrorCode;
pub use state::*;

declare_id!("AeUyN4y9cvEzCDTVUy3ZPhrYw7i44kNBsqMeGysZfWid");

#[program]
pub mod wormhole_reporter {
    use super::*;
    use anchor_lang::solana_program;
    use message::Message;
    use slots::get_slot;
    use wormhole_anchor_sdk::wormhole;

    /// This instruction initializes the program config, which is meant
    /// to store data useful for other instructions. The config specifies
    /// an owner (e.g. multisig) and should be read-only for every instruction.
    ///
    /// # Arguments
    ///
    /// * `ctx` - `Initialize` contexts
    pub fn initialize(ctx: Context<Initialize>, slot_number: u64) -> Result<()> {
        let config = &mut ctx.accounts.config;

        // Set the owner of the config (effectively the owner of the program).
        config.owner = ctx.accounts.owner.key();

        // Set Wormhole related addresses.
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
        //
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
            let wormhole_emitter = &ctx.accounts.wormhole_emitter;
            let config = &ctx.accounts.config;

            let slot_hash = get_slot(&ctx.accounts.slot_hashes, slot_number)?;
            let message = Message::from((slot_number, slot_hash));
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

    /// Dispatches a Wormhole message for a specific slot.
    ///
    /// This function handles the necessary steps to post a message to the Wormhole bridge,
    /// including paying the required fee (if any), preparing the message payload, and invoking
    /// the `wormhole::post_message` CPI. It uses Program Derived Addresses (PDAs) to manage
    /// the Wormhole emitter and message accounts securely and reliably.
    ///
    /// # Arguments
    ///
    /// - `ctx`: A `Context` object containing all necessary accounts and data required for the dispatch process.
    /// - `slot_number`: The slot number for which the message is being dispatched. This is used to
    ///    retrieve the slot hash and include it in the payload.
    ///
    /// # Notes
    ///
    /// - The function uses a PDA to manage the Wormhole message account, allowing the program
    ///   to retain access to and deserialize the message data as needed.
    /// - The Wormhole emitter and sequence accounts are derived and managed by this program.
    /// - The finality of the message is determined by the configuration stored in the `config` account.
    ///
    /// # Returns
    ///
    /// This function returns `Ok(())` on success or a relevant error if the process fails.
    pub fn dispatch_slot(ctx: Context<DispatchSlot>, slot_number: u64) -> Result<()> {
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

        let slot_hash = get_slot(&ctx.accounts.slot_hashes, slot_number)?;
        let message = Message::from((slot_number, slot_hash));
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