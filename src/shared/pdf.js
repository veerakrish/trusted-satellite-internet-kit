/* Minimal one-page PDF writer (Helvetica, text, lines, rectangles). No dependencies, works offline.
   Coordinates are in points from the top-left of an A4 page (595 × 842). */
(function () {
  'use strict';
  const MAP = { '→': '->', '←': '<-', '–': '-', '—': '-', '‘': "'", '’': "'", '“': '"', '”': '"', '…': '...', '₹': 'Rs ', '·': '-', '×': 'x', '≤': '<=', '≥': '>=', '•': '-', '✓': 'v', '−': '-', '⚠': '!' };
  function clean(str) {
    return String(str).replace(/[^\x20-\x7e]/g, (c) => (MAP[c] != null ? MAP[c] : (c.charCodeAt(0) < 256 ? c : '?')));
  }
  function esc(str) { return clean(str).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  const rgb = (c) => c.map((v) => (v / 255).toFixed(3)).join(' ');

  class MiniPDF {
    constructor() { this.ops = []; this.W = 595; this.H = 842; }
    text(x, y, str, size = 10, bold = false, color = [20, 20, 40]) {
      this.ops.push(`BT ${rgb(color)} rg /${bold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(1)} ${(this.H - y).toFixed(1)} Td (${esc(str)}) Tj ET`);
    }
    line(x1, y1, x2, y2, color = [180, 180, 200], w = 0.6) {
      this.ops.push(`${rgb(color)} RG ${w} w ${x1} ${this.H - y1} m ${x2} ${this.H - y2} l S`);
    }
    rect(x, y, w, h, color) { this.ops.push(`${rgb(color)} rg ${x} ${this.H - y - h} ${w} ${h} re f`); }
    // Approximate Helvetica width (average 0.5em) for wrapping.
    wrap(str, size, maxW) {
      const words = clean(str).split(/\s+/), lines = [];
      let cur = '';
      const maxChars = Math.floor(maxW / (size * 0.5));
      for (const w of words) {
        if ((cur + ' ' + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
      }
      if (cur) lines.push(cur);
      return lines;
    }
    para(x, y, str, size, maxW, lead, opts = {}) {
      let lines = this.wrap(str, size, maxW);
      if (opts.maxLines && lines.length > opts.maxLines) { lines = lines.slice(0, opts.maxLines); lines[lines.length - 1] += ' ...'; }
      lines.forEach((l, i) => this.text(x, y + i * lead, l, size, !!opts.bold, opts.color));
      return y + lines.length * lead;
    }
    blob() {
      const content = this.ops.join('\n');
      const objs = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      ];
      let out = '%PDF-1.4\n';
      const offs = [];
      objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
      const xref = out.length;
      out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
      out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
      const bytes = new Uint8Array(out.length);
      for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
      return new Blob([bytes], { type: 'application/pdf' });
    }
  }
  window.MiniPDF = MiniPDF;
})();
