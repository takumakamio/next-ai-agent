'use client'

import { useCallback, useEffect, useState } from 'react'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import sql from 'highlight.js/lib/languages/sql'

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('tsx', typescript)
hljs.registerLanguage('javascript', typescript)
hljs.registerLanguage('jsx', typescript)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('sql', sql)

type FileViewerModalProps = {
  filePath: string | null
  onClose: () => void
}

export const FileViewerModal = ({ filePath, onClose }: FileViewerModalProps) => {
  const [content, setContent] = useState<string | null>(null)
  const [language, setLanguage] = useState('plaintext')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!filePath) return

    setLoading(true)
    setError(null)
    setContent(null)

    fetch(`/api/docs/source?path=${encodeURIComponent(filePath)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}: ファイルが見つかりません`)
        return res.json()
      })
      .then((data: { content: string; language: string }) => {
        setContent(data.content)
        setLanguage(data.language)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [filePath])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (filePath) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [filePath, onClose])

  const handleCopy = useCallback(async () => {
    if (!content) return
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  if (!filePath) return null

  const highlighted = content
    ? (() => {
        try {
          return hljs.highlight(content, { language }).value
        } catch {
          return hljs.highlightAuto(content).value
        }
      })()
    : ''

  const lineCount = content?.split('\n').length ?? 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      {/* Modal */}
      <div className="relative z-10 w-[90vw] max-w-5xl h-[85vh] bg-[#0d1117] border border-border rounded-xl flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 rounded-t-xl">
          <div className="flex items-center gap-3 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
            <span className="text-sm font-mono text-foreground truncate">{filePath}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {lineCount} lines
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              読み込み中...
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full text-destructive text-sm">
              {error}
            </div>
          )}
          {content && (
            <div className="flex text-sm">
              {/* Line numbers */}
              <div className="sticky left-0 select-none text-right pr-4 pl-4 py-4 text-muted-foreground/40 font-mono text-xs leading-relaxed bg-[#0d1117] border-r border-border/30">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Code */}
              <pre className="flex-1 py-4 px-4 overflow-x-auto">
                <code
                  className={`hljs language-${language} !bg-transparent leading-relaxed`}
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
