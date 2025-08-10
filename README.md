# Bilderama - Copiloto Inteligente para Criação de Sites Comerciais

**Bilderama** é um copiloto visual que combina IA com um sistema de design determinístico para gerar sites únicos e comercialmente viáveis. Foco no mercado brasileiro, em português, com diversidade visual elevada.

---

## 🎯 Estado Atual (Capacidades)

- **Geração determinística** via `PagePlan (Zod)` → `Renderer (Handlebars)` → `HTML` com temas e tokens de design.
- **IA Arquiteta**: prompt especializado (PT‑BR) que produz JSON válido e diverso; com detecção de intenção para **múltiplas páginas** (`pages[]`).
- **Editor Conversacional (MVP)**: instruções naturais para editar o `PagePlan` mantendo o schema (via `/api/chat` + `conversationalEditorService`).
- **Preview moderno**: desktop/mobile, seletor de páginas centralizado, overlay de loading e seleção inline de elementos com `data-bild-*`.
- **Dashboard clean**: topbar com quick actions, **Publicar**, **Salvar versão**, **tema claro/escuro** e **Configurações** à direita; painel dividido (chat ↔ preview/código).
- **Publicação 1‑clique**: rota `/api/publish` e página pública `/p/[slug]` (armazenamento em memória).
- **Histórico de versões (local)**: snapshots automáticos a cada geração e **Salvar versão** manual na topbar; painel de **Diff** (Atual vs Selecionada) e **Restaurar esta versão**.
- **Explicações e sugestões inteligentes**: a cada geração, a IA analisa o `PagePlan` e retorna um resumo e até 5 sugestões focadas em conversão/UX.
- **Testes**: smoke para renderer, middleware e schema.

> Nota: Usuários utilizam os sites dentro da plataforma. Download ZIP está desativado neste estágio.

---

## 🧭 O que falta para atingir nível “copiloto” (estilo lovable.dev)

Abaixo, uma análise prática das lacunas e do que precisa ser refatorado/adicionado para que o Bilderama deixe de apenas “gerar sites pré‑definidos” e passe a **explicar, corrigir e iterar código e UI** de forma realmente assistiva.

### 1) Arquitetura de edição de código (além de HTML determinístico)
- **Gap**: O motor atual gera HTML de templates Handlebars a partir de um `PagePlan`. Não há geração/edição de código fonte (React/TS), nem diffs aplicáveis, nem refatorações estruturais.
- **Necessário**:
  - Camada de **Workspace Virtual** (VFS) com arquivos React/Tailwind/TS e build in‑browser (ex.: `@codesandbox/sandpack-react`) ou **sandbox remota** (Node/Vercel functions).
  - **Ferramentas do agente** (tools) para: `read_file`, `write_file`, `search`, `apply_diff`, `run_tests`, `typecheck`, `format`. Preferir function-calling com retorno estruturado.
  - **Gerador híbrido**: manter o pipeline determinístico (PagePlan→HTML) para velocidade e adicionar um pipeline opcional que **sintetiza componentes React** tipados a partir do `PagePlan` (templates React + props derivadas do catálogo).
  - **Sistema de diffs** com revisão/aceite: visual de “Proposta de mudança → Diff → Aplicar”.

### 2) Mapeamento UI↔Plano/Code e edição granular
- **Gap**: `editableAttr` cobre apenas casos simples (texto plano). Listas, imagens, CTAs e estruturas aninhadas não têm mapeamento robusto.
- **Necessário**:
  - Padronizar `data-bild-block-index` e `data-bild-prop` em TODOS os templates e layouts (incluindo arrays/nested), com convenções tipo `prop=members[2].name`.
  - Painel de edição “por tipo” (texto, rich text, imagem, link interno, cor, enum de token), com validação Zod.
  - “Pickers” para design tokens com **valores permitidos**.

### 3) Agente multi‑etapas com reflexão e explicações
- **Gap**: `generateAnalysis` é stub e não há reflexão, nem explicações passo a passo ou correções automáticas com verificação.
- **Necessário**:
  - Fluxo do agente: Planejar → Propor → Aplicar em VFS → Rodar build/test/typecheck → Refletir → Explicar → Pedir aceite.
  - Respostas do assistente com: resumo, justificativas, riscos, alternativas, e links para diffs/arquivos.
  - Prompts especializados: “Arquiteto” (já existe), “Engenheiro de Código”, “Designer de UI (tokens/layout)”, “QA/Typecheck”.

### 4) Execução/Preview de código real
- **Gap**: Preview mostra HTML renderizado; não roda componentes React/Tailwind como código real.
- **Necessário**:
  - Integração com Sandpack ou bundler web para executar **projeto React** gerado no VFS, permitindo iterar em tempo real.
  - Alternar entre “HTML determinístico” e “App React” conforme a complexidade do projeto.

### 5) Persistência real, histórico e colaboração
- **Gap**: Publicação em memória; histórico local via `localStorage`; não há autenticação.
- **Necessário**:
  - Autenticação (NextAuth v5 ou Clerk) com Google/Email.
  - Banco (Supabase/Neon + Prisma/Drizzle): `users`, `projects`, `project_versions`, `published_sites`, `billing`.
  - Histórico versionado por “snapshot” (PagePlan + VFS) com rollback e rótulos.
  - Colaboração assíncrona (MVP: lock otimista; futuro: CRDT/Yjs para co‑edição).

### 6) Publicação pronta para produção
- **Gap**: Storage em memória; sem domínios customizados; sem CDN; sem SEO programático.
- **Necessário**:
  - Storage S3‑compatível (R2/Wasabi) para artefatos; CDN.
  - Publicação para Vercel/Cloudflare Pages/Netlify ou “edge static hosting” próprio.
  - Domínios customizados com verificação DNS, SSL automático e rotas estáveis.
  - Geração de `sitemap.xml`, `robots.txt`, meta‑tags e OG.

### 7) Qualidade, testes e segurança
- **Gap**: Smoke tests; sem typecheck/diff tests; sanitização limitada; XSS possível via conteúdo.
- **Necessário**:
  - Testes: unit + integração (renderer, tools do agente, VFS, prompts), e2e (Playwright) para flows críticos.
  - Typecheck/ESLint/Prettier automáticos no CI.
  - Sanitização de HTML e inputs do usuário, CSP no preview, isolamento de sandbox.
  - Observabilidade: Sentry, logs estruturados, PostHog.

### 8) Produto SaaS para o Brasil (monetização e LGPD)
- **Gap**: Sem billing, limites, ou políticas de dados.
- **Necessário**:
  - Planos de assinatura (trial, Pro) com gateways locais: **Pix/cartão (Pagar.me, Iugu, Mercado Pago)**.
  - Limites por plano (tokens, projetos, publicações, domínios) e rate‑limits por IP/usuário.
  - LGPD: consentimento, DPA, retenção, exportação/eliminação de dados, localização (pt‑BR), timezone e moeda (BRL) nativos.
  - Nota fiscal/NFS‑e (MVP: recibo simples; evoluir para integração fiscal quando necessário).

### 9) Catálogo expandido e “verticalização”
- **Gap**: Catálogo bom, porém genérico.
- **Necessário**:
  - Kits verticais para nichos brasileiros (restaurantes, clínicas, imobiliárias, cursos), com copy PT‑BR nativa.
  - Integrações locais: WhatsApp Business, RD Station, Mailersend/Email BR, Google Meu Negócio.

### 10) Experiência de uso
- **Gap**: Falta “modo diffs”, “aplique/reverta”, e onboarding guiado.
- **Necessário**:
  - UI de diffs com staging por arquivo/trecho.
  - Onboarding com templates guiados (“Quero um site de clínica com agendamento por WhatsApp”).
  - Biblioteca de “receitas” acionáveis via chat.

---

## 🛣️ Plano de Refatoração (prioridades e entregáveis)

1) Fundamentos de edição de código
- VFS + Sandpack para React/Tailwind.
- Tools do agente (`read/write/search/apply_diff/run_tests/typecheck/format`).
- UI de diffs com “Aplicar/Descartar”.

2) Mapeamento completo `editableAttr` e Editor por tipo
- Padronizar `data-bild-*` em TODOS os templates.
- Editor com campos tipados (texto, imagem, link interno, enum token) validado por Zod.

3) Agente multi‑etapas com explicação
- Prompts especializados e reflexão.
- `generateAnalysis` real (não‑stub) com sugestões contextuais.

4) Persistência + Auth + Histórico versionado
- NextAuth + Supabase/Neon + Prisma/Drizzle.
- Tabelas para projetos, versões e publicação.
- Rollback e rótulos de versões.

5) Publicação em produção
- Storage S3/CDN + deploy automático (Vercel/Cloudflare Pages).
- Domínios customizados e SEO (sitemap/robots/meta/OG).

6) Qualidade e segurança
- Testes unit/integração/e2e; typecheck/eslint/prettier no CI.
- Sanitização/CSP; Sentry; PostHog.

7) SaaS Brasil
- Billing (Pix/cartão) e limites por plano.
- LGPD (consentimento, exportação, deleção, políticas).

> Sprints sugeridos: (1) VFS+diffs, (2) mapeamento+editor, (3) agente+explicações, (4) persistência+histórico, (5) publicação, (6) billing+LGPD.

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
- Helpers do renderer: `editableAttr`, `linkHref`, `slugify`, `safeImg`.
- Modo dark/light via `ThemeProvider` + Tailwind `darkMode: 'class'` + tokens CSS importados no `globals.css`.
- Modelos LLM: configurável em `src/lib/config.ts` (usar modelos mais fortes para o agente de código).
- **Novidades implementadas**: análise inteligente do `PagePlan` (explicação e até 5 sugestões); snapshots automáticos e botão **Salvar versão** (topbar); painel de **Diff** com restauração.

---

## Roadmap de Arquivos/Componentes a tocar primeiro

- `src/templates/**`: aplicar `editableAttr` exaustivo (incluindo arrays e nested props).
- `src/components/editor/**`: novos controles tipados, validação Zod e ligação com `pagePlan`/VFS.
- `src/lib/ai.ts` e `src/lib/services/conversationalEditorService.ts`: implementar tools e reflexão; substituir `generateAnalysis` stub.
- `src/components/code-viewer/code-viewer.tsx`: modo diffs e “Aplicar/Reverter”.
- `src/lib/publishStore.ts` → persistência real (DB/Storage) e jobs de deploy.
- Novo módulo `src/lib/vfs/**` e `src/app/api/agent/**` para operações do agente.

---

## Licença

MIT.