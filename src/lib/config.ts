export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
  validateApiKey: () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não está configurada no arquivo .env');
    }
    if ((!apiKey.startsWith('sk-') && !apiKey.startsWith('sk-proj-')) || apiKey.length < 40) {
      throw new Error('OPENAI_API_KEY inválida. A chave deve começar com "sk-" ou "sk-proj-" e ter pelo menos 40 caracteres');
    }
    return true;
  }
} 