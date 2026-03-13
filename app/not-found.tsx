import Link from 'next/link'

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-lg text-muted-foreground">ページが見つかりませんでした</p>
      <Link
        href="/"
        className="mt-4 text-sm text-primary underline underline-offset-4 hover:opacity-80"
      >
        ホームに戻る
      </Link>
    </div>
  )
}

export default NotFound
