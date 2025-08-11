import { describe, it, expect } from 'vitest'
import { POST as listHandler } from '../src/app/api/agent/vfs/list/route'
import { POST as readHandler } from '../src/app/api/agent/vfs/read/route'
import { POST as snapshotHandler } from '../src/app/api/agent/vfs/snapshot/route'

function mockRequest(body: any) {
  return { async json() { return body } } as any
}

describe('API VFS extra', () => {
  const files = [
    { path: 'a.txt', content: 'hello', type: 'script' as const },
    { path: 'dir/b.txt', content: 'world', type: 'config' as const },
  ]

  it('list', async () => {
    const res: any = await listHandler(mockRequest({ files }))
    expect(res.status).toBe(200)
    const json = await (res as Response).json()
    expect(json.list.length).toBe(2)
  })

  it('read', async () => {
    const res: any = await readHandler(mockRequest({ files, path: 'dir/b.txt' }))
    expect(res.status).toBe(200)
    const json = await (res as Response).json()
    expect(json.file.path).toBe('dir/b.txt')
  })

  it('snapshot', async () => {
    const res: any = await snapshotHandler(mockRequest({ files }))
    expect(res.status).toBe(200)
    const json = await (res as Response).json()
    expect(json.files.length).toBe(2)
  })
}) 