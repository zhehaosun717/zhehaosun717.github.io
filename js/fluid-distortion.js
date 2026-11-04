/**
 * Fluid Distortion — Desktop-Only Hover SVG Displacement on Project Cards
 *
 * Mobile & touch devices skip SVG feTurbulence/feDisplacementMap creation entirely
 * to prevent mobile GPU/CPU scroll jank. On desktop, the SVG filter is attached
 * ONLY while a card is actively hovered/distorted and detached at rest.
 */

(function () {
  'use strict';

  const isMobile =
    window.innerWidth < 769 ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    Boolean(window.matchMedia && window.matchMedia('(hover: none)').matches);

  const isWeakDevice =
    isMobile ||
    (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) ||
    (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4);

  let isReducedMotion =
    Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Mobile, touch-only, or weak devices: skip SVG displacement filters completely
  if (isMobile || isWeakDevice || isReducedMotion) {
    return;
  }

  const CONFIG = {
    maxDisplacement: 14,
    baseFreqMin: 0.006,
    baseFreqMax: 0.016,
    numOctaves: 2,
    influenceRadius: 240,
    transitionSpeed: 0.06,
    decaySpeed: 0.04,
    seedAnimSpeed: 0.14,
    hoverTiltMax: 2.5,
  };

  const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, prevX: -9999, prevY: -9999 };
  const cards = [];
  let animFrame = null;

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
      filter.setAttribute('x', '-8%');
      filter.setAttribute('y', '-8%');
      filter.setAttribute('width', '116%');
      filter.setAttribute('height', '116%');
      filter.setAttribute('color-interpolation-filters', 'sRGB');

      const turb = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
      turb.setAttribute('type', 'fractalNoise');
      turb.setAttribute('baseFrequency', `${CONFIG.baseFreqMin} ${CONFIG.baseFreqMin}`);
      turb.setAttribute('numOctaves', String(CONFIG.numOctaves));
      turb.setAttribute('seed', String(Math.floor(Math.random() * 100)));
      turb.setAttribute('result', 'noise');

      const disp = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
      disp.setAttribute('in', 'SourceGraphic');
      disp.setAttribute('in2', 'noise');
      disp.setAttribute('scale', '0');
      disp.setAttribute('xChannelSelector', 'R');
      disp.setAttribute('yChannelSelector', 'G');

      filter.appendChild(turb);
      filter.appendChild(disp);
      defs.appendChild(filter);

      const imageEl = card.querySelector('.project-card-image');

      cards.push({
        el: card,
        imageEl,
        filterId,
        filterActive: false,
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
    });

    document.body.appendChild(svg);
  }

  function onMouseMove(e) {
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.vx = mouse.x - mouse.prevX;
    mouse.vy = mouse.y - mouse.prevY;
  }

  function resetCards() {
    cards.forEach((c) => {
      c.currentScale = 0;
      c.targetScale = 0;
      c.tiltX = 0;
      c.tiltY = 0;
      c.targetTiltX = 0;
      c.targetTiltY = 0;
      if (c.displacement) c.displacement.setAttribute('scale', '0');
      if (c.imageEl) {
        c.imageEl.style.transform = '';
        if (c.filterActive) {
          c.imageEl.style.filter = '';
          c.filterActive = false;
        }
      }
    });
  }

  function animate() {
    if (document.hidden) {
      animFrame = null;
      return;
    }

    animFrame = requestAnimationFrame(animate);

    const velocity = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
    mouse.vx *= 0.85;
    mouse.vy *= 0.85;

    cards.forEach((card) => {
      if (!card.imageEl) return;

      const rect = card.el.getBoundingClientRect();
      if (rect.bottom < -80 || rect.top > window.innerHeight + 80) return;

      const isOverCard =
        mouse.x >= rect.left &&
        mouse.x <= rect.right &&
        mouse.y >= rect.top &&
        mouse.y <= rect.bottom;

      card.isNear = isOverCard;

      if (isOverCard && !isReducedMotion) {
        const velBoost = Math.min(velocity * 0.35, 6);
        card.targetScale = CONFIG.maxDisplacement + velBoost;
        card.targetFreq =
          CONFIG.baseFreqMin +
          (CONFIG.baseFreqMax - CONFIG.baseFreqMin) * Math.min(velocity * 0.025, 1);

        const relX = (mouse.x - rect.left) / rect.width - 0.5;
        const relY = (mouse.y - rect.top) / rect.height - 0.5;
        card.targetTiltX = -relY * CONFIG.hoverTiltMax;
        card.targetTiltY = relX * CONFIG.hoverTiltMax;
      } else {
        card.targetScale = 0;
        card.targetFreq = CONFIG.baseFreqMin;
        card.targetTiltX = 0;
        card.targetTiltY = 0;
      }

      const speed = card.isNear ? CONFIG.transitionSpeed : CONFIG.decaySpeed;
      card.currentScale += (card.targetScale - card.currentScale) * speed;
      card.currentFreq += (card.targetFreq - card.currentFreq) * speed;
      card.tiltX += (card.targetTiltX - card.tiltX) * 0.06;
      card.tiltY += (card.targetTiltY - card.tiltY) * 0.06;

      if (card.currentScale > 0.15) {
        if (!card.filterActive) {
          card.imageEl.style.filter = `url(#${card.filterId})`;
          card.filterActive = true;
        }
        card.displacement.setAttribute('scale', card.currentScale.toFixed(2));
        const freq = card.currentFreq.toFixed(4);
        card.turbulence.setAttribute('baseFrequency', `${freq} ${freq}`);
        card.seedPhase += CONFIG.seedAnimSpeed + velocity * 0.008;
        card.turbulence.setAttribute('seed', String(Math.floor(card.seedPhase) % 500));
      } else if (card.filterActive) {
        card.displacement.setAttribute('scale', '0');
        card.imageEl.style.filter = '';
        card.filterActive = false;
      }

      if (Math.abs(card.tiltX) > 0.02 || Math.abs(card.tiltY) > 0.02) {
        card.imageEl.style.transform = `perspective(800px) rotateX(${card.tiltX.toFixed(2)}deg) rotateY(${card.tiltY.toFixed(2)}deg)`;
      } else if (card.imageEl.style.transform) {
        card.imageEl.style.transform = '';
      }
    });
  }

  function init() {
    const projectCards = document.querySelectorAll('.project-card');
    if (!projectCards.length) return;

    createDistortionSVG();
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let isWorksVisible = false;
    if ('IntersectionObserver' in window) {
      const worksSection = document.querySelector('.works');
      if (worksSection) {
        const observer = new IntersectionObserver(
          (entries) => {
            isWorksVisible = entries[0].isIntersecting;
            if (isWorksVisible && !document.hidden) {
              if (!animFrame) animate();
            } else if (animFrame) {
              cancelAnimationFrame(animFrame);
              animFrame = null;
              resetCards();
            }
          },
          { threshold: 0.01 }
        );
        observer.observe(worksSection);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
