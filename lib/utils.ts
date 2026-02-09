import { type ClassValue, clsx } from 'clsx'
import { format } from 'date-fns'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateImageId(): string {
  return customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 10)()
}

export function formatDate(date: Date) {
  return format(date, 'yyyy-MM-dd')
}
