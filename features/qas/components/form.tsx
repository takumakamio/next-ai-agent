'use client'

import { ComboboxControl, InputControl, TextAreaControl } from '@/components/controls'
import { Button, Form } from '@/components/ui'
import { rpc } from '@/lib/rpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { type InsertQa, type SelectQa, insertQaSchema } from '../schema'

type FV = InsertQa

export const ManageQaForm = ({
  qa,
  onSuccess,
  onCancel,
}: {
  qa?: SelectQa
  onSuccess?: (id: string, isNew: boolean) => void
  onCancel?: () => void
}) => {
  const router = useRouter()

  const defaultValues: FV = {
    id: qa?.id ?? '',
    category: qa?.category ?? 'general',
    question: qa?.question ?? '',
    answer: qa?.answer ?? '',
    websiteLink: qa?.websiteLink ?? '',
    locale: 'ja',
  }

  const [isPending, setIsPending] = useState(false)

  const execute = async (data: InsertQa) => {
    setIsPending(true)
    try {
      const res = await rpc.api.qas.$post({ json: data })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      const result = await res.json()

      if (result.success) {
        toast('Save Success')
        if (onSuccess) {
          onSuccess(result.id || qa?.id || '', !!result.isNew)
        } else if (result.isNew && result.id) {
          router.push(`/qas/${result.id}/edit`)
        }
      } else {
        toast(result.message || 'An error occurred')
      }
    } catch (error) {
      toast('An unexpected error occurred')
      console.error('Form submission error:', error)
    } finally {
      setIsPending(false)
    }
  }

  const form = useForm<FV>({
    mode: 'onBlur',
    resolver: zodResolver(insertQaSchema),
    defaultValues,
  })

  const categoryOptions = [
    { value: 'programming', label: 'プログラミング' },
    { value: 'architecture', label: 'アーキテクチャ' },
    { value: 'devops', label: 'DevOps' },
    { value: 'debugging', label: 'デバッグ' },
    { value: 'security', label: 'セキュリティ' },
    { value: 'general', label: '一般' },
  ]

  return (
    <div className="border border-border bg-card/80 backdrop-blur-sm p-6 rounded-lg dmp-shadow">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(execute)} className="flex flex-col gap-4">
          {/* Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{'分類'}</h3>
              <p className="text-sm text-muted-foreground">{'Q&Aの分類を設定'}</p>
            </div>
            <div className="flex flex-col gap-4">
              <ComboboxControl<FV> fieldName="category" label={'カテゴリ'} options={categoryOptions} />
            </div>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Question & Answer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{'質問と回答'}</h3>
              <p className="text-sm text-muted-foreground">{'Q&Aの内容を入力'}</p>
            </div>
            <div className="flex flex-col gap-4">
              <InputControl<FV> fieldName="question" label={'質問'} />
              <TextAreaControl<FV> fieldName="answer" label={'回答'} rows={20} />
            </div>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Website Link */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{'ウェブサイトリンク'}</h3>
              <p className="text-sm text-muted-foreground">{'QRコード用のウェブサイトリンクを入力'}</p>
            </div>
            <div className="flex flex-col gap-4">
              <InputControl<FV> fieldName="websiteLink" label={'ウェブサイトリンク'} placeholder="https://example.com" />
            </div>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Submit Buttons */}
          <div className="mt-auto flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => (onCancel ? onCancel() : router.back())}
              className="h-8 rounded-lg border border-border px-3 text-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
            >
              {'キャンセル'}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-8 gap-2 rounded-lg bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90"
            >
              {isPending ? (
                <Loader className="size-4 animate-spin" />
              ) : (
                <>
                  <Send className="size-4" />
                  {qa?.id ? '保存' : '作成'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
