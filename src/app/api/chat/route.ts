import { OpenAIStream, StreamingTextResponse } from 'ai'
import { config } from '@/lib/config'
import { processUserInput } from '@/lib/ai'
import { mockProcessUserInput } from '@/lib/ai-mock'
import { NextResponse } from 'next/server'
import { getEditedPagePlan } from '@/lib/services/conversationalEditorService'
import { PagePlan } from '@/lib/schemas'

export async function POST(req: Request) {
  try {
    const { userInput, currentPagePlan } = await req.json()

    if (!userInput) {
      return NextResponse.json({ error: 'userInput é obrigatório' }, { status: 400 });
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

      return NextResponse.json(aiResponse);
    }

    // Caso contrário, usamos o fluxo original de geração de um novo site.
    let aiResponse;
    
    // Verifica se a chave da API está configurada para usar mock em desenvolvimento
    if (!config.openaiApiKey) {
      console.log('Usando mock - OpenAI API Key não configurada');
      aiResponse = await mockProcessUserInput(userInput as string);
    } else {
      aiResponse = await processUserInput(userInput as string);
    }
    
    return NextResponse.json(aiResponse)

  } catch (error: any) {
    console.error('[API CHAT ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor ao processar a solicitação' },
      { status: 500 }
    )
  }
} 