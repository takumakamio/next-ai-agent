interface RecordErrorContext {
  recordId?: string
  uniqueId: string
  recordName: string
  recordType: string
  action: 'Insert' | 'Update' | 'Delete'
  additionalContext?: Record<string, any>
}

export async function handleRecordError(error: unknown, context: RecordErrorContext): Promise<never> {
  console.error(`Database operation failed for ${context.recordType}:`, error)
  const { errorType, errorDetails, constraintName } = extractDatabaseErrorDetails(error)

  // Handle common error cases
  if (errorType === 'Unique Constraint Violation') {
    if (errorDetails.includes('name')) {
      throw new Error(`A ${context.recordType} with the name "${context.recordName}" already exists`)
    }

    // Can add more specific constraint handling here
    if (constraintName === 'post_slug_key') {
      throw new Error(`A post with this slug already exists`)
    }
  }

  // Default error message
  throw new Error(`Failed to save ${context.recordType} record: ${errorDetails}`)
}

function extractDatabaseErrorDetails(error: unknown): {
  errorType: string
  errorDetails: string
  constraintName?: string
} {
  // Default error information
  let errorType = 'Database Error'
  let errorDetails = 'Unknown database error'
  let constraintName: string | undefined

  if (error && typeof error === 'object') {
    const dbError = error as any

    // Handle NeonDB specific constraint violation errors
    if (dbError.code === '23505') {
      errorType = 'Unique Constraint Violation'
      errorDetails = dbError.detail || 'A record with this data already exists'
      constraintName = dbError.constraint
    }
    // Handle other database errors with codes
    else if (dbError.code && typeof dbError.code === 'string') {
      errorType = `Database Error (${dbError.code})`
      errorDetails = dbError.detail || dbError.message || JSON.stringify(dbError)
    }
    // Handle standard errors
    else if (error instanceof Error) {
      errorDetails = error.message
    }
    // Handle unknown object errors
    else {
      errorDetails = JSON.stringify(error)
    }
  }

  return { errorType, errorDetails, constraintName }
}
