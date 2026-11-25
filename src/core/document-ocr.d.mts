import type {OCRProfile,OCRData} from './ocr-quality.mjs';
export function documentScanSize(width:number,height:number):{width:number;height:number};
export function grayscaleRGBA(data:Uint8ClampedArray):Uint8ClampedArray;
export function selectDocumentPass(first:OCRData,second:OCRData):{text:string;confidence:number;valid:boolean;warning:string};
export function reviewableOCR(text:string,profile:OCRProfile):boolean;
export function approvedOCR(text:string,profile:OCRProfile,confirmed:boolean):boolean;
