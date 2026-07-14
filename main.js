/* =====================================================================
   ZAVIER'S 7TH — MOTION & UI LAYER (v2)
   Core UI (modals, forms, countdown, FAQ) works without GSAP/Lenis.
   GSAP layer adds: preloader counter, char-split hero intro, reveals,
   pinned horizontal gallery, velocity skew, parallax, magnetic buttons.
   Exposes window.PartyUI for app.js (Firebase logic).
   ===================================================================== */

(function () {
  'use strict';

  /* Motion is ON by default — this is a party page and the animations are
     the experience. Add ?motion=0 to the URL to turn all motion off
     (also disables the CSS animations via the reduce-motion class). */
  const prefersReducedMotion = /[?&]motion=0/.test(window.location.search);
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const byId = (id) => document.getElementById(id);

  if (prefersReducedMotion) document.documentElement.classList.add('reduce-motion');

  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* Cinematic entry: always start at the top (preloader + hero intro),
     and keep the browser's scroll restore from fighting smooth scroll */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  window.PartyUI = {};

  /* ---------------------------------------------------------------
     MODALS
     --------------------------------------------------------------- */
  (function initModals() {
    function lockScroll(lock) {
      document.documentElement.style.overflow = lock ? 'hidden' : '';
      document.body.style.overflow = lock ? 'hidden' : '';
    }
    function openModal(modal) {
      if (!modal) return;
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
      lockScroll(true);
      requestAnimationFrame(() => {
        const first = modal.querySelector('input, textarea, button');
        if (first) first.focus({ preventScroll: true });
      });
    }
    function closeModal(modal) {
      if (!modal) return;
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
      if (!document.querySelector('.modal-backdrop[aria-hidden="false"]')) lockScroll(false);
    }
    function closeAllModals() {
      document.querySelectorAll('.modal-backdrop[aria-hidden="false"]').forEach(closeModal);
    }

    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-open-modal]');
      if (opener) { openModal(byId(opener.getAttribute('data-open-modal'))); return; }
      const closer = e.target.closest('[data-close-modal]');
      if (closer) { closeModal(closer.closest('.modal-backdrop')); return; }
      if (e.target.classList && e.target.classList.contains('modal-backdrop')) closeModal(e.target);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

    PartyUI.openModal = openModal;
    PartyUI.closeModal = closeModal;
    PartyUI.closeAllModals = closeAllModals;
  })();

  /* ---------------------------------------------------------------
     FLOATING LABELS
     --------------------------------------------------------------- */
  (function initFloatingLabels() {
    document.addEventListener('input', (e) => {
      if (e.target.matches && e.target.matches('.field-float .input')) {
        e.target.classList.toggle('has-value', e.target.value.trim().length > 0);
      }
    });
    document.addEventListener('reset', (e) => {
      setTimeout(() => {
        e.target.querySelectorAll('.field-float .input').forEach((i) => i.classList.remove('has-value'));
      }, 0);
    });
  })();

  /* ---------------------------------------------------------------
     FIELD ERRORS + LOADING + SUCCESS (PartyUI API for app.js)
     --------------------------------------------------------------- */
  PartyUI.setFieldError = function (inputId, errorId, message) {
    const input = byId(inputId);
    const err = byId(errorId);
    if (err) { err.textContent = message; err.classList.add('is-visible'); }
    const wrap = input && input.closest('.field-float, .field-plain');
    if (wrap) {
      wrap.classList.remove('has-error'); void wrap.offsetWidth;
      wrap.classList.add('has-error');
      setTimeout(() => wrap.classList.remove('has-error'), 500);
    }
  };
  PartyUI.clearFieldError = function (errorId) {
    const err = byId(errorId);
    if (err) { err.textContent = ''; err.classList.remove('is-visible'); }
  };
  PartyUI.clearFieldErrors = function (...errorIds) { errorIds.forEach(PartyUI.clearFieldError); };

  PartyUI.setLoading = function (btn, loading, loadingText) {
    if (!btn) return;
    const textEl = btn.querySelector('.btn-text');
    if (loading) {
      if (textEl) { btn.dataset.idleText = btn.dataset.idleText || textEl.textContent; if (loadingText) textEl.textContent = loadingText; }
      btn.classList.add('is-loading');
      btn.disabled = true;
    } else {
      if (textEl && btn.dataset.idleText) textEl.textContent = btn.dataset.idleText;
      btn.classList.remove('is-loading');
      btn.disabled = false;
    }
  };

  PartyUI.showSuccess = function (message) {
    const modal = byId('confirmModal');
    const msgEl = byId('confirmMessage');
    const badge = modal && modal.querySelector('.success-badge');
    if (msgEl) msgEl.textContent = message;
    if (badge) { badge.classList.remove('is-playing'); void badge.offsetWidth; badge.classList.add('is-playing'); }
    PartyUI.openModal(modal);
  };

  /* ---------------------------------------------------------------
     COMPANIONS
     --------------------------------------------------------------- */
  (function initCompanions() {
    const wrap = byId('companions');
    function makeField() {
      const item = document.createElement('div');
      item.className = 'companion-item';
      item.innerHTML =
        '<div class="field-float">' +
          '<input type="text" class="input" placeholder=" " autocomplete="off">' +
          '<label>Companion name</label>' +
        '</div>' +
        '<button type="button" class="btn btn--ghost btn--sm" data-remove-companion aria-label="Remove companion">✕</button>';
      return item;
    }
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-add-companion]') && wrap) {
        const item = makeField();
        wrap.appendChild(item);
        const input = item.querySelector('input');
        if (input) input.focus();
      }
      const removeBtn = e.target.closest('[data-remove-companion]');
      if (removeBtn) removeBtn.closest('.companion-item').remove();
    });
    PartyUI.getCompanions = function () {
      if (!wrap) return '';
      return Array.from(wrap.querySelectorAll('input')).map((i) => i.value.trim()).filter(Boolean).join(', ');
    };
    PartyUI.clearCompanions = function () { if (wrap) wrap.innerHTML = ''; };
  })();

  /* ---------------------------------------------------------------
     PASSWORD TOGGLE
     --------------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle-pass]');
    if (!btn) return;
    const target = byId(btn.getAttribute('data-toggle-pass'));
    if (!target) return;
    const showing = target.type === 'text';
    target.type = showing ? 'password' : 'text';
    btn.textContent = showing ? '👁' : '🙈';
    btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    target.focus();
  });

  /* ---------------------------------------------------------------
     COUNTDOWN
     --------------------------------------------------------------- */
  (function initCountdown() {
    const target = new Date('2026-10-31T00:00:00').getTime();
    const els = { d: byId('cdDays'), h: byId('cdHrs'), m: byId('cdMins'), s: byId('cdSecs') };
    const pad = (n) => String(n).padStart(2, '0');
    function pulse(el) {
      if (!el || prefersReducedMotion) return;
      el.classList.remove('is-tick'); void el.offsetWidth; el.classList.add('is-tick');
    }
    function tick() {
      const diff = target - Date.now();
      const done = diff <= 0;
      const vals = {
        d: done ? '00' : pad(Math.floor(diff / 86400000)),
        h: done ? '00' : pad(Math.floor((diff % 86400000) / 3600000)),
        m: done ? '00' : pad(Math.floor((diff % 3600000) / 60000)),
        s: done ? '🎉' : pad(Math.floor((diff % 60000) / 1000)),
      };
      Object.keys(vals).forEach((k) => {
        const el = els[k];
        if (!el || el.textContent === String(vals[k])) return;
        el.textContent = vals[k];
        pulse(el);
      });
    }
    if (els.d) { tick(); setInterval(tick, 1000); }
  })();

  /* ---------------------------------------------------------------
     FAQ
     --------------------------------------------------------------- */
  (function initFaq() {
    document.querySelectorAll('.faq-item').forEach((item) => {
      const btn = item.querySelector('.faq-question');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        document.querySelectorAll('.faq-item.is-open').forEach((other) => {
          if (other !== item) {
            other.classList.remove('is-open');
            const otherBtn = other.querySelector('.faq-question');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });
        item.classList.toggle('is-open', willOpen);
        btn.setAttribute('aria-expanded', String(willOpen));
      });
    });
  })();

  /* ---------------------------------------------------------------
     PARTICLES
     --------------------------------------------------------------- */
  (function initParticles() {
    const canvas = byId('bgParticles');
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, particles = [];
    const count = window.innerWidth < 700 ? 40 : 80;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
    }
    function seed() {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.4 + 0.4) * dpr,
        baseAlpha: Math.random() * 0.45 + 0.12,
        speed: (Math.random() * 0.14 + 0.03) * dpr,
        drift: (Math.random() - 0.5) * 0.07 * dpr,
        twinkle: Math.random() * 0.02 + 0.006,
        phase: Math.random() * Math.PI * 2,
      }));
    }
    let running = true;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(loop); });

    function loop() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.phase += p.twinkle;
        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const alpha = p.baseAlpha * (0.55 + 0.45 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(242,237,228,${alpha.toFixed(3)})`;
        ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    window.addEventListener('resize', () => { resize(); seed(); });
    resize(); seed();
    requestAnimationFrame(loop);
  })();

  /* ---------------------------------------------------------------
     CUSTOM CURSOR (fine pointers only)
     --------------------------------------------------------------- */
  (function initCursor() {
    const dot = byId('cursorDot');
    const ring = byId('cursorRing');
    if (!dot || !ring || isTouch) return;
    let mx = -100, my = -100;
    let dx = -100, dy = -100, rx = -100, ry = -100;
    let raf = null;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    function loop() {
      dx += (mx - dx) * 0.5;  dy += (my - dy) * 0.5;
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = `translate3d(${dx}px,${dy}px,0) translate(-50%,-50%)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
      raf = (Math.abs(mx - rx) > 0.2 || Math.abs(my - ry) > 0.2) ? requestAnimationFrame(loop) : null;
    }

    const HOVERABLE = 'a, button, .btn, .chip, .detail-row, .hg-card, .sthanks-card, .faq-question, input, textarea';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest && e.target.closest(HOVERABLE)) ring.classList.add('is-hovering');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest && e.target.closest(HOVERABLE)) ring.classList.remove('is-hovering');
    });
  })();

  /* ---------------------------------------------------------------
     SCROLL PROGRESS (no-GSAP fallback)
     --------------------------------------------------------------- */
  (function initScrollProgressFallback() {
    if (hasGsap) return;
    const bar = byId('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = max > 0 ? (window.scrollY / max) * 100 + '%' : '0%';
    }, { passive: true });
  })();

  /* ---------------------------------------------------------------
     GSAP MOTION LAYER
     --------------------------------------------------------------- */
  if (hasGsap) {
    initSmoothScroll();
    initScrollProgress();
    initMagnetic();
    initScrollReveals();
    initParallax();
    initVelocitySkew();
    initHorizontalGallery();
    initHeroPhotoLife();
    initSthanksTitle();
    initSthanksCards();
    initSthanksAmbience();
    setupHeroHiddenState();
    refreshOnContentSettle();
    runPreloader().then(playHeroIntro).then(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });

    function initSmoothScroll() {
      if (prefersReducedMotion || typeof window.Lenis === 'undefined' || !window.ScrollTrigger) return;
      const l = new Lenis({ duration: 1.1, smoothWheel: true });
      l.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => l.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    function initScrollProgress() {
      const bar = byId('scrollProgress');
      if (!bar || !window.ScrollTrigger) return;
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => { bar.style.width = (self.progress * 100) + '%'; } });
    }

    function initMagnetic() {
      if (isTouch || prefersReducedMotion) return;
      document.querySelectorAll('.btn, .chip, .admin-fab').forEach((el) => {
        el.addEventListener('mousemove', (e) => {
          const r = el.getBoundingClientRect();
          gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.24, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.5, ease: 'power3.out' });
        });
        el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,0.4)' }));
      });
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    }

    /* Split hero headline into chars for stagger reveal */
    function splitChars(el) {
      const text = el.textContent;
      el.setAttribute('aria-label', text);
      el.textContent = '';
      const frag = document.createDocumentFragment();
      for (const ch of text) {
        const wrap = document.createElement('span');
        wrap.className = 'char-wrap';
        wrap.setAttribute('aria-hidden', 'true');
        const c = document.createElement('span');
        c.className = 'char';
        c.textContent = ch === ' ' ? ' ' : ch;
        wrap.appendChild(c);
        frag.appendChild(wrap);
      }
      el.appendChild(frag);
    }

    function setupHeroHiddenState() {
      if (prefersReducedMotion) return;
      document.querySelectorAll('[data-split]').forEach(splitChars);
      gsap.set('.mega-title .char', { yPercent: 118, rotate: 5 });
      gsap.set('.mega-line--accent .line-inner', { yPercent: 118 });
      gsap.set(['.hero-badge', '.hero-sub', '.scroll-cue'], { opacity: 0, y: 28 });
      gsap.set('.hero-photo', { opacity: 0, scale: 0.55, rotate: (i) => [-16, 14, -10][i] || 0 });
      gsap.set('.marquee--tilt', { opacity: 0, y: 46 });
    }

    function runPreloader() {
      const pre = byId('preloader');
      const count = byId('preCount');
      if (!pre) return Promise.resolve();
      if (prefersReducedMotion) { pre.classList.add('is-done'); return Promise.resolve(); }
      return new Promise((resolve) => {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: 100, duration: 1.15, ease: 'power2.inOut',
          onUpdate: () => { if (count) count.textContent = Math.round(obj.v); },
          onComplete: () => {
            pre.classList.add('is-done');
            setTimeout(resolve, 350);
          },
        });
      });
    }

    function playHeroIntro() {
      if (prefersReducedMotion) return;
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to('.hero-badge', { opacity: 1, y: 0, duration: 0.9 }, 0.05)
        .to('.mega-title .char', { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.045 }, 0.12)
        .to('.mega-line--accent .line-inner', { yPercent: 0, duration: 1.2 }, 0.62)
        .to('.hero-sub', { opacity: 1, y: 0, duration: 0.9 }, 0.95)
        .to('.hero-photo', { opacity: 1, scale: 1, rotate: 0, duration: 1.1, ease: 'back.out(1.5)', stagger: 0.12 }, 0.85)
        .to('.marquee--tilt', { opacity: 1, y: 0, duration: 0.9 }, 1.25)
        .to('.scroll-cue', { opacity: 1, y: 0, duration: 0.9 }, 1.4);
    }

    function initScrollReveals() {
      if (prefersReducedMotion || !window.ScrollTrigger) {
        document.querySelectorAll('[data-reveal], [data-reveal-loop]').forEach((el) => {
          el.style.opacity = '1'; el.style.transform = 'none'; el.style.filter = 'none';
        });
        return;
      }
      const variants = {
        up: { from: { opacity: 0, y: 54 }, to: { opacity: 1, y: 0 } },
        scale: { from: { opacity: 0, scale: 0.86 }, to: { opacity: 1, scale: 1 } },
        blur: { from: { opacity: 0, y: 20, filter: 'blur(12px)' }, to: { opacity: 1, y: 0, filter: 'blur(0px)' } },
      };
      Object.entries(variants).forEach(([name, cfg]) => {
        const els = gsap.utils.toArray(`[data-reveal="${name}"]`);
        if (!els.length) return;
        gsap.set(els, cfg.from);
        ScrollTrigger.batch(els, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => gsap.to(batch, Object.assign({}, cfg.to, { duration: 1.1, ease: 'power3.out', stagger: 0.09, clearProps: 'filter' })),
        });
      });

      /* Special Thanks reveal — driven by ONE trigger on the whole section,
         never by each element's own box (that was the vanishing bug: a name
         near the top of a tall card would scroll "past" its own tiny trigger
         and hide while the card was still clearly on screen).

         Rules that make it bulletproof:
         - Cards/names fade in (staggered) as the section approaches.
         - Once shown they STAY shown the entire time the section is on
           screen AND while scrolling down past it into the RSVP section.
         - They only reset to hidden when you scroll fully back up ABOVE the
           section (so re-entering replays the cascade) — never in view.
         - A safety net force-reveals them if the section is anywhere near
           the viewport, so a late font-load/refresh can't leave them stuck. */
      const loopEls = gsap.utils.toArray('[data-reveal-loop]');
      const sthanksSection = document.getElementById('specialThanks');
      if (loopEls.length && sthanksSection) {
        gsap.set(loopEls, { opacity: 0, y: 44 });
        const revealTl = gsap.timeline({ paused: true })
          .to(loopEls, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05 });

        ScrollTrigger.create({
          trigger: sthanksSection,
          start: 'top 82%',
          onEnter: () => revealTl.play(),
          onEnterBack: () => revealTl.play(),
          onLeaveBack: () => revealTl.pause(0),
          invalidateOnRefresh: true,
        });

        const safetyReveal = () => {
          const r = sthanksSection.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.9 && r.bottom > 0) revealTl.play();
        };
        window.addEventListener('load', safetyReveal);
        setTimeout(safetyReveal, 2600);
      }
    }

    /* Web fonts (Fraunces) can swap in after ScrollTrigger first measures
       the page, shifting section heights. Without a refresh, trigger
       start/end values go stale and elements can appear to "vanish"
       mid-scroll on machines where the font loads slowly. Re-measure
       once fonts and all images have actually settled. */
    function refreshOnContentSettle() {
      if (!window.ScrollTrigger) return;
      const refresh = () => ScrollTrigger.refresh();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      window.addEventListener('load', refresh);
      setTimeout(refresh, 2500);
    }

    function initParallax() {
      if (prefersReducedMotion || !window.ScrollTrigger) return;
      gsap.utils.toArray('[data-speed]').forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-speed')) || 0;
        gsap.fromTo(el, { yPercent: -speed * 14 }, {
          yPercent: speed * 14, ease: 'none',
          scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
      });
    }

    function initVelocitySkew() {
      if (prefersReducedMotion || !window.ScrollTrigger) return;
      const els = document.querySelectorAll('.skewable');
      if (!els.length) return;
      const setters = Array.from(els).map((el) => gsap.quickSetter(el, 'skewY', 'deg'));
      const clampV = gsap.utils.clamp(-4, 4);
      const proxy = { skew: 0 };
      ScrollTrigger.create({
        onUpdate(self) {
          const skew = clampV(self.getVelocity() / -450);
          if (Math.abs(skew) > Math.abs(proxy.skew)) {
            proxy.skew = skew;
            gsap.to(proxy, {
              skew: 0, duration: 0.9, ease: 'power3', overwrite: true,
              onUpdate: () => setters.forEach((s) => s(proxy.skew)),
            });
          }
        },
      });
    }

    function initHorizontalGallery() {
      if (prefersReducedMotion || !window.ScrollTrigger) return;
      const section = byId('gallerySection');
      const track = byId('hgTrack');
      const viewport = section && section.querySelector('.hgallery-viewport');
      if (!section || !track || !viewport) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', () => {
        section.classList.add('is-pinned');
        const amount = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        gsap.to(track, {
          x: () => -amount(),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => '+=' + amount(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        return () => { section.classList.remove('is-pinned'); gsap.set(track, { x: 0 }); };
      });
    }

    function initHeroPhotoLife() {
      if (prefersReducedMotion || isTouch) return;
      const photos = document.querySelectorAll('.hero-photo');
      if (!photos.length) return;
      photos.forEach((p, i) => {
        gsap.to(p.querySelector('.hp-frame'), {
          y: '+=14', duration: 2.6 + i * 0.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.4,
        });
      });
      const hero = document.querySelector('.hero');
      if (!hero) return;
      hero.addEventListener('mousemove', (e) => {
        const cx = e.clientX / window.innerWidth - 0.5;
        const cy = e.clientY / window.innerHeight - 0.5;
        photos.forEach((p) => {
          const depth = parseFloat(p.getAttribute('data-depth')) || 0.05;
          gsap.to(p, { x: cx * depth * 700, y: cy * depth * 460, duration: 1.2, ease: 'power2.out' });
        });
      });
    }

    /* Special Thanks: heading chars rise on scroll (same language as hero) */
    function initSthanksTitle() {
      if (prefersReducedMotion || !window.ScrollTrigger) return;
      const line = document.querySelector('[data-split-scroll]');
      if (!line) return;
      splitChars(line);
      const chars = line.querySelectorAll('.char');
      const accent = document.querySelector('.sthanks .st-accent .line-inner');
      gsap.set(chars, { yPercent: 118, rotate: 5 });
      if (accent) gsap.set(accent, { yPercent: 118 });
      ScrollTrigger.create({
        trigger: line,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(chars, { yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.04, overwrite: true });
          if (accent) gsap.to(accent, { yPercent: 0, duration: 1, ease: 'expo.out', delay: 0.3, overwrite: true });
        },
        onLeaveBack: () => {
          gsap.to(chars, { yPercent: 118, rotate: 5, duration: 0.5, ease: 'power2.in', overwrite: true });
          if (accent) gsap.to(accent, { yPercent: 118, duration: 0.5, ease: 'power2.in', overwrite: true });
        },
      });
    }

    /* Special Thanks: subtle 3D tilt + glow tracking on the crew cards */
    function initSthanksCards() {
      if (isTouch || prefersReducedMotion) return;
      document.querySelectorAll('.sthanks-card').forEach((card) => {
        const glow = card.querySelector('.sthanks-glow');
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(card, { rotateY: px * 5, rotateX: -py * 5, y: -8, duration: 0.6, ease: 'power2.out', transformPerspective: 900 });
          if (glow) gsap.to(glow, { x: px * 70, y: py * 70, duration: 0.6, ease: 'power2.out' });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,0.5)' });
          if (glow) gsap.to(glow, { x: 0, y: 0, duration: 0.9, ease: 'power2.out' });
        });
      });
    }

    /* Special Thanks: the aurora breathes a little brighter in this scene */
    function initSthanksAmbience() {
      if (prefersReducedMotion || !window.ScrollTrigger) return;
      if (!document.querySelector('.sthanks')) return;
      const blobs = ['.aurora-1', '.aurora-2', '.aurora-3'];
      const base = [0.30, 0.22, 0.14];
      const lit = [0.44, 0.34, 0.24];
      ScrollTrigger.create({
        trigger: '.sthanks',
        start: 'top 65%',
        end: 'bottom 35%',
        onToggle(self) {
          blobs.forEach((sel, i) => {
            gsap.to(sel, { opacity: self.isActive ? lit[i] : base[i], duration: 1.2, ease: 'power2.out', overwrite: true });
          });
        },
      });
    }
  } else {
    document.querySelectorAll('.preloader').forEach((p) => p.classList.add('is-done'));
    document.querySelectorAll('[data-reveal], [data-reveal-loop]').forEach((el) => { el.style.opacity = '1'; });
  }

  document.documentElement.classList.add('js-ready');

  const scrollCue = document.querySelector('.scroll-cue');
  if (scrollCue) {
    scrollCue.addEventListener('click', () => {
      const next = byId('countdown-section');
      if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
})();
