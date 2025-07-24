import Handlebars from 'handlebars';
import { PagePlan } from './schemas';
import { GeneratedFile } from './ai';
import { loadTemplates } from '@/templates';
import fs from 'node:fs/promises';
import path from 'node:path';

const themeVariablesMap = {
  moderno_azul: {
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',
    '--card': '0 0% 100%',
    '--card-foreground': '222.2 84% 4.9%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222.2 84% 4.9%',
    '--primary': '221.2 83.2% 53.3%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '210 40% 96.1%',
    '--secondary-foreground': '222.2 47.4% 11.2%',
    '--muted': '210 40% 96.1%',
    '--muted-foreground': '215.4 16.3% 46.9%',
    '--accent': '210 40% 96.1%',
    '--accent-foreground': '222.2 47.4% 11.2%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--ring': '221.2 83.2% 53.3%',
    '--radius': '0.5rem',
  },
  calor_tropical: {
    '--background': '20 14.3% 4.1%',
    '--foreground': '60 9.1% 97.8%',
    '--card': '20 14.3% 4.1%',
    '--card-foreground': '60 9.1% 97.8%',
    '--popover': '20 14.3% 4.1%',
    '--popover-foreground': '60 9.1% 97.8%',
    '--primary': '20.5 90.2% 48.2%',
    '--primary-foreground': '60 9.1% 97.8%',
    '--secondary': '12 6.5% 15.1%',
    '--secondary-foreground': '60 9.1% 97.8%',
    '--muted': '12 6.5% 15.1%',
    '--muted-foreground': '24 5.4% 63.9%',
    '--accent': '12 6.5% 15.1%',
    '--accent-foreground': '60 9.1% 97.8%',
    '--destructive': '0 72.2% 50.6%',
    '--destructive-foreground': '60 9.1% 97.8%',
    '--border': '12 6.5% 15.1%',
    '--input': '12 6.5% 15.1%',
    '--ring': '20.5 90.2% 48.2%',
    '--radius': '0.5rem',
  },
  saas_premium: {
    '--background': '240 10% 3.9%',
    '--foreground': '0 0% 98%',
    '--card': '240 10% 3.9%',
    '--card-foreground': '0 0% 98%',
    '--popover': '240 10% 3.9%',
    '--popover-foreground': '0 0% 98%',
    '--primary': '263 70% 50.4%',
    '--primary-foreground': '210 20% 98%',
    '--secondary': '240 3.7% 15.9%',
    '--secondary-foreground': '0 0% 98%',
    '--muted': '240 3.7% 15.9%',
    '--muted-foreground': '240 5% 64.9%',
    '--accent': '240 3.7% 15.9%',
    '--accent-foreground': '0 0% 98%',
    '--destructive': '0 62.8% 30.6%',
    '--destructive-foreground': '0 0% 98%',
    '--border': '240 3.7% 15.9%',
    '--input': '240 3.7% 15.9%',
    '--ring': '263 70% 50.4%',
    '--radius': '0.5rem',
  },
  corporativo_elegante: {
    '--background': '0 0% 100%',
    '--foreground': '0 0% 3.9%',
    '--card': '0 0% 100%',
    '--card-foreground': '0 0% 3.9%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '0 0% 3.9%',
    '--primary': '142.1 76.2% 36.3%',
    '--primary-foreground': '355.7 100% 97.3%',
    '--secondary': '210 40% 96.1%',
    '--secondary-foreground': '222.2 47.4% 11.2%',
    '--muted': '210 40% 96.1%',
    '--muted-foreground': '215.4 16.3% 46.9%',
    '--accent': '210 40% 96.1%',
    '--accent-foreground': '222.2 47.4% 11.2%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--ring': '142.1 76.2% 36.3%',
    '--radius': '0.5rem',
  },
  ecommerce_luxo: {
    '--background': '60 9.1% 97.8%',
    '--foreground': '24 9.8% 10%',
    '--card': '0 0% 100%',
    '--card-foreground': '24 9.8% 10%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '24 9.8% 10%',
    '--primary': '24 100% 50%',
    '--primary-foreground': '60 9.1% 97.8%',
    '--secondary': '60 4.8% 95.9%',
    '--secondary-foreground': '24 9.8% 10%',
    '--muted': '60 4.8% 95.9%',
    '--muted-foreground': '25 5.3% 44.7%',
    '--accent': '60 4.8% 95.9%',
    '--accent-foreground': '24 9.8% 10%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '60 9.1% 97.8%',
    '--border': '20 5.9% 90%',
    '--input': '20 5.9% 90%',
    '--ring': '24 100% 50%',
    '--radius': '0.5rem',
  }
};

interface PartialDefinition {
    name: string;
    layout: string;
}

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

async function getBuiltCss(): Promise<string> {
    try {
        const cssDir = path.join(process.cwd(), '.next', 'static', 'css');
        const files = await fs.readdir(cssDir);
        const cssFile = files.find(file => file.endsWith('.css'));
        if (!cssFile) {
            console.warn('Nenhum arquivo CSS de build encontrado.');
            return '';
        }
        const cssPath = path.join(cssDir, cssFile);
        const cssContent = await fs.readFile(cssPath, 'utf-8');
        return cssContent;
    } catch (error) {
        console.error('Falha ao ler o CSS de build:', error);
        // Retorna string vazia para não quebrar a renderização da página
        return '';
    }
}

/**
 * Renderiza uma página completa a partir de um PagePlan usando templates Handlebars.
 * @param pagePlan O plano da página validado.
 * @param cssContent O conteúdo CSS compilado do build.
 * @returns Uma Promise que resolve para um array de arquivos gerados.
 */
export async function renderPage(pagePlan: PagePlan, cssContent: string): Promise<GeneratedFile[]> {
    const { templates, partials } = await loadTemplates();
    
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
    }).join('');
    
    // Gera as variáveis CSS do tema
    const themeVariables = themeVariablesMap[pagePlan.theme.themeName];
    if (!themeVariables) {
        console.warn(`Tema "${pagePlan.theme.themeName}" não encontrado. Usando tema padrão.`);
    }
    
    const currentThemeVars = themeVariables || themeVariablesMap.moderno_azul;
    const themeCss = Object.entries(currentThemeVars)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n    ');
    
    // Verifica se é um tema escuro
    const isDarkTheme = ['calor_tropical', 'saas_premium'].includes(pagePlan.theme.themeName);
    const themeStyleTag = isDarkTheme
        ? `<style>\n  .dark {\n    ${themeCss}\n  }\n</style>`
        : `<style>\n  :root {\n    ${themeCss}\n  }\n</style>`;

    // Gera a tag de estilo com o CSS compilado
    let compiledCssTag = '';
    if (cssContent && cssContent.trim().length > 0) {
      compiledCssTag = `<style>${cssContent}</style>`;
    } else {
      compiledCssTag = `<style>body:before{display:block;white-space:pre;content:'[AVISO] CSS de build não encontrado. Rode "next build" para gerar o CSS.';color:red;background:#fff;padding:2rem;}</style>`;
    }

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
      }).join('');
    }

    // Add font families CSS
    const fontFamily = pagePlan.theme.font || 'inter';
    const fontCssMap = {
      'inter': '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"); body { font-family: "Inter", sans-serif; }',
      'roboto': '@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap"); body { font-family: "Roboto", sans-serif; }',
      'lato': '@import url("https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap"); body { font-family: "Lato", sans-serif; }'
    };

    const fontCss = fontCssMap[fontFamily] || fontCssMap.inter;

    const fullHtml = `
<!DOCTYPE html>
<html lang="pt-BR" class="${isDarkTheme ? 'dark' : ''}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pagePlan.pageTitle}</title>
    <meta name="description" content="${pagePlan.pageDescription}">
    <style>${fontCss}</style>
    ${themeStyleTag}
    ${compiledCssTag}
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