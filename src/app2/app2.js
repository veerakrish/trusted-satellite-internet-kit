/* App 2: Inside India's Internet. */
(function () {
  'use strict';
  const { h, s, $, clear, fill, add, claim, claims, narrate, seg, toggle, chip } = window.K;

  K.init({ app: 'app2', intro: 'App 2 shows how Indian networks are built, governed and secured, and where the gaps are.' });
  $('#intro-claim').appendChild(claim('no-https-read'));

  const btn = (label, fn, cls) => { const b = h('button', { class: cls || 'btn', type: 'button' }, label); b.addEventListener('click', fn); return b; };

  /* ================= 1. Two connection paths ================= */
  const NODES = [
    { id: 'phone', label: 'Phone', icon: '📱', x: 55, y: 105, org: 'You' },
    { id: 'bs', label: '4G/5G base station', icon: '🗼', x: 165, y: 105, org: 'Mobile operator' },
    { id: 'ran', label: 'Radio access network', icon: '📶', x: 280, y: 105, org: 'Mobile operator' },
    { id: 'mcore', label: 'Mobile core', icon: '⚙️', x: 395, y: 105, org: 'Mobile operator' },
    { id: 'transport', label: 'Transport (fibre)', icon: '🧵', x: 510, y: 105, org: 'Operator / backbone' },
    { id: 'ipgw', label: 'IP network + gateway', icon: '🚪', x: 625, y: 105, org: 'Mobile operator' },
    { id: 'dev', label: 'Laptop / TV', icon: '💻', x: 55, y: 335, org: 'You' },
    { id: 'wifi', label: 'Wi-Fi router', icon: '📶', x: 165, y: 335, org: 'You' },
    { id: 'ont', label: 'ONT / access box', icon: '📦', x: 280, y: 335, org: 'Broadband ISP' },
    { id: 'lan', label: 'Local access network', icon: '🏘️', x: 395, y: 335, org: 'Broadband ISP' },
    { id: 'isp', label: 'ISP network', icon: '🏢', x: 540, y: 335, org: 'Broadband ISP' },
    { id: 'ix', label: 'IXP or upstream transit', icon: '🔀', x: 760, y: 220, org: 'Exchange / transit' },
    { id: 'srv', label: 'Website / cloud / CDN', icon: '☁️', x: 900, y: 220, org: 'Content provider' },
  ];
  const LINKS = [
    { from: 'phone', to: 'bs', type: 'radio' }, { from: 'bs', to: 'ran', type: 'fibre' }, { from: 'ran', to: 'mcore', type: 'fibre' },
    { from: 'mcore', to: 'transport', type: 'fibre' }, { from: 'transport', to: 'ipgw', type: 'fibre' }, { from: 'ipgw', to: 'ix', type: 'fibre' },
    { from: 'dev', to: 'wifi', type: 'radio' }, { from: 'wifi', to: 'ont', type: 'wired' }, { from: 'ont', to: 'lan', type: 'fibre' },
    { from: 'lan', to: 'isp', type: 'fibre' }, { from: 'isp', to: 'ix', type: 'fibre' }, { from: 'ix', to: 'srv', type: 'fibre' },
  ];
  const ROUTES = { A: ['phone', 'bs', 'ran', 'mcore', 'transport', 'ipgw', 'ix', 'srv'], B: ['dev', 'wifi', 'ont', 'lan', 'isp', 'ix', 'srv'] };
  const INFO = {
    phone: ['Creates the request, encrypts it with TLS and sends it by radio.', 'Everything, before encryption.', 'How the operator routes traffic.', 'SIM-based authentication, device updates, TLS certificate checks.'],
    bs: ['Radio site (eNodeB/gNodeB) that the phone connects to.', 'Which SIM/device is attached, signal and location area, encrypted radio frames.', 'HTTPS content.', '3GPP radio encryption and integrity protection, physical site security.'],
    ran: ['Aggregates many base stations and carries their traffic toward the core.', 'Encapsulated user traffic and control signalling.', 'HTTPS content.', 'Network segmentation, IPsec on backhaul where deployed.'],
    mcore: ['Authenticates the subscriber against SIM credentials, assigns an IP address, applies policy and lawful-interception interfaces.', 'Subscriber identity, location area, session records, traffic metadata.', 'HTTPS content.', 'Subscriber authentication, privileged-access control, audit logging, lawful-interception safeguards.'],
    transport: ['Long-distance fibre carrying operator traffic between cities.', 'Aggregated, often encrypted operator traffic.', 'Which user sent what; HTTPS content.', 'Route diversity, physical protection, encryption on inter-site links where deployed.'],
    ipgw: ['The operator\'s IP edge: routes traffic to the internet, often via NAT.', 'Source and destination IP addresses, ports, timing, volume.', 'HTTPS content.', 'BGP filtering, RPKI where deployed, DDoS protection.'],
    dev: ['Creates the request and encrypts it with TLS.', 'Everything, before encryption.', 'Which path the ISP uses.', 'Updates, endpoint protection, TLS.'],
    wifi: ['Connects home devices and forwards traffic to the access box.', 'Device addresses, destinations, plain DNS lookups.', 'HTTPS content.', 'WPA2/WPA3, admin password, firmware updates.'],
    ont: ['Optical network terminal or other access equipment at the home.', 'All home traffic passing through, as packets.', 'HTTPS content.', 'ISP-managed firmware, trusted-source equipment rules.'],
    lan: ['Local fibre, cable or wireless access that serves a neighbourhood.', 'Subscriber line and aggregated traffic.', 'HTTPS content.', 'Access control, physical protection.'],
    isp: ['Authenticates the connection, assigns an IP address, routes traffic and keeps required records.', 'Subscriber identity, IP assignment logs, traffic metadata.', 'HTTPS content.', 'Privileged-access control, logging, incident reporting, lawful-interception safeguards.'],
    ix: ['Where Indian networks exchange traffic directly (IXP) or buy transit to the rest of the world.', 'IP addresses, timing and volume between networks.', 'HTTPS content, or which subscriber sent a packet.', 'BGP filtering, RPKI route-origin validation, DDoS controls.'],
    srv: ['Ends the TLS connection and serves the page, in India or overseas, or from a nearby CDN cache.', 'Request content and the visitor\'s IP address.', 'Which operator path was used.', 'TLS certificates, server security, data protection duties.'],
  };
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));
  let pathMode = 'A';
  const pathPanel = $('#path-panel');
  const diagram = new NetDiagram($('#path-diagram'), {
    width: 980, height: 420, nodes: NODES, links: LINKS, ariaLabel: 'Mobile and broadband paths to a website',
    zones: [{ x: 10, y: 40, w: 680, h: 130, label: 'Path A · Mobile' }, { x: 10, y: 270, w: 620, h: 130, label: 'Path B · Home broadband' }],
    onNodeClick: (id) => showPathNode(id),
  });
  function detail(id) {
    const n = byId[id], i = INFO[id];
    return [h('h3', null, n.icon + ' ' + n.label), h('div', { class: 'who' }, 'Operated by: ' + n.org),
      h('dl', { class: 'fields' }, h('dt', null, 'What it does'), h('dd', null, i[0]), h('dt', null, 'What it can see'), h('dd', null, i[1]),
        h('dt', null, 'What it cannot read'), h('dd', null, i[2]), h('dt', null, 'Controls'), h('dd', null, i[3]))];
  }
  function showPathNode(id) { diagram.select(id); fill(pathPanel, ...detail(id)); narrate(INFO[id][0], byId[id].label); }
  function pathIntro() { fill(pathPanel, h('h3', null, 'Pick a component'), h('p', { class: 'muted' }, 'Click any node, or press Send request to follow the path you chose. Both paths meet at an exchange or upstream transit provider.')); }
  pathIntro();
  const pStatus = h('span', { class: 'muted', 'aria-live': 'polite' }, 'Ready.');
  const player = new PathPlayer(diagram, {
    onHop(idx, id, p) { fill(pathPanel, h('p', { class: 'muted' }, (p.resp ? 'Response' : 'Request') + ` · hop ${idx + 1} of ${p.route.length}`), ...detail(id)); diagram.select(id); narrate(INFO[id][0], `Hop ${idx + 1}: ${byId[id].label}`); },
    onState(st) { pStatus.textContent = { idle: 'Ready.', playing: 'Playing…', paused: 'Paused.', done: 'Finished.' }[st]; },
  });
  add($('#path-controls'), h('span', { class: 'muted' }, 'Path:'),
    seg([{ value: 'A', label: 'A · Mobile (4G/5G)' }, { value: 'B', label: 'B · Home broadband' }], 'A', (v) => { pathMode = v; player.reset(); pathIntro(); diagram.showRoute(ROUTES[v]); narrate(v === 'A' ? 'Path A: a phone on 4G or 5G.' : 'Path B: a home fibre or cable connection.', 'Path'); }, 'Connection path'));
  add($('#path-player'), h('div', { class: 'btnrow' },
    btn('▶ Send request', () => player.play(ROUTES[pathMode], false), 'btn primary'),
    btn('↩ Return response', () => player.play(ROUTES[pathMode].slice().reverse(), true)),
    btn('⏸ Pause', () => player.pause()), btn('⏵ Resume', () => player.resume()),
    btn('⏭ Step', () => { if (!player.route.length) { player.load(ROUTES[pathMode], false); player.state = 'paused'; player.emit(); } else player.step(); }),
    btn('⟲ Reset', () => { player.reset(); pathIntro(); })), pStatus);

  /* ================= 2. Schematic map ================= */
  const CITIES = {
    chd: ['Chandigarh', 290, 120], del: ['Delhi NCR', 300, 175], jai: ['Jaipur', 235, 230], lko: ['Lucknow', 375, 215], pat: ['Patna', 455, 255],
    guw: ['Guwahati', 565, 225], kol: ['Kolkata', 490, 330], ahd: ['Ahmedabad', 160, 315], bhu: ['Bhubaneswar', 450, 385], mum: ['Mumbai', 165, 400],
    pun: ['Pune', 200, 430], hyd: ['Hyderabad', 295, 450], blr: ['Bengaluru', 255, 545], che: ['Chennai', 330, 540], koc: ['Kochi', 225, 610],
  };
  const IXP = ['del', 'mum', 'che', 'kol', 'blr', 'hyd', 'ahd', 'guw', 'lko'];
  const DC = ['mum', 'che', 'hyd', 'del', 'pun', 'blr'];
  const LANDING = ['mum', 'che', 'koc'];
  const BACKBONE = [['chd', 'del'], ['del', 'jai'], ['del', 'lko'], ['lko', 'pat'], ['pat', 'kol'], ['kol', 'guw'], ['jai', 'ahd'], ['ahd', 'mum'], ['mum', 'pun'], ['pun', 'hyd'], ['hyd', 'che'], ['hyd', 'blr'], ['blr', 'che'], ['blr', 'koc'], ['kol', 'bhu'], ['bhu', 'che'], ['del', 'hyd'], ['mum', 'blr'], ['lko', 'kol']];
  const LAYERS = [
    { id: 'ops', label: 'Operators (several licensed operators in every city)', on: false },
    { id: 'mob', label: 'Mobile access', on: false },
    { id: 'fib', label: 'Fibre backbone (illustrative mesh)', on: true },
    { id: 'ixp', label: 'Internet exchange points', on: true },
    { id: 'dc', label: 'Data centres and cloud regions', on: false },
    { id: 'cab', label: 'Submarine cable landing regions', on: true },
    { id: 'int', label: 'International terrestrial links (schematic)', on: false },
    { id: 'gov', label: 'Government and critical-sector networks', on: false },
  ];
  const mapSvg = s('svg', { class: 'net', viewBox: '0 0 640 680', role: 'img', 'aria-label': 'Schematic of Indian network layers by city. Not a map of boundaries.' },
    s('defs', null, s('filter', { id: 'mglow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, s('feGaussianBlur', { stdDeviation: 2.4, result: 'b' }), s('feMerge', null, s('feMergeNode', { in: 'b' }), s('feMergeNode', { in: 'SourceGraphic' })))),
    s('text', { x: 20, y: 30, fill: '#a9b4d4', 'font-size': 12 }, 'Schematic · approximate city positions · not to scale · no boundaries shown'),
    s('text', { x: 40, y: 600, fill: '#3fd0ff', 'font-size': 12, opacity: .7 }, 'Arabian Sea'),
    s('text', { x: 470, y: 560, fill: '#3fd0ff', 'font-size': 12, opacity: .7 }, 'Bay of Bengal'));
  const layerG = {};
  for (const l of LAYERS) { layerG[l.id] = s('g', { class: 'lyr' + (l.on ? '' : ' off') }); }
  const C = (k) => CITIES[k];
  for (const [a, b] of BACKBONE) layerG.fib.appendChild(s('line', { x1: C(a)[1], y1: C(a)[2], x2: C(b)[1], y2: C(b)[2], stroke: '#e3b54d', 'stroke-opacity': .55, 'stroke-width': 2 }));
  for (const k of Object.keys(CITIES)) {
    const [, x, y] = C(k);
    layerG.ops.appendChild(s('circle', { cx: x, cy: y, r: 18, fill: 'none', stroke: '#a78bfa', 'stroke-opacity': .6, 'stroke-dasharray': '3 3' }));
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + k.length; layerG.mob.appendChild(s('circle', { cx: x + Math.cos(a) * 26, cy: y + Math.sin(a) * 22, r: 2.4, fill: '#3fd0ff', opacity: .8 })); }
  }
  for (const k of IXP) { const [, x, y] = C(k); layerG.ixp.appendChild(s('rect', { x: x - 7, y: y - 26, width: 14, height: 14, rx: 3, fill: '#45d99a' })); }
  for (const k of DC) { const [, x, y] = C(k); layerG.dc.appendChild(s('rect', { x: x + 9, y: y - 24, width: 14, height: 14, rx: 2, fill: '#3fd0ff' })); }
  for (const k of LANDING) {
    const [, x, y] = C(k);
    const dx = k === 'che' ? 90 : -90, dy = k === 'koc' ? 40 : 30;
    layerG.cab.appendChild(s('path', { d: `M${x},${y} q${dx / 2},${dy} ${dx},${dy + 10}`, fill: 'none', stroke: '#ff5ca8', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }));
    layerG.cab.appendChild(s('circle', { cx: x, cy: y, r: 6, fill: '#ff5ca8' }));
  }
  [['guw', 70, -20], ['kol', 80, -60], ['chd', -40, -60], ['ahd', -70, -40]].forEach(([k, dx, dy]) => {
    const [, x, y] = C(k);
    layerG.int.appendChild(s('path', { d: `M${x},${y} l${dx},${dy}`, stroke: '#ffb547', 'stroke-width': 2, 'stroke-dasharray': '4 4', fill: 'none' }));
  });
  layerG.int.appendChild(s('text', { x: 430, y: 150, fill: '#ffb547', 'font-size': 11 }, 'Cross-border links exist; routes are schematic'));
  layerG.gov.appendChild(s('rect', { x: 360, y: 600, width: 260, height: 54, rx: 10, fill: 'rgba(167,139,250,.12)', stroke: '#a78bfa' }));
  layerG.gov.appendChild(s('text', { x: 372, y: 622, fill: '#d9ccff', 'font-size': 11.5 }, 'Dedicated networks such as NKN connect'));
  layerG.gov.appendChild(s('text', { x: 372, y: 640, fill: '#d9ccff', 'font-size': 11.5 }, 'institutions nationwide. Locations not shown.'));
  Object.values(layerG).forEach((g) => mapSvg.appendChild(g));
  const traceG = s('g'); mapSvg.appendChild(traceG);
  const cityG = s('g'); mapSvg.appendChild(cityG);
  const cityEls = {};
  for (const [k, [name, x, y]] of Object.entries(CITIES)) {
    const g = s('g', { class: 'map-city', transform: `translate(${x},${y})`, tabindex: 0, role: 'button', 'aria-label': 'Trace from ' + name },
      s('circle', { r: 6 }), s('text', { x: 10, y: 4 }, name));
    g.addEventListener('click', () => trace(k));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trace(k); } });
    cityEls[k] = g; cityG.appendChild(g);
  }
  add($('#map-svg'), mapSvg, h('div', { class: 'legend' },
    h('span', { class: 'l-fibre' }, 'Backbone'), h('span', { style: { color: '#45d99a' } }, '■ IXP'), h('span', { style: { color: '#3fd0ff' } }, '■ Data centre / cloud'),
    h('span', { style: { color: '#ff5ca8' } }, '● Cable landing'), h('span', { style: { color: '#ffb547' } }, '⇢ Cross-border (schematic)')));
  for (const l of LAYERS) $('#map-layers').appendChild(toggle(l.label, l.on, (v) => layerG[l.id].classList.toggle('off', !v)));
  add($('#map-claims'), ...claims(['nixi', 'cables', 'cloud-regions', 'nkn']));

  const dist = (a, b) => Math.hypot(C(a)[1] - C(b)[1], C(a)[2] - C(b)[2]);
  const nearest = (from, list) => list.slice().sort((a, b) => dist(from, a) - dist(from, b))[0];
  const traceOut = h('div', { 'aria-live': 'polite' });
  const citySel = h('select', { id: 'city', 'aria-label': 'Choose a city' }, Object.entries(CITIES).map(([k, v]) => h('option', { value: k }, v[0])));
  let traceDest = 'dom';
  citySel.addEventListener('change', () => trace(citySel.value));
  const destSeg = seg([{ value: 'dom', label: 'Domestic site' }, { value: 'os', label: 'Overseas site' }], 'dom', (v) => { traceDest = v; trace(citySel.value); }, 'Destination');
  add($('#map-trace'), h('label', { for: 'city', class: 'muted' }, 'Start city '), citySel, ' ', destSeg, traceOut);
  function poly(keys) { return keys.map((k) => C(k)[1] + ',' + C(k)[2]).join(' '); }
  function trace(k) {
    citySel.value = k;
    Object.values(cityEls).forEach((g) => g.classList.remove('sel')); cityEls[k].classList.add('sel');
    clear(traceG);
    const ix = nearest(k, IXP), dc = nearest(ix, DC);
    let hops, text;
    if (traceDest === 'dom') {
      hops = [k, ix, dc].filter((x, i, a) => a.indexOf(x) === i);
      traceG.appendChild(s('polyline', { class: 'trace-line', points: poly(hops) }));
      text = [h('p', null, `${C(k)[0]} → exchange in ${C(ix)[0]} → data centre in ${C(dc)[0]}.`), h('p', { class: 'muted' }, 'Traffic can stay inside India when both networks peer at a domestic exchange and the site is hosted in India.')];
    } else {
      const land = nearest(k, LANDING);
      hops = [k, ix, land].filter((x, i, a) => a.indexOf(x) === i);
      traceG.appendChild(s('polyline', { class: 'trace-line os', points: poly(hops) }));
      const [, lx, ly] = C(land);
      const dx = land === 'che' ? 110 : -110;
      traceG.appendChild(s('line', { class: 'trace-line os', x1: lx, y1: ly, x2: lx + dx, y2: ly + 50, 'stroke-dasharray': '8 6' }));
      traceG.appendChild(s('text', { x: lx + dx + (dx > 0 ? -60 : 0), y: ly + 70, fill: '#ff5ca8', 'font-size': 12, 'font-weight': 700 }, '⚑ Leaves India here'));
      text = [h('p', null, `${C(k)[0]} → exchange or transit in ${C(ix)[0]} → cable landing in ${C(land)[0]} → submarine cable → overseas server.`),
        h('p', null, h('strong', null, 'Border crossing: '), `traffic leaves Indian jurisdiction at the ${C(land)[0]} landing region.`)];
    }
    fill(traceOut, ...text, h('p', { class: 'muted', style: { fontSize: '.88em' } }, 'Illustrative. Real routes change dynamically with peering, caching and routing policy. ', chip('illustrative')));
    narrate(text[0].textContent, 'Route trace');
  }
  trace('del');

  /* ================= 3. Who controls what ================= */
  const WHO = [
    { t: 'Telecom service providers', i: '📶', does: ['Run mobile and broadband access and core networks', 'Verify subscribers and authenticate SIMs and connections', 'Provide lawful-interception facilities when legally ordered', 'Report security incidents within set deadlines'], law: ['telecom-act', 'cyber-rules', 'certin'], cannot: ['Read correctly encrypted HTTPS content', 'Intercept without a lawful order', 'Connect equipment that is not from a trusted source'] },
    { t: 'Backbone operators', i: '🧵', does: ['Carry long-distance and international traffic', 'Operate cable landing stations and inter-city fibre'], law: ['telecom-act', 'trusted-source'], cannot: ['Identify individual subscribers from transit traffic alone', 'Decide on interception themselves'] },
    { t: 'Data centre and cloud operators', i: '🏢', does: ['Host servers and data for organisations', 'Keep logs and report incidents under CERT-In directions', 'Protect personal data they process for customers'], law: ['certin', 'dpdp'], cannot: ['Use customer data beyond contract and law', 'Control how traffic reaches them across other networks'] },
    { t: 'Internet exchange operators', i: '🔀', does: ['Provide neutral points where networks exchange traffic', 'Help keep domestic traffic inside India'], law: ['nixi'], cannot: ['Decide how members route traffic', 'Read HTTPS content'] },
    { t: 'Website and app providers', i: '☁️', does: ['Secure their services with TLS and strong authentication', 'Meet data-protection duties for users\' personal data', 'Report specified incidents to CERT-In'], law: ['dpdp', 'certin'], cannot: ['Choose the network path a user\'s traffic takes'] },
    { t: 'Department of Telecommunications', i: '🏛️', does: ['Grant telecom authorisations and licences', 'Assign spectrum', 'Set security conditions and telecom cyber security rules'], law: ['telecom-act', 'cyber-rules', 'starlink-gmpcs'], cannot: ['Set tariffs (TRAI regulates them)', 'Bypass the interception rules\' authorisation and review steps'] },
    { t: 'TRAI', i: '⚖️', does: ['Regulate tariffs and quality of service', 'Make recommendations, for example on satellite spectrum pricing'], law: ['trai-role', 'trai-satcom'], cannot: ['Issue licences or assign spectrum', 'Run cyber incident response'] },
    { t: 'CERT-In', i: '🛡️', does: ['Lead national cyber incident response', 'Issue directions and advisories under the IT Act', 'Call for information and logs during incidents'], law: ['certin'], cannot: ['Issue telecom licences', 'Order interception of communications'] },
    { t: 'Other competent authorities', i: '📜', does: ['Home Secretary (Union or State): authorise lawful interception under the 2024 rules', 'National Cyber Security Coordinator: designate trusted sources', 'IN-SPACe: authorise space activities', 'Security agencies: clear new satellite operators'], law: ['intercept-rules', 'trusted-source', 'inspace', 'satcom-pending'], cannot: ['Act outside the powers their own law grants'] },
  ];
  const whoCards = $('#who-cards');
  WHO.forEach((w, i) => {
    const b = h('button', { class: 'card clickable', type: 'button', 'aria-pressed': 'false' }, h('h3', null, w.i + ' ' + w.t), h('p', { class: 'muted', style: { margin: 0, fontSize: '.9em' } }, w.does[0]));
    b.addEventListener('click', () => showWho(i));
    whoCards.appendChild(b);
  });
  function showWho(i) {
    const w = WHO[i];
    [...whoCards.children].forEach((c, j) => { c.classList.toggle('selected', i === j); c.setAttribute('aria-pressed', String(i === j)); });
    fill($('#who-detail'), h('h3', null, w.i + ' ' + w.t),
      h('div', { class: 'grid g2' },
        h('div', null, h('h4', null, 'Responsibilities'), h('ul', { class: 'tight' }, w.does.map((d) => h('li', null, d)))),
        h('div', null, h('h4', null, 'What it cannot do'), h('ul', { class: 'tight' }, w.cannot.map((d) => h('li', null, d))))),
      h('h4', null, 'Legal source'), ...claims(w.law));
    narrate(w.does.join('. ') + '.', w.t);
  }
  showWho(0);

  /* ================= 4. Security controls ================= */
  const CTL = [
    { k: 'A', t: 'Subscriber identity and authentication', tag: 'mandatory', threat: 'Impersonation, SIM fraud, anonymous misuse.', how: 'Subscriber verification at sign-up. In mobile networks, cryptographic authentication with keys stored on the SIM.', protects: 'Network access and accountability of connections.', not: 'A stolen, unlocked phone, or a user tricked into sharing an OTP.', who: 'Telecom service providers', c: ['mobile-auth', 'telecom-act'] },
    { k: 'B', t: 'Encryption in transit (TLS, IPsec)', tag: 'recommended', threat: 'Eavesdropping and tampering along the path.', how: 'TLS between app and server; radio encryption in 4G/5G; IPsec on some operator links.', protects: 'Content of communications.', not: 'Metadata such as addresses, timing, volume and often site names; compromised devices.', who: 'Website owners, app developers, operators', c: ['tls-protects', 'tls-limits'] },
    { k: 'C', t: 'Segmentation and access control', tag: 'recommended', threat: 'An intruder moving from one system to all others.', how: 'Separate management, signalling and user networks; firewalls; least-privilege access.', protects: 'Limits the blast radius of a breach.', not: 'Misuse by someone already authorised for that segment.', who: 'Operators, data-centre operators', c: ['cyber-rules'] },
    { k: 'D', t: 'Lawful interception under legal authorisation', tag: 'mandatory', threat: 'Serious crime and national-security threats; also misuse of interception itself.', how: 'Interception only on an order from a competent authority under the 2024 rules, with review and record destruction.', protects: 'Investigations under law, with procedural safeguards.', not: 'Encrypted HTTPS content; it also creates a sensitive capability that must itself be guarded.', who: 'Competent authorities and operators', c: ['intercept-rules'] },
    { k: 'E', t: 'Incident reporting and response', tag: 'mandatory', threat: 'Slow or hidden response to attacks.', how: 'Specified incidents reported within six hours to CERT-In and, for telecom entities, to the government.', protects: 'Speed of national coordination.', not: 'The incident itself; reporting is not prevention.', who: 'Operators, service providers, CERT-In', c: ['certin', 'cyber-rules'] },
    { k: 'F', t: 'Routing security (RPKI, route-origin validation)', tag: 'some', threat: 'False route announcements that misdirect traffic.', how: 'Networks sign which AS may announce which addresses; others reject invalid routes.', protects: 'Against many accidental and malicious route hijacks.', not: 'All path manipulation, such as a valid origin with a forged path; it only works when widely deployed.', who: 'Every network operator', c: ['rpki'] },
    { k: 'G', t: 'Protection of management systems and privileged accounts', tag: 'recommended', threat: 'Phished or misused admin credentials.', how: 'Hardware security keys, privileged-access management, just-in-time access, session recording.', protects: 'Network configuration and subscriber databases.', not: 'A fully colluding group of insiders without independent oversight.', who: 'Operators', c: ['cyber-rules'] },
    { k: 'H', t: 'Supply-chain and equipment assurance', tag: 'mandatory', threat: 'Compromised hardware or software in the network.', how: 'Licensees connect only trusted products from trusted sources designated by the NCSC.', protects: 'Reduces the risk of untrusted vendors in critical networks.', not: 'Vulnerabilities in trusted products, or compromise of a trusted vendor\'s update channel.', who: 'Operators, NCSC (designated authority)', c: ['trusted-source'] },
    { k: 'I', t: 'Data governance, retention and access', tag: 'mandatory', threat: 'Data misuse, over-retention, logs unavailable after an incident.', how: 'Logs kept in India for 180 days under CERT-In directions; data-protection duties under the DPDP Act.', protects: 'Investigations and users\' personal data.', not: 'Retained data is itself a target and must be protected and access-controlled.', who: 'Operators and service providers', c: ['certin', 'dpdp'] },
    { k: 'J', t: 'Redundancy and disaster recovery', tag: 'recommended', threat: 'Fibre cuts, floods, power loss, large attacks.', how: 'Diverse fibre routes, multiple exchanges and data centres, backup power, tested recovery plans.', protects: 'Availability during failures.', not: 'Shared-fate failures, such as one software bug affecting every site.', who: 'Operators, data-centre and cloud operators', c: [] },
  ];
  let ctlFilter = 'all';
  const filterSeg = seg([{ value: 'all', label: 'All' }, { value: 'mandatory', label: 'Mandatory' }, { value: 'recommended', label: 'Recommended practice' }, { value: 'some', label: 'Deployed by some operators' }], 'all', (v) => { ctlFilter = v; drawCtl(); }, 'Filter controls');
  add($('#ctl-filter'), filterSeg);
  function drawCtl() {
    const box = clear($('#ctl-cards'));
    for (const c of CTL.filter((x) => ctlFilter === 'all' || x.tag === ctlFilter)) {
      box.appendChild(h('article', { class: 'card ctl-card' },
        h('h3', null, h('span', { class: 'letter' }, c.k), c.t), chip(c.tag),
        h('dl', { class: 'fields' }, h('dt', null, 'Threat addressed'), h('dd', null, c.threat), h('dt', null, 'How it works'), h('dd', null, c.how)),
        h('details', null, h('summary', null, 'What it protects, what it does not, who is responsible'),
          h('dl', { class: 'fields' }, h('dt', null, 'Protects'), h('dd', null, c.protects), h('dt', null, 'Does NOT protect'), h('dd', null, c.not), h('dt', null, 'Responsible'), h('dd', null, c.who)),
          c.c.length ? h('div', { style: { marginTop: '6px', fontSize: '.9em' } }, h('strong', null, 'Source'), claims(c.c)) : h('p', { class: 'muted', style: { marginTop: '6px', fontSize: '.9em' } }, 'General industry practice; no single legal source.'))));
    }
  }
  drawCtl();

  /* ================= 5. Simulations ================= */
  const SIMS = [
    { t: 'Admin credential phishing', i: '🎣', st: ['Hardware security keys make a stolen password useless, and staff are trained on phishing.', 'A sign-in attempt from an unknown device without the key raises an alert.', 'The security team locks the account, revokes sessions and reports to CERT-In within six hours.', 'Credentials are re-issued, logs are reviewed for any changes, and lessons feed into training.'] },
    { t: 'False route announcement', i: '🔀', st: ['The operator publishes RPKI records for its address blocks.', 'Route monitoring spots a new origin announcing the operator\'s prefix.', 'Peers that validate routes reject the invalid announcement; the operator contacts the other network.', 'Normal routing returns. The incident is documented and filters are tightened.'] },
    { t: 'Insider reading subscriber records', i: '🕵️', st: ['Least-privilege access and purpose-bound queries limit who can see records.', 'Tamper-evident audit logs flag unusual bulk lookups.', 'Access is suspended, and an investigation follows under HR and legal processes.', 'Affected users are handled under data-protection duties, and access rules are reviewed.'] },
    { t: 'Fibre cut', i: '✂️', st: ['Diverse fibre routes avoid a single path between cities.', 'Network monitoring sees the link go down within seconds.', 'Traffic shifts automatically to backup routes; field teams are dispatched.', 'The fibre is spliced and capacity is rebalanced.'] },
    { t: 'Botnet flood (DDoS)', i: '🌊', st: ['Upstream scrubbing capacity and rate limits are in place before any attack.', 'Traffic volume to the target spikes far above normal.', 'Traffic is diverted to scrubbing; attacking sources are filtered at the edge.', 'Service recovers. Infected devices are notified through ISP and CERT-In channels.'] },
    { t: 'A lawful, authorised data request', i: '📜', st: ['Only orders from a competent authority, in the prescribed format, are accepted.', 'The operator\'s nodal officer verifies the order\'s authority and scope.', 'Only the data named in the order is provided, through a controlled channel, and logged.', 'Records are handled and destroyed as the rules require, and the review committee examines orders.'] },
    { t: 'Honey-trap espionage', i: '🪤', st: ['People with sensitive access use managed phones with approved apps, are trained to spot fake profiles, and have a safe channel to report suspicious contact.', 'A colleague reports, or counter-intelligence notices, repeated contact between a fictional engineer and an unknown foreign account. The content is end-to-end encrypted, so no network can read it.', 'Under a specific legal order, investigators request metadata and lawful interception from the operator, through Indian gateways for any network, satellite included. The device is examined forensically.', 'Access is suspended and the leak is assessed. Training is updated with the fake profile’s tactics, and similar profiles are reported to the platform.'] },
    { t: 'Fake website on a valid HTTPS connection', i: '🎭', st: ['Users are taught to check the domain, and browsers show warnings for known phishing sites.', 'Certificate Transparency logs and brand monitoring reveal the look-alike domain.', 'The domain is reported for takedown and blocklisted; CERT-In issues an advisory if needed.', 'Victims reset credentials. HTTPS only proves you reached that domain, not that the domain is honest.'] },
  ];
  const STAGES = ['Prevention', 'Detection', 'Response', 'Recovery'];
  let sim = 0, stage = 0;
  const simCards = $('#sim-cards');
  SIMS.forEach((x, i) => {
    const b = h('button', { class: 'card clickable', type: 'button', 'aria-pressed': 'false' }, h('h3', { style: { margin: 0, fontSize: '1rem' } }, x.i + ' ' + x.t));
    b.addEventListener('click', () => { sim = i; stage = 0; drawSim(); });
    simCards.appendChild(b);
  });
  function drawSim() {
    const x = SIMS[sim];
    [...simCards.children].forEach((c, j) => { c.classList.toggle('selected', j === sim); c.setAttribute('aria-pressed', String(j === sim)); });
    const box = clear($('#sim-stage'));
    add(box, h('h3', null, x.i + ' ' + x.t, ' ', chip('illustrative')),
      h('div', { class: 'stages', role: 'group', 'aria-label': 'Stages' }, STAGES.map((n, j) => {
        const b = h('button', { class: 'btn', type: 'button', 'aria-current': j === stage ? 'step' : null }, `${j + 1}. ${n}`);
        b.addEventListener('click', () => { stage = j; drawSim(); });
        return b;
      })),
      h('p', { style: { fontSize: '1.05em' } }, h('strong', null, STAGES[stage] + ': '), x.st[stage]),
      h('div', { class: 'btnrow' },
        btn('← Back', () => { if (stage > 0) { stage--; drawSim(); } }),
        btn(stage < 3 ? 'Next stage →' : 'Restart', () => { stage = stage < 3 ? stage + 1 : 0; drawSim(); }, 'btn primary')));
    narrate(x.st[stage], `${x.t} — ${STAGES[stage]}`);
  }
  drawSim();

  /* ================= 6. Hosting ================= */
  const HOST = {
    in: { l: 'Hosted in India', lat: '10–40 ms', jur: 'Indian law applies to the host and the data.', avail: 'Depends on the provider\'s redundancy. Domestic does not automatically mean resilient.', access: 'Indian authorities can request data under Indian legal process.', note: 'Domestic hosting is not automatically secure. It still needs patching, access control and backups.' },
    os: { l: 'Hosted overseas', lat: '120–300 ms', jur: 'The host country\'s law applies, as well as Indian law for services offered in India.', avail: 'Depends on international cables and the overseas provider.', access: 'Foreign authorities may request data under their law. Indian requests may need international cooperation.', note: 'Overseas hosting is not automatically a breach. It is lawful in most cases, but brings jurisdiction trade-offs.' },
    cdn: { l: 'Served from a CDN cache', lat: '5–30 ms (cached content)', jur: 'Mixed: the cache may be in India while the origin is elsewhere.', avail: 'High for cached content, absorbs traffic spikes and many DDoS attacks.', access: 'The CDN provider can see the traffic it terminates; check where its TLS keys and logs are kept.', note: 'A CDN terminates TLS, so it is another party that can see content.' },
    cloud: { l: 'Cloud platform region', lat: '10–40 ms (India region) or more', jur: 'Depends on the region chosen and the provider\'s home jurisdiction.', avail: 'High if spread across several availability zones.', access: 'Both the region\'s law and the provider\'s home law may apply.', note: 'Choosing an India region keeps data local but does not remove the provider\'s other legal obligations.' },
  };
  function drawHost(k) {
    const x = HOST[k];
    fill($('#host-out'), 
      h('div', { class: 'card' }, h('h3', null, 'Latency ', chip('simulated')), h('p', null, x.lat), h('h3', null, 'Availability'), h('p', null, x.avail)),
      h('div', { class: 'card' }, h('h3', null, 'Jurisdiction'), h('p', null, x.jur), h('h3', null, 'Data access'), h('p', null, x.access)),
      h('div', { class: 'notice', style: { gridColumn: '1 / -1' } }, x.note));
    narrate(x.note, x.l);
  }
  add($('#host-seg'), seg(Object.entries(HOST).map(([v, x]) => ({ value: v, label: x.l })), 'in', drawHost, 'Hosting choice'));
  drawHost('in');

  /* ================= 7. Resilience lab ================= */
  const SL = [
    { id: 'A', l: 'Authentication strength', v: 60, unit: '%' },
    { id: 'E', l: 'Encryption coverage', v: 70, unit: '%' },
    { id: 'R', l: 'Redundant routes', v: 50, unit: '%' },
    { id: 'M', l: 'Monitoring coverage', v: 50, unit: '%' },
    { id: 'P', l: 'Privileged-access control', v: 40, unit: '%' },
    { id: 'T', l: 'Incident response time', v: 12, unit: ' h', min: 1, max: 72 },
  ];
  const vals = {};
  const sliderBox = $('#lab-sliders');
  for (const x of SL) {
    vals[x.id] = x.v;
    const out = h('output', { for: 'sl-' + x.id }, x.v + x.unit);
    const input = h('input', { type: 'range', id: 'sl-' + x.id, min: x.min || 0, max: x.max || 100, value: x.v, 'aria-valuetext': x.v + x.unit });
    input.addEventListener('input', () => { vals[x.id] = +input.value; out.textContent = input.value + x.unit; input.setAttribute('aria-valuetext', input.value + x.unit); drawLab(); });
    x.input = input; x.out = out;
    sliderBox.appendChild(h('div', { class: 'slider-row' }, h('label', { for: 'sl-' + x.id }, h('span', null, `${x.l} (${x.id})`), out), input));
  }
  function drawLab() {
    const n = (k) => vals[k] / 100;
    const I = 1 - (vals.T - 1) / 71;
    const prot = 0.20 * n('A') + 0.15 * n('E') + 0.10 * n('R') + 0.15 * n('M') + 0.20 * n('P') + 0.20 * I;
    const risk = Math.round(100 * (1 - prot));
    const avail = (99 + 0.9 * n('R') + 0.08 * I).toFixed(2);
    const level = risk < 30 ? 'Low' : risk < 60 ? 'Medium' : 'High';
    const weakest = SL.filter((x) => x.id !== 'T').sort((a, b) => vals[a.id] - vals[b.id])[0];
    fill($('#lab-out'), 
      h('h3', null, 'Simulated result'),
      h('div', { class: 'meter' }, h('span', null, 'Risk score'), h('div', { class: 'bar' }, h('i', { class: 'risk', style: { width: risk + '%' } })), h('strong', null, risk)),
      h('p', null, 'Risk level: ', h('span', { class: 'rate ' + level }, level)),
      h('div', { class: 'meter' }, h('span', null, 'Availability'), h('div', { class: 'bar' }, h('i', { style: { width: ((avail - 99) / 0.98 * 100) + '%' } })), h('strong', null, avail + '%')),
      vals[weakest.id] < 35 ? h('div', { class: 'notice warn' }, `Weakest control: ${weakest.l} (${vals[weakest.id]}%). Attackers target the weakest layer, so one weak control can undo strong ones.`) : null,
      h('h4', null, 'Formula'),
      h('div', { class: 'formula' }, `I  = 1 − (T − 1) / 71          (faster response → closer to 1)
P* = 0.20·A + 0.15·E + 0.10·R + 0.15·M + 0.20·P + 0.20·I   (each 0–1)
Risk = 100 × (1 − P*)
Availability % = 99 + 0.9·R + 0.08·I`),
      claim('resilience-model', { tag: 'p' }));
  }
  drawLab();

  /* ================= 8. Timeline ================= */
  const TL = [
    ['15 Jun 2021', 'Trusted-source rules for telecom equipment take effect', 'trusted-source'],
    ['28 Apr 2022', 'CERT-In directions: 6-hour incident reporting, 180-day logs', 'certin'],
    ['Aug 2023', 'Digital Personal Data Protection Act enacted', 'dpdp'],
    ['26 Jun 2024', 'First sections of the Telecommunications Act, 2023 in force', 'telecom-act'],
    ['21 Nov 2024', 'Telecom Cyber Security Rules notified', 'cyber-rules'],
    ['Dec 2024', 'Lawful interception rules under the new Act notified', 'intercept-rules'],
    ['May 2025', 'TRAI recommends satellite spectrum pricing', 'trai-satcom'],
    ['Jun 2025', 'DoT grants Starlink a GMPCS authorisation', 'starlink-gmpcs'],
    ['8 Jul 2025', 'IN-SPACe authorises Starlink\'s Gen1 constellation', 'starlink-inspace'],
    ['Oct 2026', 'Satellite operators await final security clearance and spectrum', 'satcom-pending'],
    ['Oct 2026', 'Starlink says 20 India gateways are built', 'starlink-gateways'],
  ];
  for (const [when, what, c] of TL) $('#timeline').appendChild(h('li', null, h('div', { class: 'when' }, when), h('div', null, h('strong', null, what)), claim(c, { tag: 'div' })));

  /* ================= quiz etc. ================= */
  K.quiz($('#quiz'), [
    { q: 'Can an Indian mobile operator read the content of a correctly configured HTTPS session?', options: ['Yes, always', 'Only at the base station', 'No, but it can see metadata', 'Only for overseas sites'], answer: 2, why: 'TLS hides content; addresses, timing and volume remain visible.' },
    { q: 'Who designates trusted sources for telecom equipment?', options: ['TRAI', 'The National Cyber Security Coordinator', 'Each operator', 'CERT-In'], answer: 1, why: 'Licence conditions since June 2021 name the NCSC as the designated authority.' },
    { q: 'Within how many hours must specified incidents be reported to CERT-In?', options: ['1', '6', '24', '72'], answer: 1, why: 'The April 2022 CERT-In directions set a 6-hour window.' },
    { q: 'Is a website hosted overseas automatically a security breach?', options: ['Yes', 'No: it changes jurisdiction and latency, not legality by default', 'Only for banks', 'Only without HTTPS'], answer: 1, why: 'Hosting location changes trade-offs; it is not a breach in itself.' },
    { q: 'What does RPKI route-origin validation protect against?', options: ['Phishing emails', 'Routes announced by an unauthorised origin', 'Fibre cuts', 'Insider access'], answer: 1, why: 'It lets networks reject routes from origins not authorised for an address block.' },
    { q: 'Which body issues telecom licences and assigns spectrum?', options: ['TRAI', 'DoT', 'CERT-In', 'NIXI'], answer: 1, why: 'TRAI recommends; DoT decides and authorises.' },
  ]);
  K.sourceList($('#sources-list'));
  K.glossaryList($('#glossary-list'));

  /* ================= demo mode ================= */
  K.on('demo', (on) => {
    if (on) {
      for (const l of LAYERS) layerG[l.id].classList.remove('off');
      $$layerInputs().forEach((i) => { i.checked = true; });
      traceDest = 'os'; destSeg.set('os'); trace('lko');
      document.getElementById('paths').scrollIntoView();
      player.play(ROUTES.A, false);
      narrate('Demo mode: a mobile request is playing, and all map layers are on with a route from Lucknow to an overseas site.', 'Demo');
    } else { player.reset(); pathIntro(); }
  });
  function $$layerInputs() { return Array.from(document.querySelectorAll('#map-layers input')); }
})();
