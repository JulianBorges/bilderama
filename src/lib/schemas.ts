import { z } from 'zod';

// Esquema para posicionamento flexível
const positionSchema = z.object({
  row: z.number().describe("Linha no grid (1-based)"),
  column: z.number().describe("Coluna no grid (1-based)"),
  rowSpan: z.number().default(1).describe("Quantas linhas o elemento ocupa"),
  columnSpan: z.number().default(1).describe("Quantas colunas o elemento ocupa"),
  order: z.number().optional().describe("Ordem de renderização (para mobile)"),
});

// Esquema para layout responsivo
const responsiveLayoutSchema = z.object({
  desktop: positionSchema,
  tablet: positionSchema.optional(),
  mobile: positionSchema.optional(),
});

// Esquema para um único bloco de construção da página
const blockSchema = z.object({
  id: z.string().describe("ID único do bloco"),
  name: z.string(),
  layout: z.string().optional(),
  variant: z.string().optional().describe("Variação do componente (ex: 'split', 'center', 'minimal')"),
  position: responsiveLayoutSchema.optional().describe("Posicionamento no grid layout"),
  properties: z.record(z.any()),
  styling: z.object({
    background: z.string().optional().describe("Cor/gradiente de fundo"),
    spacing: z.object({
      padding: z.string().optional(),
      margin: z.string().optional(),
    }).optional(),
    customCSS: z.string().optional().describe("CSS customizado para este bloco"),
  }).optional(),
});

// Esquema para seções compostas (múltiplos blocos agrupados)
const sectionSchema = z.object({
  id: z.string(),
  name: z.string().describe("Nome da seção (ex: 'Hero Complex', 'Features Grid')"),
  layout: z.enum(['grid', 'flexbox', 'masonry', 'carousel']).describe("Tipo de layout da seção"),
  gridConfig: z.object({
    columns: z.number().describe("Número de colunas no grid"),
    rows: z.number().optional().describe("Número de linhas (auto se omitido)"),
    gap: z.string().default('1rem').describe("Espaçamento entre elementos"),
  }).optional(),
  blocks: z.array(blockSchema).describe("Blocos que compõem esta seção"),
  styling: z.object({
    background: z.string().optional(),
    minHeight: z.string().optional(),
    customCSS: z.string().optional(),
  }).optional(),
});

// Esquema para um widget global, como um modal ou um chat flutuante
const widgetSchema = z.object({
  name: z.string().describe("O nome do widget, correspondendo ao nome do arquivo de template .hbs."),
  position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'custom']).default('bottom-right'),
  properties: z.record(z.any()).describe("As propriedades para preencher o template Handlebars do widget."),
  trigger: z.object({
    type: z.enum(['scroll', 'time', 'click', 'hover', 'immediate']).default('immediate'),
    value: z.union([z.string(), z.number()]).optional().describe("Valor do trigger (ex: '50%' para scroll, 5000 para time em ms)"),
  }).optional(),
});

// Esquema para composição de página flexível
const pageCompositionSchema = z.object({
  type: z.enum(['linear', 'grid', 'mixed']).describe("Tipo de composição da página"),
  sections: z.array(sectionSchema).describe("Seções que compõem a página"),
  breakpoints: z.object({
    mobile: z.string().default('768px'),
    tablet: z.string().default('1024px'),
    desktop: z.string().default('1200px'),
  }).optional(),
});

// Esquema principal que define a estrutura de todo o plano da página
export const pagePlanSchema = z.object({
  pageTitle: z.string().describe("O título da página para a tag <title> e SEO."),
  pageDescription: z.string().describe("A meta descrição da página para SEO."),
  pageType: z.string().describe("Tipo de página (ex: 'landing', 'portfolio', 'ecommerce', 'blog')"),
  targetAudience: z.string().describe("Público-alvo específico"),
  conversionGoal: z.string().describe("Objetivo principal da página (ex: 'gerar leads', 'vender produto', 'aumentar awareness')"),
  
  theme: z.object({
    themeName: z.enum([
      'moderno_azul', 
      'calor_tropical',
      'tech_neon',
      'luxury_gold',
      'nature_green',
      'sunset_gradient',
      'dark_premium',
      'glassmorphism',
      'cyberpunk',
      'minimalist_mono',
      'retro_wave',
      'corporate_elite'
    ]),
    font: z.enum(['inter', 'roboto', 'lato', 'playfair', 'montserrat', 'poppins']),
    animations: z.enum(['none', 'subtle', 'moderate', 'dynamic']).optional(),
    effects: z.array(z.enum(['glassmorphism', 'parallax', 'particles', 'gradients', 'shadows', '3d'])).optional(),
    customPalette: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
    }).optional().describe("Cores customizadas que sobrescrevem o tema"),
  }),
  
  composition: pageCompositionSchema,
  
  // Mantemos blocks para compatibilidade, mas marcamos como deprecated
  blocks: z.array(blockSchema).optional().describe("DEPRECATED: Use composition.sections ao invés"),
  widgets: z.array(widgetSchema).optional().describe("Um array de widgets globais a serem injetados na página, como modais ou pop-ups."),
  
  // Novos campos para flexibilidade
  customCode: z.object({
    head: z.string().optional().describe("HTML/CSS/JS customizado para o <head>"),
    body: z.string().optional().describe("HTML/JS customizado para o final do <body>"),
  }).optional(),
  
  seo: z.object({
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    structuredData: z.record(z.any()).optional(),
  }).optional(),
});

// Inferimos o tipo TypeScript diretamente do esquema Zod.
export type PagePlan = z.infer<typeof pagePlanSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Block = z.infer<typeof blockSchema>;
export type ResponsiveLayout = z.infer<typeof responsiveLayoutSchema>; 