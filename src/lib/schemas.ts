import { z } from 'zod';

// Esquema para um único bloco de construção da página
const blockSchema = z.object({
  name: z.string(),
  layout: z.string().optional(),
  properties: z.record(z.any()),
});

// Esquema para um widget global, como um modal ou um chat flutuante
const widgetSchema = z.object({
  name: z.string().describe("O nome do widget, correspondendo ao nome do arquivo de template .hbs."),
  properties: z.record(z.any()).describe("As propriedades para preencher o template Handlebars do widget."),
});

// Esquema principal que define a estrutura de todo o plano da página
export const pagePlanSchema = z.object({
  pageTitle: z.string().describe("O título da página para a tag <title> e SEO."),
  pageDescription: z.string().describe("A meta descrição da página para SEO."),
  theme: z.object({
    themeName: z.enum([
      'moderno_azul', 
      'calor_tropical',
      'tech_neon',           // Tema tech com neons
      'luxury_gold',         // Tema luxuoso dourado
      'nature_green',        // Tema natural verde
      'sunset_gradient',     // Tema gradiente pôr do sol
      'dark_premium',        // Tema escuro premium
      'glassmorphism',       // Tema glassmorphism
      'cyberpunk',          // Tema cyberpunk
      'minimalist_mono',    // Tema minimalista monocromático
      'retro_wave',         // Tema retro wave
      'corporate_elite'     // Tema corporativo elite
    ]),
    font: z.enum(['inter', 'roboto', 'lato', 'playfair', 'montserrat', 'poppins']),
    animations: z.enum(['none', 'subtle', 'moderate', 'dynamic']).optional(),
    effects: z.array(z.enum(['glassmorphism', 'parallax', 'particles', 'gradients', 'shadows', '3d'])).optional(),
  }),
  blocks: z.array(blockSchema).describe("Um array de blocos que compõem a estrutura da página."),
  widgets: z.array(widgetSchema).optional().describe("Um array de widgets globais a serem injetados na página, como modais ou pop-ups."),
});

// Inferimos o tipo TypeScript diretamente do esquema Zod.
// Esta será a nossa "fonte da verdade" para a tipagem do PagePlan.
export type PagePlan = z.infer<typeof pagePlanSchema>; 