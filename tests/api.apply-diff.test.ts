import { describe, it, expect } from 'vitest'
import { POST as applyDiffHandler } from '../src/app/api/agent/vfs/apply-diff/route'

function mockRequest(body: any) {
  return {
    async json() { return body }
  } as any
}

describe('API /api/agent/vfs/apply-diff', () => {
  it('aplica diffs válidos e retorna snapshot', async () => {
    const req = mockRequest({
      files: [
        { path: 'a.txt', content: 'hello', type: 'script' }
      ],
      operations: [
        { kind: 'write', path: 'a.txt', content: 'hello world' },
        { kind: 'create', file: { path: 'b.txt', content: 'x', type: 'config' } }
      ]
    })

    const res: any = await applyDiffHandler(req)
    expect(res.status).toBe(200)
    const json = await (res as Response).json()
    expect(json.changedFiles.length).toBe(2)
    expect(json.files.find((f: any) => f.path === 'b.txt')).toBeTruthy()
  })

  it('recusa replace ambíguo', async () => {
    const req = mockRequest({
      files: [ { path: 'a.txt', content: 'x x', type: 'script' } ],
      operations: [ { kind: 'replace', path: 'a.txt', oldStringWithContext: 'x', newString: 'y' } ]
    })
    const res: any = await applyDiffHandler(req)
    expect(res.status).toBe(400)
  })
}) 