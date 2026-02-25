import { readEnvFile } from './env.js';
import { logger } from './logger.js';

/**
 * Transcribe an audio buffer to text using OpenAI Whisper.
 * Returns null on failure (missing key, API error, etc).
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
): Promise<string | null> {
  const env = readEnvFile(['OPENAI_API_KEY']);
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.warn('OPENAI_API_KEY not set — voice transcription unavailable');
    return null;
  }

  try {
    const openaiModule = await import('openai');
    const OpenAI = openaiModule.default;
    const toFile = openaiModule.toFile;

    const openai = new OpenAI({ apiKey });
    const file = await toFile(audioBuffer, 'voice.ogg', {
      type: 'audio/ogg',
    });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
    });

    const text = (transcription as unknown as string).trim();
    return text || null;
  } catch (err) {
    logger.error({ err }, 'OpenAI transcription failed');
    return null;
  }
}

/**
 * Synthesize text to speech using OpenAI TTS.
 * Returns an opus-encoded audio buffer, or null on failure.
 */
export async function synthesizeSpeech(
  text: string,
): Promise<Buffer | null> {
  const env = readEnvFile(['OPENAI_API_KEY']);
  const apiKey = env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.warn('OPENAI_API_KEY not set — TTS unavailable');
    return null;
  }

  try {
    const openaiModule = await import('openai');
    const OpenAI = openaiModule.default;
    const openai = new OpenAI({ apiKey });

    // OpenAI TTS has a 4096 character limit
    const truncated = text.slice(0, 4096);

    const response = await openai.audio.speech.create({
      model: 'gpt-4o-mini-tts',
      voice: 'onyx',
      input: truncated,
      instructions: 'Speak in European Portuguese (Portugal accent). Natural, conversational tone.',
      response_format: 'opus',
    });

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    logger.error({ err }, 'OpenAI TTS failed');
    return null;
  }
}
