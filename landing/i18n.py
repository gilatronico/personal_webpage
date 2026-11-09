"""
Traducción al inglés de la home.

El español vive en la plantilla (landing/templates/landing/home.html). Cada elemento
traducible lleva data-i18n="clave" (contenido), data-i18n-aria="clave" (aria-label) o
data-i18n-alt="clave" (alt). Para /en/ el servidor sustituye esos textos por los de EN,
así buscadores y lectores reciben la página ya en inglés (necesario para hreflang).
"""
import re
from html.parser import HTMLParser

EN = {
    'visit': 'Visit <span aria-hidden="true">↗</span>',
    'w3Markets': 'Markets',
    'w3MarketsAria': 'Markets',
    'w3Title': 'Web3 <em class="serif">Lab</em>',
    'w3Lede': 'I follow the assets connecting traditional finance with crypto infrastructure: live crypto prices, DeFi protocols and liquid staking.',
    'actCall': 'Book a 30-minute call',
    'actCallSub': 'Pick the slot that suits you',
    'actLi': 'Connect on LinkedIn',
    'actLiSub': 'Where I publish my articles',
    'actMail': 'Send an email',
    'artAll': 'See all on LinkedIn',
    'artTitle': 'What I write.',
    'careerLede': "Four blocks on the main chain, each built on the previous one, and two off it: what I've founded and where I invest. Tap a block to see the details.",
    'careerTitle': 'From code to <em class="serif">custody</em>.',
    'casesLede': 'Three product decisions, told the same way: the problem, what I decided and what changed.',
    'casesTitle': 'Case studies.',
    'contactLede': 'Product strategy for digital assets, a custody platform or a training program in blockchain and Web3. Share context and goals and we will agree next steps.',
    'contactSla': 'I reply personally',
    'contactTitle': 'Tell me what you want to <em class="serif">build</em>.',
    'coreSub': 'regulation',
    'criteria': 'Criteria',
    'ctaCall': 'Book a call',
    'ctaCv': 'Download CV',
    'footNav': 'Footer',
    'footPrivacy': 'Privacy and legal notice',
    'heroEyebrow': 'Alex Gilabert, Senior Product Manager at Bitpanda',
    'heroLede': "I've integrated custody into a bank's core banking system, taken the Travel Rule to production under MiCA and designed tokenized securities issuance under the EU DLT Pilot Regime.",
    'heroNfq': 'NFQ for BBVA',
    'heroTitle': 'I build the infrastructure institutions use to custody, tokenize and operate digital assets under <em class="serif">regulation</em>.',
    'heroTrack': 'Track record at',
    'howLede': 'I bring business, technology and risk teams together to turn a vision into a clear roadmap. If one of the three is missing, the product does not ship.',
    'howTitle': 'Product lives where business, technology and <em class="serif">regulation</em> meet.',
    'l0case': 'Real case, Onyze',
    'l0proof': 'Travel Rule and transaction monitoring built into the custody platform.',
    'l0text': 'If compliance arrives at the end, the product gets rebuilt. I design it from the first requirement, together with risk and legal.',
    'l0title': 'Regulation is a product requirement, not a final formality.',
    'l1case': 'Real case, Onyze for Creand',
    'l1proof': "API architecture for core banking and a crypto module inside Creand's online banking.",
    'l1text': 'A bank does not change its core to launch crypto. The product has to plug into what already works.',
    'l1title': 'API first, to fit the banking that already exists.',
    'l2case': 'Real case, Onyze',
    'l2proof': 'Collateral management for pledging financial instruments and digital assets on a regulated custody platform.',
    'l2text': 'I design collateral and pledge solutions so that crypto-assets and security tokens under custody can back financing, with the same rigour as a traditional asset.',
    'l2title': 'Making digital assets work as collateral, not just as investments.',
    'labCta': 'Open the Web3 Lab →',
    'labKicker': 'WEB3 LAB · LIVE DATA',
    'labLede': 'Stablecoins, tokenized deposits, the history of tokenization and a tool to choose your custody model.',
    'labTitle': 'Institutional money is already <em class="serif">onchain</em>.',
    'ledgerHint': 'tap a block',
    'lens0': 'Regulation',
    'lens1': 'Technology',
    'lens2': 'Business',
    'logoAria': 'AGR. Alex Gilabert, home',
    'menuAria': 'Menu',
    'menuOpen': 'Open menu',
    'navAria': 'Main',
    'navArticles': 'Articles',
    'navCareer': 'Career',
    'navCases': 'Cases',
    'navCta': "Let's talk",
    'navHow': 'How I work',
    'navTeaching': 'Teaching',
    'nextStage': 'Next stage',
    'pdrDecision': 'Decision',
    'pdrProblem': 'Problem',
    'pdrResult': 'Outcome',
    'photoAlt': 'Portrait of Alex Gilabert',
    'photoTag': 'Custody, tokenization and product',
    'prevStage': 'Previous stage',
    'stageDetail': 'Block details',
    'product': 'Product',
    'proposeCta': "Let's talk",
    'proposeText': 'A program for your team or university?',
    'skip': 'Skip to content',
    'teachLede': 'University lecturer and trainer in digital assets, blockchain, financial systems and Product Management. Explaining these concepts clearly is part of the same job.',
    'teachTitle': 'I teach what I build every day.',
    'themeToDark': 'Switch to dark mode',
    'vennTitle': 'Diagram: product sits where business, technology and regulation intersect',
}

VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}


def _set_attr(tag_text, name, value):
    value = value.replace('&', '&amp;').replace('"', '&quot;')
    pattern = re.compile(r'(\s%s=)"[^"]*"' % re.escape(name))
    if pattern.search(tag_text):
        return pattern.sub(lambda m: '%s"%s"' % (m.group(1), value), tag_text, count=1)
    end = '/>' if tag_text.endswith('/>') else '>'
    return tag_text[:-len(end)] + ' %s="%s"' % (name, value) + end


class _Translator(HTMLParser):
    def __init__(self, table):
        super().__init__(convert_charrefs=False)
        self.table, self.out = table, []
        self.skip_tag, self.depth = None, 0

    def _emit(self, s):
        if self.skip_tag is None:
            self.out.append(s)

    def handle_starttag(self, tag, attrs):
        text = self.get_starttag_text()
        if self.skip_tag is not None:
            if tag == self.skip_tag and tag not in VOID:
                self.depth += 1
            return
        a = dict(attrs)
        if a.get('data-i18n-aria') in self.table:
            text = _set_attr(text, 'aria-label', self.table[a['data-i18n-aria']])
        if a.get('data-i18n-alt') in self.table:
            text = _set_attr(text, 'alt', self.table[a['data-i18n-alt']])
        self.out.append(text)
        key = a.get('data-i18n')
        if key in self.table and tag not in VOID:
            self.out.append(self.table[key])
            self.skip_tag, self.depth = tag, 1

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if self.skip_tag is not None:
            if tag == self.skip_tag:
                self.depth -= 1
                if self.depth == 0:
                    self.skip_tag = None
                    self.out.append('</%s>' % tag)
            return
        self.out.append('</%s>' % tag)

    def handle_data(self, data):
        self._emit(data)

    def handle_entityref(self, name):
        self._emit('&%s;' % name)

    def handle_charref(self, name):
        self._emit('&#%s;' % name)

    def handle_comment(self, data):
        self._emit('<!--%s-->' % data)

    def handle_decl(self, decl):
        self._emit('<!%s>' % decl)

    def handle_pi(self, data):
        self._emit('<?%s>' % data)

    def unknown_decl(self, data):
        self._emit('<![%s]>' % data)


def translate_html(html, table=EN):
    t = _Translator(table)
    t.feed(html)
    t.close()
    return ''.join(t.out)
