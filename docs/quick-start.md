# クイックスタート — 完成版を動かすまで

> 完成版リポジトリをクローンして `npm run dev` で起動するまでの全手順です。
> 上から順番に進めてください。

---

## インストールするもの一覧

| 順番 | ツール | 必要な理由 |
| ---- | --- | --- |
| 1 | **Git** | 完成版コードをダウンロード（クローン）するため |
| 2 | **VS Code** | コードエディタ |
| 3 | **Node.js** | Next.js の実行・パッケージ管理（npm）に必須 |
| 4 | **Claude Code** | AI アシスタント（今日の主役！） |

> **Neon アカウント** と **Google AI API キー** は講師側で用意します。個別に作成する必要はありません。

---

## 1. Git のインストール

> **Git とは？** ソースコードのバージョン管理ツールです。完成版のコードをダウンロード（クローン）するために使います。

### Windows の場合

1. https://git-scm.com にアクセス
2. 「Download for Windows」をクリック
3. ダウンロードされた `.exe` を実行
4. セットアップウィザードに従う（デフォルト設定でOK）
5. **「Git Bash Here」にチェックが入っていることを確認**
6. インストール完了後、PowerShell を開き直す

### Mac の場合

ターミナルで以下を実行すると、未インストールなら自動でインストールが始まります：

```bash
git --version
```

> Xcode Command Line Tools のインストールを促されたら「インストール」をクリックしてください。

### インストール確認

```bash
git --version
# 例：git version 2.x.x と表示されればOK
```

---

## 2. VS Code のインストール

> **VS Code とは？** Microsoft が提供する無料のコードエディタです。

### Windows の場合

1. https://code.visualstudio.com にアクセス
2. 「Download for Windows」ボタンをクリック
3. ダウンロードされた `.exe` ファイルを実行
4. 「次へ」を押していく（デフォルト設定でOK）
5. **「PATH への追加」にチェックを入れる**（重要！）
6. インストール完了

### Mac の場合

1. https://code.visualstudio.com にアクセス
2. 「Download for Mac」ボタンをクリック（Apple Silicon / Intel を選択）
3. ダウンロードされた `.zip` を展開
4. `Visual Studio Code.app` を **アプリケーション** フォルダにドラッグ
5. 初回起動時「開いてもよろしいですか？」→「開く」

### VS Code の初期設定

1. VS Code を起動
2. 左下の歯車アイコン →「設定」を開く
3. 「Auto Save」で検索 →「afterDelay」に変更（自動保存が便利）
4. 日本語化したい場合：
   - 左サイドバーの拡張機能アイコン（四角が4つ）をクリック
   - 「Japanese Language Pack」と検索してインストール
   - VS Code を再起動

### インストール確認

```bash
code --version
# 例：1.96.x と表示されればOK
```

---

## 3. Node.js のインストール

> **Node.js とは？** JavaScript を PC 上で動かすための実行環境です。
> Node.js をインストールすると **npm** というパッケージ管理ツールも一緒に入ります。

### Windows の場合

1. https://nodejs.org にアクセス
2. **「LTS」** と書かれた緑色のボタンをクリック（※「Current」ではなく必ず「LTS」を選ぶ）
3. ダウンロードされた `.msi` ファイルを実行
4. セットアップウィザードに従う：
   - 「Next」をクリック
   - ライセンスに同意して「Next」
   - インストール先はデフォルトのまま「Next」
   - **「Add to PATH」にチェックが入っていることを確認**
   - 「Install」をクリック
5. 完了したら「Finish」をクリック
6. PowerShell を開き直す（PATH を反映するため）

### Mac の場合

1. https://nodejs.org にアクセス
2. **「LTS」** と書かれた緑色のボタンをクリック
3. ダウンロードされた `.pkg` ファイルを実行
4. 「続ける」→「同意する」→「インストール」を順にクリック
5. パスワードを入力してインストール完了

### インストール確認

```bash
node --version      # 例：v22.x.x
npm --version       # 例：10.x.x
```

---

## 4. Claude Code のインストール

> **Claude Code とは？** ターミナルで動く AI アシスタント。自然な日本語で指示すると、コードを書いたりファイルを作ったりしてくれます。**今日の研修の主役です！**

### Mac の場合

```bash
curl -fsSL https://claude.ai/install.sh | sh
```

### Windows の場合

```powershell
irm https://claude.ai/install.ps1 | iex
```

### インストール確認

```bash
claude --version
# バージョン番号が表示されればOK
```

### 初回セットアップ

```bash
# ① 任意のフォルダで claude を起動
claude

# ② 初回はブラウザが開いてAnthropicアカウントへのログインを求められる
#    → ログインして認証を完了する
# ③ ターミナルに戻ると Claude Code が使える状態になる
```

> **前提：** Anthropic のアカウントが必要です。事前に https://console.anthropic.com で作成してください。

> **npm でもインストールできます（代替手段）：**
>
> ```bash
> npm install -g @anthropic-ai/claude-code
> ```

---

## 5. 完了チェックリスト

以下を **すべて** ターミナルで実行し、バージョンが表示されることを確認してください：

```bash
git --version       # Git（例：2.x.x）
code --version      # VS Code（例：1.96.x）
node --version      # Node.js（例：v22.x.x）
npm --version       # npm（例：10.x.x）
claude --version    # Claude Code（例：2.x.x）
```

**全部バージョンが表示されたらツールのセットアップ完了です！**

> **どれか1つでもエラーが出る場合：** 講師に声をかけてください。

---

## 6. リポジトリをクローン

```bash
git clone https://github.com/takumakamio/next-ai-agent.git
cd next-ai-agent
```

---

## 7. パッケージをインストール

```bash
npm install
```

---

## 8. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を開いて以下の2つを設定（講師から配布されます）：

```
DATABASE_URL=postgresql://...（講師から配布）
GOOGLE_GENERATIVE_AI_API_KEY=...（講師から配布）
```

---

## 9. データベースをセットアップ

```bash
# マイグレーション（テーブル作成）
npm run db:gnm

# シードデータ投入（サンプル Q&A）
npm run db:seed
```

---

## 10. 開発サーバーを起動

```bash
npm run dev
```

---

## 11. ブラウザで確認

```
http://localhost:3000
```

チャット画面が表示されれば成功です。

---

## コマンドまとめ（コピー用）

```bash
git clone https://github.com/takumakamio/next-ai-agent.git
cd next-ai-agent
npm install
cp .env.example .env.local
# ↑ .env.local を編集して DATABASE_URL と GOOGLE_GENERATIVE_AI_API_KEY を設定
npm run db:gnm
npm run db:seed
npm run dev
```

---

## トラブルシューティング

| 症状 | 原因 | 対処法 |
| --- | --- | --- |
| `git` コマンドが見つからない | Git 未インストール | ステップ 1 を確認 |
| `node` コマンドが見つからない | Node.js 未インストール | ステップ 3 を確認 |
| `npm install` でエラー | Node.js のバージョンが古い | `node --version` で v22 以上か確認 |
| DB 接続エラー | `DATABASE_URL` の設定ミス | Neon ダッシュボードで接続文字列を再コピー |
| マイグレーション失敗 | pgvector 拡張が未有効 | Neon は pgvector が標準で有効。接続文字列を確認 |
| API キーエラー | `GOOGLE_GENERATIVE_AI_API_KEY` 未設定 | `.env.local` にキーが正しく入っているか確認 |
| ポート 3000 が使用中 | 他のプロセスが占有 | `npx kill-port 3000` で解放 |
