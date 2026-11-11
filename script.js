/* KikiKrafts — vanilla JS: menu, smooth scroll, quiz, order builder, gallery, lightbox */
(function () {
  'use strict';

  var WA = 'https://wa.me/2348121430309';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function waLink(text) { return WA + '?text=' + encodeURIComponent(text); }
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- Header, mobile menu, smooth scroll ---------- */
  var header = $('.site-header');
  var toggle = $('.menu-toggle');
  var nav = $('#site-nav');

  function setMenu(open) {
    nav.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });

  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = $(id);
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Scroll reveal ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Catalog (used by quiz) ---------- */
  var CATALOG = {
    fabric:  { name: 'Adire fabric', msgName: 'adire fabric', price: '₦4,000 per yard', img: 'images/fabric-indigo-dip-adire-cloth.jpg', alt: 'Handmade adire fabric with an indigo dip-dyed edge' },
    tshirt:  { name: 'Adire T-shirt', msgName: 'adire T-shirt', price: '₦10,000 (price depends on size)', img: 'images/tshirt-purple-spiral-adire.jpg', alt: 'Adire T-shirt with a purple spiral pattern' },
    shorts:  { name: 'Adire unisex shorts', msgName: 'adire unisex shorts', price: '₦6,000', img: 'images/shorts-adire-print-flat-lay.jpg', alt: 'Adire unisex shorts with spiral and floral patterns' },
    notepad: { name: 'Adire notepad', msgName: 'adire notepad', price: 'Small ₦3,500 · Medium ₦6,000 · Large ₦7,000', img: 'images/notepad-indigo-spiral-adire-cover.jpg', alt: 'Adire notepad with an indigo spiral cover' },
    totebag: { name: 'Adire totebag', msgName: 'adire totebag', price: 'Price on request', img: null, alt: '' }
  };

  /* ---------- Quiz ---------- */
  var QUESTIONS = [
    { q: 'Who is it for?', opts: [['me', 'Myself'], ['gift', 'A gift'], ['team', 'My team or event']] },
    { q: 'What do you need?', opts: [['wear', 'Something to wear'], ['fabric', 'Fabric to sew with'], ['carry', 'Something to write in or carry']] },
    { q: 'What is your budget?', opts: [['low', 'Under ₦5,000'], ['mid', '₦5,000 to ₦10,000'], ['flex', 'Flexible']] }
  ];

  function recommend(a) {
    var items, note = '';
    if (a[1] === 'wear') {
      if (a[2] === 'low') { items = ['fabric']; note = 'Our wearables start at ₦6,000, so fabric at ₦4,000 per yard is the closest fit. Sew it your way, or ask about a custom piece.'; }
      else if (a[2] === 'mid') { items = ['shorts', 'tshirt']; note = 'The shorts are ₦6,000. The T-shirt is ₦10,000 and its price depends on size.'; }
      else { items = ['tshirt', 'shorts']; note = 'The T-shirt price depends on size. The shorts are ₦6,000.'; }
    } else if (a[1] === 'fabric') {
      items = ['fabric']; note = 'Fabric is ₦4,000 per yard. Tell us how many yards you need.';
    } else {
      if (a[2] === 'low') { items = ['notepad']; note = 'The small notepad is ₦3,500. Minimum order is 2 pieces.'; }
      else if (a[2] === 'mid') { items = ['notepad']; note = 'Medium is ₦6,000 and Large is ₦7,000. Sizes differ by 100 pages. Minimum order is 2 pieces.'; }
      else { items = ['notepad', 'totebag']; note = 'Notepads have a minimum order of 2 pieces. Ask us for the totebag price.'; }
    }
    if (a[0] === 'team') note += ' Ordering for a team or event? Request a bulk quote below.';
    if (a[0] === 'gift') note += ' Buying a gift? Tell us the date you need it.';
    return { items: items, note: note.trim(), team: a[0] === 'team' };
  }

  function initQuiz() {
    var root = $('[data-quiz]');
    if (!root) return;
    var step = 0, answers = [];

    function render() {
      root.innerHTML = '';
      if (step < QUESTIONS.length) {
        var q = QUESTIONS[step];
        var p = document.createElement('p'); p.className = 'quiz-progress'; p.textContent = 'Question ' + (step + 1) + ' of 3';
        var bar = document.createElement('div'); bar.className = 'quiz-bar'; bar.setAttribute('aria-hidden', 'true');
        bar.innerHTML = '<span style="width:' + ((step + 1) / 3 * 100) + '%"></span>';
        var h = document.createElement('h3'); h.textContent = q.q; h.tabIndex = -1;
        var wrap = document.createElement('div'); wrap.className = 'quiz-options';
        q.opts.forEach(function (o) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'quiz-option'; b.textContent = o[1];
          b.addEventListener('click', function () { answers[step] = o[0]; step++; render(); });
          wrap.appendChild(b);
        });
        root.appendChild(p); root.appendChild(bar); root.appendChild(h); root.appendChild(wrap);
        if (step > 0) { var back = document.createElement('button'); back.type = 'button'; back.className = 'link-arrow'; back.textContent = 'Back'; back.style.cssText = 'margin-top:16px;background:none;border-top:0;border-left:0;border-right:0;cursor:pointer;font-family:inherit;font-size:1rem'; back.addEventListener('click', function () { step--; render(); }); root.appendChild(back); }
        h.focus({ preventScroll: true });
      } else {
        var r = recommend(answers);
        var h2 = document.createElement('h3'); h2.textContent = r.items.length > 1 ? 'Your picks' : 'Your pick'; h2.tabIndex = -1;
        var list = document.createElement('div'); list.className = 'quiz-results';
        r.items.forEach(function (k) {
          var it = CATALOG[k];
          var row = document.createElement('div'); row.className = 'result';
          var media;
          if (it.img) { media = document.createElement('img'); media.src = it.img; media.alt = it.alt; media.width = 120; media.height = 150; media.loading = 'lazy'; }
          else { media = document.createElement('div'); media.className = 'result-pat'; media.setAttribute('role', 'img'); media.setAttribute('aria-label', 'Adire ring pattern'); }
          var info = document.createElement('div');
          var t = document.createElement('h4'); t.textContent = it.name;
          var pr = document.createElement('p'); pr.className = 'price'; pr.textContent = it.price;
          var a = document.createElement('a'); a.className = 'btn btn--primary btn--sm'; a.target = '_blank'; a.rel = 'noopener';
          a.href = waLink('Hi KikiKrafts, the quiz recommended the ' + it.msgName + ' for me. Is it available?');
          a.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-wa"/></svg><span>Order on WhatsApp</span>';
          info.appendChild(t); info.appendChild(pr); info.appendChild(a);
          row.appendChild(media); row.appendChild(info); list.appendChild(row);
        });
        var note = document.createElement('p'); note.className = 'quiz-note'; note.textContent = r.note;
        var actions = document.createElement('div'); actions.className = 'quiz-actions';
        var again = document.createElement('button'); again.type = 'button'; again.className = 'btn btn--outline'; again.textContent = 'Start again';
        again.addEventListener('click', function () { step = 0; answers = []; render(); });
        actions.appendChild(again);
        if (r.team) { var bulk = document.createElement('a'); bulk.className = 'btn btn--primary'; bulk.href = '#custom'; bulk.textContent = 'Request a bulk quote'; bulk.addEventListener('click', function (e) { e.preventDefault(); $('#custom').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); }); actions.appendChild(bulk); }
        root.appendChild(h2); root.appendChild(list); root.appendChild(note); root.appendChild(actions);
        h2.focus({ preventScroll: true });
      }
      root.setAttribute('aria-live', 'polite');
    }
    render();
    root.removeAttribute('aria-live');
    // announce changes only after first interaction
    root.addEventListener('click', function () { root.setAttribute('aria-live', 'polite'); }, { once: true });
  }

  /* ---------- Custom order builder ---------- */
  function initOrder() {
    var form = $('#order-form');
    if (!form) return;
    var f = {
      product: $('#f-product'), size: $('#f-size'), colour: $('#f-colour'), qty: $('#f-qty'),
      place: $('#f-place'), date: $('#f-date'), notes: $('#f-notes')
    };
    var SIZES = {
      notepad: ['Small (₦3,500)', 'Medium (₦6,000)', 'Large (₦7,000)'],
      fabric: ['Per yard'],
      clothing: ['Small', 'Medium', 'Large', 'XL', 'XXL', 'Not sure, please advise'],
      totebag: ['Standard', 'Not sure, please advise'],
      other: ['Not applicable', 'Please advise']
    };

    function sizeSet(p) {
      if (/notepad/i.test(p)) return SIZES.notepad;
      if (/fabric/i.test(p)) return SIZES.fabric;
      if (/totebag/i.test(p)) return SIZES.totebag;
      if (/else/i.test(p)) return SIZES.other;
      return SIZES.clothing;
    }
    function fillSizes() {
      var p = f.product.value;
      f.size.innerHTML = '';
      var first = document.createElement('option'); first.value = ''; first.textContent = p ? 'Choose a size' : 'Choose a product first';
      f.size.appendChild(first);
      if (p) sizeSet(p).forEach(function (s) { var o = document.createElement('option'); o.textContent = s; f.size.appendChild(o); });
    }
    f.product.addEventListener('change', function () {
      fillSizes();
      if (/notepad/i.test(f.product.value) && Number(f.qty.value) < 2) f.qty.value = 2;
    });

    // earliest date: 4 days from today (production takes 4 to 7 days)
    function iso(d) { var m = ('0' + (d.getMonth() + 1)).slice(-2), day = ('0' + d.getDate()).slice(-2); return d.getFullYear() + '-' + m + '-' + day; }
    var min = new Date(); min.setDate(min.getDate() + 4); f.date.min = iso(min);

    function setErr(key, msg) {
      var el = $('#e-' + key), input = f[key];
      if (el) el.textContent = msg || '';
      if (input) { input.classList.toggle('invalid', !!msg); if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
      return !msg;
    }
    function validate() {
      var ok = [], firstBad = null;
      function check(key, cond, msg) { var good = setErr(key, cond ? '' : msg); ok.push(good); if (!good && !firstBad) firstBad = f[key]; }
      check('product', f.product.value, 'Please choose a product.');
      check('size', f.size.value, 'Please choose a size.');
      check('colour', f.colour.value.trim(), 'Tell us the colour or pattern you would like.');
      var qty = Number(f.qty.value);
      var minQty = /notepad/i.test(f.product.value) ? 2 : 1;
      check('qty', qty >= minQty && Math.floor(qty) === qty, minQty === 2 ? 'Notepads have a minimum order of 2 pieces.' : 'Please enter a quantity of 1 or more.');
      check('place', f.place.value.trim(), 'Tell us where to deliver, or choose pickup.');
      var dOk = f.date.value && f.date.value >= f.date.min;
      check('date', dOk, f.date.value ? 'Production takes 4 to 7 days. Please pick a later date.' : 'Please choose the date you need it.');
      if (firstBad) firstBad.focus();
      return ok.every(Boolean);
    }
    function prettyDate(v) {
      if (!v) return '';
      var p = v.split('-'); var d = new Date(p[0], p[1] - 1, p[2]);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    function build() {
      var l = ['Hi KikiKrafts, I would like to place a custom order.', ''];
      l.push('Product: ' + f.product.value);
      l.push('Size: ' + f.size.value);
      l.push('Colour or pattern: ' + f.colour.value.trim());
      l.push('Quantity: ' + f.qty.value);
      l.push('Delivery location: ' + f.place.value.trim());
      l.push('Date needed: ' + prettyDate(f.date.value));
      if (f.notes.value.trim()) l.push('Notes: ' + f.notes.value.trim());
      l.push('', 'Please send me the price. I understand the 70% deposit starts production.');
      return l.join('\n');
    }
    function open(url) { window.open(url, '_blank', 'noopener'); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (validate()) open(waLink(build()));
    });
    ['product', 'size', 'colour', 'qty', 'place', 'date'].forEach(function (k) {
      f[k].addEventListener('input', function () { if (f[k].classList.contains('invalid')) setErr(k, ''); });
    });

    $('#bulk-btn').addEventListener('click', function () {
      var l = ['Hi KikiKrafts, I would like to request a bulk quote.', ''];
      if (f.product.value) l.push('Product: ' + f.product.value);
      if (f.size.value) l.push('Size: ' + f.size.value);
      if (f.colour.value.trim()) l.push('Colour or pattern: ' + f.colour.value.trim());
      if (Number(f.qty.value) > 1) l.push('Quantity: ' + f.qty.value);
      if (f.place.value.trim()) l.push('Delivery location: ' + f.place.value.trim());
      if (f.date.value) l.push('Date needed: ' + prettyDate(f.date.value));
      if (f.notes.value.trim()) l.push('Notes: ' + f.notes.value.trim());
      if (l.length === 2) l.push('Please tell me what you need to price my order.');
      open(waLink(l.join('\n')));
    });
  }

  /* ---------- Gallery + lightbox ---------- */
  function initGallery() {
    var track = $('.g-track');
    if (!track) return;
    var slides = $$('.g-slide', track);
    var dotsWrap = $('.g-dots');
    var dots = slides.map(function (s, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'g-dot';
      b.setAttribute('aria-label', 'Go to picture ' + (i + 1));
      b.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(b); return b;
    });

    function behavior() { return reduceMotion ? 'auto' : 'smooth'; }
    function goTo(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var s = slides[i];
      track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: behavior() });
    }
    function current() {
      var mid = track.scrollLeft + track.clientWidth / 2, best = 0, dist = Infinity;
      slides.forEach(function (s, i) { var d = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
      return best;
    }
    var ticking = false;
    function update() {
      var c = current();
      dots.forEach(function (d, i) { if (i === c) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      ticking = false;
    }
    track.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();

    function step(dir) {
      var per = Math.max(1, Math.round(track.clientWidth / slides[0].clientWidth));
      var target = current() + dir * (per > 1 ? per - 0 : 1);
      if (dir > 0 && track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) target = 0;
      if (dir < 0 && track.scrollLeft <= 4) target = slides.length - 1;
      goTo(target);
    }
    $('.g-prev').addEventListener('click', function () { step(-1); });
    $('.g-next').addEventListener('click', function () { step(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current() + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current() - 1); }
    });

    // Lightbox
    var dlg = $('.lightbox'), lbImg = $('.lb-img', dlg), cap = $('.lb-caption', dlg), idx = 0, lastBtn = null;
    function show(i) {
      idx = (i + slides.length) % slides.length;
      var img = $('img', slides[idx]);
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; cap.textContent = img.alt;
    }
    slides.forEach(function (s, i) {
      $('.g-open', s).addEventListener('click', function (e) {
        lastBtn = e.currentTarget; show(i);
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
        $('.lb-close', dlg).focus();
      });
    });
    function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    dlg.addEventListener('close', function () { if (lastBtn) lastBtn.focus(); goTo(idx); });
    $('.lb-close', dlg).addEventListener('click', close);
    $('.lb-prev', dlg).addEventListener('click', function () { show(idx - 1); });
    $('.lb-next', dlg).addEventListener('click', function () { show(idx + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(idx + 1); } else if (e.key === 'ArrowLeft') { show(idx - 1); }
    });
    // touch swipe inside lightbox
    var sx = null;
    dlg.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
  }

  initQuiz();
  initOrder();
  initGallery();
})();
