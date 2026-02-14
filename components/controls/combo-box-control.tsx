'use client'

import { Button, Label, Popover, PopoverContent, PopoverTrigger, ScrollArea } from '@/components/ui'
import { cn } from '@/lib/utils'
import { CaretDownIcon } from '@radix-ui/react-icons'
import { Check, Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form'

export interface Options {
  label: string
  value: number | string
}

interface ComboboxControlProps<T extends FieldValues> {
  fieldName: FieldPath<T>
  options: Options[]
  emptyText?: string
  clearable?: boolean
  selectPlaceholder?: string
  searchPlaceholder?: string
  multiple?: boolean
  label?: string
  readOnly?: boolean
}

type SingleValue = string | number | null
type MultipleValue = (string | number)[]
type ComboboxValue = SingleValue | MultipleValue

function ComboboxControl<T extends FieldValues>({
  fieldName,
  label,
  options,
  emptyText = 'No results found',
  clearable = false,
  selectPlaceholder = 'Select an option',
  searchPlaceholder = 'Search for an option',
  multiple = false,
  readOnly = false,
}: ComboboxControlProps<T>) {
  const { control } = useFormContext<T>()
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = readOnly
    ? options
    : options?.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSelect = useCallback(
    (option: Options, onChange: (value: ComboboxValue) => void, currentValue: ComboboxValue) => {
      if (multiple) {
        const newValue = Array.isArray(currentValue) ? currentValue : []
        const updatedValue = newValue.includes(option.value)
          ? newValue.filter((v) => v !== option.value)
          : [...newValue, option.value]
        onChange(updatedValue)
      } else {
        onChange(currentValue === option.value ? '' : option.value)
        setOpen(false)
      }
    },
    [multiple],
  )

  const handleClear = useCallback(
    (onChange: (value: ComboboxValue) => void) => {
      onChange(multiple ? [] : null)
      setOpen(false)
    },
    [multiple],
  )

  useEffect(() => {
    if (open && inputRef.current && !readOnly) {
      inputRef.current.focus()
    }
  }, [open, readOnly])

  const getSelectedLabels = (value: ComboboxValue) => {
    if (multiple && Array.isArray(value)) {
      return value.map((v) => options?.find((opt) => opt.value === v)?.label).filter(Boolean)
    }
    return [options?.find((opt) => opt.value === value)?.label || selectPlaceholder]
  }

  return (
    <Controller
      name={fieldName}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const value = (field.value as ComboboxValue) ?? (multiple ? [] : null)
        const selectedLabels = getSelectedLabels(value)
        const hasValue = multiple ? (value as MultipleValue).length > 0 : value !== null

        return (
          <div className="flex flex-col w-full">
            {label && <Label>{label}</Label>}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  aria-expanded={open}
                  className="w-full justify-between flex h-auto"
                  variant="outline"
                >
                  <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                    {multiple ? (
                      selectedLabels.length > 0 ? (
                        selectedLabels.map((label, index) => (
                          <span key={index} className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-md">
                            {label}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">{selectPlaceholder}</span>
                      )
                    ) : (
                      <span className="truncate">{selectedLabels[0]}</span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {clearable && hasValue && (
                      <X
                        className="mr-2 h-4 w-4 opacity-50 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClear(field.onChange)
                        }}
                      />
                    )}
                    <CaretDownIcon className="ml-2 h-4 w-4 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                {!readOnly && (
                  <div className="flex items-center border-b px-3 py-2">
                    <Search className="mr-2 h-4 w-4 opacity-50" />
                    <input
                      ref={inputRef}
                      placeholder={searchPlaceholder}
                      className="flex h-8 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
                <ScrollArea className="h-48">
                  {filteredOptions?.length > 0 ? (
                    filteredOptions.map((option) => (
                      <div
                        key={option.value}
                        className={cn(
                          'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                          'hover:bg-accent hover:text-accent-foreground',
                          (multiple ? Array.isArray(value) && value.includes(option.value) : value === option.value) &&
                            'bg-accent text-accent-foreground',
                        )}
                        onClick={() => handleSelect(option, field.onChange, value)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            (multiple ? Array.isArray(value) && value.includes(option.value) : value === option.value)
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        <span>{option.label}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-sm">{emptyText}</div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            {error && <span className="text-destructive text-sm mt-1">{error.message}</span>}
          </div>
        )
      }}
    />
  )
}

export default ComboboxControl
