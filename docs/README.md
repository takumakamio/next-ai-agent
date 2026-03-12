# Claude Code で喋る AI アバターを作ろう（90分）

## 研修概要

| 項目         | 内容                                                             |
| ------------ | ---------------------------------------------------------------- |
| **成果物**   | AI メンター「つむぎ」とチャットできる Web アプリ                    |
| **対象者**   | プログラミング初心者〜少し触ったことがある方                       |
| **所要時間** | 90分（15:00 〜 16:30）                                            |
| **コンセプト** | **「自分でコードは書かない。Claude Code に指示を出してアプリを作る」** |

---

## タイムテーブル

| 時間          | Step         | 内容                                   | 資料                                                 |
| ------------- | ------------ | -------------------------------------- | ---------------------------------------------------- |
| 15:00 - 15:05 |              | 研修概要                                | [README.md](./README.md)                             |
| 15:05 - 15:10 |              | 研修で理解できるようになること           | [00_learning-outcomes.md](./00_learning-outcomes.md)  |
| 15:10 - 15:15 |              | このアプリの概要                        | [app-overview.md](./app-overview.md)                 |
| 15:15 - 15:20 |              | この研修で使う技術を知ろう              | [01_tech-overview.md](./01_tech-overview.md)          |
| 15:20 - 15:25 | **Step 0**   | Claude Code の使い方を覚えよう          | [03_claude-code-intro.md](./03_claude-code-intro.md) |
| 15:25 - 15:40 | **Step 1**   | データベースを作ろう                    | [04_database.md](./04_database.md)                   |
| 15:40 - 15:50 | **Step 2**   | API を作ろう                            | [05_api.md](./05_api.md)                             |
| 15:50 - 16:05 | **Step 3**   | AI と会話できるようにしよう              | [06_ai-conversation.md](./06_ai-conversation.md)     |
| 16:05 - 16:15 | **Step 4**   | 画面を作ろう                            | [07_frontend.md](./07_frontend.md)                   |
| 16:15 - 16:25 | **Step 5**   | 仕上げ & 振り返り                       | [09_finishing.md](./09_finishing.md)                  |
| 16:25 - 16:30 | **Step 6**   | 実践チャレンジ：チャット要約機能        | [08_hands-on-challenge.md](./08_hands-on-challenge.md) |

---

## 技術スタック

| カテゴリ         | 技術                          |
| ---------------- | ----------------------------- |
| フレームワーク   | Next.js / React / TypeScript  |
| API サーバー     | Hono                          |
| データベース     | PostgreSQL（pgvector）         |
| ORM              | Drizzle ORM                   |
| AI               | Google Gemini（会話 + Embedding） |
| UI               | Tailwind CSS / shadcn/ui      |
| パッケージ管理   | npm                           |
| AI アシスタント  | Claude Code                   |

---

## 講師向け：事前準備チェックリスト

```
[ ] Neon のデータベース接続文字列を受講者分用意（共有 or 個別）
[ ] Google AI API キーを用意（共有キー推奨）
[ ] 完成版リポジトリ（https://github.com/takumakamio/next-ai-agent.git）の動作確認
[ ] 受講者 PC に VS Code / Node.js / Git がインストール済みか確認
[ ] Wi-Fi 環境の確認（API 通信が必要）
[ ] 各 Step の「期待される動作」をスクリーンショットで用意
```

---

## 初心者がつまづきやすいポイント & 対策

| つまづき                         | よくある原因                   | 対策                                                 |
| -------------------------------- | ------------------------------ | ---------------------------------------------------- |
| API キーエラー                   | `.env.local` の記述ミス         | Claude Code に「.env.local を確認して」と指示         |
| DB 接続エラー                    | DATABASE_URL の設定ミス         | `.env.local` の接続文字列を確認、Neon ダッシュボードで確認 |
| Claude Code の回答が長すぎて混乱 | 指示が曖昧                     | **「まず○○だけ作って」** と範囲を絞る指示を教える     |
| 型エラーが大量に出る             | 依存関係の不足                 | エラーをそのまま貼り付けて修正依頼                     |

---

## ファイル一覧

```
docs/
├── README.md                  ← この文書（研修概要）
├── 00_learning-outcomes.md    ← 研修で理解できるようになること
├── 01_tech-overview.md        ← この研修で使う技術を知ろう
├── 02_pre-setup.md            ← 事前セットアップ手順
├── 03_claude-code-intro.md    ← Step 0: Claude Code 入門
├── 04_database.md             ← Step 1: データベース構築
├── 05_api.md                  ← Step 2: API 構築
├── 06_ai-conversation.md      ← Step 3: AI 会話機能
├── 07_frontend.md             ← Step 4: フロントエンド
├── 09_finishing.md            ← Step 5: 仕上げ & 振り返り
└── 08_hands-on-challenge.md   ← Step 6: 実践チャレンジ
```
