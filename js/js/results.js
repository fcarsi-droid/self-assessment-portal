
function metaForQuestionCargo(q, cargo){ return metaFromRowForCargo(q.metas||{}, cargo); }
function rowsFrom(rec){
  const { profile, quarter, when, questions, answers } = rec; const rows=[];
  for(let i=0;i<questions.length;i++){
    const q = questions[i]; const nota = answers[i]==null? '' : Number(answers[i]);
    const meta = metaForQuestionCargo(q, profile?.cargo||''); const status = (meta==null||nota==='')? '' : (nota>=meta ? 'OK' : 'Abaixo da meta');
    rows.push({ Nome: profile?.nome||'', Cargo: profile?.cargo||'', Area: profile?.area||'',
      Quarter: quarter, Data: new Date(when).toLocaleString(), Categoria: q.category, Pergunta: q.question, Nota: nota, Meta: meta==null? '' : meta, Status: status });
  } return rows;
}
document.addEventListener('DOMContentLoaded', ()=>{
  const session=getSession(); if(!session){ location.href='index.html'; return; }
  const all=getAllResponses(); const key=`${session.user.email}__${session.quarter}`; const rec=all.find(r=>r.key===key);
  if(!rec){ location.href='assessment.html'; return; }
  const rows=rowsFrom(rec); const vals=rows.map(r=>Number(r.Nota)).filter(v=>!isNaN(v));
  const media=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2):'-';
  const sum=document.getElementById('summaryBox');
  sum.innerHTML=`Nome: <b>${rows[0].Nome||'-'}</b> • Cargo: <b>${rows[0].Cargo||'-'}</b> • Área: <b>${rows[0].Area||'-'}</b> • Quarter: <b>${rows[0].Quarter}</b> • Data: <b>${rows[0].Data}</b> • Média geral: <b>${media}</b>`;
  const below=rows.filter(r=>r.Meta!=='' && Number(r.Nota)<Number(r.Meta));
  const list=document.getElementById('belowList'); if(below.length){ list.style.display='block'; list.innerHTML=below.map(r=>`• ${r.Categoria} — ${r.Pergunta} (Meta ${r.Meta}) — Nota ${r.Nota}`).join('<br/>'); }
  document.getElementById('resCard').style.display='block';
  document.getElementById('btnExport').addEventListener('click', ()=>downloadCSV('self_assessment_detalhado.csv', rows));
});
