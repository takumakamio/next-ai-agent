'use server'

import { eq, getDB } from '@/db'
import { qaLogs } from '@/db/schema/_index'
import { actionClient } from '@/lib/safe-action'
import { flattenValidationErrors } from 'next-safe-action'
import { z } from 'zod'

// Feedback schema
const qaFeedbackSchema = z.object({
  logId: z.string().min(1, 'Log ID is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  feedback: z.string().optional(),
})

export type QAFeedback = z.infer<typeof qaFeedbackSchema>

export const submitQAFeedbackAction = actionClient
  .metadata({ actionName: 'submitQAFeedbackAction' })
  .schema(qaFeedbackSchema, {
    handleValidationErrorsShape: async (ve) => flattenValidationErrors(ve).fieldErrors,
  })
  .action(async ({ parsedInput: feedbackData }: { parsedInput: QAFeedback }) => {
    try {
      const db = getDB()

      const existingLog = await db
        .select({ id: qaLogs.id })
        .from(qaLogs)
        .where(eq(qaLogs.id, feedbackData.logId))
        .limit(1)

      if (!existingLog || existingLog.length === 0) {
        return {
          success: false,
          message: 'QA log not found / QAログが見つかりません',
        }
      }

      // Update the log with feedback
      await db
        .update(qaLogs)
        .set({
          userRating: feedbackData.rating,
          userFeedback: feedbackData.feedback || null,
          updatedAt: new Date(),
        })
        .where(eq(qaLogs.id, feedbackData.logId))

      console.log(`Feedback submitted for log ${feedbackData.logId}: rating=${feedbackData.rating}`)

      return {
        success: true,
        message: 'Feedback submitted successfully / フィードバックが正常に送信されました',
      }
    } catch (error) {
      console.error('Error in submitQAFeedbackAction:', error)
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'An unexpected error occurred / 予期しないエラーが発生しました',
      }
    }
  })
