'use client'

import { Label } from '@/components/ui'
import { Star } from 'lucide-react'
import { Controller, type FieldPath, type FieldValues } from 'react-hook-form'

type StarRatingControlProps<T extends FieldValues> = {
  fieldName: FieldPath<T>
  label?: string
  max?: number
}

function StarRatingControl<T extends FieldValues>({ fieldName, label, max = 5 }: StarRatingControlProps<T>) {
  return (
    <Controller
      name={fieldName}
      render={({ field, fieldState }) => (
        <div className="flex flex-col w-full mb-5">
          {label && <Label>{label}</Label>}
          <div className="flex gap-1 mt-1">
            {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => field.onChange(star)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    star <= (field.value || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          {fieldState.error?.message && (
            <div className="mt-2 text-destructive text-xs">{fieldState.error.message}</div>
          )}
        </div>
      )}
    />
  )
}

export default StarRatingControl
