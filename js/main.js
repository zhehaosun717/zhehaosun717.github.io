/* ============================================
   MAIN — Module Coordinator
   ============================================ */

(function () {
  'use strict';

  /* ---------- Init ---------- */
  async function init() {
    // Initialize Three.js background
    if (typeof initShaderBackground === 'function') {
      initShaderBackground();
    }

    // Initialize animations (handles loader internally)
    if (typeof initScrollAnimations === 'function') {
      await initScrollAnimations();
    }

    // Project card interactions
    initProjectCards();
  }

  /* ---------- Project Card Expand/Collapse ---------- */
  function initProjectCards() {
    document.querySelectorAll('.project-card').forEach(card => {
      const header = card.querySelector('.project-card-header');
      const detail = card.querySelector('.project-detail');
      if (!header || !detail) return;

      header.addEventListener('click', () => {
        const isOpen = detail.classList.contains('expanded');

        // Close all
        document.querySelectorAll('.project-detail.expanded').forEach(d => {
          d.classList.remove('expanded');
        });

        // Toggle clicked
        if (!isOpen) {
          detail.classList.add('expanded');
        }
      });
    });
  }

  /* ---------- Touch Ripple (Mobile Feedback) ---------- */
  function initTouchRipple() {
    if (window.innerWidth >= 769) return; // Desktop doesn't need ripple

    const targets = document.querySelectorAll('.social-link, .nav-links a, .research-link, .pub-doi a, .pub-venue-link a, .contact-email a');
    targets.forEach(el => {
      el.classList.add('touch-ripple');
      el.addEventListener('pointerdown', (e) => {
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        el.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  /* ---------- Start ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    init();
    initTouchRipple();
  });
})();