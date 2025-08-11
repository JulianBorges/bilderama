import { describe, it, expect } from 'vitest'
import { POST as runTestsHandler } from '../src/app/api/agent/vfs/run-tests/route'

function mockRequest(body: any) { return { async json() { return body } } as any }

describe('API run-tests', () => {
  it('executa vitest com padrão simples', async () => {
    const res: any = await runTestsHandler(mockRequest({ pattern: 'tests/schemas.test.ts', timeoutMs: 15000 }))
    expect(res.status).toBe(200)
    const data = await (res as Response).json()
    expect(typeof data.ok).toBe('boolean')
    expect(typeof data.stdout).toBe('string')
  }, 20000)
}) 