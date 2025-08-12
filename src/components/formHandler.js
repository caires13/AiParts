import { DEFAULTS } from '../utils/constants.js';

function createFieldRow(label='', value=''){
  const w = document.createElement('div');
  w.className = 'grid grid-cols-12 gap-2';
  w.innerHTML = `
    <input class="col-span-4 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 field-label" placeholder="Campo (ex.: Descrição)" value="${label}" />
    <input class="col-span-7 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 field-value" placeholder="Valor" value="${value}" />
    <button class="col-span-1 btn" type="button">✕</button>
  `;
  w.querySelector('button').addEventListener('click', ()=> w.remove());
  return w;
}

export function initializeForm(){
  const fieldsEl = document.getElementById('fields');
  resetForm();
  document.getElementById('addField').addEventListener('click', ()=>{
    fieldsEl.appendChild(createFieldRow());
  });
  document.getElementById('resetFields').addEventListener('click', resetForm);
}

export function resetForm(){
  const fieldsEl = document.getElementById('fields');
  fieldsEl.innerHTML = '';
  fieldsEl.appendChild(createFieldRow('Descrição',''));
  fieldsEl.appendChild(createFieldRow('Part Number',''));
  fieldsEl.appendChild(createFieldRow('Máquina/Modelo',''));
}

export function getFormData(){
  const fieldsEl = document.getElementById('fields');
  const labels = fieldsEl.querySelectorAll('.field-label');
  const values = fieldsEl.querySelectorAll('.field-value');
  const fields = [];
  labels.forEach((l,i)=>{
    const label = (l.value||'').trim();
    const val = (values[i].value||'').trim();
    if (label && val) fields.push({label, value: val});
  });
  const apiKey = document.getElementById('apiKey').value || '';
  const model = (document.getElementById('model').value||DEFAULTS.model).trim();
  const maxTokens = Number(document.getElementById('maxTokens').value)||DEFAULTS.maxTokens;
  const temperature = Number(document.getElementById('temperature').value)||DEFAULTS.temperature;
  return { fields, apiKey, model, maxTokens, temperature };
}


