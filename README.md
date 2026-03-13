# Next AI Agent

AI メンター「春日部つむぎ」とチャットできる Web アプリ — Claude Code を使った AI エージェント開発の研修教材

## 概要

登録済みの Q&A データをベクトル検索（RAG）で自動検索し、Gemini AI が回答を生成するチャットアプリです。3D アバターによるリップシンク・表情変化、音声入出力（STT/TTS）にも対応しています。

## 主な機能

| 機能 | 説明 |
| --- | --- |
| AI テキストチャット | Q&A ベクトル検索 + Gemini AI による回答生成（RAG） |
| 音声会話 | マイク入力 → STT → AI 回答 → TTS → スピーカー出力 |
| 3D アバター | VRM/GLB 形式対応、リップシンク・表情変化・待機アニメーション |
| Q&A 管理 | ナレッジデータの CRUD（一覧・検索・作成・削除） |
| QA ログ | 会話履歴の閲覧・フィードバック |
| API ドキュメント | `/api/scalar` で OpenAPI ベースのインタラクティブ API リファレンス |

## 技術スタック

| カテゴリ | 技術 |
| --- | --- |
| フレームワーク | Next.js 16 / React 19 / TypeScript |
| API サーバー | Hono（OpenAPI + Zod バリデーション） |
| データベース | PostgreSQL + pgvector（Neon） |
| ORM | Drizzle ORM |
| AI | Google Gemini（会話 / Embedding / TTS / STT） |
| 3D | Three.js / React Three Fiber / @pixiv/three-vrm |
| UI | Tailwind CSS v4 / shadcn/ui |
| API ドキュメント | Scalar（OpenAPI 3.1 自動生成） |

## セットアップ

### 必要なもの

- Node.js v22+
- PostgreSQL（pgvector 拡張有効）— [Neon](https://neon.tech) 推奨
- Google AI API キー（Gemini）

### インストール

```bash
git clone https://github.com/takumakamio/next-ai-agent.git
cd next-ai-agent
npm install
```

### 環境変数

```bash
cp .env.example .env.local
```

`.env.local` に以下を設定：

```
DATABASE_URL=postgresql://...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

### データベースセットアップ

```bash
# マイグレーション（テーブル作成）
npm run db:gnm

# サンプルデータ投入
npm run db:seed
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアプリ、http://localhost:3000/api/scalar で API ドキュメントが確認できます。

## ディレクトリ構成

```
next-ai-agent/
├── app/                          # ページと API ルート
│   ├── page.tsx                  #   トップページ（3タブ: Chat / QAs / QA Logs）
│   └── api/
│       └── [[...route]]/
│           └── route.ts          #   全 API のエントリーポイント（Hono）
│
├── features/                     # 機能ごとのモジュール
│   ├── home/                     #   チャット・会話機能
│   │   ├── components/           #     Chat, MessagesList, TextInput, Avatar 等
│   │   └── routes/               #     conversation / tts / stt API
│   ├── qas/                      #   Q&A 管理機能
│   │   ├── components/           #     テーブル・フォーム
│   │   ├── routes/               #     CRUD API（get-list / get-id / create / delete）
│   │   ├── repositories/         #     DB 操作（Drizzle クエリ）
│   │   └── schema.ts             #     Zod バリデーション定義
│   └── qa-logs/                  #   QA ログ機能
│
├── db/                           # データベース関連
│   ├── schema/                   #   テーブル定義（qas, qa-logs）
│   ├── database.ts               #   DB 接続・トランザクション
│   ├── drizzle.config.ts         #   Drizzle Kit 設定
│   ├── seed.ts                   #   シードスクリプト
│   └── seeds/                    #   シードデータ（qaData.json）
│
├── lib/                          # 共通ユーティリティ
│   ├── google-ai.ts              #   Gemini API クライアント（Embedding 生成）
│   ├── tts/                      #   TTS 関連（Gemini TTS + WAV 変換）
│   └── rpc.ts                    #   Hono RPC クライアント（型安全 API 呼び出し）
│
├── components/ui/                # shadcn/ui コンポーネント
├── hooks/                        # React カスタムフック（avatar.ts 等）
└── docs/                         # 研修ドキュメント
```

## API エンドポイント

| メソッド | パス | 説明 |
| --- | --- | --- |
| POST | `/api/home/conversation` | AI チャット（QA ベクトル検索 + Gemini 回答生成） |
| GET | `/api/home/tts` | テキスト → 音声変換（Gemini TTS） |
| POST | `/api/home/stt` | 音声 → テキスト変換（Gemini STT） |
| GET | `/api/qas` | Q&A 一覧取得（ページネーション・検索対応） |
| GET | `/api/qas/:id` | Q&A 単体取得 |
| POST | `/api/qas` | Q&A 作成・更新 |
| DELETE | `/api/qas/:id` | Q&A 削除 |
| GET | `/api/qa-logs` | QA ログ一覧取得 |
| GET | `/api/scalar` | API ドキュメント（Scalar UI） |
| GET | `/api/swagger.json` | OpenAPI 3.1 仕様（JSON） |

## npm スクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | Biome によるリント |
| `npm run db:generate` | マイグレーションファイル生成 |
| `npm run db:migrate` | マイグレーション実行 |
| `npm run db:gnm` | generate + migrate を連続実行 |
| `npm run db:seed` | シードデータ投入 |
| `npm run db:reset` | DB リセット（drop → generate → migrate → seed） |

## 研修ドキュメント

`docs/` ディレクトリに研修教材が含まれています。

| ファイル | 内容 |
| --- | --- |
| [docs/README.md](docs/README.md) | 研修概要・タイムテーブル |
| [docs/quick-start.md](docs/quick-start.md) | クイックスタート（環境構築手順） |
| [docs/app-overview.md](docs/app-overview.md) | アプリの概要・アーキテクチャ |
| [docs/00_learning-outcomes.md](docs/00_learning-outcomes.md) | 研修で理解できるようになること |
| [docs/01_tech-overview.md](docs/01_tech-overview.md) | 使用技術の解説 |
| [docs/02_pre-setup.md](docs/02_pre-setup.md) | 事前セットアップ手順 |
| [docs/03_claude-code-intro.md](docs/03_claude-code-intro.md) | Step 0: Claude Code 入門 |
| [docs/04_database.md](docs/04_database.md) | Step 1: データベース構築 |
| [docs/05_api.md](docs/05_api.md) | Step 2: API 構築 |
| [docs/06_ai-conversation.md](docs/06_ai-conversation.md) | Step 3: AI 会話機能 |
| [docs/07_frontend.md](docs/07_frontend.md) | Step 4: フロントエンド |
| [docs/09_finishing.md](docs/09_finishing.md) | Step 5: 仕上げ & 振り返り |
| [docs/08_hands-on-challenge.md](docs/08_hands-on-challenge.md) | Step 6: 実践チャレンジ（要約機能） |
| [docs/prompts.md](docs/prompts.md) | プロンプトカタログ |
