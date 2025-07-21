import { config } from '../config';
import { Configuration, OpenAIApi } from 'openai-edge';

const openaiConfig = new Configuration({
  apiKey: config.openaiApiKey
});

const openai = new OpenAIApi(openaiConfig);

export interface ContentGenerationRequest {
  businessType: string;
  targetAudience: string;
  tone: 'professional' | 'casual' | 'premium' | 'energetic' | 'trustworthy';
  language: 'pt-BR' | 'en-US';
  sectionType: 'hero' | 'features' | 'testimonials' | 'stats' | 'about';
}

export interface GeneratedContent {
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  testimonials?: Array<{
    name: string;
    role: string;
    content: string;
    company?: string;
  }>;
  stats?: Array<{
    number: number;
    suffix: string;
    label: string;
    description: string;
  }>;
}

const CONTENT_PROMPTS = {
  hero: `Crie um hero section impactante para um negócio de {{businessType}} direcionado para {{targetAudience}}. 
         Deve transmitir {{tone}} e incluir:
         - Um título poderoso e chamativo (máximo 60 caracteres)
         - Um subtítulo explicativo e persuasivo (máximo 120 caracteres)
         - Uma descrição mais detalhada (máximo 200 caracteres)
         - 3 pontos principais de valor`,

  features: `Crie uma seção de features/benefícios para um negócio de {{businessType}}. 
            Deve incluir:
            - Título da seção (máximo 50 caracteres)
            - Subtítulo explicativo (máximo 100 caracteres)
            - 6 features principais, cada uma com:
              * Título do feature (máximo 30 caracteres)
              * Descrição do benefício (máximo 80 caracteres)`,

  testimonials: `Crie depoimentos realistas e convincentes para um negócio de {{businessType}}.
                Deve incluir:
                - Título da seção (máximo 50 caracteres)
                - Subtítulo (máximo 100 caracteres)
                - 3 depoimentos com:
                  * Nome (primeiro nome + sobrenome)
                  * Cargo/Profissão
                  * Empresa (se aplicável)
                  * Depoimento (máximo 150 caracteres, específico e detalhado)`,

  stats: `Crie estatísticas impressionantes mas realistas para um negócio de {{businessType}}.
         Deve incluir:
         - Título da seção (máximo 50 caracteres)
         - Subtítulo (máximo 100 caracteres)
         - 4 estatísticas com:
           * Número (realista mas impressionante)
           * Sufixo (%, +, k, mil, etc.)
           * Label/descrição curta (máximo 25 caracteres)
           * Descrição detalhada (máximo 50 caracteres)`
};

export async function generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const prompt = CONTENT_PROMPTS[request.sectionType]
    .replace('{{businessType}}', request.businessType)
    .replace('{{targetAudience}}', request.targetAudience)
    .replace('{{tone}}', request.tone);

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um copywriter especialista em criar conteúdo persuasivo e de alta conversão para websites. 
                   Responda sempre em JSON válido no formato específico para cada tipo de seção.
                   Use linguagem ${request.language === 'pt-BR' ? 'brasileira' : 'americana'}.
                   O tom deve ser ${request.tone}.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    if (!response.ok) {
      throw new Error('Erro na API da OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao gerar conteúdo:', error);
    throw new Error('Falha na geração de conteúdo');
  }
}

// Banco de dados de imagens por categoria
export const IMAGE_LIBRARY = {
  tech: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
    'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?w=800',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800'
  ],
  business: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800',
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800'
  ],
  health: [
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'
  ],
  food: [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800'
  ],
  education: [
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800'
  ]
};

export function getRandomImage(category: keyof typeof IMAGE_LIBRARY): string {
  const images = IMAGE_LIBRARY[category];
  return images[Math.floor(Math.random() * images.length)];
}

// Gerador de dados realistas para diferentes setores
export const REALISTIC_DATA = {
  tech: {
    stats: [
      { base: 95, suffix: '%', label: 'Uptime', desc: 'Disponibilidade garantida' },
      { base: 1000, suffix: '+', label: 'Clientes', desc: 'Empresas atendidas' },
      { base: 24, suffix: '/7', label: 'Suporte', desc: 'Atendimento contínuo' },
      { base: 99, suffix: '%', label: 'Satisfação', desc: 'Clientes satisfeitos' }
    ]
  },
  restaurant: {
    stats: [
      { base: 500, suffix: '+', label: 'Pratos', desc: 'Pedidos diários' },
      { base: 15, suffix: ' anos', label: 'Experiência', desc: 'No mercado' },
      { base: 4.8, suffix: '⭐', label: 'Avaliação', desc: 'Nota média' },
      { base: 50, suffix: ' mil+', label: 'Clientes', desc: 'Já atendidos' }
    ]
  },
  health: {
    stats: [
      { base: 10000, suffix: '+', label: 'Pacientes', desc: 'Já atendidos' },
      { base: 98, suffix: '%', label: 'Satisfação', desc: 'Índice de aprovação' },
      { base: 25, suffix: ' anos', label: 'Experiência', desc: 'No mercado' },
      { base: 50, suffix: '+', label: 'Especialistas', desc: 'Profissionais' }
    ]
  }
};