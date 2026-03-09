'use client'

import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { forwardRef } from 'react'
import type React from 'react'
import { Controller, type ControllerRenderProps, type FieldPath, type FieldValues } from 'react-hook-form'

type InputFieldProps = {
  errorMassage?: string
  label?: string
  disabled?: boolean
} & React.ComponentProps<'input'>

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({ errorMassage, label, disabled, ...props }, ref) => {
  return (
    <div className="flex flex-col w-full mb-5">
      {label && <Label>{label}</Label>}
      <Input ref={ref} disabled={disabled} {...props} />
      {errorMassage && <div className="mt-2 text-destructive text-xs">{errorMassage}</div>}
    </div>
  )
})

type InputControlProps<T extends FieldValues> = {
  fieldName: FieldPath<T>
  disabled?: boolean
} & Omit<React.ComponentProps<typeof InputField>, 'errorMassage' | keyof ControllerRenderProps>

function InputControl<T extends FieldValues>({ fieldName, disabled, ...props }: InputControlProps<T>) {
  return (
    <Controller
      name={fieldName}
      render={({ field, fieldState }) => (
        <InputField errorMassage={fieldState.error?.message} disabled={disabled} {...field} {...props} />
      )}
    />
  )
}

export default InputControl
