import { GoogleGenAI } from '@google/genai'
import { config } from 'dotenv'

config({ path: '.env.local' })

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! })
  const result = await ai.models.list()
  const models = result.page ?? result
  if (Array.isArray(models)) {
    for (const m of models) {
      const name = m.name ?? ''
      if (name.includes('image') || name.includes('flash') || name.includes('nano')) {
        console.log(name, '-', m.supportedActions?.join(', ') ?? 'unknown')
      }
    }
  } else {
    console.log('Result type:', typeof result)
    console.log('Keys:', Object.keys(result as object))
    console.log(JSON.stringify(result, null, 2).slice(0, 2000))
  }
}

main()
