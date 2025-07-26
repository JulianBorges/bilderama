// Este módulo centralizará tokens de tema (paleta, radius, tipografia, shadow)
// Nas próximas tarefas, o objeto completo de tokens será movido para cá e o CSS será
// gerado no build. Por ora exportamos o tipo e um mapa vazio para manter o build verde.

export type ThemeMode = 'light' | 'dark'
export type CssVar = `--${string}`
export type ThemeTokenSet = Record<CssVar, string>
export type ThemeTokens = Record<ThemeMode, ThemeTokenSet>
export type ThemeVariablesMap = Record<string, ThemeTokens>

// TODO (Tarefa 2): mover o mapa completo de variáveis de `renderer.ts` para cá.
export const themeVariablesMap: ThemeVariablesMap = {
  moderno_azul: {
    light: {
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
      '--radius': '0.5rem'
    },
    dark: {
      '--background': '222.2 84% 4.9%',
      '--foreground': '210 40% 98%',
      '--card': '222.2 84% 4.9%',
      '--card-foreground': '210 40% 98%',
      '--popover': '222.2 84% 4.9%',
      '--popover-foreground': '210 40% 98%',
      '--primary': '217.2 91.2% 59.8%',
      '--primary-foreground': '222.2 84% 4.9%',
      '--secondary': '217.2 32.6% 17.5%',
      '--secondary-foreground': '210 40% 98%',
      '--muted': '217.2 32.6% 17.5%',
      '--muted-foreground': '215 20.2% 65.1%',
      '--accent': '217.2 32.6% 17.5%',
      '--accent-foreground': '210 40% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '217.2 32.6% 17.5%',
      '--input': '217.2 32.6% 17.5%',
      '--ring': '224.3 76.3% 94.1%',
      '--radius': '0.5rem'
    }
  },
  calor_tropical: {
    light: {
      '--background': '43 74% 66%',
      '--foreground': '24 9.8% 10%',
      '--card': '47 84% 91%',
      '--card-foreground': '24 9.8% 10%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '24 9.8% 10%',
      '--primary': '20.5 90.2% 48.2%',
      '--primary-foreground': '60 9.1% 97.8%',
      '--secondary': '60 4.8% 95.9%',
      '--secondary-foreground': '24 9.8% 10%',
      '--muted': '60 4.8% 95.9%',
      '--muted-foreground': '25 5.3% 44.7%',
      '--accent': '60 4.8% 95.9%',
      '--accent-foreground': '24 9.8% 10%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '60 9.1% 97.8%',
      '--border': '20 5.9% 90%',
      '--input': '20 5.9% 90%',
      '--ring': '20.5 90.2% 48.2%',
      '--radius': '0.5rem'
    },
    dark: {
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
      '--radius': '0.5rem'
    }
  },
  // ... existing code (demais temas iguais aos de renderer.ts) ...
}; 