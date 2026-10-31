import os
import datetime
from pathlib import Path
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse, Http404
from django.template.loader import render_to_string
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.core.cache import cache
import json
import logging
import urllib.request
import urllib.error
from .models import ContactSubmission
from . import content, articles
from .i18n import translate_html

logger = logging.getLogger(__name__)

# Tickers del bloque "Acciones Cripto" del simulador Web3. Metaplanet (MTPLF)
# se excluyó a propósito: cotiza sobre todo en Tokio (3350.T) y su ticker OTC
# en EE. UU. es demasiado ilíquido para tener un precio fiable en Yahoo Finance.
STOCK_TICKERS = ['MSTR', 'COIN', 'CRCL', 'SECZ', 'HOOD', 'MARA']

# Mensajes de error del formulario de contacto en ambos idiomas. El frontend
# manda 'lang' en el body; antes estos textos estaban hardcodeados solo en
# español y se mostraban tal cual aunque el visitante estuviera en inglés.
CONTACT_MESSAGES = {
    'invalid_request': {'es': 'Solicitud inválida', 'en': 'Invalid request'},
    'too_fast': {
        'es': 'Por favor, espera unos segundos antes de enviar otro mensaje.',
        'en': 'Please wait a few seconds before sending another message.',
    },
    'field_required': {'es': 'El campo {field} es requerido', 'en': 'The {field} field is required'},
    'invalid_email': {'es': 'Email inválido', 'en': 'Invalid email'},
    'email_failed': {
        'es': 'No se pudo enviar tu mensaje por un problema técnico. '
              'Por favor, escribe directamente a agilabertcomunicaciones@gmail.com.',
        'en': 'Your message could not be sent due to a technical issue. '
              'Please email agilabertcomunicaciones@gmail.com directly.',
    },
    'success': {'es': 'Mensaje enviado correctamente', 'en': 'Message sent successfully'},
    'rate_limited': {
        'es': 'Has enviado demasiados mensajes. Por favor, espera un momento antes de intentar de nuevo.',
        'en': 'You have sent too many messages. Please wait a moment before trying again.',
    },
    'bad_json': {'es': 'Error al procesar los datos', 'en': 'Error processing data'},
    'unexpected': {
        'es': 'Ha ocurrido un error. Por favor, intenta de nuevo más tarde.',
        'en': 'An error occurred. Please try again later.',
    },
}


def get_request_lang(data):
    """'en' si el frontend lo indicó explícitamente, 'es' por defecto."""
    return 'en' if isinstance(data, dict) and data.get('lang') == 'en' else 'es'


def get_lang_from_request(request):
    """
    Igual que get_request_lang, pero a prueba de fallos para usar dentro de los
    'except': si el JSON nunca llegó a parsearse (o el rate limit del decorador
    saltó antes de que la vista empezara a ejecutarse), 'data' no existe.
    """
    try:
        return get_request_lang(json.loads(request.body))
    except Exception:
        return 'es'

# Rate limiting solo si hay Redis disponible
try:
    from django_ratelimit.decorators import ratelimit
    from django_ratelimit.exceptions import Ratelimited
    # Verificar si hay Redis configurado
    REDIS_AVAILABLE = 'redis' in settings.CACHES.get('default', {}).get('BACKEND', '').lower()
    if not REDIS_AVAILABLE:
        # Si no hay Redis, crear decoradores dummy que no hacen nada
        def ratelimit(*args, **kwargs):
            def decorator(func):
                return func
            return decorator
        Ratelimited = Exception
except ImportError:
    # Si django_ratelimit no está instalado
    def ratelimit(*args, **kwargs):
        def decorator(func):
            return func
        return decorator
    Ratelimited = Exception
    REDIS_AVAILABLE = False

SITE_URL = 'https://alexgilabert.xyz'


HOME_META = {
    'es': {
        'title': 'Alex Gilabert · Product Manager de custodia de activos digitales',
        'og_title': 'Alex Gilabert · Senior Product Manager en Bitpanda',
        'description': 'Senior Product Manager en Bitpanda Enterprise. Producto de custodia, '
                       'tokenización y brokeraje para banca, fintechs y empresas Web3. Docente en CEDEU. Madrid.',
        'og_locale': 'es_ES', 'og_locale_alt': 'en_US',
    },
    'en': {
        'title': 'Alex Gilabert · Digital Asset Custody Product Manager',
        'og_title': 'Alex Gilabert · Senior Product Manager at Bitpanda',
        'description': 'Senior Product Manager at Bitpanda Enterprise. Custody, tokenization and '
                       'brokerage products for banks, fintechs and Web3 companies. Lecturer at CEDEU. Madrid.',
        'og_locale': 'en_US', 'og_locale_alt': 'es_ES',
    },
}


def _person_schema(lang):
    data = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        'name': 'Alex Gilabert Ramírez',
        'alternateName': 'Alex Gilabert',
        'url': f'{SITE_URL}/',
        'image': f'{SITE_URL}/static/images/alex-gilabert-og.jpg',
        'jobTitle': 'Senior Product Manager',
        'description': HOME_META[lang]['description'],
        'worksFor': {'@type': 'Organization', 'name': 'Bitpanda Enterprise', 'url': 'https://www.bitpanda.com/'},
        'address': {'@type': 'PostalAddress', 'addressLocality': 'Madrid', 'addressCountry': 'ES'},
        'knowsAbout': ['Digital asset custody', 'Tokenization', 'MiCA', 'Travel Rule', 'DeFi', 'Product Management'],
        'knowsLanguage': ['es', 'en'],
        'sameAs': [
            'https://www.linkedin.com/in/alejandrogilabertramirez/',
            'https://x.com/0xpeculative',
            'https://github.com/gilatronico',
        ],
    }
    # Evita que un '</script>' en el JSON cierre la etiqueta
    return json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')


def _visible_cases(lang):
    if not content.section_enabled('cases'):
        return []
    return [c for c in content.localize(content.CASES, lang) if settings.DEBUG or not c['has_todo']]


LEDGER_LABELS = {
    'es': {'block': 'Bloque', 'genesis': 'génesis', 'sidechain': 'sidechain', 'staking': 'staking',
           'events': 'Eventos', 'milestone': 'hito', 'milestones': 'hitos'},
    'en': {'block': 'Block', 'genesis': 'genesis', 'sidechain': 'sidechain', 'staking': 'staking',
           'events': 'Events', 'milestone': 'milestone', 'milestones': 'milestones'},
}


def _sections():
    """Flags de content.SECTIONS para las plantillas: {{ sections.lab_stocks }}…"""
    return {k: content.section_enabled(k) for k in content.SECTIONS}


def _ledger(lang):
    """
    Trayectoria localizada. En producción (DEBUG=False) los textos con [TODO] se quitan;
    si un campo tiene *_fallback se usa ese en su lugar.
    """
    show_todo = settings.DEBUG
    labels = LEDGER_LABELS[lang]

    def field(item, key):
        value = content.pick(item.get(key), lang)
        if value and not show_todo and content.has_todo(value):
            return content.pick(item.get(key + '_fallback'), lang) or ''
        return value

    def items(values):
        out = [content.pick(v, lang) for v in values]
        return out if show_todo else [v for v in out if not content.has_todo(v)]

    blocks = []
    for i, item in enumerate(content.LEDGER):
        kind = item['kind']
        no = item['no']
        events = [{'date': content.pick(e['date'], lang), 'text': content.pick(e['text'], lang), 'detail': content.pick(e.get('detail'), lang) or ''}
                  for e in item.get('events', [])]
        if not show_todo:
            events = [e for e in events if not content.has_todo(e['date'], e['text'], e['detail'])]
        blocks.append({
            'i': i,
            'key': item['key'],
            'kind': kind,
            'kind_label': labels.get(kind, ''),
            # Etiqueta del bloque: "Bloque #0000 · génesis", "Sidechain SC-01", "Staking STK-01"…
            'label': f"{labels['block']} {no}" if kind in ('genesis', 'main') else f"{labels[kind].capitalize()} {no}",
            'title': (f"{labels['block']} {no} · {labels['genesis']}" if kind == 'genesis'
                      else (f"{labels['block']} {no} · {item['hash']}" if kind == 'main'
                            else f"{labels[kind].capitalize()} {no} · {item['hash']}")),
            'hash': item['hash'],
            'role': field(item, 'role'),
            'org_short': field(item, 'org_short'),
            'years': field(item, 'years'),
            'org': field(item, 'org'),
            'logo': item.get('logo'),
            'logo_w': item.get('logo_w'),
            'logo_h': item.get('logo_h', 20),
            'period': field(item, 'period'),
            'evolution': field(item, 'evolution'),
            'step': field(item, 'step'),
            'subtitle': field(item, 'subtitle'),
            'desc': field(item, 'desc'),
            'list_title': field(item, 'list_title'),
            'bullets': items(item.get('bullets', [])),
            'chips': items(item.get('chips', [])),
            'events': events,
            # "Eventos · 2 hitos" (en mayúsculas por CSS); vacío si el bloque no tiene hitos
            'events_label': (f"{labels['events']} · {len(events)} "
                             f"{labels['milestone'] if len(events) == 1 else labels['milestones']}") if events else '',
        })
    # El último bloque de la cadena principal cierra la línea (el staking va aparte)
    main_idx = [b['i'] for b in blocks if b['kind'] in ('genesis', 'main')]
    for b in blocks:
        b['chain_end'] = b['i'] == max(main_idx)
    return blocks


def _nav_ctx(lang, page):
    """Contexto del header/footer compartidos (partials/nav.html)."""
    prefix = '/en/' if lang == 'en' else '/'
    on_home = page == 'home'
    return {
        'page': page,
        'nav_base': '' if on_home else prefix,
        'lab_url': '#lab' if on_home else f'{prefix}web3',
        'lang_es_url': '/' if on_home else '/web3',
        'lang_en_url': '/en/' if on_home else '/en/web3',
    }


def _home(request, lang):
    """
    Home (ES en / y EN en /en/). Todo lo que tenga [TODO] en landing/content.py solo
    se muestra en local; en producción esos bloques se ocultan.
    """
    cases = _visible_cases(lang)
    article_list, dates_quiet = articles.localized_list(lang)
    ctx = {
        'lang': lang,
        'meta': HOME_META[lang],
        'site_url': SITE_URL,
        'canonical': f'{SITE_URL}/en/' if lang == 'en' else f'{SITE_URL}/',
        'person_schema_json': _person_schema(lang),
        'stats': content.localize(content.STATS, lang),
        'sections': _sections(),
        'teaching': content.localize(content.TEACHING, lang),
        'ledger': _ledger(lang),
        'ledger_current': max(i for i, b in enumerate(content.LEDGER) if b['kind'] in ('genesis', 'main')),
        'cases': cases,
        'articles': article_list,
        'dates_quiet': dates_quiet,
        'now': {
            'updated': content.pick(content.NOW['updated'], lang),
            'items': content.localize(content.NOW['items'], lang),
        },
        'contact_email': os.environ.get('CONTACT_EMAIL', content.CONTACT_EMAIL_DEFAULT),
        'hero_cutout': content.HERO_PHOTO_CUTOUT,
        **_nav_ctx(lang, 'home'),
    }
    html = render_to_string('landing/home.html', ctx, request)
    if lang == 'en':
        html = translate_html(html)
    return HttpResponse(html)


def index_professional(request):
    """
    Home en español. La versión anterior sigue en landing/index_professional.html.
    """
    return _home(request, 'es')


def home_en(request):
    return _home(request, 'en')


def article_detail(request, slug):
    """
    Artículo alojado en la web. Los borradores (draft: true) solo se ven en local.
    """
    article = articles.get_article(slug)
    if not article or (article['draft'] and not settings.DEBUG):
        raise Http404('Artículo no encontrado')
    return render(request, 'landing/article.html', {
        'a': article,
        'body': articles.render_body(article),
        'site_url': SITE_URL,
        'canonical': f'{SITE_URL}/articulos/{slug}/',
        'contact_email': os.environ.get('CONTACT_EMAIL', content.CONTACT_EMAIL_DEFAULT),
    })


WEB3_META = {
    'es': {
        'title': 'Web3 Lab · El dinero institucional ya está onchain | Alex Gilabert',
        'description': 'Stablecoins, fondos monetarios tokenizados, depósitos tokenizados y rendimientos onchain, '
                       'con datos en tiempo real, y una herramienta para elegir el modelo de custodia de tu institución.',
        'og_locale': 'es_ES', 'og_locale_alt': 'en_US',
    },
    'en': {
        'title': 'Web3 Lab · Institutional money is already onchain | Alex Gilabert',
        'description': 'Stablecoins, tokenized money market funds, tokenized deposits and onchain yields with live data, '
                       'plus a tool to choose your institution\'s custody model.',
        'og_locale': 'en_US', 'og_locale_alt': 'es_ES',
    },
}

DATA_DIR = Path(__file__).resolve().parent.parent / 'data'


def _read_json(name):
    with open(DATA_DIR / name, encoding='utf-8') as f:
        return json.load(f)


def _localize_tree(obj, lang):
    """
    Colapsa recursivamente los {'es':..,'en':..} al idioma pedido. Una clave 'x_en'
    sustituye a 'x' cuando el idioma es inglés (nombres que cambian con el idioma).
    """
    if isinstance(obj, dict):
        if set(obj) == {'es', 'en'}:
            return obj[lang]
        out = {}
        for k, v in obj.items():
            if k.endswith('_en') and k[:-3] in obj:
                continue
            if lang == 'en' and f'{k}_en' in obj:
                v = obj[f'{k}_en']
            out[k] = _localize_tree(v, lang)
        return out
    if isinstance(obj, list):
        return [_localize_tree(x, lang) for x in obj]
    return obj


CHAIN_SLUG = {
    'Ethereum': 'ethereum', 'Solana': 'solana', 'Polygon': 'polygon', 'Avalanche': 'avalanche',
    'BNB Chain': 'bnb', 'Arbitrum': 'arbitrum', 'Optimism': 'optimism', 'Aptos': 'aptos',
    'Stellar': 'stellar', 'Base': 'base',
}


def _tl_data(lang):
    """Línea temporal global de la tokenización (data/tokenization-timeline.json), localizada."""
    tl = _localize_tree(_read_json('tokenization-timeline.json'), lang)
    tl['events'].sort(key=lambda e: e['date'])
    banks = []
    for e in tl['events']:
        if e['category'] == 'deposits' and e['status'] == 'active' and e['entities'][0] not in banks:
            banks.append(e['entities'][0])
    tl['banks_active'] = banks
    tl['count'] = len(tl['events'])
    return tl


def _lab_data(lang):
    """Contenido curado del Web3 Lab y cuestionario de custodia, ya en el idioma de la página."""
    lab = _localize_tree(_read_json('lab-curated.json'), lang)
    quiz = _localize_tree(_read_json('custody-quiz.json'), lang)
    item = next((a for a in articles.localized_list(lang)[0] if a['slug'] == lab['article_slug']), None)
    lab['article'] = {'url': item['url'], 'external': item['external']} if item else None
    cmp = lab['ui']['compare']
    by = {r['id']: r for r in cmp['rows']}
    lab['compare_labels'] = {i: r['label'] for i, r in by.items()}
    lab['compare_cols'] = [{
        'key': k,
        'title': cmp['cols'][k],
        'tone': cmp['tones'][k],
        'number': cmp['numbers'][k],
        'yield_state': cmp['yieldState'][k],
        'what': by['what'][k], 'issuer': by['issuer'][k], 'yield_v': by['yield'][k], 'who': by['who'][k],
        'examples': [x.strip() for x in by['example'][k].split(', ')],
    } for k in ('stable', 'mmf', 'dep')]
    # Fondos: orden por antigüedad (el patrimonio en vivo solo reordena si hay datos de todos) y redes como iconos
    for f in lab['funds']:
        icons = [{'name': n, 'slug': CHAIN_SLUG[n]} for n in f['networks'] if n in CHAIN_SLUG]
        f['chains_shown'], f['chains_more'] = icons[:4], icons[4:]
        f['chains_more_title'] = ', '.join(c['name'] for c in icons[4:])
    return lab, quiz


# Pools de liquid staking que compiten por "el de mayor TVL" de cada red (yields.llama.fi)
ETH_LST = {
    'lido': 'Lido', 'binance-staked-eth': 'Binance', 'ether.fi-stake': 'ether.fi', 'rocket-pool': 'Rocket Pool',
    'coinbase-wrapped-staked-eth': 'Coinbase', 'stakewise-v2': 'StakeWise', 'swell-liquid-staking': 'Swell',
    'frax-ether': 'Frax', 'mantle-staked-eth': 'Mantle', 'kelp': 'Kelp', 'renzo': 'Renzo',
}
SOL_LST = {
    'binance-staked-sol': 'Binance', 'jito-liquid-staking': 'Jito', 'marinade-liquid-staking': 'Marinade',
    'jpool': 'JPool', 'blazestake': 'BlazeStake', 'jupiter-staked-sol': 'Jupiter', 'bybit-staked-sol': 'Bybit',
    'helius-staked-sol': 'Helius', 'drift-staked-sol': 'Drift', 'sanctum-validator-lsts': 'Sanctum',
    'the-vault-liquid-staking': 'The Vault',
}


def _pool_apy(pool):
    # La media a 30 días evita picos de rebase puntuales (p. ej. stETH) que no son rendimiento real
    v = pool.get('apyMean30d')
    return v if v is not None else pool.get('apy')


def _build_lab_yields():
    req = urllib.request.Request('https://yields.llama.fi/pools', headers={'User-Agent': 'Mozilla/5.0 alexgilabert.xyz'})
    with urllib.request.urlopen(req, timeout=25) as resp:
        pools = json.loads(resp.read())['data']

    def best(chain, projects):
        cands = [p for p in pools if p['chain'] == chain and p['project'] in projects
                 and p.get('tvlUsd') and _pool_apy(p) is not None]
        if not cands:
            return None
        p = max(cands, key=lambda x: x['tvlUsd'])
        return {'symbol': p['symbol'], 'project': projects[p['project']], 'tvl': p['tvlUsd'], 'apy': round(_pool_apy(p), 2)}

    # Fondos tokenizados: el valor onchain y las redes salen de los pools del protocolo en DefiLlama
    funds = {}
    for f in _read_json('lab-curated.json')['funds']:
        slug = f.get('defillama')
        rows = [p for p in pools if p['project'] == slug and p.get('tvlUsd')] if slug else []
        if not rows:
            continue
        top = max(rows, key=lambda x: x['tvlUsd'])
        chains = sorted({p['chain'] for p in rows}, key=lambda c: -sum(p['tvlUsd'] for p in rows if p['chain'] == c))
        funds[f['id']] = {
            'tvl': sum(p['tvlUsd'] for p in rows),
            'chains': chains,
            'symbol': top['symbol'],
            'apy': round(_pool_apy(top), 2) if _pool_apy(top) is not None else None,
        }
    return {'eth': best('Ethereum', ETH_LST), 'sol': best('Solana', SOL_LST), 'funds': funds,
            'asOf': timezone.now().isoformat()}


@require_http_methods(["GET"])
def lab_yields(request):
    """
    Rendimientos de DefiLlama para el Web3 Lab. La API completa de pools pesa ~10 MB, así que se
    reduce aquí a lo necesario y se cachea 10 minutos (en el servidor y en el CDN).
    """
    data = cache.get('lab_yields')
    if data is None:
        try:
            data = _build_lab_yields()
        except (urllib.error.URLError, KeyError, TypeError, ValueError, OSError) as e:
            logger.warning(f'lab_yields: no se pudo obtener yields.llama.fi: {e}')
            return JsonResponse({'error': 'upstream'}, status=502)
        cache.set('lab_yields', data, 600)
    resp = JsonResponse(data)
    resp['Cache-Control'] = 'public, max-age=300, s-maxage=600'
    return resp


def _web3(request, lang):
    """
    Web3 Lab: dinero institucional onchain. El contenido curado (fondos, depósitos, comparador)
    y el cuestionario de custodia se renderizan/embeben localizados desde data/*.json; los datos
    numéricos los carga static/js/web3-lab.js desde APIs públicas.
    """
    lab, quiz = _lab_data(lang)
    tl = _tl_data(lang)
    ctx = {
        'lang': lang,
        'meta': WEB3_META[lang],
        'site_url': SITE_URL,
        'canonical': f'{SITE_URL}/en/web3' if lang == 'en' else f'{SITE_URL}/web3',
        'cases': _visible_cases(lang),
        'sections': _sections(),
        'lab': lab,
        'ui': lab['ui'],
        'quiz': quiz,
        'tl': tl,
        'lab_json': {'ui': lab['ui'], 'issuers': lab['issuers'], 'quiz': quiz, 'tl': tl},
        **_nav_ctx(lang, 'web3'),
    }
    html = render_to_string('landing/web3.html', ctx, request)
    if lang == 'en':
        html = translate_html(html)
    return HttpResponse(html)


def web3_lab(request):
    return _web3(request, 'es')


def web3_lab_en(request):
    return _web3(request, 'en')


def privacidad(request):
    """
    Política de privacidad y aviso legal (RGPD).
    """
    return render(request, 'landing/privacidad.html')


def robots_txt(request):
    """
    robots.txt servido dinámicamente para que apunte siempre al sitemap correcto.
    """
    lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        # El CV incluye un email personal (no el de contacto público);
        # se evita que buscadores lo indexen y lo dejen cosechable.
        'Disallow: /static/documents/',
        '',
        f'Sitemap: {SITE_URL}/sitemap.xml',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')


def sitemap_xml(request):
    """
    Sitemap con las URLs indexables. La home declara sus versiones ES/EN con hreflang.
    """
    today = timezone.now().strftime('%Y-%m-%d')
    alt = (
        f'    <xhtml:link rel="alternate" hreflang="es" href="{SITE_URL}/"/>\n'
        f'    <xhtml:link rel="alternate" hreflang="en" href="{SITE_URL}/en/"/>\n'
        f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE_URL}/"/>\n'
    )
    alt_web3 = (
        f'    <xhtml:link rel="alternate" hreflang="es" href="{SITE_URL}/web3"/>\n'
        f'    <xhtml:link rel="alternate" hreflang="en" href="{SITE_URL}/en/web3"/>\n'
        f'    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE_URL}/web3"/>\n'
    )
    urls = [
        (f'{SITE_URL}/', '1.0', 'monthly', alt),
        (f'{SITE_URL}/en/', '0.9', 'monthly', alt),
        (f'{SITE_URL}/web3', '0.7', 'weekly', alt_web3),
        (f'{SITE_URL}/en/web3', '0.6', 'weekly', alt_web3),
    ]
    urls += [(f'{SITE_URL}/articulos/{a["slug"]}/', '0.6', 'yearly', '')
             for a in articles.all_articles() if not a['draft']]
    urls.append((f'{SITE_URL}/privacidad', '0.3', 'yearly', ''))
    entries = '\n'.join(
        f'  <url>\n'
        f'    <loc>{loc}</loc>\n'
        f'{links}'
        f'    <lastmod>{today}</lastmod>\n'
        f'    <changefreq>{freq}</changefreq>\n'
        f'    <priority>{prio}</priority>\n'
        f'  </url>'
        for loc, prio, freq, links in urls
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        f'{entries}\n'
        '</urlset>\n'
    )
    return HttpResponse(xml, content_type='application/xml')


@require_http_methods(["GET"])
def stock_quotes(request):
    """
    Precios reales de las acciones del bloque "Acciones Cripto" (módulo Web3),
    vía el endpoint no oficial de Yahoo Finance (chart API), que no requiere
    API key ni cuenta. No tiene SLA ni garantía de disponibilidad -por eso
    cada ticker se resuelve por separado y uno que falle no tumba el resto-,
    así que se cachea 90s para no depender de que esté siempre arriba y para
    no golpearlo en cada carga de página.
    """
    cached = cache.get('stock_quotes')
    if cached is not None:
        return JsonResponse(cached)

    quotes = {}
    for ticker in STOCK_TICKERS:
        try:
            url = f'https://query1.finance.yahoo.com/v8/finance/chart/{ticker}'
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
            meta = data['chart']['result'][0]['meta']
            price = meta['regularMarketPrice']
            prev_close = meta.get('chartPreviousClose') or meta.get('previousClose')
            change_pct = ((price - prev_close) / prev_close) * 100 if prev_close else 0
            quotes[ticker] = {
                'price': round(price, 2),
                'changePercent': round(change_pct, 2),
            }
        except (urllib.error.URLError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as e:
            logger.warning(f"stock_quotes: no se pudo obtener {ticker}: {e}")

    payload = {'quotes': quotes, 'asOf': timezone.now().isoformat()}
    cache.set('stock_quotes', payload, 90)
    return JsonResponse(payload)


@require_http_methods(["POST"])
# El frontend ya envía X-CSRFToken correctamente (ver fetch en el template),
# así que csrf_exempt aquí solo quitaba protección real sin ninguna ventaja.
# Rate limiting - se aplica solo si el cache backend lo soporta
# En desarrollo local con DatabaseCache funcionará correctamente
@ratelimit(key='ip', rate='3/m', method='POST', block=True)  # 3 peticiones por minuto
@ratelimit(key='ip', rate='5/h', method='POST', block=True)   # 5 peticiones por hora
@ratelimit(key='ip', rate='10/d', method='POST', block=True) # 10 peticiones por día
def submit_contact(request):
    """
    Vista para recibir y almacenar las peticiones del formulario de contacto
    Protegida con rate limiting para prevenir spam y ataques
    """
    try:
        # Parsear datos JSON
        data = json.loads(request.body)
        lang = get_request_lang(data)

        # Validar honeypot (campo oculto anti-spam)
        if data.get('website'):  # Si se rellena el campo honeypot, es spam
            logger.warning(f'Spam detectado - honeypot rellenado. IP: {get_client_ip(request)}')
            return JsonResponse({
                'success': False,
                'error': CONTACT_MESSAGES['invalid_request'][lang]
            }, status=400)

        # Validar tiempo mínimo entre peticiones (protección adicional)
        ip_address = get_client_ip(request)
        cache_key = f'contact_submission_{ip_address}'
        last_submission_time = cache.get(cache_key)

        if last_submission_time:
            time_since_last = (timezone.now() - last_submission_time).total_seconds()
            if time_since_last < 10:  # Mínimo 10 segundos entre peticiones
                logger.warning(f'Rate limit adicional: petición demasiado rápida. IP: {ip_address}, tiempo: {time_since_last:.2f}s')
                return JsonResponse({
                    'success': False,
                    'error': CONTACT_MESSAGES['too_fast'][lang],
                    'retry_after': int(10 - time_since_last)
                }, status=429)

        # Guardar timestamp de esta petición
        cache.set(cache_key, timezone.now(), timeout=60)  # Cache por 60 segundos

        # Validar campos requeridos
        required_fields = ['name', 'email', 'service', 'message']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'error': CONTACT_MESSAGES['field_required'][lang].format(field=field)
                }, status=400)

        # Validar email
        email = data.get('email', '').strip()
        if '@' not in email or '.' not in email.split('@')[1]:
            return JsonResponse({
                'success': False,
                'error': CONTACT_MESSAGES['invalid_email'][lang]
            }, status=400)
        
        # Obtener IP y User Agent
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Crear registro en la base de datos (opcional, si falla continuamos)
        submission_id = None
        try:
            submission = ContactSubmission.objects.create(
                name=data.get('name', '').strip(),
                email=email,
                service_type=data.get('service', ''),
                message=data.get('message', '').strip(),
                ip_address=ip_address,
                user_agent=user_agent
            )
            submission_id = submission.id
        except Exception as db_error:
            # Si falla el guardado en BD, continuamos de todas formas
            logger.warning(f'Error al guardar en BD: {db_error}. Continuando sin guardar.')
            submission_id = None
        
        # Enviar email de notificación
        try:
            service_type_display = dict(ContactSubmission._meta.get_field('service_type').choices).get(
                data.get('service', ''), 
                data.get('service', 'General')
            )
            
            subject = f'Nueva consulta de contacto - {service_type_display}'
            email_message = f"""
Has recibido una nueva consulta desde tu landing page:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INFORMACIÓN DE CONTACTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nombre: {data.get('name', '').strip()}
Email: {data.get('email', '').strip()}
Tipo de consulta: {service_type_display}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MENSAJE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{data.get('message', '').strip()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METADATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Fecha: {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}
IP: {ip_address or 'N/A'}
ID de registro: #{submission_id or 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para responder, simplemente responde a este email o contacta a: {email}
"""
            
            sent_count = send_mail(
                subject,
                email_message,
                settings.DEFAULT_FROM_EMAIL,
                [settings.CONTACT_EMAIL],
                fail_silently=False,  # Necesitamos saber si falla: es el único canal fiable
            )
            email_sent = sent_count > 0
        except Exception as email_error:
            # La BD en Vercel es efímera (/tmp), así que si el email falla el
            # mensaje se pierde de verdad. Lo registramos con detalle para depurar.
            logger.error(f'Error al enviar email de contacto: {email_error}. IP: {ip_address}')
            print(f'Error al enviar email: {email_error}')
            email_sent = False

        if not email_sent:
            return JsonResponse({
                'success': False,
                'error': CONTACT_MESSAGES['email_failed'][lang],
            }, status=502)

        return JsonResponse({
            'success': True,
            'message': CONTACT_MESSAGES['success'][lang],
            'id': submission_id
        })

    except Ratelimited:
        logger.warning(f'Rate limit excedido. IP: {get_client_ip(request)}')
        return JsonResponse({
            'success': False,
            'error': CONTACT_MESSAGES['rate_limited'][get_lang_from_request(request)],
            'rate_limited': True
        }, status=429)
    except json.JSONDecodeError:
        logger.error(f'Error al parsear JSON. IP: {get_client_ip(request)}')
        return JsonResponse({
            'success': False,
            'error': CONTACT_MESSAGES['bad_json'][get_lang_from_request(request)]
        }, status=400)
    except Exception as e:
        logger.error(f'Error inesperado en submit_contact: {str(e)}. IP: {get_client_ip(request)}')
        return JsonResponse({
            'success': False,
            'error': CONTACT_MESSAGES['unexpected'][get_lang_from_request(request)]
        }, status=500)

def get_client_ip(request):
    """
    Obtiene la IP real del cliente
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
