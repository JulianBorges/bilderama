import { PagePlan, pagePlanSchema } from '../schemas';
import { config } from '../config';
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai-edge';
import { z } from 'zod';

const openaiConfig = new Configuration({
  apiKey: config.openaiApiKey
});

const openai = new OpenAIApi(openaiConfig);

export const EDITOR_SYSTEM_PROMPT = `Você é uma ferramenta de edição de JSON que modifica um objeto JSON 'PagePlan' com base em uma instrução de texto.

Instruções:
1.  Sua entrada será um objeto JSON 'PagePlan' e uma instrução de edição.
2.  Você DEVE modificar o JSON de acordo com a instrução.
3.  Você DEVE manter a estrutura original do JSON e o schema Zod. 
4.  Ao adicionar um novo bloco, o nome do componente DEVE ser um dos seguintes: "Navbar", "HeroModerno", "GridFeatures", "TestimonialCard", "PricingCard", "CallToAction", "LogoCloud", "Footer". Nomes com espaços não são permitidos.
5.  Sua saída DEVE ser APENAS o objeto JSON modificado completo. NÃO inclua nenhum texto, explicação, markdown ou qualquer outra coisa fora do objeto JSON.
6.  Se a instrução não for clara ou for impossível de executar, retorne o JSON original sem modificações.`;

/**
 * Edita um PagePlan usando um prompt de IA.
 * 
 * @param prompt - A instrução do usuário sobre o que mudar.
 * @param currentPlan - O objeto PagePlan atual.
 * @returns O PagePlan modificado.
 */
export async function getEditedPagePlan(prompt: string, currentPlan: PagePlan): Promise<PagePlan> {
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content: EDITOR_SYSTEM_PROMPT,
    },
    {
      role: 'user',
      content: `JSON ATUAL:\n${JSON.stringify(currentPlan, null, 2)}\n\nINSTRUÇÃO DE EDIÇÃO:\n${prompt}`,
    },
  ];

  try {
    config.validateApiKey();

    const response = await openai.createChatCompletion({
      model: config.model,
      messages,
      stream: false
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`A API da OpenAI retornou um erro: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error('A resposta da API em formato inválido ou vazio.');
    }

    // Tenta limpar qualquer formatação de markdown que a IA possa adicionar por engano
    const cleanedJsonString = responseContent.replace(/```json\n|```/g, '').trim();
    
    const parsedJson = JSON.parse(cleanedJsonString);
    const validatedPlan = pagePlanSchema.parse(parsedJson);

    return validatedPlan;

  } catch (error) {
    console.error("Falha ao editar o PagePlan:", error);
    // Lança um erro claro para que a camada da API possa tratá-lo.
    // Isso é mais informativo para o frontend do que simplesmente retornar o plano antigo.
    if (error instanceof z.ZodError) {
      throw new Error(`A IA retornou um objeto JSON com formato inesperado. Detalhes: ${error.message}`);
    }
    throw new Error(`Não foi possível processar a edição. Detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
} 