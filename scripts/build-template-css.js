#!/usr/bin/env node

/**
 * Script para gerar CSS otimizado especificamente para os templates .hbs
 * Este processo analisa apenas os templates e gera um arquivo CSS limpo
 * sem dependências desnecessárias do framework Next.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuração
const TEMPLATES_DIR = path.join(__dirname, '../src/templates');
const OUTPUT_DIR = path.join(__dirname, '../src/lib');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'generated-theme.css');
const TEMP_CONFIG = path.join(__dirname, '../tailwind.templates.config.js');

// Template de configuração Tailwind específica para templates
const tailwindTemplateConfig = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/templates/**/*.hbs",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn var(--duration-normal) var(--ease-out)",
        "slide-up": "slideUp var(--duration-normal) var(--ease-out)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionTimingFunction: {
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }
    },
  },
  plugins: [],
}
`;

// Template de CSS base
const baseCss = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  /* Design Token Classes */
  .ease-bounce { 
    transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); 
  }
  .ease-spring { 
    transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  }
  
  /* Animation Classes */
  .animate-fade-in {
    animation: fadeIn 250ms ease-out;
  }
  
  .animate-slide-up {
    animation: slideUp 250ms ease-out;
  }
}
`;

function getAllHbsFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(getAllHbsFiles(filePath));
    } else if (file.endsWith('.hbs')) {
      results.push(filePath);
    }
  }
  
  return results;
}

function extractClassesFromHbs(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex para extrair classes CSS dos templates
  const classRegex = /class="([^"]+)"/g;
  const classes = new Set();
  
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const classString = match[1];
    // Separar classes individuais e filtrar Handlebars helpers
    const individualClasses = classString.split(/\s+/).filter(cls => 
      cls && !cls.includes('{{') && !cls.includes('}}')
    );
    individualClasses.forEach(cls => classes.add(cls));
  }
  
  return Array.from(classes);
}

function generateOptimizedCss() {
  console.log('🚀 Iniciando build de CSS otimizado para templates...');
  
  try {
    // 1. Criar arquivo de configuração temporário
    fs.writeFileSync(TEMP_CONFIG, tailwindTemplateConfig);
    console.log('✅ Configuração Tailwind criada');
    
    // 2. Criar arquivo CSS temporário
    const tempCssFile = path.join(__dirname, '../temp-templates.css');
    fs.writeFileSync(tempCssFile, baseCss);
    console.log('✅ CSS base criado');
    
    // 3. Executar Tailwind para gerar CSS
    const command = `npx tailwindcss -c ${TEMP_CONFIG} -i ${tempCssFile} -o ${OUTPUT_FILE} --minify`;
    console.log('⚙️ Executando Tailwind CSS...');
    execSync(command, { stdio: 'inherit' });
    
    // 4. Analisar templates para estatísticas
    const hbsFiles = getAllHbsFiles(TEMPLATES_DIR);
    const allClasses = new Set();
    
    hbsFiles.forEach(file => {
      const classes = extractClassesFromHbs(file);
      classes.forEach(cls => allClasses.add(cls));
    });
    
    // 5. Verificar tamanho do arquivo gerado
    const stats = fs.statSync(OUTPUT_FILE);
    const sizeInKB = (stats.size / 1024).toFixed(2);
    
    console.log('\n📊 Estatísticas do Build:');
    console.log(`   Templates analisados: ${hbsFiles.length}`);
    console.log(`   Classes CSS únicas: ${allClasses.size}`);
    console.log(`   Tamanho do CSS: ${sizeInKB} KB`);
    console.log(`   Arquivo gerado: ${OUTPUT_FILE}`);
    
    // 6. Limpar arquivos temporários
    fs.unlinkSync(TEMP_CONFIG);
    fs.unlinkSync(tempCssFile);
    
    console.log('\n✅ Build de CSS concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o build:', error.message);
    
    // Limpar arquivos temporários mesmo em caso de erro
    try {
      if (fs.existsSync(TEMP_CONFIG)) fs.unlinkSync(TEMP_CONFIG);
      if (fs.existsSync(tempCssFile)) fs.unlinkSync(tempCssFile);
    } catch (cleanupError) {
      // Ignorar erros de limpeza
    }
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  generateOptimizedCss();
}

module.exports = { generateOptimizedCss }; 