# Bilderama - Copiloto Inteligente para Criação de Sites Comerciais

**Bilderama** é um copiloto visual que combina IA com um sistema de design determinístico para gerar sites únicos e comercialmente viáveis. Foco no mercado brasileiro, em português, com diversidade visual elevada.

---

## 🎯 Estado Atual (Capacidades)

- **Geração determinística** via `PagePlan (Zod)` → `Renderer (Handlebars)` → `HTML` com temas e tokens de design.
- **IA Arquiteta**: prompt especializado (PT‑BR) que produz JSON válido e diverso; com detecção de intenção para **múltiplas páginas** (`pages[]`).
- **Editor Conversacional**: instruções naturais para editar o `PagePlan` mantendo o schema (via `/api/chat`).
- **Agente multi‑etapas (Refatoração 2)**: orquestrador que executa o ciclo `Planejar → Aplicar (VFS) → Format/Typecheck/Tests → Explicar` e retorna diffs propostos e relatórios de validações.
- **Preview moderno**: desktop/mobile, seletor de páginas, overlay de loading e seleção inline de elementos com `data-bild-*`.
- **Dashboard clean**: topbar com quick actions, **Publicar**, **Salvar versão**, **tema claro/escuro** e **Configurações**; painel dividido (chat ↔ preview/código).
- **Publicação 1‑clique**: rota `/api/publish` e página pública `/p/[slug]` (persistência local em `.data/published/` com cache em memória).
- **Histórico de versões (local)**: snapshots automáticos a cada geração, **Salvar versão** manual; painel de **Diff** (Atual vs Selecionada) e **Restaurar**. Endpoint `/api/projects` para salvar/listar snapshots do projeto (MVP em FS local).
- **Explicações e sugestões inteligentes**: análise do `PagePlan` gera resumo e até 5 sugestões focadas em conversão/UX.
- **VFS + Tools do agente**: endpoints `apply_diff`, `list/read/snapshot`, `search`, `format` (Prettier), `typecheck` (TypeScript) e `run_tests` (Vitest, timeout), com rate‑limit simples.
- **UI de diffs**: colagem de operações em JSON, staging por operação, pré‑visualização por arquivo com side‑by‑side e realce de linhas, aplicar selecionadas e reverter última mudança.
- **Multi‑preview**: HTML determinístico (base/fallback) e Sandpack (opcional) para execução real client‑only.
- **Testes**: suíte verde cobrindo renderer, middleware, schemas, VFS e endpoints do agente.

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
- ✅ Implementado nesta refatoração:
  - Orquestrador: Planejar (Engenheiro) → Aplicar em VFS → `format` (Prettier) → `typecheck` (TS) → `tests` (Vitest) → Explicação (Analista) → Retorno com `diffPreview`, `toolResults`, `pagePlanJson`.
  - UI do chat: badges de validação (verde/vermelho com duração) e CTA “Aplicar mudanças sugeridas”.
- **Próximos incrementos**:
  - Prompt de `Designer` para tokens/layout quando pedido; iterações automáticas de correção (QA) com limite de tentativas.

### 4) Execução/Preview de código real
- **Gap**: Preview mostra HTML renderizado; não roda componentes React/Tailwind como código real.
- **Necessário**:
  - Estratégia **multi‑preview** (já iniciada): HTML determinístico e Sandpack. Planejar build remoto efêmero.

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

## Fluxo do Agente (Refatoração 2)

- Entrada (chat, modo edição): `{ userInput, currentPagePlan, currentFiles }`.
- Orquestração:
  1. Engenheiro produz `AgentPlan` com `diffs?` e/ou `pagePlanPatchedJson?`.
  2. Aplica diffs em VFS e valida com `format` → `typecheck` → `tests`.
  3. Gera explicação e sugestões a partir do `PagePlan` final (quando houver).
- Saída (`/api/chat`):
  - `pagePlanJson: string`
  - `files: GeneratedFile[] | null`
  - `explanation: string`
  - `suggestions: string[]`
  - `diffPreview?: DiffOperation[]`
  - `toolResults?: { type: 'format'|'typecheck'|'tests', ok: boolean, details: any, durationMs: number }[]`

---

## 🏗️ Arquitetura de Produção (SaaS escalável)

- **Multi‑preview**: HTML determinístico (fallback rápido) + Sandpack (client‑only) + build remoto efêmero (paridade de produção).
- **Build remoto efêmero**: sandbox Node (Vite/esbuild), sem rede, limites de CPU/mem; artefatos versionados (hash do VFS) em S3/R2 + CDN.
- **Persistência**: DB (Postgres), storage de artefatos, histórico versionado (PagePlan + VFS), auditoria.
- **Segurança**: sanitização, CSP no preview, isolamento de sandbox, rate‑limit por IP/usuário/plano, RBAC básico.
- **Observabilidade**: logs estruturados, tracing opcional, métricas de agente (tempo por tool, taxa de sucesso), Sentry, PostHog.
- **CI/CD**: testes (unit/integração/e2e), typecheck, lint/format no CI; deploy automatizado.
- **SaaS BR**: billing local (Pix/cartão), LGPD (consentimento, DPA, exportação/eliminação), timezone PT‑BR/BRL.

---

## 🛣️ Plano de Refatoração (prioridades e entregáveis)

1) Mapeamento completo `editableAttr` e Editor por tipo
- Padronizar `data-bild-*` em TODOS os templates.
- Editor com campos tipados (texto, imagem, link interno, enum token) validado por Zod.

2) Agente multi‑etapas com explicação
- Prompts especializados (Engenheiro, Analista) + adicionar **Designer (tokens/layout)** e **QA** com iterações limitadas.
- `generateAnalysis` real (não‑stub) com sugestões contextuais.

3) Persistência + Auth + Histórico versionado
- NextAuth + Supabase/Neon + Prisma/Drizzle.
- Tabelas para projetos, versões e publicação.
- Rollback e rótulos de versões.

4) Execução/Preview de produção (novo)
- Build remoto efêmero com Vite/esbuild em sandbox.
- Cache por hash do VFS; artefatos em S3/R2 + CDN; preview servindo artefatos reais.

5) Publicação em produção
- Storage S3/CDN + deploy automático (Vercel/Cloudflare Pages).
- Domínios customizados e SEO (sitemap/robots/meta/OG).

6) Qualidade e segurança
- Testes unit/integração/e2e; typecheck/eslint/prettier no CI.
- Sanitização/CSP; Sentry; PostHog; rate‑limit por endpoint/usuário/plano.

7) SaaS Brasil
- Billing (Pix/cartão) e limites por plano.
- LGPD (consentimento, exportação, deleção, políticas).

8) Catálogo verticalizado e conteúdo por nicho
- Kits verticais (restaurantes, clínicas, imobiliárias, educação, etc.) com variações de blocos e copy PT‑BR nativa.
- Regras de diversidade visual por nicho (cores, densidade, tipografia) orientadas pelo prompt de Designer.

9) Assets e mídia
- Otimização de imagens (formatos modernos, resize, lazy‑load, placeholders) e pipeline de upload/transformação.
- Diretrizes para ícones/ilustrações consistentes por nicho.

> Sprints sugeridos: (1) mapeamento+editor, (2) agente+explicações, (3) persistência+histórico, (4) build remoto+preview, (5) publicação, (6) billing+LGPD).

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
- **Ferramentas do agente**: VFS + endpoints `apply_diff`, `list/read/snapshot`, `search`, `format`, `typecheck`, `run_tests`; rate‑limit simples aplicado.
- **Multi‑preview**: HTML determinístico (base/fallback) e Sandpack (opcional).
- **Novidades implementadas**: análise inteligente do `PagePlan`; orquestrador multi‑etapas; UI de validações/diffs no chat; snapshots automáticos e botão **Salvar versão**; painel de **Diff** com restauração.

---

## Roadmap de Arquivos/Componentes a tocar primeiro

- `src/templates/**`: aplicar `editableAttr` exaustivo (incluindo arrays e nested props).
- `src/components/editor/**`: novos controles tipados, validação Zod e ligação com `pagePlan`/VFS.
- `src/lib/ai.ts`, `src/lib/services/conversationalEditorService.ts`, `src/lib/services/agentOrchestrator.ts`: evolução de prompts e reflexão (Designer/QA).
- `src/components/code-viewer/code-viewer.tsx`: modo diffs com staging e highlight.
- `src/lib/publishStore.ts` → persistência real (DB/Storage) e jobs de deploy.
- `src/lib/vfs/**` e `src/app/api/agent/**` para operações do agente.

---

## Licença

MIT.