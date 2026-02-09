import type { TTSResult } from './types'

// VOICEVOX TTS Client
// VOICEVOX is an open-source Japanese text-to-speech engine that runs locally.
// Default engine URL: http://localhost:50021

export interface VoicevoxClientOptions {
  baseUrl?: string
  timeout?: number
}

export interface VoicevoxSynthesisOptions {
  speaker: number
  speedScale?: number
  pitchScale?: number
  intonationScale?: number
  volumeScale?: number
  outputSamplingRate?: number
}

export interface VoicevoxAudioQuery {
  accent_phrases: VoicevoxAccentPhrase[]
  speedScale: number
  pitchScale: number
  intonationScale: number
  volumeScale: number
  prePhonemeLength: number
  postPhonemeLength: number
  pauseLength: number | null
  pauseLengthScale: number
  outputSamplingRate: number
  outputStereo: boolean
  kana: string
}

export interface VoicevoxAccentPhrase {
  moras: VoicevoxMora[]
  accent: number
  pause_mora: VoicevoxMora | null
  is_interrogative: boolean
}

export interface VoicevoxMora {
  text: string
  consonant: string | null
  consonant_length: number | null
  vowel: string
  vowel_length: number
  pitch: number
}

export type VoicevoxSpeakerId = number

export const VOICEVOX_SPEAKERS = {
  SHIKOKU_METAN: {
    NORMAL: 2,
    AMAAMA: 0,
    TSUNTSUN: 6,
    SEXY: 4,
  },
  ZUNDAMON: {
    NORMAL: 3,
    AMAAMA: 1,
    TSUNTSUN: 7,
    SEXY: 5,
  },
  KASUKABE_TSUMUGI: {
    NORMAL: 8,
  },
  NAMINE_RITSU: {
    NORMAL: 9,
  },
  AMAHARE_HAU: {
    NORMAL: 10,
  },
  KURONO_TAKEHIRO: {
    NORMAL: 11,
  },
  SHIRAKAMI_KOTARO: {
    NORMAL: 12,
  },
  AOYAMA_RYUSEI: {
    NORMAL: 13,
  },
} as const

export const DEFAULT_VOICEVOX_SPEAKER = VOICEVOX_SPEAKERS.ZUNDAMON.NORMAL // ID: 3

export class VoicevoxClient {
  private baseUrl: string
  private timeout: number

  constructor(options: VoicevoxClientOptions = {}) {
    this.baseUrl = options.baseUrl || process.env.VOICEVOX_URL || 'http://localhost:50021'
    this.timeout = options.timeout || 30000
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/version`, {
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  async createAudioQuery(text: string, speaker: VoicevoxSpeakerId): Promise<VoicevoxAudioQuery> {
    const params = new URLSearchParams({ text, speaker: String(speaker) })
    const response = await fetch(`${this.baseUrl}/audio_query?${params}`, {
      method: 'POST',
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`VOICEVOX audio_query failed: ${response.status} - ${errorText}`)
    }

    return response.json() as Promise<VoicevoxAudioQuery>
  }

  async synthesizeFromQuery(query: VoicevoxAudioQuery, speaker: VoicevoxSpeakerId): Promise<ArrayBuffer> {
    const params = new URLSearchParams({ speaker: String(speaker) })
    const response = await fetch(`${this.baseUrl}/synthesis?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`VOICEVOX synthesis failed: ${response.status} - ${errorText}`)
    }

    return response.arrayBuffer()
  }

  async synthesize(
    text: string,
    options: Partial<VoicevoxSynthesisOptions> = {},
  ): Promise<{ wavBuffer: Buffer; durationSeconds: number }> {
    const speaker = options.speaker ?? DEFAULT_VOICEVOX_SPEAKER

    const query = await this.createAudioQuery(text, speaker)

    if (options.speedScale !== undefined) query.speedScale = options.speedScale
    if (options.pitchScale !== undefined) query.pitchScale = options.pitchScale
    if (options.intonationScale !== undefined) query.intonationScale = options.intonationScale
    if (options.volumeScale !== undefined) query.volumeScale = options.volumeScale
    if (options.outputSamplingRate !== undefined) query.outputSamplingRate = options.outputSamplingRate

    const audioBuffer = await this.synthesizeFromQuery(query, speaker)
    const wavBuffer = Buffer.from(audioBuffer)

    const sampleRate = query.outputSamplingRate
    // WAV header is 44 bytes, audio is 16-bit (2 bytes per sample)
    const pcmLength = wavBuffer.length - 44
    const durationSeconds = pcmLength / (sampleRate * 2)

    return { wavBuffer, durationSeconds }
  }
}

export const voicevoxClient = new VoicevoxClient()

export async function generateVoicevoxTTS(text: string, speakerId?: number): Promise<TTSResult> {
  const client = new VoicevoxClient()

  const { wavBuffer } = await client.synthesize(text, {
    speaker: speakerId,
  })

  return {
    audioBuffer: wavBuffer,
    contentType: 'audio/wav',
    provider: 'VOICEVOX',
    filename: 'tts.wav',
  }
}
