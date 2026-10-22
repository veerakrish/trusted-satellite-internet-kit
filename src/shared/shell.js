/* Shared shell: DOM helpers, top bar, modes, narration, claims, glossary, tabs and quiz.
   Every app loads data/claims.js and data/glossary.js before this file. */
(function () {
  'use strict';

  const SVGNS = 'http://www.w3.org/2000/svg';

  function append(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return el;
  }
  function setAttrs(el, attrs, isSvg) {
    if (!attrs) return;
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') isSvg ? el.setAttribute('class', v) : (el.className = v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    setAttrs(el, attrs, false);
    return append(el, kids);
  }
  function s(tag, attrs, ...kids) {
    const el = document.createElementNS(SVGNS, tag);
    setAttrs(el, attrs, true);
    return append(el, kids);
  }
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  // Replaces an element's children; skips null/false and flattens arrays, unlike the native append.
  const fill = (el, ...kids) => append(clear(el), kids);
  const add = (el, ...kids) => append(el, kids);

  // localStorage is a convenience only; every access is guarded.
  const store = {
    get(k, d) { try { const v = localStorage.getItem('isk:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('isk:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  /* ---------------- tags ---------------- */
  const TAGS = {
    documented: 'DOCUMENTED',
    practice: 'GENERAL INDUSTRY PRACTICE',
    illustrative: 'ILLUSTRATIVE ASSUMPTION',
    simulated: 'SIMULATED',
    mandatory: 'MANDATORY',
    recommended: 'RECOMMENDED PRACTICE',
    some: 'DEPLOYED BY SOME OPERATORS',
    verified: 'VERIFIED FACT',
    plausible: 'PLAUSIBLE RISK',
    unverified: 'UNVERIFIED ALLEGATION',
  };
  function chip(tag) {
    return h('span', { class: 'chip t-' + tag, title: TAGS[tag] || tag }, TAGS[tag] || tag.toUpperCase());
  }

  /* ---------------- claims ---------------- */
  const used = new Map();
  function fmtDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function claimValid(c) {
    return c && c.text && c.tag && Array.isArray(c.sources) && c.sources.length && c.sources.every((x) => x.title) && c.verified;
  }
  // Renders a claim. A claim without a source and a check date is refused, never shown.
  function claim(id, opts = {}) {
    const c = (window.CLAIMS || {})[id];
    if (!claimValid(c)) {
      console.error('Claim refused (missing text, tag, source or date):', id);
      return h('div', { class: 'claim-error', role: 'note' }, `Claim "${id}" hidden: it has no source or check date.`);
    }
    used.set(id, c);
    const src = c.sources[0];
    const meta = h('span', { class: 'meta' },
      src.url ? h('a', { href: src.url, target: '_blank', rel: 'noopener', title: src.title }, 'Source') : h('span', { title: src.title, style: { textDecoration: 'underline dotted' } }, 'Kit note'),
      c.sources.length > 1 ? ` +${c.sources.length - 1}` : '',
      ' · checked ', fmtDate(c.verified));
    const tagName = opts.tag || 'span';
    return h(tagName, { class: 'claim', 'data-claim': id }, c.text, ' ', chip(c.tag), meta);
  }
  function claims(ids, tag = 'p') { return ids.map((id) => claim(id, { tag })); }

  /* ---------------- top bar ---------------- */
  const APPS = [
    { id: 'hub', href: 'index.html', label: 'Hub' },
    { id: 'app1', href: 'app1.html', label: '1 · Earth to Orbit' },
    { id: 'app2', href: 'app2.html', label: '2 · Inside India\'s Internet' },
    { id: 'app3', href: 'app3.html', label: '3 · Design the Protocol' },
    { id: 'rules', href: 'rules.html', label: 'Rules' },
  ];
  const state = { teacher: false, demo: false, reduce: false, speak: false };
  const hooks = { demo: [], teacher: [], reduce: [] };

  function logo() {
    return s('svg', { class: 'brand-mark', viewBox: '0 0 32 32', 'aria-hidden': 'true' },
      s('circle', { cx: 16, cy: 18, r: 9, fill: '#1f4fa8' }),
      s('path', { d: 'M8 20c4 2 12 2 16-2', stroke: '#45d99a', 'stroke-width': 2, fill: 'none' }),
      s('ellipse', { cx: 16, cy: 16, rx: 15, ry: 6, fill: 'none', stroke: '#e3b54d', 'stroke-width': 1.6, transform: 'rotate(-20 16 16)' }),
      s('circle', { cx: 28, cy: 9, r: 2.6, fill: '#f6d27e' }));
  }

  function toggleBtn(label, key, title) {
    const b = h('button', { class: 'btn', type: 'button', 'aria-pressed': 'false', title }, label);
    b.addEventListener('click', () => setMode(key, !state[key]));
    b.dataset.mode = key;
    return b;
  }
  function syncButtons() {
    $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(!!state[b.dataset.mode])));
  }
  function setMode(key, on, silent) {
    state[key] = !!on;
    if (key === 'teacher') document.body.classList.toggle('teacher', state.teacher);
    if (key === 'reduce') document.body.classList.toggle('reduce-motion', state.reduce);
    if (key !== 'demo') store.set('mode:' + key, state[key]);
    syncButtons();
    if (!silent) (hooks[key] || []).forEach((fn) => fn(state[key]));
    if (key === 'teacher' && on && !silent) narrate('Teacher mode is on. Text is larger, and each step is explained here.');
  }

  let narrationTxt = null;
  function narrate(text, label) {
    if (!narrationTxt) return;
    clear(narrationTxt);
    if (label) narrationTxt.appendChild(h('span', { class: 'lbl' }, label));
    narrationTxt.appendChild(document.createTextNode(text));
    if (state.teacher && state.speak && 'speechSynthesis' in window) {
      try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance((label ? label + '. ' : '') + text)); } catch (e) { /* ignore */ }
    }
  }

  /* ---------------- drawers ---------------- */
  let scrim;
  function makeDrawer(id, title) {
    const body = h('div', { class: 'drawer-body' });
    const close = h('button', { class: 'btn', type: 'button', 'aria-label': 'Close ' + title }, 'Close ✕');
    const d = h('aside', { class: 'drawer', id, role: 'dialog', 'aria-modal': 'true', 'aria-label': title, hidden: true },
      h('header', null, h('h2', { style: { margin: 0 } }, title), close), body);
    close.addEventListener('click', () => closeDrawer(d));
    document.body.appendChild(d);
    return { el: d, body };
  }
  let lastFocus = null;
  function openDrawer(d) {
    lastFocus = document.activeElement;
    d.hidden = false;
    requestAnimationFrame(() => { d.classList.add('open'); scrim.classList.add('open'); });
    const f = d.querySelector('input, button');
    if (f) setTimeout(() => f.focus(), 30);
  }
  function closeDrawer(d) {
    d.classList.remove('open'); scrim.classList.remove('open');
    setTimeout(() => { d.hidden = true; }, 220);
    if (lastFocus) lastFocus.focus();
  }

  function renderGlossary(body, q = '') {
    const list = body.querySelector('dl');
    clear(list);
    const terms = Object.entries(window.GLOSSARY || {}).sort((a, b) => a[0].localeCompare(b[0]));
    const needle = q.trim().toLowerCase();
    for (const [term, def] of terms) {
      if (needle && !(term.toLowerCase().includes(needle) || def.toLowerCase().includes(needle))) continue;
      list.appendChild(h('dt', null, term));
      list.appendChild(h('dd', null, def));
    }
    if (!list.children.length) list.appendChild(h('dd', null, 'No matching term.'));
  }

  function renderSources(body) {
    clear(body);
    body.appendChild(h('p', { class: 'muted' }, 'Every factual claim on this page, with its tag, source and the date it was last checked. Numbers marked SIMULATED come from the teaching model, not from measurements.'));
    const groups = {};
    for (const [id, c] of used) (groups[c.tag] = groups[c.tag] || []).push([id, c]);
    const order = ['verified', 'documented', 'mandatory', 'recommended', 'some', 'practice', 'plausible', 'unverified', 'illustrative', 'simulated'];
    for (const tag of order) {
      if (!groups[tag]) continue;
      body.appendChild(h('h3', { style: { marginTop: '18px' } }, chip(tag)));
      for (const [, c] of groups[tag]) {
        body.appendChild(h('div', { class: 'card', style: { margin: '8px 0', padding: '10px 12px' } },
          h('div', null, c.text),
          h('ul', { class: 'tight muted', style: { fontSize: '.85em' } },
            c.sources.map((x) => h('li', null, x.url ? h('a', { href: x.url, target: '_blank', rel: 'noopener' }, x.title) : x.title))),
          h('div', { class: 'muted', style: { fontSize: '.8em' } }, 'Last checked ' + fmtDate(c.verified))));
      }
    }
  }

  /* ---------------- init ---------------- */
  function init(opts) {
    const appId = opts.app;
    document.documentElement.lang = 'en';
    const main = $('main');
    if (main && !main.id) main.id = 'main';

    const skip = h('a', { class: 'skip', href: '#main' }, 'Skip to content');
    const nav = h('nav', { 'aria-label': 'Kit navigation' },
      h('ul', { class: 'navlinks' }, APPS.filter((a) => !(window.KIT_NO_RULES && a.id === 'rules')).map((a) => h('li', null,
        h('a', { href: a.href, 'aria-current': a.id === appId ? 'page' : null }, a.label)))));
    const glossBtn = h('button', { class: 'btn', type: 'button' }, 'Glossary');
    const srcBtn = h('button', { class: 'btn', type: 'button' }, 'Sources');
    const tools = h('div', { class: 'tools' },
      toggleBtn('Teacher mode', 'teacher', 'Larger text and step-by-step narration'),
      opts.demo !== false ? toggleBtn('Demo mode', 'demo', 'Load a prepared state for presenting') : null,
      toggleBtn('Reduce motion', 'reduce', 'Turn off animation'),
      glossBtn, srcBtn);
    const bar = h('header', { class: 'topbar' },
      h('a', { class: 'brand', href: 'index.html' }, logo(), h('span', null, 'Trusted Satellite Internet Kit')), nav, tools);
    document.body.prepend(skip, bar);
    // Until the rules page is published, hide every link to it.
    if (window.KIT_NO_RULES) $$('[data-rules-link]').forEach((el) => el.remove());

    scrim = h('div', { class: 'scrim' });
    document.body.appendChild(scrim);
    const gloss = makeDrawer('glossary', 'Glossary');
    gloss.body.append(h('label', { class: 'sr-only', for: 'gsearch' }, 'Search glossary'),
      h('input', { id: 'gsearch', type: 'search', placeholder: 'Search terms…', oninput: (e) => renderGlossary(gloss.body, e.target.value) }),
      h('dl'));
    renderGlossary(gloss.body);
    const srcs = makeDrawer('sources', 'Sources and checks');
    glossBtn.addEventListener('click', () => openDrawer(gloss.el));
    srcBtn.addEventListener('click', () => { renderSources(srcs.body); openDrawer(srcs.el); });
    scrim.addEventListener('click', () => $$('.drawer.open').forEach(closeDrawer));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $$('.drawer.open').forEach(closeDrawer); });

    narrationTxt = h('div', { class: 'txt', 'aria-live': 'polite' });
    const speak = h('label', { class: 'switch', style: { fontSize: '.85em' } },
      h('input', { type: 'checkbox', onchange: (e) => { state.speak = e.target.checked; if (!state.speak && 'speechSynthesis' in window) speechSynthesis.cancel(); } }), 'Read aloud');
    document.body.appendChild(h('div', { class: 'narration', role: 'region', 'aria-label': 'Narration' }, narrationTxt, speak));
    narrate(opts.intro || 'Teacher mode: each step of the demo is explained here.', 'Narrator');

    const prefersReduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMode('reduce', store.get('mode:reduce', prefersReduce), true);
    setMode('teacher', store.get('mode:teacher', false), true);

    const foot = h('footer', { class: 'site' },
      h('p', null, 'An independent educational kit, in partnership with SRKR Engineering College, Bhimavaram. It is not run or endorsed by any government body or company. All simulations use invented data and never touch a real network.'),
      h('p', null, 'Every claim carries a tag, a source and a check date. Open ', h('a', { href: '#', onclick: (e) => { e.preventDefault(); srcBtn.click(); } }, 'Sources'), ' to see them all.'));
    document.body.appendChild(foot);
  }

  function on(key, fn) { (hooks[key] = hooks[key] || []).push(fn); }

  /* ---------------- tabs ---------------- */
  function tabs(container, items, onChange) {
    const list = h('div', { role: 'tablist' });
    const panels = [];
    const btns = items.map((it, i) => {
      const id = 'tab-' + Math.random().toString(36).slice(2, 8);
      const panel = h('div', { role: 'tabpanel', id: id + '-p', 'aria-labelledby': id, tabindex: '0', hidden: i !== 0 });
      append(panel, [typeof it.render === 'function' ? it.render() : it.content]);
      panels.push(panel);
      const b = h('button', { role: 'tab', id, type: 'button', 'aria-controls': id + '-p', 'aria-selected': String(i === 0), tabindex: i === 0 ? '0' : '-1' }, it.label);
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
          select(n); btns[n].focus(); e.preventDefault();
        }
      });
      return b;
    });
    function select(i) {
      btns.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j; });
      if (onChange) onChange(i, items[i]);
    }
    append(list, btns);
    container.classList.add('tabs');
    append(container, [list, panels]);
    return { select };
  }

  /* ---------------- segmented control ---------------- */
  function seg(options, value, onChange, label) {
    const wrap = h('div', { class: 'seg', role: 'group', 'aria-label': label });
    const btns = options.map((o) => {
      const b = h('button', { type: 'button', 'aria-pressed': String(o.value === value) }, o.label);
      b.addEventListener('click', () => { if (b.disabled) return; set(o.value); onChange(o.value); });
      b.dataset.value = o.value;
      return b;
    });
    function set(v) { btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === String(v)))); }
    append(wrap, btns);
    wrap.set = set;
    wrap.btn = (v) => btns.find((b) => b.dataset.value === String(v));
    return wrap;
  }
  function toggle(label, checked, onChange) {
    const input = h('input', { type: 'checkbox', role: 'switch' });
    input.checked = !!checked;
    input.addEventListener('change', () => onChange(input.checked));
    const el = h('label', { class: 'switch' }, input, h('span', null, label));
    el.input = input;
    return el;
  }

  /* ---------------- quiz ---------------- */
  function quiz(container, questions) {
    let score = 0, answered = 0;
    const scoreEl = h('p', { class: 'muted', 'aria-live': 'polite' }, `Score: 0 / ${questions.length}`);
    container.classList.add('quiz');
    questions.forEach((q, qi) => {
      const fb = h('div', { class: 'fb', 'aria-live': 'polite' });
      const opts = h('div', { class: 'opts' });
      q.options.forEach((o, oi) => {
        const b = h('button', { class: 'btn', type: 'button' }, o);
        b.addEventListener('click', () => {
          if (opts.dataset.done) return;
          opts.dataset.done = '1';
          const right = oi === q.answer;
          b.classList.add(right ? 'right' : 'wrong');
          if (!right) opts.children[q.answer].classList.add('right');
          fb.textContent = (right ? 'Correct. ' : 'Not quite. ') + q.why;
          answered++; if (right) score++;
          scoreEl.textContent = `Score: ${score} / ${questions.length}` + (answered === questions.length ? ' — finished.' : '');
        });
        opts.appendChild(b);
      });
      container.appendChild(h('div', { class: 'q card' }, h('h3', null, `${qi + 1}. ${q.q}`), opts, fb));
    });
    const reset = h('button', { class: 'btn', type: 'button' }, 'Reset quiz');
    reset.addEventListener('click', () => { clear(container); quiz(container, questions); });
    container.append(scoreEl, reset);
  }

  function glossaryList(container) {
    const dl = h('dl', { class: 'grid g2' });
    for (const [t, d] of Object.entries(window.GLOSSARY || {}).sort((a, b) => a[0].localeCompare(b[0])))
      dl.appendChild(h('div', { class: 'card', style: { padding: '10px 12px' } }, h('dt', { style: { fontWeight: 700, color: 'var(--gold-2)' } }, t), h('dd', { style: { margin: 0 } }, d)));
    container.appendChild(dl);
  }
  function sourceList(container) {
    const btn = h('button', { class: 'btn', type: 'button' }, 'Refresh list');
    const box = h('div');
    const draw = () => renderSources(box);
    btn.addEventListener('click', draw);
    container.append(btn, box);
    setTimeout(draw, 0);
    return draw;
  }

  window.K = { h, s, $, $$, clear, fill, add, store, chip, claim, claims, init, on, setMode, state, narrate, tabs, seg, toggle, quiz, glossaryList, sourceList, fmtDate, TAGS };
})();
