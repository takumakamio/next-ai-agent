import { generateEmbedding } from '@/lib/google-ai'
import { nanoid } from 'nanoid'
import { qas } from '../schema/_index'
import qaData from './qaData.json'

export async function seedQasData(db: any) {
  console.log('❓ Seeding Q&As...')

  try {
    const existingQas = await db.select().from(qas)
    const existingQasCount = existingQas.length

    console.log(`Found ${existingQasCount} existing Q&As`)

    const totalQas = (Object.values(qaData) as any[][]).reduce((total: number, categoryQas: any[]) => total + categoryQas.length, 0)

    if (existingQasCount >= totalQas) {
      console.log(`⏭️ ${existingQasCount} Q&As already exist`)
      return
    }
  } catch (error) {
    console.error('Error checking existing Q&As:', error)
  }

  let totalInserted = 0

  for (const [category, categoryQaList] of Object.entries(qaData) as [string, any[]][]) {
    console.log(`📂 Processing ${category} category (${categoryQaList.length} items)...`)

    for (let i = 0; i < categoryQaList.length; i++) {
      const qa = categoryQaList[i]
      const qaId = nanoid()

      try {
        const embeddingText = `${qa.question} ${qa.answer}`
        const embedding = await generateEmbedding(embeddingText)

        await db.insert(qas).values({
          id: qaId,
          category: category,
          question: qa.question,
          answer: qa.answer,
          embedding,
          embeddingModel: 'gemini-embedding-001',
        })

        totalInserted++
        console.log(`  ✓ Added Q&A ${i + 1}/${categoryQaList.length}: "${qa.question.substring(0, 30)}..."`)
      } catch (error) {
        console.error(`⚠️ Error inserting Q&A "${qa.question}":`, error)
      }
    }

    console.log(`✅ Completed ${category} category`)
  }

  console.log(`✅ Seeded ${totalInserted} Q&As`)
}
