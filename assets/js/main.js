(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const menu = document.querySelector('.menu-toggle');
  const navigation = $('navigation');
  document.documentElement.classList.add('js');
  menu.hidden = false;
  function closeMenu(returnFocus = false) {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
    if (returnFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) closeMenu(true);
  });
  matchMedia('(min-width: 521px)').addEventListener('change', () => closeMenu());
  const header = document.querySelector('.site-header');
  const updateHeader = () => header.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();
  $('year').textContent = new Date().getFullYear();

  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => {
      element.classList.add('pending');
      observer.observe(element);
    });
  }

  const photos = window.portfolioPhotos;
  if (!Array.isArray(photos) || !photos.length) return;
  const gallery = $('gallery');
  const stage = $('photo-stage');
  const photo = $('active-photo');
  const filmstrip = $('filmstrip');
  const play = $('play');
  const expand = $('expand-gallery');
  let active = Math.max(0, photos.findIndex(item => item.src === photo.getAttribute('src')));
  let requested = active;
  let requestVersion = 0;
  let playing = false;
  let inView = false;
  let timer;
  let expanded = false;
  let focusBeforeExpand;
  let pointerStart;
  const thumbnailButtons = [];
  const pad = number => String(number).padStart(2, '0');
  ['previous', 'next', 'play', 'expand-gallery', 'browse', 'gallery-hint'].forEach(id => { $(id).hidden = false; });
  document.querySelectorAll('[data-photo-count]').forEach(element => { element.textContent = photos.length; });

  function resetTimer() {
    clearTimeout(timer);
    $('progress').classList.remove('running');
    if (!playing || document.hidden || (!inView && !expanded) || stage.getAttribute('aria-busy') === 'true') return;
    void $('progress').offsetWidth;
    $('progress').classList.add('running');
    timer = setTimeout(() => show(active + 1, false), 5000);
  }

  function setPlaying(value) {
    playing = value;
    play.setAttribute('aria-pressed', String(value));
    play.setAttribute('aria-label', value ? 'Pause slideshow' : 'Play slideshow');
    $('play-label').textContent = value ? 'Pause slideshow' : 'Play slideshow';
    $('play-symbol').textContent = value ? 'Ⅱ' : '▶';
    resetTimer();
  }

  function render(manual = false) {
    const item = photos[active];
    $('photo-title').textContent = item.title;
    $('photo-category').textContent = item.category.toUpperCase();
    $('photo-index').textContent = `${pad(active + 1)} / ${pad(photos.length)}`;
    thumbnailButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === active)));
    const button = thumbnailButtons[active];
    if (button) filmstrip.scrollTo({ left: button.offsetLeft - (filmstrip.clientWidth - button.offsetWidth) / 2, behavior: motion.matches ? 'instant' : 'smooth' });
    if (manual) $('gallery-announcement').textContent = `${item.title}. Photograph ${active + 1} of ${photos.length}.`;
  }

  async function show(index, manual = true) {
    if (manual) setPlaying(false);
    requested = (index % photos.length + photos.length) % photos.length;
    const next = requested;
    const version = ++requestVersion;
    clearTimeout(timer);
    $('progress').classList.remove('running');
    $('gallery-error').hidden = true;
    stage.setAttribute('aria-busy', 'true');
    const incoming = new Image();
    incoming.src = photos[next].src;
    try {
      await incoming.decode();
      if (version !== requestVersion) return;
      photo.classList.remove('entering');
      photo.src = incoming.src;
      photo.alt = photos[next].alt;
      photo.width = photos[next].width;
      photo.height = photos[next].height;
      void photo.offsetWidth;
      if (!motion.matches) photo.classList.add('entering');
      active = next;
      render(manual);
      const preload = new Image();
      preload.src = photos[(active + 1) % photos.length].src;
    } catch {
      if (version !== requestVersion) return;
      requested = active;
      $('gallery-error').textContent = 'This photograph could not load. Try another, or select it again to retry.';
      $('gallery-error').hidden = false;
      setPlaying(false);
    } finally {
      if (version === requestVersion) {
        stage.setAttribute('aria-busy', 'false');
        resetTimer();
      }
    }
  }

  photos.forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumbnail';
    button.setAttribute('aria-label', `Show photograph ${index + 1}: ${item.title}`);
    button.setAttribute('aria-pressed', String(index === active));
    const image = document.createElement('img');
    image.src = item.thumb;
    image.alt = '';
    image.width = 81;
    image.height = 58;
    image.loading = 'lazy';
    button.append(image);
    button.addEventListener('click', () => show(index));
    thumbnailButtons.push(button);
    filmstrip.append(button);
  });
  render();
  $('previous').addEventListener('click', () => show(requested - 1));
  $('next').addEventListener('click', () => show(requested + 1));
  play.addEventListener('click', () => setPlaying(!playing));
  // Keyboard navigation stays local to the gallery. Native buttons retain Space/Enter behavior.
  gallery.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(requested + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (event.key === ' ' && event.target === gallery) {
      event.preventDefault();
      setPlaying(!playing);
    }
  });
  gallery.addEventListener('focusin', event => { if (event.target !== play) setPlaying(false); });
  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || !event.isPrimary || event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointerup', event => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const x = event.clientX - pointerStart.x;
    const y = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y) * 1.5) show(requested + (x < 0 ? 1 : -1));
  });
  stage.addEventListener('pointercancel', () => { pointerStart = null; });
  photo.addEventListener('dragstart', event => event.preventDefault());

  function setExpanded(value) {
    if (value === expanded) return;
    expanded = value;
    gallery.classList.toggle('expanded', value);
    document.body.classList.toggle('locked', value);
    expand.textContent = value ? 'Close view ×' : 'Expand view ⤢';
    expand.setAttribute('aria-expanded', String(value));
    // Keep the rest of the document out of keyboard and assistive-technology navigation.
    for (let node = gallery; node.parentElement && node.parentElement !== document.documentElement; node = node.parentElement) {
      [...node.parentElement.children].filter(sibling => sibling !== node && !['SCRIPT','LINK'].includes(sibling.tagName)).forEach(sibling => { sibling.inert = value; });
    }
    if (value) {
      focusBeforeExpand = document.activeElement;
      gallery.setAttribute('role', 'dialog');
      gallery.setAttribute('aria-modal', 'true');
      expand.focus();
    } else {
      gallery.removeAttribute('role');
      gallery.removeAttribute('aria-modal');
      focusBeforeExpand?.focus({ preventScroll: true });
    }
    resetTimer();
  }
  expand.setAttribute('aria-expanded', 'false');
  expand.addEventListener('click', async () => {
    setPlaying(false);
    if (expanded) {
      if (document.fullscreenElement === gallery) await document.exitFullscreen().catch(() => {});
      setExpanded(false);
    } else {
      setExpanded(true);
      if (gallery.requestFullscreen && document.fullscreenEnabled) await gallery.requestFullscreen().catch(() => {});
    }
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) setExpanded(false);
  });
  gallery.addEventListener('keydown', event => {
    if (!expanded) return;
    if (event.key === 'Escape') {
      if (document.fullscreenElement === gallery) document.exitFullscreen().catch(() => setExpanded(false));
      else setExpanded(false);
    }
    if (event.key === 'Tab') {
      const buttons = [...gallery.querySelectorAll('button:not([hidden])')];
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  let gridBuilt = false;
  $('browse').addEventListener('click', () => {
    const open = $('browse').getAttribute('aria-expanded') !== 'true';
    if (!gridBuilt) {
      photos.forEach((item, index) => {
        const button = document.createElement('button');
        button.className = 'photo-tile';
        button.setAttribute('aria-label', `View ${item.title}`);
        const image = document.createElement('img');
        image.src = item.thumb;
        image.alt = item.alt;
        image.loading = 'lazy';
        image.width = 360;
        image.height = 260;
        const caption = document.createElement('span');
        caption.textContent = `${pad(index + 1)} / ${item.title}`;
        button.append(image, caption);
        button.addEventListener('click', () => {
          show(index);
          gallery.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
          gallery.focus({ preventScroll: true });
        });
        $('photo-grid').append(button);
      });
      gridBuilt = true;
    }
    $('photo-grid').hidden = !open;
    $('browse').setAttribute('aria-expanded', String(open));
    $('browse').textContent = open ? 'Close photo collection −' : 'Browse all photographs ＋';
  });
  document.addEventListener('visibilitychange', resetTimer);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      resetTimer();
    }, { threshold: 0.15 }).observe(gallery);
  } else inView = true;
  motion.addEventListener('change', () => {
    if (motion.matches) {
      setPlaying(false);
      document.querySelectorAll('.reveal.pending').forEach(element => element.classList.remove('pending'));
    }
  });
})();
