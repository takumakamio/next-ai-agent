'use client'

import { useCallback, useState } from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { Node } from 'unist'
import { visit } from 'unist-util-visit'
import { CHAPTERS } from '../_lib/chapters'
import { FileViewerModal } from './file-viewer-modal'

const FILENAME_TO_SLUG = new Map(CHAPTERS.map((c) => [c.filename, c.slug]))

type DocsContentProps = {
  content: string
}

const LANGUAGE_LABELS: Record<string, string> = {
  typescript: 'TypeScript',
  ts: 'TypeScript',
  tsx: 'TSX',
  javascript: 'JavaScript',
  js: 'JavaScript',
  jsx: 'JSX',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  powershell: 'PowerShell',
  json: 'JSON',
  sql: 'SQL',
  css: 'CSS',
  html: 'HTML',
  yaml: 'YAML',
  yml: 'YAML',
  markdown: 'Markdown',
  md: 'Markdown',
  python: 'Python',
  py: 'Python',
}

/**
 * Custom rehype plugin that extracts filepath from code fence language.
 * Transforms `language-json:filepath` → `language-json` + data-filepath attribute.
 * Must run BEFORE rehype-highlight so highlight.js recognizes the language.
 */
function rehypeCodeFilepath() {
  return (tree: Node) => {
    visit(tree, 'element', (node: Record<string, unknown>) => {
      if (node.tagName !== 'code') return
      const props = node.properties as Record<string, unknown> | undefined
      if (!props?.className || !Array.isArray(props.className)) return

      const classes = props.className as string[]
      for (let i = 0; i < classes.length; i++) {
        if (classes[i].startsWith('language-')) {
          const raw = classes[i].replace('language-', '')
          const colonIndex = raw.indexOf(':')
          if (colonIndex > 0) {
            const lang = raw.slice(0, colonIndex)
            const filepath = raw.slice(colonIndex + 1)
            classes[i] = `language-${lang}`
            props.dataFilepath = filepath
            break
          }
        }
      }
    })
  }
}

function parseCodeProps(className?: string, dataFilepath?: string): { language: string | null; filePath: string | null } {
  const filePath = dataFilepath || null

  if (!className) return { language: null, filePath }

  const langMatch = className.match(/language-(\S+)/)
  return {
    language: langMatch ? langMatch[1] : null,
    filePath,
  }
}

export const DocsContent = ({ content }: DocsContentProps) => {
  const [viewerFile, setViewerFile] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  const components: Components = {
    a({ href, children, ...props }) {
      if (href) {
        // Transform ./filename.md links to /docs/slug
        const match = href.match(/^\.\/(.+\.md)$/)
        if (match) {
          const slug = FILENAME_TO_SLUG.get(match[1])
          if (slug) {
            return <a href={slug === 'readme' ? '/docs' : `/docs/${slug}`} {...props}>{children}</a>
          }
        }
      }
      return <a href={href} {...props}>{children}</a>
    },
    pre({ children, ...props }) {
      const codeChild = Array.isArray(children)
        ? children.find((child) => typeof child === 'object' && child !== null && 'type' in child && child.type === 'code')
        : typeof children === 'object' && children !== null && 'type' in children && children.type === 'code'
          ? children
          : null

      if (!codeChild || typeof codeChild !== 'object' || !('props' in codeChild)) {
        return <pre {...props}>{children}</pre>
      }

      const codeProps = codeChild.props as { className?: string; 'data-filepath'?: string; children?: string }
      const { language, filePath } = parseCodeProps(codeProps.className, codeProps['data-filepath'])
      const label = language ? LANGUAGE_LABELS[language] || language : null
      const codeText = typeof codeProps.children === 'string' ? codeProps.children.replace(/\n$/, '') : ''
      const blockId = `code-${codeText.slice(0, 20).replace(/\s/g, '-')}`

      const hasHeader = label || filePath

      return (
        <div className="group relative my-4 rounded-lg border border-border overflow-hidden">
          {hasHeader && (
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border text-xs">
              <div className="flex items-center gap-2 min-w-0">
                {filePath && (
                  <button
                    type="button"
                    onClick={() => setViewerFile(filePath)}
                    className="font-mono text-primary hover:text-primary/80 hover:underline transition-colors truncate"
                    title={`${filePath} を表示`}
                  >
                    {filePath}
                  </button>
                )}
                {label && (
                  <span className={`text-muted-foreground font-medium ${filePath ? 'text-[10px] px-1.5 py-0.5 bg-muted/50 rounded' : ''}`}>
                    {label}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleCopy(codeText, blockId)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
              >
                {copiedId === blockId ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
          {!hasHeader && (
            <button
              type="button"
              onClick={() => handleCopy(codeText, blockId)}
              className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
            >
              {copiedId === blockId ? 'Copied!' : 'Copy'}
            </button>
          )}
          <pre className="!my-0 !rounded-none !border-0" {...props}>
            {children}
          </pre>
        </div>
      )
    },
  }

  return (
    <>
      <article className="prose prose-invert prose-slate max-w-none
        prose-headings:text-foreground
        prose-p:text-foreground/90
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground
        prose-code:text-accent prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-[#0d1117] prose-pre:border-0 prose-pre:rounded-lg
        prose-blockquote:border-primary prose-blockquote:text-muted-foreground
        prose-th:text-foreground prose-td:text-foreground/90
        prose-table:border-collapse
        prose-hr:border-border
        prose-li:text-foreground/90
        prose-img:rounded-lg
      ">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeCodeFilepath, rehypeHighlight]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </article>
      <FileViewerModal filePath={viewerFile} onClose={() => setViewerFile(null)} />
    </>
  )
}
