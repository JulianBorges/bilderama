import { describe, it, expect } from 'vitest'
import { POST as typecheckHandler } from '../src/app/api/agent/vfs/typecheck/route'

function mockRequest(body: any) {
  return { async json() { return body } } as any
}

describe('API typecheck', () => {
  it('retorna diagnostics quando há erro', async () => {
    const files = [
      { path: 'a.ts', content: 'const x: string = 123', type: 'script' as const },
      { path: 'b.ts', content: 'export const ok: number = 1', type: 'script' as const },
    ]
    const res: any = await typecheckHandler(mockRequest({ files }))
    expect(res.status).toBe(200)
    const data = await (res as Response).json()
    expect(data.ok).toBe(false)
    expect(Array.isArray(data.diagnostics)).toBe(true)
    expect(data.diagnostics.length).toBeGreaterThan(0)
  })
}) 