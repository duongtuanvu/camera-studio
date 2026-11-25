import {mkdir,copyFile,readdir,readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const root='public/runtime-v2',nm='node_modules';
async function copy(source,dest){const target=join(root,dest);await mkdir(join(target,'..'),{recursive:true});await copyFile(source,target);}
await copy(join(nm,'zxing-wasm/dist/reader/zxing_reader.wasm'),'zxing-3.1.7/zxing_reader.wasm');
const ort=join(nm,'onnxruntime-web/dist');
for(const file of ['ort.wasm.min.js','ort.webgpu.min.js','ort-wasm-simd-threaded.wasm','ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.jsep.wasm','ort-wasm-simd-threaded.jsep.mjs'])await copy(join(ort,file),'ort/'+file);
const vision=join(nm,'@mediapipe/tasks-vision/wasm');
for(const f of await readdir(vision))if(/\.(wasm|js)$/.test(f))await copy(join(vision,f),'vision/'+f);
await copy(join(nm,'tesseract.js/dist/worker.min.js'),'ocr/worker.min.js');
const core=join(nm,'tesseract.js-core');
for(const f of await readdir(core))if(/^tesseract-core.*\.wasm(?:\.js)?$/.test(f))await copy(join(core,f),'ocr/core/'+f);
for(const lang of ['eng','vie'])await copy(join(nm,'@tesseract.js-data',lang,'4.0.0_best_int',lang+'.traineddata.gz'),'ocr/lang/'+lang+'.traineddata.gz');
const models=[
 {file:'ssd-mobilenet-int8.onnx',sha:'2b79e6a7fb1ec6a33f332b9b10d82d9de4b7b49dcd26b5946921bb356895c954',urls:['https://huggingface.co/onnxmodelzoo/ssd_mobilenet_v1_12-int8/resolve/main/ssd_mobilenet_v1_12-int8.onnx','https://media.githubusercontent.com/media/onnx/models/main/validated/vision/object_detection_segmentation/ssd-mobilenetv1/model/ssd_mobilenet_v1_12-int8.onnx']},
 {file:'pose-lite.task',sha:'59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a',urls:['https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task','https://huggingface.co/litert-community/MediaPipe-PoseLandmarker-Lite/resolve/main/pose_landmarker_lite.task']}
];
function sha(bytes){return createHash('sha256').update(bytes).digest('hex');}
await mkdir(join(root,'models'),{recursive:true});
await Promise.all(models.map(async m=>{
 const path=join(root,'models',m.file);
 try{if(sha(await readFile(path))===m.sha)return;}catch{}
 for(const url of m.urls)try{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('HTTP '+r.status);const bytes=Buffer.from(await r.arrayBuffer());if(sha(bytes)!==m.sha)throw Error('SHA256 mismatch');await writeFile(path,bytes);console.log('Prepared '+m.file+' ('+bytes.length+' bytes)');return;}catch(e){console.warn(m.file+': '+e.message);}
 // Non-AI tools must remain deployable when model hosts are temporarily unreachable.
 console.warn('Model not bundled: '+m.file+'. Runtime will try the verified upstream download.');
}));
async function check(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=join(dir,f.name);if(f.isDirectory())await check(p);else if((await stat(p)).size>25*1024*1024)throw Error('Cloudflare static asset exceeds 25 MiB: '+p);}}
await check(root);
