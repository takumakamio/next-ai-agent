import type { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '筆者について',
  description: '研修講師の自己紹介ページ',
}

const profile = {
  name: '神尾拓馬',
  title: 'エンジニア / TRAPOL株式会社',
  bio: 'エンジニア歴5年。TRAPOL株式会社でエンジニアとして活動しています。',
  avatarPath: 'https://ca.slack-edge.com/TL04EFUGL-U092QRY3C93-aa97fe4cacb7-512',
}

const career = [
  { year: '2012', description: '某施工管理会社' },
  { year: '2016', description: '某物流会社' },
  { year: '2021', description: 'TRAPOL株式会社' },
]

const hobbies = ['マリオテニス', 'テニス']

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative max-w-2xl mx-auto px-4 pt-8 pb-24">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            ホームに戻る
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-16 pb-12 space-y-6">
        {/* プロフィールカード */}
        <Card className="overflow-hidden">
          <div className="flex flex-col items-center pt-8 pb-2 px-6">
            <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-background shadow-xl">
              <Image
                src={profile.avatarPath}
                alt={profile.name}
                fill
                className="object-cover"
              />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">{profile.name}</h1>
            <p className="mt-1 text-sm text-primary/80 font-medium">{profile.title}</p>
          </div>
          <CardContent className="text-center pb-8">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {profile.bio}
            </p>
          </CardContent>
        </Card>

        {/* 経歴タイムライン */}
        <Card>
          <div className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
              経歴
            </h2>
            <div className="relative pl-6 border-l-2 border-border space-y-6">
              {career.map((item, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-[calc(1.5rem+5px)] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                  <div className="text-xs text-muted-foreground font-mono">{item.year}</div>
                  <div className="text-sm font-medium mt-0.5">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 趣味 */}
        <Card>
          <div className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              趣味
            </h2>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
