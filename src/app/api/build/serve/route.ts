import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

function detectContentType(p: string): string {
  if (p.endsWith('.css')) return 'text/css; charset=utf-8'
  if (p.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (p.endsWith('.html')) return 'text/html; charset=utf-8'
  if (p.endsWith('.svg')) return 'image/svg+xml'
  if (p.endsWith('.json')) return 'application/json'
  return 'text/plain; charset=utf-8'
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const hash = url.searchParams.get('hash')
  const relPath = url.searchParams.get('path') || ''
  if (!hash) return NextResponse.json({ error: 'hash é obrigatório' }, { status: 400 })
  const baseDir = path.join(process.cwd(), '.data', 'builds', hash)
  const target = path.join(baseDir, relPath)
  try {
    const data = await fs.readFile(target)
    const ct = detectContentType(target)
    return new NextResponse(data, { status: 200, headers: { 'Content-Type': ct } })
  } catch (e: any) {
    return NextResponse.json({ error: 'arquivo não encontrado' }, { status: 404 })
  }
}


