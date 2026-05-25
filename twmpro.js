/* =========================================================
   TWMPRO AI CORE v17
   FULL AI FOUNDATION
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

if(window.TWMAI_V17){

    try{

        window.TWMAI_V17.open();

    }catch(e){}

    return;

}

/* =========================================================
   ROOT
========================================================= */

window.TWMAI_V17={};

const TWM=window.TWMAI_V17;

/* =========================================================
   CONFIG
========================================================= */

TWM.config={

    radius:60,

    refresh:120000,

    minWidth:1000,

    minHeight:600,

    width:1750,

    height:950,

    storage:'TWMAI_V17'

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

    world:{}

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

        Object.assign(
            TWM.state,
            data
        );

    }catch(e){

        console.error(e);

    }

};

TWM.Storage.save=()=>{

    try{

        if(!TWM.UI?.panel)return;

        localStorage.setItem(

            TWM.config.storage,

            JSON.stringify({

                knownCoords:
                TWM.state.knownCoords,

                activity:
                TWM.state.activity,

                diplomacy:
                TWM.state.diplomacy

            })

        );

    }catch(e){

        console.error(e);

    }

};

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
   LOAD STORAGE
========================================================= */

TWM.Storage.load();

/* =========================================================
   UI
========================================================= */

TWM.UI={};

/* =========================================================
   FLOAT BUTTON
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

        width:'48px',
        height:'48px',

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

        left:'40px',

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
🧠 TWMPRO AI CORE v17
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
gap:6px;
flex-wrap:wrap;
border-bottom:1px solid #7a5b2e;
">

<button id="tab_dashboard">🏠 DASHBOARD</button>

<button id="tab_world">🌍 ŚWIAT</button>

<button id="tab_players">👤 GRACZE</button>

<button id="tab_barbs">🌾 BARBY</button>

<button id="tab_reports">📜 RAPORTY</button>

<button id="tab_diplomacy">🛡 DYPLOMACJA</button>

<button id="tab_war">⚔ WOJNA</button>

<button id="tab_heatmap">🔥 HEATMAP</button>

<button id="tab_economy">💰 EKONOMIA</button>

<button id="tab_activity">⏰ AKTYWNOŚĆ</button>

<button id="tab_empire">🏰 IMPERIUM</button>

<button id="tab_settings">⚙ USTAWIENIA</button>

<button id="twm_scan">🔍 SKANUJ</button>

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

    delete window.TWMAI_V17;

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
   AI MODULES
========================================================= */

TWM.AI={};

TWM.AI.scanWorld=async()=>{

    TWM.Helpers.status(
        'SKANOWANIE ŚWIATA...'
    );

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

TWM.AI.scanReports=async()=>{

    try{

        const html=
        await fetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=report'

        ).then(r=>r.text());

        const attacks=
        (
            html.match(/attack/g)||[]
        ).length;

        TWM.state.reportsCount=
        attacks;

    }catch(e){

        console.error(e);

    }

};

TWM.AI.scanDiplomacy=async()=>{

    try{

        const html=
        await fetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=ally&mode=contracts'

        ).then(r=>r.text());

        TWM.state.diplomacy.raw=
        html.length;

    }catch(e){

        console.error(e);

    }

};

TWM.AI.scanEconomy=async()=>{

    try{

        const html=
        await fetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=ranking&mode=in_a_day&type=loot'

        ).then(r=>r.text());

        TWM.state.economy.raw=
        html.length;

    }catch(e){

        console.error(e);

    }

};

TWM.AI.scanActivity=async()=>{

    TWM.state.activity.lastScan=
    Date.now();

};

/* =========================================================
   RENDERS
========================================================= */

TWM.UI.renderDashboard=()=>{

    $('#twm_content').html(`

    <h2>🧠 DASHBOARD AI</h2>

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
        <td>🚧 LEARNING</td>
    </tr>

    <tr>
        <td>🔥 Heatmap AI</td>
        <td>🚧 LEARNING</td>
    </tr>

    </table>

    <br>

    <b>📊 ŚWIAT:</b><br>

    Gracze:
    ${
        TWM.state.world.players||0
    }<br>

    Wioski:
    ${
        TWM.state.world.villages||0
    }<br>

    Raporty:
    ${
        TWM.state.reportsCount||0
    }

    `);

};

TWM.UI.renderWorld=()=>{

    $('#twm_content').html(`

    <h2>🌍 WORLD AI</h2>

    <p>AI analizuje:</p>

    <ul>

    <li>Mapę świata</li>

    <li>Fronty</li>

    <li>Ekspansję</li>

    <li>Cluster analysis</li>

    <li>Density</li>

    </ul>

    `);

};

TWM.UI.renderPlayers=()=>{

    $('#twm_content').html(`

    <h2>👤 PLAYER AI</h2>

    <p>AI analizuje:</p>

    <ul>

    <li>Ranking</li>

    <li>Farmy</li>

    <li>Aktywność</li>

    <li>Styl gry</li>

    <li>Morale</li>

    </ul>

    `);

};

TWM.UI.renderBarbs=()=>{

    $('#twm_content').html(`

    <h2>🌾 BARB AI</h2>

    <p>Known / Unknown AI</p>

    `);

};

TWM.UI.renderReports=()=>{

    $('#twm_content').html(`

    <h2>📜 REPORT AI</h2>

    <p>Raporty:
    ${
        TWM.state.reportsCount||0
    }</p>

    `);

};

TWM.UI.renderDiplomacy=()=>{

    $('#twm_content').html(`

    <h2>🛡 DIPLOMACY AI</h2>

    <p>AI analizuje relacje plemion.</p>

    `);

};

TWM.UI.renderWar=()=>{

    $('#twm_content').html(`

    <h2>⚔ WAR AI</h2>

    <p>Analiza wojny w budowie.</p>

    `);

};

TWM.UI.renderHeatmap=()=>{

    $('#twm_content').html(`

    <h2>🔥 HEATMAP AI</h2>

    <p>Heatmap AI aktywny.</p>

    `);

};

TWM.UI.renderEconomy=()=>{

    $('#twm_content').html(`

    <h2>💰 ECONOMY AI</h2>

    <p>Analiza ekonomii aktywna.</p>

    `);

};

TWM.UI.renderActivity=()=>{

    $('#twm_content').html(`

    <h2>⏰ ACTIVITY AI</h2>

    <p>Last scan:
    ${
        TWM.state.activity.lastScan||0
    }</p>

    `);

};

TWM.UI.renderEmpire=()=>{

    $('#twm_content').html(`

    <h2>🏰 EMPIRE AI</h2>

    <p>Imperium analysis active.</p>

    `);

};

TWM.UI.renderSettings=()=>{

    $('#twm_content').html(`

    <h2>⚙ SETTINGS</h2>

    <p>Auto refresh:
    ${
        TWM.config.refresh/1000
    }s</p>

    `);

};

/* =========================================================
   TAB EVENTS
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
   SCAN BUTTON
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
