import {messageOf,throwIfAborted,type Engine,type Options} from '../core/modules';
export async function createOCR(options:Options):Promise<Engine>{
 const choice=options.ocrEngine??'auto';
 throwIfAborted(options.signal);
 if(choice!=='tesseract'){
  try{return await (await import('./paddle-ocr')).createPaddleOCR(options);}
  catch(e){throwIfAborted(options.signal);if(choice==='paddle')throw e;console.warn('PaddleOCR init fallback:',messageOf(e));options.progress('PaddleOCR chưa sẵn sàng · tải Tesseract…');}
 }
 return (await import('./tesseract-ocr')).createTesseractOCR(options);
}
