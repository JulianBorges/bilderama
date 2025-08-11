import crypto from 'node:crypto'
import type { VfsFile, VfsListEntry, ApplyOutcome, DiffOperation, VfsKind, VfsSnapshot, SearchMatch } from './types'

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16)
}

function normalizePath(p: string): string {
  const trimmed = p.trim()
  if (!trimmed) throw new Error('Caminho vazio')
  return trimmed.replace(/\\/g, '/').replace(/^\/+/, '')
}

export class MemoryVfs {
  private files = new Map<string, VfsFile>()

  constructor(initialFiles?: VfsFile[]) {
    if (initialFiles && initialFiles.length > 0) {
      for (const f of initialFiles) {
        const path = normalizePath(f.path)
        this.files.set(path, { ...f, path })
      }
    }
  }

  snapshot(): VfsSnapshot {
    return { files: Array.from(this.files.values()).map(f => ({ ...f })) }
  }

  list(): VfsListEntry[] {
    return Array.from(this.files.values()).map(f => ({
      path: f.path,
      type: f.type,
      size: Buffer.byteLength(f.content, 'utf8'),
      hash: hashContent(f.content)
    }))
  }

  read(path: string): VfsFile | null {
    const key = normalizePath(path)
    const f = this.files.get(key)
    return f ? { ...f } : null
  }

  write(file: VfsFile): void {
    const path = normalizePath(file.path)
    this.files.set(path, { ...file, path })
  }

  delete(path: string): boolean {
    return this.files.delete(normalizePath(path))
  }

  rename(from: string, to: string): void {
    const srcKey = normalizePath(from)
    const dstKey = normalizePath(to)
    if (!this.files.has(srcKey)) throw new Error(`Arquivo não encontrado para renomear: ${from}`)
    if (this.files.has(dstKey)) throw new Error(`Destino já existe: ${to}`)
    const f = this.files.get(srcKey)!
    this.files.delete(srcKey)
    this.files.set(dstKey, { ...f, path: dstKey })
  }

  search(query: string | RegExp): SearchMatch[] {
    const results: SearchMatch[] = []
    for (const f of this.files.values()) {
      const indices: number[] = []
      if (typeof query === 'string') {
        let idx = 0
        while (true) {
          idx = f.content.indexOf(query, idx)
          if (idx === -1) break
          indices.push(idx)
          idx += query.length
        }
      } else {
        const matchAll = f.content.matchAll(query)
        for (const m of matchAll) {
          if (m.index !== undefined) indices.push(m.index)
        }
      }
      if (indices.length > 0) results.push({ path: f.path, indices })
    }
    return results
  }

  applyDiff(operations: DiffOperation[]): ApplyOutcome {
    const backup = this.snapshot()
    const changed: string[] = []

    try {
      for (const op of operations) {
        switch (op.kind) {
          case 'create': {
            const key = normalizePath(op.file.path)
            if (this.files.has(key)) throw new Error(`Já existe: ${op.file.path}`)
            this.write(op.file)
            changed.push(key)
            break
          }
          case 'delete': {
            const key = normalizePath(op.path)
            if (!this.files.has(key)) throw new Error(`Não existe: ${op.path}`)
            this.delete(key)
            changed.push(key)
            break
          }
          case 'write': {
            const key = normalizePath(op.path)
            const prev = this.files.get(key)
            const type: VfsKind = op.type ?? prev?.type ?? 'page'
            const description = op.description ?? prev?.description
            this.write({ path: key, content: op.content, type, description })
            changed.push(key)
            break
          }
          case 'replace': {
            const key = normalizePath(op.path)
            const f = this.files.get(key)
            if (!f) throw new Error(`Arquivo não encontrado: ${op.path}`)
            const occurrences = f.content.split(op.oldStringWithContext).length - 1
            if (occurrences !== 1) {
              throw new Error(`replace requer correspondência única em ${op.path} (ocorrências: ${occurrences})`)
            }
            const next = f.content.replace(op.oldStringWithContext, op.newString)
            this.write({ ...f, content: next })
            changed.push(key)
            break
          }
          case 'rename': {
            this.rename(op.from, op.to)
            changed.push(normalizePath(op.from))
            changed.push(normalizePath(op.to))
            break
          }
          default:
            // @ts-expect-error narrow exhaustive
            throw new Error(`Operação desconhecida: ${op.kind}`)
        }
      }

      return { ok: true, changedFiles: Array.from(new Set(changed)) }
    } catch (error: any) {
      // rollback
      this.files.clear()
      for (const f of backup.files) this.files.set(normalizePath(f.path), { ...f })
      return { ok: false, error: error?.message || String(error) }
    }
  }
}

export function fromGeneratedFiles(files: Array<{ path: string; content: string; type: VfsKind; description?: string }>): MemoryVfs {
  return new MemoryVfs(files.map(f => ({ ...f })))
} 