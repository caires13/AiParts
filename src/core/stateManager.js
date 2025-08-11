import { DEFAULTS } from '../utils/constants.js';
import { Logger } from '../utils/logger.js';

const STORAGE_KEYS = {
  settings: 'ai-parts-settings',
  apikey: 'ai-parts-apikey',
};

const state = {
  conversationHistory: [],
  images: [], // { file, name, mime, dataUrl }
  settings: {
    model: DEFAULTS.model,
    persona: '',
    analysis: '',
    temperature: DEFAULTS.temperature,
    maxTokens: DEFAULTS.maxTokens,
    debug: false,
    autoSave: true,
    saveKey: false,
  },
};

export function loadSettings(){
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') {
      state.settings = { ...state.settings, ...parsed };
    }
    const savedKey = localStorage.getItem(STORAGE_KEYS.apikey);
    return { ...state.settings, savedKey };
  } catch (e){ Logger.warn('Storage load fail', e); return { ...state.settings, savedKey: null }; }
}

export function saveSettings(){
  try {
    if (state.settings.autoSave) {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
    }
  } catch (e){ Logger.warn('Storage save fail', e); }
}

export function setApiKeyPreference(shouldSave, key){
  try {
    if (shouldSave && key) localStorage.setItem(STORAGE_KEYS.apikey, key);
    else localStorage.removeItem(STORAGE_KEYS.apikey);
  } catch (e){ Logger.warn('API key save fail', e); }
}

export function getApiKey(){
  try { return localStorage.getItem(STORAGE_KEYS.apikey) || ''; }
  catch { return ''; }
}

export function getState(){ return state; }
export function getHistory(){ return state.conversationHistory; }
export function addMessageToHistory(message){ state.conversationHistory.push(message); }

export function setImages(imgs){ state.images = imgs || []; }
export function getImages(){ return state.images; }

export function updateSettings(partial){ state.settings = { ...state.settings, ...partial }; saveSettings(); }
export function getPrompts(){
  const persona = state.settings.persona || DEFAULTS.persona;
  const analysis = state.settings.analysis || DEFAULTS.analysis;
  return { persona, analysis };
}


