# Bilderama - Seu Copiloto de Desenvolvimento Web com IA

Bilderama é um projeto ambicioso com o objetivo de se tornar um copiloto inteligente para o desenvolvimento de aplicações web. A visão é permitir que usuários criem e refinem interfaces web de alta qualidade através de uma combinação de linguagem natural e edição visual interativa, com foco no mercado brasileiro.

Este projeto inspira-se em ferramentas como v0.dev e Lovable, buscando combinar o poder da IA generativa com uma experiência de usuário fluida e um resultado final profissional.

## Estado do Projeto: Uma Fundação Sólida e Pronta para Escalar

O projeto concluiu com sucesso uma fase crítica de desenvolvimento, estabelecendo uma fundação arquitetural que é, ao mesmo tempo, robusta, escalável e de alta performance. O núcleo do Bilderama está estável e pronto para a implementação de funcionalidades que entregarão um verdadeiro "fator wow" e alto valor comercial.

### Tecnologias Principais

* **Frontend:** Next.js 14, React, TypeScript
* **Gerenciamento de Estado:** Zustand
* **Estilização:** Tailwind CSS
* **Motor de Templates:** Handlebars.js
* **Inteligência Artificial:** OpenAI (GPT-4o-mini)
* **Validação de Dados:** Zod
* **Componentes de UI:** Radix UI, Lucide Icons

### Arquitetura e Fluxo de Dados: A Vantagem Determinística

A arquitetura do Bilderama é seu maior diferencial, garantindo velocidade e confiabilidade.

1.  **IA Arquiteta:** O processo começa quando o usuário descreve seu site. Uma **IA Arquiteta** interpreta o pedido e, usando um catálogo de componentes pré-definidos, gera um plano de construção em JSON, o `PagePlan`. Este plano é a única "fonte da verdade" do site.
2.  **Validação com Zod:** O `PagePlan` gerado pela IA passa por uma validação rigorosa com Zod, garantindo que a IA obedeça às regras do nosso sistema e que nenhum dado malformado prossiga.
3.  **Renderizador Determinístico:** O `PagePlan` validado é então entregue a um **renderizador local (Handlebars)**. Este motor, que não usa IA, combina os dados do plano com templates de componentes (`.hbs`) para construir o código HTML final de forma **instantânea e 100% previsível**.
4.  **Edição "Source-Driven":** O ciclo de edição é robusto. Qualquer alteração (seja visual ou conversacional) atualiza o `PagePlan` em nosso estado central (Zustand). Essa mudança dispara o renderizador determinístico, que reconstrói o HTML, garantindo que o preview esteja sempre sincronizado com a fonte da verdade.

### Funcionalidades Atuais

* **Geração Inicial via Chat:** Interface para o usuário descrever o site que deseja.
* **Edição Conversacional Funcional:** A lógica central para editar o site via comandos de texto está implementada. A IA pode entender um pedido de alteração e gerar as "mutações" necessárias para modificar a estrutura do site (`PagePlan`).
* **Renderização Determinística e Instantânea:** Geração de código a partir do `PagePlan`.
* **Preview Interativo e Visualizador de Código:** Abas para alternar entre a visualização do site e a análise do código-fonte gerado.
* **Download do Projeto:** Funcionalidade para baixar o site completo como um arquivo `.zip`.

## Roteiro Estratégico: O Caminho para o Mercado

Com a fundação técnica estável, nosso foco se volta para a experiência do usuário e a criação de um produto com apelo comercial, guiado pela filosofia de ser um "copiloto assistido por IA".

### Fase 1: O MVP Comercial e a Experiência "Premium" (Foco Imediato)

*O objetivo desta fase é fazer com que o Bilderama gere sites visualmente ricos e variados, e que a experiência de usar a ferramenta seja elegante e impressionante.*

1.  **Enriquecimento da Biblioteca de Componentes (Prioridade Máxima):** Adicionar novos blocos de construção, aprimorar os existentes e adicionar outros elementos modernos para aumentar a variedade e a qualidade dos sites gerados.
2.  **Melhoria da IA Arquiteta:** Refinar continuamente os prompts para que a IA gere `PagePlans` mais criativos, completos e alinhados com as melhores práticas de design
3.  **Refinamento da UI do Dashboard:** Aprimorar o design da nossa própria interface para que ela tenha uma aparência "premium", aumentando o valor percebido da ferramenta.
4.  **Refinamento da Experiência "Copiloto":** Melhorar a comunicação da IA, para que ela descreva as ações que realizou e ofereça sugestões mais contextuais.
5.  **Renderização Progressiva (UX):** Implementar o efeito visual de "live coding" ou de construção bloco a bloco para reforçar o "fator wow" e a sensação de que a IA está trabalhando para o usuário.

### Fase 2: Expansão da Plataforma e Persistência (Médio Prazo)

*Com a experiência de criação no ponto, agora expandimos o escopo do que o Bilderama pode fazer e garantimos que o trabalho do usuário seja permanente.*

1.  **Persistência em Banco de Dados:** Implementar um backend com autenticação de usuários e banco de dados (ex: Supabase) para permitir o salvamento de múltiplos projetos e o versionamento de alterações.
2.  **Suporte a Múltiplas Páginas:** Permitir a criação de sites completos (Home, Sobre, Contato, etc.) com navegação interligada.
3.  **Ampliação dos Tipos de Geração:** Com a base de componentes e o suporte a múltiplas páginas, oferecer a criação de Blogs, Dashboards e sites de E-commerce simples.

### Fase 3: Monetização e Ecossistema (Longo Prazo)

*Com uma plataforma robusta, focamos em monetizar e nos conectar ao ecossistema mais amplo.*

1.  **Sistema de Deploy e Domínios:** Implementar a publicação com 1 clique em subdomínios `*.bilderama.com` (gratuito) e a conexão de domínios próprios (planos pagos).
2.  **Integração com Ecossistema DEV:** Explorar funcionalidades "Pro" como o suporte a LLMs locais (Ollama) e a exportação de projetos para o GitHub.

## Como Executar o Projeto

1.  Clone o repositório.
2.  Instale as dependências com `npm install`.
3.  Crie um arquivo `.env.local` e adicione sua chave da API da OpenAI: `OPENAI_API_KEY=sua_chave_api_aqui`.
4.  Execute com `npm run dev`.
5.  Abra http://localhost:3000 no seu navegador.