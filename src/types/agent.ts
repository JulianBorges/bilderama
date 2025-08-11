export interface AgentToolResult {
  type: 'format' | 'typecheck' | 'tests'
  ok: boolean
  details: any
  durationMs: number
}

export interface AgentPlan {
  rationale: string
  diffs?: import('@/lib/vfs/types').DiffOperation[]
  pagePlanPatchedJson?: string
}

export interface AgentIterationResult {
  files: import('@/lib/ai').GeneratedFile[]
  pagePlanJson?: string
  diffPreview?: import('@/lib/vfs/types').DiffOperation[]
  toolResults: AgentToolResult[]
  explanation: string
  suggestions: string[]
} 