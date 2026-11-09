/* ============================================
   alexgilabert.xyz · Bloque Web3 Lab de la home
   Retícula de puntos en canvas:
   · con ratón, los puntos cercanos al cursor (radio ~120 px) se iluminan en el color de
     acento y el cursor deja una estela fina que se desvanece en ~600 ms;
   · sin ratón (móvil), una onda suave recorre la retícula cada pocos segundos.
   Solo anima mientras el bloque es visible; con prefers-reduced-motion queda estática.
   ============================================ */
(function () {
    'use strict';

    var section = document.getElementById('lab'), canvas = document.getElementById('labCanvas');
    if (!section || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');

    var GAP = 22, RADIUS = 120, TRAIL_MS = 600, WAVE_EVERY = 4600, WAVE_MS = 2600;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    var W = 0, H = 0, dpr = 1, dots = [], accent = [154, 165, 255];
    var mouse = null, lastMove = 0, trail = [], wave = null, nextWave = 0;
    var running = false, visible = false, raf = 0;

    function readAccent() {
        var v = getComputedStyle(section).getPropertyValue('--lilac').trim();
        var m = /^#([0-9a-f]{6})$/i.exec(v);
        if (m) accent = [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
    }

    function resize() {
        var r = section.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dots = [];
        for (var y = GAP / 2; y < H; y += GAP) for (var x = GAP / 2; x < W; x += GAP) dots.push(x, y);
        draw(performance.now());
    }

    // Cuánto "brilla" cada punto: cursor (cercanía) y onda (distancia al frente)
    function draw(now) {
        ctx.clearRect(0, 0, W, H);
        var a = accent, base = 'rgba(154,165,255,.15)', i, x, y, glow, d, dx, dy;
        var useMouse = mouse && !reduce && now - lastMove < 4000;

        // Fondo: puntos en reposo con un desvanecimiento hacia la izquierda, como en el resto del sitio
        for (i = 0; i < dots.length; i += 2) {
            x = dots[i]; y = dots[i + 1];
            glow = 0;
            if (useMouse) {
                dx = x - mouse.x; dy = y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
                if (d < RADIUS) { var k = 1 - d / RADIUS; glow = k * k * (3 - 2 * k); }
            }
            if (wave) {
                var t = (now - wave.t0) / WAVE_MS;
                if (t >= 0 && t <= 1) {
                    dx = x - wave.x; dy = y - wave.y; d = Math.sqrt(dx * dx + dy * dy);
                    var front = t * Math.max(W, H) * 1.05, band = 90, e = Math.abs(d - front);
                    if (e < band) { var kk = 1 - e / band, wv = kk * kk * (3 - 2 * kk) * (1 - t) * 0.85; if (wv > glow) glow = wv; }
                }
            }
            if (glow > 0.01) {
                ctx.fillStyle = 'rgba(' + a[0] + ',' + a[1] + ',' + a[2] + ',' + (0.15 + glow * 0.8).toFixed(3) + ')';
                ctx.beginPath(); ctx.arc(x, y, 1 + glow * 1.4, 0, 6.2832); ctx.fill();
            } else {
                ctx.fillStyle = base;
                ctx.fillRect(x - 0.5, y - 0.5, 1.1, 1.1);
            }
        }

        // Estela fina del cursor
        if (!reduce && trail.length > 1) {
            ctx.lineCap = 'round';
            for (i = 1; i < trail.length; i++) {
                var p0 = trail[i - 1], p1 = trail[i], age = (now - p1.t) / TRAIL_MS;
                if (age >= 1) continue;
                ctx.strokeStyle = 'rgba(' + a[0] + ',' + a[1] + ',' + a[2] + ',' + ((1 - age) * 0.55).toFixed(3) + ')';
                ctx.lineWidth = 1.5 * (1 - age * 0.6);
                ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
            }
        }
    }

    function frame(now) {
        raf = 0;
        if (!running) return;
        while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
        if (wave && now - wave.t0 > WAVE_MS) wave = null;
        var idleMouse = !mouse || now - lastMove > 4000;
        if (!wave && idleMouse && now >= nextWave) {
            wave = { t0: now, x: W * (0.15 + Math.random() * 0.7), y: H * (0.2 + Math.random() * 0.6) };
            nextWave = now + WAVE_EVERY;
        }
        draw(now);
        raf = requestAnimationFrame(frame);
    }

    function sync() {
        var should = visible && !document.hidden && !reduce;
        if (should && !running) { running = true; nextWave = performance.now() + 900; raf = requestAnimationFrame(frame); }
        else if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    }

    readAccent();
    resize();
    if (reduce) return; // retícula estática

    // El cursor se sigue sobre toda la sección (el canvas queda detrás del texto)
    section.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = section.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
        mouse = { x: x, y: y }; lastMove = now; wave = null;
        trail.push({ x: x, y: y, t: now });
        if (trail.length > 60) trail.shift();
    }, { passive: true });
    section.addEventListener('pointerleave', function () { mouse = null; });

    if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); }).observe(section);
    else window.addEventListener('resize', resize);

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries.some(function (en) { return en.isIntersecting; });
            sync();
        }, { threshold: 0.05 }).observe(section);
    } else { visible = true; sync(); }
    document.addEventListener('visibilitychange', sync);
    // Con ratón fino la onda solo aparece si el cursor lleva un rato quieto
    if (!finePointer) lastMove = 0;
})();
