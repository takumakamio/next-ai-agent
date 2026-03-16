# 筆者自己紹介ページ Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 研修講師の自己紹介ページを `/about` に独立した Server Component として作成する。

**Architecture:** `app/about/page.tsx` に1ファイルで完結する静的ページ。既存の shadcn/ui Card コンポーネントと Tailwind CSS を使用。プロフィール画像は `public/about-avatar.jpg` に配置。データは TSX 内にオブジェクトリテラルで定義。

**Tech Stack:** Next.js (Server Component), Tailwind CSS, shadcn/ui Card, next/image, next/link

---

### Task 1: プロフィール画像のプレースホルダーを配置

**Files:**
- Create: `public/about-avatar.jpg`

**Step 1: プレースホルダー画像を配置**

ユーザーに `public/about-avatar.jpg` として自分のプロフィール画像を配置してもらう。
まだ画像がない場合は、仮の画像（任意の正方形 JPG）を配置するか、このステップはスキップ可能。

**Step 2: 確認**

```bash
ls -la public/about-avatar.jpg
```

画像ファイルが存在することを確認する。存在しない場合、Task 2 のコードで画像部分にフォールバック（イニシャルアイコン）を表示する。

---

### Task 2: 自己紹介ページを作成

**Files:**
- Create: `app/about/page.tsx`

**Step 1: `app/about/page.tsx` を作成**

```tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

const profile = {
  name: '名前をここに入力',
  title: '肩書き / 職業をここに入力',
  bio: '簡単な自己紹介文をここに入力してください。研修講師としての経験や専門分野について記載します。',
  avatarPath: '/about-avatar.jpg',
}

const career = [
  { year: '2020年', description: '○○株式会社 入社' },
  { year: '2022年', description: '△△プロジェクトに参画' },
  { year: '2024年', description: '□□チーム テックリード就任' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 戻るリンク */}
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← ホームに戻る
        </Link>

        {/* プロフィールカード */}
        <Card className="mt-6">
          <CardHeader className="items-center text-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4">
              <Image
                src={profile.avatarPath}
                alt={profile.name}
                fill
                className="object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground">{profile.title}</p>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm leading-relaxed">
              {profile.bio}
            </p>
          </CardContent>
        </Card>

        {/* 経歴・実績 */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">経歴・実績</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {career.map((item) => (
                <li key={item.year} className="flex gap-4 text-sm">
                  <span className="text-muted-foreground shrink-0 w-16">
                    {item.year}
                  </span>
                  <span>{item.description}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**Step 2: 開発サーバーで表示確認**

```bash
npm run dev
```

ブラウザで `http://localhost:3000/about` にアクセスし、以下を確認:
- 戻るリンクが表示される
- プロフィールカード（画像、名前、肩書き、紹介文）が表示される
- 経歴・実績カードが表示される
- モバイル幅でもレイアウトが崩れない

**Step 3: コミット**

```bash
git add app/about/page.tsx
git commit -m "feat: add author about page at /about"
```

---

### Task 3: プロフィール内容をカスタマイズ

**Files:**
- Modify: `app/about/page.tsx` (profile, career オブジェクト)

**Step 1: 実際のデータに置き換え**

`profile` オブジェクトと `career` 配列を実際の情報に更新する。
画像を `public/about-avatar.jpg` に差し替える。

**Step 2: 表示確認**

ブラウザで `/about` を確認し、内容が正しく表示されることを確認。

**Step 3: コミット**

```bash
git add app/about/page.tsx public/about-avatar.jpg
git commit -m "docs: update about page with actual profile content"
```
