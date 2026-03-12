import { notFound } from 'next/navigation'
import { DocsContent } from '../_components/docs-content'
import { DocsNav } from '../_components/docs-nav'
import { DocsSidebar } from '../_components/docs-sidebar'
import { CHAPTERS, getAdjacentChapters, getChapterBySlug } from '../_lib/chapters'
import { loadMarkdown } from '../_lib/load-markdown'

type Props = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return CHAPTERS.map((chapter) => ({ slug: chapter.slug }))
}

export default async function DocsSlugPage({ params }: Props) {
  const { slug } = await params
  const chapter = getChapterBySlug(slug)
  if (!chapter) notFound()

  const content = loadMarkdown(chapter.filename)
  const { prev, next } = getAdjacentChapters(slug)

  return (
    <div className="flex">
      <DocsSidebar currentSlug={slug} />
      <main className="flex-1 min-w-0 px-6 py-8 md:px-12 lg:px-16 max-w-4xl mx-auto">
        <DocsContent content={content} />
        <DocsNav prev={prev} next={next} />
      </main>
    </div>
  )
}
