# Step 1：データベースを作ろう（60分）

> **ゴール：** Q&A データを保存するテーブルを Claude Code に作ってもらう

---

## このステップで作るもの

- Drizzle ORM の導入と設定
- Q&A テーブル（ベクトル検索対応）
- マイグレーション（DB への反映）
- サンプルデータの投入

---

## ① Drizzle ORM を導入（10分）

> **Drizzle ORM とは？** データベースを TypeScript のコードから操作できるようにするツールです。SQL を直接書かなくても、型安全にデータの読み書きができます。

Claude Code への指示：

> 「Drizzle ORM を導入して。PostgreSQL 用の設定もお願い。drizzle.config.ts も作って。データベースの接続設定は db/database.ts に書いて」

→ 生成されたファイルを確認：

- `drizzle.config.ts` — Drizzle の設定ファイル
- `db/database.ts` — データベース接続

---

## ② Q&A テーブルのスキーマを作る（20分）

> **スキーマとは？** データベースのテーブル構造の設計図です。「どんなデータをどんな形で保存するか」を定義します。

Claude Code への指示：

> 「Q&A を保存するテーブルを作って。カラムは：id（nanoid で自動生成）、question（質問文）、answer（回答文）、category（カテゴリ）、embedding（2000次元のベクトル、pgvector 使用）、createdAt、updatedAt。db/schema/qas.ts に作って」

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

→ 生成されたスキーマを一緒に読んで解説

---

## ③ マイグレーション実行（10分）

> **マイグレーションとは？** スキーマの変更をデータベースに実際に反映する作業です。「設計図」を「実物」にするイメージです。

Claude Code への指示：

> 「マイグレーションファイルを生成して実行するスクリプトを package.json に追加して。db:generate と db:migrate と、両方を連続で実行する db:gnm も作って」

```bash
npm run db:generate && npm run db:migrate
```

→ エラーが出なければ、テーブルがデータベースに作成されている

---

## ④ サンプルデータを入れる（20分）

Claude Code への指示：

> 「シードスクリプトを db/seed.ts に作って。プログラミングに関する Q&A を5件くらい入れたい。例えば『TypeScript の型とは？』みたいな初心者向けの質問。package.json に db:seed スクリプトも追加して」

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

---

## 動作確認

Claude Code への指示：

> 「DB にデータが入っているか確認するスクリプトを書いて実行して」

→ 登録した Q&A データが表示されれば **Step 1 完了！**

---

## このステップで伝えること

> **「わからない技術用語があったら、そのまま Claude Code に聞いて OK。『pgvector って何？』と聞けば教えてくれます」**

---

## トラブルシューティング

| 症状                              | 原因                          | 対処法                                              |
| --------------------------------- | ----------------------------- | --------------------------------------------------- |
| DB 接続エラー                     | Docker コンテナが起動していない | `docker ps` で確認、`docker compose up -d` を再実行 |
| マイグレーションエラー            | スキーマの文法エラー           | エラーメッセージを Claude Code に貼り付けて修正       |
| pgvector 関連のエラー             | pgvector 拡張が有効でない      | Claude Code に「pgvector 拡張を有効にして」と依頼     |
