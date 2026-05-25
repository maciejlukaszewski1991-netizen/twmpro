(async()=>{

'use strict';

/* =========================================
   TWMPRO v16 ULTRA STABLE
   FULL REWRITE
   VERIFIED MULTIPLE TIMES
========================================= */

/* =========================================
   SINGLETON
========================================= */

if(window.TWMPRO_CORE){

    window.TWMPRO_CORE.openPanel();

    return;

}

/* =========================================
   CORE
========================================= */

window.TWMPRO_CORE={};

const CORE=window.TWMPRO_CORE;

/* =========================================
   STORAGE
========================================= */

const STORAGE='TWMPRO_V16_CONFIG';
const KNOWN_STORAGE='TWMPRO_V16_KNOWN';
const PLAYER_HISTORY='TWMPRO_V16_HISTORY';

/* =========================================
   CONFIG
========================================= */

const defaults={

    radius:25,

    panelX:100,
    panelY:40,

    panelW:1200,
    panelH:700,

    minimized:false,

    showBarbs:true,
    showPlayers:true,

    showKnown:true,
    showUnknown:true,

    onlyUnknown:false,

    autoRefresh:true,
    refreshInterval:120,

    sortBy:'distance',
    sortDir:'asc',

    search:''

};

CORE.cfg=loadConfig();

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
        JSON.stringify(CORE.cfg)
    );

}

/* =========================================
   DATA
========================================= */

CORE.villages=[];
CORE.players={};
CORE.allies={};

CORE.myAlly='';

CORE.knownBarbs={};

CORE.playerHistory={};

CORE.loading=false;

CORE.refreshTimer=null;

/* =========================================
   LOAD STORAGE
========================================= */

try{

    CORE.knownBarbs=
    JSON.parse(
        localStorage.getItem(KNOWN_STORAGE)||'{}'
    );

}catch(e){

    CORE.knownBarbs={};

}

try{

    CORE.playerHistory=
    JSON.parse(
        localStorage.getItem(PLAYER_HISTORY)||'{}'
    );

}catch(e){

    CORE.playerHistory={};

}

/* =========================================
   HELPERS
========================================= */

function saveKnown(){

    localStorage.setItem(
        KNOWN_STORAGE,
        JSON.stringify(CORE.knownBarbs)
    );

}

function saveHistory(){

    localStorage.setItem(
        PLAYER_HISTORY,
        JSON.stringify(CORE.playerHistory)
    );

}

function setStatus(txt){

    const el=
    document.querySelector('#tw_status');

    if(el){
        el.innerText=txt;
    }

}

function dist(x1,y1,x2,y2){

    return Math.sqrt(
        Math.pow(x2-x1,2)+
        Math.pow(y2-y1,2)
    );

}

function currentCoord(){

    try{

        const c=
        game_data.village.coord
        .split('|');

        return{
            x:+c[0],
            y:+c[1]
        };

    }catch(e){

        return{
            x:500,
            y:500
        };

    }

}

function safeNumber(v){

    return isNaN(v)
    ?0
    :Number(v);

}

/* =========================================
   FLOAT BUTTON
========================================= */

const floatBtn=
document.createElement('div');

floatBtn.innerHTML='⚔';

floatBtn.style.position='fixed';
floatBtn.style.right='10px';
floatBtn.style.bottom='10px';

floatBtn.style.width='42px';
floatBtn.style.height='42px';

floatBtn.style.background='#6b4d24';
floatBtn.style.color='#fff';

floatBtn.style.borderRadius='50%';

floatBtn.style.display='flex';
floatBtn.style.alignItems='center';
floatBtn.style.justifyContent='center';

floatBtn.style.cursor='pointer';

floatBtn.style.zIndex='999999';

floatBtn.style.fontSize='20px';

floatBtn.style.boxShadow='0 0 10px rgba(0,0,0,.5)';

document.body.appendChild(floatBtn);

/* =========================================
   PANEL
========================================= */

const panel=
document.createElement('div');

panel.style.position='fixed';

panel.style.left=
CORE.cfg.panelX+'px';

panel.style.top=
CORE.cfg.panelY+'px';

panel.style.width=
CORE.cfg.panelW+'px';

panel.style.height=
CORE.cfg.panelH+'px';

panel.style.background='#f4e4bc';
panel.style.border='2px solid #7a5b2e';

panel.style.zIndex='999998';

panel.style.display=
CORE.cfg.minimized
?'none'
:'flex';

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
display:flex;
justify-content:space-between;
align-items:center;
">

<span>TWMPRO v16 ULTRA</span>

<div>

<button id="tw_minimize">_</button>

<button id="tw_close">X</button>

</div>

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
value="${CORE.cfg.radius}"
style="width:50px">

<button id="tw_scan">
SCAN
</button>

<button id="tw_import_place">
IMPORT PLACE
</button>

<input
id="tw_search"
placeholder="search"
value="${CORE.cfg.search}"
style="width:140px">

<select id="tw_sort">

<option value="distance">
DIST
</option>

<option value="points">
POINTS
</option>

<option value="player">
PLAYER
</option>

<option value="ally">
ALLY
</option>

<option value="status">
STATUS
</option>

</select>

<select id="tw_sort_dir">

<option value="asc">
ASC
</option>

<option value="desc">
DESC
</option>

</select>

<label>
<input
type="checkbox"
id="tw_barbs"
${CORE.cfg.showBarbs?'checked':''}>
BARB
</label>

<label>
<input
type="checkbox"
id="tw_players"
${CORE.cfg.showPlayers?'checked':''}>
PLAYERS
</label>

<label>
<input
type="checkbox"
id="tw_known"
${CORE.cfg.showKnown?'checked':''}>
KNOWN
</label>

<label>
<input
type="checkbox"
id="tw_unknown"
${CORE.cfg.showUnknown?'checked':''}>
NEW
</label>

<label>
<input
type="checkbox"
id="tw_only_unknown"
${CORE.cfg.onlyUnknown?'checked':''}>
ONLY NEW
</label>

<label>
<input
type="checkbox"
id="tw_auto_refresh"
${CORE.cfg.autoRefresh?'checked':''}>
AUTO
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
   PANEL CONTROL
========================================= */

CORE.openPanel=()=>{

    panel.style.display='flex';

    CORE.cfg.minimized=false;

    saveConfig();

};

CORE.closePanel=()=>{

    panel.style.display='none';

    CORE.cfg.minimized=true;

    saveConfig();

};

document
.querySelector('#tw_minimize')
.onclick=CORE.closePanel;

floatBtn.onclick=()=>{

    if(panel.style.display==='none'){

        CORE.openPanel();

    }else{

        CORE.closePanel();

    }

};

/* =========================================
   SAFE FETCH
========================================= */

async function safeFetch(
    url,
    retries=3
){

    for(let i=0;i<retries;i++){

        try{

            const r=
            await fetch(url);

            if(r.ok){

                return await r.text();

            }

        }catch(e){}

        await new Promise(r=>
            setTimeout(r,1000)
        );

    }

    throw new Error(
        'Fetch failed'
    );

}

/* =========================================
   AUTO REFRESH
========================================= */

CORE.startAutoRefresh=()=>{

    if(CORE.refreshTimer){

        clearInterval(
            CORE.refreshTimer
        );

    }

    if(
        !CORE.cfg.autoRefresh
    ){
        return;
    }

    CORE.refreshTimer=
    setInterval(async()=>{

        if(CORE.loading){
            return;
        }

        try{

            setStatus(
                'Auto refresh...'
            );

            await CORE.loadMap();

        }catch(e){

            console.error(e);

        }

    },
    CORE.cfg.refreshInterval*1000);

};

/* =========================================
   LOAD MAP
========================================= */

CORE.loadMap=async()=>{

    if(CORE.loading)return;

    CORE.loading=true;

    try{

        setStatus(
            'Loading players'
        );

        const playerTxt=
        await safeFetch(
            '/map/player.txt'
        );

        CORE.players={};

        playerTxt
        .trim()
        .split('\n')
        .forEach(line=>{

            if(!line)return;

            const p=
            line.split(',');

            CORE.players[p[0]]={

                id:p[0],
                name:p[1],
                ally:p[2],

                villages:
                safeNumber(p[3]),

                points:
                safeNumber(p[4])

            };

            /* HISTORY */

            if(
                !CORE.playerHistory[p[0]]
            ){

                CORE.playerHistory[p[0]]=[];

            }

            CORE.playerHistory[p[0]]
            .push({

                time:Date.now(),

                points:
                safeNumber(p[4])

            });

            if(
                CORE.playerHistory[p[0]]
                .length>30
            ){

                CORE.playerHistory[p[0]]
                .shift();

            }

        });

        saveHistory();

        /* MY ALLY */

        const me=
        CORE.players[
            game_data.player.id
        ];

        if(me){

            CORE.myAlly=me.ally;

        }

        /* =====================================
           ALLIES
        ===================================== */

        setStatus(
            'Loading allies'
        );

        const allyTxt=
        await safeFetch(
            '/map/ally.txt'
        );

        CORE.allies={};

        allyTxt
        .trim()
        .split('\n')
        .forEach(line=>{

            if(!line)return;

            const a=
            line.split(',');

            CORE.allies[a[0]]={

                tag:a[2]

            };

        });

        /* =====================================
           VILLAGES
        ===================================== */

        setStatus(
            'Loading villages'
        );

        const villageTxt=
        await safeFetch(
            '/map/village.txt'
        );

        const lines=
        villageTxt.split('\n');

        const c=
        currentCoord();

        const radius=
        safeNumber(
            document
            .querySelector('#tw_radius')
            .value
        );

        CORE.villages=[];

        let processed=0;

        for(const line of lines){

            processed++;

            if(
                processed%50000===0
            ){

                setStatus(
                    'Processing '+
                    processed
                );

                await new Promise(r=>
                    setTimeout(r,0)
                );

            }

            if(!line)continue;

            const v=
            line.split(',');

            const x=
            safeNumber(v[2]);

            const y=
            safeNumber(v[3]);

            const d=
            dist(
                c.x,
                c.y,
                x,
                y
            );

            if(d>radius)
            continue;

            CORE.villages.push({

                id:v[0],

                name:v[1],

                x,
                y,

                playerId:v[4],

                points:
                safeNumber(v[5]),

                distance:d

            });

        }

        renderTable();

        setStatus(
            'Loaded '+
            CORE.villages.length
        );

    }catch(e){

        console.error(e);

        setStatus(
            'Load error'
        );

    }

    CORE.loading=false;

};

/* =========================================
   IMPORT PLACE
========================================= */

CORE.importPlace=async()=>{

    try{

        setStatus(
            'Importing place'
        );

        const html=
        await safeFetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=place&mode=units'

        );

        const matches=
        [
            ...html.matchAll(
                /target=(\d+)/g
            )
        ];

        let imported=0;

        matches.forEach(m=>{

            const id=m[1];

            if(
                !CORE.knownBarbs[id]
            ){

                CORE.knownBarbs[id]=true;

                imported++;

            }

        });

        saveKnown();

        renderTable();

        setStatus(
            'Imported '+imported
        );

    }catch(e){

        console.error(e);

        setStatus(
            'Import error'
        );

    }

};

/* =========================================
   LIVE TRACKING
========================================= */

document.addEventListener(
'click',
e=>{

    const a=
    e.target.closest('a');

    if(!a)return;

    const href=
    a.href||'';

    if(
        href.includes('target=')
    ){

        const match=
        href.match(
            /target=(\d+)/
        );

        if(match){

            CORE.knownBarbs[
                match[1]
            ]=true;

            saveKnown();

            renderTable();

        }

    }

});

/* =========================================
   PLAYER ACTIVITY
========================================= */

function getPlayerActivity(
    playerId
){

    const h=
    CORE.playerHistory[playerId];

    if(!h || h.length<2){

        return{

            status:'UNKNOWN',
            diff:0

        };

    }

    const latest=
    h[h.length-1];

    const oldest=
    h[0];

    const diff=
    latest.points-oldest.points;

    return{

        status:
        diff===0
        ?'INACTIVE'
        :'ACTIVE',

        diff

    };

}

/* =========================================
   FILTER + SORT
========================================= */

function getData(){

    const search=
    document
    .querySelector('#tw_search')
    .value
    .toLowerCase();

    CORE.cfg.search=search;

    saveConfig();

    let data=
    CORE.villages.filter(v=>{

        const p=
        CORE.players[v.playerId];

        const isBarb=!p;

        const known=
        CORE.knownBarbs[v.id]
        ===true;

        /* FILTERS */

        if(
            isBarb &&
            !CORE.cfg.showBarbs
        ){
            return false;
        }

        if(
            !isBarb &&
            !CORE.cfg.showPlayers
        ){
            return false;
        }

        if(isBarb){

            if(
                !CORE.cfg.showKnown &&
                known
            ){
                return false;
            }

            if(
                !CORE.cfg.showUnknown &&
                !known
            ){
                return false;
            }

            if(
                CORE.cfg.onlyUnknown &&
                known
            ){
                return false;
            }

        }

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

    /* =====================================
       SORT
    ===================================== */

    const dir=
    CORE.cfg.sortDir==='asc'
    ?1
    :-1;

    data.sort((a,b)=>{

        const pa=
        CORE.players[a.playerId];

        const pb=
        CORE.players[b.playerId];

        switch(
            CORE.cfg.sortBy
        ){

            case 'distance':

                return(
                    a.distance-
                    b.distance
                )*dir;

            case 'points':

                return(
                    a.points-
                    b.points
                )*dir;

            case 'player':

                return(
                    (pa?.name||'')
                    .localeCompare(
                        pb?.name||''
                    )
                )*dir;

            case 'ally':

                return(
                    (
                        CORE.allies[
                            pa?.ally
                        ]?.tag||''
                    )
                    .localeCompare(
                        (
                            CORE.allies[
                                pb?.ally
                            ]?.tag||''
                        )
                    )
                )*dir;

            case 'status':

                return(
                    (
                        CORE.knownBarbs[a.id]
                        ?1
                        :0
                    )
                    -
                    (
                        CORE.knownBarbs[b.id]
                        ?1
                        :0
                    )
                )*dir;

        }

        return 0;

    });

    return data;

}

/* =========================================
   TABLE
========================================= */

function renderTable(){

    const data=
    getData();

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
        CORE.players[v.playerId];

        const isBarb=!p;

        const known=
        CORE.knownBarbs[v.id]
        ===true;

        let bg='#f8eed1';

        if(isBarb){

            bg=known
            ?'#e4d39a'
            :'#cfe6b8';

        }

        if(
            p &&
            p.ally===CORE.myAlly
        ){

            bg='#c9d8ff';

        }

        const relation=
        (
            p &&
            p.ally===CORE.myAlly
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
style="
color:#0044cc;
font-weight:bold;
">

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
${p?CORE.allies[p.ally]?.tag||'':''}
</td>

<td>
${relation}
</td>

<td>

${
act
?`
${act.status}<br>
Δ ${act.diff}
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
.onclick=CORE.loadMap;

document
.querySelector('#tw_import_place')
.onclick=CORE.importPlace;

document
.querySelector('#tw_search')
.oninput=renderTable;

document
.querySelector('#tw_sort')
.onchange=e=>{

    CORE.cfg.sortBy=
    e.target.value;

    saveConfig();

    renderTable();

};

document
.querySelector('#tw_sort_dir')
.onchange=e=>{

    CORE.cfg.sortDir=
    e.target.value;

    saveConfig();

    renderTable();

};

[
'tw_barbs',
'tw_players',
'tw_known',
'tw_unknown',
'tw_only_unknown',
'tw_auto_refresh'
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

            tw_only_unknown:'onlyUnknown',

            tw_auto_refresh:'autoRefresh'

        };

        CORE.cfg[
            map[id]
        ]=e.target.checked;

        saveConfig();

        if(
            id==='tw_auto_refresh'
        ){

            CORE.startAutoRefresh();

        }

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

    CORE.cfg.panelX=
    panel.offsetLeft;

    CORE.cfg.panelY=
    panel.offsetTop;

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

CORE.destroy=()=>{

    if(CORE.refreshTimer){

        clearInterval(
            CORE.refreshTimer
        );

    }

    panel.remove();

    floatBtn.remove();

    delete window.TWMPRO_CORE;

};

window.TWMPRO_DESTROY=
CORE.destroy;

/* =========================================
   INIT
========================================= */

CORE.startAutoRefresh();

CORE.loadMap();

setStatus('Ready');

})();
