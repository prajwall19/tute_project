"use strict";
/* ===== LANDING.JS – Scroll reveals + particle network for the landing page ===== */

(function () {
  /* ---------- Scroll-triggered reveal ---------- */
  const revealEls = document.querySelectorAll(".blk, .final");

  if ("IntersectionObserver" in window) {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObs.observe(el));
  } else {
    /* Fallback: show everything immediately */
    revealEls.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Subtle particle network background ---------- */
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReduced) return;

  const canvas = document.createElement("canvas");
  canvas.className = "particles-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);

  const ctx = canvas.getContext("2d");
  let w, h;
  const nodes = [];
  const NODE_COUNT = Math.min(
    35,
    Math.floor(window.innerWidth * window.innerHeight * 0.00003)
  );
  const MAX_DIST = 150;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  /* Initialize nodes */
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.8 + 0.8,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);

    /* Move nodes */
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }

    /* Draw connections */
    ctx.strokeStyle = "rgba(92, 198, 203, 0.12)";
    ctx.lineWidth = 0.6;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          ctx.globalAlpha = 1 - dist / MAX_DIST;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    /* Draw nodes */
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(92, 198, 203, 0.35)";
    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
