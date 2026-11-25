import {runtimeURL,type Engine} from '../core/modules';
import {selectBarcodeResult} from '../core/upstream-results.mjs';
import type {ReaderOptions} from 'zxing-wasm/reader';
type Reader=typeof import('zxing-wasm/reader');
let ready:Promise<Reader>|undefined;
function initReader():Promise<Reader>{
 if(!ready)ready=(async()=>{const reader=await import('zxing-wasm/reader');const wasm=runtimeURL()+'zxing-3.1.7/zxing_reader.wasm';await reader.prepareZXingModule({overrides:{locateFile:(path,prefix)=>path.endsWith('.wasm')?wasm:prefix+path},fireImmediately:true});return reader;})().catch(e=>{ready=undefined;throw e;});
 return ready;
}
async function loadReader():Promise<Reader>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([initReader(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Barcode WASM load timeout')),12000);})]);}finally{clearTimeout(timer);}}
export async function createBarcode(mode:'qr'|'barcode'):Promise<Engine>{
 let reader:Reader|null;
 try{reader=await loadReader();}catch(e){console.warn('ZXing WASM initialization fallback',e);return (await import('./barcode-legacy')).createLegacyBarcode(mode);}
 const formats:ReaderOptions['formats']=mode==='qr'?['QRCode']:['EAN13','EAN8','UPCA','UPCE','Code128','Code39','Code93','ITF','Codabar'];
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('Canvas unavailable');
 let closed=false,fallback:Engine|null=null;
 const backend='ZXing-C++ WASM';
 return {backend,async process(video){
  if(closed)throw Error('Barcode engine closed');
  if(reader){
   try{const scale=Math.min(1,1280/Math.max(video.videoWidth,video.videoHeight)),w=Math.max(1,Math.round(video.videoWidth*scale)),h=Math.max(1,Math.round(video.videoHeight*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.drawImage(video,0,0,w,h);
    const results=await reader.readBarcodes(ctx.getImageData(0,0,w,h),{formats,tryHarder:true,maxNumberOfSymbols:3});
    if(closed)throw Error('Barcode engine closed');
    return selectBarcodeResult(results,mode,backend)??{text:'Align a code inside the frame',valid:false,backend};
   }catch(e){if(closed)throw e;console.warn('ZXing WASM frame fallback',e);reader=null;}
  }
  if(!fallback){const next=await (await import('./barcode-legacy')).createLegacyBarcode(mode);if(closed){await next.dispose();throw Error('Barcode engine closed');}fallback=next;}
  return fallback.process(video);
 },async dispose(){if(closed)return;closed=true;canvas.width=0;canvas.height=0;await fallback?.dispose();}};
}
