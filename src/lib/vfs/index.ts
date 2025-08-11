export * from './types'
export * from './memoryVfs'

// Adaptadores para tipos do projeto
import type { GeneratedFile } from '../ai'
import type { VfsFile, VfsKind } from './types'

export function toVfsFile(f: GeneratedFile): VfsFile {
  return { path: f.path, content: f.content, type: f.type as VfsKind, description: f.description }
}

export function fromVfsFile(f: VfsFile): GeneratedFile {
  return { path: f.path, content: f.content, type: f.type as GeneratedFile['type'], description: f.description || '' }
} 