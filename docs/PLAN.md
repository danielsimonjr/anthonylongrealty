# Anthony Long Realty demo — site plan

This is the build plan for a static demo of Anthony Long Realty. Composer implements it one pull request at a time. The reviewer checks each pull request against this document. This pull request adds the plan only. It does not add site pages, turn on GitHub Pages, or create tags.

Studied on 30 October 2026:

- [Sunrise Realtors](https://www.sunrise-realtors.com/) is the structural template.
- [Laura Cano Real Estate](https://www.lauracanorealestate.com/) is the local voice and neighborhood tone.
- [Realtor Keith Stone](https://www.realtorkeithstone.com/) is the per-city guide and home-value page pattern.

Adapt the structure. Write new sentences and draw new graphics. Leave their words, photos, colors, and testimonials on their sites.

## 1. Goal

Publish a small static demo for Anthony Long Realty, an independent Texas real-estate practice. The live demo URL is:

`https://danielsimonjr.com/anthonylongrealty/`

The repo is `danielsimonjr/anthonylongrealty`, a project site under the `danielsimonjr` user site. That user site uses the custom domain `danielsimonjr.com`, so this project is served on the subpath `/anthonylongrealty/`. The practice’s own domain, `anthonylongrealty.com`, is a fact about the business. This demo does not use it, and this repo does not claim it with a `CNAME` file.

People should be able to read what the practice does, open a short guide for DeSoto, Cedar Hill, Duncanville, and Lancaster, look at clearly fake sample listings, and fill out a contact form or a home-value form. Both forms stay on the page. They do not send anywhere.

## 2. Rules for facts

The only facts available for this demo are:

- The name is Anthony Long Realty.
- The practice is an independent Texas realtor.
- The demo focuses on DeSoto, Cedar Hill, Duncanville, and Lancaster, in southwest Dallas County.
- There is no IDX or MLS feed.
- The demo is hosted at `https://danielsimonjr.com/anthonylongrealty/`.
- `anthonylongrealty.com` is the practice’s real domain and is not the host of this demo.

Everything else is unknown. Unknown facts stay visible and marked. They are never filled with plausible fiction.

| Topic | What the page shows |
| --- | --- |
| Phone | `Placeholder — not on file` |
| Email | `Placeholder — not on file` |
| Office address | `Placeholder — not on file` |
| License number, broker or sales agent status, sponsoring broker | `Placeholder — not on file` |
| Photo of Anthony | A monogram block, labeled as a placeholder portrait |
| Years in business, homes sold, sales volume, retention, rankings | Omitted. There is no stat row. |
| Testimonials | Three sample cards, each labeled as a sample, with no person’s name |
| Listing address, price, beds, baths, photos | Sample cards with those fields withheld |
| Social profiles | Omitted |
| REALTOR® membership | Unknown, so the word REALTOR and the REALTOR® mark do not appear |

Use the placeholder sentence `Placeholder — not on file` everywhere a missing fact would have been a phone, email, address, or license. Do not invent a `555` number, an `@anthonylongrealty.com` mailbox, a street, or a license digit.

JSON-LD and other machine-readable fields omit unknown facts. A placeholder phone in visible text is honest. The same placeholder inside `telephone` or `review` schema is a fake listing. See the SEO section.

## 3. What the reference sites contribute

### Sunrise Realtors — structure

Public navigation is five destinations: Home, About, Properties, Blogs, Contact. The homepage stacks a hero, a number band, service cards, a broker biography, featured properties, a testimonial wall, article teasers, a question list, and a closing contact band. About repeats the broker story and adds a five-step process: discover, tour, consult and negotiate, documents, close. Properties is a featured-homes grid. Blogs is a short list of local articles. Contact shows address, phone, and email. The footer repeats the path and the contact block.

Take the shape: one practice as the brand, service cards, a testimonial wall, a five-step process, a listings grid, a local-reading section, questions, and a lead form. Drop the number band. Replace the blog with city guides. Replace featured homes with sample cards.

### Laura Cano — voice and local focus

The site is one page in plain sentences. It speaks to buyers and sellers in DeSoto, Lancaster, Cedar Hill, Duncanville, and nearby Dallas–Fort Worth cities. Buying and selling are each five steps. A neighborhoods section is local knowledge without a separate article per city. There is a contact form.

Take the tone: short sentences, everyday words, buy steps and sell steps, and the same four cities. Leave her biography, her years of experience, her loan-product cards, and her contact details. This demo does not publish loan types, credit-score minimums, or down-payment rules.

### Keith Stone — city guides and home value

Area pages exist for Cedar Hill and DeSoto, and the homepage also names Lancaster and Duncanville. Each area page is a short civic introduction plus a repeated bio. A separate page asks what a home is worth and sends people to a form. Testimonials name real clients.

Take the page types: one guide per city, plus a home-value page. Write new introductions. Spell the city **DeSoto**. Use no client names and no review text from that site.

### Lines that stay on the reference sites

Do not reuse their headlines, bios, reviews, or image URLs. In particular, do not use “Real Estate Made Simple, Smart, and Yours.”, “Trusted by Many, Loved by All”, “A New MILESTONE in Real Estate service”, or “Let’s Find Your Home (Or Sell It Fast)”. Do not hotlink `cdn.prod.website-files.com`, Squarespace, or Placester assets.

## 4. Stack

Use **Eleventy 3** with Nunjucks templates, plain CSS, and two small deferred scripts (`nav.js`, `forms.js`). Install the current 3.x release when the scaffold pull request opens, commit `package-lock.json`, and stay on Eleventy 3.

Eleventy fits this brochure:

- `pathPrefix` rewrites every internal URL for a GitHub Pages project.
- One layout holds the skip link, demo banner, header, footer, and notice links.
- City guides, sample listings, services, and process steps are data files.
- The published files are static HTML, CSS, and JS, which is what the Lighthouse targets assume.
- GitHub Actions builds the site and, later, can upload a Pages artifact.

Plain HTML would copy the header and the base path across ten pages. Astro can do the same job with a larger toolchain than this site needs. Build pull requests stay on Eleventy.

Node.js 22. Commit `.nvmrc` with `22`. Use npm. Add `"type": "module"` and an ESM `eleventy.config.js`.

### Config that must exist

```js
export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  return {
    pathPrefix: "/anthonylongrealty/",
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
```

Internal links, stylesheets, scripts, images, and canonical paths go through the `url` filter:

```njk
<link rel="stylesheet" href="{{ '/assets/css/tokens.css' | url }}">
<a href="{{ '/about/' | url }}">About</a>
```

`pathPrefix` changes URLs. It does not move files into `_site/anthonylongrealty/`. GitHub Pages adds the project folder when it hosts the artifact, and `eleventy --serve` does the same locally. A second manual prefix, a `<base href>` tag, or an output folder also named `anthonylongrealty` will double the path. Do not add any of those.

Scripts:

| Script | Command |
| --- | --- |
| `dev` | `eleventy --serve` |
| `build` | `eleventy` |
| `check` | build, then HTML validation, link check, and `scripts/guard.mjs` |

Local URL: `http://127.0.0.1:8080/anthonylongrealty/`.

## 5. Hosting and the base path

| Item | Value |
| --- | --- |
| GitHub repo | `danielsimonjr/anthonylongrealty` |
| Pages type | Project site |
| Public demo origin | `https://danielsimonjr.com/anthonylongrealty/` |
| Also reachable, when Pages is on | `https://danielsimonjr.github.io/anthonylongrealty/` |
| Canonical origin | `https://danielsimonjr.com` |
| `pathPrefix` | `/anthonylongrealty/` |
| Deploy style | GitHub Actions artifact (`actions/upload-pages-artifact` then `actions/deploy-pages`) |
| Custom domain on this repo | None. No `CNAME` file. |

`anthonylongrealty.com` is not configured on this repository. A `CNAME` file would attach a different domain and break the `/anthonylongrealty/` URLs.

Every root-relative URL starts with `/anthonylongrealty/`. That includes CSS, JS, images, the favicon, navigation, canonical, `og:url`, `og:image`, sitemap locations, and JSON-LD `url`. Fragment-only links (`href="#process"`) are fine. External links are the TREC PDFs and nothing else.

Trailing-slash permalinks (`/about/index.html` served as `/about/`). The 404 document is the exception: permalink `404.html`, so Pages can find it at the artifact root.

This plan phase does not enable Pages. The deploy workflow, when it is added, is `workflow_dispatch` only. It has no `push` trigger. Enabling Pages in the repo settings, calling the Pages API, and creating git tags are out of scope for every pull request in this list. A person can turn Pages on later. Until then, `main` stays green because deploy does not run on push.

`robots.txt` shipped by this repo is served at `https://danielsimonjr.com/anthonylongrealty/robots.txt`. Crawlers look for `https://danielsimonjr.com/robots.txt`, which belongs to the user site. Still publish a project `robots.txt` and a sitemap. Do not edit the user-site repo from these pull requests.

## 6. Page list

Sunrise’s five slots map like this:

| Sunrise slot | Demo page | URL |
| --- | --- | --- |
| Home | Home | `/` |
| About | About, with buy and sell steps | `/about/` |
| Properties | Sample listings | `/listings/` |
| Blogs | Area index and four city guides | `/areas/`, `/areas/desoto/`, `/areas/cedar-hill/`, `/areas/duncanville/`, `/areas/lancaster/` |
| Contact | Contact form | `/contact/` |
| Keith’s home-value page | Home value form | `/home-value/` |
| — | Not found | `404.html` |

There is no blog, no listing-detail route, no loan page, and no property-management or commercial page.

Header links, in order: Home, About, Listings, Areas, Home value, Contact. Cities are links in the footer and on the areas index, not a hover menu.

### Home — `/`

Section order:

1. Demo banner.
2. Header.
3. Hero. One sentence on helping people buy and sell in the four cities. Two links: Contact, and Home value. No statistics.
4. Services. Six cards.
5. The practice. Short original paragraph plus the placeholder portrait and the placeholder license line. Link to About.
6. Process preview. The five buying steps, with a link to `/about/#process`.
7. Sample listings. Three cards and the listings disclaimer. Link to `/listings/`.
8. Sample quotes. Three placeholder testimonials.
9. City cards. Four links.
10. Questions. `details`/`summary`, no script. Four to six questions from the list below.
11. Closing band with the same two links as the hero.
12. Footer, including the TREC links.

### About — `/about/`

1. H1 that the practice is Anthony Long Realty.
2. A placeholder biography block. The heading says the biography is not on file. Body copy does not invent childhood, family, years, production, or hobbies.
3. Placeholder row: phone, email, office, license.
4. `#process`. Buying, five steps. Selling, five steps.
5. The four cities, with links.
6. Closing links to Contact and Home value.

Buying steps, in order, as the step headings:

1. Talk through the goal
2. Line up financing
3. Tour homes that fit
4. Write the offer
5. Inspect and close

Selling steps, in order:

1. Walk the house and the goal
2. Talk through price
3. Get the house ready
4. Showings and offers
5. Contract to closing

Under “Line up financing”, say a lender is a separate conversation. Name no lender. Quote no rate, credit score, or down payment.

Under “Talk through price”, say a home-value conversation is not an appraisal.

### Listings — `/listings/`

Lead with this sentence, visible and in the H1’s section, above the cards:

> Sample listings. This demo is not connected to an MLS or IDX feed. These are not homes for sale.

Three cards, built from data:

| id | title | city | address | price | beds | baths |
| --- | --- | --- | --- | --- | --- | --- |
| `sample-a` | Sample home A | DeSoto | Address withheld — sample only | Price not listed | omitted | omitted |
| `sample-b` | Sample home B | Cedar Hill | Address withheld — sample only | Price not listed | omitted | omitted |
| `sample-c` | Sample home C | Duncanville | Address withheld — sample only | Price not listed | omitted | omitted |

Each card shows a “Sample” label. The picture is a flat color panel with the city name, `aria-hidden="true"`. There is no fourth card required for Lancaster; the Lancaster guide can say sample listings for that city are not in this demo and link to contact.

Cards do not link to a detail page, a map pin, Zillow, HAR, or Realtor.com. The action link is “Ask about a real search” and points to `/contact/?topic=buying`.

### Areas — `/areas/` and four guides

The index introduces the demo’s focus on southwest Dallas County and links to the four guides. Each guide uses one template and this outline:

1. H1 with the city name.
2. Two to four original sentences placing the city in southwest Dallas County.
3. H2 “Buying in {City}”.
4. H2 “Selling in {City}”.
5. H2 “Sample listings”. Reuse a card when the city matches; otherwise say there is no sample card for that city.
6. Link to Contact and Home value.
7. Optional “Sources checked” list.

A geographic sentence may name a highway, a park, or a neighboring city only when the pull request cites a primary page from the city, TxDOT, the Texas State Historical Association, or the Census Bureau, and prints that URL under “Sources checked”. Population, median price, tax rate, school rating, crime, “best” streets, “All-America City”, and “City of Champions” are omitted unless that same source treatment is in the pull request. The default guide has no numbers and no superlatives.

Fair housing: city copy describes streets and civic geography. It does not describe the people who live there, school quality, safety, or who the neighborhood is “for”.

### Home value — `/home-value/`

Explain, in plain sentences, that this is a request for a conversation, that it is not an appraisal, and that the demo does not calculate a price. Then show the home-value form. After a valid submit, the page shows only:

> This demo did not send your request and did not calculate a value.

### Contact — `/contact/`

The contact form, then the placeholder phone, email, office, and license as text. Those four lines are not `tel:` or `mailto:` links.

### Not found — `404.html`

A short message and a link home. Same layout, same banner, a unique title.

### Questions on the homepage

Write original answers. Cover these points:

- This demo has sample cards, not a live search.
- The guides cover DeSoto, Cedar Hill, Duncanville, and Lancaster.
- A home-value request is not an appraisal.
- The forms do not send, and the phone and email are placeholders.
- What the practice is paid is not listed here. Compensation is negotiable and is not set on this demo.

Do not answer with lease rules, early termination, or investment-risk copy from the Sunrise question list.

## 7. Copy

Voice is the business, in short sentences. “Anthony Long Realty” and “we” are fine. A fictional first person (“I grew up here”, “I have sold…”) is not. Everyday words. No production claims, no “trusted by many”, no urgency, no exclamation marks as a style.

Required sentences, used as written:

| Where | Sentence |
| --- | --- |
| Banner on every page | Demo site. Phone, license, photos, and reviews are placeholders. Forms on this site do not send. |
| Listings and the home listings strip | Sample listings. This demo is not connected to an MLS or IDX feed. These are not homes for sale. |
| Each quote | Sample quote — not a real testimonial. |
| Each quote attribution | Placeholder name — not a real client |
| Quote body | This space is reserved for a client review. |
| Contact status | This demo did not send your message. Nothing was saved. |
| Home-value status | This demo did not send your request and did not calculate a value. |
| Missing phone, email, office, license | Placeholder — not on file |
| Portrait | Placeholder portrait. No photo is on file. |

The quote body stays that one sentence so the wall cannot be read as a real review.

Service card titles:

1. Buying a home
2. Selling a home
3. A home-value conversation
4. The four cities
5. First-time buyers
6. Moving to southwest Dallas County

Card body copy is original, two or three sentences, and makes no promise about price, speed, or results.

## 8. Design tokens

Put these in `src/assets/css/tokens.css` and use them from `site.css`. The palette is limestone, cedar, and hill green, chosen for this demo. It is not the Sunrise near-monochrome blue, not a franchise red, and not a color sampled from the reference sites.

Contrast against `--color-paper` (`#f7f3ec`) is noted below. Body text uses `--color-ink` or `--color-muted`. Links use `--color-cedar-dark` or `--color-hill`. `--color-clay` is for borders and large decorative shapes only. Clay on paper is about 3.4:1, so it is never text, never a small icon that carries meaning, and never a focus ring.

```css
:root {
  --color-ink: #1c1915;            /* 15.8:1 on paper */
  --color-muted: #5e574e;          /* 6.4:1 on paper */
  --color-paper: #f7f3ec;
  --color-paper-raised: #fffdf8;
  --color-sand: #e6dcc8;
  --color-line: #d9d0c2;
  --color-cedar: #8c4a2f;          /* 6.1:1 as large text; prefer cedar-dark for UI text */
  --color-cedar-dark: #5c301c;     /* 10.0:1 on paper; white text 10.9:1 */
  --color-hill: #3d5c4d;           /* 6.7:1 on paper */
  --color-hill-dark: #24382e;      /* white text 12.3:1 */
  --color-clay: #c46b4a;           /* decorative only */
  --color-focus: #0b5fff;          /* 4.6:1 on paper; non-text focus ring */
  --color-sample: #7a4e00;         /* 5.3:1 on sand, 6.5:1 on paper */

  --font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
  --font-body: system-ui, -apple-system, "Segoe UI", sans-serif;

  --text-xs: 0.875rem;   /* 14px, above the 10pt TREC link floor */
  --text-sm: 1rem;
  --text-md: 1.125rem;
  --text-lg: 1.5rem;
  --text-xl: 2rem;
  --text-2xl: 2.75rem;
  --leading-body: 1.6;
  --leading-tight: 1.2;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;
  --space-9: 6rem;

  --radius: 0.75rem;
  --measure: 65ch;
  --content: 72rem;
  --header-h: 4.25rem;
  --shadow: 0 1px 2px rgb(28 25 21 / 0.06);
}
```

No web fonts. No dark theme in this demo. One light theme keeps the contrast pairs above testable.

Layout:

- Content column `--content`, centered, with `1rem` of side padding.
- Prose blocks max out at `--measure`.
- Breakpoints at `40rem`, `48rem`, and `60rem`.
- Below `48rem` the header links move into a disclosure under the header, not a modal.
- Service cards, listing cards, and city cards: one column below `40rem`, two columns from `40rem` to `60rem`, three columns from `60rem` up. City cards on the area index stay two columns from `40rem` up.
- Primary button: paper text on `--color-cedar-dark`. Secondary button: ink text on `--color-sand` with an ink border.
- Focus: `:focus-visible` gets a `3px` solid `--color-focus` outline with `3px` offset. Do not remove outlines.
- Sample and placeholder badges: ink or `--color-sample` text on `--color-sand`, plus the words “Sample” or “Placeholder”. Color is not the only signal.
- Motion is limited to border and background changes. Wrap any motion in `@media (prefers-reduced-motion: reduce)`. No autoplaying carousel, no scroll hijack, no layout shift from late fonts or images.

Graphics are original SVG or CSS. A favicon and a small social PNG (cedar field, the words “Anthony Long Realty”, the word “Demo”) are created in the repo. No photos of people, houses, or skylines, and no files downloaded from the reference sites.

## 9. Shared chrome

`src/_includes/layouts/base.njk` renders, in order:

1. Skip link, “Skip to content”, pointing at `#content`.
2. Demo banner.
3. Header with the practice name linking home, and the six nav links.
4. `<main id="content">`.
5. Footer.

Footer order:

- Practice name and “Demo site”.
- The six nav links.
- The four city links.
- Phone, email, office, license, each `Placeholder — not on file`.
- TREC notice links (section 10).
- “Equal Housing Opportunity” with a small equal-housing house mark.
- `© {year} Anthony Long Realty.` The year is the build year.

The mobile nav control is a `<button>` with `aria-expanded` and `aria-controls`. Escape closes it and returns focus to the button. It does not trap focus, because it is a disclosure, not a dialog.

## 10. Texas notices and fair housing

On every page, in the footer, which is on the homepage and is readily noticeable:

- Link text, at least `--text-xs` (14px, above 10 point): [Texas Real Estate Commission Consumer Protection Notice](https://www.trec.texas.gov/sites/default/files/pdf-forms/CN%201-5_0.pdf). The form is CN 1-5, effective 1 September 2023. Link the PDF. Do not redraw the notice.
- Link text, same size: [Texas Real Estate Commission Information About Brokerage Services](https://www.trec.texas.gov/sites/default/files/pdf-forms/IABS%201-2.pdf). The form is IABS 1-2, effective 1 January 2026.

TREC’s rule asks for a **completed** IABS, with the license holder’s contact block filled in. Those fields are not on file. Do not complete the PDF with invented license numbers, a guessed sponsoring broker, or a guessed phone. Link the official blank PDF, and put this sentence next to the link, same size:

> Demo: this official form is not filled in. License holder contact details are not on file.

When real license details exist, replace that link with a completed IABS and remove the demo sentence. That replacement is outside this plan.

Also in the footer: the words “Equal Housing Opportunity” and a simple house mark. Do not add a REALTOR® mark.

City-guide fair-housing rule is in section 6.

## 11. Forms

Two forms, one partial each: `lead-form.njk` and `value-form.njk`. The homepage does not embed them. It links to the two pages. That keeps one status region per form and one place to test.

Shared behavior:

- `method="post"`.
- `action="#contact-demo"` or `action="#value-demo"`. The target id exists on the status element.
- `data-formspree-action=""` on the `<form>`. The value stays an empty string for this demo.
- An HTML comment in the partial documents the future value `https://formspree.io/f/REPLACE_ME`.
- `forms.js` listens for submit, calls `preventDefault()`, and runs `reportValidity()`. When the form is valid, it reveals the status sentence from section 7, moves focus to that status node (`tabindex="-1"`), and sets `role="status"` with `aria-live="polite"`.
- The script does not call `fetch`, `XMLHttpRequest`, `sendBeacon`, or assign `form.action` to an `http` URL.
- A honeypot field named `company`, positioned off-screen with CSS that still leaves it available to assistive tech as a hidden field (`aria-hidden="true"` and `tabindex="-1"`). When it has a value, show the same “did not send” status and still do not send.
- Submit buttons say “Submit demo form”.
- Visible `<label for>` on every control. `autocomplete` on name, email, and tel. The placeholder attribute is a hint, never the only name of the field.
- Required fields use the `required` attribute. Errors use the browser’s validation UI plus the status region. Color is not the only error signal.
- `topic` on the contact page may be preselected from the query string. Allowed values are only `buying`, `selling`, `value`, and `question`. Any other query value is ignored.

Contact fields: name (required), email (required), phone (optional), “I am” select (`buying`, `selling`, `value`, `question`), city select (DeSoto, Cedar Hill, Duncanville, Lancaster, Other), message (required), honeypot.

Home-value fields: name, email, phone optional, city select, street address optional (the visitor’s own text), timeframe select (`curious`, `this-year`, `already-listed`), note optional, honeypot.

`input type="tel"` and `type="email"` are allowed. `href="tel:` and `href="mailto:` are not, until a real number and a real mailbox are on file.

## 12. Accessibility

Target WCAG 2.2 AA, and a Lighthouse accessibility score of 100.

- `html` `lang="en"`.
- One `h1` per page. Heading levels increase by one.
- Landmarks: `header`, `main`, `footer`, and a `nav` with `aria-label="Primary"`.
- Skip link is the first focusable control.
- Text contrast at least 4.5:1. UI boundaries and the focus ring at least 3:1.
- Primary controls are at least 44 by 44 CSS pixels. Footer text links are at least 24 pixels tall in the hit area.
- Forms follow section 11.
- Quotes use `figure` / `blockquote` / `figcaption`, with the sample label in the text.
- Questions use `details` and `summary`.
- The mobile nav follows section 9.
- Images that are information have alt text. Decorative SVG is `aria-hidden="true"`.
- The page is usable at 200% zoom and at a 320px-wide viewport. No horizontal scroll on the homepage.
- Keyboard path to test on every pull request that touches UI: skip link, header links, mobile disclosure, both forms, details elements, and footer notice links.

## 13. SEO

The demo is allowed to be crawled. Titles and descriptions say it is a demo, so a search snippet does not look like a brokerage with live listings. Do not add `noindex`. Lighthouse treats `noindex` as a failed crawl audit, and the copy already states the limits.

Title pattern: `{page} · Anthony Long Realty (demo)`. The homepage title is `Anthony Long Realty (demo) · Southwest Dallas County`. Keep titles unique and near 60 characters.

Meta descriptions are unique, near 150 characters, and include the word “demo”. City descriptions name that city.

On every indexable page:

- Canonical `https://danielsimonjr.com/anthonylongrealty/...` with the trailing slash. The 404 page has no canonical.
- `meta name="description"`.
- Open Graph `og:type`, `og:title`, `og:description`, `og:url`, `og:image`, `og:locale` (`en_US`).
- `twitter:card` = `summary_large_image`.
- The social image is the local PNG, absolute URL on the demo origin.

`src/robots.njk` permalink `robots.txt`:

```text
User-agent: *
Allow: /

Sitemap: https://danielsimonjr.com/anthonylongrealty/sitemap.xml
```

`src/sitemap.njk` permalink `sitemap.xml` lists the ten HTML routes (not the 404) with absolute `loc` values and `<lastmod>` from the build date.

JSON-LD on the homepage, and a smaller version (name, url) on inner pages. Allowed shape:

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Anthony Long Realty",
  "url": "https://danielsimonjr.com/anthonylongrealty/",
  "areaServed": [
    { "@type": "City", "name": "DeSoto", "containedInPlace": { "@type": "State", "name": "Texas" } },
    { "@type": "City", "name": "Cedar Hill", "containedInPlace": { "@type": "State", "name": "Texas" } },
    { "@type": "City", "name": "Duncanville", "containedInPlace": { "@type": "State", "name": "Texas" } },
    { "@type": "City", "name": "Lancaster", "containedInPlace": { "@type": "State", "name": "Texas" } }
  ]
}
```

Omit `telephone`, `email`, `image`, `address`, `identifier`, `aggregateRating`, and `review`. Sample quotes are HTML only.

Internal link text names the destination (“DeSoto guide”, “Sample listings”). “Click here” is not used.

## 14. Lighthouse targets

Measure with Lighthouse mobile, default simulated throttling, against `eleventy --serve`. Pages: `/`, `/contact/`, `/listings/`, and `/areas/desoto/`.

| Metric | Target |
| --- | --- |
| Performance | ≥ 95 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | ≥ 95 |
| LCP | ≤ 2.5 s |
| CLS | ≤ 0.1 |
| Total blocking time | ≤ 200 ms |

How to get there: no web fonts, no third-party scripts, no iframes, no photo hero, CSS and JS deferred and small, dimensions stable because there are no late-loading images. The homepage document plus CSS plus JS should stay under 150 KB uncompressed.

Lighthouse is a merge gate on the SEO pull request (the last build PR), recorded in that pull request’s body. It is not a required check on earlier pull requests. It is also not a GitHub Actions required check: lab scores move around on hosted runners. The required automated checks are the ones in section 15.

## 15. CI

Workflow file `.github/workflows/ci.yml`, on `pull_request` and on `push` to `main`.

Jobs, all required:

1. **Build** — `actions/checkout`, `actions/setup-node` for Node 22 with the npm cache, `npm ci`, `npm run build`.
2. **HTML validation** — Temurin 21 via `actions/setup-java`, then the Nu Html Checker through the `vnu-jar` npm package, errors failing the job, CSS and SVG included. Validate the built files in `_site`, not the Nunjucks source. Confirm the CLI name from that package’s help on the day it is installed.
3. **Link check** — start `npx @11ty/eleventy --serve --port=8080`, wait until `http://127.0.0.1:8080/anthonylongrealty/` responds, then run lychee with fragment checking against that URL. Retry external URLs a few times. The TREC PDFs are part of the crawl. A plain static server of `_site` will not see `/anthonylongrealty/` routes; use Eleventy’s server.
4. **Guards** — `node scripts/guard.mjs` reads `_site` and fails the job when any rule below misses.

Guard rules:

- Every `href` or `src` or CSS `url(` that starts with `/` continues with `/anthonylongrealty/`.
- No `<base` tag.
- No `href="tel:` and no `href="mailto:`.
- No `formspree.io` URL except a comment or string that contains `REPLACE_ME`.
- No form `action` starting with `http`.
- Built JS has no `fetch(`, `XMLHttpRequest`, or `sendBeacon`.
- The REALTOR mark does not appear. The phrase “IDX feed is connected” does not appear. The approved disclaimer “not connected to an MLS or IDX feed” is allowed.
- Placeholder contact slots contain `Placeholder — not on file`.
- Each built HTML page except `404.html` has exactly one `<h1`, a canonical link on the demo origin, and a meta description.
- `404.html` exists.
- Sample listing data does not contain a street number.

`vnu` and lychee are the CI check this plan promises. The guards exist so the base path and the placeholder rules fail in CI instead of in review comments.

Deploy workflow `.github/workflows/pages.yml`:

- Trigger: `workflow_dispatch` only.
- Permissions: `contents: read`, `pages: write`, `id-token: write`.
- Concurrency group `pages`, without canceling an in-progress deploy.
- Build with the same Node 22 steps, upload the `_site` directory with `actions/upload-pages-artifact`, then `actions/deploy-pages`.
- A comment at the top of the file says Pages is not enabled by this workflow and that nobody should add a `push` trigger as part of these build pull requests.

Do not add a `CNAME` file. Do not call the Pages API. Do not create tags.

## 16. Repository layout

```text
eleventy.config.js
package.json
package-lock.json
.nvmrc
.github/workflows/ci.yml
.github/workflows/pages.yml
scripts/guard.mjs
docs/PLAN.md
src/_data/site.json
src/_data/services.json
src/_data/process.json
src/_data/listings.json
src/_data/areas.json
src/_data/quotes.json
src/_includes/layouts/base.njk
src/_includes/partials/header.njk
src/_includes/partials/footer.njk
src/_includes/partials/banner.njk
src/_includes/partials/lead-form.njk
src/_includes/partials/value-form.njk
src/_includes/partials/listing-card.njk
src/_includes/partials/quote.njk
src/assets/css/tokens.css
src/assets/css/site.css
src/assets/js/nav.js
src/assets/js/forms.js
src/assets/img/favicon.svg
src/assets/img/og.png
src/assets/img/eho.svg
src/index.njk
src/about.njk
src/listings.njk
src/areas.njk
src/areas/desoto.njk
src/areas/cedar-hill.njk
src/areas/duncanville.njk
src/areas/lancaster.njk
src/contact.njk
src/home-value.njk
src/404.njk
src/robots.njk
src/sitemap.njk
```

`src/_data/site.json` holds `name`, `demoOrigin` (`https://danielsimonjr.com`), `basePath` (`/anthonylongrealty/`), and `placeholder` (`Placeholder — not on file`). Phone, email, license, and address keys are JSON `null`. Later pull requests may replace a null only when a real value is supplied in writing. They do not invent one.

## 17. Ordered build pull requests

Merge to `main` in this order. One branch per pull request. Each branch starts from current `main` after the previous merge. The reviewer uses section 18.

### PR 1 — Scaffold, tokens, stubs, CI

Eleventy 3, `pathPrefix`, token file, base layout with a placeholder header/footer, `site.json`, and a stub page for every route in section 6 so nav links resolve. Stub body is a single H1 and one sentence: “Content arrives in a later pull request.” CI from section 15 is green, including vnu, lychee, and the guards that already apply (base path, one h1, 404, no tel/mailto). `pages.yml` is dispatch-only. README tells a developer to run `npm run dev` and open `http://127.0.0.1:8080/anthonylongrealty/`.

Acceptance: `npm run check` passes. View source of the stub homepage shows asset URLs under `/anthonylongrealty/`. No `CNAME`. Pages remains off.

### PR 2 — Chrome and accessibility shell

Demo banner, header, footer, skip link, mobile disclosure, TREC links, equal-housing line, focus styles, reduced-motion rule. Stubs still have no marketing copy.

Acceptance: keyboard path in section 12 works on a stub page at 320px and at 1280px. Footer links use the required words and point at CN 1-5 and IABS 1-2. Banner sentence matches section 7. Lighthouse accessibility on the stub homepage is 100 if it is cheap to run; it is not a CI job.

### PR 3 — Home

Replace the home stub with the section order in section 6. Services, process preview, three sample cards, three sample quotes, four city cards, questions. CTA links only. No embedded form yet.

Acceptance: disclaimer and quote sentences match section 7. No stat row. No copied headline from section 3. Internal links use the `url` filter.

### PR 4 — About and the five-step process

About page from section 6, including both step lists and the empty biography block.

Acceptance: step headings match section 6 in order. No biography facts. `#process` is a real id. Financing and price blurbs follow section 6.

### PR 5 — Sample listings

Listings page and the shared card partial. Data file matches the table in section 6.

Acceptance: the disclaimer is the first content in the section. No street numbers, prices, beds, baths, maps, or outbound listing links. “Ask about a real search” lands on `/contact/?topic=buying`.

### PR 6 — City guides

Area index and the four city pages from the template in section 6. DeSoto spelling with the capital S.

Acceptance: each page has original sentences. Any highway or landmark has a source line. No school, crime, demographic, or price claims. Fair-housing rule holds. Sample cards filter by city.

### PR 7 — Contact and home-value forms

Both forms, `forms.js`, query allowlist, status text from section 7.

Acceptance: with JS on, a valid submit stays on the page, shows the demo status, and moves focus to it. The network panel shows no request caused by the submit. An empty required field is reported by `reportValidity()` and does not show the success status. `data-formspree-action` is empty. Guards still pass. With JS off, the form posts to the fragment and does not leave the site.

### PR 8 — SEO, sitemap, social image, Lighthouse

Per-page titles and descriptions, canonicals, `robots.txt`, `sitemap.xml`, JSON-LD, favicon, `og.png`. Run the Lighthouse set from section 14 and paste the four scores and LCP, CLS, and TBT for all four URLs into the pull request body.

Acceptance: scores meet section 14. Schema omits the forbidden properties. Sitemap locations use the demo origin and the base path. `npm run check` is green. Pages is still not enabled. No tag.

After PR 8, a person may enable GitHub Pages with “GitHub Actions” as the source and run the dispatch workflow. That step is not one of these pull requests.

## 18. Reviewer checklist

Fail the pull request when any of these is true:

- Copy or images from Sunrise, Laura Cano, or Keith Stone appear, including their headlines and testimonials.
- A phone, email, street, license, production stat, or biography fact appears that is not in section 2.
- A testimonial shows a person’s name, or schema includes `review` or `aggregateRating`.
- A listing looks like a real home for sale, or an IDX/MLS widget is present.
- A form can submit to Formspree, another host, or a `mailto:`.
- An asset, canonical, or internal link is missing `/anthonylongrealty/`.
- A `CNAME` file, a Pages settings change, a tag, or a `push` trigger on `pages.yml` is included.
- The REALTOR® mark is used.
- The IABS PDF is rebuilt with guessed license data.
- HTML validation or the link check fails.
- The pull request mixes two steps from section 17.

## 19. Out of scope

- Turning on GitHub Pages, DNS changes, and certificates.
- Pointing `anthonylongrealty.com` at this repo.
- Git tags and releases.
- IDX, MLS, RESO, or saved searches.
- A live Formspree form id, a CRM, or email delivery.
- Analytics, chat widgets, map embeds, and web fonts.
- Loan-product pages, property management, commercial real estate, and a blog.
- Dark mode, a listing detail page, and a second language.
