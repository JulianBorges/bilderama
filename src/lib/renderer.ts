import Handlebars from 'handlebars';
import { PagePlan } from './schemas';
import { GeneratedFile } from './ai';
import { loadTemplates } from '@/templates';
import fs from 'node:fs/promises';
import path from 'node:path';

const themeVariablesMap = {
  moderno_azul: {
    light: {
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
    dark: {
      '--background': '222.2 84% 4.9%',
      '--foreground': '210 40% 98%',
      '--card': '222.2 84% 4.9%',
      '--card-foreground': '210 40% 98%',
      '--popover': '222.2 84% 4.9%',
      '--popover-foreground': '210 40% 98%',
      '--primary': '217.2 91.2% 59.8%',
      '--primary-foreground': '222.2 84% 4.9%',
      '--secondary': '217.2 32.6% 17.5%',
      '--secondary-foreground': '210 40% 98%',
      '--muted': '217.2 32.6% 17.5%',
      '--muted-foreground': '215 20.2% 65.1%',
      '--accent': '217.2 32.6% 17.5%',
      '--accent-foreground': '210 40% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '217.2 32.6% 17.5%',
      '--input': '217.2 32.6% 17.5%',
      '--ring': '224.3 76.3% 94.1%',
      '--radius': '0.5rem',
    }
  },
  calor_tropical: {
    light: {
      '--background': '43 74% 66%',
      '--foreground': '24 9.8% 10%',
      '--card': '47 84% 91%',
      '--card-foreground': '24 9.8% 10%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '24 9.8% 10%',
      '--primary': '20.5 90.2% 48.2%',
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
      '--ring': '20.5 90.2% 48.2%',
      '--radius': '0.5rem',
    },
    dark: {
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
    }
  },
  saas_premium: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--primary': '263 85% 70%',
      '--primary-foreground': '210 20% 98%',
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
      '--ring': '263 85% 70%',
      '--radius': '0.5rem',
    },
    dark: {
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
    }
  },
  corporativo_elegante: {
    light: {
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
    dark: {
      '--background': '0 0% 3.9%',
      '--foreground': '0 0% 98%',
      '--card': '0 0% 3.9%',
      '--card-foreground': '0 0% 98%',
      '--popover': '0 0% 3.9%',
      '--popover-foreground': '0 0% 98%',
      '--primary': '142.1 70.6% 45.3%',
      '--primary-foreground': '144.9 80.4% 10%',
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
      '--ring': '142.1 70.6% 45.3%',
      '--radius': '0.5rem',
    }
  },
  ecommerce_luxo: {
    light: {
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
    },
    dark: {
      '--background': '24 9.8% 10%',
      '--foreground': '60 9.1% 97.8%',
      '--card': '24 9.8% 10%',
      '--card-foreground': '60 9.1% 97.8%',
      '--popover': '24 9.8% 10%',
      '--popover-foreground': '60 9.1% 97.8%',
      '--primary': '47.9 95.8% 53.1%',
      '--primary-foreground': '26 83.3% 14.1%',
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
      '--ring': '35.5 91.7% 32.9%',
      '--radius': '0.5rem',
    }
  },
  // Novos temas para diversidade comercial
  startup_tech: {
    light: {
      '--background': '210 40% 98%',
      '--foreground': '215 25% 16%',
      '--card': '0 0% 100%',
      '--card-foreground': '215 25% 16%',
      '--primary': '265 89% 62%',
      '--primary-foreground': '210 20% 98%',
      '--secondary': '210 40% 96%',
      '--secondary-foreground': '215 25% 16%',
      '--accent': '265 89% 62%',
      '--accent-foreground': '210 20% 98%',
      '--border': '214 31% 91%',
      '--ring': '265 89% 62%',
      '--radius': '0.75rem',
    },
    dark: {
      '--background': '215 28% 8%',
      '--foreground': '210 40% 98%',
      '--card': '215 25% 12%',
      '--card-foreground': '210 40% 98%',
      '--primary': '265 89% 62%',
      '--primary-foreground': '215 28% 8%',
      '--secondary': '215 25% 16%',
      '--secondary-foreground': '210 40% 98%',
      '--accent': '265 89% 62%',
      '--accent-foreground': '215 28% 8%',
      '--border': '215 25% 16%',
      '--ring': '265 89% 62%',
      '--radius': '0.75rem',
    }
  },
  wellness_natural: {
    light: {
      '--background': '120 25% 97%',
      '--foreground': '120 15% 15%',
      '--card': '0 0% 100%',
      '--card-foreground': '120 15% 15%',
      '--primary': '135 60% 45%',
      '--primary-foreground': '120 25% 97%',
      '--secondary': '120 25% 90%',
      '--secondary-foreground': '120 15% 15%',
      '--accent': '80 60% 60%',
      '--accent-foreground': '120 15% 15%',
      '--border': '120 20% 85%',
      '--ring': '135 60% 45%',
      '--radius': '1rem',
    },
    dark: {
      '--background': '120 15% 8%',
      '--foreground': '120 25% 92%',
      '--card': '120 15% 12%',
      '--card-foreground': '120 25% 92%',
      '--primary': '135 60% 55%',
      '--primary-foreground': '120 15% 8%',
      '--secondary': '120 15% 16%',
      '--secondary-foreground': '120 25% 92%',
      '--accent': '80 60% 70%',
      '--accent-foreground': '120 15% 8%',
      '--border': '120 15% 16%',
      '--ring': '135 60% 55%',
      '--radius': '1rem',
    }
  },
  creative_agency: {
    light: {
      '--background': '0 0% 100%',
      '--foreground': '240 15% 12%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 15% 12%',
      '--primary': '348 100% 60%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '240 5% 96%',
      '--secondary-foreground': '240 15% 12%',
      '--accent': '45 100% 55%',
      '--accent-foreground': '240 15% 12%',
      '--border': '240 10% 90%',
      '--ring': '348 100% 60%',
      '--radius': '0.25rem',
    },
    dark: {
      '--background': '240 15% 6%',
      '--foreground': '0 0% 98%',
      '--card': '240 15% 10%',
      '--card-foreground': '0 0% 98%',
      '--primary': '348 100% 60%',
      '--primary-foreground': '240 15% 6%',
      '--secondary': '240 10% 14%',
      '--secondary-foreground': '0 0% 98%',
      '--accent': '45 100% 65%',
      '--accent-foreground': '240 15% 6%',
      '--border': '240 10% 14%',
      '--ring': '348 100% 60%',
      '--radius': '0.25rem',
    }
  },
  finance_trust: {
    light: {
      '--background': '210 20% 98%',
      '--foreground': '210 30% 8%',
      '--card': '0 0% 100%',
      '--card-foreground': '210 30% 8%',
      '--primary': '210 100% 35%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '210 20% 94%',
      '--secondary-foreground': '210 30% 8%',
      '--accent': '200 100% 40%',
      '--accent-foreground': '0 0% 100%',
      '--border': '210 20% 88%',
      '--ring': '210 100% 35%',
      '--radius': '0.375rem',
    },
    dark: {
      '--background': '210 30% 4%',
      '--foreground': '210 20% 98%',
      '--card': '210 30% 8%',
      '--card-foreground': '210 20% 98%',
      '--primary': '210 100% 45%',
      '--primary-foreground': '210 30% 4%',
      '--secondary': '210 25% 12%',
      '--secondary-foreground': '210 20% 98%',
      '--accent': '200 100% 50%',
      '--accent-foreground': '210 30% 4%',
      '--border': '210 25% 12%',
      '--ring': '210 100% 45%',
      '--radius': '0.375rem',
    }
  },
  restaurant_warm: {
    light: {
      '--background': '30 50% 96%',
      '--foreground': '25 25% 15%',
      '--card': '0 0% 100%',
      '--card-foreground': '25 25% 15%',
      '--primary': '15 75% 50%',
      '--primary-foreground': '0 0% 100%',
      '--secondary': '30 30% 88%',
      '--secondary-foreground': '25 25% 15%',
      '--accent': '35 85% 55%',
      '--accent-foreground': '25 25% 15%',
      '--border': '30 25% 82%',
      '--ring': '15 75% 50%',
      '--radius': '0.5rem',
    },
    dark: {
      '--background': '25 25% 8%',
      '--foreground': '30 50% 92%',
      '--card': '25 25% 12%',
      '--card-foreground': '30 50% 92%',
      '--primary': '15 75% 60%',
      '--primary-foreground': '25 25% 8%',
      '--secondary': '25 20% 16%',
      '--secondary-foreground': '30 50% 92%',
      '--accent': '35 85% 65%',
      '--accent-foreground': '25 25% 8%',
      '--border': '25 20% 16%',
      '--ring': '15 75% 60%',
      '--radius': '0.5rem',
    }
  }
};

interface PartialDefinition {
    name: string;
    layout: string;
}

let arePartialsRegistered = false;

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
        const templateString = templates[templatePath];

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
    
    const themeStyleTag = `<style>
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