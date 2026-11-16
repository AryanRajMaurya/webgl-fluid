/*
 * Control panel for the rebuilt WebGL Fluid Simulation.
 * The engine is script.js (Pavel Dobryakov, MIT); this file only drives config.
 */
(function () {
  var F = window.fluid;
  if (!F) return;
  var config = F.config;

  var INITIAL = {};
  for (var k in config) INITIAL[k] = config[k];

  // ── shareable state ───────────────────────────────────────────────────
  function b64encode(s) {
    return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64decode(s) {
    return decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  }
  function snapshot() {
    var d = {};
    for (var k in config) if (JSON.stringify(config[k]) !== JSON.stringify(INITIAL[k])) d[k] = config[k];
    return d;
  }
  var hashTimer = 0;
  function saveHash() {
    var d = snapshot();
    clearTimeout(hashTimer);
    hashTimer = setTimeout(function () {
      var h = Object.keys(d).length ? '#p=' + b64encode(JSON.stringify(d)) : '';
      history.replaceState(null, '', location.pathname + location.search + h);
    }, 250);
  }
  function loadHash() {
    var m = location.hash.match(/#p=([A-Za-z0-9_-]+)/);
    if (!m) return;
    try {
      var d = JSON.parse(b64decode(m[1]));
      for (var k in d) if (k in config) config[k] = d[k];
    } catch (e) { /* ignore a mangled hash */ }
  }
  loadHash();

  function rgbToHex(c) {
    var h = function (v) { var s = Math.round(Math.max(0, Math.min(255, v))).toString(16); return s.length < 2 ? '0' + s : s; };
    return '#' + h(c.r) + h(c.g) + h(c.b);
  }
  function hexToRgb(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  // ── panel definition ──────────────────────────────────────────────────
  var STORY = [
    { title: 'Quality', controls: [
      { prop: 'DYE_RESOLUTION', label: 'Dye resolution', control: 'seg', options: [1024, 512, 256, 128], apply: 'buffers' },
      { prop: 'SIM_RESOLUTION', label: 'Sim resolution', control: 'seg', options: [256, 128, 64, 32], apply: 'buffers' },
    ]},
    { title: 'Fluid', controls: [
      { prop: 'DENSITY_DISSIPATION', label: 'Density dissipation', control: 'range', min: 0, max: 4, step: 0.05 },
      { prop: 'VELOCITY_DISSIPATION', label: 'Velocity dissipation', control: 'range', min: 0, max: 4, step: 0.05 },
      { prop: 'PRESSURE', label: 'Pressure', control: 'range', min: 0, max: 1, step: 0.01 },
      { prop: 'PRESSURE_ITERATIONS', label: 'Pressure iterations', control: 'range', min: 10, max: 60, step: 1 },
      { prop: 'CURL', label: 'Vorticity', control: 'range', min: 0, max: 50, step: 1 },
      { prop: 'SPLAT_RADIUS', label: 'Splat radius', control: 'range', min: 0.01, max: 1, step: 0.01 },
      { prop: 'SPLAT_FORCE', label: 'Splat force', control: 'range', min: 1000, max: 12000, step: 100 },
      { prop: 'COLOR_UPDATE_SPEED', label: 'Colour speed', control: 'range', min: 1, max: 30, step: 1 },
    ]},
    { title: 'Look', collapsible: true, controls: [
      { prop: 'SHADING', label: 'Shading', control: 'switch', apply: 'keywords' },
      { prop: 'COLORFUL', label: 'Colourful', control: 'switch' },
      { prop: 'PAUSED', label: 'Paused (Space)', control: 'switch' },
      { prop: 'BLOOM', label: 'Bloom', control: 'switch', apply: 'keywords' },
      { prop: 'BLOOM_INTENSITY', label: 'Bloom intensity', control: 'range', min: 0.1, max: 2, step: 0.05 },
      { prop: 'BLOOM_THRESHOLD', label: 'Bloom threshold', control: 'range', min: 0, max: 1, step: 0.01 },
      { prop: 'SUNRAYS', label: 'Sunrays', control: 'switch', apply: 'keywords' },
      { prop: 'SUNRAYS_WEIGHT', label: 'Sunrays weight', control: 'range', min: 0.1, max: 1.5, step: 0.05 },
      { prop: 'BACK_COLOR', label: 'Background', control: 'color' },
      { prop: 'TRANSPARENT', label: 'Transparent', control: 'switch' },
    ]},
  ];

  function applyOne(c, value) {
    config[c.prop] = value;
    if (c.apply === 'buffers') F.initFramebuffers();
    else if (c.apply === 'keywords') F.updateKeywords();
    saveHash();
  }

  function buildPanel() {
    var body = document.getElementById('panel-body');
    body.innerHTML = '';
    STORY.forEach(function (section) {
      var h = document.createElement('h3');
      h.textContent = section.title;
      body.appendChild(h);
      var wrap = document.createElement('div');
      wrap.className = 'section';
      if (section.collapsible) { wrap.classList.add('collapsed'); h.classList.add('toggle'); }
      h.addEventListener('click', function () {
        wrap.classList.toggle('collapsed');
        h.classList.toggle('open');
      });
      section.controls.forEach(function (c) { wrap.appendChild(buildControl(c)); });
      body.appendChild(wrap);
    });
  }

  function buildControl(c) {
    var row = document.createElement('div');
    row.className = 'row';
    var label = document.createElement('label');
    label.className = 'label';
    label.textContent = c.label;
    row.appendChild(label);
    var current = config[c.prop];

    if (c.control === 'switch') {
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = Boolean(current);
      cb.addEventListener('change', function () { applyOne(c, cb.checked); });
      row.appendChild(cb);
    } else if (c.control === 'range') {
      var val = document.createElement('span'); val.className = 'val';
      var sl = document.createElement('input');
      sl.type = 'range'; sl.min = String(c.min); sl.max = String(c.max); sl.step = String(c.step);
      sl.value = String(current);
      val.textContent = String(current);
      sl.addEventListener('input', function () {
        val.textContent = sl.value;
        applyOne(c, Number(sl.value));
      });
      row.appendChild(sl); row.appendChild(val);
    } else if (c.control === 'seg') {
      var group = document.createElement('div'); group.className = 'seg';
      c.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = String(opt);
        b.className = opt === current ? 'on' : '';
        b.addEventListener('click', function () {
          group.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          applyOne(c, opt);
        });
        group.appendChild(b);
      });
      row.appendChild(group);
    } else if (c.control === 'color') {
      var col = document.createElement('input');
      col.type = 'color';
      col.value = rgbToHex(current);
      col.addEventListener('input', function () { applyOne(c, hexToRgb(col.value)); });
      row.appendChild(col);
    }
    return row;
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
  }
  function paintFullscreen() {
    var b = document.getElementById('fs');
    if (b) b.textContent = document.fullscreenElement ? 'Exit' : 'Full';
  }
  function resetLook() {
    for (var k in INITIAL) config[k] = INITIAL[k];
    buildPanel(); F.initFramebuffers(); F.updateKeywords(); saveHash();
    document.body.classList.remove('panel-open');
  }
  function togglePause() {
    config.PAUSED = !config.PAUSED;
    var rows = document.querySelectorAll('#panel-body .row');
    rows.forEach(function (row) {
      var label = row.querySelector('.label');
      var cb = row.querySelector('input[type=checkbox]');
      if (label && cb && /paused/i.test(label.textContent)) cb.checked = !!config.PAUSED;
    });
    saveHash();
  }

  function start() {
    buildPanel();
    F.initFramebuffers();
    F.updateKeywords();

    document.getElementById('panel-toggle').addEventListener('click', function () {
      document.body.classList.toggle('panel-open');
    });
    document.getElementById('panel-close').addEventListener('click', function () {
      document.body.classList.remove('panel-open');
    });
    document.getElementById('reset').addEventListener('click', resetLook);
    document.getElementById('fs').addEventListener('click', toggleFullscreen);
    document.getElementById('splat-btn').addEventListener('click', function () { F.randomSplats(12); });
    document.getElementById('shot-btn').addEventListener('click', function () { F.captureScreenshot(); });
    document.addEventListener('fullscreenchange', paintFullscreen);
    paintFullscreen();

    window.addEventListener('keydown', function (e) {
      var el = e.target;
      if (el && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') { e.preventDefault(); togglePause(); }
      else if (e.code === 'KeyF') { e.preventDefault(); toggleFullscreen(); }
      else if (e.code === 'KeyR') { e.preventDefault(); resetLook(); }
      else if (e.code === 'KeyH') { e.preventDefault(); document.body.classList.toggle('panel-open'); }
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { document.getElementById('boot').classList.add('gone'); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
