'use strict';
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let history = null;
let side = 'all';
let loadVersion = 0;
const kinds = ['visit','test','procedure','symptom','context','records','planning','gap'];
const kindNames = {visit:'Clinical visit',test:'Hearing test',procedure:'Procedure',symptom:'Reported symptoms',context:'Background',records:'Records activity',planning:'Planning',gap:'Record gap'};
const storyText=e=>e.story||e.text;
const storyTitle=e=>e.storyTitle||e.title;
const isClinical = event => !['records','planning'].includes(event.kind);
function validate(data) {
  if (!data || data.format !== 'continuity-v1') throw new Error('Choose a Continuity history file (.json).');
  const str = (v,max=20000) => typeof v === 'string' && v.length <= max;
  if (!['person','title','updated','intro','note'].every(k=>str(data[k])) || !/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) throw new Error('This history file is missing its summary or review date.');
  const parsedDate=new Date(data.updated+'T00:00:00Z');
  if(Number.isNaN(parsedDate.getTime())||parsedDate.toISOString().slice(0,10)!==data.updated) throw new Error('This history file has an invalid review date.');
  if (!Array.isArray(data.events)||!data.events.length||data.events.length>500||!Array.isArray(data.sources)||data.sources.length>100) throw new Error('This history file has an invalid event or source list.');
  for (const key of ['questions','conflicts','missing']) if (!Array.isArray(data[key])||data[key].length>100||!data[key].every(v=>str(v))) throw new Error('This history file has an invalid '+key+' list.');
  if (!Array.isArray(data.summary)||data.summary.length>4||!data.summary.every(v=>v&&['label','title','text'].every(k=>str(v[k])))) throw new Error('This history file has an invalid overview.');
  if(data.storyGoal!==undefined&&!str(data.storyGoal))throw new Error('Invalid story goal.');
  const ids=new Set();
  data.sources.forEach(s=>{if(!s||!str(s.id,16)||!/^[A-Za-z0-9_-]+$/.test(s.id)||ids.has(s.id)||!str(s.title)||!str(s.note)) throw new Error('Invalid or duplicate source reference.');ids.add(s.id);});
  data.events.forEach(e=>{
    if(!e||!['title','date','year','text','evidence'].every(k=>str(e[k]))||(['briefText','story','storyTitle','storyDate','storyPrintText'].some(k=>e[k]!==undefined&&!str(e[k])))||(e.keyEvent!==undefined&&typeof e.keyEvent!=='boolean')||!kinds.includes(e.kind)||!Array.isArray(e.sides)||!e.sides.every(s=>['left','right'].includes(s))||!Array.isArray(e.sources)||!e.sources.every(id=>ids.has(id))) throw new Error('An event has an invalid date, category, or source reference.');
  });
  if(data.storyBrief!==undefined&&(!Array.isArray(data.storyBrief)||!data.storyBrief.every(i=>Number.isInteger(i)&&i>=0&&i<data.events.length)))throw new Error('Invalid story milestone reference.');
  if(!Array.isArray(data.brief)||!data.brief.every(i=>Number.isInteger(i)&&i>=0&&i<data.events.length)) throw new Error('The doctor brief has an invalid event reference.');
  return data;
}
function dateLabel(date) {const [year,month,day]=date.split('-').map(Number);return new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day)));}
function errorMessage(text) {$('error').textContent=text;$('error').hidden=false;}
function load(data,isDemo=false) {
  validate(data);
  history=data;side='all';
  $('search').value='';$('activity').checked=false;$('all-events').checked=false;
  document.querySelectorAll('[data-ear]').forEach(b=>{const selected=b.dataset.ear==='all';b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);});
  $('person-label').textContent=data.person.toUpperCase()+' / PERSONAL HISTORY';
  $('history-title').textContent=data.title;$('intro').textContent=data.intro;
  $('updated').textContent='Reviewed '+dateLabel(data.updated);
  $('event-count').textContent=data.events.filter(e=>isClinical(e)&&e.keyEvent!==false).length+' key events';
  $('footer-date').textContent='Source review · '+dateLabel(data.updated);
  $('record-note').textContent=data.note;
  $('summary-cards').innerHTML=data.summary.map(s=>`<article class="summary-card"><div class="card-label">${esc(s.label)}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('');
  for(const [id,key] of [['question-list','questions'],['conflict-list','conflicts'],['missing-list','missing']]) $(id).innerHTML=data[key].map(t=>`<li>${esc(t)}</li>`).join('');
  $('source-list').innerHTML=data.sources.map(s=>`<article class="source-item" id="source-${esc(s.id)}"><div class="source-id">${esc(s.id)}</div><div><h3>${esc(s.title)}</h3><p>${esc(s.note)}</p></div></article>`).join('');
  $('error').hidden=true;$('demo-banner').hidden=!isDemo;
  $('welcome').hidden=true;$('workspace').hidden=false;$('close-file').hidden=false;
  render();window.scrollTo(0,0);$('history-title').setAttribute('tabindex','-1');$('history-title').focus({preventScroll:true});
}
function render() {
  if(!history)return;
  const query=$('search').value.trim().toLowerCase();
  const events=history.events.filter(e=>(side==='all'||e.sides.includes(side))&&($('activity').checked||isClinical(e))&&($('all-events').checked||$('activity').checked||query||e.keyEvent!==false)&&(!query||[e.title,e.text,e.story||'',e.storyTitle||'',e.date,e.storyDate||'',e.evidence,...e.sources].join(' ').toLowerCase().includes(query)));
  $('visible-count').textContent=events.length+' '+(events.length===1?'entry':'entries');
  const groups=new Map();for(const e of events){if(!groups.has(e.year))groups.set(e.year,[]);groups.get(e.year).push(e);}
  $('timeline-events').innerHTML=events.length?[...groups].map(([year,list])=>`<div class="era"><div class="era-label">${esc(year)}<span>${list.length} ${list.length===1?'ENTRY':'ENTRIES'}</span></div><div class="event-stack">${list.map(e=>`<article class="event ${e.kind}"><div class="event-top"><span class="event-date">${esc(e.storyDate||e.date)}</span><span class="tag ${e.kind}">${esc(kindNames[e.kind])}</span></div><h3>${esc(storyTitle(e))}</h3><p>${esc(storyText(e))}</p><details><summary>Medical detail & sources</summary><div class="event-source">${e.story||e.storyTitle||e.storyDate?`<p><strong>${esc(e.date)} · ${esc(e.title)}</strong></p><p>${esc(e.text)}</p>`:''}${esc(e.evidence)}<div>${e.sources.map(id=>`<a class="source-ref" href="#source-${esc(id)}">${esc(id)} ↗</a>`).join('')}</div></div></details></article>`).join('')}</div></div>`).join(''):'<p class="empty">No entries match. Try another ear or search, or include records activity.</p>';
}
function buildPrint(full=false) {
  if(!history)return;
  const d=history;
  const brief=d.storyBrief||d.brief;
  $('print-document').classList.toggle('story-print',!full&&Boolean(d.storyBrief));
  const sourceText=e=>`${e.evidence}${e.sources.length?' · Sources: '+e.sources.join(', '):''}`;
  const heading=`<div class="print-kicker">CONFIDENTIAL · PERSONAL MEDICAL HISTORY${!$('demo-banner').hidden?' · FICTIONAL EXAMPLE':''}</div><h1>${esc(d.person)} · ${esc(d.title)}</h1><p class="print-meta">Source review: ${esc(dateLabel(d.updated))} · Printed: ${esc(new Date().toLocaleDateString('en-US'))} · ${full?'Full medical history':'My story in plain English'}</p><p>${esc(d.intro)}</p><div class="print-cover-note">${esc(d.note)}</div>`;
  const summary=`<div class="print-grid">${d.summary.map(s=>`<div><h3>${esc(s.label)} · ${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('')}</div>`;
  const eventList=(full?d.events:brief.map(i=>d.events[i])).map(e=>`<article class="${full?'full-event':'print-event'}"><h3>${esc(full?e.date:(e.storyDate||e.date))} · ${esc(full?e.title:storyTitle(e))}</h3><p>${esc(full?e.text:(d.storyBrief?(e.storyPrintText||storyText(e)):(e.briefText||storyText(e))))}</p><p class="print-source">${esc(sourceText(e))}</p></article>`).join('');
  const lists=(full||!d.storyBrief)?`<h2>Questions for the visit</h2><ol>${d.questions.map(t=>`<li>${esc(t)}</li>`).join('')}</ol><h2>Unresolved history and records</h2><ul class="print-uncertainty">${d.conflicts.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><h2>Records still to locate</h2><ul class="print-uncertainty">${d.missing.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:`<h2>What I want help with</h2><p>${esc(d.storyGoal||d.questions.join(' '))}</p>`;
  const relevant=full?new Set(d.sources.map(s=>s.id)):new Set(brief.flatMap(i=>d.events[i].sources));
  const sources=(full||!d.storyBrief)?`<h2>Source key</h2>${d.sources.filter(s=>relevant.has(s.id)).map(s=>`<div class="print-source-row"><strong>${esc(s.id)} · ${esc(s.title)}</strong> — ${esc(s.note)}</div>`).join('')}`:'<p class="print-source">The full medical notes and source references are kept in the detailed history.</p>';
  $('print-document').innerHTML=heading+summary+`<h2>${full?'Complete medical chronology':'The sequence of events'}</h2>`+eventList+lists+sources+(full||!d.storyBrief?'<h2>Visit notes</h2><div class="notes-line"></div><div class="notes-line"></div>':'');
}
function printView(full=false) {if(history){buildPrint(full);window.print();}}
async function openFile(file) {
  const version=++loadVersion;
  if(!file)return;
  if(file.size>2*1024*1024){errorMessage('This file is too large. Choose your history JSON file, not a PDF or image.');return;}
  try {const data=JSON.parse(await file.text());if(version===loadVersion)load(data);}
  catch(error){if(version===loadVersion)errorMessage(error instanceof SyntaxError?'This file is not valid JSON. Choose your private history file.':error.message);}
  finally {$('file-input').value='';}
}
$('open-file').addEventListener('click',()=>$('file-input').click());
$('file-input').addEventListener('change',e=>openFile(e.target.files[0]));
$('close-file').addEventListener('click',()=>{loadVersion++;history=null;side='all';for(const id of ['person-label','history-title','intro','updated','event-count','footer-date','record-note','summary-cards','timeline-events','question-list','conflict-list','missing-list','source-list','print-document','visible-count']) $(id).replaceChildren();$('search').value='';$('file-input').value='';$('workspace').hidden=true;$('welcome').hidden=false;$('close-file').hidden=true;$('error').hidden=true;window.scrollTo(0,0);$('passphrase').focus();});
for(const b of document.querySelectorAll('[data-ear]'))b.addEventListener('click',()=>{side=b.dataset.ear;document.querySelectorAll('[data-ear]').forEach(el=>{const selected=el===b;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',selected);});render();});
$('search').addEventListener('input',render);$('activity').addEventListener('change',render);$('all-events').addEventListener('change',render);
$('print-brief').addEventListener('click',()=>printView(false));$('print-full').addEventListener('click',()=>printView(true));
window.addEventListener('afterprint',()=>$('print-document').replaceChildren());
window.addEventListener('beforeprint',()=>{if(history&&!$('print-document').childElementCount)buildPrint(false);});
const sectionObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){for(const a of document.querySelectorAll('.sidebar a'))a.classList.toggle('active',a.hash==='#'+entry.target.id);}},{rootMargin:'-5% 0px -65% 0px'});
for(const id of ['overview','timeline','questions','sources'])sectionObserver.observe($(id));
$('demo').addEventListener('click',()=>{loadVersion++;load({format:'continuity-v1',person:'Example patient',title:'A clearer picture.',updated:'2026-01-15',intro:'A fictional example showing how visits, tests, and your own observations come together in one useful record.',note:'Example information only. Open your private file to see your own history. Historical records are separate from a current examination.',summary:[{label:'LEFT EAR',title:'A documented starting point',text:'Tests and observations are kept together, with the source and date attached.'},{label:'RIGHT EAR',title:'Room for the full story',text:'Your experience matters alongside what a test measures.'}],questions:['What has changed since the last test?','Which next step would best address my daily listening needs?'],conflicts:['A remembered date differs from the chart. Both are retained until clarified.'],missing:['An older test report is still to locate.'],sources:[{id:'EX1',title:'Fictional clinic note',note:'An illustrative source, not a real medical document.'}],brief:[0,1,2],events:[{date:'September 2024',year:'2024',title:'A first conversation',kind:'visit',sides:['left','right'],text:'A clinician records concerns, goals, and a plan for testing.',evidence:'Fictional chart example',sources:['EX1']},{date:'March 2025',year:'2025',title:'A baseline to compare',kind:'test',sides:['left','right'],text:'A hearing test becomes a dated reference for future conversations.',evidence:'Fictional test example',sources:['EX1']},{date:'January 2026',year:'2026',title:'What matters in daily life',kind:'symptom',sides:['left'],text:'Listening in company remains an important goal to discuss at the next visit.',evidence:'Fictional patient observation',sources:['EX1']} ]},true);});

// The only network read is the encrypted snapshot on this same site.
$('show-passphrase').addEventListener('click',()=>{const visible=$('passphrase').type==='password';$('passphrase').type=visible?'text':'password';$('show-passphrase').textContent=visible?'Hide':'Show';$('show-passphrase').setAttribute('aria-pressed',visible);});
$('unlock-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const version=++loadVersion;
  let passphrase=$('passphrase').value.trim();
  $('passphrase').value='';$('passphrase').type='password';$('show-passphrase').textContent='Show';$('show-passphrase').setAttribute('aria-pressed','false');
  $('unlock').disabled=true;$('error').hidden=true;$('unlock-status').textContent='Unlocking your story…';
  try{
    if(!globalThis.crypto?.subtle)throw new Error('Use the secure website link in Safari or Chrome to unlock your story.');
    const response=await fetch('history.enc.json',{cache:'no-store',credentials:'omit',redirect:'error'});
    if(!response.ok)throw new Error('The history could not be loaded. Check your connection and try again.');
    const raw=await response.text();
    if(raw.length>3000000)throw new Error('The encrypted history could not be read.');
    const envelope=JSON.parse(raw);
    if(envelope.format!=='continuity-encrypted-v1'||envelope.iterations!==600000)throw new Error('The encrypted history could not be read.');
    const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
    const salt=bytes(envelope.salt),iv=bytes(envelope.iv),ciphertext=bytes(envelope.ciphertext);
    if(salt.length!==16||iv.length!==12||ciphertext.length<16)throw new Error('The encrypted history could not be read.');
    const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);passphrase='';
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,{name:'AES-GCM',length:256},false,['decrypt']);
    const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ciphertext);
    if(version===loadVersion)load(JSON.parse(new TextDecoder().decode(plaintext)));
  }catch(error){if(version===loadVersion)errorMessage(error.name==='OperationError'?'That passphrase did not unlock the story. Try again.':error instanceof SyntaxError?'The encrypted history could not be read.':error.message);}
  finally{passphrase='';$('unlock').disabled=false;$('unlock-status').textContent='';}
});
