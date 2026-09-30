/* Every Onion - Onion Procurement System v4.2 (Build 4.2.1187)
   Plain JS, no build step. All records live in data/data.js (window.EO). */
(function () {
  "use strict";
  var D = window.EO;
  var VERSION = "4.2", BUILD = "4.2.1187";
  var STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
  var MON = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem("eo42." + k)); localStorage.setItem("eo42." + k, JSON.stringify(v)); } catch (e) { return null; } }
  function money(n, dp) { if (n == null) return ""; var s = n.toFixed(dp == null ? 2 : dp); var p = s.split("."); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ","); return "$" + p.join("."); }
  function domain(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } }

  var BY = {}, TAG = {};
  D.onions.forEach(function (o) { BY[o.id] = o; o.match = o.match || [o.id]; });
  D.onions.forEach(function (o) { o.match.forEach(function (t) { if (!TAG[t]) TAG[t] = o; }); });
  function hits(list, o) { return list.filter(function (s) { return (s.onions || []).some(function (t) { return o.match.indexOf(t) > -1; }); }); }
  function stOK(s, st) { if (!st) return true; var a = s.states || []; return a.indexOf(st) > -1 || a.indexOf("National") > -1 || a.indexOf("Online") > -1; }
  D.onions.forEach(function (o) { o._stk = hits(D.stockists, o); o._seed = hits(D.seeds, o); o._prod = hits(D.products, o); });
  function codesFor(tags) { return uniq((tags || []).map(function (t) { return TAG[t]; }).filter(Boolean)).map(function (o) { return o.code; }); }

  /* ---------- lookups ---------- */
  var L = {
    colour: {brown:"Brown",red:"Red/purple",white:"White",gold:"Golden",pink:"Pink/copper",grey:"Grey",green:"Green"},
    colAbbr: {brown:"BRN",red:"RED",white:"WHT",gold:"GLD",pink:"PNK",grey:"GRY",green:"GRN"},
    sw: {brown:"#a86a32",red:"#6d2046",white:"#f4efe4",gold:"#d9a441",pink:"#c8785a",grey:"#9a8f86",green:"#5f8a35"},
    family: {everyday:"Everyday",shallot:"Shallot/eschalot",green:"Green/bunching",sweet:"Sweet",protected:"Protected/regional",heirloom:"Heirloom/garden",perennial:"Perennial/unusual",giant:"Giant"},
    size: {pearl:"Pearl <3cm",small:"Small 3-5cm",medium:"Medium 5-8cm",large:"Large 8-10cm",jumbo:"Jumbo 10cm+",giant:"Exhibition"},
    sizeAbbr: {pearl:"PRL",small:"SML",medium:"MED",large:"LGE",jumbo:"JMB",giant:"EXH"},
    sizeOrd: ["pearl","small","medium","large","jumbo","giant"],
    shape: {globe:"Globe",flat:"Flattened",torpedo:"Torpedo",teardrop:"Teardrop",cluster:"Clustering",bunching:"Bunching",bulbing:"Bulb & stalk",tree:"Top-setting"},
    avail: {supermarket:"Supermarket",specialist:"Specialist",grow:"Grow only",overseas:"Overseas only"},
    availAbbr: {supermarket:"SUPM",specialist:"SPEC",grow:"GROW",overseas:"O/S"},
    availOrd: ["supermarket","specialist","grow","overseas"],
    region: {aus:"Australia/NZ",europe:"Europe",americas:"Americas",asia:"Asia",africa:"Africa/Middle East",unknown:"Unknown"},
    use: {raw:"Raw",pickle:"Pickling",caramelise:"Caramelising",roast:"Roasting",grill:"Grilling",soup:"Soup/stock",stirfry:"Stir-fry",curry:"Curry base",sauce:"Sauce",fry:"Frying",garnish:"Garnish",braise:"Braising",exhibit:"Exhibition"},
    pung: ["Tearless","Negligible","Mild","Moderate","Pronounced","Severe"],
    sweet: ["None","Faint","Light","Moderate","Sweet","Very sweet"],
    keep: ["Days","Weeks","~1 month","~2 months","Several months","Most of a year"],
    cat: {supermarket:"Supermarket","online-grocer":"Online/delivery",greengrocer:"Greengrocer",market:"Market","asian-grocer":"Asian grocer","indian-grocer":"Indian grocer",grower:"Grower/industry",wholesale:"Wholesale/bulk"},
    seedcat: {seed:"Seed","sets-bulbs":"Sets/bulbs",seedlings:"Seedlings"},
    prodcat: {pickled:"Pickled",fried:"Fried",dried:"Dried",relish:"Relish/chutney","soup-dip":"Soup/dip",frozen:"Frozen",other:"Other"},
    basis: {OBS:"Derived from Australian retail prices observed 30/09/2026", EST:"Estimate (specialist / market-garden equivalent)", ORIG:"Indicative price at origin, converted to AUD. Not importable into Australia."}
  };
  var CLASS = {pickled:"Onion, preserved in vinegar. Vinegar exempted.", fried:"Onion, fried. Oil incidental.", dried:"Onion, water removed.", "soup-dip":"Onion-flavoured. Contains non-onion.", relish:"Onion, cooked with sugar.", frozen:"Onion, cold.", other:"Onion-derived."};

  /* ---------- state ---------- */
  var S = {
    tab: "register", sel: null, detailTab: "general",
    opts: store("opts") || {state: ""},
    q: {}, sort: {}, gridSel: {}, last: {}, intlTab: "links"
  };
  var TABS = [["register","Onion Register"],["stockists","Stockists (AU)"],["seeds","Seeds & Sets"],["preserved","Preserved"],["international","International"],["naming","Naming"],["scope","Scope"],["methodology","Methodology"]];

  /* ---------- generic grid ---------- */
  function sortRows(rows, cols, srt) {
    if (!srt || !srt.k) return rows;
    var c = cols.filter(function (x) { return x.k === srt.k; })[0]; if (!c) return rows;
    var g = c.sort || c.csv;
    return rows.slice().sort(function (a, b) {
      var x = g(a), y = g(b);
      if (x == null || x === "") return 1; if (y == null || y === "") return -1;
      var r = x < y ? -1 : x > y ? 1 : 0; return srt.dir === "desc" ? -r : r;
    });
  }
  function gridHTML(gid, cols, rows, opt) {
    opt = opt || {};
    var srt = S.sort[gid] || opt.sort || {};
    rows = sortRows(rows, cols, srt);
    S.last[gid] = {cols: cols, rows: rows, title: opt.title || gid};
    var h = '<table class="grid" data-grid="' + gid + '"><thead><tr>' + cols.map(function (c) {
      var on = srt.k === c.k;
      return '<th class="' + (c.num ? "num" : "") + '"' + (on ? ' aria-sort="' + (srt.dir === "desc" ? "descending" : "ascending") + '"' : "") + '><button type="button" class="gh" data-sort="' + c.k + '" title="' + esc(c.t || c.h) + '">' + esc(c.h) + (on ? (srt.dir === "desc" ? " ▼" : " ▲") : "") + '</button></th>';
    }).join("") + '</tr></thead><tbody>';
    if (!rows.length) h += '<tr class="empty-row"><td colspan="' + cols.length + '">' + esc(opt.empty || "No records match the query.") + '</td></tr>';
    h += rows.map(function (r) {
      var key = opt.key(r);
      return '<tr tabindex="-1" data-key="' + esc(key) + '"' + (S.gridSel[gid] === key ? ' class="sel"' : "") + '>' + cols.map(function (c) { return '<td class="' + (c.num ? "num " : "") + (c.cls ? c.cls(r) : "") + (c.wrap ? " wrap" : "") + '">' + c.cell(r) + '</td>'; }).join("") + '</tr>';
    }).join("");
    return h + '</tbody></table>';
  }
  function col(k, h, t, cell, sort, csv, extra) { var c = {k: k, h: h, t: t, cell: cell, sort: sort, csv: csv || sort}; for (var x in extra) c[x] = extra[x]; return c; }
  function selOpts(map, cur, any) { return (any !== false ? '<option value="">' + (any || "(All)") + '</option>' : "") + Object.keys(map).map(function (k) { return '<option value="' + esc(k) + '"' + (cur === k ? " selected" : "") + '>' + esc(map[k]) + '</option>'; }).join(""); }
  function arrOpts(arr, cur, any) { var m = {}; arr.forEach(function (x) { m[x] = x; }); return selOpts(m, cur, any); }
  function statusCell(s) { return s.status === "200" ? "OK" : '<span class="muted">RS</span>'; }
  function urlCell(u) { return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(domain(u)) + '</a>'; }
  function cal(o) { return '<span class="cal">' + MON.map(function (m, i) { return '<span class="' + (o.season.indexOf(i + 1) > -1 ? "on" : "") + '">' + m + '</span>'; }).join("") + '</span>'; }
  function sw(o) { return '<span class="sw" style="background:' + (o.leaf || o.skin) + '"></span>'; }

  /* ---------- onion register ---------- */
  var OCOLS = [
    col("code", "CODE", "Variety code", function (o) { return esc(o.code); }, function (o) { return o.code; }),
    col("name", "VARIETY", "Variety name", function (o) { return esc(o.name); }, function (o) { return o.name.toLowerCase(); }, function (o) { return o.name; }),
    col("col", "COL", "Skin colour", function (o) { return sw(o) + L.colAbbr[o.colour]; }, function (o) { return L.colAbbr[o.colour]; }),
    col("size", "SZ", "Size class: PRL <3cm, SML 3-5, MED 5-8, LGE 8-10, JMB 10+, EXH exhibition", function (o) { return L.sizeAbbr[o.size]; }, function (o) { return L.sizeOrd.indexOf(o.size); }, function (o) { return L.sizeAbbr[o.size]; }),
    col("pung", "PUNG", "Pungency (Lacrimal Index), 0 tearless to 5 severe", function (o) { return o.pungency; }, function (o) { return o.pungency; }, null, {num: 1}),
    col("swt", "SWT", "Sweetness Index, raw, 1-5", function (o) { return o.sweetness; }, function (o) { return o.sweetness; }, null, {num: 1}),
    col("keep", "KEEP", "Keeping quality, 1 (weeks) to 5 (most of a year)", function (o) { return o.keeping; }, function (o) { return o.keeping; }, null, {num: 1}),
    col("wt", "AVG WT g", "Estimated average weight per onion (per stalk for green onions), grams", function (o) { return o.price.g; }, function (o) { return o.price.g; }, null, {num: 1}),
    col("kg", "$/KG", "Indicative price per kg, AUD, as at " + D.meta.priced, function (o) { return o.price.kg == null ? '<span class="poa">POA</span>' : money(o.price.kg); }, function (o) { return o.price.kg; }, function (o) { return o.price.kg == null ? "POA" : o.price.kg.toFixed(2); }, {num: 1}),
    col("ea", "$/EA", "Indicative price per onion = AVG WT x $/KG", function (o) { return o.price.each == null ? '<span class="poa">POA</span>' : money(o.price.each); }, function (o) { return o.price.each; }, function (o) { return o.price.each == null ? "POA" : o.price.each.toFixed(2); }, {num: 1}),
    col("k1", "$/1000", "Indicative price per 1,000 onions", function (o) { return o.price.per1000 == null ? '<span class="poa">POA</span>' : money(o.price.per1000); }, function (o) { return o.price.per1000; }, function (o) { return o.price.per1000 == null ? "POA" : o.price.per1000.toFixed(2); }, {num: 1}),
    col("sack", "SACK", "Bulk sack: size and indicative price", function (o) { return o.price.sackKg ? o.price.sackKg + "kg " + money(o.price.sackPrice) : '<span class="muted">-</span>'; }, function (o) { return o.price.sackPrice || null; }, function (o) { return o.price.sackKg ? o.price.sackKg + "kg " + o.price.sackPrice.toFixed(2) : ""; }),
    col("basis", "BASIS", "OBS = derived from observed AU retail prices; EST = estimate; ORIG = at origin, AUD equiv., not importable", function (o) { return o.price.basis; }, function (o) { return o.price.basis; }, null, {cls: function (o) { return "b-" + o.price.basis; }}),
    col("origin", "ORIGIN", "Country of origin", function (o) { return esc(o.origin); }, function (o) { return o.origin; }),
    col("avail", "AVAIL", "SUPM supermarket; SPEC specialist; GROW grow only; O/S overseas only", function (o) { return L.availAbbr[o.avail]; }, function (o) { return L.availOrd.indexOf(o.avail); }, function (o) { return L.availAbbr[o.avail]; }),
    col("stk", "STK", "Australian stockist listings", function (o) { return o._stk.length || '<span class="muted">0</span>'; }, function (o) { return o._stk.length; }, null, {num: 1}),
    col("seed", "SEED", "Seed / set / bulb listings", function (o) { return o._seed.length || '<span class="muted">0</span>'; }, function (o) { return o._seed.length; }, null, {num: 1})
  ];
  (function () { var order = ["code","name","kg","ea","k1","wt","col","size","pung","swt","keep","sack","basis","origin","avail","stk","seed"]; OCOLS.sort(function (a, b) { return order.indexOf(a.k) - order.indexOf(b.k); }); })();
  function ocol(k) { return OCOLS.filter(function (c) { return c.k === k; })[0]; }
  var QDEF = {text: "", colour: "", family: "", size: "", shape: "", pmin: "0", pmax: "5", smin: "", avail: "", region: "", state: "", stype: "", maxkg: "", season: false, priced: false, hasstk: false, hasseed: false};
  S.q.register = Object.assign({}, QDEF);
  function registerRows() {
    var q = S.q.register, t = norm(q.text).trim(), mon = new Date().getMonth() + 1, mk = parseFloat(q.maxkg);
    return D.onions.filter(function (o) {
      if (t && norm([o.code, o.name, o.bot, o.origin, o.place, (o.aka || []).map(function (a) { return a.n; }).join(" ")].join(" ")).indexOf(t) < 0) return false;
      if (q.colour && o.colour !== q.colour) return false;
      if (q.family && o.family !== q.family) return false;
      if (q.size && o.size !== q.size) return false;
      if (q.shape && o.shape !== q.shape) return false;
      if (o.pungency < +q.pmin || o.pungency > +q.pmax) return false;
      if (q.smin && o.sweetness < +q.smin) return false;
      if (q.avail && o.avail !== q.avail) return false;
      if (q.region && o.region !== q.region) return false;
      if (q.state && !o._stk.some(function (s) { return stOK(s, q.state); })) return false;
      if (q.stype && !o._stk.some(function (s) { return s.category === q.stype; })) return false;
      if (!isNaN(mk) && (o.price.kg == null || o.price.kg > mk)) return false;
      if (q.season && (o.avail === "overseas" || o.season.indexOf(mon) < 0)) return false;
      if (q.priced && o.price.kg == null) return false;
      if (q.hasstk && !o._stk.length) return false;
      if (q.hasseed && !o._seed.length) return false;
      return true;
    });
  }
  function rangeOpts(a, b, cur) { var s = ""; for (var i = a; i <= b; i++) s += '<option' + (String(i) === String(cur) ? " selected" : "") + '>' + i + '</option>'; return s; }
  var V = {};
  V.register = function () {
    var q = S.q.register;
    var form = '<fieldset class="group"><legend>Query</legend><form class="q' + (S.adv ? " showadv" : "") + '" data-q="register" autocomplete="off">' +
      '<label>Variety / code<input class="field" name="text" id="qFind" size="18" value="' + esc(q.text) + '"></label>' +
      '<label>Colour<select class="field" name="colour">' + selOpts(L.colour, q.colour) + '</select></label>' +
      '<label class="adv">Family<select class="field" name="family">' + selOpts(L.family, q.family) + '</select></label>' +
      '<label class="adv">Size<select class="field" name="size">' + selOpts(L.size, q.size) + '</select></label>' +
      '<label class="adv">Shape<select class="field" name="shape">' + selOpts(L.shape, q.shape) + '</select></label>' +
      '<label class="adv" title="Pungency (Lacrimal Index) range">PUNG from/to<span class="pair"><select class="field" name="pmin">' + rangeOpts(0, 5, q.pmin) + '</select><select class="field" name="pmax">' + rangeOpts(0, 5, q.pmax) + '</select></span></label>' +
      '<label class="adv">SWT min<select class="field" name="smin"><option value="">-</option>' + rangeOpts(1, 5, q.smin) + '</select></label>' +
      '<label class="adv">Avail.<select class="field" name="avail">' + selOpts(L.avail, q.avail) + '</select></label>' +
      '<label class="adv">Origin<select class="field" name="region">' + selOpts(L.region, q.region) + '</select></label>' +
      '<label class="adv">Stocked in<select class="field" name="state">' + arrOpts(STATES, q.state, "(Any)") + '</select></label>' +
      '<label class="adv">Stockist type<select class="field" name="stype">' + selOpts(L.cat, q.stype, "(Any)") + '</select></label>' +
      '<label class="adv">Max $/kg<input class="field" name="maxkg" size="6" inputmode="decimal" value="' + esc(q.maxkg) + '"></label>' +
      '<label class="inline adv"><input type="checkbox" name="season"' + (q.season ? " checked" : "") + '>In season (AU)</label>' +
      '<label class="inline adv"><input type="checkbox" name="priced"' + (q.priced ? " checked" : "") + '>Priced only</label>' +
      '<label class="inline adv"><input type="checkbox" name="hasstk"' + (q.hasstk ? " checked" : "") + '>Has AU stockists</label>' +
      '<label class="inline adv"><input type="checkbox" name="hasseed"' + (q.hasseed ? " checked" : "") + '>Has seed</label>' +
      '<span class="btns"><button class="btn def" type="submit">Search</button><button class="btn" type="button" data-act="clear">Clear</button><button class="btn advbtn" type="button" data-act="adv">' + (S.adv ? "Fewer..." : "More...") + '</button></span></form></fieldset>';
    var rows = registerRows();
    if (S.sel && !rows.some(function (o) { return o.id === S.sel; })) S.sel = rows[0] ? rows[0].id : null;
    if (!S.sel && rows[0]) S.sel = rows[0].id;
    S.gridSel.register = S.sel;
    return form + '<div class="split"><div class="frame" data-frame="register">' + gridHTML("register", OCOLS, rows, {key: function (o) { return o.id; }, sort: {k: "code", dir: "asc"}, title: "Onion Register"}) + '</div>' +
      '<div class="detail" id="detail">' + detailHTML() + '</div></div>';
  };

  /* detail pane */
  var DTABS = [["general","General"],["pricing","Pricing"],["stockists","Stockists"],["seeds","Seeds"],["preserved","Preserved"],["links","Links"],["notes","Notes"]];
  function kv(rows) { return '<table class="kv"><tbody>' + rows.map(function (r) { return '<tr><th>' + r[0] + ':</th><td>' + r[1] + '</td></tr>'; }).join("") + '</tbody></table>'; }
  function generalHTML(o) {
    return '<div class="cols">' +
      kv([["Code", esc(o.code)], ["Variety", "<b>" + esc(o.name) + "</b>"], ["Botanical", "<i>" + esc(o.bot) + "</i>"], ["Family", esc(L.family[o.family])], ["Also known as", esc((o.aka || []).map(function (a) { return a.n + (a.w ? " (" + a.w + ")" : ""); }).join("; ") || "-")]]) +
      kv([["Skin", esc(o.skinDesc || L.colour[o.colour])], ["Flesh", esc(o.fleshDesc || "White")], ["Shape", esc(L.shape[o.shape])], ["Size", esc(L.size[o.size]) + (o.diam ? " (" + esc(o.diam) + ")" : "")], ["Uses", esc(o.uses.map(function (u) { return L.use[u]; }).join(", "))]]) +
      kv([["PUNG / SWT / KEEP", o.pungency + " / " + o.sweetness + " / " + o.keeping + ' <span class="muted">(' + L.pung[o.pungency] + ", " + L.sweet[o.sweetness].toLowerCase() + ", keeps " + L.keep[o.keeping].toLowerCase() + ')</span>'], ["Origin", esc(o.origin + (o.place ? ", " + o.place : ""))], ["Protection", esc(o.status || "None")], ["Availability", esc(L.avail[o.avail])], [o.avail === "overseas" ? "Season (origin)" : "Season (AU)", cal(o)]]) +
      '</div>';
  }
  function pricingHTML(o) {
    var p = o.price;
    var rows = p.kg == null ? [["Price", '<span class="poa">Price on application</span>'], ["AVG WT", p.g + " g"]] : [
      ["$/kg", money(p.kg)], ["AVG WT", p.g + " g" + (p.note ? ' <span class="muted">(' + esc(p.note) + ')</span>' : "")], ["$/onion", money(p.each)], ["$/100", money(p.kg * p.g / 10)], ["$/1000", "<b>" + money(p.per1000) + "</b>"], ["$/10,000", money(p.per1000 * 10, 0)],
      ["Onions per kg", "approx. " + Math.round(1000 / p.g)]];
    if (p.sackKg) rows.push(["Bulk sack", p.sackKg + " kg @ " + money(p.sackPrice) + " (" + money(p.sackPrice / p.sackKg) + "/kg, approx. " + Math.round(p.sackKg * 1000 / p.g) + " onions)"]);
    rows.push(["Basis", '<span class="b-' + p.basis + '">' + p.basis + "</span> - " + esc(L.basis[p.basis])]);
    rows.push(["Price date", D.meta.priced + " (indicative only; not a retailer quote)"]);
    return kv(rows) + (p.kg != null ? '<button class="btn" type="button" data-act="quote">Quote...</button>' : "");
  }
  function detailHTML() {
    var o = BY[S.sel];
    if (!o) return '<div class="subpanel muted">No record selected.</div>';
    var n = {stockists: o._stk.length, seeds: o._seed.length, preserved: o._prod.length, links: (o.links || []).length};
    var tabs = '<div class="subtabs" role="tablist">' + DTABS.map(function (t) { return '<button type="button" class="tab" role="tab" data-dtab="' + t[0] + '" aria-selected="' + (S.detailTab === t[0]) + '">' + t[1] + (n[t[0]] != null ? " (" + n[t[0]] + ")" : "") + '</button>'; }).join("") + '</div>';
    var body, dt = S.detailTab, st = S.opts.state;
    if (dt === "general") body = generalHTML(o);
    else if (dt === "pricing") body = pricingHTML(o);
    else if (dt === "stockists") body = o._stk.length ? '<div class="frame">' + gridHTML("d-stk", SCOLS, o._stk.filter(function (s) { return stOK(s, st); }), {key: function (s) { return s.url; }, sort: {k: "type", dir: "asc"}, title: o.code + " stockists", empty: "No stockists listed for " + st + "."}) + '</div>' : '<p class="muted">No Australian stockists listed.' + (o.avail === "overseas" ? " Overseas only; see Links." : o._seed.length ? " See Seeds." : "") + '</p>';
    else if (dt === "seeds") body = o._seed.length ? '<div class="frame">' + gridHTML("d-seed", SEEDCOLS, o._seed, {key: function (s) { return s.url; }, sort: {k: "var", dir: "asc"}, title: o.code + " seed"}) + '</div>' : '<p class="muted">No seed, set or bulb listings.</p>';
    else if (dt === "preserved") body = o._prod.length ? '<div class="frame">' + gridHTML("d-prod", PCOLS, o._prod, {key: function (s) { return s.url; }, title: o.code + " preserved"}) + '</div>' : '<p class="muted">No preserved products listed.</p>';
    else if (dt === "links") body = (o.links || []).length ? '<div class="frame">' + gridHTML("d-links", LCOLS, o.links, {key: function (l) { return l.url; }, title: o.code + " links"}) + '</div>' : '<p class="muted">No international links on file.</p>';
    else body = '<div class="memo">' + (o.advisory ? '<div class="infobox">' + esc(o.advisory.replace(/<[^>]+>/g, "")) + '</div>' : "") + '<p>' + esc(o.desc) + '</p><ul>' + (o.facts || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join("") + '</ul></div>';
    return tabs + '<div class="subpanel">' + body + '</div>';
  }

  /* ---------- stockists ---------- */
  var SCOLS = [
    col("name", "STOCKIST", "Stockist and page", function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>'; }, function (s) { return s.name.toLowerCase(); }, function (s) { return s.name; }),
    col("type", "TYPE", "Stockist type", function (s) { return esc(L.cat[s.category] || s.category); }, function (s) { return (Object.keys(L.cat).indexOf(s.category) + 10) + s.name.toLowerCase(); }, function (s) { return L.cat[s.category] || s.category; }),
    col("serves", "SERVES", "States/territories served. National and Online stockists serve all.", function (s) { return esc((s.states || []).join(" ")); }, function (s) { return (s.states || []).join(" "); }),
    col("codes", "ONION CODES", "Codex varieties stocked", function (s) { return esc(codesFor(s.onions).join(" ")); }, function (s) { return codesFor(s.onions).join(" "); }),
    col("lnk", "LNK", "OK = link verified 30/09/2026; RS = retailer site blocks automated checks", function (s) { return statusCell(s); }, function (s) { return s.status === "200" ? "OK" : "RS"; }),
    col("note", "DESCRIPTION", "", function (s) { return esc(s.blurb || ""); }, function (s) { return s.blurb || ""; }),
    col("url", "URL", "", function (s) { return urlCell(s.url); }, function (s) { return s.url; })
  ];
  S.q.stockists = {text: "", state: "", type: "", code: "", lnk: ""};
  V.stockists = function () {
    var q = S.q.stockists;
    var rows = D.stockists.filter(function (s) {
      if (q.text && norm(s.name + " " + s.vendor + " " + (s.blurb || "")).indexOf(norm(q.text)) < 0) return false;
      if (q.state && !stOK(s, q.state)) return false;
      if (q.type && s.category !== q.type) return false;
      if (q.code && codesFor(s.onions).indexOf(q.code) < 0) return false;
      if (q.lnk && (s.status === "200" ? "OK" : "RS") !== q.lnk) return false;
      return true;
    });
    var codes = D.onions.filter(function (o) { return o._stk.length; }).map(function (o) { return o.code; }).sort();
    var cm = {}; codes.forEach(function (c) { cm[c] = c + " " + D.onions.filter(function (o) { return o.code === c; })[0].name; });
    return '<fieldset class="group"><legend>Query</legend><form class="q" data-q="stockists" autocomplete="off">' +
      '<label>Name contains<input class="field" name="text" id="qFind" size="20" value="' + esc(q.text) + '"></label>' +
      '<label>State<select class="field" name="state">' + arrOpts(STATES, q.state, "(All)") + '</select></label>' +
      '<label>Type<select class="field" name="type">' + selOpts(L.cat, q.type) + '</select></label>' +
      '<label>Onion code<select class="field" name="code">' + selOpts(cm, q.code) + '</select></label>' +
      '<label>Link<select class="field" name="lnk">' + selOpts({OK: "OK (verified)", RS: "RS (retailer site)"}, q.lnk) + '</select></label>' +
      '<span class="btns"><button class="btn def" type="submit">Search</button><button class="btn" type="button" data-act="clear">Clear</button></span></form></fieldset>' +
      '<div class="frame fixed" style="flex:1">' + gridHTML("stockists", SCOLS, rows, {key: function (s) { return s.url; }, sort: {k: "type", dir: "asc"}, title: "Stockists (AU)"}) + '</div>';
  };

  /* ---------- seeds ---------- */
  var SEEDCOLS = [
    col("var", "VARIETY", "Variety as listed", function (s) { return esc(s.variety || "-"); }, function (s) { return (s.variety || "").toLowerCase(); }, function (s) { return s.variety || ""; }),
    col("sup", "SUPPLIER", "", function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.vendor) + '</a>'; }, function (s) { return s.vendor.toLowerCase(); }, function (s) { return s.vendor; }),
    col("form", "FORM", "Seed, sets/bulbs or seedlings", function (s) { return esc(L.seedcat[s.category] || s.category); }, function (s) { return L.seedcat[s.category] || s.category; }),
    col("code", "CODE", "Codex variety code", function (s) { return esc(codesFor(s.onions).join(" ") || "-"); }, function (s) { return codesFor(s.onions).join(" "); }),
    col("ships", "SHIPS", "Shipping / quarantine note", function (s) { return esc(s.ships || ""); }, function (s) { return s.ships || ""; }),
    col("lnk", "LNK", "OK = link verified; RS = retailer site", function (s) { return statusCell(s); }, function (s) { return s.status === "200" ? "OK" : "RS"; }),
    col("url", "URL", "", function (s) { return urlCell(s.url); }, function (s) { return s.url; })
  ];
  S.q.seeds = {text: "", form: "", sup: ""};
  V.seeds = function () {
    var q = S.q.seeds;
    var rows = D.seeds.filter(function (s) {
      if (q.text && norm((s.variety || "") + " " + s.name + " " + (s.blurb || "")).indexOf(norm(q.text)) < 0) return false;
      if (q.form && s.category !== q.form) return false;
      if (q.sup && s.vendor !== q.sup) return false;
      return true;
    });
    return '<fieldset class="group"><legend>Query</legend><form class="q" data-q="seeds" autocomplete="off">' +
      '<label>Variety contains<input class="field" name="text" id="qFind" size="20" value="' + esc(q.text) + '"></label>' +
      '<label>Form<select class="field" name="form">' + selOpts(L.seedcat, q.form) + '</select></label>' +
      '<label>Supplier<select class="field" name="sup">' + arrOpts(uniq(D.seeds.map(function (s) { return s.vendor; })).sort(), q.sup) + '</select></label>' +
      '<span class="btns"><button class="btn def" type="submit">Search</button><button class="btn" type="button" data-act="clear">Clear</button></span></form></fieldset>' +
      '<div class="infobox">' + esc(D.growNote) + '</div>' +
      '<div class="frame fixed" style="flex:1">' + gridHTML("seeds", SEEDCOLS, rows, {key: function (s) { return s.url; }, sort: {k: "var", dir: "asc"}, title: "Seeds & Sets"}) + '</div>';
  };

  /* ---------- preserved ---------- */
  var PCOLS = [
    col("name", "PRODUCT", "", function (s) { return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>'; }, function (s) { return s.name.toLowerCase(); }, function (s) { return s.name; }),
    col("vendor", "VENDOR", "", function (s) { return esc(s.vendor); }, function (s) { return s.vendor; }),
    col("cat", "CAT", "Preservation category", function (s) { return esc(L.prodcat[s.category] || s.category); }, function (s) { return L.prodcat[s.category] || s.category; }),
    col("code", "CODE", "Codex variety code", function (s) { return esc(codesFor(s.onions).join(" ") || "-"); }, function (s) { return codesFor(s.onions).join(" "); }),
    col("cls", "CLASSIFICATION", "Every Onion classification note", function (s) { return esc(CLASS[s.category] || CLASS.other); }, function (s) { return CLASS[s.category] || CLASS.other; }),
    col("lnk", "LNK", "OK = link verified; RS = retailer site", function (s) { return statusCell(s); }, function (s) { return s.status === "200" ? "OK" : "RS"; }),
    col("url", "URL", "", function (s) { return urlCell(s.url); }, function (s) { return s.url; })
  ];
  S.q.preserved = {text: "", cat: ""};
  V.preserved = function () {
    var q = S.q.preserved;
    var rows = D.products.filter(function (s) {
      if (q.text && norm(s.name + " " + s.vendor + " " + (s.blurb || "")).indexOf(norm(q.text)) < 0) return false;
      if (q.cat && s.category !== q.cat) return false;
      return true;
    });
    return '<fieldset class="group"><legend>Query</legend><form class="q" data-q="preserved" autocomplete="off">' +
      '<label>Product contains<input class="field" name="text" id="qFind" size="20" value="' + esc(q.text) + '"></label>' +
      '<label>Category<select class="field" name="cat">' + selOpts(L.prodcat, q.cat) + '</select></label>' +
      '<span class="btns"><button class="btn def" type="submit">Search</button><button class="btn" type="button" data-act="clear">Clear</button></span></form></fieldset>' +
      '<div class="frame fixed" style="flex:1">' + gridHTML("preserved", PCOLS, rows, {key: function (s) { return s.url; }, sort: {k: "cat", dir: "asc"}, title: "Preserved"}) + '</div>';
  };

  /* ---------- international ---------- */
  var LCOLS = [
    col("kind", "KIND", "official / buy / festival / info", function (l) { return esc(l.kind.toUpperCase()); }, function (l) { return l.kind; }),
    col("label", "DESCRIPTION", "", function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>'; }, function (l) { return l.label; }),
    col("ships", "SHIPS / NOTE", "", function (l) { return esc(l.ships || ""); }, function (l) { return l.ships || ""; }),
    col("lnk", "LNK", "OK = link verified; RS = site blocks automated checks", function (l) { return statusCell(l); }, function (l) { return l.status === "200" ? "OK" : "RS"; }),
    col("url", "URL", "", function (l) { return urlCell(l.url); }, function (l) { return l.url; })
  ];
  var ICOLS = [
    OCOLS[0], OCOLS[1],
    col("country", "COUNTRY", "", function (o) { return esc(o.origin); }, function (o) { return o.origin; }),
    col("place", "PLACE", "", function (o) { return esc(o.place || ""); }, function (o) { return o.place || ""; }),
    col("prot", "PROTECTION", "Geographical indication or equivalent", function (o) { return esc(o.status || "None"); }, function (o) { return o.status || ""; }),
    ocol("kg"), ocol("k1"),
    col("links", "LINKS", "Official / buy / info links on file", function (o) { return (o.links || []).length; }, function (o) { return (o.links || []).length; }, null, {num: 1})
  ];
  S.q.international = {text: "", country: ""};
  V.international = function () {
    var q = S.q.international;
    var all = D.onions.filter(function (o) { return o.links && o.links.length; });
    var rows = all.filter(function (o) {
      if (q.text && norm(o.name + " " + o.code + " " + (o.place || "")).indexOf(norm(q.text)) < 0) return false;
      if (q.country && o.origin !== q.country) return false;
      return true;
    });
    var sel = S.gridSel.international;
    if (!sel || !rows.some(function (o) { return o.id === sel; })) sel = S.gridSel.international = rows[0] ? rows[0].id : null;
    return '<fieldset class="group"><legend>Query</legend><form class="q" data-q="international" autocomplete="off">' +
      '<label>Variety / code<input class="field" name="text" id="qFind" size="20" value="' + esc(q.text) + '"></label>' +
      '<label>Country<select class="field" name="country">' + arrOpts(uniq(all.map(function (o) { return o.origin; })).sort(), q.country) + '</select></label>' +
      '<span class="btns"><button class="btn def" type="submit">Search</button><button class="btn" type="button" data-act="clear">Clear</button></span></form></fieldset>' +
      '<div class="split"><div class="frame">' + gridHTML("international", ICOLS, rows, {key: function (o) { return o.id; }, sort: {k: "country", dir: "asc"}, title: "International"}) + '</div><div class="detail" id="intlDetail">' + intlDetailHTML() + '</div></div>';
  };
  var FCOLS = [
    col("name", "FESTIVAL", "", function (f) { return '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.name) + '</a>'; }, function (f) { return f.name; }),
    col("place", "PLACE", "", function (f) { return esc(f.place); }, function (f) { return f.place; }),
    col("when", "WHEN", "", function (f) { return esc(f.when); }, function (f) { return f.when; })
  ];
  function intlDetailHTML() {
    var o = BY[S.gridSel.international];
    var t = S.intlTab;
    var tabs = '<div class="subtabs">' + [["links", "Links" + (o ? " - " + o.code : "")], ["import", "Import advisory"], ["festivals", "Festivals (" + (D.festivals || []).length + ")"]].map(function (x) { return '<button type="button" class="tab" data-itab="' + x[0] + '" aria-selected="' + (t === x[0]) + '">' + esc(x[1]) + '</button>'; }).join("") + '</div>';
    var body;
    if (t === "import") body = '<div class="memo"><div class="infobox">' + esc((D.biosecurity[0] || {}).summary || "") + '</div><ul>' + D.biosecurity.map(function (b) { return '<li><a href="' + esc(b.url) + '" target="_blank" rel="noopener">' + esc(b.label) + '</a></li>'; }).join("") + '</ul></div>';
    else if (t === "festivals") body = '<div class="frame">' + gridHTML("festivals", FCOLS, D.festivals || [], {key: function (f) { return f.url + f.name; }, title: "Onion festivals"}) + '</div>';
    else body = o ? '<div class="frame">' + gridHTML("i-links", LCOLS, o.links, {key: function (l) { return l.url; }, title: o.code + " links"}) + '</div>' : '<p class="muted">No record selected.</p>';
    return tabs + '<div class="subpanel">' + body + '</div>';
  }

  /* ---------- naming / scope / methodology ---------- */
  var NCOLS = [
    col("term", "TERM", "", function (r) { return "<b>" + esc(r.term) + "</b>"; }, function (r) { return r.term; }),
    col("where", "REGION / USAGE", "", function (r) { return esc(r.where); }, function (r) { return r.where; }),
    col("means", "MEANS", "", function (r) { return esc(r.means); }, function (r) { return r.means; }),
    col("code", "CODE", "Codex variety code", function (r) { return r.code ? '<a href="#register/' + esc(r.id) + '">' + esc(r.code) + '</a>' : '<span class="muted">-</span>'; }, function (r) { return r.code || ""; })
  ];
  V.naming = function () {
    var rows = [];
    D.names.forEach(function (n) { n.rows.forEach(function (r, i) { rows.push({k: n.term + i, term: n.term, where: r.where, means: r.means, id: r.id, code: r.id && BY[r.id] ? BY[r.id].code : ""}); }); });
    var st = S.opts.state;
    if (st && !S.gridSel.naming) { var m = rows.filter(function (r) { return r.where.indexOf(st) > -1; })[0]; if (m) S.gridSel.naming = m.k; }
    return '<div class="infobox">Regional naming advisory. The same word denotes different onions in different states. Set your state under Tools &gt; Options to preselect local usage.</div>' +
      '<div class="frame fixed" style="flex:1">' + gridHTML("naming", NCOLS, rows, {key: function (r) { return r.k; }, title: "Naming advisory"}) + '</div>' +
      '<div class="memo" style="padding:6px 0 0">' + D.names.filter(function (n) { return n.note; }).map(function (n) { return '<p><b>' + esc(n.term) + ':</b> ' + esc(n.note) + '</p>'; }).join("") + '</div>';
  };
  var XCOLS = [
    col("name", "ITEM", "", function (n) { return "<b>" + esc(n.name) + "</b>"; }, function (n) { return n.name; }),
    col("bot", "TAXON / TYPE", "", function (n) { return "<i>" + esc(n.bot) + "</i>"; }, function (n) { return n.bot; }),
    col("ruling", "RULING", "", function (n) { return esc((n.stamp || "Not an onion").toUpperCase()); }, function (n) { return n.stamp || "Not an onion"; }),
    col("text", "NOTES", "", function (n) { return esc(n.text); }, function (n) { return n.text; }, null, {wrap: 1})
  ];
  V.scope = function () {
    return '<div class="infobox">Scope rulings. Items below have been submitted for inclusion in the Onion Register. Rulings are final.</div>' +
      '<div class="frame fixed" style="flex:1">' + gridHTML("scope", XCOLS, D.notOnions, {key: function (n) { return n.id; }, title: "Scope rulings"}) + '</div>';
  };
  V.methodology = function () {
    var scale = '<table class="kv"><tbody>' + L.pung.map(function (l, i) { return '<tr><th>PUNG ' + i + ' ' + l + ':</th><td>' + esc(D.scale.pungency[i]) + '</td></tr>'; }).join("") + '</tbody></table>';
    var obs = '<table class="kv"><tbody>' + D.priceObserved.map(function (r) { return '<tr><th>' + esc(r.item) + ':</th><td>' + esc(r.obs) + '</td></tr>'; }).join("") + '</tbody></table>';
    return '<div class="frame fixed" style="flex:1"><div class="memo">' + D.about.map(function (s) {
      return '<div class="hdr">' + esc(s.h) + '</div>' + s.p.split("\n").map(function (x) { return '<p>' + esc(x) + '</p>'; }).join("") + (s.scale ? scale : "");
    }).join("") +
      '<div class="hdr">Pricing (indicative)</div><p>All prices are indicative AUD as at ' + D.meta.priced + ' and are not quotes from any retailer. $/EA = AVG WT (g) x $/KG / 1000. $/1000 = $/EA x 1000. Fresh vegetables are GST-free in Australia.</p>' +
      '<p>BASIS codes: OBS - ' + esc(L.basis.OBS) + '; EST - ' + esc(L.basis.EST) + '; ORIG - ' + esc(L.basis.ORIG) + '</p>' +
      '<p>Observations on file (Australian retailer websites, 30/09/2026):</p>' + obs +
      '<div class="hdr">Column codes</div>' + kv(OCOLS.map(function (c) { return [esc(c.h), esc(c.t)]; })) +
      '</div></div>';
  };

  /* ---------- dialogs ---------- */
  var ICON_INFO = '<svg class="msg__icon" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#fff" stroke="#0a246a" stroke-width="2"/><rect x="14" y="13" width="4" height="11" fill="#0a246a"/><rect x="14" y="7" width="4" height="4" fill="#0a246a"/></svg>';
  var ICON_WARN = '<svg class="msg__icon" viewBox="0 0 32 32"><path d="M16 3 30 28H2Z" fill="#ffd400" stroke="#000"/><rect x="14.5" y="11" width="3" height="10" fill="#000"/><rect x="14.5" y="23" width="3" height="3" fill="#000"/></svg>';
  function dialog(title, body, btns, onBtn, cls) {
    var bg = $("modalbg");
    bg.innerHTML = '<div class="dlg ' + (cls || "") + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><div class="titlebar"><span class="titlebar__text">' + esc(title) + '</span><span class="titlebar__btns"><button type="button" class="tbtn tbtn--x" data-dlg="close" aria-label="Close">×</button></span></div><div class="dlg__body">' + body + '</div><div class="dlg__btns">' +
      (btns || ["OK"]).map(function (b, i) { return '<button type="button" class="btn' + (i === 0 ? " def" : "") + '" data-dlg="' + esc(b) + '">' + esc(b) + '</button>'; }).join("") + '</div></div>';
    bg.hidden = false;
    bg.onclick = function (e) {
      var b = e.target.closest("[data-dlg]"); if (!b) return;
      var v = b.dataset.dlg;
      if (onBtn && onBtn(v) === false) return;
      closeDialog();
    };
    var f = bg.querySelector("input,select,.btn.def"); if (f) f.focus();
  }
  function closeDialog() { var bg = $("modalbg"); bg.hidden = true; bg.innerHTML = ""; }
  function msg(title, text, warn) { dialog(title, '<div class="msg">' + (warn ? ICON_WARN : ICON_INFO) + '<div>' + text + '</div></div>'); }

  function about() {
    dialog("About Every Onion", '<div class="about"><svg viewBox="0 0 16 16" width="48" height="48"><circle cx="8" cy="9" r="6.5" fill="#c9893f" stroke="#6b3d12"/><circle cx="8" cy="9.5" r="4" fill="#f4ead6" stroke="#b08a57"/><circle cx="8" cy="10" r="1.8" fill="none" stroke="#b08a57"/><path d="M8 2.5V1" stroke="#6b3d12"/></svg><div>' +
      '<p><b>Every Onion - Onion Procurement System</b><br>Version ' + VERSION + ' (Build ' + BUILD + ')<br>Copyright © 2003-2026</p>' +
      '<p>Licensed to: ______________________<br>Organisation: ______________________<br>Serial number: EO42-0000-0000-0000</p>' +
      '<p>Originally developed for Allium Business Systems Pty Ltd, Mount Gambier SA. Allium Business Systems ceased trading in 2011; no support contract is in force.</p>' +
      '<p>Data: ' + D.onions.length + ' varieties, ' + D.stockists.length + ' stockists, ' + D.seeds.length + ' seed listings, ' + D.products.length + ' preserved products.<br>Last data sync: ' + D.meta.sync + '</p></div></div>');
  }
  function scaleDlg() { dialog("Lacrimal Index", '<table class="kv"><tbody>' + L.pung.map(function (l, i) { return '<tr><th>' + i + ' ' + l + ':</th><td>' + esc(D.scale.pungency[i]) + '</td></tr>'; }).join("") + '</tbody></table>'); }
  function optionsDlg() {
    dialog("Options", '<fieldset class="group"><legend>Region</legend><div class="q"><label>Default state<select class="field" id="oState">' + arrOpts(STATES, S.opts.state, "(All)") + '</select></label></div></fieldset>' +
      '<fieldset class="group"><legend>Currency</legend><div class="q"><label>Currency<select class="field" disabled><option>AUD</option></select></label><label>Unit<select class="field" disabled><option>kg</option></select></label></div></fieldset><p class="muted">Default state filters stockists in the record detail and preselects the naming advisory.</p>',
      ["OK", "Cancel"], function (v) { if (v === "OK") { S.opts.state = $("oState").value; store("opts", S.opts); S.gridSel.naming = null; render(); } });
  }
  function properties() {
    var o = BY[S.tab === "international" ? S.gridSel.international : S.sel]; if (!o) return;
    dialog("Properties - " + o.code, generalHTML(o) + '<div class="hdr">Pricing</div>' + pricingHTML(o).replace(/<button[^>]*data-act="quote"[^>]*>.*?<\/button>/, ""), ["Close", "Quote..."], function (v) { if (v === "Quote...") { setTimeout(function () { quote(o.id); }, 0); } }, "wide");
  }
  var quoteRef = 1000 + Math.floor(Math.random() * 8000);
  function quote(id) {
    var o = BY[id || S.sel] || D.onions[0];
    var priced = D.onions.filter(function (x) { return x.price.kg != null; }).sort(function (a, b) { return a.code < b.code ? -1 : 1; });
    if (o.price.kg == null) o = priced[0];
    var ref = "Q" + D.meta.priced.split("/").reverse().join("") + "-" + (quoteRef++);
    dialog("Quote " + ref, '<div class="q" style="margin-bottom:8px"><label>Variety<select class="field" id="qtVar">' + priced.map(function (x) { return '<option value="' + x.id + '"' + (x.id === o.id ? " selected" : "") + '>' + esc(x.code + " " + x.name) + '</option>'; }).join("") + '</select></label>' +
      '<label>Quantity<input class="field" id="qtQty" size="8" inputmode="numeric" value="1000"></label><label>Unit<select class="field" id="qtUnit"><option value="ea">Onions</option><option value="kg">kg</option></select></label></div><div id="qtOut"></div>',
      ["Close", "Copy", "Print"], function (v) {
        var t = $("qtOut").innerText;
        if (v === "Copy") { try { navigator.clipboard.writeText(ref + "\n" + t); } catch (e) {} return false; }
        if (v === "Print") { var w = window.open("", "_blank"); if (w) { w.document.write('<pre style="font:12px Tahoma,sans-serif">Every Onion - Quote ' + ref + "\n\n" + esc(t) + '</pre>'); w.document.close(); w.print(); } return false; }
      });
    function calc() {
      var x = BY[$("qtVar").value], p = x.price, n = parseFloat($("qtQty").value) || 0, unit = $("qtUnit").value;
      var count = unit === "ea" ? n : Math.round(n * 1000 / p.g), kg = unit === "ea" ? n * p.g / 1000 : n;
      var sub = kg * p.kg;
      var rows = [["Variety", esc(x.code + " " + x.name)], ["Quantity", count.toLocaleString("en-AU") + " onions (approx. " + kg.toFixed(2) + " kg)"], ["Unit price", money(p.kg) + "/kg; " + money(p.each) + "/onion; " + money(p.per1000) + "/1000"], ["Subtotal", money(sub)], ["GST", "$0.00 (fresh vegetables GST-free)"], ["Total (indicative)", "<b>" + money(sub) + "</b>"]];
      if (p.sackKg) { var sacks = Math.ceil(kg / p.sackKg); rows.push(["Bulk alternative", sacks + " x " + p.sackKg + " kg sack @ " + money(p.sackPrice) + " = " + money(sacks * p.sackPrice)]); }
      rows.push(["Basis", p.basis + " - " + esc(L.basis[p.basis])]);
      rows.push(["Valid", "Indicative as at " + D.meta.priced + ". Not an offer."]);
      $("qtOut").innerHTML = kv(rows);
    }
    ["qtVar", "qtQty", "qtUnit"].forEach(function (i) { $(i).addEventListener("input", calc); $(i).addEventListener("change", calc); });
    calc();
    $("qtQty").select();
  }

  /* ---------- export / print ---------- */
  function currentGrid() { var g = S.last[S.tab]; return g; }
  function exportCSV() {
    var g = currentGrid(); if (!g) { msg("Export", "Nothing to export on this tab."); return; }
    var lines = [g.cols.map(function (c) { return c.h; })].concat(g.rows.map(function (r) { return g.cols.map(function (c) { var v = c.csv(r); return v == null ? "" : v; }); }));
    var csv = lines.map(function (l) { return l.map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], {type: "text/csv"}));
    a.download = "every-onion-" + S.tab + "-" + D.meta.priced.split("/").reverse().join("") + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    status("Exported " + g.rows.length + " record(s) to CSV.");
  }
  function printGrid() {
    var ph = $("panel").querySelector(".printhead");
    if (!ph) { ph = document.createElement("div"); ph.className = "printhead"; $("panel").prepend(ph); }
    ph.textContent = "Every Onion v" + VERSION + " - " + (TABS.filter(function (t) { return t[0] === S.tab; })[0] || [0, ""])[1] + " - printed " + new Date().toLocaleString("en-AU") + " - prices indicative AUD as at " + D.meta.priced;
    window.print();
  }

  /* ---------- chrome: menu, toolbar, tabs, status ---------- */
  var MENUS = [
    ["File", "F", [["Export to CSV...", "Ctrl+E", exportCSV], ["Print...", "Ctrl+P", printGrid], null, ["Exit", "Alt+F4", exitApp]]],
    ["Edit", "E", [["Find...", "F3", focusFind], ["Copy Variety Code", "Ctrl+Shift+C", copyCode], null, ["Clear Query", "Shift+F3", clearQuery]]],
    ["View", "V", TABS.map(function (t) { return [t[1], "", function () { go(t[0]); }]; }).concat([null, ["Refresh", "F5", function () { render(); status("Refreshed."); }]])],
    ["Onion", "O", [["Properties...", "Enter", properties], ["Quote...", "Ctrl+Q", function () { quote(); }], null, ["Pricing detail", "", function () { S.detailTab = "pricing"; go("register"); }], ["Stockists for selected", "", function () { S.detailTab = "stockists"; go("register"); }]]],
    ["Tools", "T", [["Options...", "", optionsDlg], ["Link Status Summary", "", linkSummary], ["Recalculate Prices", "", function () { msg("Recalculate Prices", "Prices recalculated.<br>" + D.onions.length + " record(s) processed. 0 record(s) changed."); }]]],
    ["Help", "H", [["Contents", "F1", function () { go("methodology"); }], ["Lacrimal Index Scale", "", scaleDlg], null, ["About Every Onion", "", about]]]
  ];
  function buildChrome() {
    $("menubar").innerHTML = MENUS.map(function (m, i) {
      return '<div class="menu" data-menu="' + i + '"><button type="button" aria-haspopup="true"><u>' + m[0][0] + '</u>' + m[0].slice(1) + '</button><div class="menu__list" role="menu">' +
        m[2].map(function (it, j) { return it ? '<button type="button" role="menuitem" data-mi="' + i + "-" + j + '"><span>' + esc(it[0]) + '</span><kbd>' + esc(it[1]) + '</kbd></button>' : "<hr>"; }).join("") + '</div></div>';
    }).join("");
    var I = {
      find: '<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.5" fill="#fff" stroke="#000"/><path d="M10 10l4.5 4.5" stroke="#000" stroke-width="2"/></svg>',
      clear: '<svg viewBox="0 0 16 16"><rect x="2.5" y="1.5" width="11" height="13" fill="#fff" stroke="#000"/><path d="M5 5h6M5 8h6M5 11h4" stroke="#888"/></svg>',
      refresh: '<svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.5-3.5" fill="none" stroke="#060" stroke-width="2"/><path d="M12.5 1v4.5H8" fill="none" stroke="#060" stroke-width="2"/></svg>',
      props: '<svg viewBox="0 0 16 16"><rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#000"/><rect x="1.5" y="2.5" width="13" height="3" fill="#0a246a"/><path d="M4 8h8M4 11h5" stroke="#000"/></svg>',
      quote: '<svg viewBox="0 0 16 16"><rect x="2.5" y="1.5" width="11" height="13" fill="#ffffe1" stroke="#000"/><text x="8" y="12" font-size="10" text-anchor="middle" font-family="Tahoma" font-weight="bold" fill="#060">$</text></svg>',
      csv: '<svg viewBox="0 0 16 16"><rect x="1.5" y="1.5" width="13" height="13" fill="#fff" stroke="#000"/><path d="M1.5 5.5h13M1.5 9.5h13M6 1.5v13M10.5 1.5v13" stroke="#888"/></svg>',
      print: '<svg viewBox="0 0 16 16"><rect x="4.5" y="1.5" width="7" height="5" fill="#fff" stroke="#000"/><rect x="1.5" y="6.5" width="13" height="6" fill="#ccc" stroke="#000"/><rect x="4.5" y="10.5" width="7" height="4" fill="#fff" stroke="#000"/></svg>',
      help: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6.5" fill="#fff" stroke="#0a246a"/><text x="8" y="12" font-size="10" text-anchor="middle" font-family="Tahoma" font-weight="bold" fill="#0a246a">?</text></svg>'
    };
    function tb(act, icon, label, tip) { return '<button type="button" class="tb" data-tb="' + act + '" title="' + esc(tip) + '">' + I[icon] + '<span>' + label + '</span></button>'; }
    $("toolbar").innerHTML = tb("find", "find", "Find", "Find (F3)") + tb("clear", "clear", "Clear", "Clear query (Shift+F3)") + tb("refresh", "refresh", "Refresh", "Refresh (F5)") + '<span class="sep"></span>' +
      tb("props", "props", "Properties", "Properties (Enter)") + tb("quote", "quote", "Quote", "Quote (Ctrl+Q)") + '<span class="sep"></span>' + tb("csv", "csv", "Export", "Export to CSV (Ctrl+E)") + tb("print", "print", "Print", "Print (Ctrl+P)") + '<span class="sep"></span>' + tb("help", "help", "Help", "Help (F1)");
  }
  function renderTabs() { $("tabs").innerHTML = TABS.map(function (t) { return '<button type="button" class="tab" role="tab" data-tab="' + t[0] + '" aria-selected="' + (S.tab === t[0]) + '">' + t[1] + '</button>'; }).join(""); }
  var statusMsg = "Ready";
  function status(m) { statusMsg = m; renderStatus(); }
  function renderStatus() {
    var g = S.last[S.tab], n = g ? g.rows.length : 0, sel = "";
    if (S.tab === "register" && BY[S.sel]) sel = BY[S.sel].code;
    if (S.tab === "international" && BY[S.gridSel.international]) sel = BY[S.gridSel.international].code;
    $("statusbar").innerHTML = '<span class="grow">' + esc(statusMsg) + '</span><span>' + n + ' record(s)</span>' + (sel ? '<span>Sel: ' + esc(sel) + '</span>' : "") +
      '<span title="All prices indicative AUD. See Methodology.">Prices: indicative AUD @ ' + D.meta.priced + '</span><span>Last data sync: ' + D.meta.sync + '</span><span>State: ' + (S.opts.state || "ALL") + '</span>';
  }

  /* ---------- actions ---------- */
  function go(tab) { S.tab = tab; render(); }
  function focusFind() { var f = $("qFind"); if (f) { f.focus(); f.select(); } else { go("register"); setTimeout(focusFind, 0); } }
  function clearQuery() {
    if (S.tab === "register") S.q.register = Object.assign({}, QDEF);
    else if (S.q[S.tab]) Object.keys(S.q[S.tab]).forEach(function (k) { S.q[S.tab][k] = ""; });
    render(); status("Query cleared.");
  }
  function copyCode() { var o = BY[S.sel]; if (!o) return; try { navigator.clipboard.writeText(o.code); } catch (e) {} status("Copied " + o.code + " to clipboard."); }
  function exitApp() { msg("Every Onion", "Every Onion cannot be closed from within the application.<br>Close the browser tab to exit.", true); }
  function linkSummary() {
    var all = D.stockists.concat(D.seeds, D.products); D.onions.forEach(function (o) { all = all.concat(o.links || []); });
    var ok = all.filter(function (x) { return x.status === "200"; }).length;
    msg("Link Status Summary", kv([["Links on file", all.length], ["OK (verified)", ok], ["RS (retailer site, not machine-checkable)", all.length - ok], ["Last checked", D.meta.checked]]));
  }
  function readForm(form) {
    var q = S.q[form.dataset.q];
    Array.prototype.forEach.call(form.elements, function (el) { if (!el.name) return; q[el.name] = el.type === "checkbox" ? el.checked : el.value; });
  }

  /* ---------- rendering ---------- */
  function render() {
    renderTabs();
    var fn = V[S.tab] || V.register;
    $("panel").innerHTML = fn();
    renderStatus();
    var key = S.tab === "register" ? S.sel : S.gridSel[S.tab];
    var tr = key && $("panel").querySelector('tr[data-key="' + cssEsc(key) + '"]');
    if (tr) scrollIntoFrame(tr);
    try { history.replaceState(null, "", "#" + S.tab + (S.tab === "register" && S.sel ? "/" + S.sel : "")); } catch (e) {}
    document.title = "Every Onion - Onion Procurement System v" + VERSION + (S.tab === "register" && BY[S.sel] ? " - [" + BY[S.sel].code + "]" : "");
  }
  function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }
  function scrollIntoFrame(tr) {
    var fr = tr.closest(".frame"); if (!fr) return;
    var th = fr.querySelector("thead"), hh = th ? th.offsetHeight : 0;
    var top = tr.offsetTop - hh, bot = tr.offsetTop + tr.offsetHeight;
    if (top < fr.scrollTop) fr.scrollTop = top; else if (bot > fr.scrollTop + fr.clientHeight) fr.scrollTop = bot - fr.clientHeight;
  }
  function selectRow(tr) {
    var table = tr.closest("table"), gid = table.dataset.grid, key = tr.dataset.key;
    table.querySelectorAll("tr.sel").forEach(function (x) { x.classList.remove("sel"); });
    tr.classList.add("sel");
    S.gridSel[gid] = key;
    if (gid === "register") { S.sel = key; $("detail").innerHTML = detailHTML(); try { history.replaceState(null, "", "#register/" + key); } catch (e) {} document.title = "Every Onion - Onion Procurement System v" + VERSION + " - [" + BY[key].code + "]"; }
    if (gid === "international") { $("intlDetail").innerHTML = intlDetailHTML(); }
    scrollIntoFrame(tr);
    renderStatus();
  }
  function openRow(tr) {
    var gid = tr.closest("table").dataset.grid;
    if (gid === "register" || gid === "international") { properties(); return; }
    var a = tr.querySelector("a[href]"); if (a) { if (a.getAttribute("href").charAt(0) === "#") { location.hash = a.getAttribute("href"); route(); } else window.open(a.href, "_blank", "noopener"); }
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target;
    var m = t.closest(".menu > button");
    if (m) { var menu = m.parentNode, open = menu.classList.contains("open"); closeMenus(); if (!open) menu.classList.add("open"); return; }
    var mi = t.closest("[data-mi]");
    if (mi) { var ij = mi.dataset.mi.split("-"); closeMenus(); MENUS[ij[0]][2][ij[1]][2](); return; }
    if (!t.closest(".menu")) closeMenus();
    var tbb = t.closest("[data-tb]");
    if (tbb) { ({find: focusFind, clear: clearQuery, refresh: function () { render(); status("Refreshed."); }, props: properties, quote: function () { quote(S.tab === "international" ? S.gridSel.international : null); }, csv: exportCSV, print: printGrid, help: function () { go("methodology"); }})[tbb.dataset.tb](); return; }
    var tab = t.closest("[data-tab]"); if (tab) { go(tab.dataset.tab); return; }
    var dt = t.closest("[data-dtab]"); if (dt) { S.detailTab = dt.dataset.dtab; $("detail").innerHTML = detailHTML(); return; }
    var it = t.closest("[data-itab]"); if (it) { S.intlTab = it.dataset.itab; $("intlDetail").innerHTML = intlDetailHTML(); return; }
    var act = t.closest("[data-act]");
    if (act) { var a = act.dataset.act; if (a === "clear") clearQuery(); else if (a === "quote") quote(); else if (a === "exit") exitApp(); else if (a === "adv") { S.adv = !S.adv; var fm = act.closest("form"); fm.classList.toggle("showadv", S.adv); act.textContent = S.adv ? "Fewer..." : "More..."; } else if (a === "min") status("Minimise is disabled by your administrator."); else if (a === "max") status("Window is already maximised."); return; }
    var gh = t.closest(".gh");
    if (gh) { var gid = gh.closest("table").dataset.grid, k = gh.dataset.sort, cur = S.sort[gid] || {}; S.sort[gid] = {k: k, dir: cur.k === k && cur.dir === "asc" ? "desc" : "asc"}; rerenderGrid(gid); return; }
    var tr = t.closest("tbody tr[data-key]");
    if (tr && !t.closest("a")) { selectRow(tr); tr.focus({preventScroll: true}); }
  });
  function rerenderGrid(gid) {
    if (gid === "register" || S.tab !== "register" && gid === S.tab || gid === "international") { var fr = $("panel").querySelector('table[data-grid="' + gid + '"]').parentNode, st = fr.scrollTop; render(); var nf = $("panel").querySelector('table[data-grid="' + gid + '"]'); if (nf) nf.parentNode.scrollTop = st; }
    else if (gid.indexOf("i-") === 0 || gid === "festivals") $("intlDetail").innerHTML = intlDetailHTML();
    else $("detail").innerHTML = detailHTML();
    status("Sorted.");
  }
  document.addEventListener("dblclick", function (e) { var tr = e.target.closest("tbody tr[data-key]"); if (tr && !e.target.closest("a")) openRow(tr); });
  document.addEventListener("submit", function (e) { var f = e.target.closest("form.q"); if (!f) return; e.preventDefault(); readForm(f); var fid = document.activeElement && document.activeElement.id; render(); var n = S.last[S.tab] ? S.last[S.tab].rows.length : 0; status("Query complete. " + n + " record(s) returned."); });
  function closeMenus() { document.querySelectorAll(".menu.open").forEach(function (m) { m.classList.remove("open"); }); }

  document.addEventListener("keydown", function (e) {
    var dlgOpen = !$("modalbg").hidden;
    if (e.key === "Escape") { if (dlgOpen) closeDialog(); closeMenus(); return; }
    if (dlgOpen) { if (e.key === "Enter" && e.target.tagName !== "SELECT" && !e.target.closest(".dlg__btns")) { var d = $("modalbg").querySelector(".btn.def"); if (d && e.target.id !== "qtQty") { e.preventDefault(); d.click(); } } return; }
    var k = e.key, ctrl = e.ctrlKey || e.metaKey;
    if (k === "F3" && e.shiftKey) { e.preventDefault(); clearQuery(); return; }
    if (k === "F3") { e.preventDefault(); focusFind(); return; }
    if (k === "F5") { e.preventDefault(); render(); status("Refreshed."); return; }
    if (k === "F1") { e.preventDefault(); go("methodology"); return; }
    if (k === "F8" || (ctrl && (k === "q" || k === "Q"))) { e.preventDefault(); quote(S.tab === "international" ? S.gridSel.international : null); return; }
    if (ctrl && (k === "e" || k === "E")) { e.preventDefault(); exportCSV(); return; }
    if (ctrl && (k === "p" || k === "P")) { e.preventDefault(); printGrid(); return; }
    if (ctrl && e.shiftKey && (k === "c" || k === "C")) { e.preventDefault(); copyCode(); return; }
    if (e.altKey && !ctrl) { var idx = MENUS.map(function (m) { return m[1].toLowerCase(); }).indexOf(k.toLowerCase()); if (idx > -1) { e.preventDefault(); closeMenus(); var mm = document.querySelector('[data-menu="' + idx + '"]'); mm.classList.add("open"); var fi = mm.querySelector("[data-mi]"); if (fi) fi.focus(); return; } }
    var inField = /INPUT|SELECT|TEXTAREA/.test(e.target.tagName);
    if (!inField && (k === "ArrowDown" || k === "ArrowUp" || k === "PageDown" || k === "PageUp" || k === "Home" || k === "End" || k === "Enter")) {
      var tr = e.target.closest && e.target.closest("tbody tr[data-key]");
      var table = tr ? tr.closest("table") : $("panel").querySelector("table.grid");
      if (!table) return;
      var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-key]")); if (!rows.length) return;
      var cur = table.querySelector("tr.sel"), i = rows.indexOf(cur);
      if (k === "Enter") { if (cur) { e.preventDefault(); openRow(cur); } return; }
      e.preventDefault();
      var step = {ArrowDown: 1, ArrowUp: -1, PageDown: 10, PageUp: -10}[k];
      var ni = k === "Home" ? 0 : k === "End" ? rows.length - 1 : Math.max(0, Math.min(rows.length - 1, (i < 0 ? 0 : i + step)));
      selectRow(rows[ni]); rows[ni].focus({preventScroll: true});
    }
    var menuItem = e.target.closest && e.target.closest(".menu__list");
    if (menuItem && (k === "ArrowDown" || k === "ArrowUp")) { e.preventDefault(); var items = Array.prototype.slice.call(menuItem.querySelectorAll("[data-mi]")); var j = items.indexOf(e.target); items[(j + (k === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus(); }
  });

  /* ---------- routing (deep links, including old URLs) ---------- */
  function route() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
    var old = h.match(/^onion\/(.+)$/);
    if (old && BY[old[1]]) { S.tab = "register"; S.sel = old[1]; }
    else {
      var p = h.split("?")[0].split("/"), map = {codex: "register", stockists: "stockists", grow: "seeds", pantry: "preserved", world: "international", names: "naming", "not-an-onion": "scope", about: "methodology", browse: "register"};
      var t = map[p[0]] || (TABS.some(function (x) { return x[0] === p[0]; }) ? p[0] : "register");
      S.tab = t;
      if (t === "register" && p[1] && BY[p[1]]) S.sel = p[1];
    }
    render();
  }
  window.addEventListener("hashchange", route);
  buildChrome();
  route();
})();
