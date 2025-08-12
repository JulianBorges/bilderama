import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

async function readText(p: string): Promise<string | null> {
  try { return await fs.readFile(p, 'utf8') } catch { return null }
}

function rewriteAssetLinks(html: string, baseUrl: string): string {
  // reescreve <link href="*.css"> e <script src="*.js">
  const cssRe = /<link\s+[^>]*?href\s*=\s*(["'])(?!http)([^"'>]+?\.css)\1[^>]*?>/gi
  const jsRe = /<script\s+[^>]*?src\s*=\s*(["'])(?!http)([^"'>]+?\.js)\1[^>]*?>/gi
  return html
    .replace(cssRe, (_m, q, href) => `<link rel="stylesheet" href="${baseUrl}&path=${encodeURIComponent(href)}">`)
    .replace(jsRe, (_m, q, src) => `<script src="${baseUrl}&path=${encodeURIComponent(src)}"></script>`)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const hash = url.searchParams.get('hash')
  if (!hash) return NextResponse.json({ error: 'hash é obrigatório' }, { status: 400 })
  const baseDir = path.join(process.cwd(), '.data', 'builds', hash)
  const indexPath = path.join(baseDir, 'index.html')
  const html = await readText(indexPath)
  if (!html) return NextResponse.json({ error: 'index.html não encontrado' }, { status: 404 })
  const baseServe = `/api/build/serve?hash=${encodeURIComponent(hash)}`
  const rewritten = rewriteAssetLinks(html, baseServe)
  return new NextResponse(rewritten, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}


