import {createWorker,PSM} from 'tesseract.js';
import {runtimeURL,throwIfAborted,type Engine,type Options} from '../core/modules';
import {cropRect,captureSize,improveContrast,recognizeWithReview} from '../core/ocr-quality.mjs';

export async function createOCR(options:Options):Promise<Engine>{
 const profile=options.ocrProfile??'document';
 const base=runtimeURL()+'ocr/';
 throwIfAborted(options.signal);
 const language=profile==='digits'?'eng':options.language;
 options.progress('Loading OCR '+language+'…');
 let failure:(e:unknown)=>void=()=>{};
 const failed=new Promise<never>((_,reject)=>{failure=reject;});
 const workerPromise=createWorker(language,1,{workerPath:base+'worker.min.js',corePath:base+'core',langPath:base+'lang',workerBlobURL:false,errorHandler:e=>failure(e)});
 const abort=()=>failure(Error('OCR initialization cancelled'));
 options.signal.addEventListener('abort',abort,{once:true});
 let worker:Awaited<typeof workerPromise>;
 try{worker=await Promise.race([workerPromise,failed]);throwIfAborted(options.signal);}
 catch(e){void workerPromise.then(w=>w.terminate()).catch(()=>{});throw e;}
 finally{options.signal.removeEventListener('abort',abort);}
 const canvas=document.createElement('canvas');
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx){await worker.terminate();throw Error('Canvas unavailable');}
 try{
  await worker.setParameters({tessedit_pageseg_mode:profile==='digits'?PSM.SINGLE_LINE:PSM.AUTO,tessedit_char_whitelist:profile==='digits'?'0123456789.,':''});
  throwIfAborted(options.signal);
 }catch(e){await worker.terminate();throw e;}
 let closed=false;
 async function read(){throwIfAborted(options.signal);const r=await worker.recognize(canvas);throwIfAborted(options.signal);return {text:r.data.text,confidence:r.data.confidence};}
 return {
  manual:true,backend:'Tesseract WASM',
  async process(video){
   if(closed)throw Error('OCR engine closed');
   throwIfAborted(options.signal);
   const region=cropRect(video.videoWidth,video.videoHeight,profile);
   const size=captureSize(region.width,region.height,profile);
   canvas.width=size.width;canvas.height=size.height;
   ctx.drawImage(video,region.x,region.y,region.width,region.height,0,0,size.width,size.height);
   const preview=canvas.toDataURL('image/jpeg',.75);
   const review=await recognizeWithReview(profile,read,async()=>{
    throwIfAborted(options.signal);
    const image=ctx.getImageData(0,0,canvas.width,canvas.height);
    if(!improveContrast(image.data))return null;
    ctx.putImageData(image,0,0);
    return read();
   });
   return {text:review.text||'Không tìm thấy chữ',confidence:review.confidence,valid:review.valid,warning:review.warning,preview,backend:'Tesseract WASM'};
  },
  async dispose(){if(closed)return;closed=true;try{await worker.terminate();}finally{canvas.width=0;canvas.height=0;}}
 };
}
