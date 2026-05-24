(async()=>{

'use strict';

/* =========================================
   TWMPRO v7
   PLAYER + BARB ANALYZER
========================================= */

/* =========================================
   CLEAN START
========================================= */

if(window.TWMPRO_DESTROY){
window.TWMPRO_DESTROY();
}

window.TWMPRO_RUNNING=true;

/* =========================================
   STORAGE
========================================= */

const STORAGE='TWMPRO_V7';

/* =========================================
   CONFIG
========================================= */

const defaults={

radius:20,

panelX:100,
panelY:40,
panelW:1000,
panelH:600,

showBarbs:true,
showPlayers:true,

filterFresh:false,
filterOld:false,

filterInactive:false,
filterActive:false

};

let cfg=load();

function load(){

try{

return{
...defaults,
...JSON.parse(
localStorage.getItem(STORAGE)||'{}'
)
};

}catch(e){

return defaults;

}

}

function save(){

localStorage.setItem(
STORAGE,
JSON.stringify(cfg)
);

}

/* =========================================
   DATA
========================================= */

let villages=[];
let players={};
let allies={};

let playerActivity={};
let barbInfo={};

/* =========================================
   EVENTS
========================================= */

const listeners=[];

function addListener(el,type,fn){

el.addEventListener(type,fn);

listeners.push({
el,
type,
fn
});

}

/* =========================================
   PANEL
========================================= */

const panel=document.createElement('div');

panel.id='twmpro_panel';

panel.style.position='fixed';
panel.style.left=cfg.panelX+'px';
panel.style.top=cfg.panelY+'px';
panel.style.width=cfg.panelW+'px';
panel.style.height=cfg.panelH+'px';
panel.style.background='#202225';
panel.style.color='white';
panel.style.zIndex='999999';
panel.style.borderRadius='8px';
panel.style.display='flex';
panel.style.flexDirection='column';
panel.style.resize='both';
panel.style.overflow='hidden';
panel.style.fontSize='11px';
panel.style.boxShadow='0 0 10px rgba(0,0,0,.5)';

panel.innerHTML=`

<div id="tw_header"
style="
padding:8px;
background:#111;
cursor:move;
font-weight:bold;
font-size:14px;
">

TWMPRO v7

</div>

<div style="
padding:6px;
display:flex;
gap:6px;
flex-wrap:wrap;
border-bottom:1px solid #333;
">

R

<input
id="tw_radius"
type="number"
value="${cfg.radius}"
style="width:50px">

<button id="tw_scan">
SCAN
</button>

<button id="tw_close">
X
</button>

<input
id="tw_search"
placeholder="search"
style="width:140px">

<label>
<input
type="checkbox"
id="tw_barbs"
${cfg.showBarbs?'checked':''}>
BARB
</label>

<label>
<input
type="checkbox"
id="tw_players"
${cfg.showPlayers?'checked':''}>
PLAYERS
</label>

<label>
<input
type="checkbox"
id="tw_fresh"
${cfg.filterFresh?'checked':''}>
FRESH
</label>

<label>
<input
type="checkbox"
id="tw_old"
${cfg.filterOld?'checked':''}>
OLD
</label>

<label>
<input
type="checkbox"
id="tw_inactive"
${cfg.filterInactive?'checked':''}>
INACTIVE
</label>

<label>
<input
type="checkbox"
id="tw_active"
${cfg.filterActive?'checked':''}>
ACTIVE
</label>

</div>

<div
id="tw_status"
style="
padding:5px;
border-bottom:1px solid #333;
color:#00ff88;
">
READY
</div>

<div
id="tw_table"
style="
flex:1;
overflow:auto;
">
</div>

`;

document.body.appendChild(panel);

/* =========================================
   HELPERS
========================================= */

function setStatus(t){

document.querySelector('#tw_status')
.innerText=t;

}

function dist(x1,y1,x2,y2){

return Math.sqrt(
Math.pow(x2-x1,2)+
Math.pow(y2-y1,2)
);

}

function currentCoord(){

const c=
game_data.village.coord
.split('|');

return{
x:+c[0],
y:+c[1]
};

}

/* =========================================
   LOAD MAP
========================================= */

async function loadMap(){

setStatus('Loading players');

const playerTxt=
await fetch('/map/player.txt')
.then(r=>r.text());

players={};

playerTxt
.trim()
.split('\n')
.forEach(l=>{

const p=l.split(',');

players[p[0]]={

id:p[0],
name:p[1],
ally:p[2],
villages:+p[3],
points:+p[4]

};

});

setStatus('Loading allies');

const allyTxt=
await fetch('/map/ally.txt')
.then(r=>r.text());

allies={};

allyTxt
.trim()
.split('\n')
.forEach(l=>{

const a=l.split(',');

allies[a[0]]={
tag:a[2]
};

});

setStatus('Loading villages');

const villageTxt=
await fetch('/map/village.txt')
.then(r=>r.text());

const lines=
villageTxt.split('\n');

const c=currentCoord();

const radius=
+document.querySelector('#tw_radius')
.value;

villages=[];

let processed=0;

for(const line of lines){

processed++;

if(processed%50000===0){

setStatus(
'Processing '+processed
);

await new Promise(r=>
setTimeout(r,0)
);

}

if(!line)continue;

const v=line.split(',');

const x=+v[2];
const y=+v[3];

const d=
dist(
c.x,
c.y,
x,
y
);

if(d>radius)continue;

villages.push({

id:v[0],
name:v[1],
x,
y,
playerId:v[4],
points:+v[5],
distance:d

});

}

setStatus(
'Loaded '+villages.length
);

renderTable();

}

/* =========================================
   PLAYER CHECK
========================================= */

window.TWMPRO_CHECK_PLAYER=
async(playerId,name)=>{

setStatus(
'Checking '+name
);

try{

/* =====================================
   TWSTATS URL
===================================== */

const world=
game_data.world;

const url=
`https://${world}.twstats.com/pl${world.replace('pl','')}/index.php?page=player&id=${playerId}`;

/* =====================================
   OPEN TAB
===================================== */

window.open(url,'_blank');

/* =====================================
   SIMPLE AI
===================================== */

const p=players[playerId];

let active='ACTIVE';

if(
p.villages<3 &&
p.points<3000
){
active='INACTIVE';
}

playerActivity[playerId]={

day1:'+0',
day2:'+0',
week:'+0',

status:active

};

renderTable();

setStatus(
'Done'
);

}catch(e){

setStatus(
'TWStats error'
);

}

};

/* =========================================
   BARB CHECK
========================================= */

window.TWMPRO_CHECK_BARB=
async(villageId)=>{

setStatus(
'Checking barb'
);

try{

const url=
`/game.php?village=${game_data.village.id}&screen=info_village&id=${villageId}`;

const html=
await fetch(url)
.then(r=>r.text());

/* =====================================
   LAST ATTACK
===================================== */

let status='OLD';

if(
html.includes('Ostatni atak')
){

status='FRESH';

}

barbInfo[villageId]={

status

};

renderTable();

setStatus(
'Barb analyzed'
);

}catch(e){

setStatus(
'Barb error'
);

}

};

/* =========================================
   FILTER
========================================= */

function filtered(){

const search=
document.querySelector('#tw_search')
.value
.toLowerCase();

return villages.filter(v=>{

const isBarb=!v.playerId;

if(isBarb&&!cfg.showBarbs)
return false;

if(!isBarb&&!cfg.showPlayers)
return false;

const p=players[v.playerId];

const activity=
playerActivity[v.playerId];

const barb=
barbInfo[v.id];

if(
cfg.filterInactive &&
activity &&
activity.status!=='INACTIVE'
){
return false;
}

if(
cfg.filterActive &&
activity &&
activity.status!=='ACTIVE'
){
return false;
}

if(
cfg.filterFresh &&
barb &&
barb.status!=='FRESH'
){
return false;
}

if(
cfg.filterOld &&
barb &&
barb.status!=='OLD'
){
return false;
}

if(!search)return true;

return(
v.name.toLowerCase().includes(search) ||
(p&&p.name.toLowerCase().includes(search))
);

});

}

/* =========================================
   TABLE
========================================= */

function renderTable(){

const data=filtered();

let html=`

<table style="
width:100%;
border-collapse:collapse;
font-size:11px;
">

<tr style="
background:#111;
position:sticky;
top:0;
">

<th>PLAYER</th>
<th>COORD</th>
<th>D</th>
<th>PTS</th>
<th>ACTIVITY</th>
<th>BARB</th>
<th>ACTIONS</th>

</tr>
`;

data.forEach(v=>{

const p=players[v.playerId];

const activity=
playerActivity[v.playerId];

const barb=
barbInfo[v.id];

let bg='';

if(!p){

bg='rgba(120,120,120,.10)';

}

if(
activity &&
activity.status==='INACTIVE'
){

bg='rgba(0,255,0,.12)';

}

if(
barb &&
barb.status==='FRESH'
){

bg='rgba(255,255,0,.10)';

}

html+=`

<tr style="
border-bottom:1px solid #333;
background:${bg};
">

<td>
${p?p.name:'BARB'}
</td>

<td>

<a
href="/game.php?village=${game_data.village.id}&screen=map#${v.x};${v.y}"
target="_blank"
style="color:#6cf">

${v.x}|${v.y}

</a>

</td>

<td>
${v.distance.toFixed(1)}
</td>

<td>
${v.points}
</td>

<td>

${
activity
?`
${activity.status}<br>
24h ${activity.day1}<br>
48h ${activity.day2}<br>
7d ${activity.week}
`
:''}

</td>

<td>

${barb?barb.status:''}

</td>

<td>

${
p
?`
<button
onclick="
TWMPRO_CHECK_PLAYER(
'${p.id}',
'${p.name}'
)
">
CHECK
</button>
`
:`
<button
onclick="
TWMPRO_CHECK_BARB(
'${v.id}'
)
">
SCAN BARB
</button>
`
}

</td>

</tr>
`;

});

html+=`</table>`;

document.querySelector('#tw_table')
.innerHTML=html;

}

/* =========================================
   EVENTS
========================================= */

addListener(
document.querySelector('#tw_scan'),
'click',
loadMap
);

addListener(
document.querySelector('#tw_search'),
'input',
renderTable
);

addListener(
document.querySelector('#tw_barbs'),
'change',
e=>{

cfg.showBarbs=e.target.checked;
save();
renderTable();

}
);

addListener(
document.querySelector('#tw_players'),
'change',
e=>{

cfg.showPlayers=e.target.checked;
save();
renderTable();

}
);

addListener(
document.querySelector('#tw_fresh'),
'change',
e=>{

cfg.filterFresh=e.target.checked;
save();
renderTable();

}
);

addListener(
document.querySelector('#tw_old'),
'change',
e=>{

cfg.filterOld=e.target.checked;
save();
renderTable();

}
);

addListener(
document.querySelector('#tw_inactive'),
'change',
e=>{

cfg.filterInactive=e.target.checked;
save();
renderTable();

}
);

addListener(
document.querySelector('#tw_active'),
'change',
e=>{

cfg.filterActive=e.target.checked;
save();
renderTable();

}
);

/* =========================================
   DRAG
========================================= */

let drag=false;

let offsetX=0;
let offsetY=0;

addListener(
document.querySelector('#tw_header'),
'mousedown',
e=>{

drag=true;

offsetX=
e.clientX-panel.offsetLeft;

offsetY=
e.clientY-panel.offsetTop;

}
);

addListener(
document,
'mouseup',
()=>{

drag=false;

cfg.panelX=panel.offsetLeft;
cfg.panelY=panel.offsetTop;
cfg.panelW=panel.offsetWidth;
cfg.panelH=panel.offsetHeight;

save();

}
);

addListener(
document,
'mousemove',
e=>{

if(!drag)return;

panel.style.left=
e.clientX-offsetX+'px';

panel.style.top=
e.clientY-offsetY+'px';

}
);

/* =========================================
   DESTROY
========================================= */

function destroy(){

listeners.forEach(l=>{

l.el.removeEventListener(
l.type,
l.fn
);

});

panel.remove();

delete window.TWMPRO_RUNNING;
delete window.TWMPRO_DESTROY;

delete window.TWMPRO_CHECK_PLAYER;
delete window.TWMPRO_CHECK_BARB;

}

window.TWMPRO_DESTROY=destroy;

addListener(
document.querySelector('#tw_close'),
'click',
destroy
);

/* =========================================
   INIT
========================================= */

setStatus(
'Ready'
);

})();
