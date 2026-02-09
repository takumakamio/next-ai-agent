import { Label } from '@/components/ui'
import { get } from 'lodash'
import { Star } from 'lucide-react'
import { Controller, type FieldPath, type FieldValues } from 'react-hook-form'

type StarRatingControlProps<T extends FieldValues> = {
  fieldName: FieldPath<T>
  label?: string
  max?: number
}

function StarRatingControl<T extends FieldValues>({
  fieldName,
  label = 'Difficulty',
  max = 5,
}: StarRatingControlProps<T>) {
  return (
    <Controller
      name={fieldName}
      render={({ field, formState }) => {
        const errorMessage = get(formState.errors, `${fieldName}.message`) as unknown as string
        const value = field.value || 0

        return (
          <div className="flex flex-col justify-start w-full mb-5">
            {label && <Label>{label}</Label>}
            <div className="flex items-center space-x-1 mt-1">
              {Array.from({ length: max }).map((_, index) => {
                const starValue = index + 1
                const filled = starValue <= value

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => field.onChange(starValue)}
                    className="focus:outline-none"
                    aria-label={`Set difficulty to ${starValue}`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        filled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                      } hover:text-yellow-300`}
                    />
                  </button>
                )
              })}
              <span className="ml-2 text-sm text-muted-foreground">
                {value} of {max}
              </span>
            </div>
            {errorMessage && <div className="mt-2 text-destructive text-xs">{errorMessage}</div>}
          </div>
        )
      }}
    />
  )
}

export default StarRatingControl
