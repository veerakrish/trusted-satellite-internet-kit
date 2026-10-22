/* App 3: comparison, threat model, evidence, protocol workbench, sandbox, export and peer review. */
(function () {
  'use strict';
  const { h, s, $, clear, fill, add, claim, claims, narrate, seg, toggle, chip, store } = window.K;
  const THREATS = window.THREATS, BLOCKS = window.BLOCKS, GROUPS = window.BLOCK_GROUPS;
  const TBY = Object.fromEntries(THREATS.map((t) => [t.id, t]));

  K.init({ app: 'app3', intro: 'App 3 compares the two architectures, sets out the threat model and lets you design and test a protocol.' });
  const btn = (label, fn, cls) => { const b = h('button', { class: cls || 'btn', type: 'button' }, label); b.addEventListener('click', fn); return b; };
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const rating = (v, unknown) => (unknown ? 'Unknown' : v <= 3 ? 'Low' : v <= 6 ? 'Medium' : 'High');
  const rateEl = (r) => h('span', { class: 'rate ' + r }, r);

  /* ================= 1. Comparison ================= */
  const cmp = { dest: 'in', gw: 'in', isl: true, backhaul: 'redundant', access: 'strong', cond: 'normal' };
  const T = (label, el) => h('div', { class: 't' }, h('span', null, label), el);
  add($('#cmp-toggles'), 
    T('Destination website', seg([{ value: 'in', label: 'Domestic' }, { value: 'os', label: 'Overseas' }], cmp.dest, (v) => { cmp.dest = v; drawCmp(); }, 'Destination')),
    T('Satellite gateway (B)', seg([{ value: 'in', label: 'Indian gateway' }, { value: 'os', label: 'Overseas gateway' }], cmp.gw, (v) => { cmp.gw = v; drawCmp(); }, 'Gateway location')),
    T('Inter-satellite links (B)', toggle('On', cmp.isl, (v) => { cmp.isl = v; drawCmp(); })),
    T('Backhaul', seg([{ value: 'single', label: 'Single' }, { value: 'redundant', label: 'Redundant' }], cmp.backhaul, (v) => { cmp.backhaul = v; drawCmp(); }, 'Backhaul')),
    T('Operator access control', seg([{ value: 'strong', label: 'Strong' }, { value: 'weak', label: 'Weak' }], cmp.access, (v) => { cmp.access = v; drawCmp(); }, 'Access control')),
    T('Network condition', seg([{ value: 'normal', label: 'Normal' }, { value: 'outage', label: 'Backhaul outage' }], cmp.cond, (v) => { cmp.cond = v; drawCmp(); }, 'Condition')));

  let dA, dB, pA, pB, rA, rB, metaA, metaB;
  const J = { IN: 'India', OS: 'Overseas', SP: 'In orbit', GL: 'Global control plane' };
  function buildArch(which) {
    const destJ = cmp.dest === 'in' ? 'IN' : 'OS';
    const red = cmp.backhaul === 'redundant', out = cmp.cond === 'outage';
    let nodes, links, route, jur, bhFrom, bhTo;
    if (which === 'A') {
      nodes = [
        { id: 'user', label: 'User', icon: '👤', x: 50, y: 95, org: 'You · India' },
        { id: 'acc', label: 'Mobile / fixed access', icon: '🗼', x: 200, y: 95, org: 'Indian operator · India' },
        { id: 'net', label: 'Operator network', icon: '⚙️', x: 420, y: 95, org: 'Indian operator · India' },
        { id: 'ix', label: 'Interconnection', icon: '🔀', x: 640, y: 95, org: 'IXP / transit · India' },
        { id: 'dest', label: destJ === 'IN' ? 'Website (India)' : 'Website (overseas)', icon: '☁️', x: 900, y: 95, org: 'Content provider · ' + J[destJ] },
      ];
      jur = { user: 'IN', acc: 'IN', bkp: 'IN', net: 'IN', ix: 'IN', dest: destJ };
      bhFrom = 'acc'; bhTo = 'net';
      links = [{ from: 'user', to: 'acc', type: 'radio' }, { from: 'net', to: 'ix', type: 'fibre' }, { from: 'ix', to: 'dest', type: destJ === 'OS' ? 'intl' : 'fibre', title: destJ === 'OS' ? 'Submarine cable abroad' : 'Domestic fibre' }];
      route = ['user', 'acc'];
    } else {
      const gwJ = cmp.gw === 'in' ? 'IN' : 'OS';
      nodes = [
        { id: 'user', label: 'User', icon: '👤', x: 50, y: 175, org: 'You · India' },
        { id: 'term', label: 'Terminal', icon: '📡', x: 150, y: 175, org: 'Satellite operator · India' },
        { id: 'sat1', label: 'LEO satellite', icon: '🛰️', x: 260, y: 55, org: 'Satellite operator · orbit' },
        { id: 'gw', label: gwJ === 'IN' ? 'Gateway (India)' : 'Gateway (overseas)', icon: '🗼', x: 470, y: 175, org: 'Satellite operator · ' + J[gwJ] },
        { id: 'net', label: 'Operator network', icon: '⚙️', x: 640, y: 175, org: 'Satellite operator · global' },
        { id: 'ix', label: 'Interconnection', icon: '🔀', x: 790, y: 175, org: 'IXP / transit · ' + J[gwJ] },
        { id: 'dest', label: destJ === 'IN' ? 'Website (India)' : 'Website (overseas)', icon: '☁️', x: 930, y: 175, org: 'Content provider · ' + J[destJ] },
      ];
      jur = { user: 'IN', term: 'IN', sat1: 'SP', sat2: 'SP', gw: gwJ, bkp: gwJ, net: 'GL', ix: gwJ, dest: destJ };
      links = [{ from: 'user', to: 'term', type: 'wired' }, { from: 'term', to: 'sat1', type: 'radio' }, { from: 'net', to: 'ix', type: 'fibre' }, { from: 'ix', to: 'dest', type: gwJ !== destJ ? 'intl' : 'fibre', title: gwJ !== destJ ? 'International link' : 'Local fibre' }];
      route = ['user', 'term', 'sat1'];
      if (cmp.isl) {
        nodes.push({ id: 'sat2', label: 'LEO satellite 2', icon: '🛰️', x: 380, y: 45, org: 'Satellite operator · orbit' });
        links.push({ from: 'sat1', to: 'sat2', type: 'laser', curve: -20 }, { from: 'sat2', to: 'gw', type: 'radio' });
        route.push('sat2');
      } else links.push({ from: 'sat1', to: 'gw', type: 'radio' });
      route.push('gw');
      bhFrom = 'gw'; bhTo = 'net';
    }
    const bx = (nodes.find((n) => n.id === bhFrom).x + nodes.find((n) => n.id === bhTo).x) / 2;
    links.push({ id: 'bh', from: bhFrom, to: bhTo, type: out ? 'down' : 'fibre', title: 'Primary backhaul' });
    if (red) {
      nodes.push({ id: 'bkp', label: 'Backup route', icon: '↪', x: bx, y: which === 'A' ? 165 : 255, r: 14 });
      links.push({ from: bhFrom, to: 'bkp', type: 'fibre', title: 'Backup backhaul' }, { from: 'bkp', to: bhTo, type: 'fibre', title: 'Backup backhaul' });
    }
    let failed = false;
    if (out && !red) failed = true;
    else { if (out) route.push('bkp'); route.push('net', 'ix', 'dest'); }
    return { nodes, links, route, jur, failed };
  }
  function crossings(route, jur) {
    const seq = route.map((id) => jur[id]).filter((j) => j === 'IN' || j === 'OS');
    let n = 0; for (let i = 1; i < seq.length; i++) if (seq[i] !== seq[i - 1]) n++;
    return n;
  }
  function note(which, meta) {
    const box = clear($(which === 'A' ? '#note-a' : '#note-b'));
    const parts = [];
    if (meta.failed) parts.push(h('div', { class: 'bad' }, '✖ Backhaul is down and there is no backup: service is lost for these users.'));
    else if (cmp.cond === 'outage') parts.push(h('div', { class: 'warn' }, '↪ Primary backhaul is down; traffic takes the backup route.'));
    const n = crossings(meta.route, meta.jur);
    if (!meta.failed) parts.push(h('div', { class: n ? 'warn' : 'ok' }, n === 0 ? '✓ Traffic stays in India end to end.' : `⚑ Traffic crosses a national border ${n} time${n > 1 ? 's' : ''}.` + (n >= 2 ? ' It leaves India and comes back ("tromboning").' : '')));
    if (cmp.access === 'weak') parts.push(h('div', { class: 'warn' }, '⚠ Weak operator access control: management access and privileged-account threats (T1, T2) rise.'));
    if (which === 'B') parts.push(h('div', { class: 'muted' }, 'The satellite operator\'s control plane serves every country it operates in.' + (cmp.cond === 'outage' ? ' This toggle models a backhaul cut; App 1 shows an operator-wide control-plane outage.' : '')));
    add(box, ...parts);
  }
  function drawCmp() {
    if (pA) pA.reset(); if (pB) pB.reset();
    metaA = buildArch('A'); metaB = buildArch('B');
    for (const [which, meta, el] of [['A', metaA, '#cmp-a'], ['B', metaB, '#cmp-b']]) {
      const box = clear($(el));
      const d = new NetDiagram(box, { width: 1000, height: which === 'A' ? 215 : 300, nodes: meta.nodes, links: meta.links, ariaLabel: 'Architecture ' + which, onNodeClick: (id) => narrate(meta.nodes.find((n) => n.id === id).org || '', meta.nodes.find((n) => n.id === id).label) });
      if (cmp.access === 'weak') d.nodeClass('net', 'warn');
      if (meta.failed) d.nodeClass(which === 'A' ? 'acc' : 'gw', 'down');
      if (which === 'A') { dA = d; pA = new PathPlayer(d, {}); } else { dB = d; pB = new PathPlayer(d, {}); }
      note(which, meta);
    }
  }
  drawCmp();
  $('#cmp-play').addEventListener('click', () => {
    pA.play(metaA.route); pB.play(metaB.route);
    narrate('Both packets are travelling. Watch which organisations and countries each one passes through.', 'Comparison');
  });
  $('#cmp-reset').addEventListener('click', () => { pA.reset(); pB.reset(); });

  /* ================= 2. Threat model ================= */
  const tbl = $('#thr-table');
  add(tbl, h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Threat'), h('th', null, 'A · Terrestrial'), h('th', null, 'B · Satellite'), h('th', null, 'Evidence'))));
  const tbody = h('tbody');
  THREATS.forEach((t) => {
    const nameBtn = h('button', { class: 'linkish', type: 'button' }, t.name);
    const tr = h('tr', null, h('td', null, t.id), h('td', null, nameBtn), h('td', null, rateEl(rating(t.base.A, t.unknown.A))), h('td', null, rateEl(rating(t.base.B, t.unknown.B))), h('td', null, chip(t.evidence)));
    tr.addEventListener('click', () => showThreat(t.id));
    tr.dataset.id = t.id;
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);
  function showThreat(id) {
    const t = TBY[id];
    [...tbody.children].forEach((r) => r.classList.toggle('sel', r.dataset.id === id));
    const safeguards = Object.entries(BLOCKS).filter(([, b]) => (b.fx[id] || 0) < 0).map(([, b]) => b.label);
    const archCol = (k, label) => h('div', { class: 'card' }, h('h4', null, label, ' ', rateEl(rating(t.base[k], t.unknown[k]))),
      h('dl', { class: 'fields' }, h('dt', null, 'Existing mitigations'), h('dd', null, t.mit[k]),
        h('dt', null, 'Residual risk'), h('dd', null, rating(t.base[k], t.unknown[k]) + (t.unknown[k] ? ' (not enough public evidence to rate)' : ''))),
      h('details', null, h('summary', null, 'Why this rating?'), h('p', null, t.why[k]), h('p', { class: 'muted', style: { fontSize: '.85em' } }, 'A qualitative judgement for teaching, not a measurement.')));
    fill($('#thr-detail'), 
      h('h3', null, `${t.id} · ${t.name}`),
      h('div', { class: 'grid g2' },
        h('dl', { class: 'fields' }, h('dt', null, 'Assets at risk'), h('dd', null, t.assets), h('dt', null, 'Attacker capability'), h('dd', null, t.capability)),
        h('dl', { class: 'fields' }, h('dt', null, 'Preconditions'), h('dd', null, t.pre), h('dt', null, 'Consequences'), h('dd', null, t.cons))),
      h('div', { class: 'grid g2', style: { marginTop: '12px' } }, archCol('A', 'Architecture A · Terrestrial'), archCol('B', 'Architecture B · Satellite')),
      h('h4', { style: { marginTop: '12px' } }, 'Evidence quality ', chip(t.evidence)),
      ...(t.claims.length ? claims(t.claims) : [h('p', { class: 'muted' }, 'No specific public evidence cited; this is a general architectural risk.')]),
      h('h4', null, 'Proposed safeguards (from the workbench)'),
      h('ul', { class: 'tight' }, safeguards.map((x) => h('li', null, x))));
    narrate(`${t.name}. Terrestrial: ${rating(t.base.A, t.unknown.A)}. Satellite: ${rating(t.base.B, t.unknown.B)}. ${t.why.B}`, t.id);
  }
  showThreat('T1');

  /* ================= 3. Evidence ================= */
  add($('#ev-lesson'), h('h3', null, 'A risk is not an allegation'),
    h('p', null, h('strong', null, 'A verified fact'), ' has a primary or reputable source and a date: "IN-SPACe authorised the constellation on 8 July 2025."'),
    h('p', null, h('strong', null, 'A plausible risk'), ' follows from how a system is designed: "If one control plane serves everyone, one failure can affect everyone." It says what ', h('em', null, 'could'), ' happen. It is not proof that anything did.'),
    h('p', null, h('strong', null, 'An unverified allegation'), ' claims something happened or exists without evidence. Do not treat it as fact or build a design argument on it.'),
    h('p', { class: 'muted' }, 'In the challenge, argue from facts and risks only. A claim without a source and date is not shown here.'));
  const EV = [
    ['verified', 'A · Verified facts', ['starlink-gmpcs', 'starlink-inspace', 'satcom-pending', 'starlink-gateways', 'satcom-conditions', 'outage-2025', 'trusted-source', 'certin', 'ml-kem']],
    ['plausible', 'B · Plausible architectural risks', ['pl-central', 'pl-jurisdiction', 'pl-metadata', 'pl-supply', 'pl-harvest']],
    ['unverified', 'C · Unverified allegations (do not treat as fact)', ['un-killswitch', 'un-bypass', 'un-backdoor']],
  ];
  for (const [tag, title, ids] of EV) $('#ev-groups').appendChild(h('div', { class: 'card ev-group' }, h('h3', null, chip(tag), title), claims(ids)));

  /* ================= 4. Workbench ================= */
  const saved = store.get('app3:design', null);
  const design = {
    sel: new Set(saved && Array.isArray(saved.blocks) ? saved.blocks.filter((b) => BLOCKS[b]) : ['gw-base', 'key-op']),
    notes: (saved && saved.notes) || {}, title: (saved && saved.title) || '', team: (saved && saved.team) || '',
    assumptions: (saved && saved.assumptions) || '', openQuestions: (saved && saved.openQuestions) || '',
  };
  function persist() {
    store.set('app3:design', { blocks: [...design.sel], notes: design.notes, title: design.title, team: design.team, assumptions: design.assumptions, openQuestions: design.openQuestions });
  }
  function fxText(b) {
    const parts = Object.entries(b.fx).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`);
    if (b.privacy) parts.push(`privacy ${b.privacy > 0 ? '+' : ''}${b.privacy}`);
    if (b.resilience) parts.push(`resilience ${b.resilience > 0 ? '+' : ''}${b.resilience}`);
    if (b.competition) parts.push(`competition ${b.competition > 0 ? '+' : ''}${b.competition}`);
    if (b.cost) parts.push(`cost ${b.cost}`);
    return parts.length ? parts.join(' · ') : 'no change';
  }
  const inputs = {};
  const wbBlocks = $('#wb-blocks');
  for (const g of GROUPS) {
    const opts = h('div', { class: 'opts', role: g.type === 'radio' ? 'radiogroup' : 'group', 'aria-label': g.title });
    const mk = (id, type) => {
      const b = BLOCKS[id];
      const input = h('input', { type, name: type === 'radio' ? 'g-' + g.id : null, value: id });
      input.addEventListener('change', () => {
        if (type === 'radio') g.blocks.forEach((x) => design.sel.delete(x));
        if (input.checked) design.sel.add(id); else design.sel.delete(id);
        update();
      });
      inputs[id] = input;
      return h('label', { class: 'opt' }, input, h('span', null, h('strong', null, b.label), h('span', { class: 'd' }, b.desc), h('span', { class: 'fx' }, fxText(b))));
    };
    g.blocks.forEach((id) => opts.appendChild(mk(id, g.type === 'radio' ? 'radio' : 'checkbox')));
    (g.extra || []).forEach((id) => opts.appendChild(mk(id, 'checkbox')));
    wbBlocks.appendChild(h('div', { class: 'grp card' }, h('h3', null, g.title), opts));
  }
  function syncInputs() {
    for (const g of GROUPS) if (g.type === 'radio' && !g.blocks.some((b) => design.sel.has(b))) design.sel.add(g.blocks[0]);
    for (const [id, input] of Object.entries(inputs)) input.checked = design.sel.has(id);
  }

  function compute(sel) {
    const res = {}, unk = {};
    let privacy = 50, resil = 0, comp = 50, cost = 0;
    for (const t of THREATS) res[t.id] = t.base.B;
    const touched = new Set();
    for (const id of sel) {
      const b = BLOCKS[id]; if (!b) continue;
      for (const [k, v] of Object.entries(b.fx)) { res[k] += v; touched.add(k); }
      privacy += b.privacy || 0; resil += b.resilience || 0; comp += b.competition || 0; cost += b.cost || 0;
    }
    for (const t of THREATS) { res[t.id] = clamp(res[t.id], 1, 10); unk[t.id] = !!t.unknown.B && !touched.has(t.id); }
    const mean = THREATS.reduce((a, t) => a + res[t.id], 0) / THREATS.length;
    const costIdx = clamp(cost * 4);
    const scores = {
      security: clamp(Math.round(100 - 10 * (mean - 1))),
      privacy: clamp(privacy),
      resilience: clamp(Math.round(100 - 10 * ((res.T7 + res.T12 + res.T15) / 3 - 1)) + resil),
      cost: costIdx,
      competition: clamp(comp - (costIdx > 60 ? 10 : 0)),
    };
    const warnings = [];
    for (const id of sel) {
      const b = BLOCKS[id]; if (!b) continue;
      const ups = Object.entries(b.fx).filter(([, v]) => v > 0).map(([k]) => `${k} (${TBY[k].short})`);
      if (ups.length) warnings.push(`"${b.label}" fixes some threats but raises ${ups.join(', ')}.`);
    }
    if (sel.has('key-india') && !(sel.has('la-auth') && sel.has('la-audit'))) warnings.push('India-held keys without authorisation steps and an independent audit trail make abuse of lawful access (T14) more likely. Stronger control, lower privacy.');
    if (sel.has('gw-india') && !sel.has('rs-fallback') && !sel.has('rs-local')) warnings.push('In-India termination concentrates traffic at a few gateway sites. Add terrestrial fallback or local survivability so they do not become a single disruption target (T7).');
    if (sel.has('pa-two') && !sel.has('rs-emerg')) warnings.push('Two-person approval slows emergency changes. Add emergency-service continuity with a break-glass procedure.');
    if (sel.has('key-joint')) warnings.push('Joint key custody adds a key ceremony, so emergency key rotation is slower (resilience −3).');
    if (costIdx > 60) warnings.push(`The cost index is ${costIdx}. Costs this high may reach consumers as higher prices: the competition score is reduced by 10.`);
    if (scores.privacy < 40) warnings.push('This design gains control at the expense of privacy.');
    if (![...sel].some((x) => x.startsWith('la-'))) warnings.push('No lawful-access safeguards selected. The baseline 2024 rules still apply, but nothing extra limits or audits access.');
    return { res, unk, scores, warnings, mean };
  }

  const SC = [['security', 'Security'], ['privacy', 'Privacy'], ['resilience', 'Resilience'], ['cost', 'Cost (lower is better)'], ['competition', 'Competition']];
  function update() {
    syncInputs(); persist();
    const r = compute(design.sel);
    fill($('#wb-score'), h('h3', null, 'Scorecard ', chip('illustrative')),
      ...SC.map(([k, l]) => h('div', { class: 'score-row' }, h('span', null, l), h('div', { class: 'bar' }, h('i', { class: k === 'cost' ? 'cost' : '', style: { width: r.scores[k] + '%' } })), h('strong', null, r.scores[k]))));
    const wb = clear($('#wb-warn'));
    r.warnings.forEach((w) => wb.appendChild(h('div', { class: 'notice warn', style: { margin: '0 0 8px' } }, '⚠ ' + w)));
    const tb = clear($('#wb-threats'));
    add(tb, h('h3', null, 'Threats after your design'), h('p', { class: 'muted', style: { fontSize: '.85em', margin: '0 0 6px' } }, 'Satellite architecture B, baseline → your design'));
    for (const t of THREATS) {
      const d = r.res[t.id] - t.base.B;
      tb.appendChild(h('div', { class: 'thr-mini' }, h('strong', null, t.id), h('span', null, t.name, ' ', d ? h('span', { class: 'delta' + (d > 0 ? ' up' : '') }, `${d > 0 ? '+' : ''}${d}`) : null), rateEl(rating(r.res[t.id], r.unk[t.id]))));
    }
    drawTradeoffs();
    return r;
  }
  add($('#scoring-rules'), 
    h('p', null, 'Each threat starts at its satellite baseline (1–10, from the threat model). Each building block adds or subtracts points, shown on the block as T-numbers. Scores are clamped to 1–10. Ratings: 1–3 Low, 4–6 Medium, 7–10 High. A threat rated Unknown stays Unknown until a block addresses it.'),
    h('div', { class: 'formula', style: { fontFamily: 'var(--mono)', fontSize: '.85em', background: '#0a1736', padding: '10px', borderRadius: '8px', whiteSpace: 'pre-wrap' } },
      `Security    = 100 − 10 × (mean residual of 15 threats − 1)
Privacy     = 50 + Σ block privacy points
Resilience  = 100 − 10 × (mean of T7, T12, T15 − 1) + Σ block resilience points
Cost index  = 4 × Σ block cost units          (lower is better)
Competition = 50 + Σ block competition points − 10 if cost index > 60
All scores are clamped to 0–100.`),
    h('p', { class: 'muted' }, 'The weights are teaching choices made openly so they can be challenged. Entrants may argue for different weights in their write-up.'),
    h('div', { class: 'tablewrap' }, h('table', { class: 'data' }, h('thead', null, h('tr', null, h('th', null, 'Block'), h('th', null, 'Effects'))),
      h('tbody', null, Object.values(BLOCKS).map((b) => h('tr', null, h('td', null, b.label), h('td', null, fxText(b))))))));

  $('#wb-demo').addEventListener('click', () => loadDemo());
  $('#wb-clear').addEventListener('click', () => { design.sel = new Set(['gw-base', 'key-op']); update(); narrate('Design cleared to the baseline.', 'Workbench'); });

  /* ================= 5. Sandbox ================= */
  let sbTimer = null;
  function runSandbox() {
    clearTimeout(sbTimer);
    const r = compute(design.sel);
    const out = clear($('#sb-out'));
    const counts = { contained: 0, partial: 0, serious: 0 };
    const cards = THREATS.map((t) => {
      const v = r.res[t.id];
      const trig = [...design.sel].filter((id) => (BLOCKS[id].fx[t.id] || 0) < 0).map((id) => BLOCKS[id].label);
      const lvl = v <= 3 ? 'contained' : v <= 6 ? 'partial' : 'serious';
      counts[lvl]++;
      const leaked = { contained: 'Nothing. The attempt was stopped or detected early.', partial: `Partial: some ${t.leak} affected before controls responded.`, serious: `Serious: ${t.leak} exposed or service lost.` }[lvl];
      const hrs = Math.max(1, Math.round(t.hours * v / t.base.B));
      return h('div', { class: 'card sb-card' },
        h('h3', null, `${t.id} · ${t.name}`),
        h('p', { class: 'muted', style: { fontSize: '.86em', margin: '0 0 6px' } }, `Fictional scenario: ${t.capability.toLowerCase().replace(/\.$/, '')} exploits ${t.pre.toLowerCase().replace(/\.$/, '')}`),
        h('div', { class: 'res ' + lvl }, { contained: '✓ Contained', partial: '◐ Partly contained', serious: '✖ Not contained' }[lvl]),
        h('div', { style: { fontSize: '.86em', marginTop: '4px' } }, h('strong', null, 'Controls triggered: '), trig.length ? trig.join(', ') : 'none from your design'),
        h('div', { style: { fontSize: '.86em' } }, h('strong', null, 'What leaked: '), leaked),
        h('div', { style: { fontSize: '.86em' } }, h('strong', null, 'Recovery time: '), hrs >= 48 ? `${Math.round(hrs / 24)} days` : `${hrs} hours`, ' ', chip('simulated')));
    });
    const reduce = document.body.classList.contains('reduce-motion');
    let i = 0;
    const next = () => { if (i < cards.length) { out.appendChild(cards[i++]); sbTimer = setTimeout(next, reduce ? 0 : 110); } };
    next();
    fill($('#sb-summary'), h('p', null, h('strong', null, `${counts.contained} contained, ${counts.partial} partly contained, ${counts.serious} not contained.`), ' Recovery times scale with residual risk. All results are simulated.'));
    narrate(`Sandbox run: ${counts.contained} contained, ${counts.partial} partly contained, ${counts.serious} not contained.`, 'Sandbox');
  }
  $('#sb-run').addEventListener('click', runSandbox);
  $('#sb-clear').addEventListener('click', () => { clearTimeout(sbTimer); clear($('#sb-out')); clear($('#sb-summary')); });

  /* ================= 6. Export ================= */
  const fTitle = $('#ex-title'), fTeam = $('#ex-team'), fAssume = $('#ex-assume'), fOpen = $('#ex-open');
  function syncFields() { fTitle.value = design.title; fTeam.value = design.team; fAssume.value = design.assumptions; fOpen.value = design.openQuestions; }
  syncFields();
  fTitle.addEventListener('input', () => { design.title = fTitle.value; persist(); });
  fTeam.addEventListener('input', () => { design.team = fTeam.value; persist(); });
  fAssume.addEventListener('input', () => { design.assumptions = fAssume.value; persist(); });
  fOpen.addEventListener('input', () => { design.openQuestions = fOpen.value; persist(); });
  const toBox = $('#ex-tradeoffs');
  const toInputs = {};
  for (const t of THREATS) {
    const inp = h('input', { id: 'to-' + t.id, type: 'text', maxlength: 240, placeholder: t.name });
    inp.addEventListener('input', () => { design.notes[t.id] = inp.value; persist(); });
    toInputs[t.id] = inp;
    toBox.appendChild(h('div', { class: 'to-row' }, h('label', { for: 'to-' + t.id, title: t.name }, t.id), inp));
  }
  function drawTradeoffs() { for (const t of THREATS) if (document.activeElement !== toInputs[t.id]) toInputs[t.id].value = design.notes[t.id] || ''; }

  function exportObj() {
    const r = compute(design.sel);
    return {
      schema: 'isk-protocol-design/1', kit: 'Trusted Satellite Internet Kit', exported: new Date().toISOString(),
      title: design.title || 'Untitled design', team: design.team || '',
      blocks: [...design.sel],
      blockLabels: [...design.sel].map((id) => BLOCKS[id].label),
      scores: r.scores,
      threats: THREATS.map((t) => ({ id: t.id, name: t.name, baseline: t.base.B, residual: r.res[t.id], rating: rating(r.res[t.id], r.unk[t.id]), tradeoff: design.notes[t.id] || '' })),
      warnings: r.warnings, assumptions: design.assumptions, openQuestions: design.openQuestions,
      note: 'Ratings are qualitative teaching judgements from the kit\'s model, not measurements.',
    };
  }
  function download(blob, name) {
    const a = h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  const slug = () => (design.title || 'design').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'design';
  const exStatus = $('#ex-status');
  function missingNotes() { return THREATS.filter((t) => !(design.notes[t.id] || '').trim()).length; }
  $('#ex-json').addEventListener('click', () => {
    download(new Blob([JSON.stringify(exportObj(), null, 2)], { type: 'application/json' }), slug() + '.json');
    const m = missingNotes();
    exStatus.textContent = 'JSON downloaded.' + (m ? ` ${m} threat${m > 1 ? 's have' : ' has'} no trade-off note yet.` : '');
  });
  $('#ex-pdf').addEventListener('click', () => {
    const o = exportObj();
    const pdf = new MiniPDF();
    const navy = [8, 18, 43], gold = [190, 140, 40], grey = [90, 95, 120];
    pdf.rect(0, 0, 595, 64, navy);
    pdf.text(36, 30, o.title, 17, true, [246, 210, 126]);
    pdf.text(36, 50, 'Trusted Satellite Internet Protocol Challenge - design summary', 9.5, false, [220, 225, 240]);
    let y = 84;
    pdf.text(36, y, `Team: ${o.team || '-'}`, 9.5, true); pdf.text(330, y, `Exported: ${o.exported.slice(0, 10)}`, 9.5, false, grey);
    y += 20;
    SC.forEach(([k, l], i) => { const x = 36 + i * 106; pdf.text(x, y, l.replace(' (lower is better)', ' (low=good)'), 7.5, false, grey); pdf.text(x, y + 14, String(o.scores[k]), 13, true, navy); });
    y += 32; pdf.line(36, y, 559, y);
    y += 14; pdf.text(36, y, 'Building blocks', 10, true, gold); y += 12;
    for (const g of GROUPS) {
      const chosen = [...g.blocks, ...(g.extra || [])].filter((b) => design.sel.has(b)).map((b) => BLOCKS[b].label);
      y = pdf.para(36, y, `${g.title}: ${chosen.length ? chosen.join('; ') : 'none'}`, 8, 523, 10.5, { maxLines: 2 });
    }
    if (o.warnings.length) {
      y += 6; pdf.text(36, y, 'Warnings', 10, true, gold); y += 12;
      o.warnings.slice(0, 3).forEach((w) => { y = pdf.para(36, y, '- ' + w, 7.5, 523, 9.5, { maxLines: 2 }); });
    }
    y += 6; pdf.text(36, y, 'Threats (satellite baseline -> this design) and trade-offs', 10, true, gold); y += 12;
    for (const t of o.threats) {
      pdf.text(36, y, t.id, 7.8, true); pdf.text(58, y, t.name.slice(0, 52), 7.8);
      pdf.text(300, y, `${t.baseline} -> ${t.residual}`, 7.8); pdf.text(340, y, t.rating, 7.8, true, t.rating === 'High' ? [190, 40, 40] : t.rating === 'Low' ? [20, 130, 80] : [170, 110, 0]);
      const to = pdf.wrap(t.tradeoff || '(no trade-off stated)', 7, 175);
      pdf.text(390, y, to[0] + (to.length > 1 ? ' ...' : ''), 7, false, t.tradeoff ? [20, 20, 40] : grey);
      y += 11.5;
    }
    y += 6; pdf.text(36, y, 'Assumptions', 10, true, gold); y += 12;
    y = pdf.para(36, y, o.assumptions || '-', 8, 523, 10, { maxLines: 3 });
    y += 4; pdf.text(36, y, 'Open questions', 10, true, gold); y += 12;
    y = pdf.para(36, y, o.openQuestions || '-', 8, 523, 10, { maxLines: 3 });
    pdf.line(36, 800, 559, 800);
    pdf.para(36, 812, 'Ratings and scores are qualitative teaching judgements from the kit model, not measurements. Simulations used invented data only. Full detail, including every trade-off, is in the JSON export.', 7, 523, 9, { color: grey });
    download(pdf.blob(), slug() + '.pdf');
    exStatus.textContent = 'PDF downloaded.';
  });

  /* ================= Peer review ================= */
  function validDesign(o) { return o && typeof o === 'object' && Array.isArray(o.blocks); }
  function compareView(a, b) {
    const ra = compute(new Set(a.blocks.filter((x) => BLOCKS[x]))), rb = compute(new Set(b.blocks.filter((x) => BLOCKS[x])));
    const name = (o) => o.title || 'Untitled';
    const out = clear($('#pr-out'));
    add(out, h('p', { class: 'muted' }, 'Scores are recomputed from each file\'s building blocks with this app\'s model, so files cannot carry edited scores.'));
    add(out, h('div', { class: 'tablewrap' }, h('table', { class: 'data' },
      h('thead', null, h('tr', null, h('th', null, ''), h('th', null, name(a) + (a.team ? ` (${a.team})` : '')), h('th', null, name(b) + (b.team ? ` (${b.team})` : '')))),
      h('tbody', null,
        SC.map(([k, l]) => h('tr', null, h('th', null, l), h('td', null, String(ra.scores[k])), h('td', null, String(rb.scores[k])))),
        THREATS.map((t) => h('tr', null, h('th', null, `${t.id} ${t.name}`),
          h('td', null, rateEl(rating(ra.res[t.id], ra.unk[t.id])), ' ', h('span', { class: 'muted', style: { fontSize: '.85em' } }, ((a.threats || []).find((x) => x.id === t.id) || {}).tradeoff || '')),
          h('td', null, rateEl(rating(rb.res[t.id], rb.unk[t.id])), ' ', h('span', { class: 'muted', style: { fontSize: '.85em' } }, ((b.threats || []).find((x) => x.id === t.id) || {}).tradeoff || '')))),
        Object.entries(BLOCKS).filter(([id]) => a.blocks.includes(id) || b.blocks.includes(id)).map(([id, bl]) => h('tr', null, h('th', null, bl.label),
          h('td', { class: a.blocks.includes(id) ? 'diff-yes' : 'diff-no' }, a.blocks.includes(id) ? '✓ used' : '–'),
          h('td', { class: b.blocks.includes(id) ? 'diff-yes' : 'diff-no' }, b.blocks.includes(id) ? '✓ used' : '–')))))));
    add(out, h('div', { class: 'grid g2', style: { marginTop: '10px' } },
      h('div', { class: 'card' }, h('h4', null, name(a) + ': assumptions and questions'), h('p', null, a.assumptions || '–'), h('p', { class: 'muted' }, a.openQuestions || '–')),
      h('div', { class: 'card' }, h('h4', null, name(b) + ': assumptions and questions'), h('p', null, b.assumptions || '–'), h('p', { class: 'muted' }, b.openQuestions || '–'))));
  }
  $('#pr-file').addEventListener('change', async (e) => {
    const files = [...e.target.files].slice(0, 2);
    const out = clear($('#pr-out'));
    try {
      const objs = await Promise.all(files.map((f) => f.text().then((t) => JSON.parse(t))));
      if (!objs.every(validDesign)) throw new Error('This does not look like a design file exported from App 3.');
      if (objs.length === 1) compareView(exportObj(), objs[0]); else compareView(objs[0], objs[1]);
    } catch (err) {
      out.appendChild(h('div', { class: 'notice bad' }, 'Could not read the file: ' + err.message));
    }
    e.target.value = '';
  });
  $('#pr-clear').addEventListener('click', () => clear($('#pr-out')));

  /* ================= quiz, sources, glossary ================= */
  K.quiz($('#quiz'), [
    { q: 'Which statement is a plausible risk rather than an allegation?', options: ['"Operator X secretly shares data."', '"If one control plane serves all users, one failure affects all users."', '"Terminals have hidden backdoors."', '"A foreign order switched off India."'], answer: 1, why: 'It follows from the design and makes no claim that anything happened.' },
    { q: 'What does in-India termination mainly reduce?', options: ['Radio jamming', 'Foreign-jurisdiction exposure and metadata leaving India', 'Cost', 'Insider risk'], answer: 1, why: 'Keeping traffic and systems in India lowers T8 and T3, but concentrates traffic at a few gateways.' },
    { q: 'Why can India-held keys lower the privacy score?', options: ['They are slower', 'They concentrate lawful-access power unless strongly audited', 'They break TLS', 'They need more satellites'], answer: 1, why: 'Stronger state control can mean weaker privacy without scope limits and audit.' },
    { q: 'What protects recorded traffic against future quantum computers?', options: ['Longer passwords', 'Post-quantum-ready key exchange such as ML-KEM', 'More gateways', 'Transparency reports'], answer: 1, why: 'Hybrid post-quantum key exchange defends against "harvest now, decrypt later".' },
    { q: 'Why is T5 (supply chain) rated Unknown for satellite?', options: ['It is impossible', 'There is not enough public information to rate it', 'It is always high', 'Satellites have no supply chain'], answer: 1, why: 'Where evidence is thin, saying Unknown is more honest than guessing.' },
  ]);
  K.sourceList($('#sources-list'));
  K.glossaryList($('#glossary-list'));

  function loadDemo() {
    const d = window.DEMO_DESIGN;
    design.sel = new Set(d.blocks); design.title = d.title; design.team = d.team; design.assumptions = d.assumptions; design.openQuestions = d.openQuestions;
    const r = compute(design.sel);
    for (const t of THREATS) {
      if (design.notes[t.id]) continue;
      const helped = d.blocks.filter((id) => (BLOCKS[id].fx[t.id] || 0) < 0).map((id) => BLOCKS[id].label.toLowerCase());
      design.notes[t.id] = helped.length ? `Lowered by ${helped.slice(0, 2).join(' and ')}. Residual: ${rating(r.res[t.id], r.unk[t.id]).toLowerCase()}. Still watch for: ${t.pre.charAt(0).toLowerCase() + t.pre.slice(1)}` : `Not addressed by this design; accepted as ${rating(r.res[t.id], r.unk[t.id]).toLowerCase()} residual risk.`;
    }
    syncFields(); update();
    narrate('Demo design loaded: split termination, joint keys, strong privileged access, audited lawful access and terrestrial fallback.', 'Workbench');
  }

  K.on('demo', (on) => {
    if (on) {
      loadDemo();
      document.getElementById('compare').scrollIntoView();
      pA.play(metaA.route); pB.play(metaB.route);
      runSandbox();
    }
  });

  update();
})();
