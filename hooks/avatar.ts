import { rpc } from '@/lib/rpc'
import { VOICEVOX_SPEAKERS } from '@/lib/tts/voicevox'
import { create } from 'zustand'

export type Avatar = 'Tsumugi' 
export type TravelStyle = 'beginner' | 'advanced' | 'fullstack' | 'specialist'
export type TtsEngine = 'auto' | 'elevenlabs' | 'gemini' | 'voicevox'
export type Location = 'default' | 'office' | 'server-room' | 'coworking' | 'home'

export interface ConversationExchange {
  user: string
  assistant: string
  timestamp?: string
}

// Tag interface for filtering
export interface FilterTag {
  id: number
  name: string
  slug: string
}

export interface TravelRecommendation {
  title: string
  description: string
  location?: string
  duration?: string
  details?: string[]
  category?: string
  rating?: number
  tips?: string[]
  tags?: FilterTag[]
  logId?: string
  websiteLink?: string | null
}

export interface Viseme {
  time: number
  type: string
  value?: string
}

export interface Message {
  id: number
  question: string
  answer?: TravelRecommendation
  travelStyle?: TravelStyle
  audioPlayer?: HTMLAudioElement | null
  visemes?: Viseme[]
  audioBuffer?: ArrayBuffer
}

export interface AvatarState {
  // State
  messages: Message[]
  conversationHistory: ConversationExchange[]
  currentMessage: Message | null
  avatar: Avatar
  location: Location
  loading: boolean
  loadingTTS: boolean
  recording: boolean
  isSpeaking: boolean
  showDetails: boolean
  travelStyle: TravelStyle
  ttsEngine: TtsEngine
  ttsSpeakerId: number | undefined
  mediaRecorder?: MediaRecorder | null
  audioStream?: MediaStream | null

  // Actions
  setAvatar: (avatar: Avatar) => void
  setLocation: (location: Location) => void
  setShowDetails: (showDetails: boolean) => void
  setTravelStyle: (travelStyle: TravelStyle) => void
  setTtsEngine: (engine: TtsEngine) => void
  setTtsSpeakerId: (id: number | undefined) => void
  addToHistory: (userMessage: string, assistantResponse: string) => void
  clearHistory: () => void
  clearMessages: () => void
  clearAll: () => void
  startVoiceInput: () => Promise<void>
  stopVoiceInput: () => void
  askAI: (question: string) => Promise<void>
  playMessage: (message: Message) => Promise<void>
  stopMessage: (message: Message) => void
}

export const avatars: Avatar[] = ['Tsumugi']

export const useAvatar = create<AvatarState>((set, get) => ({
  messages: [],
  conversationHistory: [],
  currentMessage: null,
  avatar: avatars[0],
  isSpeaking: false,

  setAvatar: (avatar: Avatar) => {
    set(() => ({
      avatar,
      messages: get().messages.map((message) => {
        message.audioPlayer = null
        return message
      }),
    }))
  },
  location: 'default',
  setLocation: (location: Location) => {
    set(() => ({
      location,
    }))
  },
  loading: false,
  loadingTTS: false,
  recording: false,
  showDetails: true,
  setShowDetails: (showDetails: boolean) => {
    set(() => ({
      showDetails,
    }))
  },

  ttsEngine: 'voicevox' as TtsEngine,
  ttsSpeakerId: VOICEVOX_SPEAKERS.KASUKABE_TSUMUGI.NORMAL,
  setTtsEngine: (engine: TtsEngine) => {
    set(() => ({ ttsEngine: engine }))
  },
  setTtsSpeakerId: (id: number | undefined) => {
    set(() => ({ ttsSpeakerId: id }))
  },

  travelStyle: 'specialist',
  setTravelStyle: (travelStyle: TravelStyle) => {
    set(() => ({
      travelStyle,
    }))
  },

  addToHistory: (userMessage: string, assistantResponse: string) => {
    set((state) => {
      const newExchange: ConversationExchange = {
        user: userMessage,
        assistant: assistantResponse,
        timestamp: new Date().toISOString(),
      }

      const updatedHistory = [...state.conversationHistory, newExchange].slice(-5)

      return {
        conversationHistory: updatedHistory,
      }
    })
  },

  clearHistory: () => {
    set(() => ({
      conversationHistory: [],
    }))
  },

  clearMessages: () => {
    set(() => ({
      messages: [],
      currentMessage: null,
    }))
  },

  clearAll: () => {
    set(() => ({
      conversationHistory: [],
      messages: [],
      currentMessage: null,
    }))
  },

  startVoiceInput: async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(
        "Your browser doesn't support speech recognition. Try using Chrome. / ブラウザが音声認識に対応していません。Chromeをお試しください。",
      )
      return
    }

    set({ recording: true })

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []

      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data)
      })

      mediaRecorder.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })

        const formData = new FormData()
        formData.append('audio', audioBlob)

        try {
          set({ loading: true })
          const response = await fetch('/api/root/home/stt', {
            method: 'POST',
            body: formData,
          })

          const data: { text?: string } = await response.json()

          if (data.text) {
            get().askAI(data.text)
            // Don't set loading: false here, askAI will manage it
            set({ recording: false })
          } else {
            // No text received, stop loading
            set({ loading: false, recording: false })
          }
        } catch (error) {
          console.error('Error processing voice input:', error)
          alert(
            'Error processing your voice input. Please try again. / 音声入力の処理中にエラーが発生しました。もう一度お試しください。',
          )
          set({ loading: false, recording: false })
        }
      })

      mediaRecorder.start()

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          stream.getTracks().forEach((track) => track.stop())
        }
      }, 10000)

      set({ mediaRecorder, audioStream: stream })
    } catch (error) {
      console.error('Error starting voice recording:', error)
      alert(
        'Error accessing your microphone. Please check permissions. / マイクへのアクセスでエラーが発生しました。権限を確認してください。',
      )
      set({ recording: false })
    }
  },

  stopVoiceInput: () => {
    const { mediaRecorder, audioStream } = get()
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      audioStream?.getTracks().forEach((track) => track.stop())
    }
    set({ mediaRecorder: null, audioStream: null })
  },

  askAI: async (question: string) => {
    if (!question) {
      return
    }

    const currentHistory = get().conversationHistory

    const message: Message = {
      question,
      id: get().messages.length,
    }

    set(() => ({
      loading: true,
    }))

    // Create AbortController with 60s timeout for frontend protection
    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error('⏰ Frontend request timeout after 60 seconds')
      abortController.abort()
    }, 60000)

    try {
      const requestBody = {
        question,
        history: currentHistory,
        chatSessionId: '',
      }

      const res = await fetch(rpc.api.root.home.conversation.$url(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      })

      // Clear timeout on successful response
      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`)
      }

      const data = (await res.json()) as {
        response: string
        title?: string
        description?: string
        tags?: FilterTag[]
        logId?: string
        websiteLink?: string | null
        relatedQAs?: Array<{
          id: string
          question: string
          answer: string
          similarity: number
          category: string | null
          websiteLink?: string | null
        }>
      }

      console.log('AI response received:', {
        response: data.response,
        relatedQAsCount: data.relatedQAs?.length || 0,
        logId: data.logId,
        websiteLink: data.websiteLink,
      })

      let travelRecommendation: TravelRecommendation

      if (data.response) {
        travelRecommendation = {
          title: data.title || 'Answer',
          description: data.response,
          category: 'engineering',
          logId: data.logId,
          websiteLink: data.websiteLink,
        }
      } else if (data.title || data.description) {
        travelRecommendation = {
          ...(data as TravelRecommendation),
          logId: data.logId,
          websiteLink: data.websiteLink,
        }
      } else {
        const fallbackText = "I'm sorry, I couldn't generate a response."

        travelRecommendation = {
          title: 'Error',
          description: fallbackText,
          category: 'error',
        }
      }

      message.answer = travelRecommendation
      message.travelStyle = get().travelStyle

      set(() => ({
        currentMessage: message,
      }))

      set((state) => ({
        messages: [...state.messages, message],
        loading: false,
        isSpeaking: true,
      }))

      if (data.response) {
        get().addToHistory(question, data.response)
      }

      console.log('Message added to state:', {
        id: message.id,
        historyLength: get().conversationHistory.length,
        tagsCount: data.tags?.length || 0,
        logId: data.logId,
      })

      get().playMessage(message)
    } catch (error) {
      console.error('Error getting AI response:', error)

      // Always clear timeout on error
      clearTimeout(timeoutId)

      // Check if error is due to timeout/abort
      const isTimeout = error instanceof Error && error.name === 'AbortError'

      const fallbackText = isTimeout
        ? "I'm sorry, the request took too long. Please try asking your question again."
        : "I'm sorry, I'm experiencing some technical difficulties. Please try asking your question again."

      message.answer = {
        title: isTimeout ? 'Request Timeout' : 'Technical Error',
        description: fallbackText,
        category: 'error',
      }

      set((state) => ({
        messages: [...state.messages, message],
        loading: false,
        currentMessage: null,
      }))
    }
  },

  playMessage: async (message: Message) => {
    set(() => ({
      currentMessage: message,
      isSpeaking: true,
    }))

    if (!message.audioPlayer && message.answer) {
      set(() => ({
        loadingTTS: true,
      }))

      try {
        let ttsText = 'Here is my response.'

        if (message.answer.description) {
          ttsText = message.answer.description
        }

        console.log('TTS Text being sent:', ttsText)

        const ttsQuery: Record<string, string> = {
          avatar: get().avatar,
          text: ttsText,
          engine: get().ttsEngine,
        }
        const currentSpeakerId = get().ttsSpeakerId
        if (currentSpeakerId !== undefined) {
          ttsQuery.speakerId = String(currentSpeakerId)
        }

        const audioRes = await fetch(
          rpc.api.root.home.tts.$url({
            query: ttsQuery as any,
          }),
        )

        if (audioRes.ok) {
          const contentType = audioRes.headers.get('content-type')

          if (contentType?.includes('audio/')) {
            const audioBlob = await audioRes.blob()
            const visemesHeader = audioRes.headers.get('visemes')
            const visemes: Viseme[] = visemesHeader ? JSON.parse(visemesHeader) : []

            const audioBuffer = await audioBlob.arrayBuffer()
            const audioUrl = URL.createObjectURL(audioBlob)
            const audioPlayer = new Audio(audioUrl)

            audioPlayer.crossOrigin = 'anonymous'

            message.visemes = visemes
            message.audioPlayer = audioPlayer
            message.audioBuffer = audioBuffer

            audioPlayer.onplay = () => {
              console.log('🎵 Audio started playing')
              set(() => ({ isSpeaking: true }))
            }

            audioPlayer.onended = () => {
              console.log('🏁 Audio playback ended')
              set(() => ({
                currentMessage: null,
                isSpeaking: false,
              }))
            }

            audioPlayer.onerror = (error) => {
              console.error('❌ Audio playback error:', error)
              set(() => ({ isSpeaking: false }))
            }
          } else {
            console.log('📢 Using Web Speech API fallback (limited lip sync)')
            const jsonResponse = (await audioRes.json()) as {
              useClientTTS: boolean
              text?: string
            }

            if (jsonResponse.useClientTTS && 'speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(jsonResponse.text || ttsText)
              utterance.rate = 0.9
              utterance.pitch = 1.1

              const pseudoAudioPlayer = {
                currentTime: 0,
                paused: true,
                ended: false,
                play: () => {
                  speechSynthesis.speak(utterance)
                  pseudoAudioPlayer.paused = false
                  if (pseudoAudioPlayer.onplay) pseudoAudioPlayer.onplay()
                },
                pause: () => {
                  speechSynthesis.cancel()
                  pseudoAudioPlayer.paused = true
                  if (pseudoAudioPlayer.onpause) pseudoAudioPlayer.onpause()
                },
                addEventListener: () => {},
                removeEventListener: () => {},
                onplay: null as (() => void) | null,
                onpause: null as (() => void) | null,
                onended: null as (() => void) | null,
              }

              utterance.onend = () => {
                pseudoAudioPlayer.ended = true
                pseudoAudioPlayer.paused = true
                set(() => ({ isSpeaking: false }))
                if (pseudoAudioPlayer.onended) {
                  pseudoAudioPlayer.onended()
                }
              }

              message.audioPlayer = pseudoAudioPlayer as any
              message.visemes = []
              message.audioBuffer = undefined

              console.log('⚠️ Web Speech API: Lip sync will use fallback procedural animation')
            }
          }
        } else {
          console.log('❌ TTS request failed')
          message.audioPlayer = null
          message.visemes = []
          message.audioBuffer = undefined
          set(() => ({ isSpeaking: false }))
        }
      } catch (error) {
        console.error('💥 Error in TTS generation:', error)
        message.audioPlayer = null
        message.visemes = []
        message.audioBuffer = undefined
        set(() => ({ isSpeaking: false }))
      }

      set(() => ({
        loadingTTS: false,
        messages: get().messages.map((m) => {
          if (m.id === message.id) {
            return message
          }
          return m
        }),
      }))

      if (message.audioPlayer) {
        setTimeout(() => {
          if (message.audioPlayer) {
            message.audioPlayer.play()
          }
        }, 100)
      }
    }

    if (message.audioPlayer) {
      message.audioPlayer.currentTime = 0
      message.audioPlayer.play()
    }
  },

  stopMessage: (message: Message) => {
    if (message.audioPlayer) {
      message.audioPlayer.pause()
    }
    set(() => ({
      currentMessage: null,
      isSpeaking: false,
    }))
  },
}))
