# Step 2：API を作ろう（10分）

> **ゴール：** Q&A データの取得・作成・削除ができる API を作る

---

## このステップで作るもの

- Next.js App Router + Hono の統合
- Q&A 一覧取得 API（GET）
- Q&A 作成 API（POST）
- Q&A 削除 API（DELETE）
- curl での動作確認

---

## API とは？（初心者向け解説）

> **API** は「アプリの裏側にある窓口」です。
>
> - **画面（フロントエンド）** →「Q&A の一覧をください」→ **API** → データベースから取得して返す
> - **画面（フロントエンド）** →「この Q&A を保存して」→ **API** → データベースに保存する
>
> 今回は **Hono** というフレームワークを使って API を作ります。

---

## ① Hono を導入して API ルートを作る（3分）

> **Hono とは？** 軽量で高速な Web フレームワークです。API のルート（URL）を定義して、リクエストを処理するコードを書けます。

Claude Code への指示：

> 「Hono を Next.js の App Router で使いたい。app/api/[[...route]]/route.ts にセットアップして」

→ 生成されたファイルを確認：

- `app/api/[[...route]]/route.ts` — API のエントリーポイント

<details>
<summary>📄 実コードを見る（API エントリーポイント）</summary>

```typescript:app/api/[[...route]]/route.ts
import { homeRoutes } from '@/features/home/routes'
import { qaLogRoutes } from '@/features/qa-logs/routes'
import { qaRoutes } from '@/features/qas/routes'
import type { Bindings } from '@/type'
import { OpenAPIHono } from '@hono/zod-openapi'
import { handle } from 'hono/vercel'

const app = new OpenAPIHono<{ Variables: Bindings }>({
  defaultHook: createDefaultHook(),
})

// ミドルウェア設定
app.use(printLogger)
app.use(customLoggerMiddleware)
app.use(csrf({ origin: ROOT_URL }))
app.use(cors({ origin: [ROOT_URL], credentials: true }))

// ロケール設定
app.use(async (c, next) => {
  c.set('locale', 'ja')
  return next()
})

// OpenAPI ドキュメント（Scalar UI で閲覧可能）
app.doc31('/api/swagger.json', { openapi: '3.1.0', info: { title: APP_TITLE, version: '1.0.0' } })
app.get('/api/scalar', apiReference({ spec: { url: '/api/swagger.json' } }))

// ルート登録 — 各 feature のルートをまとめて登録
const appRouter = app
  .route('/', homeRoutes)    // conversation / tts / stt
  .route('/', qaRoutes)      // QA CRUD
  .route('/', qaLogRoutes)   // QA ログ

// Next.js App Router 用のハンドラをエクスポート
export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

// RPC クライアント用の型エクスポート
export type AppType = typeof appRouter
```

</details>

---

## ② Q&A 一覧取得 API（2分）

Claude Code への指示：

> 「Q&A の一覧を取得する GET API を作って。ページネーション対応で、検索もできるようにして。features/qas/ フォルダにルートとリポジトリを分けて配置して」

### 期待されるリクエスト・レスポンス

**GET** `/api/qas?page=1&limit=10&search=TypeScript`

```json:features/qas/routes/get-list.ts
{
  "data": [
    {
      "id": "abc123",
      "category": "programming",
      "question": "TypeScriptの型とは？",
      "answer": "変数や関数の値の種類を定義する仕組みです...",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### ファイル構成

```
features/qas/
├── routes/          # APIルート定義
│   └── index.ts
├── repositories/    # DB操作（データアクセス層）
│   └── index.ts
└── schema.ts        # Zodスキーマ（バリデーション）
```

> **なぜファイルを分けるの？**
>
> - `routes/` → 「どの URL でどんなリクエストを受け付けるか」を定義
> - `repositories/` → 「データベースとのやり取り」を担当
> - `schema.ts` → 「リクエストやレスポンスのデータ形式」を定義
>
> 役割ごとに分けておくと、後から修正・拡張しやすくなります。

<details>
<summary>📄 実コードを見る（ルート定義 — get-list.ts）</summary>

```typescript:features/qas/routes/get-list.ts
import { getQasList } from '@/features/qas/repositories'
import { selectQaSchema } from '@/features/qas/schema'
import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

// クエリパラメータのバリデーション
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(100),
  search: z.string().optional(),
})

// レスポンスのスキーマ
const paginatedResponseSchema = z.object({
  data: selectQaSchema.array(),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export const getList = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'get',
    path: '/api/qas',
    tags: ['Manage qa'],
    summary: 'Get qas list with pagination and search',
    request: { query: querySchema },
    responses: { 200: { description: 'Success', content: { 'application/json': { schema: paginatedResponseSchema } } } },
  }),
  async (c) => {
    const locale = c.get('locale')
    const { page, limit, search } = c.req.valid('query')
    const result = await getQasList({ locale, page, limit, search })
    return c.json(result, 200)
  },
)
```

</details>

<details>
<summary>📄 実コードを見る（リポジトリ — repositories/get-list.ts）</summary>

```typescript:features/qas/repositories/get-list.ts
import { count, desc, getDB, ilike, or } from '@/db'
import { qas } from '@/db/schema/_index'

export async function getQasList(options: GetQasListOptions): Promise<GetQasListResult> {
  const db = getDB()
  const { locale, page, limit, search } = options
  const offset = (page - 1) * limit

  if (search) {
    const searchPattern = `%${search}%`
    const whereConditions = or(
      ilike(qas.id, searchPattern),
      ilike(qas.question, searchPattern),
      ilike(qas.answer, searchPattern),
    )

    const [countResult] = await db.select({ total: count() }).from(qas).where(whereConditions)
    const qasData = await db
      .select({ id: qas.id, category: qas.category, question: qas.question, answer: qas.answer, /* ... */ })
      .from(qas)
      .where(whereConditions)
      .orderBy(desc(qas.createdAt))
      .limit(limit)
      .offset(offset)

    return { data: qasData, meta: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) } }
  }

  // 検索なしの場合
  const [countResult] = await db.select({ total: count() }).from(qas)
  const qasData = await db.select({ /* ... */ }).from(qas).orderBy(desc(qas.createdAt)).limit(limit).offset(offset)

  return { data: qasData, meta: { page, limit, total: countResult.total, totalPages: Math.ceil(countResult.total / limit) } }
}
```

</details>

<details>
<summary>📄 実コードを見る（Zod スキーマ — schema.ts）</summary>

```typescript:features/qas/schema.ts
import { qas } from '@/db/schema/_index'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

const categories = ['programming', 'architecture', 'devops', 'debugging', 'security', 'general'] as const

// DB から取得した QA のスキーマ（レスポンス用）
export const selectQaSchema = createSelectSchema(qas).extend({
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]).nullable(),
  category: z.enum(categories),
  question: z.string().optional(),
  answer: z.string().optional(),
  embedding: z.array(z.number()).nullable().optional(),
})

// QA 作成・更新のスキーマ（リクエスト用 — Zod バリデーション）
export const insertQaSchema = createInsertSchema(qas, {
  category: z.enum(categories),
}).extend({
  question: z.string({ required_error: 'Question is required' }).min(1).max(1000),
  answer: z.string({ required_error: 'Answer is required' }).min(1),
  locale: z.string(),
  websiteLink: z.string().url().optional().or(z.literal('')),
})

export type SelectQa = z.infer<typeof selectQaSchema>
export type InsertQa = z.infer<typeof insertQaSchema>
```

</details>

---

## ③ Q&A 作成 API（2分）

Claude Code への指示：

> 「Q&A を新規作成する POST API を作って。Zod でバリデーションして。question、answer、category は必須にして」

### 期待されるリクエスト・レスポンス

**POST** `/api/qas`

リクエスト：

```json:features/qas/routes/create.ts
{
  "question": "React とは？",
  "answer": "UI を作るためのライブラリです",
  "category": "programming"
}
```

レスポンス：

```json:features/qas/routes/create.ts
{
  "success": true,
  "message": "QA を作成しました",
  "id": "xyz789",
  "isNew": true
}
```

> **Zod とは？** リクエストのデータが正しい形式かチェック（バリデーション）してくれるライブラリです。「question が空だったらエラーにする」といったルールを簡単に定義できます。

> **セキュリティポイント：** Zod でバリデーションすることで、不正なデータや悪意のある入力からアプリを守れます。また Drizzle ORM を経由して DB を操作することで、SQL インジェクション（データベースを壊す攻撃）も防げます。API を作るときは常に「入力を信用しない」が鉄則です。

<details>
<summary>📄 実コードを見る（create.ts — Q&A 作成 API）</summary>

```typescript:features/qas/routes/create.ts
import { createQa, updateQa } from '@/features/qas/repositories'
import { insertQaSchema } from '@/features/qas/schema'
import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

export const create = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'post',
    path: '/api/qas',
    tags: ['Manage QA'],
    summary: 'Create or update a Q&A',
    request: {
      body: {
        content: { 'application/json': { schema: insertQaSchema } },  // ← Zod でバリデーション
      },
    },
    responses: {
      200: { description: 'QA created/updated successfully', /* ... */ },
      400: { description: 'Bad Request' },
      500: { description: 'Internal Server Error' },
    },
  }),
  async (c) => {
    const data = c.req.valid('json')  // ← Zod バリデーション済みデータ

    if (data.id) {
      // 既存 QA の更新
      const result = await updateQa(data)
      return c.json({ success: true, message: 'Q&A updated successfully', id: result.id, isNew: false })
    } else {
      // 新規 QA の作成
      const result = await createQa(data)
      return c.json({ success: true, message: 'Q&A created successfully', id: result.id, isNew: true })
    }
  },
)
```

</details>

---

## ④ 動作確認（3分）

Claude Code への指示：

> 「今作った API の動作確認を curl コマンドで試したい。一覧取得と新規作成の curl コマンドを教えて」

### 一覧取得

```bash
curl http://localhost:3000/api/qas
```

→ シードで入れた Q&A データが JSON で返ってくればOK

### 新規作成

```bash
curl -X POST http://localhost:3000/api/qas \
  -H "Content-Type: application/json" \
  -d '{"question":"React とは？","answer":"UI を作るためのライブラリです","category":"programming"}'
```

→ `{"success": true, ...}` が返ってくればOK

### もう一度一覧取得して確認

```bash
curl http://localhost:3000/api/qas
```

→ 先ほど追加した「React とは？」が含まれていれば **Step 2 完了！**

---

## このステップで伝えること

> **「うまく動かないときは、エラーメッセージをそのまま Claude Code に貼り付ければ直してくれます」**

---

## トラブルシューティング

| 症状                       | 原因                         | 対処法                                       |
| -------------------------- | ---------------------------- | -------------------------------------------- |
| 404 Not Found              | ルートの設定ミス              | Claude Code に「API ルートを確認して」と依頼   |
| 500 Internal Server Error  | DB 接続エラーやコードのバグ   | エラーログを Claude Code に貼り付けて修正      |
| JSON パースエラー           | リクエストの形式が正しくない  | `Content-Type: application/json` を確認       |
| バリデーションエラー        | 必須項目が欠けている          | リクエストボディに必須項目が含まれているか確認  |
