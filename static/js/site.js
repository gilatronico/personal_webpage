/* ============================================
   alexgilabert.xyz · Comportamiento común del header (home, /web3, artículos)
   Tema claro/oscuro, menú móvil y preferencia de idioma.
   ============================================ */
(function () {
    'use strict';

    var root = document.documentElement;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var store = {
        get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
        set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
    };
    var lang = root.lang === 'en' ? 'en' : 'es';
    var T = {
        es: { toDark: 'Cambiar a modo oscuro', toLight: 'Cambiar a modo claro', open: 'Abrir menú', close: 'Cerrar menú' },
        en: { toDark: 'Switch to dark mode', toLight: 'Switch to light mode', open: 'Open menu', close: 'Close menu' }
    }[lang];

    // El idioma lo marca la URL (/ o /en/); se recuerda para los módulos que traducen en cliente
    store.set('preferredLanguage', lang);
    $$('.seg-ctl a').forEach(function (a) {
        a.addEventListener('click', function () { store.set('preferredLanguage', a.getAttribute('data-lang')); });
    });

    /* ---------- Tema ---------- */
    var themeBtn = $('#themeToggle');
    function syncThemeLabel() {
        if (!themeBtn) return;
        var dark = root.getAttribute('data-theme') === 'dark';
        themeBtn.setAttribute('aria-label', dark ? T.toLight : T.toDark);
        themeBtn.title = themeBtn.getAttribute('aria-label');
    }
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            store.set('theme', next);
            syncThemeLabel();
        });
    }
    syncThemeLabel();

    /* ---------- Menú móvil ---------- */
    var burger = $('#burger'), menu = $('#mobileMenu');
    if (!burger || !menu) return;
    function setMenu(open) {
        menu.hidden = !open;
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? T.close : T.open);
    }
    burger.addEventListener('click', function () { setMenu(menu.hidden); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
    });
    window.matchMedia('(min-width: 1061px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
})();
