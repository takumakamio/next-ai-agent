# Step 2：API を作ろう（15分）

> **ゴール：** Q&A データの取得・作成・削除ができる API を作る

---

## このステップで作るもの

- Next.js App Router + Hono の統合
- Q&A 一覧取得 API（GET）
- Q&A 単件取得 API（GET by ID）
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

> **[Hono](https://hono.dev) とは？** 軽量で高速な Web フレームワークです。API のルート（URL）を定義して、リクエストを処理するコードを書けます。

> 💻 **Claude Code への指示**

```text
Hono を Next.js の App Router で使いたい。app/api/[[...route]]/route.ts にセットアップして
```

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

> 💻 **Claude Code への指示**

```text
Q&A の一覧を取得する GET API を作って。ページネーション対応で、検索もできるようにして。features/qas/ フォルダにルートとリポジトリを分けて配置して
```

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
    tags: ['Q&A 管理'],
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

## ③ Q&A 単件取得 API（1分）

一覧だけでなく、ID を指定して 1 件だけ取得する API も作ります。編集画面でデータを読み込むときに使います。

> 💻 **Claude Code への指示**

```text
Q&A を ID 指定で 1 件取得する GET API も作って。パスパラメータで ID を受け取って、見つからなければ 404 を返して
```

### 期待されるリクエスト・レスポンス

**GET** `/api/qas/{id}`

```json:features/qas/routes/get-id.ts
{
  "id": "abc123",
  "category": "programming",
  "question": "TypeScriptの型とは？",
  "answer": "変数や関数の値の種類を定義する仕組みです...",
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

<details>
<summary>📄 実コードを見る（get-id.ts — Q&A 単件取得 API）</summary>

```typescript:features/qas/routes/get-id.ts
export const getId = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'get',
    path: '/api/qas/{id}',
    tags: ['Q&A 管理'],
    summary: 'Q&A 単体取得',
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: { description: '取得成功', content: { 'application/json': { schema: selectQaSchema } } },
      404: { description: '見つかりません' },
    },
  }),
  async (c) => {
    const { id } = c.req.param()
    const locale = c.get('locale')
    const data = await getQaById(id, locale)

    if (!data) {
      return c.json({ error: 'Not found' }, 404)
    }

    return c.json(data, 200)
  },
)
```

</details>

---

## ④ Q&A 作成 API（2分）

> 💻 **Claude Code への指示**

```text
Q&A を新規作成する POST API を作って。Zod でバリデーションして。question、answer、category は必須にして
```

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

> **[Zod](https://zod.dev) とは？** リクエストのデータが正しい形式かチェック（バリデーション）してくれるライブラリです。「question が空だったらエラーにする」といったルールを簡単に定義できます。

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
    tags: ['Q&A 管理'],
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

## ⑤ Q&A 削除 API（2分）

> 💻 **Claude Code への指示**

```text
Q&A を ID 指定で削除する DELETE API を作って。パスパラメータで ID を受け取って、見つからなければ 404 を返して
```

### 期待されるリクエスト・レスポンス

**DELETE** `/api/qas/{id}`

レスポンス（成功時）：

```json:features/qas/routes/delete.ts
{
  "success": true,
  "message": "Q&A deleted"
}
```

レスポンス（見つからない場合）：

```json:features/qas/routes/delete.ts
{
  "success": false,
  "message": "Q&A not found"
}
```

<details>
<summary>📄 実コードを見る（delete.ts — Q&A 削除 API）</summary>

```typescript:features/qas/routes/delete.ts
import { deleteQa } from '@/features/qas/repositories'
import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

export const deleteRoute = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'delete',
    path: '/api/qas/{id}',
    tags: ['Q&A 管理'],
    summary: 'Q&A の削除',
    request: {
      params: z.object({ id: z.string() }),  // ← URL パスから ID を取得
    },
    responses: {
      200: { description: 'Q&A の削除に成功' },
      404: { description: '見つかりません' },
      500: { description: 'サーバー内部エラー' },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    const result = await deleteQa({ id })

    if (!result.success) {
      return c.json({ success: false, message: 'Q&A not found' }, 404)
    }

    return c.json({ success: true, message: 'Q&A deleted' })
  },
)
```

</details>

### ルートの登録

作成した各ルート（GET / POST / DELETE）は `features/qas/routes/index.ts` で1つにまとめて登録します。

<details>
<summary>📄 実コードを見る（routes/index.ts — ルート登録）</summary>

```typescript:features/qas/routes/index.ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { getList } from './get-list'
import { getId } from './get-id'
import { create } from './create'
import { deleteRoute } from './delete'

export const qaRoutes = new OpenAPIHono<{ Variables: Bindings }>()
  .route('/', getList)       // GET    /api/qas
  .route('/', getId)         // GET    /api/qas/{id}
  .route('/', create)        // POST   /api/qas
  .route('/', deleteRoute)   // DELETE /api/qas/{id}
```

</details>

> **ポイント：** 新しい API ルートを作ったら、必ず `routes/index.ts` に登録してください。登録しないとアクセスできません。

---

## ⑥ 動作確認（3分）

> 💻 **Claude Code への指示**

```text
今作った API の動作確認を curl コマンドで試したい。一覧取得と新規作成の curl コマンドを教えて
```

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

### API ドキュメントをブラウザで見てみよう（Scalar）

実は、ここまでで作った API には **自動生成されたドキュメント** が付いています。ブラウザで以下の URL を開いてみましょう：

```
http://localhost:3000/api/scalar
```

> **実際にアクセスしてみましょう！** 上の URL をブラウザで開くと、今まで作った API の一覧がきれいな UI で表示されます。

**[Scalar](https://scalar.com)** は [OpenAPI](https://www.openapis.org) 仕様から自動生成される、インタラクティブな API ドキュメントです。

| できること | 説明 |
| --- | --- |
| API 一覧の確認 | 全エンドポイントがカテゴリ別に一覧表示される |
| リクエスト・レスポンスの確認 | 各 API のパラメータ、ボディ、レスポンスの形式が見える |
| その場で API を試す | 画面上からリクエストを送信して、実際のレスポンスを確認できる |
| スキーマの確認 | Zod で定義したバリデーションルールが自動で反映される |

> **なぜドキュメントが自動生成されるの？**
>
> Hono の `OpenAPIHono` + `createRoute()` でルートを定義すると、`tags`、`summary`、`description`、`schema` などの情報が **OpenAPI 仕様（swagger.json）** として自動出力されます。Scalar はこの JSON を読み取って、きれいな UI を生成してくれます。
>
> つまり、**コードを書くだけでドキュメントも同時に完成** するということです。

### 仕組み

```
コード内の createRoute() 定義
    ↓
自動生成: /api/swagger.json （OpenAPI 3.1 仕様）
    ↓
Scalar が読み込んで UI を生成: /api/scalar
```

<details>
<summary>📄 実コードを見る（Scalar の設定部分）</summary>

```typescript:app/api/[[...route]]/route.ts
import { apiReference } from '@scalar/hono-api-reference'

// OpenAPI 仕様の JSON を自動生成
app.doc31('/api/swagger.json', {
  openapi: '3.1.0',
  info: {
    title: APP_TITLE,
    version: '1.0.0',
  },
})

// Scalar UI を /api/scalar で提供
app.get(
  '/api/scalar',
  apiReference({
    spec: {
      url: '/api/swagger.json',
    },
  }),
)
```

</details>

> **ポイント：** API を新しく追加するたびに、Scalar のドキュメントも自動で更新されます。開発中に「この API のパラメータって何だっけ？」と思ったら、いつでも `/api/scalar` を開けば確認できます。

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

---

> 次は [06_ai-conversation.md](./06_ai-conversation.md) で、AI と会話できる機能を作ります。
