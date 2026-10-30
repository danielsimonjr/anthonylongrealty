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

Runs a production build, HTML validation (vnu), link check (lychee against the Eleventy dev server), and repository guard rules.

## Deploy

GitHub Pages is not enabled from these build pull requests. When Pages is configured on the repository, use the **Deploy Pages** workflow (`workflow_dispatch`).

Public demo URL (when hosted): `https://danielsimonjr.com/anthonylongrealty/`
