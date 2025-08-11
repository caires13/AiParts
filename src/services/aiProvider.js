import { APIError } from '../utils/logger.js';
import { OPENAI_ENDPOINT, getMaxTokensParamName, supportsCustomTemperature, DEFAULTS } from '../utils/constants.js';

export async function callAI({ apiKey, model, messages, temperature, maxTokens }){
  const controller = new AbortController();
  const to = setTimeout(()=> controller.abort(), DEFAULTS.timeouts.apiMs);
  try {
    const payload = { model, messages };
    if (supportsCustomTemperature(model)) payload.temperature = temperature;
    payload[getMaxTokensParamName(model)] = maxTokens;

    const res = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify(payload)
    });
    if (!res.ok){
      let msg = `Erro da API (${res.status})`;
      try { const j = await res.json(); msg = j?.error?.message || msg; } catch {}
      throw new APIError(msg, res.status);
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return { content };
  } catch(err){
    if (err.name === 'AbortError') throw new APIError('Tempo esgotado (timeout).', 408);
    if (err instanceof APIError) throw err;
    throw new APIError(err?.message || 'Falha na chamada da API.', 520);
  } finally { clearTimeout(to); }
}


