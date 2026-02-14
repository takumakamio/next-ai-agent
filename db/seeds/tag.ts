import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { tagTranslations, tags } from '../schema/_index'

interface TagSeed {
  id?: string
  translations: {
    ja: string
    en: string
    zh: string
    ko: string
  }
}

export const seedTags: TagSeed[] = [
  {
    translations: {
      ja: '一般',
      en: 'General',
    },
  },
]

// タグのシード関数
export async function seedTagsData(db: any, languageIds: Record<string, number>) {
  console.log('🏷️ Seeding tags...')

  // Check if tags already exist using the correct count syntax
  try {
    const existingTags = await db.select().from(tags)
    const existingTagsCount = existingTags.length

    console.log(`Found ${existingTagsCount} existing tags of ${seedTags.length} required`)

    if (existingTagsCount >= seedTags.length) {
      console.log(`⏭️ ${existingTagsCount} tags already exist - checking translations...`)

      // Get existing tag IDs but continue to seed missing translations
      const tagIds = existingTags.reduce(
        (acc: Record<string, string>, tag: { id: string }, index: number) => {
          if (index < seedTags.length) {
            acc[`tag_${index}`] = tag.id
          }
          return acc
        },
        {} as Record<string, string>,
      )

      // Continue to seed translations even if tags exist
      const tagIdsArray = Object.values(tagIds) as string[]
      await seedAllTranslations(db, languageIds, tagIdsArray)

      return tagIds
    }
  } catch (error) {
    console.error('Error checking existing tags:', error)
    // Continue with seeding if the check fails
  }

  // Log language IDs for debugging
  console.log('言語ID情報:', languageIds)
  Object.entries(languageIds).forEach(([lang, id]) => {
    console.log(`${lang.toUpperCase()}ID: ${id}`)
  })

  // タグIDを格納する配列（順序を維持するため）
  const tagIdsArray: string[] = []

  // 1. まずタグをシード
  for (const tag of seedTags) {
    try {
      const id = tag.id || nanoid()

      const [insertedTag] = await db
        .insert(tags)
        .values({
          id,
        })
        .returning()

      tagIdsArray.push(insertedTag.id)
      console.log(`✅ Added tag with ID: ${insertedTag.id}`)
    } catch (error) {
      console.error(`⚠️ Error inserting tag:`, error)

      // Try to find the existing tag with similar translations
      try {
        const enTranslation = tag.translations.en
        const existingTagTranslation = await db
          .select({ tagId: tagTranslations.tagId })
          .from(tagTranslations)
          .where(eq(tagTranslations.name, enTranslation))
          .limit(1)

        if (existingTagTranslation.length > 0) {
          console.log(`🔄 Found existing tag with translation "${enTranslation}"`)
          tagIdsArray.push(existingTagTranslation[0].tagId)
        } else {
          // Generate a placeholder ID for this failed tag
          const placeholderId = nanoid()
          tagIdsArray.push(placeholderId)
          console.log(`⚠️ Using placeholder ID: ${placeholderId}`)
        }
      } catch (findError) {
        // If finding existing tag fails, just generate a placeholder
        const placeholderId = nanoid()
        tagIdsArray.push(placeholderId)
        console.log(`⚠️ Using placeholder ID: ${placeholderId}`)
      }
    }
  }
  console.log(`✅ Processed ${tagIdsArray.length} tags`)

  // 2. Seed all translations
  await seedAllTranslations(db, languageIds, tagIdsArray)

  // タグIDと対応するオブジェクトを返す
  const tagIds = tagIdsArray.reduce(
    (acc, id, index) => {
      acc[`tag_${index}`] = id
      return acc
    },
    {} as Record<string, string>,
  )

  return tagIds
}

// Helper function to seed all translations
async function seedAllTranslations(db: any, languageIds: Record<string, number>, tagIdsArray: string[]) {
  // Helper function to seed translations for a specific language
  async function seedLanguageTranslations(languageCode: string, languageName: string, flagEmoji: string) {
    console.log(`${flagEmoji} Seeding ${languageName} tag translations...`)

    if (!languageIds[languageCode]) {
      console.warn(`⚠️ ${languageName} language ID not found!`)
      return 0
    }

    let existingTagIds = new Set<string>()

    try {
      const existingTranslations = await db
        .select({ tagId: tagTranslations.tagId })
        .from(tagTranslations)
        .where(eq(tagTranslations.languageId, languageIds[languageCode]))

      existingTagIds = new Set(existingTranslations.map((trans: { tagId: string }) => trans.tagId))
      console.log(`Found ${existingTagIds.size} existing ${languageName} translations`)
    } catch (error) {
      console.error(`Error checking existing ${languageName} translations:`, error)
    }

    let count = 0
    for (let i = 0; i < seedTags.length && i < tagIdsArray.length; i++) {
      const tagId = tagIdsArray[i]
      const tag = seedTags[i]

      if (tagId && !existingTagIds.has(tagId)) {
        try {
          const translationText = tag.translations[languageCode as keyof typeof tag.translations]
          if (translationText) {
            await db.insert(tagTranslations).values({
              tagId: tagId,
              languageId: languageIds[languageCode],
              name: translationText,
            })
            count++
            console.log(`  ✓ Added "${translationText}" for tag ${tagId}`)
          }
        } catch (error) {
          const translationText = tag.translations[languageCode as keyof typeof tag.translations]
          console.error(`⚠️ Error seeding ${languageName} translation for "${translationText}":`, error)
        }
      } else if (existingTagIds.has(tagId)) {
        console.log(`  ⏭️ Translation already exists for tag ${tagId}`)
      }
    }

    console.log(`✅ Seeded ${count} ${languageName} tag translations`)
    return count
  }

  // Seed all language translations
  const languages = [
    { code: 'ja', name: 'Japanese', emoji: '🇯🇵' },
    { code: 'en', name: 'English', emoji: '🇬🇧' },
    { code: 'zh', name: 'Chinese', emoji: '🇨🇳' },
    { code: 'ko', name: 'Korean', emoji: '🇰🇷' },
  ]

  for (const lang of languages) {
    await seedLanguageTranslations(lang.code, lang.name, lang.emoji)
  }
}
