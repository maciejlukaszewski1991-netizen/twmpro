javascript:(async()=>{

'use strict';

/* =========================================================
   TWMPRO AI OVERMIND
   FULL STABLE BUILD
   v60.1 FINAL
========================================================= */

if(window.TWMPRO_AI){

    alert('TWMPRO already loaded');

    return;

}

window.TWMPRO_AI={};

const TWM=window.TWMPRO_AI;

/* =========================================================
   CONFIG
========================================================= */

TWM.config={

    version:'v60.1',

    refresh:120000,

    scanRadius:45,

    requestDelay:250,

    maxRows:300,

    storagePrefix:'TWMPRO_V60'

};

/* =========================================================
   STATE
========================================================= */

TWM.state={

    running:false,

    currentTab:'war',

    villages:{},

    players:{},

    reports:{},

    reportIntel:{},

    reportHistory:{},

    recommendations:[],

    alerts:[],

    logs:[],

    war:{

        attacks:[],
        supports:[],
        trains:[],
        eta:[],
        vectors:[],
        vectorPressure:{}

    }

};

/* =========================================================
   STORAGE
========================================================= */

TWM.Storage={};

TWM.Storage.key=
(k)=>{

    return (

        TWM.config.storagePrefix+

        '_'+k

    );

};

TWM.Storage.save=
(k,v)=>{

    localStorage.setItem(

        TWM.Storage.key(k),

        JSON.stringify(v)

    );

};

TWM.Storage.load=
(k,d=null)=>{

    try{

        const x=

        localStorage.getItem(

            TWM.Storage.key(k)

        );

        if(!x)return d;

        return JSON.parse(x);

    }catch(e){

        return d;

    }

};

/* =========================================================
   HELPERS
========================================================= */

TWM.Helpers={};

TWM.Helpers.sleep=
(ms)=>new Promise(r=>setTimeout(r,ms));

TWM.Helpers.coord=
(c)=>{

    if(!c){

        return{

            x:0,
            y:0

        };

    }

    const p=c.split('|');

    return{

        x:+p[0],

        y:+p[1]

    };

};

TWM.Helpers.distance=
(x1,y1,x2,y2)=>{

    return Math.sqrt(

        Math.pow(x2-x1,2)+
        Math.pow(y2-y1,2)

    );

};

/* =========================================================
   DEBUG
========================================================= */

TWM.Debug={};

TWM.Debug.logs=[];

TWM.Debug.maxLogs=250;

TWM.Debug.log=
(type,module,message,data=null)=>{

    const entry={

        time:
        new Date()
        .toLocaleTimeString(),

        type,

        module,

        message,

        data

    };

    TWM.Debug.logs.push(
        entry
    );

    if(

        TWM.Debug.logs.length>

        TWM.Debug.maxLogs

    ){

        TWM.Debug.logs=

        TWM.Debug.logs.slice(

            -TWM.Debug.maxLogs

        );

    }

    console.log(

        '[TWMPRO]',
        type,
        module,
        message,
        data

    );

};

window.addEventListener(
    'error',
    function(e){

        TWM.Debug.log(

            'ERROR',

            'GLOBAL',

            e.message,

            {

                file:e.filename,

                line:e.lineno,

                stack:e.error?.stack

            }

        );

    }

);

window.addEventListener(
    'unhandledrejection',
    function(e){

        TWM.Debug.log(

            'PROMISE',

            'ASYNC',

            e.reason?.message||

            'Unhandled Promise',

            {

                stack:e.reason?.stack

            }

        );

    }

);

TWM.Debug.export=
()=>{

    return JSON.stringify({

        version:
        TWM.config.version,

        world:
        game_data.world,

        player:
        game_data.player.name,

        village:
        game_data.village.coord,

        logs:
        TWM.Debug.logs,

        stats:{

            villages:

            Object.keys(
                TWM.state.villages
            ).length,

            players:

            Object.keys(
                TWM.state.players
            ).length,

            attacks:

            TWM.state.war
            .attacks.length,

            trains:

            TWM.state.war
            .trains.length

        }

    },null,2);

};

TWM.Debug.copy=
async()=>{

    await navigator
    .clipboard
    .writeText(

        TWM.Debug.export()

    );

    UI.SuccessMessage(

        'TWMPRO debug copied'

    );

};

/* =========================================================
   REQUEST
========================================================= */

TWM.Request={};

TWM.Request.fetch=
async(url,retry=0)=>{

    const start=
    performance.now();

    try{

        await TWM.Helpers.sleep(

            TWM.config.requestDelay

        );

        const r=
        await fetch(url,{

            credentials:'same-origin'

        });

        if(!r.ok){

            throw new Error(

                'HTTP '+r.status

            );

        }

        const txt=
        await r.text();

        const end=
        performance.now();

        TWM.Debug.log(

            'REQUEST_OK',

            'REQUEST',

            url,

            {

                ms:
                Math.floor(
                    end-start
                )

            }

        );

        return txt;

    }catch(e){

        const end=
        performance.now();

        TWM.Debug.log(

            'REQUEST_FAIL',

            'REQUEST',

            e.message,

            {

                url,

                retry,

                ms:
                Math.floor(
                    end-start
                )

            }

        );

        if(retry<3){

            return await TWM.Request.fetch(

                url,

                retry+1

            );

        }

        return '';

    }

};

/* =========================================================
   UI
========================================================= */

$('#twm_panel').remove();

$('body').append(`

<div id="twm_panel"
style="
position:fixed;
top:20px;
left:20px;
width:1100px;
height:720px;
background:#f4e4bc;
border:2px solid #5c3b12;
z-index:999999;
font-size:11px;
display:flex;
flex-direction:column;
resize:both;
overflow:hidden;
">

<div style="
background:#5c3b12;
color:white;
padding:6px;
font-weight:bold;
display:flex;
justify-content:space-between;
">

<div>
🧠 TWMPRO AI OVERMIND v60.1
</div>

<div>

<button id="twm_reload">
SCAN
</button>

<button id="twm_debug_export">
🐞 DEBUG
</button>

<button id="twm_close">
X
</button>

</div>

</div>

<div style="
padding:4px;
display:flex;
gap:4px;
flex-wrap:wrap;
background:#d9c08b;
">

<button data-tab="war">
⚔ WAR
</button>

<button data-tab="livewar">
👑 LIVE
</button>

<button data-tab="players">
👤 PLAYERS
</button>

<button data-tab="targets">
🎯 TARGETS
</button>

<button data-tab="alerts">
🚨 ALERTS
</button>

</div>

<div id="twm_content"
style="
flex:1;
overflow:auto;
padding:6px;
background:#f8eed1;
">

</div>

</div>

`);

/* =========================================================
   CLOSE
========================================================= */

$('#twm_close').on(
    'click',
    ()=>{

        clearInterval(
            TWM.state.interval
        );

        $('#twm_panel').remove();

        delete window.TWMPRO_AI;

    }

);

/* =========================================================
   DEBUG BUTTON
========================================================= */

$('#twm_debug_export').on(
    'click',
    async()=>{

        await TWM.Debug.copy();

    }

);

/* =========================================================
   CENTER
========================================================= */

TWM.state.center=
TWM.Helpers.coord(
    game_data.village.coord
);

/* =========================================================
   MODULES
========================================================= */

TWM.Modules={};

/* =========================================================
   PLAYERS
========================================================= */

TWM.Modules.Players={};

TWM.Modules.Players.scan=
async()=>{

    const txt=
    await TWM.Request.fetch(
        '/map/player.txt'
    );

    if(!txt)return;

    TWM.state.players={};

    txt.trim()
    .split('\n')
    .forEach(line=>{

        if(!line)return;

        const p=
        line.split(',');

        if(p.length<5)return;

        TWM.state.players[
            p[0]
        ]={

            id:p[0],

            name:p[1]||'Unknown',

            ally:p[2]||'0',

            villages:
            parseInt(p[3])||0,

            points:
            parseInt(p[4])||0,

            relation:'neutral',

            behavior:'UNKNOWN',

            loot:0

        };

    });

};

/* =========================================================
   VILLAGES
========================================================= */

TWM.Modules.Villages={};

TWM.Modules.Villages.scan=
async()=>{

    const txt=
    await TWM.Request.fetch(
        '/map/village.txt'
    );

    if(!txt)return;

    TWM.state.villages={};

    txt.trim()
    .split('\n')
    .forEach(line=>{

        if(!line)return;

        const v=
        line.split(',');

        if(v.length<6)return;

        const x=
        parseInt(v[2]);

        const y=
        parseInt(v[3]);

        if(
            isNaN(x)||
            isNaN(y)
        ){

            return;

        }

        const dist=

        TWM.Helpers.distance(

            TWM.state.center.x,
            TWM.state.center.y,

            x,
            y

        );

        if(
            dist>
            TWM.config.scanRadius
        ){

            return;

        }

        TWM.state.villages[
            v[0]
        ]={

            id:v[0],

            coord:
            x+'|'+y,

            x,
            y,

            playerId:
            v[4]||'0',

            points:
            parseInt(v[5])||0,

            distance:dist,

            morale:100,

            targetScore:0,

            finalScore:0,

            frontline:false,

            known:false,

            stack:false,

            offHub:false,

            deadVillage:false

        };

    });

};

/* =========================================================
   LINK
========================================================= */

TWM.Modules.Link={};

TWM.Modules.Link.run=
()=>{

    const me=
    game_data.player.name;

    Object.values(
        TWM.state.villages
    ).forEach(v=>{

        const p=
        TWM.state.players[
            v.playerId
        ];

        if(!p)return;

        v.owner=p;

        if(
            p.name===me
        ){

            p.relation='own';

        }

    });

};

/* =========================================================
   BEHAVIOR
========================================================= */

TWM.Modules.Behavior={};

TWM.Modules.Behavior.run=
()=>{

    Object.values(
        TWM.state.players
    ).forEach(p=>{

        if(
            p.points<5000 &&
            p.villages<3
        ){

            p.behavior='DEAD';

        }

        else{

            p.behavior='ACTIVE';

        }

    });

};

/* =========================================================
   REPORTS
========================================================= */

TWM.Modules.ReportEngine={};

TWM.Modules.ReportEngine.scan=
async()=>{

    const html=
    await TWM.Request.fetch(

        '/game.php?village='+
        game_data.village.id+
        '&screen=report'

    );

    if(!html)return;

    const doc=
    new DOMParser()
    .parseFromString(
        html,
        'text/html'
    );

    TWM.state.reportIntel={};

    const rows=
    doc.querySelectorAll('tr');

    rows.forEach(row=>{

        const txt=
        row.innerText||'';

        const coord=
        txt.match(
            /\d+\|\d+/
        )?.[0];

        if(!coord)return;

        if(
            TWM.state
            .reportIntel[
                coord
            ]
        ){

            return;

        }

        TWM.state.reportIntel[
            coord
        ]={

            coord,

            attack:
            txt.includes('Atak'),

            support:
            txt.includes('Wsparcie'),

            noble:
            txt.includes('Szlachcic'),

            raw:txt,

            lastSeen:
            Date.now()

        };

    });

};

/* =========================================================
   LIVE WAR
========================================================= */

TWM.Modules.LiveWar={};

TWM.Modules.LiveWar.scan=
async()=>{

    const html=
    await TWM.Request.fetch(

        '/game.php?screen=overview'

    );

    if(!html)return;

    const doc=
    new DOMParser()
    .parseFromString(
        html,
        'text/html'
    );

    TWM.state.war.attacks=[];

    const rows=
    doc.querySelectorAll('tr');

    rows.forEach(row=>{

        const txt=
        row.innerText||'';

        const coord=
        txt.match(
            /\d+\|\d+/
        )?.[0];

        if(!coord)return;

        const time=
        txt.match(
            /(\d{2}):(\d{2}):(\d{2})/
        );

        let arrival=0;

        if(time){

            const d=
            new Date();

            d.setHours(+time[1]);
            d.setMinutes(+time[2]);
            d.setSeconds(+time[3]);

            arrival=d.getTime();

        }

        const hash=

            coord+
            '_'+
            arrival+
            '_'+
            txt.length;

        if(

            TWM.state.war.attacks
            .find(x=>

                x.hash===hash

            )

        ){

            return;

        }

        TWM.state.war.attacks
        .push({

            hash,

            coord,

            arrival,

            noble:
            txt.includes('Szlachcic'),

            ram:
            txt.includes('Taran'),

            catapult:
            txt.includes('Katapulta'),

            support:
            txt.includes('Wsparcie'),

            raw:txt

        });

    });

};

/* =========================================================
   TRAINS
========================================================= */

TWM.Modules.Trains={};

TWM.Modules.Trains.run=
()=>{

    TWM.state.war.trains=[];

    const grouped={};

    TWM.state.war.attacks
    .forEach(a=>{

        if(!a.arrival)return;

        const key=

            a.coord+
            '_'+
            Math.floor(
                a.arrival/3000
            );

        if(!grouped[key]){

            grouped[key]=[];

        }

        grouped[key]
        .push(a);

    });

    Object.values(grouped)
    .forEach(g=>{

        if(g.length<4)return;

        const train={

            coord:
            g[0].coord,

            size:g.length,

            arrival:
            g[0].arrival,

            noble:false,

            heavy:false,

            fake:false,

            priority:0

        };

        g.forEach(a=>{

            if(a.noble){

                train.noble=true;

            }

            if(
                a.ram||
                a.catapult
            ){

                train.heavy=true;

            }

        });

        train.priority+=
        train.size*10;

        if(train.noble){

            train.priority+=150;

        }

        if(train.heavy){

            train.priority+=80;

        }

        if(
            !train.noble &&
            train.size>20
        ){

            train.fake=true;

        }

        TWM.state.war
        .trains
        .push(train);

    });

};

/* =========================================================
   SCORE
========================================================= */

TWM.Modules.Score={};

TWM.Modules.Score.run=
()=>{

    Object.values(
        TWM.state.villages
    ).forEach(v=>{

        let s=0;

        if(

            v.owner?.behavior
            ==='DEAD'

        ){

            s+=120;

        }

        s+=
        Math.max(
            0,
            100-v.morale
        );

        s-=
        Math.floor(
            v.distance||0
        );

        if(v.frontline){

            s+=50;

        }

        if(v.deadVillage){

            s+=100;

        }

        if(v.stack){

            s-=120;

        }

        v.finalScore=
        Math.floor(s);

    });

};

/* =========================================================
   STRATEGIST
========================================================= */

TWM.Modules.Strategist={};

TWM.Modules.Strategist.run=
()=>{

    TWM.state.recommendations=

    Object.values(
        TWM.state.villages
    )

    .sort((a,b)=>

        (b.finalScore||0)-

        (a.finalScore||0)

    )

    .slice(0,20);

};

/* =========================================================
   UI
========================================================= */

TWM.UI={};

TWM.UI.safe=
(html)=>{

    $('#twm_content')
    .html(html||'');

};

/* =========================================================
   WAR TAB
========================================================= */

TWM.UI.renderWar=
()=>{

    const rows=

    Object.values(
        TWM.state.villages
    )

    .sort((a,b)=>

        (b.finalScore||0)-

        (a.finalScore||0)

    )

    .slice(
        0,
        TWM.config.maxRows
    );

    let html=`

    <h2>
    ⚔ WAR AI
    </h2>

    <table class="vis" width="100%">

    <tr>

    <th>DIST</th>
    <th>COORD</th>
    <th>PLAYER</th>
    <th>SCORE</th>

    </tr>

    `;

    rows.forEach(v=>{

        html+=`

        <tr>

        <td>
        ${(v.distance||0).toFixed(1)}
        </td>

        <td>
        ${v.coord||'-'}
        </td>

        <td>
        ${v.owner?.name||'-'}
        </td>

        <td>
        ${v.finalScore||0}
        </td>

        </tr>

        `;

    });

    html+=`</table>`;

    TWM.UI.safe(html);

};

/* =========================================================
   LIVE TAB
========================================================= */

TWM.UI.renderLive=
()=>{

    const trains=

    TWM.state.war.trains

    .sort((a,b)=>

        b.priority-a.priority

    );

    let html=`

    <h2>
    👑 LIVE WAR
    </h2>

    <table class="vis" width="100%">

    <tr>

    <th>COORD</th>
    <th>SIZE</th>
    <th>NOBLE</th>
    <th>PRIORITY</th>

    </tr>

    `;

    trains.forEach(t=>{

        html+=`

        <tr>

        <td>${t.coord}</td>

        <td>${t.size}</td>

        <td>
        ${t.noble?'👑':''}
        </td>

        <td>
        ${t.priority}
        </td>

        </tr>

        `;

    });

    html+=`</table>`;

    TWM.UI.safe(html);

};

/* =========================================================
   PLAYERS TAB
========================================================= */

TWM.UI.renderPlayers=
()=>{

    const rows=

    Object.values(
        TWM.state.players
    )

    .sort((a,b)=>

        b.points-a.points

    )

    .slice(0,300);

    let html=`

    <h2>
    👤 PLAYERS
    </h2>

    <table class="vis" width="100%">

    <tr>

    <th>PLAYER</th>
    <th>POINTS</th>
    <th>VILLAGES</th>
    <th>BEHAVIOR</th>

    </tr>

    `;

    rows.forEach(p=>{

        html+=`

        <tr>

        <td>${p.name}</td>

        <td>${p.points}</td>

        <td>${p.villages}</td>

        <td>${p.behavior}</td>

        </tr>

        `;

    });

    html+=`</table>`;

    TWM.UI.safe(html);

};

/* =========================================================
   TARGETS TAB
========================================================= */

TWM.UI.renderTargets=
()=>{

    let html=`

    <h2>
    🎯 TARGETS
    </h2>

    <table class="vis" width="100%">

    <tr>

    <th>COORD</th>
    <th>PLAYER</th>
    <th>SCORE</th>

    </tr>

    `;

    TWM.state.recommendations
    .forEach(v=>{

        html+=`

        <tr>

        <td>${v.coord}</td>

        <td>${v.owner?.name||'-'}</td>

        <td>${v.finalScore||0}</td>

        </tr>

        `;

    });

    html+=`</table>`;

    TWM.UI.safe(html);

};

/* =========================================================
   ALERTS TAB
========================================================= */

TWM.UI.renderAlerts=
()=>{

    let html=`

    <h2>
    🚨 ALERTS
    </h2>

    `;

    TWM.state.war.trains
    .forEach(t=>{

        if(!t.noble)return;

        html+=`

        <div style="
        padding:6px;
        margin-bottom:4px;
        background:#ffcccc;
        border:1px solid red;
        ">

        👑 NOBLE TRAIN
        →
        ${t.coord}

        </div>

        `;

    });

    TWM.UI.safe(html);

};

/* =========================================================
   TABS
========================================================= */

$(document).on(
    'click',
    '[data-tab]',
    function(){

        const tab=
        $(this).data('tab');

        TWM.state.currentTab=
        tab;

        switch(tab){

            case 'war':

                TWM.UI.renderWar();

            break;

            case 'livewar':

                TWM.UI.renderLive();

            break;

            case 'players':

                TWM.UI.renderPlayers();

            break;

            case 'targets':

                TWM.UI.renderTargets();

            break;

            case 'alerts':

                TWM.UI.renderAlerts();

            break;

        }

    }

);

/* =========================================================
   CLEANUP
========================================================= */

TWM.Modules.Cleanup={};

TWM.Modules.Cleanup.run=
()=>{

    if(

        TWM.Debug.logs.length>

        250

    ){

        TWM.Debug.logs=

        TWM.Debug.logs.slice(-250);

    }

};

/* =========================================================
   MAIN RUN
========================================================= */

TWM.run=
async()=>{

    if(
        TWM.state.running
    ){

        return;

    }

    if(document.hidden){

        return;

    }

    TWM.state.running=true;

    try{

        TWM.state.center=

        TWM.Helpers.coord(

            game_data.village.coord

        );

        await TWM.Modules
        .Players
        .scan();

        await TWM.Modules
        .Villages
        .scan();

        TWM.Modules
        .Link
        .run();

        TWM.Modules
        .Behavior
        .run();

        await TWM.Modules
        .ReportEngine
        .scan();

        await TWM.Modules
        .LiveWar
        .scan();

        TWM.Modules
        .Trains
        .run();

        TWM.Modules
        .Score
        .run();

        TWM.Modules
        .Strategist
        .run();

        TWM.Modules
        .Cleanup
        .run();

        switch(
            TWM.state.currentTab
        ){

            case 'war':

                TWM.UI.renderWar();

            break;

            case 'livewar':

                TWM.UI.renderLive();

            break;

            case 'players':

                TWM.UI.renderPlayers();

            break;

            case 'targets':

                TWM.UI.renderTargets();

            break;

            case 'alerts':

                TWM.UI.renderAlerts();

            break;

        }

    }catch(e){

        TWM.Debug.log(

            'MAIN_ERROR',

            'RUN',

            e.message,

            {

                stack:e.stack

            }

        );

    }finally{

        TWM.state.running=false;

    }

};

/* =========================================================
   BUTTONS
========================================================= */

$('#twm_reload').on(
    'click',
    async()=>{

        await TWM.run();

    }

);

/* =========================================================
   AUTO REFRESH
========================================================= */

TWM.state.interval=
setInterval(async()=>{

    if(
        !TWM.state.running
    ){

        await TWM.run();

    }

},
TWM.config.refresh);

/* =========================================================
   START
========================================================= */

await TWM.run();

})();
