import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'
import { sendSlackMessage } from './slack'

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    })
  },
  handleServerError(e, utils) {
    const { clientInput, metadata } = utils
    console.error(`Error in ${metadata?.actionName || 'unknown action'}:`, e)
    const errorMessage = e.message || 'Unknown error'
    const inputData = clientInput ? JSON.stringify(clientInput, null, 2) : 'No input data'
    sendSlackMessage({
      text: `:red_circle: Server Action Error: ${metadata?.actionName || 'unknown action'}`,
      fields: [
        {
          type: 'mrkdwn',
          text: `*Error Message*\n\`\`\`${errorMessage}\`\`\``,
        },
        {
          type: 'mrkdwn',
          text: `*Input Data*\n\`\`\`${inputData.substring(0, 500)}${inputData.length > 500 ? '...' : ''}\`\`\``,
        },
        {
          type: 'mrkdwn',
          text: `*Timestamp*\n${new Date().toISOString()}`,
        },
      ],
      channel: 'error',
    }).catch((slackError) => {
      console.error('Failed to send error to Slack:', slackError)
    })

    return errorMessage
  },
})
