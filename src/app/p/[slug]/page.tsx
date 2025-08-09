import { getPublishedIndexHtml } from '@/lib/publishStore'

export default function PublishedPage({ params }: { params: { slug: string } }) {
  const html = getPublishedIndexHtml(params.slug)

  if (!html) {
    return (
      <html lang="pt-BR">
        <body>
          <div style={{ padding: 24 }}>
            <h1>Projeto não encontrado</h1>
            <p>Verifique o link e tente novamente.</p>
          </div>
        </body>
      </html>
    )
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  )
} 