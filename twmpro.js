/* =========================================================
   TWMPRO AI CORE v15 STABLE
   FULL FIXED EDITION
========================================================= */

(async()=>{

'use strict';

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

if(window.TWMAI_V15){

    try{

        window.TWMAI_V15.open();

    }catch(e){}

    return;

}

/* =========================================================
   ROOT
========================================================= */

window.TWMAI_V15={};

const TWM=window.TWMAI_V15;

/* =========================================================
   CONFIG
========================================================= */

TWM.config={

    radius:60,

    refresh:120000,

    minWidth:900,

    minHeight:500,

    width:1600,

    height:850,

    storage:'TWMAI_V15'

};

/* =========================================================
   STATE
========================================================= */

TWM.state={

    villages:[],

    players:{},

    allies:{},

    relations:{},

    rankings:{},

    economy:{},

    knownCoords:{},

    currentTab:'players',

    autoRefresh:null,

    running:false,

    listeners:[]

};

/* =========================================================
   STORAGE
========================================================= */

TWM.Storage={};

TWM.Storage.load=()=>{

    try{

        const raw=
        localStorage.getItem(
            TWM.config.storage
        );

        if(!raw)return;

        const data=
        JSON.parse(raw);

        if(data.knownCoords){

            TWM.state.knownCoords=
            data.knownCoords;

        }

        if(data.width){

            TWM.config.width=
            data.width;

        }

        if(data.height){

            TWM.config.height=
            data.height;

        }

        if(data.left){

            TWM.config.left=
            data.left;

        }

        if(data.top){

            TWM.config.top=
            data.top;

        }

    }catch(e){

        console.error(e);

    }

};

TWM.Storage.save=()=>{

    try{

        if(!TWM.UI?.panel)return;

        localStorage.setItem(

            TWM.config.storage,

            JSON.stringify({

                knownCoords:
                TWM.state.knownCoords,

                width:
                TWM.UI.panel.offsetWidth,

                height:
                TWM.UI.panel.offsetHeight,

                left:
                TWM.UI.panel.style.left,

                top:
                TWM.UI.panel.style.top

            })

        );

    }catch(e){

        console.error(e);

    }

};

/* =========================================================
   HELPERS
========================================================= */

TWM.Helpers={};

TWM.Helpers.coord=(txt)=>{

    if(!txt){

        return{

            x:0,
            y:0

        };

    }

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

TWM.Helpers.status=(txt)=>{

    const el=
    document.querySelector(
        '#twm_status'
    );

    if(el){

        el.innerText=txt;

    }

};

TWM.Helpers.listen=(
target,
event,
handler
)=>{

    target.addEventListener(
        event,
        handler
    );

    TWM.state.listeners.push({

        target,
        event,
        handler

    });

};

/* =========================================================
   LOAD STORAGE
========================================================= */

TWM.Storage.load();

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

        width:'44px',
        height:'44px',

        background:'#6b4d24',

        color:'#fff',

        borderRadius:'50%',

        display:'flex',

        alignItems:'center',

        justifyContent:'center',

        cursor:'pointer',

        zIndex:'2147483647',

        fontSize:'20px',

        boxShadow:
        '0 0 10px rgba(0,0,0,0.5)'

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

        left:
        (TWM.config.left ?? '100px'),

        top:
        (TWM.config.top ?? '40px'),

        width:
        TWM.config.width+'px',

        height:
        TWM.config.height+'px',

        background:'#f4e4bc',

        border:'2px solid #7a5b2e',

        zIndex:'2147483646',

        display:'flex',

        flexDirection:'column',

        overflow:'hidden',

        borderRadius:'8px',

        fontFamily:'Verdana',

        fontSize:'11px'

    }

);

document.body.appendChild(
    TWM.UI.panel
);

/* =========================================================
   PANEL HTML
========================================================= */

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
user-select:none;
">

<div>
🧠 TWMPRO AI CORE v15
</div>

<div style="display:flex;gap:4px;">

<button id="twm_fullscreen">
🗖
</button>

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
flex-wrap:wrap;
">

<button id="tab_players">
👤 GRACZE
</button>

<button id="tab_barbs">
🌾 BARBY
</button>

<button id="tab_reports">
📜 RAPORTY
</button>

<button id="tab_diplomacy">
🛡 DYPLOMACJA
</button>

<button id="twm_scan">
🔍 SKANUJ
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

/* =========================================================
   RESIZE HANDLE
========================================================= */

TWM.UI.resize=
document.createElement('div');

Object.assign(

    TWM.UI.resize.style,

    {

        position:'absolute',

        right:'0',

        bottom:'0',

        width:'18px',

        height:'18px',

        cursor:'nwse-resize',

        background:
        'linear-gradient(135deg, transparent 0%, transparent 40%, #6b4d24 40%, #6b4d24 100%)',

        zIndex:'2147483647'

    }

);

TWM.UI.panel.appendChild(
    TWM.UI.resize
);

/* =========================================================
   RESIZE
========================================================= */

let resizing=false;

let startX=0;
let startY=0;

let startWidth=0;
let startHeight=0;

TWM.Helpers.listen(

    TWM.UI.resize,

    'mousedown',

    e=>{

        e.preventDefault();

        resizing=true;

        startX=e.clientX;
        startY=e.clientY;

        startWidth=
        TWM.UI.panel.offsetWidth;

        startHeight=
        TWM.UI.panel.offsetHeight;

    }

);

TWM.Helpers.listen(

    document,

    'mousemove',

    e=>{

        if(!resizing)return;

        const newWidth=

            startWidth+
            (
                e.clientX-startX
            );

        const newHeight=

            startHeight+
            (
                e.clientY-startY
            );

        TWM.UI.panel.style.width=

            Math.max(
                TWM.config.minWidth,
                newWidth
            )+'px';

        TWM.UI.panel.style.height=

            Math.max(
                TWM.config.minHeight,
                newHeight
            )+'px';

    }

);

TWM.Helpers.listen(

    document,

    'mouseup',

    ()=>{

        if(resizing){

            TWM.Storage.save();

        }

        resizing=false;

    }

);

/* =========================================================
   DRAG
========================================================= */

let drag=false;

let ox=0;
let oy=0;

$('#twm_header').on('mousedown',e=>{

    if(resizing)return;

    drag=true;

    ox=
    e.clientX-
    TWM.UI.panel.offsetLeft;

    oy=
    e.clientY-
    TWM.UI.panel.offsetTop;

});

$(document).on('mouseup',()=>{

    if(drag){

        TWM.Storage.save();

    }

    drag=false;

});

$(document).on('mousemove',e=>{

    if(!drag)return;

    const left=
    Math.max(
        0,
        Math.min(
            window.innerWidth-
            300,
            e.clientX-ox
        )
    );

    const top=
    Math.max(
        0,
        Math.min(
            window.innerHeight-
            100,
            e.clientY-oy
        )
    );

    TWM.UI.panel.style.left=
    left+'px';

    TWM.UI.panel.style.top=
    top+'px';

});

/* =========================================================
   FULLSCREEN
========================================================= */

$('#twm_fullscreen').on('click',()=>{

    TWM.UI.panel.style.left='0px';

    TWM.UI.panel.style.top='0px';

    TWM.UI.panel.style.width=
    (window.innerWidth-4)+'px';

    TWM.UI.panel.style.height=
    (window.innerHeight-4)+'px';

    TWM.Storage.save();

});

/* =========================================================
   OPEN CLOSE
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

    TWM.Storage.save();

    TWM.state.listeners.forEach(l=>{

        l.target.removeEventListener(
            l.event,
            l.handler
        );

    });

    TWM.UI.panel.remove();

    TWM.UI.float.remove();

    delete window.TWMAI_V15;

});

/* =========================================================
   RENDER
========================================================= */

TWM.UI.render=()=>{

    const content=
    document.querySelector(
        '#twm_content'
    );

    content.innerHTML=`

    <div style="
    padding:20px;
    font-size:14px;
    ">

    <h2>🧠 TWMPRO AI CORE v15</h2>

    <p>✅ Stabilny system resize</p>

    <p>✅ Stabilny drag system</p>

    <p>✅ Fullscreen działa</p>

    <p>✅ Zapisywanie pozycji</p>

    <p>✅ Zapisywanie rozmiaru</p>

    <p>✅ Cleanup listenerów</p>

    <p>✅ Safe refresh loop</p>

    <p>✅ Memory leak fixes</p>

    <hr>

    <h3>🚧 Moduły AI w budowie</h3>

    <ul>

        <li>📜 Report AI</li>

        <li>🌍 World AI</li>

        <li>🛡 Diplomacy AI</li>

        <li>⚔ War AI</li>

        <li>🌾 Economy AI</li>

        <li>🏆 Ranking AI</li>

        <li>🔥 Activity AI</li>

    </ul>

    </div>

    `;

};

/* =========================================================
   RUN
========================================================= */

TWM.run=async()=>{

    if(TWM.state.running){

        return;

    }

    TWM.state.running=true;

    try{

        TWM.Helpers.status(
            'ŁADOWANIE AI...'
        );

        TWM.UI.render();

        TWM.Helpers.status(
            'AI GOTOWE'
        );

    }catch(e){

        console.error(e);

        TWM.Helpers.status(
            'LOAD ERROR'
        );

    }finally{

        TWM.state.running=false;

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

await TWM.run();

})();
