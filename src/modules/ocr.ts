import {createWorker} from 'tesseract.js';
import {runtimeURL,throwIfAborted,type Engine,type Options} from '../core/modules';
export async function createOCR(options:Options):Promise<Engine>{
 const base=runtimeURL()+'ocr/';throwIfAborted(options.signal);options.progress('Loading OCR '+options.language+'…');
 let failure:(e:unknown)=>void=()=>{};
 const failed=new Promise<never>((_,reject)=>{failure=reject;});
 const workerPromise=createWorker(options.language,1,{workerPath:base+'worker.min.js',corePath:base+'core',langPath:base+'lang',workerBlobURL:false,errorHandler:e=>failure(e)});
 const abort=()=>failure(Error('OCR initialization cancelled'));options.signal.addEventListener('abort',abort,{once:true});
 let worker:Awaited<typeof workerPromise>;
 try{worker=await Promise.race([workerPromise,failed]);throwIfAborted(options.signal);}catch(e){void workerPromise.then(w=>w.terminate()).catch(()=>{});throw e;}finally{options.signal.removeEventListener('abort',abort);}
 const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');if(!ctx){await worker.terminate();throw Error('Canvas unavailable');}
 return {manual:true,backend:'Tesseract WASM',async process(video){
  const scale=Math.min(1,1600/Math.max(video.videoWidth,video.videoHeight));canvas.width=Math.max(1,Math.round(video.videoWidth*scale));canvas.height=Math.max(1,Math.round(video.videoHeight*scale));ctx.drawImage(video,0,0,canvas.width,canvas.height);const r=await worker.recognize(canvas);const text=r.data.text.trim();return {text:text||'No text found',valid:!!text,backend:'Tesseract WASM'};
 },async dispose(){await worker.terminate();canvas.width=0;canvas.height=0;}};
}
