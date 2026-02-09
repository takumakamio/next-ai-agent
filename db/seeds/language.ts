import { languages } from '../schema/languages'

export const seedLanguages = [
  {
    code: 'ja',
    name: '日本語',
    isDefault: true,
  },
  {
    code: 'en',
    name: 'English',
    isDefault: false,
  }
  
]

export async function seedLanguagesData(db: any) {
  console.log('🌐 Checking for existing languages...')

  // Check for existing languages
  const existingLanguages = await db.select().from(languages)

  // Create a set of existing language codes for quick lookup
  const existingCodes = new Set(existingLanguages.map((lang: any) => lang.code))

  // Build the language IDs record from existing data
  const languageIds = {} as Record<string, number>
  for (const language of existingLanguages) {
    languageIds[language.code] = language.id
  }

  // Find languages that need to be seeded
  const languagesToSeed = seedLanguages.filter((lang) => !existingCodes.has(lang.code))

  if (languagesToSeed.length === 0) {
    console.log(`✅ All ${seedLanguages.length} languages already exist`)
    return languageIds
  }

  console.log(`🌐 Seeding ${languagesToSeed.length} new languages...`)

  // Seed only the new languages
  for (const language of languagesToSeed) {
    const [insertedLanguage] = await db
      .insert(languages)
      .values({
        code: language.code,
        name: language.name,
        isDefault: language.isDefault,
      })
      .returning()

    languageIds[language.code] = insertedLanguage.id
  }

  console.log(
    `✅ Seeded ${languagesToSeed.length} new languages. Total: ${existingLanguages.length + languagesToSeed.length}`,
  )

  return languageIds
}
