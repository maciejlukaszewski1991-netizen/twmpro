(() => {
'use strict';

if(window.TWMPRO)return;
window.TWMPRO=true;

/* =========================
   CONFIG
========================= */

const cfg={
range:true,
hover:true,
unit:'light',
hours:[1,2,4]
};

const speed={
spear:18,
sword:22,
axe:18,
light:10,
heavy:11,
spy:9,
snob:35
};

/* =========================
   MAP CHECK
========================= */

if(!location.href.includes('screen=map')){
alert('Otwórz mapę');
return;
}

/* =========================
   FIND MAP
========================= */

function getMapElement(){

return (
document.querySelector('#map_container') ||
document.querySelector('#map') ||
document.querySelector('#map_canvas') ||
document.querySelector('.map_container') ||
document.querySelector('#fullscreenmap')
);

}

const mapEl=getMapElement();

if(!mapEl){
alert('Nie znaleziono mapy');
return;
}

/* =========================
   CANVAS
========================= */

const canvas=document.createElement('canvas');

canvas.style.position='absolute';
canvas.style.left='0';
canvas.style.top='0';
canvas.style.pointerEvents='none';
canvas.style.zIndex='999';

document.body.appendChild(canvas);

const ctx=canvas.getContext('2d');

/* =========================
   UPDATE CANVAS POSITION
========================= */

function updateCanvas(){

const rect=mapEl.getBoundingClientRect();

canvas.width=rect.width;
canvas.height=rect.height;

canvas.style.left=rect.left+'px';
canvas.style.top=rect.top+'px';

render();

}

/* =========================
   RANGE DRAW
========================= */

function drawRanges(){

const rect=mapEl.getBoundingClientRect();

const x=rect.width/2;
const y=rect.height/2;

cfg.hours.forEach(h=>{

const r=(h*60/speed[cfg.unit])*14;

ctx.beginPath();
ctx.arc(x,y,r,0,Math.PI*2);

ctx.strokeStyle='#00ffff';
ctx.lineWidth=2;
ctx.stroke();

ctx.fillStyle='#00ffff';
ctx.font='12px Arial';
ctx.fillText(h+'h',x+r+5,y);

});

}

/* =========================
   RENDER
========================= */

function render(){

ctx.clearRect(0,0,canvas.width,canvas.height);

if(cfg.range){
drawRanges();
}

}

/* =========================
   PANEL
========================= */

const panel=document.createElement('div');

panel.innerHTML=`
<div style="font-weight:bold;margin-bottom:8px">
MAP PRO
</div>

<label style="display:block;margin-bottom:6px">
<input type="checkbox" id="tw_range" checked>
Range circles
</label>

<div style="margin-top:8px">
Jednostka:
</div>

<select id="tw_unit"
style="width:100%;margin-top:4px">

<option value="light">LK</option>
<option value="spy">Zwiad</option>
<option value="axe">Topór</option>
<option value="snob">Szlachcic</option>

</select>
`;

panel.style.position='fixed';
panel.style.top='120px';
panel.style.right='20px';
panel.style.background='#202225';
panel.style.color='white';
panel.style.padding='12px';
panel.style.zIndex='999999';
panel.style.borderRadius='10px';
panel.style.width='180px';
panel.style.fontSize='13px';
panel.style.boxShadow='0 0 10px rgba(0,0,0,.5)';

document.body.appendChild(panel);

/* =========================
   EVENTS
========================= */

document.querySelector('#tw_range')
.addEventListener('change',e=>{

cfg.range=e.target.checked;
render();

});

document.querySelector('#tw_unit')
.addEventListener('change',e=>{

cfg.unit=e.target.value;
render();

});

/* =========================
   TOOLTIP
========================= */

if(cfg.hover){

const tip=document.createElement('div');

tip.style.position='fixed';
tip.style.background='rgba(0,0,0,.9)';
tip.style.color='white';
tip.style.padding='6px';
tip.style.borderRadius='6px';
tip.style.pointerEvents='none';
tip.style.zIndex='999999';
tip.style.fontSize='12px';

document.body.appendChild(tip);

document.addEventListener('mousemove',e=>{

tip.style.left=e.clientX+15+'px';
tip.style.top=e.clientY+15+'px';

tip.innerHTML=`
Jednostka: ${cfg.unit}<br>
Zasięgi: ${cfg.hours.join(', ')}h
`;

});

}

/* =========================
   OBSERVERS
========================= */

window.addEventListener('resize',updateCanvas);

window.addEventListener('scroll',updateCanvas);

setInterval(updateCanvas,500);

/* =========================
   MESSAGE
========================= */

function message(t){

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

setTimeout(()=>d.remove(),3000);

}

updateCanvas();

message('TWMPRO aktywny');

})();
