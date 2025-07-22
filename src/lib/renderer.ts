import Handlebars from 'handlebars';
import { PagePlan, Section, Block } from './schemas';
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
  tech_neon: {
    '--background': '230 15% 3%',
    '--foreground': '180 100% 85%',
    '--primary': '190 100% 50%',
    '--primary-foreground': '230 15% 3%',
    '--secondary': '270 100% 60%',
    '--accent': '300 100% 70%',
    '--neon-blue': '190 100% 50%',
    '--neon-purple': '270 100% 60%',
    '--neon-pink': '300 100% 70%',
    '--glow': '0 0 20px currentColor',
    '--radius': '0.25rem',
  },
  luxury_gold: {
    '--background': '45 20% 8%',
    '--foreground': '45 10% 95%',
    '--primary': '45 90% 60%',
    '--primary-foreground': '45 20% 8%',
    '--secondary': '45 20% 15%',
    '--accent': '45 100% 75%',
    '--gold': '45 90% 60%',
    '--gold-light': '45 100% 75%',
    '--gold-dark': '45 80% 45%',
    '--luxury-shadow': '0 10px 40px rgba(255, 215, 0, 0.3)',
    '--radius': '0.75rem',
  },
  nature_green: {
    '--background': '140 20% 5%',
    '--foreground': '140 10% 95%',
    '--primary': '140 70% 45%',
    '--primary-foreground': '140 20% 5%',
    '--secondary': '140 30% 15%',
    '--accent': '120 60% 60%',
    '--nature-green': '140 70% 45%',
    '--forest-dark': '140 80% 25%',
    '--leaf-light': '120 60% 60%',
    '--organic-shadow': '0 8px 32px rgba(34, 197, 94, 0.2)',
    '--radius': '1rem',
  },
  glassmorphism: {
    '--background': '210 40% 2%',
    '--foreground': '210 40% 98%',
    '--primary': '200 100% 50%',
    '--glass-bg': 'rgba(255, 255, 255, 0.1)',
    '--glass-border': 'rgba(255, 255, 255, 0.2)',
    '--backdrop-blur': 'blur(10px)',
    '--glass-shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
    '--radius': '1.5rem',
  },
  cyberpunk: {
    '--background': '0 0% 0%',
    '--foreground': '180 100% 90%',
    '--primary': '340 100% 50%',
    '--secondary': '60 100% 50%',
    '--accent': '180 100% 50%',
    '--cyber-pink': '340 100% 50%',
    '--cyber-yellow': '60 100% 50%',
    '--cyber-cyan': '180 100% 50%',
    '--glitch-shadow': '2px 2px 0 #ff00ff, -2px -2px 0 #00ffff',
    '--radius': '0rem',
  },
  sunset_gradient: {
    '--background': '25 95% 95%',
    '--foreground': '15 15% 15%',
    '--primary': '20 90% 60%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '35 85% 70%',
    '--secondary-foreground': '15 15% 15%',
    '--accent': '45 95% 65%',
    '--accent-foreground': '15 15% 15%',
    '--muted': '25 20% 90%',
    '--muted-foreground': '15 15% 40%',
    '--border': '25 30% 85%',
    '--input': '25 30% 85%',
    '--ring': '20 90% 60%',
    '--radius': '0.75rem',
  },
  dark_premium: {
    '--background': '220 15% 6%',
    '--foreground': '220 10% 95%',
    '--primary': '220 100% 60%',
    '--primary-foreground': '220 15% 6%',
    '--secondary': '220 20% 15%',
    '--secondary-foreground': '220 10% 95%',
    '--accent': '200 80% 60%',
    '--accent-foreground': '220 15% 6%',
    '--muted': '220 20% 12%',
    '--muted-foreground': '220 10% 60%',
    '--border': '220 20% 20%',
    '--input': '220 20% 20%',
    '--ring': '220 100% 60%',
    '--radius': '0.5rem',
  },
  minimalist_mono: {
    '--background': '0 0% 98%',
    '--foreground': '0 0% 10%',
    '--primary': '0 0% 20%',
    '--primary-foreground': '0 0% 98%',
    '--secondary': '0 0% 90%',
    '--secondary-foreground': '0 0% 20%',
    '--accent': '0 0% 15%',
    '--accent-foreground': '0 0% 98%',
    '--muted': '0 0% 95%',
    '--muted-foreground': '0 0% 40%',
    '--border': '0 0% 85%',
    '--input': '0 0% 85%',
    '--ring': '0 0% 20%',
    '--radius': '0.25rem',
  },
  retro_wave: {
    '--background': '270 100% 5%',
    '--foreground': '300 100% 95%',
    '--primary': '300 100% 60%',
    '--primary-foreground': '270 100% 5%',
    '--secondary': '330 100% 50%',
    '--secondary-foreground': '270 100% 5%',
    '--accent': '180 100% 50%',
    '--accent-foreground': '270 100% 5%',
    '--neon-pink': '300 100% 60%',
    '--neon-cyan': '180 100% 50%',
    '--neon-purple': '270 100% 70%',
    '--retro-glow': '0 0 30px currentColor',
    '--radius': '0.5rem',
  },
  corporate_elite: {
    '--background': '210 20% 98%',
    '--foreground': '210 20% 8%',
    '--primary': '210 100% 40%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '210 20% 92%',
    '--secondary-foreground': '210 20% 15%',
    '--accent': '200 80% 45%',
    '--accent-foreground': '0 0% 100%',
    '--muted': '210 20% 95%',
    '--muted-foreground': '210 20% 45%',
    '--border': '210 20% 88%',
    '--input': '210 20% 88%',
    '--ring': '210 100% 40%',
    '--radius': '0.375rem',
  }
};

// Sistema de efeitos CSS
const effectsCSS = {
  glassmorphism: `
    .glass-effect {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
  `,
  parallax: `
    .parallax-container {
      overflow-x: hidden;
      overflow-y: auto;
      perspective: 1px;
      height: 100vh;
    }
    .parallax-element {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateZ(-1px) scale(2);
    }
  `,
  particles: `
    .particles-bg {
      position: relative;
      overflow: hidden;
    }
    .particles-bg::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent),
        radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent),
        radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.4), transparent);
      background-size: 100px 80px, 120px 100px, 80px 60px;
      animation: particles 20s linear infinite;
    }
    @keyframes particles {
      0% { transform: translate(0, 0); }
      100% { transform: translate(-100px, -80px); }
    }
  `,
  gradients: `
    .gradient-bg {
      background: linear-gradient(-45deg, var(--primary), var(--secondary), var(--accent), var(--primary));
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
  shadows: `
    .shadow-glow {
      box-shadow: 
        0 0 20px rgba(var(--primary), 0.3),
        0 0 40px rgba(var(--primary), 0.2),
        0 0 60px rgba(var(--primary), 0.1);
    }
    .shadow-elevation {
      box-shadow: 
        0 2px 4px rgba(0,0,0,0.1),
        0 8px 16px rgba(0,0,0,0.1),
        0 16px 32px rgba(0,0,0,0.1);
    }
  `,
  '3d': `
    .transform-3d {
      transform-style: preserve-3d;
      perspective: 1000px;
    }
    .card-3d {
      transition: transform 0.3s ease;
    }
    .card-3d:hover {
      transform: rotateY(10deg) rotateX(5deg) translateZ(20px);
    }
  `
};

// Sistema de animações
const animationsCSS = {
  none: '',
  subtle: `
    .fade-in { animation: fadeIn 0.6s ease-out; }
    .slide-up { animation: slideUp 0.8s ease-out; }
    .scale-in { animation: scaleIn 0.5s ease-out; }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `,
  moderate: `
    .bounce-in { animation: bounceIn 0.8s ease-out; }
    .slide-in-left { animation: slideInLeft 0.7s ease-out; }
    .slide-in-right { animation: slideInRight 0.7s ease-out; }
    .rotate-in { animation: rotateIn 0.6s ease-out; }
    
    @keyframes bounceIn {
      0% { transform: scale(0.3); opacity: 0; }
      50% { transform: scale(1.05); }
      70% { transform: scale(0.9); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes slideInLeft {
      from { transform: translateX(-100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideInRight {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes rotateIn {
      from { transform: rotate(-10deg) scale(0.8); opacity: 0; }
      to { transform: rotate(0) scale(1); opacity: 1; }
    }
  `,
  dynamic: `
    .flip-in { animation: flipIn 1s ease-out; }
    .zoom-bounce { animation: zoomBounce 1.2s ease-out; }
    .shake-in { animation: shakeIn 0.8s ease-out; }
    .pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
    
    @keyframes flipIn {
      0% { transform: perspective(400px) rotateY(90deg); opacity: 0; }
      40% { transform: perspective(400px) rotateY(-10deg); }
      70% { transform: perspective(400px) rotateY(10deg); }
      100% { transform: perspective(400px) rotateY(0deg); opacity: 1; }
    }
    @keyframes zoomBounce {
      0% { transform: scale(0); opacity: 0; }
      60% { transform: scale(1.2); opacity: 0.8; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes shakeIn {
      0% { transform: translateX(-100px); opacity: 0; }
      60% { transform: translateX(10px); }
      80% { transform: translateX(-5px); }
      100% { transform: translateX(0); opacity: 1; }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 5px rgba(var(--primary), 0.5); }
      50% { box-shadow: 0 0 20px rgba(var(--primary), 0.8), 0 0 30px rgba(var(--primary), 0.6); }
    }
  `
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

function renderBlock(block: Block, templates: Record<string, string>, blockIndex: number): string {
    const variant = block.variant || 'default';
    const templatePath = `${block.name}/${variant}.hbs`;
    const templateString = templates[templatePath];

    if (!templateString) {
        console.warn(`Template não encontrado para o bloco: ${block.name} com variant: ${variant} em ${templatePath}`);
        return `<!-- Template para ${block.name} (${variant}) não encontrado -->`;
    }
    
    const blockTemplate = Handlebars.compile(templateString, { noEscape: true });
    
    // Merge das propriedades com metadados do bloco
    const context = { 
        ...block.properties, 
        blockIndex,
        blockId: block.id 
    };
    
    let renderedContent = blockTemplate(context);
    
    // Aplica styling customizado se presente
    if (block.styling?.customCSS) {
        renderedContent = `
            <style>
                #${block.id} { ${block.styling.customCSS} }
            </style>
            ${renderedContent}
        `;
    }
    
    return renderedContent;
}

function renderSection(section: Section, templates: Record<string, string>): string {
    const { layout, gridConfig, blocks, styling } = section;
    
    // Renderiza todos os blocos da seção
    const renderedBlocks = blocks.map((block, index) => {
        const blockHtml = renderBlock(block, templates, index);
        
        // Se o bloco tem posicionamento específico, envolve em container
        if (block.position) {
            const gridPosition = generateGridPositionCSS(block.position);
            return `<div class="section-block" style="${gridPosition}">${blockHtml}</div>`;
        }
        
        return blockHtml;
    });
    
    // Gera CSS do layout da seção
    const layoutCSS = generateSectionLayoutCSS(layout, gridConfig);
    const stylingSS = styling ? generateSectionStylingCSS(styling) : '';
    
    return `
        <section id="${section.id}" class="section-container ${layout}-layout" style="${layoutCSS}${stylingSS}">
            ${renderedBlocks.join('')}
        </section>
    `;
}

function generateGridPositionCSS(position: any): string {
    const { desktop, tablet, mobile } = position;
    let css = '';
    
    if (desktop) {
        css += `
            grid-row: ${desktop.row} / span ${desktop.rowSpan || 1};
            grid-column: ${desktop.column} / span ${desktop.columnSpan || 1};
        `;
    }
    
    // Adiciona responsividade se tablet/mobile definidos
    if (tablet || mobile) {
        css += `
            @media (max-width: 1024px) {
                ${tablet ? `
                    grid-row: ${tablet.row} / span ${tablet.rowSpan || 1};
                    grid-column: ${tablet.column} / span ${tablet.columnSpan || 1};
                ` : ''}
            }
            @media (max-width: 768px) {
                ${mobile ? `
                    grid-row: ${mobile.row} / span ${mobile.rowSpan || 1};
                    grid-column: ${mobile.column} / span ${mobile.columnSpan || 1};
                    order: ${mobile.order || 'unset'};
                ` : ''}
            }
        `;
    }
    
    return css;
}

function generateSectionLayoutCSS(layout: string, gridConfig?: any): string {
    switch (layout) {
        case 'grid':
            return gridConfig ? `
                display: grid;
                grid-template-columns: repeat(${gridConfig.columns}, 1fr);
                ${gridConfig.rows ? `grid-template-rows: repeat(${gridConfig.rows}, 1fr);` : ''}
                gap: ${gridConfig.gap || '1rem'};
            ` : 'display: grid; gap: 1rem;';
            
        case 'flexbox':
            return 'display: flex; flex-wrap: wrap; gap: 1rem;';
            
        case 'masonry':
            return `
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1rem;
                align-items: start;
            `;
            
        case 'carousel':
            return `
                display: flex;
                overflow-x: auto;
                gap: 1rem;
                scroll-snap-type: x mandatory;
            `;
            
        default:
            return 'display: block;';
    }
}

function generateSectionStylingCSS(styling: any): string {
    let css = '';
    
    if (styling.background) {
        css += `background: ${styling.background};`;
    }
    if (styling.minHeight) {
        css += `min-height: ${styling.minHeight};`;
    }
    
    return css;
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

    let bodyContent = '';
    
    // Renderiza usando nova estrutura de composition se disponível
    if (pagePlan.composition?.sections) {
        bodyContent = pagePlan.composition.sections
            .map(section => renderSection(section, templates))
            .join('');
    } 
    // Fallback para estrutura antiga (blocks)
    else if (pagePlan.blocks) {
        bodyContent = pagePlan.blocks.map((block, index) => {
            return renderBlock(block, templates, index);
        }).join('');
    }
    
    // Gera as variáveis CSS do tema
    const themeVariables = themeVariablesMap[pagePlan.theme.themeName] || themeVariablesMap.moderno_azul;
    
    // Aplica customizações de paleta se presentes
    if (pagePlan.theme.customPalette) {
        const customPalette = pagePlan.theme.customPalette;
        if (customPalette.primary && '--primary' in themeVariables) {
            (themeVariables as any)['--primary'] = customPalette.primary;
        }
        if (customPalette.secondary && '--secondary' in themeVariables) {
            (themeVariables as any)['--secondary'] = customPalette.secondary;
        }
        if (customPalette.accent && '--accent' in themeVariables) {
            (themeVariables as any)['--accent'] = customPalette.accent;
        }
    }
    
    const themeCss = Object.entries(themeVariables)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n    ');
    
    // Gera CSS de efeitos baseado no tema
    const effectsCss = pagePlan.theme.effects?.map(effect => effectsCSS[effect] || '').join('\n') || '';
    
    // Gera CSS de animações baseado no nível escolhido
    const animationsCss = pagePlan.theme.animations ? animationsCSS[pagePlan.theme.animations] || '' : '';
    
    const isDarkTheme = ['calor_tropical', 'tech_neon', 'luxury_gold', 'nature_green', 'glassmorphism', 'cyberpunk', 'dark_premium', 'retro_wave'].includes(pagePlan.theme.themeName);
    
    const themeStyleTag = isDarkTheme
        ? `<style>\n  .dark {\n    ${themeCss}\n  }\n  ${effectsCss}\n  ${animationsCss}\n</style>`
        : `<style>\n  :root {\n    ${themeCss}\n  }\n  ${effectsCss}\n  ${animationsCss}\n</style>`;

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

    // Adiciona Google Fonts baseado na fonte escolhida
    const fontLinks = {
      inter: '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">',
      roboto: '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet">',
      lato: '<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">',
      playfair: '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">',
      montserrat: '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">',
      poppins: '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">'
    };

    const fontLink = fontLinks[pagePlan.theme.font] || fontLinks.inter;
    const fontFamilyCSS = `<style>body { font-family: '${pagePlan.theme.font.charAt(0).toUpperCase() + pagePlan.theme.font.slice(1)}', sans-serif; }</style>`;

    // SEO enhancements
    const seoTags = pagePlan.seo ? `
        ${pagePlan.seo.keywords ? `<meta name="keywords" content="${pagePlan.seo.keywords.join(', ')}">` : ''}
        ${pagePlan.seo.ogImage ? `<meta property="og:image" content="${pagePlan.seo.ogImage}">` : ''}
        <meta property="og:title" content="${pagePlan.pageTitle}">
        <meta property="og:description" content="${pagePlan.pageDescription}">
        ${pagePlan.seo.structuredData ? `<script type="application/ld+json">${JSON.stringify(pagePlan.seo.structuredData)}</script>` : ''}
    ` : '';

    const fullHtml = `
<!DOCTYPE html>
<html lang="pt-BR" class="${isDarkTheme ? 'dark' : ''}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pagePlan.pageTitle}</title>
    <meta name="description" content="${pagePlan.pageDescription}">
    ${seoTags}
    ${fontLink}
    ${themeStyleTag}
    ${fontFamilyCSS}
    ${compiledCssTag}
    ${pagePlan.customCode?.head || ''}
</head>
<body>
${bodyContent}
${widgetsHtml}
${pagePlan.customCode?.body || ''}
</body>
</html>`;

    return [{
    path: 'index.html',
        content: fullHtml,
        type: 'page',
        description: 'Página principal construída via renderizador determinístico flexível.'
    }];
} 