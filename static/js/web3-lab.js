/* ============================================
   alexgilabert.xyz · Web3 Lab (/web3)
   Datos en vivo desde APIs públicas sin clave (CoinGecko, DefiLlama, U.S. Treasury
   Fiscal Data, ECB Data Portal) y herramienta de custodia. Los textos y el cuestionario
   llegan ya localizados desde el servidor (#lab-data). Caché de 10 min en localStorage.
   Los datos se piden al cargar; los gráficos, el ranking y el cuestionario se pintan
   cuando su sección está a punto de verse.
   ============================================ */
(function () {
    'use strict';

    var DATA = {};
    try { DATA = JSON.parse(document.getElementById('lab-data').textContent); } catch (e) { return; }
    var UI = DATA.ui, QUIZ = DATA.quiz, ISS = DATA.issuers || {};
    var EN = document.documentElement.lang === 'en';
    var LOC = EN ? 'en-US' : 'es-ES';
    var IMG = window.W3_IMG || '/static/images/lab/';
    var NB = ' ';

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* ---------- Formato: ES con coma decimal y punto de miles; EN con punto decimal ---------- */
    function nf(n, d) {
        return new Intl.NumberFormat(LOC, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' }).format(n);
    }
    function bn(v, d) { return nf(v / 1e9, d == null ? 1 : d); }          // miles de millones, sin unidad
    function mn(v, d) { return nf(v / 1e6, d == null ? 1 : d); }          // millones, sin unidad
    // Importe con la unidad completa: "300,6 mil millones $" / "$300.6B"
    function money(v, cur) {
        var a = Math.abs(v);
        if (EN) return cur + (a >= 1e9 ? nf(v / 1e9, 1) + 'B' : a >= 1e6 ? nf(v / 1e6, 1) + 'M' : nf(v, 0));
        return a >= 1e9 ? nf(v / 1e9, 1) + ' mil millones ' + cur : a >= 1e6 ? nf(v / 1e6, 1) + ' millones ' + cur : nf(v, 0) + ' ' + cur;
    }
    // Para tarjetas KPI: cifra grande y unidad más pequeña a su lado
    function kpiMoney(v, cur) {
        if (EN) return esc(money(v, cur));
        var a = Math.abs(v);
        return '<span class="kn">' + nf(a >= 1e9 ? v / 1e9 : v / 1e6, 1) + '</span> <small>' + (a >= 1e9 ? 'mil millones ' : 'millones ') + cur + '</small>';
    }
    function pct(v, d) {
        var sign = v > 0 ? '+' : (v < 0 ? '−' : '');
        return sign + nf(Math.abs(v), d == null ? 1 : d) + (EN ? '%' : NB + '%');
    }
    function plainPct(v, d) { return nf(v, d == null ? 2 : d) + (EN ? '%' : NB + '%'); }
    // Importe en millones de euros con unidad: "503,2 M€" / "€503.2M"
    function eurM(v) { return EN ? '\u20ac' + nf(v / 1e6, 1) + 'M' : nf(v / 1e6, 1) + '\u00a0M\u20ac'; }
    function price(v) {
        return '$' + (v >= 1000 ? nf(v, 0) : v >= 1 ? nf(v, 2) : nf(v, 4));
    }
    function cls(v) { return v > 0 ? 'up' : (v < 0 ? 'down' : ''); }
    // *palabra* -> serif itálica
    function emph(s) { return esc(s).replace(/\*([^*]+)\*/g, '<em class="serif">$1</em>'); }

    /* ---------- Red y caché (10 min) ---------- */
    var TTL = 10 * 60 * 1000, STALE = 6 * 3600 * 1000, pending = {};

    function cget(k) {
        try { var r = JSON.parse(localStorage.getItem('w3lab:' + k)); return r && r.t ? r : null; } catch (e) { return null; }
    }
    function cset(k, v) {
        try { localStorage.setItem('w3lab:' + k, JSON.stringify({ t: Date.now(), v: v })); } catch (e) { }
    }
    function getJSON(url) {
        var ctl = window.AbortController ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
        return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) {
            clearTimeout(timer);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }
    // Devuelve {t, v}. Se reutiliza la caché fresca; si la red falla, se admite una caché de hasta 6 h.
    function load(key, fn) {
        if (pending[key]) return pending[key];
        var c = cget(key);
        if (c && Date.now() - c.t < TTL) return (pending[key] = Promise.resolve(c));
        return (pending[key] = fn().then(function (v) {
            cset(key, v);
            return { t: Date.now(), v: v };
        }).catch(function (e) {
            if (c && Date.now() - c.t < STALE) return c;
            throw e;
        }));
    }
    var safe = function (p) { return p.then(function (r) { return r; }, function () { return null; }); };

    // Pinta un bloque solo cuando está a punto de verse (o enseguida si el navegador no soporta el observador)
    function whenVisible(el, fn) {
        if (!el) return;
        if (!('IntersectionObserver' in window)) { fn(); return; }
        var io = new IntersectionObserver(function (entries) {
            if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); }
        }, { rootMargin: '300px 0px' });
        io.observe(el);
    }

    /* ---------- Hora de última actualización ---------- */
    var stamps = {}, updated = $('#w3Updated');
    function stamp(name, t) {
        stamps[name] = t;
        var min = Math.min.apply(null, Object.keys(stamps).map(function (k) { return stamps[k]; }));
        var h = new Date(min).toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' });
        if (updated) updated.textContent = UI.updated.replace('{t}', h);
    }

    function fail(el) {
        if (el) el.innerHTML = '<p class="w3-err">' + esc(UI.unavailable) + '</p>';
    }

    /* ---------- Resumen de cabecera ---------- */
    function hk(name, html, sub) {
        var v = $('[data-hk="' + name + '"]');
        if (v) v.innerHTML = html;
        var s = $('[data-hk-s="' + name + '"]');
        if (s && sub != null) s.textContent = sub;
    }
    function hkStatic() {
        var banks = (DATA.tl && DATA.tl.banks_active) || [];
        hk('banks', String(banks.length), UI.hk.bankNames.replace('{names}', banks.join(', ')));
        hk('funds', String($$('[data-fund]').length), '');
    }

    /* ---------- 1. Tira de precios (CoinGecko) ---------- */
    var COINS = [
        { id: 'bitcoin', sym: 'BTC', img: 'btc.png' },
        { id: 'ethereum', sym: 'ETH', img: 'eth.png', light: 1 },
        { id: 'solana', sym: 'SOL', img: 'sol.png' },
        { id: 'ripple', sym: 'XRP', img: 'xrp.png', light: 1 },
        { id: 'chainlink', sym: 'LINK', img: 'link.png' },
        { id: 'avalanche-2', sym: 'AVAX', img: 'avax.png' },
        { id: 'hyperliquid', sym: 'HYPE', img: 'hype.png' }
    ];

    function initTicker() {
        var el = $('#ticker');
        if (!el) return;
        load('prices:v2', function () {
            var ids = COINS.map(function (c) { return c.id; }).join(',');
            return getJSON('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=' + ids +
                '&price_change_percentage=24h').then(function (rows) {
                    var out = {};
                    rows.forEach(function (r) { out[r.id] = { p: r.current_price, c: r.price_change_percentage_24h }; });
                    return out;
                });
        }).then(function (r) {
            stamp('prices', r.t);
            el.innerHTML = COINS.filter(function (c) { return r.v[c.id] && r.v[c.id].p != null; }).map(function (c) {
                var d = r.v[c.id], chg = d.c;
                return '<div class="tk"><img class="tk-logo' + (c.light ? ' on-light' : '') + '" src="' + IMG + 'coins/' + c.img +
                    '" alt="" width="28" height="28" loading="lazy">' +
                    '<div class="tk-main"><div class="tk-top"><span class="tk-sym">' + c.sym + '</span>' +
                    (chg == null ? '' : '<span class="' + cls(chg) + '">' + pct(chg) + '</span>') +
                    '</div><div class="tk-px">' + price(d.p) + '</div></div></div>';
            }).join('') || '';
            if (!el.children.length) fail(el);
        }).catch(function () { fail(el); });
    }

    /* ---------- 2. Stablecoins (DefiLlama) ---------- */
    var ST_LOGOS = ['USDT', 'USDC', 'USDS', 'DAI', 'USDE', 'USD1', 'USDG', 'PYUSD', 'FDUSD', 'RLUSD',
        'EURC', 'EURCV', 'EURI', 'EURE', 'EURR', 'EURQ'];
    function stLogo(sym) {
        var k = String(sym).toUpperCase();
        if (ST_LOGOS.indexOf(k) > -1) return '<img class="st-logo" src="' + IMG + 'stable/' + k.toLowerCase() + '.png" alt="" width="28" height="28" loading="lazy">';
        return '<span class="st-logo st-fb" aria-hidden="true">' + esc(k.charAt(0)) + '</span>';
    }

    function procStable(chart, list) {
        var rows = chart.map(function (r) {
            var u = r.totalCirculatingUSD || {}, s = 0;
            Object.keys(u).forEach(function (k) { s += u[k] || 0; });
            return { t: +r.date * 1000, total: s, eur: u.peggedEUR || 0, usd: u.peggedUSD || 0 };
        }).filter(function (r) { return r.total > 0; });
        var last = rows[rows.length - 1], DAY = 864e5;
        var prev = null;
        for (var i = rows.length - 1; i >= 0; i--) { if (rows[i].t <= last.t - 30 * DAY) { prev = rows[i]; break; } }
        var pts = [];
        for (var j = rows.length - 1; j >= 0 && rows[j].t >= last.t - 365 * DAY; j -= 7) pts.unshift([rows[j].t, rows[j].total]);
        var lastChart = chart[chart.length - 1].totalCirculating || {};

        var assets = list.map(function (a) {
            var pt = a.pegType, c = (a.circulating || {})[pt], p = (a.circulatingPrevMonth || {})[pt];
            if (!c) return null;
            return {
                name: a.name, sym: a.symbol, peg: String(pt).replace('pegged', ''), cap: c,
                usd: pt === 'peggedUSD' ? c : (a.price ? c * a.price : null),
                chg: p ? (c / p - 1) * 100 : null
            };
        }).filter(Boolean);
        return {
            supply: last.total,
            change: prev ? (last.total / prev.total - 1) * 100 : null,
            change12: pts.length > 1 ? (last.total / pts[0][1] - 1) * 100 : null,
            eurPct: last.eur / last.total * 100,
            usdPct: last.usd / last.total * 100,
            pts: pts,
            top: assets.filter(function (a) { return a.usd; }).sort(function (a, b) { return b.usd - a.usd; }).slice(0, 5),
            eur: assets.filter(function (a) { return a.peg === 'EUR'; }).sort(function (a, b) { return b.cap - a.cap; }).slice(0, 5),
            eurTotal: lastChart.peggedEUR || 0
        };
    }

    // Eje Y legible: base sin exagerar la variación (queda ~25 % por debajo del mínimo) y referencias de mínimo y máximo
    function niceStep(range) {
        var raw = range / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
        return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
    }
    function chartSVG(host, pts) {
        var W = Math.max(host.clientWidth, 260), H = W < 460 ? 250 : 310;
        var pl = 46, pr = 14, pt = 18, pb = 28;
        var ys = pts.map(function (p) { return p[1]; });
        var min = Math.min.apply(null, ys), max = Math.max.apply(null, ys);
        var step = niceStep((max - min) * 4 || max * 0.2);
        var lo = Math.max(0, Math.floor((min - (max - min) * 1.2) / step) * step), hi = Math.ceil((max + (max - min) * 0.25) / step) * step;
        var t0 = pts[0][0], t1 = pts[pts.length - 1][0];
        var X = function (t) { return pl + (W - pl - pr) * (t - t0) / (t1 - t0); };
        var Y = function (v) { return pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo)); };
        var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join('');
        var area = d + 'L' + X(t1).toFixed(1) + ' ' + (H - pb) + 'L' + X(t0).toFixed(1) + ' ' + (H - pb) + 'Z';
        var grid = '';
        for (var v = lo; v <= hi + 1; v += step) {
            var y = Y(v).toFixed(1);
            grid += '<line class="ch-grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/>' +
                '<text class="ch-axis" x="' + (pl - 8) + '" y="' + (+y + 4) + '" text-anchor="end">' + bn(v, 0) + '</text>';
        }
        var iMin = ys.indexOf(min), iMax = ys.indexOf(max);
        function mark(i, label, above) {
            var x = X(pts[i][0]), y = Y(pts[i][1]);
            var anchor = x > W - 90 ? 'end' : (x < pl + 60 ? 'start' : 'middle');
            return '<circle class="ch-ref" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.5"/>' +
                '<text class="ch-reft" x="' + x.toFixed(1) + '" y="' + (above ? y - 9 : y + 17).toFixed(1) + '" text-anchor="' + anchor + '">' + esc(label + ' ' + (EN ? '$' + bn(pts[i][1], 1) + 'B' : bn(pts[i][1], 1) + ' mil M$')) + '</text>';
        }
        var xl = '', n = W < 460 ? 3 : 5;
        for (var k = 0; k < n; k++) {
            var t = t0 + (t1 - t0) * k / (n - 1);
            var lbl = new Date(t).toLocaleDateString(LOC, { month: 'short', year: '2-digit' });
            xl += '<text class="ch-axis" x="' + X(t).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="' + (k === 0 ? 'start' : k === n - 1 ? 'end' : 'middle') + '">' + esc(lbl) + '</text>';
        }
        host.innerHTML = '<div class="chart-wrap"><svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(UI.stable.chart) + '">' +
            grid + xl + '<path class="ch-area" d="' + area + '"/><path class="ch-line" d="' + d + '"/>' +
            mark(iMax, UI.stable.max, true) + mark(iMin, UI.stable.min, false) +
            '<line class="ch-cursor" y1="' + pt + '" y2="' + (H - pb) + '" style="display:none"/>' +
            '<circle class="ch-dot" r="4.5" style="display:none"/>' +
            '<rect x="' + pl + '" y="0" width="' + (W - pl - pr) + '" height="' + H + '" fill="transparent"/></svg>' +
            '<div class="ch-tip" hidden></div></div>';
        var svg = $('svg', host), cur = $('.ch-cursor', svg), dot = $('.ch-dot', svg), tip = $('.ch-tip', host);
        function show(ev) {
            var b = svg.getBoundingClientRect(), x = ev.clientX - b.left;
            var best = 0, bd = 1e9;
            pts.forEach(function (p, i) { var dd = Math.abs(X(p[0]) - x); if (dd < bd) { bd = dd; best = i; } });
            var p = pts[best], px = X(p[0]), py = Y(p[1]);
            cur.setAttribute('x1', px); cur.setAttribute('x2', px); cur.style.display = '';
            dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.style.display = '';
            tip.hidden = false;
            tip.textContent = new Date(p[0]).toLocaleDateString(LOC, { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + money(p[1], '$');
            tip.style.left = Math.min(Math.max(px, 90), W - 90) + 'px';
        }
        function hide() { cur.style.display = 'none'; dot.style.display = 'none'; tip.hidden = true; }
        svg.addEventListener('pointermove', show);
        svg.addEventListener('pointerdown', show);
        svg.addEventListener('pointerleave', hide);
    }

    function initStable() {
        var chartEl = $('#stableChart'), topEl = $('#stableTop'), eurEl = $('#stableEur'), hlEl = $('#euroHl');
        return load('stable:v2', function () {
            return Promise.all([
                getJSON('https://stablecoins.llama.fi/stablecoincharts/all'),
                getJSON('https://stablecoins.llama.fi/stablecoins?includePrices=true')
            ]).then(function (r) { return procStable(r[0], r[1].peggedAssets); });
        }).then(function (r) {
            var s = r.v;
            stamp('stable', r.t);
            hk('stable', kpiMoney(s.supply, '$'));

            // Cuota del euro
            $('[data-eur-phrase]', hlEl).innerHTML = emph(UI.stable.euroHl.replace('{p}', plainPct(s.eurPct, 2)));
            $('[data-eur-bar]', hlEl).style.width = Math.max(s.eurPct, 0.5) + '%';
            $('[data-eur-legend]', hlEl).textContent = UI.stable.barEuro + ' ' + plainPct(s.eurPct, 2) + ' · ' + UI.stable.barUsd + ' ' + plainPct(s.usdPct, 2);
            $('[data-eur-total]', hlEl).textContent = UI.stable.euroTotalLbl + ': ' + eurM(s.eurTotal);

            // Gráfico: variaciones junto al título; se pinta al acercarse
            var chg = '';
            if (s.change12 != null) chg += '<span>' + esc(UI.stable.d12) + ' <b class="' + cls(s.change12) + '">' + esc(pct(s.change12)) + '</b></span>';
            if (s.change != null) chg += '<span>' + esc(UI.stable.d30) + ' <b class="' + cls(s.change) + '">' + esc(pct(s.change)) + '</b></span>';
            $('[data-chg]', chartEl).innerHTML = chg;
            var body = $('.chart-body', chartEl), drawn = false, rt;
            whenVisible(chartEl, function () {
                drawn = true; chartSVG(body, s.pts);
                window.addEventListener('resize', function () {
                    clearTimeout(rt);
                    rt = setTimeout(function () { if (drawn) chartSVG(body, s.pts); }, 150);
                });
            });

            // Tabla: unidad en la cabecera, cifras limpias (miles de millones con 1 decimal)
            $('[data-rows]', topEl).innerHTML = s.top.map(function (a) {
                var iss = ISS[String(a.sym).toUpperCase()];
                return '<div class="trow" role="row"><span role="cell" class="st-cell">' + stLogo(a.sym) + '<span><span class="nm">' + esc(a.name) +
                    (a.name.toLowerCase().indexOf(String(a.sym).toLowerCase()) > -1 ? '' : ' <span class="mono muted">' + esc(a.sym) + '</span>') + '</span>' +
                    (iss ? '<span class="is">' + esc(iss) + '</span>' : '') + '</span></span>' +
                    '<span role="cell" class="cur">' + esc(a.peg) + '</span>' +
                    '<span role="cell" class="num">' + esc(bn(a.usd, 1)) + '</span>' +
                    '<span role="cell" class="num ' + (a.chg == null ? '' : cls(a.chg)) + '">' + (a.chg == null ? '—' : esc(pct(a.chg))) + '</span></div>';
            }).join('');

            // Euro: importe con su unidad ("503,2 M€" / "€503.2M") y variación a 30 días con su etiqueta
            $('[data-eur-sum]', eurEl).textContent = UI.stable.euroTotalLbl + ': ' + eurM(s.eurTotal);
            $('[data-rows]', eurEl).innerHTML = s.eur.map(function (a) {
                var iss = ISS[String(a.sym).toUpperCase()];
                return '<div class="eur-item"><div class="nm-row">' + stLogo(a.sym) + '<span><span class="nm">' + esc(a.name) + '</span><span class="is">' + esc(iss || a.sym) + '</span></span></div>' +
                    '<div class="cap">' + esc(eurM(a.cap)) + (a.chg == null ? '' : '<span class="chg30"><i class="mono">' + esc(UI.stable.d30lbl) + '</i> <b class="' + cls(a.chg) + '">' + esc(pct(a.chg)) + '</b></span>') + '</div></div>';
            }).join('');
        }).catch(function () {
            hk('stable', '—');
            [chartEl, topEl, eurEl, hlEl].forEach(function (e) { fail(e); });
        });
    }

    /* ---------- 3. Rendimientos y fondos (DefiLlama, Tesoro de EE. UU., BCE) ---------- */
    var CHAIN_NAMES = { 'OP Mainnet': 'Optimism', 'BSC': 'BNB Chain', 'Binance': 'BNB Chain' };
    var CHAIN_SLUG = {
        'Ethereum': 'ethereum', 'Solana': 'solana', 'Polygon': 'polygon', 'Avalanche': 'avalanche', 'BNB Chain': 'bnb',
        'Arbitrum': 'arbitrum', 'Optimism': 'optimism', 'Aptos': 'aptos', 'Stellar': 'stellar', 'Base': 'base'
    };
    // Iconos de redes (máximo 4) y "+N" con tooltip con el resto
    function chainsHTML(names) {
        var ok = names.map(function (n) { return CHAIN_NAMES[n] || n; }).filter(function (n) { return CHAIN_SLUG[n]; });
        var shown = ok.slice(0, 4), more = ok.slice(4);
        return '<ul class="chains" role="list">' + shown.map(function (n) {
            return '<li title="' + esc(n) + '"><svg viewBox="0 0 24 24" role="img" aria-label="' + esc(n) + '"><use href="#ch-' + CHAIN_SLUG[n] + '"/></svg></li>';
        }).join('') + (more.length ? '<li class="chain-more" tabindex="0" data-tip="' + esc(more.join(', ')) + '" aria-label="' + esc(more.join(', ')) + '">+' + more.length + '</li>' : '') + '</ul>';
    }

    function monthLabel(iso) {
        var p = iso.split('-');
        var m = UI.months[+p[1] - 1] || '';
        return EN ? m + ' ' + p[0] : m + ' de ' + p[0];
    }
    function dateLabel(iso) {
        var p = iso.split('-');
        return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
    }

    // Patrimonio: en todos los fondos o en ninguno (hacen falta al menos 4 de 6 con dato en DefiLlama)
    function fundsFromApi(y) {
        var cards = $$('[data-fund]'), api = (y && y.v.funds) || {}, withAum = [];
        cards.forEach(function (card) {
            var f = api[card.getAttribute('data-fund')];
            if (!f) return;
            var nets = $('[data-networks]', card);
            if (nets && nets.hidden && f.chains && f.chains.length) {
                $('dd', nets).innerHTML = chainsHTML(f.chains);
                nets.hidden = false;
            }
            if (f.tvl) withAum.push(card);
        });
        if (withAum.length >= 4) {
            var sum = 0;
            cards.forEach(function (card) {
                var f = api[card.getAttribute('data-fund')], row = $('[data-aum]', card);
                $('dd', row).textContent = f && f.tvl ? money(f.tvl, '$') : '—';
                row.hidden = false;
                if (f && f.tvl) sum += f.tvl;
            });
            var grid = $('#fundGrid');
            cards.slice().sort(function (a, b) {
                return ((api[b.getAttribute('data-fund')] || {}).tvl || 0) - ((api[a.getAttribute('data-fund')] || {}).tvl || 0);
            }).forEach(function (c) { grid.appendChild(c); });
            var l = $('[data-hk-l="funds"]');
            if (l) l.textContent = UI.hk.fundsAum;
            hk('funds', kpiMoney(sum, '$'), '');
        }
    }

    function initYields() {
        var host = $('#yieldBars');
        var T = UI.treasury;
        var yields = load('yields:v1', function () { return getJSON('/api/lab/yields/'); });
        var tbill = load('tbill:v1', function () {
            return getJSON('https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates' +
                '?filter=security_desc:eq:Treasury%20Bills&sort=-record_date&page%5Bsize%5D=1&fields=record_date,avg_interest_rate_amt')
                .then(function (d) { return { date: d.data[0].record_date, rate: parseFloat(d.data[0].avg_interest_rate_amt) }; });
        });
        var ecb = load('ecb:v1', function () {
            return getJSON('https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.DFR.LEV?lastNObservations=1&format=jsondata')
                .then(function (d) {
                    var s = d.dataSets[0].series;
                    var obs = s[Object.keys(s)[0]].observations;
                    var tp = d.structure.dimensions.observation[0].values;
                    return { date: tp[tp.length - 1].id, rate: obs[Object.keys(obs).pop()][0] };
                });
        });

        safe(yields).then(fundsFromApi);

        return Promise.all([safe(yields), safe(tbill), safe(ecb)]).then(function (res) {
            var y = res[0], tb = res[1], eb = res[2], bars = [], best = null;
            [y, tb, eb].forEach(function (r, i) { if (r) stamp('yield' + i, r.t); });

            bars.push({ name: T.stable, detail: T.stableDetail, risk: T.riskIssuer, val: 0, tone: 'iss' });
            if (eb) bars.push({ name: T.ecb, detail: T.ecbDetail.replace('{d}', dateLabel(eb.v.date)), risk: T.riskSovereign, val: eb.v.rate, tone: 'sov' });
            if (tb) bars.push({ name: T.tbill, detail: T.tbillDetail.replace('{m}', monthLabel(tb.v.date)), risk: T.riskSovereign, val: tb.v.rate, tone: 'sov' });
            if (eb) best = { v: eb.v.rate, l: UI.hk.yieldEcb };
            if (tb && (!best || tb.v.rate > best.v)) best = { v: tb.v.rate, l: UI.hk.yieldTbill };
            if (y) {
                var fund = null;
                Object.keys(y.v.funds || {}).forEach(function (id) {
                    var f = y.v.funds[id];
                    if (f.apy != null && (!fund || f.tvl > fund.tvl)) fund = f;
                });
                if (fund) {
                    bars.push({ name: T.mmf.replace('{s}', fund.symbol), detail: T.mmfDetail, risk: T.riskMmf, val: fund.apy, tone: 'mmf' });
                    if (!best || fund.apy > best.v) best = { v: fund.apy, l: UI.hk.yieldMmf.replace('{s}', fund.symbol) };
                }
                ['eth', 'sol'].forEach(function (k) {
                    var p = y.v[k];
                    if (p) bars.push({
                        name: T[k].replace('{s}', p.symbol).replace('{p}', p.project), detail: T.stakeDetail,
                        risk: T.riskStake, val: p.apy, tone: 'stk'
                    });
                });
            }
            if (best) hk('yield', esc(plainPct(best.v, 2)), best.l); else hk('yield', '—', '');
            if (bars.length < 2) { fail(host); return; }

            whenVisible(host, function () {
                var top = Math.max.apply(null, bars.map(function (b) { return b.val; }));
                var n = Math.max(3, Math.ceil(top + 0.6)), ticks = '';
                for (var k = 0; k <= n; k++) ticks += '<span style="left:' + (k / n * 100).toFixed(2) + '%">' + k + (EN ? '%' : NB + '%') + '</span>';
                host.innerHTML = '<div class="yl" style="--n:' + n + '"><div class="yl-head"><div class="yl-axis" aria-hidden="true">' + ticks + '</div></div>' +
                    bars.map(function (b) {
                        return '<div class="yl-row t-' + b.tone + '"><div><span class="yl-name">' + esc(b.name) + '</span><span class="yl-detail">' + esc(b.detail) + '</span></div>' +
                            '<div class="yl-plot" role="img" aria-label="' + esc(b.name + ': ' + nf(b.val, 2) + '% ' + T.perYear) + '" data-x="' + (b.val / n * 100).toFixed(2) + '">' +
                            '<span class="yl-stem"></span><span class="yl-dot"></span><span class="yl-val">' + esc(nf(b.val, 2) + (EN ? '%' : NB + '%')) + '</span></div>' +
                            '<span class="yl-risk">' + esc(b.risk) + '</span></div>';
                    }).join('') +
                    '<div class="yl-legend"><span><i class="solid"></i>' + esc(T.legendLow) + '</span><span><i></i>' + esc(T.legendStake) + '</span></div></div>';
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        $$('.yl-plot', host).forEach(function (e) {
                            e.style.setProperty('--x', e.getAttribute('data-x') + '%');
                            $$('.yl-stem,.yl-dot,.yl-val', e).forEach(function (x) { x.style.setProperty('--x', e.getAttribute('data-x') + '%'); });
                        });
                    });
                });
            });
        });
    }

    /* ---------- Tarjetas de fondos: descripción recortada con "Ver más" ---------- */
    function initClamp() {
        var items = $$('[data-clamp]');
        function measure() {
            items.forEach(function (p) {
                var btn = p.parentNode.querySelector('.more-btn');
                if (!btn) return;
                if (p.classList.contains('is-clamp')) btn.hidden = p.scrollHeight <= p.clientHeight + 1;
            });
        }
        items.forEach(function (p) {
            var btn = p.parentNode.querySelector('.more-btn');
            if (!btn) return;
            btn.addEventListener('click', function () {
                var open = p.classList.toggle('is-clamp') === false;
                btn.textContent = btn.getAttribute(open ? 'data-less' : 'data-more');
                btn.setAttribute('aria-expanded', open);
            });
        });
        measure();
        var rt;
        window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 150); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    }

    /* ---------- Navegación: chips fijos con sección activa, enlaces de ancla ---------- */
    function initNav() {
        var chips = $$('.w3-jump a'), map = {};
        chips.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
        function setActive(id) {
            chips.forEach(function (a) {
                var on = a === map[id];
                a.classList.toggle('is-active', on);
                if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
                if (on && a.scrollIntoView && a.parentNode.scrollWidth > a.parentNode.clientWidth) {
                    var nav = a.parentNode;
                    nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' });
                }
            });
        }
        // La sección activa es la última cuya cabecera ya ha pasado bajo el header y la barra fija
        function pick() {
            var cur = null;
            Object.keys(map).forEach(function (id) {
                var s = document.getElementById(id);
                if (s && s.getBoundingClientRect().top <= 260) cur = id;
            });
            var ids = Object.keys(map);
            // al final de la página, la última sección no llega a subir hasta la barra
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 140) cur = ids[ids.length - 1];
            setActive(cur);
        }
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(pick, { rootMargin: '-250px 0px 0px 0px', threshold: [0, 0.02, 0.1, 0.5, 1] });
            Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
        }
        var rafId;
        window.addEventListener('scroll', function () {
            if (rafId) return;
            rafId = requestAnimationFrame(function () { rafId = 0; pick(); });
        }, { passive: true });
        pick();

        $$('.anchor').forEach(function (b) {
            b.addEventListener('click', function () {
                var id = b.getAttribute('data-anchor'), url = location.origin + location.pathname + '#' + id;
                function done() {
                    var ok = $('.anchor-ok', b);
                    ok.textContent = UI.anchor.copied;
                    b.classList.add('is-ok');
                    setTimeout(function () { ok.textContent = ''; b.classList.remove('is-ok'); }, 1800);
                    try { history.replaceState(null, '', '#' + id); } catch (e) { }
                }
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, done);
                else {
                    var ta = document.createElement('textarea');
                    ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
                    document.body.appendChild(ta); ta.select();
                    try { document.execCommand('copy'); } catch (e) { }
                    document.body.removeChild(ta); done();
                }
            });
        });
    }

    /* ---------- 4. Herramienta de custodia ---------- */
    var quiz = $('#quiz');

    var IC = {
        bank: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
        fund: 'M12 3a9 9 0 1 0 9 9M12 3v9h9M15.5 3.7A9 9 0 0 1 20.3 8.5',
        wallet: 'M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11M16 14h2',
        exchange: 'M7 8h12l-3-3M17 16H5l3 3',
        briefcase: 'M4 8h16v11H4zM9 8V5h6v3M4 13h16',
        users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 19c0-3 2.7-5 6-5s6 2 6 5M16 5.5a3 3 0 0 1 0 5.5M18 14c2 .6 3 2.3 3 5',
        shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4',
        clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
        ban: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.7 5.7l12.6 12.6',
        key: 'M8 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM10.8 12.2L20 3M16 7l3 3M14 9l2 2',
        vault: 'M4 5h16v14H4zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM7 19v2M17 19v2',
        user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c.6-3.6 3.6-6 7.5-6s6.9 2.4 7.5 6',
        coins: 'M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5',
        dollar: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1 1.6 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.2 0-2.2-.5-2.7-1.4M12 6.5v1.3M12 16.2v1.3',
        file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
        lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2',
        candles: 'M7 4v16M5 8h4v7H5zM17 3v17M15 6h4v8h-4z',
        layers: 'M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5',
        link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
        send: 'M21 3L3 10.5l7 3 3 7zM10 13.5L21 3',
        server: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
        code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
        spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8z',
        bars1: 'M12 20v-6',
        bars2: 'M9 20v-6M15 20V9',
        bars3: 'M6 20v-5M12 20v-9M18 20V4',
        zap: 'M13 3L5 13h6l-1 8 8-10h-6z',
        sliders: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6',
        coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 12h6',
        target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.6v.8',
        scale: 'M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z',
        check: 'M5 12.5l4.5 4.5L19 7.5'
    };
    function icon(name, cls) {
        return '<svg class="' + (cls || 'qz-i') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (IC[name] || IC.spark) + '"/></svg>';
    }
    function plain(s) { return String(s).replace(/\*/g, ''); }

    function initQuiz() {
        if (!quiz || !QUIZ) return;
        var Q = QUIZ.questions, QU = QUIZ.ui, N = Q.length;
        var st = { i: -1, ans: {}, result: null, lock: false };
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };

        quiz.innerHTML =
            '<aside class="panel qz-side" aria-label="' + esc(QU.cfgAria) + '">' +
            '<div class="qz-side-top mono"><span class="live-label"><i class="live" aria-hidden="true"></i><span>' + esc(QU.cfgName) + '</span></span>' +
            '<span class="qz-done muted-d" hidden>✓ ' + esc(QU.cfgDone) + '</span></div>' +
            '<ul class="qz-cfg mono">' + Q.map(function (q) {
                return '<li data-q="' + q.id + '"><span class="k">' + esc(q.cfg) + '</span><span class="v">—</span></li>';
            }).join('') + '</ul>' +
            '<div class="qz-diagram" aria-hidden="true"><svg viewBox="0 0 300 96">' +
            '<path class="qz-wire" d="M52 34H148M152 34H248"/>' +
            ['entity', 'custodian', 'client'].map(function (k, i) {
                var x = 50 + i * 100;
                return '<g class="qz-node" data-node="' + k + '"><circle cx="' + x + '" cy="34" r="22"/>' +
                    '<g transform="translate(' + (x - 12) + ' 22)" class="qz-nico">' + ({ entity: '<path d="' + IC.bank + '"/>', custodian: '<path d="' + IC.vault + '"/>', client: '<path d="' + IC.user + '"/>' })[k] + '</g>' +
                    '<text x="' + x + '" y="82" text-anchor="middle">' + esc(QU.nodes[k]) + '</text></g>';
            }).join('') +
            '<g class="qz-key" style="--kx:100px"><circle cx="0" cy="0" r="13"/><g transform="translate(-9 -9) scale(.75)"><path d="' + IC.key + '"/></g></g>' +
            '</svg></div></aside>' +
            '<div class="card qz-main" id="qzMain"></div>';

        var main = $('#qzMain', quiz), side = $('.qz-side', quiz);

        /* ---- Panel izquierdo en directo ---- */
        function answerText(q) {
            var ids = st.ans[q.id] || [];
            return ids.length ? ids.map(function (id) { return optOf(q, id).short; }).join(', ') : '—';
        }
        function optOf(q, id) { return q.options.filter(function (o) { return o.id === id; })[0]; }
        function syncSide() {
            Q.forEach(function (q, idx) {
                var li = $('[data-q="' + q.id + '"]', side), done = (st.ans[q.id] || []).length > 0;
                $('.v', li).textContent = answerText(q);
                li.classList.toggle('is-done', done);
                li.classList.toggle('is-current', st.i === idx);
            });
            var keys = (st.ans.keys || [])[0];
            var node = { own: 'entity', custodian: 'custodian', client: 'client' }[keys];
            var kx = { entity: 50, custodian: 150, client: 250 }[node || 'custodian'];
            var key = $('.qz-key', side);
            key.style.setProperty('--kx', kx + 'px');
            key.classList.toggle('is-set', !!node);
            $$('.qz-node', side).forEach(function (n) { n.classList.toggle('on', n.getAttribute('data-node') === node); });
            $('.qz-done', side).hidden = !st.result;
        }
        function previewKey(optId) {
            var node = { own: 'entity', custodian: 'custodian', client: 'client' }[optId];
            if (!node) return;
            $('.qz-key', side).style.setProperty('--kx', { entity: 50, custodian: 150, client: 250 }[node] + 'px');
            $('.qz-key', side).classList.add('is-set');
            $$('.qz-node', side).forEach(function (n) { n.classList.toggle('on', n.getAttribute('data-node') === node); });
        }

        function paint(html, focusSel) {
            main.innerHTML = '<div class="qz-view is-in">' + html + '</div>';
            var f = focusSel && $(focusSel, main);
            if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
            syncSide();
        }

        /* ---- Pantalla inicial ---- */
        function viewStart() {
            st.i = -1;
            paint('<p class="qz-tool mono">' + esc(QU.tool) + '</p>' +
                '<h3 class="qz-start-text" id="qzStart" tabindex="-1">' + esc(QU.startText) + '</h3>' +
                '<div class="qz-mini">' + QU.startCards.map(function (c) {
                    return '<div class="qz-mini-c"><span class="qz-ico">' + icon(c.icon) + '</span><span>' + esc(c.title) + '</span></div>';
                }).join('') + '</div>' +
                '<div class="qz-start-cta"><button type="button" class="btn btn-primary" data-act="start">' + esc(QU.startBtn) + '</button>' +
                '<p class="mono qz-priv">' + esc(QU.privacy) + '</p></div>');
        }

        /* ---- Preguntas ---- */
        function viewQuestion() {
            var q = Q[st.i], multi = q.type === 'multi', sel = st.ans[q.id] || [], n = q.options.length;
            var segs = Q.map(function (_, k) { return '<i class="' + (k < st.i ? 'is-done' : (k === st.i ? 'is-now' : '')) + '"></i>'; }).join('');
            paint('<div class="qz-top"><button type="button" class="qz-back" data-act="back"' + (st.i === 0 ? ' hidden' : '') + '>' + esc(QU.backLink) + '</button>' +
                '<div class="qz-prog"><span class="qz-segs" role="progressbar" aria-valuemin="1" aria-valuemax="' + N + '" aria-valuenow="' + (st.i + 1) + '">' + segs + '</span>' +
                '<span class="mono qz-count">' + pad2(st.i + 1) + ' / ' + pad2(N) + '</span></div></div>' +
                '<h3 class="qz-title disp" id="qTitle" tabindex="-1">' + esc(q.title) + '</h3>' +
                '<div class="qz-why"><button type="button" class="qz-why-btn" aria-expanded="false" aria-controls="qWhy" data-act="why">' + esc(QU.whyBtn) + ' <span aria-hidden="true">ⓘ</span></button>' +
                '<p id="qWhy" hidden>' + esc(q.why) + '</p></div>' +
                (multi ? '<p class="qz-multi mono">' + esc(QU.multiHint) + '</p>' : '') +
                '<div class="qz-opts n' + n + '" role="' + (multi ? 'group' : 'radiogroup') + '" aria-labelledby="qTitle">' +
                q.options.map(function (o, k) {
                    var on = sel.indexOf(o.id) > -1;
                    return '<button type="button" class="qz-opt' + (on ? ' is-on' : '') + '" role="' + (multi ? 'checkbox' : 'radio') + '" aria-checked="' + on + '" data-id="' + o.id + '">' +
                        '<span class="qz-ico">' + icon(o.icon) + '</span><span class="qz-txt"><b>' + esc(o.label) + '</b><small>' + esc(o.desc) + '</small></span>' +
                        '<span class="qz-k mono" aria-hidden="true">' + (k + 1) + '</span><span class="qz-check" aria-hidden="true">' + icon('check', 'qz-ci') + '</span></button>';
                }).join('') + '</div>' +
                (multi ? '<div class="qz-foot"><button type="button" class="btn btn-primary" data-act="cont"' + (sel.length ? '' : ' disabled') + '>' + esc(st.i === N - 1 ? QU.result : QU.cont) + '</button></div>' : ''),
                '#qTitle');
        }

        function advance() {
            if (st.i === N - 1) viewResult(); else { st.i++; viewQuestion(); }
        }

        function choose(id) {
            var q = Q[st.i], multi = q.type === 'multi', cur = st.ans[q.id] || [];
            if (multi) {
                st.ans[q.id] = cur.indexOf(id) > -1 ? cur.filter(function (x) { return x !== id; }) : cur.concat(id);
            } else {
                if (st.lock) return;
                st.ans[q.id] = [id];
            }
            $$('.qz-opt', main).forEach(function (b) {
                var on = st.ans[q.id].indexOf(b.getAttribute('data-id')) > -1;
                b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on);
            });
            syncSide();
            if (multi) {
                var c = $('[data-act="cont"]', main);
                if (c) c.disabled = !st.ans[q.id].length;
            } else {
                st.lock = true;
                setTimeout(function () { st.lock = false; advance(); }, reduce ? 120 : 300);
            }
        }

        /* ---- Resultado ---- */
        function compute() {
            var tot = { self: 0, delegated: 0, noncustodial: 0 }, flags = {}, timeAdd = 0;
            Q.forEach(function (q) {
                (st.ans[q.id] || []).forEach(function (id) {
                    var o = optOf(q, id);
                    Object.keys(o.score || {}).forEach(function (k) { tot[k] += o.score[k]; });
                    if (o.flag) flags[o.flag] = 1;
                    timeAdd += o.timeAdd || 0;
                });
            });
            var order = Object.keys(tot).sort(function (a, b) { return tot[b] - tot[a]; });
            var model = tot[order[0]] - tot[order[1]] <= QUIZ.hybridMargin ? 'hybrid' : order[0];
            (QUIZ.overrides || []).forEach(function (o) {
                if ((st.ans[o.question] || []).indexOf(o.option) > -1) model = o.model;
            });
            var licence = (st.ans.licence || [])[0], ownsService = model === 'self' || model === 'hybrid';
            var t = QUIZ.models[model].timeBase + timeAdd + (ownsService && licence === 'none' ? 1 : 0);
            var tl = t < QUIZ.timeThresholds.weeks ? 'weeks' : (t < QUIZ.timeThresholds.months ? 'months' : 'long');
            var notes = [];
            if (ownsService && licence === 'none') notes.push(QUIZ.regulatoryNotes.unlicensed);
            if (ownsService && licence === 'applying') notes.push(QUIZ.regulatoryNotes.applying);
            var order2 = ['custody', 'trading', 'staking', 'collateral', 'security_tokens', 'tokenized_deposits', 'payments'];
            return {
                model: model, m: QUIZ.models[model], timeline: QUIZ.timelines[tl], notes: notes,
                watch: order2.filter(function (k) { return flags[k] && QUIZ.watchouts[k]; }).map(function (k) { return QUIZ.watchouts[k]; })
            };
        }

        function list(items) {
            return '<ul>' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
        }

        function viewResult() {
            var r = st.result = compute(), m = r.m;
            st.i = N;
            paint('<p class="qz-tool mono">' + esc(QU.resKicker) + '</p>' +
                '<h3 class="res-name disp" id="resName" tabindex="-1">' + emph(m.title) + '</h3><p class="res-sum">' + esc(m.summary) + '</p>' +
                '<div class="res3">' +
                '<div class="res-box"><h4>' + esc(QU.keys) + '</h4><p class="big">' + esc(m.tech.name) + '</p><p>' + esc(m.tech.why) + '</p></div>' +
                '<div class="res-box"><h4>' + esc(QU.timeline) + '</h4><p class="big">' + esc(r.timeline) + '</p></div>' +
                '<div class="res-box"><h4>' + esc(QU.regulatory) + '</h4><p>' + esc(m.regShort) + '</p>' + r.notes.map(function (n) { return '<p>' + esc(n) + '</p>'; }).join('') + '</div></div>' +
                '<details class="res-det"><summary>' + esc(QU.detail) + '</summary><p>' + esc(m.regulatory) + '</p></details>' +
                '<div class="res-box wide"><h4>' + esc(QU.watch) + '</h4><ul class="res-watch">' + r.watch.map(function (w) {
                    return '<li>' + icon('check', 'qz-ci') + '<span><b>' + esc(w.title) + '</b>' + esc(w.text) + '</span></li>';
                }).join('') + '</ul></div>' +
                '<div class="res-pcs"><div class="res-box res-pc pros"><h4>' + esc(QU.pros) + '</h4>' + list(m.pros) + '</div>' +
                '<div class="res-box res-pc cons"><h4>' + esc(QU.cons) + '</h4>' + list(m.cons) + '</div></div>' +
                '<div class="res-actions"><a class="btn btn-primary" href="' + esc(quiz.getAttribute('data-contact') || '#') + '">' + esc(QU.talkBtn) + '</a>' +
                '<button type="button" class="btn btn-ghost" data-act="pdf">' + esc(QU.download) + '</button>' +
                '<button type="button" class="btn btn-ghost" data-act="restart">' + esc(QU.restart) + '</button></div>' +
                '<p class="res-disc mono">' + esc(QU.disclaimer) + '</p>', '#resName');
        }

        /* ---- Eventos ---- */
        quiz.addEventListener('click', function (e) {
            var o = e.target.closest('.qz-opt');
            if (o) { choose(o.getAttribute('data-id')); return; }
            var b = e.target.closest('[data-act]');
            if (!b) return;
            var act = b.getAttribute('data-act');
            if (act === 'start') { st.i = 0; viewQuestion(); }
            else if (act === 'back') goBack();
            else if (act === 'cont') { if ((st.ans[Q[st.i].id] || []).length) advance(); }
            else if (act === 'why') {
                var p = $('#qWhy', main), open = p.hidden;
                p.hidden = !open; b.setAttribute('aria-expanded', open);
            }
            else if (act === 'restart') { st = { i: -1, ans: {}, result: null, lock: false }; viewStart(); }
            else if (act === 'pdf') makePdf(b);
        });
        quiz.addEventListener('mouseover', function (e) {
            var o = e.target.closest('.qz-opt');
            if (o && Q[st.i] && Q[st.i].id === 'keys') previewKey(o.getAttribute('data-id'));
        });
        quiz.addEventListener('mouseout', function (e) {
            if (e.target.closest('.qz-opt') && Q[st.i] && Q[st.i].id === 'keys') syncSide();
        });
        quiz.addEventListener('focusin', function (e) {
            var o = e.target.closest('.qz-opt');
            if (o && Q[st.i] && Q[st.i].id === 'keys') previewKey(o.getAttribute('data-id'));
        });

        function goBack() {
            if (st.i > 0 && st.i < N) { st.i--; viewQuestion(); }
        }

        function inView() {
            var r = quiz.getBoundingClientRect();
            return r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.25;
        }
        document.addEventListener('keydown', function (e) {
            if (e.ctrlKey || e.metaKey || e.altKey || st.i < 0 || st.i >= N || !inView()) return;
            var tg = e.target, tag = tg && tg.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tg && tg.isContentEditable)) return;
            var q = Q[st.i];
            if (/^[1-9]$/.test(e.key)) {
                var o = q.options[+e.key - 1];
                if (o) { e.preventDefault(); choose(o.id); }
            } else if (e.key === 'Enter' && q.type === 'multi' && tag !== 'BUTTON' && tag !== 'A' && (st.ans[q.id] || []).length) {
                e.preventDefault(); advance();
            } else if (e.key === 'ArrowLeft' && st.i > 0) {
                e.preventDefault(); goBack();
            }
        });

        viewStart();

        /* ---- PDF generado en el navegador (jsPDF, servido desde /static) ---- */
        function loadPdfLib() {
            if (window.jspdf) return Promise.resolve();
            return new Promise(function (ok, ko) {
                var s = document.createElement('script');
                s.src = quiz.getAttribute('data-jspdf');
                s.onload = ok; s.onerror = ko;
                document.head.appendChild(s);
            });
        }
        // Las fuentes estándar del PDF solo cubren Latin-1: se sustituyen los símbolos que no caben
        function pdfText(s) {
            return String(s).replace(/…/g, '...').replace(/[−–—]/g, '-').replace(/→/g, '->')
                .replace(/≈/g, '~').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/ /g, ' ');
        }

        function makePdf(btn) {
            var label = btn.textContent;
            btn.disabled = true; btn.textContent = QU.downloading;
            loadPdfLib().then(function () {
                var r = st.result, m = r.m, jsPDF = window.jspdf.jsPDF;
                var doc = new jsPDF({ unit: 'pt', format: 'a4' });
                var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
                var ML = 54, MW = W - ML * 2, y = 60;

                function need(h) { if (y + h > H - 64) { doc.addPage(); y = 60; } }
                function para(text, size, style, color, gap) {
                    doc.setFont('helvetica', style || 'normal'); doc.setFontSize(size); doc.setTextColor.apply(doc, color || [60, 68, 84]);
                    var lines = doc.splitTextToSize(pdfText(text), MW), lh = size * 1.42;
                    lines.forEach(function (ln) { need(lh); doc.text(ln, ML, y); y += lh; });
                    y += gap == null ? 8 : gap;
                }
                function head(text) { need(40); y += 8; para(text.toUpperCase(), 8.5, 'bold', [110, 118, 134], 4); }
                function bullets(items, sign) {
                    items.forEach(function (it) {
                        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
                        var lines = doc.splitTextToSize(pdfText(it), MW - 16), lh = 14.5;
                        need(lh * lines.length);
                        doc.setTextColor(60, 68, 84); doc.text(sign, ML, y);
                        lines.forEach(function (ln) { doc.text(ln, ML + 16, y); y += lh; });
                        y += 3;
                    });
                    y += 4;
                }

                doc.setFillColor(79, 91, 213); doc.rect(0, 0, W, 6, 'F');
                para(QU.pdfTitle, 9, 'bold', [110, 118, 134], 2);
                para(QU.pdfDate.replace('{d}', new Date().toLocaleDateString(LOC, { day: 'numeric', month: 'long', year: 'numeric' })), 9, 'normal', [110, 118, 134], 18);
                para(QU.resKicker.toUpperCase(), 8.5, 'bold', [110, 118, 134], 4);
                para(m.name, 22, 'bold', [11, 18, 32], 8);
                para(m.summary, 11.5, 'normal', [60, 68, 84], 6);
                head(QU.keys); para(m.tech.name, 12, 'bold', [11, 18, 32], 3); para(m.tech.why, 10.5);
                head(QU.timeline); para(r.timeline, 12, 'bold', [11, 18, 32]);
                head(QU.regulatory); para(m.regulatory, 10.5); r.notes.forEach(function (n) { para(n, 10.5); });
                head(QU.watch);
                r.watch.forEach(function (w) { para(w.title, 10.5, 'bold', [11, 18, 32], 1); para(w.text, 10.5, 'normal', null, 6); });
                head(QU.pros); bullets(m.pros, '+');
                head(QU.cons); bullets(m.cons, '-');
                head(QU.answers);
                Q.forEach(function (q) {
                    para(q.title, 9.5, 'bold', [110, 118, 134], 1);
                    para((st.ans[q.id] || []).map(function (id) { return optOf(q, id).label; }).join(', '), 10.5, 'normal', null, 5);
                });
                y += 6; para(QU.disclaimer, 9.5, 'bold', [11, 18, 32], 0);

                var n = doc.internal.getNumberOfPages();
                for (var p = 1; p <= n; p++) {
                    doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(140, 148, 164);
                    doc.text(pdfText(QU.pdfSite), ML, H - 34);
                    doc.text(p + ' / ' + n, W - ML, H - 34, { align: 'right' });
                }
                doc.save(QU.pdfFile);
            }).catch(function () {
                var e = document.createElement('p');
                e.className = 'q-err'; e.setAttribute('role', 'alert'); e.textContent = QU.downloadError;
                btn.parentNode.appendChild(e);
            }).then(function () { btn.disabled = false; btn.textContent = label; });
        }
    }

    hkStatic();
    initTicker();
    initStable();
    initYields();
    initClamp();
    initNav();
    whenVisible($('#quiz'), initQuiz);
})();
