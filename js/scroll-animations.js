/* ============================================
   SCROLL ANIMATIONS — Premium Cinema Grade
   Lenis smooth scroll + GSAP text reveals
   + cinematic section transitions & card reveals
   ============================================ */

(function () {
  'use strict';

  /* ---------- Lenis Smooth Scroll ---------- */
  let lenis;
  function initLenis() {
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Custom Cursor ---------- */
  function initCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor || window.innerWidth < 769) return;

    const dot = cursor.querySelector('.cursor-dot');
    const ring = cursor.querySelector('.cursor-ring');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let dotX = mouseX, dotY = mouseY;
    let ringX = mouseX, ringY = mouseY;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateCursor() {
      // Dot follows mouse tightly
      dotX += (mouseX - dotX) * 0.35;
      dotY += (mouseY - dotY) * 0.35;
      dot.style.transform = `translate(${dotX - 3}px, ${dotY - 3}px)`;

      // Ring follows with lag for fluid feel
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;

      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  /* ---------- Scroll Progress Bar ---------- */
  function initScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (window.scrollY / h * 100) + '%';
    }, { passive: true });
  }

  /* ---------- Loader Counter Animation ---------- */
  function animateLoader() {
    return new Promise((resolve) => {
      const counter = document.getElementById('loader-counter');
      const loader = document.getElementById('loader');
      if (!counter || !loader) { resolve(); return; }

      const obj = { val: 0 };
      gsap.to(obj, {
        val: 100,
        duration: 2.0,
        ease: 'power2.inOut',
        onUpdate: () => {
          counter.textContent = Math.round(obj.val);
        },
        onComplete: () => {
          gsap.to(loader, {
            opacity: 0,
            duration: 0.6,
            ease: 'power2.inOut',
            onComplete: () => {
              loader.classList.add('loaded');
              resolve();
            }
          });
        }
      });
    });
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;

    // Show nav with slide-down
    gsap.to(nav, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: 0.2,
      onStart: () => nav.classList.add('visible')
    });

    // Scrolled state
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top -80px',
      onEnter: () => nav.classList.add('scrolled'),
      onLeaveBack: () => nav.classList.remove('scrolled'),
    });

    // Smooth scroll links
    nav.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target && lenis) {
          lenis.scrollTo(target, { offset: -60 });
        }
        // Close mobile menu
        document.getElementById('nav-links')?.classList.remove('open');
      });
    });

    // Mobile toggle
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
    }
  }

  /* ---------- Hero Text Reveal (Clip Mask) ---------- */
  function animateHero() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Title: each word slides up from behind the mask
    tl.to('.hero-title .text-reveal-inner', {
      y: '0%',
      duration: 1.2,
      stagger: 0.15,
    })
    // Subtitle slides up
    .to('.hero-subtitle .text-reveal-inner', {
      y: '0%',
      duration: 0.9,
      stagger: 0.1,
    }, '-=0.6')
    // Tagline slides up
    .to('.hero-tagline .text-reveal-inner', {
      y: '0%',
      duration: 0.9,
      stagger: 0.12,
    }, '-=0.5')
    // Scroll indicator fades in
    .to('.scroll-indicator', {
      opacity: 1,
      y: 0,
      duration: 0.6,
    }, '-=0.3');

    // Parallax: hero title moves slower on scroll for depth
    gsap.to('.hero-title', {
      yPercent: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      }
    });

    gsap.to('.hero-subtitle', {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      }
    });

    // Scroll indicator fades as you scroll
    gsap.to('.scroll-indicator', {
      opacity: 0,
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: '25% top',
        scrub: true,
      }
    });
  }

  /* ---------- Section Transition: Cinematic Clip Reveal ---------- */
  function initSectionTransitions() {
    // Each section transitions its content layer with a reveal
    gsap.utils.toArray('.section').forEach((section) => {
      // Skip hero — it has its own intro
      if (section.classList.contains('hero')) return;

      // When scrolled into view, animate in; when scrolled out, reverse
      gsap.fromTo(section,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            end: 'bottom -10%',
            toggleActions: 'play reverse play reverse',
          },
        });
    });
  }

  /* ---------- About Section ---------- */
  function animateAbout() {
    const section = document.querySelector('.about');
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        end: 'bottom 10%',
        toggleActions: 'play reverse play reverse',
      }
    });

    // Section label — cinematic typewriter entry
    tl.to(section.querySelector('.section-label'), {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
    })
    // Section title clip reveal with scale accent
    .to(section.querySelectorAll('.section-title .text-reveal-inner'), {
      y: '0%',
      duration: 1.1,
      stagger: 0.14,
      ease: 'power4.out',
    }, '-=0.35');

    // Portrait — cinematic reveal
    const portrait = section.querySelector('.about-portrait');
    if (portrait) {
      gsap.fromTo(portrait,
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: portrait,
            start: 'top 90%',
            end: 'bottom -20%',
            toggleActions: 'play reverse play reverse',
          }
        });
    }

    // About text paragraphs — staggered slide-up with fade
    gsap.utils.toArray('.about-text p').forEach((p, i) => {
      gsap.fromTo(p,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: p,
            start: 'top 90%',
            end: 'bottom -20%',
            toggleActions: 'play reverse play reverse',
          },
          delay: i * 0.1,
        });
    });

    // Timeline animation — line grows, items slide in
    const timeline = section.querySelector('.timeline');
    if (timeline) {
      ScrollTrigger.create({
        trigger: timeline,
        start: 'top 80%',
        onEnter: () => timeline.classList.add('revealed'),
        onLeaveBack: () => timeline.classList.remove('revealed'),
      });

      gsap.utils.toArray('.timeline-item').forEach((item, i) => {
        gsap.fromTo(item,
          { opacity: 0, x: -30, scale: 0.97 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 90%',
              end: 'bottom -20%',
              toggleActions: 'play reverse play reverse',
            },
            delay: i * 0.12,
          });
      });
    }
  }

  /* ---------- Works Section ---------- */
  function animateWorks() {
    const section = document.querySelector('.works');
    if (!section) return;

    // Section label — glow enter
    gsap.fromTo(section.querySelector('.section-label'),
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          end: 'bottom 10%',
          toggleActions: 'play reverse play reverse',
        }
      });

    // Marquee: fade in
    const marquee = section.querySelector('.works-marquee');
    if (marquee) {
      gsap.to(marquee, {
        opacity: 1,
        duration: 0.5,
        scrollTrigger: {
          trigger: marquee,
          start: 'top 90%',
          end: 'bottom -10%',
          toggleActions: 'play reverse play reverse',
        }
      });

      // Horizontal scroll on vertical scroll
      gsap.to(marquee, {
        xPercent: -30,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.3,
        }
      });
    }

    // Project cards: CINEMATIC staggered reveal with 3D-ish entrance
    gsap.utils.toArray('.project-card').forEach((card, i) => {
      const cardTl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 95%',
          end: 'bottom -10%',
          toggleActions: 'play reverse play reverse',
        }
      });

      // Card slides up + scales + fades
      cardTl.fromTo(card,
        {
          opacity: 0,
          y: 80,
          scale: 0.92,
          rotateX: 4,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          duration: 1.1,
          ease: 'power3.out',
          delay: (i % 2) * 0.15,
        });

      // Image inside zooms in from scaled-up
      const img = card.querySelector('.project-card-image img');
      if (img) {
        cardTl.fromTo(img,
          { scale: 1.15 },
          { scale: 1.0, duration: 1.4, ease: 'power2.out' },
          '-=1.0');
      }

      // Subtle parallax on each card while scrolling
      gsap.to(card, {
        yPercent: -5 - (i % 2) * 3,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.5,
        }
      });
    });
  }

  /* ---------- Research Section ---------- */
  function animateResearch() {
    const section = document.querySelector('.research');
    if (!section) return;

    // Section label & title with clip reveal
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        end: 'bottom 10%',
        toggleActions: 'play reverse play reverse',
      }
    });

    tl.fromTo(section.querySelector('.section-label'),
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
      })
    .to(section.querySelectorAll('.section-title .text-reveal-inner'), {
      y: '0%',
      duration: 1.1,
      stagger: 0.14,
      ease: 'power4.out',
    }, '-=0.35');

    // Research items — staggered slide-in from left with line-draw feel
    gsap.utils.toArray('.research-item').forEach((item, i) => {
      gsap.fromTo(item,
        { opacity: 0, x: -35, scale: 0.98 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 92%',
            end: 'bottom -20%',
            toggleActions: 'play reverse play reverse',
          },
          delay: i * 0.08,
        });
    });
  }

  /* ---------- Contact Section ---------- */
  function animateContact() {
    const section = document.querySelector('.contact');
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        end: 'bottom 10%',
        toggleActions: 'play reverse play reverse',
      }
    });

    tl.fromTo(section.querySelector('.section-label'),
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
      })
    .fromTo(section.querySelector('.social-links'),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
      }, '-=0.25')
    .fromTo(section.querySelector('.contact-form'),
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
      }, '-=0.4');

    // Individual social links — staggered bounce-in
    gsap.utils.toArray('.social-link').forEach((link, i) => {
      gsap.fromTo(link,
        { opacity: 0, y: 20, scale: 0.8 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: section.querySelector('.social-links'),
            start: 'top 90%',
            end: 'bottom -20%',
            toggleActions: 'play reverse play reverse',
          },
          delay: i * 0.08,
        });
    });

    // Form inputs — staggered slide-up
    gsap.utils.toArray('.form-group').forEach((group, i) => {
      gsap.fromTo(group,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section.querySelector('.contact-form'),
            start: 'top 90%',
            end: 'bottom -20%',
            toggleActions: 'play reverse play reverse',
          },
          delay: i * 0.1,
        });
    });
  }

  /* ---------- Scroll-Driven Background Color Transitions ---------- */
  function initBackgroundColorTransitions() {
    const sectionColors = [
      { selector: '.hero',    color: '#060b18' },
      { selector: '.about',   color: '#080e1f' },
      { selector: '.research',color: '#0a0f1e' },
      { selector: '.works',   color: '#0d1225' },
      { selector: '.contact', color: '#050910' },
    ];

    const wrapper = document.querySelector('.page-wrapper') || document.body;

    sectionColors.forEach((sc) => {
      const section = document.querySelector(sc.selector);
      if (!section) return;

      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        end: 'top 20%',
        scrub: true,
        onUpdate: () => {
          gsap.to(wrapper, {
            backgroundColor: sc.color,
            duration: 0.3,
            overwrite: 'auto',
          });
        },
        onEnterBack: () => {
          gsap.to(wrapper, {
            backgroundColor: sc.color,
            duration: 0.6,
            ease: 'power2.inOut',
            overwrite: 'auto',
          });
        }
      });
    });
  }

  /* ---------- Works Section Title Reveal ---------- */
  function animateWorksTitle() {
    const section = document.querySelector('.works');
    if (!section) return;

    const titleInners = section.querySelectorAll('.section-title .text-reveal-inner');
    if (titleInners.length) {
      gsap.fromTo(titleInners,
        { y: '105%' },
        {
          y: '0%',
          duration: 1.1,
          stagger: 0.14,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: section.querySelector('.section-title'),
            start: 'top 90%',
            end: 'bottom -20%',
            toggleActions: 'play reverse play reverse',
          }
        });
    }
  }

  /* ---------- Section In-View Detector ---------- */
  function initSectionInView() {
    gsap.utils.toArray('.section').forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => section.classList.add('in-view'),
        onLeave: () => section.classList.remove('in-view'),
        onEnterBack: () => section.classList.add('in-view'),
        onLeaveBack: () => section.classList.remove('in-view'),
      });
    });
  }

  /* ---------- Magnetic Hover Effect on Links ---------- */
  function initMagneticLinks() {
    if (window.innerWidth < 769) return;

    document.querySelectorAll('.social-link, .project-link, .form-submit').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, {
          x: x * 0.25,
          y: y * 0.25,
          duration: 0.3,
          ease: 'power2.out',
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)',
        });
      });
    });
  }

  /* ---------- Text highlight underline animations ---------- */
  function initHighlightAnimations() {
    gsap.utils.toArray('.highlight').forEach((el) => {
      gsap.fromTo(el,
        { backgroundSize: '0% 1px' },
        {
          backgroundSize: '100% 1px',
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            end: 'bottom -10%',
            toggleActions: 'play reverse play reverse',
          }
        });
    });
  }

  /* ---------- Init Everything ---------- */
  window.initScrollAnimations = async function () {
    gsap.registerPlugin(ScrollTrigger);

    initLenis();
    initCursor();
    initScrollProgress();

    // Loader animation
    await animateLoader();

    // Then trigger all reveals
    initNav();
    animateHero();
    animateAbout();
    animateResearch();
    animateWorks();
    animateWorksTitle();
    animateContact();
    initSectionInView();
    initSectionTransitions();
    initMagneticLinks();
    initHighlightAnimations();
    initBackgroundColorTransitions();
  };
})();
