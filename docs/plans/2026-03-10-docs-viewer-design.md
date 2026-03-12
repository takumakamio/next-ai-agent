# Design: Training Docs Viewer Page

## Overview

Create a `/docs` page that displays the training materials from the `docs/` directory in a Zenn Book-like UI, allowing trainees to browse step-by-step instructions during the workshop.

## Requirements

- Display all training Markdown files (00-09) as browsable chapters
- Zenn Book-style layout: sidebar with chapter list + main content area
- Previous/Next navigation between chapters
- Responsive design (mobile-friendly sidebar)
- Code syntax highlighting
- GFM support (tables, checklists, blockquotes)

## Architecture

### Routing

```
app/docs/
  page.tsx              -> /docs (shows README.md as landing)
  [slug]/page.tsx       -> /docs/04_database etc.
  _components/
    docs-sidebar.tsx    -> Chapter list sidebar
    docs-content.tsx    -> Markdown rendering
    docs-layout.tsx     -> Sidebar + content layout
    docs-nav.tsx        -> Previous/Next navigation
```

### Chapter Definition

Ordered constant array mapping slugs to display titles, derived from `docs/` filenames.

### Tech Stack

| Concern | Solution |
|---------|----------|
| Markdown loading | `fs.readFileSync` in Server Components |
| Markdown rendering | `react-markdown` + `remark-gfm` |
| Code highlighting | `rehype-highlight` |
| Styling | Tailwind CSS + `@tailwindcss/typography` (prose) |
| Routing | Next.js Dynamic Routes `[slug]` |

### Additional Packages

- `react-markdown`
- `remark-gfm`
- `rehype-highlight`
- `@tailwindcss/typography`

### Data Flow

1. User accesses `/docs/04_database`
2. Server Component receives `slug = "04_database"`
3. `fs.readFileSync("docs/04_database.md")` loads content
4. Chapter array provides prev/next page info
5. `react-markdown` renders to HTML with GFM + syntax highlighting
6. Layout renders sidebar + content + navigation

No API calls or DB access needed. All file-system reads at build/SSR time.

### UI Layout

```
+--------------------------------------------------+
| Header: "Claude Code 1 Day Workshop"             |
+------------+-------------------------------------+
| Sidebar    | Main Content                        |
|            |                                     |
| * Overview | # Step 1: Build the Database        |
| * Tech     |                                     |
| * Setup    | > Goal: Create Q&A tables...        |
| * Step 0   |                                     |
| > Step 1   | ## 1. Install Drizzle ORM           |
| * Step 2   | ...                                 |
| * Step 3   |                                     |
| * Step 4   | <- Previous        Next ->          |
| * Step 5   |                                     |
| * Step 6   |                                     |
+------------+-------------------------------------+
```

- Sidebar: Highlights current chapter
- Responsive: Sidebar collapses to hamburger on mobile
- Dark theme: Inherits existing app dark theme
