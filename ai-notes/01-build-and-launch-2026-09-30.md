# every-onion — "Every Onion", Australia's onion-only marketplace aggregator

Live: https://rt567.github.io/every-onion/  ·  Repo: github.com/RT567/every-onion (branch `main`, legacy Pages serves `/`). Local: `~/silly/every-onion`.

## The brief (Rob, verbatim-ish)

"A website called Every Onion where it is like a place that aggregates places that you can buy onions from. It's a stupid idea, it's not meant to actually be useful, but present it in a way where it's actually like trying to be useful. So provide links to as many different places we can buy as many different onions as you can. All different kinds of onions, list them by all different kinds of styles. Should be Australia based, but also have an international onions section. Maybe like an onion codex. Every Onion is what it's called. Really stupid."

## The concept

Total deadpan. It looks and behaves like a sober, credible comparison / directory site (think a government
directory or a plain product-comparison site). The joke is the absurd scope and the seriousness about onions
only. Running bits: the Lacrimal Index (tears, 0–5), "Not an onion" scope page (leek, garlic, chives, onion
weed, The Onion, Tor, ogres…), the NSW "shallot" naming advisory, "Associated Alliums Provision" for
A. fistulosum / chinense / oschaninii, purity notes on preserved products ("Onion, cold.").

## Design direction (changed mid-build — important)

Rob sent three direction notes during the build, all now applied:
1. **Proper desktop layout**, not a stretched phone layout: sidebar filters + multi-column table/grid, checked at 1366×768 and 1920×1080 as well as phone (390 wide).
2. **Professional, not over-stylised**: system sans font only, white/neutral greys, one restrained green accent (`--accent:#1f6b45`), simple tables/cards, no decorative illustrations, no ticker, no novelty fonts, no showy animation. An earlier version had Fraunces/Plex fonts, a cream palette, procedural SVG onion cross-sections, a news ticker and rubber-stamp badges; all removed. Onions are now shown with a plain two-tone colour swatch (skin colour ring + flesh centre).
3. **Function over form**: dense, scannable, sortable tables (Codex and stockist directory have clickable sortable column headers), working search/filters, jump-to navigation, content breadth over styling.

## How it's built

Pure static, no build step, no dependencies:
- `index.html` — shell (masthead with search + state picker, section nav, footer).
- `css/style.css` — everything visual. Tokens on `:root`.
- `js/app.js` — hash router + all views. Routes: `#/` home, `#/codex` (query params: facets e.g. `colour=red,white`, `sort`, `dir`, `view=table|cards`, `q`, `mine=1`), `#/onion/<id>`, `#/stockists` (`cat`, `onion`, `q`, `sort`, `dir`), `#/browse`, `#/world`, `#/grow`, `#/pantry`, `#/names`, `#/not-an-onion`, `#/about`, `#/compare?ids=a,b`, `#/search?q=`.
- `data/data.js` — **all content**, `window.EO = {...}`: `onions` (the Codex), `stockists`, `seeds`, `products`, `names` (naming advisory), `notOnions`, `about`, `scale`, `biosecurity`, `festivals`, `growNote`, `meta.checked`.
- State picker and compare tray persist in localStorage (`eo.state`, `eo.compare`), wrapped in try/catch.

### Data model notes
- Each onion has `id`, `match` (tags that link it to stockist/seed/product `onions` arrays; e.g. brown matches `brown` and `organic-brown`), ratings `pungency` 0–5, `sweetness` 1–5, `keeping` 1–5, `colour`, `skin`/`flesh`/`leaf` hex for the swatch, `shape`, `size`, `season` (months; for `avail:"overseas"` it's the season at origin and the UI labels it so), `avail` (`supermarket|specialist|grow|overseas`), `region`, `uses`, `desc`, `facts`, `aka` (`{n, w}` — w = where; the naming advisory on onion pages matches the user's state against `w`), optional `links` (international official/buy/festival/info links), `advisory`, `status`.
- Stockist `states`: state codes, or `National` / `Online` (always shown whatever state is selected).
- `status: "200"` means the link returned a real page when curl-checked; `"bot-blocked"` means the site 403/429s bots (Woolworths-scale sites, Shopify rate limits, Harris Farm) — shown as "Retailer site".

### How the data was produced
Content was researched on 2026-09-30 by parallel research agents (WebSearch/WebFetch + curl verification of every URL; nothing invented; dead/404/hijacked links dropped). The research JSON and a one-off Python merge script lived in a scratchpad and are **not** in the repo: `data/data.js` is now the source of truth — edit it directly. Codex text was hand-written; international facts drawn from the research with sources in the onion's `links`.

## Deploy
`gh repo create RT567/every-onion --public --source . --push`, then legacy Pages from `main` `/` via
`gh api -X POST repos/RT567/every-onion/pages -f 'source[branch]=main' -f 'source[path]=/'`. All asset paths are relative (served under `/every-onion/`). Pushing to `main` redeploys.

## Gotchas
- **Onions Australia's old domain (onionsaustralia.org.au) redirects to a spam site** — never link it; the industry body now lives at AUSVEG (linked).
- `shop.foodland.com` is a Hawaiian chain, not Foodland SA. `westernonion.com` is Californian.
- Mobile grids must use `minmax(0,1fr)`, not `1fr`, or the wide Codex table blows the layout viewport out (seen as `innerWidth` 943 on a 390 phone).
- Codex defaults to table view on desktop and cards on phones (`DEFAULT_VIEW` via matchMedia at load).
- No prices anywhere, on purpose ("Prices are set by retailers and are not shown").
- Links will rot. Re-check with: `grep -o 'https\?://[^"]*' data/data.js | sort -u | while read u; do printf '%s %s\n' "$(curl -sL -o /dev/null -w '%{http_code}' -A 'Mozilla/5.0' --max-time 15 "$u")" "$u"; done`

## Current state / still to do
- Live and verified at desktop (1366×768, 1920×1080) and phone (390) widths; every route and every onion page rendered with no console errors.
- Content at launch: 64 Codex onions (incl. ~38 international/regional with 140+ official/buy links), 216 Australian stockist listings (all states/territories), 139 seed/set/seedling listings from 15 suppliers, 59 preserved-onion products, 9 onion festivals, 17 "not an onion" rulings.
- All ~570 outbound URLs were re-curled at the end: statuses in data.js reflect that pass. Coles returns 200 with a bot interstitial, so Coles links are forced to "Retailer site". Shopify stores (Diggers, Green Harvest, Harris Farm etc.) rate-limit bursts with 429, so many seed links show "Retailer site" even though they work in a browser.
- Research gaps: no Hunter River Red, Walla Walla or grey-shallot seed found in AU shops; Asian/Indian grocer deep links are still the thinnest category (~19).
- Ideas if Rob wants more: more Asian/Indian grocer deep links (thin: ~10), a printable "onion buyer's checklist", per-state stockist maps, link-rot check script as a GitHub Action.
