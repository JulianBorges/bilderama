import { describe, it, expect } from 'vitest'
import { renderPage } from '../src/lib/renderer'
import { type PagePlan } from '../src/lib/schemas'

const simplePlan: PagePlan = {
  pageTitle: 'Hello',
  pageDescription: 'desc',
  theme: {
    themeName: 'moderno_azul',
    font: 'inter'
  },
  blocks: [
    {
      name: 'Navbar',
      properties: { logoText: 'Logo', links: [], ctaText: '' },
    }
  ]
}

describe('renderer', () => {
  it('gera HTML com <title>', async () => {
    const files = await renderPage(simplePlan, '')
    expect(files[0].content).includes('<title>Hello</title>')
  })
}) 