import {readdir,stat,readFile} from 'node:fs/promises';import {join} from 'node:path';
async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=join(dir,f.name);if(f.isDirectory())await walk(p);else if((await stat(p)).size>25*1024*1024)throw Error('Asset exceeds Cloudflare limit: '+p);}}
await walk('dist');
for(const p of ['index.html','sw.js','vision-worker-v2.js','runtime-v2/ort/ort.wasm.min.js','runtime-v2/ort/ort-wasm-simd-threaded.wasm','runtime-v2/ocr/worker.min.js','runtime-v2/ocr/lang/eng.traineddata.gz','runtime-v2/ocr/lang/vie.traineddata.gz'])await stat(join('dist',p));
const html=await readFile('dist/index.html','utf8');if(!html.includes('assets/'))throw Error('Expected built Vite assets');
console.log('Static deployment checks passed.');
