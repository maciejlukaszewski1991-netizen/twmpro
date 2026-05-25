(async()=>{

'use strict';

/* =========================================
   TWMPRO AI CORE v6
   PLAYER INTELLIGENCE EDITION
========================================= */

/* =========================================
   MAP CHECK
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

    storage:'TWMAI_V6',

    radius:60,

    refresh:120000,

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

    myVillages:[],

    known:{},

    playerAI:{},

    currentTab:'players',

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

/* =========================================
   DATA
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
   MY VILLAGES
========================================= */

TWM.Data.loadMyVillages=()=>{

    TWM.state.myVillages=[];

    $('#production_table tr.nowrap')
    .each(function(){

        const village=
        $(this)
        .find('.quickedit-label')
        .text()
        .trim();

        const match=
        village.match(
            /(\d+\|\d+)/
        );

        if(!match)return;

        const coord=
        match[1];

        const c=
        TWM.Helpers.coord(
            coord
        );

        let role='🏰 MAIN';

        const lower=
        village.toLowerCase();

        if(
            lower.includes('off')
        ){

            role='⚔ OFF';

        }

        else if(
            lower.includes('def')
        ){

            role='🛡 DEF';

        }

        else if(
            lower.includes('farm')
        ){

            role='🌾 FARM';

        }

        else if(
            lower.includes('snob') ||
            lower.includes('noble')
        ){

            role='👑 NOBLE';

        }

        TWM.state.myVillages.push({

            name:village,

            x:c.x,
            y:c.y,

            role

        });

    });

    /* FALLBACK */

    if(
        TWM.state.myVillages.length===0
    ){

        const c=
        TWM.Helpers.coord(
            game_data.village.coord
        );

        TWM.state.myVillages.push({

            name:
            game_data.village.name,

            x:c.x,
            y:c.y,

            role:'🏰 CURRENT'

        });

    }

};

/* =========================================
   VILLAGES
========================================= */

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

            name:v[1],

            x,
            y,

            playerId:v[4],

            points:+v[5],

            distance:nearest

        });

    });

};

/* =========================================
   IMPORT KNOWN
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

                [
                    ...doc.querySelectorAll('a')
                ]
                .forEach(a=>{

                    const href=
                    a.href||'';

                    let m=
                    href.match(
                        /target=(\d+)/
                    );

                    if(m){

                        TWM.state.known[
                            m[1]
                        ]=true;

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
   PLAYER AI
========================================= */

TWM.AI={};

TWM.AI.runPlayers=()=>{

    TWM.state.playerAI={};

    TWM.state.villages
    .forEach(v=>{

        const p=
        TWM.state.players[
            v.playerId
        ];

        if(!p)return;

        if(
            p.name===game_data.player.name
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

                villages:0,

                points:p.points,

                nearest:999,

                nearbyBarbs:0,

                nearbyPlayers:0,

                morale:100,

                conquer:0,

                status:'',

                role:''

            };

        }

        const ai=
        TWM.state.playerAI[
            p.id
        ];

        ai.villages++;

        if(
            v.distance<ai.nearest
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

        /* MORALE */

        const myPoints=
        game_data.player.points;

        if(
            ai.points>
            myPoints
        ){

            ai.morale=
            Math.max(

                20,

                Math.floor(

                    (
                        myPoints/
                        ai.points
                    )*100

                )

            );

        }

        else{

            ai.morale=100;

        }

        /* BARBS AROUND */

        TWM.state.villages
        .forEach(v=>{

            const d=
            TWM.Helpers.distance(

                v.x,
                v.y,

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

            else{

                ai.nearbyPlayers++;

            }

        });

        /* CONQUER SCORE */

        let score=50;

        /* DIST */

        if(ai.nearest<=5){

            score+=30;

        }

        else if(
            ai.nearest<=10
        ){

            score+=20;

        }

        else if(
            ai.nearest<=20
        ){

            score+=10;

        }

        else{

            score-=20;

        }

        /* MORALE */

        if(ai.morale>=100){

            score+=25;

        }

        else if(
            ai.morale<50
        ){

            score-=40;

        }

        /* PLAYER SIZE */

        if(ai.points<5000){

            score+=20;

        }

        else if(
            ai.points>100000
        ){

            score-=40;

        }

        /* BARBS */

        score+=Math.min(
            ai.nearbyBarbs,
            10
        );

        score=
        TWM.Helpers.limit(
            score,
            0,
            100
        );

        ai.conquer=score;

        /* STATUS */

        ai.status='⚔ CONTESTED';

        if(score>=80){

            ai.status=
            '🔥 EASY TARGET';

        }

        else if(
            score>=60
        ){

            ai.status=
            '🟡 GOOD TARGET';

        }

        else if(
            score<40
        ){

            ai.status=
            '🛡 HARD TARGET';

        }

        /* ROLE */

        ai.role='🌾 FARMER';

        if(ai.points>50000){

            ai.role='⚔ AGGRESSIVE';

        }

        if(ai.points<5000){

            ai.role='💤 INACTIVE';

        }

    });

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

        width:'1450px',

        height:'780px',

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
TWMPRO AI CORE v6
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

<option value="conquer">
CONQUER
</option>

<option value="distance">
DISTANCE
</option>

<option value="points">
POINTS
</option>

</select>

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
   PLAYERS TAB
========================================= */

TWM.UI.renderPlayers=()=>{

    const content=
    document.querySelector(
        '#twm_content'
    );

    const sort=
    $('#twm_sort').val();

    let data=
    Object.values(
        TWM.state.playerAI
    );

    /* SORT */

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
<th>ALLY</th>
<th>POINTS</th>
<th>VILLS</th>
<th>DIST</th>
<th>MORALE</th>
<th>CONQUER</th>
<th>ROLE</th>
<th>STATUS</th>

</tr>

`;

    data.forEach(p=>{

        let bg='#f8eed1';

        if(
            p.conquer>=80
        ){

            bg='#8fd18f';

        }

        else if(
            p.conquer>=60
        ){

            bg='#cfe6b8';

        }

        else if(
            p.conquer<40
        ){

            bg='#f5b3b3';

        }

        html+=`

<tr style="
background:${bg};
border-bottom:1px solid #c4a46a;
">

<td>
${p.name}
</td>

<td>
${p.ally}
</td>

<td>
${p.points}
</td>

<td>
${p.villages}
</td>

<td>
${p.nearest.toFixed(1)}
</td>

<td>
${p.morale}%
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

/* =========================================
   BARBS TAB
========================================= */

TWM.UI.renderBarbs=()=>{

    const content=
    document.querySelector(
        '#twm_content'
    );

    const data=
    TWM.state.villages
    .filter(v=>

        !TWM.state.players[
            v.playerId
        ]

    )
    .sort((a,b)=>

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
">

<th>COORD</th>
<th>DIST</th>
<th>PTS</th>
<th>STATUS</th>

</tr>

`;

    data.forEach(v=>{

        const known=
        TWM.state.known[
            v.id
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

${
known
?'🟡 KNOWN'
:'🟢 UNKNOWN'
}

</td>

</tr>

`;

    });

    html+=`</table>`;

    content.innerHTML=html;

};

/* =========================================
   EMPIRE TAB
========================================= */

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
">

<th>ROLE</th>
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
${v.role}
</td>

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

/* =========================================
   EVENTS
========================================= */

$('#tab_players').on('click',()=>{

    TWM.UI.renderPlayers();

});

$('#tab_barbs').on('click',()=>{

    TWM.UI.renderBarbs();

});

$('#tab_empire').on('click',()=>{

    TWM.UI.renderEmpire();

});

$('#twm_sort').on('change',()=>{

    TWM.UI.renderPlayers();

});

$('#twm_scan').on('click',async()=>{

    TWM.Helpers.status(
        'Scanning...'
    );

    await TWM.Import.run();

    await TWM.Data.loadPlayers();

    await TWM.Data.loadAllies();

    TWM.Data.loadMyVillages();

    await TWM.Data.loadVillages();

    TWM.AI.runPlayers();

    TWM.UI.renderPlayers();

    TWM.Helpers.status(

        'Loaded '+
        TWM.state.villages.length+
        ' villages'

    );

});

/* =========================================
   AUTO REFRESH
========================================= */

TWM.state.timer=
setInterval(async()=>{

    try{

        await TWM.Import.run();

        TWM.Data.loadMyVillages();

        await TWM.Data.loadVillages();

        TWM.AI.runPlayers();

    }catch(e){

        console.error(e);

    }

},
TWM.config.refresh);

/* =========================================
   CLOSE
========================================= */

$('#twm_close').on('click',()=>{

    clearInterval(
        TWM.state.timer
    );

    TWM.UI.panel.remove();

    TWM.UI.float.remove();

    delete window.TWMAI;

});

/* =========================================
   DRAG
========================================= */

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
    e.clientX-ox+'px';

    TWM.UI.panel.style.top=
    e.clientY-oy+'px';

});

/* =========================================
   INIT
========================================= */

TWM.Memory.load();

await TWM.Import.run();

await TWM.Data.loadPlayers();

await TWM.Data.loadAllies();

TWM.Data.loadMyVillages();

await TWM.Data.loadVillages();

TWM.AI.runPlayers();

TWM.UI.renderPlayers();

TWM.Helpers.status(

    'Loaded '+
    TWM.state.villages.length+
    ' villages'

);

})();
