import Handlebars from 'handlebars';
import { PagePlan } from './schemas';
import { GeneratedFile } from './ai';

// Importa os templates como texto puro, graças à configuração do Webpack.
import NavbarTemplate from '@/templates/Navbar.hbs';
import FooterTemplate from '@/templates/Footer.hbs';
import HeroModernoTemplate from '@/templates/Hero Moderno.hbs';
import CardFeatureTemplate from '@/templates/Card Feature.hbs';
import GridFeaturesTemplate from '@/templates/Grid Features.hbs';
import TestimonialCardTemplate from '@/templates/Testimonial Card.hbs';
import PricingCardTemplate from '@/templates/Pricing Card.hbs';
import CallToActionTemplate from '@/templates/Call to Action.hbs';
import LogoCloudTemplate from '@/templates/Logo Cloud.hbs';

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

// Um registro central para todos os templates de componentes.
const templates: Record<string, string> = {
    "Navbar": NavbarTemplate,
    "Footer": FooterTemplate,
    "Hero Moderno": HeroModernoTemplate,
    "Card Feature": CardFeatureTemplate,
    "Grid Features": GridFeaturesTemplate,
    "Testimonial Card": TestimonialCardTemplate,
    "Pricing Card": PricingCardTemplate,
    "Call to Action": CallToActionTemplate,
    "Logo Cloud": LogoCloudTemplate,
};

// Registra o "Card Feature" como um parcial, pois ele é usado dentro do "Grid Features".
Handlebars.registerPartial("Card Feature", templates["Card Feature"]);

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
 * @returns Um array de arquivos gerados (normalmente, apenas index.html).
 */
export function renderPage(pagePlan: PagePlan): GeneratedFile[] {
    // Itera sobre os blocos do plano, renderizando cada um com seu respectivo template.
    const bodyContent = pagePlan.blocks.map((block, index) => {
        const templateString = templates[block.name];
        if (!templateString) {
            console.warn(`Template não encontrado para o bloco: ${block.name}`);
            return `<!-- Template para ${block.name} não encontrado -->`;
        }
        
        const blockTemplate = Handlebars.compile(templateString, { noEscape: true });
        
        // Passa as propriedades do bloco e seu índice para o template.
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