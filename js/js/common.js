
function detectDelimiter(text){
  const first = (text.split(/\r?\n/).find(l=>l.trim().length>0) || '');
  const scores = {',': (first.match(/,/g)||[]).length, ';': (first.match(/;/g)||[]).length, '\t': (first.match(/\t/g)||[]).length};
  let best = ',', max = -1; for(const k in scores){ if(scores[k]>max){ max=scores[k]; best=k; } } return best;
}
function parseCSV(text){
  const delim = detectDelimiter(text);
  const rows=[]; let row=[], cur='', inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c === '"'){ if(inQ && n === '"'){ cur+='"'; i++; } else inQ = !inQ; }
    else if(((delim==='\t' && c==='\t') || c===delim) && !inQ){ row.push(cur); cur=''; }
    else if((c==='\n'||c==='\r') && !inQ){ if(cur!=='' || row.length>0){ row.push(cur); rows.push(row); row=[]; cur=''; } }
    else { cur += c; }
  }
  if(cur!=='' || row.length>0){ row.push(cur); rows.push(row); }
  const header = rows.shift().map(h=>h.trim());
  return rows.filter(r=>r.length>0).map(r=>{ const o={}; header.forEach((h,i)=>o[h.trim().toLowerCase()]=(r[i]||'').trim()); return o; });
}
async function fetchCSVObjects(path){ const res = await fetch(path,{cache:'no-store'}); if(!res.ok) throw new Error('Falha ao carregar '+path); return parseCSV(await res.text()); }
function downloadCSV(filename, rows){
  if(!rows.length){ alert('Nada para exportar.'); return; }
  const keys=Object.keys(rows[0]); const esc=v=>{ const s=(v==null)?'':(typeof v==='object'?JSON.stringify(v):String(v)); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  const header = keys.join(','); const body = rows.map(r=>keys.map(k=>esc(r[k])).join(',')).join('\n');
  const a=document.createElement('a'); a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(header+'\n'+body); a.download=filename; a.click();
}
function getSession(){ try{ return JSON.parse(localStorage.getItem('sap_session')||'null'); }catch{return null} }
function setSession(o){ localStorage.setItem('sap_session', JSON.stringify(o)); }
function getLocalUsers(){ try{ return JSON.parse(localStorage.getItem('sap_local_users')||'[]'); }catch{return []} }
function setLocalUsers(a){ localStorage.setItem('sap_local_users', JSON.stringify(a)); }
function getAllResponses(){ try{ return JSON.parse(localStorage.getItem('sap_responses')||'[]'); }catch{return []} }
function setAllResponses(a){ localStorage.setItem('sap_responses', JSON.stringify(a)); }
function normCargo(c){ return (c||'').toString().toLowerCase().replace(/[^a-z]/g,''); }
function metaFromRowForCargo(row, cargo){
  const nc = normCargo(cargo); let meta=null;
  for(const k of Object.keys(row)){ const nk=k.toLowerCase(); if(!nk.startsWith('meta')) continue;
    if(nk.includes('senior')&&nk.includes('planner')&&nc.includes('senioroutboundplanner')) meta=row[k];
    else if(nk.includes('outbound')&&nk.includes('planner')&&!nk.includes('senior')&&nc.includes('outboundplanner')) meta=row[k];
    else if(nk.includes('outbound')&&nk.includes('clerk')&&nc.includes('outboundclerk')) meta=row[k];
    else if(nk==='meta'&&meta===null) meta=row[k];
  }
  if(meta===null){ const metas=Object.keys(row).filter(k=>k.toLowerCase().startsWith('meta')); if(metas.length===1) meta=row[metas[0]]; }
  const n=Number(meta); return isNaN(n)? null : n;
}
