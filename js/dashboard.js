
function expand(rec){
  const rows=[]; for(let i=0;i<rec.questions.length;i++){
    const q=rec.questions[i]; const nota=rec.answers[i]==null? '' : Number(rec.answers[i]);
    const meta = metaFromRowForCargo(q.metas||{}, rec.profile?.cargo||''); const status=(meta==null||nota==='')?'':(nota>=meta?'OK':'Abaixo da meta');
    rows.push({ Email:rec.email, Quarter:rec.quarter, Data:new Date(rec.when).toLocaleString(), Nome:rec.profile?.nome||'', Area:rec.profile?.area||'', Cargo:rec.profile?.cargo||'',
                Categoria:q.category||'Geral', Pergunta:q.question, Nota:nota, Meta: meta==null?'':meta, Status:status });
  } return rows;
}
function drawBar(canvas, labels, values){
  const ctx=canvas.getContext('2d'); const W=canvas.width, H=canvas.height; ctx.clearRect(0,0,W,H);
  const pad=40, n=Math.max(1,labels.length), bw=(W-2*pad)/n*0.7, gap=(W-2*pad)/n*0.3;
  for(let y=1;y<=5;y++){ const yy=H-pad-(H-2*pad)*(y/5); ctx.strokeStyle='#eee'; ctx.beginPath(); ctx.moveTo(pad,yy); ctx.lineTo(W-pad,yy); ctx.stroke(); ctx.fillStyle='#999'; ctx.font='12px sans-serif'; ctx.fillText(String(y), 10, yy+4); }
  for(let i=0;i<labels.length;i++){ const v=values[i]||0; const x=pad+i*(bw+gap); const h=(H-2*pad)*(v/5);
    ctx.fillStyle=v>=4?'#66bb6a':(v>=3?'#ffca28':'#ef5350'); ctx.fillRect(x, H-pad-h, bw, h);
    ctx.save(); ctx.translate(x+bw/2, H-pad+14); ctx.rotate(-Math.PI/6); ctx.fillStyle='#333'; ctx.fillText(labels[i].slice(0,14), -30,0); ctx.restore();
  }
}
function drawPie(canvas, values){
  const ctx=canvas.getContext('2d'); const W=canvas.width, H=canvas.height; ctx.clearRect(0,0,W,H);
  const total=(values.reduce((a,b)=>a+b,0))||1; const cx=W/2, cy=H/2, r=Math.min(W,H)/3; let ang=0; const colors=['#66bb6a','#ffca28','#ef5350'];
  values.forEach((v,i)=>{ const a=(v/total)*Math.PI*2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,ang+a); ctx.closePath(); ctx.fillStyle=colors[i]; ctx.fill(); ang+=a; });
  ctx.fillStyle='#333'; ctx.font='14px sans-serif'; ctx.fillText('>= Meta / -1 ponto / >1 abaixo', cx-100, cy+r+20);
}
document.addEventListener('DOMContentLoaded', ()=>{
  const session=getSession(); if(!session){ location.href='index.html'; return; }
  const whoGate=document.getElementById('gate'); const dash=document.getElementById('dash');
  if(session.user.role!=='MANAGER' && session.user.role!=='ADMIN'){ whoGate.textContent='Acesso restrito a MANAGER/ADMIN.'; whoGate.style.display='block'; return; }
  dash.style.display='block';
  const select=document.getElementById('filterQuarter');
  function load(){
    const all=getAllResponses(); const q=select.value; let recs=all; if(q) recs=recs.filter(r=>r.quarter===q);
    let rows=[]; recs.forEach(r=>rows.push(...expand(r)));
    const thead=document.querySelector('#tbl thead'); const tbody=document.querySelector('#tbl tbody'); thead.innerHTML=''; tbody.innerHTML='';
    thead.innerHTML=`<tr><th>Email</th><th>Quarter</th><th>Nome</th><th>Área</th><th>Cargo</th><th>Categoria</th><th>Pergunta</th><th>Nota</th><th>Meta</th><th>Status</th><th>Data</th></tr>`;
    rows.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${r.Email}</td><td>${r.Quarter}</td><td>${r.Nome}</td><td>${r.Area}</td><td>${r.Cargo}</td><td>${r.Categoria}</td><td>${r.Pergunta}</td><td>${r.Nota}</td><td>${r.Meta}</td><td>${r.Status}</td><td>${r.Data}</td>`; tbody.appendChild(tr); });
    const bucket=[0,0,0]; rows.forEach(r=>{ if(r.Nota==='') return; const nota=Number(r.Nota); const meta=parseFloat(r.Meta); if(!isNaN(meta)){ if(nota>=meta) bucket[0]++; else if(nota===meta-1) bucket[1]++; else bucket[2]++; } });
    const byCat=new Map(); rows.forEach(r=>{ if(r.Nota==='') return; const arr=byCat.get(r.Categoria)||[]; arr.push(Number(r.Nota)); byCat.set(r.Categoria, arr); });
    const labels=[...byCat.keys()]; const values=labels.map(k=>{ const a=byCat.get(k); return (a.reduce((x,y)=>x+y,0)/a.length)||0; });
    drawBar(document.getElementById('bar'), labels, values); drawPie(document.getElementById('pie'), bucket);
  }
  select.addEventListener('change', load);
  document.getElementById('btnReload').addEventListener('click', load);
  document.getElementById('btnExport').addEventListener('click', ()=>{ const all=getAllResponses(); let rows=[]; all.forEach(r=>rows.push(...expand(r))); downloadCSV('self_assessment_detalhado.csv', rows); });
  load();
});
