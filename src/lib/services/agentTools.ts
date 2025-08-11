import type { GeneratedFile } from '@/lib/ai'
import { MemoryVfs, toVfsFile, fromVfsFile, type DiffOperation, type VfsFile } from '@/lib/vfs'

export class AgentVfsSession {
  private vfs: MemoryVfs

  constructor(initialFiles?: GeneratedFile[]) {
    this.vfs = new MemoryVfs(initialFiles?.map(toVfsFile))
  }

  init(files: GeneratedFile[]) {
    this.vfs = new MemoryVfs(files.map(toVfsFile))
  }

  list() {
    return this.vfs.list()
  }

  snapshot(): GeneratedFile[] {
    const snap = this.vfs.snapshot()
    return snap.files.map(fromVfsFile)
  }

  read(path: string): GeneratedFile | null {
    const f = this.vfs.read(path)
    return f ? fromVfsFile(f) : null
  }

  write(file: GeneratedFile): void {
    this.vfs.write(toVfsFile(file))
  }

  delete(path: string): boolean {
    return this.vfs.delete(path)
  }

  rename(from: string, to: string): void {
    this.vfs.rename(from, to)
  }

  search(query: string | RegExp) {
    return this.vfs.search(query)
  }

  applyDiff(operations: DiffOperation[]) {
    return this.vfs.applyDiff(operations)
  }
} 