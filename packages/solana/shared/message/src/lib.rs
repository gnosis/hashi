use alloy_primitives::U256;
use alloy_sol_types::{sol_data, SolType};
use anchor_lang::AnchorSerialize;
use std::convert::From;
use std::io;

/// A struct representing a message with associated IDs and hashes.
pub struct Message {
    /// A vector of 256-bit unsigned integers representing IDs.
    pub ids: Vec<U256>,
    /// A vector of 32-byte arrays representing hashes.
    pub hashes: Vec<[u8; 32]>,
}

/// Converts a tuple `(u64, [u8; 32])` into a `Message`.
impl From<(u64, [u8; 32])> for Message {
    /// Converts a `(u64, [u8; 32])` tuple into a `Message` by:
    /// - Converting the `u64` into a `U256`.
    /// - Adding the hash as a single entry in the `hashes` vector.
    ///
    /// # Arguments
    ///
    /// * `value` - A tuple containing:
    ///     - `u64`: The ID to be converted to a `U256`.
    ///     - `[u8; 32]`: The hash to be added to the `hashes` vector.
    ///
    /// # Returns
    ///
    /// A new `Message` instance with the given ID and hash.
    fn from(value: (u64, [u8; 32])) -> Self {
        let (id, hash) = value;
        Message {
            ids: vec![U256::from(id)],
            hashes: vec![hash],
        }
    }
}

/// Provides serialization support for the `Message` struct using Anchor's serialization trait.
impl AnchorSerialize for Message {
    /// Serializes the `Message` struct into a Solidity ABI-encoded format.
    ///
    /// The `ids` field is serialized as an array of 256-bit unsigned integers,
    /// and the `hashes` field is serialized as an array of 32-byte fixed-length arrays.
    ///
    /// # Arguments
    ///
    /// * `writer` - A mutable reference to an object implementing `io::Write` where
    ///   the serialized data will be written.
    ///
    /// # Returns
    ///
    /// * `Ok(())` if the serialization succeeds.
    fn serialize<W: io::Write>(&self, writer: &mut W) -> io::Result<()> {
        let encoded = <(
            sol_data::Array<sol_data::Uint<256>>,
            sol_data::Array<sol_data::FixedBytes<32>>,
        )>::abi_encode_params(&(self.ids.clone(), self.hashes.clone()));
        writer.write_all(&encoded)?;
        Ok(())
    }
}
