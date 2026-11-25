// Class-aware greedy matching in normalized image coordinates. One count per track.
export class LineTracker {
 constructor({line=.5,direction='down',maxAge=1000,gate=.20,hysteresis=.025}={}){this.line=line;this.direction=direction;this.maxAge=maxAge;this.gate=gate;this.hysteresis=hysteresis;this.reset();}
 reset(){this.tracks=new Map();this.nextId=1;this.total=0;}
 clearTracks(){this.tracks.clear();}
 configure(line,direction){if(line!==this.line||direction!==this.direction){this.line=line;this.direction=direction;this.clearTracks();}}
 side(y){return y<this.line-this.hysteresis?-1:y>this.line+this.hysteresis?1:0;}
 update(marks,now){
  for(const [id,t] of this.tracks)if(now-t.time>this.maxAge)this.tracks.delete(id);
  const detections=marks.filter(m=>[m.x,m.y,m.w,m.h].every(Number.isFinite)&&m.w>0&&m.h>0).map(m=>({...m,cx:m.x+m.w/2,cy:m.y+m.h/2})),pairs=[];
  for(const t of this.tracks.values())for(let i=0;i<detections.length;i++){const m=detections[i];if(t.label!==m.label)continue;const dt=Math.max(0,Math.min(.3,(now-t.time)/1000));const d=Math.hypot(m.cx-(t.cx+t.vx*dt),m.cy-(t.cy+t.vy*dt));if(d<=this.gate)pairs.push({id:t.id,i,d});}
  pairs.sort((a,b)=>a.d-b.d||a.id-b.id||a.i-b.i);const used=new Set(),matched=new Map();
  for(const p of pairs){if(used.has(p.id)||matched.has(p.i))continue;used.add(p.id);matched.set(p.i,p.id);}
  const result=detections.map((m,i)=>{let t=this.tracks.get(matched.get(i));const side=this.side(m.cy);
   if(!t){t={id:this.nextId++,label:m.label,cx:m.cx,cy:m.cy,time:now,vx:0,vy:0,side,counted:false,hits:1};this.tracks.set(t.id,t);}
   else{const dt=Math.max(.016,(now-t.time)/1000);t.vx=.5*t.vx+.5*(m.cx-t.cx)/dt;t.vy=.5*t.vy+.5*(m.cy-t.cy)/dt;t.hits++;
    if(side!==0){if(t.side&&side!==t.side&&!t.counted&&t.hits>=2&&(this.direction==='both'||(this.direction==='down'&&side===1)||(this.direction==='up'&&side===-1))){this.total++;t.counted=true;}t.side=side;}t.cx=m.cx;t.cy=m.cy;t.time=now;}
   const {cx,cy,...mark}=m;return {...mark,trackId:t.id};
  });return {total:this.total,marks:result,visible:result.length};
 }
}