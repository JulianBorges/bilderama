import Handlebars from 'handlebars';
import { PagePlan } from './schemas';
import { GeneratedFile } from './ai';
import { loadTemplates } from '@/templates';

interface PartialDefinition {
    name: string;
    layout: string;
}

// Mapeamento de paletas de cores para classes do Tailwind.
const colorPaletteMap: Record<string, Record<string, string>> = {
    blue: {
        'bg-indigo-600': 'bg-blue-600', 'text-indigo-600': 'text-blue-600',
        'border-indigo-500': 'border-blue-500', 'bg-indigo-500': 'bg-blue-500',
        'bg-indigo-50': 'bg-blue-50',
    },
    green: {
        'bg-indigo-600': 'bg-green-600', 'text-indigo-600': 'text-green-600',
        'border-indigo-500': 'border-green-500', 'bg-indigo-500': 'bg-green-500',
        'bg-indigo-50': 'bg-green-50',
    },
    purple: {
        'bg-indigo-600': 'bg-purple-600', 'text-indigo-600': 'text-purple-600',
        'border-indigo-500': 'border-purple-500', 'bg-indigo-500': 'bg-purple-500',
        'bg-indigo-50': 'bg-purple-50',
    },
    orange: {
        'bg-indigo-600': 'bg-orange-600', 'text-indigo-600': 'text-orange-600',
        'border-indigo-500': 'border-orange-500', 'bg-indigo-500': 'bg-orange-500',
        'bg-indigo-50': 'bg-orange-50',
    },
    grayscale: {
        'bg-indigo-600': 'bg-gray-600', 'text-indigo-600': 'text-gray-600',
        'border-indigo-500': 'border-gray-500', 'bg-indigo-500': 'bg-gray-500',
        'bg-indigo-50': 'bg-gray-50',
    }
};

let arePartialsRegistered = false;

function registerPartials(partials: PartialDefinition[], templates: Record<string, string>) {
    if (arePartialsRegistered) {
        return;
    }

    partials.forEach(partial => {
        const templateKey = `${partial.name}/${partial.layout}.hbs`;
        const template = templates[templateKey];
        if (template) {
            Handlebars.registerPartial(partial.name, template);
        } else {
            console.warn(`Parcial "${partial.name}" com layout "${partial.layout}" não encontrado (chave: ${templateKey}).`);
        }
    });

    arePartialsRegistered = true;
}

// Função auxiliar para aplicar o tema de cores ao HTML gerado.
function applyTheme(html: string, palette: string): string {
    const themeColors = colorPaletteMap[palette] || colorPaletteMap.blue;
    let themedHtml = html;
    for (const [original, replacement] of Object.entries(themeColors)) {
        themedHtml = themedHtml.replace(new RegExp(original, 'g'), replacement);
    }
    return themedHtml;
}

/**
 * Renderiza uma página completa a partir de um PagePlan usando templates Handlebars.
 * @param pagePlan O plano da página validado.
 * @returns Uma Promise que resolve para um array de arquivos gerados.
 */
export async function renderPage(pagePlan: PagePlan): Promise<GeneratedFile[]> {
    const { templates, partials } = await loadTemplates();
    
    // Garante que os parciais sejam registrados antes de qualquer renderização.
    registerPartials(partials, templates);

    const bodyContent = pagePlan.blocks.map((block, index) => {
        const templatePath = `${block.name}/${block.layout || 'default'}.hbs`;
        const templateString = templates[templatePath];

        if (!templateString) {
            console.warn(`Template não encontrado para o bloco: ${block.name} com layout: ${block.layout || 'default'}`);
            return `<!-- Template para ${block.name} (${block.layout || 'default'}) não encontrado em ${templatePath} -->`;
        }
        
        const blockTemplate = Handlebars.compile(templateString, { noEscape: true });
        
        const context = { ...block.properties, blockIndex: index };
        
        return blockTemplate(context);
    }).join('\n');
    
    const themedBodyContent = applyTheme(bodyContent, pagePlan.theme.colorPalette);

    // Monta o documento HTML final.
    const fullHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pagePlan.pageTitle}</title>
    <meta name="description" content="${pagePlan.pageDescription}">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${themedBodyContent}
</body>
</html>`;

    return [{
    path: 'index.html',
        content: fullHtml,
        type: 'page',
        description: 'Página principal construída via renderizador determinístico.'
    }];
} 