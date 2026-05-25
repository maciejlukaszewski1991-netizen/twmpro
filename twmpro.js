/* =========================================================
   TWMPRO AI CORE v29
   REAL AI EXPANSION BUILD
========================================================= */

/* =========================================================
   NEW MODULES v29
=========================================================

✅ REAL DIPLOMACY ENGINE
✅ REAL FARM ENGINE
✅ RA/RO/RW ENGINE
✅ PLAYER PROFILER AI
✅ REAL TARGET AI
✅ REPORT MEMORY
✅ KNOWN/UNKNOWN ENGINE
✅ ACTIVITY TRACKING
✅ STORAGE CACHE
✅ MAP OVERLAY
✅ INTEL DATABASE
✅ DEAD ACCOUNT AI
✅ FRONTLINE AI 2.0

========================================================= */

/* =========================================================
   PLAYER INTEL DATABASE
========================================================= */

TWM.state.intel={};

TWM.AI.initIntel=()=>{

    try{

        const raw=
        localStorage.getItem(
            'TWMPRO_INTEL'
        );

        if(raw){

            TWM.state.intel=
            JSON.parse(raw);

        }

    }catch(e){

        console.error(e);

    }

};

TWM.AI.saveIntel=()=>{

    localStorage.setItem(

        'TWMPRO_INTEL',

        JSON.stringify(
            TWM.state.intel
        )

    );

};

/* =========================================================
   REAL FARM ENGINE
========================================================= */

TWM.AI.scanPlayerRanking=
async(player)=>{

    try{

        if(
            TWM.state.intel[
                player.name
            ]?.lastUpdate
        ){

            const diff=

                Date.now()-

                TWM.state.intel[
                    player.name
                ].lastUpdate;

            if(diff<21600000){

                return;

            }

        }

        const result={

            loot:0,

            scavenge:0,

            lootVillages:0,

            ra:0,

            ro:0,

            rw:0

        };

        /* =================================================
           LOOT
        ================================================= */

        const lootHtml=
        await fetch(

            '/game.php?screen=ranking&mode=in_a_day&type=loot_res&name='+

            encodeURIComponent(
                player.name
            )

        ).then(r=>r.text());

        const lootDoc=
        new DOMParser()
        .parseFromString(
            lootHtml,
            'text/html'
        );

        result.loot=
        parseInt(

            lootDoc

            .querySelector(
                '#in_a_day_ranking_table tr:nth-child(2) td:nth-child(4)'
            )

            ?.innerText

            ?.replace(/\./g,'')

        )||0;

        /* =================================================
           SCAVENGE
        ================================================= */

        const scavHtml=
        await fetch(

            '/game.php?screen=ranking&mode=in_a_day&type=scavenge&name='+

            encodeURIComponent(
                player.name
            )

        ).then(r=>r.text());

        const scavDoc=
        new DOMParser()
        .parseFromString(
            scavHtml,
            'text/html'
        );

        result.scavenge=
        parseInt(

            scavDoc

            .querySelector(
                '#in_a_day_ranking_table tr:nth-child(2) td:nth-child(4)'
            )

            ?.innerText

            ?.replace(/\./g,'')

        )||0;

        /* =================================================
           LOOTED VILLAGES
        ================================================= */

        const vilHtml=
        await fetch(

            '/game.php?screen=ranking&mode=in_a_day&type=loot_vil&name='+

            encodeURIComponent(
                player.name
            )

        ).then(r=>r.text());

        const vilDoc=
        new DOMParser()
        .parseFromString(
            vilHtml,
            'text/html'
        );

        result.lootVillages=
        parseInt(

            vilDoc

            .querySelector(
                '#in_a_day_ranking_table tr:nth-child(2) td:nth-child(4)'
            )

            ?.innerText

            ?.replace(/\./g,'')

        )||0;

        /* =================================================
           RA
        ================================================= */

        const raHtml=
        await fetch(

            '/game.php?screen=ranking&mode=kill_player&name='+

            encodeURIComponent(
                player.name
            )

        ).then(r=>r.text());

        const raDoc=
        new DOMParser()
        .parseFromString(
            raHtml,
            'text/html'
        );

        result.ra=
        parseInt(

            raDoc

            .querySelector(
                '#kill_player_ranking_table + table tr:nth-child(2) td:nth-child(4)'
            )

            ?.innerText

            ?.replace(/\./g,'')

        )||0;

        /* =================================================
           RO
        ================================================= */

        const roHtml=
        await fetch(

            '/game.php?screen=ranking&mode=kill_player&type=def&name='+

            encodeURIComponent(
                player.name
            )

        ).then(r=>r.text());

        const roDoc=
        new DOMParser()
        .parseFromString(
            roHtml,
            'text/html'
        );

        result.ro=
        parseInt(

            roDoc

            .querySelector(
                '#kill_player_ranking_table + table tr:nth-child(2) td:nth-child(4)'
            )

            ?.innerText

            ?.replace(/\./g,'')

        )||0;

        /* =================================================
           RW
        ================================================= */

        const rwHtml=
        await fetch(

            '/game.php?screen=ranking&mode=kill_player&type=support&name='+

            encodeURIComponent(
                player.name
            )

        ).then(r=>r.text());

        const rwDoc=
        new DOMParser()
        .parseFromString(
            rwHtml,
            'text/html'
        );

        result.rw=
        parseInt(

            rwDoc

            .querySelector(
                '#kill_player_ranking_table + table tr:nth-child(2) td:nth-child(4)'
            )

            ?.innerText

            ?.replace(/\./g,'')

        )||0;

        /* =================================================
           SAVE
        ================================================= */

        TWM.state.intel[
            player.name
        ]={

            ...result,

            lastUpdate:
            Date.now()

        };

        Object.assign(
            player,
            result
        );

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   PLAYER PROFILER AI
========================================================= */

TWM.AI.profilePlayer=
(player)=>{

    let profile='CASUAL';

    const totalFarm=

        player.loot+
        player.scavenge;

    /* FARMER */

    if(
        totalFarm>10000000 &&
        player.ra<100000
    ){

        profile='FARMER';

    }

    /* AGGRESSOR */

    if(
        player.ra>500000
    ){

        profile='AGGRESSOR';

    }

    /* DEFENDER */

    if(
        player.ro>500000
    ){

        profile='DEFENDER';

    }

    /* SUPPORT */

    if(
        player.rw>500000
    ){

        profile='SUPPORT';

    }

    /* WAR PLAYER */

    if(
        player.ra>300000 &&
        player.ro>300000
    ){

        profile='WAR_PLAYER';

    }

    /* DEAD */

    if(
        totalFarm<10000 &&
        player.ra<1000 &&
        player.ro<1000
    ){

        profile='DEAD';

    }

    player.profile=
    profile;

};

/* =========================================================
   REAL TARGET AI
========================================================= */

TWM.AI.calculateTarget=
(v)=>{

    if(!v.player)return;

    let score=0;

    /* RELATION */

    if(
        v.player.relation==='enemy'
    ){

        score+=100;

    }

    if(
        v.player.relation==='neutral'
    ){

        score+=40;

    }

    if(
        v.player.relation==='ally'
    ){

        score-=999;

    }

    if(
        v.player.relation==='own'
    ){

        score-=999;

    }

    /* PROFILE */

    if(
        v.player.profile==='DEAD'
    ){

        score+=120;

    }

    if(
        v.player.profile==='FARMER'
    ){

        score+=80;

    }

    if(
        v.player.profile==='CASUAL'
    ){

        score+=30;

    }

    if(
        v.player.profile==='WAR_PLAYER'
    ){

        score-=60;

    }

    /* FRONTLINE */

    if(v.frontline){

        score+=40;

    }

    /* LOW POINTS */

    if(v.points<5000){

        score+=30;

    }

    /* DISTANCE */

    const my=
    TWM.Helpers.coord(
        game_data.village.coord
    );

    const dist=
    TWM.Helpers.distance(

        my.x,
        my.y,

        v.x,
        v.y

    );

    if(dist<10){

        score+=40;

    }

    else if(dist<20){

        score+=20;

    }

    else if(dist>50){

        score-=50;

    }

    /* KNOWN */

    if(
        TWM.state.knownCoords[
            v.coord
        ]
    ){

        score+=25;

    }

    v.targetScore=
    Math.floor(score);

};

/* =========================================================
   REPORT MEMORY
========================================================= */

TWM.AI.saveReport=
(report)=>{

    if(!report.coord)return;

    if(
        !TWM.state.intel[
            report.coord
        ]
    ){

        TWM.state.intel[
            report.coord
        ]={};

    }

    if(
        !TWM.state.intel[
            report.coord
        ].reports
    ){

        TWM.state.intel[
            report.coord
        ].reports=[];

    }

    TWM.state.intel[
        report.coord
    ].reports.push({

        time:Date.now(),

        attack:report.attack,

        support:report.support,

        spy:report.spy

    });

};

/* =========================================================
   KNOWN / UNKNOWN ENGINE
========================================================= */

TWM.AI.markKnown=
(coord)=>{

    TWM.state.knownCoords[
        coord
    ]=Date.now();

};

TWM.AI.isKnown=
(coord)=>{

    return !!TWM.state.knownCoords[
        coord
    ];

};

/* =========================================================
   DEAD ACCOUNT AI
========================================================= */

TWM.AI.detectDead=
(player)=>{

    const intel=
    TWM.state.intel[
        player.name
    ];

    if(!intel)return false;

    const farm=

        intel.loot+
        intel.scavenge;

    if(
        farm<5000 &&
        intel.ra<1000 &&
        intel.ro<1000 &&
        player.villages<5
    ){

        return true;

    }

    return false;

};

/* =========================================================
   FRONTLINE AI 2.0
========================================================= */

TWM.AI.calculateDanger=
(v)=>{

    let enemy=0;

    let ally=0;

    let enemyPoints=0;

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
            o.player.relation==='enemy'
        ){

            enemy++;

            enemyPoints+=
            o.player.points;

        }

        if(
            o.player.relation==='ally'
        ){

            ally++;

        }

    });

    v.danger=

        enemy*15 +

        enemyPoints/10000 -

        ally*5;

    v.frontline=
    v.danger>50;

};

/* =========================================================
   MAP OVERLAY
========================================================= */

TWM.AI.overlay=
()=>{

    $('.map_sector .village')
    .each(function(){

        const coord=
        $(this)
        .attr('data-id');

        if(!coord)return;

        const v=
        TWM.state.villages.find(x=>

            x.coord===coord

        );

        if(!v)return;

        $(this).css(
            'outline',
            ''
        );

        if(v.frontline){

            $(this).css(
                'outline',
                '2px solid red'
            );

        }

        if(
            v.targetScore>150
        ){

            $(this).css(
                'outline',
                '2px solid purple'
            );

        }

    });

};

/* =========================================================
   PLAYER TABLE v29
========================================================= */

TWM.UI.renderPlayers=
()=>{

    const players=
    Object.values(
        TWM.state.players
    )

    .sort((a,b)=>

        (b.targetScore||0)-
        (a.targetScore||0)

    )

    .slice(0,200);

    let html=`

    <h2>👤 PLAYER AI v29</h2>

    <table class="vis" width="100%">

    <tr>

    <th>GRACZ</th>
    <th>REL</th>
    <th>PROFIL</th>
    <th>RA</th>
    <th>RO</th>
    <th>RW</th>
    <th>FARMA</th>
    <th>ZBIERACTWO</th>

    </tr>

    `;

    players.forEach(p=>{

        html+=`

        <tr>

        <td>${p.name}</td>

        <td>${p.relation}</td>

        <td>${p.profile||'-'}</td>

        <td>${p.ra||0}</td>

        <td>${p.ro||0}</td>

        <td>${p.rw||0}</td>

        <td>${p.loot||0}</td>

        <td>${p.scavenge||0}</td>

        </tr>

        `;

    });

    html+=`</table>`;

    $('#twm_content').html(
        html
    );

};
