// Inlines every local stylesheet and script so each page becomes one offline HTML file.
// Usage: node build.mjs   →   docs/index.html, docs/app1.html, docs/app2.html, docs/app3.html
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const out = join(root, 'docs');
// The rules page is published only when PUBLISH_RULES=1; otherwise links to it are hidden.
const withRules = process.env.PUBLISH_RULES === '1';
const pages = ['index', 'app1', 'app2', 'app3', ...(withRules ? ['rules'] : [])];
if (!withRules) rmSync(join(out, 'rules.html'), { force: true });

mkdirSync(out, { recursive: true });
const read = (rel) => readFileSync(join(src, rel), 'utf8');

for (const page of pages) {
  let html = read(`${page}.html`);
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>\n${read(href)}\n</style>`);
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, s) => `<script>\n${read(s).replace(/<\/script/gi, '<\\/script')}\n</script>`);
  if (!withRules) html = html.replace('</head>', '<script>window.KIT_NO_RULES = true;</script></head>');
  if (/(href|src)="(?!https?:|#|app\d\.html|index\.html|rules\.html)[^"]+\.(css|js)"/.test(html)) throw new Error(`${page}: unresolved local asset`);
  writeFileSync(join(out, `${page}.html`), html);
  console.log(`docs/${page}.html  ${(html.length / 1024).toFixed(0)} KB`);
}
writeFileSync(join(out, '.nojekyll'), '');
