import test from 'node:test';import assert from 'node:assert/strict';import {LineTracker} from '../src/core/tracker.mjs';
const mark=(y,label='bottle',x=.4)=>({x,y:y-.05,w:.1,h:.1,label});
test('counts one down crossing once and ignores jitter',()=>{const t=new LineTracker();for(const [i,y] of [.36,.43,.49,.52,.56,.49,.44,.56].entries())t.update([mark(y)],i*100);assert.equal(t.total,1);});
test('wrong direction does not count',()=>{const t=new LineTracker();t.update([mark(.6)],0);t.update([mark(.44)],100);assert.equal(t.total,0);});
test('up direction counts reverse crossing',()=>{const t=new LineTracker({direction:'up'});t.update([mark(.59)],0);assert.equal(t.update([mark(.43)],100).total,1);});
test('expired tracks cannot create phantom crossing',()=>{const t=new LineTracker();t.update([mark(.4)],0);t.update([mark(.56)],1200);assert.equal(t.total,0);});
test('multiple classes stay separate',()=>{const t=new LineTracker();t.update([mark(.4,'bottle'),mark(.4,'cup',.7)],0);const r=t.update([mark(.56,'cup',.7),mark(.56,'bottle')],100);assert.equal(r.total,2);assert.notEqual(r.marks[0].trackId,r.marks[1].trackId);});
test('configure clears tracks without resetting accumulated total',()=>{const t=new LineTracker();t.update([mark(.4)],0);t.update([mark(.56)],100);t.configure(.7,'both');t.update([mark(.8)],200);assert.equal(t.total,1);t.reset();assert.equal(t.total,0);});
