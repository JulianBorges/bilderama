// Este módulo centralizará tokens de tema (paleta, radius, tipografia, shadow)
// Nas próximas tarefas, o objeto completo de tokens será movido para cá e o CSS será
// gerado no build. Por ora exportamos o tipo e um mapa vazio para manter o build verde.

export type ThemeMode = 'light' | 'dark'
export type CssVar = `--${string}`
export type ThemeTokenSet = Record<CssVar, string>
export type ThemeTokens = Record<ThemeMode, ThemeTokenSet>
export type ThemeVariablesMap = Record<string, ThemeTokens>

// TODO (Tarefa 2): mover o mapa completo de variáveis de `renderer.ts` para cá.
export const themeVariablesMap: ThemeVariablesMap = {} 