(async()=>{

'use strict';

/* =========================================
   TWMPRO v17 STABLE MAP EDITION
========================================= */

/* =========================================
   ONLY MAP
========================================= */

if(
    game_data.screen!=='map'
){

    UI.InfoMessage(
        'TWMPRO działa tylko na mapie',
        5000,
        'error'
    );

    return;

}

/* =========================================
   SINGLE INSTANCE
========================================= */

if(window.TWMPRO){

    window.TWMPRO.open();

    return;

}

/* =========================================
   CORE
========================================= */

window.TWMPRO={};

const TWM=window.TWMPRO;

/* =========================================
   STORAGE
========================================= */

const CONFIG_KEY='TWMPRO_V17_CONFIG';
const KNOWN_KEY='TWMPRO_V17_KNOWN';

/* =========================================
   CONFIG
========================================= */

const defaults={

    radius:25,

    panelX:120,
    panelY:40,

    minimized:false,

    autoRefresh:true,

    showBarbs:true,
    showPlayers:true,

    showKnown:true,
    showUnknown:true,

    onlyUnknown:false,

    sort:'distance',
    dir:'asc'

};

TWM.cfg=loadConfig();

function loadConfig(){

    try{

        return{
            ...defaults,
            ...JSON.parse(
                localStorage.getItem(CONFIG_KEY)||'{}'
            )
        };

    }catch(e){

        return defaults;

    }

}

function saveConfig(){

    localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify(TWM.cfg)
    );

}

/* =========================================
   KNOWN BARBS
========================================= */

try{

    TWM.known=
    JSON.parse(
        localStorage.getItem(KNOWN_KEY)||'{}'
    );

}catch(e){

    TWM.known={};

}

function saveKnown(){

    localStorage.setItem(
        KNOWN_KEY,
        JSON.stringify(TWM.known)
    );

}

/* =========================================
   DATA
========================================= */

TWM.villages=[];
TWM.players={};
TWM.allies={};

TWM.loading=false;
TWM.timer=null;

/* =========================================
   HELPERS
========================================= */

function setStatus(txt){

    const el=
    document.querySelector('#twm_status');

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

function coord(){

    const c=
    game_data.village.coord
    .split('|');

    return{

        x:+c[0],
        y:+c[1]

    };

}

/* =========================================
   FLOAT BUTTON
========================================= */

const btn=
document.createElement('div');

btn.innerHTML='⚔';

btn.style.position='fixed';
btn.style.right='10px';
btn.style.bottom='10px';

btn.style.width='42px';
btn.style.height='42px';

btn.style.borderRadius='50%';

btn.style.background='#6b4d24';
btn.style.color='#fff';

btn.style.display='flex';
btn.style.alignItems='center';
btn.style.justifyContent='center';

btn.style.cursor='pointer';

btn.style.zIndex='999999';

btn.style.fontSize='20px';

btn.style.boxShadow='0 0 10px rgba(0,0,0,.5)';

document.body.appendChild(btn);

/* =========================================
   PANEL
========================================= */

const panel=
document.createElement('div');

panel.id='twm_panel';

panel.style.position='fixed';

panel.style.left=
TWM.cfg.panelX+'px';

panel.style.top=
TWM.cfg.panelY+'px';

panel.style.width='1150px';
panel.style.height='650px';

panel.style.background='#f4e4bc';

panel.style.border='2px solid #7a5b2e';

panel.style.zIndex='999998';

panel.style.display=
TWM.cfg.minimized
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

<div id="twm_header"
style="
padding:8px;
background:#6b4d24;
color:#f4e4bc;
font-weight:bold;
display:flex;
justify-content:space-between;
align-items:center;
cursor:move;
">

<div>
TWMPRO v17
</div>

<div>

<button id="twm_min">
_
</button>

<button id="twm_close">
X
</button>

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
id="twm_radius"
type="number"
value="${TWM.cfg.radius}"
style="width:50px">

<button id="twm_scan">
SCAN
</button>

<button id="twm_import">
IMPORT PLACE
</button>

<input
id="twm_search"
placeholder="search"
style="width:140px">

<select id="twm_sort">

<option value="distance">
DIST
</option>

<option value="points">
POINTS
</option>

<option value="player">
PLAYER
</option>

<option value="status">
STATUS
</option>

</select>

<select id="twm_dir">

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
id="twm_barbs"
${TWM.cfg.showBarbs?'checked':''}>
BARB
</label>

<label>
<input
type="checkbox"
id="twm_players"
${TWM.cfg.showPlayers?'checked':''}>
PLAYERS
</label>

<label>
<input
type="checkbox"
id="twm_known"
${TWM.cfg.showKnown?'checked':''}>
KNOWN
</label>

<label>
<input
type="checkbox"
id="twm_unknown"
${TWM.cfg.showUnknown?'checked':''}>
NEW
</label>

<label>
<input
type="checkbox"
id="twm_only_unknown"
${TWM.cfg.onlyUnknown?'checked':''}>
ONLY NEW
</label>

<label>
<input
type="checkbox"
id="twm_refresh"
${TWM.cfg.autoRefresh?'checked':''}>
AUTO
</label>

</div>

<div id="twm_status"
style="
padding:5px;
background:#f8eed1;
border-bottom:1px solid #c4a46a;
font-weight:bold;
">

READY

</div>

<div id="twm_table"
style="
flex:1;
overflow:auto;
background:#f8eed1;
">
</div>

`;

document.body.appendChild(panel);

/* =========================================
   OPEN / CLOSE
========================================= */

TWM.open=()=>{

    panel.style.display='flex';

    TWM.cfg.minimized=false;

    saveConfig();

};

TWM.close=()=>{

    panel.style.display='none';

    TWM.cfg.minimized=true;

    saveConfig();

};

btn.onclick=()=>{

    if(
        panel.style.display==='none'
    ){

        TWM.open();

    }else{

        TWM.close();

    }

};

document
.querySelector('#twm_min')
.onclick=TWM.close;

/* =========================================
   LOAD MAP
========================================= */

TWM.load=async()=>{

    if(TWM.loading)return;

    TWM.loading=true;

    try{

        setStatus('Loading...');

        /* PLAYERS */

        const playerTxt=
        await fetch('/map/player.txt')
        .then(r=>r.text());

        TWM.players={};

        playerTxt
        .trim()
        .split('\n')
        .forEach(line=>{

            if(!line)return;

            const p=
            line.split(',');

            TWM.players[p[0]]={

                id:p[0],
                name:p[1],
                ally:p[2],
                points:+p[4]

            };

        });

        /* ALLIES */

        const allyTxt=
        await fetch('/map/ally.txt')
        .then(r=>r.text());

        TWM.allies={};

        allyTxt
        .trim()
        .split('\n')
        .forEach(line=>{

            if(!line)return;

            const a=
            line.split(',');

            TWM.allies[a[0]]={

                tag:a[2]

            };

        });

        /* VILLAGES */

        const villageTxt=
        await fetch('/map/village.txt')
        .then(r=>r.text());

        const lines=
        villageTxt.split('\n');

        const c=
        coord();

        const radius=
        +document
        .querySelector('#twm_radius')
        .value;

        TWM.villages=[];

        for(const line of lines){

            if(!line)continue;

            const v=
            line.split(',');

            const x=+v[2];
            const y=+v[3];

            const d=
            dist(
                c.x,
                c.y,
                x,
                y
            );

            if(d>radius)
            continue;

            TWM.villages.push({

                id:v[0],

                name:v[1],

                x,
                y,

                playerId:v[4],

                points:+v[5],

                distance:d

            });

        }

        render();

        setStatus(
            'Loaded '+TWM.villages.length
        );

    }catch(e){

        console.error(e);

        setStatus(
            'Load error'
        );

    }

    TWM.loading=false;

};

/* =========================================
   IMPORT PLACE
========================================= */

TWM.importPlace=async()=>{

    try{

        setStatus(
            'Importing place...'
        );

        const html=
        await fetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=place&mode=units'

        ).then(r=>r.text());

        const parser=
        new DOMParser();

        const doc=
        parser.parseFromString(
            html,
            'text/html'
        );

        const links=
        [...doc.querySelectorAll('a')];

        let imported=0;

        links.forEach(a=>{

            const href=
            a.href||'';

            if(
                href.includes('target=')
            ){

                const m=
                href.match(
                    /target=(\d+)/
                );

                if(m){

                    const id=m[1];

                    if(
                        !TWM.known[id]
                    ){

                        TWM.known[id]=true;

                        imported++;

                    }

                }

            }

        });

        saveKnown();

        render();

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

        const m=
        href.match(
            /target=(\d+)/
        );

        if(m){

            TWM.known[
                m[1]
            ]=true;

            saveKnown();

        }

    }

});

/* =========================================
   FILTER + SORT
========================================= */

function getData(){

    const search=
    document
    .querySelector('#twm_search')
    .value
    .toLowerCase();

    let data=
    TWM.villages.filter(v=>{

        const p=
        TWM.players[v.playerId];

        const isBarb=!p;

        const known=
        TWM.known[v.id]
        ===true;

        if(
            isBarb &&
            !TWM.cfg.showBarbs
        ){
            return false;
        }

        if(
            !isBarb &&
            !TWM.cfg.showPlayers
        ){
            return false;
        }

        if(isBarb){

            if(
                !TWM.cfg.showKnown &&
                known
            ){
                return false;
            }

            if(
                !TWM.cfg.showUnknown &&
                !known
            ){
                return false;
            }

            if(
                TWM.cfg.onlyUnknown &&
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

    /* SORT */

    const dir=
    TWM.cfg.dir==='asc'
    ?1
    :-1;

    data.sort((a,b)=>{

        const pa=
        TWM.players[a.playerId];

        const pb=
        TWM.players[b.playerId];

        switch(
            TWM.cfg.sort
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

            case 'status':

                return(
                    (
                        TWM.known[a.id]
                        ?1
                        :0
                    )
                    -
                    (
                        TWM.known[b.id]
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
   RENDER
========================================= */

function render(){

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
">

<th>PLAYER</th>
<th>COORD</th>
<th>ATTACK</th>
<th>DIST</th>
<th>PTS</th>
<th>STATUS</th>

</tr>
`;

    data.forEach(v=>{

        const p=
        TWM.players[v.playerId];

        const isBarb=!p;

        const known=
        TWM.known[v.id]
        ===true;

        let bg='#f8eed1';

        if(isBarb){

            bg=known
            ?'#e4d39a'
            :'#cfe6b8';

        }

        html+=`

<tr style="
background:${bg};
border-bottom:1px solid #c4a46a;
">

<td>
${p?p.name:'BARB'}
</td>

<td>

<a
href="/game.php?village=${game_data.village.id}&screen=map#${v.x};${v.y}"
target="_blank">

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
    .querySelector('#twm_table')
    .innerHTML=html;

}

/* =========================================
   AUTO REFRESH
========================================= */

function startRefresh(){

    if(TWM.timer){

        clearInterval(
            TWM.timer
        );

    }

    if(
        !TWM.cfg.autoRefresh
    ){
        return;
    }

    TWM.timer=
    setInterval(()=>{

        if(
            panel.style.display==='none'
        ){
            return;
        }

        TWM.load();

    },
    120000);

}

/* =========================================
   EVENTS
========================================= */

document
.querySelector('#twm_scan')
.onclick=TWM.load;

document
.querySelector('#twm_import')
.onclick=TWM.importPlace;

document
.querySelector('#twm_search')
.oninput=render;

document
.querySelector('#twm_sort')
.onchange=e=>{

    TWM.cfg.sort=
    e.target.value;

    saveConfig();

    render();

};

document
.querySelector('#twm_dir')
.onchange=e=>{

    TWM.cfg.dir=
    e.target.value;

    saveConfig();

    render();

};

[
'twm_barbs',
'twm_players',
'twm_known',
'twm_unknown',
'twm_only_unknown',
'twm_refresh'
]
.forEach(id=>{

    document
    .querySelector('#'+id)
    .onchange=e=>{

        const map={

            twm_barbs:'showBarbs',
            twm_players:'showPlayers',

            twm_known:'showKnown',
            twm_unknown:'showUnknown',

            twm_only_unknown:'onlyUnknown',

            twm_refresh:'autoRefresh'

        };

        TWM.cfg[
            map[id]
        ]=e.target.checked;

        saveConfig();

        startRefresh();

        render();

    };

});

/* =========================================
   DRAG
========================================= */

let drag=false;

let ox=0;
let oy=0;

document
.querySelector('#twm_header')
.onmousedown=e=>{

    drag=true;

    ox=
    e.clientX-panel.offsetLeft;

    oy=
    e.clientY-panel.offsetTop;

};

document.onmouseup=()=>{

    drag=false;

};

document.onmousemove=e=>{

    if(!drag)return;

    panel.style.left=
    e.clientX-ox+'px';

    panel.style.top=
    e.clientY-oy+'px';

};

/* =========================================
   DESTROY
========================================= */

document
.querySelector('#twm_close')
.onclick=()=>{

    if(TWM.timer){

        clearInterval(
            TWM.timer
        );

    }

    panel.remove();

    btn.remove();

    delete window.TWMPRO;

};

/* =========================================
   INIT
========================================= */

startRefresh();

TWM.load();

setStatus('Ready');

})();
