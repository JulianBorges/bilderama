import { OpenAIStream, StreamingTextResponse } from 'ai'
import { config } from '@/lib/config'
import { processUserInput } from '@/lib/ai'
import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { getCache, setCache } from '@/lib/cache'
import { getEditedPagePlan } from '@/lib/services/conversationalEditorService'
import { PagePlan } from '@/lib/schemas'
import { runAgentIteration } from '@/lib/services/agentOrchestrator'

export async function POST(req: Request) {
  try {
    const { userInput, currentPagePlan, currentFiles } = await req.json()

    if (!userInput) {
      return NextResponse.json({ error: 'userInput é obrigatório' }, { status: 400 });
    }

    // Calcula hash do prompt para cache
    const promptHash = createHash('sha1').update(JSON.stringify({ userInput, currentPagePlan })).digest('hex')

    const cached = getCache<any>(promptHash)
    if (cached) {
      return new NextResponse(JSON.stringify(cached), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT', 'X-Prompt-Size': String(userInput.length) } })
    }

    // Se um plano de página atual for fornecido, entramos no modo de edição.
    if (currentPagePlan) {
      // Ramo novo: invocar orquestrador para propor diffs e patch do PagePlan
      const files = Array.isArray(currentFiles) ? currentFiles : []
      const result = await runAgentIteration({ instruction: userInput as string, pagePlan: currentPagePlan as PagePlan, files })

      const aiResponse = {
        pagePlanJson: result.pagePlanJson || JSON.stringify(currentPagePlan),
        files: result.files || null,
        explanation: result.explanation,
        suggestions: result.suggestions,
        diffPreview: result.diffPreview,
        toolResults: result.toolResults,
      }

      setCache(promptHash, aiResponse)
      return NextResponse.json(aiResponse, { headers: { 'X-Cache': 'MISS', 'X-Prompt-Size': String(userInput.length) } });
    }

    // Caso contrário, usamos o fluxo original de geração de um novo site.
    const aiResponse = await processUserInput(userInput as string)
    setCache(promptHash, aiResponse)
    return NextResponse.json(aiResponse, { headers: { 'X-Cache': 'MISS', 'X-Prompt-Size': String(userInput.length) } })

  } catch (error: any) {
    console.error('[API CHAT ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor ao processar a solicitação' },
      { status: 500 }
    )
  }
} 