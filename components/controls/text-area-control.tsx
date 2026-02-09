'use client'

import { Label, Textarea } from '@/components/ui'
import { forwardRef } from 'react'
import type React from 'react'
import { Controller, type ControllerRenderProps, type FieldPath, type FieldValues } from 'react-hook-form'

type TextAreaProps = {
  errorMassage?: string
  label?: string
  disabled?: boolean
} & React.ComponentProps<'textarea'>

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ errorMassage, label, disabled, ...props }, ref) => {
  return (
    <div className="flex flex-col w-full mb-5">
      {label && <Label>{label}</Label>}
      <Textarea ref={ref} disabled={disabled} {...props} />
      {errorMassage && <div className="mt-2 text-destructive text-xs">{errorMassage}</div>}
    </div>
  )
})

type TextAreaControlProps<T extends FieldValues> = {
  fieldName: FieldPath<T>
  disabled?: boolean
} & Omit<React.ComponentProps<typeof TextArea>, 'errorMassage' | keyof ControllerRenderProps>

function TextAreaControl<T extends FieldValues>({ fieldName, disabled, ...props }: TextAreaControlProps<T>) {
  return (
    <Controller
      name={fieldName}
      render={({ field, fieldState }) => (
        <TextArea errorMassage={fieldState.error?.message} disabled={disabled} {...field} {...props} />
      )}
    />
  )
}

export default TextAreaControl
