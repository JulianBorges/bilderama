import { config } from './config'
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai-edge'
import { pagePlanSchema, PagePlan } from './schemas'
import { ARCHITECT_SYSTEM_PROMPT } from './prompts/architect'
import { ZodError } from 'zod'

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

// Função para limpar a string JSON
function cleanJsonString(jsonString: string): string {
  let cleaned = jsonString
    .replace(/^```json\s*/, '') // Remove ```json no início
    .replace(/\s*```$/, '')     // Remove ``` no final
    .trim();                    // Remove espaços extras
  
  // Remove texto explicativo antes do JSON
  const jsonStartIndex = cleaned.indexOf('{');
  if (jsonStartIndex > 0) {
    cleaned = cleaned.substring(jsonStartIndex);
  }
  
  // Remove texto após o JSON
  const jsonEndIndex = cleaned.lastIndexOf('}');
  if (jsonEndIndex !== -1 && jsonEndIndex < cleaned.length - 1) {
    cleaned = cleaned.substring(0, jsonEndIndex + 1);
  }
  
  return cleaned;
}

// Função para limpar valores inválidos de design tokens
function cleanInvalidDesignTokens(pagePlan: any): void {
  // Valores inválidos que devem ser removidos
  const invalidValues = ['default', 'null', '', null, undefined];
  
  // Para borderRadius e shadowIntensity, 'none' é válido mas deve ser tratado com cuidado
  const noneAllowedFields = ['borderRadius', 'shadowIntensity', 'animation'];
  
  // Limpa design tokens nos blocos
  if (pagePlan.blocks && Array.isArray(pagePlan.blocks)) {
    pagePlan.blocks.forEach((block: any) => {
      if (block.designTokens && typeof block.designTokens === 'object') {
        Object.keys(block.designTokens).forEach(key => {
          const value = block.designTokens[key];
          
          // Remove valores sempre inválidos
          if (invalidValues.includes(value)) {
            delete block.designTokens[key];
          }
          // Remove 'none' apenas para campos onde não é apropriado
          else if (value === 'none' && !noneAllowedFields.includes(key)) {
            delete block.designTokens[key];
          }
        });
        
        // Remove o objeto designTokens se estiver vazio
        if (Object.keys(block.designTokens).length === 0) {
          delete block.designTokens;
        }
      }
    });
  }
  
  // Limpa design tokens nos widgets
  if (pagePlan.widgets && Array.isArray(pagePlan.widgets)) {
    pagePlan.widgets.forEach((widget: any) => {
      if (widget.designTokens && typeof widget.designTokens === 'object') {
        Object.keys(widget.designTokens).forEach(key => {
          const value = widget.designTokens[key];
          
          // Remove valores sempre inválidos
          if (invalidValues.includes(value)) {
            delete widget.designTokens[key];
          }
          // Remove 'none' apenas para campos onde não é apropriado
          else if (value === 'none' && !noneAllowedFields.includes(key)) {
            delete widget.designTokens[key];
          }
        });
        
        // Remove o objeto designTokens se estiver vazio
        if (Object.keys(widget.designTokens).length === 0) {
          delete widget.designTokens;
        }
      }
    });
  }
}

// Interpreta e estrutura o prompt em inglês
async function structurePrompt(userInput: string, maxRetries = 3): Promise<string> {
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content: ARCHITECT_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: `REQUISIÇÃO DO USUÁRIO:\\n${userInput}`,
    },
  ];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const responseJson = await callOpenAI(messages);
      const cleanedJson = cleanJsonString(responseJson);
      const parsedJson = JSON.parse(cleanedJson);
      
      // Camada de defesa: limpa valores inválidos antes da validação Zod
      cleanInvalidDesignTokens(parsedJson);
      
      const validatedPlan = pagePlanSchema.parse(parsedJson);
      return JSON.stringify(validatedPlan); // Sucesso!
    } catch (e) {
      console.warn(`Tentativa ${attempt} falhou.`, e);
      if (e instanceof ZodError) {
        if (attempt < maxRetries) {
          // Cria uma mensagem de erro mais específica
          const errorMessages = e.errors.map(error => {
            if (error.code === 'invalid_enum_value') {
              return `Campo "${error.path.join('.')}" tem valor inválido "${error.received}". Valores permitidos: ${error.options.join(', ')}.`;
            }
            return `Campo "${error.path.join('.')}" está inválido: ${error.message}`;
          }).join(' ');
          
          messages.push({
            role: 'user',
            content: `ERRO DE VALIDAÇÃO: ${errorMessages} 

IMPORTANTE: 
- Use APENAS os valores EXATOS listados para cada campo
- Para themeName, use apenas: moderno_azul, calor_tropical, saas_premium, corporativo_elegante, ecommerce_luxo, startup_tech, wellness_natural, creative_agency, finance_trust, restaurant_warm
- Para spacing, use apenas: compact, comfortable, spacious, extra-spacious
- Retorne APENAS JSON válido, sem texto explicativo.`,
          });
        }
      } else if (e instanceof SyntaxError) {
         if (attempt < maxRetries) {
            messages.push({
              role: 'user',
              content: `ERRO DE SINTAXE JSON: ${e.message}

INSTRUÇÕES CRÍTICAS:
- Retorne APENAS um objeto JSON válido
- NÃO adicione texto explicativo como "Aqui está" ou comentários
- Use aspas duplas para todas as strings
- NÃO use vírgulas após o último elemento
- Comece diretamente com { e termine com }`,
            });
         }
      } else {
        // Erro inesperado, não relacionado à validação, falha imediatamente.
        throw e;
      }
    }
  }

  // Se todas as tentativas falharem
  throw new Error(`O Arquiteto da IA falhou em gerar um plano JSON válido após ${maxRetries} tentativas.`);
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
