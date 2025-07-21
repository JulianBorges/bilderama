import { config } from '../config';
import { Configuration, OpenAIApi } from 'openai-edge';
import { CreativeContext } from '../prompts/creative-architect';

const openaiConfig = new Configuration({
  apiKey: config.openaiApiKey
});

const openai = new OpenAIApi(openaiConfig);

export interface BusinessInsights {
  industry: string;
  subIndustry?: string;
  businessModel: string;
  targetMarket: string;
  competitiveAdvantage: string;
  painPoints: string[];
  opportunities: string[];
  brandValues: string[];
  communicationTone: string;
}

const CONTEXT_EXTRACTION_PROMPT = `
Você é um consultor de negócios especialista em análise de contexto empresarial. Analise a descrição do usuário e extraia informações detalhadas sobre o negócio.

**INSTRUÇÕES**
1. Identifique o setor/indústria específica
2. Determine o modelo de negócio
3. Analise o público-alvo
4. Identifique diferenciais competitivos
5. Reconheça objetivos de conversão
6. Determine personalidade da marca
7. Identifique oportunidades de design

**FORMATO DE RESPOSTA**
Retorne um JSON com as seguintes informações:

\`\`\`json
{
  "context": {
    "industry": "string - setor específico",
    "businessSize": "startup|small|medium|enterprise",
    "targetAudience": "string - descrição detalhada do público",
    "conversionGoal": "string - objetivo principal específico",
    "brandPersonality": "string - personalidade e valores da marca",
    "uniqueSellingPoint": "string - principal diferencial competitivo"
  },
  "insights": {
    "industry": "string - categoria da indústria",
    "subIndustry": "string - subcategoria específica",
    "businessModel": "string - modelo de negócio",
    "targetMarket": "string - mercado alvo",
    "competitiveAdvantage": "string - vantagem competitiva",
    "painPoints": ["array de dores do público"],
    "opportunities": ["array de oportunidades de design"],
    "brandValues": ["array de valores da marca"],
    "communicationTone": "string - tom de comunicação ideal"
  },
  "recommendations": {
    "designApproach": "string - abordagem de design recomendada",
    "keyElements": ["array de elementos essenciais"],
    "avoidElements": ["array de elementos a evitar"],
    "priorityFocus": "string - foco principal do design"
  }
}
\`\`\`

**SEJA PRECISO E ESPECÍFICO**
- Use termos específicos da indústria
- Identifique nuances do negócio
- Considere tendências do mercado
- Pense em diferenciação competitiva
`;

export async function interpretBusinessContext(userInput: string): Promise<{
  context: CreativeContext;
  insights: BusinessInsights;
  recommendations: {
    designApproach: string;
    keyElements: string[];
    avoidElements: string[];
    priorityFocus: string;
  };
}> {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: CONTEXT_EXTRACTION_PROMPT
        },
        {
          role: 'user',
          content: `Analise este negócio e extraia o contexto detalhado:\n\n${userInput}`
        }
      ],
      temperature: 0.3, // Baixa temperatura para consistência
      max_tokens: 1500
    });

    if (!response.ok) {
      throw new Error('Erro na API da OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Remove markdown se presente
    const cleanContent = content.replace(/```json\n|```/g, '').trim();
    return JSON.parse(cleanContent);

  } catch (error) {
    console.error('Erro ao interpretar contexto:', error);
    
    // Fallback com contexto básico extraído por regex/heurística
    return generateFallbackContext(userInput);
  }
}

function generateFallbackContext(userInput: string): {
  context: CreativeContext;
  insights: BusinessInsights;
  recommendations: any;
} {
  const input = userInput.toLowerCase();
  
  // Detecção simples de indústria
  let industry = 'negócio';
  if (input.includes('restaurante') || input.includes('comida') || input.includes('açaí')) {
    industry = 'alimentação';
  } else if (input.includes('tech') || input.includes('app') || input.includes('software')) {
    industry = 'tecnologia';
  } else if (input.includes('clínica') || input.includes('saúde') || input.includes('médico')) {
    industry = 'saúde';
  } else if (input.includes('loja') || input.includes('venda') || input.includes('produto')) {
    industry = 'e-commerce';
  }
  
  // Detecção de objetivo
  let conversionGoal = 'gerar leads';
  if (input.includes('venda') || input.includes('comprar')) {
    conversionGoal = 'vendas';
  } else if (input.includes('agend') || input.includes('contato')) {
    conversionGoal = 'agendamentos';
  } else if (input.includes('conhecer') || input.includes('brand')) {
    conversionGoal = 'awareness';
  }

  return {
    context: {
      industry,
      businessSize: 'small',
      targetAudience: 'público geral interessado em ' + industry,
      conversionGoal,
      brandPersonality: 'confiável e profissional',
      uniqueSellingPoint: 'qualidade e atendimento diferenciado'
    },
    insights: {
      industry,
      businessModel: 'prestação de serviços',
      targetMarket: 'mercado local',
      competitiveAdvantage: 'atendimento personalizado',
      painPoints: ['falta de confiança', 'dificuldade de escolha'],
      opportunities: ['demonstrar credibilidade', 'facilitar contato'],
      brandValues: ['qualidade', 'confiança', 'profissionalismo'],
      communicationTone: 'profissional e acessível'
    },
    recommendations: {
      designApproach: 'focado em confiança e credibilidade',
      keyElements: ['depoimentos', 'certificações', 'contato fácil'],
      avoidElements: ['elementos confusos', 'excesso de informação'],
      priorityFocus: 'construir confiança'
    }
  };
}

// Sistema de análise de concorrentes (futuro)
export interface CompetitorAnalysis {
  competitors: Array<{
    name: string;
    url: string;
    strengths: string[];
    weaknesses: string[];
    designApproach: string;
  }>;
  opportunities: string[];
  differentiationStrategy: string;
}

// Sistema de trending patterns (futuro)
export interface TrendingPatterns {
  industry: string;
  currentTrends: Array<{
    name: string;
    description: string;
    adoptionRate: number;
    recommendation: 'adopt' | 'consider' | 'avoid';
  }>;
  emergingPatterns: string[];
  timelessPrinciples: string[];
}

// Função para extrair insights específicos da indústria
export function getIndustrySpecificInsights(industry: string): {
  commonPatterns: string[];
  avoidedPatterns: string[];
  keyMetrics: string[];
  trustSignals: string[];
} {
  const industryMap: Record<string, any> = {
    'tecnologia': {
      commonPatterns: ['hero com demo', 'features técnicos', 'social proof', 'pricing tiers'],
      avoidedPatterns: ['design excessivamente tradicional', 'falta de interatividade'],
      keyMetrics: ['uptime', 'performance', 'usuários', 'integrações'],
      trustSignals: ['certificações', 'cases de sucesso', 'equipe técnica', 'segurança']
    },
    'saúde': {
      commonPatterns: ['credenciais médicas', 'depoimentos pacientes', 'localização', 'especialidades'],
      avoidedPatterns: ['cores muito vibrantes', 'elementos não profissionais'],
      keyMetrics: ['anos de experiência', 'pacientes atendidos', 'especialistas'],
      trustSignals: ['certificações médicas', 'diplomas', 'convênios', 'localização']
    },
    'alimentação': {
      commonPatterns: ['menu visual', 'delivery/localização', 'avaliações', 'galeria'],
      avoidedPatterns: ['imagens de baixa qualidade', 'menu desorganizado'],
      keyMetrics: ['avaliação', 'tempo entrega', 'pratos servidos'],
      trustSignals: ['certificações sanitárias', 'origem ingredientes', 'chef']
    },
    'e-commerce': {
      commonPatterns: ['produtos em destaque', 'ofertas', 'reviews', 'checkout fácil'],
      avoidedPatterns: ['processo complexo', 'falta de garantias'],
      keyMetrics: ['produtos vendidos', 'satisfação', 'tempo entrega'],
      trustSignals: ['certificados de segurança', 'política de devolução', 'suporte']
    }
  };

  return industryMap[industry] || industryMap['tecnologia'];
}