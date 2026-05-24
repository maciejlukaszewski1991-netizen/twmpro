(async()=>{

'use strict';

if(window.TWMPRO)return;
window.TWMPRO=true;

/* =========================================
   CONFIG
========================================= */

const STORAGE='TWMPRO_SCANNER';

const cfg={
radius:30
};

/* =========================================
   DATA
========================================= */

let villages=[];
let players={};
let allies={};
let customData={};

/* =========================================
   LOAD SAVED
========================================= */

try{

const saved=JSON.parse(
localStorage.getItem(STORAGE)||'{}'
);

customData=saved.customData||{};

}catch(e){}

/* =========================================
   UI
========================================= */

const panel=document.createElement('div');

panel.style.position='fixed';
panel.style.top='50px';
panel.style.right='20px';
panel.style.width='700px';
panel.style.height='700px';
panel.style.background='#202225';
panel.style.color='white';
panel.style.zIndex='999999';
panel.style.padding='10px';
panel.style.borderRadius='10px';
panel.style.fontSize='12px';
panel.style.overflow='hidden';
panel.style.boxShadow='0 0 15px rgba(0,0,0,.5)';

panel.innerHTML=`
<div style="
font-weight:bold;
font-size:16px;
margin-bottom:10px;
">
TWMPRO SCANNER
</div>

<div style="margin-bottom:10px">

Radius:

<input
id="tw_radius"
type="number"
value="${cfg.radius}"
style="
width:60px;
margin-right:10px;
">

<button id="tw_scan">
SCAN
</button>

<input
id="tw_search"
placeholder="szukaj..."
style="
margin-left:10px;
width:200px;
">

</div>

<div
id="tw_status"
style="
margin-bottom:10px;
color:#00ff88;
">
READY
</div>

<div
id="tw_table"
style="
height:600px;
overflow:auto;
border:1px solid #444;
">
</div>
`;

document.body.appendChild(panel);

/* =========================================
   HELPERS
========================================= */

function dist(x1,y1,x2,y2){

return Math.sqrt(
Math.pow(x2-x1,2)+
Math.pow(y2-y1,2)
);

}

function currentCoord(){

const coord=
game_data.village.coord
.split('|');

return {
x:+coord[0],
y:+coord[1]
};

}

function save(){

localStorage.setItem(
STORAGE,
JSON.stringify({
customData
})
);

}

function setStatus(t){

document.querySelector('#tw_status')
.innerText=t;

}

/* =========================================
   DOWNLOAD MAP
========================================= */

async function loadMapData(){

setStatus('Pobieranie village.txt');

const villagesTxt=
await fetch('/map/village.txt')
.then(r=>r.text());

setStatus('Pobieranie player.txt');

const playersTxt=
await fetch('/map/player.txt')
.then(r=>r.text());

setStatus('Pobieranie ally.txt');

const alliesTxt=
await fetch('/map/ally.txt')
.then(r=>r.text());

/* ======================
   PARSE PLAYERS
====================== */

playersTxt
.trim()
.split('\n')
.forEach(line=>{

const p=line.split(',');

players[p[0]]={
id:p[0],
name:p[1],
ally:p[2],
villages:p[3],
points:p[4]
};

});

/* ======================
   PARSE ALLIES
====================== */

alliesTxt
.trim()
.split('\n')
.forEach(line=>{

const a=line.split(',');

allies[a[0]]={
id:a[0],
name:a[1],
tag:a[2]
};

});

/* ======================
   PARSE VILLAGES
====================== */

villages=[];

villagesTxt
.trim()
.split('\n')
.forEach(line=>{

const v=line.split(',');

villages.push({
id:v[0],
name:v[1],
x:+v[2],
y:+v[3],
playerId:v[4],
points:+v[5]
});

});

setStatus(
'Mapa załadowana: '+
villages.length+
' wiosek'
);

}

/* =========================================
   SCAN
========================================= */

function scan(){

const c=currentCoord();

const radius=
+document.querySelector('#tw_radius')
.value;

const search=
document.querySelector('#tw_search')
.value
.toLowerCase();

const result=
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
.filter(v=>v.distance<=radius)
.filter(v=>{

if(!search)return true;

const p=
players[v.playerId];

return (
v.name.toLowerCase().includes(search) ||
(p&&p.name.toLowerCase().includes(search))
);

})
.sort((a,b)=>a.distance-b.distance);

renderTable(result);

}

/* =========================================
   TABLE
========================================= */

function renderTable(data){

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

<th>Player</th>
<th>Coord</th>
<th>Dist</th>
<th>Points</th>
<th>Status</th>
<th>Action</th>

</tr>
`;

data.forEach(v=>{

const p=players[v.playerId];

const cd=
customData[v.id]||{};

html+=`
<tr style="
border-bottom:1px solid #333;
">

<td>
${p?p.name:'BARB'}
</td>

<td>
${v.x}|${v.y}
</td>

<td>
${v.distance.toFixed(2)}
</td>

<td>
${v.points}
</td>

<td>
${cd.attacked?'✔ FARMED':''}
</td>

<td>

<button
onclick="
TWMPRO_MARK('${v.id}')
">
MARK
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
   GLOBAL MARK
========================================= */

window.TWMPRO_MARK=id=>{

if(!customData[id]){
customData[id]={};
}

customData[id].attacked=
!customData[id].attacked;

save();

scan();

};

/* =========================================
   EVENTS
========================================= */

document.querySelector('#tw_scan')
.onclick=scan;

document.querySelector('#tw_search')
.oninput=scan;

/* =========================================
   INIT
========================================= */

await loadMapData();

scan();

})();
