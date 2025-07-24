// src/templates/index.ts

// Esta abordagem trata os templates como módulos, o que é mais amigável ao Webpack
// e evita a necessidade de acessar o sistema de arquivos em tempo de execução.

// Este script usa a função `require.context` do Webpack para importar dinamicamente
// todos os arquivos .hbs da estrutura de pastas de templates. Isso nos permite adicionar
// novos componentes e layouts sem precisar atualizar manualmente os registros de importação.

// 1. Definição da interface para os templates importados
interface TemplateModule {
  default: string;
}

// Adiciona a propriedade 'context' ao tipo 'NodeRequire' para o TypeScript
interface NodeRequire {
    context: (path: string, deep: boolean, filter: RegExp) => {
        keys: () => string[];
        (id: string): any;
    };
}

// 2. Usando require.context para buscar todos os templates
const req = (require as unknown as NodeRequire).context('./', true, /\.hbs$/);

// 3. Construção do registro de templates
// O `reduce` itera sobre todos os caminhos de arquivo encontrados pelo `require.context`
// e constrói um objeto onde a chave é o nome do componente e do layout
// (ex: "Hero Moderno/default.hbs") e o valor é o conteúdo do template.
export const templates = req.keys().reduce((acc: Record<string, string>, key: string) => {
  // Extrai o caminho relevante, removendo o './' inicial.
  // Ex: de './Hero Moderno/default.hbs' para 'Hero Moderno/default.hbs'
  const componentPath = key.substring(2);
  
  // A chave no nosso acumulador será o caminho do componente.
  // O valor é o conteúdo do módulo do template.
  acc[componentPath] = (req(key) as TemplateModule).default;
  return acc;
}, {} as Record<string, string>);


// 4. Definição explícita dos parciais
// Parciais são componentes que podem ser reutilizados dentro de outros componentes,
// como um 'Card' dentro de um 'Grid'. Precisamos listá-los explicitamente aqui
// para que o Handlebars possa registrá-los corretamente.
interface PartialDefinition {
    name: string;
    layout: string;
}

export const partials: PartialDefinition[] = [
    { name: 'CardFeature', layout: 'default' },
    { name: 'TestimonialCard', layout: 'default' },
    { name: 'PricingCard', layout: 'default' },
    { name: 'CardMenuItem', layout: 'default' },
    { name: 'StatCard', layout: 'default' },
    { name: 'TeamMemberCard', layout: 'default' },
    { name: 'BlogCard', layout: 'default' },
    // Adicione outros parciais aqui conforme necessário
];

// Um tipo para garantir que estamos pedindo um template que existe
export type TemplateName = keyof typeof templates;

import fs from 'fs/promises';
import path from 'path';

interface TemplateCatalog {
    templates: Record<string, string>;
    partials: PartialDefinition[];
}

// Cache em memória para evitar leituras repetidas do disco.
let cache: TemplateCatalog | null = null;

/**
 * Carrega todos os templates .hbs de forma assíncrona a partir do sistema de arquivos.
 * Usa um cache em memória para garantir que a leitura do disco ocorra apenas uma vez.
 * @returns Um objeto contendo o mapa de templates e a lista de parciais.
 */
export async function loadTemplates(): Promise<TemplateCatalog> {
    if (cache) {
        return cache;
    }

    const templatesDir = path.join(process.cwd(), 'src', 'templates');
    const templates: Record<string, string> = {};

    const componentDirs = await fs.readdir(templatesDir, { withFileTypes: true });

    for (const componentDir of componentDirs) {
        if (componentDir.isDirectory()) {
            const componentDirPath = path.join(templatesDir, componentDir.name);
            const files = await fs.readdir(componentDirPath);
            for (const file of files) {
                if (path.extname(file) === '.hbs') {
                    const templatePath = path.join(componentDirPath, file);
                    const content = await fs.readFile(templatePath, 'utf-8');
                    const templateKey = `${componentDir.name}/${file}`;
                    templates[templateKey] = content;
                }
            }
        }
    }

    const partials: PartialDefinition[] = [
        { name: 'CardFeature', layout: 'default' },
        { name: 'TestimonialCard', layout: 'default' },
        { name: 'PricingCard', layout: 'default' },
        { name: 'CardMenuItem', layout: 'default' },
        { name: 'StatCard', layout: 'default' },
        { name: 'TeamMemberCard', layout: 'default' },
        { name: 'BlogCard', layout: 'default' },
    ];

    cache = { templates, partials };
    return cache;
} 