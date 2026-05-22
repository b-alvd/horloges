/* ── BACKGROUND ───────────────────────────────────────────────────────────── */
const bgCanvas = document.getElementById('bg');
const bgCtx    = bgCanvas.getContext('2d');
let W, H, particles = [], lines = [];

function resize() {
  W = bgCanvas.width  = window.innerWidth;
  H = bgCanvas.height = window.innerHeight;
  syncClockSizes();
}
window.addEventListener('resize', () => { resize(); initParticles(); });

function rnd(a, b) { return a + Math.random() * (b - a); }

function initParticles() {
  particles = [];
  const count = Math.floor((W * H) / 13000);
  for (let i = 0; i < count; i++)
    particles.push({ x:rnd(0,W), y:rnd(0,H), r:rnd(0.3,1.5), vx:rnd(-0.1,0.1), vy:rnd(-0.1,0.1), a:rnd(0.12,0.55) });
  lines = [];
  const lc = Math.floor(W / 110);
  for (let i = 0; i < lc; i++)
    lines.push({ x:rnd(0,W), y:rnd(0,H), len:rnd(40,180), angle:rnd(0,Math.PI*2), va:rnd(-0.002,0.002), vx:rnd(-0.04,0.04), vy:rnd(-0.04,0.04), a:rnd(0.04,0.11) });
}

let noiseT = 0;
function drawBg() {
  bgCtx.clearRect(0,0,W,H);
  bgCtx.fillStyle='#080808'; bgCtx.fillRect(0,0,W,H);
  noiseT += 0.004;
  for (let wi = 0; wi < 4; wi++) {
    const ph=wi/4*Math.PI*2, amp=H*0.055, freq=0.0014+wi*0.0005, yB=H*(0.18+wi*0.19), al=0.016+wi*0.007;
    bgCtx.beginPath();
    for (let x=0; x<=W; x+=4) {
      const y=yB+Math.sin(x*freq+noiseT+ph)*amp+Math.sin(x*freq*2.4-noiseT*1.3+ph)*amp*0.35;
      x===0?bgCtx.moveTo(x,y):bgCtx.lineTo(x,y);
    }
    bgCtx.strokeStyle=`rgba(170,170,170,${al})`; bgCtx.lineWidth=0.5; bgCtx.stroke();
  }
  lines.forEach(l=>{
    l.angle+=l.va; l.x=(l.x+l.vx+W)%W; l.y=(l.y+l.vy+H)%H;
    bgCtx.beginPath(); bgCtx.moveTo(l.x,l.y); bgCtx.lineTo(l.x+Math.cos(l.angle)*l.len,l.y+Math.sin(l.angle)*l.len);
    bgCtx.strokeStyle=`rgba(90,90,90,${l.a})`; bgCtx.lineWidth=0.4; bgCtx.stroke();
  });
  particles.forEach(p=>{
    p.x=(p.x+p.vx+W)%W; p.y=(p.y+p.vy+H)%H;
    bgCtx.beginPath(); bgCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
    bgCtx.fillStyle=`rgba(210,210,210,${p.a})`; bgCtx.fill();
  });
  const gr=bgCtx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.55);
  gr.addColorStop(0,`rgba(55,55,55,${0.03+0.012*Math.sin(noiseT*0.7)})`); gr.addColorStop(1,'rgba(0,0,0,0)');
  bgCtx.fillStyle=gr; bgCtx.fillRect(0,0,W,H);
}

/* ── CLOCK SIZE SYNC ─────────────────────────────────────────────────────── */
// Lit la taille CSS du canvas et synchronise les attributs width/height
function syncClockSizes() {
  [c1, c2].forEach(c => {
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const s    = Math.round(rect.width);
    if (s > 0) { c.width = s; c.height = s; }
  });
}

/* ── HORLOGE 12H (bizarres) ───────────────────────────────────────────────── */
function drawClock12(canvas, date) {
  const S=canvas.width; if (!S) return;
  const ctx=canvas.getContext('2d'), cx=S/2, cy=S/2, r=S/2-S*0.05;
  ctx.clearRect(0,0,S,S);

  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1; ctx.stroke();

  for (let i=0; i<60; i++) {
    const ang=(i/60)*Math.PI*2-Math.PI/2, isH=i%5===0;
    const out=r-1, inn=isH?r-r*0.12:r-r*0.06;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*inn,cy+Math.sin(ang)*inn); ctx.lineTo(cx+Math.cos(ang)*out,cy+Math.sin(ang)*out);
    ctx.strokeStyle=isH?'#555':'#272727'; ctx.lineWidth=isH?1.3:0.6; ctx.stroke();
  }

  const fs = Math.max(8, S * 0.04);
  ctx.font=`300 ${fs}px "DM Mono",monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
  for (let i=1; i<=12; i++) {
    const ang=(i/12)*Math.PI*2-Math.PI/2;
    ctx.fillStyle='#484848';
    ctx.fillText(i, cx+Math.cos(ang)*(r-r*0.2), cy+Math.sin(ang)*(r-r*0.2));
  }

  const h=date.getHours()%12, m=date.getMinutes(), s=date.getSeconds(), ms=date.getMilliseconds();
  const sA=((s+ms/1000)/60)*Math.PI*2-Math.PI/2;
  const mA=((m+(s+ms/1000)/60)/60)*Math.PI*2-Math.PI/2;
  const hA=((h+m/60)/12)*Math.PI*2-Math.PI/2;

  function hand(ang,len,w,col,tail){
    ctx.save(); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-Math.cos(ang)*tail,cy-Math.sin(ang)*tail); ctx.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);
    ctx.strokeStyle=col; ctx.lineWidth=w; ctx.stroke(); ctx.restore();
  }
  hand(hA,r*0.50,r*0.013,'#d0ccc4',r*0.06);
  hand(mA,r*0.70,r*0.009,'#909090',r*0.07);
  hand(sA,r*0.82,r*0.004,'#ffffff',r*0.08);
  ctx.beginPath(); ctx.arc(cx,cy,r*0.032,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r*0.013,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
}

/* ── HORLOGE 24H (normaux) ────────────────────────────────────────────────── */
const ZONES = [
  { label:'Matin',      from:13, to:18, color:'#c8b97a' },
  { label:'Après-midi', from:19, to:24, color:'#7a9cb8' },
  { label:'Soir',       from: 1, to: 6, color:'#b87a9c' },
  { label:'Nuit',       from: 7, to:12, color:'#7ab8a0' },
];

function h24ToAngle(h) { return (h/24)*Math.PI*2 - Math.PI/2; }

function drawClock24(canvas, date) {
  const S=canvas.width; if (!S) return;
  const ctx=canvas.getContext('2d'), cx=S/2, cy=S/2, r=S/2-S*0.05;
  ctx.clearRect(0,0,S,S);

  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1; ctx.stroke();

  const rO=r-1, rI=r-r*0.145;
  ZONES.forEach(z => {
    const a1=h24ToAngle(z.from), a2=h24ToAngle(z.to);
    ctx.beginPath(); ctx.arc(cx,cy,rO,a1,a2,false); ctx.arc(cx,cy,rI,a2,a1,true); ctx.closePath();
    ctx.fillStyle=z.color; ctx.globalAlpha=0.28; ctx.fill();
    ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(cx,cy,rO,a1,a2,false); ctx.arc(cx,cy,rI,a2,a1,true); ctx.closePath();
    ctx.strokeStyle=z.color; ctx.lineWidth=0.8; ctx.globalAlpha=0.55; ctx.stroke(); ctx.globalAlpha=1;
  });

  for (let i=0; i<24*2; i++) {
    const ang=(i/(24*2))*Math.PI*2-Math.PI/2, isH=i%2===0;
    const out=r-1, inn=isH?r-r*0.145:r-r*0.08;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*inn,cy+Math.sin(ang)*inn); ctx.lineTo(cx+Math.cos(ang)*out,cy+Math.sin(ang)*out);
    ctx.strokeStyle=isH?'#484848':'#242424'; ctx.lineWidth=isH?1.2:0.5; ctx.stroke();
  }

  const fs = Math.max(7, S * 0.032);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for (let i=0; i<24; i+=2) {
    const ang=h24ToAngle(i), tx=cx+Math.cos(ang)*(r-r*0.23), ty=cy+Math.sin(ang)*(r-r*0.23);
    let col='#3a3a3a';
    ZONES.forEach(z=>{ if(i>=z.from&&i<z.to) col=z.color; if(z.to===24&&i>=z.from) col=z.color; });
    ctx.font=`300 ${fs}px "DM Mono",monospace`; ctx.fillStyle=col;
    ctx.fillText(i===0?'0':i, tx, ty);
  }

  const h=date.getHours(), m=date.getMinutes(), s=date.getSeconds(), ms=date.getMilliseconds();
  const sA=((s+ms/1000)/60)*Math.PI*2-Math.PI/2;
  const mA=((m+(s+ms/1000)/60)/60)*Math.PI*2-Math.PI/2;
  const hA=((h+m/60)/24)*Math.PI*2-Math.PI/2;

  function hand(ang,len,w,col,tail){
    ctx.save(); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-Math.cos(ang)*tail,cy-Math.sin(ang)*tail); ctx.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);
    ctx.strokeStyle=col; ctx.lineWidth=w; ctx.stroke(); ctx.restore();
  }
  hand(hA,r*0.50,r*0.013,'#d0ccc4',r*0.06);
  hand(mA,r*0.70,r*0.009,'#909090',r*0.07);
  hand(sA,r*0.82,r*0.004,'#ffffff',r*0.08);
  ctx.beginPath(); ctx.arc(cx,cy,r*0.032,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r*0.013,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
}

/* ── LOOP ─────────────────────────────────────────────────────────────────── */
const c1=document.getElementById('c1');
const c2=document.getElementById('c2');

resize();
initParticles();

function loop() {
  drawBg();
  const now=new Date();
  drawClock12(c1, now);
  drawClock24(c2, now);
  requestAnimationFrame(loop);
}
loop();
