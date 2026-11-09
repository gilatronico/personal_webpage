/* ============================================
   alexgilabert.xyz · Home v2
   Todo el contenido está en el HTML (SEO / sin JS). Este script solo añade:
   registro de trayectoria, criterios (diagrama y pestañas enlazados), scroll-spy
   y animaciones de entrada.
   Comparte claves de localStorage con /web3 ('theme', 'preferredLanguage').
   ============================================ */
(function () {
    'use strict';

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var store = {
        get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
    };
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var root = document.documentElement;

    /* ---------- Idioma ---------- */
    // El servidor entrega la página ya traducida (/ en español, /en/ en inglés).
    // Aquí solo quedan los textos que genera el propio JS.
    var lang = root.lang === 'en' ? 'en' : 'es';
    var DYN = {
        es: {
            statuses: { run: 'confirmando', sel: 'seleccionado', done: 'confirmado', wait: 'pendiente' },
            syncing: 'sincronizando', pick: 'pulsa un bloque',
            calTitle: 'Consulta con Alex Gilabert', calDetails: 'Consulta desde alexgilabert.xyz'
        },
        en: {
            statuses: { run: 'confirming', sel: 'selected', done: 'confirmed', wait: 'pending' },
            syncing: 'syncing', pick: 'tap a block',
            calTitle: 'Call with Alex Gilabert', calDetails: 'Request from alexgilabert.xyz'
        }
    };
    var L = function () { return DYN[lang]; };
    // Tema, menú móvil y preferencia de idioma: static/js/site.js (compartido con /web3)

    /* ---------- Nav activa según scroll ---------- */
    // La sección activa es la última cuyo borde superior ha cruzado una línea al 35 %
    // del viewport. Los IntersectionObserver solo avisan de cuándo recalcular; así no
    // depende de que una sección corta llegue a "tocar" una franja concreta.
    (function () {
        var links = $$('.navlinks a, .mobile-menu a:not(.btn)');
        var sections = $$('main > section[id]');
        if (!sections.length) return;
        var navH = function () { return ($('#nav') || {}).offsetHeight || 0; };
        var queued = false;
        function compute() {
            queued = false;
            var line = navH() + (window.innerHeight - navH()) * 0.35, current = null;
            var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
            sections.forEach(function (sec) {
                var r = sec.getBoundingClientRect();
                if (r.top <= line && r.bottom > navH()) current = sec.id;
                // Al final de la página gana la última sección visible (p. ej. Artículos/Contacto)
                if (atBottom && r.top < window.innerHeight && r.bottom > navH()) current = sec.id;
            });
            links.forEach(function (a) {
                var on = a.getAttribute('href') === '#' + current;
                if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
            });
        }
        function queue() {
            if (queued) return;
            queued = true;
            // En pestañas en segundo plano rAF no corre: el temporizador hace de respaldo
            if (document.hidden) { compute(); return; }
            requestAnimationFrame(compute);
            setTimeout(function () { if (queued) compute(); }, 120);
        }
        if ('IntersectionObserver' in window) {
            var steps = []; for (var i = 0; i <= 20; i++) steps.push(i / 20);
            var io = new IntersectionObserver(queue, { threshold: steps });
            sections.forEach(function (sec) { io.observe(sec); });
            var foot = $('.foot'); if (foot) io.observe(foot);
        }
        // Respaldo por si el observer llega tarde (saltos largos, pestañas en segundo plano)
        window.addEventListener('scrollend', queue);
        window.addEventListener('hashchange', queue);
        window.addEventListener('resize', queue);
        compute();
    })();

    // Ejecuta fn(visible) cuando el elemento entra/sale de pantalla
    function whenVisible(el, fn, threshold) {
        if (!('IntersectionObserver' in window)) { fn(true); return; }
        new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { fn(en.isIntersecting); });
        }, { threshold: threshold || 0.25 }).observe(el);
    }

    /* ---------- Trayectoria: registro tipo blockchain ---------- */
    // Bloques en orden cronológico (cadena principal, sidechain y staking): las flechas
    // y la animación los recorren todos en ese orden. El contenido lo pinta el servidor.
    (function () {
        var career = $('#career');
        if (!career) return;
        var rows = $$('.blk-row', career), stages = $$('.stage', career);
        var hint = $('#ledgerHint'), hashEl = $('#detailHash');
        var N = rows.length, current = +career.getAttribute('data-current') || N - 1;
        // Sin animación: se muestra la etapa actual con todo confirmado
        var st = { sel: current, reached: N - 1, playing: false, started: false };
        var timer = null, animFeed = false;

        var fadeT = null;
        function syncFade() {
            var body = $('#detailBody'), sc = $('#detailScroll');
            body.classList.toggle('no-scroll', sc.scrollHeight <= sc.clientHeight + 1);
            body.classList.toggle('at-end', sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2);
        }
        $('#detailScroll').addEventListener('scroll', syncFade, { passive: true });
        window.addEventListener('resize', syncFade);

        function render() {
            var t = L();
            rows.forEach(function (row, i) {
                var on = i === st.sel, done = i <= st.reached, blk = $('.blk', row);
                var kindLabel = blk.getAttribute('data-kind-label');
                row.classList.toggle('on', on);
                row.classList.toggle('done', done);
                row.classList.toggle('done-line', i < st.reached);
                blk.setAttribute('aria-pressed', String(on));
                // génesis / sidechain / staking sustituyen a "confirmado"
                $('.blk-status', row).textContent = on ? (st.playing ? t.statuses.run : t.statuses.sel)
                    : (done ? (kindLabel || t.statuses.done) : t.statuses.wait);
            });
            // Apilado (<900px) el panel cambia de altura: se anima desde la altura anterior
            var body = $('#detailBody'), scroller = $('#detailScroll'), stacked = window.matchMedia('(max-width: 1099px)').matches;
            var h0 = stacked ? body.offsetHeight : 0, changed = stages.some(function (s, i) { return s.hidden === (i === st.sel); });
            stages.forEach(function (s, i) { s.hidden = i !== st.sel; });
            if (changed) scroller.scrollTop = 0;
            if (stacked && changed && !reduceMotion) {
                body.style.height = h0 + 'px'; void body.offsetHeight;
                body.style.height = scroller.scrollHeight + 'px';
                setTimeout(function () { body.style.height = ''; }, 380);
            }
            syncFade();
            // La entrada del contenido desplaza 10 px: se vuelve a medir cuando termina
            clearTimeout(fadeT); fadeT = setTimeout(syncFade, 520);
            hashEl.textContent = stages[st.sel].getAttribute('data-title');
            hint.textContent = st.playing ? t.syncing : t.pick;

            // Eventos: viven dentro del detalle del bloque (si no tiene hitos, no hay panel).
            // Al cambiar de bloque los hitos se confirman en orden (el más antiguo, abajo, primero)
            var feed = $('.feed-body', stages[st.sel]);
            if (feed) {
                var feedRows = $$('.feed-row', feed), n = feedRows.length;
                feedRows.forEach(function (row, k) {
                    var delay = animFeed ? (n - 1 - k) * 0.35 : 0;
                    row.style.animation = 'none'; void row.offsetWidth; row.style.animation = '';
                    row.style.animationDelay = delay.toFixed(2) + 's';
                    var segs = $('.segs', row);
                    segs.classList.toggle('anim', animFeed);
                    $$('i', segs).forEach(function (seg, j) {
                        seg.style.animationDelay = animFeed ? (delay + 0.1 + j * 0.08).toFixed(2) + 's' : '';
                    });
                });
            }
            animFeed = false;
        }
        function stop() { clearInterval(timer); st.playing = false; }
        function select(i) { stop(); st.sel = (i + N) % N; st.reached = N - 1; animFeed = !reduceMotion; render(); }

        rows.forEach(function (row, i) { $('.blk', row).addEventListener('click', function () { select(i); }); });
        $('#prevStage').addEventListener('click', function () { select(st.sel - 1); });
        $('#nextStage').addEventListener('click', function () { select(st.sel + 1); });

        // La animación de "sincronización" arranca la primera vez que el registro se ve
        // y termina en el bloque actual (los posteriores, como el staking, quedan confirmados)
        if (!reduceMotion) {
            whenVisible(career, function (visible) {
                if (!visible || st.started) return;
                st = { sel: 0, reached: 0, playing: true, started: true };
                animFeed = true; render();
                timer = setInterval(function () {
                    if (st.sel >= N - 1) { stop(); st.sel = current; render(); return; }
                    st.sel++; st.reached = st.sel; animFeed = true; render();
                }, 2000);
            }, 0.35);
        }
        render();
    })();

    /* ---------- Rotador (criterios) ---------- */
    // Avanza solo mientras está en pantalla y hasta que el usuario interactúa (criterios).
    function rotator(opts) {
        var cur = 0, auto = !reduceMotion, visible = false, t = null;
        function arm() {
            clearTimeout(t);
            var run = auto && visible && !document.hidden;
            opts.host.classList.toggle('playing', run);
            if (run) t = setTimeout(function () { show((cur + 1) % opts.count, false); }, opts.ms);
        }
        function show(i, user) {
            if (user) auto = false;
            cur = i;
            opts.render(i);
            // Reinicia la barra de progreso
            opts.host.classList.remove('playing'); void opts.host.offsetWidth;
            arm();
        }
        whenVisible(opts.host, function (v) { visible = v; arm(); });
        document.addEventListener('visibilitychange', arm);
        opts.render(0);
        return { show: show, current: function () { return cur; } };
    }

    /* ---------- Cómo trabajo ---------- */
    (function () {
        var host = $('#how'), tabs = $$('.tab', host), panels = $$('.lens-panel', host), rings = $$('.ring-g', host), arcs = $$('.arc', host);
        var flow = $('#flowLine'), dot = $('#flowDot'), sub = $('#coreSub');
        var CX = 260, CY = 210;
        var LENS = [{ cx: 260, cy: 290, ang: 90, c: '#2FB37A' }, { cx: 335, cy: 170, ang: -28, c: '#5A66E0' }, { cx: 185, cy: 170, ang: 208, c: '#E3A23B' }];
        function arcPath(a0, a1, r) {
            var p = function (a) { var t = a * Math.PI / 180; return (CX + r * Math.cos(t)).toFixed(1) + ' ' + (CY + r * Math.sin(t)).toFixed(1); };
            return 'M' + p(a0) + ' A' + r + ' ' + r + ' 0 0 1 ' + p(a1);
        }
        arcs.forEach(function (a, i) { a.setAttribute('d', arcPath(LENS[i].ang - 52, LENS[i].ang + 52, 48)); });

        function render(i) {
            tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
            panels.forEach(function (p, j) { p.hidden = i !== j; });
            rings.forEach(function (r, j) { r.classList.toggle('on', i === j); });
            arcs.forEach(function (a, j) { a.classList.toggle('on', i === j); });
            flow.setAttribute('x2', LENS[i].cx); flow.setAttribute('y2', LENS[i].cy);
            dot.setAttribute('cx', LENS[i].cx); dot.setAttribute('cy', LENS[i].cy);
            host.style.setProperty('--lc', LENS[i].c);
            sub.textContent = $('[data-i18n="lens' + i + '"]', tabs[i]).textContent.toLowerCase();
        }
        var rot = rotator({ host: host, count: 3, ms: 4200, render: render });
        tabs.forEach(function (t, i) {
            t.addEventListener('click', function () { rot.show(i, true); });
            t.addEventListener('keydown', function (e) {
                var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (!d) return;
                e.preventDefault();
                var n = (i + d + 3) % 3; rot.show(n, true); tabs[n].focus();
            });
        });
        // Diagrama y pestañas van enlazados: pulsar o pasar el ratón por uno activa el otro
        rings.forEach(function (r, i) {
            r.addEventListener('click', function () { rot.show(i, true); });
            r.addEventListener('mouseenter', function () { if (rot.current() !== i) rot.show(i, true); });
        });
        tabs.forEach(function (t, i) {
            t.addEventListener('mouseenter', function () { if (rot.current() !== i) rot.show(i, true); });
        });
    })();

    /* ---------- Agendar llamada (Google Calendar, como en la versión anterior) ---------- */
    $$('.js-calendar').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            var email = ($('#homeJs') || {}).dataset ? $('#homeJs').dataset.email : '';
            var start = new Date(); start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0);
            var end = new Date(start); end.setMinutes(30);
            var f = function (d) { return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; };
            var url = 'https://calendar.google.com/calendar/r/eventedit?text=' + encodeURIComponent(L().calTitle) +
                '&dates=' + f(start) + '/' + f(end) +
                '&details=' + encodeURIComponent(L().calDetails) +
                '&location=Online&add=' + encodeURIComponent(email);
            window.open(url, '_blank', 'noopener,noreferrer');
        });
    });

    /* ---------- Entrada suave de secciones ---------- */
    if (!reduceMotion && 'IntersectionObserver' in window) {
        var revealIO = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        $$('.sec-head, .career, .cases, .how, .lab-grid, .lab-mods, .schools-grid, .art-grid, .contact').forEach(function (el) {
            el.classList.add('reveal'); revealIO.observe(el);
        });
    }

})();
