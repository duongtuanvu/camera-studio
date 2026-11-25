import {PaddleOCR} from '@paddleocr/paddleocr-js';
import {throwIfAborted,abortError,type Engine,type Options} from '../core/modules';
import {cropRect,captureSize,improveContrast,recognizeWithReview} from '../core/ocr-quality.mjs';
import {paddleData} from '../core/upstream-results.mjs';

async function initialize(signal:AbortSignal){
 throwIfAborted(signal);
 // Official SDK presets; keep its matching ORT runtime resolution (do not point it at SSD's older ORT WASM).
 const pending=PaddleOCR.create({textDetectionModelName:'PP-OCRv6_tiny_det',textRecognitionModelName:'PP-OCRv6_tiny_rec',worker:true,ortOptions:{backend:'wasm',numThreads:1,simd:true}});
 let timeout:ReturnType<typeof setTimeout>|undefined;
 let cancel=()=>{};
 const limit=new Promise<never>((_,reject)=>{cancel=()=>reject(abortError());signal.addEventListener('abort',cancel,{once:true});timeout=setTimeout(()=>reject(Error('PaddleOCR model load timeout')),45000);});
 try{const instance=await Promise.race([pending,limit]);throwIfAborted(signal);return instance;}
 catch(e){void pending.then(instance=>instance.dispose()).catch(()=>{});throw e;}
 finally{clearTimeout(timeout);signal.removeEventListener('abort',cancel);}
}
export async function createPaddleOCR(options:Options):Promise<Engine>{
 const profile=options.ocrProfile??'document';
 options.progress('Loading PaddleOCR v6 Tiny (beta)…');
 const instance=await initialize(options.signal);
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx){await instance.dispose();throw Error('Canvas unavailable');}
 let closed=false;
 const backend='PaddleOCR v6 Tiny / WASM';
 async function read(){
  throwIfAborted(options.signal);
  const [result]=await instance.predict(canvas,{textRecScoreThresh:0});
  throwIfAborted(options.signal);
  return paddleData(result?.items);
 }
 return {manual:true,backend,async process(video){
  if(closed)throw Error('PaddleOCR engine closed');throwIfAborted(options.signal);
  const region=cropRect(video.videoWidth,video.videoHeight,profile),size=captureSize(region.width,region.height,profile);
  canvas.width=size.width;canvas.height=size.height;
  ctx.drawImage(video,region.x,region.y,region.width,region.height,0,0,size.width,size.height);
  const preview=canvas.toDataURL('image/jpeg',.75);
  const review=await recognizeWithReview(profile,read,async()=>{throwIfAborted(options.signal);const image=ctx.getImageData(0,0,canvas.width,canvas.height);if(!improveContrast(image.data))return null;ctx.putImageData(image,0,0);return read();});
  return {text:review.text||'Không tìm thấy chữ',valid:review.valid,confidence:review.confidence,warning:review.warning,preview,backend};
 },async dispose(){if(closed)return;closed=true;try{await instance.dispose();}finally{canvas.width=0;canvas.height=0;}}};
}
