import {useEffect,useRef,useState} from 'react';
import {Aperture,ScanLine,Box,QrCode,ScanBarcode,FileText,Pipette,Activity,PersonStanding,ArrowLeft,SwitchCamera,RefreshCw,Copy,ShieldCheck,Camera,History,Download,Trash2,Save,Settings2,AlertCircle,RotateCcw} from 'lucide-react';
import {openCamera,stopCamera,cameraError,type CameraFacing} from './core/camera';
import {loadEngine,messageOf,type Engine,type Mode,type FrameResult,type Options} from './core/modules';
import {LineTracker,type Direction} from './core/tracker.mjs';
import {cropRect,type OCRProfile} from './core/ocr-quality.mjs';
import {saveResult,listResults,clearResults,downloadResults,type RecordEntry} from './core/history';
const modules=[
 {id:'count',name:'Object Counter',desc:'Đếm vật thể qua đường ảo',icon:ScanLine,color:'#72e3b1'},
 {id:'detect',name:'Object Detection',desc:'Nhận diện vật thể trực tiếp',icon:Box,color:'#83b4ff'},
 {id:'qr',name:'QR Scanner',desc:'Quét mã QR',icon:QrCode,color:'#c0a5ff'},
 {id:'barcode',name:'Barcode Scanner',desc:'Đọc mã vạch sản phẩm',icon:ScanBarcode,color:'#f8c579'},
 {id:'ocr',name:'OCR Scanner',desc:'Trích xuất chữ Việt / Anh',icon:FileText,color:'#ff9e91'},
 {id:'color',name:'Color Picker',desc:'Lấy mã màu trực tiếp',icon:Pipette,color:'#79d9e6'},
 {id:'motion',name:'Motion Detector',desc:'Đo mức thay đổi hình ảnh',icon:Activity,color:'#e7a4d9'},
 {id:'pose',name:'Pose Detection',desc:'Nhận diện điểm khớp cơ thể',icon:PersonStanding,color:'#a8d8a0'}
] as const;
function getModule(mode:Mode){return modules.find(m=>m.id===mode)!;}
async function refreshApp(){
 try{if('serviceWorker'in navigator){const registration=await navigator.serviceWorker.getRegistration(document.baseURI);if(registration?.scope===new URL('.',document.baseURI).href)await registration.unregister();}
 if('caches'in window)for(const key of await caches.keys())if(key.startsWith('camera-studio-shell-'))await caches.delete(key);}catch(e){console.warn('Cache reset:',e);}finally{location.reload();}
}
export default function App(){
 const [screen,setScreen]=useState<Mode|'history'|null>(null);
 return <main className="shell"><header className="brand"><span className="logo"><Aperture size={26}/></span><div><strong>Camera Studio</strong><small>YOUR POCKET VISION TOOLKIT</small></div><span className="private"><ShieldCheck size={15}/> Local</span></header>
 {screen==='history'?<HistoryScreen onBack={()=>setScreen(null)}/>:screen?<Session key={screen} mode={screen} onBack={()=>setScreen(null)}/>:<>
 <section className="hero"><span className="eyebrow">SMART CAMERA · 08 TOOLS</span><h1>See more.<br/><em>Do more.</em></h1><p>Biến camera điện thoại thành bộ công cụ thông minh. Chọn một công cụ để bắt đầu.</p><button className="secondary history-link" onClick={()=>setScreen('history')}><History size={18}/> Lịch sử & báo cáo</button></section>
 <section className="grid" aria-label="Camera tools">{modules.map(m=><button className="tile" key={m.id} onClick={()=>setScreen(m.id)}><span className="tile-icon" style={{color:m.color,background:m.color+'17'}}><m.icon size={25}/></span><strong>{m.name}</strong><small>{m.desc}</small><span className="arrow">↗</span></button>)}</section>
 <footer>v0.2.1 · Không gửi hình ảnh camera lên máy chủ. Một số module tải mô hình khi sử dụng lần đầu.</footer></>}</main>;
}
function HistoryScreen({onBack}:{onBack:()=>void}){
 const [rows,setRows]=useState<RecordEntry[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[confirm,setConfirm]=useState(false),[filter,setFilter]=useState<Mode|'all'>('all');
 useEffect(()=>{let alive=true;listResults().then(r=>{if(alive)setRows(r);}).catch(e=>{if(alive)setError(messageOf(e));}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[]);
 const visible=filter==='all'?rows:rows.filter(r=>r.mode===filter);
 return <section className="session"><div className="session-head"><button className="icon-btn" aria-label="Quay lại" onClick={onBack}><ArrowLeft/></button><div><h2>Lịch sử & báo cáo</h2><small>{rows.length} kết quả · Lưu trên thiết bị</small></div></div>
 <div className="toolbar"><select aria-label="Lọc công cụ" value={filter} onChange={e=>setFilter(e.target.value as Mode|'all')}><option value="all">Tất cả công cụ</option>{modules.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select><button className="secondary" disabled={!visible.length} onClick={()=>downloadResults(visible,'csv')}><Download size={16}/> CSV</button><button className="secondary" disabled={!visible.length} onClick={()=>downloadResults(visible,'json')}><Download size={16}/> JSON</button></div>
 {loading?<p className="note">Đang tải lịch sử…</p>:error?<p role="alert" className="error-text">{error}</p>:!visible.length?<div className="empty"><History size={34}/><strong>Chưa có kết quả</strong><p>Bấm Lưu kết quả trong màn hình camera.</p></div>:<div className="history-list">{visible.map(r=><article className="history-item" key={r.id}><div><strong>{getModule(r.mode).name}</strong><small>{new Date(r.time).toLocaleString('vi-VN')}</small></div><p>{r.text}</p>{r.backend&&<small>{r.backend}</small>}</article>)}</div>}
 {!!rows.length&&<div className="toolbar">{confirm?<><span className="note">Xóa toàn bộ lịch sử trên thiết bị?</span><button className="danger" onClick={async()=>{try{await clearResults();setRows([]);setConfirm(false);}catch(e){setError(messageOf(e));}}}>Xác nhận xóa</button><button className="secondary" onClick={()=>setConfirm(false)}>Hủy</button></>:<button className="secondary" onClick={()=>setConfirm(true)}><Trash2 size={16}/> Xóa lịch sử</button>}</div>}</section>;
}
function Session({mode,onBack}:{mode:Mode;onBack:()=>void}){
 const module=getModule(mode),video=useRef<HTMLVideoElement>(null),overlay=useRef<HTMLCanvasElement>(null);
 const tracker=useRef(new LineTracker()),capture=useRef(false),config=useRef<{line:number;direction:Direction}>({line:.5,direction:'down'});
 const [facing,setFacing]=useState<CameraFacing>('environment'),[cameraRetry,setCameraRetry]=useState(0),[toolRetry,setToolRetry]=useState(0);
 const [cameraReady,setCameraReady]=useState(false),[cameraStatus,setCameraStatus]=useState('Đang mở camera…'),[cameraIssue,setCameraIssue]=useState('');
 const [status,setStatus]=useState('Chờ camera'),[toolIssue,setToolIssue]=useState(''),[toolReady,setToolReady]=useState(false);
 const [result,setResult]=useState<FrameResult|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[backend,setBackend]=useState(''),[latency,setLatency]=useState(0),[fps,setFps]=useState(0);
 const [showSettings,setShowSettings]=useState(false),[line,setLine]=useState(.5),[direction,setDirection]=useState<Direction>('down'),[confidence,setConfidence]=useState(.55),[quality,setQuality]=useState<Options['quality']>('auto'),[language,setLanguage]=useState<Options['language']>('eng+vie');
 const [saving,setSaving]=useState(false);
 const [ocrProfile,setOcrProfile]=useState<OCRProfile>('document');
 const [videoSize,setVideoSize]=useState<{width:number;height:number}|null>(null);
 useEffect(()=>{config.current={line,direction};tracker.current.configure(line,direction);},[line,direction]);
 // Camera lifetime is independent of the vision engine. Tool failures do not stop the camera.
 useEffect(()=>{
  let active=true,stream:MediaStream|null=null;const v=video.current!;
  setCameraReady(false);setVideoSize(null);setCameraIssue('');setCameraStatus('Đang mở camera…');
  function updateSize(){if(active&&v.videoWidth&&v.videoHeight)setVideoSize({width:v.videoWidth,height:v.videoHeight});}
  v.addEventListener('loadedmetadata',updateSize);v.addEventListener('resize',updateSize);
  function fail(e:unknown){if(!active)return;setCameraIssue(cameraError(e));setCameraReady(false);setCameraStatus('Camera không khả dụng');stopCamera(stream);stream=null;v.srcObject=null;}
  function visibility(){if(!active||!stream)return;if(document.hidden)v.pause();else if(stream.getVideoTracks().some(t=>t.readyState==='live'))void v.play().catch(fail);else fail(Error('Camera disconnected. Retry to reopen.'));}
  document.addEventListener('visibilitychange',visibility);
  void(async()=>{try{const opened=await openCamera(facing,mode==='ocr'?'detail':'live');if(!active){stopCamera(opened);return;}stream=opened;for(const t of stream.getVideoTracks())t.addEventListener('ended',()=>fail(Error('Camera disconnected. Retry to reopen.')),{once:true});v.srcObject=stream;await v.play();if(!active)return;updateSize();setCameraReady(true);setCameraStatus('Camera live');}catch(e){fail(e);}})();
  return()=>{active=false;document.removeEventListener('visibilitychange',visibility);v.removeEventListener('loadedmetadata',updateSize);v.removeEventListener('resize',updateSize);stopCamera(stream);v.srcObject=null;};
 },[mode,facing,cameraRetry]);
 useEffect(()=>{
  setToolReady(false);setToolIssue('');setResult(null);setBackend('');setLatency(0);setFps(0);setBusy(false);setNotice('');capture.current=false;
  const v=video.current!,c=overlay.current!;c.getContext('2d')?.clearRect(0,0,c.width,c.height);
  if(!cameraReady){setStatus('Chờ camera');return;}
  const controller=new AbortController();let active=true,failed=false,engine:Engine|null=null,running:Promise<void>|null=null;
  let frameId=0,kind:'video'|'raf'='raf',lastStart=-Infinity,lastVideo=-1,lastResult=0,mean=0,meanFps=0;
  let interval=mode==='detect'||mode==='count'||mode==='pose'?(quality==='lite'?330:180):100;
  let inferenceTimeout:ReturnType<typeof setTimeout>|undefined;
  // Reset association after camera/module restart, without inventing crossings.
  tracker.current.clearTracks();
  function cancelFrame(){if(kind==='video')v.cancelVideoFrameCallback?.(frameId);else cancelAnimationFrame(frameId);}
  function dispose(){const e=engine;engine=null;if(!e)return;const cleanup=()=>Promise.resolve(e.dispose()).catch(err=>console.warn('Engine cleanup',err));if(running&&!e.manual)void running.finally(cleanup).catch(()=>{});else void cleanup();}
  function fail(stage:string,e:unknown){if(!active||failed)return;failed=true;cancelFrame();clearTimeout(inferenceTimeout);controller.abort();dispose();setToolIssue(stage+': '+messageOf(e));setToolReady(false);setBusy(false);setStatus('Tool lỗi · Camera vẫn mở');}
  const loadTimeout=setTimeout(()=>fail('Khởi tạo tool',Error('Quá thời gian tải model. Kiểm tra mạng hoặc chọn Lite mode.')),210000);
  function draw(r:FrameResult){const w=v.videoWidth,h=v.videoHeight;if(!w||!h)return;if(c.width!==w||c.height!==h){c.width=w;c.height=h;}const ctx=c.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#72e3b1';ctx.fillStyle='#72e3b1';ctx.lineWidth=Math.max(2,w/350);ctx.font=Math.max(12,w/55)+'px system-ui';
   if(mode==='count'){const y=config.current.line*h;ctx.save();ctx.strokeStyle='#f8c579';ctx.setLineDash([w/45,w/70]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();ctx.restore();}
   for(const b of r.marks??[]){ctx.strokeRect(b.x*w,b.y*h,b.w*w,b.h*h);const label=(b.trackId?'#'+b.trackId+' ':'')+b.label+(b.score?' '+Math.round(b.score*100)+'%':'');const x=Math.max(0,b.x*w),y=Math.max(20,b.y*h-5);ctx.fillStyle='#101820e0';ctx.fillRect(x,y-w/48,Math.min(w-x,ctx.measureText(label).width+8),w/43);ctx.fillStyle='#72e3b1';ctx.fillText(label,x+3,y);}
   for(const p of r.points??[]){ctx.beginPath();ctx.arc(p.x*w,p.y*h,Math.max(3,w/220),0,Math.PI*2);ctx.fill();}
  }
  function schedule(){if(!active||failed)return;if(typeof v.requestVideoFrameCallback==='function'){kind='video';frameId=v.requestVideoFrameCallback(now=>tick(now));}else{kind='raf';frameId=requestAnimationFrame(tick);}}
  function tick(now:number){if(!active||failed)return;schedule();
   if(!engine||running||document.hidden||v.paused||v.readyState<2||!v.videoWidth||!v.videoHeight||now-lastStart<interval||(!engine.manual&&v.currentTime===lastVideo)||engine.manual&&!capture.current)return;
   lastStart=now;lastVideo=v.currentTime;capture.current=false;const e=engine;const start=performance.now();if(e.manual)setBusy(true);
   inferenceTimeout=setTimeout(()=>fail('Xử lý frame',Error('Inference timeout. Thử lại tool hoặc chọn Lite.')),e.manual?120000:20000);
   running=(async()=>{try{let r=await e.process(v);if(!active||failed)return;const elapsed=performance.now()-start;mean=mean?mean*.8+elapsed*.2:elapsed;
    if(mode==='count'){const tracked=tracker.current.update(r.marks??[],performance.now());r={...r,text:tracked.total+' vật thể đã qua vạch · '+tracked.visible+' đang thấy',value:tracked.total,marks:tracked.marks,valid:true};}
    draw(r);setResult(r);setLatency(Math.round(mean));setBackend(r.backend||e.backend||'Local');const at=performance.now();if(lastResult){const current=1000/Math.max(1,at-lastResult);meanFps=meanFps?meanFps*.75+current*.25:current;setFps(Math.round(meanFps*10)/10);}lastResult=at;
    const floor=e.manual?100:mode==='detect'||mode==='count'||mode==='pose'?(quality==='lite'?330:130):100;interval=Math.max(floor,Math.min(2000,mean*1.5));
   }catch(err){fail('Xử lý frame',err);}finally{clearTimeout(inferenceTimeout);running=null;if(active&&!failed)setBusy(false);}})();
  }
  void(async()=>{try{setStatus('Đang tải công cụ…');const e=await loadEngine(mode,{signal:controller.signal,progress:m=>{if(active&&!failed)setStatus(m);},quality,confidence,language,ocrProfile});if(!active||failed){await e.dispose();return;}clearTimeout(loadTimeout);engine=e;setBackend(e.backend||'Local');setStatus('Live');setToolReady(true);schedule();}catch(e){clearTimeout(loadTimeout);fail('Khởi tạo tool',e);}})();
  return()=>{active=false;clearTimeout(loadTimeout);clearTimeout(inferenceTimeout);cancelFrame();controller.abort();dispose();};
 },[mode,cameraReady,toolRetry,quality,confidence,language,ocrProfile]);
 const isAI=mode==='count'||mode==='detect'||mode==='pose',canSave=!!result&&result.valid!==false&&!busy;
 const ocrRect=mode==='ocr'&&videoSize?cropRect(videoSize.width,videoSize.height,ocrProfile):null;
 return <section className="session"><div className="session-head"><button className="icon-btn" aria-label="Quay lại" onClick={onBack}><ArrowLeft/></button><div><h2>{module.name}</h2><small>{module.desc}</small></div><button className="icon-btn" aria-label="Cấu hình" aria-expanded={showSettings} onClick={()=>setShowSettings(s=>!s)}><Settings2/></button><button className="icon-btn" aria-label="Đổi camera" onClick={()=>setFacing(f=>f==='user'?'environment':'user')}><SwitchCamera/></button></div>
 {mode==='ocr'&&<section className="ocr-controls"><div className="ocr-tabs" role="group" aria-label="Chế độ OCR"><button disabled={busy} aria-pressed={ocrProfile==='document'} onClick={()=>setOcrProfile('document')}>Văn bản</button><button disabled={busy} aria-pressed={ocrProfile==='digits'} onClick={()=>setOcrProfile('digits')}>Dãy số / công-tơ-mét</button></div><p>{ocrProfile==='digits'?'Đưa riêng dãy số công-tơ-mét vào khung xanh. Giữ máy thẳng, tránh phản sáng.':'Đưa vùng văn bản vào khung xanh. Giữ máy thẳng và chờ lấy nét.'}</p></section>}
 <div className="viewer"><video ref={video} autoPlay muted playsInline/><canvas ref={overlay}/>{mode!=='count'&&mode!=='ocr'&&<div className="guide" aria-hidden="true"/>}{ocrRect&&videoSize&&cameraReady&&<svg className="ocr-guide" viewBox={'0 0 '+videoSize.width+' '+videoSize.height} preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d={'M0 0H'+videoSize.width+'V'+videoSize.height+'H0Z M'+ocrRect.x+' '+ocrRect.y+'h'+ocrRect.width+'v'+ocrRect.height+'h-'+ocrRect.width+'Z'} fill="#000" fillOpacity=".38" fillRule="evenodd"/><rect x={ocrRect.x} y={ocrRect.y} width={ocrRect.width} height={ocrRect.height} rx={Math.min(8,ocrRect.height/10)} fill="none" stroke="#72e3b1" strokeWidth={2} vectorEffect="non-scaling-stroke"/></svg>}{mode==='color'&&<div className="crosshair" aria-hidden="true">+</div>}<div className="live"><i className={cameraReady?'on':''}/>{cameraReady?status:cameraStatus}</div>
 {!cameraReady&&<div className="loading"><Camera size={32}/><p>{cameraIssue||cameraStatus}</p>{cameraIssue&&<button className="primary" onClick={()=>setCameraRetry(n=>n+1)}><RefreshCw size={16}/> Mở lại camera</button>}</div>}
 {cameraReady&&!toolReady&&!toolIssue&&<div className="loading-banner"><span className="spinner"/><span>{status}</span><small>Camera đã sẵn sàng</small></div>}</div>
 {cameraReady&&toolIssue&&<section className="error-panel" role="alert"><div><AlertCircle size={20}/><strong>Không thể khởi chạy công cụ</strong></div><p>{toolIssue}</p><div className="toolbar"><button className="primary" onClick={()=>setToolRetry(n=>n+1)}><RefreshCw size={16}/> Thử lại tool</button>{isAI&&quality!=='lite'&&<button className="secondary" onClick={()=>setQuality('lite')}>Lite mode</button>}<button className="secondary" onClick={()=>void refreshApp()}>Làm mới app</button></div></section>}
 {showSettings&&<section className="settings"><strong>Cài đặt</strong>{isAI&&<label>Hiệu năng<select value={quality} onChange={e=>setQuality(e.target.value as Options['quality'])}><option value="auto">Auto</option><option value="lite">Lite / tiết kiệm</option></select></label>}{(mode==='count'||mode==='detect')&&<label>Ngưỡng tin cậy<select value={confidence} onChange={e=>setConfidence(Number(e.target.value))}><option value={.35}>35% · nhạy</option><option value={.55}>55% · cân bằng</option><option value={.75}>75% · chặt chẽ</option></select></label>}{mode==='ocr'&&ocrProfile==='document'&&<label>Ngôn ngữ<select value={language} onChange={e=>setLanguage(e.target.value as Options['language'])}><option value="eng+vie">Tiếng Việt + English</option><option value="vie">Tiếng Việt</option><option value="eng">English</option></select></label>}<small>Camera: {facing==='environment'?'sau (ưu tiên)':'trước (ưu tiên)'}</small><button className="secondary" onClick={()=>void refreshApp()}>Xóa cache & tải lại</button></section>}
 {mode==='count'&&<section className="settings"><strong>Đường đếm ảo</strong><label>Vị trí vạch: {Math.round(line*100)}%<input aria-label="Vị trí đường đếm" type="range" min=".15" max=".85" step=".05" value={line} onChange={e=>setLine(Number(e.target.value))}/></label><label>Hướng đi<select value={direction} onChange={e=>setDirection(e.target.value as Direction)}><option value="down">Trên xuống dưới</option><option value="up">Dưới lên trên</option><option value="both">Hai hướng</option></select></label><button className="secondary" onClick={()=>{tracker.current.reset();setResult(null);setNotice('Đã reset bộ đếm');}}><RotateCcw size={16}/> Reset bộ đếm</button></section>}
 <div className="metrics"><div><small>ENGINE</small><strong>{backend||'—'}</strong></div><div><small>INFERENCE</small><strong>{latency?latency+' ms':'—'}</strong></div><div><small>AI FPS</small><strong>{fps||'—'}</strong></div></div>
 <div className="result"><div className="result-head"><span>{mode==='ocr'&&result?.valid===false?'CẦN KIỂM TRA':'KẾT QUẢ'}</span><small>{toolReady?'Local processing':''}</small></div>{mode==='ocr'&&result?.preview&&<div className="ocr-review"><small>Ảnh đã chụp · chỉ vùng quét</small><img src={result.preview} alt="Vùng ảnh đã chụp để OCR"/></div>}{mode==='ocr'&&typeof result?.confidence==='number'&&<div className="ocr-confidence"><small>Độ tin cậy OCR: {Math.round(result.confidence)}% (không phải độ chính xác)</small>{result.warning&&<p role="alert" className="ocr-warning">{result.warning}</p>}</div>}<p>{busy?'Đang đọc chữ…':result?.text||(mode==='ocr'&&toolReady?'Bấm chụp để đọc văn bản':'Chờ kết quả…')}</p>{mode==='color'&&result?.text.startsWith('#')&&<div className="swatch" style={{background:result.text}}/>}
 {canSave&&<div className="toolbar"><button className="secondary" disabled={saving} onClick={async()=>{if(!result||saving)return;setSaving(true);try{await saveResult(mode,result);setNotice('Đã lưu kết quả');}catch(e){setNotice(messageOf(e));}finally{setSaving(false);}}}><Save size={16}/> Lưu kết quả</button><button className="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(result!.text);setNotice('Đã sao chép');}catch{setNotice('Không truy cập được clipboard');}}}><Copy size={15}/> Sao chép</button></div>}{notice&&<small role="status">{notice}</small>}</div>
 {mode==='ocr'&&<button className="primary full" disabled={!cameraReady||!toolReady||busy} onClick={()=>{capture.current=true;setResult(null);setNotice('');setBusy(true);}}><Camera size={19}/> {ocrProfile==='digits'?'Chụp & đọc dãy số':'Chụp & đọc văn bản'}</button>}
 <p className="note">{mode==='count'?'Đếm một lần mỗi track khi qua vạch theo hướng đã chọn. Model COCO chỉ nhận diện nhóm vật thể phổ biến; vật phẩm công nghiệp cần model riêng.':mode==='pose'?'Hiển thị điểm khớp, không đánh giá y tế hoặc tư thế tập.':mode==='motion'?'Thay đổi ánh sáng hoặc rung camera cũng làm tăng mức chuyển động.':'Hình ảnh được xử lý trên thiết bị. Kết quả chỉ lưu khi mày bấm Lưu.'}</p></section>;
}
