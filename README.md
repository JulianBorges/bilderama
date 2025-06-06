# Bilderama - Seu Copiloto de Desenvolvimento Web com IA

Bilderama é um projeto ambicioso com o objetivo de se tornar um copiloto inteligente para o desenvolvimento de aplicações web. A visão é permitir que usuários, desde iniciantes a desenvolvedores experientes, criem desde sites simples (landing pages, blogs, e-commerces) até aplicações full-stack complexas através de prompts de linguagem natural, com um preview iterativo e opções de personalização visual.

Este projeto inspira-se em ferramentas como Cursor, v0.dev e Lovable, buscando combinar o poder da IA generativa com uma experiência de usuário fluida e visual.

## Estado Atual (MVP Refatorado e Robusto)

O Bilderama superou o estágio de MVP inicial e agora possui uma fundação arquitetural robusta, focada em resiliência, manutenibilidade e escalabilidade. O núcleo da aplicação foi estrategicamente refatorado para garantir um fluxo de dados consistente e uma experiência de usuário mais confiável.

### Tecnologias Principais
*   **Frontend:** Next.js 14, React, TypeScript
*   **Gerenciamento de Estado:** Zustand
*   **Estilização:** Tailwind CSS
*   **Inteligência Artificial:** OpenAI (GPT-4o-mini via API)
*   **Validação de Dados:** Zod
*   **Componentes de UI:** Radix UI, Lucide Icons

### Arquitetura e Fluxo de Dados
A arquitetura atual é centrada em um fluxo de dados unidirecional e na separação clara de responsabilidades:

1.  **O Agente Arquiteto e o Plano Mestre:** O processo começa com a **IA Arquiteta**, que interpreta o prompt do usuário e, com base em um catálogo de componentes, gera um plano de construção em JSON chamado `PagePlan`. Este plano é a única "fonte da verdade" para a estrutura e o conteúdo do site. A resposta da IA é rigorosamente validada com **Zod**, garantindo que nenhum dado malformado entre no sistema.

2.  **Edição "Source-Driven" e Re-renderização em Tempo Real:** As interações do usuário no modo de edição seguem um ciclo robusto:
    *   O HTML gerado contém `data-attributes` que mapeiam cada elemento de volta à sua origem no `PagePlan`.
    *   Quando o usuário edita um elemento, a ação atualiza o estado do `PagePlan` na store central (Zustand), não o HTML diretamente.
    *   Qualquer mudança no `PagePlan` aciona uma API dedicada que re-renderiza o HTML com os dados atualizados, que é então exibido no preview.
    *   Este fluxo garante que o estado do projeto seja sempre consistente e que as edições manuais sejam preservadas.

3.  **IA Construtora:** Uma segunda IA, a Construtora, recebe o `PagePlan` validado e é responsável por montar o código HTML final, preenchendo os componentes com o conteúdo definido.

### Funcionalidades Implementadas
*   **Geração via Chat:** Interface para o usuário descrever o site que deseja.
*   **Geração Baseada em Blocos:** Utiliza uma biblioteca interna de componentes para garantir alta qualidade e consistência no código gerado.
*   **Preview Interativo:** Renderiza o site gerado em tempo real em um `iframe`.
*   **Modo Editor "Source-Driven":**
    *   **Seleção Inteligente:** Clicar em um elemento no preview o identifica unicamente dentro do modelo de dados do projeto.
    *   **Edição Persistente:** Alterar propriedades no painel de contexto atualiza a "fonte da verdade" (`PagePlan`).
    *   **Atualização em Tempo Real:** As edições são refletidas instantaneamente no preview através de um ciclo de re-renderização.
*   **Visualizador de Código:** Exibe a estrutura de arquivos e o código-fonte gerado com syntax highlighting.
*   **Download do Projeto:** Permite que o usuário baixe o site completo como um arquivo `.zip`.

## Próximos Passos: Rumo ao Bilderama 1.0

Com a base do MVP estabelecida e fortalecida, o roteiro agora se concentra em transformar o Bilderama em um produto completo, com persistência, colaboração e capacidades de IA ainda mais avançadas.

**(Pendente) Substituição do Agente Construtor:** A próxima melhoria arquitetural planejada é substituir a IA Construtora por um renderizador de templates determinístico (ex: Handlebars). Isso aumentará drasticamente a velocidade, a confiabilidade e a previsibilidade da geração de código, além de reduzir custos de API.

**Fase 5: A Fundação - Autenticação e Persistência de Projetos**
*   **Objetivo:** Permitir que usuários se cadastrem, criem múltiplos projetos e que estes sejam salvos de forma persistente.
*   **Plano:**
    *   **Integração com Backend (Supabase):** Adotar o Supabase para gerenciar autenticação, banco de dados (Postgres) e storage.
    *   **Autenticação de Usuários:** Implementar fluxo completo de login/cadastro.
    *   **Modelagem do Banco de Dados:** Criar tabelas para `users`, `projects` e `project_files`.
    *   **Persistência:** Modificar o fluxo de geração para salvar e carregar os projetos do banco de dados.

**Fase 6: O "Git" do Bilderama - Versionamento e Edição Consistente**
*   **Objetivo:** Tratar cada alteração como uma nova "versão" do projeto, criando um histórico e garantindo que nenhum trabalho seja perdido.
*   **Plano:**
    *   **Evoluir o Schema:** Introduzir uma tabela `versions` para que um projeto possa ter múltiplas versões, cada uma com seu conjunto de arquivos.
    *   **Fluxo de Edição Robusto:** Cada alteração (manual ou via IA) criará uma nova versão no banco de dados, em vez de modificar o estado localmente.
    *   **(Stretch Goal) UI de Histórico:** Implementar uma interface para visualizar e reverter para versões anteriores.

**Fase 7: A IA Iterativa - Aplicando Sugestões e Refinamentos**
*   **Objetivo:** Tornar a IA capaz de editar um projeto existente com base em novos prompts ou na seleção de sugestões.
*   **Plano:**
    *   **IA Contextual:** A IA "Arquiteta" receberá o plano JSON da versão atual do projeto como contexto para o novo pedido.
    *   **Inteligência de "Diff":** A IA será instruída a gerar um novo plano JSON que seja uma modificação do plano existente, em vez de criar um do zero.
    *   **Fluxo de Sugestões:** Clicar em uma sugestão da IA (ex: "Melhorar contraste de cores") irá acionar o fluxo de edição da IA para aplicar a mudança, gerando uma nova versão do projeto.

## Como Executar o Projeto (Exemplo)

1.  Clone o repositório:
    ```bash
    git clone https://github.com/seu-usuario/bilderama.git
    cd bilderama
    ```
2.  Instale as dependências:
    ```bash
    npm install
    # ou
    yarn install
    ```
3.  Configure as variáveis de ambiente:
    *   Crie um arquivo `.env.local` na raiz do projeto.
    *   Adicione sua chave da API da OpenAI:
        ```
        OPENAI_API_KEY=sua_chave_api_aqui
        ```
4.  Execute o servidor de desenvolvimento:
    ```bash
    npm run dev
    # ou
    yarn dev
    ```
5.  Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

Este README.md visa fornecer um bom ponto de partida. Ele pode ser expandido com mais detalhes técnicos, decisões de arquitetura e guias de contribuição à medida que o projeto evolui.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia as diretrizes de contribuição antes de submeter um PR.

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- OpenAI pela API do GPT-4
- Comunidade Next.js # bilderama
