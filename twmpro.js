(async()=>{

'use strict';

/* =========================================
   TWMPRO SCANNER v4
   LIVE + HISTORY + INACTIVE AI
========================================= */

if(
window.TWMPRO_RUNNING &&
document.querySelector('#twmpro_panel')
){
document.querySelector('#twmpro_panel')
.style.display='flex';
return;
}

window.TWMPRO_RUNNING=true;

/* =========================================
   STORAGE
========================================= */

const STORAGE='TWMPRO_V4';
const CACHE='TWMPRO_CACHE_V4';
const HISTORY='TWMPRO_HISTORY_V4';

/* =========================================
   GAME DATA
========================================= */

const WORLD=game_data.world;
const PLAYER_ID=game_data.player.id;
const PLAYER_NAME=game_data.player.name;

/* =========================================
   CONFIG
========================================= */

const defaults={

radius:30,

panelX:180,
panelY:40,
panelW:1200,
panelH:750,

showBarbs:true,
showPlayers:true,

filterNew:false,
filterFarmed:false,
filterIgnored:false,
filterInactive:false,

sort:'distance'

};

let cfg=load();

/* =========================================
   LOAD CONFIG
========================================= */

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
let history={};

let customData={};

let currentData=[];

/* =========================================
   CACHE LOAD
========================================= */

try{

const cache=JSON.parse(
localStorage.getItem(CACHE)||'{}'
);

villages=cache.villages||[];
players=cache.players||{};
allies=cache.allies||{};
customData=cache.customData||{};

}catch(e){}

/* =========================================
   HISTORY LOAD
========================================= */

try{

history=JSON.parse(
localStorage.getItem(HISTORY)||'{}'
);

}catch(e){}

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
panel.style.borderRadius='10px';
panel.style.display='flex';
panel.style.flexDirection='column';
panel.style.resize='both';
panel.style.overflow='hidden';
panel.style.boxShadow='0 0 15px rgba(0,0,0,.5)';

panel.innerHTML=`

<div id="tw_header"
style="
padding:10px;
background:#111;
cursor:move;
font-weight:bold;
font-size:18px;
">

TWMPRO SCANNER v4
<span style="font-size:12px;opacity:.7">
${WORLD}
</span>

</div>

<div style="
padding:10px;
border-bottom:1px solid #333;
display:flex;
gap:8px;
flex-wrap:wrap;
align-items:center;
">

Radius

<input
id="tw_radius"
type="number"
value="${cfg.radius}"
style="width:60px">

<button id="tw_update">
UPDATE
</button>

<button id="tw_close">
WYŁĄCZ
</button>

<input
id="tw_search"
placeholder="szukaj..."
style="width:180px">

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
id="tw_new"
${cfg.filterNew?'checked':''}>
NEW
</label>

<label>
<input
type="checkbox"
id="tw_farmed"
${cfg.filterFarmed?'checked':''}>
FARMED
</label>

<label>
<input
type="checkbox"
id="tw_ignore"
${cfg.filterIgnored?'checked':''}>
IGNORE
</label>

<label>
<input
type="checkbox"
id="tw_inactive"
${cfg.filterInactive?'checked':''}>
INACTIVE
</label>

</div>

<div
id="tw_status"
style="
padding:8px;
font-size:12px;
color:#00ff88;
border-bottom:1px solid #333;
">
READY
</div>

<div
id="tw_table"
style="
flex:1;
overflow:auto;
font-size:12px;
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

function saveCache(){

localStorage.setItem(
CACHE,
JSON.stringify({
villages,
players,
allies,
customData
})
);

}

function saveHistory(){

localStorage.setItem(
HISTORY,
JSON.stringify(history)
);

}

/* =========================================
   INACTIVE SCORE
========================================= */

function inactiveScore(player){

if(!player)return 0;

let score=0;

if(!player.ally){
score+=20;
}

if(player.villages<3){
score+=20;
}

if(player.points<2000){
score+=10;
}

/* HISTORY CHECK */

const h=history[player.id];

if(h){

const diff=
player.points-h.points;

if(diff===0){
score+=50;
}

if(diff<100){
score+=20;
}

}

return score;

}

/* =========================================
   MAP UPDATE
========================================= */

async function updateMap(){

setStatus('Pobieranie village.txt');

const villageTxt=
await fetch('/map/village.txt')
.then(r=>r.text());

setStatus('Pobieranie player.txt');

const playerTxt=
await fetch('/map/player.txt')
.then(r=>r.text());

setStatus('Pobieranie ally.txt');

const allyTxt=
await fetch('/map/ally.txt')
.then(r=>r.text());

/* PLAYERS */

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

/* HISTORY */

history[p[0]]={
points:+p[4],
time:Date.now()
};

});

/* ALLIES */

allies={};

allyTxt
.trim()
.split('\n')
.forEach(l=>{

const a=l.split(',');

allies[a[0]]={

id:a[0],
name:a[1],
tag:a[2]

};

});

/* VILLAGES */

villages=[];

villageTxt
.trim()
.split('\n')
.forEach(l=>{

const v=l.split(',');

villages.push({

id:v[0],
name:v[1],
x:+v[2],
y:+v[3],
playerId:v[4],
points:+v[5]

});

});

saveCache();
saveHistory();

setStatus(
'Mapa zaktualizowana'
);

}

/* =========================================
   STATUS SYSTEM
========================================= */

function nextStatus(current){

if(!current)return'new';

if(current==='new')
return'farmed';

if(current==='farmed')
return'ignore';

return'new';

}

/* =========================================
   SCAN
========================================= */

function scan(){

const c=currentCoord();

cfg.radius=
+document.querySelector('#tw_radius')
.value;

save();

const search=
document.querySelector('#tw_search')
.value
.toLowerCase();

currentData=
villages

.map(v=>{

v.distance=
dist(
c.x,
c.y,
v.x,
v.y
);

return v;

})

.filter(v=>v.distance<=cfg.radius)

.filter(v=>{

const isBarb=!v.playerId;

if(isBarb&&!cfg.showBarbs)
return false;

if(!isBarb&&!cfg.showPlayers)
return false;

const cd=
customData[v.id]||{};

if(cfg.filterNew&&cd.status!=='new')
return false;

if(cfg.filterFarmed&&cd.status!=='farmed')
return false;

if(cfg.filterIgnored&&cd.status!=='ignore')
return false;

const p=players[v.playerId];

const inactive=
inactiveScore(p)>=60;

if(
cfg.filterInactive &&
!inactive
){
return false;
}

if(!search)return true;

return(
v.name.toLowerCase().includes(search) ||
(p&&p.name.toLowerCase().includes(search))
);

})

.sort((a,b)=>{

if(cfg.sort==='points'){
return b.points-a.points;
}

return a.distance-b.distance;

});

renderTable();

}

/* =========================================
   TABLE
========================================= */

function renderTable(){

let html=`

<table style="
width:100%;
border-collapse:collapse;
">

<tr style="
background:#111;
position:sticky;
top:0;
z-index:5;
">

<th>PLAYER</th>
<th>COORD</th>
<th>DIST</th>
<th>POINTS</th>
<th>ALLY</th>
<th>INACTIVE</th>
<th>STATUS</th>

</tr>
`;

currentData.forEach(v=>{

const p=players[v.playerId];

const ally=
allies[p?.ally];

const cd=
customData[v.id]||{};

const inactive=
inactiveScore(p);

let bg='';

if(!p){

bg='rgba(120,120,120,.12)';

}else{

bg='rgba(255,0,0,.08)';

}

if(inactive>=60){

bg='rgba(0,255,0,.12)';

}

if(cd.status==='farmed'){

bg='rgba(255,255,0,.10)';

}

if(cd.status==='ignore'){

bg='rgba(120,120,120,.22)';

}

let status='';

if(cd.status==='new')
status='🟢 NEW';

if(cd.status==='farmed')
status='🟡 FARMED';

if(cd.status==='ignore')
status='⚫ IGNORE';

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
${v.distance.toFixed(2)}
</td>

<td>
${v.points}
</td>

<td>
${ally?ally.tag:''}
</td>

<td>

${inactive}

</td>

<td>

<button
onclick="TWMPRO_STATUS('${v.id}')"
style="width:120px">

${status||'SET STATUS'}

</button>

</td>

</tr>
`;

});

html+=`</table>`;

document.querySelector('#tw_table')
.innerHTML=html;

}

/* =========================================
   GLOBAL STATUS
========================================= */

window.TWMPRO_STATUS=id=>{

if(!customData[id]){
customData[id]={};
}

customData[id].status=
nextStatus(
customData[id].status
);

saveCache();

scan();

};

/* =========================================
   EVENTS
========================================= */

document.querySelector('#tw_update')
.onclick=async()=>{

await updateMap();

scan();

};

document.querySelector('#tw_search')
.oninput=scan;

document.querySelector('#tw_barbs')
.onchange=e=>{

cfg.showBarbs=e.target.checked;
save();
scan();

};

document.querySelector('#tw_players')
.onchange=e=>{

cfg.showPlayers=e.target.checked;
save();
scan();

};

document.querySelector('#tw_new')
.onchange=e=>{

cfg.filterNew=e.target.checked;
save();
scan();

};

document.querySelector('#tw_farmed')
.onchange=e=>{

cfg.filterFarmed=e.target.checked;
save();
scan();

};

document.querySelector('#tw_ignore')
.onchange=e=>{

cfg.filterIgnored=e.target.checked;
save();
scan();

};

document.querySelector('#tw_inactive')
.onchange=e=>{

cfg.filterInactive=e.target.checked;
save();
scan();

};

document.querySelector('#tw_close')
.onclick=()=>{

panel.remove();

delete window.TWMPRO_RUNNING;
delete window.TWMPRO_STATUS;

};

/* =========================================
   DRAG
========================================= */

let drag=false;

let offsetX=0;
let offsetY=0;

document
.querySelector('#tw_header')
.addEventListener('mousedown',e=>{

drag=true;

offsetX=
e.clientX-panel.offsetLeft;

offsetY=
e.clientY-panel.offsetTop;

});

document.addEventListener('mouseup',()=>{

drag=false;

cfg.panelX=panel.offsetLeft;
cfg.panelY=panel.offsetTop;
cfg.panelW=panel.offsetWidth;
cfg.panelH=panel.offsetHeight;

save();

});

document.addEventListener('mousemove',e=>{

if(!drag)return;

panel.style.left=
e.clientX-offsetX+'px';

panel.style.top=
e.clientY-offsetY+'px';

});

/* =========================================
   INIT
========================================= */

if(villages.length===0){

await updateMap();

}

scan();

setStatus(
'Załadowano '+
currentData.length+
' wiosek'
);

})();
