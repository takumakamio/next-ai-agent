import type { Metadata } from 'next'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '筆者について',
  description: '研修講師の自己紹介ページ',
}

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
              {career.map((item, index) => (
                <li key={index} className="flex gap-4 text-sm">
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
