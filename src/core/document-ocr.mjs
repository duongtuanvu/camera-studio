const clean = text => String(text ?? '').trim().normalize('NFC');
const weight = text => (clean(text).match(/[\p{L}\p{N}]/gu) ?? []).length;
export function documentScanSize(width,height){
 if(![width,height].every(v=>Number.isFinite(v)&&v>=1))throw Error('Invalid image dimensions');
 const scale=Math.min(3,2560/Math.max(width,height),Math.max(1,1200/Math.min(width,height)));
 return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export function grayscaleRGBA(data){
 for(let i=0;i<data.length;i+=4){const v=(77*data[i]+150*data[i+1]+29*data[i+2])>>8;data[i]=data[i+1]=data[i+2]=v;}
 return data;
}
export function selectDocumentPass(first,second){
 const a={text:clean(first.text),confidence:Math.max(0,Math.min(100,Number.isFinite(first.confidence)?first.confidence:0))};
 const b={text:clean(second.text),confidence:Math.max(0,Math.min(100,Number.isFinite(second.confidence)?second.confidence:0))};
 const wa=weight(a.text),wb=weight(b.text);
 // Confidence measures recognized characters, not missing content. Prefer substantially more readable characters, but do not accept an empty/noisy pass.
 let chosen=a;
 if(wb>0&&(!wa||(b.confidence>=40&&(wb>=wa*1.35||(wb>=wa*.85&&b.confidence>a.confidence+8)))))chosen=b;
 const disagreement=clean(a.text).replace(/\s+/gu,' ')!==clean(b.text).replace(/\s+/gu,' ');
 return {...chosen,valid:weight(chosen.text)>0&&chosen.confidence>=75,warning:!weight(chosen.text)?'Không tìm thấy chữ. Hãy chụp lại.':disagreement?'Hai lượt OCR cho kết quả khác nhau; có thể thiếu hoặc sai chữ. Đối chiếu ảnh trước khi xác nhận.':chosen.confidence<75?'Độ tin cậy thấp. Kiểm tra kỹ hoặc chụp lại.':'Độ tin cậy không đo phần chữ bị bỏ sót. Đối chiếu toàn bộ ảnh trước khi xác nhận.'};
}
export function reviewableOCR(text,profile){
 const value=clean(text);
 return profile==='digits'?/^\d{1,12}(?:[.,]\d{1,3})?$/.test(value):weight(value)>0;
}
export function approvedOCR(text,profile,confirmed){return confirmed===true&&reviewableOCR(text,profile);}
