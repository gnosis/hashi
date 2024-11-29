use anchor_lang::{prelude::Pubkey, AnchorDeserialize, AnchorSerialize};
use std::io;
use wormhole_io::Readable;

const PAYLOAD_ID_ALIVE: u8 = 0;
const PAYLOAD_ID_HELLO: u8 = 1;

pub const HELLO_MESSAGE_MAX_LENGTH: usize = 512;

#[derive(Clone)]
/// Expected message types for this program. Only valid payloads are:
/// * `Alive`: Payload ID == 0. Emitted when [`initialize`](crate::initialize)
///  is called).
/// * `Hello`: Payload ID == 1. Emitted when
/// [`send_message`](crate::send_message) is called).
///
/// Payload IDs are encoded as u8.
pub enum HelloWorldMessage {
    Alive { program_id: Pubkey },
    Hello { message: Vec<u8> },
}

impl AnchorSerialize for HelloWorldMessage {
    fn serialize<W: io::Write>(&self, writer: &mut W) -> io::Result<()> {
        match self {
            HelloWorldMessage::Alive { program_id } => {
                PAYLOAD_ID_ALIVE.serialize(writer)?;
                program_id.serialize(writer)
            }
            HelloWorldMessage::Hello { message } => {
                if message.len() > HELLO_MESSAGE_MAX_LENGTH {
                    Err(io::Error::new(
                        io::ErrorKind::InvalidInput,
                        format!("message exceeds {HELLO_MESSAGE_MAX_LENGTH} bytes"),
                    ))
                } else {
                    PAYLOAD_ID_HELLO.serialize(writer)?;
                    (message.len() as u16).to_be_bytes().serialize(writer)?;
                    for item in message {
                        item.serialize(writer)?;
                    }
                    Ok(())
                }
            }
        }
    }
}

impl AnchorDeserialize for HelloWorldMessage {
    fn deserialize_reader<R: io::Read>(reader: &mut R) -> io::Result<Self> {
        match u8::read(reader)? {
            PAYLOAD_ID_ALIVE => Ok(HelloWorldMessage::Alive {
                program_id: Pubkey::try_from(<[u8; 32]>::read(reader)?).unwrap(),
            }),
            PAYLOAD_ID_HELLO => {
                let length = u16::read(reader)? as usize;
                if length > HELLO_MESSAGE_MAX_LENGTH {
                    Err(io::Error::new(
                        io::ErrorKind::InvalidInput,
                        format!("message exceeds {HELLO_MESSAGE_MAX_LENGTH} bytes"),
                    ))
                } else {
                    let mut buf = vec![0; length];
                    reader.read_exact(&mut buf)?;
                    Ok(HelloWorldMessage::Hello { message: buf })
                }
            }
            _ => Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "invalid payload ID",
            )),
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use anchor_lang::prelude::Result;
    use std::{mem::size_of, str, string::String};

    #[test]
    fn test_message_alive() -> Result<()> {
        let my_program_id = Pubkey::new_unique();
        let msg = HelloWorldMessage::Alive {
            program_id: my_program_id,
        };

        // Serialize program ID above.
        let mut encoded = Vec::new();
        msg.serialize(&mut encoded)?;

        assert_eq!(encoded.len(), size_of::<u8>() + size_of::<Pubkey>());

        // Verify Payload ID.
        assert_eq!(encoded[0], PAYLOAD_ID_ALIVE);

        // Verify Program ID.
        let mut program_id_bytes = [0u8; 32];
        program_id_bytes.copy_from_slice(&encoded[1..33]);
        assert_eq!(program_id_bytes, my_program_id.to_bytes());

        // Now deserialize the encoded message.
        match HelloWorldMessage::deserialize(&mut encoded.as_slice())? {
            HelloWorldMessage::Alive { program_id } => {
                assert_eq!(program_id, my_program_id)
            }
            _ => assert!(false, "incorrect deserialization"),
        }

        Ok(())
    }

    #[test]
    fn test_message_hello() -> Result<()> {
        let raw_message = String::from("All your base are belong to us");
        let msg = HelloWorldMessage::Hello {
            message: raw_message.as_bytes().to_vec(),
        };

        // Serialize message above.
        let mut encoded = Vec::new();
        msg.serialize(&mut encoded)?;

        assert_eq!(
            encoded.len(),
            size_of::<u8>() + size_of::<u16>() + raw_message.len()
        );

        // Verify Payload ID.
        assert_eq!(encoded[0], PAYLOAD_ID_HELLO);

        // Verify message length.
        let mut message_len_bytes = [0u8; 2];
        message_len_bytes.copy_from_slice(&encoded[1..3]);
        assert_eq!(
            u16::from_be_bytes(message_len_bytes) as usize,
            raw_message.len()
        );

        // Verify message.
        let from_utf8_result = str::from_utf8(&encoded[3..]);
        assert!(from_utf8_result.is_ok(), "from_utf8 resulted in an error");
        assert_eq!(from_utf8_result.unwrap(), raw_message);

        // Now deserialize the encoded message.
        match HelloWorldMessage::deserialize(&mut encoded.as_slice())? {
            HelloWorldMessage::Hello { message } => {
                assert_eq!(message, raw_message.as_bytes())
            }
            _ => assert!(false, "incorrect deserialization"),
        }

        Ok(())
    }

    #[test]
    fn test_message_hello_too_large() -> Result<()> {
        let n: usize = 513;
        let raw_message = {
            let mut out = Vec::with_capacity(n);
            for _ in 0..n {
                out.push(33u8)
            }
            String::from_utf8(out).unwrap()
        };
        let msg = HelloWorldMessage::Hello {
            message: raw_message.as_bytes().to_vec(),
        };

        // Attempt to serialize message above.
        let mut encoded = Vec::new();
        match msg.serialize(&mut encoded) {
            Err(e) => assert_eq!(e.kind(), io::ErrorKind::InvalidInput),
            _ => assert!(false, "not supposed to serialize"),
        };

        // Serialize manually and then attempt to deserialize.
        encoded.push(PAYLOAD_ID_HELLO);
        encoded.extend_from_slice(&(raw_message.len() as u16).to_be_bytes());
        encoded.extend_from_slice(raw_message.as_bytes());

        assert_eq!(
            encoded.len(),
            size_of::<u8>() + size_of::<u16>() + raw_message.len()
        );

        // Verify Payload ID.
        assert_eq!(encoded[0], PAYLOAD_ID_HELLO);

        // Verify message length.
        let mut message_len_bytes = [0u8; 2];
        message_len_bytes.copy_from_slice(&encoded[1..3]);
        assert_eq!(
            u16::from_be_bytes(message_len_bytes) as usize,
            raw_message.len()
        );

        match HelloWorldMessage::deserialize(&mut encoded.as_slice()) {
            Err(e) => assert_eq!(e.kind(), io::ErrorKind::InvalidInput),
            _ => assert!(false, "not supposed to deserialize"),
        };

        Ok(())
    }
}
