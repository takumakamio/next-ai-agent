import { timestamp } from 'drizzle-orm/pg-core'

const isValidImageFile = (file: File): boolean => {
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()
  return (
    fileType.startsWith('image/') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png') ||
    fileName.endsWith('.webp')
  )
}

const getFilesFromInput = (input: unknown, fieldName: string): File[] | null => {
  if (input instanceof FormData) {
    return Array.from(input.getAll(fieldName)).filter((file): file is File => file instanceof File)
  }
  if (Array.isArray(input) && input.every((item) => item instanceof File)) {
    return input
  }
  if (input instanceof File) {
    return [input]
  }
  console.error(`Invalid input for ${fieldName}: expected FormData, File array, or single File`)
  return null
}

export const validateFiles =
  (fieldName: string) =>
  (input: unknown): boolean => {
    console.log(`Validating ${fieldName}:`, input)

    const files = getFilesFromInput(input, fieldName)
    if (!files) return false

    console.log(`Processing ${fieldName} files:`, files.length)

    return files.every((file, index) => {
      const isValid = isValidImageFile(file)
      console.log(`${fieldName} File ${index + 1} - Type: ${file.type}, Name: ${file.name}, Valid: ${isValid}`)
      return isValid
    })
  }

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}
