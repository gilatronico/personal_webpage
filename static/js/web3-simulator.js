/* ============================================
   WEB3 SIMULATOR — vanilla JS, no framework.
   static/js/web3-simulator.js

   i18n: contenido bilingüe propio (ES/EN) enganchado al mismo selector de
   idioma del sitio (.lang-btn). Los textos estáticos se marcan en el template
   con data-w3i="clave"; el contenido dinámico (tarjetas, instrumentos, resumen)
   se genera leyendo I18N[lang].
   ============================================ */
(function () {
  const REF_BTC = 118000;
  const MSTR_REF_PRICE = 402;

  // Color por categoría de empresa (tipo de negocio), no aleatorio. Se muestra
  // además como etiqueta de texto en la tarjeta para que el color tenga leyenda.
  // Se evitan verde/rojo puros: esos quedan reservados a la señal de variación.
  const CAT_COLORS = {
    treasury: '#3B3FAF', exchange: '#0EA5E9', stablecoin: '#7C83FF',
    tokenization: '#8B5CF6', broker: '#0891B2', mining: '#F59E0B',
  };

  const STOCKS = [
    { ticker: 'MSTR', company: 'Strategy', initials: 'MS', price: 402.15, delta: 3.2, positive: true, cat: 'treasury' },
    { ticker: 'COIN', company: 'Coinbase', initials: 'CB', price: 289.40, delta: -1.1, positive: false, cat: 'exchange' },
    { ticker: 'CRCL', company: 'Circle', initials: 'CR', price: 118.75, delta: 5.4, positive: true, cat: 'stablecoin' },
    { ticker: 'SECZ', company: 'Securitize', initials: 'SC', price: 14.20, delta: 2.8, positive: true, cat: 'tokenization' },
    { ticker: 'HOOD', company: 'Robinhood', initials: 'HD', price: 92.30, delta: 0.6, positive: true, cat: 'broker' },
    { ticker: 'MARA', company: 'Marathon Digital', initials: 'MD', price: 22.85, delta: -2.3, positive: false, cat: 'mining' },
    { ticker: 'MTPLF', company: 'Metaplanet', initials: 'MP', price: 6.45, delta: 8.1, positive: true, cat: 'treasury' },
  ];

  // Solo lo estructural; el texto (name/yield/seniority/desc) vive en I18N.
  const INSTRUMENTS = [
    { ticker: 'MSTR', code: 'CMN', color: 'gray' },
    { ticker: 'STRK', code: 'CNV', color: 'amber' },
    { ticker: 'STRF', code: 'SR1', color: 'green' },
    { ticker: 'STRD', code: 'JR1', color: 'rust' },
    { ticker: 'STRC', code: 'VAR', color: 'blue' },
  ];

  const YIELD_RATES = { MSTR: 0, STRK: 0.08, STRF: 0.10, STRD: 0.10, STRC: 0.115 };

  const I18N = {
    es: {
      mktIntro: 'Sigo de cerca los activos que conectan las finanzas tradicionales con la infraestructura cripto — desde protocolos DeFi hasta las empresas cotizadas y los instrumentos financieros que están llevando Bitcoin a los balances corporativos. Recorres la sección de menor a mayor complejidad: <strong>cripto nativo → acciones cotizadas → simulador de instrumentos Strategy</strong>.',
      stocksTitle: 'Acciones Cripto',
      stocksDesc: 'Empresas cotizadas con exposición directa a activos digitales — mismo formato que los protocolos DeFi de arriba.',
      stocksFooter: 'Precios simulados · actualizado cada pocos segundos',
      simKicker: 'Simulador',
      explorerDesc: 'Simula cómo se comportan los 5 instrumentos que Strategy tiene cotizados (MSTR + 4 preferentes) según el precio de BTC y tu importe de inversión.',
      whyStrategy: 'Strategy es el caso más completo de «puente» entre las finanzas tradicionales y Bitcoin: no solo tiene la acción común (MSTR), sino cuatro instrumentos de renta fija distintos cotizados en Nasdaq. Por eso merece su propio simulador.',
      riskNote: '⚠ Ninguna de las preferentes está colateralizada por el Bitcoin en balance de Strategy — es exposición vía balance corporativo, no un derecho directo sobre BTC.',
      consoleKicker: 'Consola de simulación',
      labelBtc: 'Precio de BTC objetivo',
      labelInvest: 'Importe a invertir',
      labelHorizon: 'Horizonte para alcanzar ese precio',
      mnavKicker: 'mNAV implícito',
      mnavHelp: 'mNAV = capitalización de Strategy ÷ valor de mercado de los BTC en su balance. Por encima de <strong>1.0×</strong>, emitir acciones para comprar más BTC añade BTC por acción (accretive); por debajo, lo diluye.',
      summaryKicker: 'Resumen del escenario',
      disclaimer: 'Simulación educativa con fines ilustrativos. No constituye asesoramiento de inversión. Los cálculos son aproximaciones basadas en fórmulas públicas y no reflejan necesariamente el comportamiento real de mercado.',
      cats: { treasury: 'Tesorería BTC', exchange: 'Exchange', stablecoin: 'Stablecoins', tokenization: 'Tokenización', broker: 'Bróker', mining: 'Minería BTC' },
      notes: {
        MSTR: 'Mayor tenedor corporativo de BTC del mundo (~600k BTC en balance).',
        COIN: 'Mayor exchange cripto cotizado de EE. UU. (Nasdaq desde 2021).',
        CRCL: 'Emisor de USDC, la 2ª stablecoin del mundo · IPO 2025.',
        SECZ: 'Tokenización de activos reales (BlackRock BUIDL, Apollo, KKR) · NYSE desde jul. 2026.',
        HOOD: 'Broker minorista pionero en tokenización de acciones en la UE.',
        MARA: 'Uno de los mayores mineros de BTC cotizados de EE. UU.',
        MTPLF: 'La "MicroStrategy japonesa": treasury company de BTC · ticker OTC.',
      },
      instr: {
        MSTR: { name: 'Común', yield: 'Sin dividendo', seniority: 'La más junior', desc: 'Acción común de Strategy. Mayor exposición direccional a BTC, sin yield. Es la última posición en caso de liquidación.' },
        STRK: { name: 'Strike', yield: '8% cumulativo', seniority: 'Seniority media', desc: 'Preferente convertible a MSTR común en ratio 10:1. Su valor es el máximo entre el valor como preferente con cupón y el valor de conversión.' },
        STRF: { name: 'Strife', yield: '10% cumulativo', seniority: 'La más senior', desc: 'La preferente más senior. Si se impaga, el dividendo compone hasta 18%. Diseñada para ser la más protegida de las cuatro.' },
        STRD: { name: 'Stride', yield: '10% no cumulativo', seniority: 'La más junior de las preferentes', desc: 'Justo por encima de MSTR en seniority. Mismo yield nominal que STRF pero sin cumulación: mayor riesgo si se impaga un pago.' },
        STRC: { name: 'Stretch', yield: '~11-12% variable', seniority: 'Seniority intermedia', desc: 'Cupón variable, se ajusta en incrementos de 0.25% mensual. Diseñada para cotizar estable cerca de $100 par — la más líquida y "bond-like".' },
      },
      live: 'simulando en vivo',
      manual: 'ajuste manual',
      accretive: 'Accretive — emitir acciones suma BTC/acción',
      dilutive: 'Dilutivo — emitir resta BTC/acción',
      principalLabel: 'Valor del principal', principalHint: '(sin cupón)',
      couponLabel: 'Cupón estimado', couponHint: (m) => `(${m}m, aparte)`, couponNone: '— (sin dividendo)',
      totalLabel: 'Valor total estimado', totalHint: '(principal + cupón)', headerTotal: 'valor total est.',
      convertYes: (btc, conv, par) => `Con BTC en ${btc}, el valor de conversión ($${conv}) supera al valor como preferente ($${par}) — convendría convertir a MSTR.`,
      convertNo: (btc, par, conv) => `Con BTC en ${btc}, el valor como preferente ($${par}) supera al de conversión ($${conv}) — mejor mantener STRK.`,
      summary: (btc, mnav, months, invest, best, cons, stress) => `Con BTC en ${btc} (mNAV ${mnav}×) a ${months} meses, la opción con mayor valor total esperado sobre ${invest} invertidos sería ${best}, y la más conservadora sería ${cons}${stress}`,
      stressYes: ' (riesgo de estrés de crédito elevado en este escenario).',
      stressNo: '.',
    },
    en: {
      mktIntro: 'I track the assets bridging traditional finance and crypto infrastructure — from DeFi protocols to the listed companies and financial instruments bringing Bitcoin onto corporate balance sheets. You move through the section from lower to higher complexity: <strong>native crypto → listed stocks → Strategy instrument simulator</strong>.',
      stocksTitle: 'Crypto Stocks',
      stocksDesc: 'Publicly traded companies with direct exposure to digital assets — same format as the DeFi protocols above.',
      stocksFooter: 'Simulated prices · updated every few seconds',
      simKicker: 'Simulator',
      explorerDesc: "Simulate how Strategy's 5 listed instruments (MSTR + 4 preferreds) behave based on the BTC price and your investment amount.",
      whyStrategy: 'Strategy is the most complete "bridge" case between traditional finance and Bitcoin: beyond its common stock (MSTR), it has four distinct fixed-income instruments listed on Nasdaq. That is why it gets its own simulator.',
      riskNote: "⚠ None of the preferreds is collateralized by the Bitcoin on Strategy's balance sheet — it is exposure via the corporate balance sheet, not a direct claim on BTC.",
      consoleKicker: 'Simulation console',
      labelBtc: 'Target BTC price',
      labelInvest: 'Amount to invest',
      labelHorizon: 'Horizon to reach that price',
      mnavKicker: 'Implied mNAV',
      mnavHelp: "mNAV = Strategy's market cap ÷ the market value of the BTC on its balance sheet. Above <strong>1.0×</strong>, issuing shares to buy more BTC adds BTC per share (accretive); below it, it dilutes.",
      summaryKicker: 'Scenario summary',
      disclaimer: 'Educational simulation for illustrative purposes. Not investment advice. Figures are approximations based on public formulas and do not necessarily reflect real market behavior.',
      cats: { treasury: 'BTC treasury', exchange: 'Exchange', stablecoin: 'Stablecoins', tokenization: 'Tokenization', broker: 'Broker', mining: 'BTC mining' },
      notes: {
        MSTR: "World's largest corporate BTC holder (~600k BTC on its balance sheet).",
        COIN: 'Largest US-listed crypto exchange (Nasdaq since 2021).',
        CRCL: "Issuer of USDC, the world's 2nd stablecoin · IPO 2025.",
        SECZ: 'Real-world asset tokenization (BlackRock BUIDL, Apollo, KKR) · NYSE since Jul. 2026.',
        HOOD: 'Retail broker, pioneer of tokenized stocks in the EU.',
        MARA: 'One of the largest US-listed BTC miners.',
        MTPLF: 'The "Japanese MicroStrategy": a BTC treasury company · OTC ticker.',
      },
      instr: {
        MSTR: { name: 'Common', yield: 'No dividend', seniority: 'Most junior', desc: "Strategy's common stock. Highest directional exposure to BTC, no yield. Last in line in a liquidation." },
        STRK: { name: 'Strike', yield: '8% cumulative', seniority: 'Mid seniority', desc: 'Preferred convertible into MSTR common at a 10:1 ratio. Its value is the greater of its value as a coupon-paying preferred and its conversion value.' },
        STRF: { name: 'Strife', yield: '10% cumulative', seniority: 'Most senior', desc: 'The most senior preferred. If unpaid, the dividend compounds up to 18%. Designed to be the most protected of the four.' },
        STRD: { name: 'Stride', yield: '10% non-cumulative', seniority: 'Most junior of the preferreds', desc: 'Just above MSTR in seniority. Same nominal yield as STRF but non-cumulative: higher risk if a payment is missed.' },
        STRC: { name: 'Stretch', yield: '~11-12% variable', seniority: 'Mid seniority', desc: 'Variable coupon, adjusted in 0.25% monthly steps. Designed to trade stable near $100 par — the most liquid and "bond-like".' },
      },
      live: 'simulating live',
      manual: 'manual override',
      accretive: 'Accretive — issuing shares adds BTC/share',
      dilutive: 'Dilutive — issuing shares subtracts BTC/share',
      principalLabel: 'Principal value', principalHint: '(excl. coupon)',
      couponLabel: 'Estimated coupon', couponHint: (m) => `(${m}m, separate)`, couponNone: '— (no dividend)',
      totalLabel: 'Estimated total value', totalHint: '(principal + coupon)', headerTotal: 'est. total value',
      convertYes: (btc, conv, par) => `With BTC at ${btc}, the conversion value ($${conv}) exceeds the value as a preferred ($${par}) — converting to MSTR would make sense.`,
      convertNo: (btc, par, conv) => `With BTC at ${btc}, the value as a preferred ($${par}) exceeds the conversion value ($${conv}) — better to hold STRK.`,
      summary: (btc, mnav, months, invest, best, cons, stress) => `With BTC at ${btc} (mNAV ${mnav}×) over ${months} months, the option with the highest expected total value on ${invest} invested would be ${best}, and the most conservative would be ${cons}${stress}`,
      stressYes: ' (elevated credit-stress risk in this scenario).',
      stressNo: '.',
    },
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmtUSD(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function fmtUSD2(n) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmtThousands(n) { return (n || 0).toLocaleString('en-US'); }
  function computeMNAV(btcPrice) { return clamp(1.7 * Math.pow(btcPrice / REF_BTC, 0.6), 0.4, 3); }

  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  function seniorityColor(key) {
    switch (key) {
      case 'gray': return cssVar('--text-muted');
      case 'amber': return '#F59E0B';
      case 'green': return cssVar('--color-success') || '#00C58E';
      case 'rust': return '#ef4444';
      case 'blue': return cssVar('--color-primary');
      default: return cssVar('--text-main');
    }
  }

  // Sparkline determinista; forma coherente con el signo, color semántico.
  function sparkline(seedKey, positive) {
    const pts = 18, w = 100, h = 30;
    let seed = 0;
    for (let i = 0; i < seedKey.length; i++) seed += seedKey.charCodeAt(i) * (i + 1);
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const vals = [];
    let v = 0.5;
    for (let i = 0; i < pts; i++) {
      v += (rand() - 0.5) * 0.22 + (positive ? 1 : -1) * 0.035;
      v = clamp(v, 0.08, 0.92);
      vals.push(v);
    }
    const pathPts = vals.map((val, i) => `${((i / (pts - 1)) * w).toFixed(1)},${((1 - val) * h).toFixed(1)}`).join(' ');
    return `<svg class="stock-spark ${positive ? 'positive' : 'negative'}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <polygon class="stock-spark-area" points="0,${h} ${pathPts} ${w},${h}"></polygon>
      <polyline points="${pathPts}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"></polyline>
    </svg>`;
  }

  let state = {
    lang: 'es',
    btcPrice: 118000,
    manualOverride: false,
    investAmount: 10000,
    horizonMonths: 12,
    expandedTicker: 'STRK',
  };
  const T = () => I18N[state.lang] || I18N.es;

  function renderStocks() {
    const grid = document.getElementById('cryptoStocksGrid');
    if (!grid) return;
    const t = T();
    grid.innerHTML = STOCKS.map((s) => {
      const color = CAT_COLORS[s.cat];
      const sign = s.positive ? '' : '-';
      return `
        <div class="protocol-card stock-card" style="border-top-color:${color}">
          <div class="stock-card-head">
            <div class="stock-badge" style="background:${color}">${s.initials}</div>
            <div>
              <div class="stock-ticker">${s.ticker}</div>
              <div class="stock-company">${s.company}</div>
            </div>
            <span class="stock-cat" style="color:${color};border-color:${color}">${t.cats[s.cat]}</span>
          </div>
          <div class="stock-price-row">
            <div class="stock-price">$${s.price}</div>
            <div class="stock-change ${s.positive ? 'positive' : 'negative'}">${s.positive ? '▲' : '▼'} ${sign}${Math.abs(s.delta)}%</div>
          </div>
          ${sparkline(s.ticker, s.positive)}
          <div class="stock-note">${t.notes[s.ticker]}</div>
        </div>`;
    }).join('');
  }

  function renderInstruments() {
    const t = T();
    const btcPrice = state.btcPrice;
    const mnav = computeMNAV(btcPrice);
    const mstrPrice = MSTR_REF_PRICE * (btcPrice / REF_BTC) * (mnav / 1.7);

    const strkPar = mnav >= 1 ? 100 : 100 * Math.max(0.6, mnav);
    const strkConv = mstrPrice / 10;
    const shouldConvert = strkConv > strkPar;
    const strkVal = Math.max(strkPar, strkConv);

    const strfVal = mnav >= 0.9 ? 100 * Math.min(1.05, 1 + (mnav - 1) * 0.05) : 100 * Math.max(0.5, mnav + 0.1);
    const strdVal = mnav >= 1 ? 100 * Math.min(1.03, 1 + (mnav - 1) * 0.03) : 100 * Math.max(0.3, mnav - 0.1);
    const strcVal = mnav >= 1 ? 100 : (mnav >= 0.85 ? 100 - (1 - mnav) * 193 : 71 * Math.max(0.7, mnav / 0.85));

    const horizonYears = state.horizonMonths / 12;
    const invest = state.investAmount || 0;

    const principalByTicker = {
      MSTR: invest * (mstrPrice / MSTR_REF_PRICE),
      STRK: invest * (strkVal / 100),
      STRF: invest * (strfVal / 100),
      STRD: invest * (strdVal / 100),
      STRC: invest * (strcVal / 100),
    };
    const couponByTicker = {};
    Object.keys(YIELD_RATES).forEach((k) => { couponByTicker[k] = invest * YIELD_RATES[k] * horizonYears; });
    const totalByTicker = {};
    Object.keys(principalByTicker).forEach((k) => { totalByTicker[k] = principalByTicker[k] + (couponByTicker[k] || 0); });

    // Gauge circular: el fondo muestra el espectro completo rojo→ámbar→verde
    // (definido en CSS); la aguja marca la posición del valor actual.
    const pct = clamp((mnav - 0.4) / (3 - 0.4), 0, 1);
    const needle = document.getElementById('mnavNeedle');
    if (needle) needle.style.setProperty('--mnav-angle', (pct * 360).toFixed(1) + 'deg');
    document.getElementById('mnavValue').textContent = mnav.toFixed(2) + '×';
    document.getElementById('mnavLabel').textContent = mnav >= 1 ? t.accretive : t.dilutive;

    const accordion = document.getElementById('instrumentAccordion');
    accordion.innerHTML = INSTRUMENTS.map((inst) => {
      const accentColor = seniorityColor(inst.color);
      const isExpanded = state.expandedTicker === inst.ticker;
      const info = t.instr[inst.ticker];
      const principal = principalByTicker[inst.ticker];
      const coupon = couponByTicker[inst.ticker];
      const total = totalByTicker[inst.ticker];
      const isMstr = inst.ticker === 'MSTR';
      const couponFmt = isMstr ? t.couponNone : fmtUSD(coupon);
      const convertNote = inst.ticker === 'STRK'
        ? (shouldConvert
            ? t.convertYes(fmtUSD(btcPrice), fmtUSD2(strkConv), fmtUSD2(strkPar))
            : t.convertNo(fmtUSD(btcPrice), fmtUSD2(strkPar), fmtUSD2(strkConv)))
        : '';
      return `
        <div class="protocol-card instrument-row ${isExpanded ? 'expanded' : ''}" style="border-left-color:${accentColor}" data-ticker="${inst.ticker}">
          <div class="instrument-head" role="button" tabindex="0" aria-expanded="${isExpanded}">
            <div style="display:flex;align-items:center;gap:14px">
              <div class="instrument-badge">${inst.code}</div>
              <div>
                <div style="font-weight:700;color:var(--text-main)">${inst.ticker} <span style="font-weight:400;font-size:0.85rem;color:var(--text-muted)">— ${info.name}</span></div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${info.yield} · ${info.seniority}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:16px">
              <div style="text-align:right">
                <div class="instrument-metric-value" style="font-size:1rem">${fmtUSD(total)}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${t.headerTotal}</div>
              </div>
              <div class="instrument-chevron">⌄</div>
            </div>
          </div>
          <div class="instrument-panel">
            <div class="instrument-panel-inner">
              <div style="font-size:0.85rem;color:var(--text-body);line-height:1.6;margin:16px 0">${info.desc}</div>
              <div class="instrument-metrics">
                <div class="instrument-metric">
                  <div class="instrument-metric-label">${t.principalLabel} <span class="instrument-metric-hint">${t.principalHint}</span></div>
                  <div class="instrument-metric-value">${fmtUSD(principal)}</div>
                </div>
                <div class="instrument-metric">
                  <div class="instrument-metric-label">${t.couponLabel} <span class="instrument-metric-hint">${t.couponHint(state.horizonMonths)}</span></div>
                  <div class="instrument-metric-value">${couponFmt}</div>
                </div>
              </div>
              <div class="instrument-total">
                <span class="instrument-total-label">${t.totalLabel} <span class="instrument-metric-hint">${t.totalHint}</span></span>
                <span class="instrument-total-value">${fmtUSD(total)}</span>
              </div>
              ${convertNote ? `<div class="instrument-convert-note">${convertNote}</div>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');

    accordion.querySelectorAll('.instrument-head').forEach((head) => {
      head.addEventListener('click', () => {
        const ticker = head.closest('.instrument-row').dataset.ticker;
        state.expandedTicker = state.expandedTicker === ticker ? null : ticker;
        renderInstruments();
      });
      head.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); head.click(); }
      });
    });

    const best = INSTRUMENTS.reduce((b, i) => {
      const net = totalByTicker[i.ticker] - invest;
      return (b.net === undefined || net > b.net) ? { ticker: i.ticker, net } : b;
    }, {});
    const conservative = mnav < 0.85 ? 'STRF' : 'STRC';
    document.getElementById('summaryText').textContent = t.summary(
      fmtUSD(btcPrice), mnav.toFixed(2), state.horizonMonths, fmtUSD(invest),
      best.ticker, conservative, mnav < 0.85 ? t.stressYes : t.stressNo);
  }

  function renderAll() {
    const t = T();
    document.getElementById('btcPriceDisplay').textContent = fmtUSD(state.btcPrice);
    document.getElementById('btcSlider').value = state.btcPrice;
    document.getElementById('liveLabel').innerHTML = state.manualOverride
      ? t.manual
      : '<span class="live-dot" aria-hidden="true"></span>' + t.live;
    renderStocks();
    renderInstruments();
  }

  function translateStatic() {
    const t = T();
    document.querySelectorAll('[data-w3i]').forEach((el) => {
      const key = el.getAttribute('data-w3i');
      if (t[key] != null) el.innerHTML = t[key];
    });
  }

  function getLang() {
    try { return localStorage.getItem('preferredLanguage') === 'en' ? 'en' : 'es'; }
    catch (e) { return (document.documentElement.lang === 'en') ? 'en' : 'es'; }
  }

  function applyLang(lang) {
    state.lang = (lang === 'en') ? 'en' : 'es';
    translateStatic();
    renderAll();
  }

  function init() {
    document.getElementById('btcSlider').addEventListener('input', (e) => {
      state.btcPrice = parseInt(e.target.value, 10);
      state.manualOverride = true;
      renderAll();
    });

    const investEl = document.getElementById('investAmount');
    investEl.value = fmtThousands(state.investAmount);
    investEl.addEventListener('input', (e) => {
      const digits = e.target.value.replace(/[^\d]/g, '');
      state.investAmount = digits ? parseInt(digits, 10) : 0;
      e.target.value = digits ? fmtThousands(state.investAmount) : '';
      renderInstruments();
    });

    document.querySelectorAll('.strategy-horizon-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.strategy-horizon-btn').forEach((b) => {
          b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
        state.horizonMonths = parseInt(btn.dataset.months, 10);
        renderInstruments();
      });
    });

    // Enganche al selector de idioma del sitio: re-traduce al pulsar cualquier bandera.
    document.querySelectorAll('.lang-btn').forEach((b) => {
      b.addEventListener('click', () => applyLang(b.getAttribute('data-lang')));
    });

    setInterval(() => {
      if (state.manualOverride) return;
      state.btcPrice = clamp(Math.round(state.btcPrice + (Math.random() - 0.5) * 400), 30000, 250000);
      renderAll();
    }, 2600);

    applyLang(getLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
