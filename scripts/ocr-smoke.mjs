import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createWorker,PSM} from 'tesseract.js';
import {characterErrorRate,assessOCR} from '../src/core/ocr-quality.mjs';
import {selectDocumentPass} from '../src/core/document-ocr.mjs';
const cases=[
 {fixture:'number',language:'eng',profile:'digits',expected:'029893'},
 {fixture:'vietnamese',language:'vie',profile:'document',expected:'Tiếng Việt rõ nét'}
];
for(const c of cases){
 const worker=await createWorker(c.language,1,{langPath:resolve('public/runtime-v2/ocr/lang'),cacheMethod:'none',gzip:true});
 try{
  await worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_LINE,tessedit_char_whitelist:c.profile==='digits'?'0123456789.,':''});
  const bytes=Buffer.from(await readFile(resolve('tests/fixtures',c.fixture+'.b64'),'utf8'),'base64');
  const {data}=await worker.recognize(bytes);
  const review=assessOCR(data,c.profile);
  const cer=characterErrorRate(c.expected,review.text);
  console.log(JSON.stringify({fixture:c.fixture,expected:c.expected,actual:review.text,confidence:review.confidence,cer}));
  assert.equal(cer,0,c.fixture+' OCR mismatch');
  assert.ok(review.valid,c.fixture+' OCR confidence below gate');
 }finally{await worker.terminate();}
}
console.log('OCR WASM smoke tests passed (2/2 synthetic clean fixtures).');

const labelWorker=await createWorker('vie+eng',1,{langPath:resolve('public/runtime-v2/ocr/lang'),cacheMethod:'none',gzip:true});
try{
 const bytes=Buffer.from(await readFile(resolve('tests/fixtures/energy-label.b64'),'utf8'),'base64');
 await labelWorker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK});
 const {data:first}=await labelWorker.recognize(bytes);
 await labelWorker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});
 const {data:second}=await labelWorker.recognize(bytes);
 const result=selectDocumentPass(first,second);
 const text=result.text.replace(/\s+/gu,'').toLowerCase();
 for(const field of ['250l','80w','400kwh'])assert.ok(text.includes(field),'Energy label missing field: '+field+'; OCR: '+result.text);
 console.log('Energy label WASM regression passed: 3/3 selected numeric fields found.');
}finally{await labelWorker.terminate();}
