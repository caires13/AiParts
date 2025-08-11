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
  return new Promise((resolve, reject)=>{
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
}


