(async()=>{

'use strict';

/* =========================================
   TWMPRO v13 FINAL STABLE
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

const STORAGE='TWMPRO_V13';
const BARB_CACHE='TWMPRO_BARB_CACHE_V13';
const PLAYER_HISTORY='TWMPRO_PLAYER_HISTORY_V13';

/* =========================================
   CONFIG
========================================= */

const defaults={

    radius:25,

    panelX:80,
    panelY:40,

    panelW:1050,
    panelH:650,

    showBarbs:true,
    showPlayers:true,

    showKnown:true,
    showUnknown:true,

    onlyUnknown:false

};

let cfg=loadConfig();

function loadConfig(){

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

function saveConfig(){

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

let barbCache={};
let playerHistory={};

try{

    barbCache=
    JSON.parse(
        localStorage.getItem(BARB_CACHE)||'{}'
    );

}catch(e){

    barbCache={};

}

try{

    playerHistory=
    JSON.parse(
        localStorage.getItem(PLAYER_HISTORY)||'{}'
    );

}catch(e){

    playerHistory={};

}

/* =========================================
   HELPERS
========================================= */

function setStatus(txt){

    const el=
    document.querySelector('#tw_status');

    if(el){
        el.innerText=txt;
    }

}

function saveBarbs(){

    localStorage.setItem(
        BARB_CACHE,
        JSON.stringify(barbCache)
    );

}

function saveHistory(){

    localStorage.setItem(
        PLAYER_HISTORY,
        JSON.stringify(playerHistory)
    );

}

function dist(x1,y1,x2,y2){

    return Math.sqrt(
        Math.pow(x2-x1,2)+
        Math.pow(y2-y1,2)
    );

}

function currentCoord(){

    const c=
    game_data.village.coord.split('|');

    return{
        x:+c[0],
        y:+c[1]
    };

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
panel.style.border='2px solid #7a5b2e';

panel.style.zIndex='999999';

panel.style.display='flex';
panel.style.flexDirection='column';

panel.style.resize='both';
panel.style.overflow='hidden';

panel.style.fontFamily='Verdana';
panel.style.fontSize='11px';

panel.style.borderRadius='8px';

panel.style.boxShadow='0 0 12px rgba(0,0,0,.5)';

panel.innerHTML=`

<div id="tw_header"
style="
padding:8px;
background:#6b4d24;
color:#f4e4bc;
font-weight:bold;
cursor:move;
border-bottom:2px solid #3e2b14;
">

TWMPRO v13 FINAL

</div>

<div style="
padding:6px;
background:#e6d3a3;
display:flex;
gap:6px;
flex-wrap:wrap;
align-items:center;
border-bottom:1px solid #7a5b2e;
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

<label>
<input
type="checkbox"
id="tw_only_unknown"
${cfg.onlyUnknown?'checked':''}>
ONLY NEW
</label>

</div>

<div id="tw_status"
style="
padding:5px;
background:#f8eed1;
border-bottom:1px solid #c4a46a;
font-weight:bold;
">

READY

</div>

<div id="tw_table"
style="
flex:1;
overflow:auto;
background:#f8eed1;
">
</div>

`;

document.body.appendChild(panel);

/* =========================================
   LOAD MAP
========================================= */

async function loadMap(){

    try{

        setStatus('Loading players');

        const playerTxt=
        await fetch('/map/player.txt')
        .then(r=>r.text());

        players={};

        playerTxt
        .trim()
        .split('\n')
        .forEach(line=>{

            if(!line)return;

            const p=line.split(',');

            players[p[0]]={

                id:p[0],
                name:p[1],
                ally:p[2],

                villages:+p[3],
                points:+p[4]

            };

            /* HISTORY */

            if(!playerHistory[p[0]]){

                playerHistory[p[0]]=[];

            }

            playerHistory[p[0]].push({

                time:Date.now(),
                points:+p[4]

            });

            if(
                playerHistory[p[0]].length>30
            ){

                playerHistory[p[0]].shift();

            }

        });

        saveHistory();

        /* MY ALLY */

        const me=
        players[game_data.player.id];

        if(me){

            myAlly=me.ally;

        }

        /* ALLIES */

        setStatus('Loading allies');

        const allyTxt=
        await fetch('/map/ally.txt')
        .then(r=>r.text());

        allies={};

        allyTxt
        .trim()
        .split('\n')
        .forEach(line=>{

            if(!line)return;

            const a=line.split(',');

            allies[a[0]]={

                tag:a[2]

            };

        });

        /* VILLAGES */

        setStatus('Loading villages');

        const villageTxt=
        await fetch('/map/village.txt')
        .then(r=>r.text());

        const lines=
        villageTxt.split('\n');

        const c=currentCoord();

        const radius=
        +document.querySelector('#tw_radius').value;

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

            /* ONLY RADIUS */

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

        /* SORT NEAREST FIRST */

        villages.sort(
            (a,b)=>a.distance-b.distance
        );

        setStatus(
            'Loaded '+villages.length
        );

        renderTable();

        /* START BARB SCAN */

        scanBarbsQueue();

    }catch(e){

        console.error(e);

        setStatus('Load error');

    }

}

/* =========================================
   BARB SCANNER
========================================= */

let scanning=false;

async function scanBarbsQueue(){

    if(scanning)return;

    scanning=true;

    const barbs=
    villages
    .filter(v=>!v.playerId)
    .sort((a,b)=>a.distance-b.distance);

    for(const barb of barbs){

        /* CACHE */

        if(barbCache[barb.id]){
            continue;
        }

        try{

            setStatus(
                'Checking '+barb.x+'|'+barb.y
            );

            const url=
            `/game.php?village=${game_data.village.id}&screen=info_village&id=${barb.id}`;

            const html=
            await fetch(url)
            .then(r=>r.text());

            /* =====================================
               REAL FARM DETECTION
            ===================================== */

            let known=false;

            /*
               KNOWN BARB:
               has reports/history

               Examples:
               "atakuje Wioska barbarzyńska"
               "szpieguje Wioska barbarzyńska"
               "Własne rozkazy"
            */

            if(

                html.includes('atakuje Wioska barbarzyńska')

                ||

                html.includes('szpieguje Wioska barbarzyńska')

                ||

                html.includes('Własne rozkazy')

            ){

                known=true;

            }

            barbCache[barb.id]={

                known,
                time:Date.now()

            };

            saveBarbs();

            renderTable();

        }catch(e){

            console.error(e);

        }

        /* DELAY */

        await new Promise(r=>
            setTimeout(r,350)
        );

    }

    scanning=false;

    setStatus('Barb scan finished');

}

/* =========================================
   PLAYER ACTIVITY
========================================= */

function getPlayerActivity(playerId){

    const h=
    playerHistory[playerId];

    if(!h || h.length<2){

        return{

            status:'UNKNOWN',

            d1:0,
            d2:0,
            d7:0

        };

    }

    const latest=
    h[h.length-1];

    const oldest=
    h[0];

    const diff=
    latest.points-oldest.points;

    let status='ACTIVE';

    if(diff===0){

        status='INACTIVE';

    }

    return{

        status,

        d1:diff,
        d2:diff,
        d7:diff

    };

}

/* =========================================
   FILTER
========================================= */

function filtered(){

    const search=
    document
    .querySelector('#tw_search')
    .value
    .toLowerCase();

    return villages.filter(v=>{

        const p=
        players[v.playerId];

        const isBarb=!p;

        const barb=
        barbCache[v.id];

        const known=
        barb?.known===true;

        /* BARB FILTERS */

        if(isBarb&&!cfg.showBarbs)
        return false;

        if(!isBarb&&!cfg.showPlayers)
        return false;

        if(isBarb){

            if(
                !cfg.showKnown &&
                known
            ){
                return false;
            }

            if(
                !cfg.showUnknown &&
                !known
            ){
                return false;
            }

            if(
                cfg.onlyUnknown &&
                known
            ){
                return false;
            }

        }

        /* SEARCH */

        if(!search)
        return true;

        return(

            v.name
            .toLowerCase()
            .includes(search)

            ||

            (
                p &&
                p.name
                .toLowerCase()
                .includes(search)
            )

        );

    });

}

/* =========================================
   TABLE
========================================= */

function renderTable(){

    const data=
    filtered();

    let html=`

<table style="
width:100%;
border-collapse:collapse;
font-size:11px;
">

<tr style="
background:#7a5b2e;
color:#f4e4bc;
position:sticky;
top:0;
z-index:5;
">

<th>PLAYER</th>
<th>COORD</th>
<th>ATTACK</th>
<th>DIST</th>
<th>PTS</th>
<th>ALLY</th>
<th>REL</th>
<th>ACTIVITY</th>
<th>STATUS</th>

</tr>
`;

    data.forEach(v=>{

        const p=
        players[v.playerId];

        const isBarb=!p;

        const barb=
        barbCache[v.id];

        const known=
        barb?.known===true;

        let bg='#f8eed1';

        /* BARB COLORS */

        if(isBarb){

            bg=known
            ?'#e4d39a'
            :'#cfe6b8';

        }

        /* MY TRIBE */

        if(
            p &&
            p.ally===myAlly
        ){

            bg='#c9d8ff';

        }

        const relation=
        (
            p &&
            p.ally===myAlly
        )
        ?'🛡 TRIBE'
        :'';

        const act=
        p
        ?getPlayerActivity(p.id)
        :null;

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
style="color:#0044cc;font-weight:bold;">

${v.x}|${v.y}

</a>

</td>

<td>

<a
href="/game.php?village=${game_data.village.id}&screen=place&target=${v.id}"
target="_blank"
style="
color:#aa0000;
font-weight:bold;
text-decoration:none;
">

⚔ ATAK

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

${
act
?`
${act.status}<br>
Δ ${act.d1}
`
:''
}

</td>

<td>

${
isBarb
?(
known
?'🟡 KNOWN'
:'🟢 NEW'
)
:''
}

</td>

</tr>
`;

    });

    html+=`</table>`;

    document
    .querySelector('#tw_table')
    .innerHTML=html;

}

/* =========================================
   EVENTS
========================================= */

document
.querySelector('#tw_scan')
.onclick=loadMap;

document
.querySelector('#tw_search')
.oninput=renderTable;

[
'tw_barbs',
'tw_players',
'tw_known',
'tw_unknown',
'tw_only_unknown'
]
.forEach(id=>{

    document
    .querySelector('#'+id)
    .onchange=e=>{

        const map={

            tw_barbs:'showBarbs',
            tw_players:'showPlayers',

            tw_known:'showKnown',
            tw_unknown:'showUnknown',

            tw_only_unknown:'onlyUnknown'

        };

        cfg[
            map[id]
        ]=e.target.checked;

        saveConfig();

        renderTable();

    };

});

/* =========================================
   DRAG
========================================= */

let drag=false;

let offsetX=0;
let offsetY=0;

document
.querySelector('#tw_header')
.onmousedown=e=>{

    drag=true;

    offsetX=
    e.clientX-panel.offsetLeft;

    offsetY=
    e.clientY-panel.offsetTop;

};

document.onmouseup=()=>{

    drag=false;

    cfg.panelX=panel.offsetLeft;
    cfg.panelY=panel.offsetTop;

    saveConfig();

};

document.onmousemove=e=>{

    if(!drag)return;

    panel.style.left=
    e.clientX-offsetX+'px';

    panel.style.top=
    e.clientY-offsetY+'px';

};

/* =========================================
   DESTROY
========================================= */

function destroy(){

    panel.remove();

    delete window.TWMPRO_RUNNING;
    delete window.TWMPRO_DESTROY;

}

window.TWMPRO_DESTROY=destroy;

document
.querySelector('#tw_close')
.onclick=destroy;

/* =========================================
   INIT
========================================= */

setStatus('Ready');

})();
