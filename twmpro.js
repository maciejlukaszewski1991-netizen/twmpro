/* =========================================
   DODAJ do defaults
========================================= */

onlyUnknown:false,

showTribe:true,
showAlly:true,

/* =========================================
   DODAJ po:
let allies={}
========================================= */

let myTribe=null;
let allyTags=[];

/* =========================================
   DODAJ helper
========================================= */

function detectDiplomacy(){

const me=
players[game_data.player.id];

if(!me)return;

myTribe=me.ally;

if(!myTribe)return;

/* =====================================
   PROSTA LISTA SOJUSZY
===================================== */

allyTags=[];

Object.values(allies)
.forEach(a=>{

if(
a.tag &&
(
a.tag.includes(allies[myTribe]?.tag) ||
allies[myTribe]?.tag.includes(a.tag)
)
){
allyTags.push(a.id);
}

});

}

/* =========================================
   ZMIEŃ panel.innerHTML
   checkboxy
========================================= */

<label>
<input
type="checkbox"
id="tw_tribe"
${cfg.showTribe?'checked':''}>
MY TRIBE
</label>

<label>
<input
type="checkbox"
id="tw_ally"
${cfg.showAlly?'checked':''}>
ALLY
</label>

/* =========================================
   ZMIEŃ cały styl panelu
========================================= */

panel.style.background='#f4e4bc';
panel.style.color='#2b1a0a';
panel.style.border='2px solid #7a5b2e';
panel.style.boxShadow='0 0 12px rgba(0,0,0,.4)';
panel.style.fontFamily='Verdana';

/* =========================================
   ZMIEŃ HEADER STYLE
========================================= */

background:#6b4d24;
color:#f4e4bc;
border-bottom:2px solid #3e2b14;

/* =========================================
   ZMIEŃ STATUS STYLE
========================================= */

background:#e6d3a3;
color:#2b1a0a;
font-weight:bold;

/* =========================================
   ZMIEŃ table style
========================================= */

<table style="
width:100%;
border-collapse:collapse;
font-size:11px;
background:#f8eed1;
color:#2b1a0a;
">

/* =========================================
   ZMIEŃ HEADER tabeli
========================================= */

<tr style="
background:#7a5b2e;
color:#f4e4bc;
position:sticky;
top:0;
z-index:5;
">

/* =========================================
   DODAJ po load allies
========================================= */

detectDiplomacy();

/* =========================================
   ZMIEŃ bg logic
========================================= */

let bg='';

if(isBarb){

bg=analysis?.known
?'rgba(210,180,80,.35)'
:'rgba(80,180,80,.25)';

}else{

bg='rgba(120,60,60,.10)';

}

/* =====================================
   MY TRIBE
===================================== */

if(
p &&
p.ally &&
p.ally===myTribe
){

bg='rgba(80,120,255,.20)';

}

/* =====================================
   ALLY
===================================== */

if(
p &&
allyTags.includes(p.ally)
){

bg='rgba(160,120,255,.18)';

}

/* =========================================
   STATUS tribe
========================================= */

let relation='';

if(
p &&
p.ally===myTribe
){

relation='🛡 TRIBE';

}else if(
p &&
allyTags.includes(p.ally)
){

relation='🤝 ALLY';

}

/* =========================================
   DODAJ nową kolumnę
========================================= */

<th>RELATION</th>

/* =========================================
   DODAJ do row
========================================= */

<td>
${relation}
</td>

/* =========================================
   FILTER tribe
========================================= */

if(
!cfg.showTribe &&
p &&
p.ally===myTribe
){
return false;
}

if(
!cfg.showAlly &&
p &&
allyTags.includes(p.ally)
){
return false;
}

/* =========================================
   EVENT tribe
========================================= */

addListener(
document.querySelector('#tw_tribe'),
'change',
e=>{

cfg.showTribe=e.target.checked;

save();

renderTable();

}
);

/* =========================================
   EVENT ally
========================================= */

addListener(
document.querySelector('#tw_ally'),
'change',
e=>{

cfg.showAlly=e.target.checked;

save();

renderTable();

}
);
