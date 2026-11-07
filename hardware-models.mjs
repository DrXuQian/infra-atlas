// Original, deterministic teaching models. These are not GPU simulators or measurements.
const copy = x => JSON.parse(JSON.stringify(x));
export function occupancy({threads=256,registers=64,sharedKiB=16}={}) {
  const warps=Math.ceil(threads/32), registersPerWarp=Math.ceil(registers*32/256)*256;
  const registersPerBlock=warps*registersPerWarp;
  const limits={registers:Math.floor(65536/registersPerBlock),shared:sharedKiB?Math.floor(64/sharedKiB):16,warps:Math.floor(64/warps),threads:Math.floor(2048/threads),blocks:16};
  const resident=Math.min(...Object.values(limits));
  return {warps,registersPerWarp,registersPerBlock,limits,resident,activeWarps:resident*warps,percent:resident*warps/64*100,bottlenecks:Object.keys(limits).filter(k=>limits[k]===resident)};
}
export function coalescing({stride=1,offset=0,lanes=32,visible=32}={}) {
  const n=Math.min(lanes,visible), requests=[],sectors=new Set(),bytes=new Set();
  for(let lane=0;lane<n;lane++){
    const address=offset+lane*stride*4,s=new Set();
    for(let b=address;b<address+4;b++){bytes.add(b);sectors.add(Math.floor(b/32));s.add(Math.floor(b/32));}
    requests.push({lane,address,sectors:[...s]});
  }
  return {requests,sectors:[...sectors].sort((a,b)=>a-b),useful:bytes.size,transferred:sectors.size*32,efficiency:sectors.size?bytes.size/(sectors.size*32)*100:0};
}
export function banks({pattern='row',wave=0}={}) {
  const words=Array.from({length:32},(_,lane)=>pattern==='column'?lane*32:pattern==='padding'?lane*33:pattern==='broadcast'?0:pattern==='swizzle'?lane*32+(lane^0):lane);
  const buckets=Array.from({length:32},()=>[]);
  words.forEach(w=>{const bank=w%32;if(!buckets[bank].includes(w))buckets[bank].push(w)});
  const waves=Math.max(...buckets.map(b=>b.length));
  return {words,buckets,waves,requests:words.map((word,lane)=>({lane,word,bank:word%32,served:buckets[word%32].indexOf(word)<wave}))};
}
export function scheduler({count=4,policy='LRR',ilp=true}={}) {
  // All warps admitted at cycle 0 and permanently owned by this scheduler.
  // Single issue, fully pipelined units, no queue limits; issue == acceptance.
  const ld={op:'LD r0',dst:'r0',src:[],latency:6};
  const independent={op:'FMA r1',dst:'r1',src:[],latency:3};
  const consumer={op:'ADD r2',dst:'r2',src:['r0'],latency:1};
  const program=ilp?[ld,independent,consumer]:[ld,consumer,independent];
  const warps=Array.from({length:count},(_,id)=>({id,pc:0,pending:[],done:[]}));
  const frames=[{cycle:-1,warps:copy(warps),pre:warps.map(()=>({eligible:true,reason:'尚未开始',instruction:program[0].op})),issued:null,completions:[],program,finished:false}];
  let pointer=0,last=null;
  for(let cycle=0;cycle<100;cycle++){
    const completions=[];
    for(const w of warps){for(const p of w.pending.filter(p=>p.ready===cycle)){completions.push({warp:w.id,...p});w.done.push(p.dst)}w.pending=w.pending.filter(p=>p.ready>cycle)}
    const pre=warps.map(w=>{
      const ins=program[w.pc];
      if(!ins)return {eligible:false,reason:w.pending.length?'等待最后结果':'完成',instruction:'—'};
      const busy=new Set(w.pending.map(p=>p.dst));
      const wait=ins.src.some(r=>busy.has(r))||busy.has(ins.dst);
      return {eligible:!wait,reason:wait?'依赖等待':'就绪',instruction:ins.op};
    });
    let selected=null;
    if(policy==='GTO')selected=last!==null&&pre[last].eligible?last:pre.findIndex(p=>p.eligible);
    else for(let i=0;i<count;i++){const id=(pointer+i)%count;if(pre[id].eligible){selected=id;break}}
    if(selected===-1)selected=null;
    let issued=null;
    if(selected!==null){const w=warps[selected],ins=program[w.pc];issued={warp:selected,...ins};w.pending.push({...ins,issuedAt:cycle,ready:cycle+ins.latency});w.pc++;pointer=(selected+1)%count;last=selected}
    const finished=warps.every(w=>w.pc===program.length&&!w.pending.length);
    frames.push({cycle,warps:copy(warps),pre,issued,completions,program,finished});
    if(finished)break;
  }
  return frames;
}
export function pipeline({stages=2,tiles=4,copyLatency=3,computeLatency=4}={}) {
  // Complete -> start oldest ready compute -> start next copy -> snapshot.
  // One copy engine, one compute engine; buffers cannot be reused early.
  const buffers=Array.from({length:stages},(_,id)=>({id,state:'empty',tile:null,ready:null}));
  let copying=null,computing=null,next=0,completed=0;
  const frames=[{cycle:-1,buffers:copy(buffers),events:[],completed,finished:false}];
  for(let cycle=0;cycle<200;cycle++){
    const events=[];
    if(copying&&copying.ready===cycle){const b=buffers[copying.id];b.state='ready';b.ready=null;events.push(`Tile ${b.tile} 搬运完成`);copying=null}
    if(computing&&computing.ready===cycle){const b=buffers[computing.id];events.push(`Tile ${b.tile} 计算完成，释放缓冲`);b.state='empty';b.tile=null;b.ready=null;computing=null;completed++}
    if(!computing){const b=buffers.filter(b=>b.state==='ready').sort((a,b)=>a.tile-b.tile)[0];if(b){b.state='computing';b.ready=cycle+computeLatency;computing={id:b.id,ready:b.ready};events.push(`开始计算 Tile ${b.tile}`)}}
    if(!copying&&next<tiles){const b=buffers.find(b=>b.state==='empty');if(b){b.state='copying';b.tile=next++;b.ready=cycle+copyLatency;copying={id:b.id,ready:b.ready};events.push(`开始搬运 Tile ${b.tile}`)}}
    const finished=completed===tiles;
    frames.push({cycle,buffers:copy(buffers),events,completed,finished});
    if(finished)break;
  }
  return frames;
}
