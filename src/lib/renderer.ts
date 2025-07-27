import Handlebars from 'handlebars';
import { PagePlan } from './schemas';
import { GeneratedFile } from './ai';
import { loadTemplates } from '@/templates';
import fs from 'node:fs/promises';
import path from 'node:path';
import { themeVariablesMap } from './design-tokens';

interface PartialDefinition {
    name: string;
    layout: string;
}

let arePartialsRegistered = false;

// Tenta carregar CSS pré-gerado de design tokens para evitar gerar em tempo de execução
let prebuiltTokensCss: string | null = null;
try {
  const tokensPath = path.join(process.cwd(), 'src', 'lib', 'generated-theme.css');
  prebuiltTokensCss = require('node:fs').readFileSync(tokensPath, 'utf8');
} catch (_) {
  prebuiltTokensCss = null;
}

// Helper para gerar classes CSS baseadas em design tokens
function generateDesignTokenClasses(designTokens: any): string {
  if (!designTokens) return '';
  
  const classes: string[] = [];
  
  // Card styles
  if (designTokens.cardStyle) {
    const cardStyles: Record<string, string> = {
      elevated: 'shadow-lg hover:shadow-xl',
      outline: 'border-2 shadow-none hover:shadow-md',
      glass: 'backdrop-blur-sm bg-white/80 border border-white/20',
      minimal: 'shadow-none border-0',
      bold: 'shadow-2xl border-2 border-primary/20'
    };
    classes.push(cardStyles[designTokens.cardStyle] || '');
  }
  
  // Spacing variants
  if (designTokens.spacing) {
    const spacingStyles: Record<string, string> = {
      compact: 'py-8 space-y-4',
      comfortable: 'py-16 space-y-8',
      spacious: 'py-24 space-y-12',
      'extra-spacious': 'py-32 space-y-16'
    };
    classes.push(spacingStyles[designTokens.spacing] || '');
  }
  
  // Border radius variants
  if (designTokens.borderRadius) {
    const radiusStyles: Record<string, string> = {
      none: 'rounded-none',
      small: 'rounded-sm',
      medium: 'rounded-md',
      large: 'rounded-lg',
      full: 'rounded-full'
    };
    classes.push(radiusStyles[designTokens.borderRadius] || '');
  }
  
  // Shadow intensity
  if (designTokens.shadowIntensity) {
    const shadowStyles: Record<string, string> = {
      none: 'shadow-none',
      soft: 'shadow-sm',
      medium: 'shadow-md',
      strong: 'shadow-lg',
      dramatic: 'shadow-2xl'
    };
    classes.push(shadowStyles[designTokens.shadowIntensity] || '');
  }
  
  // Animation styles
  if (designTokens.animation) {
    const animationStyles: Record<string, string> = {
      none: '',
      subtle: 'transition-all duration-300 ease-out',
      smooth: 'transition-all duration-500 ease-in-out',
      bouncy: 'transition-all duration-300 ease-bounce',
      dramatic: 'transition-all duration-700 ease-spring'
    };
    classes.push(animationStyles[designTokens.animation] || '');
  }
  
  return classes.filter(Boolean).join(' ');
}

// Helper para registrar helper de design tokens no Handlebars
function registerDesignTokenHelper() {
  Handlebars.registerHelper('designTokens', function(designTokens: any) {
    return new Handlebars.SafeString(generateDesignTokenClasses(designTokens));
  });
  
  // Helper para densidade de espaçamento baseado no tema
  Handlebars.registerHelper('themeDensity', function(theme: any) {
    const densityClasses: Record<string, string> = {
      compact: 'py-8 space-y-6',
      comfortable: 'py-16 space-y-8',
      spacious: 'py-24 space-y-12'
    };
    return new Handlebars.SafeString(densityClasses[theme.density] || densityClasses.comfortable);
  });
  
  // Helper para personalidade do tema
  Handlebars.registerHelper('themePersonality', function(theme: any) {
    const personalityClasses: Record<string, string> = {
      minimal: 'font-light tracking-wide',
      bold: 'font-bold tracking-tight',
      elegant: 'font-medium tracking-normal',
      playful: 'font-medium tracking-wide',
      corporate: 'font-normal tracking-normal',
      creative: 'font-medium tracking-wide',
      warm: 'font-normal tracking-normal',
      tech: 'font-mono tracking-tight'
    };
    return new Handlebars.SafeString(personalityClasses[theme.personality] || '');
  });
}

function registerPartials(partials: PartialDefinition[], templates: Record<string, string>) {
    if (arePartialsRegistered) {
        return;
    }

    // Register partials
    partials.forEach(partial => {
        const templateKey = `${partial.name}/${partial.layout}.hbs`;
        const template = templates[templateKey];
        if (template) {
            Handlebars.registerPartial(partial.name, template);
        } else {
            console.warn(`Parcial "${partial.name}" com layout "${partial.layout}" não encontrado (chave: ${templateKey}).`);
        }
    });

    // Register container helper to centralize container logic
    Handlebars.registerHelper('sectionContainer', function(content: string) {
        return new Handlebars.SafeString(`<div class="container mx-auto px-4">${content}</div>`);
    });

    // Register section wrapper helper
    Handlebars.registerHelper('sectionWrapper', function(bgClass: string, pyClass: string, content: string) {
        const backgroundClass = bgClass || 'bg-background';
        const paddingClass = pyClass || 'py-16';
        return new Handlebars.SafeString(`<section class="${backgroundClass} ${paddingClass}">${content}</section>`);
    });

    // Register design token helpers
    registerDesignTokenHelper();

    // Register helper for alternating layouts
    Handlebars.registerHelper('isOdd', function(index: number) {
        return index % 2 === 1;
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
        let templateString = templates[templatePath];
        if (!templateString && block.layout && block.layout !== 'default') {
            // tenta layout default
            templateString = templates[`${block.name}/default.hbs`];
        }

        if (!templateString) {
            console.warn(`Template não encontrado para o bloco: ${block.name} com layout: ${block.layout || 'default'}`);
            return `<!-- Template para ${block.name} (${block.layout || 'default'}) não encontrado em ${templatePath} -->`;
        }
        
        const blockTemplate = Handlebars.compile(templateString, { noEscape: true });
        
        const context = { 
          ...block.properties, 
          blockIndex: index,
          designTokens: block.designTokens,
          theme: pagePlan.theme
        };
        
        return blockTemplate(context);
    }).join('');
    
    // Gera as variáveis CSS do tema
    const themeConfig = themeVariablesMap[pagePlan.theme.themeName as keyof typeof themeVariablesMap];
    if (!themeConfig) {
        console.warn(`Tema "${pagePlan.theme.themeName}" não encontrado. Usando tema padrão.`);
    }
    
    const currentThemeConfig = themeConfig || themeVariablesMap.moderno_azul;
    
    // Gera CSS para ambos os modos
    const lightThemeCss = Object.entries(currentThemeConfig.light)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n    ');
    
    const darkThemeCss = Object.entries(currentThemeConfig.dark)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n    ');
    
    // Determina o modo padrão baseado na personalidade do tema
    const defaultToDark = pagePlan.theme.personality === 'tech' || pagePlan.theme.personality === 'creative';
    const isDarkTheme = defaultToDark;
    
    let themeStyleTag = '';
    if (prebuiltTokensCss) {
      themeStyleTag = `<style>${prebuiltTokensCss}</style>`;
    } else {
      themeStyleTag = `<style>
  :root {
    ${lightThemeCss}
  }
  
  .dark {
    ${darkThemeCss}
  }
  
  /* Design Token Classes */
  .ease-bounce { transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); }
  .ease-spring { transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
</style>`;
    }

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
        const context = {
          ...widget.properties,
          designTokens: widget.designTokens,
          theme: pagePlan.theme
        };
        return widgetTemplate(context);
      }).join('');
    }

    // Add font families CSS com mais opções
    const fontFamily = pagePlan.theme.font || 'inter';
    const fontCssMap: Record<string, string> = {
      'inter': '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"); body { font-family: "Inter", sans-serif; }',
      'roboto': '@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap"); body { font-family: "Roboto", sans-serif; }',
      'lato': '@import url("https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap"); body { font-family: "Lato", sans-serif; }',
      'poppins': '@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"); body { font-family: "Poppins", sans-serif; }',
      'montserrat': '@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap"); body { font-family: "Montserrat", sans-serif; }',
      'playfair': '@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap"); body { font-family: "Playfair Display", serif; }',
      'crimson': '@import url("https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap"); body { font-family: "Crimson Text", serif; }'
    };

    const fontCss = fontCssMap[fontFamily] || fontCssMap.inter;

    const fullHtml = `
<!DOCTYPE html>
<html lang="pt-BR" class="${isDarkTheme ? 'dark' : ''}" data-theme="${pagePlan.theme.themeName}">
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