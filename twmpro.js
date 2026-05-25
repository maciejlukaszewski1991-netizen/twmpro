(async()=>{

'use strict';

/* =========================================
   TWMPRO v8
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

const STORAGE='TWMPRO_V8';

/* =========================================
   CONFIG
========================================= */

const defaults={

radius:20,

panelX:100,
panelY:40,
panelW:950,
panelH:600,

showBarbs:true,
showPlayers:true,

showKnown:true,
showUnknown:true,

sort:'distance'

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

let knownBarbs={};

try{

knownBarbs=
JSON.parse(
localStorage.getItem('TWMPRO_KNOWN_BARBS')||'{}'
);

}catch(e){}

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

TWMPRO v8

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
id="tw_known"
${cfg.showKnown?'checked':''}>
KNOWN
</label>

<label>
<input
type="checkbox"
id="tw_unknown"
${cfg.showUnknown?'checked':''}>
NEW
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

function saveKnown(){

localStorage.setItem(
'TWMPRO_KNOWN_BARBS',
JSON.stringify(knownBarbs)
);

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

/* SORT BY DISTANCE */

villages.sort(
(a,b)=>a.distance-b.distance
);

setStatus(
'Loaded '+villages.length
);

renderTable();

}

/* =========================================
   MARK KNOWN
========================================= */

window.TWMPRO_TOGGLE_BARB=id=>{

knownBarbs[id]=!knownBarbs[id];

saveKnown();

renderTable();

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

if(isBarb){

const known=
!!knownBarbs[v.id];

if(!cfg.showKnown&&known)
return false;

if(!cfg.showUnknown&&!known)
return false;

}

if(!search)return true;

const p=players[v.playerId];

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
z-index:5;
">

<th id="sort_player"
style="cursor:pointer">
PLAYER
</th>

<th>COORD</th>

<th id="sort_dist"
style="cursor:pointer">
DIST
</th>

<th id="sort_points"
style="cursor:pointer">
PTS
</th>

<th>ALLY</th>

<th>STATUS</th>

<th>ACTION</th>

</tr>
`;

data.forEach(v=>{

const p=players[v.playerId];

const ally=
allies[p?.ally];

const isBarb=!p;

const known=
!!knownBarbs[v.id];

let bg='';

if(isBarb){

bg=known
?'rgba(255,255,0,.10)'
:'rgba(0,255,0,.10)';

}else{

bg='rgba(255,0,0,.06)';

}

let status='';

if(isBarb){

status=known
?'🟡 KNOWN'
:'🟢 NEW';

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
style="color:#6cf"
onclick="
if(!${!p}){
return true;
}
TWMPRO_TOGGLE_BARB('${v.id}');
">

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
${status}
</td>

<td>

${
isBarb
?`
<button
onclick="
TWMPRO_TOGGLE_BARB('${v.id}')
">
${known?'UNMARK':'MARK'}
</button>
`
:`
-
`
}

</td>

</tr>
`;

});

html+=`</table>`;

document.querySelector('#tw_table')
.innerHTML=html;

/* =====================================
   SORT EVENTS
===================================== */

document.querySelector('#sort_dist')
.onclick=()=>{

villages.sort(
(a,b)=>a.distance-b.distance
);

renderTable();

};

document.querySelector('#sort_points')
.onclick=()=>{

villages.sort(
(a,b)=>b.points-a.points
);

renderTable();

};

document.querySelector('#sort_player')
.onclick=()=>{

villages.sort((a,b)=>{

const pa=
players[a.playerId]?.name||'BARB';

const pb=
players[b.playerId]?.name||'BARB';

return pa.localeCompare(pb);

});

renderTable();

};

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
document.querySelector('#tw_known'),
'change',
e=>{

cfg.showKnown=e.target.checked;
save();
renderTable();

}
);

addListener(
document.querySelector('#tw_unknown'),
'change',
e=>{

cfg.showUnknown=e.target.checked;
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
delete window.TWMPRO_TOGGLE_BARB;

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
