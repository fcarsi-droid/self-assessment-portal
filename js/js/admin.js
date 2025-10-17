
document.addEventListener('DOMContentLoaded', ()=>{
  const session=getSession(); if(!session){ location.href='index.html'; return; }
  const gate=document.getElementById('gate'); const card=document.getElementById('adminCard');
  if(session.user.role!=='ADMIN'){ gate.textContent='Acesso restrito a ADMIN.'; gate.style.display='block'; return; }
  card.style.display='block';
  document.getElementById('btnReset').addEventListener('click', ()=>{ if(confirm('Limpar todas as respostas salvas localmente?')){ localStorage.removeItem('sap_responses'); alert('Respostas removidas.'); } });
  document.getElementById('btnExport').addEventListener('click', ()=>{
    const all=getAllResponses(); let rows=[];
    all.forEach(r=>{ for(let i=0;i<r.questions.length;i++){ const q=r.questions[i]; const nota=r.answers[i]==null? '' : Number(r.answers[i]); const meta=metaFromRowForCargo(q.metas||{}, r.profile?.cargo||''); const status=(meta==null||nota==='')?'':(nota>=meta?'OK':'Abaixo da meta');
      rows.push({ Email:r.email, Quarter:r.quarter, Data:new Date(r.when).toLocaleString(), Nome:r.profile?.nome||'', Area:r.profile?.area||'', Cargo:r.profile?.cargo||'', Categoria:q.category||'Geral', Pergunta:q.question, Nota:nota, Meta: meta==null?'':meta, Status:status }); } });
    downloadCSV('self_assessment_detalhado.csv', rows);
  });
  document.getElementById('btnAddUser').addEventListener('click', ()=>{
    const email=document.getElementById('newEmail').value.trim().toLowerCase(); const role=document.getElementById('newRole').value.trim().toUpperCase();
    if(!email) return msg('Informe um e-mail.'); if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return msg('E-mail inválido.');
    const list=getLocalUsers(); const i=list.findIndex(u=>u.email===email); const obj={email,role,name:''}; if(i>=0) list[i]=obj; else list.push(obj); setLocalUsers(list); msg('Usuário adicionado/atualizado localmente.');
  });
  function msg(t){ const el=document.getElementById('adminMsg'); el.textContent=t; el.style.display='block'; setTimeout(()=>el.style.display='none', 3000); }
});
