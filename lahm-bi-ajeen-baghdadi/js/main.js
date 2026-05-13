/* =====================================================
   لحم بعجين البغدادي — Interactive Experience
   Menu tabs, tilt, magnetic, testimonials, WhatsApp order
   ===================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none)').matches || 'ontouchstart' in window;

  // WhatsApp number (international format, no +)
  const WA_NUMBER = '9647821227177';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initPreloader();
    initScrollProgress();
    initNavbar();
    initMobileMenu();
    initSmoothScroll();
    initActiveLink();
    initReveal();
    initCounters();
    initTilt();
    initMagnetic();
    initMenuTabs();
    initOrderModal();
    initTestimonials();
    initBackToTop();
    initHeroParallax();
  }

  /* ========== PRELOADER ========== */
  function initPreloader() {
    const el = document.getElementById('preloader');
    if (!el) return;
    const hide = () => setTimeout(() => el.classList.add('hidden'), 450);
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide);
    setTimeout(() => el.classList.add('hidden'), 3200);
  }

  /* ========== SCROLL PROGRESS ========== */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement;
      const pct = h.scrollHeight > h.clientHeight
        ? (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100
        : 0;
      bar.style.setProperty('--progress', pct + '%');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ========== NAVBAR ========== */
  function initNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    const update = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ========== MOBILE MENU ========== */
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
      if (window.innerWidth > 780) close();
    });
  }

  /* ========== SMOOTH SCROLL ========== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const t = document.querySelector(href);
        if (!t) return;
        e.preventDefault();
        const y = t.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  /* ========== ACTIVE LINK ========== */
  function initActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-link');
    if (!sections.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(s => obs.observe(s));
  }

  /* ========== REVEAL ========== */
  function initReveal() {
    const gridSelectors = '.menu-grid, .features-grid, .gallery-grid, .hero-meta, .about-stats';
    document.querySelectorAll(gridSelectors).forEach(g => {
      Array.from(g.children).forEach((c, i) => {
        if (!c.classList.contains('reveal')) c.classList.add('reveal');
        c.style.transitionDelay = `${i * 70}ms`;
      });
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  /* ========== COUNTERS ========== */
  function initCounters() {
    const cs = document.querySelectorAll('[data-counter]');
    if (!cs.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.counter, 10) || 0;
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target).toLocaleString('en-US') + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString('en-US') + suffix;
      };
      requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    cs.forEach(c => obs.observe(c));
  }

  /* ========== 3D TILT ========== */
  function initTilt() {
    if (prefersReducedMotion || isTouch) return;
    document.querySelectorAll('[data-tilt]').forEach(card => {
      let rect = null, frame = null;
      let tx = 0, ty = 0, cx = 0, cy = 0;
      const MAX = 8, LIFT = 6;

      card.style.transformStyle = 'preserve-3d';
      card.style.willChange = 'transform';

      const loop = () => {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        card.style.transform = `perspective(900px) rotateX(${cx}deg) rotateY(${cy}deg) translateZ(${LIFT}px)`;
        if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) {
          frame = requestAnimationFrame(loop);
        } else {
          frame = null;
        }
      };

      card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });
      card.addEventListener('mousemove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) - 0.5;
        const py = ((e.clientY - rect.top) / rect.height) - 0.5;
        tx = -py * MAX * 2;
        ty = px * MAX * 2;
        if (!frame) frame = requestAnimationFrame(loop);
      });
      card.addEventListener('mouseleave', () => {
        tx = 0; ty = 0;
        if (!frame) frame = requestAnimationFrame(loop);
        rect = null;
      });
    });
  }

  /* ========== MAGNETIC BUTTONS ========== */
  function initMagnetic() {
    if (prefersReducedMotion || isTouch) return;
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const S = 0.32;
      let rect = null;
      el.style.willChange = 'transform';
      el.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
      el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', (e) => {
        if (!rect) rect = el.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width / 2) * S;
        const dy = (e.clientY - rect.top - rect.height / 2) * S;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
        rect = null;
      });
    });
  }

  /* ========== HERO PARALLAX ========== */
  function initHeroParallax() {
    if (prefersReducedMotion || isTouch) return;
    const hero = document.querySelector('.hero');
    const chips = document.querySelectorAll('.chip');
    const plate = document.querySelector('.plate-wrap');
    if (!hero) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      chips.forEach((c, i) => {
        const d = 14 + i * 6;
        c.style.transform = `translate(${x * d}px, ${y * d}px)`;
      });
      if (plate) {
        plate.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
      }
    });
    hero.addEventListener('mouseleave', () => {
      chips.forEach(c => { c.style.transform = ''; });
      if (plate) plate.style.transform = '';
    });
  }

  /* ========== MENU TABS ========== */
  function initMenuTabs() {
    const tabs = document.querySelectorAll('.menu-tab');
    const cats = document.querySelectorAll('.menu-category');
    if (!tabs.length || !cats.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.tab;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        cats.forEach(cat => {
          const catType = cat.dataset.cat;
          const show = filter === 'all' || filter === catType;
          cat.classList.toggle('hidden', !show);
        });
      });
    });
  }

  /* ========== ORDER MODAL (WhatsApp) ========== */
  function initOrderModal() {
    const modal = document.getElementById('orderModal');
    const close = document.getElementById('orderClose');
    const cancel = document.getElementById('orderCancel');
    const confirm = document.getElementById('orderConfirm');
    const detail = document.getElementById('orderDetail');
    const backdrop = modal ? modal.querySelector('.order-backdrop') : null;

    if (!modal) return;

    let currentItem = null;

    const formatPrice = (p) => Number(p).toLocaleString('en-US');

    const openModal = (item) => {
      currentItem = item;
      detail.innerHTML = `${item.name}<br><span style="font-size:0.85rem; color:#c8b897; font-weight:600">السعر: ${formatPrice(item.price)} د.ع</span>`;
      const msg = encodeURIComponent(
        `السلام عليكم 🌟\nأود طلب:\n• ${item.name}\nالسعر: ${formatPrice(item.price)} د.ع\n\nشكراً لكم`
      );
      confirm.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    // Bind all order buttons
    document.querySelectorAll('.mi-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal({
          name: btn.dataset.name || 'طلب',
          price: btn.dataset.price || 0
        });
      });
    });

    close?.addEventListener('click', closeModal);
    cancel?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    // Close modal after WhatsApp link clicked
    confirm?.addEventListener('click', () => {
      setTimeout(closeModal, 500);
    });
  }

  /* ========== TESTIMONIALS ========== */
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

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      slides.forEach((_, i) => {
        const d = document.createElement('span');
        d.className = 'dot' + (i === 0 ? ' active' : '');
        d.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(d);
      });
    }
    const dots = dotsWrap ? dotsWrap.querySelectorAll('.dot') : [];

    const goTo = (i) => {
      current = ((i % total) + total) % total;
      track.style.transform = `translateX(${current * 100}%)`;
      dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    };
    const nextSlide = () => goTo(current + 1);
    const prevSlide = () => goTo(current - 1);

    next?.addEventListener('click', nextSlide);
    prev?.addEventListener('click', prevSlide);

    const start = () => { auto = setInterval(nextSlide, 5500); };
    const stop = () => { if (auto) { clearInterval(auto); auto = null; } };
    start();

    const wrap = document.querySelector('.testi-wrap');
    if (wrap) {
      wrap.addEventListener('mouseenter', stop);
      wrap.addEventListener('mouseleave', start);
    }

    let sx = 0, dx = 0, swiping = false;
    track.addEventListener('touchstart', (e) => {
      sx = e.touches[0].clientX; swiping = true; stop();
    }, { passive: true });
    track.addEventListener('touchmove', (e) => {
      if (!swiping) return;
      dx = e.touches[0].clientX - sx;
    }, { passive: true });
    track.addEventListener('touchend', () => {
      if (!swiping) return;
      if (Math.abs(dx) > 50) {
        if (dx > 0) prevSlide(); else nextSlide();
      }
      swiping = false; dx = 0; start();
    });
  }

  /* ========== BACK TO TOP ========== */
  function initBackToTop() {
    const btn = document.getElementById('backTop');
    if (!btn) return;
    const update = () => btn.classList.toggle('visible', window.scrollY > 500);
    update();
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

})();
