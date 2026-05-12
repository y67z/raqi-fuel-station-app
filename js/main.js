/* =========================================================
   مستشفى المجر الكبير الأهلي — Interactive Experience Layer
   Advanced Interactions: Tilt 3D, Magnetic, Parallax, Counters
   ========================================================= */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initPreloader();
    initScrollProgress();
    initCustomCursor();
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initActiveLink();
    initRevealAnimations();
    initCounters();
    initTiltCards();
    initMagneticButtons();
    initParallaxOrbs();
    initTestimonials();
    initBackToTop();
  }

  /* =========================================================
     1) PRELOADER
     ========================================================= */
  function initPreloader() {
    const el = document.getElementById('preloader');
    if (!el) return;
    const hide = () => {
      setTimeout(() => el.classList.add('hidden'), 450);
    };
    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide);
    }
    // Safety fallback
    setTimeout(() => el.classList.add('hidden'), 3200);
  }

  /* =========================================================
     2) SCROLL PROGRESS BAR
     ========================================================= */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      const pct = height > 0 ? (scrolled / height) * 100 : 0;
      bar.style.setProperty('--progress', pct + '%');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* =========================================================
     3) CUSTOM CURSOR
     ========================================================= */
  function initCustomCursor() {
    if (isTouch) return;
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    if (!dot || !ring) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    document.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    }, { passive: true });

    // Smooth ring follow
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Hover effect over interactive elements
    const hoverTargets = 'a, button, .dept-card, .doctor-card, .testi-card, [data-tilt], [data-magnetic], .form-field';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) {
        dot.classList.add('hover');
        ring.classList.add('hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) {
        dot.classList.remove('hover');
        ring.classList.remove('hover');
      }
    });

    // Hide when leaving viewport
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    });
  }

  /* =========================================================
     4) NAVBAR SCROLL EFFECT
     ========================================================= */
  function initNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    const update = () => {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* =========================================================
     5) MOBILE MENU
     ========================================================= */
  function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    const close = () => {
      toggle.classList.remove('active');
      links.classList.remove('active');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !links.classList.contains('active');
      toggle.classList.toggle('active', open);
      links.classList.toggle('active', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    links.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

    document.addEventListener('click', (e) => {
      if (!links.contains(e.target) && !toggle.contains(e.target)) close();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) close();
    });
  }

  /* =========================================================
     6) SMOOTH SCROLL
     ========================================================= */
  function initSmoothScroll() {
    const OFFSET = 70;
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.pageYOffset - OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  /* =========================================================
     7) ACTIVE NAV LINK (based on scroll)
     ========================================================= */
  function initActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-link');
    if (!sections.length || !links.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
  }

  /* =========================================================
     8) REVEAL ANIMATIONS (with stagger for grid children)
     ========================================================= */
  function initRevealAnimations() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    // Auto-add reveal to grid children for stagger effect
    const gridContainers = document.querySelectorAll(
      '.depts-grid, .doctors-grid, .about-features, .about-stats, .emergency-grid, .hero-trust'
    );
    gridContainers.forEach(g => {
      Array.from(g.children).forEach((child, i) => {
        if (!child.classList.contains('reveal')) child.classList.add('reveal');
        child.style.transitionDelay = `${i * 70}ms`;
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  /* =========================================================
     9) ANIMATED COUNTERS
     ========================================================= */
  function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.counter, 10) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const start = performance.now();

      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const value = Math.floor(eased * target);
        el.textContent = value.toLocaleString('en-US') + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString('en-US') + suffix;
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  /* =========================================================
     10) 3D TILT CARDS (high-performance, rAF-throttled)
     ========================================================= */
  function initTiltCards() {
    if (prefersReducedMotion || isTouch) return;
    const cards = document.querySelectorAll('[data-tilt]');

    cards.forEach(card => {
      let rect = null;
      let frame = null;
      let targetRX = 0, targetRY = 0;
      let currentRX = 0, currentRY = 0;

      const MAX = 8;  // max rotation in degrees
      const LIFT = 6; // translateZ amount

      card.style.transformStyle = 'preserve-3d';
      card.style.willChange = 'transform';

      const update = () => {
        currentRX += (targetRX - currentRX) * 0.12;
        currentRY += (targetRY - currentRY) * 0.12;
        card.style.transform = `perspective(900px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) translateZ(${LIFT}px)`;
        if (Math.abs(targetRX - currentRX) > 0.01 || Math.abs(targetRY - currentRY) > 0.01) {
          frame = requestAnimationFrame(update);
        } else {
          frame = null;
        }
      };

      const onEnter = () => {
        rect = card.getBoundingClientRect();
      };

      const onMove = (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = (x / rect.width) - 0.5;  // -0.5 to 0.5
        const py = (y / rect.height) - 0.5;
        targetRX = -py * MAX * 2;  // invert Y
        targetRY = px * MAX * 2;
        if (!frame) frame = requestAnimationFrame(update);
      };

      const onLeave = () => {
        targetRX = 0;
        targetRY = 0;
        if (!frame) frame = requestAnimationFrame(update);
        rect = null;
      };

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  /* =========================================================
     11) MAGNETIC BUTTONS
     ========================================================= */
  function initMagneticButtons() {
    if (prefersReducedMotion || isTouch) return;
    const elements = document.querySelectorAll('[data-magnetic]');

    elements.forEach(el => {
      const STRENGTH = 0.35;
      let rect = null;

      el.style.willChange = 'transform';
      el.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';

      el.addEventListener('mouseenter', () => {
        rect = el.getBoundingClientRect();
      });

      el.addEventListener('mousemove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * STRENGTH;
        const dy = (e.clientY - cy) * STRENGTH;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        rect = null;
      });
    });
  }

  /* =========================================================
     12) PARALLAX ORBS + HERO CONTENT
     ========================================================= */
  function initParallaxOrbs() {
    if (prefersReducedMotion) return;

    const orbs = document.querySelectorAll('.hero-orb, .section-orbs .orb');
    const heroFloats = document.querySelectorAll('.hero-float');
    const heroCard = document.querySelector('.hero-card-main');

    let ticking = false;

    const update = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      orbs.forEach((orb, i) => {
        const speed = 0.08 + (i % 3) * 0.05;
        const offset = scrollY * speed;
        const existing = orb.dataset.origTransform || '';
        orb.style.transform = `translate3d(0, ${-offset}px, 0)`;
      });

      // Mouse parallax for hero (already wired in mousemove handler)
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    // Mouse-based parallax in hero
    const hero = document.querySelector('.hero');
    if (hero && !isTouch) {
      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        heroFloats.forEach((f, i) => {
          const depth = 12 + i * 4;
          f.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        });
      });

      hero.addEventListener('mouseleave', () => {
        heroFloats.forEach(f => { f.style.transform = ''; });
      });
    }
  }

  /* =========================================================
     13) TESTIMONIALS CAROUSEL
     ========================================================= */
  function initTestimonials() {
    const track = document.getElementById('testiTrack');
    const dotsWrap = document.getElementById('testiDots');
    const prev = document.querySelector('.testi-prev');
    const next = document.querySelector('.testi-next');
    if (!track) return;

    const slides = track.querySelectorAll('.testi-slide');
    if (!slides.length) return;

    let current = 0;
    const total = slides.length;
    let auto = null;

    // Build dots
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }

    const dots = dotsWrap ? dotsWrap.querySelectorAll('.dot') : [];

    const goTo = (idx) => {
      current = ((idx % total) + total) % total;
      // RTL: positive translateX moves right (toward origin in RTL)
      track.style.transform = `translateX(${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    };

    const nextSlide = () => goTo(current + 1);
    const prevSlide = () => goTo(current - 1);

    // In RTL, "next" button (chevron-right) should go to previous slide visually
    // But for clarity, chevron-left=prev, chevron-right=next. We'll map:
    // next button → advance counter (new testimonial)
    if (next) next.addEventListener('click', nextSlide);
    if (prev) prev.addEventListener('click', prevSlide);

    // Auto-play
    const start = () => { auto = setInterval(nextSlide, 5500); };
    const stop = () => { if (auto) clearInterval(auto); auto = null; };

    start();
    const container = document.querySelector('.testi-carousel');
    if (container) {
      container.addEventListener('mouseenter', stop);
      container.addEventListener('mouseleave', start);
    }

    // Touch/swipe
    let sx = 0, sy = 0, dx = 0, dy = 0, swiping = false;
    track.addEventListener('touchstart', (e) => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      swiping = true;
      stop();
    }, { passive: true });
    track.addEventListener('touchmove', (e) => {
      if (!swiping) return;
      dx = e.touches[0].clientX - sx;
      dy = e.touches[0].clientY - sy;
    }, { passive: true });
    track.addEventListener('touchend', () => {
      if (!swiping) return;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        // RTL: swiping right = previous, left = next
        if (dx > 0) prevSlide(); else nextSlide();
      }
      swiping = false;
      dx = 0; dy = 0;
      start();
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  nextSlide();  // RTL flow
      if (e.key === 'ArrowRight') prevSlide();
    });
  }

  /* =========================================================
     14) BACK TO TOP BUTTON
     ========================================================= */
  function initBackToTop() {
    const btn = document.getElementById('backTop');
    if (!btn) return;

    const update = () => {
      btn.classList.toggle('visible', window.scrollY > 500);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

})();
