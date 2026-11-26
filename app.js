'use strict';
const $=id=>document.getElementById(id), KEY='finanzpilot.v1';
const C={
 expense:[['housing','Housing & rent','🏠','#527c72'],['food','Food & drinks','🛒','#5b9b77'],['restaurant','Restaurants & cafés','☕','#c98452'],['shopping','Shopping & clothing','🛍️','#a27db6'],['technology','Technology & electronics','💻','#648fc1'],['tobacco','Tobacco','🚬','#9a8171'],['alcohol','Alcohol','🍷','#a75e72'],['utilities','Electricity, water & heating','⚡','#d5a34e'],['internet','Internet & phone','📱','#6b9da9'],['transport','Transport & fuel','🚗','#8599c1'],['health','Health & pharmacy','✚','#d47b78'],['fitness','Sports & fitness','🏋️','#81a354'],['entertainment','Entertainment & subscriptions','🎮','#a58bc2'],['travel','Travel & holidays','✈️','#51a4ad'],['personal','Personal care','🧴','#c78da8'],['insurance','Insurance & taxes','🛡️','#8b9b87'],['education','Education & work','📚','#b7a05f'],['gifts','Gifts & donations','🎁','#d29483'],['other','Other expenses','•••','#9da9a3'],['leisure','Leisure','🎟️','#a58bc2'],['clothing','Clothing','👕','#a27db6'],['tools','Tools','🛠️','#77939b'],['fuel','Fuel','⛽','#8599c1']],
 income:[['salary','Salary','💼','#399376'],['bonus','Bonus & extra income','✦','#70a66c'],['refund','Refunds & reimbursements','↩','#6a9eb0'],['giftincome','Gift','🎁','#b68aa5'],['otherincome','Other income','＋','#8eaa93']]
};
const cats=Object.fromEntries([...C.expense,...C.income].map(a=>[a[0],{name:a[1],icon:a[2],color:a[3]}]));
const fmt=new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}), money=n=>fmt.format(n/100), percent=n=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(n)+'%';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pad=n=>String(n).padStart(2,'0'), localDate=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`, nowMonth=()=>localDate().slice(0,7), monthOf=d=>d.slice(0,7), monthName=m=>new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'}).format(new Date(+m.slice(0,4),+m.slice(5)-1,1)), shortMonth=m=>new Intl.DateTimeFormat('en-GB',{month:'short'}).format(new Date(+m.slice(0,4),+m.slice(5)-1,1));
const localTime=(d=new Date())=>`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const validTime=t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(t);
const dayName=d=>new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long'}).format(new Date(d+'T12:00:00'));
function shift(m,n){const d=new Date(+m.slice(0,4),+m.slice(5)-1+n,1);return localDate(d).slice(0,7)}
function dayFor(m,d){return m+'-'+pad(Math.min(d,new Date(+m.slice(0,4),+m.slice(5),0).getDate()))}
function validMonth(m){return typeof m==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(m)&&+m.slice(0,4)>=1900&&+m.slice(0,4)<=2200}
function validDate(d){return typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&validMonth(d.slice(0,7))&&+d.slice(-2)>=1&&dayFor(d.slice(0,7),+d.slice(-2))===d}
function uid(){return globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}
function parseAmount(s){s=String(s).trim().replace(/\s|€/g,'');if(s.includes(',')&&s.includes('.')){if(s.lastIndexOf(',')>s.lastIndexOf('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'')}else s=s.replace(',','.');if(/^\.\d{1,2}$/.test(s))s='0'+s;if(/^\d+\.$/.test(s))s=s.slice(0,-1);if(!/^\d+(\.\d{1,2})?$/.test(s))return null;let n=Math.round(Number(s)*100);return Number.isSafeInteger(n)&&n>0&&n<=99999999999?n:null}
const GROUPS=[{id:'food',name:'Food',icon:'🛒',cats:['food','restaurant'],limit:null,max:null},{id:'leisure',name:'Leisure',icon:'🎟️',cats:['leisure','entertainment'],limit:null},{id:'clothing',name:'Clothing',icon:'👕',cats:['clothing'],limit:null},{id:'tools',name:'Tools',icon:'🛠️',cats:['tools'],limit:null},{id:'fuel',name:'Fuel',icon:'⛽',cats:['fuel'],limit:null},{id:'gifts',name:'Gifts',icon:'🎁',cats:['gifts'],limit:null}];
const fresh=()=>({version:1,transactions:[],rules:[],skipped:[],budgets:{},groupLimits:{},monthlyGroupLimits:{},goals:[]});
function cleanLimits(input){const out={};for(const g of GROUPS){if(!input||!Object.hasOwn(input,g.id))continue;const a=input[g.id];if(!a||typeof a!=='object')continue;const good=v=>v===null||(Number.isSafeInteger(v)&&v>0&&v<=99999999999);if(good(a.limit)&&good(a.max)&&(!a.max||!a.limit||a.max>=a.limit))out[g.id]={limit:a.limit,max:a.max};}return out}
function groupLimit(g,m=month){return data.monthlyGroupLimits[m]?.[g.id]||data.groupLimits[g.id]||{limit:null,max:null}}
function groupSpent(g,m=month){return data.transactions.filter(t=>t.type==='expense'&&monthOf(t.date)===m&&g.cats.includes(t.category)).reduce((n,t)=>n+t.amount,0)}
function groupState(g,a,m=month){const {limit,max}=groupLimit(g,m),hard=max||limit;let status='No limit set',cls='';if(hard){if(a>hard){status=money(a-hard)+' over '+(max?'maximum':'limit');cls='over'}else if(a===hard){status=max?'Maximum reached':'Limit reached';cls='over'}else if(limit&&max&&a>=limit){status='Target reached · '+money(hard-a)+' to max';cls='near'}else{const target=limit||hard;status=money(target-a)+' left'+(max&&limit?' to target':'');if(a>=target*.8)cls='near'}}return {limit,max,hard,status,cls}}
function renderGroups(){ $('groupGrid').innerHTML=GROUPS.map(g=>{const a=groupSpent(g),q=groupState(g,a),target=q.limit||q.hard;return `<div class="groupitem ${q.cls}"><div class="groupheading"><b>${g.icon} ${g.name}</b><span class="groupnumbers"><strong>${money(a)}</strong>${target?`<span> / ${money(target)}</span>`:''}</span></div>${target?`<div class="grouptrack"><i style="width:${Math.min(100,a/target*100)}%"></i></div><div class="groupstatus"><span>${q.status}${q.max&&q.limit?' · max '+money(q.max):''}</span><span>${percent(a/target*100)}</span></div>`:'<div class="groupstatus">No limit</div>'}</div>`}).join('')}
function groupReminder(t){if(t.type!=='expense')return '';const g=GROUPS.find(x=>x.cats.includes(t.category));if(!g)return '';const a=groupSpent(g,monthOf(t.date)),q=groupState(g,a,monthOf(t.date));return q.cls?' '+g.name+': '+q.status+'.':''}

let data=fresh(), month=nowMonth(), page='dashboard', type='expense', editing=null, mode='transaction', toastTimer, selectedDay=null;
function showStorageWarning(){ const el=$('storageWarning');el.hidden=false;el.textContent='Permanent storage is unavailable. Open this HTML file in Chrome, Safari or Firefox (not a file preview). Your changes are in memory only. Save a backup in Settings before closing.'; }
function save(){try{const raw=JSON.stringify(data);localStorage.setItem(KEY,raw);if(localStorage.getItem(KEY)!==raw)throw Error('Storage verification failed');$('storageWarning').hidden=true;return true}catch(e){showStorageWarning();return false}}
function notify(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3200)}
function commit(t){const ok=save();render();notify(ok?t:'Not saved permanently — session only. Export a backup.');return ok}
function baseValid(t){return t&&typeof t==='object'&&typeof t.id==='string'&&t.id.length>0&&t.id.length<=200&&['expense','income'].includes(t.type)&&C[t.type].some(c=>c[0]===t.category)&&Number.isSafeInteger(t.amount)&&t.amount>0&&t.amount<=99999999999&&typeof t.description==='string'&&t.description.length<=120}
function validate(d){if(!d||d.version!==1||!Array.isArray(d.transactions)||!Array.isArray(d.rules)||!Array.isArray(d.skipped)||!d.budgets||typeof d.budgets!=='object'||Array.isArray(d.budgets))throw Error('Invalid backup format.');if(d.transactions.length>100000||d.rules.length>500||d.skipped.length>100000)throw Error('Backup is too large.');const ids=new Set();for(const t of d.transactions){if(!baseValid(t)||!validDate(t.date)||ids.has(t.id)||!(t.ruleId==null||typeof t.ruleId==='string'))throw Error('Invalid entry.');ids.add(t.id)}ids.clear();for(const r of d.rules){if(!baseValid(r)||!validDate(r.start)||typeof r.active!=='boolean'||ids.has(r.id))throw Error('Invalid monthly payment.');ids.add(r.id)}if(d.skipped.some(s=>typeof s!=='string'||s.length>250))throw Error('Invalid skipped payment.');const budgets={};for(const [m,a] of Object.entries(d.budgets)){if(!validMonth(m)||!Number.isSafeInteger(a)||a<=0||a>99999999999)throw Error('Invalid budget.');budgets[m]=a}return {version:1,transactions:d.transactions.map(({id,type,amount,date,category,description,ruleId,time})=>({id,type,amount,date,category,description,...(validTime(time)?{time}:{}),...(ruleId?{ruleId}:{})})),rules:d.rules.map(({id,type,amount,start,category,description,active})=>({id,type,amount,start,category,description,active})),skipped:[...new Set(d.skipped)],budgets,goals:validateGoals(d.goals),groupLimits:cleanLimits(d.groupLimits),monthlyGroupLimits:Object.fromEntries(Object.entries(d.monthlyGroupLimits||{}).filter(([m])=>validMonth(m)).map(([m,v])=>[m,cleanLimits(v)]))}}
try{let raw=localStorage.getItem(KEY);if(raw)data=validate(JSON.parse(raw));const probe=KEY+'.probe';localStorage.setItem(probe,'1');if(localStorage.getItem(probe)!=='1')throw Error('Storage unavailable');if(typeof localStorage.removeItem==='function')localStorage.removeItem(probe)}catch(e){showStorageWarning()}
function generate(){let changed=false;const today=localDate(), end=nowMonth(), skip=new Set(data.skipped), existing=new Set(data.transactions.filter(t=>t.ruleId).map(t=>t.ruleId+'|'+monthOf(t.date)));for(const r of data.rules){if(!r.active)continue;let m=monthOf(r.start);while(m<=end){let d=dayFor(m,+r.start.slice(-2)), k=r.id+'|'+m;if(d<=today&&!skip.has(k)&&!existing.has(k)){data.transactions.push({id:uid(),type:r.type,category:r.category,amount:r.amount,description:r.description,date:d,ruleId:r.id});existing.add(k);changed=true}m=shift(m,1)}}if(changed)save()}
function sorted(m=month){return data.transactions.filter(t=>monthOf(t.date)===m).sort((a,b)=>b.date.localeCompare(a.date)||(b.time||'').localeCompare(a.time||'')||b.id.localeCompare(a.id))}
function totals(m){let i=0,e=0;for(const t of data.transactions)if(monthOf(t.date)===m){if(t.type==='income')i+=t.amount;else e+=t.amount}return {i,e,b:i-e}}
function renderMonth(){ $('monthJump').value=month;$('prevMonth').disabled=!validMonth(shift(month,-1));$('nextMonth').disabled=!validMonth(shift(month,1));$('todayMonth').hidden=month===nowMonth()}
function countText(n){return n+' transaction'+(n===1?'':'s')}
function renderDashboard(){let ts=sorted(),t=totals(month),prev=totals(shift(month,-1));$('balance').textContent=money(t.b);$('balanceSub').textContent=t.b<0?'Expenses exceed income.':'Income − expenses';$('income').textContent=money(t.i);$('expense').textContent=money(t.e);$('incomeSub').textContent=countText(ts.filter(x=>x.type==='income').length);$('expenseSub').textContent=countText(ts.filter(x=>x.type==='expense').length);$('savingRate').textContent=t.i?percent(t.b/t.i*100):'—';$('savingRate').className='num';$('savingRate').parentElement.hidden=!t.i;$('savingSub').textContent=t.i?'Net balance / income':'No income recorded yet';const grouped={};for(const x of ts)if(x.type==='expense')grouped[x.category]=(grouped[x.category]||0)+x.amount;let g=Object.entries(grouped).sort((a,b)=>b[1]-a[1]),start=0,stops=[];$('donutTotal').textContent=money(t.e);for(const [c,a] of g){let end=start+a/t.e*100;stops.push(`${cats[c].color} ${start}% ${end}%`);start=end}$('donut').style.background=g.length?`conic-gradient(${stops.join(',')})`:'var(--raised)';$('donut').setAttribute('aria-label',g.length?'Spending breakdown: '+g.map(([c,a])=>cats[c].name+' '+money(a)).join(', '):'No expenses recorded');$('legend').innerHTML=g.length?g.map(([c,a])=>`<div class="legendrow"><i class="swatch" style="background:${cats[c].color}"></i><span class="lname">${esc(cats[c].name)}</span><b>${money(a)}</b><span class="share">${percent(a/t.e*100)}</span></div>`).join(''):'<span class="muted small">Your first expense will appear here.</span>';renderDaily(ts);const b=data.budgets[month];$('budgetText').textContent=b?`${money(t.e)} / ${money(b)} · ${t.e<=b?money(b-t.e)+' left':money(t.e-b)+' over budget'}`:'No total limit set.';$('budgetPercent').textContent=b?percent(t.e/b*100):'';$('budgetFill').style.width=b?Math.min(100,t.e/b*100)+'%':'0%';$('budgetFill').className=b&&t.e>b?'over':'';}
function datesInMonth(){let last=new Date(+month.slice(0,4),+month.slice(5),0).getDate();return Array.from({length:last},(_,i)=>month+'-'+pad(i+1))}
function renderDaily(ts){const dates=datesInMonth(),today=localDate(),byDay={};for(const x of ts)if(x.type==='expense')(byDay[x.date]??=[]).push(x);if(!dates.includes(selectedDay))selectedDay=month===nowMonth()?today:ts[0]?.date||dates[0];const sums=dates.map(d=>(byDay[d]||[]).reduce((n,x)=>n+x.amount,0)),max=Math.max(1,...sums),total=sums.reduce((a,b)=>a+b,0);$('dailySelect').innerHTML=dates.map((d,i)=>`<option value="${d}">${esc(dayName(d))}${d===today?' · Today':''}</option>`).join('');$('dailySelect').value=selectedDay;$('dayChart').style.setProperty('--days',dates.length);$('dayChart').innerHTML=dates.map((d,i)=>`<button type="button" class="daybar${d===selectedDay?' selected':''}" data-day="${d}" aria-pressed="${d===selectedDay}" aria-label="${esc(dayName(d))}: ${money(sums[i])}" title="${esc(dayName(d))}: ${money(sums[i])}"><span class="plot"><span class="fill" style="height:${sums[i]/max*100}%"></span></span><span class="tick">${i===0||(i+1)%5===0||i===dates.length-1?i+1:''}</span></button>`).join('');$('chartSummary').textContent=total?`${sums.filter(Boolean).length} spending days · ${money(total/sums.filter(Boolean).length)} per active day`:'No spending recorded this month.';let items=byDay[selectedDay]||[],sum=items.reduce((n,x)=>n+x.amount,0),group={};for(const x of items)group[x.category]=(group[x.category]||0)+x.amount;$('dailyAmount').textContent=money(sum);$('dailyLabel').textContent='Spent on this day';$('dailyCategories').innerHTML=sum?Object.entries(group).sort((a,b)=>b[1]-a[1]).map(([c,a])=>`<div class="dailycat"><div class="legendrow"><i class="swatch" style="background:${cats[c].color}"></i><span class="lname">${esc(cats[c].name)}</span><b>${money(a)}</b><span class="share">${percent(a/sum*100)}</span></div><div class="track"><div style="width:${a/sum*100}%;background:${cats[c].color}"></div></div></div>`).join(''):'<p class="muted small">No expenses on this day.</p>';$('viewDay').hidden=true}
function table(ts,showHeading=true){if(!ts.length)return '<div class="empty"><span class="emptyicon">↗</span><b>No entries yet</b><span>Your daily activity will appear here.</span></div>';let groups=new Map();for(const t of ts){if(!groups.has(t.date))groups.set(t.date,[]);groups.get(t.date).push(t)}return [...groups].map(([d,items])=>{let out=items.reduce((n,t)=>n+(t.type==='expense'?t.amount:0),0),inc=items.reduce((n,t)=>n+(t.type==='income'?t.amount:0),0);return `<div class="daygroup">${showHeading?`<div class="dayhead"><div><b>${d===localDate()?'Today · ':''}${esc(dayName(d))}</b></div><div class="daytotal">${items.length>1&&out?`<strong class="negative">−${money(out)}</strong>`:''}${items.length>1&&inc?`<strong class="positive">+${money(inc)}</strong>`:''}</div></div>`:''}${items.map(t=>{let c=cats[t.category];return `<div class="entry"><div class="txname"><div class="catpic" style="background:${c.color}22">${c.icon}</div><div><b>${esc(t.description||c.name)}</b><small>${t.description&&t.description!==c.name?esc(c.name)+' · ':''}${t.ruleId?(t.type==='income'?'Monthly income · ':'Monthly expense · '):''}${t.time?esc(t.time.slice(0,5)):t.ruleId?'Scheduled':'Past entry'}</small></div></div><strong class="amount num ${t.type==='income'?'positive':'negative'}">${t.type==='income'?'+':'−'}${money(t.amount)}</strong><div class="actions"><button data-action="edit" data-id="${esc(t.id)}" aria-label="Edit entry" title="Edit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 12-12 4 4L8 20H4zM14 6l4 4"/></svg></button><button data-action="delete" data-id="${esc(t.id)}" aria-label="Delete entry" title="Delete"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/></svg></button></div></div>`}).join('')}</div>`}).join('')}

function filterOptions(){let old=$('catFilter').value;let f=$('typeFilter').value,arr=f==='all'?[...C.expense,...C.income]:C[f.split('-')[0]];$('catFilter').innerHTML='<option value="all">All categories</option>'+arr.map(c=>`<option value="${c[0]}">${esc(c[1])}</option>`).join('');if(arr.some(c=>c[0]===old))$('catFilter').value=old}
function renderTransactions(){let ts=sorted(),q=$('search').value.trim().toLocaleLowerCase('en'),f=$('typeFilter').value,c=$('catFilter').value;let day=$('dayFilter').value;let shown=ts.filter(t=>(day==='all'||t.date===day)&&(f==='all'||t.type===f||f===t.type+'-'+(t.ruleId?'monthly':t.type==='income'?'extra':'flexible'))&&(c==='all'||t.category===c)&&(!q||(t.description+' '+cats[t.category].name+' '+t.date+' '+money(t.amount)).toLocaleLowerCase('en').includes(q)));$('transactionCount').textContent=`${shown.length} ${shown.length===1?'entry':'entries'}`;$('allTable').innerHTML=table(shown,day==='all');$('activityDetail').hidden=day==='all';if(day!=='all'){selectedDay=day;renderDaily(ts)}$('previousDay').disabled=day==='all'||!validDate(dateOffset(day,-1));$('nextDay').disabled=day==='all'||!validDate(dateOffset(day,1));$('addForDay').disabled=day!=='all'&&day>localDate()}
function renderRules(){ $('rulesList').innerHTML=data.rules.length?data.rules.map(r=>{let c=cats[r.category];return `<div class="rowline"><div class="rulemain"><div class="catpic" style="background:${c.color}22">${c.icon}</div><div><b>${esc(r.description||c.name)}</b><p>Day ${+r.start.slice(-2)} of each month · ${esc(c.name)} · ${r.active?'Active':'Stopped'}</p></div></div><strong class="num ${r.type==='income'?'positive':'negative'}">${r.type==='income'?'+':'−'}${money(r.amount)}</strong>${r.active?`<button class="secondary" data-action="stop" data-id="${esc(r.id)}">Stop</button>`:''}</div>`}).join(''):'<div class="empty"><b>No automatic monthly payments yet.</b><span>Set up your rent or salary once.</span></div>'}
let activityInitialized=false;
function render(){generate();renderMonth();let old=$('dayFilter').value;$('dayFilter').innerHTML='<option value="all">All days</option>'+datesInMonth().map(d=>`<option value="${d}">${esc(dayName(d))}</option>`).join('');$('dayFilter').value=datesInMonth().includes(old)?old:old==='all'&&activityInitialized?'all':month===nowMonth()?localDate():datesInMonth().at(-1);activityInitialized=true;renderDashboard();renderGroups();renderSafe();renderGoals();renderTransactions();renderRules()}
function go(p,scroll=true){page=p;document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===p);if(b.dataset.page===p)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current')});if(p==='settings')$('settingsFold').open=true;if(p==='recurring')$('monthlyFold').open=true;if(scroll){if(p==='dashboard')window.scrollTo({top:0,behavior:'smooth'});else $(p)?.scrollIntoView({behavior:'smooth',block:'start'})}}
function changeMonth(m){if(validMonth(m)){month=m;render()}}
let selectedKind='expense-flexible', dateChoice='today';
function dateOffset(d,n){const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return localDate(x)}
function chooseDate(choice,value){dateChoice=choice;const today=localDate();if(choice==='today')$('date').value=today;else if(choice==='yesterday')$('date').value=dateOffset(today,-1);else if(value)$('date').value=value;updateDateUI()}
function updateDateUI(){const old=editing?data.transactions.find(x=>x.id===editing):null,schedule=selectedKind.endsWith('monthly')&&!editing,locked=!!old?.ruleId;const d=$('date').value;$('dateChoices').hidden=schedule||locked;$('dateField').hidden=!(schedule||(!locked&&dateChoice==='custom'));$('date').disabled=locked;$('date').required=schedule||dateChoice==='custom';$('date').max=schedule?'2200-12-31':localDate();$('dateLabel').textContent=schedule?'First payment date':'Purchase or income date';$('autoDate').hidden=schedule;document.querySelectorAll('[data-date-choice]').forEach(b=>{b.classList.toggle('active',b.dataset.dateChoice===dateChoice);b.setAttribute('aria-pressed',String(b.dataset.dateChoice===dateChoice))});$('autoDateText').textContent=locked?dayName(old.date)+' · Scheduled entry':!validDate(d)?'Choose a date':dayName(d)+(old&&d===old.date&&old.time?' · '+old.time.slice(0,5):d===localDate()&&!old?' · Time saved automatically':' · No time required')}

function setType(t,cat){type=t;$('category').innerHTML=C[t].map(c=>`<option value="${c[0]}">${c[2]} ${esc(c[1])}</option>`).join('');if(cat&&C[t].some(c=>c[0]===cat))$('category').value=cat;else $('category').value=t==='income'?'salary':'food'}
function setKind(k,cat){selectedKind=k;const t=k.startsWith('income')?'income':'expense',monthly=k.endsWith('monthly');setType(t,cat);document.querySelectorAll('[data-kind]').forEach(b=>{b.classList.toggle('active',b.dataset.kind===k);b.setAttribute('aria-pressed',String(b.dataset.kind===k));b.disabled=!!editing&&b.dataset.kind!==k});const schedule=monthly&&!editing;updateDateUI();$('repeatField').hidden=!schedule;$('saveTx').textContent=schedule?'Save monthly payment':'Save'}
function openTx(t=null,preferredDate=null){editing=t?.id||null;$('txForm').reset();$('txError').textContent='';$('dialogTitle').textContent=t?'Edit entry':'Add entry';const initial=t?.date||preferredDate||localDate();$('date').value=initial;dateChoice=initial===localDate()?'today':initial===dateOffset(localDate(),-1)?'yesterday':'custom';$('date').min='1900-01-01';$('date').max='2200-12-31';$('amount').value=t?String(t.amount/100):'';$('description').value=t?.description||'';$('autoDateText').textContent=t?dayName(t.date)+(t.time?' · '+t.time.slice(0,5):''):'Date and time saved automatically';setKind(t?(t.type+'-'+(t.ruleId?'monthly':t.type==='income'?'extra':'flexible')):'expense-flexible',t?.category);$('txDialog').showModal();$('amount').focus()}
function addRuleFrom(t){const r={id:uid(),type:t.type,amount:t.amount,category:t.category,description:t.description,start:t.date,active:true};data.rules.push(r);return r.id}
function submitTx(e){e.preventDefault();try{const stamp=new Date(),old=editing?data.transactions.find(x=>x.id===editing):null,monthly=selectedKind.endsWith('monthly')&&!editing,a=parseAmount($('amount').value),d=old?.ruleId?old.date:monthly||dateChoice==='custom'?$('date').value:dateChoice==='yesterday'?dateOffset(localDate(stamp),-1):localDate(stamp),cat=$('category').value,desc=$('description').value.trim();if(a===null){$('txError').textContent='Enter an amount greater than zero, e.g. 12.50 or 12,50.';$('amount').focus();return}if(!validDate(d)||(!monthly&&!old?.ruleId&&d>localDate(stamp))||!C[type].some(c=>c[0]===cat)){$('txError').textContent='Choose a valid category and date.';return}if(monthly&&data.rules.length>=500){$('txError').textContent='Monthly payment limit reached.';return}if(monthly&&data.rules.some(r=>r.active&&r.type===type&&r.category===cat&&r.amount===a&&r.description.trim().toLowerCase()===desc.toLowerCase())){$('txError').textContent='This monthly payment already exists. Manage it under Monthly.';return}const t={id:editing||uid(),type,amount:a,date:d,category:cat,description:desc,...(old?(d===old.date&&old.time?{time:old.time}:{}):!monthly&&d===localDate(stamp)?{time:localTime(stamp)}:{})};if(old){if(old.ruleId)t.ruleId=old.ruleId;data.transactions[data.transactions.indexOf(old)]=t}else if(monthly){t.ruleId=addRuleFrom(t);if(d<=localDate(stamp))data.transactions.push(t)}else data.transactions.push(t);if(d<=localDate(stamp)){month=monthOf(d);selectedDay=d}else month=nowMonth();$('txDialog').close();const message=old?'Entry updated.':monthly?'Monthly payment saved.':'Entry saved.';commit(message+(d<=localDate(stamp)?groupReminder(t):''));if(d<=localDate(stamp)){showActivityDay(d);go('transactions')}else go('dashboard')}catch(err){$('txError').textContent='Could not save the entry. '+(err.message||'Please try again.');if(!$('txDialog').open)$('txDialog').showModal()}}
$('txForm').addEventListener('submit',submitTx);$('date').addEventListener('input',updateDateUI);
function deleteTx(id){const t=data.transactions.find(x=>x.id===id);if(!t||!confirm(`“${t.description||cats[t.category].name}” — delete this entry?${t.ruleId?' This month’s entry will not be recreated.':''}`))return;if(t.ruleId)data.skipped.push(t.ruleId+'|'+monthOf(t.date));data.transactions=data.transactions.filter(x=>x.id!==id);commit('Entry deleted.')}
function stopRule(id){const r=data.rules.find(x=>x.id===id);if(r&&confirm('Stop this monthly payment? Existing entries will be kept.')){r.active=false;commit('Monthly payment stopped.')}}
function download(name,content,mime){const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function csv(v){let s=String(v??'');if(/^[=+\-@\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
$('exportCSV').onclick=()=>{let rows=[['Date','Time','Type','Category','Note','Amount (EUR)'],...sorted().map(t=>[t.date,t.time||'',t.type==='income'?'Income':'Expense',cats[t.category].name,t.description,(t.type==='expense'?'-':'')+(t.amount/100).toFixed(2)])];download(`FinanzPilot-${month}.csv`,'\ufeff'+rows.map((r,i)=>r.map((v,j)=>i>0&&j===5?'"'+v+'"':csv(v)).join(';')).join('\r\n'),'text/csv;charset=utf-8');notify('Monthly spreadsheet downloaded.')};
$('exportJSON').onclick=()=>{download(`FinanzPilot-Backup-${localDate()}.json`,JSON.stringify(data,null,2),'application/json');notify('Backup exported.')};$('importJSON').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{if(f.size>30000000)throw Error('File is too large.');let d=validate(JSON.parse(await f.text()));if(confirm(`${d.transactions.length} entries in this backup. Replace current data?`)){data=d;month=nowMonth();commit('Backup restored.')}}catch(err){alert('Could not restore backup: '+err.message)}finally{e.target.value=''}};
$('resetAll').onclick=()=>{if(!confirm('All entries, budgets, monthly payments and savings goals will be deleted. Continue?'))return;if(!confirm('Final confirmation: permanently delete all FinanzPilot data?'))return;data=fresh();month=nowMonth();commit('All data reset.')};
function fillLimits(m){$('limitFields').innerHTML=GROUPS.map(g=>{const q=groupLimit(g,m);return `<div class="field"><label for="limit-${g.id}">${g.name} (€)</label><input id="limit-${g.id}" inputmode="decimal" maxlength="16" value="${q.limit===null?'':q.limit/100}" placeholder="No limit"></div>${g.id==='food'?`<div class="field"><label for="max-food">Food maximum (optional)</label><input id="max-food" inputmode="decimal" maxlength="16" value="${q.max===null?'':q.max/100}" placeholder="No maximum"></div>`:''}`}).join('')}
$('editGroups').onclick=()=>{$('groupMonth').textContent=monthName(month);fillLimits(month);$('groupError').textContent='';$('groupDialog').showModal()};$('copyLimits').onclick=()=>{fillLimits(shift(month,-1));$('groupError').textContent='Previous month copied. Save to apply.'};
$('groupForm').onsubmit=e=>{e.preventDefault();const next={};for(const g of GROUPS){const raw=$('limit-'+g.id).value.trim(),mx=g.id==='food'?$('max-food').value.trim():'',limit=raw?parseAmount(raw):null,max=mx?parseAmount(mx):null;if((raw&&limit===null)||(mx&&max===null)||(limit&&max&&max<limit)){$('groupError').textContent='Enter positive amounts; the food maximum must be at least its target.';return}next[g.id]={limit,max}}data.monthlyGroupLimits[month]=next;$('groupDialog').close();commit('Monthly limits updated.')};
$('setBudget').onclick=()=>{$('budgetMonth').textContent=monthName(month);$('budgetAmount').value=data.budgets[month]?String(data.budgets[month]/100):'';$('budgetError').textContent='';$('budgetDialog').showModal();$('budgetAmount').focus()};$('budgetForm').onsubmit=e=>{e.preventDefault();let s=$('budgetAmount').value.trim();if(!s)delete data.budgets[month];else{let a=parseAmount(s);if(a===null){$('budgetError').textContent='Enter a valid positive amount.';return}data.budgets[month]=a}$('budgetDialog').close();commit('Budget updated.')};
document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.page)go(b.dataset.page);if(b.dataset.kind)setKind(b.dataset.kind,type===b.dataset.kind.split("-")[0]?$("category").value:undefined);if(b.dataset.dateChoice)chooseDate(b.dataset.dateChoice);if(b.dataset.close)$(b.dataset.close).close();if(b.dataset.action==='add')openTx();if(b.dataset.action==='edit'){let t=data.transactions.find(x=>x.id===b.dataset.id);if(t)openTx(t)}if(b.dataset.action==='delete')deleteTx(b.dataset.id);if(b.dataset.action==='stop')stopRule(b.dataset.id)});
$('addTop').onclick=()=>openTx();$('addMonthly').onclick=()=>{openTx();setKind('income-monthly')};$('dailySelect').onchange=e=>{selectedDay=e.target.value;renderDaily(sorted())};$('dayChart').onclick=e=>{const b=e.target.closest('[data-day]');if(b){selectedDay=b.dataset.day;renderDaily(sorted());showActivityDay(selectedDay);go('transactions')}};$('dayFilter').onchange=renderTransactions;
function showActivityDay(d){if(!validDate(d))return;if(monthOf(d)!==month){month=monthOf(d);render()}$('dayFilter').value=d;selectedDay=d;renderTransactions()}
$('previousDay').onclick=()=>showActivityDay(dateOffset($('dayFilter').value,-1));$('nextDay').onclick=()=>showActivityDay(dateOffset($('dayFilter').value,1));$('activityToday').onclick=()=>showActivityDay(localDate());$('activityYesterday').onclick=()=>showActivityDay(dateOffset(localDate(),-1));$('activityAll').onclick=()=>{$('dayFilter').value='all';renderTransactions()};$('addForDay').onclick=()=>openTx(null,$('dayFilter').value==='all'?null:$('dayFilter').value);
$('viewDay').onclick=()=>{go('transactions');$('search').value='';$('typeFilter').value='all';filterOptions();$('catFilter').value='all';$('dayFilter').value=selectedDay;renderTransactions()};$('prevMonth').onclick=()=>changeMonth(shift(month,-1));$('nextMonth').onclick=()=>changeMonth(shift(month,1));$('todayMonth').onclick=()=>changeMonth(nowMonth());$('monthJump').onchange=e=>changeMonth(e.target.value);$('search').oninput=renderTransactions;$('typeFilter').onchange=()=>{filterOptions();renderTransactions()};$('catFilter').onchange=renderTransactions;

function validateGoals(goals){if(goals===undefined)return [];if(!Array.isArray(goals)||goals.length>500)throw Error('Invalid savings goals.');const ids=new Set(), good=n=>Number.isSafeInteger(n)&&n>=0&&n<=99999999999;return goals.map(g=>{if(!g||typeof g.id!=='string'||!g.id||g.id.length>200||ids.has(g.id)||typeof g.name!=='string'||!g.name.trim()||g.name.length>80||!good(g.target)||g.target===0||!good(g.saved))throw Error('Invalid savings goal.');ids.add(g.id);return {id:g.id,name:g.name,target:g.target,saved:g.saved}})}
function pendingExpenses(m,categories=null){const today=localDate(),skip=new Set(data.skipped),existing=new Set(data.transactions.filter(t=>t.ruleId&&monthOf(t.date)===m).map(t=>t.ruleId));return data.rules.reduce((sum,r)=>{const due=dayFor(m,+r.start.slice(-2));return sum+(r.active&&r.type==='expense'&&due>=r.start&&due>today&&!skip.has(r.id+'|'+m)&&!existing.has(r.id)&&(!categories||categories.includes(r.category))?r.amount:0)},0)}
function safeCalculation(m){const total=data.budgets[m],days=+dayFor(m,31).slice(-2),today=localDate(),remainingDays=m<nowMonth()?0:m===nowMonth()?days-(+today.slice(-2))+1:days;let remaining=0,reserved=0,scope='';if(total){reserved=pendingExpenses(m);remaining=total-totals(m).e-reserved;scope='Overall spending limit'}else{const groups=GROUPS.filter(g=>{const q=groupLimit(g,m);return q.limit||q.max});if(!groups.length)return null;scope='Category targets only';for(const g of groups){const q=groupLimit(g,m),pending=pendingExpenses(m,g.cats);reserved+=pending;remaining+=Math.max(0,(q.limit||q.max)-groupSpent(g,m)-pending)}}return {remaining,remainingDays,reserved,scope,daily:remainingDays?Math.floor(Math.max(0,remaining)/remainingDays):null}}
function renderSafe(){const q=safeCalculation(month),past=month<nowMonth(),future=month>nowMonth();$('safeCard').dataset.status=q&&q.remaining<=0?'over':'ok';$('safeMeta').hidden=!q;$('safeDaily').textContent=q?(past?money(Math.max(0,q.remaining)):money(q.daily)):'—';$('safeUnit').textContent=q?(past?'left at month end':'/ day'):'';$('safePeriod').textContent=q?(past?'Month completed':`${q.remainingDays} ${q.remainingDays===1?'day':'days'} ${future?'in this month':'left · including today'}`):'Set a budget to start';$('safeRemaining').textContent=q?money(Math.max(0,q.remaining)):'';$('safeMeta').hidden=!q||past;$('safeNote').textContent=q?`${q.scope}${q.reserved?' · '+money(q.reserved)+' reserved for upcoming monthly expenses':''}. ${q.remaining<0?money(-q.remaining)+' over the limit. ':q.remaining===0?'No budget left. ':''}Budget estimate, not bank balance. Savings goals are tracked separately.`:'Add category limits or a total limit.';}
let editingGoal=null,moneyGoal=null;
function renderGoals(){const list=data.goals;$('goalSummary').hidden=!list.length;$('goalSummary').textContent=list.length?money(list.reduce((n,g)=>n+g.saved,0))+' saved across '+list.length+(list.length===1?' goal':' goals')+' · All-time':'';$('goalList').innerHTML=list.length?list.map(g=>{const pc=Math.min(100,g.saved/g.target*100),left=Math.max(0,g.target-g.saved),complete=g.saved>=g.target;return `<div class="goal-item ${complete?'complete':''}"><div class="goal-heading"><div class="goal-title"><span class="goal-icon" aria-hidden="true">◎</span><b>${esc(g.name)}</b></div><button class="goal-edit" data-goal-edit="${esc(g.id)}" aria-label="Edit ${esc(g.name)}">Edit</button></div><div class="goal-numbers"><strong class="num">${money(g.saved)}</strong><span class="muted small">of ${money(g.target)} · ${percent(g.saved/g.target*100)}</span></div><div class="goal-progress" role="progressbar" aria-label="Savings progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pc)}"><i style="width:${pc}%"></i></div><div class="goal-bottom"><span class="small ${complete?'positive':'muted'}">${complete?'Goal reached ✓':money(left)+' to go'}</span><div class="goal-actions"><button class="secondary" data-goal-money="${esc(g.id)}">+ Add savings</button></div></div></div>`}).join(''):'<div class="empty"><span>No goals yet.</span></div>'}
function openGoal(g=null){editingGoal=g?.id||null;$('goalDialogTitle').textContent=g?'Edit savings goal':'New savings goal';$('goalName').value=g?.name||'';$('goalTarget').value=g?String(g.target/100):'';$('goalSaved').value=g?String(g.saved/100):'';$('goalError').textContent='';$('deleteGoal').hidden=!g;$('goalDialog').showModal();$('goalName').focus()}
$('newGoal').onclick=()=>openGoal();$('safeBudgetLink').onclick=()=>go('budgetSection');
$('goalForm').onsubmit=e=>{e.preventDefault();const name=$('goalName').value.trim(),target=parseAmount($('goalTarget').value),raw=$('goalSaved').value.trim(),saved=(!raw||/^0+(?:[.,]0{1,2})?$/.test(raw))?0:parseAmount(raw);if(!name||name.length>80||target===null||saved===null){$('goalError').textContent='Enter a name, positive target and valid saved amount.';return}if(!editingGoal&&data.goals.length>=500){$('goalError').textContent='Goal limit reached.';return}const g={id:editingGoal||uid(),name,target,saved};if(editingGoal){const index=data.goals.findIndex(x=>x.id===editingGoal);if(index<0)return;data.goals[index]=g}else data.goals.push(g);$('goalDialog').close();commit('Savings goal saved.')};
$('deleteGoal').onclick=()=>{if(!editingGoal||!confirm('Delete this savings goal? Your income and expenses will not change.'))return;data.goals=data.goals.filter(g=>g.id!==editingGoal);$('goalDialog').close();commit('Savings goal deleted.')};
function openGoalMoney(g){moneyGoal=g.id;$('goalMoneyTitle').textContent='Update savings';$('goalMoneyName').textContent=g.name+' · '+money(g.saved)+' saved';$('goalMoneyType').value='add';$('goalMoneyAmount').value='';$('goalMoneyError').textContent='';$('goalMoneyDialog').showModal();$('goalMoneyAmount').focus()}
$('goalMoneyForm').onsubmit=e=>{e.preventDefault();const g=data.goals.find(x=>x.id===moneyGoal),a=parseAmount($('goalMoneyAmount').value);if(!g||a===null){$('goalMoneyError').textContent='Enter a valid positive amount.';return}const next=g.saved+($('goalMoneyType').value==='remove'?-a:a);if(next<0||next>99999999999){$('goalMoneyError').textContent=next<0?'You cannot withdraw more than you saved.':'Amount is too large.';return}g.saved=next;$('goalMoneyDialog').close();commit(g.saved>=g.target?'Goal reached!':'Savings updated.')};
$('goalList').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const g=data.goals.find(x=>x.id===(b.dataset.goalEdit||b.dataset.goalMoney));if(g){if(b.dataset.goalEdit)openGoal(g);else openGoalMoney(g)}});

window.addEventListener('focus',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});filterOptions();render();go('dashboard',false);


// Release checks. Keep the release number in sync with version.json and asset URLs.
const APP_VERSION = '1.11.0';
let availableVersion = null;
const versionParts = value => typeof value === 'string' && /^\d{1,6}\.\d{1,6}\.\d{1,6}$/.test(value) ? value.split('.').map(Number) : null;
function isNewerVersion(candidate, current) {
  const a = versionParts(candidate), b = versionParts(current);
  if (!a || !b) throw new Error('Invalid release information');
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}
$('appVersion').textContent = APP_VERSION;
$('checkUpdate').addEventListener('click', async () => {
  const button = $('checkUpdate'), status = $('updateStatus');
  if (availableVersion) {
    // Do not reload a session with unsaved financial data.
    if (!save()) {
      status.textContent = 'Your data could not be saved. Download a backup before updating.';
      return;
    }
    button.disabled = true;
    status.textContent = 'Preparing the new version…';
    try {
      if (pwaRegistration && navigator.serviceWorker.controller) {
        await pwaRegistration.update();
        const worker = await waitForRelease(pwaRegistration);
        if (!worker) throw new Error('The new offline release is not ready yet.');
        await activateRelease(worker);
        window.location.reload();
      } else {
        const url = new URL(window.location.href);
        url.searchParams.set('v', availableVersion);
        url.searchParams.set('_update', String(Date.now()));
        window.location.assign(url.href);
      }
    } catch (error) {
      status.textContent = 'Update not ready. Your records are safe. Try again while online.';
      button.disabled = false;
    }
    return;
  }
  if (!/^https?:$/.test(location.protocol)) {
    status.textContent = 'Open the published website to check for updates.';
    return;
  }
  button.disabled = true;
  status.textContent = 'Checking for updates…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const url = new URL('./version.json', window.location.href);
    url.searchParams.set('_check', String(Date.now()));
    const response = await fetch(url.href, {cache: 'no-store', signal: controller.signal, credentials: 'same-origin'});
    if (!response.ok) throw new Error('Update check failed');
    const release = await response.json();
    if (isNewerVersion(release.version, APP_VERSION)) {
      availableVersion = release.version;
      status.textContent = `Version ${availableVersion} is available.`;
      button.textContent = 'Update now';
    } else {
      status.textContent = 'You are up to date.';
      button.textContent = 'Check for updates';
    }
  } catch (error) {
    status.textContent = 'Could not check for updates. Check your connection and try again.';
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
  }
});

// Installable, offline-first shell. Financial data remains in the original localStorage key.
let pwaRegistration = null, installPrompt = null;
const offlineStatus = $('offlineStatus');
function waitForRelease(registration) {
  return new Promise(resolve => {
    const end = Date.now() + 15000;
    const poll = () => {
      if (registration.waiting) return resolve(registration.waiting);
      if (Date.now() >= end) return resolve(null);
      setTimeout(poll, 200);
    };
    poll();
  });
}
function activateRelease(worker) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Activation timeout')); }, 15000);
    const changed = () => { cleanup(); resolve(); };
    function cleanup() { clearTimeout(timeout); navigator.serviceWorker.removeEventListener('controllerchange', changed); }
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    worker.postMessage({type:'ACTIVATE_RELEASE'});
  });
}
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js', {scope:'./', updateViaCache:'none'}).then(registration => {
    pwaRegistration = registration;
    return navigator.serviceWorker.ready;
  }).then(() => {
    offlineStatus.textContent = 'Offline access is ready. You can reopen the app without internet.';
  }).catch(() => {
    offlineStatus.textContent = 'Offline access could not be prepared. Open the website while online and try again.';
  });
} else {
  offlineStatus.textContent = 'Open the HTTPS website in your browser to enable offline access.';
}
const installed = () => {
  $('installApp').hidden = true;
  $('installHint').textContent = 'FinanzPilot is installed on this device.';
};
if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) installed();
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; $('installApp').hidden = false;
});
$('installApp').addEventListener('click', async () => {
  if (!installPrompt) return;
  const prompt = installPrompt; installPrompt = null;
  $('installApp').hidden = true;
  try { await prompt.prompt(); await prompt.userChoice; } catch (_) { /* Manual install instructions remain available. */ }
});
window.addEventListener('appinstalled', installed);
