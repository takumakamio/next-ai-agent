import fs from 'node:fs'
import path from 'node:path'

export function loadMarkdown(filename: string): string {
  const filePath = path.join(process.cwd(), 'docs', filename)
  return fs.readFileSync(filePath, 'utf-8')
}
