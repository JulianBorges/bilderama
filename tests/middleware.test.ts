import { describe, it, expect, vi } from 'vitest'

vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: any, init: any) => ({ body, status: init?.status || 200 }),
      next: () => ({ status: 200, next: true })
    }
  }
})

import { middleware } from '../src/middleware'

describe('middleware', () => {
  it('bloqueia payload grande', () => {
    const bigBody = 'x'.repeat(26 * 1024)
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: bigBody
    }) as any
    const res: any = middleware(req)
    expect(res.status).toBe(413)
  })
}) 