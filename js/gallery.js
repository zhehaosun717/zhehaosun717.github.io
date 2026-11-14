/* ============================================================
   Project image gallery (lightbox)
   A card with a hidden <div class="project-gallery"> gets:
     - a small "N images" badge on its picture
     - a "View images" button in its expanded detail
   Clicking either opens a full-screen viewer with previous / next.
   ============================================================ */
(function () {
  'use strict';

  let box, imgEl, captionEl, counterEl, prevBtn, nextBtn;
  let items = [];
  let index = 0;
  let lastFocus = null;

  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Project images');
    box.setAttribute('data-lenis-prevent', '');
    box.innerHTML =
      '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous image">&#8249;</button>' +
      '<figure class="lightbox-figure">' +
        '<img class="lightbox-img" alt="">' +
        '<figcaption class="lightbox-meta"><span class="lightbox-caption"></span><span class="lightbox-counter"></span></figcaption>' +
      '</figure>' +
      '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next image">&#8250;</button>';
    document.body.appendChild(box);

    imgEl = box.querySelector('.lightbox-img');
    captionEl = box.querySelector('.lightbox-caption');
    counterEl = box.querySelector('.lightbox-counter');
    prevBtn = box.querySelector('.lightbox-prev');
    nextBtn = box.querySelector('.lightbox-next');

    box.querySelector('.lightbox-close').addEventListener('click', close);
    prevBtn.addEventListener('click', () => show(index - 1));
    nextBtn.addEventListener('click', () => show(index + 1));

    // click on the dark backdrop closes; clicks on the picture or buttons do not
    box.addEventListener('click', (e) => { if (e.target === box) close(); });

    // keep the page from scrolling underneath
    box.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
    box.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // swipe left / right on touch screens
    let startX = null;
    box.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    });

    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  function show(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    const it = items[index];
    imgEl.src = it.src;
    imgEl.alt = it.caption;
    captionEl.textContent = it.caption;
    counterEl.textContent = (index + 1) + ' / ' + items.length;
    const single = items.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
    // warm the next picture so paging feels instant
    if (!single) { const pre = new Image(); pre.src = items[(index + 1) % items.length].src; }
  }

  function open(list, start) {
    if (!box) build();
    items = list;
    lastFocus = document.activeElement;
    box.hidden = false;
    document.documentElement.classList.add('lightbox-open');
    show(start || 0);
    box.querySelector('.lightbox-close').focus();
  }

  function close() {
    box.hidden = true;
    document.documentElement.classList.remove('lightbox-open');
    imgEl.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function init() {
    document.querySelectorAll('.project-card').forEach((card) => {
      const src = card.querySelector('.project-gallery');
      if (!src) return;
      const list = Array.from(src.querySelectorAll('a')).map((a) => ({
        src: a.getAttribute('href'),
        caption: a.dataset.caption || '',
      }));
      if (!list.length) return;
      const label = list.length + (list.length === 1 ? ' image' : ' images');

      // badge on the picture; a click anywhere on the picture opens the viewer
      const media = card.querySelector('.project-card-image');
      if (media) {
        const badge = document.createElement('button');
        badge.type = 'button';
        badge.className = 'gallery-badge';
        badge.textContent = label;
        badge.setAttribute('aria-label', 'View ' + label);
        media.appendChild(badge);
        media.classList.add('has-gallery');
        media.addEventListener('click', (e) => { e.stopPropagation(); open(list, 0); });
      }

      // button in the expanded detail
      const detail = card.querySelector('.project-detail-content');
      if (detail) {
        let links = detail.querySelector('.project-detail-links');
        if (!links) {
          links = document.createElement('div');
          links.className = 'project-detail-links';
          detail.appendChild(links);
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'project-link project-link--button';
        btn.textContent = 'View ' + label;
        btn.addEventListener('click', (e) => { e.stopPropagation(); open(list, 0); });
        links.insertBefore(btn, links.firstChild);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
