import {throwIfAborted,type Engine,type Options} from '../core/modules';
export async function createOCR(options:Options):Promise<Engine>{
 throwIfAborted(options.signal);
 return (await import('./tesseract-ocr')).createTesseractOCR(options);
}
