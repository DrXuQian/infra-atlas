import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {occupancy,coalescing,banks,scheduler,pipeline} from './hardware-models.mjs';
import {labState,labDefaults} from './hardware-lab-view.mjs';
assert.equal(occupancy().resident,4);
assert.equal(occupancy({registers:65}).resident,3);
assert.equal(occupancy({sharedKiB:48}).resident,1);
assert.equal(coalescing().sectors.length,4);
assert.equal(coalescing({offset:4}).sectors.length,5);
assert.equal(coalescing({stride:2}).sectors.length,8);
assert.equal(coalescing({stride:8}).efficiency,12.5);
assert.equal(coalescing({lanes:8}).sectors.length,1);
for(const [pattern,waves] of [['row',1],['column',32],['padding',1],['swizzle',1],['broadcast',1]]){
  assert.equal(banks({pattern}).waves,waves);
  assert.equal(banks({pattern,wave:waves}).requests.filter(r=>r.served).length,32);
}
for(const count of [1,4])for(const ilp of [false,true])for(const policy of ['LRR','GTO']){
  const options={count,ilp,policy},frames=scheduler(options);
  assert.deepEqual(frames,scheduler(options),'replay must be deterministic');
  assert(frames.at(-1).finished);
  assert.equal(frames.filter(f=>f.issued).length,3*count);
  for(const f of frames){
    if(f.issued){assert(f.pre[f.issued.warp].eligible);for(const src of f.issued.src)assert(f.warps[f.issued.warp].done.includes(src),'no early use');}
    for(const w of f.warps){assert.equal(new Set(w.pending.map(p=>p.dst)).size,w.pending.length,'no WAW');for(const p of w.pending)assert(p.ready>f.cycle);}
    for(const p of f.completions)assert.equal(p.issuedAt+p.latency,f.cycle);
  }
}
assert.equal(scheduler({count:1,ilp:true}).find(f=>f.issued?.op==='ADD r2').cycle,6);
assert.equal(scheduler({count:1,ilp:false}).find(f=>f.issued?.op==='ADD r2').cycle,6);
for(const stages of [1,2,3]){
  const frames=pipeline({stages});assert.deepEqual(frames,pipeline({stages}));assert.equal(frames.at(-1).completed,4);
  for(const f of frames){assert(f.buffers.filter(b=>b.state==='copying').length<=1);assert(f.buffers.filter(b=>b.state==='computing').length<=1);assert.equal(new Set(f.buffers.filter(b=>b.tile!==null).map(b=>b.tile)).size,f.buffers.filter(b=>b.tile!==null).length);}
  for(let i=1;i<frames.length;i++)for(const b of frames[i].buffers){const prev=frames[i-1].buffers[b.id];if(b.state==='computing'&&prev.state!=='computing')assert(prev.state==='ready'||(prev.state==='copying'&&prev.ready===frames[i].cycle),'compute only after ready');if(b.state==='copying'&&prev.state!=='copying')assert(prev.state==='empty'||(prev.state==='computing'&&prev.ready===frames[i].cycle),'reuse only after consume');}
}
assert.equal(pipeline({stages:1}).at(-1).cycle,28);
assert.equal(pipeline({stages:2}).at(-1).cycle,19);
assert.equal(pipeline({stages:3}).at(-1).cycle,19);
for(const [id,o] of Object.entries(labDefaults)){const s=labState(id,o);assert(s.html.includes('lab-stats'));assert(!s.html.includes('undefined'));}
const files=['index.html',...fs.readdirSync('hardware').filter(f=>f.endsWith('.html')).map(f=>'hardware/'+f)];
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'duplicate HTML ID '+file);
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)){
    if(/^(https?:|mailto:)/.test(href))continue;
    const [f,hash]=href.split('#');const dest=f?path.normalize(path.join(path.dirname(file),f)):file;
    assert(fs.existsSync(dest),`${file}: missing ${dest}`);
    if(hash){const destHtml=dest===file?html:fs.readFileSync(dest,'utf8');assert(destHtml.includes(`id="${hash}"`),`${file}: missing anchor ${dest}#${hash}`);}
  }
  assert(!/学习计划|面试|跳槽/.test(html),'private framing leaked: '+file);
  assert(!html.includes('undefined'),'undefined markup: '+file);
}
const atoms=JSON.parse(fs.readFileSync('curriculum.json','utf8')).tracks.find(t=>t.id==='H').modules.flatMap(m=>m.topics);
for(const a of atoms){const html=fs.readFileSync('hardware/'+a.id.split('.')[0]+'.html','utf8');assert(html.includes(`id="${a.id}"`));assert(html.includes('state-rule'));}
console.log('PASS: 168 atomic pages anchors; deterministic model invariants; coalescing/bank/occupancy reference cases; buffer ownership; static links.');
