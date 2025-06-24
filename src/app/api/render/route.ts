import { NextRequest, NextResponse } from 'next/server';
import { pagePlanSchema } from '@/lib/schemas';
import { renderPage } from '@/lib/renderer';
import { z } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

async function getCssFromBuildManifest(): Promise<string> {
  try {
    const manifestPath = path.join(process.cwd(), '.next', 'app-build-manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    
    // Obtém os arquivos CSS do layout principal
    const layoutFiles = manifest.pages['/layout'] || [];
    const cssFile = layoutFiles.find((file: string) => file.endsWith('.css'));
    
    if (!cssFile) {
      console.warn('Nenhum arquivo CSS encontrado no app-build-manifest.json');
      return '';
    }

    // Lê o conteúdo do arquivo CSS
    const cssPath = path.join(process.cwd(), '.next', cssFile);
    const cssContent = await fs.readFile(cssPath, 'utf-8');
    return cssContent;
  } catch (error) {
    console.error('Erro ao ler o app-build-manifest.json:', error);
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Obter o corpo da requisição
    const body = await req.json();

    // 2. Validar o corpo com o nosso esquema Zod
    const pagePlan = pagePlanSchema.parse(body);

    // 3. Obter o CSS do build-manifest
    const cssContent = await getCssFromBuildManifest();

    // 4. Renderizar a página usando o novo serviço de renderização
    const files = await renderPage(pagePlan, cssContent);

    // 5. Retornar os arquivos gerados
    return NextResponse.json({ files });

  } catch (error: any) {
    console.error('[API RENDER ERROR]', error);

    // Se for um erro de validação do Zod, retorna uma resposta mais específica
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Corpo da requisição inválido.', details: error }, { status: 400 });
    }

    // Para outros erros, retorna um erro 500 genérico.
    return NextResponse.json(
      { error: 'Erro interno do servidor ao renderizar a página.' },
      { status: 500 }
    );
  }
} 