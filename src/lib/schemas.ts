import { z } from 'zod';

// Design tokens para controle granular de estilo
const designTokensSchema = z.object({
  cardStyle: z.enum(['elevated', 'outline', 'glass', 'minimal', 'bold']).optional(),
  spacing: z.enum(['compact', 'comfortable', 'spacious', 'extra-spacious']).optional(),
  emphasis: z.enum(['primary', 'accent', 'neutral', 'muted']).optional(),
  borderRadius: z.enum(['none', 'small', 'medium', 'large', 'full']).optional(),
  shadowIntensity: z.enum(['none', 'soft', 'medium', 'strong', 'dramatic']).optional(),
  animation: z.enum(['none', 'subtle', 'smooth', 'bouncy', 'dramatic']).optional(),
}).optional();

// Esquema para um único bloco de construção da página
const blockSchema = z.object({
  name: z.string(),
  layout: z.string().optional(),
  properties: z.record(z.any()),
  designTokens: designTokensSchema,
});

// Esquema para um widget global, como um modal ou um chat flutuante
const widgetSchema = z.object({
  name: z.string().describe("O nome do widget, correspondendo ao nome do arquivo de template .hbs."),
  properties: z.record(z.any()).describe("As propriedades para preencher o template Handlebars do widget."),
  designTokens: designTokensSchema,
});

// Schema de tema expandido
const themeSchema = z.object({
  themeName: z.enum(['moderno_azul', 'calor_tropical', 'saas_premium', 'corporativo_elegante', 'ecommerce_luxo', 'startup_tech', 'wellness_natural', 'creative_agency', 'finance_trust', 'restaurant_warm']),
  font: z.enum(['inter', 'roboto', 'lato', 'poppins', 'montserrat', 'playfair', 'crimson']),
  personality: z.enum(['minimal', 'bold', 'elegant', 'playful', 'corporate', 'creative', 'warm', 'tech']).optional(),
  density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
});

// Esquema principal que define a estrutura de todo o plano da página
export const pagePlanSchema = z.object({
  pageTitle: z.string().describe("O título da página para a tag <title> e SEO."),
  pageDescription: z.string().describe("A meta descrição da página para SEO."),
  theme: themeSchema,
  blocks: z.array(blockSchema).describe("Um array de blocos que compõem a estrutura da página."),
  widgets: z.array(widgetSchema).optional().describe("Um array de widgets globais a serem injetados na página, como modais ou pop-ups."),
});

// Inferimos o tipo TypeScript diretamente do esquema Zod.
// Esta será a nossa "fonte da verdade" para a tipagem do PagePlan.
export type PagePlan = z.infer<typeof pagePlanSchema>; 