/* Clickable SVG network diagram with an animated packet and a hop-by-hop player. */
(function () {
  'use strict';
  const { s } = window.K;

  class NetDiagram {
    /* nodes: [{id, label, icon, x, y, org}], links: [{id, from, to, type, curve}], zones: [{x,y,w,h,label}] */
    constructor(container, cfg) {
      this.cfg = cfg;
      this.nodes = new Map(cfg.nodes.map((n) => [n.id, n]));
      this.links = cfg.links;
      this.nodeEls = new Map();
      this.linkEls = new Map();
      this.token = 0;
      this.render(container);
    }
    linkId(a, b) {
      const l = this.links.find((x) => (x.from === a && x.to === b) || (x.from === b && x.to === a));
      return l ? l.id || l.from + '-' + l.to : null;
    }
    pathD(l) {
      const a = this.nodes.get(l.from), b = this.nodes.get(l.to);
      if (!l.curve) return `M${a.x},${a.y} L${b.x},${b.y}`;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + l.curve;
      return `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`;
    }
    render(container) {
      const { width, height } = this.cfg;
      const svg = s('svg', { class: 'net', viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': this.cfg.ariaLabel || 'Network diagram' });
      svg.appendChild(s('defs', null,
        s('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' },
          s('feGaussianBlur', { stdDeviation: 2.4, result: 'b' }),
          s('feMerge', null, s('feMergeNode', { in: 'b' }), s('feMergeNode', { in: 'SourceGraphic' })))));
      if (this.cfg.background) svg.appendChild(this.cfg.background());
      for (const z of this.cfg.zones || []) {
        svg.appendChild(s('rect', { class: 'zone', x: z.x, y: z.y, width: z.w, height: z.h, rx: 14 }));
        svg.appendChild(s('text', { class: 'zone-lbl', x: z.x + 10, y: z.y + 16 }, z.label));
      }
      const gl = s('g');
      for (const l of this.links) {
        const id = l.id || l.from + '-' + l.to;
        const p = s('path', { class: `link ${l.type}`, d: this.pathD(l) });
        p.appendChild(s('title', null, l.title || l.type));
        this.linkEls.set(id, p);
        gl.appendChild(p);
      }
      svg.appendChild(gl);
      const gn = s('g');
      for (const n of this.cfg.nodes) {
        const g = s('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': n.label + (n.org ? ', operated by ' + n.org : ''), transform: `translate(${n.x},${n.y})` },
          s('circle', { class: 'ring', r: n.r || 24 }),
          s('text', { class: 'icon', 'aria-hidden': 'true' }, n.icon || '•'),
          s('text', { class: 'lbl', y: (n.r || 24) + 16 }, n.label),
          n.org ? s('text', { class: 'org', y: (n.r || 24) + 30 }, n.org) : null);
        const fire = () => this.cfg.onNodeClick && this.cfg.onNodeClick(n.id);
        g.addEventListener('click', fire);
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
        this.nodeEls.set(n.id, g);
        gn.appendChild(g);
      }
      svg.appendChild(gn);
      this.packet = s('circle', { class: 'packet', r: 8, cx: -50, cy: -50, visibility: 'hidden' });
      svg.appendChild(this.packet);
      this.svg = svg;
      container.appendChild(svg);
    }
    setOrg(id, org) {
      const g = this.nodeEls.get(id); if (!g) return;
      const t = g.querySelector('text.org'); if (t) t.textContent = org;
      g.setAttribute('aria-label', this.nodes.get(id).label + (org ? ', operated by ' + org : ''));
    }
    nodeClass(id, cls, on = true) { const g = this.nodeEls.get(id); if (g) g.classList.toggle(cls, on); }
    clearNodeClass(cls) { this.nodeEls.forEach((g) => g.classList.remove(cls)); }
    linkClass(id, cls, on = true) { const p = this.linkEls.get(id); if (p) p.classList.toggle(cls, on); }
    clearLinkClass(cls) { this.linkEls.forEach((p) => p.classList.remove(cls)); }
    select(id) { this.clearNodeClass('selected'); if (id) this.nodeClass(id, 'selected'); }
    // Dim everything not on the route so the path in use stands out.
    showRoute(route) {
      const onRoute = new Set();
      for (let i = 0; i < route.length - 1; i++) onRoute.add(this.linkId(route[i], route[i + 1]));
      this.linkEls.forEach((p, id) => { p.classList.toggle('dim', !onRoute.has(id)); p.classList.remove('active'); });
      const nodesOn = new Set(route);
      this.nodeEls.forEach((g, id) => g.classList.toggle('dim', !nodesOn.has(id)));
    }
    hidePacket() { this.packet.setAttribute('visibility', 'hidden'); }
    placePacket(id, resp) {
      const n = this.nodes.get(id);
      this.packet.setAttribute('cx', n.x); this.packet.setAttribute('cy', n.y);
      this.packet.setAttribute('class', 'packet' + (resp ? ' resp' : ''));
      this.packet.setAttribute('visibility', 'visible');
    }
    cancel() { this.token++; }
    movePacket(a, b, ms, resp) {
      const lid = this.linkId(a, b);
      const path = this.linkEls.get(lid);
      const tok = ++this.token;
      this.placePacket(a, resp);
      this.clearLinkClass('active');
      if (path) path.classList.add('active');
      const reduce = document.body.classList.contains('reduce-motion');
      if (!path || reduce || ms <= 0) {
        this.placePacket(b, resp);
        return new Promise((r) => setTimeout(() => r(tok === this.token), reduce ? 120 : 0));
      }
      const len = path.getTotalLength();
      const forward = this.links.find((l) => (l.id || l.from + '-' + l.to) === lid).from === a;
      return new Promise((resolve) => {
        const t0 = performance.now();
        const tick = (t) => {
          if (tok !== this.token) return resolve(false);
          const k = Math.min(1, (t - t0) / ms);
          const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          const pt = path.getPointAtLength((forward ? e : 1 - e) * len);
          this.packet.setAttribute('cx', pt.x); this.packet.setAttribute('cy', pt.y);
          if (k < 1) requestAnimationFrame(tick); else resolve(true);
        };
        requestAnimationFrame(tick);
      });
    }
  }

  /* Plays a route hop by hop. onHop(index, nodeId, info) fires on arrival at each node. */
  class PathPlayer {
    constructor(diagram, opts) {
      this.d = diagram; this.opts = opts;
      this.route = []; this.idx = 0; this.state = 'idle'; this.busy = false; this.speed = 1; this.resp = false;
      this.timer = null;
    }
    load(route, resp) {
      this.reset();
      this.route = route.slice(); this.resp = !!resp; this.idx = 0;
      this.d.showRoute(this.route);
      this.d.placePacket(this.route[0], this.resp);
      this.arrive();
    }
    arrive() {
      this.d.clearNodeClass('active');
      this.d.nodeClass(this.route[this.idx], 'active');
      this.opts.onHop && this.opts.onHop(this.idx, this.route[this.idx], this);
      if (this.idx >= this.route.length - 1) { this.state = 'done'; this.opts.onDone && this.opts.onDone(this); }
      this.emit();
    }
    emit() { this.opts.onState && this.opts.onState(this.state, this); }
    play(route, resp) { this.load(route, resp); if (this.state !== 'done') { this.state = 'playing'; this.emit(); this.schedule(); } }
    schedule() { clearTimeout(this.timer); this.timer = setTimeout(() => this.next(), 500 / this.speed); }
    async hop() {
      if (this.busy || this.idx >= this.route.length - 1) return false;
      if (this.opts.beforeHop && !(await this.opts.beforeHop(this.idx, this))) return false;
      this.busy = true;
      const ok = await this.d.movePacket(this.route[this.idx], this.route[this.idx + 1], 1100 / this.speed, this.resp);
      this.busy = false;
      if (!ok) return false;
      this.idx++;
      this.arrive();
      return true;
    }
    async next() {
      if (this.state !== 'playing') return;
      const ok = await this.hop();
      if (ok && this.state === 'playing') this.schedule();
    }
    pause() { if (this.state === 'playing') { this.state = 'paused'; clearTimeout(this.timer); this.emit(); } }
    resume() { if (this.state === 'paused') { this.state = 'playing'; this.emit(); this.next(); } }
    async step() {
      if (!this.route.length || this.state === 'done') return;
      clearTimeout(this.timer);
      this.state = 'paused'; this.emit();
      await this.hop();
    }
    setSpeed(v) { this.speed = v; }
    reset() {
      clearTimeout(this.timer); this.d.cancel(); this.busy = false;
      this.state = 'idle'; this.idx = 0; this.route = [];
      this.d.hidePacket(); this.d.clearNodeClass('active'); this.d.clearNodeClass('dim'); this.d.clearLinkClass('dim'); this.d.clearLinkClass('active');
      this.emit();
    }
  }

  window.NetDiagram = NetDiagram;
  window.PathPlayer = PathPlayer;
})();
