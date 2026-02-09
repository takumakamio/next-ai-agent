import type { Locale } from 'next-intl'
import type { TTSResult } from './types'

export async function generateElevenLabsTTS(env: any, text: string, locale: Locale): Promise<TTSResult> {
  if (!env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY === '') {
    throw new Error('Missing ELEVENLABS_API_KEY')
  }

  const elevenLabsVoiceMap: Record<string, string> = {
    ja: 'PmgfHCGeS5b7sH90BOOJ',
    ko: 'xi3rF0t7dg7uN2M0WUhr',
    zh: 'ZFjfxJryh105iTLL4ktHB',
    en: 'QNYkS0l1ELiFod9u3b0X',
  }

  console.log('locale', locale)
  const voiceId = elevenLabsVoiceMap[locale] || elevenLabsVoiceMap['ja']

  console.log('voiceId', voiceId)

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_v3',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
        speed: 1.25,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
  }

  const audioBuffer = await response.arrayBuffer()
  const audioData = new Uint8Array(audioBuffer)

  return {
    audioBuffer: audioData,
    contentType: 'audio/mpeg',
    provider: 'ElevenLabs',
    filename: 'tts.mp3',
  }
}
