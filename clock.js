/* ── BACKGROUND ───────────────────────────────────────────────────────────── */
const bgCanvas = document.getElementById('bg');
const bgCtx    = bgCanvas.getContext('2d');
let W, H, particles = [], lines = [];

function resize() {
  W = bgCanvas.width  = window.innerWidth;
  H = bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', () => { resize(); initParticles(); });
resize();

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
initParticles();

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

/* ── HORLOGE 12H (bizarres) ───────────────────────────────────────────────── */
function drawClock12(canvas, date) {
  const ctx=canvas.getContext('2d'), S=canvas.width, cx=S/2, cy=S/2, r=S/2-14;
  ctx.clearRect(0,0,S,S);

  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1; ctx.stroke();

  for (let i=0; i<60; i++) {
    const ang=(i/60)*Math.PI*2-Math.PI/2, isH=i%5===0;
    const out=r-2, inn=isH?r-16:r-8;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*inn,cy+Math.sin(ang)*inn); ctx.lineTo(cx+Math.cos(ang)*out,cy+Math.sin(ang)*out);
    ctx.strokeStyle=isH?'#555':'#272727'; ctx.lineWidth=isH?1.3:0.6; ctx.stroke();
  }

  ctx.font='300 11px "DM Mono",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
  for (let i=1; i<=12; i++) {
    const ang=(i/12)*Math.PI*2-Math.PI/2;
    ctx.fillStyle='#484848';
    ctx.fillText(i, cx+Math.cos(ang)*(r-28), cy+Math.sin(ang)*(r-28));
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
  hand(hA,r*0.50,3.5,'#d0ccc4',8);
  hand(mA,r*0.70,2.5,'#909090',10);
  hand(sA,r*0.82,1.2,'#ffffff',12);
  ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
}

/* ── HORLOGE 24H (normaux) avec 4 zones bien distinctes ──────────────────── */
// Cadran 24h : 0h en haut, sens horaire.
// angle(h) = (h/24)*2π - π/2
// Zones :
//   Matin      13h → 18h   (5h de large = 5/24 du tour)
//   Après-midi 19h → 24h   (5h de large)
//   Soir        1h →  6h   (5h de large)
//   Nuit        7h → 12h   (5h de large)
// Chaque zone fait exactement 1/4 de l'espace utile — elles ne se chevauchent PAS.

const ZONES = [
  { label:'Matin',      from:13, to:18, color:'#c8b97a' },
  { label:'Après-midi', from:19, to:24, color:'#7a9cb8' },
  { label:'Soir',       from: 1, to: 6, color:'#b87a9c' },
  { label:'Nuit',       from: 7, to:12, color:'#7ab8a0' },
];

function h24ToAngle(h) {
  // h peut être 0-24, 24 → même angle que 0
  return (h / 24) * Math.PI * 2 - Math.PI / 2;
}

function drawClock24(canvas, date) {
  const ctx=canvas.getContext('2d'), S=canvas.width, cx=S/2, cy=S/2, r=S/2-14;
  ctx.clearRect(0,0,S,S);

  ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
  ctx.strokeStyle='#2a2a2a'; ctx.lineWidth=1; ctx.stroke();

  // ── Arcs colorés ──
  const rO = r - 3;   // bord extérieur de l'anneau
  const rI = r - 20;  // bord intérieur de l'anneau

  ZONES.forEach(z => {
    const a1 = h24ToAngle(z.from);
    const a2 = h24ToAngle(z.to);  // z.to=24 → angle = (24/24)*2π-π/2 = 3π/2 ✓

    ctx.beginPath();
    ctx.arc(cx, cy, rO, a1, a2, false);
    ctx.arc(cx, cy, rI, a2, a1, true);
    ctx.closePath();
    ctx.fillStyle = z.color;
    ctx.globalAlpha = 0.28;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Contour de l'arc
    ctx.beginPath();
    ctx.arc(cx, cy, rO, a1, a2, false);
    ctx.arc(cx, cy, rI, a2, a1, true);
    ctx.closePath();
    ctx.strokeStyle = z.color;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  // ── Ticks 24h ──
  for (let i = 0; i < 24*2; i++) {
    const ang=(i/(24*2))*Math.PI*2-Math.PI/2, isH=i%2===0;
    const out=r-2, inn=isH?r-20:r-11;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(ang)*inn,cy+Math.sin(ang)*inn); ctx.lineTo(cx+Math.cos(ang)*out,cy+Math.sin(ang)*out);
    ctx.strokeStyle=isH?'#484848':'#242424'; ctx.lineWidth=isH?1.2:0.5; ctx.stroke();
  }

  // ── Chiffres 24h — toutes les 2h ──
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for (let i = 0; i < 24; i += 2) {
    const ang = h24ToAngle(i);
    const tx  = cx + Math.cos(ang)*(r-32);
    const ty  = cy + Math.sin(ang)*(r-32);

    // couleur selon zone
    let col = '#3a3a3a';
    ZONES.forEach(z => {
      if (i >= z.from && i < z.to) col = z.color;
      if (z.to === 24 && i >= z.from) col = z.color;
    });
    ctx.font = '300 8.5px "DM Mono",monospace';
    ctx.fillStyle = col;
    ctx.fillText(i === 0 ? '0' : i, tx, ty);
  }

  // ── Aiguilles 24h ──
  const h=date.getHours(), m=date.getMinutes(), s=date.getSeconds(), ms=date.getMilliseconds();
  const sA=((s+ms/1000)/60)*Math.PI*2-Math.PI/2;
  const mA=((m+(s+ms/1000)/60)/60)*Math.PI*2-Math.PI/2;
  const hA=((h+m/60)/24)*Math.PI*2-Math.PI/2;

  function hand(ang,len,w,col,tail){
    ctx.save(); ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(cx-Math.cos(ang)*tail,cy-Math.sin(ang)*tail); ctx.lineTo(cx+Math.cos(ang)*len,cy+Math.sin(ang)*len);
    ctx.strokeStyle=col; ctx.lineWidth=w; ctx.stroke(); ctx.restore();
  }
  hand(hA,r*0.50,3.5,'#d0ccc4',8);
  hand(mA,r*0.70,2.5,'#909090',10);
  hand(sA,r*0.82,1.2,'#ffffff',12);
  ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fillStyle='#0f0f0f'; ctx.fill();
}

/* ── LOOP ─────────────────────────────────────────────────────────────────── */
const c1=document.getElementById('c1');
const c2=document.getElementById('c2');

function loop() {
  drawBg();
  const now=new Date();
  drawClock12(c1, now);
  drawClock24(c2, now);
  requestAnimationFrame(loop);
}
loop();
