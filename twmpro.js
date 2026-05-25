(async()=>{

'use strict';

/* =========================================
   TWMPRO AI CORE v2
   FULL REBUILD
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

    storage:'TWMAI_V2',

    radius:25,

    autoRefresh:true,

    refreshTime:120000,

    panelX:120,
    panelY:40

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
   AI ENGINE
========================================= */

TWM.AI={};

/* =========================================
   FARM AI
========================================= */

TWM.AI.analyzeBarb=
(v)=>{

    const player=
    TWM.state.players[
        v.playerId
    ];

    if(player){

        return null;

    }

    let score=0;

    /* DISTANCE */

    if(v.distance<=5){

        score+=40;

    }

    else if(v.distance<=10){

        score+=30;

    }

    else if(v.distance<=15){

        score+=20;

    }

    else if(v.distance<=20){

        score+=10;

    }

    /* POINTS */

    if(
        v.points>=100 &&
        v.points<=500
    ){

        score+=25;

    }

    else if(
        v.points<=1000
    ){

        score+=10;

    }

    /* KNOWN */

    const known=
    TWM.state.knownBarbs[
        v.id
    ]===true;

    if(!known){

        score+=15;

    }

    /* NEAR BARBS */

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

    score-=danger*8;

    score=
    Math.max(
        0,
        Math.min(score,100)
    );

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

        nearBarbs,
        danger,

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

                danger:0,

                farm:0,

                growth:0,

                score:0,

                status:''

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

        s.farm=
        Math.max(
            0,
            Math.min(

                (
                    s.barbs*2
                )
                -
                (
                    s.strong*10
                )
                -
                (
                    s.active*2
                ),

                100

            )
        );

        s.danger=
        Math.max(
            0,
            Math.min(

                (
                    s.strong*15
                )
                +
                (
                    s.active*4
                ),

                100

            )
        );

        s.growth=
        Math.floor(

            s.players+
            s.active*2+
            s.avgPoints/1000

        );

        s.score=
        Math.floor(

            s.farm-
            s.danger+
            s.growth

        );

        s.status='💀 DEAD';

        if(s.score>=80){

            s.status='🔥 PERFECT';

        }

        else if(
            s.score>=50
        ){

            s.status='🟢 GOOD';

        }

        else if(
            s.score>=20
        ){

            s.status='⚠ ACTIVE';

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
   UI ENGINE
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

        width:'1250px',

        height:'700px',

        background:'#f4e4bc',

        border:'2px solid #7a5b2e',

        zIndex:'999998',

        display:'flex',

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
TWMPRO AI CORE v2
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

    const sectors=
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

<th>AI</th>

<th>SCORE</th>

<th>FARM</th>

<th>DANGER</th>

<th>GROWTH</th>

<th>BARBS</th>

<th>PLAYERS</th>

<th>ACTIVE</th>

<th>STRONG</th>

<th>AVG PTS</th>

</tr>

`;

    sectors.forEach(s=>{

        let bg='#f8eed1';

        if(
            s.score>=80
        ){

            bg='#ffb3b3';

        }

        else if(
            s.score>=50
        ){

            bg='#cfe6b8';

        }

        else if(
            s.score>=20
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
${s.status}
</td>

<td>
${s.score}
</td>

<td>
${s.farm}
</td>

<td>
${s.danger}
</td>

<td>
${s.growth}
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

<td>
${s.avgPoints}
</td>

</tr>

`;

    });

    html+=`</table>`;

    content.innerHTML=html;

};

/* =========================================
   TAB EVENTS
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

/* =========================================
   SCAN
========================================= */

document
.querySelector('#twm_scan')
.onclick=async()=>{

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
