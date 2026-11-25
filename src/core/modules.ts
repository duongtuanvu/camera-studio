export type Mode='detect'|'count'|'qr'|'barcode'|'ocr'|'color'|'motion'|'pose';
export interface Mark{x:number;y:number;w:number;h:number;label:string}
export interface FrameResult{text:string;marks?:Mark[];points?:{x:number;y:number}[]}
export interface Engine{process(video:HTMLVideoElement):Promise<FrameResult>;dispose():void|Promise<void>;manual?:boolean}
export async function loadEngine(mode:Mode):Promise<Engine>{if(mode==='color'||mode==='motion')return (await import('../modules/pixel')).createPixel(mode);if(mode==='qr'||mode==='barcode')return (await import('../modules/barcode')).createBarcode(mode);if(mode==='ocr')return (await import('../modules/ocr')).createOCR();if(mode==='pose')return (await import('../modules/pose')).createPose();return (await import('../modules/detect')).createDetector(mode);}
