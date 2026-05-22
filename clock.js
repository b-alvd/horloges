/* ── BACKGROUND ───────────────────────────────────────────────────────────── */
const bgCanvas = document.getElementById('bg');
const bgCtx    = bgCanvas.getContext('2d');
let W, H, particles = [], lines = [];

function resizeBg() {
  W = bgCanvas.width  = window.innerWidth;
  H = bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', () => { resizeBg(); initParticles(); syncCanvases(); });

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

/* ── SYNC CANVAS SIZE ─────────────────────────────────────────────────────── */
// Lit la taille CSS (qui est forcée carrée) et applique aux attributs width/height
// On multiplie par devicePixelRatio pour éviter le flou sur écrans Retina
function syncCanvases() {
  const dpr = window.devicePixelRatio || 1;
  [c1, c2].forEach(c => {
    const cssSize = c.getBoundingClientRect().width;
    if (cssSize > 0) {
      const px = Math.round(cssSize * dpr);
      c.width  = px;
      c.height = px;
      // on laisse le CSS gérer la taille d'affichage
      c.style.width  = cssSize + 'px';
      c.style.height = cssSize + 'px';
    }
  });
}

/* ── HORLOGE 12H ──────────────────────────────────────────────────────────── */
function drawClock12(canvas, date) {
  const dpr = window.devicePixelRatio || 1;
  const ctx  = canvas.getContext('2d');
  const S    = canvas.width;
  if (!S) return;
  const cx = S/2, cy = S/2, r = S/2 - S*0.05;

  ctx.clearRect(0,0,S,S);
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=dpr; ctx.stroke();

  for (let i=0; i<60; i++) {
    const ang=(i/60)*Math.PI*2-Math.PI/2, isH=i%5===0;
    const out=r-dpr, inn=isH?r-r*0.12:r-r*0.06;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*inn,cy+Math.sin(ang)*inn); ctx.lineTo(cx+Math.cos(ang)*out,cy+Math.sin(ang)*out);
    ctx.strokeStyle=isH?'#555':'#272727'; ctx.lineWidth=isH?1.5*dpr:0.6*dpr; ctx.stroke();
  }

  ctx.textAlign='center'; ctx.textBaseline='middle';
  for (let i=1; i<=12; i++) {
    const ang=(i/12)*Math.PI*2-Math.PI/2;
    ctx.font=`300 ${r*0.13}px "DM Mono",monospace`;
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
    ctx.strokeStyle=col; ctx.lineWidth=w*dpr; ctx.stroke(); ctx.restore();
  }
  hand(hA, r*0.50, 3, '#d0ccc4', r*0.06);
  hand(mA, r*0.70, 2, '#909090', r*0.07);
  hand(sA, r*0.82, 1, '#ffffff', r*0.08);
  ctx.beginPath(); ctx.arc(cx,cy,r*0.032,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r*0.013,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
}

/* ── HORLOGE 24H ──────────────────────────────────────────────────────────── */
const ZONES = [
  { from:13, to:18, color:'#c8b97a' },
  { from:19, to:24, color:'#7a9cb8' },
  { from: 1, to: 6, color:'#b87a9c' },
  { from: 7, to:12, color:'#7ab8a0' },
];
function h24ToAngle(h) { return (h/24)*Math.PI*2 - Math.PI/2; }

function drawClock24(canvas, date) {
  const dpr = window.devicePixelRatio || 1;
  const ctx  = canvas.getContext('2d');
  const S    = canvas.width;
  if (!S) return;
  const cx = S/2, cy = S/2, r = S/2 - S*0.05;

  ctx.clearRect(0,0,S,S);
  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=dpr; ctx.stroke();

  const rO=r-dpr, rI=r-r*0.15;
  ZONES.forEach(z => {
    const a1=h24ToAngle(z.from), a2=h24ToAngle(z.to);
    ctx.beginPath(); ctx.arc(cx,cy,rO,a1,a2,false); ctx.arc(cx,cy,rI,a2,a1,true); ctx.closePath();
    ctx.fillStyle=z.color; ctx.globalAlpha=0.28; ctx.fill(); ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(cx,cy,rO,a1,a2,false); ctx.arc(cx,cy,rI,a2,a1,true); ctx.closePath();
    ctx.strokeStyle=z.color; ctx.lineWidth=0.8*dpr; ctx.globalAlpha=0.55; ctx.stroke(); ctx.globalAlpha=1;
  });

  for (let i=0; i<48; i++) {
    const ang=(i/48)*Math.PI*2-Math.PI/2, isH=i%2===0;
    const out=r-dpr, inn=isH?r-r*0.15:r-r*0.08;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*inn,cy+Math.sin(ang)*inn); ctx.lineTo(cx+Math.cos(ang)*out,cy+Math.sin(ang)*out);
    ctx.strokeStyle=isH?'#484848':'#242424'; ctx.lineWidth=isH?1.2*dpr:0.5*dpr; ctx.stroke();
  }

  ctx.textAlign='center'; ctx.textBaseline='middle';
  for (let i=0; i<24; i+=2) {
    const ang=h24ToAngle(i), tx=cx+Math.cos(ang)*(r-r*0.24), ty=cy+Math.sin(ang)*(r-r*0.24);
    let col='#3a3a3a';
    ZONES.forEach(z=>{ if(i>=z.from&&i<z.to) col=z.color; if(z.to===24&&i>=z.from) col=z.color; });
    ctx.font=`300 ${r*0.11}px "DM Mono",monospace`; ctx.fillStyle=col;
    ctx.fillText(i===0?'0':i, tx, ty);
  }

  const h=date.getHours(), m=date.getMinutes(), s=date.getSeconds(), ms=date.getMilliseconds();
  const sA=((s+ms/1000)/60)*Math.PI*2-Math.PI/2;
  const mA=((m+(s+ms/1000)/60)/60)*Math.PI*2-Math.PI/2;
  const hA=((h+m/60)/24)*Math.PI*2-Math.PI/2;

  function hand(ang,len,w,col,tail){
    ctx.save(); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-Math.cos(ang)*tail,cy-Math.sin(ang)*tail); ctx.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);
    ctx.strokeStyle=col; ctx.lineWidth=w*dpr; ctx.stroke(); ctx.restore();
  }
  hand(hA, r*0.50, 3, '#d0ccc4', r*0.06);
  hand(mA, r*0.70, 2, '#909090', r*0.07);
  hand(sA, r*0.82, 1, '#ffffff', r*0.08);
  ctx.beginPath(); ctx.arc(cx,cy,r*0.032,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,r*0.013,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
}

/* ── INIT & LOOP ──────────────────────────────────────────────────────────── */
const c1 = document.getElementById('c1');
const c2 = document.getElementById('c2');

resizeBg();
initParticles();

// Attendre que le CSS soit appliqué avant de lire les tailles
requestAnimationFrame(() => {
  syncCanvases();
  loop();
});

function loop() {
  drawBg();
  const now = new Date();
  drawClock12(c1, now);
  drawClock24(c2, now);
  requestAnimationFrame(loop);
}
