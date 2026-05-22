/* =============================================================
   starfield.js — a lightweight canvas star field.

   Renders 3 parallax depth layers of twinkling stars plus the
   occasional shooting star. Designed to stay cheap:
     · device-pixel-ratio capped at 2
     · star count scales with viewport area, then is capped
     · animation pauses while the tab is hidden
     · static single-frame render under prefers-reduced-motion
   Exports initStarfield(canvasElement).
   ============================================================= */

const LAYERS = [
  /* parallax | radius range | twinkle rate | share of total */
  { parallax: 0.18, rMin: 0.4, rMax: 0.9, twinkle: 0.6, share: 0.55 },
  { parallax: 0.5, rMin: 0.7, rMax: 1.4, twinkle: 1.1, share: 0.32 },
  { parallax: 1.0, rMin: 1.2, rMax: 2.2, twinkle: 1.7, share: 0.13 },
];
/* Mostly white, a few blue-white and one warm tint. */
const TINTS = ['255,255,255', '255,255,255', '210,222,255', '178,198,255', '255,224,194'];

export function initStarfield(canvas) {
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');

  let w = 0;
  let h = 0;
  let stars = [];
  let shooting = null;
  let nextShootAt = 0;
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;
  let rafId = 0;
  let running = false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth || window.innerWidth;
    h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function build() {
    const total = Math.min(260, Math.max(70, Math.round((w * h) / 7000)));
    stars = [];
    for (const layer of LAYERS) {
      const count = Math.round(total * layer.share);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: layer.rMin + Math.random() * (layer.rMax - layer.rMin),
          base: 0.35 + Math.random() * 0.5,
          tw: layer.twinkle * (0.5 + Math.random()),
          phase: Math.random() * Math.PI * 2,
          parallax: layer.parallax,
          tint: TINTS[(Math.random() * TINTS.length) | 0],
        });
      }
    }
  }

  function spawnShootingStar() {
    const fromLeft = Math.random() > 0.5;
    shooting = {
      x: fromLeft ? -40 : w + 40,
      y: Math.random() * h * 0.5,
      vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 4),
      vy: 2.3 + Math.random() * 1.8,
      life: 1,
    };
  }

  function drawStatic() {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.tint},${(s.base * 0.85).toFixed(3)})`;
      ctx.fill();
    }
  }

  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);

    pointerX += (targetX - pointerX) * 0.05;
    pointerY += (targetY - pointerY) * 0.05;
    const scroll = window.scrollY || 0;
    const t = now * 0.001;

    ctx.clearRect(0, 0, w, h);

    for (const s of stars) {
      const ox = pointerX * 26 * s.parallax;
      const oy = scroll * 0.05 * s.parallax + pointerY * 18 * s.parallax;
      const x = (((s.x + ox) % w) + w) % w;
      const y = (((s.y - oy) % h) + h) % h;
      const twinkle = 0.5 + 0.5 * Math.sin(t * s.tw + s.phase);
      const alpha = s.base * (0.55 + 0.45 * twinkle);
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.tint},${alpha.toFixed(3)})`;
      ctx.fill();
      if (s.r > 1.5) {
        // cheap glow for the few near-layer stars
        ctx.beginPath();
        ctx.arc(x, y, s.r * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.tint},${(alpha * 0.12).toFixed(3)})`;
        ctx.fill();
      }
    }

    if (!shooting && now > nextShootAt) spawnShootingStar();
    if (shooting) {
      const s = shooting;
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.012;
      const tailX = s.x - s.vx * 9;
      const tailY = s.y - s.vy * 9;
      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, s.life).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      if (s.life <= 0 || s.x < -80 || s.x > w + 80 || s.y > h + 80) {
        shooting = null;
        nextShootAt = now + 7000 + Math.random() * 11000;
      }
    }
  }

  function start() {
    if (running) return;
    if (reduced.matches) {
      drawStatic();
      return;
    }
    running = true;
    nextShootAt = performance.now() + 3500;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  function rebuild() {
    resize();
    build();
    if (!running) drawStatic();
  }

  /* ---- events ---- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, 200);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  if (finePointer.matches) {
    window.addEventListener(
      'pointermove',
      (e) => {
        targetX = e.clientX / window.innerWidth - 0.5;
        targetY = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true }
    );
  }

  const onReducedChange = () => {
    stop();
    rebuild();
    start();
  };
  if (reduced.addEventListener) reduced.addEventListener('change', onReducedChange);

  resize();
  build();
  start();
}
