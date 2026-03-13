# Step 1：データベースを作ろう（10分）

> **ゴール：** Q&A データを保存するテーブルを Claude Code に作ってもらう

---

## このステップで作るもの

- Drizzle ORM の導入と設定
- Q&A テーブル（ベクトル検索対応）
- マイグレーション（DB への反映）
- サンプルデータの投入

---

## ① Drizzle ORM を導入（2分）

> **[Drizzle ORM](https://orm.drizzle.team) とは？** データベースを TypeScript のコードから操作できるようにするツールです。SQL を直接書かなくても、型安全にデータの読み書きができます。

> 💻 **Claude Code への指示**

```text
Drizzle ORM を導入して。PostgreSQL 用の設定もお願い。drizzle.config.ts も作って。データベースの接続設定は db/database.ts に書いて
```

→ 生成されたファイルを確認：

- `drizzle.config.ts` — Drizzle の設定ファイル
- `db/database.ts` — データベース接続

<details>
<summary>📄 実コードを見る（drizzle.config.ts）</summary>

```typescript:db/drizzle.config.ts
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.dev.vars' })

export default defineConfig({
  schema: './db/schema/_index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  casing: 'snake_case',
  out: './db/migrations/dev',
})
```

</details>

<details>
<summary>📄 実コードを見る（db/database.ts）</summary>

```typescript:db/database.ts
import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { cache } from 'react'
import * as schema from './schema/_index'

// 環境変数から DB 接続文字列を取得（遅延評価）
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('Database URL is not set. Check DATABASE_URL environment variable.')
  }
  return url
}

// 通常のクエリ用 DB クライアント
export const getDB = cache(() => {
  const client = postgres(getDatabaseUrl())
  return drizzle(client, { schema })
})

// トランザクションが必要な処理用
export async function withTransaction<T>(
  callback: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>
): Promise<T> {
  const client = postgres(getDatabaseUrl(), { max: 1 })
  const db = drizzle(client, { schema })
  try {
    return await db.transaction(async (tx) => {
      return await callback(tx as unknown as PostgresJsDatabase<typeof schema>)
    })
  } finally {
    await client.end()
  }
}
```

</details>

---

## ② Q&A テーブルのスキーマを作る（3分）

> **スキーマとは？** データベースのテーブル構造の設計図です。「どんなデータをどんな形で保存するか」を定義します。

> 💻 **Claude Code への指示**

```text
Q&A を保存するテーブルを作って。カラムは：id（nanoid で自動生成）、question（質問文）、answer（回答文）、category（カテゴリ）、embedding（2000次元のベクトル、pgvector 使用）、createdAt、updatedAt。db/schema/qas.ts に作って
```

### 期待されるテーブル構造

| カラム名       | 型              | 説明                                    |
| -------------- | --------------- | --------------------------------------- |
| id             | VARCHAR         | 主キー（nanoid で自動生成）              |
| category       | VARCHAR(100)    | カテゴリ（programming, architecture 等） |
| question       | TEXT            | 質問文                                  |
| answer         | TEXT            | 回答文                                  |
| embedding      | vector(2000)    | ベクトル埋め込み（pgvector）             |
| embeddingModel | VARCHAR(100)    | 使用した埋め込みモデル名                 |
| createdAt      | TIMESTAMP       | 作成日時                                |
| updatedAt      | TIMESTAMP       | 更新日時                                |

> **ベクトル（embedding）って何？**
> テキストを数値の配列に変換したものです。例えば「TypeScript とは？」という質問を `[0.1, 0.3, 0.8, ...]` のような 2000個の数値に変換します。似た意味の文章は似た数値の並びになるので、「意味の近さ」を計算できます。
>
> **なぜ 2000 次元？** Step 3 で使う Gemini の `gemini-embedding-001` モデルが 2000 次元のベクトルを出力するため、データベース側もそれに合わせています。

→ 生成されたスキーマを一緒に読んで解説

<details>
<summary>📄 実コードを見る（db/schema/qas.ts）</summary>

```typescript:db/schema/qas.ts
import { relations } from 'drizzle-orm'
import { index, pgTable, text, varchar, vector } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { timestamps } from '../utils'
import { qaLogs } from './qa-logs'

export const qas = pgTable(
  'qas',
  {
    id: varchar('id')
      .primaryKey()
      .notNull()
      .$defaultFn(() => nanoid())    // ← nanoid で自動生成
      .unique(),

    category: varchar('category', { length: 100 }),
    // 'programming', 'architecture', 'devops', 'debugging', 'security', 'general'

    websiteLink: varchar('website_link', { length: 500 }),

    question: text('question'),
    answer: text('answer'),
    embedding: vector('embedding', { dimensions: 2000 }),  // ← pgvector の 2000 次元ベクトル
    embeddingModel: varchar('embedding_model', { length: 100 }).default('gemini-embedding-001'),

    ...timestamps,  // createdAt, updatedAt を共通ユーティリティから展開
  },
  // HNSW インデックス（コサイン類似度検索を高速化）
  (table) => [index('qas_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops'))],
)

// QA ログとのリレーション定義
export const qasRelations = relations(qas, ({ many }) => ({
  logs: many(qaLogs),
}))
```

</details>

---

## ③ マイグレーション実行（2分）

> **マイグレーションとは？** スキーマの変更をデータベースに実際に反映する作業です。「設計図」を「実物」にするイメージです。

> 💻 **Claude Code への指示**

```text
マイグレーションファイルを生成して実行するスクリプトを package.json に追加して。db:generate と db:migrate と、両方を連続で実行する db:gnm も作って
```

```bash
npm run db:generate && npm run db:migrate
```

→ エラーが出なければ、テーブルがデータベースに作成されている

---

## ④ サンプルデータを入れる（3分）

> 💻 **Claude Code への指示**

```text
シードスクリプトを db/seed.ts に作って。プログラミングに関する Q&A を5件くらい入れたい。例えば『TypeScript の型とは？』みたいな初心者向けの質問。package.json に db:seed スクリプトも追加して
```

### サンプル Q&A の例

| カテゴリ      | 質問                                     | 回答（要約）                                 |
| ------------- | ---------------------------------------- | ------------------------------------------- |
| programming   | TypeScript の型とは？                     | 変数や関数の値の種類を定義する仕組み          |
| programming   | React のコンポーネントとは？              | UI の部品を再利用可能な単位で作る仕組み       |
| architecture  | API とは何ですか？                        | ソフトウェア同士がやり取りするための窓口       |
| debugging     | console.log の使い方は？                  | 変数の値を画面に表示してデバッグする方法       |
| general       | Git とは何ですか？                        | コードの変更履歴を管理するツール              |

```bash
npm run db:seed
```

→ 「5件のデータを挿入しました」のようなメッセージが出ればOK

<details>
<summary>📄 実コードを見る（db/seed.ts + db/seeds/qa.ts）</summary>

```typescript:db/seed.ts
import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/_index'
import { seedQasData } from './seeds/qa'

config({ path: '.dev.vars' })

const databaseUrl = process.env.DATABASE_URL!

async function seed() {
  const client = postgres(databaseUrl)
  const db = drizzle(client, { schema })

  try {
    console.log('Seeding Q&As with translations and embeddings...')
    await seedQasData(db)
    console.log('Seeded Q&As with translations and embeddings')
  } catch (error) {
    console.error('❌ Seed process failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed')
  console.error(err)
  process.exit(1)
})
```

```typescript:db/seeds/qa.ts
import { generateEmbedding } from '@/lib/google-ai'
import { nanoid } from 'nanoid'
import { qas } from '../schema/_index'
import qaData from './qaData.json'

export async function seedQasData(db: any) {
  console.log('❓ Seeding Q&As...')

  // 既存データの件数を確認してスキップ判定
  const existingQas = await db.select().from(qas)
  if (existingQas.length >= totalQas) {
    console.log(`⏭️ ${existingQas.length} Q&As already exist`)
    return
  }

  let totalInserted = 0

  for (const [category, categoryQaList] of Object.entries(qaData)) {
    for (const qa of categoryQaList) {
      const qaId = nanoid()

      // 質問＋回答のテキストを Embedding に変換
      const embeddingText = `${qa.question} ${qa.answer}`
      const embedding = await generateEmbedding(embeddingText)

      // DB に挿入
      await db.insert(qas).values({
        id: qaId,
        category: category,
        question: qa.question,
        answer: qa.answer,
        embedding,
        embeddingModel: 'gemini-embedding-001',
      })

      totalInserted++
    }
  }

  console.log(`✅ Seeded ${totalInserted} Q&As`)
}
```

</details>

---

## 動作確認

> 💻 **Claude Code への指示**

```text
DB にデータが入っているか確認するスクリプトを書いて実行して
```

→ 登録した Q&A データが表示されれば **Step 1 完了！**

---

## このステップで伝えること

> **「わからない技術用語があったら、そのまま Claude Code に聞いて OK。『pgvector って何？』と聞けば教えてくれます」**

---

## トラブルシューティング

| 症状                              | 原因                          | 対処法                                              |
| --------------------------------- | ----------------------------- | --------------------------------------------------- |
| DB 接続エラー                     | DATABASE_URL の設定ミス         | `.env.local` の接続文字列を確認、Neon ダッシュボードで DB 状態を確認 |
| マイグレーションエラー            | スキーマの文法エラー           | エラーメッセージを Claude Code に貼り付けて修正       |
| pgvector 関連のエラー             | pgvector 拡張が有効でない      | Claude Code に「pgvector 拡張を有効にして」と依頼     |

---

> 次は [05_api.md](./05_api.md) で、データベースのデータを操作する API を作ります。
