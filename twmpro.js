/* =========================================================
   TWMPRO AI OVERMIND v51
   OFFICIAL SCRIPT INTEGRATION BUILD
========================================================= */

/* =========================================================
   NEW MODULES v51
=========================================================

✅ TROOP COUNTER AI
✅ SUPPORT TRACKER AI
✅ FARM ASSISTANT SYNC
✅ NOTE SYSTEM AI
✅ STRATEGIC MAP AI
✅ MASS LABEL AI
✅ ATTACK PLANNER AI
✅ BATTLE SIMULATION AI
✅ KNOWN/UNKNOWN ENGINE 2.0
✅ PLAYER INTEL MEMORY
✅ REGION POWER AI
✅ OFF/DEF DETECTOR

========================================================= */

/* =========================================================
   TROOP COUNTER AI
========================================================= */

TWM.Modules.Troops={};

TWM.Modules.Troops.scan=
async()=>{

    try{

        const html=
        await TWM.Request.fetch(

            '/game.php?screen=overview_villages&mode=combined'

        );

        const doc=
        new DOMParser()
        .parseFromString(
            html,
            'text/html'
        );

        TWM.state.troops={};

        doc.querySelectorAll(
            '#combined_table tr'
        ).forEach(row=>{

            const tds=
            row.querySelectorAll('td');

            if(tds.length<15)return;

            const coord=
            tds[0]
            ?.innerText
            ?.match(/\d+\|\d+/)?.[0];

            if(!coord)return;

            TWM.state.troops[
                coord
            ]={

                spear:
                parseInt(
                    tds[2]?.innerText
                )||0,

                sword:
                parseInt(
                    tds[3]?.innerText
                )||0,

                axe:
                parseInt(
                    tds[4]?.innerText
                )||0,

                archer:
                parseInt(
                    tds[5]?.innerText
                )||0,

                light:
                parseInt(
                    tds[6]?.innerText
                )||0,

                heavy:
                parseInt(
                    tds[7]?.innerText
                )||0,

                ram:
                parseInt(
                    tds[8]?.innerText
                )||0,

                catapult:
                parseInt(
                    tds[9]?.innerText
                )||0,

                noble:
                parseInt(
                    tds[10]?.innerText
                )||0

            };

        });

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   REGION POWER AI
========================================================= */

TWM.Modules.RegionPower={};

TWM.Modules.RegionPower.run=
()=>{

    Object.values(
        TWM.state.regions
    ).forEach(r=>{

        r.offPower=0;

        r.defPower=0;

        r.supportPower=0;

        r.villageList=
        r.villageList||[];

        r.villageList
        .forEach(v=>{

            const t=
            TWM.state.troops[
                v.coord
            ];

            if(!t)return;

            r.offPower+=

                t.axe+
                t.light*4+
                t.ram*5;

            r.defPower+=

                t.spear+
                t.sword*2+
                t.heavy*4;

            r.supportPower+=

                t.heavy+
                t.sword;

        });

    });

};

/* =========================================================
   SUPPORT TRACKER AI
========================================================= */

TWM.Modules.Support={};

TWM.Modules.Support.scan=
async()=>{

    try{

        const html=
        await TWM.Request.fetch(

            '/game.php?screen=overview_villages&mode=units&type=away_detail'

        );

        const doc=
        new DOMParser()
        .parseFromString(
            html,
            'text/html'
        );

        TWM.state.support={};

        doc.querySelectorAll(
            '#units_table tr'
        ).forEach(row=>{

            const txt=
            row.innerText;

            const coord=
            txt.match(/\d+\|\d+/)?.[0];

            if(!coord)return;

            TWM.state.support[
                coord
            ]={

                active:true,

                raw:txt

            };

        });

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   FARM ASSISTANT SYNC
========================================================= */

TWM.Modules.FarmSync={};

TWM.Modules.FarmSync.scan=
()=>{

    TWM.state.farmKnown={};

    $('.farm_icon_a')
    .each(function(){

        const row=
        $(this).closest('tr');

        const coord=
        row.text()
        .match(/\d+\|\d+/)?.[0];

        if(!coord)return;

        TWM.state.farmKnown[
            coord
        ]=true;

    });

};

/* =========================================================
   KNOWN / UNKNOWN ENGINE 2.0
========================================================= */

TWM.Modules.Known={};

TWM.Modules.Known.run=
()=>{

    Object.values(
        TWM.state.villages
    ).forEach(v=>{

        v.known=false;

        if(
            TWM.state.farmKnown[
                v.coord
            ]
        ){

            v.known=true;

        }

        if(
            TWM.state.reports[
                v.coord
            ]
        ){

            v.known=true;

        }

        if(
            TWM.state.intel[
                v.coord
            ]
        ){

            v.known=true;

        }

    });

};

/* =========================================================
   NOTE SYSTEM AI
========================================================= */

TWM.Modules.Notes={};

TWM.Modules.Notes.create=
(v)=>{

    let note='';

    if(
        v.owner?.relation==='enemy'
    ){

        note+='🔥 ENEMY\\n';

    }

    if(
        v.owner?.profile==='FARMER'
    ){

        note+='🌾 FARMER\\n';

    }

    if(
        v.owner?.profile==='DEAD'
    ){

        note+='💀 DEAD\\n';

    }

    if(v.frontline){

        note+='⚔ FRONTLINE\\n';

    }

    if(v.targetScore>180){

        note+='👑 CONQUER TARGET\\n';

    }

    return note;

};

/* =========================================================
   MASS LABEL AI
========================================================= */

TWM.Modules.Labels={};

TWM.Modules.Labels.run=
()=>{

    Object.values(
        TWM.state.villages
    ).forEach(v=>{

        if(!v.owner)return;

        v.label='';

        if(
            v.owner.profile==='DEAD'
        ){

            v.label='DEAD';

        }

        else if(
            v.owner.profile==='FARMER'
        ){

            v.label='FARM';

        }

        else if(
            v.frontline
        ){

            v.label='FRONT';

        }

        else if(
            v.targetScore>180
        ){

            v.label='CONQUER';

        }

    });

};

/* =========================================================
   ATTACK PLANNER AI
========================================================= */

TWM.Modules.Planner={};

TWM.Modules.Planner.run=
()=>{

    TWM.state.plans=[];

    Object.values(
        TWM.state.villages
    ).forEach(v=>{

        if(
            v.targetScore<150
        ){

            return;

        }

        const my=
        TWM.state.world.center;

        const dist=
        TWM.Helpers.distance(

            my.x,
            my.y,

            v.x,
            v.y

        );

        const nobleTime=

            dist*35;

        TWM.state.plans
        .push({

            coord:v.coord,

            owner:
            v.owner?.name,

            morale:
            v.morale,

            score:
            v.targetScore,

            nobleTime:
            nobleTime.toFixed(1)

        });

    });

};

/* =========================================================
   BATTLE SIMULATION AI
========================================================= */

TWM.Modules.Battle={};

TWM.Modules.Battle.simulate=
(v)=>{

    let chance=50;

    chance+=
    (100-v.morale);

    chance+=
    (v.targetScore/5);

    if(
        v.owner?.profile==='DEAD'
    ){

        chance+=40;

    }

    if(v.frontline){

        chance-=20;

    }

    chance=
    Math.max(
        1,
        Math.min(
            chance,
            99
        )
    );

    v.conquerChance=
    chance;

};

/* =========================================================
   STRATEGIC MAP AI
========================================================= */

TWM.Modules.StrategicMap={};

TWM.Modules.StrategicMap.run=
()=>{

    Object.values(
        TWM.state.regions
    ).forEach(r=>{

        r.type='neutral';

        if(r.enemy>15){

            r.type='warzone';

        }

        if(r.offPower>50000){

            r.type='offensive';

        }

        if(r.defPower>100000){

            r.type='fortress';

        }

    });

};

/* =========================================================
   PLAYER INTEL MEMORY
========================================================= */

TWM.Modules.Intel={};

TWM.Modules.Intel.save=
(player)=>{

    if(!player)return;

    TWM.state.intel[
        player.name
    ]={

        relation:
        player.relation,

        profile:
        player.profile,

        loot:
        player.loot,

        villages:
        player.villages,

        points:
        player.points,

        lastSeen:
        Date.now()

    };

};

/* =========================================================
   OFF / DEF DETECTOR
========================================================= */

TWM.Modules.Power={};

TWM.Modules.Power.run=
(player)=>{

    player.offensive=false;

    player.defensive=false;

    if(
        player.ra>
        player.ro*2
    ){

        player.offensive=true;

    }

    if(
        player.ro>
        player.ra*2
    ){

        player.defensive=true;

    }

};

/* =========================================================
   OVERLAY v51
========================================================= */

TWM.Modules.Overlay.run=
()=>{

    $('.map_village')
    .each(function(){

        const id=
        $(this).data('id');

        if(!id)return;

        const v=
        TWM.state.villages[id];

        if(!v)return;

        $(this).css({

            outline:'',
            filter:''

        });

        /* FRONTLINE */

        if(v.frontline){

            $(this).css(
                'outline',
                '2px solid red'
            );

        }

        /* CONQUER */

        if(
            v.targetScore>180
        ){

            $(this).css(
                'outline',
                '2px solid purple'
            );

        }

        /* DEAD */

        if(
            v.owner?.profile==='DEAD'
        ){

            $(this).css(
                'filter',
                'grayscale(100%)'
            );

        }

        /* FARMER */

        if(
            v.owner?.profile==='FARMER'
        ){

            $(this).css(
                'outline',
                '2px solid gold'
            );

        }

    });

};

/* =========================================================
   MASTER RUN ADDITIONS
========================================================= */

await TWM.Modules.Troops.scan();

await TWM.Modules.Support.scan();

TWM.Modules.FarmSync.scan();

TWM.Modules.Known.run();

TWM.Modules.RegionPower.run();

TWM.Modules.StrategicMap.run();

TWM.Modules.Planner.run();

Object.values(
    TWM.state.villages
).forEach(v=>{

    TWM.Modules.Battle
    .simulate(v);

});

Object.values(
    TWM.state.players
).forEach(p=>{

    TWM.Modules.Power
    .run(p);

    TWM.Modules.Intel
    .save(p);

});
