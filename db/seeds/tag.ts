import { nanoid } from 'nanoid'
import { tagTranslations, tags } from '../schema/_index'

interface TagSeed {
  id?: string
  name: string
}

export const seedTags: TagSeed[] = [
  { name: '一般' },
]

export async function seedTagsData(db: any) {
  console.log('🏷️ Seeding tags...')

  try {
    const existingTags = await db.select().from(tags)
    const existingTagsCount = existingTags.length

    if (existingTagsCount >= seedTags.length) {
      console.log(`⏭️ ${existingTagsCount} tags already exist`)
      return
    }
  } catch (error) {
    console.error('Error checking existing tags:', error)
  }

  for (const tag of seedTags) {
    try {
      const id = tag.id || nanoid()

      const [insertedTag] = await db
        .insert(tags)
        .values({ id })
        .returning()

      await db.insert(tagTranslations).values({
        tagId: insertedTag.id,
        name: tag.name,
      })

      console.log(`✅ Added tag: ${tag.name}`)
    } catch (error) {
      console.error(`⚠️ Error inserting tag:`, error)
    }
  }

  console.log(`✅ Seeded ${seedTags.length} tags`)
}
