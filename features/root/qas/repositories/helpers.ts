import { eq, getDB } from '@/db'
import { qaTranslations } from '@/db/schema/_index'
import type { InsertQa } from '@/features/root/qas/schema'
import { EMBEDDING_MODEL, generateEmbedding, translateWithAI } from '@/lib/google-ai'

export async function handleQaTranslationsForCreate(qaId: string, qa: InsertQa): Promise<void> {
  const db = getDB()

  try {
    const languageData = await db.query.languages.findMany({
      columns: {
        id: true,
        code: true,
      },
    })

    if (languageData.length === 0) {
      throw new Error('No languages found in database')
    }
    const inputLanguage = languageData.find((lang) => lang.code === qa.locale)
    if (!inputLanguage) {
      throw new Error(`Input language '${qa.locale}' not found in database`)
    }

    const targetLanguages = languageData.filter((lang) => lang.code !== qa.locale)

    // Insert source language translation
    const inputEmbeddingText = `${qa.question} ${qa.answer}`
    const inputEmbedding = await generateEmbedding(inputEmbeddingText)

    await db.insert(qaTranslations).values({
      qaId,
      languageId: inputLanguage.id,
      question: qa.question,
      answer: qa.answer,
      embedding: inputEmbedding,
      embeddingModel: EMBEDDING_MODEL,
    })

    // Insert translations for target languages
    for (const targetLanguage of targetLanguages) {
      try {
        const translatedQuestion = await translateWithAI(qa.question, qa.locale, targetLanguage.code)
        const translatedAnswer = await translateWithAI(qa.answer, qa.locale, targetLanguage.code)

        const translatedEmbeddingText = `${translatedQuestion} ${translatedAnswer}`
        const translatedEmbedding = await generateEmbedding(translatedEmbeddingText)

        await db.insert(qaTranslations).values({
          qaId,
          languageId: targetLanguage.id,
          question: translatedQuestion,
          answer: translatedAnswer,
          embedding: translatedEmbedding,
          embeddingModel: EMBEDDING_MODEL,
        })

        console.log(`Translated to ${targetLanguage.code}: "${translatedQuestion}"`)
      } catch (translationError) {
        console.error(`Failed to translate to ${targetLanguage.code}:`, translationError)
      }
    }

    console.log(`Translations created for QA ${qaId}`)
  } catch (error) {
    console.error('Error handling QA translations:', error)
    throw error
  }
}

export async function handleQaTranslationsForUpdate(
  qaId: string,
  qa: InsertQa,
  shouldTranslate: boolean,
): Promise<void> {
  const db = getDB()

  try {
    const languageData = await db.query.languages.findMany({
      columns: {
        id: true,
        code: true,
      },
    })

    if (languageData.length === 0) {
      throw new Error('No languages found in database')
    }
    const inputLanguage = languageData.find((lang) => lang.code === qa.locale)
    if (!inputLanguage) {
      throw new Error(`Input language '${qa.locale}' not found in database`)
    }

    const targetLanguages = languageData.filter((lang) => lang.code !== qa.locale)

    const existingTranslations = await db.query.qaTranslations.findMany({
      where: (qt, { eq }) => eq(qt.qaId, qaId),
    })

    const existingSourceTranslation = existingTranslations.find((t) => t.languageId === inputLanguage.id)

    const changedFields = {
      question: !existingSourceTranslation || existingSourceTranslation.question !== qa.question,
      answer: !existingSourceTranslation || existingSourceTranslation.answer !== qa.answer,
    }

    const hasAnyChange = Object.values(changedFields).some(Boolean)

    // Case 1: Update only the current locale (shouldTranslate: false)
    if (!shouldTranslate) {
      console.log(`Translation skipped for QA ${qaId} (shouldTranslate: false)`)

      const inputEmbeddingText = `${qa.question} ${qa.answer}`
      const inputEmbedding = await generateEmbedding(inputEmbeddingText)

      if (existingSourceTranslation) {
        await db
          .update(qaTranslations)
          .set({
            question: qa.question,
            answer: qa.answer,
            embedding: inputEmbedding,
            embeddingModel: EMBEDDING_MODEL,
          })
          .where(eq(qaTranslations.id, existingSourceTranslation.id))
      } else {
        await db.insert(qaTranslations).values({
          qaId,
          languageId: inputLanguage.id,
          question: qa.question,
          answer: qa.answer,
          embedding: inputEmbedding,
          embeddingModel: EMBEDDING_MODEL,
        })
      }

      console.log(`Updated only ${qa.locale} translation for QA ${qaId}`)
      return
    }

    // Case 2: No changes detected, skip
    if (!hasAnyChange && existingTranslations.length > 0) {
      console.log(`No translation-relevant changes detected for QA ${qaId}, skipping translation`)
      return
    }

    // Case 3: Update all translations (shouldTranslate: true)
    const inputEmbeddingText = `${qa.question} ${qa.answer}`
    const inputEmbedding = await generateEmbedding(inputEmbeddingText)

    if (existingSourceTranslation) {
      await db
        .update(qaTranslations)
        .set({
          question: qa.question,
          answer: qa.answer,
          embedding: inputEmbedding,
          embeddingModel: EMBEDDING_MODEL,
        })
        .where(eq(qaTranslations.id, existingSourceTranslation.id))
    } else {
      await db.insert(qaTranslations).values({
        qaId,
        languageId: inputLanguage.id,
        question: qa.question,
        answer: qa.answer,
        embedding: inputEmbedding,
        embeddingModel: EMBEDDING_MODEL,
      })
    }

    // Update or insert translations for target languages
    for (const targetLanguage of targetLanguages) {
      try {
        const existingTargetTranslation = existingTranslations.find((t) => t.languageId === targetLanguage.id)

        let translatedQuestion: string
        let translatedAnswer: string

        if (changedFields.question || !existingTargetTranslation) {
          translatedQuestion = await translateWithAI(qa.question, qa.locale, targetLanguage.code)
        } else {
          translatedQuestion = existingTargetTranslation.question || qa.question
        }

        if (changedFields.answer || !existingTargetTranslation) {
          translatedAnswer = await translateWithAI(qa.answer, qa.locale, targetLanguage.code)
        } else {
          translatedAnswer = existingTargetTranslation.answer || qa.answer
        }

        const translatedEmbeddingText = `${translatedQuestion} ${translatedAnswer}`
        const translatedEmbedding = await generateEmbedding(translatedEmbeddingText)

        if (existingTargetTranslation) {
          await db
            .update(qaTranslations)
            .set({
              question: translatedQuestion,
              answer: translatedAnswer,
              embedding: translatedEmbedding,
              embeddingModel: EMBEDDING_MODEL,
            })
            .where(eq(qaTranslations.id, existingTargetTranslation.id))
        } else {
          await db.insert(qaTranslations).values({
            qaId,
            languageId: targetLanguage.id,
            question: translatedQuestion,
            answer: translatedAnswer,
            embedding: translatedEmbedding,
            embeddingModel: EMBEDDING_MODEL,
          })
        }

        console.log(`Translated to ${targetLanguage.code}: "${translatedQuestion}"`)
      } catch (translationError) {
        console.error(`Failed to translate to ${targetLanguage.code}:`, translationError)
      }
    }

    const changedFieldNames = Object.entries(changedFields)
      .filter(([_, changed]) => changed)
      .map(([field]) => field)
    console.log(`Translations updated for QA ${qaId} (changed: ${changedFieldNames.join(', ') || 'none'})`)
  } catch (error) {
    console.error('Error handling QA translations:', error)
    throw error
  }
}
