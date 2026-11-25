import type {Mode,FrameResult} from './modules';
export interface RecordEntry {id:string;mode:Mode;time:number;text:string;value?:number;backend?:string}
const DB='camera-studio';const STORE='results';const LIMIT=500;
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  if(!('indexedDB'in window)){reject(Error('Local history unavailable'));return;}
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{const s=req.result.createObjectStore(STORE,{keyPath:'id'});s.createIndex('time','time');};
  req.onerror=()=>reject(req.error??Error('Cannot open history'));
  req.onblocked=()=>reject(Error('Close other Camera Studio tabs and retry.'));
  req.onsuccess=()=>resolve(req.result);
});}
export async function saveResult(mode:Mode,r:FrameResult){const db=await database();try{await new Promise<void>((resolve,reject)=>{
 const tx=db.transaction(STORE,'readwrite'),s=tx.objectStore(STORE);
 s.put({id:globalThis.crypto?.randomUUID?.()??Date.now()+'-'+Math.random(),mode,time:Date.now(),text:r.text.slice(0,20000),value:r.value,backend:r.backend} satisfies RecordEntry);
 let n=0;const cursor=s.index('time').openCursor(null,'prev');
 cursor.onsuccess=()=>{const c=cursor.result;if(c){if(++n>LIMIT)c.delete();c.continue();}};
 tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error??Error('Cannot save result'));
});}finally{db.close();}}
export async function listResults():Promise<RecordEntry[]>{const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).index('time').getAll();req.onsuccess=()=>resolve((req.result as RecordEntry[]).reverse());req.onerror=()=>reject(req.error);});}finally{db.close();}}
export async function clearResults(){const db=await database();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);});}finally{db.close();}}
export function downloadResults(rows:RecordEntry[],format:'csv'|'json'){const escape=(v:unknown)=>{let s=String(v??'');if(/^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const data=format==='json'?JSON.stringify(rows,null,2):'\uFEFF'+['time,mode,result,value,backend',...rows.map(r=>[new Date(r.time).toISOString(),r.mode,r.text,r.value,r.backend].map(escape).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([data],{type:format==='json'?'application/json':'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='camera-studio-'+new Date().toISOString().slice(0,10)+'.'+format;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
