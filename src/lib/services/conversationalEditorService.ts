import { PagePlan, pagePlanSchema } from '../schemas';
import { config } from '../config';
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai-edge';
import { z } from 'zod';

// Função para limpar valores inválidos de design tokens (copiada do ai.ts)
function cleanInvalidDesignTokens(pagePlan: any): void {
  const invalidValues = ['default', 'null', '', null, undefined];
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
          // Remove valores que não estão no enum válido
          else if (typeof value === 'string' && !isValidEnumValue(key, value)) {
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
          
          if (invalidValues.includes(value)) {
            delete widget.designTokens[key];
          }
          else if (value === 'none' && !noneAllowedFields.includes(key)) {
            delete widget.designTokens[key];
          }
          else if (typeof value === 'string' && !isValidEnumValue(key, value)) {
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

// Função para verificar se um valor está no enum válido
function isValidEnumValue(key: string, value: string): boolean {
  const validEnums = {
    cardStyle: ['elevated', 'outline', 'glass', 'minimal', 'bold'],
    spacing: ['compact', 'comfortable', 'spacious', 'extra-spacious'],
    emphasis: ['primary', 'accent', 'neutral', 'muted'],
    borderRadius: ['none', 'small', 'medium', 'large', 'full'],
    shadowIntensity: ['none', 'soft', 'medium', 'strong', 'dramatic'],
    animation: ['none', 'subtle', 'smooth', 'bouncy', 'dramatic']
  };
  
  return validEnums[key as keyof typeof validEnums]?.includes(value) ?? true;
}

const openaiConfig = new Configuration({
  apiKey: config.openaiApiKey
});

const openai = new OpenAIApi(openaiConfig);

export const EDITOR_SYSTEM_PROMPT = `Você é uma ferramenta de edição de JSON que modifica um objeto JSON 'PagePlan' com base em uma instrução de texto.

**RESPOSTA OBRIGATÓRIA: APENAS JSON**
VOCÊ DEVE RETORNAR EXCLUSIVAMENTE UM OBJETO JSON VÁLIDO. NÃO adicione texto explicativo, comentários ou descrições.

**REGRAS CRÍTICAS:**
1. Sua entrada será um objeto JSON 'PagePlan' e uma instrução de edição.
2. Você DEVE modificar o JSON de acordo com a instrução.
3. Você DEVE manter a estrutura original do JSON e o schema Zod.
4. Ao adicionar um novo bloco, o nome do componente DEVE ser um dos seguintes: "Navbar", "HeroModerno", "HeroClassico", "InfoProductHero", "GridFeatures", "Statistics", "Team", "Blog", "Contact", "Testimonials", "Pricing", "MenuGrid", "FAQ", "CallToAction", "LogoCloud", "Footer".
5. Widgets disponíveis: "WhatsappButton".
6. Sua saída DEVE ser APENAS o objeto JSON modificado completo. NÃO inclua nenhum texto, explicação, markdown ou qualquer outra coisa fora do objeto JSON.
7. Se a instrução não for clara ou for impossível de executar, retorne o JSON original sem modificações.
8. Mantenha sempre a consistência nas propriedades de cada componente conforme definido no catálogo de componentes.

**DESIGN TOKENS - VALORES VÁLIDOS OBRIGATÓRIOS:**
- **cardStyle**: APENAS 'elevated', 'outline', 'glass', 'minimal', 'bold'
- **spacing**: APENAS 'compact', 'comfortable', 'spacious', 'extra-spacious'
- **emphasis**: APENAS 'primary', 'accent', 'neutral', 'muted'
- **borderRadius**: APENAS 'none', 'small', 'medium', 'large', 'full'
- **shadowIntensity**: APENAS 'none', 'soft', 'medium', 'strong', 'dramatic'
- **animation**: APENAS 'none', 'subtle', 'smooth', 'bouncy', 'dramatic'

**REGRAS PARA DESIGN TOKENS:**
- TODOS os design tokens são OPCIONAIS - se não especificar, omita a propriedade
- NUNCA use valores como 'fade', 'default', 'null' ou strings vazias
- Para cardStyle e spacing: NUNCA use 'none' (omita a propriedade)
- Use apenas os valores EXATOS listados acima

**EXEMPLOS VÁLIDOS:**
✅ "designTokens": { "cardStyle": "elevated", "animation": "smooth" }
✅ "designTokens": { "shadowIntensity": "none" }
✅ "designTokens": {}
❌ "designTokens": { "animation": "fade" }
❌ "designTokens": { "cardStyle": "none" }`;

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

  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
      
      // Camada de defesa: limpa valores inválidos antes da validação Zod
      cleanInvalidDesignTokens(parsedJson);
      
      const validatedPlan = pagePlanSchema.parse(parsedJson);

      return validatedPlan;

    } catch (error) {
      console.error(`Tentativa ${attempt} falhou ao editar PagePlan:`, error);
      
      if (error instanceof z.ZodError) {
        if (attempt < maxRetries) {
          // Cria uma mensagem de erro mais específica
          const errorMessages = error.errors.map(err => {
            if (err.code === 'invalid_enum_value') {
              return `Campo "${err.path.join('.')}" tem valor inválido "${err.received}". Valores permitidos: ${err.options.join(', ')}.`;
            }
            return `Campo "${err.path.join('.')}" está inválido: ${err.message}`;
          }).join(' ');
          
          messages.push({
            role: 'user',
            content: `ERRO DE VALIDAÇÃO: ${errorMessages} 

IMPORTANTE: 
- Use APENAS os valores EXATOS listados para cada campo de design tokens
- Para animation, use apenas: none, subtle, smooth, bouncy, dramatic
- Para cardStyle, use apenas: elevated, outline, glass, minimal, bold
- Retorne APENAS JSON válido, sem texto explicativo.`,
          });
        } else {
          throw new Error(`A IA retornou um objeto JSON com formato inesperado após ${maxRetries} tentativas. Detalhes: ${JSON.stringify(error.errors)}`);
        }
      } else if (error instanceof SyntaxError) {
        if (attempt < maxRetries) {
          messages.push({
            role: 'user',
            content: `ERRO DE SINTAXE JSON: ${error.message}

INSTRUÇÕES CRÍTICAS:
- Retorne APENAS um objeto JSON válido
- NÃO adicione texto explicativo
- Use aspas duplas para todas as strings
- Comece diretamente com { e termine com }`,
          });
        } else {
          throw new Error(`Não foi possível processar a edição após ${maxRetries} tentativas. Erro de sintaxe JSON.`);
        }
      } else {
        // Erro inesperado, falha imediatamente
        throw new Error(`Não foi possível processar a edição. Detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  }

  throw new Error(`O Editor da IA falhou em processar a edição após ${maxRetries} tentativas.`);
} 