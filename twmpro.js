(async()=>{

'use strict';

/* =========================================
   FULL CLEANUP
========================================= */

if(window.TWMPRO_DESTROY){

window.TWMPRO_DESTROY();

}

/* =========================================
   RUNNING
========================================= */

window.TWMPRO_RUNNING=true;

/* =========================================
   STORAGE
========================================= */

const STORAGE='TWMPRO_V5';
const CACHE='TWMPRO_CACHE_V5';
const HISTORY='TWMPRO_HISTORY_V5';

/* =========================================
   CONFIG
========================================= */

const defaults={

radius:25,

panelX:120,
panelY:40,
panelW:950,
panelH:600,

showBarbs:true,
showPlayers:true,

filterInactive:false,
filterFarmed:false,
filterNew:false,

sort:'distance'

};

let cfg=load();

/* =========================================
   LOAD
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
   CACHE
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

try{

history=JSON.parse(
localStorage.getItem(HISTORY)||'{}'
);

}catch(e){}

/* =========================================
   EVENTS STORE
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
panel.style.boxShadow='0 0 10px rgba(0,0,0,.5)';
panel.style.fontSize='11px';

panel.innerHTML=`

<div id="tw_header"
style="
padding:8px;
background:#111;
cursor:move;
font-weight:bold;
font-size:15px;
">

TWMPRO v5

</div>

<div style="
padding:6px;
border-bottom:1px solid #333;
display:flex;
gap:6px;
flex-wrap:wrap;
align-items:center;
font-size:11px;
">

R

<input
id="tw_radius"
type="number"
value="${cfg.radius}"
style="width:50px">

<button id="tw_update">
UPDATE
</button>

<button id="tw_auto">
AUTO AI
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
id="tw_inactive"
${cfg.filterInactive?'checked':''}>
INACTIVE
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

</div>

<div
id="tw_status"
style="
padding:5px;
font-size:11px;
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
font-size:11px;
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
   INACTIVE AI
========================================= */

function inactiveScore(player){

if(!player)return 0;

/* IGNORE BARBS */

if(player.id==='0')
return 0;

let score=0;

if(!player.ally){
score+=25;
}

if(player.villages<3){
score+=25;
}

if(player.points<3000){
score+=10;
}

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
   AUTO ANALYZE
========================================= */

function autoAnalyze(){

villages.forEach(v=>{

if(!v.playerId)return;

const p=players[v.playerId];

if(!p)return;

const score=
inactiveScore(p);

if(score>=60){

if(!customData[v.id]){
customData[v.id]={};
}

customData[v.id].status='inactive';

}

});

saveCache();

scan();

}

/* =========================================
   UPDATE MAP
========================================= */

async function updateMap(){

setStatus('Updating map...');

const villageTxt=
await fetch('/map/village.txt')
.then(r=>r.text());

const playerTxt=
await fetch('/map/player.txt')
.then(r=>r.text());

const allyTxt=
await fetch('/map/ally.txt')
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

history[p[0]]={
points:+p[4],
time:Date.now()
};

});

allies={};

allyTxt
.trim()
.split('\n')
.forEach(l=>{

const a=l.split(',');

allies[a[0]]={
id:a[0],
tag:a[2]
};

});

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
'Loaded: '+villages.length
);

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

const p=players[v.playerId];

const cd=
customData[v.id]||{};

if(
cfg.filterInactive &&
cd.status!=='inactive'
){
return false;
}

if(
cfg.filterNew &&
cd.status!=='new'
){
return false;
}

if(
cfg.filterFarmed &&
cd.status!=='farmed'
){
return false;
}

if(!search)return true;

return(
v.name.toLowerCase().includes(search) ||
(p&&p.name.toLowerCase().includes(search))
);

})

.sort((a,b)=>a.distance-b.distance);

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
">

<th>PLAYER</th>
<th>COORD</th>
<th>D</th>
<th>PTS</th>
<th>ALLY</th>
<th>AI</th>
<th>STATUS</th>

</tr>
`;

currentData.forEach(v=>{

const p=players[v.playerId];

const ally=
allies[p?.ally];

const cd=
customData[v.id]||{};

const ai=
p?inactiveScore(p):0;

let bg='';

if(!p){

bg='rgba(120,120,120,.10)';

}

if(cd.status==='inactive'){

bg='rgba(0,255,0,.12)';

}

if(cd.status==='farmed'){

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
${ally?ally.tag:''}
</td>

<td>
${ai}
</td>

<td>
${cd.status||''}
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
document.querySelector('#tw_update'),
'click',
async()=>{

await updateMap();

scan();

}
);

addListener(
document.querySelector('#tw_auto'),
'click',
()=>{

autoAnalyze();

}
);

addListener(
document.querySelector('#tw_search'),
'input',
scan
);

addListener(
document.querySelector('#tw_close'),
'click',
()=>{

destroy();

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

}

window.TWMPRO_DESTROY=destroy;

/* =========================================
   INIT
========================================= */

if(villages.length===0){

await updateMap();

}

scan();

setStatus(
'Villages: '+currentData.length
);

})();
