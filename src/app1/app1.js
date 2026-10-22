/* App 1: From Earth to Orbit. */
(function () {
  'use strict';
  const { h, s, $, clear, fill, add, claim, claims, narrate, seg, toggle, chip } = window.K;

  K.init({ app: 'app1', intro: 'Welcome. Press Send request to follow one HTTPS request from a phone to a website over a satellite service.' });

  /* ---------------- data ---------------- */
  const NODES = [
    { id: 'phone', label: 'Phone / laptop', icon: '📱', x: 55, y: 385, org: 'You' },
    { id: 'router', label: 'Wi-Fi router', icon: '📶', x: 160, y: 385, org: 'You' },
    { id: 'terminal', label: 'Satellite terminal', icon: '📡', x: 285, y: 385, org: 'Satellite operator' },
    { id: 'sat1', label: 'LEO satellite A', icon: '🛰️', x: 330, y: 105, org: 'Satellite operator' },
    { id: 'sat2', label: 'LEO satellite B', icon: '🛰️', x: 580, y: 75, org: 'Satellite operator' },
    { id: 'gateway', label: 'Ground gateway', icon: '🗼', x: 600, y: 385, org: 'Satellite operator' },
    { id: 'core', label: 'Operator core', icon: '⚙️', x: 715, y: 385, org: 'Satellite operator' },
    { id: 'ixp', label: 'ISP backbone / IXP', icon: '🔀', x: 830, y: 385, org: 'Transit / exchange' },
    { id: 'server', label: 'Website / data centre', icon: '☁️', x: 940, y: 290, org: 'Website owner' },
  ];
  const LINKS = [
    { from: 'phone', to: 'router', type: 'radio', title: 'Wi-Fi radio' },
    { from: 'router', to: 'terminal', type: 'wired', title: 'Ethernet cable' },
    { from: 'terminal', to: 'sat1', type: 'radio', title: 'Ku/Ka-band radio uplink and downlink' },
    { from: 'sat1', to: 'gateway', type: 'radio', title: 'Radio feeder link to gateway' },
    { from: 'sat1', to: 'sat2', type: 'laser', title: 'Optical inter-satellite link', curve: -30 },
    { from: 'sat2', to: 'gateway', type: 'radio', title: 'Radio feeder link to gateway' },
    { from: 'gateway', to: 'core', type: 'fibre', title: 'Fibre' },
    { from: 'core', to: 'ixp', type: 'fibre', title: 'Fibre' },
    { from: 'ixp', to: 'server', type: 'fibre', title: 'Fibre', curve: 10 },
  ];
  // One-way, per link, in milliseconds. Teaching values only.
  const LAT = { 'phone-router': 2, 'router-terminal': 1, 'terminal-sat1': 4, 'sat1-gateway': 4, 'sat1-sat2': 6, 'sat2-gateway': 4, 'gateway-core': 2, 'core-ixp': 5, 'ixp-server': 6 };
  const ROUTES = {
    A: ['phone', 'router', 'terminal', 'sat1', 'gateway', 'core', 'ixp', 'server'],
    B: ['phone', 'router', 'terminal', 'sat1', 'sat2', 'gateway', 'core', 'ixp', 'server'],
  };
  const INFO = {
    phone: {
      does: 'Your app or browser looks up the site name (DNS), opens an encrypted TLS connection and sends the HTTPS request.',
      sees: 'Everything: it creates the request before encryption and reads the response after decryption.',
      cannot: 'It cannot see how the operator routes the packets once they leave the router.',
      controls: 'Device lock and updates, app permissions, TLS certificate checks, optional encrypted DNS.',
      fails: 'If the device is compromised, data is exposed before encryption. No network protection can fix that.',
      claims: ['tls-protects'],
    },
    router: {
      does: 'Carries packets between your devices over Wi-Fi and forwards them to the satellite terminal over Ethernet.',
      sees: 'Device addresses, the destination IP address, timing and volume of traffic, and plain DNS lookups.',
      cannot: 'It cannot read HTTPS page content or passwords sent over TLS.',
      controls: 'WPA2/WPA3 Wi-Fi encryption, a strong admin password, firmware updates.',
      fails: 'Devices lose local connectivity. A wired connection to the terminal still works.',
      claims: ['dns-visible'],
    },
    terminal: {
      does: 'The dish and modem steer a radio beam electronically to a satellite overhead and hand over as satellites move.',
      sees: 'Packet headers, destination addresses, timing and volume. It is managed remotely by the operator.',
      cannot: 'It cannot read TLS-encrypted content.',
      controls: 'Operator-signed firmware, terminal authentication to the network, radio-link protection set by the operator.',
      fails: 'The home loses satellite connectivity. Mobile data or fixed broadband can serve as backup.',
      claims: ['terminal-array', 'bands'],
    },
    sat1: {
      does: 'Receives the uplink and sends it down to a gateway in view, or across a laser link to another satellite.',
      sees: 'Encrypted or encapsulated user packets and their routing information, as configured by the operator.',
      cannot: 'It cannot read TLS-protected content.',
      controls: 'Command authentication for satellite control, link protection, operator monitoring.',
      fails: 'The terminal switches to another satellite in view, usually within moments. If none is in view, service stops.',
      claims: ['leo-altitude', 'starlink-antennas'],
    },
    sat2: {
      does: 'Relays traffic received over the optical link until a satellite with a suitable gateway in view can send it down.',
      sees: 'The same as satellite A: encapsulated traffic and routing information.',
      cannot: 'It cannot read TLS-protected content.',
      controls: 'Operator-controlled routing and authenticated commands.',
      fails: 'Traffic takes another laser path or a gateway closer to the user.',
      claims: ['starlink-isl', 'route-depends'],
    },
    gateway: {
      does: 'Large ground antennas receive the satellite feeder link and pass traffic to fibre and the operator core.',
      sees: 'Subscriber traffic flows with IP addresses, timing and volume. This is a natural point for monitoring under local law.',
      cannot: 'It cannot read TLS-protected content.',
      controls: 'Physical site security, access control, network segmentation, logging, lawful-interception interfaces where required.',
      fails: 'Users served through that gateway are moved to another one if available; otherwise they lose service.',
      claims: ['gateway-role'],
    },
    core: {
      does: 'Authenticates terminals, assigns IP addresses, applies policy and routes traffic onward. It also runs the network\'s control plane.',
      sees: 'Subscriber identity, account, location area, and traffic metadata.',
      cannot: 'It cannot read TLS-protected content.',
      controls: 'Privileged-access management, multi-factor authentication, change control, audit logs, incident response.',
      fails: 'A core or control-plane failure can affect many users at once, even if satellites and gateways are healthy.',
      claims: ['outage-2025'],
    },
    ixp: {
      does: 'Hands traffic to other networks through internet exchanges and transit providers, using BGP routes.',
      sees: 'Source and destination IP addresses, timing and volume.',
      cannot: 'It cannot read TLS-protected content or know which subscriber sent a packet.',
      controls: 'BGP filtering, RPKI route-origin validation, DDoS protection.',
      fails: 'Traffic is re-routed through other exchanges or transit, usually with more delay.',
      claims: ['bgp'],
    },
    server: {
      does: 'Ends the TLS connection, processes the request and sends back the response.',
      sees: 'The request content, your IP address (the operator\'s address if shared) and anything you sign in with.',
      cannot: 'It does not see which satellite or gateway carried the traffic.',
      controls: 'A valid TLS certificate, server hardening, access control, logging, DDoS protection.',
      fails: 'The site is unavailable. A CDN or a second region can keep it online.',
      claims: ['tls-limits'],
    },
  };
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  const state = { isl: false, mode: 'A', dir: 'req', scenario: null, timeline: [], t: 0, predict: false, pScore: 0, pTotal: 0 };

  /* ---------------- hero ---------------- */
  (function hero() {
    const stars = [];
    for (let i = 0; i < 40; i++) stars.push(s('circle', { class: i % 3 ? '' : 'twinkle', cx: (i * 97) % 400, cy: (i * 53) % 400, r: (i % 4) * .35 + .4, fill: '#cfd8ff', opacity: .7 }));
    const art = s('svg', { viewBox: '0 0 400 400' },
      s('defs', null, s('radialGradient', { id: 'earth', cx: '40%', cy: '35%' }, s('stop', { offset: '0%', 'stop-color': '#3b7bd6' }), s('stop', { offset: '70%', 'stop-color': '#173b80' }), s('stop', { offset: '100%', 'stop-color': '#0b1d47' }))),
      ...stars,
      s('circle', { cx: 200, cy: 200, r: 92, fill: 'url(#earth)' }),
      s('path', { d: 'M150 150c20-10 40 5 35 25s-30 15-40 35 10 35-5 40', fill: 'none', stroke: '#45d99a', 'stroke-width': 5, opacity: .55, 'stroke-linecap': 'round' }),
      s('path', { d: 'M225 135c15 5 25 25 15 40s-20 30-5 45', fill: 'none', stroke: '#45d99a', 'stroke-width': 5, opacity: .45, 'stroke-linecap': 'round' }),
      s('circle', { cx: 200, cy: 200, r: 135, fill: 'none', stroke: '#e3b54d', 'stroke-opacity': .35, 'stroke-dasharray': '3 6' }),
      s('circle', { cx: 200, cy: 200, r: 170, fill: 'none', stroke: '#3fd0ff', 'stroke-opacity': .25, 'stroke-dasharray': '3 6' }),
      s('g', { class: 'orbit-spin' }, ...[0, 90, 180, 270].map((a) => s('g', { transform: `rotate(${a} 200 200)` }, s('rect', { x: 330, y: 196, width: 10, height: 8, fill: '#f6d27e' }), s('rect', { x: 322, y: 198, width: 26, height: 4, fill: '#3fd0ff', opacity: .8 })))),
      s('g', { class: 'orbit-spin b' }, ...[45, 165, 285].map((a) => s('g', { transform: `rotate(${a} 200 200)` }, s('rect', { x: 365, y: 196, width: 9, height: 8, fill: '#f6d27e' }), s('rect', { x: 358, y: 198, width: 23, height: 4, fill: '#3fd0ff', opacity: .8 })))),
      s('line', { x1: 200, y1: 108, x2: 200, y2: 65, stroke: '#3fd0ff', 'stroke-dasharray': '2 4' }));
    $('#hero-art').appendChild(art);
    add($('#hero-claims'), ...claims(['leo-altitude', 'latency-sim']));
  })();

  /* ---------------- main diagram ---------------- */
  const diagram = new NetDiagram($('#main-diagram'), {
    width: 1000, height: 470, nodes: NODES, links: LINKS, ariaLabel: 'Satellite internet path from phone to website',
    onNodeClick: (id) => showNode(id),
    background: () => s('g', null,
      s('path', { d: 'M-10 330 Q500 270 1010 330 L1010 480 L-10 480 Z', fill: '#0f2a5e', opacity: .55 }),
      s('path', { d: 'M-10 330 Q500 270 1010 330', fill: 'none', stroke: '#45d99a', 'stroke-opacity': .35 }),
      s('path', { d: 'M-10 150 Q500 -10 1010 150', fill: 'none', stroke: '#e3b54d', 'stroke-opacity': .25, 'stroke-dasharray': '4 8' }),
      s('text', { x: 980, y: 40, 'text-anchor': 'end', fill: '#a9b4d4', 'font-size': 12 }, 'Low Earth orbit (not to scale)'),
      s('text', { x: 980, y: 465, 'text-anchor': 'end', fill: '#a9b4d4', 'font-size': 12 }, 'Ground')),
  });

  function linkKey(a, b) { return LAT[a + '-' + b] != null ? a + '-' + b : b + '-' + a; }
  function route() { return ROUTES[state.isl && state.mode === 'B' ? 'B' : 'A']; }

  function applyIsl() {
    diagram.linkClass('sat1-sat2', 'hidden', !state.isl);
    diagram.linkClass('sat2-gateway', 'hidden', !state.isl);
    diagram.nodeClass('sat2', 'hidden', !state.isl);
    const bBtn = modeSeg.btn('B');
    bBtn.disabled = !state.isl;
    if (!state.isl && state.mode === 'B') { state.mode = 'A'; modeSeg.set('A'); }
    drawLatency();
  }

  const islSwitch = toggle('System supports inter-satellite links', false, (v) => {
    state.isl = v; applyIsl(); player.reset(); hopPanelIntro();
    narrate(v ? 'Inter-satellite links are on. Route B is now available: traffic can cross between satellites by laser before coming down.' : 'Inter-satellite links are off. Traffic goes straight down to a gateway in view.', 'Route');
  });
  const modeSeg = seg([{ value: 'A', label: 'A · Satellite → gateway' }, { value: 'B', label: 'B · Via inter-satellite link' }], 'A', (v) => {
    state.mode = v; player.reset(); drawLatency(); hopPanelIntro();
    narrate(v === 'B' ? 'Route B: the packet crosses a laser link to a second satellite before a gateway.' : 'Route A: the satellite sends the packet straight down to a gateway in view.', 'Route');
  }, 'Route mode');
  add($('#route-controls'), 
    h('div', { class: 'grp' }, islSwitch),
    h('div', { class: 'grp' }, h('span', null, 'Route:'), modeSeg),
    h('p', { class: 'muted', style: { margin: 0, flexBasis: '100%', fontSize: '.88em' } }, 'The real route depends on which satellites are visible, congestion, gateway location and operator configuration.'));
  add($('#route-claims'), ...claims(['route-depends', 'starlink-isl']));

  /* ---------------- hop panel ---------------- */
  const panel = $('#hop-panel');
  function hopPanelIntro() {
    fill(panel, 
      h('h3', null, 'Pick a component'),
      h('p', { class: 'muted' }, 'Click any node in the diagram, or press Send request to step through the journey. This panel explains each hop: what it does, what it can observe, what it normally cannot read, its security controls and what happens if it fails.'));
  }
  function nodeDetails(id) {
    const n = byId[id], i = INFO[id];
    return [
      h('h3', null, n.icon + ' ' + n.label),
      h('div', { class: 'who' }, 'Operated by: ' + n.org),
      h('dl', { class: 'fields' },
        h('dt', null, 'What it does'), h('dd', null, i.does),
        h('dt', null, 'What it can observe'), h('dd', null, i.sees),
        h('dt', null, 'What it normally cannot read'), h('dd', null, i.cannot),
        h('dt', null, 'Security controls'), h('dd', null, i.controls),
        h('dt', null, 'If it fails'), h('dd', null, i.fails)),
      h('div', { style: { marginTop: '10px', fontSize: '.9em' } }, claims(i.claims, 'p')),
    ];
  }
  function showNode(id) {
    diagram.select(id);
    fill(panel, ...nodeDetails(id));
    narrate(INFO[id].does, byId[id].label);
  }
  hopPanelIntro();

  /* ---------------- player ---------------- */
  const status = h('span', { class: 'player-status', 'aria-live': 'polite' }, 'Ready.');
  const btn = (label, fn, extra) => { const b = h('button', Object.assign({ class: 'btn', type: 'button' }, extra || {}), label); b.addEventListener('click', fn); return b; };
  const speeds = [1, .5, .25];
  let speedIdx = 0;
  const bSend = btn('▶ Send request', () => start('req'), { class: 'btn primary' });
  const bResp = btn('↩ Return response', () => start('resp'));
  const bPause = btn('⏸ Pause', () => player.pause());
  const bResume = btn('⏵ Resume', () => player.resume());
  const bStep = btn('⏭ Step', () => { if (!player.route.length) { start(state.dir, true); } else player.step(); });
  const bSlow = btn('🐢 Slow down (1×)', () => { speedIdx = (speedIdx + 1) % speeds.length; player.setSpeed(speeds[speedIdx]); bSlow.textContent = `🐢 Slow down (${speeds[speedIdx]}×)`; });
  const bReset = btn('⟲ Reset', () => { player.reset(); hopPanelIntro(); resetTimeline(); status.textContent = 'Ready.'; });
  add($('#player'), h('div', { class: 'btnrow' }, bSend, bResp, bPause, bResume, bStep, bSlow, bReset), status);

  function start(dir, stepOnly) {
    state.dir = dir;
    resetTimeline();
    const r = dir === 'req' ? route() : route().slice().reverse();
    if (stepOnly) { player.load(r, dir === 'resp'); player.state = 'paused'; player.emit(); }
    else player.play(r, dir === 'resp');
  }

  const DOWN_STOPS = () => (state.scenario && SCEN[state.scenario].stopAt) || null;
  const player = new PathPlayer(diagram, {
    onHop(idx, id, p) {
      const prev = idx > 0 ? p.route[idx - 1] : null;
      if (prev) state.t += LAT[linkKey(prev, id)];
      addTimeline(idx, id, prev);
      fill(panel, h('span', { class: 'dir' + (p.resp ? ' resp' : '') }, p.resp ? 'RESPONSE · hop ' + (idx + 1) + ' of ' + p.route.length : 'REQUEST · hop ' + (idx + 1) + ' of ' + p.route.length), ...nodeDetails(id));
      diagram.select(id);
      narrate(INFO[id].does, `Hop ${idx + 1}: ${byId[id].label}`);
      const stop = DOWN_STOPS();
      if (stop && id === stop && idx < p.route.length - 1) {
        p.pause();
        p.state = 'done'; p.emit();
        panel.prepend(h('div', { class: 'notice bad' }, `Packet dropped at ${byId[id].label}: ${SCEN[state.scenario].dropMsg}`));
        narrate(SCEN[state.scenario].dropMsg, 'Scenario');
      }
    },
    onDone(p) {
      if (p.route[p.route.length - 1] === (p.resp ? 'phone' : 'server')) {
        narrate(p.resp ? 'The response is back on the phone. The browser decrypts it and shows the page.' : 'The request reached the website. Press Return response to send the page back.', 'Done');
      }
    },
    onState(st) {
      const labels = { idle: 'Ready.', playing: 'Playing…', paused: 'Paused. Press Step or Resume.', done: 'Finished.' };
      status.textContent = labels[st] || st;
      bPause.disabled = st !== 'playing';
      bResume.disabled = st !== 'paused';
    },
    beforeHop: (idx, p) => (state.predict ? askPredict(idx, p) : true),
  });
  player.emit();

  /* ---------------- layers ---------------- */
  const layer = (intro, items, ids) => () => h('div', null, h('p', { class: 'lead' }, intro),
    h('div', { class: 'layer-grid' }, items.map(([t, d]) => h('div', { class: 'card' }, h('h3', null, t), h('p', null, d)))),
    h('div', { style: { marginTop: '10px' } }, claims(ids)));
  K.tabs($('#layer-tabs'), [
    { label: 'Physical', render: layer('Signals travel as radio waves, laser light and light in fibre.', [
      ['Radio', 'Wi-Fi in the home, then Ku/Ka-band radio between the terminal, satellites and gateways.'],
      ['Antennas', 'Flat phased-array antennas steer beams electronically, with no moving dish.'],
      ['Lasers', 'Optical inter-satellite links carry traffic between satellites in vacuum.'],
      ['Fibre', 'From the gateway onward, everything rides on terrestrial fibre, just like mobile and broadband.'],
    ], ['bands', 'starlink-antennas', 'terminal-array']) },
    { label: 'Network', render: layer('IP gets each packet to the right network; routing decides the path.', [
      ['IP addressing', 'The operator gives the terminal (or a shared gateway address) an IP address. Every packet carries source and destination addresses.'],
      ['Routing', 'Inside its network, the operator decides which satellite, laser link and gateway to use.'],
      ['Autonomous systems', 'At the edge, the operator\'s network exchanges routes with other networks using BGP.'],
    ], ['bgp', 'route-depends']) },
    { label: 'Transport', render: layer('Transport protocols turn packets into reliable connections.', [
      ['TCP', 'Reliable, ordered delivery with retransmission. Each lost packet costs a round trip.'],
      ['QUIC', 'Runs over UDP with encryption built in, and recovers from loss and network changes faster.'],
    ], ['tcp', 'quic']) },
    { label: 'Application', render: layer('The application layer is what the user actually asked for.', [
      ['DNS', 'Turns the site name into an IP address before the connection starts.'],
      ['HTTPS', 'HTTP inside TLS: the request, cookies and the page all travel encrypted.'],
    ], ['dns-visible']) },
    { label: 'Security', render: () => h('div', null,
      h('div', { class: 'notice' }, h('strong', null, 'Key point: '), 'End-to-end TLS protects page content and proves which website you reached. It does not hide IP addresses, timing, traffic volume, or in every case the site name.'),
      h('div', { class: 'layer-grid' },
        h('div', { class: 'card' }, h('h3', null, 'TLS (end to end)'), h('p', null, 'Between your browser and the website. Protects against every network in between.')),
        h('div', { class: 'card' }, h('h3', null, 'Radio-link protection'), h('p', null, 'Between terminal and satellite. Set by the operator; protects against radio eavesdroppers.')),
        h('div', { class: 'card' }, h('h3', null, 'Inside the operator'), h('p', null, 'Authentication, access control, segmentation and monitoring of the operator\'s own systems.')),
        h('div', { class: 'card' }, h('h3', null, 'Authentication'), h('p', null, 'Terminals authenticate to the network, users to websites, and administrators to management systems.'))),
      h('div', { style: { marginTop: '10px' } }, claims(['tls-protects', 'tls-limits', 'link-separate']))) },
  ], (i, it) => narrate(`Layer view: ${it.label}.`, 'Layers'));

  /* ---------------- comparison ---------------- */
  function mini(title, nodes, links) {
    const wrap = h('div', { class: 'mini-wrap' });
    const card = h('div', { class: 'card' }, h('h3', null, title), wrap);
    new NetDiagram(wrap, { width: 520, height: 230, nodes, links, ariaLabel: title, onNodeClick: (id) => narrate(nodes.find((n) => n.id === id).tip, title) });
    return card;
  }
  add($('#compare-grid'), 
    mini('Satellite path', [
      { id: 'u', label: 'Terminal', icon: '📡', x: 60, y: 170, tip: 'The satellite terminal connects to a satellite overhead.' },
      { id: 'sa', label: 'Satellite', icon: '🛰️', x: 200, y: 50, tip: 'The satellite relays to a ground gateway.' },
      { id: 'g', label: 'Gateway', icon: '🗼', x: 320, y: 170, tip: 'The gateway hands traffic to fibre.' },
      { id: 'f', label: 'Fibre / internet', icon: '🌐', x: 460, y: 170, tip: 'From here the path is the same terrestrial internet.' }],
    [{ from: 'u', to: 'sa', type: 'radio' }, { from: 'sa', to: 'g', type: 'radio' }, { from: 'g', to: 'f', type: 'fibre' }]),
    mini('Mobile path', [
      { id: 'p', label: 'Phone', icon: '📱', x: 60, y: 170, tip: 'The phone connects by radio to a nearby cell tower.' },
      { id: 't', label: 'Cell tower', icon: '🗼', x: 200, y: 90, tip: 'The base station sends traffic over backhaul, mostly fibre.' },
      { id: 'c', label: 'Mobile core', icon: '⚙️', x: 320, y: 170, tip: 'The mobile core authenticates the SIM and routes traffic.' },
      { id: 'f', label: 'Fibre / internet', icon: '🌐', x: 460, y: 170, tip: 'From here the path is the same terrestrial internet.' }],
    [{ from: 'p', to: 't', type: 'radio' }, { from: 't', to: 'c', type: 'fibre' }, { from: 'c', to: 'f', type: 'fibre' }]));
  const rows = [
    ['First radio hop', 'Terminal to satellite, hundreds of km up', 'Phone to tower, usually a few km'],
    ['Who authenticates you', 'Satellite operator authenticates the terminal and account', 'Mobile core authenticates the SIM'],
    ['Where traffic meets fibre', 'At the ground gateway', 'At or near the cell site (backhaul)'],
    ['Best at', 'Remote, rural, maritime, disaster areas', 'Dense areas, handheld mobility, indoor coverage'],
    ['Single points of concern', 'Gateways and the operator control plane', 'Towers, backhaul and the mobile core'],
  ];
  $('#compare-table').appendChild(h('table', { class: 'data' }, h('thead', null, h('tr', null, h('th', null, ''), h('th', null, 'Satellite'), h('th', null, 'Mobile'))),
    h('tbody', null, rows.map((r) => h('tr', null, h('th', { scope: 'row' }, r[0]), h('td', null, r[1]), h('td', null, r[2]))))));
  add($('#compare-claims'), h('p', null, h('strong', null, 'Both end up on terrestrial fibre. They complement each other and are not interchangeable.')), ...claims(['complementary', 'mobile-auth']));

  /* ---------------- scenarios ---------------- */
  const SCEN = {
    eaves: {
      title: 'Eavesdropper on encrypted traffic', icon: '👂', short: 'Someone records radio or fibre traffic.',
      status: { terminal: 'warn', sat1: 'warn' },
      impact: 'The attacker records encrypted traffic and sees addresses, timing and volume.',
      limits: 'TLS stops them reading page content, passwords or messages. Operator radio-link protection may hide even the metadata from radio listeners.',
      mitigations: 'TLS everywhere, HSTS, encrypted DNS, operator link encryption, post-quantum-ready key exchange for long-lived secrets.',
    },
    phone: {
      title: 'Compromised phone', icon: '📱', short: 'Malware on the device itself.',
      status: { phone: 'down' },
      impact: 'Data is exposed before it is encrypted. The attacker can read messages and capture passwords.',
      limits: 'The satellite network is not at fault and cannot detect this. Other devices are unaffected.',
      mitigations: 'OS updates, app-store hygiene, device encryption, phishing-resistant sign-in (passkeys), mobile device management for organisations.',
    },
    admin: {
      title: 'Compromised operator management account', icon: '🔑', short: 'A phished administrator login.',
      status: { core: 'down', gateway: 'warn', terminal: 'warn' },
      impact: 'The attacker might change configuration, push settings to terminals or read subscriber records and metadata.',
      limits: 'They still cannot read TLS content. Hardware-backed credentials and two-person approval block most changes.',
      mitigations: 'Hardware security keys, least privilege, time-limited access, two-person approval for critical changes, tamper-evident audit logs.',
    },
    gw: {
      title: 'Gateway outage', icon: '🗼', short: 'Power or fibre fails at one ground station.',
      status: { gateway: 'down' }, stopAt: 'gateway', dropMsg: 'the gateway is offline in this scenario. In reality the operator would try to route via another gateway.',
      impact: 'Users served by that gateway lose service until traffic moves to another gateway.',
      limits: 'With several gateways and inter-satellite links, the operator can usually re-route. Only users without an alternative are cut off.',
      mitigations: 'Multiple gateways per region, diverse fibre and power, inter-satellite re-routing, terrestrial backup links.',
    },
    route: {
      title: 'Routing error', icon: '🔀', short: 'Traffic takes a different, legitimate path.',
      status: { ixp: 'warn' }, forceB: true,
      impact: 'Traffic travels a longer path through other networks, perhaps another country, adding delay.',
      limits: 'TLS still protects the content and authenticates the website. Metadata becomes visible to more networks.',
      mitigations: 'RPKI route-origin validation, BGP filtering, monitoring of route changes, local interconnection.',
    },
    ctrl: {
      title: 'Operator-wide control-plane outage', icon: '⚠️', short: 'The central software that runs the network fails.',
      status: { core: 'down', gateway: 'warn', sat1: 'warn', sat2: 'warn', terminal: 'warn' }, stopAt: 'terminal', dropMsg: 'the operator\'s control plane is down, so terminals cannot get service even though satellites and gateways still work.',
      impact: 'Every user of the operator can lose service at once, in every country.',
      limits: 'Usually temporary. Terrestrial networks are unaffected and can act as backup.',
      mitigations: 'Staged rollouts, regional isolation of the control plane, local survivability, terrestrial fallback for critical users.',
      claims: ['outage-2025'],
    },
  };
  const scenCards = $('#scen-cards');
  for (const [id, sc] of Object.entries(SCEN)) {
    const b = h('button', { class: 'card clickable scen-card', type: 'button', 'aria-pressed': 'false' }, h('h3', null, sc.icon + ' ' + sc.title), h('p', null, sc.short));
    b.addEventListener('click', () => selectScenario(state.scenario === id ? null : id));
    b.dataset.id = id;
    scenCards.appendChild(b);
  }
  function selectScenario(id) {
    state.scenario = id;
    [...scenCards.children].forEach((c) => { const on = c.dataset.id === id; c.classList.toggle('selected', on); c.setAttribute('aria-pressed', String(on)); });
    diagram.clearNodeClass('warn'); diagram.clearNodeClass('down');
    const det = clear($('#scen-detail'));
    if (!id) { add(det, h('p', { class: 'muted' }, 'No scenario selected. All components are normal.')); drawStatus(); drawStats(); return; }
    const sc = SCEN[id];
    for (const [n, st] of Object.entries(sc.status)) diagram.nodeClass(n, st);
    if (sc.forceB) { if (!state.isl) { islSwitch.input.checked = true; state.isl = true; applyIsl(); } state.mode = 'B'; modeSeg.set('B'); drawLatency(); }
    add(det, h('h3', null, sc.icon + ' ' + sc.title, ' ', chip('illustrative')),
      h('dl', { class: 'fields' }, h('dt', null, 'Impact'), h('dd', null, sc.impact), h('dt', null, 'Limits of the attack'), h('dd', null, sc.limits), h('dt', null, 'Mitigations'), h('dd', null, sc.mitigations)),
      sc.claims ? h('div', { style: { marginTop: '8px' } }, claims(sc.claims)) : null,
      h('div', { class: 'btnrow' }, btn('▶ Run this scenario on the diagram', () => { document.getElementById('journey').scrollIntoView(); start('req'); }, { class: 'btn primary' })));
    narrate(sc.impact + ' ' + sc.limits, sc.title);
    drawStatus(); drawStats();
  }
  selectScenario(null);

  /* ---------------- dashboard ---------------- */
  function drawLatency() {
    const r = route();
    const box = clear($('#lat-bars'));
    let total = 0;
    const max = Math.max(...Object.values(LAT));
    for (let i = 0; i < r.length - 1; i++) {
      const k = linkKey(r[i], r[i + 1]), v = LAT[k];
      total += v;
      box.appendChild(h('div', { class: 'barrow' }, h('span', null, byId[r[i]].label.split(' /')[0] + ' → ' + byId[r[i + 1]].label.split(' /')[0]), h('div', { class: 'bar', role: 'img', 'aria-label': v + ' ms' }, h('i', { style: { width: (v / max * 100) + '%' } })), h('span', null, v + ' ms')));
    }
    $('#lat-total').textContent = `One way ≈ ${total} ms; round trip ≈ ${total * 2} ms, before server time. Simulated.`;
    drawStats();
  }
  function drawStats() {
    const r = route();
    const sc = state.scenario && SCEN[state.scenario];
    let avail = r.length === 9 ? '99.6%' : '99.5%';
    if (sc && sc.stopAt === 'gateway') avail = 'Degraded: users on this gateway offline';
    if (sc && sc.stopAt === 'terminal') avail = '0% during outage';
    fill($('#stats'), h('dl', { class: 'kv' },
      h('dt', null, 'Route'), h('dd', null, r.length === 9 ? 'B · via inter-satellite link' : 'A · satellite → gateway'),
      h('dt', null, 'Hop count'), h('dd', null, String(r.length - 1) + ' links, ' + r.length + ' components'),
      h('dt', null, 'Availability'), h('dd', null, avail, ' ', chip('simulated')),
      h('dt', null, 'Packet clock'), h('dd', null, state.t + ' ms elapsed')));
  }
  function drawStatus() {
    const sc = state.scenario && SCEN[state.scenario];
    const box = clear($('#sec-status'));
    for (const n of NODES) {
      if (n.id === 'sat2' && !state.isl) continue;
      const st = (sc && sc.status[n.id]) || 'ok';
      box.appendChild(h('div', { class: 'status-row' }, h('span', null, n.icon + ' ' + n.label), h('span', { class: 'st ' + st }, { ok: 'Normal', warn: 'At risk', down: 'Compromised / down' }[st])));
    }
  }
  function resetTimeline() { state.timeline = []; state.t = 0; clear($('#timeline')).appendChild(h('li', { class: 'muted' }, 'Send a request to fill the timeline.')); drawStats(); }
  function addTimeline(idx, id, prev) {
    const ol = $('#timeline');
    if (idx === 0) clear(ol);
    ol.appendChild(h('li', null, `t = ${state.t} ms · ${byId[id].label}` + (prev ? ` (+${LAT[linkKey(prev, id)]} ms)` : ' (start)')));
    drawStats();
  }

  /* ---------------- predict-the-next-hop ---------------- */
  const pBox = $('#predict');
  const pBody = h('div', { 'aria-live': 'polite' });
  const pScore = h('p', { class: 'muted' });
  const pToggle = toggle('Predict the next hop before the packet moves', false, (v) => { state.predict = v; drawPredictIdle(); });
  add(pBox, h('h3', null, 'Predict the next hop'), pToggle, pBody, pScore);
  function drawPredictIdle() {
    fill(pBody, h('p', { class: 'muted' }, state.predict ? 'Now press Send request or Step. Before every move you\'ll be asked where the packet goes next.' : 'Turn this on to quiz yourself during the journey.'));
    pScore.textContent = state.pTotal ? `Score: ${state.pScore} / ${state.pTotal}` : '';
  }
  drawPredictIdle();
  function askPredict(idx, p) {
    const right = p.route[idx + 1];
    const pool = NODES.map((n) => n.id).filter((x) => x !== right && x !== p.route[idx] && (state.isl || x !== 'sat2'));
    const opts = [right, ...pool.sort(() => Math.random() - .5).slice(0, 2)].sort(() => Math.random() - .5);
    pBox.scrollIntoView({ block: 'nearest' });
    return new Promise((resolve) => {
      fill(pBody, h('p', null, `The packet is at ${byId[p.route[idx]].label}. Where does it go next?`),
        h('div', { class: 'predict-opts' }, opts.map((o) => {
          const b = h('button', { class: 'btn', type: 'button' }, byId[o].icon + ' ' + byId[o].label);
          b.addEventListener('click', () => {
            state.pTotal++; const ok = o === right; if (ok) state.pScore++;
            fill(pBody, h('p', null, ok ? '✅ Correct. ' : `❌ Not this time. It goes to ${byId[right].label}. `, INFO[right].does));
            pScore.textContent = `Score: ${state.pScore} / ${state.pTotal}`;
            resolve(true);
          });
          return b;
        })));
      pBody.querySelector('button').focus({ preventScroll: true });
    });
  }

  /* ---------------- quiz, sources, glossary ---------------- */
  K.quiz($('#quiz'), [
    { q: 'Which component can read the content of an HTTPS page?', options: ['The satellite', 'The ground gateway', 'The website server', 'The internet exchange'], answer: 2, why: 'TLS runs end to end between your browser and the website. Only the endpoints see the content.' },
    { q: 'What does TLS NOT hide from networks along the path?', options: ['Passwords', 'Page content', 'IP addresses and timing', 'Cookies'], answer: 2, why: 'Addresses, timing and volume stay visible to every network the packet crosses.' },
    { q: 'Where does satellite traffic join the terrestrial internet?', options: ['At the satellite', 'At the ground gateway', 'At the Wi-Fi router', 'It never does'], answer: 1, why: 'The gateway links the satellite network to fibre and the operator core.' },
    { q: 'What do inter-satellite laser links allow?', options: ['Reading encrypted traffic', 'Carrying traffic between satellites before it comes down', 'Charging satellites', 'Replacing the gateway'], answer: 1, why: 'Traffic can cross the constellation to reach a different gateway.' },
    { q: 'Which failure can affect every user of an operator at once?', options: ['A single terminal fault', 'A compromised phone', 'A control-plane outage', 'A Wi-Fi router reboot'], answer: 2, why: 'The control plane is shared, so its failure is shared too.' },
  ]);
  K.sourceList($('#sources-list'));
  K.glossaryList($('#glossary-list'));

  /* ---------------- demo mode ---------------- */
  K.on('demo', (on) => {
    if (on) {
      islSwitch.input.checked = true; state.isl = true; applyIsl();
      state.mode = 'B'; modeSeg.set('B'); drawLatency();
      selectScenario(null);
      document.getElementById('journey').scrollIntoView();
      start('req');
      narrate('Demo mode: inter-satellite links are on and a request is travelling route B.', 'Demo');
    } else {
      player.reset(); hopPanelIntro(); resetTimeline();
    }
  });

  applyIsl();
  resetTimeline();
  drawStatus();
})();
