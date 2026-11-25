import type {Engine,FrameResult} from '../core/modules';
import {colorAtCenter,motionScore} from '../core/pixels.mjs';
export function createPixel(mode:'color'|'motion'):Engine{
 let worker:Worker|undefined,closed=false,id=0,previous:Uint8Array|undefined;
 let rejectPending:((reason:Error)=>void)|undefined;
 const canvas=document.createElement('canvas');canvas.width=160;canvas.height=120;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas unavailable');
 if(typeof OffscreenCanvas!=='undefined'&&typeof createImageBitmap==='function'&&typeof Worker!=='undefined')try{worker=new Worker(new URL('../core/pixel.worker.ts',import.meta.url),{type:'module'});}catch{/* use main thread */}
 function local(video:HTMLVideoElement):FrameResult{ctx!.drawImage(video,0,0,160,120);const {data}=ctx!.getImageData(0,0,160,120);if(mode==='color')return {text:colorAtCenter(data,160,120),backend:'Canvas',valid:true};const r=motionScore(data,previous);previous=r.gray;return {text:Math.round(r.score*100)+'% movement',value:Math.round(r.score*100),backend:'Canvas',valid:true};}
 return {async process(video){
   if(closed)throw Error('Engine closed');
   if(worker){try{const w=worker;const bitmap=await createImageBitmap(video, {resizeWidth:160,resizeHeight:120});if(closed){bitmap.close();throw Error('Engine closed');}
   const result=await new Promise<FrameResult>((resolve,reject)=>{const current=++id;const clear=()=>{clearTimeout(timer);rejectPending=undefined;w.onmessage=null;w.onerror=null;};const fail=(e:Error)=>{clear();reject(e);};const timer=setTimeout(()=>fail(Error('Pixel worker timeout')),2500);rejectPending=fail;w.onmessage=e=>{if(e.data.id!==current)return;clear();e.data.error?reject(Error(e.data.error)):resolve({text:e.data.text,backend:'Web Worker',valid:true});};w.onerror=()=>fail(Error('Pixel worker failed'));try{w.postMessage({id:current,mode,bitmap},[bitmap]);}catch(e){bitmap.close();fail(e instanceof Error?e:Error(String(e)));}});return result;
   }catch(e){worker?.terminate();worker=undefined;if(closed)throw e;}}
   return local(video);
 },dispose(){closed=true;rejectPending?.(Error('Engine closed'));worker?.terminate();canvas.width=0;canvas.height=0;}};
}
