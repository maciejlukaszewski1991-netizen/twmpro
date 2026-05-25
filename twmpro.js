/* =========================================================
   TWMPRO AI OVERMIND v50 STABLE
   FULL FIXED BUILD
========================================================= */

(async()=>{

'use strict';

/* =========================================================
   INSTANCE
========================================================= */

if(window.TWMPRO_V50_STABLE){

    return;

}

window.TWMPRO_V50_STABLE={};

const TWM=window.TWMPRO_V50_STABLE;

/* =========================================================
   CONFIG
========================================================= */

TWM.config={

    version:'50 STABLE',

    refresh:120000,

    requestDelay:350,

    scanRadius:45,

    maxConcurrent:3,

    cacheHours:6,

    overlay:true,

    debug:false,

    storagePrefix:
    'TWMPRO_V50'

};

/* =========================================================
   STATE
========================================================= */

TWM.state={

    running:false,

    currentTab:'dashboard',

    queue:[],

    queueRunning:false,

    world:{},

    players:{},

    villages:{},

    diplomacy:{

        ally:[],
        nap:[],
        enemy:[]

    },

    reports:{},

    regions:{},

    cache:{},

    intel:{},

    logs:[],

    auto:null

};

/* =========================================================
   LOGGER
========================================================= */

TWM.log=(msg,data=null)=>{

    TWM.state.logs.push({

        time:Date.now(),

        msg,

        data

    });

    if(
        TWM.state.logs.length>500
    ){

        TWM.state.logs=
        TWM.state.logs.slice(-500);

    }

    if(TWM.config.debug){

        console.log(
            '[TWMPRO]',
            msg,
            data
        );

    }

};

/* =========================================================
   STORAGE
========================================================= */

TWM.Storage={};

TWM.Storage.key=(k)=>{

    return (

        TWM.config.storagePrefix+
        '_'+k

    );

};

TWM.Storage.save=
(k,v)=>{

    try{

        localStorage.setItem(

            TWM.Storage.key(k),

            JSON.stringify(v)

        );

    }catch(e){

        console.error(e);

    }

};

TWM.Storage.load=
(k,d=null)=>{

    try{

        const raw=
        localStorage.getItem(

            TWM.Storage.key(k)

        );

        if(!raw){

            return d;

        }

        return JSON.parse(raw);

    }catch(e){

        return d;

    }

};

/* =========================================================
   HELPERS
========================================================= */

TWM.Helpers={};

TWM.Helpers.sleep=
(ms)=>{

    return new Promise(r=>

        setTimeout(r,ms)

    );

};

TWM.Helpers.coord=
(txt)=>{

    if(!txt){

        return{

            x:0,
            y:0

        };

    }

    const p=
    txt.split('|');

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

TWM.Helpers.safe=
async(fn,name)=>{

    try{

        await fn();

    }catch(e){

        console.error(
            '[MODULE ERROR]',
            name,
            e
        );

    }

};

/* =========================================================
   REQUEST ENGINE
========================================================= */

TWM.Request={};

TWM.Request.fetch=
async(url,retry=0)=>{

    try{

        await TWM.Helpers.sleep(

            TWM.config.requestDelay

        );

        const r=
        await fetch(url);

        const txt=
        await r.text();

        if(
            txt.includes('<html') &&
            !txt.includes('screen=')
        ){

            throw 'INVALID RESPONSE';

        }

        return txt;

    }catch(e){

        if(retry<3){

            return await TWM.Request.fetch(

                url,
                retry+1

            );

        }

        throw e;

    }

};

/* =========================================================
   UI
========================================================= */

TWM.UI={};

TWM.UI.panel=
$(`

<div id="twm_panel"
style="
position:fixed;
top:20px;
left:20px;
width:1200px;
height:700px;
background:#f4e4bc;
border:2px solid #6b4d24;
z-index:999999;
display:flex;
flex-direction:column;
font-size:11px;
font-family:Verdana;
border-radius:8px;
overflow:hidden;
">

<div style="
background:#6b4d24;
color:#fff;
padding:8px;
font-weight:bold;
display:flex;
justify-content:space-between;
">

<div>
🧠 TWMPRO AI OVERMIND v50
</div>

<div>

<button id="twm_close">
X
</button>

</div>

</div>

<div style="
padding:6px;
display:flex;
gap:4px;
flex-wrap:wrap;
background:#e6d3a3;
">

<button data-tab="dashboard">
🏠
</button>

<button data-tab="players">
👤
</button>

<button data-tab="war">
⚔
</button>

<button data-tab="heatmap">
🔥
</button>

<button data-tab="economy">
💰
</button>

<button data-tab="reports">
📜
</button>

<button id="twm_scan">
🔍 SCAN
</button>

</div>

<div id="twm_status"
style="
padding:4px;
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
padding:8px;
background:#f8eed1;
">

</div>

</div>

`);

$('body').append(
    TWM.UI.panel
);

/* =========================================================
   CLOSE
========================================================= */

$('#twm_close').on('click',()=>{

    clearInterval(
        TWM.state.auto
    );

    $('#twm_panel').remove();

    delete window.TWMPRO_V50_STABLE;

});

/* =========================================================
   STATUS
========================================================= */

TWM.UI.status=
(txt)=>{

    $('#twm_status')
    .text(txt);

};

/* =========================================================
   MODULES
========================================================= */

TWM.Modules={};

/* =========================================================
   WORLD
========================================================= */

TWM.Modules.World={};

TWM.Modules.World.scan=
async()=>{

    const my=
    TWM.Helpers.coord(
        game_data.village.coord
    );

    TWM.state.world.center=
    my;

};

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

    if(
        txt.includes('<html')
    ){

        throw 'PLAYER LOAD FAIL';

    }

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

            profile:'UNKNOWN',

            loot:0,

            ra:0,

            ro:0,

            rw:0

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

    if(
        txt.includes('<html')
    ){

        throw 'VILLAGE LOAD FAIL';

    }

    TWM.state.villages={};

    const my=
    TWM.state.world.center;

    txt.trim()
    .split('\n')
    .forEach(line=>{

        if(!line)return;

        const v=
        line.split(',');

        const x=+v[2];
        const y=+v[3];

        const dist=
        TWM.Helpers.distance(

            my.x,
            my.y,

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

            x,
            y,

            coord:
            x+'|'+y,

            playerId:v[4],

            points:+v[5],

            owner:null,

            morale:100,

            danger:0,

            frontline:false,

            targetScore:0

        };

    });

};

/* =========================================================
   DIPLOMACY
========================================================= */

TWM.Modules.Diplomacy={};

TWM.Modules.Diplomacy.scan=
async()=>{

    TWM.state.diplomacy={

        ally:[],
        nap:[],
        enemy:[]

    };

    try{

        const html=
        await TWM.Request.fetch(

            '/game.php?screen=ally&mode=contracts'

        );

        const doc=
        new DOMParser()
        .parseFromString(
            html,
            'text/html'
        );

        doc.querySelectorAll(
            'a[href*="info_ally"]'
        ).forEach(a=>{

            const row=
            a.closest('tr');

            if(!row)return;

            const txt=
            row.innerText
            .toLowerCase();

            const m=
            a.href.match(
                /id=(\d+)/
            );

            if(!m)return;

            const id=m[1];

            if(
                txt.includes('wojna')
            ){

                TWM.state.diplomacy
                .enemy.push(id);

            }

            else if(
                txt.includes('nap')
            ){

                TWM.state.diplomacy
                .nap.push(id);

            }

            else if(
                txt.includes('sojusz') ||
                txt.includes('federacja')
            ){

                TWM.state.diplomacy
                .ally.push(id);

            }

        });

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   LINKER
========================================================= */

TWM.Modules.Linker={};

TWM.Modules.Linker.run=
()=>{

    const me=
    Object.values(
        TWM.state.players
    ).find(p=>

        p.name===
        game_data.player.name

    );

    Object.values(
        TWM.state.villages
    ).forEach(v=>{

        if(
            !v.playerId ||
            v.playerId==='0'
        ){

            return;

        }

        v.owner=
        TWM.state.players[
            v.playerId
        ];

        if(!v.owner)return;

        if(
            v.owner.name===
            game_data.player.name
        ){

            v.owner.relation='own';

        }

        else if(
            v.owner.ally===
            me?.ally
        ){

            v.owner.relation='ally';

        }

        else if(

            TWM.state.diplomacy
            .enemy.includes(
                v.owner.ally
            )

        ){

            v.owner.relation='enemy';

        }

        else if(

            TWM.state.diplomacy
            .ally.includes(
                v.owner.ally
            )

        ){

            v.owner.relation='ally';

        }

        else if(

            TWM.state.diplomacy
            .nap.includes(
                v.owner.ally
            )

        ){

            v.owner.relation='nap';

        }

        else{

            v.owner.relation='neutral';

        }

    });

};

/* =========================================================
   ECONOMY
========================================================= */

TWM.Modules.Economy={};

TWM.Modules.Economy.scanPlayer=
async(player)=>{

    try{

        const cache=
        TWM.Storage.load(

            'eco_'+player.name

        );

        if(

            cache &&

            Date.now()-cache.time
            <
            TWM.config.cacheHours*
            3600000

        ){

            Object.assign(
                player,
                cache
            );

            return;

        }

        const html=
        await TWM.Request.fetch(

            '/game.php?screen=ranking&mode=in_a_day&type=loot_res&name='+

            encodeURIComponent(
                player.name
            )

        );

        const doc=
        new DOMParser()
        .parseFromString(
            html,
            'text/html'
        );

        const loot=
        parseInt(

            doc.querySelector(

                '#in_a_day_ranking_table tr:nth-child(2) td:nth-child(4)'

            )

            ?.innerText

            ?.replace(/\./g,'')

        )||0;

        player.loot=loot;

        TWM.Storage.save(

            'eco_'+player.name,

            {

                loot,

                time:Date.now()

            }

        );

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   PROFILE AI
========================================================= */

TWM.Modules.Profile={};

TWM.Modules.Profile.run=
(player)=>{

    if(!player)return;

    if(
        player.loot>10000000
    ){

        player.profile=
        'FARMER';

    }

    else if(
        player.ra>500000
    ){

        player.profile=
        'AGGRESSOR';

    }

    else if(
        player.ro>500000
    ){

        player.profile=
        'DEFENDER';

    }

    else if(
        player.villages<3 &&
        player.points<3000
    ){

        player.profile=
        'DEAD';

    }

    else{

        player.profile=
        'CASUAL';

    }

};

/* =========================================================
   FRONTLINE
========================================================= */

TWM.Modules.Frontline={};

TWM.Modules.Frontline.run=
()=>{

    const villages=
    Object.values(
        TWM.state.villages
    );

    const grid={};

    villages.forEach(v=>{

        const gx=
        Math.floor(v.x/5);

        const gy=
        Math.floor(v.y/5);

        const key=
        gx+'_'+gy;

        if(!grid[key]){

            grid[key]=[];

        }

        grid[key].push(v);

    });

    villages.forEach(v=>{

        let enemy=0;
        let ally=0;

        const gx=
        Math.floor(v.x/5);

        const gy=
        Math.floor(v.y/5);

        for(
            let dx=-1;
            dx<=1;
            dx++
        ){

            for(
                let dy=-1;
                dy<=1;
                dy++
            ){

                const key=

                    (gx+dx)+
                    '_'+
                    (gy+dy);

                const list=
                grid[key]||[];

                list.forEach(o=>{

                    if(v===o)return;

                    if(!o.owner)return;

                    const dist=
                    TWM.Helpers.distance(

                        v.x,
                        v.y,

                        o.x,
                        o.y

                    );

                    if(dist>15)return;

                    if(
                        o.owner.relation===
                        'enemy'
                    ){

                        enemy++;

                    }

                    if(
                        o.owner.relation===
                        'ally'
                    ){

                        ally++;

                    }

                });

            }

        }

        v.danger=

            enemy*15-
            ally*5;

        v.frontline=
        v.danger>40;

    });

};

/* =========================================================
   MORALE
========================================================= */

TWM.Modules.Morale={};

TWM.Modules.Morale.run=
()=>{

    const me=
    Object.values(
        TWM.state.players
    ).find(p=>

        p.name===
        game_data.player.name

    );

    if(!me)return;

    Object.values(
        TWM.state.villages
    ).forEach(v=>{

        if(!v.owner)return;

        let morale=

            Math.floor(

                (v.owner.points/
                me.points)*100

            );

        morale=
        Math.max(
            20,
            Math.min(
                morale,
                100
            )
        );

        v.morale=morale;

    });

};

/* =========================================================
   TARGET AI
========================================================= */

TWM.Modules.Target={};

TWM.Modules.Target.run=
()=>{

    Object.values(
        TWM.state.villages
    ).forEach(v=>{

        if(!v.owner)return;

        let score=0;

        if(
            v.owner.relation===
            'enemy'
        ){

            score+=100;

        }

        if(
            v.owner.relation===
            'neutral'
        ){

            score+=40;

        }

        if(
            v.owner.relation===
            'ally'
        ){

            score-=999;

        }

        if(
            v.owner.profile===
            'DEAD'
        ){

            score+=120;

        }

        if(
            v.owner.profile===
            'FARMER'
        ){

            score+=80;

        }

        score+=
        (100-v.morale);

        if(v.frontline){

            score+=40;

        }

        if(v.points<5000){

            score+=30;

        }

        v.targetScore=
        Math.floor(score);

    });

};

/* =========================================================
   HEATMAP
========================================================= */

TWM.Modules.Heatmap={};

TWM.Modules.Heatmap.run=
()=>{

    TWM.state.regions={};

    Object.values(
        TWM.state.villages
    ).forEach(v=>{

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

                villages:0,

                enemy:0,

                danger:0

            };

        }

        const r=
        TWM.state.regions[id];

        r.villages++;

        r.danger+=
        v.danger;

        if(
            v.owner?.relation===
            'enemy'
        ){

            r.enemy++;

        }

    });

};

/* =========================================================
   OVERLAY
========================================================= */

TWM.Modules.Overlay={};

TWM.Modules.Overlay.run=
()=>{

    if(!TWM.config.overlay){

        return;

    }

    $('.map_village')
    .each(function(){

        const id=
        $(this).data('id');

        if(!id)return;

        const v=
        TWM.state.villages[id];

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
            v.targetScore>180
        ){

            $(this).css(
                'outline',
                '2px solid purple'
            );

        }

    });

};

/* =========================================================
   REPORTS
========================================================= */

TWM.Modules.Reports={};

TWM.Modules.Reports.scan=
async()=>{

    try{

        const html=
        await TWM.Request.fetch(

            '/game.php?village='+
            game_data.village.id+
            '&screen=report'

        );

        const doc=
        new DOMParser()
        .parseFromString(
            html,
            'text/html'
        );

        TWM.state.reports={};

        doc.querySelectorAll('tr')
        .forEach((row,i)=>{

            const txt=
            row.innerText
            .toLowerCase();

            if(
                !txt.includes('|')
            ){

                return;

            }

            TWM.state.reports[
                i
            ]={

                attack:
                txt.includes('atak'),

                support:
                txt.includes('wsparcie'),

                spy:
                txt.includes('zwiad'),

                raw:txt

            };

        });

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   UI RENDER
========================================================= */

TWM.UI.renderDashboard=
()=>{

    $('#twm_content')
    .html(`

    <h2>
    🧠 DASHBOARD
    </h2>

    <table class="vis">

    <tr>
    <th>STAT</th>
    <th>VALUE</th>
    </tr>

    <tr>
    <td>PLAYERS</td>
    <td>
    ${
        Object.keys(
            TWM.state.players
        ).length
    }
    </td>
    </tr>

    <tr>
    <td>VILLAGES</td>
    <td>
    ${
        Object.keys(
            TWM.state.villages
        ).length
    }
    </td>
    </tr>

    <tr>
    <td>REGIONS</td>
    <td>
    ${
        Object.keys(
            TWM.state.regions
        ).length
    }
    </td>
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

        b.loot-a.loot

    )

    .slice(0,200);

    let html=`

    <h2>
    👤 PLAYERS
    </h2>

    <table class="vis" width="100%">

    <tr>

    <th>PLAYER</th>
    <th>REL</th>
    <th>PROFILE</th>
    <th>LOOT</th>

    </tr>

    `;

    players.forEach(p=>{

        html+=`

        <tr>

        <td>${p.name}</td>

        <td>${p.relation}</td>

        <td>${p.profile}</td>

        <td>${p.loot}</td>

        </tr>

        `;

    });

    html+=`</table>`;

    $('#twm_content')
    .html(html);

};

TWM.UI.renderWar=
()=>{

    const villages=
    Object.values(
        TWM.state.villages
    )

    .sort((a,b)=>

        b.targetScore-
        a.targetScore

    )

    .slice(0,200);

    let html=`

    <h2>
    ⚔ WAR AI
    </h2>

    <table class="vis" width="100%">

    <tr>

    <th>COORD</th>
    <th>OWNER</th>
    <th>REL</th>
    <th>MORALE</th>
    <th>DANGER</th>
    <th>SCORE</th>

    </tr>

    `;

    villages.forEach(v=>{

        html+=`

        <tr>

        <td>${v.coord}</td>

        <td>
        ${v.owner?.name||'-'}
        </td>

        <td>
        ${v.owner?.relation||'-'}
        </td>

        <td>${v.morale}</td>

        <td>${v.danger}</td>

        <td>${v.targetScore}</td>

        </tr>

        `;

    });

    html+=`</table>`;

    $('#twm_content')
    .html(html);

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

    <h2>
    🔥 HEATMAP
    </h2>

    <table class="vis">

    <tr>

    <th>REGION</th>
    <th>VILLAGES</th>
    <th>ENEMY</th>
    <th>DANGER</th>

    </tr>

    `;

    regions.forEach(r=>{

        html+=`

        <tr>

        <td>${r.id}</td>

        <td>${r.villages}</td>

        <td>${r.enemy}</td>

        <td>${r.danger}</td>

        </tr>

        `;

    });

    html+=`</table>`;

    $('#twm_content')
    .html(html);

};

TWM.UI.renderReports=
()=>{

    let html=`

    <h2>
    📜 REPORTS
    </h2>

    <table class="vis">

    <tr>

    <th>ATTACK</th>
    <th>SUPPORT</th>
    <th>SPY</th>

    </tr>

    `;

    Object.values(
        TWM.state.reports
    )

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

        <td>
        ${r.spy?'👁':''}
        </td>

        </tr>

        `;

    });

    html+=`</table>`;

    $('#twm_content')
    .html(html);

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

        if(
            tab==='dashboard'
        ){

            TWM.UI.renderDashboard();

        }

        if(
            tab==='players'
        ){

            TWM.UI.renderPlayers();

        }

        if(
            tab==='war'
        ){

            TWM.UI.renderWar();

        }

        if(
            tab==='heatmap'
        ){

            TWM.UI.renderHeatmap();

        }

        if(
            tab==='reports'
        ){

            TWM.UI.renderReports();

        }

    }

);

/* =========================================================
   RUN
========================================================= */

TWM.run=
async()=>{

    if(
        TWM.state.running
    ){

        return;

    }

    if(
        document.hidden
    ){

        return;

    }

    TWM.state.running=true;

    try{

        TWM.UI.status(
            'AI SCANNING...'
        );

        await TWM.Helpers.safe(

            TWM.Modules.World.scan,

            'WORLD'

        );

        await TWM.Helpers.safe(

            TWM.Modules.Players.scan,

            'PLAYERS'

        );

        await TWM.Helpers.safe(

            TWM.Modules.Villages.scan,

            'VILLAGES'

        );

        await TWM.Helpers.safe(

            TWM.Modules.Diplomacy.scan,

            'DIPLOMACY'

        );

        TWM.Modules
        .Linker.run();

        const players=
        Object.values(
            TWM.state.players
        )

        .slice(
            0,
            TWM.config.maxConcurrent
        );

        for(const p of players){

            await TWM.Modules
            .Economy
            .scanPlayer(p);

            TWM.Modules
            .Profile
            .run(p);

        }

        TWM.Modules
        .Morale
        .run();

        TWM.Modules
        .Frontline
        .run();

        TWM.Modules
        .Target
        .run();

        TWM.Modules
        .Heatmap
        .run();

        TWM.Modules
        .Overlay
        .run();

        await TWM.Modules
        .Reports
        .scan();

        if(
            TWM.state.currentTab===
            'dashboard'
        ){

            TWM.UI
            .renderDashboard();

        }

        if(
            TWM.state.currentTab===
            'players'
        ){

            TWM.UI
            .renderPlayers();

        }

        if(
            TWM.state.currentTab===
            'war'
        ){

            TWM.UI
            .renderWar();

        }

        if(
            TWM.state.currentTab===
            'heatmap'
        ){

            TWM.UI
            .renderHeatmap();

        }

        if(
            TWM.state.currentTab===
            'reports'
        ){

            TWM.UI
            .renderReports();

        }

        TWM.UI.status(
            'AI READY'
        );

    }catch(e){

        console.error(e);

        TWM.UI.status(
            'LOAD ERROR'
        );

    }finally{

        TWM.state.running=false;

    }

};

/* =========================================================
   SCAN BUTTON
========================================================= */

$('#twm_scan').on(
    'click',
    async()=>{

        await TWM.run();

    }

);

/* =========================================================
   AUTO
========================================================= */

TWM.state.auto=
setInterval(async()=>{

    if(
        !TWM.state.running
    ){

        await TWM.run();

    }

},
TWM.config.refresh);

/* =========================================================
   INIT
========================================================= */

await TWM.run();

})();
