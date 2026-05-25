(async()=>{

'use strict';

/* =========================================
   TWMPRO AI CORE v3
   STABLE BUILD
   VERIFIED
========================================= */

/* =========================================
   MAP ONLY
========================================= */

if(game_data.screen!=='map'){

    UI.InfoMessage(
        'Uruchom skrypt na mapie',
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

    storage:'TWMAI_V3',

    radius:50,

    panelX:120,
    panelY:40,

    refresh:120000

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
   MEMORY
========================================= */

TWM.Memory={};

TWM.Memory.load=()=>{

    try{

        const data=
        JSON.parse(

            localStorage.getItem(
                TWM.config.storage
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

        TWM.config.storage,

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

TWM.Helpers.limit=
(v,min,max)=>{

    return Math.max(
        min,
        Math.min(v,max)
    );

};

/* =========================================
   DATA ENGINE
========================================= */

TWM.Data={};

/* =========================================
   PLAYERS
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
   ALLIES
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
   VILLAGES
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
   IMPORT
========================================= */

TWM.Import={};

TWM.Import.run=
async()=>{

    try{

        const pages=[

            '/game.php?village='+
            game_data.village.id+
            '&screen=report',

            '/game.php?village='+
            game_data.village.id+
            '&screen=am_farm',

            '/game.php?village='+
            game_data.village.id+
            '&screen=place&mode=units'

        ];

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

                    const m=
                    href.match(
                        /target=(\d+)/
                    );

                    if(m){

                        TWM.state
                        .knownBarbs[
                            m[1]
                        ]=true;

                    }

                });

            }catch(e){

                console.error(e);

            }

        }

        TWM.Memory.save();

    }catch(e){

        console.error(e);

    }

};

/* =========================================
   AI ENGINE
========================================= */

TWM.AI={};

/* =========================================
   FARM AI
========================================= */

TWM.AI.analyzeBarb=
(v)=>{

    const p=
    TWM.state.players[
        v.playerId
    ];

    if(p)return null;

    let score=50;

    /* DISTANCE */

    if(v.distance<=5){

        score+=25;

    }

    else if(v.distance<=10){

        score+=15;

    }

    else if(v.distance<=20){

        score+=5;

    }

    else{

        score-=15;

    }

    /* POINTS */

    if(
        v.points>=100 &&
        v.points<=500
    ){

        score+=15;

    }

    else if(
        v.points>1500
    ){

        score-=10;

    }

    /* KNOWN */

    const known=
    TWM.state
    .knownBarbs[
        v.id
    ]===true;

    if(!known){

        score+=10;

    }

    /* BARB DENSITY */

    let nearBarbs=0;

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

            nearBarbs++;

        }

    });

    score+=Math.min(
        nearBarbs,
        10
    );

    /* DANGER */

    let danger=0;

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

            danger++;

        }

    });

    score-=danger*5;

    /* LIMIT */

    score=
    TWM.Helpers.limit(
        score,
        0,
        100
    );

    /* STATUS */

    let status='💀 BAD';

    if(score>=80){

        status='🔥 PERFECT';

    }

    else if(score>=60){

        status='🟢 GOOD';

    }

    else if(score>=40){

        status='⚠ MID';

    }

    return{

        score,
        status,

        danger,
        nearBarbs,

        known

    };

};

/* =========================================
   MAP AI
========================================= */

TWM.AI.Map={};

TWM.AI.Map.sectors={};

TWM.AI.Map.getK=
(x,y)=>{

    return Math.floor(y/100)+
    ''+
    Math.floor(x/100);

};

TWM.AI.Map.run=()=>{

    TWM.AI.Map.sectors={};

    /* BUILD */

    TWM.state.villages
    .forEach(v=>{

        const k=
        TWM.AI.Map.getK(
            v.x,
            v.y
        );

        if(
            !TWM.AI.Map.sectors[k]
        ){

            TWM.AI.Map.sectors[k]={

                continent:k,

                villages:0,

                barbs:0,

                players:0,

                active:0,

                strong:0,

                avgPoints:0,

                totalPoints:0,

                farmValue:0,

                warRisk:0,

                expansion:0,

                deadness:0,

                score:0,

                type:''

            };

        }

        const s=
        TWM.AI.Map.sectors[k];

        s.villages++;

        s.totalPoints+=v.points;

        const p=
        TWM.state.players[
            v.playerId
        ];

        if(!p){

            s.barbs++;

        }

        else{

            s.players++;

            if(
                p.points>5000
            ){

                s.active++;

            }

            if(
                p.points>25000
            ){

                s.strong++;

            }

        }

    });

    /* AI */

    Object.values(
        TWM.AI.Map.sectors
    )
    .forEach(s=>{

        s.avgPoints=
        Math.floor(

            s.totalPoints/
            Math.max(
                s.villages,
                1
            )

        );

        /* FARM VALUE */

        s.farmValue=
        TWM.Helpers.limit(

            (
                s.barbs*2
            )
            -
            (
                s.active
            ),

            0,
            100

        );

        /* WAR RISK */

        s.warRisk=
        TWM.Helpers.limit(

            (
                s.strong*25
            )
            +
            (
                s.active*4
            ),

            0,
            100

        );

        /* EXPANSION */

        s.expansion=
        TWM.Helpers.limit(

            (
                s.barbs
            )
            -
            (
                s.strong*5
            ),

            0,
            100

        );

        /* DEADNESS */

        s.deadness=
        TWM.Helpers.limit(

            (
                s.barbs
            )
            -
            (
                s.active*2
            ),

            0,
            100

        );

        /* FINAL SCORE */

        s.score=
        Math.floor(

            (
                s.farmValue*0.4
            )
            +
            (
                s.expansion*0.3
            )
            +
            (
                s.deadness*0.2
            )
            -
            (
                s.warRisk*0.3
            )

        );

        s.score=
        TWM.Helpers.limit(
            s.score,
            0,
            100
        );

        /* TYPE */

        s.type='⚔ WAR ZONE';

        if(
            s.deadness>=60
        ){

            s.type='🛌 DEAD ZONE';

        }

        else if(
            s.farmValue>=60
        ){

            s.type='🌾 FARM ZONE';

        }

        else if(
            s.expansion>=60
        ){

            s.type='📈 EXPANSION';

        }

        else if(
            s.warRisk>=60
        ){

            s.type='⚔ WAR ZONE';

        }

    });

};

/* =========================================
   AI RUN
========================================= */

TWM.AI.run=()=>{

    TWM.state.villages
    .forEach(v=>{

        v.ai=
        TWM.AI.analyzeBarb(v);

    });

    TWM.AI.Map.run();

};

/* =========================================
   UI
========================================= */

TWM.UI={};

/* =========================================
   FLOAT
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

        fontSize:'20px'

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

        width:'1300px',

        height:'720px',

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
TWMPRO AI CORE v3
</div>

<div>

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

<button id="tab_map">
🗺 MAP AI
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

    }

    else{

        TWM.UI.close();

    }

};

/* =========================================
   FARM TAB
========================================= */

TWM.UI.renderFarm=()=>{

    const content=
    document.querySelector(
        '#twm_content'
    );

    const data=
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

    data.forEach(v=>{

        let bg='#f8eed1';

        if(
            v.ai.score>=80
        ){

            bg='#ffb3b3';

        }

        else if(
            v.ai.score>=60
        ){

            bg='#cfe6b8';

        }

        else if(
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
${v.ai.nearBarbs}
</td>

<td>
${v.ai.danger}
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
   MAP TAB
========================================= */

TWM.UI.renderMap=()=>{

    const content=
    document.querySelector(
        '#twm_content'
    );

    const data=
    Object.values(
        TWM.AI.Map.sectors
    )
    .sort((a,b)=>

        b.score-a.score

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

<th>K</th>

<th>TYPE</th>

<th>SCORE</th>

<th>FARM</th>

<th>WAR</th>

<th>EXP</th>

<th>DEAD</th>

<th>BARBS</th>

<th>PLAYERS</th>

<th>ACTIVE</th>

<th>STRONG</th>

</tr>

`;

    data.forEach(s=>{

        let bg='#f8eed1';

        if(
            s.type.includes(
                'FARM'
            )
        ){

            bg='#cfe6b8';

        }

        else if(
            s.type.includes(
                'WAR'
            )
        ){

            bg='#ffb3b3';

        }

        else if(
            s.type.includes(
                'DEAD'
            )
        ){

            bg='#ddd';

        }

        else if(
            s.type.includes(
                'EXPANSION'
            )
        ){

            bg='#fff0b3';

        }

        html+=`

<tr style="
background:${bg};
border-bottom:1px solid #c4a46a;
">

<td>
K${s.continent}
</td>

<td>
${s.type}
</td>

<td>
${s.score}
</td>

<td>
${s.farmValue}
</td>

<td>
${s.warRisk}
</td>

<td>
${s.expansion}
</td>

<td>
${s.deadness}
</td>

<td>
${s.barbs}
</td>

<td>
${s.players}
</td>

<td>
${s.active}
</td>

<td>
${s.strong}
</td>

</tr>

`;

    });

    html+=`</table>`;

    content.innerHTML=html;

};

/* =========================================
   EVENTS
========================================= */

document
.querySelector('#tab_farm')
.onclick=()=>{

    TWM.UI.renderFarm();

};

document
.querySelector('#tab_map')
.onclick=()=>{

    TWM.UI.renderMap();

};

document
.querySelector('#twm_scan')
.onclick=async()=>{

    TWM.Helpers.status(
        'Scanning...'
    );

    await TWM.Import.run();

    await TWM.Data.loadPlayers();

    await TWM.Data.loadAllies();

    await TWM.Data.loadVillages();

    TWM.AI.run();

    TWM.UI.renderFarm();

    TWM.Helpers.status(

        'Loaded '+
        TWM.state.villages.length

    );

};

/* =========================================
   AUTO REFRESH
========================================= */

TWM.state.timer=
setInterval(async()=>{

    try{

        await TWM.Import.run();

        await TWM.Data.loadVillages();

        TWM.AI.run();

    }catch(e){

        console.error(e);

    }

},
TWM.config.refresh);

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

await TWM.Data.loadPlayers();

await TWM.Data.loadAllies();

await TWM.Data.loadVillages();

TWM.AI.run();

TWM.UI.renderFarm();

TWM.Helpers.status(

    'Loaded '+
    TWM.state.villages.length

);

})();
