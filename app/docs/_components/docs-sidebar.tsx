'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CHAPTERS } from '../_lib/chapters'

type DocsSidebarProps = {
  currentSlug: string
}

export const DocsSidebar = ({ currentSlug }: DocsSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const currentIndex = CHAPTERS.findIndex((c) => c.slug === currentSlug)

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-card border border-border rounded-lg p-2 text-foreground"
        aria-label="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 bg-sidebar border-r border-sidebar-border
          transform transition-transform duration-200 ease-in-out
          md:sticky md:top-0 md:translate-x-0 md:h-screen
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border">
            <Link href="/docs" className="text-sm font-bold text-sidebar-foreground hover:text-sidebar-primary transition-colors">
              Claude Code で喋る AI アバターを作ろう
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-sidebar-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-sidebar-primary rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / CHAPTERS.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-sidebar-foreground/50 tabular-nums">
                {currentIndex + 1}/{CHAPTERS.length}
              </span>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {CHAPTERS.map((chapter, index) => {
              const isActive = chapter.slug === currentSlug
              const isPast = index < currentIndex
              const isFirst = index === 0
              const isLast = index === CHAPTERS.length - 1

              return (
                <div key={chapter.slug} className="relative">
                  {/* Vertical line connecting steps */}
                  {!isFirst && (
                    <div
                      className={`absolute left-[22px] -top-0.5 w-0.5 h-3 ${
                        isPast || isActive ? 'bg-sidebar-primary/50' : 'bg-sidebar-accent'
                      }`}
                    />
                  )}
                  {!isLast && (
                    <div
                      className={`absolute left-[22px] bottom-0 w-0.5 h-3 ${
                        isPast ? 'bg-sidebar-primary/50' : 'bg-sidebar-accent'
                      }`}
                    />
                  )}

                  <Link
                    href={chapter.slug === 'quick-start' ? '/docs' : `/docs/${chapter.slug}`}
                    onClick={() => setIsOpen(false)}
                    className={`
                      relative flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${isActive
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                        : isPast
                          ? 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                          : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/70'
                      }
                    `}
                  >
                    <span className={`
                      relative z-10 shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 transition-colors
                      ${isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground ring-2 ring-sidebar-primary/30'
                        : isPast
                          ? 'bg-sidebar-primary/20 text-sidebar-primary'
                          : 'bg-sidebar-accent text-sidebar-foreground/40'
                      }
                    `}>
                      {isPast ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        index
                      )}
                    </span>
                    <span className="leading-relaxed">{chapter.title}</span>
                  </Link>
                </div>
              )
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <Link
              href="/"
              className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
            >
              &larr; アプリに戻る
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
