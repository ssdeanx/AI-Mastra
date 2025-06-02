// import { CompositeVoice } from "@mastra/core/voice"; // Unused import
// import { playAudio, getMicrophoneStream } from "@mastra/node-audio"; // TODO: [2024-07-27T10:00:00Z] - Resolve module not found error for @mastra/node-audio or replace with alternative audio handling.
import { GoogleVoice } from "@mastra/voice-google";
// import { createReadStream } from 'fs'; // Unused import

// Generated on 2024-07-27T10:00:00Z
/**
 * Configuration for Google Voice.
 * @remarks
 * Ensure that the GOOGLE_API_KEY environment variable is set.
 */
const voice: GoogleVoice = new GoogleVoice({
  speechModel: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
  listeningModel: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
  // speaker: "en-US-Casual-K" // Optional: set a default speaker ID here
});

/**
 * Demonstrates voice interactions using GoogleVoice.
 * This function will showcase text-to-speech.
 * Speech-to-text is commented out due to unresolved audio input dependencies.
 */
async function demonstrateVoiceInteraction() {
  try {
    // TODO: [2024-07-27T10:00:00Z] - Implement or resolve getMicrophoneStream to enable speech-to-text.
    // const audioStream = getMicrophoneStream(); // Assume this function gets audio input
    // const transcript = await voice.listen(audioStream, {
    //   config: {
    //     encoding: 'LINEAR16', // Default, but can be specified
    //     sampleRateHertz: 16000, // Sample rate for STT
    //     languageCode: "en-US",   // Language code for STT
    //   }
    // });
    // console.log("Transcribed text:", transcript);

    const textToSpeak = "Hello, this is a test of the text-to-speech functionality.";    // Convert text to speech
    const responseAudio = await voice.speak(textToSpeak, {
      languageCode: "en-US", // Language code for TTS
 //     speaker: {
 //       name: "en-US-Wavenet-D", // Can also specify voice name here
        languageCode: "en-US", // Must match the top-level languageCode or be compatible
 //       ssmlGender: "FEMALE",   // Voice gender
      },
 //     audioConfig: {
 //       audioEncoding: "LINEAR16", // Default, but can be specified
 //       speakingRate: 1.0,        // Speaking rate (0.25 to 4.0)
        // pitch: 0,              // Pitch adjustment (-20.0 to 20.0)
//      },
//    });

//    console.log("Generated speech audio stream. Ready to play.");

    // TODO: [2024-07-27T10:00:00Z] - Implement or resolve playAudio to enable audio playback.
    // playAudio(responseAudio);
    // For demonstration purposes, we'll just log that it would play.
    // To actually play, you'd pipe responseAudio to an audio player or save to a file.
    // Example: responseAudio.pipe(fs.createWriteStream('output.wav'));

 // } catch (error) {
 //   console.error("Error during voice interaction:", error);
 // }
//}
//demonstrateVoiceInteraction();
//
