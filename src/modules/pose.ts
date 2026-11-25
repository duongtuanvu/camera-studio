import {FilesetResolver,PoseLandmarker} from '@mediapipe/tasks-vision';
import {runtimeURL,throwIfAborted,type Engine,type Options} from '../core/modules';
import {poseSources,verifiedModel} from '../core/model-assets';
export async function createPose(options:Options):Promise<Engine>{
 options.progress('Loading pose model…');const buffer=await verifiedModel('pose-lite.task',poseSources,'59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a',options.signal);
 throwIfAborted(options.signal);const vision=await FilesetResolver.forVisionTasks(runtimeURL()+'vision');
 const pose=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetBuffer:buffer,delegate:'CPU'},runningMode:'VIDEO',numPoses:1});if(options.signal.aborted){pose.close();throw Error('Cancelled');}
 return{backend:'MediaPipe CPU',async process(video){const r=pose.detectForVideo(video,performance.now());return {text:r.landmarks.length?'Pose detected':'Step into the frame',points:r.landmarks[0]?.filter(p=>(p.visibility??1)>.45).map(p=>({x:p.x,y:p.y})),valid:r.landmarks.length>0,backend:'MediaPipe CPU'};},dispose(){pose.close();}};
}
