/* ============================================
   alexgilabert.xyz · Web3 Lab · Cronología de la tokenización
   Línea temporal propia (DOM + CSS, sin librerías) con zoom, desplazamiento con inercia,
   minimapa, filtros por categoría y agrupación de hitos. Los hitos salen de
   data/tokenization-timeline.json, ya localizados por el servidor (#lab-data → tl).
   Escritorio: eje horizontal. Móvil (≤ 900 px): eje vertical con botones de zoom.
   ============================================ */
(function () {
    'use strict';

    var DATA;
    try { DATA = JSON.parse(document.getElementById('lab-data').textContent); } catch (e) { return; }
    var TL = DATA.tl, root = document.getElementById('tz');
    if (!TL || !root || !TL.events || !TL.events.length) return;

    var UI = TL.ui, CATS = TL.categories, INV = TL.involved || {};
    var EN = document.documentElement.lang === 'en', LOC = EN ? 'en-US' : 'es-ES';
    var DAY = 864e5, MON = 30.4375 * DAY;
    var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mq = window.matchMedia('(max-width: 900px)');

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    var IC = {
        dollar: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1 1.6 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2c-1.2 0-2.2-.5-2.7-1.4M12 6.5v1.3M12 16.2v1.3',
        fund: 'M12 3a9 9 0 1 0 9 9M12 3v9h9M15.5 3.7A9 9 0 0 1 20.3 8.5',
        bank: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
        file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
        candles: 'M7 4v16M5 8h4v7H5zM17 3v17M15 6h4v8h-4z',
        layers: 'M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5'
    };
    function icon(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (IC[name] || IC.layers) + '"/></svg>'; }

    var COUNTRY = {
        US: ['EE. UU.', 'United States'], VG: ['Islas Vírgenes Británicas', 'British Virgin Islands'], FR: ['Francia', 'France'],
        EU: ['Unión Europea', 'European Union'], NL: ['Países Bajos', 'Netherlands'], IE: ['Irlanda', 'Ireland'],
        GB: ['Reino Unido', 'United Kingdom'], HK: ['Hong Kong', 'Hong Kong'], AU: ['Australia', 'Australia'],
        CH: ['Suiza', 'Switzerland'], LU: ['Luxemburgo', 'Luxembourg'], DE: ['Alemania', 'Germany'],
        ES: ['España', 'Spain'], AD: ['Andorra', 'Andorra']
    };
    function countryName(c) { return c && COUNTRY[c] ? COUNTRY[c][EN ? 1 : 0] : ''; }

    /* ---------- Datos ---------- */
    var CAT = {};
    CATS.forEach(function (c) { CAT[c.id] = c; });
    var FULL0 = Date.parse(TL.range.start + 'T00:00:00Z'), FULL1 = Date.parse(TL.range.end + 'T00:00:00Z') + DAY;
    var FULLSPAN = FULL1 - FULL0, MINSPAN = 18 * DAY, NOW = Date.now();

    var EV = TL.events.map(function (e) {
        return {
            id: e.id, t: Date.parse(e.date + 'T00:00:00Z'), cat: e.category, c: CAT[e.category], ents: e.entities,
            title: e.title, desc: e.description, status: e.status, country: e.country, spain: !!e.spain,
            involved: e.involved ? INV[e.involved] : null, sources: e.sources, label: e.date_label, prec: e.precision
        };
    }).sort(function (a, b) { return a.t - b.t; });
    var BYID = {};
    EV.forEach(function (e) { BYID[e.id] = e; });

    var fmtM = new Intl.DateTimeFormat(LOC, { month: 'short', year: 'numeric', timeZone: 'UTC' });
    var fmtML = new Intl.DateTimeFormat(LOC, { month: 'long', year: 'numeric', timeZone: 'UTC' });
    var fmtD = new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    var fmtMo = new Intl.DateTimeFormat(LOC, { month: 'short', timeZone: 'UTC' });
    function whenShort(e) {
        if (e.label) return e.label;
        if (e.prec === 'year') return String(new Date(e.t).getUTCFullYear());
        return fmtM.format(e.t).replace(/\./g, '');
    }
    function whenFull(e) {
        if (e.label) return e.label;
        if (e.prec === 'year') return String(new Date(e.t).getUTCFullYear());
        return (e.prec === 'month' ? fmtML : fmtD).format(e.t);
    }

    /* ---------- Estado ---------- */
    var S = { mode: 'line', cats: {}, es: false, sel: null, t0: 0, t1: 0, vopen: null };
    CATS.forEach(function (c) { S.cats[c.id] = true; });
    var RANGES = {
        '1': function () { return [NOW - 10 * MON, NOW + 2 * MON]; },
        '3': function () { return [NOW - 33 * MON, NOW + 3 * MON]; },
        'all': function () { return [FULL0, FULL1]; }
    };
    var def = [NOW - 21 * MON, NOW + 5 * MON];
    S.t0 = def[0]; S.t1 = def[1];

    function filtered() {
        return EV.filter(function (e) { return S.cats[e.cat] && (!S.es || e.spain); });
    }

    /* ---------- Estructura ---------- */
    var chipHTML = CATS.map(function (c) {
        return '<button type="button" class="tz-chip" data-cat="' + c.id + '" aria-pressed="true" style="--cc:' + c.color + '"><i></i>' + esc(c.name) + ' <b></b></button>';
    }).join('') + '<button type="button" class="tz-chip is-es" data-es="1" aria-pressed="false"><i></i>' + esc(UI.spain) + ' <b></b></button>';

    root.insertAdjacentHTML('afterbegin',
        '<div class="tz-bar">' +
        '<div class="tz-seg tz-mode" role="group" aria-label="' + esc(UI.modeAria) + '"><button type="button" data-mode="line" aria-pressed="true">' + esc(UI.modeLine) + '</button><button type="button" data-mode="lanes" aria-pressed="false">' + esc(UI.modeLanes) + '</button></div>' +
        '<div class="tz-seg tz-range-d" role="group" aria-label="' + esc(UI.rangeAria) + '"><button type="button" data-range="1" aria-pressed="false">' + esc(UI.range1) + '</button><button type="button" data-range="3" aria-pressed="false">' + esc(UI.range3) + '</button><button type="button" data-range="all" aria-pressed="false">' + esc(UI.rangeAll) + '</button></div>' +
        '<div class="tz-pan"><button type="button" class="tz-btn" data-pan="-1" aria-label="' + esc(UI.panPrev) + '">◀</button><button type="button" class="tz-btn" data-pan="1" aria-label="' + esc(UI.panNext) + '">▶</button></div>' +
        '<div class="tz-zoom"><button type="button" class="tz-btn" data-zoom="out" aria-label="' + esc(UI.zoomOut) + '">−</button><button type="button" class="tz-btn" data-zoom="in" aria-label="' + esc(UI.zoomIn) + '">+</button></div></div>' +
        '<div class="tz-filters" role="group" aria-label="' + esc(UI.filters) + '">' + chipHTML + '</div>' +
        '<p class="mono tz-count" aria-live="polite"></p>' +
        '<div class="tz-stage" id="tzStage" tabindex="0" role="group" aria-label="' + esc(UI.aria) + '" aria-describedby="tzKeys"><div class="tz-canvas">' +
        '<div class="tz-ticks"></div><div class="tz-lanes"></div><div class="tz-axis"><i class="tz-axisline"></i></div>' +
        '<div class="tz-now"><b>' + esc(UI.today) + '</b></div><div class="tz-items"></div><p class="tz-empty" hidden>' + esc(UI.empty) + '</p></div></div>' +
        '<div class="tz-v"><ol class="tz-vlist"></ol></div>' +
        '<div class="tz-mini" role="group" aria-label="' + esc(UI.minimap) + '"><div class="tz-m-win" tabindex="-1"></div></div>' +
        '<p class="tz-keys mono" id="tzKeys">' + esc(UI.keys) + '</p>' +
        '<div class="tz-panel card" id="tzPanel" role="region" aria-live="polite" hidden></div>');

    var stage = $('#tzStage'), canvas = $('.tz-canvas', stage), tickEl = $('.tz-ticks', stage), laneEl = $('.tz-lanes', stage),
        axisLine = $('.tz-axisline', stage), nowEl = $('.tz-now', stage), itemsEl = $('.tz-items', stage), emptyEl = $('.tz-empty', stage),
        vlist = $('.tz-vlist', root), mini = $('.tz-mini', root), win = $('.tz-m-win', mini), panel = $('#tzPanel'), countEl = $('.tz-count', root);

    /* ---------- Nodos de los hitos (una sola vez) ---------- */
    EV.forEach(function (e) {
        var el = document.createElement('div');
        el.className = 'tz-item st-' + e.status;
        el.setAttribute('data-id', e.id);
        el.style.setProperty('--cc', e.c.color);
        el.hidden = true;
        el.innerHTML = '<button type="button" class="tz-dot" tabindex="-1" aria-expanded="false" aria-controls="tzPanel" aria-label="' + esc(whenShort(e) + ': ' + e.title) + '"></button>' +
            '<span class="tz-stem" aria-hidden="true"></span>' + cardHTML(e);
        itemsEl.appendChild(el);
        e.el = el; e.cls = '';
    });

    function cardHTML(e) {
        return '<div class="tz-card" aria-hidden="true"><span class="tz-c-top"><span class="tz-ci">' + icon(e.c.icon) + '</span><span class="mono tz-when">' + esc(whenShort(e)) +
            '</span><span class="status mono" data-status="' + e.status + '">' + esc(UI.statuses[e.status]) + '</span></span>' +
            '<b class="tz-title">' + esc(e.title) + '</b><span class="tz-ent">' + esc(e.ents.slice(0, 3).join(' · ')) + '</span>' +
            (e.involved ? '<span class="tz-tag mono" data-tip="' + esc(e.involved) + '">' + esc(UI.involved) + '</span>' : '') + '</div>';
    }

    /* ---------- Vista: límites, zoom y desplazamiento ---------- */
    var twId = 0, inId = 0, dirty = false;

    function clampView(a, b) {
        var span = Math.max(MINSPAN, Math.min(b - a, FULLSPAN)), mid = (a + b) / 2;
        a = mid - span / 2; b = a + span;
        if (a < FULL0) { a = FULL0; b = a + span; }
        if (b > FULL1) { b = FULL1; a = b - span; }
        return [a, b];
    }
    function schedule() {
        if (dirty) return;
        dirty = true;
        requestAnimationFrame(function () { dirty = false; render(); });
    }
    function cancelMotion() {
        if (twId) { cancelAnimationFrame(twId); twId = 0; }
        if (inId) { cancelAnimationFrame(inId); inId = 0; }
    }
    function setView(a, b) {
        var c = clampView(a, b);
        S.t0 = c[0]; S.t1 = c[1];
        schedule();
    }
    function tweenTo(a, b) {
        var c = clampView(a, b);
        cancelMotion();
        if (REDUCE || mq.matches) { S.t0 = c[0]; S.t1 = c[1]; render(); return; }
        var s0 = S.t0, s1 = S.t1, st = performance.now(), dur = 420;
        (function f(now) {
            var p = Math.min(1, (now - st) / dur), e = 1 - Math.pow(1 - p, 3);
            S.t0 = s0 + (c[0] - s0) * e; S.t1 = s1 + (c[1] - s1) * e;
            render();
            twId = p < 1 ? requestAnimationFrame(f) : 0;
        })(st);
    }
    function zoomAround(newSpan, anchor) {
        var span = S.t1 - S.t0, ns = Math.max(MINSPAN, Math.min(FULLSPAN, newSpan)), r = (anchor - S.t0) / span;
        var a = anchor - r * ns;
        setView(a, a + ns);
    }
    function zoomBy(f, animate) {
        var span = S.t1 - S.t0, anchor = (S.t0 + S.t1) / 2;
        var sel = S.sel && BYID[S.sel];
        if (sel && sel.t > S.t0 && sel.t < S.t1) anchor = sel.t;
        var ns = Math.max(MINSPAN, Math.min(FULLSPAN, span * f)), r = (anchor - S.t0) / span, a = anchor - r * ns;
        if (animate) tweenTo(a, a + ns); else setView(a, a + ns);
    }
    function panPx(dx) {
        var k = stage.clientWidth / (S.t1 - S.t0), dt = -dx / k;
        setView(S.t0 + dt, S.t1 + dt);
    }

    /* ---------- Ejes y rejilla ---------- */
    function ticksHTML(W) {
        var span = S.t1 - S.t0, ppd = W / (span / DAY), out = '';
        var unit = ppd * 30.4 >= 62 ? 'month' : (ppd * 91 >= 62 ? 'quarter' : 'year');
        var yStep = unit === 'year' ? (ppd * 365 >= 62 ? 1 : (ppd * 365 * 2 >= 62 ? 2 : 5)) : 1;
        var d0 = new Date(S.t0), y = d0.getUTCFullYear(), m = d0.getUTCMonth();
        var t, guard = 0, k = W / span;
        function X(tt) { return (tt - S.t0) * k; }
        if (unit === 'month') {
            for (; guard < 400; guard++, m++) {
                t = Date.UTC(y, m, 1);
                if (t > S.t1) break;
                if (t < S.t0 - MON) continue;
                var mm = ((m % 12) + 12) % 12, yy = y + Math.floor(m / 12);
                var lbl = fmtMo.format(t).replace(/\./g, '') + (mm === 0 || t - S.t0 < MON ? ' ' + yy : '');
                out += '<span class="tz-tk' + (mm === 0 ? ' major' : '') + '" style="left:' + X(t).toFixed(1) + 'px"><i></i><b class="mono">' + esc(lbl) + '</b></span>';
            }
        } else if (unit === 'quarter') {
            m = Math.floor(m / 3) * 3;
            for (; guard < 400; guard++, m += 3) {
                t = Date.UTC(y, m, 1);
                if (t > S.t1) break;
                if (t < S.t0 - 3 * MON) continue;
                var q = (((m % 12) + 12) % 12) / 3 + 1, yq = y + Math.floor(m / 12);
                out += '<span class="tz-tk' + (q === 1 ? ' major' : '') + '" style="left:' + X(t).toFixed(1) + 'px"><i></i><b class="mono">' + esc(UI.quarter.replace('{q}', q) + ' ' + yq) + '</b></span>';
            }
        } else {
            y = Math.floor(y / yStep) * yStep;
            for (; guard < 100; guard++, y += yStep) {
                t = Date.UTC(y, 0, 1);
                if (t > S.t1) break;
                if (t < S.t0 - 365 * DAY) continue;
                out += '<span class="tz-tk major" style="left:' + X(t).toFixed(1) + 'px"><i></i><b class="mono">' + y + '</b></span>';
            }
            if (ppd * 91 >= 14 && yStep === 1) {
                for (y = new Date(S.t0).getUTCFullYear(); y <= new Date(S.t1).getUTCFullYear(); y++) {
                    [3, 6, 9].forEach(function (mo) {
                        var tq = Date.UTC(y, mo, 1);
                        if (tq > S.t0 && tq < S.t1) out += '<span class="tz-tk minor" style="left:' + X(tq).toFixed(1) + 'px"><i></i></span>';
                    });
                }
            }
        }
        return out;
    }

    /* ---------- Render (escritorio) ---------- */
    var layoutKey = '', placed = {};
    function lanesActive() {
        return CATS.filter(function (c) { return S.cats[c.id]; });
    }

    function render() {
        syncUI();
        if (mq.matches) { renderV(); renderMini(); return; }
        var W = stage.clientWidth;
        if (!W) return;
        var lanes = S.mode === 'lanes', LH = 132, laneCats = lanesActive();
        var H = lanes ? Math.max(1, laneCats.length) * LH + 34 : 650, ay = 325;
        var key = S.mode + '|' + (lanes ? laneCats.map(function (c) { return c.id; }).join(',') : '');
        canvas.style.height = H + 'px';
        canvas.className = 'tz-canvas mode-' + S.mode;
        canvas.style.setProperty('--ay', ay + 'px');
        canvas.style.setProperty('--cw', (lanes ? 176 : 212) + 'px');
        canvas.style.setProperty('--ch', (lanes ? 52 : 124) + 'px');
        if (key !== layoutKey) {
            layoutKey = key;
            laneEl.innerHTML = lanes ? laneCats.map(function (c, i) {
                return '<div class="tz-lane" style="top:' + (i * LH) + 'px;height:' + LH + 'px;--cc:' + c.color + '"><span class="tz-lane-l">' + icon(c.icon) + esc(c.name) + '</span></div>';
            }).join('') : '';
            axisLine.style.display = lanes ? 'none' : '';
        }
        tickEl.innerHTML = ticksHTML(W);

        var k = W / (S.t1 - S.t0), cw = lanes ? 176 : 212;
        function X(t) { return (t - S.t0) * k; }
        var nx = X(NOW);
        nowEl.style.display = nx < 0 || nx > W ? 'none' : '';
        nowEl.style.left = nx.toFixed(1) + 'px';
        axisLine.style.setProperty('--tx', Math.max(0, Math.min(W, nx)).toFixed(1) + 'px');

        var vis = [], laneIdx = {};
        laneCats.forEach(function (c, i) { laneIdx[c.id] = i; });
        EV.forEach(function (e) {
            e.x = X(e.t);
            var on = S.cats[e.cat] && (!S.es || e.spain) && e.x > -cw / 2 - 24 && e.x < W + cw / 2 + 24;
            if (on) vis.push(e); else if (!e.el.hidden) e.el.hidden = true;
        });
        emptyEl.hidden = filtered().length > 0;

        // Agrupar hitos que se solapan (el hito seleccionado nunca se agrupa)
        var groups = {}, clusters = [], singles = [];
        vis.forEach(function (e) {
            var g = lanes ? e.cat : 'all';
            (groups[g] = groups[g] || []).push(e);
        });
        Object.keys(groups).forEach(function (g) {
            var cur = null;
            function flush() {
                if (!cur) return;
                if (cur.m.length > 1) { cur.g = g; clusters.push(cur); } else singles.push(cur.m[0]);
                cur = null;
            }
            groups[g].forEach(function (e) {
                if (e.id === S.sel) { flush(); singles.push(e); return; }
                if (cur && e.x - cur.last <= 16 && e.x - cur.first <= 64) { cur.m.push(e); cur.last = e.x; }
                else { flush(); cur = { m: [e], first: e.x, last: e.x }; }
            });
            flush();
        });

        function yOf(e) { return lanes ? laneIdx[e.cat] * LH + LH / 2 : ay; }

        // Tarjetas: se colocan primero el seleccionado y luego por orden de aparición, alternando arriba y abajo
        var occ = {}, GAP = 10;
        function free(kk, l, r) {
            var a = occ[kk] || [];
            for (var i = 0; i < a.length; i++) if (l < a[i][1] + GAP && r > a[i][0] - GAP) return false;
            return true;
        }
        singles.sort(function (a, b) { return (a.id === S.sel ? -1 : (b.id === S.sel ? 1 : 0)) || a.x - b.x; });
        var n = 0;
        singles.forEach(function (e) {
            var slots = lanes ? [['up', 0], ['down', 0]] : [['up', 0], ['down', 0], ['up', 1], ['down', 1]];
            if (n % 2) slots = lanes ? [['down', 0], ['up', 0]] : [['down', 0], ['up', 0], ['down', 1], ['up', 1]];
            var l = e.x - cw / 2, r = e.x + cw / 2, pick = null;
            for (var i = 0; i < slots.length; i++) {
                var kk = (lanes ? e.cat : 'a') + slots[i][0] + slots[i][1];
                if (free(kk, l, r)) { pick = slots[i]; (occ[kk] = occ[kk] || []).push([l, r]); break; }
            }
            if (!pick && e.id === S.sel) pick = slots[0];
            e.slot = pick;
            if (pick) n++;
        });

        var clusterSet = {};
        clusters.forEach(function (c) { c.m.forEach(function (e) { clusterSet[e.id] = true; }); });
        vis.forEach(function (e) {
            var el = e.el;
            if (clusterSet[e.id]) { el.hidden = true; return; }
            el.hidden = false;
            var cls = 'tz-item st-' + e.status + (e.slot ? ' ' + e.slot[0] + ' lvl' + e.slot[1] : ' no-card') + (e.id === S.sel ? ' is-sel' : '') + (e.t > NOW ? ' is-future' : '');
            if (cls !== e.cls) { el.className = cls; e.cls = cls; }
            el.style.transform = 'translate(' + e.x.toFixed(1) + 'px,' + yOf(e) + 'px)';
        });

        // Círculos de agrupación
        var cls$ = $$('.tz-cluster', itemsEl);
        clusters.forEach(function (c, i) {
            var el = cls$[i];
            if (!el) {
                el = document.createElement('button');
                el.type = 'button'; el.className = 'tz-cluster';
                itemsEl.appendChild(el); cls$[i] = el;
            }
            var mx = c.m.reduce(function (s, e) { return s + e.x; }, 0) / c.m.length;
            el.hidden = false;
            el.textContent = c.m.length;
            el.setAttribute('aria-label', UI.cluster.replace('{n}', c.m.length));
            el.style.transform = 'translate(' + mx.toFixed(1) + 'px,' + yOf(c.m[0]) + 'px)';
            el._m = c.m;
        });
        for (var j = clusters.length; j < cls$.length; j++) cls$[j].hidden = true;

        renderMini();
    }

    /* ---------- Render (móvil: eje vertical) ---------- */
    function renderV() {
        var list = filtered().filter(function (e) { return e.t >= S.t0 && e.t <= S.t1; }), html = '', yr = null, nowDone = false;
        function nowMark() { return '<li class="tz-vnow" aria-hidden="true"><span>' + esc(UI.today) + ' · ' + esc(fmtD.format(NOW)) + '</span></li>'; }
        list.forEach(function (e) {
            var y = new Date(e.t).getUTCFullYear();
            if (!nowDone && e.t > NOW) { html += nowMark(); nowDone = true; }
            if (y !== yr) { html += '<li class="tz-vyear">' + y + '</li>'; yr = y; }
            var open = S.vopen === e.id;
            html += '<li class="tz-vi st-' + e.status + (e.t > NOW ? ' is-future' : '') + '" data-id="' + e.id + '" style="--cc:' + e.c.color + '"><i class="tz-vdot"></i>' +
                '<button type="button" aria-expanded="' + open + '">' + cardHTML(e).replace(' aria-hidden="true"', '') + '</button>' +
                '<div class="tz-vdetail"' + (open ? '' : ' hidden') + '>' + detailHTML(e, false) + '</div></li>';
        });
        if (!nowDone && NOW >= S.t0 && NOW <= S.t1) html += nowMark();
        vlist.innerHTML = html || '<li class="tz-vempty">' + esc(UI.empty) + '</li>';
    }

    /* ---------- Minimapa ---------- */
    var miniSig = '';
    function renderMini() {
        var w = mini.clientWidth, sig = Object.keys(S.cats).filter(function (c) { return S.cats[c]; }).join(',') + '|' + S.es + '|' + w;
        if (sig !== miniSig) {
            miniSig = sig;
            var html = '';
            for (var y = 2014; y <= 2027; y += 2) {
                html += '<span class="tz-m-year" style="left:' + ((Date.UTC(y, 0, 1) - FULL0) / FULLSPAN * 100).toFixed(2) + '%">' + y + '</span>';
            }
            html += '<i class="tz-m-now" style="left:' + ((NOW - FULL0) / FULLSPAN * 100).toFixed(2) + '%"></i>';
            filtered().forEach(function (e) {
                html += '<i class="tz-m-tick" style="left:' + ((e.t - FULL0) / FULLSPAN * 100).toFixed(2) + '%;--cc:' + e.c.color + '"></i>';
            });
            $$('.tz-m-year, .tz-m-now, .tz-m-tick', mini).forEach(function (n) { n.parentNode.removeChild(n); });
            mini.insertAdjacentHTML('afterbegin', html);
        }
        win.style.left = ((S.t0 - FULL0) / FULLSPAN * 100).toFixed(3) + '%';
        win.style.width = Math.max(((S.t1 - S.t0) / FULLSPAN * 100), 0.5).toFixed(3) + '%';
    }

    /* ---------- Panel de detalle ---------- */
    function srcHTML(e) {
        return '<p class="item-src">' + e.sources.map(function (u, i) {
            return '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(UI.source) + (e.sources.length > 1 ? ' ' + (i + 1) : '') + ' ↗</a>';
        }).join('') + '</p>';
    }
    function detailHTML(e, full) {
        var c = e.c, cn = countryName(e.country);
        return (full ? '<div class="tz-p-head"><div class="tz-p-meta">' : '<div class="tz-p-meta" style="margin-bottom:10px">') +
            '<span class="tz-catchip" style="--cc:' + c.color + '"><span class="tz-ci">' + icon(c.icon) + '</span>' + esc(c.name) + '</span>' +
            '<span class="status mono" data-status="' + e.status + '">' + esc(UI.statuses[e.status]) + '</span>' +
            '<span class="mono tz-when">' + esc(whenFull(e)) + '</span></div>' +
            (full ? '<button type="button" class="tz-p-close" data-close="1" aria-label="' + esc(UI.close) + '">×</button></div><h3 class="disp">' + esc(e.title) + '</h3>' : '') +
            '<p class="tz-p-desc">' + esc(e.desc) + '</p>' +
            '<dl class="meta mono"><div><dt>' + esc(UI.date) + '</dt><dd>' + esc(whenFull(e)) + '</dd></div>' +
            '<div><dt>' + esc(UI.entities) + '</dt><dd>' + esc(e.ents.join(', ')) + '</dd></div>' +
            (cn ? '<div><dt>' + esc(UI.country) + '</dt><dd>' + esc(cn) + '</dd></div>' : '') + '</dl>' +
            (e.involved ? '<div class="tz-p-inv"><span class="tz-tag mono">' + esc(UI.involved) + '</span><span>' + esc(e.involved) + '</span></div>' : '') +
            srcHTML(e);
    }
    function panelHTML(e) {
        var list = filtered(), i = list.indexOf(e);
        return detailHTML(e, true) + '<div class="tz-p-foot"><span class="mono tz-count">' + (i + 1) + ' / ' + list.length + '</span><div class="tz-p-nav">' +
            '<button type="button" data-step="-1">← ' + esc(UI.prev) + '</button><button type="button" data-step="1">' + esc(UI.next) + ' →</button></div></div>';
    }
    function showPanel() {
        var e = S.sel && BYID[S.sel];
        $$('.tz-dot', itemsEl).forEach(function (d) { d.setAttribute('aria-expanded', 'false'); });
        if (!e) { panel.hidden = true; panel.innerHTML = ''; return; }
        var dot = $('.tz-dot', e.el);
        if (dot) dot.setAttribute('aria-expanded', 'true');
        panel.innerHTML = panelHTML(e);
        panel.hidden = false;
    }
    function reveal(e) {
        var span = S.t1 - S.t0;
        if (e.t < S.t0 + span * 0.1 || e.t > S.t1 - span * 0.1) tweenTo(e.t - span / 2, e.t + span / 2);
    }
    function select(id, opts) {
        opts = opts || {};
        var e = BYID[id];
        if (!e) return;
        S.sel = id;
        if (opts.reveal) reveal(e);
        showPanel();
        render();
        if (opts.scroll && panel.scrollIntoView) panel.scrollIntoView({ block: 'nearest', behavior: REDUCE ? 'auto' : 'smooth' });
    }
    function closePanel() { S.sel = null; showPanel(); render(); }
    function step(dir) {
        var list = filtered();
        if (!list.length) return;
        var i = S.sel ? list.indexOf(BYID[S.sel]) : -1, mid = (S.t0 + S.t1) / 2;
        if (i < 0) {
            var after = list.filter(function (e) { return e.t >= mid; });
            i = dir > 0 ? (after.length ? list.indexOf(after[0]) : list.length - 1) : (after.length ? Math.max(0, list.indexOf(after[0]) - 1) : list.length - 1);
        } else i = Math.max(0, Math.min(list.length - 1, i + dir));
        select(list[i].id, { reveal: true });
    }
    function openList(members) {
        S.sel = null;
        showPanel();
        panel.innerHTML = '<div class="tz-p-head"><h3 class="disp">' + esc(UI.clusterList) + '</h3><button type="button" class="tz-p-close" data-close="1" aria-label="' + esc(UI.close) + '">×</button></div>' +
            '<ul class="tz-list">' + members.map(function (e) { return '<li><button type="button" data-pick="' + e.id + '">' + esc(whenShort(e) + ' · ' + e.title) + '</button></li>'; }).join('') + '</ul>';
        panel.hidden = false;
    }
    function clusterClick(m) {
        var ts = m.map(function (e) { return e.t; }), lo = Math.min.apply(null, ts), hi = Math.max.apply(null, ts);
        if (hi - lo < 3 * DAY || S.t1 - S.t0 <= MINSPAN * 1.6) { openList(m); return; }
        var span = Math.max((hi - lo) * 1.5, 90 * DAY), mid = (lo + hi) / 2;
        tweenTo(mid - span / 2, mid + span / 2);
    }

    /* ---------- Controles ---------- */
    function approx(a, b) { return Math.abs(a - b) < 4 * DAY; }
    function syncUI() {
        $$('[data-range]', root).forEach(function (b) {
            var r = RANGES[b.getAttribute('data-range')]();
            b.setAttribute('aria-pressed', String(approx(S.t0, r[0]) && approx(S.t1, r[1])));
        });
        $$('[data-mode]', root).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === S.mode)); });
        var span = S.t1 - S.t0;
        $('[data-zoom="in"]', root).disabled = span <= MINSPAN * 1.05;
        $('[data-zoom="out"]', root).disabled = span >= FULLSPAN * 0.995;
        var total = filtered().length, shown = filtered().filter(function (e) { return e.t >= S.t0 && e.t <= S.t1; }).length;
        countEl.textContent = UI.count.replace('{n}', shown).replace('{t}', total);
    }
    function syncChips() {
        $$('.tz-chip', root).forEach(function (b) {
            var id = b.getAttribute('data-cat');
            if (id) {
                b.setAttribute('aria-pressed', String(!!S.cats[id]));
                $('b', b).textContent = EV.filter(function (e) { return e.cat === id && (!S.es || e.spain); }).length;
            } else {
                b.setAttribute('aria-pressed', String(S.es));
                $('b', b).textContent = EV.filter(function (e) { return e.spain; }).length;
            }
        });
    }

    root.addEventListener('click', function (ev) {
        var t = ev.target;
        var b = t.closest('[data-mode]');
        if (b) { S.mode = b.getAttribute('data-mode'); layoutKey = ''; render(); return; }
        b = t.closest('[data-range]');
        if (b) { var r = RANGES[b.getAttribute('data-range')](); tweenTo(r[0], r[1]); return; }
        b = t.closest('[data-zoom]');
        if (b) { zoomBy(b.getAttribute('data-zoom') === 'in' ? 0.5 : 2, true); return; }
        b = t.closest('[data-pan]');
        if (b) { var d = (S.t1 - S.t0) * 0.4 * +b.getAttribute('data-pan'); tweenTo(S.t0 + d, S.t1 + d); return; }
        b = t.closest('.tz-chip');
        if (b) {
            if (b.getAttribute('data-es')) S.es = !S.es; else { var id = b.getAttribute('data-cat'); S.cats[id] = !S.cats[id]; }
            if (S.sel && (!S.cats[BYID[S.sel].cat] || (S.es && !BYID[S.sel].spain))) { S.sel = null; showPanel(); }
            syncChips(); layoutKey = ''; miniSig = ''; render(); return;
        }
        b = t.closest('[data-close]');
        if (b) { closePanel(); return; }
        b = t.closest('[data-step]');
        if (b) { step(+b.getAttribute('data-step')); return; }
        b = t.closest('[data-pick]');
        if (b) { select(b.getAttribute('data-pick'), { reveal: true }); return; }
        // Móvil: acordeón en cada hito
        b = t.closest('.tz-vi > button');
        if (b) {
            var li = b.parentNode, id2 = li.getAttribute('data-id');
            S.vopen = S.vopen === id2 ? null : id2;
            renderV();
            return;
        }
    });

    var suppress = false;
    itemsEl.addEventListener('click', function (ev) {
        if (suppress) return;
        var cl = ev.target.closest('.tz-cluster');
        if (cl) { clusterClick(cl._m); return; }
        var it = ev.target.closest('.tz-item');
        if (it && !ev.target.closest('.tz-tag')) select(it.getAttribute('data-id'), { scroll: true });
    }, true);

    /* ---------- Gestos: arrastrar con inercia, rueda, pellizco ---------- */
    var ptrs = {}, drag = null, pinch = null;
    function nPtrs() { return Object.keys(ptrs).length; }

    stage.addEventListener('pointerdown', function (ev) {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;
        ptrs[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
        cancelMotion();
        if (nPtrs() === 1) drag = { sx: ev.clientX, lx: ev.clientX, moved: false, s: [[performance.now(), ev.clientX]] };
        else if (nPtrs() === 2) {
            var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]];
            pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, span: S.t1 - S.t0 };
            drag = null;
        }
    });
    stage.addEventListener('pointermove', function (ev) {
        var p = ptrs[ev.pointerId];
        if (!p) return;
        p.x = ev.clientX; p.y = ev.clientY;
        if (pinch && nPtrs() >= 2) {
            var ids = Object.keys(ptrs), a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
            var r = stage.getBoundingClientRect(), cx = (a.x + b.x) / 2 - r.left, k = stage.clientWidth / (S.t1 - S.t0);
            zoomAround(pinch.span * pinch.d / d, S.t0 + cx / k);
            suppress = true;
            return;
        }
        if (!drag) return;
        if (!drag.moved && Math.abs(ev.clientX - drag.sx) > 5) {
            drag.moved = true;
            stage.classList.add('is-drag');
            try { stage.setPointerCapture(ev.pointerId); } catch (e) { }
        }
        if (drag.moved) {
            panPx(ev.clientX - drag.lx);
            drag.lx = ev.clientX;
            var now = performance.now();
            drag.s.push([now, ev.clientX]);
            while (drag.s.length > 2 && now - drag.s[0][0] > 120) drag.s.shift();
        }
    });
    function endPtr(ev) {
        if (!ptrs[ev.pointerId]) return;
        delete ptrs[ev.pointerId];
        if (pinch) { if (nPtrs() < 2) { pinch = null; setTimeout(function () { suppress = false; }, 60); } return; }
        stage.classList.remove('is-drag');
        if (drag && drag.moved) {
            suppress = true;
            setTimeout(function () { suppress = false; }, 0);
            var s = drag.s, v = 0;
            if (s.length > 1) { var dt = s[s.length - 1][0] - s[0][0]; v = dt > 0 ? (s[s.length - 1][1] - s[0][1]) / dt : 0; }
            if (!REDUCE && Math.abs(v) > 0.05) inertia(v);
        }
        drag = null;
    }
    stage.addEventListener('pointerup', endPtr);
    stage.addEventListener('pointercancel', endPtr);

    function inertia(v) {
        var last = performance.now();
        (function f(now) {
            var dt = Math.min(40, now - last);
            last = now;
            panPx(v * dt);
            v *= Math.pow(0.0035, dt / 1000);
            var atEdge = S.t0 <= FULL0 + 1 || S.t1 >= FULL1 - 1;
            inId = (Math.abs(v) > 0.02 && !atEdge) ? requestAnimationFrame(f) : 0;
        })(last);
    }

    stage.addEventListener('wheel', function (ev) {
        ev.preventDefault();
        cancelMotion();
        if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) { panPx(-ev.deltaX); return; }
        var r = stage.getBoundingClientRect(), k = stage.clientWidth / (S.t1 - S.t0);
        var dy = ev.deltaMode === 1 ? ev.deltaY * 16 : ev.deltaY;
        zoomAround((S.t1 - S.t0) * Math.exp(dy * 0.0014), S.t0 + (ev.clientX - r.left) / k);
    }, { passive: false });

    stage.addEventListener('keydown', function (ev) {
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
        var k = ev.key;
        if (k === 'ArrowRight') { ev.preventDefault(); step(1); }
        else if (k === 'ArrowLeft') { ev.preventDefault(); step(-1); }
        else if (k === '+' || k === '=') { ev.preventDefault(); zoomBy(0.6, true); }
        else if (k === '-' || k === '_') { ev.preventDefault(); zoomBy(1 / 0.6, true); }
        else if (k === 'Home') { ev.preventDefault(); var l = filtered(); if (l.length) select(l[0].id, { reveal: true }); }
        else if (k === 'End') { ev.preventDefault(); var l2 = filtered(); if (l2.length) select(l2[l2.length - 1].id, { reveal: true }); }
        else if (k === 'Escape' && S.sel) { closePanel(); }
    });

    /* ---------- Minimapa: arrastrar el rectángulo ---------- */
    var mdrag = null;
    function mT(x) { var r = mini.getBoundingClientRect(); return FULL0 + (x - r.left) / r.width * FULLSPAN; }
    mini.addEventListener('pointerdown', function (ev) {
        cancelMotion();
        var t = mT(ev.clientX), span = S.t1 - S.t0;
        if (t < S.t0 || t > S.t1) setView(t - span / 2, t + span / 2);
        mdrag = { off: t - S.t0 };
        try { mini.setPointerCapture(ev.pointerId); } catch (e) { }
        render();
    });
    mini.addEventListener('pointermove', function (ev) {
        if (!mdrag) return;
        var span = S.t1 - S.t0, a = mT(ev.clientX) - mdrag.off;
        var c = clampView(a, a + span);
        S.t0 = c[0]; S.t1 = c[1];
        schedule();
    });
    function mEnd() { mdrag = null; }
    mini.addEventListener('pointerup', mEnd);
    mini.addEventListener('pointercancel', mEnd);

    /* ---------- Arranque ---------- */
    syncChips();
    render();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { layoutKey = ''; miniSig = ''; render(); }, 120); });
    var onMq = function () { layoutKey = ''; miniSig = ''; render(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { render(); });
})();
