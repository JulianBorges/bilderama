import { config } from './config'
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai-edge'
import { pagePlanSchema, PagePlan } from './schemas'
import { ARCHITECT_SYSTEM_PROMPT } from './prompts/architect'

export interface GeneratedFile {
  path: string
  content: string
  type: 'component' | 'style' | 'script' | 'page' | 'config'
  description: string
}

export interface AIResponse {
  pagePlanJson: string
  files: GeneratedFile[] | null
  explanation: string
  suggestions: string[]
}

const openaiConfig = new Configuration({
  apiKey: config.openaiApiKey
})

const openai = new OpenAIApi(openaiConfig)

async function callOpenAI(messages: ChatCompletionRequestMessage[]): Promise<string> {
  try {
    config.validateApiKey();
  } catch (error) {
    console.error('Erro de validação da API key:', error);
    throw error;
  }

  try {
    const response = await openai.createChatCompletion({
      model: config.model,
      messages,
      stream: false
    })

    if (!response.ok) {
      throw new Error('Erro na resposta da API da OpenAI')
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Resposta da API em formato inválido')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error)
    throw new Error('Falha ao comunicar com a API da OpenAI')
  }
}

// Interpreta e estrutura o prompt em inglês
async function structurePrompt(userInput: string): Promise<string> {
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content: ARCHITECT_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: `REQUISIÇÃO DO USUÁRIO:\n${userInput}`,
    },
  ]

  try {
    const responseJson = await callOpenAI(messages);
    // Validação robusta com Zod.
    // Isso garante que a resposta da IA corresponda exatamente ao nosso esquema definido.
    const validatedPlan = pagePlanSchema.parse(JSON.parse(responseJson));
    return JSON.stringify(validatedPlan);
  } catch (e) {
    console.error("StructurePrompt não retornou um JSON válido ou compatível com o esquema:", e);
    // Se for um erro de validação do Zod, o erro será bem detalhado.
    throw new Error("O Arquiteto da IA falhou em gerar um plano JSON válido e compatível.");
  }
}

// Analisa o código e gera resumo e sugestões em português
async function generateAnalysis(files: GeneratedFile[]): Promise<{ explanation: string; suggestions: string[] }> {
  // A análise agora pode ser mais simples ou focada em outras coisas,
  // já que a geração de código é previsível.
  // Por enquanto, vamos retornar valores mockados.
  const analysisPrompt = `Baseado nos seguintes arquivos, gere uma breve explicação e 3 sugestões de melhoria: ${JSON.stringify(files)}`;
  
  // Esta parte pode ser expandida no futuro.
  // const response = await callOpenAI([...]); 
  
    return {
    explanation: "Seu site foi gerado com sucesso usando um plano de construção estruturado e um motor de renderização determinístico.",
    suggestions: ["Experimente pedir uma paleta de cores diferente.", "Adicione uma seção de depoimentos de clientes.", "Peça para incluir uma galeria de imagens."]
  }
}

/**
 * Orquestra o fluxo principal:
 * 1. Pega o input do usuário e gera um PagePlan estruturado via IA.
 * 2. (Etapa removida) Não gera mais código diretamente aqui.
 * 3. Analisa o resultado para fornecer feedback.
 * Retorna o PagePlan e a análise.
 */
export async function processUserInput(userInput: string): Promise<AIResponse> {
  const pagePlanJson = await structurePrompt(userInput)
  
  // A análise agora é mockada, pois não temos mais os arquivos gerados pela IA aqui.
  // O ideal seria que a análise acontecesse no frontend após a renderização.
  // Por simplicidade, vamos manter um mock aqui.
  const analysis = await generateAnalysis([]);

  return {
    pagePlanJson,
    files: null, // O frontend irá gerar os arquivos com o PagePlan
    explanation: analysis.explanation,
    suggestions: analysis.suggestions,
  }
}
