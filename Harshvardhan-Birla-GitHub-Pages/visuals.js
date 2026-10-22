'use strict';
(() => {
  const canvas = document.getElementById('system-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.parentElement.classList.add('art-ready');
  let width = 0,
    height = 0,
    dpr = 1,
    frame = null,
    visible = true,
    phase = 0,
    lastTime = 0;
  let pointer = { x: 0, y: 0 },
    smooth = { x: 0, y: 0 };
  const reduced = () => !window.motionAllowed?.();
  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    restart();
  }
  function point(x, y, z, rotation) {
    const c = Math.cos(rotation),
      s = Math.sin(rotation),
      rx = x * c - z * s,
      rz = x * s + z * c;
    const tilt = 0.46 + smooth.y * 0.1,
      cy = Math.cos(tilt),
      sy = Math.sin(tilt),
      ry = y * cy - rz * sy,
      zz = y * sy + rz * cy;
    const scale = Math.min(width, height) / 345,
      perspective = 610 / (610 + zz);
    return {
      x: width * 0.5 + rx * scale * perspective + smooth.x * 8,
      y: height * 0.49 + ry * scale * perspective,
      z: zz,
      scale: scale * perspective,
    };
  }
  function path(points, color, lineWidth = 1, fill = null) {
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
  }
  function ring(y, radius, rotation, color, thick = 1) {
    const points = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      points.push(point(Math.cos(a) * radius, y, Math.sin(a) * radius, rotation));
    }
    path(points, color, thick);
  }
  function draw(timestamp) {
    const moving =
      !reduced() && visible && !document.hidden && !document.querySelector('dialog[open]');
    if (moving && lastTime) {
      phase += Math.min(timestamp - lastTime, 50) * 0.0001;
    }
    lastTime = timestamp;
    smooth.x += (pointer.x - smooth.x) * 0.045;
    smooth.y += (pointer.y - smooth.y) * 0.045;
    ctx.clearRect(0, 0, width, height);
    const light = document.documentElement.dataset.theme === 'light';
    const ink = light ? '#315539' : '#cde49a',
      sub = light ? '#839475' : '#607951',
      faint = light ? '#aebca0' : '#2e4032',
      peach = light ? '#9c4a32' : '#e9a385';
    const rotation = 0.6 + phase + smooth.x * 0.13;
    // An exploded stack of concentric rings: geometry is procedural, not an image.
    ctx.globalAlpha = 0.55;
    for (let layer = 0; layer < 7; layer++) {
      const y = (layer - 3) * 23;
      ring(y, 118, rotation, faint, 0.75);
      if (layer === 0 || layer === 6) ring(y, 91, rotation, sub, 0.7);
    }
    ctx.globalAlpha = 1;
    for (let layer = 0; layer < 3; layer++) {
      const y = (layer - 1) * 66;
      ring(y, 118, rotation, sub, 0.85);
      ring(y, 111, rotation, faint, 0.7);
      ring(y, 91, rotation, sub, 0.6);
      const arc = [];
      for (let j = 0; j <= 42; j++) {
        const a = (j / 42) * Math.PI * 1.3 + layer * 1.6 + phase * 0.3;
        arc.push(point(Math.cos(a) * 118, y, Math.sin(a) * 118, rotation));
      }
      path(arc, ink, 1.6);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2,
        x = Math.cos(a) * 118,
        z = Math.sin(a) * 118;
      path([point(x, -68, z, rotation), point(x, 68, z, rotation)], faint, 0.65);
      const p = point(x, -68, z, rotation);
      ctx.fillStyle = i % 3 === 0 ? peach : ink;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.3 * p.scale, 0, Math.PI * 2);
      ctx.fill();
    }
    // Core, drawn as a transparent wireframe cube.
    const size = 36;
    const vertices = [];
    for (let y of [-size, size])
      for (let x of [-size, size])
        for (let z of [-size, size]) vertices.push(point(x, y, z, rotation + 0.35));
    for (let i = 0; i < vertices.length; i++)
      for (let j = i + 1; j < vertices.length; j++) {
        const bits = i ^ j;
        if (bits === 1 || bits === 2 || bits === 4) path([vertices[i], vertices[j]], sub, 0.8);
      }
    const center = point(0, 0, 0, rotation);
    const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 28);
    glow.addColorStop(0, light ? '#48672b45' : '#d4ed9528');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(center.x - 28, center.y - 28, 56, 56);
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
    ctx.fill();
    // Signals orbit at different heights and travel down the stack.
    for (let i = 0; i < 6; i++) {
      const a = phase * 2 + i * 1.047,
        y = Math.sin(phase * 1.5 + i) * 65;
      const p = point(Math.cos(a) * 118, y, Math.sin(a) * 118, rotation);
      ctx.fillStyle = i === 2 ? peach : ink;
      ctx.shadowColor = ink;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([2, 5]);
    path([point(-160, 0, 0, rotation), point(160, 0, 0, rotation)], faint, 0.6);
    path([point(0, -115, 0, rotation), point(0, 115, 0, rotation)], faint, 0.6);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    // Fine measuring ticks on the base plane.
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2,
        p = point(Math.cos(a) * 137, 82, Math.sin(a) * 137, rotation),
        q = point(
          Math.cos(a) * (i % 3 === 0 ? 145 : 141),
          82,
          Math.sin(a) * (i % 3 === 0 ? 145 : 141),
          rotation,
        );
      path([p, q], faint, 0.7);
    }
    if (moving) {
      frame = requestAnimationFrame(draw);
    } else {
      frame = null;
      lastTime = 0;
    }
  }
  function restart() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = 0;
    draw(performance.now());
  }
  const parent = canvas.parentElement;
  parent.addEventListener(
    'pointermove',
    (e) => {
      if (reduced()) return;
      const box = parent.getBoundingClientRect();
      pointer.x = ((e.clientX - box.left) / box.width) * 2 - 1;
      pointer.y = ((e.clientY - box.top) / box.height) * 2 - 1;
    },
    { passive: true },
  );
  parent.addEventListener('pointerleave', () => {
    pointer = { x: 0, y: 0 };
  });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window)
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        restart();
      },
      { threshold: 0 },
    ).observe(canvas);
  document.addEventListener('visibilitychange', restart);
  window.addEventListener('portfolio-motion', restart);
  new MutationObserver(() => {
    if (frame === null) restart();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  new MutationObserver((records) => {
    if (records.some((record) => record.target.tagName === 'DIALOG')) restart();
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  resize();
})();
