import fs from 'node:fs'
import path from 'node:path'
import { type NextRequest, NextResponse } from 'next/server'

const ALLOWED_DIRS = ['app/', 'features/', 'lib/', 'db/', 'components/', 'hooks/', 'styles/']
const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.sql']

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.css': 'css',
  '.json': 'json',
  '.sql': 'sql',
}

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path')

  if (!filePath) {
    return NextResponse.json({ error: 'path parameter is required' }, { status: 400 })
  }

  // Security: prevent path traversal
  const normalized = path.normalize(filePath).replace(/\\/g, '/')
  if (normalized.includes('..') || normalized.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  // Security: only allow specific directories
  const isAllowedDir = ALLOWED_DIRS.some((dir) => normalized.startsWith(dir))
  if (!isAllowedDir) {
    return NextResponse.json({ error: 'Directory not allowed' }, { status: 403 })
  }

  // Security: only allow specific extensions
  const ext = path.extname(normalized)
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 403 })
  }

  const absolutePath = path.join(process.cwd(), normalized)

  if (!fs.existsSync(absolutePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const content = fs.readFileSync(absolutePath, 'utf-8')
  const language = EXTENSION_LANGUAGE_MAP[ext] || 'plaintext'

  return NextResponse.json({ content, path: normalized, language })
}
