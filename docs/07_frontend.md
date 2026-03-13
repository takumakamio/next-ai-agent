# Step 4：画面を作ろう（10分）

> **ゴール：** チャット画面と QA 管理画面を作る

---

## このステップで作るもの

- shadcn/ui コンポーネントの導入
- チャット画面（メッセージリスト + 入力欄）
- QA 管理画面（テーブル + 追加フォーム）
- タブで画面を切り替え

---

## ① shadcn/ui の導入（3分）

> **shadcn/ui とは？** きれいな UI 部品（ボタン、入力欄、テーブルなど）をすぐに使えるようにしてくれるライブラリです。自分でデザインを1から作る必要がありません。

Claude Code への指示：

> 「shadcn/ui を導入して。Button、Input、Card、Dialog、Table、Textarea、Tabs コンポーネントを追加して」

→ `components/ui/` フォルダにコンポーネントが生成される

---

## ② チャット画面（5分）

### まずはシンプルなチャット UI を作る

Claude Code への指示：

> 「チャット画面を作って。シンプルにメッセージリストと入力欄だけ。ユーザーのメッセージは右側、AI の回答は左側に表示。送信したら conversation API を呼んで回答を表示して。ダークモードのかっこいいデザインで」

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

---

## ③ QA 管理画面（5分）

Claude Code への指示：

> 「Q&A の管理画面を作って。一覧表示はテーブル形式で、新規追加のフォームも付けて。テーブルには ID、カテゴリ、質問、作成日を表示。フォームには質問、回答、カテゴリの入力欄を用意して」

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

Claude Code への指示：

> 「トップページにタブを付けて、『チャット』と『Q&A 管理』を切り替えられるようにして」

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
