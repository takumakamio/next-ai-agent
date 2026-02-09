export interface TTSResult {
  audioBuffer: Buffer | Uint8Array
  contentType: 'audio/mpeg' | 'audio/wav'
  provider: string
  filename: string
}
