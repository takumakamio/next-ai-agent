import { translateWithAI } from '@/lib/google-ai'
import { generateEmbedding } from '@/lib/google-ai'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { qaTranslations, qas } from '../schema/_index'
import qaData from './qaData.json'

const commonSettings = {
  contentType: 'general',
  priority: 1,
  isActive: true,
  languageId: 1,
}

// Q&Aシード関数
export async function seedQasData(db: any, languageIds: Record<string, number>) {
  console.log('❓ Seeding Q&As...')

  try {
    // 既存のQ&Aをチェック
    const existingQas = await db.select().from(qas)
    const existingQasCount = existingQas.length

    console.log(`Found ${existingQasCount} existing Q&As`)

    // 全カテゴリのQ&A数を計算
    const totalQas = Object.values(qaData).reduce((total: number, categoryQas: any[]) => total + categoryQas.length, 0)

    if (existingQasCount >= totalQas) {
      console.log(`⏭️ ${existingQasCount} Q&As already exist - checking translations...`)

      // 既存の翻訳をチェック・更新
      await updateExistingTranslations(db, languageIds, existingQas)
      return
    }
  } catch (error) {
    console.error('Error checking existing Q&As:', error)
  }

  console.log('言語ID情報:', languageIds)
  Object.entries(languageIds).forEach(([lang, id]) => {
    console.log(`${lang.toUpperCase()}ID: ${id}`)
  })

  let totalInserted = 0

  // カテゴリごとにQ&Aを処理
  // ここで変数名を変更: qas → categoryQaList
  for (const [category, categoryQaList] of Object.entries(qaData)) {
    console.log(`📂 Processing ${category} category (${categoryQaList.length} items)...`)

    for (let i = 0; i < categoryQaList.length; i++) {
      const qa = categoryQaList[i]
      const qaId = nanoid()

      try {
        // Q&Aレコードを挿入 - ここで正しいテーブルスキーマを参照
        await db.insert(qas).values({
          id: qaId,
          contentType: commonSettings.contentType,
          category: category,
          priority: commonSettings.priority,
          isActive: commonSettings.isActive,
        })

        // 翻訳とEmbeddingを生成・保存
        await generateAndSaveTranslations(db, qaId, qa, languageIds)

        totalInserted++
        console.log(`  ✓ Added Q&A ${i + 1}/${categoryQaList.length}: "${qa.question.substring(0, 30)}..."`)
      } catch (error) {
        console.error(`⚠️ Error inserting Q&A "${qa.question}":`, error)
      }
    }

    console.log(`✅ Completed ${category} category`)
  }

  console.log(`✅ Seeded ${totalInserted} Q&As with translations`)
}
// 翻訳とEmbedding生成・保存
async function generateAndSaveTranslations(
  db: any,
  qaId: string,
  qa: { question: string; answer: string },
  languageIds: Record<string, number>,
) {
  const translationData = []

  // 言語設定
  const languages = [
    { code: 'ja', name: 'Japanese', emoji: '🇯🇵' },
    { code: 'en', name: 'English', emoji: '🇬🇧' },
    { code: 'zh', name: 'Chinese', emoji: '🇨🇳' },
    { code: 'ko', name: 'Korean', emoji: '🇰🇷' },
  ]

  for (const lang of languages) {
    if (!languageIds[lang.code]) {
      console.warn(`⚠️ ${lang.name} language ID not found!`)
      continue
    }

    try {
      // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
      let question, answer

      if (lang.code === 'ja') {
        // 日本語（元データ）
        question = qa.question
        answer = qa.answer
      } else {
        // その他の言語は翻訳
        console.log(`${lang.emoji} Translating to ${lang.name}...`)
        question = await translateWithAI(qa.question, 'ja', lang.code)
        answer = await translateWithAI(qa.answer, 'ja', lang.code)
      }

      // Embedding生成
      const embeddingText = `${question} ${answer}`
      const embedding = await generateEmbedding(embeddingText)

      translationData.push({
        qaId,
        languageId: languageIds[lang.code],
        question,
        answer,
        embedding,
        embeddingModel: 'gemini-embedding-001',
      })

      console.log(`  ✓ ${lang.name}: "${question.substring(0, 30)}..."`)
    } catch (error) {
      console.error(`⚠️ Error processing ${lang.name} translation:`, error)

      // エラー時はダミーデータを挿入
      translationData.push({
        qaId,
        languageId: languageIds[lang.code],
        question: lang.code === 'ja' ? qa.question : `[Translation pending] ${qa.question}`,
        answer: lang.code === 'ja' ? qa.answer : `[Translation pending] ${qa.answer}`,
        embedding: new Array(2000).fill(0), // ダミーembedding
        embeddingModel: 'gemini-embedding-001',
      })
    }
  }

  // 翻訳データを一括挿入
  if (translationData.length > 0) {
    await db.insert(qaTranslations).values(translationData)
  }
}

// 既存翻訳の更新
async function updateExistingTranslations(db: any, languageIds: Record<string, number>, existingQas: any[]) {
  console.log('🔄 Updating existing translations...')

  for (const existingQa of existingQas.slice(0, 5)) {
    // 最初の5件のみ更新
    try {
      // 既存の翻訳をチェック
      const existingTranslations = await db.select().from(qaTranslations).where(eq(qaTranslations.qaId, existingQa.id))

      const existingLanguages = new Set(existingTranslations.map((t: any) => t.languageId))

      // 不足している言語の翻訳を生成
      const languages = [
        { code: 'ja', name: 'Japanese', emoji: '🇯🇵' },
        { code: 'en', name: 'English', emoji: '🇬🇧' },
        { code: 'zh', name: 'Chinese', emoji: '🇨🇳' },
        { code: 'ko', name: 'Korean', emoji: '🇰🇷' },
      ]

      for (const lang of languages) {
        const languageId = languageIds[lang.code]
        if (!languageId || existingLanguages.has(languageId)) continue

        // 日本語の翻訳を基準に他言語を生成
        const jaTranslation = existingTranslations.find((t: any) => t.languageId === languageIds['ja'])

        if (jaTranslation && lang.code !== 'ja') {
          console.log(`${lang.emoji} Adding missing ${lang.name} translation...`)

          try {
            const question = await translateWithAI(jaTranslation.question, 'ja', lang.code)
            const answer = await translateWithAI(jaTranslation.answer, 'ja', lang.code)
            const embedding = await generateEmbedding(`${question} ${answer}`)

            await db.insert(qaTranslations).values({
              qaId: existingQa.id,
              languageId,
              question,
              answer,
              embedding,
              embeddingModel: 'gemini-embedding-001',
            })

            console.log(`  ✓ Added ${lang.name} translation`)
          } catch (error) {
            console.error(`⚠️ Error adding ${lang.name} translation:`, error)
          }
        }
      }
    } catch (error) {
      console.error(`⚠️ Error updating translations for QA ${existingQa.id}:`, error)
    }
  }
}

// 統計情報を表示
export async function showQaStats(db: any) {
  try {
    const totalQas = await db.select().from(qas)
    const totalTranslations = await db.select().from(qaTranslations)

    console.log(`📊 Q&A Statistics:`)
    console.log(`   Total Q&As: ${totalQas.length}`)
    console.log(`   Total Translations: ${totalTranslations.length}`)
    console.log(`   Average translations per Q&A: ${(totalTranslations.length / totalQas.length).toFixed(1)}`)

    // カテゴリ別統計
    const categoryStats = totalQas.reduce((acc: Record<string, number>, qa: any) => {
      acc[qa.category] = (acc[qa.category] || 0) + 1
      return acc
    }, {})

    console.log(`   By category:`)
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`     ${category}: ${count}`)
    })
  } catch (error) {
    console.error('Error showing Q&A statistics:', error)
  }
}
