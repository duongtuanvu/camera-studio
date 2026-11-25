import {messageOf,throwIfAborted,type Engine,type Options} from '../core/modules';
export async function createOCR(options:Options):Promise<Engine>{
 const choice=options.ocrEngine??'auto';
 throwIfAborted(options.signal);
 if(choice==='paddle')return (await import('./paddle-ocr')).createPaddleOCR(options);
 try{return await (await import('./tesseract-ocr')).createTesseractOCR(options);}
 catch(e){throwIfAborted(options.signal);if(choice==='tesseract'||options.ocrProfile==='digits')throw e;console.warn('Tesseract init fallback:',messageOf(e));options.progress('Tesseract chưa sẵn sàng · tải PaddleOCR…');}
 return (await import('./paddle-ocr')).createPaddleOCR(options);
}
