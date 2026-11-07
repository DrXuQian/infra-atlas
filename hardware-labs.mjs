import {labDefaults,labState} from './hardware-lab-view.mjs';
// Static content remains usable when this enhancement cannot initialize.
const chapterContents=document.querySelector('.reader-sidebar details');
if(chapterContents&&window.matchMedia('(min-width: 901px)').matches)chapterContents.open=true;
document.querySelectorAll('[data-walkthrough]').forEach(root=>{
  const frames=[...root.querySelectorAll('[data-frame]')];
  const status=root.querySelector('[data-frame-status]');
  let current=0;
  function show(n){current=Math.max(0,Math.min(frames.length-1,n));frames.forEach((f,i)=>{f.hidden=i!==current});status.textContent=`第 ${current+1} / ${frames.length} 步 · ${frames[current].querySelector('h3').textContent}`}
  function fromHash(){const index=frames.findIndex(f=>'#'+f.id===location.hash);if(index>=0)show(index)}
  root.addEventListener('click',event=>{const a=event.target.closest('[data-frame-target]');if(!a)return;event.preventDefault();show(Number(a.dataset.frameTarget));frames[current].querySelector('h3').focus({preventScroll:true});});
  root.classList.add('is-enhanced');show(0);fromHash();window.addEventListener('hashchange',fromHash);
});
document.querySelectorAll('[data-lab]').forEach(root=>{
  const id=root.dataset.lab;let options={...labDefaults[id]};
  const output=root.querySelector('.lab-output');
  function render(){const r=labState(id,options);if(!r)return;if(r.step!==undefined)options.step=r.step;output.innerHTML=r.html;const previous=root.querySelector('[data-lab-action="prev"]'),next=root.querySelector('[data-lab-action="next"]');if(previous)previous.disabled=options.step<=0;if(next)next.disabled=options.step>=r.max;}
  root.addEventListener('change',event=>{const input=event.target.closest('select');if(!input)return;options[input.name]=input.name==='ilp'?input.value==='true':['count','threads','registers','sharedKiB','stride','offset','lanes','stages'].includes(input.name)?Number(input.value):input.value;options.step=id==='H09'?4:0;render()});
  root.addEventListener('click',event=>{const button=event.target.closest('[data-lab-action]');if(!button)return;const action=button.dataset.labAction;options.step=action==='reset'?0:Math.max(0,(options.step||0)+(action==='next'?1:-1));render()});
  render();root.querySelectorAll('[data-js-controls]').forEach(e=>e.hidden=false);
});
