import { NextResponse, type NextRequest } from 'next/server'

// Limites configuráveis (poderíamos mover para env later)
const MAX_BODY_SIZE = 25 * 1024 // 25 kB

export function middleware(req: NextRequest) {
  // Verifica se a key da OpenAI está configurada no servidor
  if (!process.env.OPENAI_API_KEY) {
    return new NextResponse(
      JSON.stringify({ error: 'OPENAI_API_KEY não configurada no servidor' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }

  // Checa cabeçalho Content-Length para evitar payloads enormes
  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_SIZE) {
    return new NextResponse(
      JSON.stringify({ error: 'Payload demasiado grande. Limite de 25 kB.' }),
      { status: 413, headers: { 'content-type': 'application/json' } }
    )
  }

  // Passa adiante
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
} 