import { config } from './config'
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai-edge'
import { pagePlanSchema, PagePlan } from './schemas'
import { 
  buildCreativePrompt, 
  selectPersonalityForContext,
  CreativeContext,
  DESIGN_PERSONALITIES 
} from './prompts/creative-architect'
import { interpretBusinessContext } from './services/contextInterpreter'
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
  designPersonality?: string
  designRationale?: string
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
  return jsonString
    .replace(/^```json\s*/, '') // Remove ```json no início
    .replace(/\s*```$/, '')     // Remove ``` no final
    .trim();                    // Remove espaços extras
}

// Nova função principal que usa o sistema criativo
async function generateCreativePagePlan(userInput: string, maxRetries = 3): Promise<{
  pagePlan: string;
  designPersonality: string;
  designRationale: string;
}> {
  // Etapa 1: Interpretar o contexto do negócio
  console.log('Interpretando contexto do negócio...');
  const { context, insights, recommendations } = await interpretBusinessContext(userInput);
  
  // Etapa 2: Selecionar personalidade de design apropriada
  const selectedPersonality = selectPersonalityForContext(context);
  const personality = DESIGN_PERSONALITIES[selectedPersonality];
  
  console.log(`Personalidade selecionada: ${personality.name}`);
  
  // Etapa 3: Construir prompt criativo personalizado
  const creativePrompt = buildCreativePrompt(context, selectedPersonality);
  
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content: creativePrompt
    },
    {
      role: 'user',
      content: userInput,
    },
  ];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt} de geração criativa...`);
      const responseJson = await callOpenAI(messages);
      const cleanedJson = cleanJsonString(responseJson);
      const validatedPlan = pagePlanSchema.parse(JSON.parse(cleanedJson));
      
      return {
        pagePlan: JSON.stringify(validatedPlan),
        designPersonality: personality.name,
        designRationale: `Abordagem ${personality.name}: ${personality.approach}. Focando em ${personality.strengths.join(', ')}.`
      };
    } catch (e) {
      console.warn(`Tentativa ${attempt} falhou.`, e);
      if (e instanceof ZodError) {
        if (attempt < maxRetries) {
          // Adiciona uma mensagem de correção para a próxima tentativa
          messages.push({
            role: 'assistant',
            // @ts-ignore
            content: e.message,
          });
          messages.push({
            role: 'user',
            content: `A sua resposta anterior continha um JSON inválido. O erro de validação foi: ${JSON.stringify(e.errors)}. Por favor, corrija o JSON e tente novamente seguindo exatamente o novo schema com 'composition.sections'.`,
          });
        }
      } else if (e instanceof SyntaxError) {
         if (attempt < maxRetries) {
            messages.push({
              role: 'user',
              content: `A sua resposta anterior não era um JSON válido. O erro foi: ${e.message}. Por favor, retorne APENAS um objeto JSON válido seguindo o novo schema flexível.`,
            });
         }
      } else {
        // Erro inesperado, não relacionado à validação, falha imediatamente.
        throw e;
      }
    }
  }

  // Se todas as tentativas falharem
  throw new Error(`O Arquiteto Criativo da IA falhou em gerar um plano JSON válido após ${maxRetries} tentativas.`);
}

// Fallback para o sistema original
async function generateBasicPagePlan(userInput: string, maxRetries = 3): Promise<string> {
  // Usa o prompt original como fallback
  const BASIC_SYSTEM_PROMPT = `
  Você é um arquiteto de interfaces web. Crie um PagePlan em JSON para: ${userInput}
  
  Use o novo schema com 'composition.sections' em vez de 'blocks' diretos.
  
  Exemplo de estrutura:
  {
    "pageTitle": "...",
    "pageDescription": "...",
    "pageType": "landing",
    "targetAudience": "...",
    "conversionGoal": "...",
    "theme": { "themeName": "moderno_azul", "font": "inter" },
    "composition": {
      "type": "linear",
      "sections": [
        {
          "id": "hero-section",
          "name": "Hero Principal",
          "layout": "grid",
          "gridConfig": { "columns": 1 },
          "blocks": [
            {
              "id": "hero-1",
              "name": "HeroModerno",
              "variant": "default",
              "properties": { ... }
            }
          ]
        }
      ]
    }
  }
  `;

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content: BASIC_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: userInput,
    },
  ];

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const responseJson = await callOpenAI(messages);
      const cleanedJson = cleanJsonString(responseJson);
      const validatedPlan = pagePlanSchema.parse(JSON.parse(cleanedJson));
      return JSON.stringify(validatedPlan);
    } catch (e) {
      console.warn(`Fallback attempt ${attempt} failed.`, e);
      if (attempt === maxRetries) {
        throw e;
      }
    }
  }

  throw new Error('Fallback também falhou');
}

// Analisa o código e gera resumo e sugestões em português
async function generateAnalysis(files: GeneratedFile[], personality?: string): Promise<{ explanation: string; suggestions: string[] }> {
  if (personality) {
    const selectedPersonality = Object.values(DESIGN_PERSONALITIES).find(p => p.name === personality);
    if (selectedPersonality) {
      return {
        explanation: `Seu site foi criado seguindo a abordagem ${personality}. ${selectedPersonality.approach}`,
        suggestions: [
          `Como ${personality.split(' - ')[0]}, recomendo focar em ${selectedPersonality.strengths[0].toLowerCase()}`,
          "Experimente ajustar as cores ou fontes para refinar a personalidade da marca",
          "Considere adicionar mais elementos que reforcem seus objetivos de conversão"
        ]
      };
    }
  }
  
  return {
    explanation: "Seu site foi gerado com sucesso usando um sistema de design inteligente e adaptativo.",
    suggestions: ["Experimente pedir mudanças específicas", "Teste diferentes personalidades de design", "Adicione mais detalhes sobre seu negócio para resultados mais personalizados"]
  }
}

/**
 * Orquestra o novo fluxo criativo:
 * 1. Interpreta contexto do negócio
 * 2. Seleciona personalidade de design apropriada  
 * 3. Gera PagePlan criativo e flexível
 * 4. Fornece explicação personalizada
 */
export async function processUserInput(userInput: string): Promise<AIResponse> {
  try {
    // Tenta usar o sistema criativo primeiro
    const { pagePlan, designPersonality, designRationale } = await generateCreativePagePlan(userInput);
    const analysis = await generateAnalysis([], designPersonality);

    return {
      pagePlanJson: pagePlan,
      files: null, 
      explanation: `${analysis.explanation}\n\n${designRationale}`,
      suggestions: analysis.suggestions,
      designPersonality,
      designRationale
    };
  } catch (error) {
    console.error('Sistema criativo falhou, usando fallback:', error);
    
    try {
      // Fallback para sistema básico
      const pagePlanJson = await generateBasicPagePlan(userInput);
      const analysis = await generateAnalysis([]);

      return {
        pagePlanJson,
        files: null,
        explanation: analysis.explanation,
        suggestions: analysis.suggestions,
      };
    } catch (fallbackError) {
      console.error('Fallback também falhou:', fallbackError);
      throw new Error('Não foi possível gerar o site. Tente ser mais específico sobre seu negócio.');
    }
  }
}
