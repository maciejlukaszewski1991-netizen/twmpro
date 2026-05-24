(async()=>{

'use strict';

if(window.TWMPRO_RUNNING){
alert('TWMPRO już działa');
return;
}

window.TWMPRO_RUNNING=true;

/* =========================================
   CONFIG
========================================= */

const STORAGE='TWMPRO_V2';

const defaults={
radius:30,
panelX:250,
panelY:40,
panelW:900,
panelH:700,
showBarbs:true,
showPlayers:true,
showInactive:true,
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
let customData={};
let currentData=[];

/* =========================================
   LOAD CACHE
========================================= */

try{

const cache=JSON.parse(
localStorage.getItem('TWMPRO_CACHE')||'{}'
);

villages=cache.villages||[];
players=cache.players||{};
allies=cache.allies||{};
customData=cache.customData||{};

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
panel.style.boxShadow='0 0 15px rgba(0,0,0,.5)';
panel.style.display='flex';
panel.style.flexDirection='column';
panel.style.resize='both';
panel.style.overflow='hidden';

panel.innerHTML=`
<div id="tw_header"
style="
padding:10px;
background:#111;
cursor:move;
font-weight:bold;
font-size:18px;
">
TWMPRO SCANNER v2
</div>

<div style="
padding:10px;
border-bottom:1px solid #333;
display:flex;
gap:6px;
flex-wrap:wrap;
align-items:center;
">

Radius

<input
id="tw_radius"
type="number"
value="${cfg.radius}"
style="width:60px">

<button id="tw_scan">
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
<input type="checkbox"
id="tw_barbs"
${cfg.showBarbs?'checked':''}>
BARB
</label>

<label>
<input type="checkbox"
id="tw_players"
${cfg.showPlayers?'checked':''}>
PLAYERS
</label>

<label>
<input type="checkbox"
id="tw_inactive"
${cfg.showInactive?'checked':''}>
INACTIVE
</label>

</div>

<div
id="tw_status"
style="
padding:8px;
color:#00ff88;
font-size:12px;
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
'TWMPRO_CACHE',
JSON.stringify({
villages,
players,
allies,
customData
})
);

}

/* =========================================
   MAP DOWNLOAD
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

setStatus(
'Mapa zaktualizowana: '+
villages.length+
' wiosek'
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

if(
cfg.showInactive===false &&
p &&
p.villages<10
)
return false;

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

if(cfg.sort==='player'){

const pa=
players[a.playerId]?.name||'';

const pb=
players[b.playerId]?.name||'';

return pa.localeCompare(pb);

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

<th
class="tw_sort"
data-sort="player"
style="cursor:pointer">
PLAYER
</th>

<th>COORD</th>

<th
class="tw_sort"
data-sort="distance"
style="cursor:pointer">
DIST
</th>

<th
class="tw_sort"
data-sort="points"
style="cursor:pointer">
POINTS
</th>

<th>ALLY</th>

<th>STATUS</th>

<th>ACTION</th>

</tr>
`;

currentData.forEach(v=>{

const p=players[v.playerId];

const ally=
allies[p?.ally];

const cd=
customData[v.id]||{};

const inactive=
p&&p.villages<10;

let bg='';

if(!p){
bg='rgba(120,120,120,.15)';
}else if(inactive){
bg='rgba(0,255,0,.12)';
}else{
bg='rgba(255,0,0,.08)';
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
${v.distance.toFixed(2)}
</td>

<td>
${v.points}
</td>

<td>
${ally?ally.tag:''}
</td>

<td>

${cd.farmed?'🟢 FARMED':''}

</td>

<td>

<button
onclick="TWMPRO_MARK('${v.id}')">
MARK
</button>

</td>

</tr>
`;

});

html+=`</table>`;

document.querySelector('#tw_table')
.innerHTML=html;

/* SORT EVENTS */

document
.querySelectorAll('.tw_sort')
.forEach(el=>{

el.onclick=()=>{

cfg.sort=
el.dataset.sort;

save();

scan();

};

});

}

/* =========================================
   GLOBAL FUNCTIONS
========================================= */

window.TWMPRO_MARK=id=>{

if(!customData[id]){
customData[id]={};
}

customData[id].farmed=
!customData[id].farmed;

saveCache();

scan();

};

/* =========================================
   EVENTS
========================================= */

document.querySelector('#tw_scan')
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

document.querySelector('#tw_inactive')
.onchange=e=>{

cfg.showInactive=e.target.checked;
save();
scan();

};

document.querySelector('#tw_close')
.onclick=()=>{

panel.remove();

window.TWMPRO_RUNNING=false;

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
