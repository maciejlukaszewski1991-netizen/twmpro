(async()=>{

'use strict';

/* =========================================
   TWMPRO AI CORE v4
   FULL REWRITE
   VERIFIED STABLE
========================================= */

/* =========================================
   MAP ONLY
========================================= */

if(game_data.screen!=='map'){

    UI.InfoMessage(
        'Uruchom na mapie',
        3000,
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

    storage:'TWMAI_V4',

    radius:50,

    refresh:120000,

    panelX:100,
    panelY:40

};

/* =========================================
   STATE
========================================= */

TWM.state={

    villages:[],
    players:{},
    allies:{},

    known:{},

    loading:false,

    timer:null,

    currentTab:'farm'

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
                TWM.config.storage
            )||'{}'

        );

        if(data.known){

            TWM.state.known=
            data.known;

        }

    }catch(e){

        console.error(e);

    }

};

TWM.Memory.save=()=>{

    localStorage.setItem(

        TWM.config.storage,

        JSON.stringify({

            known:
            TWM.state.known

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

TWM.Helpers.limit=
(v,min,max)=>{

    return Math.max(
        min,
        Math.min(v,max)
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

                    let m=
                    href.match(
                        /target=(\d+)/
                    );

                    if(m){

                        TWM.state.known[
                            m[1]
                        ]={

                            known:true,
                            updated:Date.now()

                        };

                    }

                    m=
                    href.match(
                        /id=(\d+)/
                    );

                    if(
                        href.includes(
                            'info_village'
                        ) &&
                        m
                    ){

                        TWM.state.known[
                            m[1]
                        ]={

                            known:true,
                            updated:Date.now()

                        };

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

    else if(v.distance>=35){

        score-=25;

    }

    else if(v.distance>=45){

        score-=40;

    }

    /* POINTS */

    if(
        v.points>=100 &&
        v.points<=500
    ){

        score+=10;

    }

    /* KNOWN */

    const known=
    TWM.state.known[
        v.id
    ]?.known===true;

    if(!known){

        score+=15;

    }

    /* BARB CLUSTER */

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

    score-=danger*6;

    score=
    TWM.Helpers.limit(
        score,
        0,
        100
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

        const barbRatio=
        s.barbs/
        Math.max(
            s.villages,
            1
        );

        const activeRatio=
        s.active/
        Math.max(
            s.players,
            1
        );

        const strongRatio=
        s.strong/
        Math.max(
            s.players,
            1
        );

        s.farmValue=
        Math.floor(
            barbRatio*100
        );

        s.warRisk=
        Math.floor(
            (
                activeRatio*50
            )+
            (
                strongRatio*50
            )
        );

        s.deadness=
        Math.floor(
            (
                barbRatio*100
            )-
            (
                activeRatio*50
            )
        );

        s.expansion=
        Math.floor(
            (
                barbRatio*70
            )-
            (
                strongRatio*30
            )
        );

        s.farmValue=
        TWM.Helpers.limit(
            s.farmValue,
            0,
            100
        );

        s.warRisk=
        TWM.Helpers.limit(
            s.warRisk,
            0,
            100
        );

        s.deadness=
        TWM.Helpers.limit(
            s.deadness,
            0,
            100
        );

        s.expansion=
        TWM.Helpers.limit(
            s.expansion,
            0,
            100
        );

        s.score=
        Math.floor(

            (
                s.farmValue*0.35
            )+
            (
                s.expansion*0.35
            )+
            (
                s.deadness*0.2
            )-
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

        width:'1350px',

        height:'750px',

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
TWMPRO AI CORE v4
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
align-items:center;
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

<select id="twm_sort">

<option value="score">
AI SCORE
</option>

<option value="distance">
DISTANCE
</option>

<option value="points">
POINTS
</option>

</select>

<select id="twm_filter">

<option value="all">
ALL
</option>

<option value="new">
NEW
</option>

<option value="known">
KNOWN
</option>

<option value="good">
GOOD+
</option>

</select>

<input
id="twm_search"
placeholder="search">

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
   FARM RENDER
========================================= */

TWM.UI.renderFarm=()=>{

    const content=
    document.querySelector(
        '#twm_content'
    );

    const sort=
    document.querySelector(
        '#twm_sort'
    ).value;

    const filter=
    document.querySelector(
        '#twm_filter'
    ).value;

    const search=
    document.querySelector(
        '#twm_search'
    ).value
    .toLowerCase();

    let data=
    TWM.state.villages
    .filter(v=>v.ai);

    /* FILTER */

    data=data.filter(v=>{

        if(
            filter==='new' &&
            v.ai.known
        ){
            return false;
        }

        if(
            filter==='known' &&
            !v.ai.known
        ){
            return false;
        }

        if(
            filter==='good' &&
            v.ai.score<60
        ){
            return false;
        }

        if(
            search &&
            !(
                v.name
                .toLowerCase()
                .includes(search)
            )
        ){
            return false;
        }

        return true;

    });

    /* SORT */

    data.sort((a,b)=>{

        if(sort==='distance'){

            return(
                a.distance-
                b.distance
            );

        }

        if(sort==='points'){

            return(
                b.points-
                a.points
            );

        }

        return(
            b.ai.score-
            a.ai.score
        );

    });

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
   MAP RENDER
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

    TWM.state.currentTab='farm';

    TWM.UI.renderFarm();

};

document
.querySelector('#tab_map')
.onclick=()=>{

    TWM.state.currentTab='map';

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

    if(
        TWM.state.currentTab
        ==='map'
    ){

        TWM.UI.renderMap();

    }

    else{

        TWM.UI.renderFarm();

    }

    TWM.Helpers.status(
        'Loaded '+
        TWM.state.villages.length
    );

};

document
.querySelector('#twm_sort')
.onchange=()=>{

    TWM.UI.renderFarm();

};

document
.querySelector('#twm_filter')
.onchange=()=>{

    TWM.UI.renderFarm();

};

document
.querySelector('#twm_search')
.oninput=()=>{

    TWM.UI.renderFarm();

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

    clearInterval(
        TWM.state.timer
    );

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
