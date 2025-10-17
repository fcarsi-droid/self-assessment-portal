
function pickField(obj, cands){
  for(const c of cands){ const k = Object.keys(obj).find(x=>x.toLowerCase()===c.toLowerCase()); if(k) return obj[k]; }
  for(const c of cands){ const k = Object.keys(obj).find(x=>x.toLowerCase().includes(c.toLowerCase())); if(k) return obj[k]; }
  return null;
}
async function init(){
  const session=getSession(); if(!session){ location.href='index.html'; return; }
  document.getElementById('quarterSpan').textContent=session.quarter; document.getElementById('dateSpan').textContent=new Date().toLocaleString();
  let raw=''; try{ raw = await (await fetch('data/questions.csv',{cache:'no-store'})).text(); }catch(e){ const el=document.getElementById('qError'); el.style.display='block'; el.textContent='Erro ao baixar questions.csv'; return; }
  let rows=[]; try{ rows=parseCSV(raw); }catch(e){ const el=document.getElementById('qError'); el.style.display='block'; el.textContent='Erro ao interpretar CSV: '+e.message; return; }

  const questions = rows.map(o=>{
    const q = (pickField(o,['pergunta','question','perguntas','titulo','q','text'])||'').trim();
    const cat = (pickField(o,['categoria','category','area','grupo'])||'Geral').trim();
    const metas={}; Object.keys(o).forEach(k=>{ const kk=k.toLowerCase(); if(kk.startsWith('meta')||kk.includes('goal')||kk.includes('target')) metas[k]=o[k]; });
    return { question:q, category:cat, metas };
  }).filter(x=>x.question);

  if(questions.length===0){
    const el=document.getElementById('qError'); const preview = raw.split(/\r?\n/).slice(0,5).join('\n');
    el.style.display='block'; el.innerHTML='Nenhuma pergunta encontrada.<br>Verifique os cabeçalhos: "categoria","pergunta","meta_Senior Outbound Planner",...<br><pre style="white-space:pre-wrap">'+preview+'</pre>'; return;
  }

  const container=document.getElementById('questions'); container.innerHTML='';
  questions.forEach((q,idx)=>{
    const id=`q_${idx}`; const div=document.createElement('div'); div.className='card';
    div.innerHTML=`<div style="font-weight:700;margin-bottom:6px">${q.question}</div>
      <div class="badge" style="margin-bottom:6px">${q.category}</div>
      <div class="scale">${[1,2,3,4,5].map(v=>`<input id="${id}_${v}" name="${id}" type="radio" value="${v}"><label for="${id}_${v}">${v}</label>`).join('')}</div>`;
    container.appendChild(div);
  });

  document.getElementById('btnSalvar').addEventListener('click', ()=>save(false,questions));
  document.getElementById('btnEnviar').addEventListener('click', ()=>save(true,questions));

  function save(final, qs){
    const nome=document.getElementById('nome').value.trim(); const area=document.getElementById('area').value.trim(); const cargo=document.getElementById('cargo').value.trim();
    const answers=[]; document.querySelectorAll('.scale').forEach(sc=>{ const p=sc.querySelector('input:checked'); answers.push(p?Number(p.value):null); });
    const all=getAllResponses(); const key=`${session.user.email}__${session.quarter}`;
    const rec={ key, email:session.user.email, quarter:session.quarter, when:new Date().toISOString(), profile:{nome,area,cargo}, questions:qs, answers, final };
    const i=all.findIndex(r=>r.key===key); if(i>=0) all[i]=rec; else all.push(rec); setAllResponses(all);
    const banner=document.getElementById('banner'); banner.textContent=final?'Avaliação enviada com sucesso.':'Rascunho salvo com sucesso.'; banner.style.display='block';
    setTimeout(()=>{ banner.style.display='none'; if(final){ location.href='results.html'; } }, 900);
  // ====== Envio ao Supabase ======
try {
  const supabaseClient = window.supabase.createClient(
    SUPABASE.url,
    SUPABASE.anonKey
  );

  const { data, error } = await supabaseClient
    .from('responses')
    .insert([
      {
        email: document.querySelector('#email')?.value || 'anonimo@teste.com',
        quarter: document.querySelector('#quarterSpan')?.innerText || 'Q?',
        nome: document.querySelector('#name')?.value || 'Sem nome',
        area: document.querySelector('#area')?.value || 'Não informada',
        cargo: document.querySelector('#cargo')?.value || 'Não informado',
        respostas: respostas || [],
        metas: metas || [],
        final: true
      }
    ]);

  if (error) {
    console.error('Erro ao gravar no Supabase:', error);
  } else {
    console.log('Registro salvo no Supabase:', data);
  }
} catch (e) {
  console.error('Falha geral Supabase:', e);
}
// ====== Fim do envio ======
  }
}
document.addEventListener('DOMContentLoaded', init);
