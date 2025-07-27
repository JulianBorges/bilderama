import { OpenAIStream, StreamingTextResponse } from 'ai'
import { config } from '@/lib/config'
import { processUserInput } from '@/lib/ai'
import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { getCache, setCache } from '@/lib/cache'
import { getEditedPagePlan } from '@/lib/services/conversationalEditorService'
import { PagePlan } from '@/lib/schemas'

export async function POST(req: Request) {
  try {
    const { userInput, currentPagePlan } = await req.json()

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
      const newPlan = await getEditedPagePlan(userInput as string, currentPagePlan as PagePlan);
      
      // Criamos uma resposta no formato que o frontend espera.
      const aiResponse = {
        pagePlanJson: JSON.stringify(newPlan),
        // A explicação e as sugestões podem ser genéricas no modo de edição por enquanto.
        explanation: "Seu site foi atualizado com base na sua instrução.",
        suggestions: ["O que mais gostaria de alterar?", "Peça para mudar o tema.", "Adicione uma nova seção."]
      };

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