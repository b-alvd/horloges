/* ─────────────────────────────────────────────────────────────────────────────
   TAILLE DES HORLOGES
   On calcule la taille en JS pur, sans toucher au CSS.
   Sur mobile (<640px) : 80% de la largeur de l'écran, max 300px
   Sur desktop         : 280px fixe
───────────────────────────────────────────────────────────────────────────── */
function getClockPx() {
  const dpr  = window.devicePixelRatio || 1;
  const isMobile = window.innerWidth <= 640;
  const cssSize  = isMobile
    ? Math.min(Math.floor(window.innerWidth * 0.78), 300)
    : 280;
  return { css: cssSize, px: Math.round(cssSize * dpr), dpr };
}

function setCanvasSize(canvas, cssSize, pxSize) {
  canvas.width  = pxSize;
  canvas.height = pxSize;
  canvas.style.width  = cssSize + 'px';
  canvas.style.height = cssSize + 'px';
}

/* ── BACKGROUND ───────────────────────────────────────────────────────────── */
const bgCanvas = document.getElementById('bg');
const bgCtx    = bgCanvas.getContext('2d');
let W, H, particles = [], lines = [];

function resizeBg() {
  W = bgCanvas.width  = window.innerWidth;
  H = bgCanvas.height = window.innerHeight;
}

function rnd(a, b) { return a + Math.random() * (b - a); }

function initParticles() {
  particles = [];
  const n = Math.floor(W * H / 13000);
  for (let i = 0; i < n; i++)
    particles.push({ x:rnd(0,W),y:rnd(0,H),r:rnd(0.3,1.5),vx:rnd(-0.1,0.1),vy:rnd(-0.1,0.1),a:rnd(0.12,0.55) });
  lines = [];
  for (let i = 0; i < Math.floor(W/110); i++)
    lines.push({ x:rnd(0,W),y:rnd(0,H),len:rnd(40,180),angle:rnd(0,Math.PI*2),va:rnd(-0.002,0.002),vx:rnd(-0.04,0.04),vy:rnd(-0.04,0.04),a:rnd(0.04,0.11) });
}

let noiseT = 0;
function drawBg() {
  bgCtx.clearRect(0,0,W,H);
  bgCtx.fillStyle='#080808'; bgCtx.fillRect(0,0,W,H);
  noiseT += 0.004;
  for (let wi=0; wi<4; wi++) {
    const ph=wi/4*Math.PI*2,amp=H*.055,freq=.0014+wi*.0005,yB=H*(.18+wi*.19),al=.016+wi*.007;
    bgCtx.beginPath();
    for (let x=0;x<=W;x+=4) {
      const y=yB+Math.sin(x*freq+noiseT+ph)*amp+Math.sin(x*freq*2.4-noiseT*1.3+ph)*amp*.35;
      x===0?bgCtx.moveTo(x,y):bgCtx.lineTo(x,y);
    }
    bgCtx.strokeStyle=`rgba(170,170,170,${al})`; bgCtx.lineWidth=.5; bgCtx.stroke();
  }
  lines.forEach(l=>{
    l.angle+=l.va; l.x=(l.x+l.vx+W)%W; l.y=(l.y+l.vy+H)%H;
    bgCtx.beginPath(); bgCtx.moveTo(l.x,l.y); bgCtx.lineTo(l.x+Math.cos(l.angle)*l.len,l.y+Math.sin(l.angle)*l.len);
    bgCtx.strokeStyle=`rgba(90,90,90,${l.a})`; bgCtx.lineWidth=.4; bgCtx.stroke();
  });
  particles.forEach(p=>{
    p.x=(p.x+p.vx+W)%W; p.y=(p.y+p.vy+H)%H;
    bgCtx.beginPath(); bgCtx.arc(p.x,p.y,p.r,0,Math.PI*2);
    bgCtx.fillStyle=`rgba(210,210,210,${p.a})`; bgCtx.fill();
  });
  const gr=bgCtx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.55);
  gr.addColorStop(0,`rgba(55,55,55,${.03+.012*Math.sin(noiseT*.7)})`); gr.addColorStop(1,'rgba(0,0,0,0)');
  bgCtx.fillStyle=gr; bgCtx.fillRect(0,0,W,H);
}

/* ── HORLOGE 12H ──────────────────────────────────────────────────────────── */
function drawClock12(canvas, date, dpr) {
  const ctx=canvas.getContext('2d');
  const S=canvas.width, cx=S/2, cy=S/2, r=S/2-S*.05;
  ctx.clearRect(0,0,S,S);

  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle='#0f0f0f'; ctx.fill();
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=dpr; ctx.stroke();

  for (let i=0;i<60;i++) {
    const ang=(i/60)*Math.PI*2-Math.PI/2, isH=i%5===0;
    const out=r-dpr, inn=isH?r-r*.13:r-r*.07;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*inn,cy+Math.sin(ang)*inn); ctx.lineTo(cx+Math.cos(ang)*out,cy+Math.sin(ang)*out);
    ctx.strokeStyle=isH?'#555':'#272727'; ctx.lineWidth=isH?1.5*dpr:.6*dpr; ctx.stroke();
  }

  ctx.textAlign='center'; ctx.textBaseline='middle';
  for (let i=1;i<=12;i++) {
    const ang=(i/12)*Math.PI*2-Math.PI/2;
    ctx.font=`300 ${r*.13}px "DM Mono",monospace`;
    ctx.fillStyle='#484848';
    ctx.fillText(i, cx+Math.cos(ang)*(r-r*.21), cy+Math.sin(ang)*(r-r*.21));
  }

  const h=date.getHours()%12, m=date.getMinutes(), s=date.getSeconds(), ms=date.getMilliseconds();
  const sA=((s+ms/1000)/60)*Math.PI*2-Math.PI/2;
  const mA=((m+(s+ms/1000)/60)/60)*Math.PI*2-Math.PI/2;
  const hA=((h+m/60)/12)*Math.PI*2-Math.PI/2;

  function hand(ang,len,w,col,tail) {
    ctx.save(); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-Math.cos(ang)*tail,cy-Math.sin(ang)*tail); ctx.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);
    ctx.strokeStyle=col; ctx.lineWidth=w*dpr; ctx.stroke(); ctx.restore();
  }
  hand(hA,r*.50,3,'#d0ccc4',r*.07);
  hand(mA,r*.70,2,'#909090',r*.08);
  hand(sA,r*.82,1,'#ffffff',r*.09);
  ctx.beginPath(); ctx.arc(cx,cy,r*.034,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r*.014,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
}

/* ── HORLOGE 24H ──────────────────────────────────────────────────────────── */
const ZONES = [
  { from:13, to:18, color:'#c8b97a' },
  { from:19, to:24, color:'#7a9cb8' },
  { from: 1, to: 6, color:'#b87a9c' },
  { from: 7, to:12, color:'#7ab8a0' },
];
const h24a = h => (h/24)*Math.PI*2 - Math.PI/2;

function drawClock24(canvas, date, dpr) {
  const ctx=canvas.getContext('2d');
  const S=canvas.width, cx=S/2, cy=S/2, r=S/2-S*.05;
  ctx.clearRect(0,0,S,S);

  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle='#0f0f0f'; ctx.fill();
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=dpr; ctx.stroke();

  const rO=r-dpr, rI=r-r*.16;
  ZONES.forEach(z=>{
    const a1=h24a(z.from), a2=h24a(z.to);
    ctx.beginPath(); ctx.arc(cx,cy,rO,a1,a2,false); ctx.arc(cx,cy,rI,a2,a1,true); ctx.closePath();
    ctx.fillStyle=z.color; ctx.globalAlpha=.28; ctx.fill(); ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(cx,cy,rO,a1,a2,false); ctx.arc(cx,cy,rI,a2,a1,true); ctx.closePath();
    ctx.strokeStyle=z.color; ctx.lineWidth=.8*dpr; ctx.globalAlpha=.55; ctx.stroke(); ctx.globalAlpha=1;
  });

  for (let i=0;i<48;i++) {
    const ang=(i/48)*Math.PI*2-Math.PI/2, isH=i%2===0;
    const out=r-dpr, inn=isH?r-r*.16:r-r*.09;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*inn,cy+Math.sin(ang)*inn); ctx.lineTo(cx+Math.cos(ang)*out,cy+Math.sin(ang)*out);
    ctx.strokeStyle=isH?'#484848':'#242424'; ctx.lineWidth=isH?1.2*dpr:.5*dpr; ctx.stroke();
  }

  ctx.textAlign='center'; ctx.textBaseline='middle';
  for (let i=0;i<24;i+=2) {
    const ang=h24a(i), tx=cx+Math.cos(ang)*(r-r*.26), ty=cy+Math.sin(ang)*(r-r*.26);
    let col='#3a3a3a';
    ZONES.forEach(z=>{ if(i>=z.from&&i<z.to) col=z.color; if(z.to===24&&i>=z.from) col=z.color; });
    ctx.font=`300 ${r*.11}px "DM Mono",monospace`; ctx.fillStyle=col;
    ctx.fillText(i===0?'0':i, tx, ty);
  }

  const h=date.getHours(), m=date.getMinutes(), s=date.getSeconds(), ms=date.getMilliseconds();
  const sA=((s+ms/1000)/60)*Math.PI*2-Math.PI/2;
  const mA=((m+(s+ms/1000)/60)/60)*Math.PI*2-Math.PI/2;
  const hA=((h+m/60)/24)*Math.PI*2-Math.PI/2;

  function hand(ang,len,w,col,tail) {
    ctx.save(); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-Math.cos(ang)*tail,cy-Math.sin(ang)*tail); ctx.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);
    ctx.strokeStyle=col; ctx.lineWidth=w*dpr; ctx.stroke(); ctx.restore();
  }
  hand(hA,r*.50,3,'#d0ccc4',r*.07);
  hand(mA,r*.70,2,'#909090',r*.08);
  hand(sA,r*.82,1,'#ffffff',r*.09);
  ctx.beginPath(); ctx.arc(cx,cy,r*.034,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r*.014,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
}

/* ── INIT ─────────────────────────────────────────────────────────────────── */
const c1 = document.getElementById('c1');
const c2 = document.getElementById('c2');

function init() {
  resizeBg();
  initParticles();
  const { css, px, dpr } = getClockPx();
  setCanvasSize(c1, css, px);
  setCanvasSize(c2, css, px);
  window._dpr = dpr;
}

window.addEventListener('resize', init);
init();

/* ── LOOP ─────────────────────────────────────────────────────────────────── */
function loop() {
  drawBg();
  const now = new Date();
  const dpr = window._dpr || 1;
  drawClock12(c1, now, dpr);
  drawClock24(c2, now, dpr);
  requestAnimationFrame(loop);
}
loop();
