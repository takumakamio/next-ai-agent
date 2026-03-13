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

<details>
<summary>📄 実コードを見る（conversation.ts）</summary>

```typescript:features/home/routes/conversation.ts
// --- スキーマ定義 ---
const conversationRequestSchema = z.object({
  question: z.string().optional().default(''),
  history: z.array(conversationExchangeSchema).max(5).optional().default([]),
  locale: z.string().optional().default('ja'),
  chatSessionId: z.string().optional(),
  aiModel: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro']).optional().default('gemini-2.5-flash'),
})

// --- メインハンドラ（抜粋） ---
async (c) => {
  const { question, history, chatSessionId, aiModel } = c.req.valid('json')
  const requestLocale = c.get('locale')
  const limitedHistory = history.slice(-5)

  // ① ベクトル検索で関連 Q&A を取得
  const relevantQAs = await searchRelevantQAs(question, requestLocale, 3)

  // ② システムプロンプト構築
  const baseSystemPrompt = `You are Tsumugi, a friendly engineering mentor AI...`
  const historyContext = limitedHistory.length > 0 ? buildConversationContext(limitedHistory) : ''
  const qaContext = relevantQAs.length > 0 ? buildQAContext(relevantQAs) : ''
  const fullPrompt = `${baseSystemPrompt}${historyContext}${qaContext}\n\n${userMessage}`

  // ③ Gemini API に送信
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
  const response = await ai.models.generateContent({
    model: aiModel,
    contents: fullPrompt,
  })

  // ④ ログ保存 & レスポンス返却
  const logId = await logQAInteraction({ chatSessionId, userQuestion: question, aiAnswer: text, relevantQAs, requestLocale, responseTime })
  return c.json({ response: text, relatedQAs: relevantQAs, logId }, 200)
}

// --- ベクトル検索関数 ---
async function searchRelevantQAs(question: string, locale: string, limit = 5): Promise<QASearchResult[]> {
  const db = getDB()
  const questionEmbedding = await generateEmbedding(question)
  const embeddingString = `[${questionEmbedding.join(',')}]`

  // コサイン類似度で検索（タイムアウト 10 秒）
  const qaResults = await Promise.race([
    db.select({
      id: qas.id,
      question: qas.question,
      answer: qas.answer,
      category: qas.category,
      similarity: sql<number>`1 - (${qas.embedding} <=> ${embeddingString}::vector)`,
      websiteLink: qas.websiteLink,
    })
    .from(qas)
    .where(sql`${qas.embedding} IS NOT NULL`)
    .orderBy(desc(sql<number>`1 - (${qas.embedding} <=> ${embeddingString}::vector)`))
    .limit(limit),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000)),
  ])

  // 類似度 0.65 以上だけを返す
  return qaResults.filter((qa) => qa.similarity > 0.65)
}

// --- 会話履歴コンテキスト構築 ---
function buildConversationContext(history: ConversationExchange[]): string {
  const contextLines = history
    .map((exchange, index) =>
      `${index + 1}. User: ${exchange.user.substring(0, 100)}\n   Assistant: ${exchange.assistant.substring(0, 100)}`
    )
    .join('\n\n')
  return '\n\n🗣️ **Conversation History:**\n' + contextLines
}

// --- QA コンテキスト構築 ---
function buildQAContext(qas: QASearchResult[]): string {
  const contextLines = qas
    .map((qa, index) =>
      `【QA ${index + 1} - Similarity: ${Math.round(qa.similarity * 100)}%】\nQuestion: ${qa.question}\n**Answer**: ${qa.answer}`
    )
    .join('\n')
  return '\n\n📚 **QA Reference:**\n' + contextLines
}

// --- ログ保存 ---
async function logQAInteraction({ chatSessionId, userQuestion, aiAnswer, relevantQAs, requestLocale, responseTime }): Promise<string> {
  const db = getDB()
  const questionEmbedding = await generateEmbedding(userQuestion)
  const bestQA = relevantQAs[0] ?? null

  const [insertedLog] = await db.insert(qaLogs).values({
    id: nanoid(),
    chatSessionId,
    userQuestion,
    userQuestionEmbedding: questionEmbedding.length > 0 ? questionEmbedding : null,
    aiAnswer,
    similarityScore: bestQA?.similarity || null,
    responseTime,
    embeddingModel: 'gemini-embedding-001',
    qaId: bestQA?.id || null,
  }).returning({ id: qaLogs.id })

  return insertedLog.id
}
```

</details>

<details>
<summary>📄 実コードを見る（lib/google-ai.ts — Embedding 生成）</summary>

```typescript:lib/google-ai.ts
import { GoogleGenAI } from '@google/genai'

export const EMBEDDING_MODEL = 'gemini-embedding-001'

export async function generateEmbedding(text: string): Promise<number[] | never[]> {
  const env = process.env

  if (!env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY === '') {
    console.error('Missing GOOGLE_GENERATIVE_AI_API_KEY')
    return []
  }

  try {
    const ai = new GoogleGenAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })

    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: {
        outputDimensionality: 2000,
      },
    })

    const embeddings = response.embeddings

    if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
      console.error('No embeddings returned from API')
      return []
    }

    return embeddings[0].values as number[]
  } catch (error) {
    console.error('Embedding generation error:', error)
    return []
  }
}
```

</details>

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

<details>
<summary>📄 実コードを見る（tts.ts + lib/tts/gemini.ts）</summary>

```typescript:features/home/routes/tts.ts
export const ttsRoute = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'get',
    path: '/api/home/tts',
    request: { query: z.object({ text: z.string().min(1), avatar: z.string().optional().default('Tsumugi') }) },
    // ...responses 省略
  }),
  async (c) => {
    const { text, avatar } = c.req.valid('query')
    const result = await generateGeminiTTS(process.env, text, avatar)
    return new Response(result.audioBuffer, {
      headers: { 'Content-Type': 'audio/wav', 'X-TTS-Provider': 'Gemini' },
    })
  },
)
```

```typescript:lib/tts/gemini.ts
export async function generateGeminiTTS(env: any, text: string, avatar: string): Promise<TTSResult> {
  // アバター名 → Gemini 音声名のマッピング
  const voiceMap: Record<string, string> = {
    Tsumugi: 'Sulafat',
  }
  const geminiVoice = voiceMap[avatar] || 'Kore'

  const { GoogleGenAI } = await import('@google/genai')
  const genai = new GoogleGenAI({ apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY })

  // 音声生成リクエスト
  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],           // ← 音声データを要求
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: geminiVoice },
        },
      },
    },
  })

  // PCM → WAV 変換
  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  const pcmBuffer = Buffer.from(audioData, 'base64')
  const wavBuffer = createWavBuffer(pcmBuffer, 24000, 1, 16)

  return { audioBuffer: wavBuffer, contentType: 'audio/wav', provider: 'Gemini', filename: 'tts.wav' }
}
```

</details>

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

<details>
<summary>📄 実コードを見る（stt.ts）</summary>

```typescript:features/home/routes/stt.ts
export const sttRoute = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'post',
    path: '/api/home/stt',
    request: {
      body: { content: { 'multipart/form-data': { schema: z.object({ audio: z.instanceof(File) }) } } },
    },
    // ...responses 省略
  }),
  async (c) => {
    // ① FormData から音声ファイルを取得
    const formData = await c.req.formData()
    const audioFile = formData.get('audio') as File

    // ② ArrayBuffer → Base64 に変換
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const base64Audio = buffer.toString('base64')

    // ③ Gemini API に音声データを送信
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Generate a transcript of the speech. Provide only the transcribed text.' },
            { inlineData: { mimeType: audioFile.type || 'audio/webm', data: base64Audio } },
          ],
        },
      ],
      config: {
        temperature: 0.1,    // 低め＝正確さ重視
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    })

    // ④ 文字起こし結果を返却
    const transcription = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    return c.json({ text: transcription }, 200)
  },
)
```

</details>

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
