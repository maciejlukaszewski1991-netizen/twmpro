(() => {
'use strict';

if(window.TWMPRO)return;
window.TWMPRO=true;

/* =========================================
   CONFIG
========================================= */

const STORAGE_KEY='TWMPRO_SETTINGS';

const defaults={
heatmap:true,
hover:true,
markers:true,
panelX:20,
panelY:120
};

const cfg=load();

/* =========================================
   HELPERS
========================================= */

function load(){

try{
return {
...defaults,
...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')
};
}catch(e){
return defaults;
}

}

function save(){
localStorage.setItem(
STORAGE_KEY,
JSON.stringify(cfg)
);
}

/* =========================================
   MAP CHECK
========================================= */

if(!location.href.includes('screen=map')){
alert('Otwórz mapę');
return;
}

/* =========================================
   CANVAS
========================================= */

const canvas=document.createElement('canvas');

canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

canvas.style.position='fixed';
canvas.style.left='0';
canvas.style.top='0';
canvas.style.width='100vw';
canvas.style.height='100vh';
canvas.style.pointerEvents='none';
canvas.style.zIndex='99998';

document.body.appendChild(canvas);

const ctx=canvas.getContext('2d');

/* =========================================
   RESIZE
========================================= */

function resize(){

canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

render();

}

window.addEventListener('resize',resize);

/* =========================================
   RENDER
========================================= */

function render(){

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

if(cfg.heatmap){
drawHeatmap();
}

if(cfg.markers){
drawMarkers();
}

}

/* =========================================
   HEATMAP
========================================= */

function drawHeatmap(){

for(let i=0;i<25;i++){

const x=Math.random()*canvas.width;
const y=Math.random()*canvas.height;

const danger=Math.random();

let color='rgba(0,255,0,.15)';

if(danger>.4){
color='rgba(255,255,0,.15)';
}

if(danger>.7){
color='rgba(255,0,0,.18)';
}

ctx.beginPath();

ctx.arc(
x,
y,
60,
0,
Math.PI*2
);

ctx.fillStyle=color;
ctx.fill();

}

}

/* =========================================
   MARKERS
========================================= */

function drawMarkers(){

for(let i=0;i<40;i++){

const x=Math.random()*canvas.width;
const y=Math.random()*canvas.height;

ctx.beginPath();

ctx.arc(
x,
y,
5,
0,
Math.PI*2
);

ctx.fillStyle='#00bfff';
ctx.fill();

}

}

/* =========================================
   PANEL
========================================= */

const panel=document.createElement('div');

panel.innerHTML=`
<div id="twmpro_header"
style="
font-weight:bold;
margin-bottom:10px;
cursor:move;
">
TWMPRO MAP v2
</div>

<label style="display:block;margin-bottom:8px">
<input type="checkbox"
id="tw_heatmap">

Heatmap
</label>

<label style="display:block;margin-bottom:8px">
<input type="checkbox"
id="tw_markers">

Village markers
</label>

<label style="display:block;margin-bottom:8px">
<input type="checkbox"
id="tw_hover">

Hover intel
</label>

<div style="
margin-top:10px;
font-size:11px;
opacity:.7;
">
ALT+H Heatmap<br>
ALT+M Markers
</div>
`;

panel.style.position='fixed';
panel.style.left=cfg.panelX+'px';
panel.style.top=cfg.panelY+'px';
panel.style.width='200px';
panel.style.background='#202225';
panel.style.color='white';
panel.style.padding='12px';
panel.style.borderRadius='10px';
panel.style.fontSize='13px';
panel.style.zIndex='999999';
panel.style.boxShadow='0 0 12px rgba(0,0,0,.5)';

document.body.appendChild(panel);

/* =========================================
   UI INIT
========================================= */

document.querySelector('#tw_heatmap')
.checked=cfg.heatmap;

document.querySelector('#tw_markers')
.checked=cfg.markers;

document.querySelector('#tw_hover')
.checked=cfg.hover;

/* =========================================
   EVENTS
========================================= */

document.querySelector('#tw_heatmap')
.addEventListener('change',e=>{

cfg.heatmap=e.target.checked;

save();
render();

});

document.querySelector('#tw_markers')
.addEventListener('change',e=>{

cfg.markers=e.target.checked;

save();
render();

});

document.querySelector('#tw_hover')
.addEventListener('change',e=>{

cfg.hover=e.target.checked;

save();

});

/* =========================================
   HOTKEYS
========================================= */

document.addEventListener('keydown',e=>{

if(e.altKey&&e.key==='h'){

cfg.heatmap=!cfg.heatmap;

document.querySelector('#tw_heatmap')
.checked=cfg.heatmap;

save();
render();

}

if(e.altKey&&e.key==='m'){

cfg.markers=!cfg.markers;

document.querySelector('#tw_markers')
.checked=cfg.markers;

save();
render();

}

});

/* =========================================
   DRAG PANEL
========================================= */

const header=
document.querySelector('#twmpro_header');

let drag=false;
let offsetX=0;
let offsetY=0;

header.addEventListener('mousedown',e=>{

drag=true;

offsetX=
e.clientX-panel.offsetLeft;

offsetY=
e.clientY-panel.offsetTop;

});

document.addEventListener('mouseup',()=>{

drag=false;

save();

});

document.addEventListener('mousemove',e=>{

if(!drag)return;

panel.style.left=
e.clientX-offsetX+'px';

panel.style.top=
e.clientY-offsetY+'px';

cfg.panelX=parseInt(panel.style.left);
cfg.panelY=parseInt(panel.style.top);

});

/* =========================================
   TOOLTIP
========================================= */

if(cfg.hover){

const tip=document.createElement('div');

tip.style.position='fixed';
tip.style.background='rgba(0,0,0,.9)';
tip.style.color='white';
tip.style.padding='6px';
tip.style.borderRadius='6px';
tip.style.fontSize='12px';
tip.style.pointerEvents='none';
tip.style.zIndex='999999';

document.body.appendChild(tip);

document.addEventListener('mousemove',e=>{

tip.style.left=e.clientX+15+'px';
tip.style.top=e.clientY+15+'px';

tip.innerHTML=`
MAP PRO ACTIVE<br>
X: ${e.clientX}<br>
Y: ${e.clientY}
`;

});

}

/* =========================================
   MESSAGE
========================================= */

function msg(t){

const d=document.createElement('div');

d.innerText=t;

d.style.position='fixed';
d.style.bottom='20px';
d.style.right='20px';
d.style.background='#111';
d.style.color='white';
d.style.padding='10px';
d.style.borderRadius='8px';
d.style.zIndex='999999';

document.body.appendChild(d);

setTimeout(()=>{
d.remove();
},2500);

}

render();

msg('TWMPRO v2 aktywny');

})();
