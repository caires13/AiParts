export const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export const DEFAULTS = {
  model: 'gpt-5',
  temperature: 1,
  maxTokens: 2048,
  ui: { debounceMs: 600 },
  timeouts: { apiMs: 60_000, workerMs: 10_000 },
  images: { maxFiles: 10, maxSize: 10 * 1024 * 1024, types: ['image/jpeg','image/png','image/webp','image/gif'] },
  persona: `Você é um especialista em peças de máquinas de impressão offset e flexográfica (Ryobi/Heidelberg/Komori, etc.). Identifique a peça, explique a função, liste especificações técnicas, possíveis part numbers, compatibilidades e variações. Sugira fornecedores internacionais com links pesquisáveis (sem inventar URLs). Quando faltar dado, peça informações claras e objetivas. Priorize respostas concisas, com seções e listas. Idioma: português brasileiro, a menos que o usuário escreva em inglês.`,
  analysis: `Analise as informações abaixo e as imagens. Gere: (1) identificação da peça; (2) função; (3) specs e materiais; (4) part numbers prováveis; (5) compatibilidade com modelos; (6) sugestões de fornecedores e termos de busca (EN/PT); (7) próximas perguntas para confirmar. Não invente links; ofereça termos de busca específicos.`,
};

export function getMaxTokensParamName(model){
  const m = (model||'').toLowerCase();
  if (m.startsWith('gpt-5') || m.startsWith('o1') || m.startsWith('o3')) return 'max_completion_tokens';
  return 'max_tokens';
}

export function supportsCustomTemperature(model){
  const m = (model||'').toLowerCase();
  if (m.startsWith('gpt-5') || m.startsWith('o1') || m.startsWith('o3')) return false;
  return true;
}


