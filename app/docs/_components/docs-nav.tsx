import Link from 'next/link'
import type { Chapter } from '../_lib/chapters'

type DocsNavProps = {
  prev: Chapter | null
  next: Chapter | null
}

export const DocsNav = ({ prev, next }: DocsNavProps) => {
  return (
    <nav className="flex items-center justify-between mt-12 pt-6 border-t border-border">
      {prev ? (
        <Link
          href={`/docs/${prev.slug}`}
          className="group flex flex-col gap-1 text-sm"
        >
          <span className="text-muted-foreground text-xs">&larr; 前へ</span>
          <span className="text-foreground group-hover:text-primary transition-colors font-medium">
            {prev.title}
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={`/docs/${next.slug}`}
          className="group flex flex-col gap-1 text-sm text-right"
        >
          <span className="text-muted-foreground text-xs">次へ &rarr;</span>
          <span className="text-foreground group-hover:text-primary transition-colors font-medium">
            {next.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
