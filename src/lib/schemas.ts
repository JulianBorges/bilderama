import { z } from 'zod';

// Esquema para um único bloco de construção da página
const blockSchema = z.object({
  name: z.string(),
  layout: z.string().optional(),
  properties: z.record(z.any()),
});

// Esquema principal que define a estrutura de todo o plano da página
export const pagePlanSchema = z.object({
  pageTitle: z.string().describe("O título da página para a tag <title> e SEO."),
  pageDescription: z.string().describe("A meta descrição da página para SEO."),
  theme: z.object({
    colorPalette: z.enum(['blue', 'green', 'purple', 'orange', 'grayscale']),
    font: z.enum(['inter', 'roboto', 'lato']),
  }),
  blocks: z.array(blockSchema).describe("Um array de blocos que compõem a estrutura da página."),
});

// Inferimos o tipo TypeScript diretamente do esquema Zod.
// Esta será a nossa "fonte da verdade" para a tipagem do PagePlan.
export type PagePlan = z.infer<typeof pagePlanSchema>; 