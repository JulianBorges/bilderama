import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai-edge'
import { config } from '@/lib/config'
import { ENGINEER_SYSTEM_PROMPT } from '@/lib/prompts/engineer'
import { QA_SYSTEM_PROMPT } from '@/lib/prompts/qa'
import { AgentPlan, AgentIterationResult, AgentToolResult } from '@/types/agent'
import { AgentVfsSession } from '@/lib/services/agentTools'
import { DiffOperation } from '@/lib/vfs/types'
import { GeneratedFile } from '@/lib/ai'
import { pagePlanSchema, type PagePlan } from '@/lib/schemas'
import prettier from 'prettier'
import ts from 'typescript'

const openai = new OpenAIApi(new Configuration({ apiKey: config.openaiApiKey }))

async function callLLM(messages: ChatCompletionRequestMessage[]): Promise<string> {
  const resp = await openai.createChatCompletion({ model: config.model, messages, stream: false })
  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}`)
  const data = await resp.json()
  return data.choices?.[0]?.message?.content || ''
}

function cleanJson(text: string): string {
  return text.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim()
}

function parseAgentPlan(raw: string): AgentPlan {
  const cleaned = cleanJson(raw)
  const plan = JSON.parse(cleaned)
  if (!plan || typeof plan.rationale !== 'string') {
    throw new Error('Plano inválido do Engenheiro')
  }
  return plan
}

function detectParser(path: string): prettier.BuiltInParserName | undefined {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript'
  if (path.endsWith('.js') || path.endsWith('.jsx')) return 'babel'
  if (path.endsWith('.json')) return 'json'
  if (path.endsWith('.css')) return 'css'
  if (path.endsWith('.md')) return 'markdown'
  if (path.endsWith('.html') || path.endsWith('.hbs')) return 'html'
  return undefined
}

async function formatFiles(files: GeneratedFile[]): Promise<{ files: GeneratedFile[]; result: AgentToolResult }> {
  const started = Date.now()
  try {
    const next: GeneratedFile[] = []
    for (const f of files) {
      const parser = detectParser(f.path)
      if (!parser) { next.push(f); continue }
      const formatted = await prettier.format(f.content, { parser })
      next.push({ ...f, content: formatted })
    }
    return { files: next, result: { type: 'format', ok: true, details: { formatted: next.length }, durationMs: Date.now() - started } }
  } catch (e: any) {
    return { files, result: { type: 'format', ok: false, details: { error: String(e?.message || e) }, durationMs: Date.now() - started } }
  }
}

function defaultCompilerOptions(): ts.CompilerOptions {
  return {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.ReactJSX,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    strict: true,
    skipLibCheck: true,
    allowJs: true,
    esModuleInterop: true,
    resolveJsonModule: true,
    noEmit: true,
  }
}

async function runTypecheck(files: GeneratedFile[]): Promise<AgentToolResult> {
  const started = Date.now()
  try {
    // cria host com VFS em memória
    const options: ts.CompilerOptions = defaultCompilerOptions()
    const fileMap = new Map(files.map(f => [f.path.replace(/^[\/]+/, '').replace(/\\/g, '/'), f.content]))
    const sourceFilePaths = [...fileMap.keys()].filter(p => /(\.ts|\.tsx|\.js|\.jsx)$/.test(p))

    const host = ts.createCompilerHost(options, true)
    const readFileOrig = host.readFile.bind(host)
    host.readFile = (fileName: string): string | undefined => {
      const normalized = fileName.replace(/^[\/]+/, '').replace(/\\/g, '/')
      const fromVfs = fileMap.get(normalized)
      if (fromVfs !== undefined) return fromVfs
      return readFileOrig(fileName)
    }
    const fileExistsOrig = host.fileExists?.bind(host)
    host.fileExists = (fileName: string): boolean => {
      const normalized = fileName.replace(/^[\/]+/, '').replace(/\\/g, '/')
      if (fileMap.has(normalized)) return true
      return fileExistsOrig ? fileExistsOrig(fileName) : false
    }

    const program = ts.createProgram({ rootNames: sourceFilePaths, options, host })
    const diagnostics = [...ts.getPreEmitDiagnostics(program)]
    const formatted = diagnostics.map(d => {
      const { file, start, messageText, category, code } = d
      const message = ts.flattenDiagnosticMessageText(messageText, '\n')
      let filePath: string | undefined
      let line: number | undefined
      let character: number | undefined
      if (file && typeof start === 'number') {
        const pos = file.getLineAndCharacterOfPosition(start)
        line = pos.line + 1
        character = pos.character + 1
        filePath = file.fileName
      }
      return { filePath, line, character, category: ts.DiagnosticCategory[category], code, message }
    })

    return { type: 'typecheck', ok: diagnostics.length === 0, details: { diagnostics: formatted }, durationMs: Date.now() - started }
  } catch (e: any) {
    return { type: 'typecheck', ok: false, details: { error: String(e?.message || e) }, durationMs: Date.now() - started }
  }
}

import { execFile } from 'node:child_process'

async function runTests(files: GeneratedFile[], pattern?: string, timeoutMs = 15_000): Promise<AgentToolResult> {
  const started = Date.now()
  try {
    // Não gravamos no FS real; só executamos vitest do projeto
    const args = ['--silent']
    if (pattern) args.push(pattern)
    const { code, stdout, stderr } = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
      const child = execFile('npx', ['vitest', 'run', ...args], { env: { ...process.env } }, (error, stdout, stderr) => {
        const code = (error as any)?.code ?? 0
        resolve({ code, stdout: String(stdout || ''), stderr: String(stderr || '') })
      })
      const to = setTimeout(() => { try { child.kill('SIGKILL') } catch {} ; resolve({ code: 124, stdout: '', stderr: 'Timeout ao executar testes' }) }, timeoutMs)
      child.on('exit', () => clearTimeout(to))
    })
    return { type: 'tests', ok: code === 0, details: { code, stdout, stderr }, durationMs: Date.now() - started }
  } catch (e: any) {
    return { type: 'tests', ok: false, details: { error: String(e?.message || e) }, durationMs: Date.now() - started }
  }
}

async function generateExplanation(pagePlanJson?: string): Promise<{ explanation: string; suggestions: string[] }> {
  if (!pagePlanJson) {
    return {
      explanation: 'Proposta aplicada ao workspace virtual com validações básicas.',
      suggestions: ['Revise o diff proposto.', 'Execute publicação após validar.', 'Peça refino de copy ou tokens.']
    }
  }
  // Reutiliza a análise existente para consistência
  const { generateAnalysisFromPlan } = await import('@/lib/ai')
  return await generateAnalysisFromPlan(pagePlanJson)
}

export async function runAgentIteration(input: { instruction: string; pagePlan: PagePlan | null; files: GeneratedFile[] }): Promise<AgentIterationResult> {
  // 1) Planejamento
  const messages: ChatCompletionRequestMessage[] = [
    { role: 'system', content: ENGINEER_SYSTEM_PROMPT },
    { role: 'user', content: JSON.stringify({ instruction: input.instruction, pagePlan: input.pagePlan, files: input.files.map(f => ({ path: f.path, type: f.type })) }) }
  ]

  const raw = await callLLM(messages)
  const plan = parseAgentPlan(raw)

  // 2) Aplicar diffs (se houver) em uma sessão VFS
  const session = new AgentVfsSession(input.files)
  let diffPreview: DiffOperation[] | undefined
  if (plan.diffs && plan.diffs.length > 0) {
    session.applyDiff(plan.diffs as DiffOperation[])
    diffPreview = plan.diffs as DiffOperation[]
  }

  // 3) Atualizar PagePlan se houver patch
  let pagePlanJson: string | undefined
  if (plan.pagePlanPatchedJson) {
    const parsed = JSON.parse(plan.pagePlanPatchedJson)
    const validated = pagePlanSchema.parse(parsed)
    pagePlanJson = JSON.stringify(validated)
  }

  // 4) Rodar ferramentas reais
  let currentFiles = session.snapshot()
  const toolResults: AgentToolResult[] = []
  const fmt = await formatFiles(currentFiles)
  currentFiles = fmt.files
  toolResults.push(fmt.result)
  const typecheckResult = await runTypecheck(currentFiles)
  toolResults.push(typecheckResult)
  const testsResult = await runTests(currentFiles)
  toolResults.push(testsResult)

  // 5) Explicação com análise quando houver PagePlan
  const { explanation, suggestions } = await generateExplanation(pagePlanJson)

  return {
    files: currentFiles,
    pagePlanJson,
    diffPreview,
    toolResults,
    explanation,
    suggestions,
  }
} 