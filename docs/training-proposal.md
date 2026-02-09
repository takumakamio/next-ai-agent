# カスタムAIエージェント開発研修 提案書

## 1. 研修概要

| 項目 | 内容 |
|------|------|
| 研修名 | カスタムAIエージェント開発 ハンズオン研修 |
| 対象者 | Web開発の基礎知識を持つエンジニア |
| 形式 | ハンズオン形式（実際にコードを書きながら学ぶ） |
| 教材 | 本プロジェクト `next-ai-agent` |
| 前提知識 | TypeScript / React の基礎、REST API の概念理解 |

## 2. 研修の目的

本研修では、実際に動作するAIエージェントアプリケーションを題材に、以下のスキルを習得する。

- **RAG（Retrieval-Augmented Generation）** の仕組みと実装方法
- **LLM（大規模言語モデル）** をアプリケーションに組み込む設計パターン
- **ベクトル検索** による知識ベースの構築と活用
- **3Dアバター** によるインタラクティブなUIの実装
- **音声AI（STT/TTS）** の統合
- モダンなフルスタック開発の実践的なアーキテクチャ

## 3. 技術スタック

本プロジェクトで使用している技術は以下の通り。

### フロントエンド
| 技術 | 用途 |
|------|------|
| Next.js 16 / React 19 | フレームワーク / UIライブラリ |
| Tailwind CSS v4 | スタイリング |
| Three.js + @pixiv/three-vrm | 3Dアバター描画 |
| SWR | データフェッチング |
| React Hook Form + Zod | フォームバリデーション |
| next-intl | 国際化（i18n） |

### バックエンド
| 技術 | 用途 |
|------|------|
| Hono + Zod OpenAPI | APIルーティング / スキーマ駆動開発 |
| Drizzle ORM | データベースORM |
| PostgreSQL + pgvector | DB + ベクトル検索 |
| Google Gemini API | 会話AI（LLM） |
| VOICEVOX | 日本語テキスト音声合成（TTS） |

### インフラ
| 技術 | 用途 |
|------|------|
| Docker Compose | ローカル開発環境（DB + VOICEVOX） |
| Bun | ランタイム / パッケージマネージャ |

## 4. カリキュラム

### Day 1: 基盤理解 — プロジェクト構造とDB設計

#### セッション 1-1: 環境構築とプロジェクト概要（1.5h）
- 開発環境のセットアップ（Bun, Docker, 環境変数）
- `docker compose up` によるDB・VOICEVOXの起動
- プロジェクト構成の理解（feature-based architecture）

```
app/                     # Next.js App Router
  api/[[...route]]/      # Hono APIエンドポイント
  page.tsx               # メインページ
features/root/           # 機能モジュール
  home/                  # チャットUI・アバター
  qas/                   # QAデータ管理
  qa-logs/               # QAログ管理
db/                      # DBスキーマ・マイグレーション
hooks/                   # グローバル状態（Zustand）
lib/                     # ユーティリティ
components/              # 共通UIコンポーネント
```

#### セッション 1-2: データベース設計とORM（1.5h）
- **対象ファイル**: `db/schema/qas.ts`, `db/schema/qa-logs.ts`
- PostgreSQL + pgvector によるベクトルカラムの設計
- Drizzle ORM のスキーマ定義とリレーション
- マイグレーションとシードデータの投入
- **ハンズオン**: QAスキーマにフィールドを追加し、マイグレーションを実行する

#### セッション 1-3: API設計 — Hono + OpenAPI（1.5h）
- **対象ファイル**: `app/api/[[...route]]/route.ts`, `features/root/qas/routes/`
- Hono フレームワークの基礎
- Zod OpenAPI によるスキーマ駆動のAPI定義
- CRUD API の実装パターン（create / get-list / get-id / delete）
- **ハンズオン**: 新しいAPIエンドポイントを追加する

---

### Day 2: AIコア — RAGとLLM統合

#### セッション 2-1: ベクトル検索とRAGの仕組み（2h）
- **対象ファイル**: `features/root/home/routes/conversation.ts`
- RAG（Retrieval-Augmented Generation）のアーキテクチャ
- pgvector によるベクトル類似度検索（`searchRelevantQAs`）
- エンベディングの生成と保存
- コンテキストの構築（`buildQAContext`, `buildConversationContext`）
- **ハンズオン**: 検索精度を改善するためのパラメータ調整

#### セッション 2-2: Gemini APIの統合（1.5h）
- **対象ファイル**: `lib/google-ai.ts`, `features/root/home/routes/conversation.ts`
- Google Gemini API の基本的な使い方
- プロンプトエンジニアリングの基礎
- 会話履歴の管理（`conversationExchangeSchema`）
- QAログへの記録（`logQAInteraction`）
- **ハンズオン**: システムプロンプトを変更してエージェントの性格をカスタマイズする

#### セッション 2-3: フロントエンドとの接続（1h）
- **対象ファイル**: `features/root/home/components/chat.tsx`, `lib/rpc.ts`
- Hono RPC クライアントによる型安全なAPI呼び出し
- SWR によるデータフェッチングと状態管理
- チャットUIの実装パターン（メッセージリスト、入力フォーム）

---

### Day 3: マルチモーダルAI — 音声と3Dアバター

#### セッション 3-1: 音声AI — STT/TTS の実装（1.5h）
- **対象ファイル**: `features/root/home/routes/stt.ts`, `features/root/home/routes/tts.ts`
- Speech-to-Text（音声認識）の統合
- VOICEVOX による日本語音声合成
- 音声データのストリーミング処理
- **ハンズオン**: 音声パラメータ（速度・ピッチ）を調整する

#### セッション 3-2: 3Dアバター — VRM統合（2h）
- **対象ファイル**: `features/root/home/components/avatar.tsx`, `hooks/avatar.ts`
- Three.js + React Three Fiber の基礎
- VRM（Virtual Reality Model）フォーマットの概要
- アバターの表情制御・リップシンク
- アニメーション状態管理（Zustand）
- カメラ制御（`CAMERA_POSITIONS`, `CameraManager`）
- **ハンズオン**: アバターの待機アニメーションをカスタマイズする

#### セッション 3-3: 統合テストと総まとめ（1h）
- 全コンポーネントの動作確認
- エンドツーエンドの処理フロー整理
- パフォーマンス最適化のポイント

---

### Day 4（応用編 / オプション）: 独自AIエージェントの構築

#### セッション 4-1: 自分だけのAIエージェントを設計する（1.5h）
- ユースケースの定義（社内FAQ、カスタマーサポート、教育支援など）
- QAデータの設計と投入
- プロンプトの設計とチューニング

#### セッション 4-2: 機能拡張チャレンジ（2h）
以下から選択して実装する:
- **画像対応**: QAに画像を含められるようにする
- **多言語対応**: i18n設定を活用して英語対応を追加する
- **フィードバック分析**: QAログのフィードバックデータを集計・可視化する
- **Webhook連携**: Slack通知やメール送信機能を追加する

#### セッション 4-3: 発表とレビュー（1h）
- 各自が構築したAIエージェントのデモ発表
- コードレビューとフィードバック

## 5. 各セッションの学習ポイント対応表

| 学習テーマ | Day 1 | Day 2 | Day 3 | Day 4 |
|-----------|:-----:|:-----:|:-----:|:-----:|
| DB / ORM設計 | **主** | | | |
| API設計（OpenAPI） | **主** | 副 | | |
| RAG / ベクトル検索 | | **主** | | 副 |
| LLM統合 / プロンプト | | **主** | | 副 |
| 音声AI（STT/TTS） | | | **主** | |
| 3Dアバター | | | **主** | |
| フロントエンド統合 | 副 | 副 | **主** | **主** |
| 設計・アーキテクチャ | 副 | 副 | 副 | **主** |

## 6. 受講者が得られる成果物

1. **動作するAIエージェントアプリケーション** — ローカル環境で完全に動作するチャットボット
2. **カスタマイズされたQAデータセット** — 独自のユースケースに対応したQAデータ
3. **技術理解** — RAG、LLM統合、音声AI、3Dアバターの実装知識
4. **再利用可能なコードベース** — 今後の開発に活用できるリファレンス実装

## 7. 研修の形態オプション

| 形態 | 期間 | 対象 | 特徴 |
|------|------|------|------|
| **集中コース** | 4日間（各日4.5h） | 開発チーム | 全カリキュラムを網羅 |
| **短縮コース** | 2日間（各日4.5h） | 経験者向け | Day 1 + Day 2 に集中 |
| **エッセンシャル** | 1日（6h） | 概要把握 | RAG + LLM統合の核心部分のみ |
| **自習コース** | 各自のペース | 個人学習 | 資料 + ハンズオン課題の配布 |

## 8. 必要な準備

### 受講者側
- Node.js 20+ / Bun がインストールされたPC
- Docker Desktop のインストール
- Google Cloud アカウント（Gemini API キー取得用）
- Git の基本操作ができること
- テキストエディタ（VS Code 推奨）

### 運営側
- リポジトリのクローン用URL配布
- `.env.example` に基づいた環境変数の案内
- Gemini API キーの取得手順書
- 各セッションのスライド資料
- ハンズオン課題のチェックリスト

---

## 付録A: AI技術の実装詳細

本プロジェクトで使用しているAI関連技術の実装詳細を以下にまとめる。

### A-1. RAG（Retrieval-Augmented Generation）

RAGは「ユーザーの質問に関連する知識をDBから検索し、その情報をLLMに渡して回答を生成する」アーキテクチャである。

#### 処理フロー

```
ユーザーの質問
    │
    ▼
① エンベディング生成（Gemini embedContent API）
    │  質問文 → 2000次元のベクトルに変換
    │  model: "text-embedding-004"
    │  outputDimensionality: 2000
    ▼
② ベクトル類似度検索（pgvector）
    │  コサイン距離で QA データと比較
    │  SQL: 1 - (embedding <=> question_vector::vector)
    │  類似度 0.65 以上のみ抽出、上位3件取得
    ▼
③ コンテキスト構築
    │  buildQAContext(): 検索結果をプロンプト用テキストに整形
    │  buildConversationContext(): 直近5件の会話履歴を付加
    ▼
④ LLM応答生成（Gemini 2.0 Flash）
    │  システムプロンプト + QAコンテキスト + 会話履歴 + 質問
    │  → 自然言語の回答を生成
    ▼
⑤ ログ記録（qa_logs テーブル）
    │  質問、回答、類似度、応答時間などを記録
    ▼
レスポンス返却
```

#### 対象ファイルと主要関数

| ファイル | 関数/シンボル | 役割 |
|---------|-------------|------|
| `lib/google-ai.ts` | `generateEmbedding()` | Gemini API でテキストを2000次元ベクトルに変換 |
| `features/root/home/routes/conversation.ts` | `searchRelevantQAs()` | pgvectorでベクトル類似度検索（コサイン距離） |
| 同上 | `buildQAContext()` | 検索結果をLLMプロンプト用テキストに整形 |
| 同上 | `buildConversationContext()` | 直近5件の会話履歴をコンテキスト化 |
| 同上 | `conversationRoute` | Gemini 2.0 Flashに全コンテキストを渡して回答生成 |
| 同上 | `logQAInteraction()` | QAログをDBに記録 |

#### プロンプト設計のポイント

本プロジェクトのシステムプロンプトは以下の方針で設計されている:

- QA参照情報が提供された場合、**QAの回答テキストをそのまま使用する**（要約・言い換え禁止）
- 会話履歴を考慮した一貫性のある応答
- ロケールに応じた言語で応答（`next-intl` と連携）
- 300文字以内の簡潔な応答
- プレーンテキスト形式（Markdown/JSON禁止）

---

### A-2. STT（Speech-to-Text / 音声認識）

#### 技術構成

| 項目 | 内容 |
|------|------|
| AIモデル | **Gemini 2.0 Flash**（マルチモーダル） |
| 入力形式 | `multipart/form-data`（音声ファイル） |
| 対応フォーマット | WebM, WAV, MP3 など（MIMEタイプ自動判定） |
| API パス | `POST /api/root/home/stt` |

#### 処理フロー

```
ブラウザ（Web Audio API でマイク録音）
    │
    ▼
音声ファイル（WebM形式）を multipart/form-data で送信
    │
    ▼
サーバー側処理（features/root/home/routes/stt.ts）
    │
    ├─ formData から音声ファイルを取得
    ├─ ArrayBuffer → Base64 に変換
    ├─ MIMEタイプを判定（未指定時は audio/webm）
    │
    ▼
Gemini 2.0 Flash API に送信
    │  contents: [
    │    { text: "Generate a transcript of the speech..." },
    │    { inlineData: { mimeType, data: base64Audio } }
    │  ]
    │  temperature: 0.1（高精度な文字起こし）
    │
    ▼
文字起こしテキストを JSON で返却 → チャット入力へ
```

#### 実装のポイント

- Gemini のマルチモーダル機能を活用し、**専用の音声認識サービスを使わずに** STT を実現
- `temperature: 0.1` に設定し、文字起こしの正確性を優先
- プロンプトで「文字起こしテキストのみを返却し、追加のコメントやフォーマットは不要」と指示

---

### A-3. TTS（Text-to-Speech / 音声合成）

本プロジェクトでは3つのTTSエンジンを選択・フォールバック可能な設計になっている。

#### TTSエンジン比較

| エンジン | 特徴 | 出力形式 | 多言語 | コスト |
|---------|------|---------|:------:|------|
| **VOICEVOX** | ローカル実行、高品質な日本語音声 | WAV | 日本語のみ | 無料 |
| **ElevenLabs** | クラウドAPI、自然な音声 | MP3 | ja/en/ko/zh | 有料 |
| **Gemini TTS** | Google AI、アバター別音声 | WAV (PCM→WAV変換) | 多言語 | 有料 |

#### 各エンジンの実装詳細

**VOICEVOX** (`lib/tts/voicevox.ts`)

```
テキスト入力
    │
    ▼
① audio_query API（POST /audio_query）
    │  テキスト → アクセント・イントネーション解析
    │  speedScale, pitchScale, intonationScale 等を調整可能
    ▼
② synthesis API（POST /synthesis）
    │  解析結果 → WAV音声データを合成
    ▼
WAV バイナリ返却
```

- Docker Compose でローカル起動（`voicevox/voicevox_engine:cpu-ubuntu20.04-latest`）
- `VoicevoxClient` クラスで `audio_query → synthesis` の2段階処理を抽象化
- 話者ID（`speakerId`）でキャラクター音声を切り替え可能

**ElevenLabs** (`lib/tts/elevenlabs.ts`)

```
テキスト + ロケール
    │
    ▼
ロケール → 音声ID マッピング
    │  ja: "PmgfHCGeS5b7sH90BOOJ"
    │  en: "QNYkS0l1ELiFod9u3b0X"
    │  ko, zh も対応
    ▼
ElevenLabs REST API（POST /v1/text-to-speech/{voiceId}）
    │  model_id: "eleven_v3"
    │  stability: 0.5, similarity_boost: 0.8, speed: 1.25
    ▼
MP3 バイナリ返却
```

**Gemini TTS** (`lib/tts/gemini.ts`)

```
テキスト + アバター名
    │
    ▼
アバター名 → Gemini音声名マッピング
    │  "Tsumugi" → "Sulafat"（デフォルト: "Kore"）
    ▼
Gemini 2.5 Flash Preview TTS API
    │  model: "gemini-2.5-flash-preview-tts"
    │  responseModalities: ["AUDIO"]
    │  voiceConfig: { prebuiltVoiceConfig: { voiceName } }
    ▼
Base64 → PCMバッファ → WAVヘッダー付加 → WAV返却
```

#### フォールバック戦略

```
engine パラメータの値に応じた分岐:

  "voicevox"   → VOICEVOX のみ（失敗時エラー）
  "elevenlabs" → ElevenLabs のみ（失敗時エラー）
  "gemini"     → Gemini TTS のみ（失敗時エラー）
  "auto"       → ElevenLabs → 失敗時 → Gemini TTS にフォールバック
```

#### レスポンス共通インターフェース

全エンジンは `TTSResult` インターフェースに統一される:

```typescript
interface TTSResult {
  audioBuffer: Uint8Array | Buffer  // 音声バイナリデータ
  contentType: string               // "audio/wav" or "audio/mpeg"
  provider: string                  // "VOICEVOX" | "ElevenLabs" | "Gemini"
  filename: string                  // "tts.wav" or "tts.mp3"
}
```

---

### A-4. VRM 3Dアバター

#### VRMとは

VRM（Virtual Reality Model）は、VRアプリケーション向けの3Dアバターフォーマット（`.vrm`）。glTF 2.0 をベースに、人型モデルの表情・視線・物理演算（揺れもの）などの情報を標準化したフォーマットである。

#### 技術スタック

| ライブラリ | 役割 |
|-----------|------|
| `three` (Three.js) | WebGL 3Dレンダリングエンジン |
| `@react-three/fiber` | Three.js の React バインディング |
| `@react-three/drei` | Three.js ユーティリティ集 |
| `@pixiv/three-vrm` | VRM フォーマットのローダー・制御 |

#### アーキテクチャ

```
hooks/vrm/              ← VRM制御のカスタムフック群
├── vrm-model.ts         ← VRMモデルのロード・管理
├── animation-state.ts   ← アニメーション状態定義
├── animation-player.ts  ← アニメーション再生制御
├── idle-animation.ts    ← 待機アニメーションシーケンス
├── expression-manager.ts← 表情パラメータ管理
├── lip-sync.ts          ← リップシンク初期化
├── lip-sync-handler.ts  ← リップシンク適用ロジック
├── natural-pose.ts      ← 自然なポーズ制御
├── vrm-preloader.ts     ← モデルプリロード
└── performance-monitor.ts← パフォーマンス監視

lib/vrm/                 ← VRMコアライブラリ
├── config.ts            ← VRM設定（パフォーマンスプリセット含む）
├── lip-sync.ts          ← LipSyncクラス（Web Audio API）
├── vrm-animation.ts     ← VRMアニメーション定義
├── load-vrm-animation.ts← VRMAファイルローダー
├── load-mixamo-animation.ts ← Mixamoアニメーション変換
├── mixamo-vrm-rig-map.ts   ← Mixamo → VRMボーンマッピング
└── utils/               ← ユーティリティ
    ├── expression-batcher.ts ← 表情バッチ更新
    ├── animation-pool.ts     ← アニメーションプーリング
    ├── vrma-cache.ts         ← VRMAキャッシュ
    └── texture-optimizer.ts  ← テクスチャ最適化
```

#### アニメーション状態

アバターは以下のアニメーション状態を持ち、会話の文脈に応じて切り替わる:

| 状態 | アニメーション名 | 用途 |
|------|----------------|------|
| `IDLE` | `idleLoop` | 待機中 |
| `THINKING` | `modelPose` | AI応答生成中 |
| `GREETING` | `greeting` | 挨拶 |
| `EXPLAINING` | `showFullBody` | 説明中 |
| `POINTING` | `peaceSign` | 指さし |
| `WELCOMING` | `dance` | 歓迎 |
| `PRESENTING` | `spin` | プレゼン |
| `RECOMMENDING` | `squat` | おすすめ |
| `CONFIRMING` | `shoot` | 確認 |

アニメーション切り替えはフェード制御（`ANIMATION_CONFIG`）で滑らかに遷移する:

```typescript
ANIMATION_CONFIG = {
  FADE_DURATION: ...,        // フェードイン時間
  FADE_OUT_DURATION: ...,    // フェードアウト時間
  TIMESCALE_IDLE: ...,       // 待機時の再生速度
  WEIGHT_NORMAL: ...,        // 通常のアニメーション重み
}
```

#### パフォーマンスプリセット

デバイス性能に応じて4段階のプリセットを提供:

| プリセット | テクスチャ | ポリゴン | 物理演算 | 用途 |
|-----------|----------|---------|---------|------|
| `high` | 2048px | 50,000 | 有効 | デスクトップ |
| `medium` | 2048px | 25,000 | 有効 | ノートPC |
| `low` | 1024px | 10,000 | 軽量 | タブレット |
| `potato` | 512px | 5,000 | 無効 | 低スペック |

---

### A-5. リップシンク（Lip Sync）

リップシンクは音声データをリアルタイム解析し、VRMアバターの口の動きに反映する仕組みである。本プロジェクトでは2つの方式を実装している。

#### 方式1: Visemeベースリップシンク（優先）

Viseme（視覚的音素）のタイムスタンプデータに基づき、正確な口形状を適用する。

```
TTS API レスポンス
    │
    ├─ 音声バイナリ
    └─ Visemes ヘッダー（JSON）
         [{ type: "1", time: 0 }, { type: "4", time: 200 }, ...]
    │
    ▼
Viseme → VRM表情マッピング（hooks/vrm/lip-sync-handler.ts）

    Visemeタイプ   VRM Expression     口の形
    ─────────────────────────────────────────
    "0"           NEUTRAL             閉じた口
    "1"           AA / A              「あ」
    "2"           EE / E              「え」
    "3"           IH / I              「い」
    "4"           OH / O              「お」
    "5"           OU / U              「う」

    │
    ▼
毎フレーム、音声の再生時間に対応する Viseme を検索し
VRM の expressionManager.setValue(expression, 0.9) で適用
```

#### 方式2: 音量ベースリップシンク（フォールバック）

Visemeデータが利用できない場合に、Web Audio API で音声の音量をリアルタイム解析して口の開閉を制御する。

```
音声再生開始
    │
    ▼
LipSync クラス（lib/vrm/lip-sync.ts）
    │
    ├─ AudioContext を作成
    ├─ AnalyserNode を接続
    │    bufferSource → destination（スピーカー出力）
    │                 → analyser（音量解析用）
    │
    ▼
毎フレーム update() を呼び出し:
    │
    ├─ getFloatTimeDomainData() で 2048サンプル取得
    ├─ 最大振幅を計算: max(|sample[i]|)
    ├─ シグモイド関数で正規化: 1 / (1 + exp(-45 * volume + 5))
    │    → 小さい音は無視、大きい音は滑らかに 0～1 に変換
    ├─ 閾値処理: volume < 0.1 → 0（無音時は口を閉じる）
    │
    ▼
口形状の擬似生成（lip-sync-handler.ts フォールバック部）:
    │
    ├─ 時間に応じて "aa" → "oh" → "ee" をローテーション
    ├─ sin波で開閉量を制御: 0.5 + sin(time) * 0.4
    │
    ▼
VRM expressionManager.setValue(shape, mouthValue) で適用
```

#### リップシンクの初期化（hooks/vrm/lip-sync.ts）

```typescript
useLipSync(enableLipSync: boolean)
    │
    ├─ AudioContext を生成（ユーザー操作後に初期化）
    ├─ LipSync インスタンスを作成
    └─ クリーンアップ時に AudioContext.close()
```

#### 全体の接続フロー

```
ユーザーがテキスト送信
    │
    ▼
会話API → 回答テキスト生成
    │
    ▼
TTS API → 音声バイナリ + Visemes 生成
    │
    ▼
フロントエンド
    ├─ 音声再生（AudioContext.decodeAudioData → bufferSource.start()）
    ├─ アバター状態を "speaking" に変更
    ├─ カメラを speaking ポジションに移動
    │
    ▼
毎フレーム（useFrame / requestAnimationFrame）
    ├─ Visemeデータあり → Visemeベースで口形状を適用
    └─ Visemeデータなし → 音量ベースで口の開閉を制御
    │
    ▼
音声再生完了 → アバター状態を "idle" に戻す
```

---

## 9. 本プロジェクトが研修教材として優れている点

1. **実践的**: 実際にプロダクションレベルで使えるアーキテクチャを採用
2. **モダン技術**: Next.js 16 / React 19 / Hono / Drizzle など最新技術スタック
3. **段階的学習**: DB → API → RAG → LLM → 音声 → 3D と段階的にレイヤーを積み上げる構成
4. **即時フィードバック**: 3Dアバターが応答するため、学習のモチベーションが維持しやすい
5. **拡張性**: QAデータを差し替えるだけで、あらゆる業種・ユースケースに適用可能
6. **フルスタック**: フロント・バック・DB・AI・音声・3D を一貫して学べる
7. **OpenAPI準拠**: API設計のベストプラクティスを実践的に学習できる
