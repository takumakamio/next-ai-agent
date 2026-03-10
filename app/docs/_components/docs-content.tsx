'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

type DocsContentProps = {
  content: string
}

export const DocsContent = ({ content }: DocsContentProps) => {
  return (
    <article className="prose prose-invert prose-slate max-w-none
      prose-headings:text-foreground
      prose-p:text-foreground/90
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-strong:text-foreground
      prose-code:text-accent prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border prose-pre:rounded-lg
      prose-blockquote:border-primary prose-blockquote:text-muted-foreground
      prose-th:text-foreground prose-td:text-foreground/90
      prose-table:border-collapse
      prose-hr:border-border
      prose-li:text-foreground/90
      prose-img:rounded-lg
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </article>
  )
}
