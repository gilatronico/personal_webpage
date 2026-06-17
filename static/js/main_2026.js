/**
 * 2026 REDESIGN — Magnetic Hover + Section Init
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Magnetic hover on interactive cards
  const cards = document.querySelectorAll(
    '.service-card, .project-card, .article-card, .skill-category, .protocol-card, .crypto-card'
  );

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const dx = (x / rect.width) * 6;
      const dy = (y / rect.height) * 6;
      card.style.transform = `translate(${dx}px, ${dy - 2}px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // 2. Auto-load Web3/Market Intelligence data
  // In the original, this was triggered by tab switching. Now all sections are visible.
  setTimeout(() => {
    if (typeof loadMarketData === 'function') {
      loadMarketData();
    }
    if (typeof fetchCryptoPrices === 'function') {
      fetchCryptoPrices();
      if (typeof setupCryptoScrollListeners === 'function') {
        setupCryptoScrollListeners();
      }
    }
  }, 500);
});
