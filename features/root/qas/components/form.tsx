'use client'

import { ComboboxControl, InputControl, TextAreaControl } from '@/components/controls'
import SwitchControl from '@/components/controls/switch-control'
import { Button, Form } from '@/components/ui'
import { clientPost } from '@/lib/client-fetcher'
import { rpc } from '@/lib/rpc'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader, Send } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
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
  const t = useTranslations()
  const locale = useLocale()

  const defaultValues: FV = {
    id: qa?.id ?? '',
    contentType: qa?.contentType ?? 'general',
    category: qa?.category ?? 'general',
    priority: qa?.priority ?? 1,
    isActive: qa?.isActive ?? true,
    question: qa?.question ?? '',
    answer: qa?.answer ?? '',
    websiteLink: qa?.websiteLink ?? '',
    locale,
    // For create mode, always translate; for update mode, default to false (user can opt-in)
    shouldTranslate: !qa?.id,
  }

  const [isPending, setIsPending] = useState(false)

  const execute = async (data: InsertQa) => {
    setIsPending(true)
    try {
      const result = await clientPost(rpc.api.root.qas, data)

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

  const contentTypeOptions = [
    { value: 'general', label: t('General') },
  ]

  const categoryOptions = [
    { value: 'programming', label: t('Programming') },
    { value: 'architecture', label: t('Architecture') },
    { value: 'devops', label: t('DevOps') },
    { value: 'debugging', label: t('Debugging') },
    { value: 'security', label: t('Security') },
    { value: 'general', label: t('General') },
  ]

  return (
    <div className="border border-border bg-card/80 backdrop-blur-sm p-6 rounded-lg dmp-shadow">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(execute)} className="flex flex-col gap-4">
          {/* Classification */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{t('Classification')}</h3>
              <p className="text-sm text-muted-foreground">{t('SetQaClassification')}</p>
            </div>
            <div className="flex flex-col gap-4">
              <ComboboxControl<FV> fieldName="contentType" label={t('ContentType')} options={contentTypeOptions} />
              <ComboboxControl<FV> fieldName="category" label={t('Category')} options={categoryOptions} />
            </div>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Question & Answer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                {t('QuestionAndAnswer')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('EnterQaContent')}</p>
            </div>
            <div className="flex flex-col gap-4">
              <InputControl<FV> fieldName="question" label={t('Question')} />
              <TextAreaControl<FV> fieldName="answer" label={t('Answer')} rows={20} />
            </div>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Website Link */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">{t('WebsiteLink')}</h3>
              <p className="text-sm text-muted-foreground">{t('EnterWebsiteLinkForQrCode')}</p>
            </div>
            <div className="flex flex-col gap-4">
              <InputControl<FV> fieldName="websiteLink" label={t('WebsiteLink')} placeholder="https://example.com" />
            </div>
          </div>

          <div className="border-t border-dashed border-border" />

          {/* Submit Buttons */}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
            {/* Translation option - only show in update mode */}
            <div className="flex items-center">
              {qa?.id && <SwitchControl<FV> fieldName="shouldTranslate" label={t('TranslateOnSave')} />}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onCancel ? onCancel() : router.back()}
                className="h-8 rounded-lg border border-border px-3 text-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              >
                {t('Cancel')}
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
                    {qa?.id ? t('Save') : t('Create')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
