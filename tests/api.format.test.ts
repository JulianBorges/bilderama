import { describe, it, expect } from 'vitest'
import { POST as formatHandler } from '../src/app/api/agent/vfs/format/route'

function mockRequest(body: any) {
  return { async json() { return body } } as any
}

describe('API format', () => {
  it('formata arquivos específicos', async () => {
    const tsCode = 'export const x:number=1;'
    const jsonCode = '{"a":1,"b":2}'

    const res: any = await formatHandler(mockRequest({
      files: [
        { path: 'a.ts', content: tsCode, type: 'script' as const },
        { path: 'b.json', content: jsonCode, type: 'config' as const },
      ],
      paths: ['a.ts']
    }))

    expect(res.status).toBe(200)
    const data = await (res as Response).json()
    const a = data.files.find((f: any) => f.path === 'a.ts')
    const b = data.files.find((f: any) => f.path === 'b.json')
    expect(a.content).toContain('export const x: number = 1')
    expect(b.content).toBe(jsonCode) // não formatado pois não está em paths
  })
}) 