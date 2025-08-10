// @ts-check
require('ts-node').register({ transpileOnly: true });

const fs = require('node:fs/promises');
const path = require('node:path');
const { themeVariablesMap } = require('../src/lib/design-tokens.ts');

(async function buildCss() {
  let css = '/* Arquivo gerado automaticamente pelo build-design-css.js */\n';
  for (const [themeName, modes] of Object.entries(themeVariablesMap)) {
    const lightVars = Object.entries(modes.light)
      .map(([k, v]) => `  ${k}: ${v};`) // identação
      .join('\n');
    const darkVars = Object.entries(modes.dark)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    css += `\n:root[data-theme="${themeName}"] {\n${lightVars}\n}\n\n:root[data-theme="${themeName}"].dark, .dark[data-theme="${themeName}"] {\n${darkVars}\n}\n`;
  }
  const outDir = path.join(process.cwd(), 'src', 'lib');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'generated-theme.css');
  await fs.writeFile(outPath, css.trim(), 'utf8');
  console.log(`Design tokens CSS gerado em ${outPath}`);
})().catch((err) => {
  console.error('Falha ao gerar CSS de design tokens:', err);
  process.exit(1);
}); 