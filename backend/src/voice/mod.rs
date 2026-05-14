pub mod integration;
pub mod synthesis;

pub use integration::{SpeechToTextProvider, WhisperProvider, GoogleSpeechProvider};
pub use synthesis::{TextToSpeechProvider, PiperProvider, GoogleTextToSpeechProvider};
