import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import ts from 'typescript'
import { MemoryVfs } from '@/lib/vfs'

const fileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
  type: z.enum(['component', 'style', 'script', 'page', 'config']),
  description: z.string().optional()
})

const bodySchema = z.object({
  files: z.array(fileSchema).default([]),
  compilerOptions: z.record(z.any()).optional()
})

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.issues }, { status: 400 })
    }

    const vfs = new MemoryVfs(parsed.data.files)

    // Filtra os arquivos TS/TSX/JS/JSX da VFS
    const sourceFilePaths = vfs.list()
      .map(f => f.path)
      .filter(p => /\.(ts|tsx|js|jsx)$/.test(p))

    const options: ts.CompilerOptions = { ...defaultCompilerOptions(), ...(parsed.data.compilerOptions || {}) }

    const compilerHost = ts.createCompilerHost(options, true)

    // Intercepta leitura de arquivo para priorizar VFS
    const readFileOrig = compilerHost.readFile.bind(compilerHost)
    compilerHost.readFile = (fileName: string): string | undefined => {
      const normalized = fileName.replace(/^[\/]+/, '').replace(/\\/g, '/')
      const fromVfs = vfs.read(normalized)
      if (fromVfs) return fromVfs.content
      return readFileOrig(fileName)
    }

    // Intercepta existsFile para VFS
    const fileExistsOrig = compilerHost.fileExists?.bind(compilerHost)
    compilerHost.fileExists = (fileName: string): boolean => {
      const normalized = fileName.replace(/^[\/]+/, '').replace(/\\/g, '/')
      if (vfs.read(normalized)) return true
      return fileExistsOrig ? fileExistsOrig(fileName) : false
    }

    const program = ts.createProgram({ rootNames: sourceFilePaths, options, host: compilerHost })
    const diagnostics = [
      ...ts.getPreEmitDiagnostics(program),
    ]

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

    return NextResponse.json({
      ok: diagnostics.length === 0,
      diagnostics: formatted,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Falha no typecheck' }, { status: 500 })
  }
} 