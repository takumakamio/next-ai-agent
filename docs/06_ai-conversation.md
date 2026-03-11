# Step 3：AI と会話できるようにしよう（10分）

> **ゴール：** Gemini API を使って AI と会話し、関連する Q&A を自動で見つけてくれる機能を作る

---

## このステップで作るもの

- Google AI クライアントのセットアップ
- Embedding（ベクトル埋め込み）生成ユーティリティ
- コサイン類似度によるベクトル検索
- 会話 API（コンテキスト対応）

---

## ベクトル検索のしくみ（初心者向け解説）

```
ユーザーの質問: 「TypeScriptって何？」
    ↓
数値に変換（Embedding）: [0.1, 0.3, 0.8, ...]
    ↓
DB 内の Q&A も同じように数値に変換済み
    ↓
数値の「近さ」を計算（コサイン類似度）
    ↓
近いもの = 意味が似ている Q&A → 回答の参考にする
```

> **つまり：** ユーザーの質問に「意味が近い」Q&A をデータベースから自動で見つけて、それを参考にして AI が回答を作ります。キーワードの完全一致ではなく「意味の近さ」で検索できるのがポイントです。

---

## ① Google AI クライアントのセットアップ（3分）

Claude Code への指示：

> 「@google/genai パッケージを使って、Gemini のクライアントを設定するユーティリティファイルを lib/google-ai.ts に作って。embedding 生成の関数も用意して。モデルは gemini-embedding-001、次元数は 2000 で。API キーは環境変数から読み込んで」

> **セキュリティポイント：** AI のクライアント設定では `process.env.GOOGLE_GENERATIVE_AI_API_KEY` のように **環境変数から API キーを読み込みます**。コードに直接キーを書くと、Git にアップしたときに全世界に公開されてしまいます。環境変数を使うことで、キーはサーバー上にだけ存在し、ブラウザ（フロントエンド）からは見えません。

→ 生成されたファイルを確認：

- `lib/google-ai.ts` — Gemini API のユーティリティ

### embedding 生成関数のイメージ

```
入力: 「TypeScriptの型とは何ですか？」（テキスト）
出力: [0.012, -0.034, 0.891, ...] （2000個の数値の配列）
```

---

## ② ベクトル検索の実装（3分）

Claude Code への指示：

> 「ユーザーの質問を embedding に変換して、DB に保存されている Q&A とコサイン類似度で検索する関数を作って。類似度 0.65 以上のものだけ返して」

### コサイン類似度とは？

| 類似度 | 意味                       | 例                                       |
| ------ | -------------------------- | ---------------------------------------- |
| 1.0    | 完全に同じ意味             | 「TS とは？」と「TypeScript とは？」      |
| 0.8    | とても似ている             | 「型とは？」と「TypeScript の型について」 |
| 0.65   | まあまあ似ている（閾値）    | 「React とは？」と「UI フレームワーク」   |
| 0.3    | あまり関係ない             | 「天気は？」と「TypeScript とは？」       |
| 0.0    | 全く関係ない               | —                                        |

> 今回は **0.65 以上** を「関連する Q&A」として採用します。

---

## ③ 会話 API の実装（2分）

Claude Code への指示：

> 「チャット用の POST API を features/home/routes/conversation.ts に作って。ユーザーの質問を受け取って、ベクトル検索で関連 Q&A を見つけて、それをコンテキストとして Gemini 2.5-flash に渡して回答を生成して。会話履歴（history）も受け取って、前の会話を踏まえた回答ができるようにして」

### データの流れ

![会話APIのデータの流れ](/docs/06-conversation-data-flow.png)

### 期待されるリクエスト・レスポンス

**POST** `/api/home/conversation`

リクエスト：

```json:features/home/routes/conversation.ts
{
  "question": "TypeScript って何ですか？",
  "history": [],
  "chatSessionId": "session-001",
  "aiModel": "gemini-2.5-flash"
}
```

レスポンス：

```json:features/home/routes/conversation.ts
{
  "response": "TypeScript は JavaScript に型システムを追加した言語です...",
  "relatedQAs": [
    {
      "id": "abc123",
      "question": "TypeScript の型とは？",
      "similarity": 0.89
    }
  ]
}
```

---

## ④ 動作確認（2分）

```bash
curl -X POST http://localhost:3000/api/home/conversation \
  -H "Content-Type: application/json" \
  -d '{"question":"TypeScript って何ですか？","history":[]}'
```

### 確認ポイント

- AI の回答が返ってくるか
- 関連する Q&A が見つかっているか（relatedQAs に値が入っているか）
- シードで登録した Q&A の内容が回答に反映されているか

→ AI の回答が返ってくれば **Step 3 完了！**

---

## このステップで伝えること

> **「Claude Code が生成したコードで意味がわからない部分があったら『この部分を説明して』と聞きましょう。理解することが大事です」**

---

## コード解説：会話・音声機能の仕組み

このアプリには **会話（Conversation）**、**音声合成（TTS）**、**音声認識（STT）** の3つの AI 機能があります。
すべて Google の Gemini API を使っています。

### 会話 API（Conversation）

**ファイル：** `features/home/routes/conversation.ts`
**エンドポイント：** `POST /api/home/conversation`

ユーザーの質問を受け取り、関連する Q&A をベクトル検索で探し、Gemini に回答を生成させます。

```
ユーザーの質問
    ↓
① generateEmbedding() でテキストを数値ベクトルに変換
    ↓
② searchRelevantQAs() で DB のベクトルとコサイン類似度を計算
   → 類似度 0.65 以上の Q&A だけを抽出
    ↓
③ buildConversationContext() で直近5件の会話履歴をプロンプトに追加
④ buildQAContext() で見つかった Q&A をプロンプトに追加
    ↓
⑤ Gemini API（gemini-2.5-flash）にプロンプトを送信
    ↓
⑥ 回答テキスト + 関連QA一覧を返却
   同時に logQAInteraction() で qa_logs テーブルに記録
```

**主要な関数：**

| 関数 | 役割 |
| --- | --- |
| `searchRelevantQAs()` | 質問をベクトル化 → DB でコサイン類似度検索（タイムアウト10秒） |
| `buildConversationContext()` | 会話履歴をプロンプト文字列に整形 |
| `buildQAContext()` | 検索で見つかった Q&A をプロンプト文字列に整形 |
| `logQAInteraction()` | 会話ログを DB に保存 |

---

### 音声合成 API（TTS）

**ファイル：** `features/home/routes/tts.ts` + `lib/tts/gemini.ts`
**エンドポイント：** `GET /api/home/tts?text=...&avatar=...`

AI の回答テキストを音声に変換して返します。

```
テキスト + アバター名
    ↓
① generateGeminiTTS() を呼び出し
    ↓
② アバター名から声を選択（例：Tsumugi → Sulafat）
    ↓
③ Gemini TTS モデル（gemini-2.5-flash-preview-tts）に送信
   → responseModalities: ['AUDIO'] で音声データを要求
    ↓
④ 返ってきた PCM データを WAV 形式に変換
    ↓
⑤ audio/wav としてレスポンス返却
```

> **ポイント：** アバターごとに声を変えられます。`voiceMap` に `{ アバター名: Gemini音声名 }` を追加するだけです。

---

### 音声認識 API（STT）

**ファイル：** `features/home/routes/stt.ts`
**エンドポイント：** `POST /api/home/stt`（multipart/form-data）

マイクで録音した音声をテキストに変換します。

```
音声ファイル（WebM 等）
    ↓
① FormData から音声ファイルを取得
    ↓
② ArrayBuffer → Base64 に変換
    ↓
③ Gemini API（gemini-2.0-flash）に音声データを送信
   → 「この音声を文字起こしして」というプロンプト付き
   → temperature: 0.1（低め＝正確さ重視）
    ↓
④ 文字起こし結果をテキストとして返却
```

> **ポイント：** 専用の音声認識サービスではなく、Gemini のマルチモーダル機能（テキスト＋音声を同時に扱える能力）を使っています。

---

### 3つの API の連携

チャット画面では、これらが連携して「声で話しかけると声で返事する」体験を実現しています。

```
🎤 マイクで話す
    ↓
STT API → テキストに変換
    ↓
Conversation API → AI が回答を生成
    ↓
TTS API → 回答を音声に変換
    ↓
🔊 スピーカーで再生 + 3D アバターがリップシンク
```

---

## トラブルシューティング

| 症状                         | 原因                             | 対処法                                             |
| ---------------------------- | -------------------------------- | -------------------------------------------------- |
| API キーエラー               | `.env.local` の設定ミス           | API キーが正しくコピーされているか確認               |
| embedding 生成に失敗          | API クォータ超過                  | Google AI Studio でクォータを確認                    |
| 類似 Q&A が見つからない       | シードデータに embedding がない   | シード時に embedding を生成するよう修正              |
| 回答が英語で返ってくる        | システムプロンプトの設定不足       | 「日本語で回答するように」とプロンプトに追加         |
| レスポンスが遅い             | Gemini API の応答待ち             | 正常動作。初回は数秒かかることがある                 |
