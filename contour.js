// X is diameter; internal geometry uses radial millimetres and positive depth.
export function sampleContour(points,d,l){
 if(!(d>0&&l>0)||!Number.isFinite(d+l))throw Error('Задай положительные диаметр и длину заготовки.');
 if(points.length>250)throw Error('Максимум 250 элементов контура.');
 if(points.length<2)throw Error('Нужно минимум две точки контура.');
 const out=[];
 for(let i=0;i<points.length;i++){
  const p=points[i];
  if(!Number.isFinite(p.x+p.z)||p.x<=0||p.x>d||p.z>0||p.z < -l)throw Error('X должен быть больше нуля и не больше D; Z — от 0 до −L.');
  if(i===0){if(Math.abs(p.z)>1e-8)throw Error('Первая точка должна начинаться на торце Z0.');out.push({r:p.x/2,z:-p.z});continue;}
  const a=out[out.length-1],b={r:p.x/2,z:-p.z};
  if(b.z<a.z-1e-8)throw Error('Контур должен идти от Z0 в сторону −Z без возврата и поднутрений.');
  if(p.type!=='arc'){out.push(b);continue;}
  const R=Number(p.radius),dr=b.r-a.r,dz=b.z-a.z,chord=Math.hypot(dr,dz);
  if(!(R>0)||chord<1e-8||chord>2*R+1e-8)throw Error('Дуга: радиус должен быть не меньше половины хорды (X учитывается как диаметр).');
  const h=Math.sqrt(Math.max(0,R*R-chord*chord/4)),mr=(a.r+b.r)/2,mz=(a.z+b.z)/2;
  const cr=mr+(p.side===-1?-1:1)*(-dz/chord)*h,cz=mz+(p.side===-1?-1:1)*(dr/chord)*h;
  let a0=Math.atan2(a.z-cz,a.r-cr),delta=Math.atan2(b.z-cz,b.r-cr)-a0;
  while(delta>Math.PI)delta-=2*Math.PI;while(delta < -Math.PI)delta+=2*Math.PI;
  const n=Math.max(12,Math.ceil(Math.abs(delta)*R/.1));if(n>5000)throw Error('Слишком большая дуга для симуляции.');
  for(let j=1;j<=n;j++){const t=a0+delta*j/n,q=j===n?b:{r:cr+R*Math.cos(t),z:cz+R*Math.sin(t)};if(q.z<out[out.length-1].z-1e-6||q.r<=0||q.r>d/2+1e-6||q.z>l+1e-6)throw Error('Эта дуга выходит за заготовку или образует поднутрение. Измени сторону дуги.');out.push(q);}
 }
 const last=out[out.length-1];if(last.z<l){if(Math.abs(last.r-d/2)>1e-8)out.push({r:d/2,z:last.z});out.push({r:d/2,z:l});}return out;
}
export function buildPlan({d,l,ap,feed,points,processing='combined'}){
 if(!(Number.isFinite(feed)&&feed>0)||processing!=='finish'&&!(Number.isFinite(ap)&&ap>0))throw Error('Для проходов введи ap, подачу и обороты.');
 const profile=sampleContour(points,d,l),R=d/2,clear=Math.max(.5,Math.min(2,ap||1)),moves=[];let at={r:R+clear,z:-clear};
 const add=(r,z,cut=false,label='Подвод / отвод')=>{const to={r,z};const length=Math.hypot(r-at.r,z-at.z);if(length>1e-8){moves.push({from:at,to,cut,label,seconds:length/(cut?feed:3000)*60});at=to;}if(moves.length>20000)throw Error('Слишком много проходов: увеличь ap.');};
 const safeTo=(r,z)=>{add(R+clear,at.z);add(R+clear,-clear);add(r,-clear);add(r,z);};
 // A monotone external envelope can be roughed with axial passes at radial layers.
 const minR=Math.min(...profile.map(p=>p.r));if(processing!=='finish'&&(R-minR)/ap>4000)throw Error('Слишком маленькая глубина ap.');
 for(let r=R-ap;processing!=='finish'&&r>minR+1e-8;r-=ap){
  let intervals=[],start=null;
  for(let i=1;i<profile.length;i++){
   const a=profile[i-1],b=profile[i];if(b.z-a.z<1e-8)continue;
   let lo=a.z,hi=b.z;
   if(a.r>=r&&b.r>=r){if(start!==null){intervals.push([start,a.z]);start=null;}continue;}
   if(a.r>=r&&b.r<r)lo=a.z+(r-a.r)/(b.r-a.r)*(b.z-a.z);
   if(a.r<r&&b.r>=r)hi=a.z+(r-a.r)/(b.r-a.r)*(b.z-a.z);
   if(start===null)start=lo;
   if(b.r>=r){intervals.push([start,hi]);start=null;}
  }
  if(start!==null)intervals.push([start,l]);
  for(const [lo,hi]of intervals){if(hi-lo<1e-7)continue;
   if(lo>1e-6){add(R+clear,at.z);add(R+clear,lo);add(r,lo,true,'Черновой вход · X');}
   else safeTo(r,lo-clear);
   add(r,hi,true,'Черновой проход −Z');add(R+clear,hi);
  }
 }
 // Finish follows actual contour: axial, radial, taper and sampled arc segments.
 safeTo(profile[0].r,-clear);add(profile[0].r,0,true,'Вход на контур');
 for(let i=1;i<profile.length;i++){const p=profile[i],a=profile[i-1];add(p.r,p.z,true,Math.abs(p.z-a.z)<1e-8?'Уступ · по X':Math.abs(p.r-a.r)<1e-8?'Контур · по Z':'Контур · X/Z');}
 add(R+clear,at.z);add(R+clear,-clear);
 return {profile,moves,total:moves.reduce((s,m)=>s+m.seconds,0),cutTime:moves.filter(m=>m.cut).reduce((s,m)=>s+m.seconds,0),passes:moves.filter(m=>m.label==='Черновой проход −Z').length};
}
