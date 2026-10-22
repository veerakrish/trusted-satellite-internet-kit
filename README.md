# Trusted Satellite Internet Kit

Three linked interactive web apps and a hub page for the *Secure India's Connected Future* challenge.

| Page | What it covers |
|---|---|
| `index.html` | Hub: the three apps, a 20-minute presentation flow and the challenge summary |
| `app1.html` | **From Earth to Orbit**: one HTTPS request over a LEO satellite service, hop by hop |
| `app2.html` | **Inside India's Internet**: paths, a schematic map, who controls what, 10 controls, simulations, resilience lab |
| `app3.html` | **Design the Protocol**: architecture comparison, 16-threat model with a sovereignty gate, evidence panel, workbench, sandbox, PDF/JSON export, peer review |

Plain HTML, CSS and JavaScript. No framework, no backend and no third-party code.

## Run it

**Offline, no install:** open any file in `docs/` in a browser. Each page is one self-contained HTML file. Keep all four files in the same folder so the navigation links work.

**While editing:** serve `src/` and reload after each change:

```bash
python -m http.server 5173 --directory src
```

Then open http://localhost:5173.

**Build the single-file pages** (writes `docs/`):

```bash
node build.mjs
```

## Publish on GitHub Pages

Push the repository, then in **Settings → Pages** choose *Deploy from a branch*, branch `main`, folder `/docs`.

## Where things live

```
src/
  index.html, app1.html, app2.html, app3.html   page shells
  shared/base.css       design system (navy, gold, neon accents), shared across all apps
  shared/shell.js       top bar, Teacher/Demo/Reduce-motion modes, narration, claims, glossary, tabs, quiz
  shared/netdiagram.js  clickable SVG network diagram and hop-by-hop packet player
  shared/pdf.js         tiny one-page PDF writer used by the App 3 export
  data/claims.js        every factual claim with tag, sources and last-checked date
  data/glossary.js      shared glossary
  data/protocol.js      App 3 threat model, building blocks and scoring effects
  app1/ app2/ app3/     per-app logic and styles
build.mjs               inlines CSS and JS into docs/*.html
```

## Editing content

- **Facts:** edit `src/data/claims.js`. A claim without a source and a check date is refused at render time and never shown, so update the date whenever you re-check a source.
- **Threats and scoring:** edit `src/data/protocol.js`. The App 3 "How scoring works" panel is generated from this file, so the published rules always match the code.
- **Contest dates:** edit the `DATES` list near the bottom of `src/index.html`.

## Ground rules built into the apps

- Every simulation uses invented data and never touches a real network.
- Claims are tagged: documented / verified fact, general practice, plausible risk, unverified allegation, illustrative or simulated.
- The apps assess architecture and control, never the nationality of a company, and do not allege wrongdoing by any named company.
- The India map is a schematic: approximate city positions and no boundaries.
