# Pre-Step：事前セットアップ

> この手順書を研修の **1週間前** に受講者へ配布してください。
> 当日のトラブルを防ぐため、全員が事前に完了していることを確認しましょう。
>
> 研修で何が学べるかは [00_learning-outcomes.md](./00_learning-outcomes.md)、使う技術の解説は [01_tech-overview.md](./01_tech-overview.md) をご覧ください。

---

## インストールするもの一覧

| 順番 | ツール               | 必要な理由                                       |
| ---- | -------------------- | ------------------------------------------------ |
| 1    | **VS Code**          | コードエディタ                                    |
| 2    | **Node.js**          | Next.js の実行・パッケージ管理（npm）に必須        |
| 3    | **Neon アカウント**    | クラウド PostgreSQL（データベース）を利用するため    |
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

## 3. Neon アカウントの作成

> **Neon とは？** クラウド上で PostgreSQL データベースを提供するサービスです。ローカルにデータベースをインストールする必要がなく、ブラウザから簡単に管理できます。

1. https://neon.tech にアクセス
2. 「Sign Up」からアカウントを作成（GitHub アカウントでもログイン可能）
3. ログイン後、ダッシュボードが表示されることを確認

> **データベースの作成は研修当日に行います。** アカウント作成だけ事前に済ませてください。

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
AI API キーは不要です。
こちらで用意します

---

## 完了チェックリスト

以下を **すべて** ターミナルで実行し、バージョンが表示されることを確認してください：

```bash
code --version      # VS Code（例：1.96.x）
node --version      # Node.js（例：v22.x.x）
npm --version       # npm（例：10.x.x）
claude --version    # Claude Code（例：2.x.x）
```

**全部バージョンが表示されたら事前セットアップ完了です！**

> **どれか1つでもエラーが出る場合：**
> 事前に連絡してください。当日のトラブルシューティングは時間が限られています。
