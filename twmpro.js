(async()=>{

'use strict';

/* =========================================================
   TWMPRO AI CORE v9
   FULL REBUILD
   STABLE KNOWN / UNKNOWN
   REAL DIPLOMACY
========================================================= */

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

if(window.TWMAI_V9){

    window.TWMAI_V9.open();

    return;

}

window.TWMAI_V9={};

const TWM=window.TWMAI_V9;

/* =========================================================
   CONFIG
========================================================= */

TWM.config={

    radius:60,

    refresh:120000,

    width:1500,

    height:820,

    /* =====================================
       DIPLOMACY
    ===================================== */

    allies:[

        'A-J',
        'TRN'

    ],

    enemies:[

        'XYZ'

    ]

};

/* =========================================================
   STATE
========================================================= */

TWM.state={

    villages:[],

    players:{},

    allies:{},

    myVillages:[],

    playerAI:{},

    knownCoords:{},

    currentTab:'players',

    autoRefresh:null

};

/* =========================================================
   STORAGE
========================================================= */

TWM.Storage={};

TWM.Storage.load=()=>{

    try{

        const raw=
        localStorage.getItem(
            'TWMAI_V9'
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

    localStorage.setItem(

        'TWMAI_V9',

        JSON.stringify({

            knownCoords:
            TWM.state.knownCoords

        })

    );

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

/* =========================================================
   UI
========================================================= */

TWM.UI={};

/* =========================================================
   FLOAT BUTTON
========================================================= */

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

/* =========================================================
   PANEL
========================================================= */

TWM.UI.panel=
document.createElement('div');

Object.assign(

    TWM.UI.panel.style,

    {

        position:'fixed',

        left:'100px',
        top:'40px',

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
TWMPRO AI CORE v9
</div>

<div>

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
align-items:center;
border-bottom:1px solid #7a5b2e;
">

<button id="tab_players">
👤 PLAYERS
</button>

<button id="tab_barbs">
🌾 BARBS
</button>

<button id="tab_empire">
🏰 EMPIRE
</button>

<button id="twm_scan">
SCAN
</button>

<select id="twm_sort">

<option value="distance">
DISTANCE
</option>

<option value="points">
POINTS
</option>

<option value="conquer">
CONQUER
</option>

</select>

<select id="twm_filter">

<option value="all">
ALL
</option>

<option value="unknown">
UNKNOWN
</option>

<option value="known">
KNOWN
</option>

<option value="easy">
EASY TARGETS
</option>

</select>

<input
id="twm_search"
placeholder="search"
style="width:180px;">

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

/* =========================================================
   OPEN / CLOSE
========================================================= */

TWM.open=()=>{

    TWM.UI.panel.style.display=
    'flex';

};

TWM.close=()=>{

    TWM.UI.panel.style.display=
    'none';

};

TWM.UI.float.onclick=()=>{

    if(
        TWM.UI.panel.style.display
        ==='none'
    ){

        TWM.open();

    }

    else{

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

    TWM.UI.panel.remove();

    TWM.UI.float.remove();

    delete window.TWMAI_V9;

});

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
   DATA
========================================================= */

TWM.Data={};

/* =========================================================
   PLAYERS
========================================================= */

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

/* =========================================================
   ALLIES
========================================================= */

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

            tag:
            decodeURIComponent(a[2]||'-')

        };

    });

};

/* =========================================================
   MY VILLAGES
========================================================= */

TWM.Data.loadMyVillages=()=>{

    TWM.state.myVillages=[];

    const c=
    TWM.Helpers.coord(
        game_data.village.coord
    );

    TWM.state.myVillages.push({

        x:c.x,
        y:c.y,

        name:
        game_data.village.name

    });

};

/* =========================================================
   VILLAGES
========================================================= */

TWM.Data.loadVillages=
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

        const x=+v[2];
        const y=+v[3];

        let nearest=999;

        TWM.state.myVillages
        .forEach(my=>{

            const d=
            TWM.Helpers.distance(

                my.x,
                my.y,

                x,
                y

            );

            if(d<nearest){

                nearest=d;

            }

        });

        if(
            nearest>TWM.config.radius
        )return;

        TWM.state.villages.push({

            id:v[0],

            x,
            y,

            coord:
            x+'|'+y,

            playerId:v[4],

            points:+v[5],

            distance:nearest

        });

    });

};

/* =========================================================
   IMPORT KNOWN COORDS
========================================================= */

TWM.Import={};

TWM.Import.run=
async()=>{

    const pages=[

        '/game.php?village='+
        game_data.village.id+
        '&screen=report',

        '/game.php?village='+
        game_data.village.id+
        '&screen=am_farm',

        '/game.php?village='+
        game_data.village.id+
        '&screen=place'

    ];

    for(const url of pages){

        try{

            const html=
            await fetch(url)
            .then(r=>r.text());

            const coords=
            html.match(
                /\d+\|\d+/g
            )||[];

            coords.forEach(c=>{

                TWM.state.knownCoords[
                    c
                ]=true;

            });

        }catch(e){

            console.error(e);

        }

    }

    console.log(

        'TWM known:',
        Object.keys(
            TWM.state.knownCoords
        ).length

    );

    TWM.Storage.save();

};

/* =========================================================
   PLAYER AI
========================================================= */

TWM.AI={};

TWM.AI.runPlayers=()=>{

    TWM.state.playerAI={};

    const myPlayer=
    TWM.state.players[
        game_data.player.id
    ];

    const myAllyId=
    myPlayer?.ally||'0';

    const myTribe=
    TWM.state.allies[
        myAllyId
    ]?.tag||'-';

    /* BUILD */

    TWM.state.villages
    .forEach(v=>{

        const p=
        TWM.state.players[
            v.playerId
        ];

        if(!p)return;

        if(
            p.name===
            game_data.player.name
        )return;

        if(
            !TWM.state.playerAI[
                p.id
            ]
        ){

            TWM.state.playerAI[
                p.id
            ]={

                id:p.id,

                name:p.name,

                ally:
                TWM.state.allies[
                    p.ally
                ]?.tag||'-',

                villages:[],

                points:p.points,

                nearest:999,

                nearbyBarbs:0,

                nearbyPlayers:0,

                morale:100,

                conquer:0,

                role:'',

                status:'',

                relation:'NEUTRAL',

                relationIcon:'⚪',

                relationColor:'#f8eed1'

            };

        }

        const ai=
        TWM.state.playerAI[
            p.id
        ];

        ai.villages.push(v);

        if(
            v.distance<
            ai.nearest
        ){

            ai.nearest=
            v.distance;

        }

    });

    /* ANALYZE */

    Object.values(
        TWM.state.playerAI
    )
    .forEach(ai=>{

        ai.villages.forEach(pv=>{

            TWM.state.villages
            .forEach(v=>{

                if(v.id===pv.id)return;

                const d=
                TWM.Helpers.distance(

                    pv.x,
                    pv.y,

                    v.x,
                    v.y

                );

                if(d>8)return;

                const p=
                TWM.state.players[
                    v.playerId
                ];

                if(!p){

                    ai.nearbyBarbs++;

                }

                else if(
                    p.id!=ai.id
                ){

                    ai.nearbyPlayers++;

                }

            });

        });

        /* MORALE */

        if(
            ai.points>
            game_data.player.points
        ){

            ai.morale=
            Math.max(

                20,

                Math.floor(

                    (
                        game_data.player.points/
                        ai.points
                    )*100

                )

            );

        }

        else{

            ai.morale=100;

        }

        /* SCORE */

        let score=50;

        if(ai.nearest<=5){

            score+=30;

        }

        else if(
            ai.nearest<=10
        ){

            score+=20;

        }

        else{

            score-=10;

        }

        score+=Math.min(
            ai.nearbyBarbs,
            10
        );

        score-=
        ai.nearbyPlayers*2;

        if(ai.points<5000){

            score+=20;

        }

        if(ai.points>100000){

            score-=40;

        }

        if(ai.morale<50){

            score-=40;

        }

        ai.conquer=
        TWM.Helpers.limit(
            Math.floor(score),
            0,
            100
        );

        /* ROLE */

        ai.role='🌾 FARMER';

        if(
            ai.points<5000 &&
            ai.villages.length<=2
        ){

            ai.role='💤 INACTIVE';

        }

        if(
            ai.nearbyPlayers>
            ai.nearbyBarbs
        ){

            ai.role='🛡 FRONTLINE';

        }

        if(ai.points>50000){

            ai.role='⚔ AGGRESSIVE';

        }

        /* STATUS */

        ai.status='⚔ CONTESTED';

        if(ai.conquer>=80){

            ai.status=
            '🔥 EASY TARGET';

        }

        else if(
            ai.conquer>=60
        ){

            ai.status=
            '🟡 GOOD TARGET';

        }

        else if(
            ai.conquer<40
        ){

            ai.status=
            '🛡 HARD TARGET';

        }

        /* DIPLOMACY */

        if(
            ai.ally===myTribe
        ){

            ai.relation='TRIBE';

            ai.relationIcon='🟦';

            ai.relationColor='#b8d4ff';

        }

        else if(

            TWM.config.allies.includes(
                ai.ally
            )

        ){

            ai.relation='ALLY';

            ai.relationIcon='🟩';

            ai.relationColor='#c7f0c2';

        }

        else if(

            TWM.config.enemies.includes(
                ai.ally
            )

        ){

            ai.relation='ENEMY';

            ai.relationIcon='🟥';

            ai.relationColor='#f4b6b6';

        }

    });

};

/* =========================================================
   PLAYERS TAB
========================================================= */

TWM.UI.renderPlayers=()=>{

    const content=
    document.querySelector(
        '#twm_content'
    );

    const sort=
    $('#twm_sort').val();

    const search=
    $('#twm_search')
    .val()
    .toLowerCase();

    const filter=
    $('#twm_filter').val();

    let data=
    Object.values(
        TWM.state.playerAI
    );

    if(search){

        data=data.filter(p=>

            p.name
            .toLowerCase()
            .includes(search)

        );

    }

    if(filter==='easy'){

        data=data.filter(p=>

            p.conquer>=80

        );

    }

    data.sort((a,b)=>{

        if(sort==='distance'){

            return(
                a.nearest-
                b.nearest
            );

        }

        if(sort==='points'){

            return(
                b.points-
                a.points
            );

        }

        return(
            b.conquer-
            a.conquer
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

<th>PLAYER</th>
<th>REL</th>
<th>ALLY</th>
<th>POINTS</th>
<th>VILLS</th>
<th>DIST</th>
<th>MORALE</th>
<th>BARBS</th>
<th>PLAYERS</th>
<th>CONQUER</th>
<th>ROLE</th>
<th>STATUS</th>

</tr>

`;

    data.forEach(p=>{

        html+=`

<tr style="
background:${p.relationColor};
border-bottom:1px solid #c4a46a;
">

<td>
${p.name}
</td>

<td>
${p.relationIcon}
${p.relation}
</td>

<td>
${p.ally}
</td>

<td>
${p.points}
</td>

<td>
${p.villages.length}
</td>

<td>
${p.nearest.toFixed(1)}
</td>

<td>
${p.morale}%
</td>

<td>
${p.nearbyBarbs}
</td>

<td>
${p.nearbyPlayers}
</td>

<td>
${p.conquer}
</td>

<td>
${p.role}
</td>

<td>
${p.status}
</td>

</tr>

`;

    });

    html+=`</table>`;

    content.innerHTML=html;

};

/* =========================================================
   BARBS TAB
========================================================= */

TWM.UI.renderBarbs=()=>{

    const content=
    document.querySelector(
        '#twm_content'
    );

    const filter=
    $('#twm_filter').val();

    let data=
    TWM.state.villages
    .filter(v=>

        !TWM.state.players[
            v.playerId
        ]

    );

    if(filter==='unknown'){

        data=data.filter(v=>

            !TWM.state.knownCoords[
                v.coord
            ]

        );

    }

    if(filter==='known'){

        data=data.filter(v=>

            TWM.state.knownCoords[
                v.coord
            ]

        );

    }

    data.sort((a,b)=>

        a.distance-
        b.distance

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

<th>COORD</th>
<th>DIST</th>
<th>PTS</th>
<th>STATUS</th>
<th>ATTACK</th>

</tr>

`;

    data.forEach(v=>{

        const known=
        TWM.state.knownCoords[
            v.coord
        ]===true;

        html+=`

<tr style="
background:
${
known
?'#fff0b3'
:'#cfe6b8'
};
border-bottom:1px solid #c4a46a;
">

<td>
${v.coord}
</td>

<td>
${v.distance.toFixed(1)}
</td>

<td>
${v.points}
</td>

<td>

${
known
?'🟡 KNOWN'
:'🟢 UNKNOWN'
}

</td>

<td>

<a
href="/game.php?village=${game_data.village.id}&screen=place&target=${v.id}"
target="_blank">

⚔

</a>

</td>

</tr>

`;

    });

    html+=`</table>`;

    content.innerHTML=html;

};

/* =========================================================
   EMPIRE TAB
========================================================= */

TWM.UI.renderEmpire=()=>{

    const content=
    document.querySelector(
        '#twm_content'
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

<th>VILLAGE</th>
<th>COORD</th>

</tr>

`;

    TWM.state.myVillages
    .forEach(v=>{

        html+=`

<tr style="
background:#f8eed1;
border-bottom:1px solid #c4a46a;
">

<td>
${v.name}
</td>

<td>
${v.x}|${v.y}
</td>

</tr>

`;

    });

    html+=`</table>`;

    content.innerHTML=html;

};

/* =========================================================
   EVENTS
========================================================= */

$('#tab_players').on('click',()=>{

    TWM.state.currentTab=
    'players';

    TWM.UI.renderPlayers();

});

$('#tab_barbs').on('click',()=>{

    TWM.state.currentTab=
    'barbs';

    TWM.UI.renderBarbs();

});

$('#tab_empire').on('click',()=>{

    TWM.state.currentTab=
    'empire';

    TWM.UI.renderEmpire();

});

$('#twm_scan').on('click',async()=>{

    await TWM.run();

});

$('#twm_sort').on('change',()=>{

    TWM.UI.renderPlayers();

});

$('#twm_filter').on('change',()=>{

    if(
        TWM.state.currentTab==='players'
    ){

        TWM.UI.renderPlayers();

    }

    else{

        TWM.UI.renderBarbs();

    }

});

$('#twm_search').on('input',()=>{

    TWM.UI.renderPlayers();

});

/* =========================================================
   MAIN RUN
========================================================= */

TWM.run=
async()=>{

    try{

        TWM.Helpers.status(
            'Loading...'
        );

        await TWM.Import.run();

        await TWM.Data.loadPlayers();

        await TWM.Data.loadAllies();

        TWM.Data.loadMyVillages();

        await TWM.Data.loadVillages();

        TWM.AI.runPlayers();

        if(
            TWM.state.currentTab
            ==='players'
        ){

            TWM.UI.renderPlayers();

        }

        else if(
            TWM.state.currentTab
            ==='barbs'
        ){

            TWM.UI.renderBarbs();

        }

        else{

            TWM.UI.renderEmpire();

        }

        TWM.Helpers.status(

            'Loaded '+
            TWM.state.villages.length+
            ' villages'

        );

    }catch(e){

        console.error(e);

        TWM.Helpers.status(
            'Load error'
        );

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

TWM.Storage.load();

await TWM.run();

})();
