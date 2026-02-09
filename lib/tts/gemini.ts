import type { TTSResult } from './types'

export async function generateGeminiTTS(env: any, text: string, avatar: string): Promise<TTSResult> {
  if (!env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY === '') {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
  }

  const voiceMap: Record<string, string> = {
    Tsumugi: 'Sulafat',
  }

  const geminiVoice = voiceMap[avatar] || 'Kore'

  const { GoogleGenAI } = await import('@google/genai')
  const genai = new GoogleGenAI({
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  })

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: geminiVoice },
        },
      },
    },
  })

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data

  if (!audioData) {
    throw new Error('No audio data received from Gemini')
  }

  const pcmBuffer = Buffer.from(audioData, 'base64')
  const wavBuffer = createWavBuffer(pcmBuffer, 24000, 1, 16)

  return {
    audioBuffer: wavBuffer,
    contentType: 'audio/wav',
    provider: 'Gemini',
    filename: 'tts.wav',
  }
}

function createWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = channels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = pcmBuffer.length
  const fileSize = 36 + dataSize

  const buffer = Buffer.alloc(44 + dataSize)
  let offset = 0

  // RIFF chunk descriptor
  buffer.write('RIFF', offset)
  offset += 4
  buffer.writeUInt32LE(fileSize, offset)
  offset += 4
  buffer.write('WAVE', offset)
  offset += 4

  // fmt sub-chunk
  buffer.write('fmt ', offset)
  offset += 4
  buffer.writeUInt32LE(16, offset)
  offset += 4 // Sub-chunk size
  buffer.writeUInt16LE(1, offset)
  offset += 2 // Audio format (1 = PCM)
  buffer.writeUInt16LE(channels, offset)
  offset += 2 // Number of channels
  buffer.writeUInt32LE(sampleRate, offset)
  offset += 4 // Sample rate
  buffer.writeUInt32LE(byteRate, offset)
  offset += 4 // Byte rate
  buffer.writeUInt16LE(blockAlign, offset)
  offset += 2 // Block align
  buffer.writeUInt16LE(bitsPerSample, offset)
  offset += 2 // Bits per sample

  // data sub-chunk
  buffer.write('data', offset)
  offset += 4
  buffer.writeUInt32LE(dataSize, offset)
  offset += 4

  // Copy PCM data
  pcmBuffer.copy(buffer, offset)

  return buffer
}
