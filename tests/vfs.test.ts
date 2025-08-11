import { describe, it, expect } from 'vitest'
import { MemoryVfs, type DiffOperation, fromGeneratedFiles } from '../src/lib/vfs'

describe('MemoryVfs', () => {
  it('cria a partir de arquivos gerados e lista com hash', () => {
    const vfs = fromGeneratedFiles([
      { path: 'index.html', content: '<html></html>', type: 'page' },
      { path: 'styles.css', content: 'body{margin:0}', type: 'style' },
    ])

    const list = vfs.list()
    expect(list).toHaveLength(2)
    const html = list.find(f => f.path === 'index.html')!
    expect(html.size).toBeGreaterThan(0)
    expect(html.hash).toHaveLength(16)
  })

  it('lê, escreve e deleta arquivos', () => {
    const vfs = new MemoryVfs()
    expect(vfs.read('a.txt')).toBeNull()
    vfs.write({ path: 'a.txt', content: 'hello', type: 'script' })
    expect(vfs.read('a.txt')?.content).toBe('hello')
    vfs.delete('a.txt')
    expect(vfs.read('a.txt')).toBeNull()
  })

  it('renomeia arquivos com validação', () => {
    const vfs = new MemoryVfs([{ path: 'a.txt', content: 'x', type: 'script' }])
    vfs.rename('a.txt', 'b.txt')
    expect(vfs.read('a.txt')).toBeNull()
    expect(vfs.read('b.txt')?.content).toBe('x')
  })

  it('search retorna índices de ocorrências', () => {
    const vfs = new MemoryVfs([{ path: 'a.txt', content: 'one two one', type: 'script' }])
    const matches = vfs.search('one')
    expect(matches[0].indices.length).toBe(2)
  })

  it('applyDiff aplica operações atômicas com rollback em erro', () => {
    const vfs = new MemoryVfs([{ path: 'a.txt', content: 'hello world', type: 'script' }])
    const ops: DiffOperation[] = [
      { kind: 'write', path: 'a.txt', content: 'hello brave world' },
      { kind: 'create', file: { path: 'b.txt', content: 'new', type: 'script' } },
    ]

    const res = vfs.applyDiff(ops)
    expect(res.ok).toBe(true)
    expect(vfs.read('a.txt')?.content).toContain('brave')
    expect(vfs.read('b.txt')).not.toBeNull()

    const fail = vfs.applyDiff([
      { kind: 'replace', path: 'a.txt', oldStringWithContext: 'not-found', newString: 'x' },
      { kind: 'delete', path: 'b.txt' },
    ])
    expect(fail.ok).toBe(false)
    // rollback manteve estado anterior
    expect(vfs.read('b.txt')).not.toBeNull()
  })

  it('replace exige correspondência única', () => {
    const vfs = new MemoryVfs([{ path: 'a.txt', content: 'x x', type: 'script' }])
    const res = vfs.applyDiff([{ kind: 'replace', path: 'a.txt', oldStringWithContext: 'x', newString: 'y' }])
    expect(res.ok).toBe(false)
  })
}) 