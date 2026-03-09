# Pre-Step：事前セットアップ

> この手順書を研修の **1週間前** に受講者へ配布してください。
> 当日のトラブルを防ぐため、全員が事前に完了していることを確認しましょう。

---

## インストールするもの一覧

| 順番 | ツール               | 必要な理由                                       |
| ---- | -------------------- | ------------------------------------------------ |
| 1    | **VS Code**          | コードエディタ                                    |
| 2    | **Node.js**          | Next.js の実行・パッケージ管理（npm）に必須        |
| 3    | **Docker Desktop**   | PostgreSQL をコンテナで動かすため                  |
| 4    | **Claude Code**      | AI アシスタント（今日の主役！）                    |
| 5    | **Google AI API キー** | Gemini AI を使うため                             |

> **Node.js は必須です。** Next.js の実行環境として、またパッケージ管理ツール npm が付属しています。

---

## 1. VS Code のインストール

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

## 2. Node.js のインストール（必須）

> **Node.js とは？** JavaScript を PC 上で動かすための実行環境です。
> Next.js はこの Node.js の上で動きます。Node.js をインストールすると **npm** というパッケージ管理ツールも一緒に入ります。npm を使ってライブラリのインストールやスクリプトの実行を行います。

### Windows の場合

1. https://nodejs.org にアクセス
2. 「LTS」と書かれた緑色のボタンをクリック（推奨版）
   - ※「Current」ではなく必ず「LTS」を選ぶ
3. ダウンロードされた `.msi` ファイルを実行
4. セットアップウィザードに従う：
   - 「Next」をクリック
   - ライセンスに同意して「Next」
   - インストール先はデフォルトのまま「Next」
   - 「Add to PATH」にチェックが入っていることを確認
   - 「Install」をクリック
5. 完了したら「Finish」をクリック
6. PowerShell を開き直す（PATH を反映するため）

### Mac の場合

1. https://nodejs.org にアクセス
2. 「LTS」と書かれた緑色のボタンをクリック
3. ダウンロードされた `.pkg` ファイルを実行
4. 「続ける」→「同意する」→「インストール」を順にクリック
5. パスワードを入力してインストール完了

### インストール確認

```bash
node --version   # 例：v22.x.x
npm --version    # 例：10.x.x
```

---

## 3. Docker Desktop のインストール

> **Docker とは？** データベースなどのソフトウェアを、PC の環境を汚さずに動かせるツールです。

### Windows の場合

1. https://www.docker.com/products/docker-desktop/ にアクセス
2. 「Download for Windows」をクリック
3. `.exe` を実行してインストール
4. 再起動を求められたら再起動
5. 初回起動時に Docker Desktop が立ち上がることを確認
6. **WSL2 の有効化** を求められたら指示に従う

### Mac の場合

1. https://www.docker.com/products/docker-desktop/ にアクセス
2. 「Download for Mac」をクリック（Apple Silicon / Intel を選択）
3. `.dmg` を開いてアプリケーションフォルダにドラッグ
4. Docker Desktop を起動
5. 上部メニューバーにクジラのアイコンが出ればOK

### インストール確認

```bash
docker --version
# 例：Docker version 28.x.x と表示されればOK

docker compose version
# 例：Docker Compose version v2.x.x と表示されればOK
```

### 事前にイメージを取得（研修当日のネットワーク負荷軽減）

```bash
docker pull pgvector/pgvector:pg18
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
>
> ただし、この方法は Node.js が事前に必要です。上記のスタンドアロンインストーラーなら **Node.js なしで** インストールできます。

---

## 5. Google AI API キーの取得

1. https://aistudio.google.com/apikey にアクセス
2. Google アカウントでログイン
3. 「Create API Key」をクリック
4. 生成された API キーをコピーして安全な場所にメモ（研修当日に使います）

> **API キーは他人に共有しないでください。** GitHub などに公開すると不正利用される可能性があります。

---

## 完了チェックリスト

以下を **すべて** ターミナルで実行し、バージョンが表示されることを確認してください：

```bash
code --version      # VS Code（例：1.96.x）
node --version      # Node.js（例：v22.x.x）
npm --version       # npm（例：10.x.x）
docker --version    # Docker（例：28.x.x）
claude --version    # Claude Code（例：2.x.x）
```

**全部バージョンが表示されたら事前セットアップ完了です！**

> **どれか1つでもエラーが出る場合：**
> 研修担当者に事前に連絡してください。当日のトラブルシューティングは時間が限られています。
