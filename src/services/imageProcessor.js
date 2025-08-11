import { DEFAULTS } from '../utils/constants.js';

function createWorker(){
  const workerCode = () => {
    self.onmessage = async (e) => {
      const { files } = e.data;
      function toBase64(uint8){
        let bin='';
        const len = uint8.byteLength;
        for (let i=0;i<len;i++){ bin += String.fromCharCode(uint8[i]); }
        return btoa(bin);
      }
      try {
        const out = [];
        for (let i=0; i<files.length; i++){
          const f = files[i];
          const buf = await f.arrayBuffer();
          const base64 = toBase64(new Uint8Array(buf));
          const dataUrl = `data:${f.type};base64,${base64}`;
          out.push({ idx: i, name: f.name, mime: f.type, dataUrl });
          self.postMessage({ type: 'progress', current: i+1, total: files.length });
        }
        self.postMessage({ type: 'done', images: out });
      } catch (err) {
        self.postMessage({ type: 'error', message: err?.message || 'Erro no worker' });
      }
    };
  };
  const code = workerCode.toString();
  const blob = new Blob([`(${code})()`], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const w = new Worker(url);
  w._revoke = () => URL.revokeObjectURL(url);
  return w;
}

function fallbackProcess(files, onProgress){
  return new Promise((resolve, reject)=>{
    let i = 0; const images = [];
    const next = ()=>{
      if (i>=files.length) return resolve(images);
      const f = files[i++];
      const reader = new FileReader();
      reader.onerror = ()=> reject(new Error('Erro ao ler imagem.'));
      reader.onload = ()=>{
        images.push({ idx: i-1, name: f.name, mime: f.type, dataUrl: reader.result });
        onProgress && onProgress(i, files.length);
        next();
      };
      reader.readAsDataURL(f);
    };
    next();
  });
}

export async function processImages(files, onProgress){
  const arr = Array.from(files||[]);
  if (!arr.length) return [];
  let resolved = false;
  const base = await new Promise((resolve, reject)=>{
    const w = createWorker();
    const timer = setTimeout(()=>{
      if (resolved) return;
      try { w.terminate(); w._revoke && w._revoke(); } catch {}
      fallbackProcess(arr, onProgress).then((images)=>{ resolved = true; resolve(images); }).catch(reject);
    }, DEFAULTS.timeouts.workerMs);

    w.onmessage = (e)=>{
      const { type } = e.data || {};
      if (type === 'progress'){
        onProgress && onProgress(e.data.current, e.data.total);
      } else if (type === 'done'){
        clearTimeout(timer);
        try { w.terminate(); w._revoke && w._revoke(); } catch {}
        resolved = true; resolve(e.data.images || []);
      } else if (type === 'error'){
        clearTimeout(timer);
        try { w.terminate(); w._revoke && w._revoke(); } catch {}
        fallbackProcess(arr, onProgress).then((images)=>{ resolved = true; resolve(images); }).catch(reject);
      }
    };
    w.onerror = ()=>{
      clearTimeout(timer);
      try { w.terminate(); w._revoke && w._revoke(); } catch {}
      fallbackProcess(arr, onProgress).then((images)=>{ resolved = true; resolve(images); }).catch(reject);
    };

    w.postMessage({ files: arr });
  });

  // Compress/resize to reduce payload size before sending to API
  const optimized = [];
  for (const item of base){
    try {
      const small = await downscaleDataUrl(item.dataUrl, 1280, 0.8, 1_500_000);
      optimized.push({ ...item, dataUrl: small });
    } catch {
      optimized.push(item);
    }
  }
  return optimized;
}

async function downscaleDataUrl(dataUrl, maxDim = 1280, initialQuality = 0.8, targetMaxBytes = 1_500_000){
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Prefer webp for better compression
  let quality = initialQuality;
  let out = canvas.toDataURL('image/webp', quality);
  let bytes = estimateBase64Size(out);
  while (bytes > targetMaxBytes && quality > 0.4){
    quality -= 0.1;
    out = canvas.toDataURL('image/webp', quality);
    bytes = estimateBase64Size(out);
  }
  return out;
}

function estimateBase64Size(dataUrl){
  try {
    const base64 = (dataUrl.split(',')[1]||'');
    return Math.ceil((base64.length * 3) / 4); // rough bytes
  } catch { return dataUrl.length; }
}

function loadImage(src){
  return new Promise((resolve, reject)=>{
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}


