import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { MemoryVfs } from '@/lib/vfs'
import { rateLimit } from '../_rateLimit'

const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  type: z.enum(['component', 'style', 'script', 'page', 'config']),
  description: z.string().optional()
})

const diffOperationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('create'), file: fileSchema }),
  z.object({ kind: z.literal('delete'), path: z.string().min(1) }),
  z.object({
    kind: z.literal('replace'),
    path: z.string().min(1),
    oldStringWithContext: z.string().min(1),
    newString: z.string()
  }),
  z.object({
    kind: z.literal('write'),
    path: z.string().min(1),
    content: z.string(),
    type: z.enum(['component', 'style', 'script', 'page', 'config']).optional(),
    description: z.string().optional()
  }),
  z.object({ kind: z.literal('rename'), from: z.string().min(1), to: z.string().min(1) })
])

const applyDiffSchema = z.object({
  files: z.array(fileSchema).default([]),
  operations: z.array(diffOperationSchema).min(1)
})

export async function POST(req: NextRequest) {
  try {
    let limiterKey = 'local'
    try {
      // tolera mocks sem headers
      const hdrs = (req as any)?.headers
      if (hdrs && typeof hdrs.get === 'function') limiterKey = hdrs.get('x-forwarded-for') || 'local'
    } catch {}
    if (!rateLimit(limiterKey)) return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })

    const body = await req.json()
    const parsed = applyDiffSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.issues }, { status: 400 })
    }

    const { files, operations } = parsed.data
    const vfs = new MemoryVfs(files)
    const result = vfs.applyDiff(operations)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const snapshot = vfs.snapshot()
    return NextResponse.json({ changedFiles: result.changedFiles, files: snapshot.files })
  } catch (err: any) {
    return NextResponse.json({ error: 'Falha ao aplicar diffs' }, { status: 500 })
  }
} 