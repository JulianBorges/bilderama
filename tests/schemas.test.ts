import { describe, it, expect } from 'vitest'
import { pagePlanSchema } from '../src/lib/schemas'

const validPlan = {
  pageTitle: 'Teste',
  pageDescription: 'desc',
  theme: {
    themeName: 'moderno_azul',
    font: 'inter'
  },
  blocks: [
    {
      name: 'Navbar',
      properties: { logoText: 'Logo', links: [], ctaText: 'Entrar' }
    }
  ],
}

describe('pagePlanSchema', () => {
  it('valida plano correto', () => {
    expect(() => pagePlanSchema.parse(validPlan)).not.toThrow()
  })

  it('detecta plano inválido', () => {
    const invalid: any = { ...validPlan }
    delete invalid.pageTitle
    expect(() => pagePlanSchema.parse(invalid)).toThrow()
  })
}) 