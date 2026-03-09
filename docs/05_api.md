# Step 2：API を作ろう（60分）

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

## ① Hono を導入して API ルートを作る（15分）

> **Hono とは？** 軽量で高速な Web フレームワークです。API のルート（URL）を定義して、リクエストを処理するコードを書けます。

Claude Code への指示：

> 「Hono を Next.js の App Router で使いたい。app/api/[[...route]]/route.ts にセットアップして」

→ 生成されたファイルを確認：

- `app/api/[[...route]]/route.ts` — API のエントリーポイント

---

## ② Q&A 一覧取得 API（15分）

Claude Code への指示：

> 「Q&A の一覧を取得する GET API を作って。ページネーション対応で、検索もできるようにして。features/qas/ フォルダにルートとリポジトリを分けて配置して」

### 期待されるリクエスト・レスポンス

**GET** `/api/qas?page=1&limit=10&search=TypeScript`

```json
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

---

## ③ Q&A 作成 API（15分）

Claude Code への指示：

> 「Q&A を新規作成する POST API を作って。Zod でバリデーションして。question、answer、category は必須にして」

### 期待されるリクエスト・レスポンス

**POST** `/api/qas`

リクエスト：

```json
{
  "question": "React とは？",
  "answer": "UI を作るためのライブラリです",
  "category": "programming"
}
```

レスポンス：

```json
{
  "success": true,
  "message": "QA を作成しました",
  "id": "xyz789",
  "isNew": true
}
```

> **Zod とは？** リクエストのデータが正しい形式かチェック（バリデーション）してくれるライブラリです。「question が空だったらエラーにする」といったルールを簡単に定義できます。

> **セキュリティポイント：** Zod でバリデーションすることで、不正なデータや悪意のある入力からアプリを守れます。また Drizzle ORM を経由して DB を操作することで、SQL インジェクション（データベースを壊す攻撃）も防げます。API を作るときは常に「入力を信用しない」が鉄則です。

---

## ④ 動作確認（15分）

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
