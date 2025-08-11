import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { MemoryVfs } from '@/lib/vfs'

const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  type: z.enum(['component', 'style', 'script', 'page', 'config']),
  description: z.string().optional()
})

const bodySchema = z.object({ files: z.array(fileSchema).default([]) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.issues }, { status: 400 })
    }

    const vfs = new MemoryVfs(parsed.data.files)
    const list = vfs.list()
    return NextResponse.json({ list })
  } catch (err: any) {
    return NextResponse.json({ error: 'Falha ao listar' }, { status: 500 })
  }
} 