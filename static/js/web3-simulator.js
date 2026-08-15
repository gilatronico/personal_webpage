/* ============================================
   WEB3 SIMULATOR — vanilla JS, no framework.
   Save as static/js/web3-simulator.js and reference from the
   #web3 template (see web3-simulator.html).
   Same math as the HTML prototype approved in design review.
   ============================================ */
(function () {
  const REF_BTC = 118000;
  const MSTR_REF_PRICE = 402;

  const CRYPTO_STOCKS = [
    { ticker: 'MSTR', company: 'Strategy', initials: 'MS', price: 402.15, delta: 3.2, positive: true, accent: 'primary', note: 'Mayor tenedor corporativo de BTC del mundo.' },
    { ticker: 'COIN', company: 'Coinbase', initials: 'CB', price: 289.40, delta: -1.1, positive: false, accent: 'accent', note: 'Exchange cotizado.' },
    { ticker: 'CRCL', company: 'Circle', initials: 'CR', price: 118.75, delta: 5.4, positive: true, accent: 'success', note: 'Emisor de USDC · IPO 2025.' },
    { ticker: 'SECZ', company: 'Securitize', initials: 'SC', price: 14.20, delta: 2.8, positive: true, accent: 'primary', note: 'Tokenización (BlackRock BUIDL, Apollo, KKR) · NYSE desde jul. 2026.' },
    { ticker: 'HOOD', company: 'Robinhood', initials: 'HD', price: 92.30, delta: 0.6, positive: true, accent: 'accent', note: 'Broker · tokenización de acciones.' },
    { ticker: 'MARA', company: 'Marathon Digital', initials: 'MD', price: 22.85, delta: -2.3, positive: false, accent: 'success', note: 'Minería de BTC.' },
    { ticker: 'MTPLF', company: 'Metaplanet', initials: 'MP', price: 6.45, delta: 8.1, positive: true, accent: 'primary', note: 'Bitcoin treasury company (Japón) · ticker OTC.' },
  ];

  const INSTRUMENTS = [
    { ticker: 'MSTR', name: 'Común', code: 'CMN', color: 'gray', yieldLabel: 'Sin dividendo', seniorityLabel: 'La más junior',
      description: 'Acción común de Strategy. Mayor exposición direccional a BTC, sin yield. Es la última posición en caso de liquidación.' },
    { ticker: 'STRK', name: 'Strike', code: 'CNV', color: 'amber', yieldLabel: '8% cumulativo', seniorityLabel: 'Seniority media',
      description: 'Preferente convertible a MSTR común en ratio 10:1. Su valor es el máximo entre el valor como preferente con cupón y el valor de conversión.' },
    { ticker: 'STRF', name: 'Strife', code: 'SR1', color: 'green', yieldLabel: '10% cumulativo', seniorityLabel: 'La más senior',
      description: 'La preferente más senior. Si se impaga, el dividendo compone hasta 18%. Diseñada para ser la más protegida de las cuatro.' },
    { ticker: 'STRD', name: 'Stride', code: 'JR1', color: 'rust', yieldLabel: '10% no cumulativo', seniorityLabel: 'La más junior de las preferentes',
      description: 'Justo por encima de MSTR en seniority. Mismo yield nominal que STRF pero sin cumulación: mayor riesgo si se impaga un pago.' },
    { ticker: 'STRC', name: 'Stretch', code: 'VAR', color: 'blue', yieldLabel: '~11-12% variable', seniorityLabel: 'Seniority intermedia',
      description: 'Cupón variable, se ajusta en incrementos de 0.25% mensual. Diseñada para cotizar estable cerca de $100 par — la más líquida y "bond-like".' },
  ];

  const YIELD_RATES = { MSTR: 0, STRK: 0.08, STRF: 0.10, STRD: 0.10, STRC: 0.115 };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fmtUSD(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function fmtUSD2(n) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function computeMNAV(btcPrice) {
    const ratio = btcPrice / REF_BTC;
    return clamp(1.7 * Math.pow(ratio, 0.6), 0.4, 3);
  }

  // CSS vars resolve against the live theme so colors follow the site's dark-mode toggle automatically.
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  function colorFor(key) {
    switch (key) {
      case 'gray': return cssVar('--text-muted');
      case 'amber': return '#F59E0B';
      case 'green': return cssVar('--color-success') || '#00C58E';
      case 'rust': return '#ef4444';
      case 'blue': return cssVar('--color-primary');
      case 'primary': return cssVar('--color-primary');
      case 'accent': return cssVar('--color-accent');
      case 'success': return cssVar('--color-success') || '#00C58E';
      default: return cssVar('--text-main');
    }
  }

  let state = {
    btcPrice: 118000,
    manualOverride: false,
    investAmount: 10000,
    horizonMonths: 12,
    expandedTicker: 'STRK',
  };

  function renderStocks() {
    const grid = document.getElementById('cryptoStocksGrid');
    if (!grid) return;
    grid.innerHTML = CRYPTO_STOCKS.map((s) => {
      const trendColor = s.positive ? 'var(--stock-trend-positive, currentColor)' : 'var(--stock-trend-negative, currentColor)';
      const accentColor = colorFor(s.accent);
      return `
        <div class="protocol-card" style="border-top-color:${accentColor}">
          <div class="stock-card-head">
            <div class="stock-badge" style="background:${accentColor}">${s.initials}</div>
            <div>
              <div style="font-weight:700;color:var(--text-main)">${s.ticker}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${s.company}</div>
            </div>
          </div>
          <div class="stock-price-row">
            <div class="stock-price" style="color:${accentColor}">$${s.price}</div>
            <div class="stock-change ${s.positive ? 'positive' : 'negative'}">${s.positive ? '▲' : '▼'} ${s.delta}%</div>
          </div>
          <div class="stock-note">${s.note}</div>
        </div>`;
    }).join('');
  }

  function renderInstruments() {
    const btcPrice = state.btcPrice;
    const mnav = computeMNAV(btcPrice);
    const mstrPrice = MSTR_REF_PRICE * (btcPrice / REF_BTC) * (mnav / 1.7);

    const strkPar = mnav >= 1 ? 100 : 100 * Math.max(0.6, mnav);
    const strkConv = mstrPrice / 10;
    const strkVal = Math.max(strkPar, strkConv);
    const shouldConvert = strkConv > strkPar;

    const strfVal = mnav >= 0.9 ? 100 * Math.min(1.05, 1 + (mnav - 1) * 0.05) : 100 * Math.max(0.5, mnav + 0.1);
    const strdVal = mnav >= 1 ? 100 * Math.min(1.03, 1 + (mnav - 1) * 0.03) : 100 * Math.max(0.3, mnav - 0.1);
    const strcVal = mnav >= 1 ? 100 : (mnav >= 0.85 ? 100 - (1 - mnav) * 193 : 71 * Math.max(0.7, mnav / 0.85));

    const horizonYears = state.horizonMonths / 12;
    const invest = state.investAmount || 0;

    const valuesByTicker = {
      MSTR: invest * (mstrPrice / MSTR_REF_PRICE),
      STRK: invest * (strkVal / 100),
      STRF: invest * (strfVal / 100),
      STRD: invest * (strdVal / 100),
      STRC: invest * (strcVal / 100),
    };
    const couponByTicker = {};
    Object.keys(YIELD_RATES).forEach((t) => { couponByTicker[t] = invest * YIELD_RATES[t] * horizonYears; });

    // mNAV ring + readout
    const mnavPct = clamp((mnav - 0.4) / (3 - 0.4), 0, 1) * 100;
    const mnavColor = mnav >= 1 ? colorFor('green') : (mnav >= 0.85 ? '#F59E0B' : '#ef4444');
    document.getElementById('mnavRing').style.background = `conic-gradient(${mnavColor} ${mnavPct * 3.6}deg, var(--border-color) 0deg)`;
    document.getElementById('mnavValue').textContent = mnav.toFixed(2) + '×';
    document.getElementById('mnavLabel').textContent = mnav >= 1
      ? 'Accretive — emitir acciones suma BTC/acción'
      : 'Dilutivo — emitir resta BTC/acción';

    // Accordion
    const accordion = document.getElementById('instrumentAccordion');
    accordion.innerHTML = INSTRUMENTS.map((inst) => {
      const accentColor = colorFor(inst.color);
      const isExpanded = state.expandedTicker === inst.ticker;
      const value = valuesByTicker[inst.ticker];
      const coupon = couponByTicker[inst.ticker];
      const couponFmt = inst.ticker === 'MSTR' ? '— (sin dividendo)' : fmtUSD(coupon);
      const convertNote = inst.ticker === 'STRK'
        ? (shouldConvert
            ? `Con BTC en ${fmtUSD(btcPrice)}, el valor de conversión ($${fmtUSD2(strkConv)}) supera al valor como preferente ($${fmtUSD2(strkPar)}) — convendría convertir a MSTR.`
            : `Con BTC en ${fmtUSD(btcPrice)}, el valor como preferente ($${fmtUSD2(strkPar)}) supera al de conversión ($${fmtUSD2(strkConv)}) — mejor mantener STRK.`)
        : '';
      return `
        <div class="protocol-card instrument-row ${isExpanded ? 'expanded' : ''}" style="border-left-color:${accentColor}" data-ticker="${inst.ticker}">
          <div class="instrument-head" role="button" tabindex="0" aria-expanded="${isExpanded}">
            <div style="display:flex;align-items:center;gap:14px">
              <div class="instrument-badge" style="color:${accentColor}">${inst.code}</div>
              <div>
                <div style="font-weight:700;color:var(--text-main)">${inst.ticker} <span style="font-weight:400;font-size:0.85rem;color:var(--text-muted)">— ${inst.name}</span></div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">${inst.yieldLabel} · ${inst.seniorityLabel}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:16px">
              <div style="text-align:right">
                <div style="font-weight:700;color:var(--text-main)">${fmtUSD(value)}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">valor estimado</div>
              </div>
              <div class="instrument-chevron">⌄</div>
            </div>
          </div>
          <div class="instrument-panel">
            <div class="instrument-panel-inner">
              <div style="font-size:0.85rem;color:var(--text-body);line-height:1.6;margin:16px 0">${inst.description}</div>
              <div class="instrument-metrics">
                <div class="instrument-metric">
                  <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Valor de tu posición</div>
                  <div style="font-weight:700;font-size:1.1rem;color:var(--text-main)">${fmtUSD(value)}</div>
                </div>
                <div class="instrument-metric">
                  <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">Dividendo/cupón estimado</div>
                  <div style="font-weight:700;font-size:1.1rem;color:var(--text-main)">${couponFmt}</div>
                </div>
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

    // Summary
    const bestReturn = INSTRUMENTS.reduce((best, i) => {
      const total = valuesByTicker[i.ticker] + (couponByTicker[i.ticker] || 0) - invest;
      return (best.total === undefined || total > best.total) ? { ticker: i.ticker, total } : best;
    }, {});
    const conservative = mnav < 0.85 ? 'STRF' : 'STRC';
    document.getElementById('summaryText').textContent =
      `Con BTC en ${fmtUSD(btcPrice)} (mNAV ${mnav.toFixed(2)}×) a ${state.horizonMonths} meses, la opción con mayor rendimiento esperado sobre ${fmtUSD(invest)} invertidos sería ${bestReturn.ticker}, y la más conservadora sería ${conservative}${mnav < 0.85 ? ' (riesgo de estrés de crédito elevado en este escenario)' : '.'}`;
  }

  function renderAll() {
    document.getElementById('btcPriceDisplay').textContent = fmtUSD(state.btcPrice);
    document.getElementById('btcSlider').value = state.btcPrice;
    document.getElementById('liveLabel').innerHTML = state.manualOverride
      ? 'ajuste manual'
      : '<span class="live-dot" aria-hidden="true"></span>simulando en vivo';
    renderStocks();
    renderInstruments();
  }

  function init() {
    document.getElementById('btcSlider').addEventListener('input', (e) => {
      state.btcPrice = parseInt(e.target.value, 10);
      state.manualOverride = true;
      renderAll();
    });
    document.getElementById('investAmount').addEventListener('input', (e) => {
      state.investAmount = Math.max(0, parseFloat(e.target.value) || 0);
      renderInstruments();
    });
    document.querySelectorAll('.strategy-horizon-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.strategy-horizon-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.horizonMonths = parseInt(btn.dataset.months, 10);
        renderInstruments();
      });
    });

    // Simulated live tick (pauses once the user drags the slider)
    setInterval(() => {
      if (state.manualOverride) return;
      state.btcPrice = clamp(Math.round(state.btcPrice + (Math.random() - 0.5) * 400), 30000, 250000);
      renderAll();
    }, 2600);

    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
