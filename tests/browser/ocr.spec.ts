import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('Tesseract production adapter reads a synthetic Vietnamese document and odometer number',async({page})=>{
 const fixtures=await Promise.all([{file:'vietnamese',profile:'document',expected:'Tiếng Việt rõ nét'},{file:'number',profile:'digits',expected:'029893'}].map(async c=>({...c,base64:(await readFile('tests/fixtures/'+c.file+'.b64','utf8')).trim()})));
 await page.goto('/');
 for(const fixture of fixtures){
  const result=await page.evaluate(async c=>{
   const source='/src/modules/ocr.ts';
   const {createOCR}=await import(source);
   const img=new Image();img.src='data:image/png;base64,'+c.base64;await img.decode();
   // Deterministic frame source: the production adapter accepts drawImage-compatible frames.
   const frame=document.createElement('canvas');
   frame.width=1000;frame.height=c.profile==='digits'?1000:600;
   Object.defineProperties(frame,{videoWidth:{value:frame.width},videoHeight:{value:frame.height}});
   const ctx=frame.getContext('2d')!;ctx.fillStyle='white';ctx.fillRect(0,0,frame.width,frame.height);
   const maxW=frame.width*.7,maxH=frame.height*(c.profile==='digits'?.115:.65);
   const scale=Math.min(maxW/img.width,maxH/img.height),w=img.width*scale,h=img.height*scale;
   ctx.drawImage(img,(frame.width-w)/2,(frame.height-h)/2,w,h);
   const controller=new AbortController();
   const engine=await createOCR({signal:controller.signal,progress:()=>{},language:'eng+vie',quality:'lite',confidence:.55,ocrProfile:c.profile});
   try{const r=await engine.process(frame);return {text:r.text,valid:r.valid,confidence:r.confidence,backend:r.backend};}
   finally{await engine.dispose();}
  },fixture);
  console.log(fixture.file,result);
  expect(result.backend).toContain('Tesseract');
  expect(result.text.normalize('NFC').replace(/\s+/gu,' ').trim()).toBe(fixture.expected);
  expect(result.valid).toBe(true);
 }
});
