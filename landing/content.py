"""
Contenido editable de la home (alexgilabert.xyz).

Todo lo que lleva [TODO] lo tiene que aportar Alex. Mientras un bloque contenga
[TODO], solo se muestra en local (DEBUG=True); en producción se oculta solo, así
nunca se publica un placeholder por accidente.

Cada texto va en ES y EN: {'es': '...', 'en': '...'}.
"""

TODO = '[TODO'

# Email público de contacto. Para pasar al dominio propio basta con cambiar esta línea
# (o definir CONTACT_EMAIL en las variables de entorno de Vercel).
# Antes de activarlo, comprueba que hola@alexgilabert.xyz recibe correo.
CONTACT_EMAIL_CURRENT = 'agilabertcomunicaciones@gmail.com'
CONTACT_EMAIL_DOMAIN = 'hola@alexgilabert.xyz'
CONTACT_EMAIL_DEFAULT = CONTACT_EMAIL_CURRENT

# Secciones ocultas. "Ocultar" = enabled False: el código y el contenido se conservan; para
# volver a mostrarlas basta con poner enabled True.
#   cases        sección "Casos de estudio" (y su enlace en el nav)
#   lab_stocks   pestaña "Acciones Cripto" del Web3 Lab
#   lab_strategy pestaña "Strategy Explorer" del Web3 Lab y la tarjeta del simulador en la home
SECTIONS = {
    'cases': {'enabled': False},
    'lab_stocks': {'enabled': False},
    'lab_strategy': {'enabled': False},
}


def section_enabled(key):
    return SECTIONS.get(key, {}).get('enabled', True)


# Foto del hero. Si preparas una versión recortada (PNG sin fondo), indica aquí su
# ruta dentro de static/ y el hero la mostrará sobre el fondo tintado con el acento.
HERO_PHOTO_CUTOUT = None  # p. ej. 'images/alex-gilabert-recorte.png'

# Cifras del hero (de la web anterior)
STATS = [
    {'n': '5+', 'label': {'es': 'años en fintech y Web3', 'en': 'years in fintech and Web3'}},
    {'n': '4', 'label': {'es': 'instituciones (docencia)', 'en': 'institutions (teaching)'}},
    {'n': '15+', 'label': {'es': 'proyectos', 'en': 'projects'}},
]

# Casos de estudio: Problema → Decisión → Resultado. No inventar métricas.
CASES = [
    {
        'org': 'Onyze · Credit Andorra (Creand)',
        'year': '2024–2026',
        'title': {
            'es': 'Módulo cripto en la banca online de Credit Andorra',
            'en': "Crypto module in Credit Andorra's online banking",
        },
        'problem': {'es': '[TODO: qué necesitaba el banco y qué lo hacía difícil]',
                    'en': '[TODO: what the bank needed and what made it hard]'},
        'decision': {'es': '[TODO: qué decidiste y por qué (arquitectura, alcance, proveedor…)]',
                     'en': '[TODO: what you decided and why]'},
        'result': {'es': '[TODO: resultado verificable, sin cifras que no puedas respaldar]',
                   'en': '[TODO: verifiable outcome]'},
        'tags': ['Core banking', 'API-first', {'es': 'Custodia', 'en': 'Custody'}],
        'link': 'https://creand.ad/es/personas/ahorro-e-inversion/cryptowallet/',
    },
    {
        'org': 'Onyze',
        'year': '2024–2026',
        'title': {'es': 'Integración de la Travel Rule', 'en': 'Travel Rule integration'},
        'problem': {'es': '[TODO: obligación regulatoria y punto de partida]',
                    'en': '[TODO: regulatory obligation and starting point]'},
        'decision': {'es': '[TODO: enfoque elegido y alternativas descartadas]',
                     'en': '[TODO: chosen approach and discarded alternatives]'},
        'result': {'es': '[TODO: resultado]', 'en': '[TODO: outcome]'},
        'tags': ['Travel Rule', 'Compliance', 'MiCA'],
        'link': None,
    },
    {
        'org': 'Onyze',
        'year': '2024–2026',
        'title': {'es': 'Herramienta de transaction monitoring', 'en': 'Transaction monitoring tool'},
        'problem': {'es': '[TODO: qué riesgo había que controlar y cómo se hacía antes]',
                    'en': '[TODO: risk to control and how it was handled before]'},
        'decision': {'es': '[TODO: decisión de producto clave]',
                     'en': '[TODO: key product decision]'},
        'result': {'es': '[TODO: resultado]', 'en': '[TODO: outcome]'},
        'tags': ['AML', {'es': 'Riesgo', 'en': 'Risk'}, {'es': 'Producto', 'en': 'Product'}],
        'link': None,
    },
]

# Trayectoria (career.ledger), en orden cronológico: es también el orden de las flechas.
#   kind: 'genesis' (primer bloque), 'main' (cadena principal), 'sidechain' (en paralelo,
#   sale de la cadena principal) o 'staking' (posición fuera de la cadena).
#   events: hitos con fecha que aparecen en el panel "Eventos". Si un bloque no tiene,
#   el panel se oculta. Todo lo que lleve [TODO] solo se ve en local.
#   logo: ruta dentro de static/ (PNG/SVG con fondo transparente); se pinta monocromo.
EV_TODO = [  # plantilla para futuros bloques sin hitos todavía
    {'date': '[TODO mm/aaaa]', 'text': {'es': '[TODO: hito concreto]', 'en': '[TODO: concrete milestone]'},
     'detail': {'es': '[TODO: detalle]', 'en': '[TODO: detail]'}},
    {'date': '[TODO mm/aaaa]', 'text': {'es': '[TODO: hito concreto]', 'en': '[TODO: concrete milestone]'},
     'detail': {'es': '[TODO: detalle]', 'en': '[TODO: detail]'}},
]


def ev(date, es, en, detail_es, detail_en):
    """Hito del panel "Eventos": título, línea de detalle y fecha (en mono, a la derecha)."""
    return {'date': date, 'text': {'es': es, 'en': en}, 'detail': {'es': detail_es, 'en': detail_en}}


# Los hitos van en orden cronológico (el más antiguo primero): el panel los muestra al revés,
# con el más reciente arriba. Los hitos NO se repiten en los bullets del panel derecho.
LEDGER = [
    {
        'key': 'sopra', 'kind': 'genesis', 'no': '#0000', 'hash': '0x3f1a…09c2',
        'role': 'Java Developer', 'org_short': 'Sopra Steria', 'years': {'es': '2019', 'en': '2019'},
        'org': {'es': 'Sopra Steria, tecnología bancaria', 'en': 'Sopra Steria, banking technology'},
        'logo': 'images/companies/sopra-steria.png', 'logo_w': 150,
        'period': {'es': 'sept 2019 a may 2021', 'en': 'Sep 2019 to May 2021'},
        'step': {'es': 'Bloque génesis, código', 'en': 'Genesis block, code'},
        'desc': {'es': 'Desarrollo back-end y front-end de aplicaciones web de pagos bancarias para Crédit Agricole Payment Systems (CAPS), tanto evolutivos como soporte en producción.',
                 'en': 'Back-end and front-end development of banking payment web applications for Crédit Agricole Payment Systems (CAPS), covering both new developments and production support.'},
        'list_title': None,
        'bullets': [],
        'chips': ['Java', {'es': 'Pagos', 'en': 'Payments'}, {'es': 'Banca', 'en': 'Banking'}],
        'events': [
            ev('2019', 'Proyecto CAPS, Crédit Agricole Payment Systems', 'CAPS project, Crédit Agricole Payment Systems',
               'Aplicaciones web del sistema de pagos del banco', "Web applications for the bank's payment system"),
            ev('2020', 'Evolutivos y soporte en producción', 'New developments and production support',
               'Desarrollo back-end y front-end en Java', 'Back-end and front-end development in Java'),
        ],
    },
    {
        'key': 'nfq', 'kind': 'main', 'no': '#0001', 'hash': '0x8b7e…4d10',
        'role': 'Murex Consultant', 'org_short': {'es': 'NFQ para BBVA', 'en': 'NFQ for BBVA'},
        'years': {'es': '2021', 'en': '2021'},
        'org': {'es': 'NFQ Advisory, para BBVA', 'en': 'NFQ Advisory, for BBVA'},
        'logo': 'images/companies/nfq.png', 'logo_w': 20,
        'period': {'es': 'oct 2021 a abr 2024', 'en': 'Oct 2021 to Apr 2024'},
        'step': {'es': 'Etapa 2 de 4, riesgo', 'en': 'Stage 2 of 4, risk'},
        'desc': {'es': 'Consultor Murex para BBVA CIB y BBVA México: riesgo de mercado, procesamiento pre-trade y post-trade, datamarts y arquitectura de servidores en entornos productivos.',
                 'en': 'Murex consultant for BBVA CIB and BBVA Mexico: market risk, pre-trade and post-trade processing, datamarts and server architecture in production environments.'},
        'list_title': None,
        'bullets': [
            {'es': 'Arquitectura de servidores basada en microservicios, on-premise', 'en': 'Microservices-based, on-premise server architecture'},
            {'es': 'Datamarts: tablas feeder y extracciones batch', 'en': 'Datamarts: feeder tables and batch extractions'},
            {'es': 'Reingeniería de procesos y módulos de back-office', 'en': 'Process and back-office module re-engineering'},
        ],
        'chips': ['Murex', {'es': 'Riesgo de mercado', 'en': 'Market risk'}, 'Control-M', 'Datamart'],
        'events': [
            ev('2022', 'Reglas pre-trade y post-trade en Murex', 'Pre-trade and post-trade rules in Murex',
               'Processing templates para BBVA CIB', 'Processing templates for BBVA CIB'),
            ev('2023', 'Límites de riesgo de mercado para BBVA México', 'Market risk limits for BBVA Mexico',
               'Implementación, integración y automatización con Control-M', 'Implementation, integration and automation with Control-M'),
        ],
    },
    {
        'key': 'onyze', 'kind': 'main', 'no': '#0002', 'hash': '0xc402…77ab',
        'role': 'Head of Product & Digital Assets', 'org_short': 'Onyze', 'years': {'es': '2024', 'en': '2024'},
        'org': {'es': 'Onyze, custodia de activos digitales', 'en': 'Onyze, digital asset custody'},
        'logo': 'images/companies/onyze.png', 'logo_w': 87,
        'period': {'es': 'abr 2024 a may 2026', 'en': 'Apr 2024 to May 2026'},
        # Product Owner abr 2024 – ene 2025; Head of Product desde ene 2025
        'evolution': {'es': 'Product Owner → Head of Product', 'en': 'Product Owner → Head of Product'},
        'step': {'es': 'Etapa 3 de 4, custodia', 'en': 'Stage 3 of 4, custody'},
        'desc': {'es': 'Responsable de producto de una plataforma de custodia, tokenización y cuentas de valores descentralizadas para banca e instituciones, con el cumplimiento normativo como requisito de diseño.',
                 'en': 'Product lead for a custody, tokenization and decentralized securities account platform for banks and institutions, with regulatory compliance as a design requirement.'},
        'list_title': None,
        'bullets': [
            {'es': 'Obtención de la autorización de la Autoridad Financera Andorrana (AFA) para custodia y exchange de activos digitales bajo la Llei 24/2022, primera filial internacional de Onyze',
             'en': "Securing the authorisation of the Andorran Financial Authority (AFA) for digital asset custody and exchange under Llei 24/2022, Onyze's first international subsidiary"},
            {'es': 'Plataforma de capital markets para la emisión de deuda y equity tokenizados bajo el régimen piloto DLT, con un ERIR como entidad registradora',
             'en': 'Capital markets platform for issuing tokenized debt and equity under the DLT Pilot Regime, with an ERIR as registrar entity'},
            {'es': 'Gestión de colateral para la pignoración de instrumentos financieros y activos digitales',
             'en': 'Collateral management for pledging financial instruments and digital assets'},
            {'es': 'Soluciones in-house de PBC/FT y AML', 'en': 'In-house AML/CFT solutions'},
        ],
        'chips': [{'es': 'Custodia', 'en': 'Custody'}, {'es': 'Tokenización', 'en': 'Tokenization'}, 'MiCA', {'es': 'Régimen piloto DLT', 'en': 'DLT Pilot Regime'}],
        'events': [
            ev('2025', 'Travel Rule bajo MiCA', 'Travel Rule under MiCA',
               'Del discovery a producción: datos de ordenante y beneficiario en cada transferencia cripto, como exige el Reglamento de transferencias (TFR) para CASPs.',
               'From discovery to production: originator and beneficiary data on every crypto transfer, as required by the Transfer of Funds Regulation (TFR) for CASPs.'),
            ev('2025', 'Custody-as-a-Service en el core banking de Creand', 'Custody-as-a-Service in the core banking of Creand',
               'Integración en Avaloq para el banco andorrano', 'Avaloq integration for the Andorran bank'),
        ],
    },
    {
        'key': 'bitpanda', 'kind': 'main', 'no': '#0003', 'hash': '0x9c41…e2a7',
        'role': 'Senior Product Manager', 'org_short': 'Bitpanda', 'years': {'es': '2026', 'en': '2026'},
        'org': {'es': 'Bitpanda Enterprise', 'en': 'Bitpanda Enterprise'},
        'logo': 'images/companies/bitpanda.png', 'logo_w': 79, 'logo_h': 24,
        'period': {'es': 'jun 2026 a actual', 'en': 'Jun 2026 to present'},
        'step': {'es': 'Etapa 4 de 4, producto', 'en': 'Stage 4 of 4, product'},
        'desc': {'es': 'Senior PM en el brazo SaaS B2B de Bitpanda. Defino y priorizo producto para la plataforma de Custody-as-a-Service dirigida a instituciones que quieren integrar activos digitales sin construir infraestructura propia.',
                 'en': "Senior PM at Bitpanda's B2B SaaS arm. I define and prioritise product for the Custody-as-a-Service platform for institutions that want digital assets without building their own infrastructure."},
        'list_title': None,
        'bullets': [
            {'es': 'Requerimientos de cumplimiento para custodia B2B (MiCA, BaFin, VASP)', 'en': 'Compliance requirements for B2B custody (MiCA, BaFin, VASP)'},
            {'es': 'Discovery del rol de la custodia en proyectos de tokenización', 'en': 'Discovery of the role of custody in tokenization projects'},
            {'es': 'Roadmap de CaaS: wallets, APIs y soporte multichain', 'en': 'CaaS roadmap: wallets, APIs and multichain support'},
            {'es': 'Soluciones de custodia a medida para instituciones financieras', 'en': 'Tailored custody solutions for financial institutions'},
        ],
        'chips': ['CaaS', 'MiCA', 'Staking', {'es': 'Tokenización', 'en': 'Tokenization'}],
        'events': [
            ev('2026', 'Chain expansion y staking', 'Chain expansion and staking',
               'Nuevas blockchains y productos de staking para clientes institucionales',
               'New blockchains and staking products for institutional clients'),
            ev('2026', 'Solución non-custodial para Deutsche Bank', 'Non-custodial solution for Deutsche Bank',
               'Integración de la tecnología de Bitpanda Enterprise en el servicio de custodia cripto institucional del banco',
               "Integration of Bitpanda Enterprise' technology into the bank's institutional crypto custody service"),
        ],
    },
    {
        'key': 'blockinvest', 'kind': 'sidechain', 'no': 'SC-01', 'hash': '0xa71c…3b90',
        'role': {'es': 'Cofundador', 'en': 'Co-founder'}, 'org_short': 'Block Invest', 'years': {'es': '2021–2023', 'en': '2021–2023'},
        'org': {'es': 'Block Invest', 'en': 'Block Invest'},
        'logo': 'images/companies/block-invest.png', 'logo_w': 22, 'logo_h': 28,
        'period': {'es': 'nov 2021 a ago 2023', 'en': 'Nov 2021 to Aug 2023'},
        'step': {'es': 'Sidechain', 'en': 'Sidechain'},
        'desc': {'es': 'Proyecto de divulgación y formación en blockchain, desde los fundamentos técnicos hasta el análisis DeFi.',
                 'en': 'Blockchain outreach and training project, from the technical fundamentals to DeFi analysis.'},
        'list_title': None,
        'bullets': [
            {'es': 'Formación en activos digitales y blockchain: fundamentos técnicos, custodia, wallets y DeFi',
             'en': 'Training in digital assets and blockchain: technical fundamentals, custody, wallets and DeFi'},
            {'es': 'Análisis fundamental de proyectos y protocolos', 'en': 'Fundamental analysis of projects and protocols'},
        ],
        'chips': ['Solidity', 'DeFi', {'es': 'Formación', 'en': 'Training'}],
        'events': [
            ev('2022', 'Estrategias de yield farming en DeFi', 'Yield farming strategies in DeFi',
               'Análisis fundamental de protocolos y ejecución', 'Fundamental analysis of protocols and execution'),
            ev('2022', 'Contratos inteligentes en Solidity', 'Smart contracts in Solidity',
               'Desarrollo e implementación en web3', 'Development and deployment on web3'),
        ],
    },
    {
        'key': 'aticco', 'kind': 'staking', 'no': 'STK-01', 'hash': '0x5e02…f1c4',
        'role': {'es': 'Inversor', 'en': 'Investor'}, 'org_short': 'Aticco Lab',
        'years': {'es': 'actual', 'en': 'present'},
        'org': {'es': 'Aticco Lab', 'en': 'Aticco Lab'},
        'logo': 'images/companies/aticco-lab.png', 'logo_w': 56, 'logo_h': 26,
        'period': {'es': 'Actual', 'en': 'Present'},
        'step': {'es': 'Staking', 'en': 'Staking'},
        'desc': {'es': 'Invierto en startups en fase pre-seed y seed a través del ecosistema de Aticco Lab, la aceleradora y plataforma de emprendimiento de Aticco, que conecta inversores con proyectos seleccionados y acompañados por su red de mentores.',
                 'en': "I invest in pre-seed and seed startups through the Aticco Lab ecosystem, Aticco's accelerator and entrepreneurship platform, which connects investors with projects selected and supported by its network of mentors."},
        'list_title': None,
        'bullets': [
            {'es': 'Análisis de oportunidades early-stage seleccionadas por Aticco Lab', 'en': 'Analysis of early-stage opportunities selected by Aticco Lab'},
            {'es': 'Acceso a dealflow de startups con MVP y primeras métricas', 'en': 'Access to dealflow of startups with an MVP and first metrics'},
            {'es': 'Visión de producto aplicada a la evaluación de equipos y modelos de negocio', 'en': 'Product vision applied to evaluating teams and business models'},
        ],
        'chips': ['Venture', 'Early-stage', 'Startups'],
        'events': [
            ev({'es': 'Actual', 'en': 'Present'}, 'Evaluación de proyectos del programa de aceleración', 'Evaluation of projects from the acceleration program',
               'Criterio de producto y negocio sobre startups con tracción inicial', 'Product and business judgement on startups with early traction'),
            ev({'es': 'Actual', 'en': 'Present'}, 'Entrada en el ecosistema inversor de Aticco Lab', 'Joining the Aticco Lab investor ecosystem',
               'Coinversión en startups early-stage', 'Co-investment in early-stage startups'),
        ],
    },
]


# Docencia: instituciones. logo: ruta en static/; emblem = logo relleno (no se pinta monocromo).
# Los enlaces vienen de la web anterior (modal de docencia); el de BME no existía allí: es la web
# corporativa, cámbiala por la del curso si prefieres enlazar directamente a él.
TEACHING = [
    {'name': 'CEDEU', 'url': 'https://www.cedeu.es/',
     'logo': 'images/teaching/cedeu-logo.png', 'logo_w': 80, 'logo_h': 24,
     'kind': {'es': 'Universidad', 'en': 'University'},
     'desc': {'es': 'Profesor de blockchain y activos digitales para estudiantes universitarios.',
              'en': 'Lecturer in blockchain and digital assets for university students.'}},
    {'name': 'Santander Financial Institute', 'url': 'https://sanfi.es/',
     'logo': 'images/teaching/santander-logo.png', 'logo_w': 47, 'logo_h': 24,
     'kind': {'es': 'Formación profesional', 'en': 'Professional training'},
     'desc': {'es': 'Programas de producto, Web3 y cripto con foco en regulación y riesgo para profesionales del mercado financiero.',
              'en': 'Product, Web3 and crypto programs focused on regulation and risk for financial market professionals.'}},
    {'name': 'Medusa Capital', 'url': 'https://medusacapital.xyz/',
     'logo': 'images/teaching/medusa-logo.png', 'logo_w': 26, 'logo_h': 24, 'emblem': True,
     'kind': {'es': 'Programas', 'en': 'Programs'},
     'desc': {'es': 'Programas de blockchain y activos digitales para equipos que llevan producto a producción: arquitectura, modelos de custodia y cumplimiento.',
              'en': 'Blockchain and digital asset programs for teams taking product to production: architecture, custody models and compliance.'}},
    {'name': 'BME', 'url': 'https://www.bolsasymercados.es/',
     'logo': 'images/companies/bme.png', 'logo_w': 60, 'logo_h': 24,
     'kind': {'es': 'Mercados de capitales', 'en': 'Capital markets'},
     'desc': {'es': 'Curso Experto en Criptoactivos para profesionales de mercados de capitales.',
              'en': 'Crypto Assets Expert Course for capital markets professionals.'}},
]


# Bloque "Ahora": en qué estás. Edita libremente y actualiza la fecha.
def pick(value, lang):
    """Devuelve el texto en el idioma pedido si el valor es {'es':..,'en':..}."""
    if isinstance(value, dict):
        return value.get(lang) or value.get('es', '')
    return value


def has_todo(*values):
    for v in values:
        if isinstance(v, dict):
            if has_todo(*v.values()):
                return True
        elif isinstance(v, (list, tuple)):
            if has_todo(*v):
                return True
        elif isinstance(v, str) and TODO in v:
            return True
    return False


def localize(items, lang):
    """Aplana una lista de dicts al idioma pedido y marca los que tienen [TODO]."""
    out = []
    for item in items:
        flat = {k: [pick(x, lang) for x in v] if isinstance(v, list) else pick(v, lang)
                for k, v in item.items()}
        flat['has_todo'] = has_todo(item)
        out.append(flat)
    return out
