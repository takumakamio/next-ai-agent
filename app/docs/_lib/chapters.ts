export type Chapter = {
  slug: string
  title: string
  filename: string
}

export const CHAPTERS: Chapter[] = [
  { slug: 'quick-start', title: 'クイックスタート & セットアップ', filename: 'quick-start.md' },
  { slug: 'readme', title: '15:00 研修概要', filename: 'README.md' },
  { slug: '00_learning-outcomes', title: '15:05 この研修で理解できるようになること', filename: '00_learning-outcomes.md' },
  { slug: 'app-overview', title: '15:10 このアプリの概要', filename: 'app-overview.md' },
  { slug: '01_tech-overview', title: '15:15 この研修で使う技術を知ろう', filename: '01_tech-overview.md' },
  { slug: '03_claude-code-intro', title: '15:20 Step 0: Claude Code の使い方', filename: '03_claude-code-intro.md' },
  { slug: '04_database', title: '15:25 Step 1: データベースを作ろう', filename: '04_database.md' },
  { slug: '05_api', title: '15:35 Step 2: API を作ろう', filename: '05_api.md' },
  { slug: '06_ai-conversation', title: '15:50 Step 3: AI と会話できるようにしよう', filename: '06_ai-conversation.md' },
  { slug: '07_frontend', title: '16:05 Step 4: 画面を作ろう', filename: '07_frontend.md' },
  { slug: '09_finishing', title: '16:15 Step 5: 仕上げ & 振り返り', filename: '09_finishing.md' },
  { slug: '08_hands-on-challenge', title: '16:25 Step 6: 実践チャレンジ', filename: '08_hands-on-challenge.md' },
  { slug: 'prompts', title: 'プロンプト集', filename: 'prompts.md' },
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
