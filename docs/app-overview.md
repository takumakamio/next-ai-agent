# このアプリの概要（5分）

> この研修で作るのは、**AI メンターと会話できる Web アプリ** です。
> ここでは完成形の全体像を紹介します。「最終的にこうなるんだ」というゴールをイメージしてから研修に臨みましょう。
>
> **補足：** 完成版アプリには以下の機能が **事前に実装済み** です。研修では DB → API → AI 会話 → UI を中心に進めます。
> - 3D アバター（VRM/GLB モデル表示・リップシンク・表情制御）
> - 音声入出力（TTS: 音声合成 / STT: 音声認識）
> - QA ログ（会話履歴の自動保存・閲覧）

---

## このアプリができること

| できること | 説明 |
| --- | --- |
| AI とテキストで会話 | 質問を入力すると、登録済み Q&A をもとに AI が回答 |
| AI と音声で会話 | マイクで話しかけると音声認識 → AI 回答 → 音声合成で返答 |
| 3D アバターが喋る | AI の回答に合わせてアバター「春日部つむぎ」がリップシンク＆表情変化 |
| Q&A ナレッジ管理 | AI が参照する Q&A データの一覧・追加・削除 |
| ベクトル検索（RAG） | 質問の「意味の近さ」で関連 Q&A を自動検索し、回答の精度を向上 |
| 会話ログの確認 | ユーザーと AI の過去の会話履歴を閲覧・フィードバック |
| API ドキュメント自動生成 | `/api/scalar` でインタラクティブな API リファレンスを閲覧・テスト |

---

## 完成イメージ

![アプリの完成イメージ](/docs/app-ui-mockup.png)

---

## 主な機能

### 1. AI チャット（メイン機能）

テキストを入力すると AI が回答してくれます。ただの AI チャットではなく、**事前に登録した Q&A データを参考にして** 回答します。

```
あなた: 「React のコンポーネントって何？」
    ↓
🔍 登録済みの Q&A から意味が近いものを自動検索（ベクトル検索）
    ↓
📝 見つかった Q&A を参考情報として Gemini AI に渡す
    ↓
🤖 AI が Q&A の内容を踏まえた回答を生成
```

> **ポイント：** この仕組みを **RAG（Retrieval-Augmented Generation）** と呼びます。AI が「知らないこと」でも、データベースに情報があれば正確に答えられるようになります。

<details>
<summary>📄 実コードを見る（RAG の中核処理 — conversation.ts 抜粋）</summary>

```typescript:features/home/routes/conversation.ts
// ① ユーザーの質問をベクトル化して関連 Q&A を検索
const relevantQAs = await searchRelevantQAs(question, requestLocale, 3)

// ② コンテキストを構築
const historyContext = limitedHistory.length > 0 ? buildConversationContext(limitedHistory) : ''
const qaContext = relevantQAs.length > 0 ? buildQAContext(relevantQAs) : ''
const fullPrompt = `${baseSystemPrompt}${historyContext}${qaContext}\n\n${userMessage}`

// ③ Gemini API で回答を生成
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
const response = await ai.models.generateContent({ model: aiModel, contents: fullPrompt })
```

```typescript:features/home/routes/conversation.ts
// ベクトル検索の核心部分
async function searchRelevantQAs(question: string, locale: string, limit = 5) {
  const questionEmbedding = await generateEmbedding(question)
  const embeddingString = `[${questionEmbedding.join(',')}]`

  const qaResults = await db
    .select({
      id: qas.id, question: qas.question, answer: qas.answer,
      similarity: sql`1 - (${qas.embedding} <=> ${embeddingString}::vector)`,  // コサイン類似度
    })
    .from(qas)
    .where(sql`${qas.embedding} IS NOT NULL`)
    .orderBy(desc(sql`1 - (${qas.embedding} <=> ${embeddingString}::vector)`))
    .limit(limit)

  return qaResults.filter((qa) => qa.similarity > 0.65)  // 類似度 0.65 以上のみ
}
```

</details>

### 2. 3D アバター「春日部つむぎ」（※ 事前実装済み）

AI の回答に合わせて 3D キャラクター「つむぎ」が動きます。

「春日部つむぎ」は [VOICEVOX](https://voicevox.hiroshiba.jp/) のキャラクターです。VOICEVOX は無料で使える高品質な音声合成ソフトウェアで、つむぎはその中でも人気の高いキャラクターです。

| 機能             | 説明                                              |
| ---------------- | ------------------------------------------------- |
| リップシンク     | AI が喋るときに口が動く                            |
| 表情変化         | 会話の内容に合わせて表情が変わる                    |
| 待機アニメーション | 何もしていないときもゆらゆら動く                    |
| モデル切り替え   | VRM（高機能）と GLB（シンプル）の2形式に対応       |

### 3. Q&A 管理

AI が参照するナレッジデータを管理する画面です。

- Q&A の **一覧表示**（テーブル形式・検索・ページネーション）
- Q&A の **新規作成**（質問・回答・カテゴリを入力）
- Q&A の **削除**

> 登録した Q&A は自動でベクトル化され、チャット時の検索対象になります。

### 4. QA ログ

ユーザーと AI の会話履歴を確認できる画面です。どんな質問がされたか、AI がどう答えたかを振り返れます。

---

## アーキテクチャ全体像

![アーキテクチャ全体像](/docs/architecture-overview.png)

---

## ディレクトリ構成

研修で主に触るファイルの場所です。

```
next-ai-agent/
├── app/                          # ページとAPIルート
│   ├── page.tsx                  #   トップページ（チャット画面）
│   └── api/
│       └── [[...route]]/
│           └── route.ts          #   全APIのエントリーポイント
│
├── features/                     # 機能ごとのモジュール
│   ├── home/                     #   チャット・会話機能
│   │   ├── components/           #     UI コンポーネント
│   │   └── routes/               #     conversation / tts / stt API
│   ├── qas/                      #   Q&A 管理機能
│   │   ├── components/           #     テーブル・フォーム
│   │   ├── routes/               #     CRUD API
│   │   ├── repositories/         #     DB 操作
│   │   └── schema.ts             #     バリデーション定義
│   └── qa-logs/                  #   QA ログ機能
│
├── db/                           # データベース関連
│   ├── schema/                   #   テーブル定義
│   ├── migrations/               #   マイグレーションファイル
│   └── seed.ts                   #   サンプルデータ投入
│
├── lib/                          # 共通ユーティリティ
│   ├── google-ai.ts              #   Gemini API クライアント
│   └── vrm/                      #   3D モデル関連
│
├── components/ui/                # shadcn/ui コンポーネント
└── hooks/                        # React カスタムフック
```

> **features/ フォルダのパターン：** 機能ごとに `components/`、`routes/`、`repositories/`、`schema.ts` を持つ構成です。「どこに何があるか」が分かりやすくなっています。

<details>
<summary>📄 実コードを見る（主要ファイルのコード）</summary>

**API エントリーポイント** — Hono を Next.js App Router に統合

```typescript:app/api/[[...route]]/route.ts
const app = new OpenAPIHono<{ Variables: Bindings }>({ defaultHook: createDefaultHook() })

// 各 feature のルートを登録
const appRouter = app
  .route('/', homeRoutes)    // conversation / tts / stt
  .route('/', qaRoutes)      // QA CRUD
  .route('/', qaLogRoutes)   // QA ログ

// Next.js App Router 用のハンドラをエクスポート
export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

// フロントエンドの RPC クライアント用型
export type AppType = typeof appRouter
```

**RPC クライアント** — フロントエンドから型安全に API を呼ぶ

```typescript:lib/rpc.ts
import type { AppType } from '@/app/api/[[...route]]/route'
import { hc } from 'hono/client'

export const rpc = hc<AppType>('/')
// 使い方: const res = await rpc.api.qas.$get({ query: { page: 1 } })
```

**Gemini API クライアント** — Embedding 生成

```typescript:lib/google-ai.ts
export async function generateEmbedding(text: string): Promise<number[]> {
  const ai = new GoogleGenAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
    config: { outputDimensionality: 2000 },
  })
  return response.embeddings[0].values as number[]
}
```

</details>

---

## 研修で作る順番

| Step | やること                | 何ができるようになるか                 |
| ---- | ---------------------- | -------------------------------------- |
| 0    | Claude Code を覚える    | AI に指示を出してコードを生成できる      |
| 1    | データベースを作る       | Q&A データを保存できる                  |
| 2    | API を作る              | データの取得・作成・削除ができる         |
| 3    | AI と会話する           | 質問に対して AI が回答を返す             |
| 4    | 画面を作る              | ブラウザでチャットと QA 管理ができる     |
| 5    | 仕上げ & 振り返り       | アプリ全体が動く完成形ができる           |
| 6    | 実践チャレンジ          | 自分の力で新機能（要約）を追加できる     |

> 各ステップは前のステップの成果物の上に積み重ねていきます。**Step 1 〜 4 で基盤を作り、Step 5 で仕上げ、Step 6 で応用する** という流れです。

---

> 次は [01_tech-overview.md](./01_tech-overview.md) で、使う技術それぞれについて詳しく見ていきましょう。
