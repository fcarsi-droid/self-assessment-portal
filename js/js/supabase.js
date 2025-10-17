
function hasSupabase(){
  const c = (window.SUPABASE||{});
  return c && typeof c.url==='string' && c.url.startsWith('http') && c.anonKey && c.anonKey.length>10;
}
async function saveToSupabase(payload){
  if(!hasSupabase()) return { ok:false, reason:'not_configured' };
  try{
    const { url, anonKey } = window.SUPABASE;
    const res = await fetch(url.replace(/\/$/, '') + '/rest/v1/responses', {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(()=>null);
    return { ok: res.ok, status: res.status, data };
  }catch(e){
    return { ok:false, error: String(e) };
  }
}
async function fetchFromSupabase(){
  if(!hasSupabase()) return { ok:false, reason:'not_configured', data: [] };
  try{
    const { url, anonKey } = window.SUPABASE;
    const res = await fetch(url.replace(/\/$/, '') + '/rest/v1/responses?select=*', {
      headers: { 'apikey': anonKey, 'Authorization': 'Bearer ' + anonKey }
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data: Array.isArray(data)? data : [] };
  }catch(e){
    return { ok:false, error: String(e), data: [] };
  }
}
function localToRemoteShape(rec){
  const { email, quarter, when, profile, questions, answers, final } = rec;
  const metas = (questions||[]).map(q => q.metas||{});
  return {
    email, quarter,
    nome: (profile&&profile.nome)||'',
    area: (profile&&profile.area)||'',
    cargo: (profile&&profile.cargo)||'',
    data: new Date(when||Date.now()).toISOString(),
    respostas: answers||[],
    metas: metas,
    final: !!final
  };
}
function remoteToLocalShape(row){
  return {
    key: `${row.email||''}__${row.quarter||''}__${row.id||row.data||''}`,
    email: row.email||'',
    quarter: row.quarter||'',
    when: row.data||new Date().toISOString(),
    profile: { nome: row.nome||'', area: row.area||'', cargo: row.cargo||'' },
    questions: [],
    answers: Array.isArray(row.respostas)? row.respostas : [],
    final: !!row.final,
    _metaFromDB: row.metas||[]
  };
}
async function mergeLocalWithRemote(){
  const local = (()=>{ try{ return JSON.parse(localStorage.getItem('sap_responses')||'[]'); }catch{return []} })();
  const remote = await fetchFromSupabase();
  const rem = remote.ok ? remote.data.map(remoteToLocalShape) : [];
  return [...rem, ...local];
}
