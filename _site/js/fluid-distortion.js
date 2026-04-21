/**
 * Fluid Distortion — Homunculus-style SVG displacement on DOM elements
 *
 * Applies feTurbulence + feDisplacementMap filters to project card images,
 * creating visible warping/ripple effects when the mouse interacts.
 *
 * IMPORTANT: All transforms are applied to .project-card-image only,
 * NEVER to .project-card itself — that would override GSAP ScrollTrigger.
 */

(function () {
  'use strict';

  // ── Configuration (tuned for gentle water-like feel) ──
  const CONFIG = {
    maxDisplacement: 18,       // Max displacement scale (px) — gentle water ripple
    baseFreqMin: 0.006,        // Turbulence base frequency (low = large, slow waves)
    baseFreqMax: 0.018,        // Turbulence base frequency (high = finer detail)
    numOctaves: 3,             // Turbulence complexity
    influenceRadius: 280,      // Mouse influence radius (px) around card
    transitionSpeed: 0.05,     // Lerp speed toward target (slower = smoother)
    decaySpeed: 0.03,          // Lerp speed when mouse leaves (slow fade-out)
    seedAnimSpeed: 0.15,       // How fast the noise seed cycles (slower = more water-like)
    hoverTiltMax: 3,           // Max CSS 3D tilt (degrees) on hover — subtle
  };

  // Pre-calculate squared influence radius to avoid Math.sqrt in animation loop
  CONFIG.influenceRadiusSq = CONFIG.influenceRadius * CONFIG.influenceRadius;

  // ── State ──
  const mouse = { x: 0, y: 0, vx: 0, vy: 0, prevX: 0, prevY: 0 };
  const cards = [];
  let animFrame = null;

  // ── Create SVG filters ──
  function createDistortionSVG() {
    if (document.getElementById('fluid-distortion-svg')) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'fluid-distortion-svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.style.position = 'absolute';
    svg.style.pointerEvents = 'none';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);

    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, i) => {
      const filterId = `fluid-warp-${i}`;

      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', filterId);
      filter.setAttribute('x', '-10%');
      filter.setAttribute('y', '-10%');
      filter.setAttribute('width', '120%');
      filter.setAttribute('height', '120%');
      filter.setAttribute('color-interpolation-filters', 'sRGB');

      // feTurbulence — generates the noise pattern
      const turb = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
      turb.setAttribute('type', 'fractalNoise');
      turb.setAttribute('baseFrequency', `${CONFIG.baseFreqMin} ${CONFIG.baseFreqMin}`);
      turb.setAttribute('numOctaves', CONFIG.numOctaves);
      turb.setAttribute('seed', Math.floor(Math.random() * 100));
      turb.setAttribute('result', 'noise');

      // feDisplacementMap — warps the source image using the noise
      const disp = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
      disp.setAttribute('in', 'SourceGraphic');
      disp.setAttribute('in2', 'noise');
      disp.setAttribute('scale', '0');
      disp.setAttribute('xChannelSelector', 'R');
      disp.setAttribute('yChannelSelector', 'G');

      filter.appendChild(turb);
      filter.appendChild(disp);
      defs.appendChild(filter);

      // Find the image container — this is what we apply filter + tilt to
      const imageEl = card.querySelector('.project-card-image');

      cards.push({
        el: card,
        imageEl: imageEl,
        filterId,
        turbulence: turb,
        displacement: disp,
        currentScale: 0,
        targetScale: 0,
        currentFreq: CONFIG.baseFreqMin,
        targetFreq: CONFIG.baseFreqMin,
        seedPhase: Math.random() * 100,
        isNear: false,
        tiltX: 0,
        tiltY: 0,
        targetTiltX: 0,
        targetTiltY: 0,
      });

      // Apply CSS filter to image container only
      if (imageEl) {
        imageEl.style.filter = `url(#${filterId})`;
        imageEl.style.willChange = 'filter, transform';
      }
    });

    document.body.appendChild(svg);
  }

  // ── Mouse tracking ──
  function onMouseMove(e) {
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.vx = mouse.x - mouse.prevX;
    mouse.vy = mouse.y - mouse.prevY;
  }

  // ── Animation loop ──
  function animate() {
    animFrame = requestAnimationFrame(animate);

    const velocity = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
    const time = performance.now() * 0.001;

    cards.forEach((card) => {
      // Skip cards without an image container
      if (!card.imageEl) return;

      const rect = card.el.getBoundingClientRect();

      // Skip off-screen cards (perf optimization)
      if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;

      // Card center in viewport coords
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Distance from mouse to card center
      const dx = mouse.x - cx;
      const dy = mouse.y - cy;
      const distSq = dx * dx + dy * dy;

      // Is mouse hovering over the card?
      const isOverCard = (
        mouse.x >= rect.left && mouse.x <= rect.right &&
        mouse.y >= rect.top && mouse.y <= rect.bottom
      );

      // Only perform expensive Math.sqrt if within influence radius or hovered
      let dist = Infinity;
      if (isOverCard || distSq < CONFIG.influenceRadiusSq) {
        dist = Math.sqrt(distSq);
      }

      const influence = Math.max(0, 1 - dist / CONFIG.influenceRadius);
      card.isNear = isOverCard || influence > 0;

      if (card.isNear) {
        // Target displacement scales with proximity + velocity
        const velBoost = Math.min(velocity * 0.4, 8);  // Reduced velocity boost
        const proximityScale = isOverCard ? 1.0 : influence;
        card.targetScale = (CONFIG.maxDisplacement + velBoost) * proximityScale;

        // Higher frequency when mouse moves fast (finer ripple detail)
        card.targetFreq = CONFIG.baseFreqMin +
          (CONFIG.baseFreqMax - CONFIG.baseFreqMin) * Math.min(velocity * 0.03, 1);

        // 3D tilt toward mouse position (applied to IMAGE only)
        if (isOverCard) {
          const relX = (mouse.x - rect.left) / rect.width - 0.5;
          const relY = (mouse.y - rect.top) / rect.height - 0.5;
          card.targetTiltX = -relY * CONFIG.hoverTiltMax;
          card.targetTiltY =  relX * CONFIG.hoverTiltMax;
        }
      } else {
        card.targetScale = 0;
        card.targetFreq = CONFIG.baseFreqMin;
        card.targetTiltX = 0;
        card.targetTiltY = 0;
      }

      // Lerp current toward target
      const speed = card.isNear ? CONFIG.transitionSpeed : CONFIG.decaySpeed;
      card.currentScale += (card.targetScale - card.currentScale) * speed;
      card.currentFreq += (card.targetFreq - card.currentFreq) * speed;
      card.tiltX += (card.targetTiltX - card.tiltX) * 0.04;
      card.tiltY += (card.targetTiltY - card.tiltY) * 0.04;

      // Update SVG filter attributes
      card.displacement.setAttribute('scale', card.currentScale.toFixed(2));

      const freq = card.currentFreq.toFixed(4);
      card.turbulence.setAttribute('baseFrequency', `${freq} ${freq}`);

      // Animate seed for fluid motion (only when active)
      if (card.currentScale > 0.5) {
        const seedSpeed = CONFIG.seedAnimSpeed + velocity * 0.01;
        card.seedPhase += seedSpeed;
        card.turbulence.setAttribute('seed', Math.floor(card.seedPhase) % 500);
      }

      // Apply 3D tilt to IMAGE CONTAINER ONLY (never touch card.el.style.transform!)
      if (Math.abs(card.tiltX) > 0.01 || Math.abs(card.tiltY) > 0.01) {
        card.imageEl.style.transform =
          `perspective(800px) rotateX(${card.tiltX.toFixed(2)}deg) rotateY(${card.tiltY.toFixed(2)}deg)`;
      } else {
        card.imageEl.style.transform = '';
      }
    });
  }

  // ── Init ──
  function init() {
    const projectCards = document.querySelectorAll('.project-card');
    if (!projectCards.length) return;

    createDistortionSVG();
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    animate();

    // Pause animation when works section is not visible
    if ('IntersectionObserver' in window) {
      const worksSection = document.querySelector('.works');
      if (worksSection) {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            if (!animFrame) animate();
          } else {
            if (animFrame) {
              cancelAnimationFrame(animFrame);
              animFrame = null;
              // Reset filters when out of view
              cards.forEach((c) => {
                c.currentScale = 0;
                c.displacement.setAttribute('scale', '0');
                if (c.imageEl) {
                  c.imageEl.style.transform = '';
                }
              });
            }
          }
        }, { threshold: 0.01 });
        observer.observe(worksSection);
      }
    }
  }

  // Run on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
