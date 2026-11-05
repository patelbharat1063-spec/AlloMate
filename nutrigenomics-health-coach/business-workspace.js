(()=>{'use strict';
const $=id=>document.getElementById(id), today=()=>new Date().toISOString().slice(0,10);
const KEY='NHC.BusinessWorkspace.v1';let uid=null,db=null,cloudTimer=null,records={clients:[],consultations:[],followups:[],plans:[],appointments:[]},edit={client:null,consultation:null,followup:null,plan:null,appointment:null},active='workspaceHome';
const blank=()=>({clients:[],consultations:[],followups:[],plans:[],appointments:[]});
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const newId=()=> 'WS-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
function localKey(){return KEY+'.'+uid}
function loadLocal(){try{const x=JSON.parse(localStorage.getItem(localKey())||'null');if(x&&x.version===1)records={...blank(),...x.records}}catch(e){console.warn('Workspace local data unavailable',e)}}
function persist(){try{localStorage.setItem(localKey(),JSON.stringify({version:1,records,updatedAt:new Date().toISOString()}))}catch(e){status('Device storage is full or unavailable.')}}
function status(s){const n=$('workspaceStatus');if(n)n.textContent=s}
function save(){persist();renderAll();status(navigator.onLine?'Saved on this device · syncing cloud…':'Saved on this device · offline');if(uid&&db&&navigator.onLine){clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>db.collection('users').doc(uid).collection('private').doc('workspace').set({records,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(()=>status('Saved on device and synced to Firebase.')).catch(e=>status('Saved on device · cloud sync pending ('+(e.code||'network')+').')),500)}}
function merge(a,b){const out=blank();for(const k of Object.keys(out)){const m=new Map();(b[k]||[]).forEach(x=>m.set(x.id,x));(a[k]||[]).forEach(x=>m.set(x.id,x));out[k]=[...m.values()]}return out}
function activate(id){active=id;document.querySelectorAll('.workspace-tabs [data-wtab]').forEach(b=>b.classList.toggle('active',b.dataset.wtab===id));document.querySelectorAll('.workspace-panel').forEach(p=>p.classList.toggle('active',p.id===id));renderAll()}
function formValue(id){return $(id).value.trim()}
function clearForm(type){edit[type]=null;const form=$(type+'Form');if(form)form.reset();const btn=$(type+'Save');if(btn)btn.textContent='Save '+type}
function clientName(id){return records.clients.find(x=>x.id===id)?.name||'Client record unavailable'}
function item(title,sub,body,id,type){return '<article class="workspace-item"><div class="workspace-item-top"><b>'+safe(title)+'</b><span class="pill">'+safe(sub||'No date')+'</span></div><p>'+safe(body||'')+'</p><div class="workspace-actions"><button type="button" data-edit="'+safe(type)+'" data-id="'+safe(id)+'">Edit</button><button type="button" class="delete" data-remove="'+safe(type)+'" data-id="'+safe(id)+'">Delete</button></div></article>'}
function renderList(target,arr,fn){$(target).innerHTML=arr.length?arr.map(fn).join(''):'<div class="workspace-empty">No records yet. Add the first entry above.</div>'}
function installExtendedWorkspace(){
 const tabs=document.querySelector('.workspace-tabs');
 if(!tabs||$('workspacePlans'))return;
 tabs.insertAdjacentHTML('beforeend','<button data-wtab="workspaceAppointments">Appointments</button><button data-wtab="workspacePlans">Nutrition plans</button>');
 const anchor=$('workspaceTools');
 anchor.insertAdjacentHTML('beforebegin',`
 <section class="workspace-panel" id="workspaceAppointments"><h2>Appointment calendar</h2><p class="muted">Schedule client conversations and track attendance.</p>
 <form id="appointmentForm"><div class="workspace-form">
 <div class="field"><label for="apClient">Client</label><select id="apClient" required><option value="">Select client</option></select></div>
 <div class="field"><label for="apDate">Appointment date</label><input id="apDate" type="date" required></div>
 <div class="field"><label for="apTime">Time</label><input id="apTime" type="time"></div>
 <div class="field"><label for="apMode">Meeting mode</label><select id="apMode"><option>In person</option><option>Phone</option><option>Video call</option><option>Other</option></select></div>
 <div class="field"><label for="apStatus">Status</label><select id="apStatus"><option>Scheduled</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option><option>No show</option></select></div>
 <div class="field"><label for="apTopic">Purpose</label><input id="apTopic" maxlength="140" required></div>
 <div class="field wide"><label for="apNotes">Administrative notes</label><textarea id="apNotes" maxlength="1000"></textarea></div>
 </div><div class="actions"><button class="workspace-primary" id="appointmentSave">Save appointment</button><button type="reset" class="workspace-secondary" onclick="document.getElementById('appointmentSave').textContent='Save appointment'">Clear</button></div></form>
 <div id="appointmentList" class="workspace-list"></div></section>
 <section class="workspace-panel" id="workspacePlans"><h2>Personalised nutrition plans</h2><p class="muted">Record general, educational food and lifestyle actions agreed with each client. This is not a clinical diet prescription.</p>
 <form id="planForm"><div class="workspace-form">
 <div class="field"><label for="plClient">Client</label><select id="plClient" required><option value="">Select client</option></select></div>
 <div class="field"><label for="plTitle">Plan title</label><input id="plTitle" maxlength="140" required></div>
 <div class="field"><label for="plDate">Start date</label><input id="plDate" type="date" required></div>
 <div class="field"><label for="plReview">Review date</label><input id="plReview" type="date"></div>
 <div class="field"><label for="plStatus">Status</label><select id="plStatus"><option>Draft</option><option>Active</option><option>On review</option><option>Completed</option></select></div>
 <div class="field wide"><label for="plGoals">Client-stated goals</label><textarea id="plGoals" maxlength="1200"></textarea></div>
 <div class="field wide"><label for="plActions">General nutrition & lifestyle actions</label><textarea id="plActions" maxlength="2200"></textarea></div>
 <div class="field wide"><label for="plNotes">Follow-up notes</label><textarea id="plNotes" maxlength="1000"></textarea></div>
 </div><div class="actions"><button class="workspace-primary" id="planSave">Save plan</button><button type="reset" class="workspace-secondary" onclick="document.getElementById('planSave').textContent='Save plan'">Clear</button></div></form>
 <div id="planList" class="workspace-list"></div></section>`);
 $('appointmentForm').addEventListener('submit',e=>{e.preventDefault();const o={id:edit.appointment||newId(),clientId:formValue('apClient'),date:formValue('apDate'),time:formValue('apTime'),mode:formValue('apMode'),status:formValue('apStatus'),topic:formValue('apTopic'),notes:formValue('apNotes'),updatedAt:new Date().toISOString()};if(!o.clientId){alert('Select a client first.');return}const i=records.appointments.findIndex(x=>x.id===o.id);if(i>=0)records.appointments[i]=o;else records.appointments.unshift(o);clearForm('appointment');save()});
 $('planForm').addEventListener('submit',e=>{e.preventDefault();const o={id:edit.plan||newId(),clientId:formValue('plClient'),title:formValue('plTitle'),date:formValue('plDate'),reviewDate:formValue('plReview'),status:formValue('plStatus'),goals:formValue('plGoals'),actions:formValue('plActions'),notes:formValue('plNotes'),updatedAt:new Date().toISOString()};if(!o.clientId){alert('Select a client first.');return}const i=records.plans.findIndex(x=>x.id===o.id);if(i>=0)records.plans[i]=o;else records.plans.unshift(o);clearForm('plan');save()});
 $('apDate').value=today();$('plDate').value=today();
}
function renderAll(){
 if(!$('workspaceClientCount'))return;
 if(!$('workspacePlans'))installExtendedWorkspace();
 $('workspaceClientCount').textContent=records.clients.length;
 $('workspaceConsultCount').textContent=records.consultations.length;
 $('workspaceFollowCount').textContent=records.followups.filter(x=>x.status!=='Completed').length;
 $('workspaceUpcoming').textContent=records.followups.filter(x=>x.status!=='Completed'&&x.date>=today()).length;
 const apSel=$('apClient'),plSel=$('plClient');[apSel,plSel].forEach(sel=>{if(sel){const v=sel.value;sel.innerHTML='<option value="">Select client</option>'+records.clients.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.name)+'</option>').join('');sel.value=v}});
 renderList('appointmentList',records.appointments.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.time||'').localeCompare(b.time||'')),x=>item(clientName(x.clientId)+' · '+x.topic,(x.date||'')+' '+(x.time||''),x.status+' · '+x.mode+'\n'+(x.notes||''),x.id,'appointment'));
 renderList('planList',records.plans.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')),x=>item(clientName(x.clientId)+' · '+x.title,x.status+' · '+x.date,'Goals: '+(x.goals||'—')+'\nActions: '+(x.actions||'—')+'\nReview: '+(x.reviewDate||'Not set')+'\nNotes: '+(x.notes||'—'),x.id,'plan'));
 const q=($('clientSearch')?.value||'').toLowerCase();
 renderList('clientList',records.clients.filter(x=>(x.name+' '+x.phone+' '+x.email).toLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name)),x=>item(x.name,x.status||'Active','Client ID: '+x.code+'\nPhone: '+(x.phone||'—')+' · Email: '+(x.email||'—')+'\nGoal: '+(x.goal||'Not specified')+'\nDiet: '+(x.diet||'Not specified')+'\nNotes: '+(x.notes||'—'),x.id,'client'));
 renderList('consultationList',records.consultations.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')),x=>item(clientName(x.clientId)+' · '+x.type,x.date,'Summary: '+(x.summary||'—')+'\nPlan: '+(x.plan||'—')+'\nNext review: '+(x.nextDate||'Not set'),x.id,'consultation'));
 renderList('followupList',records.followups.slice().sort((a,b)=>(a.date||'').localeCompare(b.date||'')),x=>item(clientName(x.clientId)+' · '+x.topic,x.date,x.status+'\n'+(x.notes||'No notes'),x.id,'followup'));
 const sel=$('consultClient');if(sel){const v=sel.value;sel.innerHTML='<option value="">Select client</option>'+records.clients.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.name)+'</option>').join('');sel.value=v}
 const fsel=$('followClient');if(fsel){const v=fsel.value;fsel.innerHTML='<option value="">Select client</option>'+records.clients.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.name)+'</option>').join('');fsel.value=v}
 const upcoming=records.followups.filter(x=>x.status!=='Completed').sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(0,6);
 renderList('workspaceUpcomingList',upcoming,x=>item(clientName(x.clientId)+' · '+x.topic,x.date,x.status+' · '+(x.notes||''),x.id,'followup'));
}
$('clientForm').addEventListener('submit',e=>{e.preventDefault();const o={id:edit.client||newId(),code:formValue('clCode')||'CL-'+Date.now().toString().slice(-6),name:formValue('clName'),phone:formValue('clPhone'),email:formValue('clEmail'),age:formValue('clAge'),diet:formValue('clDiet'),goal:formValue('clGoal'),status:formValue('clStatus'),notes:formValue('clNotes'),updatedAt:new Date().toISOString()};const i=records.clients.findIndex(x=>x.id===o.id);if(i>=0)records.clients[i]=o;else records.clients.unshift(o);clearForm('client');save()});
$('consultationForm').addEventListener('submit',e=>{e.preventDefault();const o={id:edit.consultation||newId(),clientId:formValue('consultClient'),date:formValue('coDate'),type:formValue('coType'),summary:formValue('coSummary'),plan:formValue('coPlan'),nextDate:formValue('coNext'),updatedAt:new Date().toISOString()};if(!o.clientId){alert('Select a client first.');return}const i=records.consultations.findIndex(x=>x.id===o.id);if(i>=0)records.consultations[i]=o;else records.consultations.unshift(o);clearForm('consultation');save()});
$('followupForm').addEventListener('submit',e=>{e.preventDefault();const o={id:edit.followup||newId(),clientId:formValue('followClient'),date:formValue('fuDate'),topic:formValue('fuTopic'),status:formValue('fuStatus'),notes:formValue('fuNotes'),updatedAt:new Date().toISOString()};if(!o.clientId){alert('Select a client first.');return}const i=records.followups.findIndex(x=>x.id===o.id);if(i>=0)records.followups[i]=o;else records.followups.unshift(o);clearForm('followup');save()});
document.addEventListener('click',e=>{
 const tab=e.target.closest('[data-wtab]');if(tab){activate(tab.dataset.wtab);return}
 const del=e.target.closest('[data-remove]');if(del){const k=del.dataset.remove==='plan'?'plans':del.dataset.remove==='appointment'?'appointments':del.dataset.remove+'s';if(!confirm('Delete this '+del.dataset.remove+' record? Linked consultation and follow-up records will be kept.'))return;records[k]=records[k].filter(x=>x.id!==del.dataset.id);save();return}
 const ed=e.target.closest('[data-edit]');if(ed){const type=ed.dataset.edit,key=type==='plan'?'plans':type==='appointment'?'appointments':type+'s',x=records[key].find(v=>v.id===ed.dataset.id);if(!x)return;edit[type]=x.id;
 const fields=type==='client'?{clCode:'code',clName:'name',clPhone:'phone',clEmail:'email',clAge:'age',clDiet:'diet',clGoal:'goal',clStatus:'status',clNotes:'notes'}:type==='consultation'?{consultClient:'clientId',coDate:'date',coType:'type',coSummary:'summary',coPlan:'plan',coNext:'nextDate'}:type==='followup'?{followClient:'clientId',fuDate:'date',fuTopic:'topic',fuStatus:'status',fuNotes:'notes'}:type==='appointment'?{apClient:'clientId',apDate:'date',apTime:'time',apMode:'mode',apStatus:'status',apTopic:'topic',apNotes:'notes'}:{plClient:'clientId',plTitle:'title',plDate:'date',plReview:'reviewDate',plStatus:'status',plGoals:'goals',plActions:'actions',plNotes:'notes'};
 Object.entries(fields).forEach(([id,key])=>$(id).value=x[key]??'');$(type+'Save').textContent='Update '+type;activate(type==='client'?'workspaceClients':type==='consultation'?'workspaceConsultations':type==='followup'?'workspaceFollowups':type==='appointment'?'workspaceAppointments':'workspacePlans');return}
});
$('clientSearch').addEventListener('input',renderAll);
$('workspaceExport').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({app:'Nutrigenomics Business Workspace',version:1,exportedAt:new Date().toISOString(),records},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nutrigenomics-workspace-backup.json';a.click();URL.revokeObjectURL(a.href);status('Workspace backup exported.')});
$('workspaceImport').addEventListener('change',async()=>{const f=$('workspaceImport').files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(x.app!=='Nutrigenomics Business Workspace'||x.version!==1||!x.records)throw Error('Unsupported workspace backup.');if(!confirm('Merge these workspace records with the current records?'))return;records=merge(records,x.records);save();status('Workspace backup merged.')}catch(e){status('Import failed: '+e.message)}finally{$('workspaceImport').value=''}});
$('workspaceImportBtn').onclick=()=>$('workspaceImport').click();
$('workspaceCsv').onclick=()=>{const rows=[['Client ID','Name','Phone','Email','Age','Diet','Goal','Status','Notes'],...records.clients.map(x=>[x.code,x.name,x.phone,x.email,x.age,x.diet,x.goal,x.status,x.notes])];const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='client-register.csv';a.click();URL.revokeObjectURL(a.href);status('Client register CSV exported.')};
$('workspaceClear').onclick=()=>{if(confirm('Delete all business workspace records from this signed-in account? Export a backup first.')){records=blank();save();status('Business workspace records deleted.')}};
if(window.firebase?.auth&&window.firebase?.firestore){firebase.auth().onAuthStateChanged(async user=>{uid=user?.uid||null;db=firebase.firestore();if(!uid){records=blank();renderAll();status('Sign in to open your private business workspace.');return}loadLocal();renderAll();status('Loading private workspace…');try{const ref=db.collection('users').doc(uid).collection('private').doc('workspace');const snap=await ref.get();if(snap.exists&&snap.data().records){records=merge(records,snap.data().records);persist()}renderAll();status(navigator.onLine?'Private workspace ready · Firebase available':'Offline · workspace saved on this device');}catch(e){status('Workspace available locally · Firebase sync needs attention ('+(e.code||'connection')+').')} });}
window.addEventListener('online',()=>{if(uid)save()});window.addEventListener('offline',()=>status('Offline · changes remain on this device until reconnecting'));
$('clStatus').value='Active';$('clDiet').value='Not specified';$('coDate').value=today();$('fuDate').value=today();
})();