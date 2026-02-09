interface Field {
  type: 'mrkdwn' | 'plain_text'
  text: string
}

interface ArticleMessageOptions {
  text: string
  fields?: Field[]
  channel: string
}

// Create a Slack API client without using any top-level await
function createSlackClient() {
  const botToken = process.env.SLACK_BOT_TOKEN

  return {
    postMessage: async (options: {
      channel: string
      text: string
      blocks: any[]
    }) => {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${botToken}`,
        },
        body: JSON.stringify(options),
      })

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    },
  }
}

// Function to send a message to Slack
export const sendSlackMessage = async (options: ArticleMessageOptions) => {
  console.log('Sending Slack message:', options)
  const blocks: any[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: options.text },
    },
  ]

  if (options.fields && options.fields.length > 0) {
    blocks.push({
      type: 'section',
      fields: options.fields,
    })
  }

  try {
    const slackClient = createSlackClient()
    const result = await slackClient.postMessage({
      channel: channelId(options.channel),
      text: options.text,
      blocks: blocks,
    })

    return result
  } catch (error) {
    console.error('Error sending message to Slack:', error)
    throw error
  }
}

export function formatFields(array: [string, string | null | undefined][]): Field[] {
  return array.map(([h, v]) => ({
    type: 'mrkdwn',
    text: `*${h}*\n${v ?? 'N/A'}`,
  }))
}

const channelId = (channelName: string) => {
  if (process.env.NODE_ENV !== 'production') {
    return 'C094D13RE15'
  }
  switch (channelName) {
    case 'error':
      return 'C094D13RE15'
    case 'contact':
      return 'C094D13RE15'
    default:
      return 'C094D13RE15'
  }
}

export async function logErrorToSlack(
  title: string,
  data: Record<string, string | number | boolean | undefined>,
): Promise<void> {
  try {
    // Convert data object to Slack fields format
    const fields = Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => ({
        type: 'mrkdwn' as const,
        text: `*${key.charAt(0).toUpperCase() + key.slice(1)}*\n${value}`,
      }))

    await sendSlackMessage({
      text: `:x: ${title}`,
      fields,
      channel: 'error',
    })
  } catch (slackError) {
    console.error('Failed to send error to Slack:', slackError)
    // Don't rethrow to prevent cascading failures
  }
}
