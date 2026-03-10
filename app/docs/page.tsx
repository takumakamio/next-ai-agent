import { DocsContent } from './_components/docs-content'
import { DocsNav } from './_components/docs-nav'
import { DocsSidebar } from './_components/docs-sidebar'
import { getAdjacentChapters } from './_lib/chapters'
import { loadMarkdown } from './_lib/load-markdown'

export default function DocsPage() {
  const content = loadMarkdown('README.md')
  const { prev, next } = getAdjacentChapters('readme')

  return (
    <div className="flex">
      <DocsSidebar currentSlug="readme" />
      <main className="flex-1 min-w-0 px-6 py-8 md:px-12 lg:px-16 max-w-4xl mx-auto">
        <DocsContent content={content} />
        <DocsNav prev={prev} next={next} />
      </main>
    </div>
  )
}
