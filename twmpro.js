/* =========================================
   TWMPRO AI MAP ENGINE v1
   DODAJ POD:
   TWM.AI={}
========================================= */

/* =========================================
   MAP AI
========================================= */

TWM.AI.Map={};

/* =========================================
   SECTOR STORAGE
========================================= */

TWM.AI.Map.sectors={};

/* =========================================
   GET CONTINENT
========================================= */

TWM.AI.Map.getContinent=
(x,y)=>{

    return Math.floor(y/100)+
    ''+
    Math.floor(x/100);

};

/* =========================================
   ANALYZE MAP
========================================= */

TWM.AI.Map.run=()=>{

    TWM.AI.Map.sectors={};

    /* =====================================
       BUILD SECTORS
    ===================================== */

    TWM.state.villages
    .forEach(v=>{

        const k=
        TWM.AI.Map.getContinent(
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

                activePlayers:0,

                strongPlayers:0,

                avgPoints:0,

                totalPoints:0,

                danger:0,

                farm:0,

                growth:0,

                score:0

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

        /* BARB */

        if(!p){

            s.barbs++;

        }

        /* PLAYER */

        else{

            s.players++;

            /* ACTIVE */

            if(
                p.points>5000
            ){

                s.activePlayers++;

            }

            /* STRONG */

            if(
                p.points>25000
            ){

                s.strongPlayers++;

            }

        }

    });

    /* =====================================
       CALCULATE AI
    ===================================== */

    Object.values(
        TWM.AI.Map.sectors
    )
    .forEach(s=>{

        /* AVG */

        s.avgPoints=
        Math.floor(

            s.totalPoints/
            Math.max(
                s.villages,
                1
            )

        );

        /* =================================
           FARM SCORE
        ================================= */

        let farm=0;

        farm+=
        s.barbs*2;

        farm-=
        s.strongPlayers*10;

        farm-=
        s.activePlayers*2;

        s.farm=
        Math.max(
            0,
            Math.min(
                farm,
                100
            )
        );

        /* =================================
           DANGER
        ================================= */

        let danger=0;

        danger+=
        s.strongPlayers*15;

        danger+=
        s.activePlayers*4;

        s.danger=
        Math.max(
            0,
            Math.min(
                danger,
                100
            )
        );

        /* =================================
           GROWTH
        ================================= */

        let growth=0;

        growth+=
        s.players;

        growth+=
        s.activePlayers*2;

        growth+=
        s.avgPoints/1000;

        s.growth=
        Math.floor(growth);

        /* =================================
           FINAL SCORE
        ================================= */

        let score=0;

        score+=s.farm;

        score-=s.danger;

        score+=s.growth;

        s.score=
        Math.floor(score);

        /* =================================
           AI STATUS
        ================================= */

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
   MAP AI TAB
========================================= */

TWM.UI.renderMapAI=()=>{

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

<div style="
padding:10px;
font-size:14px;
font-weight:bold;
">

🗺 AI MAP ANALYSIS

</div>

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
${s.activePlayers}
</td>

<td>
${s.strongPlayers}
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
   PODMIEŃ:
   TWM.AI.run=()=>{
========================================= */

TWM.AI.run=()=>{

    /* FARM AI */

    TWM.state.villages
    .forEach(v=>{

        v.ai=
        TWM.AI.analyzeBarb(v);

    });

    /* MAP AI */

    TWM.AI.Map.run();

};

/* =========================================
   DODAJ EVENT:
   POD:
   twm_scan
========================================= */

document
.querySelector('#tab_map')
.onclick=()=>{

    TWM.UI.renderMapAI();

};

/* =========================================
   DODAJ EVENT:
========================================= */

document
.querySelector('#tab_farm')
.onclick=()=>{

    TWM.UI.renderFarm();

};
