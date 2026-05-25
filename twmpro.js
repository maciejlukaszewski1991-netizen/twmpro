/* =========================================================
   DIPLOMACY ENGINE v1
   DODAJ DO TWM.AI.runPlayers()
========================================================= */

/* =========================================================
   MY TRIBE
========================================================= */

const myPlayer=
TWM.state.players[
    game_data.player.id
];

const myAllyId=
myPlayer?.ally||'0';

const myTribe=
TWM.state.allies[
    myAllyId
];

/* =========================================================
   ALLY DETECTION
========================================================= */

const allyTags=[];

if(myTribe){

    allyTags.push(
        myTribe.tag
    );

}

/* =========================================================
   AUTO DIPLOMACY
========================================================= */

Object.values(
    TWM.state.playerAI
)
.forEach(ai=>{

    ai.relation='NEUTRAL';

    ai.relationIcon='⚪';

    ai.relationColor='#f8eed1';

    /* =====================================
       MY TRIBE
    ===================================== */

    if(
        ai.ally===myTribe?.tag
    ){

        ai.relation='TRIBE';

        ai.relationIcon='🟦';

        ai.relationColor='#b8d4ff';

    }

    /* =====================================
       ALLY TRIBES
    ===================================== */

    else if(

        ai.ally &&
        ai.ally!=='-' &&
        ai.ally!=='0'

    ){

        /* ================================
           DISTANCE TO MY TRIBE
        ================================= */

        let tribeNear=0;

        Object.values(
            TWM.state.playerAI
        )
        .forEach(other=>{

            if(
                other.ally===
                myTribe?.tag
            ){

                const d=
                Math.abs(
                    ai.nearest-
                    other.nearest
                );

                if(d<=15){

                    tribeNear++;

                }

            }

        });

        /* ================================
           SAME FRONT
        ================================= */

        if(tribeNear>=2){

            ai.relation='ALLY';

            ai.relationIcon='🟩';

            ai.relationColor='#c7f0c2';

        }

    }

    /* =====================================
       ENEMY DETECTION
    ===================================== */

    if(

        ai.nearbyPlayers>
        ai.nearbyBarbs &&
        ai.points>
        game_data.player.points*1.5

    ){

        ai.relation='ENEMY';

        ai.relationIcon='🟥';

        ai.relationColor='#f4b6b6';

    }

});
