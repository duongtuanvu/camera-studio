import {BrowserMultiFormatReader,BrowserQRCodeReader} from '@zxing/browser';
import {NotFoundException,ChecksumException,FormatException} from '@zxing/library';
import type {Engine} from '../core/modules';
type NativeDetector={detect(source:HTMLVideoElement):Promise<{rawValue:string}[]>};
type NativeCtor={new(options:{formats:string[]}):NativeDetector;getSupportedFormats():Promise<string[]>};
export async function createBarcode(mode:'qr'|'barcode'):Promise<Engine>{
 const api=(globalThis as unknown as {BarcodeDetector?:NativeCtor}).BarcodeDetector;
 let native:NativeDetector|undefined;
 if(api)try{const formats=(await api.getSupportedFormats()).filter(f=>mode==='qr'?f==='qr_code':f!=='qr_code');if(formats.length)native=new api({formats});}catch{/* ZXing fallback */}
 const reader=mode==='qr'?new BrowserQRCodeReader():new BrowserMultiFormatReader();
 const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('2D canvas unavailable');
 return {backend:native?'Native / ZXing':'ZXing',async process(video){
   if(native){try{const codes=await native.detect(video);if(codes.length)return {text:codes[0].rawValue,valid:true,backend:'Native barcode'};}catch{native=undefined;}}
   const scale=Math.min(1,960/Math.max(video.videoWidth,video.videoHeight)),w=Math.max(1,Math.round(video.videoWidth*scale)),h=Math.max(1,Math.round(video.videoHeight*scale));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   ctx.drawImage(video,0,0,w,h);
   try{return {text:reader.decodeFromCanvas(canvas).getText(),valid:true,backend:'ZXing'};}
   catch(e){const name=(e as {name?:string})?.name;if(e instanceof NotFoundException||e instanceof ChecksumException||e instanceof FormatException||['NotFoundException','ChecksumException','FormatException'].includes(name??''))return {text:'Align a code inside the frame',valid:false,backend:'ZXing'};throw e;}
 },dispose(){canvas.width=0;canvas.height=0;}};
}
