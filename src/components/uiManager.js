import { DEFAULTS, supportsCustomTemperature } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';

let controller = null;

export function initializeEventListeners(callbacks){
  controller = callbacks;
  document.getElementById('analyzeBtn').addEventListener('click', controller.handleFormSubmission);
  document.getElementById('followupForm').addEventListener('submit', controller.handleFollowUpMessage);
  document.getElementById('openSettings').addEventListener('click', openSettings);
  document.getElementById('saveSettings').addEventListener('click', saveSettingsFromUI);
  document.getElementById('toggleDebug').addEventListener('change', (e)=>{
    controller.onToggleDebug(!!e.target.checked);
  });
  document.getElementById('downloadDebug').addEventListener('click', (e)=>{
    e.preventDefault(); controller.onDownloadDebug();
  });

  const modelEl = document.getElementById('model');
  modelEl.addEventListener('input', ()=> updateTemperatureControls(modelEl.value));

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  dropzone.addEventListener('click', ()=> fileInput.click());
  dropzone.addEventListener('dragover', (e)=>{ e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', ()=> dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e)=>{ e.preventDefault(); dropzone.classList.remove('dragover'); controller.onFilesSelected(e.dataTransfer.files); });
  fileInput.addEventListener('change', ()=>{ controller.onFilesSelected(fileInput.files); fileInput.value=''; });
}

export function renderMessage(role, markdown){
  const chat = document.getElementById('chat');
  const item = document.createElement('div');
  item.className = 'chat-msg';
  const who = role==='user' ? 'Você' : 'AI';
  const bubble = document.createElement('div');
  bubble.className = 'p-3 rounded-xl border border-slate-700 ' + (role==='user' ? 'bg-slate-900' : 'bg-slate-800');
  const { marked } = window;
  const safeHtml = window.DOMPurify.sanitize(marked.parse(markdown||''));
  bubble.innerHTML = `<div class="text-xs text-slate-400 mb-1">${who}</div>${safeHtml}`;
  item.appendChild(bubble);
  chat.appendChild(item);
  chat.scrollTop = chat.scrollHeight;
}

export function showLoader(msg){ setStatus(msg || 'Carregando...'); }
export function hideLoader(){ setStatus(''); }
export function setStatus(msg){ document.getElementById('status').textContent = msg || ''; }

export function ensureChatVisible(){ document.getElementById('chatSection').classList.remove('hidden'); }
export function setDebugVisible(v){
  document.getElementById('debugPanel').classList.toggle('hidden', !v);
  document.getElementById('toggleDebug').checked = !!v;
}

export function showDebugPayload(obj){
  const dbg = document.getElementById('debugContent');
  const btn = document.getElementById('downloadDebug');
  dbg.textContent = JSON.stringify(obj, null, 2);
  setDebugVisible(true);
  btn.classList.remove('hidden');
}

export function openSettings(){
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
export function closeSettings(){
  const modal = document.getElementById('settingsModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

export function populateSettingsUI(settings){
  document.getElementById('persona').value = settings.persona || DEFAULTS.persona;
  document.getElementById('analysis').value = settings.analysis || DEFAULTS.analysis;
  document.getElementById('temperature').value = settings.temperature ?? DEFAULTS.temperature;
  document.getElementById('maxTokens').value = settings.maxTokens ?? DEFAULTS.maxTokens;
  document.getElementById('debugMode').checked = !!settings.debug;
  document.getElementById('autoSave').checked = !!settings.autoSave;
  document.getElementById('saveKey').checked = !!settings.saveKey;
  updateTemperatureControls(document.getElementById('model').value);
}

export function saveSettingsFromUI(){
  const partial = {
    persona: document.getElementById('persona').value,
    analysis: document.getElementById('analysis').value,
    temperature: Number(document.getElementById('temperature').value)||DEFAULTS.temperature,
    maxTokens: Number(document.getElementById('maxTokens').value)||DEFAULTS.maxTokens,
    debug: !!document.getElementById('debugMode').checked,
    autoSave: !!document.getElementById('autoSave').checked,
    saveKey: !!document.getElementById('saveKey').checked,
  };
  controller.onSettingsSaved(partial);
}

export function updateTemperatureControls(model){
  const tInput = document.getElementById('temperature');
  const tHint = document.getElementById('temperatureHint');
  const supports = supportsCustomTemperature((model||'').trim());
  tInput.disabled = !supports;
  tHint.classList.toggle('hidden', supports);
}

export function setApiKeyHint(text){
  document.getElementById('apiKeyHint').textContent = text || 'A chave fica somente no seu navegador.';
}

export function setApiKeyValue(value){
  document.getElementById('apiKey').value = value || '';
}

export function renderImagePreviews(images){
  const previewsEl = document.getElementById('previews');
  previewsEl.innerHTML = '';
  images.forEach((img, idx)=>{
    const d = document.createElement('div');
    d.className = 'relative';
    d.innerHTML = `
      <img src="${img.dataUrl||''}" alt="${img.name}" class="w-full h-28 object-cover rounded-lg border border-slate-700"/>
      <button class="absolute top-2 right-2 btn px-2 py-1 text-xs" data-remove="${idx}">Remover</button>
      <div class="mt-1 text-xs text-slate-300 truncate">${img.name}</div>
    `;
    d.querySelector('button').addEventListener('click', ()=> controller.onRemoveImage(idx));
    previewsEl.appendChild(d);
  });
}

export function bindSettingsClose(){
  document.getElementById('settingsModal').addEventListener('click', (e)=>{
    if (e.target.matches('[data-close]')) closeSettings();
  });
}


