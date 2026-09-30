# 02 — Redesign as "Every Onion - Onion Procurement System v4.2" (2026-09-30)

Supersedes the look/UX described in doc 01 (data model and deploy notes there still apply).

## Rob's direction
"Much more basic and like an old professional custom made piece of software feel. Like windows xp raw ass software.
Less things like 'what are you making?' and more like the person using it knows exactly what kind of onion they want.
Add prices too, and prices per 1000 onions." Later: "the kind of software that somehow exists today purely because it
does the damn job and people have been using it forever." Live edit from Rob while watching: remove the window
minimise / maximise / close buttons ("it should be a web page") — done; the blue title bar stays as a header strip.

## What it is now
A single-screen legacy business app, early-2000s desktop idiom, hand CSS (no library): grey bevelled controls,
Tahoma 11px (13px on phones), blue gradient title bar, menu bar (File/Edit/View/Onion/Tools/Help with working
shortcuts), toolbar, tab control, sunken query fields, dense data grids with sortable headers and row selection,
status bar (message, record count, selected code, "Prices: indicative AUD @ 30/09/2026", "Last data sync", state).
Zero animation, zero onboarding. No OS logos/branding.

Tabs: Onion Register (default) · Stockists (AU) · Seeds & Sets · Preserved · International · Naming · Scope · Methodology.
- Register: query group (variety/code text, colour, family, size, shape, PUNG from/to, SWT min, availability, origin,
  stocked-in state, stockist type, max $/kg, checkboxes) + grid + detail pane with sub-tabs (General, Pricing,
  Stockists, Seeds, Preserved, Links, Notes). On phones only Variety/Colour show until "More...".
- Double-click / Enter = Properties dialog. Quote dialog (Ctrl+Q or F8): variety + quantity (onions or kg) →
  weight, unit prices, subtotal, GST $0 (fresh veg is GST-free), bulk-sack alternative, quote ref.
- Shortcuts: F3 Find, Shift+F3 Clear query, F5 Refresh, F1 Help, Ctrl+Q/F8 Quote, Ctrl+E Export CSV, Ctrl+P Print,
  Ctrl+Shift+C copy code, arrows/PgUp/PgDn/Home/End move grid selection, Enter opens, Esc closes dialogs, Alt+letter menus.
- Export CSV = the current tab's main grid as filtered/sorted. Print = print CSS showing just the grid.
- Help > About: v4.2 Build 4.2.1187, © 2003-2026, "Licensed to: ____", fictional defunct "Allium Business Systems Pty Ltd".
- Deep links: `#register/<onion-id>`, `#stockists`, `#international` etc. Old URLs (`#/onion/x`, `#/codex`, `#/world`…) are mapped.
- `index.html` has `?v=NN` cache-busters on css/js/data — bump them when editing (Rob watches a live local server).

## Variety codes
`ON-<COL>-<NNN>`: COL = BRN/RED/WHT/GLD/PNK/GRY/GRN (skin colour), numbered in Codex order within colour.
Brown onion = ON-BRN-001, red = ON-RED-001, spring onion = ON-GRN-001, eschalot = ON-PNK-001.
Stored as `code` on each onion in data.js (generated once; edit by hand now).

## Prices (indicative) — basis and sources
Each onion has `price: {kg, g, each, per1000, basis, note, sackKg?, sackPrice?}` in data.js.
`each = kg × g / 1000`, `per1000 = kg × g`. Kelsae (exhibition) is POA (null).
Basis codes: **OBS** = derived from Australian retailer web prices actually fetched 30/09/2026; **EST** = estimate
(specialist / market-garden equivalent, for grow-only and specialist lines); **ORIG** = indicative price at origin in
AUD, for overseas onions (not importable). Observations on file (also shown in the Methodology tab, `D.priceObserved`):
- Brown: Woolworths 1 kg $2.50, 2 kg $5.50; ALDI 1 kg $2.99, loose $3.49/kg; Drakes $4.00/kg; IGA $4.90/kg; Foodland SA 1 kg $1.95; Milkrun $2.80 → **$3.00/kg**, avg 160 g → $0.48 each, **$480 per 1000**.
- Brown sacks: Spudshed 10 kg $7.99; Marino Bros 10 kg $10; Broomes 10 kg $15.99; Supa IGA 10 kg $19.50; Fruit For All 20 kg $44 → sack 10 kg $15.99.
- Red: Woolworths 1 kg $5.00, loose $0.83 ea; ALDI $4.49–$4.99; IGA $4.99–$5.99 → **$4.99/kg**, 170 g → $848.30 per 1000.
- White: Woolworths $0.89 each → $4.95/kg. Spring onion: bunch $2.69–$3.00 → $25/kg at 15 g/stalk. Eschalot: $19.90/kg (Supa IGA/Supamart) → $696.50 per 1000. Pickling: Harris Farm 500 g $1.99 → $3.98/kg.
Prices were read from the product pages' HTML/JSON with curl (web search budget was exhausted). Red onion 10 kg
sack ($39) is an estimate. International prices are rough origin-market conversions. None of these is presented as a
specific retailer's live price.

## Gotchas
- `.frame` (grid scroller) must have zero padding or rows show above the sticky header; the sunken edge is a border.
- Grids re-render wholesale on sort/query (few hundred rows, fast). Selection updates only the detail pane.
- On phones the page scrolls vertically; grids scroll horizontally inside their frame; `scrollWidth` must equal the viewport.
