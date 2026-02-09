'use client'

import { Label } from '@/components/ui'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { forwardRef } from 'react'
import type React from 'react'
import { Controller, type ControllerRenderProps, type FieldPath, type FieldValues } from 'react-hook-form'

type SwitchProps = {
  id?: string
  label?: string
  errorMessage?: string
} & Omit<React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>, 'id'>

const Switch = forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ id, label, errorMessage, ...props }, ref) => (
    <div className="flex items-center">
      <div className="flex flex-col items-center gap-2 mb-5">
        {label && <Label>{label}</Label>}
        <SwitchPrimitives.Root
          id={id}
          {...props}
          ref={ref}
          className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        >
          <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
        </SwitchPrimitives.Root>
      </div>

      {errorMessage && <div className="ml-2 text-destructive text-xs">{errorMessage}</div>}
    </div>
  ),
)

Switch.displayName = 'Switch'

type SwitchControlProps<T extends FieldValues> = {
  fieldName: FieldPath<T>
  label?: string
} & Omit<React.ComponentPropsWithoutRef<typeof Switch>, 'id' | 'checked' | keyof ControllerRenderProps>

function SwitchControl<T extends FieldValues>({ fieldName, label, ...props }: SwitchControlProps<T>) {
  return (
    <Controller
      name={fieldName}
      render={({ field, fieldState: { error } }) => (
        <Switch
          {...field}
          id={fieldName}
          label={label}
          checked={Boolean(field.value)}
          errorMessage={error?.message}
          onCheckedChange={field.onChange}
          {...props}
        />
      )}
    />
  )
}

export default SwitchControl
