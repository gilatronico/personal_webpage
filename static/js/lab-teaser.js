/* ============================================
   alexgilabert.xyz · Bloque Web3 Lab de la home
   Pinta la foto del mercado (oferta de stablecoins, variación a 30 días, minigráfica de
   12 meses y cuota del euro) desde /api/lab/snapshot/, que resume DefiLlama en el servidor.
   Solo pide datos cuando el bloque está a punto de verse. Caché de 10 min en localStorage.
   ============================================ */
(function () {
    'use strict';

    var box = document.getElementById('labLive');
    if (!box) return;
    var EN = document.documentElement.lang === 'en';
    var LOC = EN ? 'en-US' : 'es-ES';
    var KEY = 'w3lab:snap:v1', TTL = 10 * 60 * 1000, STALE = 6 * 3600 * 1000;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (k) { return box.querySelector('[data-lt="' + k + '"]'); };

    function nf(n, d) {
        return new Intl.NumberFormat(LOC, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
    }
    // "294,8 mil millones $" / "$294.8B"
    function supplyHTML(v) {
        return EN ? '$' + nf(v / 1e9, 1) + '<small>B</small>'
            : nf(v / 1e9, 1) + ' <small>mil millones $</small>';
    }
    function pct(v, d) {
        var sign = v > 0 ? '+' : (v < 0 ? '−' : '');
        return sign + nf(Math.abs(v), d == null ? 1 : d) + (EN ? '%' : ' %');
    }

    function cget() {
        try { var r = JSON.parse(localStorage.getItem(KEY)); return r && r.t ? r : null; } catch (e) { return null; }
    }
    function cset(v) {
        try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v: v })); } catch (e) { }
    }
    function fetchSnap() {
        var c = cget();
        if (c && Date.now() - c.t < TTL) return Promise.resolve(c);
        return fetch('/api/lab/snapshot/').then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function (v) { cset(v); return { t: Date.now(), v: v }; }).catch(function (e) {
            if (c && Date.now() - c.t < STALE) return c;
            throw e;
        });
    }

    function spark(svg, pts) {
        if (!svg || !pts || pts.length < 2) return;
        var W = 300, H = 64, lo = Math.min.apply(null, pts), hi = Math.max.apply(null, pts);
        if (hi === lo) hi = lo + 1;
        var X = function (i) { return (i / (pts.length - 1)) * W; };
        var Y = function (v) { return 6 + (H - 12) * (1 - (v - lo) / (hi - lo)); };
        var d = pts.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
        var last = pts.length - 1;
        svg.innerHTML =
            '<defs><linearGradient id="labSparkFill" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="currentColor" stop-opacity=".28"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/>' +
            '</linearGradient></defs>' +
            '<path class="lab-spark-area" d="' + d + 'L' + W + ' ' + H + 'L0 ' + H + 'Z" fill="url(#labSparkFill)"/>' +
            '<path class="lab-spark-line" d="' + d + '" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" pathLength="1"/>' +
            '<circle class="lab-spark-dot" cx="' + X(last).toFixed(1) + '" cy="' + Y(pts[last]).toFixed(1) + '" r="3.5" fill="currentColor"/>';
    }

    // La cifra principal sube desde un 92 % del valor hasta el valor real en ~900 ms
    function countUp(el, v) {
        if (reduce || !window.requestAnimationFrame) { el.innerHTML = supplyHTML(v); return; }
        var t0 = null, from = v * 0.92;
        function step(ts) {
            if (t0 == null) t0 = ts;
            var k = Math.min((ts - t0) / 900, 1), e = 1 - Math.pow(1 - k, 3);
            el.innerHTML = supplyHTML(from + (v - from) * e);
            if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function paint(r) {
        var s = r.v;
        countUp($('supply'), s.supply);
        var ch = $('change');
        if (s.change30 != null) {
            ch.innerHTML = (EN ? '30d ' : '30 d ') + '<b class="' + (s.change30 > 0 ? 'up' : s.change30 < 0 ? 'down' : '') + '">' +
                pct(s.change30) + '</b>' + (EN ? ' · 12-month trend' : ' · tendencia a 12 meses');
        }
        $('eur').textContent = nf(s.eurPct, 2) + (EN ? '%' : ' %');
        $('eurbar').style.width = Math.max(s.eurPct, 1.2) + '%';
        spark($('spark'), s.spark);
        var h = new Date(r.t).toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' });
        $('time').textContent = (EN ? 'Updated ' : 'Actualizado ') + h + ' · DefiLlama';
        box.classList.add('is-ready');
    }

    function fail() {
        $('supply').textContent = '—';
        $('eur').textContent = '—';
        $('time').textContent = EN ? 'Data unavailable' : 'Datos no disponibles';
        box.classList.add('is-error');
    }

    function run() { fetchSnap().then(paint).catch(fail); }

    if (!('IntersectionObserver' in window)) { run(); return; }
    var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); run(); }
    }, { rootMargin: '400px 0px' });
    io.observe(box);
})();
