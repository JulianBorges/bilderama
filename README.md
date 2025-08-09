# Bilderama - Copiloto Inteligente para Criação de Sites Comerciais

**Bilderama** é um copiloto visual que combina IA com um sistema de design determinístico para gerar sites únicos e comercialmente viáveis. Foco no mercado brasileiro, em português, com diversidade visual elevada.

---

## 🎯 Estado Atual (Capacidades)

- **Geração determinística** via `PagePlan (Zod)` → `Renderer (Handlebars)` → `HTML` com temas e tokens de design.
- **IA Arquiteta**: prompt especializado (BR) que produz JSON válido e diverso; agora com detecção de intenção para **múltiplas páginas** (`pages[]`).
- **Editor Conversacional**: instruções naturais para editar o `PagePlan` mantendo o schema.
- **Preview moderno**: desktop/mobile, tabs de páginas (rotas geradas), overlay de loading e edição inline.
- **Dashboard premium**: sidebar recolhível com persistência, topbar com dark/light, layout responsivo.
- **Navbar inteligente**: links internos automáticos (Sobre/Preços/Contato/Blog) via helper.
- **Assets seguros**: placeholders automáticos quando imagens não existem.
- **Middleware & Cache**: limites de payload e exceção para publicação 1‑clique.
- **Publicação 1‑clique**: rota `/api/publish` e página pública `/p/[slug]`.
- **Testes**: smoke para renderer, middleware e schema.

> Nota: Usuários utilizam os sites dentro da plataforma. Download ZIP está desativado neste estágio.

---

## 🚀 Novidades de UI (Fator WOW)

- **DashboardShell**: sidebar recolhível (persistência em localStorage), topbar com ThemeToggle, conteúdo com custom scrollbar.
- **Chat premium**: textarea com auto-resize, envio com Ctrl/Cmd+Enter, sugestões clicáveis.
- **Preview com tabs**: alternância rápida entre páginas geradas; modo Desktop/Mobile.
- **Links automáticos**: `Navbar` mapeia rótulos comuns para rotas internas.
- **Placeholders de imagem**: evita 404 em cards, logos e avatares.

---

## 🛣️ Plano de Ação (MVP Vendável)

1) Edição visual total: aplicar `editableAttr` em todos os templates restantes e criar painel dinâmico por tipo de campo.
2) Barra de páginas: exibir e permitir reordenação/criação de rotas pelo UI.
3) Persistência: auth + projetos e versões (rollback por bloco).
4) Integrações: handler de formulário e analytics (Plausible/GA4) por projeto.
5) Deploy: domínios customizáveis (etapa seguinte ao slug público).

---

## 🔧 Como Executar

```bash
npm install
# .env.local
# OPENAI_API_KEY=...

npm run dev
```

Scripts úteis:
```bash
npm run build       # Build produção
npm run build:css   # Build do CSS dos templates
npm run build:all   # CSS + build
npm run test        # Testes
```

---

## Observações Técnicas

- `pages[]` validado em `/api/render` (formato e duplicatas).
- Helpers de renderer: `editableAttr`, `linkHref`, `slugify`, `safeImg`.
- Modo dark/light consistente via `ThemeProvider` e tokens CSS.

---

## Licença
MIT.