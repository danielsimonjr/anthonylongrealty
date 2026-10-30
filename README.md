# anthonylongrealty

Static demo site for **Anthony Long Realty**, built with [Eleventy 3](https://www.11ty.dev/). See [docs/PLAN.md](docs/PLAN.md) for the full specification.

## Local development

Requires Node.js 22 (see `.nvmrc`).

```bash
npm ci
npm run dev
```

Open [http://127.0.0.1:8080/anthonylongrealty/](http://127.0.0.1:8080/anthonylongrealty/).

## Checks

```bash
npm run check
```

Runs a production build, HTML, CSS, and SVG validation (the Nu Html Checker, which needs Java 21), a link check (lychee, against every built route served by Eleventy), and the repository guard rules in `scripts/guard.mjs`.

The link check downloads a pinned, checksum-verified lychee release into `.cache/`. Set `LYCHEE_BIN` to use your own build instead; it must be 0.24 or newer, because older releases silently skip fragment checks.

## Social image

`src/assets/img/og.png` (1200 x 630) is rendered from `scripts/og-source.svg`. To change it, edit the SVG, open it in a browser sized 1200 x 630, and save a screenshot over the PNG. The guard fails if the PNG is missing, the wrong size, or nearly empty.

## Deploy

`.github/workflows/pages.yml` publishes `_site` to GitHub Pages on `workflow_dispatch` and on every push to `main`. It never runs on pull requests.

The workflow does not enable Pages. Until a person chooses **GitHub Actions** as the Pages source in the repository settings, the deploy step fails and nothing is published. This repo has no `CNAME` file: the demo is served from the `danielsimonjr.com` user site under `/anthonylongrealty/`.

Public demo URL: `https://danielsimonjr.com/anthonylongrealty/`
