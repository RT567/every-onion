/* Every Onion — app. Plain JS, no build step. All content lives in data/data.js (window.EO). */
(function () {
  "use strict";
  var D = window.EO;
  var $main = document.getElementById("main");
  var MONTHS = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var STATES = ["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"];

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem("eo." + k)); localStorage.setItem("eo." + k, JSON.stringify(v)); } catch (e) { return null; } }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function ext(url, label, cls) { return '<a class="' + (cls || "") + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + label + '</a>'; }

  var ONION_INDEX = {};
  D.onions.forEach(function (o) { ONION_INDEX[o.id] = o; o.match = o.match || [o.id]; });
  function byId(id) { return ONION_INDEX[id]; }
  var TAG_TO_ONION = {};
  D.onions.forEach(function (o) { o.match.forEach(function (t) { if (!TAG_TO_ONION[t]) TAG_TO_ONION[t] = o; }); });

  var state = { st: store("state") || "", compare: (store("compare") || []).filter(byId) };

  /* ---------- labels ---------- */
  var L = {
    colour: {brown:"Brown",red:"Red / purple",white:"White",gold:"Golden",pink:"Pink / copper",grey:"Grey",green:"Green"},
    colourSw: {brown:"#a86a32",red:"#6d2046",white:"#efe9dc",gold:"#d9a441",pink:"#c8785a",grey:"#9a8f86",green:"#5f8a35"},
    shape: {globe:"Globe",flat:"Flattened",torpedo:"Torpedo",teardrop:"Teardrop / banana",cluster:"Clustering",bunching:"Bunching (no bulb)",bulbing:"Bulb and stalk",tree:"Top-setting"},
    size: {pearl:"Pearl (under 3 cm)",small:"Small (3–5 cm)",medium:"Medium (5–8 cm)",large:"Large (8–10 cm)",jumbo:"Jumbo (10 cm +)",giant:"Exhibition"},
    sizeOrder: ["pearl","small","medium","large","jumbo","giant"],
    pung: ["Tearless","Negligible","Mild","Moderate","Pronounced","Severe"],
    sweet: ["None","Faint","Light","Moderate","Sweet","Very sweet"],
    keep: ["Days","Weeks","About a month","Two months","Several months","Most of a year"],
    avail: {supermarket:"Supermarkets",specialist:"Specialist grocers",grow:"Grow your own",overseas:"Overseas only"},
    availOrder: ["supermarket","specialist","grow","overseas"],
    use: {raw:"Raw & salads",pickle:"Pickling",caramelise:"Caramelising",roast:"Roasting whole",grill:"Grilling & barbecue",soup:"Soups, stocks & stews",stirfry:"Stir-fry",curry:"Curry bases & pastes",sauce:"Sauces & dressings",fry:"Frying",garnish:"Garnish",braise:"Braising",exhibit:"Exhibition"},
    family: {everyday:"Everyday onions",shallot:"Shallots & eschalots",green:"Green & bunching",sweet:"Sweet onions",protected:"Protected & regional",heirloom:"Heirloom & garden varieties",perennial:"Perennial & unusual",giant:"Giants"},
    region: {aus:"Australia & New Zealand",europe:"Europe",americas:"The Americas",asia:"Asia",africa:"Africa & Middle East",unknown:"Origin unknown"},
    season: {summer:"Summer (Dec–Feb)",autumn:"Autumn (Mar–May)",winter:"Winter (Jun–Aug)",spring:"Spring (Sep–Nov)"},
    seasonMonths: {summer:[12,1,2],autumn:[3,4,5],winter:[6,7,8],spring:[9,10,11]},
    cat: {supermarket:"Supermarket","online-grocer":"Online & delivery",greengrocer:"Greengrocer",market:"Market","asian-grocer":"Asian grocer","indian-grocer":"Indian grocer",grower:"Grower & industry",wholesale:"Wholesale & bulk"},
    seedcat: {seed:"Seed","sets-bulbs":"Sets & bulbs",seedlings:"Seedlings"},
    prodcat: {pickled:"Pickled",fried:"Fried & crispy",dried:"Dried, powdered & salted","soup-dip":"Soup & dip",relish:"Relish, jam & chutney",frozen:"Frozen",other:"Other"}
  };
  var PURITY = {
    pickled:"Onion, preserved in vinegar. Vinegar is not an onion; an exception has been made.",
    fried:"Onion, fried. The oil is incidental.",
    dried:"Onion, with the water removed.",
    "soup-dip":"Onion-flavoured. Contains things that are not onion. Read the pack.",
    relish:"Onion, cooked with sugar until it becomes a spread.",
    frozen:"Onion, cold.",
    other:"Onion-derived. Reviewed case by case."
  };

  /* ---------- small components ---------- */
  function swatch(o, size) {
    var outer = o.leaf || o.skin, inner = o.leaf ? (o.flesh || "#f5f2e6") : (o.flesh || "#f3ead6");
    return '<span class="swatch' + (size ? " swatch--" + size : "") + '" style="background:' + outer + ';--in:' + inner + '" role="img" aria-label="' + esc(L.colour[o.colour]) + ' onion"></span>';
  }
  function dot(o) { return '<span class="dot" style="background:' + (o.leaf || o.skin) + '"></span>'; }
  function bars(n, warn) { var s = '<span class="bars' + (warn ? " bars--warn" : "") + '" aria-hidden="true">'; for (var i = 1; i <= 5; i++) s += '<i class="' + (i <= n ? "on" : "") + '"></i>'; return s + "</span>"; }
  function rate(n, words, warn, short) { return '<span class="rate" title="' + n + ' of 5: ' + words[n] + '">' + bars(n, warn) + '<span>' + (short === 2 ? n : short ? n + "/5" : n + "/5 · " + words[n]) + '</span></span>'; }
  function tears(o, s) { return rate(o.pungency, L.pung, true, s); }
  function sugar(o, s) { return rate(o.sweetness, L.sweet, false, s); }
  function keeps(o, s) { return rate(o.keeping, L.keep, false, s); }
  function availBadge(o) { return '<span class="badge' + (o.avail === "supermarket" ? " badge--ok" : o.avail === "overseas" ? " badge--out" : "") + '">' + esc(L.avail[o.avail]) + '</span>'; }
  function onionChip(o) { return '<a class="chip" href="#/onion/' + o.id + '">' + dot(o) + esc(o.short || o.name) + '</a>'; }
  function cal(o) { return '<div class="cal">' + MONTHS.map(function (m, i) { var on = o.season.indexOf(i + 1) > -1; return '<span class="' + (on ? "on" : "") + '" title="' + MONTH_NAMES[i] + (on ? ": in season" : "") + '">' + m + '</span>'; }).join("") + '</div>'; }
  function head(kicker, title, lede, crumbs) {
    return '<header class="pagehead"><div class="pagehead__inner">' + (crumbs ? '<div class="crumbs">' + crumbs + '</div>' : "") + (kicker ? '<p class="kicker">' + kicker + '</p>' : "") + '<h1>' + title + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : "") + '</div></header>';
  }

  /* ---------- derived data ---------- */
  function stateOK(s, st) {
    if (!st) return true;
    var a = s.states || [];
    return a.indexOf(st) > -1 || a.indexOf("National") > -1 || a.indexOf("Online") > -1;
  }
  function hits(list, o) { return list.filter(function (s) { return (s.onions || []).some(function (x) { return o.match.indexOf(x) > -1; }); }); }
  function stockistsFor(o, st) { return hits(D.stockists, o).filter(function (s) { return stateOK(s, st); }); }
  function seedsFor(o) { return hits(D.seeds, o); }
  function productsFor(o) { return hits(D.products, o); }
  D.onions.forEach(function (o) {
    o._nStock = stockistsFor(o).length;
    o._nSeed = seedsFor(o).length;
    o._nProd = productsFor(o).length;
    o._seasons = o.avail === "overseas" ? [] : Object.keys(L.seasonMonths).filter(function (k) { return L.seasonMonths[k].some(function (m) { return o.season.indexOf(m) > -1; }); });
  });
  function inSeasonNow(o) { return o.avail !== "overseas" && o.season.indexOf(new Date().getMonth() + 1) > -1; }
  function stateLabel(s) { var a = s.states || []; if (a.indexOf("National") > -1) return "National"; if (a.indexOf("Online") > -1) return "Online"; return a.join(", "); }
  function catLabel(c) { return L.cat[c] || L.seedcat[c] || L.prodcat[c] || c; }

  /* ---------- reusable renderers ---------- */
  function card(o) {
    var cmp = state.compare.indexOf(o.id) > -1;
    return '<article class="ocard"><div class="ocard__head">' + swatch(o) + '<div><h3><a href="#/onion/' + o.id + '">' + esc(o.name) + '</a></h3><p class="ocard__sub">' + esc(o.origin) + ' · ' + esc(L.family[o.family]) + '</p></div></div>' +
      '<dl class="ocard__specs"><dt>Tears</dt><dd>' + tears(o, 1) + '</dd><dt>Sweetness</dt><dd>' + sugar(o, 1) + '</dd><dt>Keeping</dt><dd>' + keeps(o, 1) + '</dd></dl>' +
      '<div class="ocard__foot">' + availBadge(o) + '<span class="small muted">' + (o.avail === "overseas" ? plural((o.links || []).length, "overseas link") : o._nStock ? plural(o._nStock, "stockist") : plural(o._nSeed, "seed listing")) + '</span>' +
      '<label class="cmp"><input type="checkbox" data-compare="' + o.id + '"' + (cmp ? " checked" : "") + '> Compare</label></div></article>';
  }
  function onionsCell(tags) {
    var os = uniq((tags || []).map(function (t) { return TAG_TO_ONION[t]; }).filter(Boolean));
    return '<span class="onionlist">' + os.map(function (o) { return '<a href="#/onion/' + o.id + '">' + esc(o.short || o.name) + '</a>'; }).join("") + '</span>';
  }
  function linkStatus(s) { return '<span class="verified' + (s.status === "200" ? "" : " bb") + '" title="' + (s.status === "200" ? "Link returned a valid page when checked" : "Retailer blocks automated checks; link taken from the retailer's own site") + '">' + (s.status === "200" ? "✓ Verified" : "Retailer site") + '</span>'; }

  /* sortable stockist table */
  var STOCK_COLS = [
    ["name", "Stockist", function (s) { return s.name.toLowerCase(); }],
    ["cat", "Type", function (s) { var i = Object.keys(L.cat).indexOf(s.category); return (i < 0 ? 9 : i) + s.name.toLowerCase(); }],
    ["states", "Serves", function (s) { var l = stateLabel(s); return (l === "National" ? "0" : l === "Online" ? "1" : "2") + l; }],
    ["onions", "Onions", function (s) { return -(s.onions || []).length; }],
    ["status", "Link", function (s) { return s.status === "200" ? 0 : 1; }]
  ];
  function stockTable(list, sortKey, dir, sortable) {
    var col = STOCK_COLS.filter(function (c) { return c[0] === sortKey; })[0];
    if (col) { list = list.slice().sort(function (a, b) { var x = col[2](a), y = col[2](b); return (x < y ? -1 : x > y ? 1 : 0) * (dir === "desc" ? -1 : 1); }); }
    var th = STOCK_COLS.map(function (c) {
      if (!sortable) return '<th>' + c[1] + '</th>';
      var on = c[0] === sortKey;
      return '<th aria-sort="' + (on ? (dir === "desc" ? "descending" : "ascending") : "none") + '"><button type="button" class="sortbtn" data-ssort="' + c[0] + '">' + c[1] + (on ? (dir === "desc" ? " ▼" : " ▲") : "") + '</button></th>';
    }).join("") + '<th></th>';
    return '<div class="tablewrap"><table class="data stock"><thead><tr>' + th + '</tr></thead><tbody>' + list.map(function (s) {
      return '<tr><td>' + ext(s.url, esc(s.name), "name") + (s.blurb ? '<span class="blurb">' + esc(s.blurb) + '</span>' : "") + '</td><td class="nowrap">' + esc(catLabel(s.category)) + '</td><td>' + esc(stateLabel(s)) + '</td><td>' + onionsCell(s.onions) + '</td><td>' + linkStatus(s) + '</td><td class="nowrap">' + ext(s.url, "Visit ↗", "btn btn--ghost btn--sm") + '</td></tr>';
    }).join("") + '</tbody></table></div>';
  }
  function pcard(p, kind) {
    var o = (p.onions || []).map(function (t) { return TAG_TO_ONION[t]; }).filter(Boolean)[0];
    var title = p.name.indexOf(p.vendor) === 0 ? p.name.slice(p.vendor.length).replace(/^\s*[—–-]\s*/, "") : p.name;
    return '<article class="pcard"><span class="pcard__vendor">' + esc(p.vendor) + ' · ' + esc(catLabel(p.category)) + '</span>' +
      '<h3>' + esc(title || p.name) + '</h3>' + (p.blurb ? '<p>' + esc(p.blurb) + '</p>' : "") +
      (kind === "product" ? '<p class="purity">' + esc(PURITY[p.category] || PURITY.other) + '</p>' : "") +
      (p.ships ? '<p class="purity">Ships: ' + esc(p.ships) + '</p>' : "") +
      '<div class="pcard__foot">' + (o ? onionChip(o) : '<span></span>') + '<span>' + linkStatus(p) + ' ' + ext(p.url, "View ↗", "btn btn--ghost btn--sm") + '</span></div></article>';
  }

  /* ---------- views ---------- */
  var V = {};

  V.home = function () {
    var n = D.onions.length, ns = D.stockists.length;
    var countries = uniq(D.onions.map(function (o) { return o.origin; })).length;
    var day = Math.floor(Date.now() / 864e5);
    var pool = D.onions.filter(function (o) { return o.avail !== "overseas"; });
    var feat = pool[(day * 7 + 3) % pool.length];
    var sweetNow = D.onions.filter(function (o) { return (o.avail === "supermarket" || o.avail === "specialist") && inSeasonNow(o); }).sort(function (a, b) { return b.sweetness - a.sweetness || a.pungency - b.pungency; }).slice(0, 4);
    var cats = [
      ["supermarket", "Supermarkets", "Woolworths, Coles, ALDI, IGA, Harris Farm, Costco and regional chains."],
      ["greengrocer,market", "Greengrocers & markets", "Independent grocers, farmers markets and capital-city markets."],
      ["asian-grocer,indian-grocer", "Asian & Indian grocers", "Asian red shallots, small onions and spring onions."],
      ["online-grocer", "Online & delivery", "Delivered onions, including organic boxes."],
      ["grower,wholesale", "Growers & wholesale", "Grower-packers, produce markets and 20 kg sacks."]
    ];
    var catsHTML = cats.map(function (c) {
      var k = c[0].split(","), cnt = D.stockists.filter(function (s) { return k.indexOf(s.category) > -1; }).length;
      return '<a class="cat" href="#/stockists?cat=' + c[0] + '"><b>' + c[1] + '</b><span>' + c[2] + '</span><i>' + plural(cnt, "listing") + ' →</i></a>';
    }).join("") +
      '<a class="cat" href="#/grow"><b>Seeds, sets &amp; bulbs</b><span>Onion seed, sets, bulbs and seedlings from Australian suppliers.</span><i>' + plural(D.seeds.length, "listing") + ' →</i></a>' +
      '<a class="cat" href="#/pantry"><b>Preserved onions</b><span>Pickled, fried, dried, relished and frozen onion.</span><i>' + plural(D.products.length, "listing") + ' →</i></a>' +
      '<a class="cat" href="#/world"><b>International onions</b><span>Protected and regional onions of the world, and where they are sold.</span><i>' + plural(D.onions.filter(function (o) { return o.avail === "overseas"; }).length, "onion") + ' →</i></a>';
    var useOpts = Object.keys(L.use).filter(function (k) { return k !== "exhibit"; }).map(function (k) { return '<option value="' + k + '">' + L.use[k] + '</option>'; }).join("");
    var colourChips = Object.keys(L.colour).map(function (k) { var c = D.onions.filter(function (o) { return o.colour === k; }).length; return c ? '<a class="chip" href="#/codex?colour=' + k + '"><span class="dot" style="background:' + L.colourSw[k] + '"></span>' + L.colour[k] + ' <small>' + c + '</small></a>' : ""; }).join("");
    var tearChips = [0, 1, 2, 3, 4, 5].map(function (k) { var c = D.onions.filter(function (o) { return o.pungency === k; }).length; return c ? '<a class="chip" href="#/codex?pungency=' + k + '">' + k + ' · ' + L.pung[k] + ' <small>' + c + '</small></a>' : ""; }).join("");
    var famChips = Object.keys(L.family).map(function (k) { var c = D.onions.filter(function (o) { return o.family === k; }).length; return c ? '<a class="chip" href="#/codex?family=' + k + '">' + L.family[k] + ' <small>' + c + '</small></a>' : ""; }).join("");

    return '<section class="hero"><div class="hero__inner">' +
      '<h1>Compare every onion, and find every place in Australia to buy it.</h1>' +
      '<p class="hero__lede">Every Onion is an independent, onion-only comparison service. We rate each onion for tears, sweetness and keeping quality, and link it to every Australian supermarket, grocer, market, grower and seed merchant we can find.</p>' +
      '<form class="bigsearch" id="bigSearch" role="search"><label class="visually-hidden" for="bq">Search Every Onion</label><input id="bq" type="search" placeholder="Search by onion, alias or stockist, e.g. eschalot, Tropea, Harris Farm"><button type="submit">Search</button></form>' +
      '<div class="quick"><span>Most searched:</span>' + ["brown", "red", "spring-onion", "eschalot", "pickling", "asian-red-shallot"].filter(byId).map(function (id) { return onionChip(byId(id)); }).join("") + '</div>' +
      '<div class="stats"><div class="stat"><b>' + n + '</b><span>onions in the Codex</span></div><div class="stat"><b>' + ns + '</b><span>Australian stockist listings</span></div><div class="stat"><b>' + (D.seeds.length + D.products.length) + '</b><span>seed &amp; preserved listings</span></div><div class="stat"><b>' + countries + '</b><span>countries of origin</span></div></div>' +
      '</div></section>' +
      '<section class="section"><div class="split">' +
      '<div class="panel"><div class="panel__head"><h2>Onion finder</h2><span class="small muted">Three questions</span></div><div class="panel__body finder">' +
      '<div class="row"><label for="fUse">What are you making?</label><select id="fUse">' + useOpts + '</select></div>' +
      '<div class="row"><label for="fTears">Tear tolerance: <span id="fTearsOut"></span></label><input id="fTears" type="range" min="0" max="5" value="3"></div>' +
      '<div class="row"><label for="fWhere">Where will you get it?</label><select id="fWhere"><option value="1">Supermarket only</option><option value="2" selected>Supermarkets and specialist grocers</option><option value="3">I will grow it</option><option value="4">Anywhere in the world</option></select></div>' +
      '<div class="finder__out" id="fOut" aria-live="polite"></div></div></div>' +
      '<div class="panel"><div class="panel__head"><h2>Featured onion</h2><span class="small muted">' + new Date().toLocaleDateString("en-AU", {weekday:"long", day:"numeric", month:"long"}) + '</span></div><div class="panel__body"><div class="featured">' + swatch(feat, "lg") + '<div><h3><a href="#/onion/' + feat.id + '">' + esc(feat.name) + '</a></h3><p class="small muted" style="margin:0 0 8px"><i>' + esc(feat.bot) + '</i></p><p>' + esc(feat.desc.split(". ")[0]) + '.</p>' +
      '<table class="data" style="margin:4px 0 14px"><tbody><tr><td>Tears</td><td>' + tears(feat) + '</td></tr><tr><td>Sweetness</td><td>' + sugar(feat) + '</td></tr><tr><td>Australian stockists</td><td>' + feat._nStock + '</td></tr></tbody></table>' +
      '<a class="btn" href="#/onion/' + feat.id + '">View onion and stockists</a></div></div></div></div>' +
      '</div></section>' +
      '<section class="section"><div class="section__head"><div><h2>Find a stockist</h2><p>' + ns + ' Australian listings, by type of business.</p></div><a class="btn btn--ghost" href="#/stockists">Full stockist directory</a></div><div class="cats">' + catsHTML + '</div></section>' +
      '<section class="section"><div class="section__head"><div><h2>Browse the Codex</h2><p>Every onion, filterable by colour, tears, size, shape, season, use, origin and availability.</p></div><a class="btn btn--ghost" href="#/browse">All browse options</a></div>' +
      '<p class="label" style="margin:0 0 6px">By colour</p><div class="quick" style="margin:0 0 14px">' + colourChips + '</div>' +
      '<p class="label" style="margin:0 0 6px">By Lacrimal Index (tears)</p><div class="quick" style="margin:0 0 14px">' + tearChips + '</div>' +
      '<p class="label" style="margin:0 0 6px">By family</p><div class="quick" style="margin:0">' + famChips + '</div></section>' +
      (sweetNow.length ? '<section class="section"><div class="section__head"><div><h2>Sweetest onions in season now</h2><p>Available in Australia in ' + MONTH_NAMES[new Date().getMonth()] + ', ranked by Sweetness Index.</p></div></div><div class="grid">' + sweetNow.map(card).join("") + '</div></section>' : "");
  };
  V.home.after = function () {
    document.getElementById("bigSearch").addEventListener("submit", function (e) { e.preventDefault(); location.hash = "#/search?q=" + encodeURIComponent(document.getElementById("bq").value.trim()); });
    var fu = document.getElementById("fUse"), ft = document.getElementById("fTears"), fw = document.getElementById("fWhere");
    function run() {
      document.getElementById("fTearsOut").textContent = ft.value + " · " + L.pung[+ft.value];
      var use = fu.value, tol = +ft.value, reach = +fw.value;
      var scored = D.onions.filter(function (o) { return o.family !== "giant"; }).map(function (o) {
        var sc = 50;
        if (o.uses.indexOf(use) > -1) sc += 30 - o.uses.indexOf(use) * 3;
        if (o.pungency > tol) sc -= (o.pungency - tol) * (use === "pickle" ? 5 : 14); else sc += 4 - (tol - o.pungency);
        var need = L.availOrder.indexOf(o.avail) + 1;
        if (need > reach) sc -= 40; else sc -= (reach - need) * 2;
        if (use === "raw" || use === "grill") sc += o.sweetness * 2;
        if (use === "soup" || use === "caramelise" || use === "curry") sc += o.keeping;
        if (o.avail !== "overseas" && o.avail !== "grow") sc += Math.min(6, stockistsFor(o, state.st).length / 4);
        return {o: o, sc: Math.max(1, Math.min(99, Math.round(sc)))};
      }).sort(function (a, b) { return b.sc - a.sc; }).slice(0, 3);
      document.getElementById("fOut").innerHTML = scored.map(function (r) {
        var n = r.o.avail === "overseas" ? "Overseas only" : r.o.avail === "grow" ? plural(r.o._nSeed, "seed listing") : plural(stockistsFor(r.o, state.st).length, "stockist") + (state.st ? " in " + state.st : "");
        return '<div class="match">' + swatch(r.o, "sm") + '<div><a href="#/onion/' + r.o.id + '">' + esc(r.o.name) + '</a><small>' + esc(n) + ' · ' + esc(L.pung[r.o.pungency]) + ' tears</small></div><b>' + r.sc + '% match</b></div>';
      }).join("");
    }
    [fu, ft, fw].forEach(function (x) { x.addEventListener("input", run); });
    run();
  };

  /* codex */
  var FACETS = [
    ["family", "Family", function (o) { return [o.family]; }, L.family],
    ["colour", "Colour", function (o) { return [o.colour]; }, L.colour],
    ["pungency", "Lacrimal Index (tears)", function (o) { return [String(o.pungency)]; }, {0:"0 Tearless",1:"1 Negligible",2:"2 Mild",3:"3 Moderate",4:"4 Pronounced",5:"5 Severe"}],
    ["sweetness", "Sweetness Index", function (o) { return [String(o.sweetness)]; }, {1:"1 Faint",2:"2 Light",3:"3 Moderate",4:"4 Sweet",5:"5 Very sweet"}],
    ["avail", "Availability", function (o) { return [o.avail]; }, L.avail],
    ["size", "Size", function (o) { return [o.size]; }, L.size],
    ["shape", "Shape", function (o) { return [o.shape]; }, L.shape],
    ["season", "In season in Australia", function (o) { return o._seasons; }, L.season],
    ["use", "Best for", function (o) { return o.uses; }, L.use],
    ["region", "Origin", function (o) { return [o.region]; }, L.region]
  ];
  var CODEX_COLS = [
    ["name", "Onion", function (o) { return o.name.toLowerCase(); }],
    ["size", "Size", function (o) { return L.sizeOrder.indexOf(o.size); }],
    ["pungency", "Tears", function (o) { return o.pungency; }],
    ["sweetness", "Sweet", function (o) { return o.sweetness; }],
    ["keeping", "Keeps", function (o) { return o.keeping; }],
    ["origin", "Origin", function (o) { return o.origin; }],
    ["avail", "Availability", function (o) { return L.availOrder.indexOf(o.avail); }],
    ["stock", "Stockists", function (o) { return o._nStock * 1000 + o._nSeed; }]
  ];
  var DEFAULT_VIEW = window.matchMedia("(max-width: 760px)").matches ? "cards" : "table";
  var NUMERIC_DESC = {pungency:1, sweetness:1, keeping:1, stock:1, seed:1, size:1};
  function parseQ(qs) {
    var p = new URLSearchParams(qs || ""), f = {};
    FACETS.forEach(function (F) { var v = p.get(F[0]); if (v) f[F[0]] = v.split(","); });
    var sort = p.get("sort") || "name";
    if (sort === "mild") return {f: f, sort: "pungency", dir: "asc", view: p.get("view") || DEFAULT_VIEW, mine: p.get("mine") === "1", text: p.get("q") || ""};
    return {f: f, sort: sort, dir: p.get("dir") || (NUMERIC_DESC[sort] ? "desc" : "asc"), view: p.get("view") || DEFAULT_VIEW, mine: p.get("mine") === "1", text: p.get("q") || ""};
  }
  function buildQ(q) {
    var p = new URLSearchParams();
    Object.keys(q.f).forEach(function (k) { if (q.f[k].length) p.set(k, q.f[k].join(",")); });
    if (q.sort !== "name") p.set("sort", q.sort);
    if (q.dir !== (NUMERIC_DESC[q.sort] ? "desc" : "asc")) p.set("dir", q.dir);
    if (q.view !== DEFAULT_VIEW) p.set("view", q.view);
    if (q.mine) p.set("mine", "1");
    if (q.text) p.set("q", q.text);
    var s = p.toString(); return s ? "?" + s : "";
  }
  function codexList(q) {
    var col = CODEX_COLS.filter(function (c) { return c[0] === q.sort; })[0] || CODEX_COLS[0];
    var t = norm(q.text);
    return D.onions.filter(function (o) {
      if (q.mine && state.st && !stockistsFor(o, state.st).length) return false;
      if (t && norm(o.name + " " + o.bot + " " + (o.aka || []).map(function (a) { return a.n; }).join(" ") + " " + o.origin + " " + (o.place || "")).indexOf(t) < 0) return false;
      return FACETS.every(function (F) { var sel = q.f[F[0]]; if (!sel || !sel.length) return true; var v = F[2](o); return sel.some(function (x) { return v.indexOf(x) > -1; }); });
    }).sort(function (a, b) { var x = col[2](a), y = col[2](b); var r = x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name); return (x === y ? r : r * (q.dir === "desc" ? -1 : 1)); });
  }
  V.codex = function (qs) {
    var q = parseQ(qs), list = codexList(q);
    var active = Object.keys(q.f).reduce(function (n, k) { return n + q.f[k].length; }, 0) + (q.mine ? 1 : 0);
    var filters = '<aside class="filters" id="filters"><button class="btn btn--ghost btn--sm filters__toggle" type="button" id="ftoggle" aria-expanded="false">Filters' + (active ? " (" + active + " active)" : "") + '</button><div class="filters__body">' +
      '<fieldset><legend>Name contains</legend><input class="field" id="cText" style="width:100%" value="' + esc(q.text) + '" placeholder="e.g. shallot"></fieldset>' +
      (state.st ? '<fieldset><legend>Your state</legend><div class="opts"><button class="chip" type="button" data-mine aria-pressed="' + q.mine + '">Stocked in ' + state.st + '</button></div></fieldset>' : "") +
      FACETS.map(function (F) {
        var labels = F[3];
        return '<fieldset><legend>' + F[1] + '</legend><div class="opts">' + Object.keys(labels).map(function (k) {
          var cnt = D.onions.filter(function (o) { return F[2](o).indexOf(k) > -1; }).length;
          if (!cnt) return "";
          var on = q.f[F[0]] && q.f[F[0]].indexOf(k) > -1;
          return '<button class="chip" type="button" data-facet="' + F[0] + '" data-val="' + k + '" aria-pressed="' + !!on + '">' + (F[0] === "colour" ? '<span class="dot" style="background:' + L.colourSw[k] + '"></span>' : "") + esc(labels[k]) + ' <small>' + cnt + '</small></button>';
        }).join("") + '</div></fieldset>';
      }).join("") + (active || q.text ? '<p style="margin-top:12px"><a href="#/codex">Clear all filters</a></p>' : "") + '</div></aside>';
    var tools = '<div class="toolbar"><span class="toolbar__count"><b>' + plural(list.length, "onion") + '</b>' + (active || q.text ? " match your filters" : " in the Codex") + '</span><div class="toolbar__right"><label class="visually-hidden" for="sortSel">Sort by</label><select id="sortSel">' +
      CODEX_COLS.map(function (c) { return '<option value="' + c[0] + '"' + (q.sort === c[0] ? " selected" : "") + '>Sort: ' + c[1] + '</option>'; }).join("") +
      '</select><div class="seg" role="group" aria-label="View"><button type="button" data-view="table" aria-pressed="' + (q.view === "table") + '">Table</button><button type="button" data-view="cards" aria-pressed="' + (q.view === "cards") + '">Cards</button></div></div></div>';
    var body;
    if (!list.length) body = '<div class="empty"><h3>No onion matches all of those criteria.</h3><p>This is unusual. Try removing a filter.</p></div>';
    else if (q.view === "table") {
      body = '<div class="tablewrap"><table class="data codex"><thead><tr>' + CODEX_COLS.map(function (c) {
        var on = c[0] === q.sort;
        return '<th aria-sort="' + (on ? (q.dir === "desc" ? "descending" : "ascending") : "none") + '"><button type="button" class="sortbtn" data-csort="' + c[0] + '">' + c[1] + (on ? (q.dir === "desc" ? " ▼" : " ▲") : "") + '</button></th>';
      }).join("") + '<th>Compare</th></tr></thead><tbody>' +
        list.map(function (o) {
          return '<tr><td><span class="onionname">' + swatch(o, "sm") + '<span><a class="name" href="#/onion/' + o.id + '">' + esc(o.name) + '</a><span class="blurb small muted" style="display:block">' + esc(L.family[o.family]) + '</span></span></span></td>' +
            '<td class="nowrap">' + esc(L.size[o.size].split(" (")[0]) + '</td><td>' + tears(o, 2) + '</td><td>' + sugar(o, 2) + '</td><td>' + keeps(o, 2) + '</td><td>' + esc(o.origin) + '</td><td>' + availBadge(o) + '</td><td>' + (o._nStock ? '<a href="#/stockists?onion=' + o.id + '">' + o._nStock + '</a>' : "—") + (o._nSeed ? '<span class="small muted" style="display:block">' + plural(o._nSeed, "seed listing") + '</span>' : "") + '</td>' +
            '<td><label class="cmp"><input type="checkbox" data-compare="' + o.id + '"' + (state.compare.indexOf(o.id) > -1 ? " checked" : "") + '><span class="visually-hidden">Compare ' + esc(o.name) + '</span></label></td></tr>';
        }).join("") + '</tbody></table></div>';
    } else body = '<div class="grid">' + list.map(card).join("") + '</div>';
    return head("", "The Onion Codex", "The reference catalogue of every onion Every Onion recognises (" + D.onions.length + " entries), rated for tears, sweetness and keeping quality and cross-referenced to Australian stockists and seed merchants. Select a column heading to sort.") +
      '<div class="catalog">' + filters + '<div>' + tools + body + '</div></div>';
  };
  V.codex.after = function (qs) {
    var q = parseQ(qs);
    function go() { location.hash = "#/codex" + buildQ(q); }
    $main.querySelectorAll("[data-facet]").forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.dataset.facet, v = b.dataset.val, a = q.f[f] || (q.f[f] = []);
        var i = a.indexOf(v); if (i > -1) a.splice(i, 1); else a.push(v);
        keepFilterOpen = true; go();
      });
    });
    $main.querySelectorAll("[data-csort]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.csort;
        if (q.sort === k) q.dir = q.dir === "asc" ? "desc" : "asc"; else { q.sort = k; q.dir = NUMERIC_DESC[k] ? "desc" : "asc"; }
        go();
      });
    });
    var mine = $main.querySelector("[data-mine]");
    if (mine) mine.addEventListener("click", function () { q.mine = !q.mine; keepFilterOpen = true; go(); });
    document.getElementById("sortSel").addEventListener("change", function (e) { q.sort = e.target.value; q.dir = NUMERIC_DESC[q.sort] ? "desc" : "asc"; go(); });
    $main.querySelectorAll("[data-view]").forEach(function (b) { b.addEventListener("click", function () { q.view = b.dataset.view; go(); }); });
    var t = document.getElementById("cText"), tm;
    t.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { q.text = t.value.trim(); keepFilterOpen = true; refocus = "cText"; go(); }, 250); });
    wireFilterToggle();
  };
  var keepFilterOpen = false, refocus = null;
  function wireFilterToggle() {
    var ft = document.getElementById("ftoggle"), fl = document.getElementById("filters");
    if (!ft) return;
    if (keepFilterOpen) { fl.classList.add("open"); ft.setAttribute("aria-expanded", "true"); }
    ft.addEventListener("click", function () { var o = fl.classList.toggle("open"); ft.setAttribute("aria-expanded", String(o)); });
    keepFilterOpen = false;
  }

  /* single onion */
  V.onion = function (id) {
    var o = byId(id);
    if (!o) return V.notfound();
    var st = state.st;
    var stock = stockistsFor(o, st), allStock = stockistsFor(o);
    var seeds = seedsFor(o), prods = productsFor(o);
    var names = (o.aka || []).map(function (a) { return '<span>' + esc(a.n) + (a.w ? '<em>' + esc(a.w) + '</em>' : "") + '</span>'; }).join("");
    var adv = "";
    if (st && o.aka) { var local = o.aka.filter(function (a) { return a.w && a.w.indexOf(st) > -1; }); if (local.length) adv = '<p class="advisory"><b>Regional naming advisory (' + st + '):</b> in your state this onion is commonly sold as <b>“' + esc(local.map(function (a) { return a.n; }).join("” or “")) + '”</b>. See the <a href="#/names">naming advisory</a>.</p>'; }
    if (!adv && o.advisory) adv = '<p class="advisory">' + o.advisory + '</p>';
    var overseas = o.avail === "overseas";
    var rows = [
      ["Lacrimal Index", tears(o)], ["Sweetness Index", sugar(o)], ["Keeping quality", keeps(o)],
      ["Botanical name", '<i>' + esc(o.bot) + '</i>'],
      ["Family", '<a href="#/codex?family=' + o.family + '">' + esc(L.family[o.family]) + '</a>'],
      ["Skin", esc(o.skinDesc || L.colour[o.colour])], ["Flesh", esc(o.fleshDesc || "White")],
      ["Shape", esc(L.shape[o.shape])], ["Size", esc(L.size[o.size].split(" (")[0]) + (o.diam ? ' <span class="muted">(' + esc(o.diam) + ')</span>' : "")],
      ["Origin", esc(o.origin) + (o.place ? '<br><span class="muted small">' + esc(o.place) + '</span>' : "")],
      ["Protection", esc(o.status || "None")],
      ["Availability", availBadge(o)],
      ["Australian stockists", allStock.length ? '<a href="#buy">' + allStock.length + '</a>' : "0"],
      ["Seed & set listings", seeds.length ? '<a href="#grow">' + seeds.length + '</a>' : "0"]
    ];
    var similar = D.onions.filter(function (x) { return x.id !== o.id; }).map(function (x) {
      return {x: x, d: Math.abs(x.pungency - o.pungency) + Math.abs(x.sweetness - o.sweetness) + (x.colour === o.colour ? 0 : 2) + (x.family === o.family ? 0 : 1.5) + (x.shape === o.shape ? 0 : 1) + (x.avail === o.avail ? 0 : 1)};
    }).sort(function (a, b) { return a.d - b.d; }).slice(0, 4).map(function (r) { return r.x; });
    var links = (o.links || []).map(function (l) { return '<li><span class="badge' + (l.kind === "buy" ? " badge--ok" : "") + '">' + esc(l.kind) + '</span>' + ext(l.url, esc(l.label) + " ↗") + (l.ships ? ' <span class="small muted">' + esc(l.ships) + '</span>' : "") + '</li>'; }).join("");
    var buy;
    if (stock.length) buy = stockTable(stock, "cat", "asc", false);
    else if (allStock.length) buy = '<div class="empty"><h3>No listed stockists in ' + st + '.</h3><p>There ' + (allStock.length === 1 ? "is 1 stockist" : "are " + allStock.length + " stockists") + ' elsewhere in Australia. <a href="#" data-clearstate>Show all states</a>.</p></div>';
    else if (overseas) buy = '<div class="empty"><h3>Not sold fresh in Australia.</h3><p>See the international listings above. Fresh onions cannot be brought into or posted to Australia; see <a href="#/world">International</a> for details.</p></div>';
    else buy = '<div class="empty"><h3>No retail stockists listed.</h3><p>This onion is most reliably obtained by growing it.' + (seeds.length ? ' See seed and bulb listings below.' : "") + '</p></div>';
    return '<article class="detail"><div class="crumbs"><a href="#/codex">The Onion Codex</a> › <a href="#/codex?family=' + o.family + '">' + esc(L.family[o.family]) + '</a> › ' + esc(o.name) + '</div>' +
      '<div class="detail__top"><div><div class="detail__title">' + swatch(o, "lg") + '<div><h1>' + esc(o.name) + '</h1><p class="detail__bot">' + esc(o.bot) + '</p></div></div>' +
      (names ? '<div class="aka"><span style="border:0;background:none;padding-left:0" class="muted">Also known as:</span>' + names + '</div>' : "") + adv +
      '<p class="detail__desc">' + esc(o.desc) + '</p>' +
      '<div class="block"><h2 class="subhead">' + (overseas ? "Season at origin" : "Availability in Australia by month") + '</h2>' + cal(o) + '</div>' +
      '<div class="block"><h2 class="subhead">Best for</h2><div class="quick" style="margin:0">' + o.uses.map(function (u) { return '<a class="chip" href="#/codex?use=' + u + '">' + esc(L.use[u]) + '</a>'; }).join("") + '</div></div>' +
      '<div class="block"><h2 class="subhead">Field notes</h2><ul class="facts">' + (o.facts || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join("") + '</ul></div>' +
      (links ? '<div class="block"><h2 class="subhead">International listings <small>Official bodies and sellers at origin</small></h2><ul class="links">' + links + '</ul></div>' : "") +
      '</div><aside class="keyfacts"><h2>Key facts</h2><table><tbody>' + rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join("") + '</tbody></table>' +
      '<div class="actions"><a class="btn btn--sm" href="#buy">Where to buy</a><label class="btn btn--ghost btn--sm cmp"><input type="checkbox" data-compare="' + o.id + '"' + (state.compare.indexOf(o.id) > -1 ? " checked" : "") + '> Compare</label></div></aside></div>' +
      '<section id="buy" class="block"><h2 class="subhead">Where to buy in Australia <small>' + (st ? "Showing " + st + ", national and online stockists" : plural(stock.length, "stockist") + ", all states") + '</small></h2>' + buy + '</section>' +
      (seeds.length ? '<section id="grow" class="block"><h2 class="subhead">Seed, sets &amp; bulbs <small>' + plural(seeds.length, "listing") + '</small></h2><div class="pgrid">' + seeds.map(function (p) { return pcard(p, "seed"); }).join("") + '</div></section>' : "") +
      (prods.length ? '<section class="block"><h2 class="subhead">Preserved forms <small>' + plural(prods.length, "listing") + '</small></h2><div class="pgrid">' + prods.map(function (p) { return pcard(p, "product"); }).join("") + '</div></section>' : "") +
      '<section class="block"><h2 class="subhead">Similar onions</h2><div class="grid">' + similar.map(card).join("") + '</div></section></article>';
  };
  V.onion.after = function () {
    var c = $main.querySelector("[data-clearstate]");
    if (c) c.addEventListener("click", function (e) { e.preventDefault(); setState(""); });
    $main.querySelectorAll('a[href="#buy"],a[href="#grow"]').forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); document.getElementById(b.getAttribute("href").slice(1)).scrollIntoView({behavior: "smooth"}); }); });
  };

  /* stockists */
  V.stockists = function (qs) {
    var p = new URLSearchParams(qs || "");
    var cats = (p.get("cat") || "").split(",").filter(Boolean), on = p.get("onion") || "", text = p.get("q") || "";
    var sort = p.get("sort") || "cat", dir = p.get("dir") || "asc";
    var st = state.st;
    var list = D.stockists.filter(function (s) {
      if (cats.length && cats.indexOf(s.category) < 0) return false;
      if (!stateOK(s, st)) return false;
      if (on) { var o = byId(on); if (!o || !(s.onions || []).some(function (x) { return o.match.indexOf(x) > -1; })) return false; }
      if (text && norm(s.name + " " + s.vendor + " " + (s.blurb || "")).indexOf(norm(text)) < 0) return false;
      return true;
    });
    var filt = '<aside class="filters" id="filters"><button class="btn btn--ghost btn--sm filters__toggle" type="button" id="ftoggle" aria-expanded="false">Filters</button><div class="filters__body">' +
      '<fieldset><legend>Name contains</legend><input class="field" id="stText" style="width:100%" value="' + esc(text) + '" placeholder="e.g. Harris Farm"></fieldset>' +
      '<fieldset><legend>State or territory</legend><div class="opts"><button class="chip" type="button" data-st="" aria-pressed="' + !st + '">All</button>' + STATES.map(function (s) { return '<button class="chip" type="button" data-st="' + s + '" aria-pressed="' + (st === s) + '">' + s + '</button>'; }).join("") + '</div><p class="small muted" style="clear:both;margin:8px 0 0">National and online stockists are always included.</p></fieldset>' +
      '<fieldset><legend>Type of stockist</legend><div class="opts">' + Object.keys(L.cat).map(function (k) { var c = D.stockists.filter(function (s) { return s.category === k && stateOK(s, st); }).length; return c ? '<button class="chip" type="button" data-cat="' + k + '" aria-pressed="' + (cats.indexOf(k) > -1) + '">' + L.cat[k] + ' <small>' + c + '</small></button>' : ""; }).join("") + '</div></fieldset>' +
      '<fieldset><legend>Onion</legend><select class="field" id="onSel" style="width:100%"><option value="">Any onion</option>' + D.onions.filter(function (o) { return o._nStock; }).sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (o) { return '<option value="' + o.id + '"' + (on === o.id ? " selected" : "") + '>' + esc(o.name) + ' (' + o._nStock + ')</option>'; }).join("") + '</select></fieldset>' +
      ((cats.length || on || text) ? '<p><a href="#/stockists">Clear filters</a></p>' : "") + '</div></aside>';
    var body = list.length ? stockTable(list, sort, dir, true) : '<div class="empty"><h3>No stockists match.</h3><p>Try another state or remove a filter.</p></div>';
    var verified = D.stockists.filter(function (s) { return s.status === "200"; }).length;
    return head("Buy in Australia", "Where to buy onions in Australia", D.stockists.length + " Australian supermarkets, grocers, markets, growers and online stores, linked directly to their onions where possible. " + verified + " links returned a valid page when checked on " + D.meta.checked + "; the rest are on sites that block automated checks and are marked “Retailer site”.") +
      '<div class="catalog">' + filt + '<div><div class="toolbar"><span class="toolbar__count"><b>' + plural(list.length, "stockist") + '</b>' + (st ? " serving " + st : " Australia-wide") + (on && byId(on) ? " selling " + esc(byId(on).name) : "") + '</span><span class="toolbar__count small">Prices are set by retailers and are not shown.</span></div>' + body + '</div></div>';
  };
  V.stockists.after = function (qs) {
    var p = new URLSearchParams(qs || "");
    function go() { var s = p.toString(); location.hash = "#/stockists" + (s ? "?" + s : ""); }
    $main.querySelectorAll("[data-cat]").forEach(function (b) { b.addEventListener("click", function () { var a = (p.get("cat") || "").split(",").filter(Boolean), v = b.dataset.cat, i = a.indexOf(v); if (i > -1) a.splice(i, 1); else a.push(v); if (a.length) p.set("cat", a.join(",")); else p.delete("cat"); keepFilterOpen = true; go(); }); });
    $main.querySelectorAll("[data-st]").forEach(function (b) { b.addEventListener("click", function () { keepFilterOpen = true; setState(b.dataset.st); }); });
    $main.querySelectorAll("[data-ssort]").forEach(function (b) { b.addEventListener("click", function () { var k = b.dataset.ssort; if ((p.get("sort") || "cat") === k) p.set("dir", (p.get("dir") || "asc") === "asc" ? "desc" : "asc"); else { p.set("sort", k); p.delete("dir"); } go(); }); });
    document.getElementById("onSel").addEventListener("change", function (e) { if (e.target.value) p.set("onion", e.target.value); else p.delete("onion"); go(); });
    var t = document.getElementById("stText"), tm;
    t.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { if (t.value) p.set("q", t.value); else p.delete("q"); keepFilterOpen = true; refocus = "stText"; go(); }, 250); });
    wireFilterToggle();
  };

  /* browse */
  V.browse = function () {
    var shelves = [
      ["colour", "By colour", "Skin colour, as it appears on the shelf.", L.colour, function (o) { return [o.colour]; }],
      ["pungency", "By tears (Lacrimal Index)", "How much crying to budget for.", {5:"5 · Severe",4:"4 · Pronounced",3:"3 · Moderate",2:"2 · Mild",1:"1 · Negligible",0:"0 · Tearless"}, function (o) { return [String(o.pungency)]; }],
      ["sweetness", "By sweetness", "The Sweetness Index, for the raw onion.", {5:"5 · Very sweet",4:"4 · Sweet",3:"3 · Moderate",2:"2 · Light",1:"1 · Faint"}, function (o) { return [String(o.sweetness)]; }],
      ["size", "By size", "Measured across the widest point of the bulb.", L.size, function (o) { return [o.size]; }],
      ["shape", "By shape", "Onions come in more shapes than is widely appreciated.", L.shape, function (o) { return [o.shape]; }],
      ["season", "By Australian season", "When each onion is available in Australia, fresh or from storage. Overseas-only onions are excluded.", L.season, function (o) { return o._seasons; }],
      ["use", "By use", "What each onion is best at.", L.use, function (o) { return o.uses; }],
      ["keeping", "By keeping quality", "How long it lasts somewhere cool, dark and dry.", {5:"5 · Most of a year",4:"4 · Several months",3:"3 · Two months",2:"2 · About a month",1:"1 · Weeks",0:"0 · Days"}, function (o) { return [String(o.keeping)]; }],
      ["avail", "By availability", "How hard you will have to look.", L.avail, function (o) { return [o.avail]; }],
      ["family", "By family", "The Codex's eight families.", L.family, function (o) { return [o.family]; }],
      ["region", "By origin", "Where the onion comes from.", L.region, function (o) { return [o.region]; }],
      ["bot", "By species", "Most onions are Allium cepa. The Codex admits a small number of close associates.", null, function (o) { return [o.bot.replace(/ \(.*$/, "").split(",")[0].split(" ").slice(0, 3).join(" ").replace(/ or$/, "")]; }],
      ["status", "By legal protection", "Onions with a registered geographical indication or equivalent, and onions without.", null, function (o) { var s = o.status || "None"; return [/^(AOP|IGP|DOP|GI)/.test(s) ? s.split(" ")[0] : /marketing order|State law/.test(s) ? "US marketing order" : /Slow Food/.test(s) ? "Slow Food" : "Other or none"]; }],
      ["letter", "By first letter", "For customers who know what letter their onion starts with.", null, function (o) { return [o.name[0].toUpperCase()]; }]
    ];
    var jump = '<nav class="jump" aria-label="Jump to">' + shelves.map(function (s) { return '<a class="chip" href="#/browse" data-jump="shelf-' + s[0] + '">' + s[1].replace("By ", "").replace(/^./, function (c) { return c.toUpperCase(); }) + '</a>'; }).join("") + '</nav>';
    var html = shelves.map(function (S) {
      var labels = S[3];
      if (!labels) { labels = {}; D.onions.forEach(function (o) { S[4](o).forEach(function (k) { labels[k] = k; }); }); var l2 = {}; Object.keys(labels).sort().forEach(function (k) { l2[k] = k; }); labels = l2; }
      var keys = Object.keys(labels);
      if (S[0] === "pungency" || S[0] === "sweetness" || S[0] === "keeping") keys.sort(function (a, b) { return b - a; });
      var direct = ["colour", "pungency", "sweetness", "size", "shape", "season", "use", "avail", "family", "region"].indexOf(S[0]) > -1;
      return '<section class="shelf" id="shelf-' + S[0] + '"><h2>' + S[1] + '</h2><p>' + S[2] + '</p><div class="buckets">' + keys.map(function (k) {
        var os = D.onions.filter(function (o) { return S[4](o).indexOf(k) > -1; });
        if (!os.length) return "";
        return '<div class="bucket"><h3>' + (direct ? '<a href="#/codex?' + S[0] + '=' + encodeURIComponent(k) + '">' + esc(labels[k]) + '</a>' : esc(labels[k])) + ' <small>' + os.length + '</small></h3><ul>' + os.map(function (o) { return '<li><a href="#/onion/' + o.id + '">' + dot(o) + esc(o.short || o.name) + '</a></li>'; }).join("") + '</ul></div>';
      }).join("") + '</div></section>';
    }).join("");
    return head("Browse by style", "Browse onions by style", "The full Codex arranged fourteen ways. Select a heading to open it as a filtered, sortable list.") + '<div class="section" style="padding-top:20px">' + jump + html + '</div>';
  };
  V.browse.after = function () {
    $main.querySelectorAll("[data-jump]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); document.getElementById(a.dataset.jump).scrollIntoView({behavior: "smooth"}); }); });
  };

  /* world */
  V.world = function () {
    var regions = ["europe", "americas", "asia", "africa", "aus"];
    var bio = D.biosecurity || [], fest = D.festivals || [];
    var groups = regions.map(function (r) { return [r, D.onions.filter(function (o) { return o.region === r && o.links && o.links.length; }).sort(function (a, b) { return a.origin.localeCompare(b.origin) || a.name.localeCompare(b.name); })]; }).filter(function (g) { return g[1].length; });
    var total = groups.reduce(function (n, g) { return n + g[1].length; }, 0);
    var jump = '<nav class="jump" aria-label="Jump to region">' + groups.map(function (g) { return '<a class="chip" href="#/world" data-jump="region-' + g[0] + '">' + L.region[g[0]] + ' <small>' + g[1].length + '</small></a>'; }).join("") + (fest.length ? '<a class="chip" href="#/world" data-jump="region-festivals">Onion festivals <small>' + fest.length + '</small></a>' : "") + '</nav>';
    var html = groups.map(function (g) {
      return '<section class="region" id="region-' + g[0] + '"><h2>' + L.region[g[0]] + ' <small>' + plural(g[1].length, "onion") + '</small></h2>' + g[1].map(function (o) {
        return '<article class="wcard"><div><h3>' + swatch(o, "sm") + '<a href="#/onion/' + o.id + '">' + esc(o.name) + '</a></h3><p class="wcard__where">' + esc(o.origin) + (o.place ? " · " + esc(o.place) : "") + (o.status ? " · " + esc(o.status) : "") + '</p>' +
          '<ul class="wcard__facts">' + (o.facts || []).slice(0, 3).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join("") + '</ul></div>' +
          '<div><ul class="links">' + o.links.map(function (l) { return '<li><span class="badge' + (l.kind === "buy" ? " badge--ok" : "") + '">' + esc(l.kind) + '</span>' + ext(l.url, esc(l.label) + " ↗") + (l.ships ? ' <span class="small muted">' + esc(l.ships) + '</span>' : "") + '</li>'; }).join("") + '</ul></div></article>';
      }).join("") + '</section>';
    }).join("");
    var notice = bio.length ? '<div class="notice notice--warn"><h3>Import advisory</h3><p>' + esc(bio[0].summary) + ' Every Onion lists international onions for reference and for customers who are already overseas.</p><ul class="links">' + bio.map(function (b) { return '<li>' + ext(b.url, esc(b.label) + " ↗") + '</li>'; }).join("") + '</ul></div>' : "";
    var festHTML = fest.length ? '<section class="region" id="region-festivals"><h2>Onion festivals <small>' + plural(fest.length, "event") + '</small></h2><div class="tablewrap" style="margin-top:14px"><table class="data"><thead><tr><th>Festival</th><th>Place</th><th>When</th></tr></thead><tbody>' + fest.map(function (f) { return '<tr><td>' + ext(f.url, esc(f.name) + " ↗", "name") + '</td><td>' + esc(f.place) + '</td><td>' + esc(f.when) + '</td></tr>'; }).join("") + '</tbody></table></div></section>' : "";
    return head("International", "International onions", total + " regional and protected-origin onions of the world, with their official bodies and the places that sell them. Most do not travel, and none may be brought into Australia fresh.") +
      '<div class="section" style="padding-top:20px">' + jump + notice + html + festHTML + '</div>';
  };
  V.world.after = V.browse.after;

  /* grow */
  V.grow = function (qs) {
    var p = new URLSearchParams(qs || ""), cat = p.get("cat") || "";
    var list = D.seeds.filter(function (s) { return !cat || s.category === cat; });
    var vendors = uniq(D.seeds.map(function (s) { return s.vendor; })).sort();
    var chips = '<div class="quick" style="margin:0 0 8px"><a class="chip" href="#/grow" aria-pressed="' + !cat + '">All <small>' + D.seeds.length + '</small></a>' + Object.keys(L.seedcat).map(function (k) { var c = D.seeds.filter(function (s) { return s.category === k; }).length; return c ? '<a class="chip" href="#/grow?cat=' + k + '" aria-pressed="' + (cat === k) + '">' + L.seedcat[k] + ' <small>' + c + '</small></a>' : ""; }).join("") + '</div>';
    var groups = {}; list.forEach(function (s) { var k = s.variety || "Other"; (groups[k] = groups[k] || []).push(s); });
    var keys = Object.keys(groups).sort();
    var rows = keys.map(function (k) { return groups[k].map(function (s, i) { var o = (s.onions || []).map(function (t) { return TAG_TO_ONION[t]; }).filter(Boolean)[0]; return '<tr><td>' + (i === 0 ? '<b>' + esc(k) + '</b>' : "") + '</td><td>' + ext(s.url, esc(s.vendor), "name") + (s.blurb ? '<span class="blurb">' + esc(s.blurb) + '</span>' : "") + '</td><td class="nowrap">' + esc(L.seedcat[s.category] || s.category) + '</td><td>' + (o ? '<a href="#/onion/' + o.id + '">' + esc(o.short || o.name) + '</a>' : "—") + '</td><td>' + esc(s.ships || "") + '</td><td>' + linkStatus(s) + '</td><td class="nowrap">' + ext(s.url, "View ↗", "btn btn--ghost btn--sm") + '</td></tr>'; }).join(""); }).join("");
    return head("Seeds & sets", "Grow your own onion", D.seeds.length + " listings for onion seed, sets, bulbs and seedlings from " + vendors.length + " Australian suppliers, arranged by variety.") +
      '<div class="section" style="padding-top:20px">' + (D.growNote ? '<div class="notice" style="margin:0 0 20px"><h3>Day-length compatibility</h3><p>' + esc(D.growNote) + '</p></div>' : "") + chips +
      (rows ? '<div class="tablewrap"><table class="data stock"><thead><tr><th>Variety</th><th>Supplier</th><th>Form</th><th>Codex entry</th><th>Shipping</th><th>Link</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="empty"><h3>No listings.</h3></div>') + '</div>';
  };

  /* pantry */
  V.pantry = function () {
    var groups = {}; D.products.forEach(function (s) { (groups[s.category] = groups[s.category] || []).push(s); });
    var ks = Object.keys(L.prodcat).filter(function (k) { return groups[k]; });
    var jump = '<nav class="jump">' + ks.map(function (k) { return '<a class="chip" href="#/pantry" data-jump="pc-' + k + '">' + L.prodcat[k] + ' <small>' + groups[k].length + '</small></a>'; }).join("") + '</nav>';
    var body = ks.map(function (k) { return '<section class="block" id="pc-' + k + '"><h2 class="subhead">' + L.prodcat[k] + ' <small>' + plural(groups[k].length, "listing") + '</small></h2><p class="muted" style="margin:-6px 0 14px">' + esc(PURITY[k]) + '</p><div class="pgrid">' + groups[k].map(function (s) { return pcard(s, "product"); }).join("") + '</div></section>'; }).join("");
    return head("Preserved", "Preserved onions", D.products.length + " onion products that have been pickled, fried, dried, relished or frozen. Every Onion lists preserved onions only where onion is the point of the product.") + '<div class="section" style="padding-top:20px">' + jump + body + '</div>';
  };
  V.pantry.after = V.browse.after;

  /* names */
  V.names = function () {
    var st = state.st;
    return head("Regional naming advisory", "What is a shallot?", "Australia does not agree on what onions are called. The same word can mean a different onion in a different state. This advisory is provided for interstate shoppers." + (st ? " Rows for " + st + " are highlighted." : " Choose your state at the top of the page to highlight local usage.")) +
      '<div class="section" style="padding-top:24px"><div class="names">' + (D.names || []).map(function (n) {
        return '<div class="ncard"><h3>“' + esc(n.term) + '”</h3><table>' + n.rows.map(function (r) {
          var mine = st && r.where.indexOf(st) > -1, o = r.id && byId(r.id);
          return '<tr class="' + (mine ? "yours" : "") + '"><td>' + esc(r.where) + '</td><td>' + (o ? '<a href="#/onion/' + o.id + '">' + esc(r.means) + '</a>' : esc(r.means)) + '</td></tr>';
        }).join("") + '</table>' + (n.note ? '<p class="small muted" style="margin:10px 0 0">' + esc(n.note) + '</p>' : "") + '</div>';
      }).join("") + '</div></div>';
  };

  /* not an onion */
  V["not-an-onion"] = function () {
    return head("Scope", "Not an onion", "Every Onion is frequently asked to list things that are not onions. This page records the Codex's position on each of them.") +
      '<div class="section" style="padding-top:8px">' + D.notOnions.map(function (n) {
        return '<article class="reject" id="no-' + esc(n.id) + '"><div><h3>' + esc(n.name) + '</h3><p class="reject__bot">' + esc(n.bot) + '</p><p>' + esc(n.text) + '</p></div><span class="badge ' + (n.admitted ? "badge--ok" : "badge--warn") + '">' + esc(n.stamp || "Not an onion") + '</span></article>';
      }).join("") + '</div>';
  };

  /* about */
  V.about = function () {
    var scale = '<table><tbody>' + L.pung.map(function (l, i) { return '<tr><td>' + bars(i, true) + '</td><td><b>' + i + ' · ' + l + '.</b> ' + esc(D.scale.pungency[i]) + '</td></tr>'; }).join("") + '</tbody></table>';
    return head("Methodology", "How Every Onion works", "") +
      '<div class="section" style="padding-top:24px"><div class="prose">' + D.about.map(function (s) {
        return '<h2>' + esc(s.h) + '</h2>' + s.p.split("\n").map(function (x) { return '<p>' + esc(x) + '</p>'; }).join("") + (s.scale ? scale : "");
      }).join("") + '</div></div>';
  };

  /* compare */
  V.compare = function (qs) {
    var ids = (new URLSearchParams(qs || "").get("ids") || state.compare.join(",")).split(",").filter(byId).slice(0, 4);
    if (ids.length < 2) return head("Compare", "Compare onions", "Tick “Compare” on two to four onions in the Codex to see them side by side.") + '<div class="section"><a class="btn" href="#/codex">Go to the Codex</a></div>';
    var os = ids.map(byId);
    function best(vals, hi) { var m = hi ? Math.max.apply(null, vals) : Math.min.apply(null, vals); return vals.map(function (v) { return v === m; }); }
    var rows = [
      ["Botanical name", function (o) { return '<i>' + esc(o.bot) + '</i>'; }],
      ["Family", function (o) { return esc(L.family[o.family]); }],
      ["Lacrimal Index", function (o) { return tears(o); }, os.map(function (o) { return o.pungency; }), false],
      ["Sweetness Index", function (o) { return sugar(o); }, os.map(function (o) { return o.sweetness; }), true],
      ["Keeping quality", function (o) { return keeps(o); }, os.map(function (o) { return o.keeping; }), true],
      ["Colour", function (o) { return esc(L.colour[o.colour]); }],
      ["Shape", function (o) { return esc(L.shape[o.shape]); }],
      ["Size", function (o) { return esc(L.size[o.size]); }],
      ["Season", function (o) { return cal(o); }],
      ["Best for", function (o) { return o.uses.map(function (u) { return esc(L.use[u]); }).join(", "); }],
      ["Origin", function (o) { return esc(o.origin) + (o.place ? ", " + esc(o.place) : ""); }],
      ["Protection", function (o) { return esc(o.status || "None"); }],
      ["Availability", function (o) { return availBadge(o); }],
      ["Australian stockists", function (o) { return o._nStock; }, os.map(function (o) { return o._nStock; }), true],
      ["Seed listings", function (o) { return o._nSeed; }, os.map(function (o) { return o._nSeed; }), true]
    ];
    return head("Compare", "Onion comparison", "Side by side. The best value in each rated row is highlighted; fewest tears counts as best.") +
      '<div class="section" style="padding-top:24px"><div class="tablewrap ctable"><table><thead><tr><th></th>' + os.map(function (o) { return '<th><div class="onionname">' + swatch(o, "sm") + '<a href="#/onion/' + o.id + '" style="font-weight:700;font-size:16px;color:var(--text);text-decoration:none">' + esc(o.name) + '</a></div><button class="btn btn--ghost btn--sm" style="margin-top:8px" data-uncompare="' + o.id + '">Remove</button></th>'; }).join("") + '</tr></thead><tbody>' +
      rows.map(function (r) { var b = r[2] ? best(r[2], r[3]) : [], differs = r[2] && uniq(r[2]).length > 1; return '<tr><th scope="row">' + r[0] + '</th>' + os.map(function (o, i) { return '<td class="' + (differs && b[i] ? "best" : "") + '">' + r[1](o) + '</td>'; }).join("") + '</tr>'; }).join("") +
      '</tbody></table></div><p style="margin-top:16px"><button class="btn btn--ghost" data-clearcompare>Clear comparison</button></p></div>';
  };
  V.compare.after = function () {
    $main.querySelectorAll("[data-uncompare]").forEach(function (b) { b.addEventListener("click", function () { toggleCompare(b.dataset.uncompare, false); location.hash = "#/compare?ids=" + state.compare.join(","); }); });
    var c = $main.querySelector("[data-clearcompare]");
    if (c) c.addEventListener("click", function () { state.compare = []; store("compare", []); location.hash = "#/codex"; });
  };

  /* search */
  V.search = function (qs) {
    var q = new URLSearchParams(qs || "").get("q") || "";
    var nq = norm(q).trim();
    var hdr = document.getElementById("q"); if (hdr && document.activeElement !== hdr) hdr.value = q;
    if (!nq) return head("Search", "Search Every Onion", "Search every onion, alias, stockist, seed and preserved product.");
    var words = nq.split(/\s+/);
    function hit(t) { t = norm(t); return words.every(function (w) { return t.indexOf(w) > -1; }); }
    var mild = /(least|fewest|no|less|without) tears|tearless|mildest/.test(nq);
    var os = D.onions.filter(function (o) { return hit([o.name, o.bot, o.desc, o.origin, o.place, (o.aka || []).map(function (a) { return a.n + " " + (a.w || ""); }).join(" "), L.colour[o.colour], (o.facts || []).join(" ")].join(" ")); });
    function nameHit(o) { return hit(o.name + " " + (o.aka || []).map(function (x) { return x.n; }).join(" ")) ? 1 : 0; }
    os.sort(function (a, b) { return (nameHit(b) - nameHit(a)) || a.name.localeCompare(b.name); });
    if (mild) os = D.onions.slice().sort(function (a, b) { return a.pungency - b.pungency || b.sweetness - a.sweetness; }).slice(0, 8);
    var ss = D.stockists.filter(function (s) { return hit(s.name + " " + s.vendor + " " + (s.blurb || "") + " " + (s.states || []).join(" ") + " " + catLabel(s.category)); });
    var sd = D.seeds.filter(function (s) { return hit(s.name + " " + s.vendor + " " + (s.variety || "") + " " + (s.blurb || "")); });
    var pr = D.products.filter(function (s) { return hit(s.name + " " + s.vendor + " " + (s.blurb || "")); });
    var no = D.notOnions.filter(function (n) { return hit(n.name + " " + n.bot + " " + (n.keywords || "")); });
    var total = os.length + ss.length + sd.length + pr.length;
    var html = '<div class="results">';
    html += no.map(function (n) { return '<div class="notice' + (n.admitted ? "" : " notice--warn") + '"><h3>' + esc(n.name) + ': ' + (n.admitted ? esc(n.stamp || "admitted") : "not an onion") + '</h3><p>' + esc(n.text) + '</p><p><a href="#/not-an-onion">Read the scope policy</a></p></div>'; }).join("");
    if (os.length) html += '<h2>' + (mild ? "Onions with the fewest tears" : "Onions") + ' <small>' + os.length + '</small></h2><div class="grid">' + os.map(card).join("") + '</div>';
    if (ss.length) html += '<h2>Australian stockists <small>' + ss.length + '</small></h2>' + stockTable(ss, "cat", "asc", false);
    if (sd.length) html += '<h2>Seeds, sets &amp; seedlings <small>' + sd.length + '</small></h2><div class="pgrid">' + sd.map(function (s) { return pcard(s, "seed"); }).join("") + '</div>';
    if (pr.length) html += '<h2>Preserved onions <small>' + pr.length + '</small></h2><div class="pgrid">' + pr.map(function (s) { return pcard(s, "product"); }).join("") + '</div>';
    if (!total && !no.length) html += '<div class="empty" style="margin-top:24px"><h3>No onions found for “' + esc(q) + '”.</h3><p>If it is an onion, it should be here. It may not be an onion; see <a href="#/not-an-onion">Not an onion</a>.</p></div>';
    html += '</div>';
    return head("Search results", "Results for “" + esc(q) + "”", plural(total, "result") + " across onions, stockists, seeds and preserved products.") + '<div class="section" style="padding-top:4px">' + html + '</div>';
  };

  V.notfound = function () { return head("Not found", "Page not found", 'This page is not an onion. <a href="#/codex">Return to the Codex</a>.'); };

  /* ---------- compare bar ---------- */
  function toggleCompare(id, on) {
    var i = state.compare.indexOf(id);
    if (on && i < 0) { if (state.compare.length >= 4) state.compare.shift(); state.compare.push(id); }
    if (!on && i > -1) state.compare.splice(i, 1);
    store("compare", state.compare);
    renderCompareBar();
    document.querySelectorAll("[data-compare]").forEach(function (c) { c.checked = state.compare.indexOf(c.dataset.compare) > -1; });
  }
  function renderCompareBar() {
    var bar = document.getElementById("compareBar");
    if (!state.compare.length || location.hash.split("?")[0] === "#/compare") { bar.hidden = true; return; }
    bar.hidden = false;
    bar.innerHTML = '<span>' + esc(state.compare.map(function (id) { return byId(id).short || byId(id).name; }).join(", ")) + '</span>' +
      (state.compare.length > 1 ? '<a class="btn btn--sm" href="#/compare?ids=' + state.compare.join(",") + '">Compare ' + state.compare.length + '</a>' : '<span class="small muted">Select one more</span>') +
      '<button class="x" type="button">Clear</button>';
    bar.querySelector(".x").addEventListener("click", function () { state.compare = []; store("compare", []); renderCompareBar(); document.querySelectorAll("[data-compare]").forEach(function (c) { c.checked = false; }); });
  }
  document.addEventListener("change", function (e) { var t = e.target; if (t.matches && t.matches("[data-compare]")) toggleCompare(t.dataset.compare, t.checked); });

  /* ---------- state picker ---------- */
  var sel = document.getElementById("stateSel");
  sel.value = state.st;
  function setState(v) { state.st = v; store("state", v); sel.value = v; render(); }
  sel.addEventListener("change", function () { setState(sel.value); });

  /* ---------- header search ---------- */
  var hq = document.getElementById("q"), htm;
  hq.addEventListener("input", function () { clearTimeout(htm); htm = setTimeout(function () { var v = hq.value.trim(); if (v) location.hash = "#/search?q=" + encodeURIComponent(v); }, 250); });
  document.getElementById("searchForm").addEventListener("submit", function (e) { e.preventDefault(); location.hash = "#/search?q=" + encodeURIComponent(hq.value.trim()); });
  document.querySelectorAll('[data-meta="checked"]').forEach(function (e) { e.textContent = D.meta.checked; });

  /* ---------- router ---------- */
  var lastPath = null;
  var TITLES = {codex:"The Onion Codex", stockists:"Where to buy onions in Australia", browse:"Browse onions by style", world:"International onions", grow:"Onion seeds, sets & seedlings", pantry:"Preserved onions", names:"Regional naming advisory", "not-an-onion":"Not an onion", about:"Methodology", compare:"Compare onions", search:"Search"};
  function render() {
    if (location.hash === "#buy" || location.hash === "#grow") return; // in-page anchors on onion pages
    var h = location.hash.replace(/^#\/?/, "");
    var qi = h.indexOf("?"), path = qi > -1 ? h.slice(0, qi) : h, qs = qi > -1 ? h.slice(qi + 1) : "";
    var parts = path.split("/"), name = parts[0] || "home";
    var fn = V[name] || V.notfound, arg = name === "onion" ? decodeURIComponent(parts[1] || "") : qs;
    var same = lastPath === path, y = window.scrollY;
    $main.innerHTML = fn(arg);
    if (fn.after) fn.after(arg);
    document.querySelectorAll("[data-nav]").forEach(function (a) { if (a.dataset.nav === (name === "onion" ? "codex" : name)) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    var t = name === "onion" && byId(arg) ? byId(arg).name + " — The Onion Codex" : TITLES[name] || (name === "home" ? "" : "Not found");
    document.title = (t ? t + " · " : "") + "Every Onion — Australia's onion-only marketplace aggregator";
    if (same) window.scrollTo(0, y); else if (name !== "search") window.scrollTo(0, 0);
    if (refocus) { var el = document.getElementById(refocus); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } refocus = null; }
    if (name !== "search" && document.activeElement !== hq) hq.value = "";
    lastPath = path;
    renderCompareBar();
  }
  window.addEventListener("hashchange", render);
  render();
})();
