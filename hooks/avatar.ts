import { rpc } from '@/lib/rpc'
import { create } from 'zustand'

export type Avatar = 'Tsumugi'
export type ExpertiseLevel = 'beginner' | 'advanced' | 'fullstack' | 'specialist'
export type AiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro'

export const AI_MODEL_OPTIONS: { value: AiModel; label: string }[] = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
]

export interface ConversationExchange {
  user: string
  assistant: string
  timestamp?: string
}

export interface AIResponse {
  title: string
  description: string
  category?: string
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
  answer?: AIResponse
  expertiseLevel?: ExpertiseLevel
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
  loading: boolean
  loadingTTS: boolean
  recording: boolean
  isSpeaking: boolean
  expertiseLevel: ExpertiseLevel
  aiModel: AiModel
  mediaRecorder?: MediaRecorder | null
  audioStream?: MediaStream | null

  // Actions
  setAvatar: (avatar: Avatar) => void
  setExpertiseLevel: (expertiseLevel: ExpertiseLevel) => void
  setAiModel: (model: AiModel) => void
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
  loading: false,
  loadingTTS: false,
  recording: false,

  aiModel: 'gemini-2.5-flash' as AiModel,
  setAiModel: (model: AiModel) => {
    set(() => ({ aiModel: model }))
  },

  expertiseLevel: 'specialist',
  setExpertiseLevel: (expertiseLevel: ExpertiseLevel) => {
    set(() => ({
      expertiseLevel,
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
          const response = await fetch('/api/home/stt', {
            method: 'POST',
            body: formData,
          })

          const data: { text?: string } = await response.json()

          if (data.text) {
            get().askAI(data.text)
            set({ recording: false })
          } else {
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

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error('Frontend request timeout after 60 seconds')
      abortController.abort()
    }, 60000)

    try {
      const requestBody = {
        question,
        history: currentHistory,
        chatSessionId: '',
        aiModel: get().aiModel,
      }

      const res = await fetch(rpc.api.home.conversation.$url(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`)
      }

      const data = (await res.json()) as {
        response: string
        title?: string
        description?: string
        logId?: string
        websiteLink?: string | null
      }

      let aiResponse: AIResponse

      if (data.response) {
        aiResponse = {
          title: data.title || 'Answer',
          description: data.response,
          category: 'engineering',
          logId: data.logId,
          websiteLink: data.websiteLink,
        }
      } else if (data.title || data.description) {
        aiResponse = {
          title: data.title || '',
          description: data.description || '',
          logId: data.logId,
          websiteLink: data.websiteLink,
        }
      } else {
        aiResponse = {
          title: 'Error',
          description: "I'm sorry, I couldn't generate a response.",
          category: 'error',
        }
      }

      message.answer = aiResponse
      message.expertiseLevel = get().expertiseLevel

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

      get().playMessage(message)
    } catch (error) {
      console.error('Error getting AI response:', error)

      clearTimeout(timeoutId)

      const isTimeout = error instanceof Error && error.name === 'AbortError'

      message.answer = {
        title: isTimeout ? 'Request Timeout' : 'Technical Error',
        description: isTimeout
          ? "I'm sorry, the request took too long. Please try asking your question again."
          : "I'm sorry, I'm experiencing some technical difficulties. Please try asking your question again.",
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
        const ttsText = message.answer.description || 'Here is my response.'

        const ttsQuery: Record<string, string> = {
          avatar: get().avatar,
          text: ttsText,
        }

        const audioRes = await fetch(
          rpc.api.home.tts.$url({
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
              set(() => ({ isSpeaking: true }))
            }

            audioPlayer.onended = () => {
              set(() => ({
                currentMessage: null,
                isSpeaking: false,
              }))
            }

            audioPlayer.onerror = () => {
              set(() => ({ isSpeaking: false }))
            }
          } else {
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
            }
          }
        } else {
          message.audioPlayer = null
          message.visemes = []
          message.audioBuffer = undefined
          set(() => ({ isSpeaking: false }))
        }
      } catch (error) {
        console.error('Error in TTS generation:', error)
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
