import { config } from './config'
import { Configuration, OpenAIApi, ChatCompletionRequestMessage } from 'openai-edge'
import { snippets, Snippet } from './snippets'
import { pagePlanSchema, PagePlan } from './schemas'
import { ARCHITECT_SYSTEM_PROMPT } from './prompts/architect'
import { BUILDER_SYSTEM_PROMPT } from './prompts/builder'

export interface GeneratedFile {
  path: string
  content: string
  type: 'component' | 'style' | 'script' | 'page' | 'config'
  description: string
}

export interface AIResponse {
  pagePlanJson: string
  files: GeneratedFile[]
  explanation: string
  suggestions: string[]
}

const openaiConfig = new Configuration({
  apiKey: config.openaiApiKey
})

const openai = new OpenAIApi(openaiConfig)

async function callOpenAI(messages: ChatCompletionRequestMessage[]): Promise<string> {
  try {
    config.validateApiKey();
  } catch (error) {
    console.error('Erro de validação da API key:', error);
    throw error;
  }

  try {
    const response = await openai.createChatCompletion({
      model: config.model,
      messages,
      stream: false
    })

    if (!response.ok) {
      throw new Error('Erro na resposta da API da OpenAI')
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Resposta da API em formato inválido')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error)
    throw new Error('Falha ao comunicar com a API da OpenAI')
  }
}

// Interpreta e estrutura o prompt em inglês
async function structurePrompt(userInput: string): Promise<string> {
  // Compõe o catálogo de padrões em markdown
  const patterns = snippets.map(snippet => `
### ${snippet.name}
- **Category**: ${snippet.category}
- **Description**: ${snippet.description}
- **Props (template variables)**: ${JSON.stringify(extractPlaceholders(snippet.code))}
`).join('\n\n')

  const fullPrompt = `CATÁLOGO DE COMPONENTES DISPONÍVEIS:\n${patterns}\n\nREQUISIÇÃO DO USUÁRIO:\n${userInput}`

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content: ARCHITECT_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: fullPrompt,
    },
  ]

  try {
    const responseJson = await callOpenAI(messages);
    // Validação robusta com Zod.
    // Isso garante que a resposta da IA corresponda exatamente ao nosso esquema definido.
    const validatedPlan = pagePlanSchema.parse(JSON.parse(responseJson));
    return JSON.stringify(validatedPlan);
  } catch (e) {
    console.error("StructurePrompt não retornou um JSON válido ou compatível com o esquema:", e);
    // Se for um erro de validação do Zod, o erro será bem detalhado.
    throw new Error("O Arquiteto da IA falhou em gerar um plano JSON válido e compatível.");
  }
}

// Gera o código usando a OpenAI
export async function generateCode(pagePlanJson: string): Promise<GeneratedFile[]> {
  const pagePlan: PagePlan = JSON.parse(pagePlanJson);
  
  const availableSnippets = snippets.reduce((acc, snippet) => {
    acc[snippet.name] = snippet;
    return acc;
  }, {} as Record<string, Snippet>);

  const systemPrompt = BUILDER_SYSTEM_PROMPT

  const userPrompt = `PLANO DE CONSTRUÇÃO (PagePlan):
\`\`\`json
${JSON.stringify(pagePlan, null, 2)}
\`\`\`

BIBLIOTECA DE COMPONENTES DISPONÍVEIS:
\`\`\`json
${JSON.stringify(availableSnippets, null, 2)}
\`\`\`

Agora, construa o arquivo 'index.html' e retorne-o no formato JSON especificado.`

  const messages: ChatCompletionRequestMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = await callOpenAI(messages)
  
  // Adicionar log para depurar a resposta bruta da IA
  console.log('----------------------------------------------------------------');
  console.log('Resposta BRUTA da IA (para generateCode):');
  console.log(response);
  console.log('----------------------------------------------------------------');

  try {
    // Extração de JSON robusta: encontra JSON em blocos de markdown e lida com objetos ou arrays.
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\])|(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error('Resposta da IA não contém um bloco de código JSON, um array ou um objeto válido.');
    }

    // O conteúdo JSON real está em um dos grupos de captura
    const jsonString = jsonMatch[1] || jsonMatch[2] || jsonMatch[3];
    if (!jsonString) {
      throw new Error('Não foi possível extrair o conteúdo JSON da resposta da IA.');
    }
    
    const parsedJson = JSON.parse(jsonString);

    let files: GeneratedFile[];
    if (Array.isArray(parsedJson)) {
        files = parsedJson as GeneratedFile[];
    } else if (typeof parsedJson === 'object' && parsedJson !== null && 'path' in parsedJson) {
        // É um único objeto de arquivo, envolve em um array
        files = [parsedJson as GeneratedFile];
    } else {
        throw new Error('O JSON extraído não é um array de arquivos ou um único objeto de arquivo válido.');
    }

    // Filtrar quaisquer arquivos .css que a IA possa gerar por engano
    files = files.filter(file => !file.path.endsWith('.css'));

    const hasHtml = files.some(f => f.path.endsWith('.html'))
    const hasJs = files.some(f => f.path.endsWith('.js'))
    // Verifica se algum arquivo HTML gerado (ou o de fallback, se for o caso) referencia 'script.js'
    const htmlReferencesScriptJs = files.some(f => f.path.endsWith('.html') && f.content.includes('src="script.js"'));

    if (!hasHtml) {
      // Adiciona um HTML de fallback se a IA não gerar nenhum.
      // Este HTML usa classes Tailwind e espera que 'script.js' seja adicionado se referenciado.
      const fallbackHtmlContent = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Site Indisponível - Fallback Bilderama</title>
            {/* Tailwind CDN será injetado pelo PreviewIframe */}
          </head>
          <body class="bg-gray-100 text-gray-800 flex flex-col min-h-screen">
            <header class="bg-slate-700 text-white p-6 text-center shadow-md">
              <h1 class="text-3xl font-bold">Bilderama</h1>
            </header>
            <main class="flex-grow container mx-auto p-8 text-center flex flex-col justify-center items-center">
              <img src="https://via.placeholder.com/150x150.png/ff0000/ffffff?text=ERRO" alt="Erro na Geração de HTML" class="mb-6 w-32 h-32"/>
              <h2 class="text-2xl font-semibold mb-4 text-red-600">Oops! Conteúdo HTML Não Gerado.</h2>
              <p class="text-lg mb-2">A Inteligência Artificial não conseguiu gerar o conteúdo HTML para o seu site desta vez.</p>
              <p class="mb-6">Este é um conteúdo de fallback. Por favor, tente refinar seu prompt ou tente novamente mais tarde.</p>
              <button onclick="window.location.reload()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Tentar Novamente
              </button>
            </main>
            <footer class="bg-slate-700 text-white p-4 text-center text-sm mt-auto">
              &copy; Conteúdo de Fallback Gerado por Bilderama
            </footer>
            ${!hasJs && htmlReferencesScriptJs ? '<script src="script.js"></script>' : ''}
          </body>
          </html>
        `;
      files.push({
        path: 'index.html',
        content: fallbackHtmlContent,
        type: 'page',
        description: 'Página principal de fallback (HTML não gerado pela IA)'
      });
      // Se o HTML de fallback foi adicionado e ele referencia script.js, precisamos garantir que htmlReferencesScriptJs seja true
      // para que o script de fallback seja adicionado, caso a IA não o tenha fornecido.
      if (fallbackHtmlContent.includes('src="script.js"') && !hasJs) {
        // Não precisa re-setar htmlReferencesScriptJs, a checagem abaixo para !hasJs fará o trabalho
      }
    }

    // Adicionar script.js de fallback APENAS se não foi gerado pela IA E algum HTML (gerado ou de fallback) o referencia
    if (!hasJs && files.some(f => f.path.endsWith('.html') && f.content.includes('src="script.js"'))) {
      files.push({
        path: 'script.js',
        content: 'console.warn("AVISO: Arquivo script.js de fallback carregado. A IA não forneceu um script ou o script gerado foi inválido/removido.");',
        type: 'script',
        description: 'Script de fallback (JS não gerado/válido pela IA)'
      });
    }

    return files
  } catch (error) {
    console.error('Erro ao analisar o JSON da IA ou estrutura de arquivos:', error)
    return [
      {
        path: 'index.html',
        content: `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Erro na Geração do Site</title>
            {/* Tailwind CDN será injetado pelo PreviewIframe */}
          </head>
          <body class="bg-red-100 text-red-800 p-6 flex items-center justify-center min-h-screen">
            <div class="max-w-lg mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
              <img src="https://via.placeholder.com/100x100.png/ef4444/ffffff?text=X" alt="Ícone de Erro" class="mx-auto mb-4 w-20 h-20" />
              <h1 class="text-3xl font-bold mb-4 text-red-600">Erro Crítico ao Construir o Site</h1>
              <p class="mb-3 text-lg">Ocorreu um problema ao tentar processar o plano de construção da IA.</p>
              <p class="mb-3">A resposta pode não ter sido um JSON válido ou estava malformada, impedindo a criação dos arquivos do site.</p>
              <p class="text-sm text-gray-700 mb-1">Detalhe técnico do erro:</p>
              <pre class="bg-red-50 p-3 rounded text-left text-xs overflow-x-auto max-h-40">${ (error instanceof Error) ? error.message.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'Erro desconhecido'}</pre>
              <p class="mt-6 text-md">Por favor, <button onclick="window.location.reload()" class="text-blue-500 hover:text-blue-700 underline font-semibold">tente novamente</button>. Se o problema persistir, ajuste seu prompt.</p>
            </div>
          </body>
          </html>
        `,
        type: 'page',
        description: 'Página de erro crítico (parsing da IA ou estrutura)'
      }
    ];
  }
}

// Analisa o código e gera resumo e sugestões em português
async function generateAnalysis(files: GeneratedFile[]): Promise<{ explanation: string; suggestions: string[] }> {
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: 'system',
      content: `Você é um especialista em desenvolvimento web que analisa código e fornece feedback em português.

Forneça duas seções:

1. RESUMO: Uma explicação detalhada do site gerado, incluindo:
- Estrutura principal do site (páginas, seções, componentes)
- Elementos visuais e interativos implementados
- Funcionalidades principais e recursos técnicos
- Aspectos de UX/UI e acessibilidade
- Performance e otimizações implementadas
Limite o resumo a 3-4 frases objetivas.

2. SUGESTÕES: Lista de 3-5 sugestões curtas e acionáveis para melhorar o site.
Cada sugestão deve:
- Ter no máximo 4 palavras
- Ser direta e clara
- Começar com um verbo no infinitivo
- Focar em uma melhoria específica

Analise os seguintes aspectos:
1. Design e Visual:
   - Consistência visual
   - Hierarquia e tipografia
   - Responsividade
   - Microinterações
   - Dark mode

2. Experiência do Usuário:
   - Navegação e fluxo
   - Feedback visual
   - Acessibilidade
   - Performance
   - Formulários

3. Código e Técnico:
   - Semântica HTML
   - Otimização CSS
   - JavaScript modular
   - SEO básico
   - Compatibilidade

Exemplo de sugestões boas:
- Adicionar Loading States
- Melhorar Contraste Cores
- Otimizar Lazy Loading
- Implementar Service Worker
- Adicionar Error Boundaries

NÃO use pontuação ou caracteres especiais nas sugestões.`
    },
    {
      role: 'user',
      content: `Analise estes arquivos e forneça um resumo e sugestões em português:\n\n${JSON.stringify(files, null, 2)}`,
    },
  ]

  const analysis = await callOpenAI(messages)
  
  try {
    // Procura pela seção RESUMO
    const resumoMatch = analysis.match(/RESUMO:(.+?)(?=SUGESTÕES:|$)/s)
    const explanation = resumoMatch 
      ? resumoMatch[1].trim()
      : 'Site gerado com estrutura básica, incluindo página inicial responsiva e elementos interativos.'

    // Procura pela seção SUGESTÕES e extrai apenas as sugestões limpas
    const sugestoesMatch = analysis.match(/SUGESTÕES:(.+)$/s)
    let suggestions: string[] = []
    
    if (sugestoesMatch) {
      suggestions = sugestoesMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().substring(1).trim())
        .filter(suggestion => suggestion.length > 0 && suggestion.length <= 30)
    }

    // Se não encontrou sugestões, usa sugestões contextuais baseadas nos arquivos
    if (suggestions.length === 0) {
      const hasImages = files.some(f => f.content.includes('<img'));
      const hasForm = files.some(f => f.content.includes('<form'));
      const hasMetaTags = files.some(f => f.content.includes('<meta name="description"'));
      const hasDarkMode = files.some(f => f.content.includes('prefers-color-scheme'));
      const hasServiceWorker = files.some(f => f.content.includes('serviceWorker'));
      const hasLazyLoading = files.some(f => f.content.includes('loading="lazy"'));
      const hasAriaLabels = files.some(f => f.content.includes('aria-label'));
      const hasIntersectionObserver = files.some(f => f.content.includes('IntersectionObserver'));
      
      const possibleSuggestions = [
        !hasMetaTags ? 'Adicionar Meta Tags' : null,
        !hasImages ? 'Adicionar Imagens Otimizadas' : null,
        !hasForm ? 'Implementar Formulário Validado' : null,
        !hasDarkMode ? 'Implementar Dark Mode' : null,
        !hasServiceWorker ? 'Adicionar Service Worker' : null,
        !hasLazyLoading ? 'Implementar Lazy Loading' : null,
        !hasAriaLabels ? 'Melhorar Acessibilidade ARIA' : null,
        !hasIntersectionObserver ? 'Usar Intersection Observer' : null,
        'Otimizar Critical Path',
        'Adicionar Loading States',
        'Melhorar Contraste Cores',
        'Implementar Error Boundaries'
      ].filter(Boolean) as string[];

      suggestions = possibleSuggestions.slice(0, 5);
    }

    return { explanation, suggestions }
  } catch (error) {
    console.error('Erro ao analisar o feedback:', error)
    return {
      explanation: 'Site gerado com estrutura básica, incluindo página inicial responsiva e elementos interativos.',
      suggestions: ['Melhorar SEO', 'Adicionar Blog', 'Otimizar Imagens', 'Adicionar Analytics']
    }
  }
}

export async function processUserInput(userInput: string): Promise<AIResponse> {
  const pagePlanJson = await structurePrompt(userInput);
  const files = await generateCode(pagePlanJson);
  const analysis = await generateAnalysis(files);

  // O plano JSON original é retornado para que o frontend o conheça
  return {
    pagePlanJson: pagePlanJson,
    files: files,
    ...analysis
  };
}

function extractPlaceholders(code: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(code)) !== null) {
        // Remove a sintaxe de loop/condicional para extrair apenas a prop
        const prop = match[1].replace(/#each\s|#if\s|\/each|\/if/g, '').trim();
        if (prop && !prop.includes('>')) { // Ignora inclusões de parciais como {{> Component }}
          matches.add(prop);
        }
    }
    return Array.from(matches);
}
