# Step 0：Claude Code の使い方を覚えよう（45分）

> 事前セットアップが完了している前提で進めます。
> まだの方は [02_pre-setup.md](./02_pre-setup.md) を先に完了してください。

---

## 当日の開始前チェック（5分）

### 講師が全員に確認

全員がこの4つを実行して、バージョンが出ることを画面共有で確認：

```bash
code --version      # VS Code
node --version      # Node.js
docker --version    # Docker
claude --version    # Claude Code
```

> ここでエラーが出る人がいたら、講師がサポートしつつ、他の受講者は先に進んでもらう。

---

## ① Docker を起動しておく（5分）

```
Windows：タスクバーからDocker Desktopを起動（クジラアイコンが出ればOK）
Mac：アプリケーションからDocker Desktopを起動（メニューバーにクジラアイコン）
```

---

## ② プロジェクト用フォルダを作って VS Code で開く（5分）

```bash
# ホームディレクトリにフォルダを作成
mkdir ~/my-ai-chat
cd ~/my-ai-chat

# VS Codeで開く
code .
```

---

## ③ VS Code のターミナルで Claude Code を起動（5分）

VS Code 上部メニュー →「ターミナル」→「新しいターミナル」
（またはショートカット：`Ctrl + ` `）

```bash
claude
```

→ Claude Code が起動したら、まず話しかけてみましょう！

---

## ④ ウォーミングアップ：Claude Code と会話してみよう（10分）

以下を順番に試してみましょう：

### レベル1：質問する

> 「Next.js って何ですか？初心者向けに教えて」

### レベル2：ファイルを作ってもらう

> 「このフォルダに hello.ts というファイルを作って。Hello World を表示するプログラムを書いて」

### レベル3：実行してもらう

> 「今作った hello.ts を実行して」

---

## ⑤ プロジェクトを生成してもらう（15分）

### Next.js プロジェクトの作成

Claude Code への指示：

> 「Next.js のプロジェクトを初期化して。TypeScript と Tailwind CSS 4 を使う構成で。パッケージマネージャーは npm で。」

→ 生成されたファイルを一緒に確認：

- `package.json` — 使うライブラリの一覧
- `tsconfig.json` — TypeScript の設定
- `app/page.tsx` — 最初のページ

### 環境変数の設定

Claude Code への指示：

> 「.env.local ファイルを作って。中身はこの2つ：
> DATABASE_URL=postgresql://postgres:postgres@localhost:5432/next_ai_agent
> GOOGLE_GENERATIVE_AI_API_KEY=（自分のAPIキーをここに貼る）」

> **セキュリティ注意：** `.env.local` には API キーなどの秘密情報を書きます。このファイルは `.gitignore` に含まれているため Git にアップされません。**API キーを直接コードに書かない** ようにしましょう。

### Docker Compose の設定

Claude Code への指示：

> 「docker-compose.yml を作って。pgvector/pgvector:pg18 イメージで PostgreSQL を動かしたい。ポートは 5432、データベース名は next_ai_agent、ユーザーとパスワードは postgres」

### 起動確認

```bash
docker compose up -d
npm run dev
```

→ `http://localhost:3000` で画面が表示されれば **Step 0 完了！**

---

## Claude Code 操作チートシート

| やりたいこと             | 指示の例                                           |
| ------------------------ | -------------------------------------------------- |
| ファイルを作りたい       | 「○○.ts ファイルを作って」                          |
| コードを書いてほしい     | 「△△する関数を書いて」                              |
| エラーを直したい         | エラーメッセージを貼り付けて「これを直して」         |
| コードの意味を知りたい   | 「この部分を説明して」                              |
| パッケージを入れたい     | 「○○をインストールして」                            |
| コマンドを実行したい     | 「npm run dev を実行して」                          |
| 今あるコードを修正したい | 「○○を△△に変更して」                               |
| わからないことを聞きたい | 「pgvector って何？」                               |
| デザインを調整したい     | 「ボタンをもっと大きくして」「余白を広くして」       |
| 困ったとき               | 「今の状態を確認して、何がおかしいか教えて」         |

---

## このステップで伝えること

> **「Claude Code には、友達に頼むように自然な日本語で指示を出せばOKです。完璧な指示じゃなくても、会話しながら修正できます。」**
