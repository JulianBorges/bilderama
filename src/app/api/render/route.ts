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
    
    const layoutFiles = manifest.pages['/layout'] || [];
    const cssFile = layoutFiles.find((file: string) => file.endsWith('.css'));
    
    if (!cssFile) {
      console.warn('Nenhum arquivo CSS encontrado no app-build-manifest.json');
      return '';
    }

    const cssPath = path.join(process.cwd(), '.next', cssFile);
    const cssContent = await fs.readFile(cssPath, 'utf-8');
    return cssContent;
  } catch (error) {
    console.error('Erro ao ler o app-build-manifest.json:', error);
    return '';
  }
}

function validatePagesPaths(plan: any) {
  if (!plan?.pages || !Array.isArray(plan.pages)) return;
  const seen = new Set<string>();
  for (const p of plan.pages) {
    if (!p?.path || typeof p.path !== 'string') {
      throw new Error('Cada página em pages[] deve ter um path string.');
    }
    const normalized = p.path.startsWith('/') ? p.path : `/${p.path}`;
    if (seen.has(normalized)) {
      throw new Error(`Rota duplicada em pages[]: ${normalized}`);
    }
    if (!/^\/[a-z0-9\-\/]*$/i.test(normalized)) {
      throw new Error(`Path inválido em pages[]: ${p.path}`);
    }
    seen.add(normalized);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pagePlan = pagePlanSchema.parse(body);

    // Validação opcional de pages[].path
    try {
      validatePagesPaths(pagePlan as any);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    const cssContent = await getCssFromBuildManifest();

    const files = await renderPage(pagePlan, cssContent);

    return NextResponse.json({ files });

  } catch (error: any) {
    console.error('[API RENDER ERROR]', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Corpo da requisição inválido.', details: error }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor ao renderizar a página.' },
      { status: 500 }
    );
  }
} 