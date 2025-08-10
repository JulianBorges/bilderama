# Bilderama - Copiloto Inteligente para Criação de Sites Comerciais

**Bilderama** é um copiloto visual que combina IA com um sistema de design determinístico para gerar sites únicos e comercialmente viáveis. Foco no mercado brasileiro, em português, com diversidade visual elevada.

---

## 🎯 Estado Atual (Capacidades)

- **Geração determinística** via `PagePlan (Zod)` → `Renderer (Handlebars)` → `HTML` com temas e tokens de design.
- **IA Arquiteta**: prompt especializado (BR) que produz JSON válido e diverso; agora com detecção de intenção para **múltiplas páginas** (`pages[]`).
- **Editor Conversacional**: instruções naturais para editar o `PagePlan` mantendo o schema.
- **Preview moderno**: desktop/mobile, seletor de páginas centralizado, overlay de loading e edição inline.
- **Dashboard clean**: topbar única com logo/quick actions, publicar, **tema claro/escuro**; painel dividido (chat ↔ preview/código) com divisor sutil.
- **Publicação 1‑clique**: rota `/api/publish` e página pública `/p/[slug]`.
- **Testes**: smoke para renderer, middleware e schema.

> Nota: Usuários utilizam os sites dentro da plataforma. Download ZIP está desativado neste estágio.

---

## 🚀 Novidades de UI (MVP)

- **Topbar**: logo com QuickNav (Novo Projeto), engrenagem de acesso rápido, botão Publicar e seletor de tema.
- **Chat**: área com abas (Chat/Histórico), textarea sticky (sempre visível), auto‑resize, envio com Ctrl/Cmd+Enter e sugestões clicáveis.
- **Área de Preview/Código**:
  - Header minimalista com ícones de alternância (sem texto), seletor central de páginas e ícones Desktop/Mobile.
  - Visualizador de código com header próprio e atalho para retornar ao Preview.
- **Consistência visual**: botões padronizados, bordas finas, paddings uniformes, divisor do painel com 1px.
- **Tema claro/escuro**: habilitado via `darkMode: 'class'` e tokens em `generated-theme.css` importados no `globals.css`.

---

## 🛣️ Próximos passos

1) Edição visual total: aplicar `editableAttr` em todos os templates e painel por tipo de campo.
2) Persistência: auth + projetos e versões (rollback por bloco).
3) Integrações: handler de formulário e analytics por projeto.
4) Deploy: domínios customizáveis após o slug público.

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
- Modo dark/light consistente via `ThemeProvider` + Tailwind `darkMode: 'class'` + tokens CSS importados no `globals.css`.

---

## Licença
MIT.