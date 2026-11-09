# Changelog de alexgilabert.xyz

Registro de todos los cambios de la web, del más reciente al más antiguo.
Antes de tocar nada, lee el **Último punto** y los **Pendientes abiertos**.
Al terminar cualquier cambio, añade una entrada arriba y actualiza esas dos secciones.
Las reglas completas están en `CLAUDE.md`.

---

## Último punto

- **Fecha:** 2026-11-09
- **Estado:** cambios en local, **sin commit y sin desplegar** (entradas 2026-11-09 #2 y #3).
- **Producción (alexgilabert.xyz):** commit `1ce9ba4`. Ojo: en producción sigue el KPI "Activos reales tokenizados" con ~3,6 mil millones $ (dato engañoso); se retira en la entrada #3, que aún no está desplegada.
- **Siguiente paso:** mirar en el navegador la portada del Web3 Lab de la home (`/` y `/en/`), que solo se ha probado a nivel de backend y plantillas; si todo va bien, commit (incluyendo `CHANGELOG.md`, `CLAUDE.md` y `AGENTS.md`, que aún no están en git) y deploy.

## Pendientes abiertos

- [x] ~~**KPI "Activos reales tokenizados" del Web3 Lab engañoso.**~~ Cerrado 2026-11-09: se quita (entrada #3). La API de RWA.xyz exige clave y DefiLlama no cubre los grandes emisores (BlackRock BUIDL, Ondo, Circle USYC, Spiko, WisdomTree…). Si se quiere volver a mostrar, hace falta una fuente con clave (RWA.xyz daba ~39 mil millones $ de valor distribuido a 1-nov-2026, sin stablecoins).
- [ ] **Versionar `CHANGELOG.md`, `CLAUDE.md` y `AGENTS.md`**: están sin seguimiento en git. (detectado 2026-11-09)
- [ ] Limpieza de archivos muertos: `index_professional.html`, `static/css/main.css`, `styles_2026*.css`, `static/js/main.js`, `main_2026.js`, `views_*_alternative.py`, `refactor_html.py`, carpeta `staticfiles/`.
- [ ] Mensajes del formulario de contacto: en Vercel se guardan en SQLite dentro de `/tmp` y se pierden; solo queda el email.
- [x] ~~Commits con mensajes descriptivos~~ Cerrado 2026-11-09: los últimos commits ya los llevan (el historial antiguo tipo "kkk", "mm" no se reescribe).

---

## Historial

### 2026-11-09 #3 · Web3 Lab: se quita el KPI "Activos reales tokenizados"
- **Estado:** en local, sin commit.
- **Qué:**
  - La cabecera del Web3 Lab pasa de 4 a 3 cifras: stablecoins en circulación, bancos con depósitos tokenizados y cuota del euro. El KPI retirado mostraba ~3,6 mil millones $ (TVL de la categoría RWA de DefiLlama), muy por debajo de lo real (~39 mil millones $ según RWA.xyz a 1-nov-2026).
  - Se comprobó si se podía cambiar de fuente: la API de RWA.xyz devuelve 401 sin clave y rascar su web (6 MB) sería frágil, así que se retira en vez de sustituir.
  - Rejilla de la cabecera: 3 columnas en escritorio y tableta (verificado a 1440 y 768 px), 1 columna por debajo de 760 px (verificado a 375 px). Sin desbordes ni errores de consola, en ES y EN.
  - Se elimina el endpoint `/api/lab/rwa/` (ahora devuelve 404).
- **Archivos:** `landing/views.py` (fuera `_build_lab_rwa` y `lab_rwa`), `landing_project/urls.py`, `landing/templates/landing/web3.html` (`web3.css` v19, `web3-lab.js` v7), `static/js/web3-lab.js` (fuera `initRwa`), `static/css/web3.css`, `data/lab-curated.json` (fuera `hk.rwa` y `hk.rwaSub`).
- **Pendiente de esta entrada:** commit y deploy; hasta entonces el KPI sigue en producción.

### 2026-11-09 #2 · Web3 Lab: el menú lleva a la página y la home enseña una portada con datos en vivo
- **Estado:** en local, sin commit.
- **Qué:**
  - El enlace "Web3 Lab" del header lleva siempre a `/web3` (o `/en/web3`), también desde la home. Antes, en la home, bajaba al bloque `#lab`. Lleva un punto verde animado.
  - El bloque `#lab` de la home pasa de solo texto a portada del lab: tarjeta "Ahora mismo" con stablecoins en circulación (cifra animada, variación a 30 días, minigráfica de 12 meses), cuota del euro y bancos con depósitos tokenizados; y cuatro accesos a los módulos (Stablecoins, Comparador, Cronología, Custodia) con enlace a su sección en `/web3`.
  - El botón "Abrir el Web3 Lab" respeta el idioma (antes iba siempre a `/web3`).
  - Nuevo endpoint `/api/lab/snapshot/`: resume `stablecoins.llama.fi/stablecoincharts/all` en el servidor (caché 10 min). Cifras verificadas contra el lab: 294,8 mil millones $, −4,2 % a 30 días, euro 0,29 %.
- **Archivos:** `landing/views.py` (`_nav_ctx`, `_build_lab_snapshot`, `lab_snapshot`, `LAB_TEASER_UI`, `_lab_teaser`), `landing_project/urls.py`, `landing/i18n.py`, `landing/templates/landing/home.html`, `landing/templates/landing/partials/nav.html`, `static/css/home.css` (v32), `static/js/home.js` (v14), `static/js/lab-teaser.js` (nuevo), `web3.html` y `article.html` (solo versión del CSS).
- **Pendiente de esta entrada:** probar en local con Django (no se pudo ejecutar en la sesión) y desplegar.

### 2026-11-09 #1 · `1ce9ba4`
- **Estado:** desplegado (commit `1ce9ba4`).
- **Qué:**
  - **Home, career.ledger:** el registro (izquierda) y el panel de detalle (derecha) miden siempre lo mismo y esa altura no cambia al pasar de un bloque a otro (688 px en escritorio). El panel tiene cabecera fija ("Bloque #000X" y flechas) y el contenido se desplaza dentro, con barra fina y un degradado inferior de 32 px que desaparece al llegar al final. Al cambiar de bloque el scroll vuelve arriba; los tags quedan anclados abajo. Espaciados más compactos: solo "Head of Product" necesita scroll interno apreciable (~120-130 px).
  - **Home, fila de empresa del panel:** logo y nombre en una sola fila con separador fino. Bitpanda usa su logo (`bitpanda.png`) y dice "Bitpanda Enterprise". Si el panel es estrecho (container query), los logos anchos (Sopra Steria, Onyze) van encima del nombre; por debajo de ~360 px útiles desaparece el separador.
  - **Home, responsive:** las dos columnas pasan a apilarse por debajo de 1100 px (antes 900) para que el panel no quede estrecho; el ledger baja de 540 a 480 px de ancho máximo. Apilado, el panel crece con transición suave de altura.
  - **Web3 Lab:** cabecera con 4 cifras (stablecoins, activos reales, bancos con depósitos tokenizados, cuota del euro), crédito de precios (CoinGecko), barra fina con accesos y "Modelo de custodia →", comparador de stablecoin / fondo tokenizado / depósito tokenizado rehecho, cuestionario de custodia rehecho; fuera las secciones de fondos y tesorería. Imágenes OG regeneradas ("58 hitos…", "3 bancos…"). Nuevo bloque de la home con retícula de puntos animada (`lab-canvas.js`).
  - **Limpieza:** eliminados `partials/chains_sprite.html` y los PNG `static/images/lab/{blackrock,fidelity,spiko,wisdomtree}.png`.
  - **Bug de caché corregido:** `home.css` no subía de versión en `home.html` (la etiqueta lleva `{% static %}`); ahora va con `?v=` actualizado.
- **Archivos:** `landing/templates/landing/home.html` (`home.css` v31, `home.js` v13), `landing/templates/landing/web3.html`, `landing/views.py`, `landing/content.py`, `landing/i18n.py`, `static/css/home.css`, `static/css/web3.css`, `static/js/home.js`, `static/js/web3-lab.js` (v6), `static/js/lab-canvas.js` (nuevo), `data/custody-quiz.json`, `data/lab-curated.json`, `landing_project/urls.py`, `static/images/og-web3-{es,en}.png`.
- **Pendiente de esta entrada:** el KPI "Activos reales tokenizados" que se incluyó aquí es engañoso (se retira en la entrada #3). No se revisaron a fondo el tema claro ni EN en la última pasada del panel.

### 2026-10-31 · `9e9e4ba`
- Web3 Lab: dinero institucional onchain, cronología de la tokenización, cuestionario de custodia y Bitpanda Enterprise.

### 2026-10-31 · `9ab7bb1`
- Nueva home (rediseño completo): hero con foto, career.ledger con eventos, cómo trabajo, docencia con enlaces, Web3 Lab (DeFi y staking), modo oscuro, versión EN en `/en/`, logos Aticco, Block Invest, USDT, USDC y LINK.

### 2026-10-13 · Revisión y diseño (sin código)
- Auditoría de la web (nota 58/100) y diseño de la nueva home en un lienzo de Claude: tipografía, career.ledger, diagrama de negocio, tecnología y regulación, docencia, contacto, claro y oscuro, móvil.

### 2026-08-18 · `917d317`
- Precios reales de acciones cripto vía Yahoo Finance (proxy Django).

### 2026-08-15 y 2026-08-16 · `5108880`, `fc3c29b`, `490b645`
- Web3: Acciones Cripto y Strategy Instrument Explorer; simulador v2 (i18n EN, gauge de mNAV, categorías, contexto Strategy).
- Ticker: Hyperliquid, logo real de Avalanche, arreglo del bucle e id de CoinGecko; errores del formulario en el idioma correcto.

### 2026-08-02 · `ae0a8fe`, `7136988`
- Mejoras de formato y textos; deuda técnica.

### 2025-12-20 a 2026-06-18
- Primera versión en Django desplegada en Vercel (`api/index.py` como entrada WSGI), favicon, cambios estructurales y actualización a Bitpanda.
