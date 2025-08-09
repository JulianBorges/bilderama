import { config } from './config'
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai-edge'
import { pagePlanSchema, PagePlan } from './schemas'
import { ARCHITECT_SYSTEM_PROMPT } from './prompts/architect'
import catalog from './catalog.json'
import { ZodError } from 'zod'
import { sleep } from './utils'

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

async function callOpenAI(messages: ChatCompletionRequestMessage[], { maxRetries = 3, stream = false } = {}): Promise<string> {
  try {
    config.validateApiKey();
  } catch (error) {
    console.error('Erro de validação da API key:', error);
    throw error;
  }

  try {
    let attempt = 0
    let lastError: any = null
    while (attempt < maxRetries) {
      try {
        const response = await openai.createChatCompletion({
          model: config.model,
          messages,
          stream
        })

        if (!response.ok) {
          throw new Error(`Erro na resposta da API da OpenAI. Status ${response.status}`)
        }

        if (stream) {
          // Acumula streaming manualmente
          const reader = response.body!.getReader()
          const decoder = new TextDecoder()
          let content = ''
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            content += decoder.decode(value, { stream: true })
          }
          return content
        } else {
          const data = await response.json()
          if (!data.choices?.[0]?.message?.content) {
            throw new Error('Resposta da API em formato inválido')
          }
          return data.choices[0].message.content
        }
      } catch (err: any) {
        lastError = err
        attempt++
        if (attempt >= maxRetries) break
        const delay = Math.pow(2, attempt) * 500 // 0.5s, 1s, 2s...
        console.warn(`Retry OpenAI (${attempt}/${maxRetries}) em ${delay}ms. Motivo:`, err?.message || err)
        await sleep(delay)
      }
    }

    throw lastError || new Error('Falha desconhecida ao chamar OpenAI')
  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error)
    throw new Error('Falha ao comunicar com a API da OpenAI')
  }
}

// Função para limpar a string JSON
function cleanJsonString(jsonString: string): string {
  let cleaned = jsonString
    .replace(/^```json\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
  
  const jsonStartIndex = cleaned.indexOf('{');
  if (jsonStartIndex > 0) {
    cleaned = cleaned.substring(jsonStartIndex);
  }
  
  const jsonEndIndex = cleaned.lastIndexOf('}');
  if (jsonEndIndex !== -1 && jsonEndIndex < cleaned.length - 1) {
    cleaned = cleaned.substring(0, jsonEndIndex + 1);
  }
  
  return cleaned;
}

// Função para limpar valores inválidos de design tokens
function cleanInvalidDesignTokens(pagePlan: any): void {
  const invalidValues = ['default', 'null', '', null, undefined];
  const noneAllowedFields = ['borderRadius', 'shadowIntensity', 'animation'];
  
  if (pagePlan.blocks && Array.isArray(pagePlan.blocks)) {
    pagePlan.blocks.forEach((block: any) => {
      if (block.designTokens && typeof block.designTokens === 'object') {
        Object.keys(block.designTokens).forEach(key => {
          const value = block.designTokens[key];
          if (invalidValues.includes(value)) {
            delete block.designTokens[key];
          }
          else if (value === 'none' && !noneAllowedFields.includes(key)) {
            delete block.designTokens[key];
          }
        });
        if (Object.keys(block.designTokens).length === 0) {
          delete block.designTokens;
        }
      }
    });
  }
  
  if (pagePlan.widgets && Array.isArray(pagePlan.widgets)) {
    pagePlan.widgets.forEach((widget: any) => {
      if (widget.designTokens && typeof widget.designTokens === 'object') {
        Object.keys(widget.designTokens).forEach(key => {
          const value = widget.designTokens[key];
          if (invalidValues.includes(value)) {
            delete widget.designTokens[key];
          }
          else if (value === 'none' && !noneAllowedFields.includes(key)) {
            delete widget.designTokens[key];
          }
        });
        if (Object.keys(widget.designTokens).length === 0) {
          delete widget.designTokens;
        }
      }
    });
  }
}

function buildMultipageHint(userInput: string): string | null {
  const lower = userInput.toLowerCase()
  const wantsAbout = lower.includes('sobre') || lower.includes('about')
  const wantsPricing = lower.includes('preço') || lower.includes('preços') || lower.includes('pricing')
  const wantsContact = lower.includes('contato') || lower.includes('contact')
  const wantsBlog = lower.includes('blog')

  const pages: string[] = []
  if (wantsAbout) pages.push('/sobre')
  if (wantsPricing) pages.push('/precos')
  if (wantsContact) pages.push('/contato')
  if (wantsBlog) pages.push('/blog')

  if (pages.length === 0) return null

  return `GERAR MULTIPÁGINAS:\n- Incluir 'pages[]' com rotas: ${pages.join(', ')}.\n- Garantir que links internos como 'ctaHref' apontem para essas rotas.\n- Cada página deve ter ao menos 1 bloco.`
}

// Interpreta e estrutura o prompt em inglês
async function structurePrompt(userInput: string, maxRetries = 3): Promise<string> {
  const multipageHint = buildMultipageHint(userInput)
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content: ARCHITECT_SYSTEM_PROMPT
    },
    {
      role: 'system',
      content: `BLOCOS DISPONÍVEIS: ${ (catalog as any).blocks.map((b:any)=>b.name).join(', ') }. WIDGETS: ${ (catalog as any).widgets.join(', ') }.`
    },
    {
      role: 'user',
      content: `REQUISIÇÃO DO USUÁRIO:\n${userInput}`,
    },
  ];

  if (multipageHint) {
    messages.push({ role: 'user', content: multipageHint })
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const responseJson = await callOpenAI(messages);
      const cleanedJson = cleanJsonString(responseJson);
      const parsedJson = JSON.parse(cleanedJson);
      
      cleanInvalidDesignTokens(parsedJson);
      
      const validatedPlan = pagePlanSchema.parse(parsedJson);
      return JSON.stringify(validatedPlan);
    } catch (e) {
      console.warn(`Tentativa ${attempt} falhou.`, e);
      if (e instanceof ZodError) {
        if (attempt < maxRetries) {
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
        throw e;
      }
    }
  }

  throw new Error(`O Arquiteto da IA falhou em gerar um plano JSON válido após ${maxRetries} tentativas.`);
}

// Analisa o código e gera resumo e sugestões em português
async function generateAnalysis(files: GeneratedFile[]): Promise<{ explanation: string; suggestions: string[] }> {
  const analysisPrompt = `Baseado nos seguintes arquivos, gere uma breve explicação e 3 sugestões de melhoria: ${JSON.stringify(files)}`;
  
  return {
    explanation: "Seu site foi gerado com sucesso usando um plano de construção estruturado e um motor de renderização determinístico.",
    suggestions: ["Experimente pedir uma paleta de cores diferente.", "Adicione uma seção de depoimentos de clientes.", "Peça para incluir uma galeria de imagens."]
  }
}

export async function processUserInput(userInput: string): Promise<AIResponse> {
  const pagePlanJson = await structurePrompt(userInput)
  const analysis = await generateAnalysis([]);

  return {
    pagePlanJson,
    files: null,
    explanation: analysis.explanation,
    suggestions: analysis.suggestions,
  }
}
