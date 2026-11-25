import type {OCRProfile} from './ocr-quality.mjs';
export type Mode='detect'|'count'|'qr'|'barcode'|'ocr'|'color'|'motion'|'pose';
export interface Mark {x:number;y:number;w:number;h:number;label:string;score?:number;trackId?:number}
export interface FrameResult {text:string;marks?:Mark[];points?:{x:number;y:number}[];value?:number;valid?:boolean;backend?:string;confidence?:number;warning?:string;preview?:string}
export interface Engine {process(video:HTMLVideoElement):Promise<FrameResult>;dispose():void|Promise<void>;manual?:boolean;backend?:string;reset?():void}
export interface Options {signal:AbortSignal;progress:(message:string)=>void;language:'eng'|'vie'|'eng+vie';quality:'auto'|'lite';confidence:number;ocrProfile?:OCRProfile}
export const runtimeURL=()=>new URL('runtime-v2/',document.baseURI).href;
export async function loadEngine(mode:Mode,options:Options):Promise<Engine>{
  if(mode==='color'||mode==='motion')return (await import('../modules/pixel')).createPixel(mode);
  if(mode==='qr'||mode==='barcode')return (await import('../modules/barcode')).createBarcode(mode);
  if(mode==='ocr')return (await import('../modules/ocr')).createOCR(options);
  if(mode==='pose')return (await import('../modules/pose')).createPose(options);
  return (await import('../modules/detect')).createDetector(mode,options);
}
export function messageOf(e:unknown):string{return e instanceof Error?e.message:typeof e==='string'?e:String(e);}
export function abortError(){return new DOMException('Cancelled','AbortError');}
export function throwIfAborted(signal:AbortSignal){if(signal.aborted)throw abortError();}
