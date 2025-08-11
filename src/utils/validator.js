import { ValidationError } from './logger.js';
import { DEFAULTS } from './constants.js';

export function validateApiKey(key){
  const k = (key||'').trim();
  if (!k) throw new ValidationError('Informe a OpenAI API key.');
  if (!/^sk-/.test(k)) return { key: k, warning: 'API key não começa com sk- (pode estar usando outro formato).' };
  return { key: k };
}

export function validateImages(files){
  const { maxFiles, maxSize, types } = DEFAULTS.images;
  if (files.length > maxFiles) throw new ValidationError(`Máximo de ${maxFiles} imagens.`);
  for (const f of files) {
    if (!types.includes(f.type)) throw new ValidationError(`Tipo não permitido: ${f.type}`);
    if (f.size > maxSize) throw new ValidationError(`Arquivo muito grande: ${f.name}`);
  }
}

export function validateForm(data){
  const { fields, images } = data || {};
  if (!Array.isArray(fields) || fields.length === 0) throw new ValidationError('Adicione pelo menos um campo com valor.');
  if (!Array.isArray(images) || images.length === 0) throw new ValidationError('Adicione pelo menos uma imagem.');
}


