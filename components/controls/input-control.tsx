import { Input, Label } from '@/components/ui'
import { get } from 'lodash'
import type React from 'react'
import { Controller, type ControllerRenderProps, type FieldPath, type FieldValues } from 'react-hook-form'

type InputProps = {
  errorMessage?: string
  label?: string
} & React.ComponentProps<'input'>

const InputComponent = ({ errorMessage, label, ...props }: InputProps) => {
  return (
    <div className="flex flex-col justify-start w-full mb-5">
      {label && <Label>{label}</Label>}
      <Input {...props} onBlur={(e) => props.onBlur?.(e)} />
      {errorMessage && <div className="mt-2 text-destructive text-xs">{errorMessage}</div>}
    </div>
  )
}

type InputControlProps<T extends FieldValues> = {
  fieldName: FieldPath<T>
  parentName?: string
  label?: string
} & Omit<React.ComponentProps<typeof Input>, 'errorMessage' | keyof ControllerRenderProps>

function InputControl<T extends FieldValues>({ fieldName, label, ...props }: InputControlProps<T>) {
  return (
    <Controller
      name={fieldName}
      render={({ field, formState }) => {
        const errorMessage = get(formState.errors, `${fieldName}.message`) as unknown as string
        return (
          <InputComponent
            errorMessage={errorMessage}
            label={label}
            {...field}
            onChange={(e) => {
              if (props.type === 'number') {
                field.onChange(e.target.value ? Number(e.target.value) : '')
              } else {
                field.onChange(e.target.value)
              }
            }}
            {...props}
          />
        )
      }}
    />
  )
}

export default InputControl
