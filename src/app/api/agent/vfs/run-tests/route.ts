import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { execFile } from 'node:child_process'

const bodySchema = z.object({
  pattern: z.string().optional(),
  timeoutMs: z.number().int().positive().max(60_000).default(15_000),
  extraArgs: z.array(z.string()).optional(),
})

function execVitest(args: string[], timeoutMs: number): Promise<{ code: number | null; stdout: string; stderr: string; durationMs: number }> {
  return new Promise((resolve) => {
    const started = Date.now()
    const child = execFile('npx', ['vitest', 'run', ...args], { env: { ...process.env } }, (error, stdout, stderr) => {
      const durationMs = Date.now() - started
      // error?.code é o exit code quando diferente de 0
      const code = (error as any)?.code ?? 0
      resolve({ code, stdout: stdout?.toString?.() || '', stderr: stderr?.toString?.() || '', durationMs })
    })

    const to = setTimeout(() => {
      try { child.kill('SIGKILL') } catch {}
      const durationMs = Date.now() - started
      resolve({ code: 124, stdout: '', stderr: 'Timeout ao executar testes', durationMs })
    }, timeoutMs)

    child.on('exit', () => clearTimeout(to))
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Payload inválido', details: parsed.error.issues }, { status: 400 })

    const { pattern, timeoutMs, extraArgs } = parsed.data
    const args = ['--silent']
    if (pattern) args.push(pattern)
    if (extraArgs && extraArgs.length > 0) args.push(...extraArgs)

    const result = await execVitest(args, timeoutMs)

    return NextResponse.json({
      ok: result.code === 0,
      code: result.code,
      durationMs: result.durationMs,
      stdout: result.stdout,
      stderr: result.stderr,
    }, { status: result.code === 0 ? 200 : 200 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Falha ao executar testes' }, { status: 500 })
  }
} 