(async()=>{

'use strict';

/* =========================================
   TWMPRO AI CORE v1
   FOUNDATION BUILD
========================================= */

/* =========================================
   MAP ONLY
========================================= */

if(game_data.screen!=='map'){

    UI.InfoMessage(
        'Uruchom TWMPRO AI na mapie',
        4000,
        'error'
    );

    return;

}

/* =========================================
   SINGLE INSTANCE
========================================= */

if(window.TWMAI){

    window.TWMAI.UI.open();

    return;

}

/* =========================================
   ROOT
========================================= */

window.TWMAI={};

const TWM=window.TWMAI;

/* =========================================
   CONFIG
========================================= */

TWM.config={

    storageKey:'TWMAI_CORE_V1',

    radius:25,

    autoRefresh:true,

    refreshTime:120000,

    minimized:false,

    panelX:120,
    panelY:40,

    activeTab:'farm'

};

/* =========================================
   STATE
========================================= */

TWM.state={

    villages:[],
    players:{},
    allies:{},

    knownBarbs:{},

    loading:false,

    timer:null

};

/* =========================================
   MEMORY ENGINE
========================================= */

TWM.Memory={};

TWM.Memory.load=()=>{

    try{

        const data=
        JSON.parse(
            localStorage.getItem(
                TWM.config.storageKey
            )||'{}'
        );

        if(data.knownBarbs){

            TWM.state.knownBarbs=
            data.knownBarbs;

        }

    }catch(e){

        console.error(e);

    }

};

TWM.Memory.save=()=>{

    localStorage.setItem(

        TWM.config.storageKey,

        JSON.stringify({

            knownBarbs:
            TWM.state.knownBarbs

        })

    );

};

/* =========================================
   HELPERS
========================================= */

TWM.Helpers={};

TWM.Helpers.coord=()=>{

    const c=
    game_data.village.coord
    .split('|');

    return{

        x:+c[0],
        y:+c[1]

    };

};

TWM.Helpers.distance=(x1,y1,x2,y2)=>{

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

/* =========================================
   DATA ENGINE
========================================= */

TWM.Data={};

/* =========================================
   LOAD PLAYERS
========================================= */

TWM.Data.loadPlayers=
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

        TWM.state.players[p[0]]={

            id:p[0],

            name:p[1],

            ally:p[2],

            villages:+p[3],

            points:+p[4]

        };

    });

};

/* =========================================
   LOAD ALLIES
========================================= */

TWM.Data.loadAllies=
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

        TWM.state.allies[a[0]]={

            id:a[0],

            name:a[1],

            tag:a[2]

        };

    });

};

/* =========================================
   LOAD VILLAGES
========================================= */

TWM.Data.loadVillages=
async()=>{

    const txt=
    await fetch('/map/village.txt')
    .then(r=>r.text());

    const lines=
    txt.split('\n');

    const c=
    TWM.Helpers.coord();

    TWM.state.villages=[];

    for(const line of lines){

        if(!line)continue;

        const v=
        line.split(',');

        const x=+v[2];
        const y=+v[3];

        const d=
        TWM.Helpers.distance(
            c.x,
            c.y,
            x,
            y
        );

        if(
            d>TWM.config.radius
        ){
            continue;
        }

        TWM.state.villages.push({

            id:v[0],

            name:v[1],

            x,
            y,

            playerId:v[4],

            points:+v[5],

            distance:d,

            ai:{}

        });

    }

};

/* =========================================
   MAIN LOAD
========================================= */

TWM.Data.load=
async()=>{

    if(TWM.state.loading)return;

    TWM.state.loading=true;

    try{

        TWM.Helpers.status(
            'Loading players...'
        );

        await TWM.Data.loadPlayers();

        TWM.Helpers.status(
            'Loading allies...'
        );

        await TWM.Data.loadAllies();

        TWM.Helpers.status(
            'Loading villages...'
        );

        await TWM.Data.loadVillages();

        TWM.AI.run();

        TWM.UI.renderFarm();

        TWM.Helpers.status(
            'Loaded '+
            TWM.state.villages.length
        );

    }catch(e){

        console.error(e);

        TWM.Helpers.status(
            'Load error'
        );

    }

    TWM.state.loading=false;

};

/* =========================================
   AI ENGINE
========================================= */

TWM.AI={};

/* =========================================
   BARB ANALYZER
========================================= */

TWM.AI.analyzeBarb=
(v)=>{

    const player=
    TWM.state.players[
        v.playerId
    ];

    /* NOT BARB */

    if(player){

        return null;

    }

    let score=0;

    /* =====================================
       DISTANCE
    ===================================== */

    if(v.distance<=5){

        score+=30;

    }else if(v.distance<=10){

        score+=20;

    }else if(v.distance<=15){

        score+=10;

    }

    /* =====================================
       POINTS
    ===================================== */

    if(
        v.points>=100 &&
        v.points<=400
    ){

        score+=25;

    }else if(
        v.points<=1000
    ){

        score+=15;

    }

    /* =====================================
       KNOWN / NEW
    ===================================== */

    const known=
    TWM.state.knownBarbs[
        v.id
    ]===true;

    if(!known){

        score+=25;

    }

    /* =====================================
       BARB CLUSTER
    ===================================== */

    let nearbyBarbs=0;

    TWM.state.villages
    .forEach(other=>{

        if(
            other.id===v.id
        )return;

        const op=
        TWM.state.players[
            other.playerId
        ];

        if(op)return;

        const d=
        TWM.Helpers.distance(

            v.x,
            v.y,

            other.x,
            other.y

        );

        if(d<=4){

            nearbyBarbs++;

        }

    });

    score+=Math.min(
        nearbyBarbs*2,
        15
    );

    /* =====================================
       PLAYER DANGER
    ===================================== */

    let nearbyPlayers=0;

    TWM.state.villages
    .forEach(other=>{

        const op=
        TWM.state.players[
            other.playerId
        ];

        if(!op)return;

        const d=
        TWM.Helpers.distance(

            v.x,
            v.y,

            other.x,
            other.y

        );

        if(d<=6){

            nearbyPlayers++;

        }

    });

    score-=nearbyPlayers*5;

    /* =====================================
       LIMITS
    ===================================== */

    score=Math.max(
        0,
        Math.min(score,100)
    );

    /* =====================================
       STATUS
    ===================================== */

    let status='💀 BAD';

    if(score>=80){

        status='🔥 PERFECT';

    }else if(score>=60){

        status='🟢 GOOD';

    }else if(score>=40){

        status='⚠ MID';

    }

    return{

        score,
        status,

        nearbyBarbs,
        nearbyPlayers,

        known

    };

};

/* =========================================
   RUN AI
========================================= */

TWM.AI.run=()=>{

    TWM.state.villages
    .forEach(v=>{

        v.ai=
        TWM.AI.analyzeBarb(v);

    });

};

/* =========================================
   UI ENGINE
========================================= */

TWM.UI={};

/* =========================================
   FLOAT BUTTON
========================================= */

TWM.UI.float=
document.createElement('div');

TWM.UI.float.innerHTML='⚔';

Object.assign(

    TWM.UI.float.style,

    {

        position:'fixed',

        right:'10px',
        bottom:'10px',

        width:'42px',
        height:'42px',

        background:'#6b4d24',
        color:'#fff',

        borderRadius:'50%',

        display:'flex',

        alignItems:'center',
        justifyContent:'center',

        cursor:'pointer',

        zIndex:'999999',

        fontSize:'20px',

        boxShadow:
        '0 0 10px rgba(0,0,0,.5)'

    }

);

document.body.appendChild(
    TWM.UI.float
);

/* =========================================
   PANEL
========================================= */

TWM.UI.panel=
document.createElement('div');

Object.assign(

    TWM.UI.panel.style,

    {

        position:'fixed',

        left:
        TWM.config.panelX+'px',

        top:
        TWM.config.panelY+'px',

        width:'1200px',
        height:'700px',

        background:'#f4e4bc',

        border:'2px solid #7a5b2e',

        zIndex:'999998',

        display:
        TWM.config.minimized
        ?'none'
        :'flex',

        flexDirection:'column',

        resize:'both',

        overflow:'hidden',

        borderRadius:'8px',

        boxShadow:
        '0 0 12px rgba(0,0,0,.5)',

        fontFamily:'Verdana',

        fontSize:'11px'

    }

);

TWM.UI.panel.innerHTML=`

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
TWMPRO AI CORE
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
border-bottom:1px solid #7a5b2e;
">

<button id="tab_farm">
🔥 FARM AI
</button>

<button id="tab_player">
👤 PLAYER AI
</button>

<button id="tab_map">
🗺 MAP AI
</button>

<button id="tab_settings">
⚙ SETTINGS
</button>

<button id="twm_scan">
SCAN
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
">
</div>

`;

document.body.appendChild(
    TWM.UI.panel
);

/* =========================================
   OPEN CLOSE
========================================= */

TWM.UI.open=()=>{

    TWM.UI.panel.style.display=
    'flex';

};

TWM.UI.close=()=>{

    TWM.UI.panel.style.display=
    'none';

};

TWM.UI.float.onclick=()=>{

    if(
        TWM.UI.panel.style.display
        ==='none'
    ){

        TWM.UI.open();

    }else{

        TWM.UI.close();

    }

};

/* =========================================
   FARM RENDER
========================================= */

TWM.UI.renderFarm=()=>{

    const content=
    document.querySelector(
        '#twm_content'
    );

    const barbs=
    TWM.state.villages
    .filter(v=>v.ai)
    .sort((a,b)=>

        b.ai.score-
        a.ai.score

    );

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

<th>AI</th>
<th>SCORE</th>
<th>COORD</th>
<th>DIST</th>
<th>PTS</th>
<th>BARBS</th>
<th>DANGER</th>
<th>STATUS</th>

</tr>
`;

    barbs.forEach(v=>{

        let bg='#f8eed1';

        if(
            v.ai.score>=80
        ){

            bg='#ffb3b3';

        }else if(
            v.ai.score>=60
        ){

            bg='#cfe6b8';

        }else if(
            v.ai.score>=40
        ){

            bg='#fff0b3';

        }

        html+=`

<tr style="
background:${bg};
border-bottom:1px solid #c4a46a;
">

<td>
${v.ai.status}
</td>

<td>
${v.ai.score}
</td>

<td>

<a
href="/game.php?village=${game_data.village.id}&screen=place&target=${v.id}"
target="_blank">

${v.x}|${v.y}

</a>

</td>

<td>
${v.distance.toFixed(1)}
</td>

<td>
${v.points}
</td>

<td>
${v.ai.nearbyBarbs}
</td>

<td>
${v.ai.nearbyPlayers}
</td>

<td>

${
v.ai.known
?'🟡 KNOWN'
:'🟢 NEW'
}

</td>

</tr>

`;

    });

    html+=`</table>`;

    content.innerHTML=html;

};

/* =========================================
   IMPORT ENGINE
========================================= */

TWM.Import={};

TWM.Import.run=
async()=>{

    try{

        TWM.Helpers.status(
            'Importing...'
        );

        const pages=[

            '/game.php?village='+
            game_data.village.id+
            '&screen=place&mode=units',

            '/game.php?village='+
            game_data.village.id+
            '&screen=am_farm',

            '/game.php?village='+
            game_data.village.id+
            '&screen=report'

        ];

        let imported=0;

        for(const url of pages){

            try{

                const html=
                await fetch(url)
                .then(r=>r.text());

                const parser=
                new DOMParser();

                const doc=
                parser.parseFromString(
                    html,
                    'text/html'
                );

                const links=
                [
                    ...doc.querySelectorAll('a')
                ];

                links.forEach(a=>{

                    const href=
                    a.href||'';

                    if(
                        href.includes(
                            'screen=info_village'
                        )
                    ){

                        const m=
                        href.match(
                            /id=(\d+)/
                        );

                        if(m){

                            const id=m[1];

                            if(
                                !TWM.state
                                .knownBarbs[id]
                            ){

                                TWM.state
                                .knownBarbs[id]
                                =true;

                                imported++;

                            }

                        }

                    }

                });

            }catch(e){

                console.error(e);

            }

        }

        TWM.Memory.save();

        TWM.Helpers.status(

            'Imported '+imported

        );

    }catch(e){

        console.error(e);

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
        href.includes(
            'target='
        )
    ){

        const m=
        href.match(
            /target=(\d+)/
        );

        if(m){

            TWM.state
            .knownBarbs[m[1]]
            =true;

            TWM.Memory.save();

        }

    }

});

/* =========================================
   EVENTS
========================================= */

document
.querySelector('#twm_scan')
.onclick=async()=>{

    await TWM.Import.run();

    await TWM.Data.load();

};

/* =========================================
   CLOSE
========================================= */

document
.querySelector('#twm_close')
.onclick=()=>{

    if(TWM.state.timer){

        clearInterval(
            TWM.state.timer
        );

    }

    TWM.UI.panel.remove();

    TWM.UI.float.remove();

    delete window.TWMAI;

};

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
    e.clientX-
    TWM.UI.panel.offsetLeft;

    oy=
    e.clientY-
    TWM.UI.panel.offsetTop;

};

document.onmouseup=()=>{

    drag=false;

};

document.onmousemove=e=>{

    if(!drag)return;

    TWM.UI.panel.style.left=
    e.clientX-ox+'px';

    TWM.UI.panel.style.top=
    e.clientY-oy+'px';

};

/* =========================================
   INIT
========================================= */

TWM.Memory.load();

await TWM.Import.run();

await TWM.Data.load();

})();
