// Castle Quest - 2D Zelda-like Adventure Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let audioCtx = null, bgmPlaying = false;

function initAudio() {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator(), gainNode = audioCtx.createGain();
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    switch(type) {
        case 'sword': osc.type='square'; osc.frequency.setValueAtTime(400,audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(100,audioCtx.currentTime+0.15); gainNode.gain.setValueAtTime(0.3,audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.15); osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime+0.15); break;
        case 'hit': osc.type='sawtooth'; osc.frequency.setValueAtTime(150,audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(50,audioCtx.currentTime+0.2); gainNode.gain.setValueAtTime(0.4,audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.2); osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime+0.2); break;
        case 'bomb': osc.type='square'; osc.frequency.setValueAtTime(100,audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(30,audioCtx.currentTime+0.5); gainNode.gain.setValueAtTime(0.6,audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.5); osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime+0.5); break;
        case 'shield': osc.type='sine'; osc.frequency.setValueAtTime(600,audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1000,audioCtx.currentTime+0.3); gainNode.gain.setValueAtTime(0.3,audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+0.3); osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime+0.3); break;
        case 'victory': [523.25,659.25,783.99,1046.50].forEach((f,i)=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0.3,audioCtx.currentTime+i*0.15);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+i*0.15+0.3);o.start(audioCtx.currentTime+i*0.15);o.stop(audioCtx.currentTime+i*0.15+0.3);}); break;
    }
}

function playBGM(type) {
    if (!audioCtx) return; stopBGM(); bgmPlaying = true;
    const tempo = type==='boss'?0.15:0.2, notes = type==='boss'?[80,80,100,80,60,60,80,100]:[120,120,150,120,100,100,120,150];
    let i = 0;
    function next() { if(!bgmPlaying)return; const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.type='square';o.frequency.value=notes[i%notes.length];g.gain.setValueAtTime(0.15,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,audioCtx.currentTime+tempo);o.start(audioCtx.currentTime);o.stop(audioCtx.currentTime+tempo);i++;setTimeout(next,tempo*1000); }
    next();
}
function stopBGM() { bgmPlaying = false; }

let gameState = 'start', currentRoom = 0;
const totalRooms = 7;
const player = { x:50,y:384,w:32,h:32,speed:3.5,hp:100,maxHp:100,dir:'right',atk:false,atkDur:0,atkCd:0,inv:0,color:'#4169e1',shield:false,shieldT:0,shieldCd:0,bombCd:0 };
let bombs=[],arrows=[],enemies=[],projectiles=[],particles=[];

const rooms = [
    {walls:[{x:200,y:0,w:20,h:200},{x:200,y:568,w:20,h:200},{x:800,y:200,w:20,h:368}],fires:[{x:150,y:300,s:20},{x:850,y:500,s:25}],enms:[{x:400,y:300,t:'g'},{x:600,y:400,t:'g'},{x:500,y:200,t:'a'}],ex:950,ey:384,boss:null},
    {walls:[{x:0,y:150,w:300,h:20},{x:500,y:598,w:300,h:20},{x:700,y:200,w:20,h:200}],fires:[{x:300,y:400,s:30},{x:500,y:300,s:25},{x:700,y:500,s:20}],enms:[{x:350,y:250,t:'g'},{x:550,y:450,t:'g'},{x:450,y:350,t:'a'}],ex:950,ey:384,boss:null},
    {walls:[{x:150,y:0,w:20,h:250},{x:150,y:518,w:20,h:250},{x:600,y:150,w:20,h:468},{x:850,y:0,w:20,h:300}],fires:[{x:200,y:350,s:25},{x:400,y:200,s:20},{x:700,y:450,s:30},{x:900,y:600,s:25}],enms:[{x:300,y:384,t:'g'},{x:750,y:300,t:'g'},{x:500,y:250,t:'a'}],ex:950,ey:384,boss:null},
    {walls:[{x:250,y:0,w:20,h:300},{x:500,y:468,w:20,h:300},{x:750,y:0,w:20,h:250}],fires:[{x:150,y:200,s:35},{x:350,y:500,s:30},{x:600,y:300,s:40},{x:850,y:450,s:25}],enms:[{x:400,y:200,t:'g'},{x:650,y:500,t:'g'},{x:350,y:400,t:'a'}],ex:950,ey:384,boss:null},
    {walls:[{x:0,y:200,w:200,h:20},{x:300,y:548,w:400,h:20},{x:600,y:100,w:20,h:250},{x:850,y:350,w:20,h:418}],fires:[{x:250,y:300,s:25},{x:500,y:400,s:30},{x:750,y:250,s:20}],enms:[{x:350,y:350,t:'g'},{x:700,y:450,t:'g'},{x:450,y:200,t:'a'}],ex:950,ey:384,boss:null},
    {walls:[{x:200,y:0,w:20,h:350},{x:400,y:418,w:20,h:350},{x:600,y:0,w:20,h:300},{x:800,y:468,w:20,h:300}],fires:[{x:300,y:450,s:30},{x:500,y:250,s:35},{x:700,y:500,s:25},{x:900,y:300,s:30}],enms:[{x:300,y:200,t:'g'},{x:500,y:550,t:'g'},{x:750,y:350,t:'g'},{x:400,y:350,t:'a'}],ex:950,ey:384,boss:null},
    {walls:[{x:150,y:0,w:20,h:200},{x:150,y:568,w:20,h:200},{x:500,y:150,w:20,h:468}],fires:[{x:100,y:100,s:40},{x:100,y:650,s:40},{x:400,y:384,s:30}],enms:[],ex:950,ey:384,boss:{x:850,y:384,w:80,h:80,hp:200,maxHp:200,tmr:0,pat:0}}
];

const keys = {};
document.addEventListener('keydown', e => { keys[e.key.toLowerCase()]=true; if(e.key===' '||e.key.toLowerCase()==='k'){e.preventDefault();tryAtk();} if(e.key.toLowerCase()==='r')doShield(); if(e.key.toLowerCase()==='t')doBomb(); });
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()]=false; });

function doShield() { if(player.shieldCd>0||player.shield)return; player.shield=true;player.shieldT=300;player.shieldCd=480;playSound('shield'); }
function doBomb() { if(player.bombCd>0)return; bombs.push({x:player.x+16,y:player.y+16,vx:player.dir==='right'?8:-8,vy:0,tmr:90,dmg:160}); player.bombCd=180;playSound('bomb'); }

function initRoom(n) {
    const r=rooms[n];
    enemies=r.enms.map(e=>({x:e.x,y:e.y,w:32,h:32,hp:e.t==='a'?20:30,maxHp:e.t==='a'?20:30,spd:e.t==='a'?1:1.2,t:e.t,dir:'left',cd:0}));
    projectiles=[];particles=[];bombs=[];arrows=[];
    player.x=50;player.y=n===0?384:r.ey;
    if(n===6&&gameState==='playing'){stopBGM();playBGM('boss');}
    updateUI();
}

function col(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function wallCol(x,y,w,h){for(let wll of rooms[currentRoom].walls)if(x<wll.x+wll.w&&x+w>wll.x&&y<wll.y+wll.h&&y+h>wll.y)return true;return x<0||x+w>canvas.width||y<0||y+h>canvas.height;}

function tryAtk() {
    if(player.atkCd>0||player.atk)return;
    player.atk=true;player.atkDur=15;player.atkCd=30;playSound('sword');
    const ar={x:player.dir==='right'?player.x+player.w:player.x-40,y:player.y-10,w:40,h:player.h+20};
    enemies.forEach(e=>{if(col(ar,e)){e.hp-=15;if(e.hp<=0)parts(e.x+16,e.y+16,'#8b0000',15);else parts(e.x+16,e.y+16,'#f00',5);}});
    if(rooms[currentRoom].boss&&col(ar,rooms[currentRoom].boss)){rooms[currentRoom].boss.hp-=10;parts(rooms[currentRoom].boss.x+40,rooms[currentRoom].boss.y+40,'#8b0000',8);if(rooms[currentRoom].boss.hp<=0)victory();}
}

function parts(x,y,c,n){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8,life:30,color:c,size:Math.random()*4+2});}

function updPlayer() {
    let dx=0,dy=0;
    if(keys['w']||keys['arrowup'])dy=-player.speed;
    if(keys['s']||keys['arrowdown'])dy=player.speed;
    if(keys['a']||keys['arrowleft']){dx=-player.speed;player.dir='left';}
    if(keys['d']||keys['arrowright']){dx=player.speed;player.dir='right';}
    if(!wallCol(player.x+dx,player.y,player.w,player.h))player.x+=dx;
    if(!wallCol(player.x,player.y+dy,player.w,player.h))player.y+=dy;
    if(player.atk){player.atkDur--;if(player.atkDur<=0)player.atk=false;}
    if(player.atkCd>0)player.atkCd--;
    if(player.inv>0)player.inv--;
    if(player.shield){player.shieldT--;if(player.shieldT<=0)player.shield=false;}
    if(player.shieldCd>0)player.shieldCd--;
    if(player.bombCd>0)player.bombCd--;
    if(player.x>rooms[currentRoom].ex&&currentRoom<totalRooms-1){currentRoom++;initRoom(currentRoom);}
    if(!player.shield){
        rooms[currentRoom].fires.forEach(f=>{if(col(player,{x:f.x-f.s/2,y:f.y-f.s/2,w:f.s,h:f.s})&&player.inv<=0){player.hp--;player.inv=30;parts(player.x+16,player.y+16,'#ff4500',2);}});
        enemies.forEach(e=>{if(col(player,e)&&player.inv<=0){player.hp-=20;player.inv=60;playSound('hit');parts(player.x+16,player.y+16,'#f00',10);}});
    }
    if(player.hp<=0)gameOver();
    updateUI();
}

function updEnemies() {
    enemies.forEach((e,i)=>{
        if(e.hp<=0){enemies.splice(i,1);return;}
        const dx=player.x-e.x,dy=player.y-e.y,d=Math.sqrt(dx*dx+dy*dy);
        if(e.t==='a'){
            if(d<150){const mx=-(dx/d)*e.spd,my=-(dy/d)*e.spd;if(!wallCol(e.x+mx,e.y,e.w,e.h))e.x+=mx;if(!wallCol(e.x,e.y+my,e.w,e.h))e.y+=my;}
            else if(d>300){const mx=(dx/d)*e.spd,my=(dy/d)*e.spd;if(!wallCol(e.x+mx,e.y,e.w,e.h))e.x+=mx;if(!wallCol(e.x,e.y+my,e.w,e.h))e.y+=my;}
            if(e.cd<=0&&d<400){const a=Math.atan2(dy,dx);arrows.push({x:e.x+16,y:e.y+16,vx:Math.cos(a)*6,vy:Math.sin(a)*6,dmg:15});e.cd=120;}
        }else{if(d>50){const mx=(dx/d)*e.spd,my=(dy/d)*e.spd;if(!wallCol(e.x+mx,e.y,e.w,e.h))e.x+=mx;if(!wallCol(e.x,e.y+my,e.w,e.h))e.y+=my;}}
        e.dir=dx>0?'right':'left';if(e.cd>0)e.cd--;
    });
}

function updBombs() {
    bombs.forEach((b,bi)=>{
        b.x+=b.vx;b.timer--;
        if(wallCol(b.x,b.y,10,10))b.timer=1;
        if(b.timer<=0){
            playSound('bomb');parts(b.x,b.y,'#f60',20);
            if(rooms[currentRoom].boss&&col({x:b.x-30,y:b.y-30,w:60,h:60},rooms[currentRoom].boss)){rooms[currentRoom].boss.hp-=b.damage;parts(rooms[currentRoom].boss.x+40,rooms[currentRoom].boss.y+40,'#8b0000',15);if(rooms[currentRoom].boss.hp<=0)victory();}
            enemies.forEach(e=>{if(col({x:b.x-30,y:b.y-30,w:60,h:60},e)){e.hp-=30;if(e.hp<=0)parts(e.x+16,e.y+16,'#8b0000',15);}});
            bombs.splice(bi,1);
        }
    });
}

function updArrows() {
    arrows.forEach((a,ai)=>{
        a.x+=a.vx;a.y+=a.vy;
        if(a.x<0||a.x>canvas.width||a.y<0||a.y>canvas.height){arrows.splice(ai,1);return;}
        if(!player.shield&&col(player,{x:a.x-5,y:a.y-5,w:10,h:10})&&player.inv<=0){player.hp-=a.dmg;player.inv=45;playSound('hit');parts(player.x+16,player.y+16,'#f00',8);arrows.splice(ai,1);}
    });
}

function updBoss() {
    const b=rooms[currentRoom].boss;if(!b)return;
    if(b.hp<=0){victory();return;}
    b.tmr++;
    if(b.tmr>60){
        b.tmr=0;b.pat=(b.pat+1)%4;
        if(b.pat===0)for(let i=-2;i<=2;i++)projectiles.push({x:b.x,y:b.y+40,vx:-8,vy:i*2,t:'f',s:20});
        else if(b.pat===1){const d=player.x-b.x,e=player.y-b.y,f=Math.sqrt(d*d+e*e);projectiles.push({x:b.x,y:b.y+40,vx:(d/f)*10,vy:(e/f)*10,t:'w',s:25});}
        else if(b.pat===2)for(let i=0;i<3;i++)setTimeout(()=>{projectiles.push({x:b.x,y:b.y+40,vx:-10,vy:(Math.random()-0.5)*4,t:'f',s:18});},i*200);
        else for(let i=0;i<5;i++)setTimeout(()=>{projectiles.push({x:b.x,y:b.y+i*20,vx:-9,vy:0,t:'w',s:15});},i*100);
    }
    projectiles.forEach((p,pi)=>{
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>canvas.width||p.y<0||p.y>canvas.height){projectiles.splice(pi,1);return;}
        if(!player.shield&&col(player,{x:p.x-p.s/2,y:p.y-p.s/2,w:p.s,h:p.s})&&player.inv<=0){player.hp-=p.t==='f'?25:20;player.inv=45;playSound('hit');parts(player.x+16,player.y+16,p.t==='f'?'#ff4500':'#4169e1',8);projectiles.splice(pi,1);}
    });
}

function updParts(){particles.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;p.life--;p.size*=0.95;if(p.life<=0)particles.splice(i,1);});}

function drawBg(){ctx.fillStyle='#2d5a27';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#1a3a1a';ctx.lineWidth=2;for(let i=0;i<canvas.width;i+=64)for(let j=0;j<canvas.height;j+=64)ctx.strokeRect(i,j,64,64);ctx.fillStyle='#3a3a5a';ctx.fillRect(0,0,50,canvas.height);ctx.fillRect(canvas.width-50,0,50,canvas.height);ctx.fillStyle='rgba(255,100,50,0.3)';for(let i=100;i<canvas.width-100;i+=200){ctx.beginPath();ctx.arc(i,50,40,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(i,canvas.height-50,40,0,Math.PI*2);ctx.fill();}}
function drawWalls(){rooms[currentRoom].walls.forEach(w=>{ctx.fillStyle='#4a4a6a';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.strokeStyle='#2a2a3a';ctx.lineWidth=3;ctx.strokeRect(w.x,w.y,w.w,w.h);});}
function drawFires(){rooms[currentRoom].fires.forEach(f=>{const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.s);g.addColorStop(0,'#ff0');g.addColorStop(0.5,'#f60');g.addColorStop(1,'rgba(255,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(f.x,f.y,f.s,0,Math.PI*2);ctx.fill();ctx.fillStyle=`hsl(${Date.now()/10%60+10},100%,50%)`;ctx.beginPath();ctx.arc(f.x,f.y,f.s*0.4,0,Math.PI*2);ctx.fill();});}
function drawPlayer(){if(player.shield){ctx.fillStyle='rgba(65,105,225,0.5)';ctx.beginPath();ctx.arc(player.x+16,player.y+16,35,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4169e1';ctx.lineWidth=3;ctx.stroke();}ctx.fillStyle=player.color;ctx.fillRect(player.x,player.y,player.w,player.h);ctx.fillStyle='#ffdab9';const fx=player.dir==='right'?player.x+16:player.x+4;ctx.fillRect(fx,player.y+4,12,12);ctx.fillStyle='#000';const ex=player.dir==='right'?player.x+20:player.x+8;ctx.fillRect(ex,player.y+8,4,4);if(player.atk){ctx.fillStyle='#c0c0c0';const sx=player.dir==='right'?player.x+32:player.x-30;ctx.fillRect(sx,player.y+12,30,8);ctx.fillStyle='#8b4513';const hx=player.dir==='right'?player.x+28:player.x-4;ctx.fillRect(hx,player.y+10,4,12);}if(player.inv>0&&Math.floor(Date.now()/50)%2===0){ctx.globalAlpha=0.5;ctx.fillStyle='#fff';ctx.fillRect(player.x,player.y,player.w,player.h);ctx.globalAlpha=1;}}
function drawEnemies(){enemies.forEach(e=>{ctx.fillStyle=e.t==='a'?'#228b22':'#8b0000';ctx.fillRect(e.x,e.y,e.w,e.h);ctx.fillStyle='#ffdab9';const fx=e.dir==='right'?e.x+16:e.x+4;ctx.fillRect(fx,e.y+4,12,12);ctx.fillStyle='#000';const ex=e.dir==='right'?e.x+20:e.x+8;ctx.fillRect(ex,e.y+8,4,4);const hp=e.hp/e.maxHp;ctx.fillStyle='#333';ctx.fillRect(e.x,e.y-8,e.w,4);ctx.fillStyle=hp>0.5?'#0f0':hp>0.25?'#ff0':'#f00';ctx.fillRect(e.x,e.y-8,e.w*hp,4);});}
function drawBoss(){const b=rooms[currentRoom].boss;if(!b)return;ctx.fillStyle='#4b0082';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='#8b0000';ctx.fillRect(b.x+15,b.y+15,50,40);ctx.fillStyle='#ff0';ctx.fillRect(b.x+25,b.y+25,12,12);ctx.fillRect(b.x+45,b.y+25,12,12);ctx.fillStyle='#ffd700';ctx.fillRect(b.x+20,b.y-10,40,15);ctx.fillRect(b.x+25,b.y-20,10,10);ctx.fillRect(b.x+45,b.y-20,10,10);const hp=b.hp/b.maxHp;ctx.fillStyle='#333';ctx.fillRect(b.x,b.y-30,b.w,8);ctx.fillStyle='#f00';ctx.fillRect(b.x,b.y-30,b.w*hp,8);}
function drawProj(){projectiles.forEach(p=>{if(p.t==='f'){const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s);g.addColorStop(0,'#ff0');g.addColorStop(0.5,'#f60');g.addColorStop(1,'#f00');ctx.fillStyle=g;}else ctx.fillStyle='#4169e1';ctx.beginPath();ctx.arc(p.x,p.y,p.s/2,0,Math.PI*2);ctx.fill();});}
function drawBombs(){bombs.forEach(b=>{ctx.fillStyle='#333';ctx.beginPath();ctx.arc(b.x,b.y,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8b4513';ctx.fillRect(b.x-2,b.y-15,4,10);if(b.tmr<30){ctx.fillStyle=b.tmr%10<5?'#ff0':'#f00';ctx.beginPath();ctx.arc(b.x,b.y-18,4,0,Math.PI*2);ctx.fill();}});}
function drawArrows(){arrows.forEach(a=>{const ang=Math.atan2(a.vy,a.vx);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(ang);ctx.fillStyle='#8b4513';ctx.fillRect(-15,-2,30,4);ctx.fillStyle='#c0c0c0';ctx.beginPath();ctx.moveTo(15,-6);ctx.lineTo(20,0);ctx.lineTo(15,6);ctx.fill();ctx.restore();});}
function drawParts(){particles.forEach(p=>{ctx.fillStyle=p.color;ctx.globalAlpha=p.life/30;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});}
function drawExit(){const r=rooms[currentRoom];ctx.fillStyle='#654321';ctx.fillRect(r.ex,r.ey-50,20,100);ctx.fillStyle='#000';ctx.fillRect(r.ex+5,r.ey-45,10,90);ctx.strokeStyle='#8b4513';ctx.lineWidth=3;ctx.strokeRect(r.ex,r.ey-50,20,100);}

function updateUI(){
    document.getElementById('healthFill').style.width=(player.hp/player.maxHp*100)+'%';
    document.getElementById('roomNum').textContent=currentRoom+1;
    const bh=document.getElementById('bossHealthBar');
    if(rooms[currentRoom].boss){bh.style.display='block';document.getElementById('bossHealthFill').style.width=(rooms[currentRoom].boss.hp/rooms[currentRoom].boss.maxHp*100)+'%';}else bh.style.display='none';
    const ss=document.getElementById('shieldStatus');if(player.shield){ss.textContent='ACTIVE';ss.style.color='#0f0';}else if(player.shieldCd>0){ss.textContent=Math.ceil(player.shieldCd/60)+'s';ss.style.color='#f60';}else{ss.textContent='Ready';ss.style.color='#0f0';}
    const bs=document.getElementById('bombStatus');if(player.bombCd>0){bs.textContent=Math.ceil(player.bombCd/60)+'s';bs.style.color='#f60';}else{bs.textContent='Ready';bs.style.color='#0f0';}
}

function gameOver(){gameState='gameover';stopBGM();document.getElementById('gameOverText').textContent='GAME OVER';document.getElementById('gameOverText').style.color='#f44';document.getElementById('gameOver').style.display='block';}
function victory(){gameState='victory';stopBGM();playSound('victory');document.getElementById('gameOverText').textContent='VICTORY!';document.getElementById('gameOverText').style.color='#ffd700';document.getElementById('gameOver').style.display='block';}
function resetGame(){currentRoom=0;player.hp=100;player.x=50;player.y=384;player.shield=false;player.shieldT=0;player.shieldCd=0;player.bombCd=0;initRoom(0);document.getElementById('gameOver').style.display='none';}

document.getElementById('restartBtn').addEventListener('click',()=>{resetGame();gameState='playing';document.getElementById('gameOver').style.display='none';playBGM('normal');});

const startScreen=document.getElementById('startScreen'),creditsScreen=document.getElementById('creditsScreen'),playBtn=document.getElementById('playBtn'),creditsBtn=document.getElementById('creditsBtn'),leaveBtn=document.getElementById('leaveBtn'),backBtn=document.getElementById('backBtn');

playBtn.addEventListener('click',()=>{initAudio();gameState='playing';startScreen.style.display='none';creditsScreen.style.display='none';canvas.style.display='block';resetGame();if(bgmPlaying)stopBGM();playBGM('normal');});
creditsBtn.addEventListener('click',()=>{startScreen.style.display='none';creditsScreen.style.display='flex';});
backBtn.addEventListener('click',()=>{creditsScreen.style.display='none';startScreen.style.display='flex';});
leaveBtn.addEventListener('click',()=>{window.close();setTimeout(()=>alert('Thank you for playing Castle Quest!\n\nYou can now close this tab manually.\n\nGame created by Dorian Voegeli & Saskia'),100);});

function gameLoop(){
    if(gameState==='playing'){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        updPlayer();updEnemies();updBoss();updBombs();updArrows();updParts();
        drawBg();drawWalls();drawFires();drawExit();drawEnemies();drawBoss();drawPlayer();drawBombs();drawArrows();drawProj();drawParts();
    }
    requestAnimationFrame(gameLoop);
}

initRoom(0);
gameLoop();
