import { renderMessage, showLoader, hideLoader, setStatus, ensureChatVisible, setDebugVisible, showDebugPayload, initializeEventListeners, populateSettingsUI, openSettings, closeSettings, setApiKeyHint, setApiKeyValue, renderImagePreviews, bindSettingsClose } from '../components/uiManager.js';
import { initializeForm, getFormData } from '../components/formHandler.js';
import { callAI } from '../services/aiProvider.js';
import { processImages } from '../services/imageProcessor.js';
import { DEFAULTS, getMaxTokensParamName, supportsCustomTemperature } from '../utils/constants.js';
import { Logger, ValidationError, APIError } from '../utils/logger.js';
import { validateApiKey, validateForm } from '../utils/validator.js';
import { getState, getHistory, addMessageToHistory, updateSettings, loadSettings, saveSettings, setApiKeyPreference, getApiKey, setImages, getImages, getPrompts } from './stateManager.js';

function buildInitialUserText(fields){
  const lines = fields.map(f=> `- **${f.label}:** ${f.value}`);
  const { analysis } = getPrompts();
  return `${analysis}\n\n**Informações fornecidas:**\n${lines.join('\n')}`;
}

function buildMessagesForInitial(fields){
  const { persona } = getPrompts();
  const text = buildInitialUserText(fields);
  const parts = [{ type: 'text', text }];
  for (const img of getImages()){
    if (img.dataUrl) parts.push({ type: 'image_url', image_url: { url: img.dataUrl } });
  }
  return [ { role: 'system', content: persona }, { role: 'user', content: parts } ];
}

function buildMessagesForChat(){
  const { persona } = getPrompts();
  return [{ role: 'system', content: persona }, ...getHistory() ];
}

async function handleError(err){
  let msg = 'Ocorreu um erro.';
  if (err instanceof ValidationError) msg = err.message;
  else if (err instanceof APIError) {
    if (err.status === 401) msg = 'API key inválida.';
    else if (err.status === 429) msg = 'Limite de requisições atingido (rate limit). Tente novamente mais tarde.';
    else if (err.status === 408) msg = 'Tempo esgotado na chamada.';
    else msg = err.message || msg;
  } else if (err?.message) msg = err.message;
  setStatus(msg);
  Logger.error(err);
  try { ensureChatVisible(); renderMessage('assistant', `⚠️ **Erro:** ${msg}`); } catch {}
}

export function initializeApp(){
  // Load settings and populate UI
  const loaded = loadSettings();
  populateSettingsUI(loaded);
  setApiKeyValue(loaded.savedKey || '');
  setDebugVisible(!!loaded.debug);

  // Initialize form and listeners
  initializeForm();
  initializeEventListeners({
    handleFormSubmission,
    handleFollowUpMessage,
    onToggleDebug: (v)=>{ updateSettings({ debug: v }); setDebugVisible(v); saveSettings(); },
    onDownloadDebug: ()=>{
      const dbg = document.getElementById('debugContent');
      const blob = new Blob([dbg.textContent||'' ], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'debug-payload.json';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    },
    onFilesSelected: onFilesSelected,
    onRemoveImage: (idx)=>{
      const imgs = getImages();
      imgs.splice(idx,1); setImages(imgs); renderImagePreviews(imgs);
    },
    onSettingsSaved: onSettingsSaved,
  });
  bindSettingsClose();
}

async function onFilesSelected(fileList){
  try {
    const files = Array.from(fileList||[]);
    const imgs = getImages().slice();
    const startIndex = imgs.length;
    files.forEach(f=> imgs.push({ file: f, name: f.name, mime: f.type, dataUrl: null }));
    setImages(imgs);
    setStatus('Preparando imagens...');
    const processed = await processImages(files, (current,total)=> setStatus(`Processando imagens (${current}/${total})...`));
    processed.forEach(({ idx, dataUrl }, i)=>{
      imgs[startIndex + i].dataUrl = dataUrl;
    });
    setImages(imgs);
    renderImagePreviews(imgs);
    setStatus('Imagens preparadas.');
  } catch(err){ handleError(err); }
}

function onSettingsSaved(partial){
  updateSettings(partial);
  saveSettings();
  setDebugVisible(!!getState().settings.debug);
  closeSettings();
  // save API key preference
  const key = (document.getElementById('apiKey').value||'').trim();
  const shouldSave = !!document.getElementById('saveKey').checked;
  setApiKeyPreference(shouldSave, key);
}

export async function handleFormSubmission(){
  try {
    showLoader('Validando...');
    const form = getFormData();
    const images = getImages();
    const data = { fields: form.fields, images };
    validateForm(data);

    const debug = getState().settings.debug;
    const messages = buildMessagesForInitial(form.fields);

    if (debug){
      const maxParam = getMaxTokensParamName(form.model);
      const dbg = { endpoint: 'openai', model: form.model, [maxParam]: form.maxTokens, messages, imageFiles: images.map(i=> i.name) };
      if (supportsCustomTemperature(form.model)) dbg.temperature = form.temperature;
      showDebugPayload(dbg);
      setStatus('Debug: payload gerado. Nenhuma chamada foi feita.');
      ensureChatVisible();
      addMessageToHistory({ role: 'user', content: messages[1].content });
      renderMessage('user', '**[Debug]** Envio inicial (sem chamada de API).');
      hideLoader();
      return;
    }

    const { key, warning } = validateApiKey(form.apiKey);
    if (warning) Logger.warn(warning);

    showLoader('Chamando a IA...');
    const { content } = await callAI({ apiKey: key, model: form.model, messages, temperature: form.temperature, maxTokens: form.maxTokens });

    addMessageToHistory({ role: 'user', content: messages[1].content });
    addMessageToHistory({ role: 'assistant', content });
    ensureChatVisible();
    renderMessage('user', 'Envio inicial com imagens.');
    renderMessage('assistant', content);
    setStatus('Pronto.');
  } catch (err){ await handleError(err); }
  finally { hideLoader(); saveSettings(); }
}

export async function handleFollowUpMessage(e){
  e.preventDefault();
  const input = document.getElementById('followupInput');
  const text = (input.value||'').trim();
  if (!text) return;
  input.value='';
  try {
    addMessageToHistory({ role: 'user', content: text });
    renderMessage('user', text);
    showLoader('Chamando a IA...');

    const form = getFormData();
    const debug = getState().settings.debug;
    const messages = buildMessagesForChat();
    if (debug){
      const maxParam = getMaxTokensParamName(form.model);
      const dbg = { endpoint: 'openai', model: form.model, [maxParam]: form.maxTokens, messages };
      if (supportsCustomTemperature(form.model)) dbg.temperature = form.temperature;
      showDebugPayload(dbg);
      renderMessage('assistant', '_[Debug] Nenhuma chamada foi feita._');
      setStatus('Debug: payload gerado.');
      hideLoader();
      return;
    }

    const { key } = validateApiKey(form.apiKey);
    const { content } = await callAI({ apiKey: key, model: form.model, messages, temperature: form.temperature, maxTokens: form.maxTokens });
    addMessageToHistory({ role: 'assistant', content });
    renderMessage('assistant', content);
    setStatus('Pronto.');
  } catch(err){ await handleError(err); }
  finally { hideLoader(); saveSettings(); }
}


