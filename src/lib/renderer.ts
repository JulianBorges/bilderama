import Handlebars from 'handlebars';
import { PagePlan } from './schemas';
import { GeneratedFile } from './ai';
import { loadTemplates } from '@/templates';

interface PartialDefinition {
    name: string;
    layout: string;
}

const themeVariablesMap: Record<string, Record<string, string>> = {
  moderno_azul: {
    '--background': '240 10% 3.9%',
    '--foreground': '0 0% 98%',
    '--card': '240 10% 3.9%',
    '--card-foreground': '0 0% 98%',
    '--popover': '240 10% 3.9%',
    '--popover-foreground': '0 0% 98%',
    '--primary': '217.2 91.2% 59.8%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '240 4.8% 95.9%',
    '--secondary-foreground': '240 5.9% 10%',
    '--muted': '240 4.8% 95.9%',
    '--muted-foreground': '240 3.8% 46.1%',
    '--accent': '240 4.8% 95.9%',
    '--accent-foreground': '240 5.9% 10%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '240 5.9% 90%',
    '--input': '240 5.9% 90%',
    '--ring': '217.2 91.2% 59.8%',
    '--radius': '0.5rem',
  },
  calor_tropical: {
    '--background': '20 14.3% 4.1%',
    '--foreground': '0 0% 95%',
    '--card': '24 9.8% 10%',
    '--card-foreground': '0 0% 95%',
    '--popover': '20 14.3% 4.1%',
    '--popover-foreground': '0 0% 95%',
    '--primary': '47.9 95.8% 53.1%',
    '--primary-foreground': '26 83.3% 14.1%',
    '--secondary': '12 6.5% 15.1%',
    '--secondary-foreground': '0 0% 98%',
    '--muted': '12 6.5% 15.1%',
    '--muted-foreground': '0 0% 63.9%',
    '--accent': '12 6.5% 15.1%',
    '--accent-foreground': '0 0% 98%',
    '--destructive': '0 72.2% 50.6%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '12 6.5% 15.1%',
    '--input': '12 6.5% 15.1%',
    '--ring': '47.9 95.8% 53.1%',
    '--radius': '0.8rem',
  },
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
    
    // Gera a tag de estilo com as variáveis CSS do tema
    const themeName = pagePlan.theme.themeName || 'moderno_azul';
    const variables = themeVariablesMap[themeName];
    const cssVariables = Object.entries(variables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n');
    const themeStyleTag = `<style>:root {\\n${cssVariables}\\n}</style>`;

    // Processa e injeta os widgets, se existirem.
    let widgetsHtml = '';
    if (pagePlan.widgets && pagePlan.widgets.length > 0) {
      widgetsHtml = pagePlan.widgets.map(widget => {
        const templatePath = `${widget.name}/default.hbs`;
        const templateString = templates[templatePath];

        if (!templateString) {
          console.warn(`Template não encontrado para o widget: ${widget.name} em ${templatePath}`);
          return `<!-- Template para widget ${widget.name} não encontrado -->`;
        }

        const widgetTemplate = Handlebars.compile(templateString, { noEscape: true });
        return widgetTemplate(widget.properties);
      }).join('\\n');
    }

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
    ${themeStyleTag}
</head>
<body>
${bodyContent}
${widgetsHtml}
</body>
</html>`;

    return [{
    path: 'index.html',
        content: fullHtml,
        type: 'page',
        description: 'Página principal construída via renderizador determinístico.'
    }];
} 