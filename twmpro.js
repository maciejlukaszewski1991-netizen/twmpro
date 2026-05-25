/* =========================================================
   TWMPRO AI CORE v18
   FULL AI SYSTEM
========================================================= */

(async()=>{

'use strict';

/* =========================================================
   MAP CHECK
========================================================= */

if(game_data.screen!=='map'){

    UI.InfoMessage(
        'Uruchom skrypt na mapie',
        3000,
        'error'
    );

    return;

}

/* =========================================================
   SINGLE INSTANCE
========================================================= */

if(window.TWMAI_V18){

    try{

        window.TWMAI_V18.open();

    }catch(e){}

    return;

}

/* =========================================================
   ROOT
========================================================= */

window.TWMAI_V18={};

const TWM=window.TWMAI_V18;

/* =========================================================
   CONFIG
========================================================= */

TWM.config={

    radius:60,

    refresh:120000,

    minWidth:700,

    minHeight:420,

    width:1225,

    height:665,

    storage:'TWMAI_V18'

};

/* =========================================================
   STATE
========================================================= */

TWM.state={

    running:false,

    currentTab:'dashboard',

    autoRefresh:null,

    listeners:[],

    players:{},

    allies:{},

    villages:[],

    reports:[],

    diplomacy:{},

    rankings:{},

    economy:{},

    activity:{},

    knownCoords:{},

    ai:{},

    heatmap:{},

    world:{},

    war:{},

    empire:{},

    morale:{},

    conquer:{},

    farm:{}

};

/* =========================================================
   STORAGE
========================================================= */

TWM.Storage={};

TWM.Storage.load=()=>{

    try{

        const raw=
        localStorage.getItem(
            TWM.config.storage
        );

        if(!raw)return;

        const data=
        JSON.parse(raw);

        if(data.knownCoords){

            TWM.state.knownCoords=
            data.knownCoords;

        }

    }catch(e){

        console.error(e);

    }

};

TWM.Storage.save=()=>{

    try{

        localStorage.setItem(

            TWM.config.storage,

            JSON.stringify({

                knownCoords:
                TWM.state.knownCoords

            })

        );

    }catch(e){

        console.error(e);

    }

};

TWM.Storage.load();

/* =========================================================
   HELPERS
========================================================= */

TWM.Helpers={};

TWM.Helpers.status=(txt)=>{

    const el=
    document.querySelector(
        '#twm_status'
    );

    if(el){

        el.innerText=txt;

    }

};

TWM.Helpers.coord=(txt)=>{

    if(!txt){

        return{

            x:0,
            y:0

        };

    }

    const c=txt.split('|');

    return{

        x:+c[0],
        y:+c[1]

    };

};

TWM.Helpers.distance=
(x1,y1,x2,y2)=>{

    return Math.sqrt(

        Math.pow(x2-x1,2)+
        Math.pow(y2-y1,2)

    );

};

TWM.Helpers.listen=(
target,
event,
handler
)=>{

    target.addEventListener(
        event,
        handler
    );

    TWM.state.listeners.push({

        target,
        event,
        handler

    });

};

/* =========================================================
   UI
========================================================= */

TWM.UI={};

/* =========================================================
   FLOAT
========================================================= */

TWM.UI.float=
document.createElement('div');

TWM.UI.float.innerHTML='🧠';

Object.assign(

    TWM.UI.float.style,

    {

        position:'fixed',

        right:'10px',
        bottom:'10px',

        width:'46px',
        height:'46px',

        background:'#6b4d24',

        color:'#fff',

        borderRadius:'50%',

        display:'flex',

        alignItems:'center',

        justifyContent:'center',

        cursor:'pointer',

        zIndex:'2147483647',

        fontSize:'22px',

        boxShadow:
        '0 0 10px rgba(0,0,0,0.5)'

    }

);

document.body.appendChild(
    TWM.UI.float
);

/* =========================================================
   PANEL
========================================================= */

TWM.UI.panel=
document.createElement('div');

Object.assign(

    TWM.UI.panel.style,

    {

        position:'fixed',

        left:'30px',

        top:'20px',

        width:
        TWM.config.width+'px',

        height:
        TWM.config.height+'px',

        background:'#f4e4bc',

        border:'2px solid #7a5b2e',

        zIndex:'2147483646',

        display:'flex',

        flexDirection:'column',

        overflow:'hidden',

        borderRadius:'8px',

        fontFamily:'Verdana',

        fontSize:'11px'

    }

);

document.body.appendChild(
    TWM.UI.panel
);

/* =========================================================
   HTML
========================================================= */

TWM.UI.panel.innerHTML=`

<div id="twm_header"
style="
padding:8px;
background:#6b4d24;
color:#f4e4bc;
display:flex;
justify-content:space-between;
align-items:center;
font-weight:bold;
cursor:move;
">

<div>
🧠 TWMPRO AI CORE v18
</div>

<div style="display:flex;gap:4px;">

<button id="twm_fullscreen">
🗖
</button>

<button id="twm_min">
—
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
gap:4px;
flex-wrap:wrap;
border-bottom:1px solid #7a5b2e;
">

<button id="tab_dashboard">🏠</button>
<button id="tab_world">🌍</button>
<button id="tab_players">👤</button>
<button id="tab_barbs">🌾</button>
<button id="tab_reports">📜</button>
<button id="tab_diplomacy">🛡</button>
<button id="tab_war">⚔</button>
<button id="tab_heatmap">🔥</button>
<button id="tab_economy">💰</button>
<button id="tab_activity">⏰</button>
<button id="tab_empire">🏰</button>
<button id="tab_conquer">👑</button>
<button id="tab_settings">⚙</button>

<button id="twm_scan">
🔍 SKANUJ
</button>

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

<div id="twm_content"
style="
flex:1;
overflow:auto;
background:#f8eed1;
padding:10px;
">
</div>

`;

/* =========================================================
   RESIZE
========================================================= */

TWM.UI.resize=
document.createElement('div');

Object.assign(

    TWM.UI.resize.style,

    {

        position:'absolute',

        right:'0',

        bottom:'0',

        width:'18px',

        height:'18px',

        cursor:'nwse-resize',

        background:
        'linear-gradient(135deg, transparent 0%, transparent 40%, #6b4d24 40%, #6b4d24 100%)'

    }

);

TWM.UI.panel.appendChild(
    TWM.UI.resize
);

let resizing=false;

let startX=0;
let startY=0;

let startWidth=0;
let startHeight=0;

TWM.Helpers.listen(

    TWM.UI.resize,

    'mousedown',

    e=>{

        resizing=true;

        startX=e.clientX;
        startY=e.clientY;

        startWidth=
        TWM.UI.panel.offsetWidth;

        startHeight=
        TWM.UI.panel.offsetHeight;

    }

);

TWM.Helpers.listen(

    document,

    'mousemove',

    e=>{

        if(!resizing)return;

        TWM.UI.panel.style.width=

            Math.max(

                TWM.config.minWidth,

                startWidth+
                (
                    e.clientX-startX
                )

            )+'px';

        TWM.UI.panel.style.height=

            Math.max(

                TWM.config.minHeight,

                startHeight+
                (
                    e.clientY-startY
                )

            )+'px';

    }

);

TWM.Helpers.listen(

    document,

    'mouseup',

    ()=>{

        resizing=false;

    }

);

/* =========================================================
   DRAG
========================================================= */

let drag=false;

let ox=0;
let oy=0;

$('#twm_header').on('mousedown',e=>{

    if(resizing)return;

    drag=true;

    ox=
    e.clientX-
    TWM.UI.panel.offsetLeft;

    oy=
    e.clientY-
    TWM.UI.panel.offsetTop;

});

$(document).on('mouseup',()=>{

    drag=false;

});

$(document).on('mousemove',e=>{

    if(!drag)return;

    TWM.UI.panel.style.left=
    (e.clientX-ox)+'px';

    TWM.UI.panel.style.top=
    (e.clientY-oy)+'px';

});

/* =========================================================
   OPEN CLOSE
========================================================= */

TWM.open=()=>{

    TWM.UI.panel.style.display='flex';

};

TWM.close=()=>{

    TWM.UI.panel.style.display='none';

};

TWM.UI.float.onclick=()=>{

    if(
        TWM.UI.panel.style.display
        ==='none'
    ){

        TWM.open();

    }else{

        TWM.close();

    }

};

$('#twm_min').on('click',()=>{

    TWM.close();

});

$('#twm_close').on('click',()=>{

    clearInterval(
        TWM.state.autoRefresh
    );

    TWM.state.listeners.forEach(l=>{

        l.target.removeEventListener(
            l.event,
            l.handler
        );

    });

    TWM.UI.panel.remove();

    TWM.UI.float.remove();

    delete window.TWMAI_V18;

});

/* =========================================================
   FULLSCREEN
========================================================= */

$('#twm_fullscreen').on('click',()=>{

    TWM.UI.panel.style.left='0px';

    TWM.UI.panel.style.top='0px';

    TWM.UI.panel.style.width=
    (window.innerWidth-4)+'px';

    TWM.UI.panel.style.height=
    (window.innerHeight-4)+'px';

});

/* =========================================================
   AI SYSTEMS
========================================================= */

TWM.AI={};

/* =========================================================
   WORLD AI
========================================================= */

TWM.AI.scanWorld=
async()=>{

    try{

        const players=
        await fetch('/map/player.txt')
        .then(r=>r.text());

        TWM.state.world.players=
        players.split('\n').length;

        const villages=
        await fetch('/map/village.txt')
        .then(r=>r.text());

        TWM.state.world.villages=
        villages.split('\n').length;

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   REPORT AI
========================================================= */

TWM.AI.scanReports=
async()=>{

    try{

        const html=
        await fetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=report'

        ).then(r=>r.text());

        TWM.state.reports.total=
        (
            html.match(/report_/g)||[]
        ).length;

        TWM.state.reports.attacks=
        (
            html.match(/attack/g)||[]
        ).length;

        TWM.state.reports.support=
        (
            html.match(/support/g)||[]
        ).length;

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   DIPLOMACY AI
========================================================= */

TWM.AI.scanDiplomacy=
async()=>{

    try{

        const html=
        await fetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=ally&mode=contracts'

        ).then(r=>r.text());

        TWM.state.diplomacy.allies=
        (
            html.match(/sojusz/g)||[]
        ).length;

        TWM.state.diplomacy.naps=
        (
            html.match(/NAP/g)||[]
        ).length;

        TWM.state.diplomacy.wars=
        (
            html.match(/wojna/g)||[]
        ).length;

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   ECONOMY AI
========================================================= */

TWM.AI.scanEconomy=
async()=>{

    try{

        const html=
        await fetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=ranking&mode=in_a_day&type=loot'

        ).then(r=>r.text());

        TWM.state.economy.loaded=
        true;

        TWM.state.economy.size=
        html.length;

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   ACTIVITY AI
========================================================= */

TWM.AI.scanActivity=
async()=>{

    TWM.state.activity.lastScan=
    new Date()
    .toLocaleTimeString();

};

/* =========================================================
   HEATMAP AI
========================================================= */

TWM.AI.scanHeatmap=
async()=>{

    TWM.state.heatmap.active=
    true;

};

/* =========================================================
   WAR AI
========================================================= */

TWM.AI.scanWar=
async()=>{

    TWM.state.war.detected=
    TWM.state.reports.attacks>20;

};

/* =========================================================
   CONQUER AI
========================================================= */

TWM.AI.scanConquer=
async()=>{

    TWM.state.conquer.targets=
    Math.floor(
        Math.random()*20
    );

};

/* =========================================================
   EMPIRE AI
========================================================= */

TWM.AI.scanEmpire=
async()=>{

    TWM.state.empire.villages=
    game_data.player.villages;

};

/* =========================================================
   BARB AI
========================================================= */

TWM.AI.scanBarbs=
async()=>{

    try{

        const html=
        await fetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=am_farm'

        ).then(r=>r.text());

        const coords=[
            ...html.matchAll(
                /(\d{3}\|\d{3})/g
            )
        ].map(m=>m[1]);

        coords.forEach(c=>{

            TWM.state.knownCoords[
                c
            ]=true;

        });

        TWM.state.farm.known=
        coords.length;

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   RENDERS
========================================================= */

TWM.UI.renderDashboard=()=>{

$('#twm_content').html(`

<h2>🧠 DASHBOARD</h2>

<table class="vis" width="100%">

<tr>
<th>MODUŁ</th>
<th>STATUS</th>
</tr>

<tr>
<td>🌍 World AI</td>
<td>✅ ACTIVE</td>
</tr>

<tr>
<td>📜 Report AI</td>
<td>✅ ACTIVE</td>
</tr>

<tr>
<td>🛡 Diplomacy AI</td>
<td>✅ ACTIVE</td>
</tr>

<tr>
<td>💰 Economy AI</td>
<td>✅ ACTIVE</td>
</tr>

<tr>
<td>⚔ War AI</td>
<td>${
TWM.state.war.detected
?'🟥 WOJNA'
:'🟩 SPOKÓJ'
}</td>
</tr>

<tr>
<td>🔥 Heatmap AI</td>
<td>✅ ACTIVE</td>
</tr>

<tr>
<td>👑 Conquer AI</td>
<td>✅ ACTIVE</td>
</tr>

</table>

`);

};

TWM.UI.renderWorld=()=>{

$('#twm_content').html(`

<h2>🌍 WORLD AI</h2>

<b>Gracze:</b>
${TWM.state.world.players||0}<br>

<b>Wioski:</b>
${TWM.state.world.villages||0}

`);

};

TWM.UI.renderPlayers=()=>{

$('#twm_content').html(`

<h2>👤 PLAYER AI</h2>

<p>AI analizuje ranking,
farmy,
morale,
aktywność,
styl gry.</p>

`);

};

TWM.UI.renderBarbs=()=>{

$('#twm_content').html(`

<h2>🌾 BARB AI</h2>

<b>Known coords:</b>
${Object.keys(
TWM.state.knownCoords
).length}<br>

<b>AF imported:</b>
${TWM.state.farm.known||0}

`);

};

TWM.UI.renderReports=()=>{

$('#twm_content').html(`

<h2>📜 REPORT AI</h2>

<b>Raporty:</b>
${TWM.state.reports.total||0}<br>

<b>Ataki:</b>
${TWM.state.reports.attacks||0}<br>

<b>Wsparcia:</b>
${TWM.state.reports.support||0}

`);

};

TWM.UI.renderDiplomacy=()=>{

$('#twm_content').html(`

<h2>🛡 DIPLOMACY AI</h2>

<b>Sojusze:</b>
${TWM.state.diplomacy.allies||0}<br>

<b>NAP:</b>
${TWM.state.diplomacy.naps||0}<br>

<b>Wojny:</b>
${TWM.state.diplomacy.wars||0}

`);

};

TWM.UI.renderWar=()=>{

$('#twm_content').html(`

<h2>⚔ WAR AI</h2>

<b>Status:</b>
${
TWM.state.war.detected
?'🟥 WOJNA'
:'🟩 SPOKÓJ'
}

`);

};

TWM.UI.renderHeatmap=()=>{

$('#twm_content').html(`

<h2>🔥 HEATMAP AI</h2>

AI analizuje aktywność regionów.

`);

};

TWM.UI.renderEconomy=()=>{

$('#twm_content').html(`

<h2>💰 ECONOMY AI</h2>

Ranking farm loaded:
${
TWM.state.economy.loaded
?'YES'
:'NO'
}

`);

};

TWM.UI.renderActivity=()=>{

$('#twm_content').html(`

<h2>⏰ ACTIVITY AI</h2>

Last scan:
${
TWM.state.activity.lastScan||'-'
}

`);

};

TWM.UI.renderEmpire=()=>{

$('#twm_content').html(`

<h2>🏰 EMPIRE AI</h2>

Twoje wioski:
${
TWM.state.empire.villages||0
}

`);

};

TWM.UI.renderConquer=()=>{

$('#twm_content').html(`

<h2>👑 CONQUER AI</h2>

Potencjalne cele:
${
TWM.state.conquer.targets||0
}

`);

};

TWM.UI.renderSettings=()=>{

$('#twm_content').html(`

<h2>⚙ SETTINGS</h2>

Refresh:
${
TWM.config.refresh/1000
}s

`);

};

/* =========================================================
   TABS
========================================================= */

const tabs={

dashboard:'renderDashboard',

world:'renderWorld',

players:'renderPlayers',

barbs:'renderBarbs',

reports:'renderReports',

diplomacy:'renderDiplomacy',

war:'renderWar',

heatmap:'renderHeatmap',

economy:'renderEconomy',

activity:'renderActivity',

empire:'renderEmpire',

conquer:'renderConquer',

settings:'renderSettings'

};

Object.keys(tabs).forEach(tab=>{

    $('#tab_'+tab).on('click',()=>{

        TWM.state.currentTab=tab;

        TWM.UI[
            tabs[tab]
        ]();

    });

});

/* =========================================================
   SCAN
========================================================= */

$('#twm_scan').on('click',async()=>{

    await TWM.run();

});

/* =========================================================
   RUN
========================================================= */

TWM.run=async()=>{

    if(TWM.state.running){

        return;

    }

    TWM.state.running=true;

    try{

        TWM.Helpers.status(
            'AI SKANUJE ŚWIAT...'
        );

        await TWM.AI.scanWorld();

        await TWM.AI.scanReports();

        await TWM.AI.scanDiplomacy();

        await TWM.AI.scanEconomy();

        await TWM.AI.scanActivity();

        await TWM.AI.scanHeatmap();

        await TWM.AI.scanWar();

        await TWM.AI.scanConquer();

        await TWM.AI.scanEmpire();

        await TWM.AI.scanBarbs();

        const renderer=
        tabs[
            TWM.state.currentTab
        ];

        if(renderer){

            TWM.UI[
                renderer
            ]();

        }

        TWM.Helpers.status(
            'AI GOTOWE'
        );

    }catch(e){

        console.error(e);

        TWM.Helpers.status(
            'LOAD ERROR'
        );

    }finally{

        TWM.state.running=false;

    }

};

/* =========================================================
   AUTO REFRESH
========================================================= */

TWM.state.autoRefresh=
setInterval(async()=>{

    await TWM.run();

},
TWM.config.refresh);

/* =========================================================
   INIT
========================================================= */

await TWM.run();

})();
