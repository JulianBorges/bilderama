export type VfsKind = 'component' | 'style' | 'script' | 'page' | 'config'

export interface VfsFile {
  path: string
  content: string
  type: VfsKind
  description?: string
}

export interface VfsListEntry {
  path: string
  type: VfsKind
  size: number
  hash: string
}

export interface ApplyResult {
  ok: true
  changedFiles: string[]
}

export interface ApplyError {
  ok: false
  error: string
  failedAt?: string
}

export type ApplyOutcome = ApplyResult | ApplyError

export interface SearchMatch {
  path: string
  indices: number[]
}

export type DiffOperation =
  | {
      kind: 'create'
      file: VfsFile
    }
  | {
      kind: 'delete'
      path: string
    }
  | {
      kind: 'replace'
      path: string
      /**
       * Trecho original que DEVE existir exatamente uma vez no arquivo para a substituição ocorrer.
       * A operação falha se 0 ou >1 ocorrências forem encontradas (garante segurança e previsibilidade).
       */
      oldStringWithContext: string
      newString: string
    }
  | {
      kind: 'write'
      path: string
      content: string
      type?: VfsKind
      description?: string
    }
  | {
      kind: 'rename'
      from: string
      to: string
    }

export interface VfsSnapshot {
  files: VfsFile[]
} 