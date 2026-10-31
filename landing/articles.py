"""
Artículos alojados en la web: un .md por artículo en landing/content/articles/.
Ver el README de esa carpeta para el formato de la cabecera.
"""
import datetime
from functools import lru_cache
from pathlib import Path

import markdown

ARTICLES_DIR = Path(__file__).resolve().parent / 'content' / 'articles'

MONTHS = {
    'es': ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    'en': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}
# Si el artículo más reciente es más antiguo que esto, las fechas se muestran de forma discreta
STALE_AFTER_DAYS = 183


def _parse(path):
    raw = path.read_text(encoding='utf-8')
    meta, body = {}, raw
    if raw.startswith('---'):
        _, head, body = raw.split('---', 2)
        for line in head.strip().splitlines():
            if ':' in line:
                k, v = line.split(':', 1)
                meta[k.strip()] = v.strip().strip('"')
    parts = [int(p) for p in meta.get('date', '1970-01').split('-')]
    date = datetime.date(parts[0], parts[1], parts[2] if len(parts) > 2 else 1)
    return {
        'slug': path.stem,
        'title': meta.get('title', path.stem),
        'title_en': meta.get('title_en') or meta.get('title', path.stem),
        'tag': meta.get('tag', ''),
        'tag_en': meta.get('tag_en') or meta.get('tag', ''),
        'linkedin': meta.get('linkedin', ''),
        'excerpt': meta.get('excerpt', ''),
        'draft': meta.get('draft', 'false').lower() == 'true',
        'date': date,
        'has_day': len(parts) > 2,
        'body_md': body.strip(),
    }


@lru_cache(maxsize=1)
def _load_all(mtime_key):
    items = [_parse(p) for p in ARTICLES_DIR.glob('*.md') if p.name.lower() != 'readme.md']
    return sorted(items, key=lambda a: a['date'], reverse=True)


def all_articles():
    # La clave de caché cambia si se edita cualquier .md (útil en local)
    key = tuple(sorted((p.name, p.stat().st_mtime) for p in ARTICLES_DIR.glob('*.md')))
    return _load_all(key)


def get_article(slug):
    for a in all_articles():
        if a['slug'] == slug:
            return a
    return None


def render_body(article):
    return markdown.markdown(article['body_md'], extensions=['extra', 'sane_lists'])


def localized_list(lang, include_drafts_pages=False, today=None):
    """Lista para la home: título/etiqueta en el idioma, fecha y adónde enlazar."""
    today = today or datetime.date.today()
    items = all_articles()
    stale = bool(items) and (today - items[0]['date']).days > STALE_AFTER_DAYS
    out = []
    for a in items:
        m = MONTHS[lang][a['date'].month - 1]
        out.append({
            'slug': a['slug'],
            'title': a['title_en'] if lang == 'en' else a['title'],
            'tag': a['tag_en'] if lang == 'en' else a['tag'],
            'iso': a['date'].isoformat()[:7],
            # Fechas discretas cuando el último artículo ya tiene meses: solo el año
            'date_label': str(a['date'].year) if stale else f'{m} {a["date"].year}',
            # Borradores: la home enlaza al original de LinkedIn
            'url': a['linkedin'] if a['draft'] else f'/articulos/{a["slug"]}/',
            'external': a['draft'],
        })
    return out, stale
