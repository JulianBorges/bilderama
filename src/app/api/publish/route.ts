import { NextRequest, NextResponse } from 'next/server'
import { publishFiles } from '@/lib/publishStore'
import { z } from 'zod'
import type { GeneratedFile } from '@/lib/ai'

const publishSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    type: z.enum(['component', 'style', 'script', 'page', 'config']),
    description: z.string().optional()
  }))
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = publishSchema.parse(body)
    const files: GeneratedFile[] = parsed.files.map(f => ({
      path: f.path,
      content: f.content,
      type: f.type,
      description: f.description ?? ''
    }))
    const { slug } = publishFiles(files)
    return NextResponse.json({ slug })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Payload inválido', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Falha ao publicar' }, { status: 500 })
  }
} 