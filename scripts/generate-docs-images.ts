/**
 * Generate diagram images for docs using Gemini (Nano Banana Pro) image generation.
 *
 * Usage: npx tsx scripts/generate-docs-images.ts
 *
 * Requires GOOGLE_GENERATIVE_AI_API_KEY in .env.local
 */

import { GoogleGenAI } from '@google/genai'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { config } from 'dotenv'

config({ path: '.env.local' })

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'docs')

const STYLE = `Style: Dark background (#0f172a), boxes with rounded corners and borders (#3f5169), blue (#3b82f6) accent color, white/light gray text. Clean, professional technical diagram. Japanese labels. No watermarks.`

const DIAGRAMS = [
  // --- 00_learning-outcomes.md ---
  {
    filename: '00-web-app-architecture.png',
    prompt: `Create a simple 3-layer web application architecture diagram showing data flow with arrows.

3 boxes in a horizontal row connected by arrows (→ and ←):
- Left box: "フロントエンド（画面・UI）" with sub-labels "Next.js, React, shadcn/ui"
- Center box: "API（サーバー）" with sub-label "Hono"
- Right box: "データベース（保存）" with sub-labels "PostgreSQL, pgvector, Drizzle ORM"

Arrows: Left → Center → Right (requests), Right → Center → Left (responses).

${STYLE}`,
  },
  // --- 01_tech-overview.md: tech role map ---
  {
    filename: '01-tech-role-map.png',
    prompt: `Create a technical architecture diagram showing a web application's full technology stack.

2 main layers separated vertically:

Top layer - "ブラウザ（Chrome など）":
- Inside: a box labeled "フロントエンド（画面）" with technologies "Next.js / React / TypeScript / shadcn/ui"
- Arrow going down labeled "HTTP リクエスト"

Bottom layer - "サーバー（API）":
- Label: "Next.js + Hono / TypeScript"
- 2 boxes inside side by side:
  - "Gemini AI（会話・検索）"
  - "PostgreSQL + pgvector（データ保存・検索）" with note "↑ Drizzle ORM で操作"
- Note below: "↑ Neon（クラウド PostgreSQL）を利用"

${STYLE}`,
  },
  // --- 01_tech-overview.md: frontend stack ---
  {
    filename: '01-frontend-stack.png',
    prompt: `Create a vertical layered diagram showing the relationship between frontend technologies. Show 3 layers stacked vertically with upward arrows between them:

Bottom layer: "React — 画面の「部品」を作る基盤"
Arrow up with label "を便利にしたのが"
Middle layer: "Next.js — ルーティング・サーバー処理・最適化を自動化"
Arrow up with label "の上で使うのが"
Top layer: "shadcn/ui — きれいな UI パーツをすぐ使える"

Footer text: "すべて TypeScript で書く"

${STYLE}`,
  },
  // --- 01_tech-overview.md: server stack ---
  {
    filename: '01-server-stack.png',
    prompt: `Create a vertical layered diagram showing the relationship between server-side technologies. Show 4 items stacked vertically:

Layer 1: "Hono — API（リクエストを受けてレスポンスを返す窓口）"
Layer 2: "Drizzle ORM — データベースを TypeScript で操作する翻訳機"
Layer 3: "PostgreSQL — データの保存・検索（pgvector でベクトル検索も）"
Layer 4: "Gemini AI — 会話の生成 + テキストのベクトル変換"

Footer text: "すべて TypeScript で書く"

${STYLE}`,
  },
  // --- 01_tech-overview.md: complete overview ---
  {
    filename: '01-complete-tech-overview.png',
    prompt: `Create a comprehensive technology overview diagram with 4 sections stacked vertically.

Section 1 - "フロントエンド（画面）":
- React — 画面の「部品」を作る基盤
- Next.js — React を便利にするフレームワーク
- shadcn/ui — きれいな UI パーツをすぐ使える

Arrow down labeled "API で通信"

Section 2 - "サーバーサイド（裏側の処理）":
- Hono — API の窓口
- Drizzle ORM — DB を TypeScript で操作
- PostgreSQL — データ保存 + ベクトル検索（pgvector）
- Gemini AI — 会話生成 + テキストのベクトル変換

Section 3 - "共通":
- TypeScript — フロントもサーバーもこの言語で書く
- npm — パッケージの管理（Node.js に付属）

Section 4 - "開発ツール":
- VS Code — コードエディタ
- Claude Code — AI に指示してコードを書いてもらう

${STYLE}`,
  },
  // --- 07_frontend.md: chat UI ---
  {
    filename: '07-chat-ui-mockup.png',
    prompt: `Create a UI mockup of a chat interface for an AI chat application.

Layout:
- Title at top: "AI チャット"
- Message bubbles:
  - AI message (left, blue): "AI: こんにちは！"
  - User message (right, purple): "あなた: TSって何？"
  - AI message (left, blue): "AI: TypeScriptは…"
- Bottom: Text input field with placeholder "メッセージを入力..." and a "送信" (send) button

${STYLE}`,
  },
  // --- 07_frontend.md: QA management UI ---
  {
    filename: '07-qa-management-mockup.png',
    prompt: `Create a UI mockup of a Q&A management screen with a data table.

Layout:
- Title: "Q&A 管理"
- A "+ 追加" (Add) button at top
- A data table with 4 columns: "ID", "カテゴリ", "質問", "作成日"
- 3 sample rows:
  - abc | prog | TSの型とは？ | 1/1
  - def | prog | Reactとは？ | 1/1
  - ghi | arch | APIとは？ | 1/1

${STYLE}`,
  },
  // --- 07_frontend.md: QA add form ---
  {
    filename: '07-qa-form-mockup.png',
    prompt: `Create a UI mockup of a form dialog for adding a new Q&A entry.

Layout:
- Title: "新しい Q&A を追加"
- Form fields:
  - "カテゴリ:" with a dropdown showing "programming"
  - "質問:" with a text input
  - "回答:" with a larger textarea
- 2 buttons at the bottom: "キャンセル" (Cancel) and "保存" (Save, blue accent)

${STYLE}`,
  },
  // --- 07_frontend.md: tab switching ---
  {
    filename: '07-tab-switching-mockup.png',
    prompt: `Create a simple UI mockup showing tab navigation for switching between screens.

Layout:
- 2 tabs at top: "チャット" and "Q&A 管理"
- The first tab "チャット" is active (highlighted in blue)
- Below: a content area with text "（選択中のタブのコンテンツ）"

${STYLE}`,
  },
  // --- 08_hands-on-challenge.md: summary feature ---
  {
    filename: '08-summary-feature-mockup.png',
    prompt: `Create a UI mockup of a chat interface with an AI summary feature.

Layout:
- Title: "AI チャット"
- Chat messages:
  - AI: "こんにちは！"
  - User: "TSって何？"
  - AI: "TypeScriptは…"
- Text input with send button
- Below the chat: A "要約する" (Summarize) button with arrow label "← 新しいボタン"
- Below the button: A summary card showing:
  "会話の要約：
  TypeScriptについて質問があり、
  型安全なJavaScriptであること
  を学びました。"

${STYLE}`,
  },
  // --- 06_ai-conversation.md: data flow ---
  {
    filename: '06-conversation-data-flow.png',
    prompt: `Create a vertical flow diagram showing how an AI conversation API processes a request. 6 steps connected by downward arrows:

Step ①: "ユーザーが質問を送信"
Step ②: "質問をベクトル（embedding）に変換"
Step ③: "DB でベクトル検索 → 類似度 0.65 以上の Q&A を取得"
Step ④: "Gemini に送る：システムプロンプト / 関連 Q&A / 会話履歴 / ユーザーの質問"
Step ⑤: "Gemini が回答を生成"
Step ⑥: "レスポンスとして返す"

${STYLE}`,
  },
  // --- 08_hands-on-challenge.md: data flow ---
  {
    filename: '08-summary-data-flow.png',
    prompt: `Create a vertical flow diagram showing how a chat summary feature works. 5 steps connected by downward arrows:

Step 1: "要約ボタンをクリック"
Step 2: "会話履歴（messages）を POST /api/home/summary に送信"
Step 3: "サーバーで Gemini AI に要約を依頼"
Step 4: "要約テキストをレスポンスとして返す"
Step 5: "画面に要約を表示"

${STYLE}`,
  },
]

async function generateImage(prompt: string, filename: string) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    console.error('GOOGLE_GENERATIVE_AI_API_KEY is not set')
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey })

  console.log(`Generating: ${filename}...`)

  const response = await ai.models.generateContent({
    model: 'nano-banana-pro-preview',
    contents: prompt,
    config: {
      responseModalities: ['Text', 'Image'],
    },
  })

  if (!response.candidates?.[0]?.content?.parts) {
    console.error(`No response parts for ${filename}`)
    return false
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data!, 'base64')
      const outputPath = path.join(OUTPUT_DIR, filename)
      fs.writeFileSync(outputPath, buffer)
      console.log(`  Saved: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`)
      return true
    }
  }

  console.error(`  No image data in response for ${filename}`)
  return false
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  console.log(`Output directory: ${OUTPUT_DIR}`)
  console.log(`Generating ${DIAGRAMS.length} images...\n`)

  let success = 0
  for (const diagram of DIAGRAMS) {
    try {
      const ok = await generateImage(diagram.prompt, diagram.filename)
      if (ok) success++
    } catch (error) {
      console.error(`  Failed: ${diagram.filename}:`, error)
    }
  }

  console.log(`\nDone! ${success}/${DIAGRAMS.length} images generated.`)
}

main()
