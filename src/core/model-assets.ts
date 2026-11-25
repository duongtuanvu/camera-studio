import {runtimeURL,throwIfAborted} from './modules';
export const poseSources=['https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task','https://huggingface.co/litert-community/MediaPipe-PoseLandmarker-Lite/resolve/main/pose_landmarker_lite.task'];
export async function verifiedModel(file:string,sources:string[],hash:string,signal:AbortSignal):Promise<Uint8Array<ArrayBuffer>>{
 let last='unknown error';
 for(const url of [runtimeURL()+'models/'+file,...sources]){
  throwIfAborted(signal);try{const r=await fetch(url,{signal});if(!r.ok)throw Error('HTTP '+r.status);const b=await r.arrayBuffer();const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');if(digest!==hash)throw Error('Model checksum mismatch');return new Uint8Array(b);}catch(e){last=e instanceof Error?e.message:String(e);}
 }throw Error('Cannot load '+file+': '+last);
}
