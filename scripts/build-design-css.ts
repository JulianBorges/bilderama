import { promises as fs } from 'node:fs'
import path from 'node:path'
import { themeVariablesMap } from '../src/lib/design-tokens'

async function buildCss() {
  let css = `/* Arquivo gerado automaticamente pelo script build-design-css.ts */\n`;
  for (const [themeName, modes] of Object.entries(themeVariablesMap)) {
    const lightVars = Object.entries(modes.light)
      .map(([k, v]) => `  ${k}: ${v};`) // identação
      .join('\n');
    const darkVars = Object.entries(modes.dark)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    css += `
:root[data-theme="${themeName}"] {
${lightVars}
}

:root[data-theme="${themeName}"].dark, .dark[data-theme="${themeName}"] {
${darkVars}
}
`;
  }

  const outDir = path.join(process.cwd(), 'src', 'lib');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, 'generated-theme.css');
  await fs.writeFile(outPath, css.trim(), 'utf8');
  console.log(`Design tokens CSS gerado em ${outPath}`);
}

buildCss().catch((err) => {
  console.error('Falha ao gerar CSS de design tokens:', err);
  process.exit(1);
}); 