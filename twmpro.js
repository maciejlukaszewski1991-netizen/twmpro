/* =========================================================
   TWMPRO AI CORE v27
   FULL MERGED BUILD
========================================================= */

(async()=>{

'use strict';

/* =========================================================
   MAP CHECK
========================================================= */

if(game_data.screen!=='map'){

    UI.InfoMessage(
        'Uruchom na mapie',
        3000,
        'error'
    );

    return;

}

/* =========================================================
   SINGLE INSTANCE
========================================================= */

if(window.TWMAI_V27){

    try{

        window.TWMAI_V27.open();

    }catch(e){}

    return;

}

/* =========================================================
   ROOT
========================================================= */

window.TWMAI_V27={};

const TWM=window.TWMAI_V27;

/* =========================================================
   CONFIG
========================================================= */

TWM.config={

    refresh:120000,

    width:1225,

    height:665,

    minWidth:700,

    minHeight:420

};

/* =========================================================
   STATE
========================================================= */

TWM.state={

    running:false,

    currentTab:'dashboard',

    autoRefresh:null,

    players:{},

    allies:{},

    villages:[],

    reports:[],

    diplomacy:{},

    regions:{},

    hotspots:[],

    bestTargets:[],

    bestRegions:[],

    logistics:[],

    predictions:[],

    knownCoords:{}

};

/* =========================================================
   HELPERS
========================================================= */

TWM.Helpers={};

TWM.Helpers.coord=(txt)=>{

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

TWM.Helpers.status=(txt)=>{

    const el=
    document.querySelector(
        '#twm_status'
    );

    if(el){

        el.innerText=txt;

    }

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

        borderRadius:'50%',

        background:'#6b4d24',

        color:'#fff',

        display:'flex',

        alignItems:'center',

        justifyContent:'center',

        cursor:'pointer',

        zIndex:'999999',

        fontSize:'22px'

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

        zIndex:'999998',

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
color:#fff;
display:flex;
justify-content:space-between;
align-items:center;
cursor:move;
font-weight:bold;
">

<div>
🧠 TWMPRO AI CORE v27
</div>

<div style="display:flex;gap:4px;">

<button id="twm_full">
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
<button id="tab_reports">📜</button>
<button id="tab_war">⚔</button>
<button id="tab_heatmap">🔥</button>
<button id="tab_conquer">👑</button>
<button id="tab_economy">💰</button>
<button id="tab_activity">⏰</button>
<button id="tab_empire">🏰</button>

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
padding:10px;
background:#f8eed1;
">
</div>

`;

/* =========================================================
   DRAG
========================================================= */

let drag=false;

let ox=0;
let oy=0;

$('#twm_header').on('mousedown',e=>{

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
   BUTTONS
========================================================= */

$('#twm_full').on('click',()=>{

    TWM.UI.panel.style.left='0px';

    TWM.UI.panel.style.top='0px';

    TWM.UI.panel.style.width=
    (window.innerWidth-4)+'px';

    TWM.UI.panel.style.height=
    (window.innerHeight-4)+'px';

});

$('#twm_min').on('click',()=>{

    TWM.UI.panel.style.display='none';

});

$('#twm_close').on('click',()=>{

    clearInterval(
        TWM.state.autoRefresh
    );

    TWM.UI.panel.remove();

    TWM.UI.float.remove();

    delete window.TWMAI_V27;

});

TWM.UI.float.onclick=()=>{

    TWM.UI.panel.style.display='flex';

};

/* =========================================================
   AI
========================================================= */

TWM.AI={};

/* =========================================================
   PLAYERS
========================================================= */

TWM.AI.scanPlayers=
async()=>{

    const txt=
    await fetch('/map/player.txt')
    .then(r=>r.text());

    TWM.state.players={};

    txt.trim()
    .split('\n')
    .forEach(line=>{

        if(!line)return;

        const p=
        line.split(',');

        TWM.state.players[
            p[0]
        ]={

            id:p[0],

            name:p[1],

            ally:p[2],

            villages:+p[3],

            points:+p[4],

            relation:'neutral',

            danger:0,

            loot24h:0

        };

    });

};

/* =========================================================
   ALLIES
========================================================= */

TWM.AI.scanAllies=
async()=>{

    const txt=
    await fetch('/map/ally.txt')
    .then(r=>r.text());

    TWM.state.allies={};

    txt.trim()
    .split('\n')
    .forEach(line=>{

        if(!line)return;

        const a=
        line.split(',');

        TWM.state.allies[
            a[0]
        ]={

            id:a[0],

            tag:a[2],

            points:+a[5]

        };

    });

};

/* =========================================================
   VILLAGES
========================================================= */

TWM.AI.scanVillages=
async()=>{

    const txt=
    await fetch('/map/village.txt')
    .then(r=>r.text());

    TWM.state.villages=[];

    txt.trim()
    .split('\n')
    .forEach(line=>{

        if(!line)return;

        const v=
        line.split(',');

        TWM.state.villages.push({

            id:v[0],

            x:+v[2],

            y:+v[3],

            coord:
            v[2]+'|'+v[3],

            playerId:v[4],

            points:+v[5],

            frontline:false,

            danger:0,

            cluster:0,

            targetScore:0

        });

    });

};

/* =========================================================
   LINK
========================================================= */

TWM.AI.linkVillagePlayers=
()=>{

    const me=
    Object.values(
        TWM.state.players
    ).find(p=>

        p.name===
        game_data.player.name

    );

    TWM.state.villages
    .forEach(v=>{

        v.player=
        TWM.state.players[
            v.playerId
        ]||null;

        if(!v.player)return;

        if(
            v.player.name===
            game_data.player.name
        ){

            v.player.relation='own';

        }

        else if(
            v.player.ally===
            me?.ally
        ){

            v.player.relation='ally';

        }

    });

};

/* =========================================================
   FRONTLINES
========================================================= */

TWM.AI.scanFrontlines=
()=>{

    TWM.state.villages
    .forEach(v=>{

        let enemy=0;

        TWM.state.villages
        .forEach(o=>{

            if(v===o)return;

            if(!o.player)return;

            const dist=
            TWM.Helpers.distance(

                v.x,
                v.y,

                o.x,
                o.y

            );

            if(dist>15)return;

            if(
                o.player.relation===
                'enemy'
            ){

                enemy++;

            }

        });

        if(enemy>=5){

            v.frontline=true;

        }

        v.danger=
        enemy*10;

    });

};

/* =========================================================
   CLUSTERS
========================================================= */

TWM.AI.scanClusters=
()=>{

    TWM.state.villages
    .forEach(v=>{

        let nearby=0;

        TWM.state.villages
        .forEach(o=>{

            if(v===o)return;

            const dist=
            TWM.Helpers.distance(

                v.x,
                v.y,

                o.x,
                o.y

            );

            if(dist<=5){

                nearby++;

            }

        });

        v.cluster=nearby;

    });

};

/* =========================================================
   TARGET AI
========================================================= */

TWM.AI.scanTargets=
()=>{

    TWM.state.villages
    .forEach(v=>{

        if(!v.player)return;

        let score=0;

        if(
            v.player.relation===
            'enemy'
        ){

            score+=100;

        }

        if(v.frontline){

            score+=50;

        }

        score+=
        v.cluster;

        if(v.points<5000){

            score+=30;

        }

        v.targetScore=
        Math.floor(score);

    });

};

/* =========================================================
   REGIONS
========================================================= */

TWM.AI.buildRegions=
()=>{

    TWM.state.regions={};

    TWM.state.villages
    .forEach(v=>{

        const rx=
        Math.floor(v.x/20);

        const ry=
        Math.floor(v.y/20);

        const id=
        rx+'_'+ry;

        if(
            !TWM.state.regions[id]
        ){

            TWM.state.regions[id]={

                id,

                villages:[],

                total:0,

                enemy:0,

                danger:0

            };

        }

        TWM.state.regions[id]
        .villages.push(v);

    });

};

TWM.AI.scanRegions=
()=>{

    Object.values(
        TWM.state.regions
    ).forEach(r=>{

        r.total=
        r.villages.length;

        r.villages.forEach(v=>{

            if(
                v.player?.relation===
                'enemy'
            ){

                r.enemy++;

            }

            r.danger+=
            v.danger||0;

        });

    });

};

/* =========================================================
   REPORTS
========================================================= */

TWM.AI.scanReports=
async()=>{

    const html=
    await fetch(

        '/game.php?village='+
        game_data.village.id+
        '&screen=report'

    ).then(r=>r.text());

    const doc=
    new DOMParser()
    .parseFromString(
        html,
        'text/html'
    );

    TWM.state.reports=[];

    doc.querySelectorAll('tr')
    .forEach(row=>{

        const txt=
        row.innerText
        .toLowerCase();

        if(
            !txt.includes('|')
        )return;

        TWM.state.reports.push({

            raw:txt,

            attack:
            txt.includes('atak'),

            support:
            txt.includes('wsparcie')

        });

    });

};

/* =========================================================
   ECONOMY
========================================================= */

TWM.AI.scanEconomy=
async()=>{

    const html=
    await fetch(

        '/game.php?village='+
        game_data.village.id+
        '&screen=ranking&mode=in_a_day&type=loot'

    ).then(r=>r.text());

    const doc=
    new DOMParser()
    .parseFromString(
        html,
        'text/html'
    );

    doc.querySelectorAll('tr')
    .forEach(row=>{

        const tds=
        row.querySelectorAll('td');

        if(tds.length<4)return;

        const player=
        tds[1]
        .innerText
        .trim();

        const loot=
        parseInt(

            tds[3]
            .innerText
            .replace(/\./g,'')

        )||0;

        const p=
        Object.values(
            TWM.state.players
        ).find(x=>

            x.name===player

        );

        if(p){

            p.loot24h=loot;

        }

    });

};

/* =========================================================
   RENDERS
========================================================= */

TWM.UI.renderDashboard=
()=>{

    $('#twm_content').html(`

    <h2>🧠 DASHBOARD</h2>

    <table class="vis">

    <tr>
    <th>MODUŁ</th>
    <th>STATUS</th>
    </tr>

    <tr>
    <td>PLAYERS</td>
    <td>✅</td>
    </tr>

    <tr>
    <td>WAR AI</td>
    <td>✅</td>
    </tr>

    <tr>
    <td>HEATMAP</td>
    <td>✅</td>
    </tr>

    <tr>
    <td>CONQUER</td>
    <td>✅</td>
    </tr>

    </table>

    `);

};

TWM.UI.renderPlayers=
()=>{

    const players=
    Object.values(
        TWM.state.players
    )

    .sort((a,b)=>

        b.points-a.points

    )

    .slice(0,200);

    let html=`

    <h2>👤 PLAYERS</h2>

    <table class="vis" width="100%">

    <tr>

    <th>GRACZ</th>
    <th>REL</th>
    <th>PKT</th>
    <th>FARMA</th>

    </tr>

    `;

    players.forEach(p=>{

        html+=`

        <tr>

        <td>
        ${p.name}
        </td>

        <td>
        ${p.relation}
        </td>

        <td>
        ${p.points}
        </td>

        <td>
        ${p.loot24h}
        </td>

        </tr>

        `;

    });

    html+=`</table>`;

    $('#twm_content').html(
        html
    );

};

TWM.UI.renderWar=
()=>{

    const villages=
    TWM.state.villages

    .filter(v=>

        v.frontline

    )

    .sort((a,b)=>

        b.targetScore-
        a.targetScore

    )

    .slice(0,200);

    let html=`

    <h2>⚔ WAR AI</h2>

    <table class="vis" width="100%">

    <tr>

    <th>KOORDY</th>
    <th>GRACZ</th>
    <th>DANGER</th>
    <th>TARGET</th>

    </tr>

    `;

    villages.forEach(v=>{

        html+=`

        <tr>

        <td>
        ${v.coord}
        </td>

        <td>
        ${v.player?.name||'-'}
        </td>

        <td>
        ${v.danger}
        </td>

        <td>
        ${v.targetScore}
        </td>

        </tr>

        `;

    });

    html+=`</table>`;

    $('#twm_content').html(
        html
    );

};

TWM.UI.renderHeatmap=
()=>{

    const regions=
    Object.values(
        TWM.state.regions
    )

    .sort((a,b)=>

        b.danger-
        a.danger

    )

    .slice(0,100);

    let html=`

    <h2>🔥 HEATMAP</h2>

    <table class="vis" width="100%">

    <tr>

    <th>REGION</th>
    <th>WIOSKI</th>
    <th>ENEMY</th>
    <th>DANGER</th>

    </tr>

    `;

    regions.forEach(r=>{

        html+=`

        <tr>

        <td>
        ${r.id}
        </td>

        <td>
        ${r.total}
        </td>

        <td>
        ${r.enemy}
        </td>

        <td>
        ${r.danger}
        </td>

        </tr>

        `;

    });

    html+=`</table>`;

    $('#twm_content').html(
        html
    );

};

TWM.UI.renderReports=
()=>{

    let html=`

    <h2>📜 REPORTS</h2>

    <table class="vis">

    <tr>

    <th>ATAK</th>
    <th>SUPPORT</th>

    </tr>

    `;

    TWM.state.reports
    .slice(0,200)
    .forEach(r=>{

        html+=`

        <tr>

        <td>
        ${r.attack?'⚔':''}
        </td>

        <td>
        ${r.support?'🛡':''}
        </td>

        </tr>

        `;

    });

    html+=`</table>`;

    $('#twm_content').html(
        html
    );

};

/* =========================================================
   SIMPLE TABS
========================================================= */

$('#tab_dashboard').on('click',()=>{

    TWM.UI.renderDashboard();

});

$('#tab_players').on('click',()=>{

    TWM.UI.renderPlayers();

});

$('#tab_reports').on('click',()=>{

    TWM.UI.renderReports();

});

$('#tab_war').on('click',()=>{

    TWM.UI.renderWar();

});

$('#tab_heatmap').on('click',()=>{

    TWM.UI.renderHeatmap();

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
            'AI SKANUJE...'
        );

        await TWM.AI.scanPlayers();

        await TWM.AI.scanAllies();

        await TWM.AI.scanVillages();

        await TWM.AI.scanEconomy();

        await TWM.AI.scanReports();

        TWM.AI.linkVillagePlayers();

        TWM.AI.scanFrontlines();

        TWM.AI.scanClusters();

        TWM.AI.scanTargets();

        TWM.AI.buildRegions();

        TWM.AI.scanRegions();

        TWM.UI.renderDashboard();

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
   SCAN BUTTON
========================================================= */

$('#twm_scan').on('click',async()=>{

    await TWM.run();

});

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
