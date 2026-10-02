import {buildPlan,sampleContour} from './contour.js?v=0.5.0';
export function mountTurningSimulation(root,read){
 let frame=0,last=0,elapsed=0,running=false,disposed=false,plan=null;
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Графический вид контура X/Z');
 root.innerHTML='<section class="sim shop-sim"><div class="sim-heading"><strong>Графический вид · X/Z</strong><span>Учебная 2D</span></div></section>';
 const section=root.firstElementChild;section.append(canvas);
 section.insertAdjacentHTML('beforeend',`<p class="hint sim-info" role="status"></p><div class="sim-controls"><button type="button" class="sim-play">▶ Пуск</button><button type="button" class="sim-pause">Ⅱ Пауза</button><button type="button" class="sim-reset">↺ Сначала</button><label>Просмотр <select class="sim-rate"><option value="1">1×</option><option value="10">10×</option><option value="50">50×</option></select></label></div>`);
 const ctx=canvas.getContext('2d'),info=root.querySelector('.sim-info');
 function stop(){running=false;cancelAnimationFrame(frame);last=0;}
 function reset(){stop();elapsed=0;plan=null;draw();}
 function values(){return read()||{};}
 function state(){if(!plan)return {at:null,done:[],current:null,t:0};if(elapsed>=plan.total-1e-8)return {at:plan.moves.at(-1).to,done:plan.moves,current:null,t:1};let left=elapsed,done=[];for(const m of plan.moves){if(left>=m.seconds){left-=m.seconds;done.push(m);continue;}const t=left/m.seconds;return {at:{r:m.from.r+(m.to.r-m.from.r)*t,z:m.from.z+(m.to.z-m.from.z)*t},done,current:m,t};}return {at:plan.moves.at(-1).to,done,current:null,t:1};}
 function draw(){
 if(disposed)return;
 const w=Math.max(250,canvas.clientWidth),h=Math.max(220,canvas.clientHeight||320),dpr=Math.min(3,window.devicePixelRatio||1);
 canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
 const light=document.body.classList.contains('light'),bg=light?'#dce5ee':'#122335',fg=light?'#18334e':'#c7dbed';
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.strokeStyle=light?'#b6c7d8':'#2b4056';ctx.lineWidth=1;
 for(let x=0;x<w;x+=25){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
 for(let y=0;y<h;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 const p=values();ctx.fillStyle=fg;ctx.font='12px -apple-system,sans-serif';
 if(!(p.d>0&&p.l>0)){ctx.fillText('Задайте цилиндр XD / L',18,28);info.textContent='Сначала задайте диаметр и длину заготовки.';return;}
 let profile=[],warning='';try{profile=plan?.profile||(p.points.length>=2?sampleContour(p.points,p.d,p.l):p.points.map(q=>({r:q.x/2,z:-q.z})));}catch(e){warning=e.message;}
 const R=p.d/2,scale=Math.min((w-100)/p.l,(h-110)/(R+2)),zero=w-55,axis=h-50;
 const X=z=>zero-z*scale,Y=r=>axis-r*scale,point=(r,z)=>({x:X(z),y:Y(r)}),s=state();
 const bins=480,stock=Array(bins).fill(R),dz=p.l/bins;
 const remove=(m,end)=>{if(!m.cut)return;const a=m.from,b=end;for(let i=0;i<bins;i++){const z=(i+.5)*dz;if(z<Math.min(a.z,b.z)-dz/2||z>Math.max(a.z,b.z)+dz/2)continue;const r=Math.abs(b.z-a.z)<1e-8?Math.min(a.r,b.r):a.r+(b.r-a.r)*Math.max(0,Math.min(1,(z-a.z)/(b.z-a.z)));stock[i]=Math.max(0,Math.min(stock[i],r));}};
 s.done.forEach(m=>remove(m,m.to));if(s.current)remove(s.current,s.at);
 ctx.fillStyle=light?'#a9bdcf':'#48667f';ctx.beginPath();ctx.moveTo(X(0),axis);ctx.lineTo(X(0),Y(stock[0]));for(let i=0;i<bins;i++)ctx.lineTo(X(i*dz),Y(stock[i]));ctx.lineTo(X(p.l),Y(stock.at(-1)));ctx.lineTo(X(p.l),axis);ctx.closePath();ctx.fill();
 ctx.strokeStyle=fg;ctx.setLineDash([4,4]);ctx.strokeRect(X(p.l),Y(R),p.l*scale,R*scale);ctx.beginPath();ctx.moveTo(18,axis);ctx.lineTo(w-12,axis);ctx.moveTo(zero,18);ctx.lineTo(zero,h-20);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle=fg;ctx.fillText('X ∅ ↑',zero-42,20);ctx.fillText('Z →',w-36,axis+35);ctx.fillText('0',zero+4,axis+16);ctx.fillText('−'+p.l,X(p.l),axis+16);ctx.fillText('Ø'+p.d,zero+4,Y(R));
 ctx.strokeStyle=light?'#153650':'#e6edf4';ctx.lineWidth=2;ctx.beginPath();profile.forEach((q,i)=>i?ctx.lineTo(X(q.z),Y(q.r)):ctx.moveTo(X(q.z),Y(q.r)));ctx.stroke();
 const original=p.points||[];original.forEach((q,i)=>{const a=point(q.x/2,-q.z);ctx.fillStyle=i===original.length-1?'#efb447':fg;ctx.fillRect(a.x-3,a.y-3,6,6)});
 if(plan){ctx.strokeStyle=light?'#26805b66':'#70dfa866';ctx.lineWidth=1;for(const m of plan.moves){if(!m.cut)continue;ctx.beginPath();ctx.moveTo(X(m.from.z),Y(m.from.r));ctx.lineTo(X(m.to.z),Y(m.to.r));ctx.stroke();}}
 const tool=s.at||{r:R+2,z:-1},at=point(tool.r,tool.z);ctx.fillStyle='#9aa9b5';ctx.fillRect(at.x-5,at.y-36,25,25);ctx.fillStyle='#dfb344';ctx.beginPath();ctx.moveTo(at.x,at.y);ctx.lineTo(at.x-9,at.y-18);ctx.lineTo(at.x+14,at.y-18);ctx.closePath();ctx.fill();
 info.textContent=warning|| (plan?`${Math.round(elapsed/plan.total*100)}% · ${s.current?.label||'Обработка завершена'} · X ${((s.at?.r||0)*2).toFixed(2)} · Z ${(-(s.at?.z||0)).toFixed(2)} · ${plan.passes} черновых проходов · ${elapsed.toFixed(1)} / ${plan.total.toFixed(1)} с`:profile.length<2?'Заготовка задана. Создайте стартовую точку и элементы контура.':'Контур готов. Задайте режим обработки и нажмите «Пуск».');
 }
 function tick(t){if(!running||disposed)return;if(last)elapsed=Math.min(plan.total,elapsed+(t-last)/1000*Number(root.querySelector('.sim-rate').value));last=t;draw();if(elapsed>=plan.total){stop();return;}frame=requestAnimationFrame(tick);}
 root.querySelector('.sim-play').onclick=()=>{if(running)return;try{if(!plan)plan=buildPlan(values());if(elapsed>=plan.total)elapsed=0;running=true;last=0;frame=requestAnimationFrame(tick);}catch(e){info.textContent=e.message;}};
 root.querySelector('.sim-pause').onclick=stop;root.querySelector('.sim-reset').onclick=reset;
 const observer=new ResizeObserver(draw);observer.observe(canvas);const themeObserver=new MutationObserver(draw);themeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});draw();
 return {reset,dispose(){disposed=true;stop();observer.disconnect();themeObserver.disconnect();}};
}
