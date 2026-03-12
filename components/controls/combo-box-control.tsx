'use client'

import { Label } from '@/components/ui'
import { Controller, type FieldPath, type FieldValues } from 'react-hook-form'

type Option = {
  value: string
  label: string
}

type ComboboxControlProps<T extends FieldValues> = {
  fieldName: FieldPath<T>
  label?: string
  options: Option[]
  disabled?: boolean
}

function ComboboxControl<T extends FieldValues>({ fieldName, label, options, disabled }: ComboboxControlProps<T>) {
  return (
    <Controller
      name={fieldName}
      render={({ field, fieldState }) => (
        <div className="flex flex-col w-full mb-5">
          {label && <Label>{label}</Label>}
          <select
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={disabled}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] focus-visible:ring-4 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 md:text-sm"
          >
            <option value="">選択してください</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {fieldState.error?.message && (
            <div className="mt-2 text-destructive text-xs">{fieldState.error.message}</div>
          )}
        </div>
      )}
    />
  )
}

export default ComboboxControl
