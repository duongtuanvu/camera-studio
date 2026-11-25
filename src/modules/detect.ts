import {runtimeURL,throwIfAborted,messageOf,type Engine,type Mark,type Options} from '../core/modules';
type Reply={id:number;ok:boolean;error?:string;marks?:Mark[];backend?:string};
function summarize(marks:Mark[],mode:'detect'|'count',backend:string){return {text:mode==='count'?marks.length+' visible objects':marks.map(m=>m.label).join(', ')||'No objects detected',marks,value:marks.length,valid:mode==='count'||marks.length>0,backend};}
async function workerDetector(mode:'detect'|'count',options:Options,backend:'webgpu'|'wasm'):Promise<Engine>{
 if(typeof Worker==='undefined'||typeof createImageBitmap!=='function'||typeof OffscreenCanvas==='undefined')throw Error('Dedicated vision workers are not supported');
 const w=new Worker(new URL('vision-worker-v2.js',document.baseURI));let id=0,closed=false;let pending:((e:Error)=>void)|undefined;let name='ONNX';
 function dispose(){if(closed)return;closed=true;options.signal.removeEventListener('abort',dispose);pending?.(Error('Detector cancelled'));w.terminate();}
 options.signal.addEventListener('abort',dispose,{once:true});
 function request(data:Record<string,unknown>,timeout:number,bitmap?:ImageBitmap):Promise<Reply>{return new Promise((resolve,reject)=>{
   if(closed){bitmap?.close();reject(Error('Detector closed'));return;}
   const requestId=++id;const cleanup=()=>{clearTimeout(timer);pending=undefined;w.onmessage=null;w.onerror=null;w.onmessageerror=null;};
   const fail=(e:Error)=>{cleanup();reject(e);};const timer=setTimeout(()=>fail(Error(data.kind==='init'?'Model initialization timed out':'Inference timed out')),timeout);pending=fail;
   w.onmessage=(event:MessageEvent<Reply>)=>{if(event.data.id!==requestId)return;cleanup();event.data.ok?resolve(event.data):reject(Error(event.data.error||'Detector worker error'));};
   w.onerror=e=>fail(Error(e.message||'Detector worker could not start'));w.onmessageerror=()=>fail(Error('Worker message could not be decoded'));
   try{w.postMessage({id:requestId,...data},bitmap?[bitmap]:[]);}catch(e){bitmap?.close();fail(Error(messageOf(e)));}
 });}
 try{throwIfAborted(options.signal);const init=await request({kind:'init',base:runtimeURL(),backend,confidence:options.confidence},90000);name=init.backend||name;}catch(e){dispose();throw e;}
 return {backend:name,async process(video){
  const bitmap=await createImageBitmap(video,{resizeWidth:300,resizeHeight:300,resizeQuality:'low'});const r=await request({kind:'frame',bitmap},15000,bitmap);return summarize(r.marks??[],mode,name);
 },dispose};
}
async function legacy(mode:'detect'|'count',options:Options):Promise<Engine>{
 const tf=await import('@tensorflow/tfjs');const {load}=await import('@tensorflow-models/coco-ssd');
 throwIfAborted(options.signal);let backend='WebGL';try{if(options.quality==='lite'||!await tf.setBackend('webgl'))throw Error('CPU fallback');}catch{await tf.setBackend('cpu');backend='CPU';}
 await tf.ready();const model=await load({base:'lite_mobilenet_v2'});if(options.signal.aborted){model.dispose();throw Error('Cancelled');}
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx){model.dispose();throw Error('Canvas unavailable');}
 const name='TFJS '+backend;
 return{backend:name,async process(video){const scale=Math.min(1,(options.quality==='lite'?320:480)/Math.max(video.videoWidth,video.videoHeight)),w=Math.max(1,Math.round(video.videoWidth*scale)),h=Math.max(1,Math.round(video.videoHeight*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.drawImage(video,0,0,w,h);const predictions=await model.detect(canvas,30,options.confidence);return summarize(predictions.map(p=>({x:p.bbox[0]/w,y:p.bbox[1]/h,w:p.bbox[2]/w,h:p.bbox[3]/h,label:p.class,score:p.score})),mode,name);},dispose(){model.dispose();canvas.width=0;canvas.height=0;}};
}
export async function createDetector(mode:'detect'|'count',options:Options):Promise<Engine>{
 const gpu=options.quality==='auto'&&'gpu'in navigator&&!/iPhone|iPad|iPod/.test(navigator.userAgent)&&!(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const errors:string[]=[];
 for(const backend of (gpu?['webgpu','wasm']:['wasm']) as ('webgpu'|'wasm')[]){throwIfAborted(options.signal);options.progress('Loading ONNX '+backend.toUpperCase()+'…');try{return await workerDetector(mode,options,backend);}catch(e){errors.push(backend+': '+messageOf(e));}}
 throwIfAborted(options.signal);options.progress('Loading compatibility detector…');
 try{return await legacy(mode,options);}catch(e){throw Error('Detector initialization failed. '+[...errors,'TFJS: '+messageOf(e)].join(' | '));}
}
