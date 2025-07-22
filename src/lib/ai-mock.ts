import { AIResponse } from './ai';

export const MOCK_PAGE_PLAN = {
  "pageTitle": "Pizzaria Dom Giuseppe - Sabor Autêntico Italiano",
  "pageDescription": "A melhor pizzaria da cidade com receitas tradicionais italianas, massa fresca e ingredientes selecionados. Delivery e balcão.",
  "pageType": "landing",
  "targetAudience": "Famílias e jovens adultos que valorizam comida italiana autêntica",
  "conversionGoal": "gerar pedidos online e aumentar vendas no balcão",
  "theme": {
    "themeName": "calor_tropical",
    "font": "playfair",
    "animations": "subtle",
    "effects": ["gradients", "shadows"]
  },
  "composition": {
    "type": "linear",
    "sections": [
      {
        "id": "hero-section",
        "name": "Hero Principal",
        "layout": "grid",
        "gridConfig": {
          "columns": 1,
          "gap": "0"
        },
        "blocks": [
          {
            "id": "hero-1",
            "name": "HeroModerno",
            "variant": "default",
            "properties": {
              "title": "Pizzaria Dom Giuseppe",
              "subtitle": "Autêntica pizza italiana com massa fresca e ingredientes selecionados. Tradição familiar desde 1985.",
              "ctaPrimary": "Fazer Pedido",
              "ctaSecondary": "Ver Cardápio",
              "backgroundImage": "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            }
          }
        ]
      },
      {
        "id": "features-section",
        "name": "Especialidades",
        "layout": "grid",
        "gridConfig": {
          "columns": 3,
          "gap": "2rem"
        },
        "blocks": [
          {
            "id": "feature-1",
            "name": "GridFeatures",
            "variant": "default",
            "properties": {
              "title": "Nossas Especialidades",
              "subtitle": "Pizzas artesanais feitas com amor e tradição",
              "features": [
                {
                  "icon": "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
                  "title": "Massa Fresca",
                  "description": "Preparada diariamente com fermentação natural de 48h"
                },
                {
                  "icon": "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
                  "title": "Ingredientes Premium",
                  "description": "Queijos importados e tomates orgânicos selecionados"
                },
                {
                  "icon": "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
                  "title": "Delivery Rápido",
                  "description": "Entrega em até 30 minutos para toda a cidade"
                }
              ]
            }
          }
        ]
      },
      {
        "id": "cta-section",
        "name": "Call to Action",
        "layout": "grid",
        "gridConfig": {
          "columns": 1
        },
        "blocks": [
          {
            "id": "cta-1",
            "name": "CallToAction",
            "variant": "default",
            "properties": {
              "title": "Pronto para Saborear?",
              "subtitle": "Faça seu pedido agora e receba em casa quentinha!",
              "ctaPrimary": "Fazer Pedido Online",
              "ctaSecondary": "Ver Localização"
            }
          }
        ]
      }
    ]
  }
};

export async function mockProcessUserInput(userInput: string): Promise<AIResponse> {
  // Simula um delay da API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    pagePlanJson: JSON.stringify(MOCK_PAGE_PLAN),
    files: null,
    explanation: "Site criado com sucesso! Desenvolvi uma landing page moderna para sua pizzaria com foco em conversão. O design usa cores quentes que remetem à comida italiana, destaca seus diferenciais (massa fresca, ingredientes premium) e inclui calls-to-action estratégicos para pedidos online.",
    suggestions: [
      "Adicione uma seção de depoimentos de clientes",
      "Inclua o cardápio completo com preços",
      "Adicione um mapa com sua localização",
      "Crie uma galeria com fotos das pizzas"
    ]
  };
}