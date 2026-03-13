# Step 4：画面を作ろう（10分）

> **ゴール：** チャット画面と QA 管理画面を作る

---

## このステップで作るもの

- shadcn/ui コンポーネントの導入
- チャット画面（メッセージリスト + 入力欄）
- QA 管理画面（テーブル + 追加フォーム）
- タブで画面を切り替え

---

## ① shadcn/ui の導入（2分）

> **[shadcn/ui](https://ui.shadcn.com) とは？** きれいな UI 部品（ボタン、入力欄、テーブルなど）をすぐに使えるようにしてくれるライブラリです。自分でデザインを1から作る必要がありません。

> 💻 **Claude Code への指示**

```text
shadcn/ui を導入して。Button、Input、Card、Dialog、Table、Textarea、Tabs コンポーネントを追加して
```

→ `components/ui/` フォルダにコンポーネントが生成される

---

## ② チャット画面（3分）

### まずはシンプルなチャット UI を作る

> 💻 **Claude Code への指示**

```text
チャット画面を作って。シンプルにメッセージリストと入力欄だけ。ユーザーのメッセージは右側、AI の回答は左側に表示。送信したら conversation API を呼んで回答を表示して。ダークモードのかっこいいデザインで
```

### 期待される画面の構成

![チャット画面の構成](/docs/07-chat-ui-mockup.png)

### 完成したら実際にチャットしてみよう！

1. テキスト入力欄にメッセージを入力
2. 送信ボタンを押す（または Enter キー）
3. AI の回答が表示される

> ここで初めて **自分が作ったアプリで AI と会話できる** 体験ができます！

<details>
<summary>📄 実コードを見る（Chat コンポーネント — chat.tsx 抜粋）</summary>

```typescript:features/home/components/chat.tsx
export const Chat: React.FC = () => {
  // Zustand ストアからアバターの状態を取得
  const avatar = useAvatar((state) => state.avatar)
  const loading = useAvatar((state) => state.loading)
  const currentMessage = useAvatar((state) => state.currentMessage)

  const [reduceMotion, setReduceMotion] = useState(false)
  const [performanceMode, setPerformanceMode] = useState(false)

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 3D Canvas — アバターの描画 */}
      {is3DVisible && !performanceMode && (
        <div className="absolute inset-0 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 0], fov: 80 }}>
            <CameraManager reduceMotion={reduceMotion} />
            <Suspense fallback={null}>
              <Float speed={0.5} floatIntensity={0.2}>
                <Environment preset="sunset" />
                <Avatar avatar={avatar} position={[2, -3, -2.3]} scale={3} />
              </Float>
            </Suspense>
          </Canvas>
        </div>
      )}

      {/* 2D UI オーバーレイ */}
      <div className="relative z-10 pointer-events-none">
        {/* メッセージリスト（質問と AI の回答） */}
        <div className="absolute top-4 left-4 pointer-events-auto z-20">
          <MessagesList />
        </div>

        {/* 入力エリア（テキスト入力 + マイク） */}
        <div className="absolute bottom-4 left-4 pointer-events-auto z-50">
          <Menus />
        </div>
      </div>
    </div>
  )
}
```

</details>

<details>
<summary>📄 実コードを見る（MessagesList — メッセージ表示）</summary>

```typescript:features/home/components/messages-list.tsx
export const MessagesList = (): JSX.Element => {
  const messages = useAvatar((state) => state.messages) as Message[]
  const clearAll = useAvatar((state) => state.clearAll)
  const playMessage = useAvatar((state) => state.playMessage)

  return (
    <div className="flex flex-col" role="log" aria-label="AIの回答と会話">
      {/* メッセージ一覧 */}
      {messages.map((message, i) => (
        <article key={message.id || i} className="border rounded-lg p-4 bg-muted/30">
          {/* 質問ラベル */}
          <span className="bg-primary px-3 py-1 text-primary-foreground font-bold uppercase rounded">質問</span>
          <span>{message.question}</span>

          {/* AI の回答 */}
          {message.answer && (
            <div>
              <h3 className="font-bold">{message.answer.title}</h3>
              <p>{message.answer.description}</p>
            </div>
          )}

          {/* 音声再生ボタン */}
          <button onClick={() => playMessage(message)} aria-label={`音声再生：${message.question}`}>
            <Play />
          </button>
        </article>
      ))}
    </div>
  )
}
```

</details>

### AI の状態管理 — Zustand ストア

チャット画面が動く裏側では、**[Zustand](https://zustand.docs.pmnd.rs)** という状態管理ライブラリが活躍しています。
`hooks/avatar.ts` の `useAvatar` ストアが、メッセージ一覧・会話履歴・ローディング状態などを一元管理し、UI と AI API をつなぐ役割を担います。

#### データの流れ

```
ユーザーが質問を入力
  → askAI(question) を呼び出し
  → loading: true に変更（スピナー表示）
  → fetch で /api/home/conversation に POST
  → レスポンスを AIResponse として受け取る
  → messages 配列に追加（画面に回答が表示される）
  → conversationHistory に追加（次の質問で過去の文脈を送信）
  → loading: false に変更（スピナー非表示）
```

#### 主要な型定義

| 型 | 役割 |
| --- | --- |
| `Message` | 1 回のやりとり（質問 + AI の回答 + 音声データ） |
| `AIResponse` | AI の回答内容（タイトル・説明・カテゴリ） |
| `ConversationExchange` | 会話履歴の 1 往復分（user と assistant のペア） |

#### ストアの主な状態とアクション

| 名前 | 種類 | 説明 |
| --- | --- | --- |
| `messages` | 状態 | 画面に表示するメッセージの配列 |
| `conversationHistory` | 状態 | 直近 5 件の会話履歴（AI に文脈を渡すため） |
| `loading` | 状態 | AI の回答を待っている間 `true` |
| `askAI(question)` | アクション | 質問を API に送信し、回答をストアに保存 |
| `addToHistory(user, assistant)` | アクション | 会話履歴に 1 往復を追加 |
| `clearAll()` | アクション | メッセージと履歴をすべてクリア |

<details>
<summary>📄 実コードを見る（useAvatar — Zustand ストア抜粋）</summary>

```typescript:hooks/avatar.ts
// --- 型定義 ---
export interface AIResponse {
  title: string
  description: string
  category?: string
  logId?: string
  websiteLink?: string | null
}

export interface Message {
  id: number
  question: string
  answer?: AIResponse
  expertiseLevel?: ExpertiseLevel
  audioPlayer?: HTMLAudioElement | null
  visemes?: Viseme[]
  audioBuffer?: ArrayBuffer
}

export interface ConversationExchange {
  user: string
  assistant: string
  timestamp?: string
}

// --- ストア本体（抜粋） ---
export const useAvatar = create<AvatarState>((set, get) => ({
  messages: [],
  conversationHistory: [],
  loading: false,

  // AI に質問を送る
  askAI: async (question: string) => {
    set(() => ({ loading: true }))

    const requestBody = {
      question,
      history: get().conversationHistory,
      chatSessionId: '',
      aiModel: get().aiModel,
    }

    const res = await fetch(rpc.api.home.conversation.$url(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const data = await res.json()

    const aiResponse: AIResponse = {
      title: data.title || 'Answer',
      description: data.response,
    }

    const message: Message = { question, id: get().messages.length, answer: aiResponse }

    set((state) => ({
      messages: [...state.messages, message],
      loading: false,
    }))

    // 会話履歴に追加（直近 5 件を保持）
    get().addToHistory(question, data.response)
  },

  // 会話履歴を保存（最大 5 件）
  addToHistory: (userMessage: string, assistantResponse: string) => {
    set((state) => ({
      conversationHistory: [
        ...state.conversationHistory,
        { user: userMessage, assistant: assistantResponse, timestamp: new Date().toISOString() },
      ].slice(-5),
    }))
  },

  clearAll: () => {
    set(() => ({ conversationHistory: [], messages: [], currentMessage: null }))
  },
}))
```

</details>

<details>
<summary>📄 実コードを見る（Menus — 入力エリアと askAI の呼び出し）</summary>

```typescript:features/home/components/menus.tsx
const Menus = () => {
  // Zustand ストアからアクションと状態を取得
  const askAI = useAvatar((state) => state.askAI)
  const loading = useAvatar((state) => state.loading)
  const recording = useAvatar((state) => state.recording)
  const startVoiceInput = useAvatar((state) => state.startVoiceInput)
  const stopVoiceInput = useAvatar((state) => state.stopVoiceInput)

  // テキスト入力から質問を送信
  const handleSubmitQuestion = useCallback(
    (question: string) => {
      askAI(question) // ← ストアの askAI を呼ぶだけ！
    },
    [askAI],
  )

  return (
    <>
      <TextInput
        onSubmit={handleSubmitQuestion}
        loading={loading}
        recording={recording}
        /* ... */
      />
      {/* マイク・テキスト入力・モデル選択ボタン */}
    </>
  )
}
```

</details>

> **ポイント：** コンポーネントは `useAvatar((state) => state.xxx)` でストアの値やアクションを取得するだけ。
> API 呼び出しやデータ更新のロジックはすべてストア側に集約されているので、UI コードがシンプルに保てます。

---

## ③ QA 管理画面（3分）

> 💻 **Claude Code への指示**

```text
Q&A の管理画面を作って。一覧表示はテーブル形式で、新規追加のフォームも付けて。テーブルには ID、カテゴリ、質問、作成日を表示。フォームには質問、回答、カテゴリの入力欄を用意して
```

> **補足：** 完成版アプリでは、テーブル（`ManageQaTable`）とフォーム（`ManageQaForm`）が事前に用意されています。研修では Claude Code に指示してこれらを一から作る体験をします。

### 期待される画面の構成

![QA管理画面の構成](/docs/07-qa-management-mockup.png)

### QA 追加フォーム

![QA追加フォーム](/docs/07-qa-form-mockup.png)

<details>
<summary>📄 実コードを見る（QasTab — QA 管理画面）</summary>

```typescript:features/qas/components/qas-tab.tsx
export const QasTab = () => {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingQa, setEditingQa] = useState<SelectQa | undefined>(undefined)
  const [data, setData] = useState<SelectQa[]>([])
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  // RPC クライアントで API を呼び出してデータ取得
  const fetchData = useCallback(async () => {
    const res = await rpc.api.qas.$get({
      query: { page, limit: 50, ...(search && { search }) },
    })
    const response = await res.json()
    setData(response.data)
  }, [page, search])

  // 削除処理
  const handleDelete = async (id: string) => {
    await rpc.api.qas[':id'].$delete({ param: { id } })
    fetchData()  // 再取得
  }

  // 一覧 or フォームを切り替え表示
  if (view === 'form') {
    return <ManageQaForm qa={editingQa} onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
  }

  return (
    <ManageQaTable
      data={data}
      meta={meta}
      onDelete={handleDelete}
      onNewClick={() => { setEditingQa(undefined); setView('form') }}
      onEditClick={handleEditClick}
      onSearchChange={setSearch}
      onPageChange={setPage}
    />
  )
}
```

</details>

---

## ④ タブで画面を切り替え（2分）

> 💻 **Claude Code への指示**

```text
トップページにタブを付けて、『チャット』と『Q&A 管理』を切り替えられるようにして
```

> **補足：** 完成版アプリでは **Chat / QAs / QA Logs** の 3 タブ構成になっています。QA Logs タブでは、AI との会話履歴（質問・回答・類似度スコア）を一覧で確認できます。研修ではまず Chat と QAs の 2 タブを作り、余裕があれば QA Logs タブも追加してみましょう。

### 完成イメージ

![タブ切り替え](/docs/07-tab-switching-mockup.png)

→ タブを切り替えて両画面が表示されれば **Step 4 完了！**

<details>
<summary>📄 実コードを見る（HomeTabs — タブ切り替え）</summary>

```typescript:features/home/components/home-tabs.tsx
type TabKey = 'chat' | 'qas' | 'qa-logs'

export const HomeTabs = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('chat')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'chat', label: 'Chat' },
    { key: 'qas', label: 'QAs' },
    { key: 'qa-logs', label: 'QA Logs' },
  ]

  return (
    <div className="flex flex-col h-screen">
      {/* タブバー */}
      <div className="flex items-center border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-colors rounded-t-lg
              ${activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ — 選択されたタブだけ表示 */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'qas' && <QasTab />}
        {activeTab === 'qa-logs' && <QaLogsTab />}
      </div>
    </div>
  )
}
```

</details>

---

## このステップで伝えること

> **「デザインの調整も日本語で指示できます。『もう少し余白を広くして』『フォントを大きくして』など、見た目の要望も伝えましょう」**

---

## うまくいかないときの対処法

### よくある指示の改善パターン

| うまくいかない指示               | 改善した指示                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| 「画面を作って」                 | 「チャット画面を作って。メッセージリストと入力欄だけのシンプルな構成で」 |
| 「かっこよくして」               | 「ダークモードで、角丸のカード型デザインにして」                     |
| 「全部作って」                   | 「まずチャット画面だけ作って」（範囲を絞る）                       |

> **ポイント：** Claude Code への指示は **具体的に、でも細かすぎず** がベスト。
> 「何が欲しいか」を伝えて、「どう作るか」は Claude Code に任せましょう。

---

## トラブルシューティング

| 症状                         | 原因                            | 対処法                                           |
| ---------------------------- | ------------------------------- | ------------------------------------------------ |
| コンポーネントが見つからない   | shadcn/ui のインストール漏れ     | Claude Code に「○○コンポーネントを追加して」と依頼 |
| API 呼び出しでエラー          | API URL のパスが違う             | 「API の URL を確認して修正して」と依頼            |
| 画面が真っ白                  | React のレンダリングエラー       | ブラウザの開発者ツール（F12）でエラーを確認        |
| スタイルが効かない            | Tailwind CSS の設定不足          | Claude Code に「スタイルが効いていない」と伝える   |

---

> 次は [09_finishing.md](./09_finishing.md) で、アプリ全体の動作確認と仕上げを行います。
