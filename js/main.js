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

  /* ---------- Start ---------- */
  window.addEventListener('DOMContentLoaded', init);
})();