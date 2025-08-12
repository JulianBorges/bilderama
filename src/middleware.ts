import { NextResponse, type NextRequest } from 'next/server'

// Limites configuráveis (poderíamos mover para env later)
const MAX_BODY_SIZE = 25 * 1024 // 25 kB

export function middleware(req: NextRequest) {
  // Pathname resiliente para ambientes de teste
  let pathname = ''
  try {
    pathname = (req as any).nextUrl?.pathname || new URL((req as any).url).pathname || ''
  } catch {
    pathname = ''
  }

  // Permite payloads grandes para publicação
  if (pathname.startsWith('/api/publish')) {
    return NextResponse.next()
  }

  // Endpoints do agente/VFS e persistência local não exigem OPENAI_API_KEY
  const skipApiKey = pathname.startsWith('/api/agent/') || pathname.startsWith('/api/render') || pathname.startsWith('/api/publish') || pathname.startsWith('/api/projects')
  if (!skipApiKey) {
    // Verifica se a key da OpenAI está configurada no servidor
    if (process.env.NODE_ENV !== 'test' && !process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY não configurada no servidor' }, { status: 500 })
    }
  }

  // Checa cabeçalho Content-Length para evitar payloads enormes
  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Payload demasiado grande. Limite de 25 kB.' }, { status: 413 })
  }

  // Passa adiante
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
} 