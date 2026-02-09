import { GoogleGenAI } from '@google/genai'

export async function translateWithAI(
  text: string,
  fromLanguage: string,
  toLanguage: string,
  fieldType?: string,
): Promise<string> {
  const env = process.env

  try {
    if (!env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY === '') {
      console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
      return text
    }

    const ai = new GoogleGenAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })

    // Build context-aware prompt based on field type
    const fieldContext = fieldType ? `This is ${fieldType} content.` : ''

    const prompt = `You are an AI writing assistant that translates text from ${fromLanguage} to ${toLanguage}.${fieldContext} Use natural, contextually appropriate translations that preserve the original meaning and tone. Only return the final translated text without any additional comments, explanations, or formatting instructions. Translate this text: ${text}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    })

    const translation = response.text?.trim()

    if (!translation) {
      console.log(`AI translation returned empty result for: ${text}, using original`)
      return text
    }

    return translation
  } catch (error) {
    console.error('AI translation error:', error)
    return text
  }
}

export const EMBEDDING_MODEL = 'gemini-embedding-001'

export async function generateEmbedding(text: string): Promise<number[] | never[]> {
  const env = process.env

  if (!env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY === '') {
    console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
    return []
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })

    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        outputDimensionality: 2000,
      },
    })

    const embeddings = response.embeddings

    if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
      console.error('No embeddings returned from API')
      return []
    }

    const embedding = embeddings[0]

    if (!embedding || !embedding.values || !Array.isArray(embedding.values)) {
      console.error('Invalid embedding structure:', embedding)
      return []
    }

    return embedding.values as number[]
  } catch (error) {
    console.error('Embedding generation error:', error)
    return []
  }
}
