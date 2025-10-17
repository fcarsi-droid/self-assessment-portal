
async function loadUsers(){
  const local = getLocalUsers(); let csv=[];
  try{ csv = await fetchCSVObjects('data/users_rows.csv'); }catch{}
  function lower(o){ return Object.keys(o).reduce((a,k)=>({ ...a, [k.toLowerCase()]:o[k] }),{}); }
  function norm(u){ const k=lower(u); return { email:(k.email||k['e-mail']||k.mail||'').toString().trim(), role:(k.role||k.papel||k.perfil||'USER').toString().toUpperCase(), name:(k.name||k.nome||'').toString() }; }
  const merged=new Map(); [...csv.map(norm), ...local].filter(u=>u.email).forEach(u=>merged.set(u.email.toLowerCase(), u)); return [...merged.values()];
}
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('btnLogin').addEventListener('click', async ()=>{
    const email=document.getElementById('email').value.trim().toLowerCase(); const quarter=document.getElementById('quarter').value;
    const msg=document.getElementById('msg'); msg.style.display='none';
    if(!email){ msg.textContent='Informe o e-mail.'; msg.style.display='block'; return; }
    const users=await loadUsers(); const u=users.find(x=>x.email.toLowerCase()===email);
    if(!u){ msg.textContent='Usuário não autorizado.'; msg.style.display='block'; return; }
    setSession({user:u, quarter}); if(u.role==='ADMIN') location.href='admin.html'; else if(u.role==='MANAGER') location.href='dashboard.html'; else location.href='assessment.html';
  });
});
