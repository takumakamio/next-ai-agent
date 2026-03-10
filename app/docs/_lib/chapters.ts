export type Chapter = {
  slug: string
  title: string
  filename: string
}

export const CHAPTERS: Chapter[] = [
  { slug: 'readme', title: '研修概要', filename: 'README.md' },
  { slug: '00_learning-outcomes', title: 'この研修で理解できるようになること', filename: '00_learning-outcomes.md' },
  { slug: '01_tech-overview', title: 'この研修で使う技術を知ろう', filename: '01_tech-overview.md' },
  { slug: '02_pre-setup', title: '事前セットアップ', filename: '02_pre-setup.md' },
  { slug: '03_claude-code-intro', title: 'Step 0: Claude Code の使い方', filename: '03_claude-code-intro.md' },
  { slug: '04_database', title: 'Step 1: データベースを作ろう', filename: '04_database.md' },
  { slug: '05_api', title: 'Step 2: API を作ろう', filename: '05_api.md' },
  { slug: '06_ai-conversation', title: 'Step 3: AI と会話できるようにしよう', filename: '06_ai-conversation.md' },
  { slug: '07_frontend', title: 'Step 4: 画面を作ろう', filename: '07_frontend.md' },
  { slug: '08_hands-on-challenge', title: 'Step 5: 実践チャレンジ', filename: '08_hands-on-challenge.md' },
  { slug: '09_finishing', title: 'Step 6: 仕上げ & 振り返り', filename: '09_finishing.md' },
]

export function getChapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug)
}

export function getAdjacentChapters(slug: string): { prev: Chapter | null; next: Chapter | null } {
  const index = CHAPTERS.findIndex((c) => c.slug === slug)
  return {
    prev: index > 0 ? CHAPTERS[index - 1] : null,
    next: index < CHAPTERS.length - 1 ? CHAPTERS[index + 1] : null,
  }
}
