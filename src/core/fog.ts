/** Slow drifting fog on a canvas. Paused when hidden; static when motion is reduced. */
export function startFog(canvas: HTMLCanvasElement, isStatic: () => boolean): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  const c = ctx;
  const blobs = Array.from({ length: 7 }, (_, i) => ({
    x: Math.random(),
    y: 0.3 + (i / 7) * 0.7,
    r: 0.25 + Math.random() * 0.25,
    speed: (0.004 + Math.random() * 0.006) * (i % 2 ? 1 : -1),
  }));
  let raf = 0;
  let last = 0;

  const resize = () => {
    canvas.width = Math.max(1, Math.floor(window.innerWidth / 2));
    canvas.height = Math.max(1, Math.floor(window.innerHeight / 2));
  };

  function draw(now: number) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    c.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of blobs) {
      if (!isStatic()) {
        b.x += b.speed * dt;
        if (b.x > 1.3) b.x = -0.3;
        if (b.x < -0.3) b.x = 1.3;
      }
      const cx = b.x * canvas.width;
      const cy = b.y * canvas.height;
      const r = b.r * canvas.width;
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(180,170,210,0.22)');
      g.addColorStop(1, 'rgba(180,170,210,0)');
      c.fillStyle = g;
      c.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }

  const loop = (now: number) => {
    draw(now);
    if (!isStatic()) raf = requestAnimationFrame(loop);
  };
  const onVisibility = () => {
    cancelAnimationFrame(raf);
    last = 0;
    if (document.visibilityState === 'visible') raf = requestAnimationFrame(loop);
  };

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
