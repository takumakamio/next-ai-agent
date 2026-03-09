# Claude Code 1日研修：AI チャットアプリを作ろう

## 研修概要

| 項目         | 内容                                                             |
| ------------ | ---------------------------------------------------------------- |
| **成果物**   | AI メンター「つむぎ」とチャットできる Web アプリ                    |
| **対象者**   | プログラミング初心者〜少し触ったことがある方                       |
| **所要時間** | 1日（約7時間・休憩込み）                                          |
| **コンセプト** | **「自分でコードは書かない。Claude Code に指示を出してアプリを作る」** |

---

## タイムテーブル

| 時間          | Step       | 内容                             | 資料                                               |
| ------------- | ---------- | -------------------------------- | -------------------------------------------------- |
| 事前          | Pre-Step   | 環境構築（VS Code, Node.js, Docker 等） | [00_pre-setup.md](./00_pre-setup.md)            |
| 9:00 - 9:45   | **Step 0** | Claude Code の使い方を覚えよう     | [01_claude-code-intro.md](./01_claude-code-intro.md) |
| 9:45 - 10:00  |            | 休憩                             |                                                    |
| 10:00 - 11:00 | **Step 1** | データベースを作ろう               | [02_database.md](./02_database.md)                 |
| 11:00 - 11:15 |            | 休憩                             |                                                    |
| 11:15 - 12:15 | **Step 2** | API を作ろう                      | [03_api.md](./03_api.md)                           |
| 12:15 - 13:15 |            | 昼休憩                           |                                                    |
| 13:15 - 14:15 | **Step 3** | AI と会話できるようにしよう        | [04_ai-conversation.md](./04_ai-conversation.md)   |
| 14:15 - 14:30 |            | 休憩                             |                                                    |
| 14:30 - 15:45 | **Step 4** | 画面を作ろう                      | [05_frontend.md](./05_frontend.md)                 |
| 15:45 - 16:00 |            | 休憩                             |                                                    |
| 16:00 - 16:30 | **Step 5** | 仕上げ & 動作確認                 | [06_finishing.md](./06_finishing.md)                |
| 16:30 - 17:00 |            | 成果発表 & 振り返り               | [06_finishing.md](./06_finishing.md)                |

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
[ ] 受講者に 00_pre-setup.md を1週間前に配布
[ ] 受講者PCに VS Code / Node.js / Docker / Claude Code がインストールされていることを確認
[ ] Google AI Studio の API キーを各自取得（または共有キーを用意）
[ ] Docker イメージを事前 pull（当日のネットワーク負荷軽減）
     docker pull pgvector/pgvector:pg18
[ ] 完成版のリポジトリを用意（詰まった人用のレスキュー）
[ ] Wi-Fi 環境の確認（API 通信が必要）
[ ] 各 Step の「期待される動作」をスクリーンショットで用意
```

---

## 初心者がつまづきやすいポイント & 対策

| つまづき                         | よくある原因                   | 対策                                                 |
| -------------------------------- | ------------------------------ | ---------------------------------------------------- |
| `docker compose up` が失敗       | Docker Desktop が起動していない | 研修開始前に確認                                      |
| API キーエラー                   | `.env.local` の記述ミス         | Claude Code に「.env.local を確認して」と指示         |
| DB 接続エラー                    | コンテナが起動していない        | `docker ps` で確認するよう誘導                        |
| Claude Code の回答が長すぎて混乱 | 指示が曖昧                     | **「まず○○だけ作って」** と範囲を絞る指示を教える     |
| 型エラーが大量に出る             | 依存関係の不足                 | エラーをそのまま貼り付けて修正依頼                     |

---

## ファイル一覧

```
docs/
├── README.md                  ← この文書（研修概要）
├── 00_pre-setup.md            ← 事前セットアップ手順
├── 01_claude-code-intro.md    ← Step 0: Claude Code 入門
├── 02_database.md             ← Step 1: データベース構築
├── 03_api.md                  ← Step 2: API 構築
├── 04_ai-conversation.md      ← Step 3: AI 会話機能
├── 05_frontend.md             ← Step 4: フロントエンド
└── 06_finishing.md            ← Step 5: 仕上げ & 振り返り
```
