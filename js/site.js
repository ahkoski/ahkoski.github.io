/* Achievements: a small gamification layer. Progress lives only in this visitor's browser. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var TROPHIES = [
    { id: 'explorer', icon: '🧭', name: 'Explorer', hint: 'Visit three different pages' },
    { id: 'reader', icon: '📚', name: 'Case study reader', hint: 'Open a case study' },
    { id: 'player', icon: '🤿', name: 'Deep diver', hint: 'Open every role in my experience' },
    { id: 'popcorn', icon: '🍿', name: 'Popcorn time', hint: 'Play a video' },
    { id: 'diligence', icon: '📄', name: 'Due diligence', hint: 'Open the resume' },
    { id: 'hello', icon: '💌', name: 'Say hello', hint: 'Reach out by email or LinkedIn' },
    { id: 'cheat', icon: '🕹️', name: 'Cheat code', hint: 'Gamers know the one… On a phone? Find the joystick.', secret: true },
    { id: 'spin', icon: '🌀', name: 'Spin cycle', hint: 'Shapes on the home page like attention', secret: true },
    { id: 'persist', icon: '🥚', name: 'Persistence pays', hint: 'Some logos reward a little persistence', secret: true },
    { id: 'coin', icon: '🪙', name: 'Insert coin', hint: 'Every arcade has buttons. Press them!', secret: true },
    { id: 'apple', icon: '🍎', name: 'Teacher’s pet', hint: 'Look where it all started', secret: true },
    { id: 'stars', icon: '⭐', name: 'Star collector', hint: 'Stars are hiding around the site. Collect four!', secret: true }
  ];
  var LEVELS = ['Newcomer', 'Explorer', 'Learner', 'Achiever', 'Expert', 'Learning legend'];
  var KEY = 'ak-trophies-v1', OFF = 'ak-trophies-off', VIS = 'ak-pages-v1', STARS = 'ak-stars-v1', SND = 'ak-sound-v1';

  function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }

  var earned = load(KEY) || {};
  var popupsOff = !!load(OFF);
  var soundOn = load(SND) !== false;
  var actx = null;
  var TUNES = {
    trophy: [[659, .09], [784, .09], [1047, .18]],
    secret: [[523, .07], [659, .07], [784, .07], [1047, .07], [1319, .22]],
    level: [[392, .1], [523, .1], [659, .1], [784, .1], [1047, .3]],
    blip: [[988, .06], [1319, .1]],
    boss: [[523, .12], [523, .12], [523, .12], [659, .3], [587, .12], [698, .12], [880, .4]]
  };
  function play(name) {
    if (!soundOn) return;
    // Browsers only allow sound after the visitor has interacted with the page.
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var t0 = actx.currentTime + 0.02;
      TUNES[name].forEach(function (n) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'square'; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.06, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + n[1]);
        o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + n[1] + 0.02);
        t0 += n[1] * 0.9;
      });
    } catch (e) { /* audio unavailable */ }
  }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var total = TROPHIES.length;

  var toasts = document.createElement('div');
  toasts.className = 'toasts';
  toasts.setAttribute('role', 'status');
  toasts.setAttribute('aria-live', 'polite');
  document.body.appendChild(toasts);

  function count() { return TROPHIES.filter(function (t) { return earned[t.id]; }).length; }
  function level() { return LEVELS[Math.min(LEVELS.length - 1, Math.floor(count() / total * (LEVELS.length - 1) + 0.0001))]; }

  function updateHud() {
    document.querySelectorAll('.hud').forEach(function (b) {
      b.querySelector('.count').textContent = count() + '/' + total;
      b.setAttribute('aria-label', 'Trophies: ' + count() + ' of ' + total + ' unlocked. Open trophy case.');
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function confetti() {
    if (reduce) return;
    var colors = ['#FF6B6B', '#FFC93C', '#5EE6C8', '#FDF4FF', '#A3216B'];
    var box = el('div', 'confetti');
    box.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 28; i++) {
      var c = el('i');
      c.style.left = (40 + Math.random() * 55) + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.25) + 's';
      c.style.setProperty('--x', (Math.random() * 240 - 120) + 'px');
      c.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      box.appendChild(c);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 1600);
  }

  function toast(icon, title, label) {
    if (popupsOff) return;
    var t = el('div', 'toast');
    var badge = el('span', 'badge', icon);
    badge.setAttribute('aria-hidden', 'true');
    var txt = el('span');
    txt.appendChild(el('small', '', label || 'Achievement unlocked'));
    txt.appendChild(el('strong', '', title));
    var x = el('button', '', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    x.addEventListener('click', function () { t.remove(); });
    t.appendChild(badge); t.appendChild(txt); t.appendChild(x);
    toasts.appendChild(t);
    setTimeout(function () { t.remove(); }, 5200);
  }

  function bossToast() {
    var root = document.body.getAttribute('data-root') || '';
    var t = el('div', 'toast toast-boss');
    var badge = el('span', 'badge', '👑'); badge.setAttribute('aria-hidden', 'true');
    var txt = el('span');
    txt.appendChild(el('small', '', 'All ' + total + ' trophies! Boss level unlocked'));
    var a = el('a', '', 'Go behind the scenes'); a.href = root + 'behind-the-scenes.html';
    txt.appendChild(a);
    var x = el('button', '', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Dismiss');
    x.addEventListener('click', function () { t.remove(); });
    t.appendChild(badge); t.appendChild(txt); t.appendChild(x);
    toasts.appendChild(t);
    setTimeout(function () { t.remove(); }, 12000);
  }

  function unlock(id) {
    if (earned[id]) return;
    var t = TROPHIES.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var before = level();
    earned[id] = Date.now();
    save(KEY, earned);
    updateHud();
    toast(t.icon, t.name, t.secret ? 'Secret trophy unlocked' : 'Achievement unlocked');
    play(t.secret ? 'secret' : 'trophy');
    if (t.secret || count() === total) confetti();
    if (count() === total) {
      setTimeout(function () { play('boss'); bossToast(); }, 1200);
    } else if (level() !== before) {
      setTimeout(function () { toast('⬆️', level(), 'Level up'); play('level'); }, 800);
    }
  }

  // Trophy case dialog
  var dlg = el('dialog', 'trophy-panel');
  dlg.setAttribute('aria-labelledby', 'trophy-title');
  document.body.appendChild(dlg);

  function render() {
    dlg.textContent = '';
    var head = el('header');
    var hwrap = el('div');
    var h = el('h2', '', 'Trophy case'); h.id = 'trophy-title';
    hwrap.appendChild(h);
    hwrap.appendChild(el('p', '', 'Level: ' + level() + ' · ' + count() + ' of ' + total + ' unlocked'));
    var meter = el('div', 'meter');
    var fill = el('span'); fill.style.width = (count() / total * 100) + '%';
    meter.appendChild(fill);
    meter.setAttribute('role', 'progressbar');
    meter.setAttribute('aria-valuemin', '0'); meter.setAttribute('aria-valuemax', String(total));
    meter.setAttribute('aria-valuenow', String(count())); meter.setAttribute('aria-label', 'Trophies unlocked');
    hwrap.appendChild(meter);
    var close = el('button', 'close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close trophy case');
    close.addEventListener('click', function () { dlg.close(); });
    head.appendChild(hwrap); head.appendChild(close);
    dlg.appendChild(head);
    if (count() === total) {
      var done = el('p', 'complete', '👑 You found them all! ');
      var bl = el('a', '', 'Enter the boss level'); bl.href = (document.body.getAttribute('data-root') || '') + 'behind-the-scenes.html';
      done.appendChild(bl); dlg.appendChild(done);
    }

    var groups = [['Explore the site', false], ['Secret trophies', true]];
    groups.forEach(function (g) {
      dlg.appendChild(el('h3', 'trophy-group', g[0]));
      var ul = el('ul', 'trophy-list');
      TROPHIES.filter(function (t) { return !!t.secret === g[1]; }).forEach(function (t) {
        var got = !!earned[t.id];
        var li = el('li', got ? '' : 'locked');
        var b = el('span', 'badge', got ? t.icon : (t.secret ? '?' : '🔒')); b.setAttribute('aria-hidden', 'true');
        var s = el('span');
        s.appendChild(el('strong', '', got || !t.secret ? t.name : 'Hidden trophy'));
        s.appendChild(el('span', '', got ? 'Unlocked' : 'Hint: ' + t.hint));
        li.appendChild(b); li.appendChild(s); ul.appendChild(li);
      });
      dlg.appendChild(ul);
    });

    var foot = el('footer');
    var lab = el('label');
    var cb = el('input'); cb.type = 'checkbox'; cb.checked = !popupsOff;
    cb.addEventListener('change', function () { popupsOff = !cb.checked; save(OFF, popupsOff); });
    lab.appendChild(cb); lab.appendChild(document.createTextNode(' Show trophy pop-ups'));
    var lab2 = el('label');
    var cb2 = el('input'); cb2.type = 'checkbox'; cb2.checked = soundOn;
    cb2.addEventListener('change', function () { soundOn = cb2.checked; save(SND, soundOn); if (soundOn) play('blip'); });
    lab2.appendChild(cb2); lab2.appendChild(document.createTextNode(' 8-bit sound effects'));
    var reset = el('button', 'linkish', 'Reset trophies'); reset.type = 'button';
    reset.addEventListener('click', function () { earned = {}; seen = {}; if (page !== '404') seen[page] = 1; save(KEY, earned); save(STARS, {}); save(VIS, seen); updateHud(); render(); });
    foot.appendChild(lab); foot.appendChild(lab2); foot.appendChild(reset);
    dlg.appendChild(foot);
  }
  document.querySelectorAll('.hud').forEach(function (b) {
    b.addEventListener('click', function () {
      render();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    });
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  document.querySelectorAll('.hud-open').forEach(function (b) {
    b.addEventListener('click', function () { document.querySelector('.hud').click(); });
  });

  // ---------- triggers ----------
  var page = document.body.getAttribute('data-page') || '';
  if (page.indexOf('case-') === 0) unlock('reader');

  var seen = load(VIS) || {};
  if (page !== '404') { seen[page] = 1; save(VIS, seen); }
  if (Object.keys(seen).length >= 3) unlock('explorer');

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (/resume/i.test(h)) unlock('diligence');
    if (/^mailto:|linkedin\.com/.test(h)) unlock('hello');
  });
  document.querySelectorAll('video').forEach(function (v) { v.addEventListener('play', function () { unlock('popcorn'); }); });

  function spin(node) {
    if (reduce || !node.animate) return;
    node.animate([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(360deg) scale(1.15)' }, { transform: 'rotate(360deg) scale(1)' }], { duration: 600 });
  }

  // Logo: five quick clicks
  var clicks = 0, timer;
  var logo = document.querySelector('[data-secret-logo]');
  if (logo) logo.addEventListener('click', function (e) {
    clicks++; clearTimeout(timer); timer = setTimeout(function () { clicks = 0; }, 1500);
    if (page === 'index' || clicks >= 2) { e.preventDefault(); if (clicks === 1) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
    if (clicks >= 5) { clicks = 0; unlock('persist'); spin(logo.querySelector('.logo-mark')); }
  });

  // Home: spin all three shapes
  var pieces = document.querySelectorAll('.hero-art .piece'), hit = {};
  pieces.forEach(function (p, i) {
    p.addEventListener('click', function () {
      hit[i] = true; spin(p);
      if (Object.keys(hit).length === pieces.length) unlock('spin');
    });
  });

  // Page-header stars: collect three on different pages
  document.querySelectorAll('[data-star]').forEach(function (s) {
    s.addEventListener('click', function () {
      var got = load(STARS) || {};
      var key = s.getAttribute('data-star');
      if (!s.closest('.hero-art')) spin(s);
      if (got[key]) return;
      got[key] = 1; save(STARS, got);
      var n = Object.keys(got).length;
      if (n >= 4) unlock('stars');
      else { toast('⭐', n + ' of 4 stars found', 'Keep looking'); play('blip'); }
    });
  });

  // Arcade buttons on the Work page
  var presses = 0, coins = document.querySelectorAll('.coin-btn');
  coins.forEach(function (c) {
    c.addEventListener('click', function () {
      presses++; c.classList.add('pressed'); play('blip');
      setTimeout(function () { c.classList.remove('pressed'); }, 150);
      if (presses >= 3) unlock('coin');
    });
  });

  // Apple for the teacher
  document.querySelectorAll('[data-apple]').forEach(function (a) {
    a.addEventListener('click', function () { spin(a); unlock('apple'); });
  });

  // Konami code: keyboard, or the on-screen gamepad from the footer joystick
  var code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0;
  function press(k) {
    pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
    if (pos === code.length) { pos = 0; unlock('cheat'); return true; }
    return false;
  }
  document.addEventListener('keydown', function (e) {
    if (pad && pad.open) return;
    press(e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key);
  });

  var pad = null;
  function openPad() {
    if (!pad) {
      pad = el('dialog', 'gamepad');
      pad.setAttribute('aria-labelledby', 'pad-title');
      var h = el('h2', '', 'Gamepad'); h.id = 'pad-title';
      var help = el('p', 'pad-help', 'Know a famous cheat code? Enter it here.');
      var dots = el('div', 'pad-dots'); dots.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < code.length; i++) dots.appendChild(el('span'));
      var live = el('p', 'sr-only'); live.setAttribute('aria-live', 'polite');
      var body = el('div', 'pad-body');
      var dpad = el('div', 'dpad');
      [['ArrowUp', '▲', 'Up', 'up'], ['ArrowLeft', '◀', 'Left', 'left'], ['ArrowRight', '▶', 'Right', 'right'], ['ArrowDown', '▼', 'Down', 'down']].forEach(function (d) {
        var bt = el('button', 'pad-btn pad-' + d[3], d[1]); bt.type = 'button'; bt.setAttribute('aria-label', d[2]); bt.dataset.k = d[0]; dpad.appendChild(bt);
      });
      var ab = el('div', 'abtns');
      [['b', 'B'], ['a', 'A']].forEach(function (d) {
        var bt = el('button', 'pad-btn pad-round', d[1]); bt.type = 'button'; bt.setAttribute('aria-label', d[1] + ' button'); bt.dataset.k = d[0]; ab.appendChild(bt);
      });
      body.appendChild(dpad); body.appendChild(ab);
      var close = el('button', 'close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close gamepad');
      close.addEventListener('click', function () { pad.close(); });
      var top = el('header'); top.appendChild(h); top.appendChild(close);
      pad.appendChild(top); pad.appendChild(help); pad.appendChild(dots); pad.appendChild(body); pad.appendChild(live);
      function paint() { Array.prototype.forEach.call(dots.children, function (s, i) { s.className = i < pos ? 'on' : ''; }); }
      pad.addEventListener('click', function (e) {
        if (e.target === pad) { pad.close(); return; }
        var bt = e.target.closest('.pad-btn'); if (!bt) return;
        var before = pos, won = press(bt.dataset.k);
        play('blip');
        if (won) { live.textContent = 'Code accepted!'; help.textContent = 'Code accepted! 🎉'; pos = code.length; paint(); pos = 0; setTimeout(function () { pad.close(); }, 1200); return; }
        if (pos === 0 || pos < before) { pad.classList.remove('shake'); void pad.offsetWidth; pad.classList.add('shake'); }
        live.textContent = pos + ' of ' + code.length;
        paint();
      });
      document.body.appendChild(pad);
    }
    pos = 0;
    pad.querySelector('.pad-help').textContent = 'Know a famous cheat code? Enter it here.';
    Array.prototype.forEach.call(pad.querySelectorAll('.pad-dots span'), function (s) { s.className = ''; });
    if (pad.showModal) pad.showModal(); else pad.setAttribute('open', '');
  }
  document.querySelectorAll('.joy').forEach(function (j) { j.addEventListener('click', openPad); });

  // ---------- UI helpers ----------
  var mb = document.querySelector('.menu-btn'), nav = document.querySelector('.site-nav');
  if (mb && nav) {
    mb.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      mb.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.focus(); }
    });
  }

  var roles = document.querySelectorAll('.timeline details');
  roles.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (Array.prototype.every.call(roles, function (x) { return x.open; })) unlock('player');
    });
  });
  var all = document.querySelector('[data-expand-all]');
  if (all) all.addEventListener('click', function () {
    var ds = document.querySelectorAll('.timeline details');
    var open = Array.prototype.some.call(ds, function (d) { return !d.open; });
    ds.forEach(function (d) { d.open = open; });
    all.textContent = open ? 'Close all' : 'Open all';
    if (open) unlock('player');
  });

  var rv = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (n) { io.observe(n); });
  } else { rv.forEach(function (n) { n.classList.add('in'); }); }


  // ---------- boss page ----------
  if (page === 'behind-the-scenes') {
    var status = document.querySelector('[data-boss-status]');
    var content = document.querySelector('[data-boss-content]');
    var locked = document.querySelector('[data-boss-locked]');
    if (count() === total) {
      content.hidden = false; locked.hidden = true;
      status.textContent = 'You found all ' + total + ' trophies. Here’s your reward: a look at how I design.';
    } else {
      status.textContent = 'Locked. You’ve found ' + count() + ' of ' + total + ' trophies. Find them all to see what’s behind this door.';
    }
  }

  // ---------- pixel Amanda ----------
  var TIPS = [
    'Hi, I’m Amanda! Thanks for stopping by.',
    'The trophy cup at the top tracks your progress.',
    'The shapes on the home page like to spin.',
    'Real gamers know a certain code… No keyboard? Tap the joystick in the footer.',
    'Every arcade has buttons. Find the one on my Work page.',
    'There’s an apple waiting on my About page.',
    'Stars hide around the site. Collect four!',
    'Find all 12 trophies to unlock the boss level.'
  ];
  var tip = 0;
  var me = el('div', 'pixel-me');
  var bubble = el('p', 'pix-bubble');
  bubble.setAttribute('aria-live', 'polite');
  bubble.hidden = true;
  var meBtn = el('button', 'pix-btn');
  meBtn.type = 'button';
  meBtn.setAttribute('aria-label', 'Pixel Amanda. Click for a tip.');
  meBtn.innerHTML = '<svg viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><rect x="9" y="1" width="5" height="1.05" fill="#EBC46B"/><rect x="7" y="2" width="9" height="1.05" fill="#EBC46B"/><rect x="6" y="3" width="6" height="1.05" fill="#EBC46B"/><rect x="12" y="3" width="1" height="1.05" fill="#C99A45"/><rect x="13" y="3" width="4" height="1.05" fill="#EBC46B"/><rect x="5" y="4" width="8" height="1.05" fill="#EBC46B"/><rect x="13" y="4" width="2" height="1.05" fill="#C99A45"/><rect x="15" y="4" width="3" height="1.05" fill="#EBC46B"/><rect x="4" y="5" width="11" height="1.05" fill="#EBC46B"/><rect x="15" y="5" width="1" height="1.05" fill="#C99A45"/><rect x="16" y="5" width="3" height="1.05" fill="#EBC46B"/><rect x="4" y="6" width="6" height="1.05" fill="#EBC46B"/><rect x="10" y="6" width="4" height="1.05" fill="#F4C7A6"/><rect x="14" y="6" width="5" height="1.05" fill="#EBC46B"/><rect x="3" y="7" width="4" height="1.05" fill="#EBC46B"/><rect x="7" y="7" width="9" height="1.05" fill="#F4C7A6"/><rect x="16" y="7" width="4" height="1.05" fill="#EBC46B"/><rect x="3" y="8" width="3" height="1.05" fill="#EBC46B"/><rect x="6" y="8" width="5" height="1.05" fill="#2A1233"/><rect x="11" y="8" width="1" height="1.05" fill="#F4C7A6"/><rect x="12" y="8" width="5" height="1.05" fill="#2A1233"/><rect x="17" y="8" width="3" height="1.05" fill="#EBC46B"/><rect x="3" y="9" width="3" height="1.05" fill="#EBC46B"/><rect x="6" y="9" width="1" height="1.05" fill="#2A1233"/><rect x="7" y="9" width="3" height="1.05" fill="#F4C7A6"/><rect x="10" y="9" width="3" height="1.05" fill="#2A1233"/><rect x="13" y="9" width="3" height="1.05" fill="#F4C7A6"/><rect x="16" y="9" width="1" height="1.05" fill="#2A1233"/><rect x="17" y="9" width="3" height="1.05" fill="#EBC46B"/><rect x="3" y="10" width="2" height="1.05" fill="#EBC46B"/><rect x="5" y="10" width="1" height="1.05" fill="#C99A45"/><rect x="6" y="10" width="1" height="1.05" fill="#2A1233"/><rect x="7" y="10" width="1" height="1.05" fill="#F4C7A6"/><rect x="8" y="10" width="1" height="1.05" fill="#3A1747"/><rect x="9" y="10" width="1" height="1.05" fill="#F4C7A6"/><rect x="10" y="10" width="1" height="1.05" fill="#2A1233"/><rect x="11" y="10" width="1" height="1.05" fill="#F4C7A6"/><rect x="12" y="10" width="1" height="1.05" fill="#2A1233"/><rect x="13" y="10" width="1" height="1.05" fill="#F4C7A6"/><rect x="14" y="10" width="1" height="1.05" fill="#3A1747"/><rect x="15" y="10" width="1" height="1.05" fill="#F4C7A6"/><rect x="16" y="10" width="1" height="1.05" fill="#2A1233"/><rect x="17" y="10" width="3" height="1.05" fill="#EBC46B"/><rect x="3" y="11" width="3" height="1.05" fill="#EBC46B"/><rect x="6" y="11" width="5" height="1.05" fill="#2A1233"/><rect x="11" y="11" width="1" height="1.05" fill="#F4C7A6"/><rect x="12" y="11" width="5" height="1.05" fill="#2A1233"/><rect x="17" y="11" width="1" height="1.05" fill="#C99A45"/><rect x="18" y="11" width="2" height="1.05" fill="#EBC46B"/><rect x="3" y="12" width="3" height="1.05" fill="#EBC46B"/><rect x="6" y="12" width="2" height="1.05" fill="#F4C7A6"/><rect x="8" y="12" width="1" height="1.05" fill="#C0504D"/><rect x="9" y="12" width="5" height="1.05" fill="#F4C7A6"/><rect x="14" y="12" width="1" height="1.05" fill="#C0504D"/><rect x="15" y="12" width="2" height="1.05" fill="#F4C7A6"/><rect x="17" y="12" width="3" height="1.05" fill="#EBC46B"/><rect x="3" y="13" width="4" height="1.05" fill="#EBC46B"/><rect x="7" y="13" width="1" height="1.05" fill="#F29C8F"/><rect x="8" y="13" width="1" height="1.05" fill="#F4C7A6"/><rect x="9" y="13" width="1" height="1.05" fill="#C0504D"/><rect x="10" y="13" width="3" height="1.05" fill="#FFFFFF"/><rect x="13" y="13" width="1" height="1.05" fill="#C0504D"/><rect x="14" y="13" width="1" height="1.05" fill="#F4C7A6"/><rect x="15" y="13" width="1" height="1.05" fill="#F29C8F"/><rect x="16" y="13" width="4" height="1.05" fill="#EBC46B"/><rect x="2" y="14" width="5" height="1.05" fill="#EBC46B"/><rect x="7" y="14" width="9" height="1.05" fill="#F4C7A6"/><rect x="16" y="14" width="5" height="1.05" fill="#EBC46B"/><rect x="3" y="15" width="5" height="1.05" fill="#EBC46B"/><rect x="8" y="15" width="7" height="1.05" fill="#F4C7A6"/><rect x="15" y="15" width="5" height="1.05" fill="#EBC46B"/><rect x="3" y="16" width="6" height="1.05" fill="#EBC46B"/><rect x="9" y="16" width="5" height="1.05" fill="#F4C7A6"/><rect x="14" y="16" width="6" height="1.05" fill="#EBC46B"/><rect x="3" y="17" width="4" height="1.05" fill="#EBC46B"/><rect x="8" y="17" width="1" height="1.05" fill="#F6F0E6"/><rect x="9" y="17" width="5" height="1.05" fill="#F4C7A6"/><rect x="14" y="17" width="1" height="1.05" fill="#F6F0E6"/><rect x="16" y="17" width="4" height="1.05" fill="#EBC46B"/><rect x="3" y="18" width="2" height="1.05" fill="#EBC46B"/><rect x="5" y="18" width="2" height="1.05" fill="#F6F0E6"/><rect x="7" y="18" width="1" height="1.05" fill="#D9CFC0"/><rect x="8" y="18" width="1" height="1.05" fill="#F6F0E6"/><rect x="9" y="18" width="5" height="1.05" fill="#F4C7A6"/><rect x="14" y="18" width="1" height="1.05" fill="#F6F0E6"/><rect x="15" y="18" width="1" height="1.05" fill="#D9CFC0"/><rect x="16" y="18" width="2" height="1.05" fill="#F6F0E6"/><rect x="18" y="18" width="2" height="1.05" fill="#EBC46B"/><rect x="4" y="19" width="4" height="1.05" fill="#F6F0E6"/><rect x="8" y="19" width="1" height="1.05" fill="#D9CFC0"/><rect x="9" y="19" width="5" height="1.05" fill="#F6F0E6"/><rect x="14" y="19" width="1" height="1.05" fill="#D9CFC0"/><rect x="15" y="19" width="4" height="1.05" fill="#F6F0E6"/><rect x="3" y="20" width="6" height="1.05" fill="#F6F0E6"/><rect x="9" y="20" width="5" height="1.05" fill="#D9CFC0"/><rect x="14" y="20" width="6" height="1.05" fill="#F6F0E6"/><rect x="2" y="21" width="19" height="1.05" fill="#F6F0E6"/><rect x="1" y="22" width="21" height="1.05" fill="#F6F0E6"/><rect x="1" y="23" width="21" height="1.05" fill="#F6F0E6"/><g class="pix-arm"><rect x="20" y="11" width="1" height="1.05" fill="#F4C7A6"/><rect x="22" y="11" width="1" height="1.05" fill="#F4C7A6"/><rect x="20" y="12" width="4" height="1.05" fill="#F4C7A6"/><rect x="20" y="13" width="3" height="1.05" fill="#F4C7A6"/><rect x="20" y="14" width="3" height="1.05" fill="#F4C7A6"/><rect x="20" y="15" width="3" height="1.05" fill="#F4C7A6"/><rect x="20" y="16" width="2" height="1.05" fill="#F6F0E6"/><rect x="20" y="17" width="2" height="1.05" fill="#F6F0E6"/><rect x="19" y="18" width="2" height="1.05" fill="#F6F0E6"/><rect x="19" y="19" width="2" height="1.05" fill="#F6F0E6"/><rect x="18" y="20" width="2" height="1.05" fill="#F6F0E6"/><rect x="18" y="21" width="2" height="1.05" fill="#F6F0E6"/></g></svg>';
  var hideTimer;
  meBtn.addEventListener('click', function () {
    bubble.textContent = TIPS[tip % TIPS.length]; tip++;
    bubble.hidden = false;
    meBtn.classList.remove('wave'); void meBtn.offsetWidth; meBtn.classList.add('wave');
    play('blip');
    clearTimeout(hideTimer); hideTimer = setTimeout(function () { bubble.hidden = true; }, 6000);
  });
  me.appendChild(bubble); me.appendChild(meBtn);
  document.body.appendChild(me);
  // Float in the corner while scrolling, then rest just above the footer when it comes into view.
  var foot = document.querySelector('.site-foot');
  var baseBottom = null, ticking = false;
  function dock() {
    ticking = false;
    if (!foot) return;
    if (baseBottom === null) baseBottom = parseFloat(getComputedStyle(me).bottom) || 14;
    var overlap = window.innerHeight - foot.getBoundingClientRect().top;
    me.style.bottom = (overlap > 0 ? overlap + 10 : baseBottom) + 'px';
  }
  function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(dock); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { baseBottom = null; me.style.bottom = ''; dock(); });
  dock();
  if (!reduce) setTimeout(function () { meBtn.classList.add('wave'); }, 900);

  updateHud();
})();
