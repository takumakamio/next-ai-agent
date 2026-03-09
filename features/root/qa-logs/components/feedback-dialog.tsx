import { StarRatingControl, TextAreaControl } from '@/components/controls'
import { Button, Form } from '@/components/ui'
import { submitQAFeedbackAction } from '@/features/root/qa-logs/actions/feedback-action'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mic, MicOff, Star, X } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { type JSX, useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

interface FeedbackDialogProps {
  isOpen: boolean
  logId: string
  onClose: () => void
  messageQuestion: string
}

export const FeedbackDialog = ({ isOpen, logId, onClose, messageQuestion }: FeedbackDialogProps): JSX.Element => {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)

  const feedbackFormSchema = z.object({
    rating: z.number().min(1, '評価を選択してください').max(5),
    feedback: z.string().optional(),
  })

  type FV = z.infer<typeof feedbackFormSchema>

  const { execute: submitFeedback, isPending } = useAction(submitQAFeedbackAction, {
    onSuccess({ data }) {
      if (data?.success) {
        toast.success('フィードバックが正常に送信されました')
        handleClose()
      } else {
        toast.error(data?.message || 'フィードバックの送信に失敗しました')
      }
    },
    onError(error) {
      toast.error('予期しないエラーが発生しました')
      console.error('Feedback submission error:', error)
    },
  })

  const form = useForm<FV>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      rating: 0,
      feedback: '',
    },
    mode: 'onBlur',
  })

  const watchedFeedback = form.watch('feedback')

  const handleSubmit = useCallback(
    (values: FV) => {
      submitFeedback({
        logId,
        rating: values.rating,
        feedback: values.feedback?.trim() || undefined,
      })
    },
    [logId, submitFeedback],
  )

  const clearFeedback = useCallback(() => {
    form.setValue('feedback', '', { shouldValidate: true, shouldDirty: true })
  }, [form])

  const startVoiceInput = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('お使いのブラウザは音声認識をサポートしていません。Chromeをお試しください。')
      return
    }

    setIsRecording(true)

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
          setIsProcessingVoice(true)
          const response = await fetch('/api/root/home/stt', {
            method: 'POST',
            body: formData,
          })

          const data: { text?: string; error?: string } = await response.json()

          if (data.text) {
            // Append the transcribed text to existing feedback
            const currentFeedback = form.getValues('feedback') || ''
            const newText = data.text
            const updatedFeedback = currentFeedback ? `${currentFeedback} ${newText}` : newText

            form.setValue('feedback', updatedFeedback, { shouldValidate: true, shouldDirty: true })
            toast.success('音声入力がフィードバックに追加されました')
          } else {
            toast.error(data.error || '音声入力の文字起こしに失敗しました')
          }
        } catch (error) {
          console.error('Error processing voice input:', error)
          toast.error('音声入力の処理中にエラーが発生しました。もう一度お試しください。')
        } finally {
          setIsProcessingVoice(false)
          setIsRecording(false)
        }
      })

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      audioStreamRef.current = stream

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          stopVoiceInput()
        }
      }, 10000)
    } catch (error) {
      console.error('Error starting voice recording:', error)
      toast.error('マイクへのアクセスエラー。権限を確認してください。')
      setIsRecording(false)
    }
  }, [form])

  const stopVoiceInput = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      audioStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
    setIsRecording(false)
    mediaRecorderRef.current = null
    audioStreamRef.current = null
  }, [])

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) {
      stopVoiceInput()
    } else {
      startVoiceInput()
    }
  }, [isRecording, startVoiceInput, stopVoiceInput])

  // Clean up on unmount or dialog close
  const handleClose = useCallback(() => {
    if (isRecording) {
      stopVoiceInput()
    }
    form.reset()
    onClose()
  }, [isRecording, stopVoiceInput, form, onClose])

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        rating: 0,
        feedback: '',
      })
    }
  }, [isOpen, form])

  if (!isOpen) return <></>

  const isDisabled = isPending || isProcessingVoice

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card/80 backdrop-blur-sm border border-border rounded-lg dmp-shadow max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-white font-black uppercase tracking-wider flex items-center gap-2">
            <Star className="w-5 h-5" />
            {'この回答を評価'}
          </h3>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white border-2 border-white/30 hover:border-white p-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label={'フィードバックダイアログを閉じる'}
            disabled={isDisabled}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question preview */}
        <div className="mb-6 p-3 bg-white/10 border-2 border-white/20">
          <p className="text-slate-300 text-sm font-medium mb-1">{'あなたの質問：'}</p>
          <p className="text-white text-sm line-clamp-2">{messageQuestion}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Rating using StarRatingControl */}
            <div className="space-y-2 text-white ">
              <StarRatingControl<FV> fieldName="rating" label={'この回答はどの程度役に立ちましたか？'} max={5} />
            </div>

            {/* Feedback text with voice input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-slate-300 text-sm font-medium">{'追加のフィードバック（任意）'}</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={clearFeedback}
                    disabled={isDisabled || !watchedFeedback}
                    className="flex items-center gap-1 px-2 py-1 text-xs transition-colors bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                    title={'フィードバックテキストをクリア'}
                  >
                    <X className="w-3 h-3" />
                    {'クリア'}
                  </button>
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    disabled={isDisabled}
                    className={`
                      flex items-center gap-1 px-2 py-1 text-xs transition-colors
                      ${
                        isRecording
                          ? 'bg-destructive text-white hover:bg-destructive/90'
                          : 'bg-primary text-white hover:bg-primary/90'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                      focus:outline-none focus:ring-2 focus:ring-blue-400
                    `}
                    title={isRecording ? '音声入力を停止' : '音声入力を開始'}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-3 h-3" />
                        {'停止'}
                      </>
                    ) : (
                      <>
                        <Mic className="w-3 h-3" />
                        {'音声'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {(isRecording || isProcessingVoice) && (
                <div className="p-2 bg-primary/20 border border-primary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${isRecording ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
                    <span className="text-xs text-blue-300">
                      {isRecording && '録音中...（最大10秒）'}
                      {isProcessingVoice && '音声入力を処理中...'}
                    </span>
                  </div>
                </div>
              )}

              <TextAreaControl<FV>
                fieldName="feedback"
                placeholder={'改善方法をお聞かせください...（音声入力も使用できます）'}
                rows={3}
                maxLength={500}
                disabled={isDisabled}
                className="bg-white/10 border-2 border-white/30 text-white placeholder-white/40 focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDisabled}
                className="text-white border-2 border-white/30 hover:bg-white/10"
              >
                {'キャンセル'}
              </Button>
              <Button
                type="submit"
                disabled={isDisabled}
                className="bg-primary hover:bg-primary/90 text-white font-bold border border-primary/50 rounded-lg"
              >
                {isPending ? '送信中...' : 'フィードバックを送信'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
