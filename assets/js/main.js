/* =============================================================
   main.js — site interactions.

   Loaded as a deferred ES module, so the DOM is ready on run.
   Wires up: star field, intro overlay, header state + scroll-spy,
   mobile nav, scroll-reveal, the gallery lightbox, the contact
   email + copy button, the footer easter egg, and the year stamp.
   ============================================================= */

import { initStarfield } from './starfield.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---- Star field ----------------------------------------------- */
initStarfield($('#starfield'));

/* ---- Intro overlay -------------------------------------------- */
(function setupIntro() {
  const intro = $('.intro');
  if (!intro) return;

  // Skip entirely for reduced-motion users and on repeat visits.
  if (reduced || sessionStorage.getItem('introSeen')) {
    intro.remove();
    return;
  }

  let done = false;
  const dismiss = () => {
    if (done) return;
    done = true;
    sessionStorage.setItem('introSeen', '1');
    intro.classList.add('is-done');
    ['keydown', 'wheel', 'touchstart'].forEach((ev) =>
      window.removeEventListener(ev, dismiss)
    );
    intro.addEventListener('transitionend', () => intro.remove(), { once: true });
    setTimeout(() => intro.remove(), 900); // fallback if transitionend misses
  };

  ['keydown', 'wheel', 'touchstart'].forEach((ev) =>
    window.addEventListener(ev, dismiss, { passive: true })
  );
  intro.addEventListener('click', dismiss);
  setTimeout(dismiss, 1100);
})();

/* ---- Header state + scroll-spy -------------------------------- */
(function setupScroll() {
  const header = $('.site-header');
  const links = $$('.nav__link');
  const portrait = $('.hero__portrait');
  const sections = links
    .map((link) => {
      const href = link.getAttribute('href') || '';
      const el = href.startsWith('#') ? document.getElementById(href.slice(1)) : null;
      return el ? { el, link } : null;
    })
    .filter(Boolean);

  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;

    if (header) header.classList.toggle('is-scrolled', y > 12);

    // Gentle parallax lift on the hero portrait while scrolling through the
    // hero. Skipped at y = 0 so it never overrides the entrance reveal.
    if (portrait && !reduced && y > 0 && y < window.innerHeight) {
      portrait.style.transform = `translateY(${y * 0.12}px)`;
    }

    // Scroll-spy: the lowest section whose top has passed the probe line.
    let current = sections[0];
    const probe = y + window.innerHeight * 0.32;
    for (const s of sections) {
      if (s.el.getBoundingClientRect().top + y <= probe) current = s;
    }
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }
    links.forEach((l) => l.classList.remove('is-active'));
    if (current) current.link.classList.add('is-active');
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
})();

/* ---- Mobile navigation ---------------------------------------- */
(function setupNav() {
  const toggle = $('.nav-toggle');
  const nav = $('.nav');
  if (!toggle || !nav) return;

  const close = () => {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', () =>
    document.body.classList.contains('nav-open') ? close() : open()
  );
  $$('a', nav).forEach((link) => link.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
      close();
      toggle.focus();
    }
  });
})();

/* ---- Scroll-reveal -------------------------------------------- */
(function setupReveal() {
  const items = $$('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
})();

/* ---- Astrophotography lightbox -------------------------------- */
(function setupLightbox() {
  const items = $$('.gallery__item');
  const box = $('.lightbox');
  if (!items.length || !box) return;

  const img = $('.lightbox__img', box);
  const caption = $('.lightbox__caption', box);
  const btnClose = $('.lightbox__close', box);
  const btnPrev = $('.lightbox__nav--prev', box);
  const btnNext = $('.lightbox__nav--next', box);
  const focusable = [btnPrev, btnNext, btnClose];
  const slides = items.map((el) => ({
    full: el.dataset.full,
    caption: el.dataset.caption || '',
  }));
  let index = 0;
  let lastFocus = null;

  const render = (i) => {
    index = (i + slides.length) % slides.length;
    img.src = slides[index].full;
    img.alt = slides[index].caption;
    caption.textContent = slides[index].caption;
  };
  const openAt = (i) => {
    lastFocus = document.activeElement;
    render(i);
    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    btnClose.focus();
  };
  const close = () => {
    box.classList.remove('is-open');
    box.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    img.removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  };

  items.forEach((el, i) => el.addEventListener('click', () => openAt(i)));
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => render(index - 1));
  btnNext.addEventListener('click', () => render(index + 1));
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.classList.contains('lightbox__stage')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') render(index - 1);
    else if (e.key === 'ArrowRight') render(index + 1);
    else if (e.key === 'Tab') {
      // keep focus within the lightbox controls
      e.preventDefault();
      const at = focusable.indexOf(document.activeElement);
      const step = e.shiftKey ? -1 : 1;
      focusable[(at + step + focusable.length) % focusable.length].focus();
    }
  });
})();

/* ---- Contact: assemble email + copy button -------------------- */
(function setupContact() {
  const email = ['zhuofu', 'uw.edu'].join('@'); // assembled to deter scrapers
  $$('[data-email]').forEach((el) => {
    el.textContent = email;
  });
  $$('[data-email-link]').forEach((el) => {
    el.href = `mailto:${email}`;
  });

  const copy = $('.copy-btn');
  if (!copy) return;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      const tmp = document.createElement('textarea');
      tmp.value = email;
      tmp.setAttribute('readonly', '');
      tmp.style.position = 'absolute';
      tmp.style.left = '-9999px';
      document.body.appendChild(tmp);
      tmp.select();
      try {
        document.execCommand('copy');
      } catch {
        /* clipboard unavailable — no-op */
      }
      tmp.remove();
    }
    copy.classList.add('is-copied');
    copy.setAttribute('aria-label', 'Email address copied');
    setTimeout(() => {
      copy.classList.remove('is-copied');
      copy.setAttribute('aria-label', 'Copy email address');
    }, 2000);
  });
})();

/* ---- Footer easter egg + year --------------------------------- */
(function setupFooter() {
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  const star = $('.easter-star');
  if (!star) return;
  star.addEventListener('click', () => {
    const nova = document.createElement('div');
    nova.className = 'supernova';
    document.body.appendChild(nova);
    nova.addEventListener('animationend', () => nova.remove(), { once: true });
    setTimeout(() => nova.remove(), 2000);
  });
})();
