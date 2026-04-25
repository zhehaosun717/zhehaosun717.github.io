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

      const toggleAccordion = () => {
        const isOpen = detail.classList.contains('expanded');

        // Close all
        document.querySelectorAll('.project-card').forEach(c => {
          const cHeader = c.querySelector('.project-card-header');
          const cDetail = c.querySelector('.project-detail');
          if (cDetail && cDetail.classList.contains('expanded')) {
            cDetail.classList.remove('expanded');
            if (cHeader) cHeader.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle clicked
        if (!isOpen) {
          detail.classList.add('expanded');
          header.setAttribute('aria-expanded', 'true');
        }
      };

      header.addEventListener('click', toggleAccordion);

      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.key === ' ') e.preventDefault(); // Prevent page scroll on Space
          toggleAccordion();
        }
      });
    });
  }

  /* ---------- Contact Form (JS Submission) ---------- */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('form-submit-btn');
    const statusEl = document.getElementById('form-status');
    if (!form || !submitBtn || !statusEl) return;

    // Detect if we're on Netlify or another domain (e.g. GitHub Pages)
    const isNetlify = window.location.hostname.includes('netlify.app');
    const FORM_URL = isNetlify ? '/' : 'https://zhehaosun717.netlify.app/';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Disable button during submission
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      statusEl.className = 'form-status';
      statusEl.textContent = '';

      const formData = new FormData(form);
      const body = new URLSearchParams(formData).toString();

      try {
        const res = await fetch(FORM_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body,
        });

        if (res.ok) {
          statusEl.textContent = '✓ Message sent successfully! I will get back to you soon.';
          statusEl.className = 'form-status visible success';
          form.reset();
        } else {
          throw new Error(`Server responded with ${res.status}`);
        }
      } catch (err) {
        statusEl.textContent = '✗ Failed to send. Please email me directly at zhehaosun717@gmail.com';
        statusEl.className = 'form-status visible error';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
    });
  }

  /* ---------- Touch Ripple (Mobile Feedback) ---------- */
  function initTouchRipple() {
    if (window.innerWidth >= 769) return; // Desktop doesn't need ripple

    const targets = document.querySelectorAll('.form-submit, .social-link, .nav-links a, .research-link');
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
    initContactForm();
    initTouchRipple();
  });
})();