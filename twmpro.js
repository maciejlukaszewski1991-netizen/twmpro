(async()=>{

'use strict';

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

const STORAGE='TWMPRO_V9';

/* =========================================
   CONFIG
========================================= */

const defaults={

radius:25,

panelX:100,
panelY:40,
panelW:950,
panelH:600,

showBarbs:true,
showPlayers:true,

showKnown:true,
showUnknown:true,

onlyUnknown:false,

showTribe:true,
showAllies:true,

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

let myAlly='';

let knownBarbs={};

/* =========================================
   LOAD CACHE
========================================= */

try{

knownBarbs=
JSON.parse(
localStorage.getItem(
'TWMPRO_KNOWN_BARBS'
)||'{}'
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
panel.style.background='#f4e4bc';
panel.style.color='#2b1a0a';
panel.style.border='2px solid #7a5b2e';
panel.style.zIndex='999999';
panel.style.borderRadius='8px';
panel.style.display='flex';
panel.style.flexDirection='column';
panel.style.resize='both';
panel.style.overflow='hidden';
panel.style.fontSize='11px';
panel.style.fontFamily='Verdana';
panel.style.boxShadow='0 0 10px rgba(0,0,0,.5)';

panel.innerHTML=`

<div id="tw_header"
style="
padding:8px;
background:#6b4d24;
color:#f4e4bc;
cursor:move;
font-weight:bold;
font-size:14px;
border-bottom:2px solid #3e2b14;
">

TWMPRO v9

</div>

<div style="
padding:6px;
display:flex;
gap:6px;
flex-wrap:wrap;
border-bottom:1px solid #7a5b2e;
background:#e6d3a3;
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
style="width:120px">

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

<label>
<input
type="checkbox"
id="tw_only_unknown"
${cfg.onlyUnknown?'checked':''}>
ONLY NEW
</label>

<label>
<input
type="checkbox"
id="tw_tribe"
${cfg.showTribe?'checked':''}>
TRIBE
</label>

<label>
<input
type="checkbox"
id="tw_allies"
${cfg.showAllies?'checked':''}>
ALLY
</label>

</div>

<div
id="tw_status"
style="
padding:5px;
background:#e6d3a3;
border-bottom:1px solid #7a5b2e;
font-weight:bold;
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

setStatus('Loading map');

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

/* MY ALLY */

const me=
players[game_data.player.id];

if(me){
myAlly=me.ally;
}

/* ALLIES */

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

id:a[0],
tag:a[2]

};

});

/* VILLAGES */

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

/* SORT */

villages.sort(
(a,b)=>a.distance-b.distance
);

setStatus(
'Loaded '+villages.length
);

renderTable();

}

/* =========================================
   BARB MARK
========================================= */

window.TWMPRO_MARK=id=>{

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

const p=players[v.playerId];

const isBarb=!p;

const known=
!!knownBarbs[v.id] ||
v.points<150;

/* FILTERS */

if(isBarb&&!cfg.showBarbs)
return false;

if(!isBarb&&!cfg.showPlayers)
return false;

if(isBarb){

if(!cfg.showKnown&&known)
return false;

if(!cfg.showUnknown&&!known)
return false;

if(cfg.onlyUnknown&&known)
return false;

}

/* TRIBE */

if(
!cfg.showTribe &&
p &&
p.ally===myAlly
){
return false;
}

/* SEARCH */

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
background:#f8eed1;
color:#2b1a0a;
">

<tr style="
background:#7a5b2e;
color:#f4e4bc;
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

<th>REL</th>

<th>STATUS</th>

<th>ACTION</th>

</tr>
`;

data.forEach(v=>{

const p=players[v.playerId];

const isBarb=!p;

const known=
!!knownBarbs[v.id] ||
v.points<150;

let bg='';

if(isBarb){

bg=known
?'rgba(210,180,80,.35)'
:'rgba(80,180,80,.25)';

}else{

bg='rgba(120,60,60,.08)';

}

/* TRIBE */

if(
p &&
p.ally===myAlly
){

bg='rgba(80,120,255,.20)';

}

let relation='';

if(
p &&
p.ally===myAlly
){

relation='🛡 TRIBE';

}

let status='';

if(isBarb){

status=known
?'🟡 KNOWN'
:'🟢 NEW';

}

html+=`

<tr style="
border-bottom:1px solid #c4a46a;
background:${bg};
">

<td>
${p?p.name:'BARB'}
</td>

<td>

<a
href="/game.php?village=${game_data.village.id}&screen=map#${v.x};${v.y}"
target="_blank"
style="color:#0044cc"
onclick="
TWMPRO_MARK('${v.id}');
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
${p?allies[p.ally]?.tag||'':''}
</td>

<td>
${relation}
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
TWMPRO_MARK('${v.id}')
">

${known?'UNMARK':'MARK'}

</button>
`
:'-'
}

</td>

</tr>
`;

});

html+=`</table>`;

document.querySelector('#tw_table')
.innerHTML=html;

/* SORTS */

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

[
'tw_barbs',
'tw_players',
'tw_known',
'tw_unknown',
'tw_only_unknown',
'tw_tribe',
'tw_allies'
].forEach(id=>{

addListener(
document.querySelector('#'+id),
'change',
e=>{

const map={

tw_barbs:'showBarbs',
tw_players:'showPlayers',
tw_known:'showKnown',
tw_unknown:'showUnknown',
tw_only_unknown:'onlyUnknown',
tw_tribe:'showTribe',
tw_allies:'showAllies'

};

cfg[map[id]]=e.target.checked;

save();

renderTable();

}
);

});

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
delete window.TWMPRO_MARK;

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

setStatus('Ready');

})();
