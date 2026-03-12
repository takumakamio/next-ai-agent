# Docs Viewer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a `/docs` page that renders training Markdown files in a Zenn Book-like layout with sidebar navigation.

**Architecture:** Server Components read Markdown files from `docs/` via `fs`. A chapters constant defines ordering/titles. `react-markdown` + `remark-gfm` + `rehype-highlight` render content. Layout uses sidebar + main content with prev/next navigation.

**Tech Stack:** Next.js Server Components, react-markdown, remark-gfm, rehype-highlight, @tailwindcss/typography (already installed), Tailwind CSS v4

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install react-markdown, remark-gfm, rehype-highlight**

Run: `npm install react-markdown remark-gfm rehype-highlight`

**Step 2: Verify installation**

Run: `npm ls react-markdown remark-gfm rehype-highlight`
Expected: All three packages listed without errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add react-markdown, remark-gfm, rehype-highlight for docs viewer"
```

---

### Task 2: Create chapters definition

**Files:**
- Create: `app/docs/_lib/chapters.ts`

**Step 1: Create the chapters constant**

This file defines the ordered list of all chapters, mapping slugs to titles. The `/docs` landing page uses the first entry (README).

```typescript
export type Chapter = {
  slug: string
  title: string
  filename: string
}

export const CHAPTERS: Chapter[] = [
  { slug: 'readme', title: '研修概要', filename: 'README.md' },
  { slug: '00_learning-outcomes', title: 'この研修で理解できるようになること', filename: '00_learning-outcomes.md' },
  { slug: '01_tech-overview', title: 'この研修で使う技術を知ろう', filename: '01_tech-overview.md' },
  { slug: '02_pre-setup', title: '事前セットアップ', filename: '02_pre-setup.md' },
  { slug: '03_claude-code-intro', title: 'Step 0: Claude Code の使い方', filename: '03_claude-code-intro.md' },
  { slug: '04_database', title: 'Step 1: データベースを作ろう', filename: '04_database.md' },
  { slug: '05_api', title: 'Step 2: API を作ろう', filename: '05_api.md' },
  { slug: '06_ai-conversation', title: 'Step 3: AI と会話できるようにしよう', filename: '06_ai-conversation.md' },
  { slug: '07_frontend', title: 'Step 4: 画面を作ろう', filename: '07_frontend.md' },
  { slug: '08_hands-on-challenge', title: 'Step 5: 実践チャレンジ', filename: '08_hands-on-challenge.md' },
  { slug: '09_finishing', title: 'Step 6: 仕上げ & 振り返り', filename: '09_finishing.md' },
]

export function getChapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug)
}

export function getAdjacentChapters(slug: string): { prev: Chapter | null; next: Chapter | null } {
  const index = CHAPTERS.findIndex((c) => c.slug === slug)
  return {
    prev: index > 0 ? CHAPTERS[index - 1] : null,
    next: index < CHAPTERS.length - 1 ? CHAPTERS[index + 1] : null,
  }
}
```

**Step 2: Commit**

```bash
git add app/docs/_lib/chapters.ts
git commit -m "feat: add chapters definition for docs viewer"
```

---

### Task 3: Create Markdown loader utility

**Files:**
- Create: `app/docs/_lib/load-markdown.ts`

**Step 1: Create the Markdown file loader**

Reads a Markdown file from the `docs/` directory. Used in Server Components only.

```typescript
import fs from 'node:fs'
import path from 'node:path'

export function loadMarkdown(filename: string): string {
  const filePath = path.join(process.cwd(), 'docs', filename)
  return fs.readFileSync(filePath, 'utf-8')
}
```

**Step 2: Commit**

```bash
git add app/docs/_lib/load-markdown.ts
git commit -m "feat: add markdown file loader for docs viewer"
```

---

### Task 4: Create Markdown content renderer component

**Files:**
- Create: `app/docs/_components/docs-content.tsx`

**Step 1: Create the Markdown renderer**

Client component that renders Markdown to HTML with GFM tables, syntax highlighting, and typography styling. Uses the project's existing dark theme.

```tsx
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
```

**Step 2: Commit**

```bash
git add app/docs/_components/docs-content.tsx
git commit -m "feat: add markdown content renderer component"
```

---

### Task 5: Create sidebar component

**Files:**
- Create: `app/docs/_components/docs-sidebar.tsx`

**Step 1: Create the sidebar**

Client component. Shows chapter list with current chapter highlighted. On mobile, toggles via a hamburger button.

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CHAPTERS } from '../_lib/chapters'

type DocsSidebarProps = {
  currentSlug: string
}

export const DocsSidebar = ({ currentSlug }: DocsSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false)

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
              Claude Code 1日研修
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            {CHAPTERS.map((chapter, index) => {
              const isActive = chapter.slug === currentSlug
              return (
                <Link
                  key={chapter.slug}
                  href={`/docs/${chapter.slug}`}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                    ${isActive
                      ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    }
                  `}
                >
                  <span className={`
                    shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5
                    ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-sidebar-accent text-sidebar-foreground/50'}
                  `}>
                    {index}
                  </span>
                  <span className="leading-relaxed">{chapter.title}</span>
                </Link>
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
```

**Step 2: Commit**

```bash
git add app/docs/_components/docs-sidebar.tsx
git commit -m "feat: add sidebar component for docs viewer"
```

---

### Task 6: Create prev/next navigation component

**Files:**
- Create: `app/docs/_components/docs-nav.tsx`

**Step 1: Create the navigation**

Shows previous/next chapter links at the bottom of content.

```tsx
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
```

**Step 2: Commit**

```bash
git add app/docs/_components/docs-nav.tsx
git commit -m "feat: add prev/next navigation for docs viewer"
```

---

### Task 7: Create docs layout

**Files:**
- Create: `app/docs/layout.tsx`

**Step 1: Create layout**

Server component wrapping sidebar + content area. Provides consistent layout for all `/docs/*` routes.

```tsx
import type { ReactNode } from 'react'

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/docs/layout.tsx
git commit -m "feat: add docs layout"
```

---

### Task 8: Create /docs landing page

**Files:**
- Create: `app/docs/page.tsx`

**Step 1: Create landing page**

Server component. Loads `README.md` and renders it with sidebar. Shows `readme` as the active chapter.

```tsx
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
```

**Step 2: Commit**

```bash
git add app/docs/page.tsx
git commit -m "feat: add /docs landing page"
```

---

### Task 9: Create /docs/[slug] dynamic page

**Files:**
- Create: `app/docs/[slug]/page.tsx`

**Step 1: Create the dynamic page**

Server component. Reads slug from params, loads the corresponding Markdown file, renders with sidebar and navigation. Returns 404 for invalid slugs. Uses `generateStaticParams` for static generation of all chapter pages.

```tsx
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
```

**Step 2: Commit**

```bash
git add app/docs/[slug]/page.tsx
git commit -m "feat: add dynamic docs page with slug routing"
```

---

### Task 10: Add highlight.js theme CSS

**Files:**
- Modify: `styles/globals.css`

**Step 1: Import a dark highlight.js theme**

Add the highlight.js GitHub Dark theme import to `globals.css` for code syntax highlighting.

Add at the top of `styles/globals.css` (after the existing imports):

```css
@import "highlight.js/styles/github-dark.min.css";
```

**Step 2: Commit**

```bash
git add styles/globals.css
git commit -m "feat: add highlight.js dark theme for code blocks"
```

---

### Task 11: Verify and test

**Step 1: Build the project**

Run: `npm run build`
Expected: No build errors

**Step 2: Start dev server and verify pages**

Run: `npm run dev`

Verify:
- `/docs` shows README.md content with sidebar
- `/docs/04_database` shows Step 1 content
- Sidebar highlights current page
- Prev/Next navigation works
- Code blocks have syntax highlighting
- Tables render correctly
- Mobile responsive (sidebar toggles)

**Step 3: Commit any fixes if needed**
