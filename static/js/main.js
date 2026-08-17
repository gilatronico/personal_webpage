            // Dark/Light Mode Toggle
            (function () {
                const themeToggle = document.querySelector('.theme-toggle');
                const currentTheme = localStorage.getItem('theme') || 'light';

                document.documentElement.setAttribute('data-theme', currentTheme);
                updateThemeIcon(currentTheme);

                if (themeToggle) {
                    themeToggle.addEventListener('click', function () {
                        const current = document.documentElement.getAttribute('data-theme');
                        const newTheme = current === 'dark' ? 'light' : 'dark';

                        document.documentElement.setAttribute('data-theme', newTheme);
                        localStorage.setItem('theme', newTheme);
                        updateThemeIcon(newTheme);
                    });
                }

                function updateThemeIcon(theme) {
                    if (!themeToggle) return;
                    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
                    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
                }
            })();

            // Section Navigation (Experiencia, Web3, Blog)
            (function () {
                const sectionLinks = document.querySelectorAll('.nav-section-link');
                const sections = {
                    'experiencia': document.getElementById('experiencia'),
                    'web3': document.getElementById('web3'),
                    'blog': document.getElementById('blog')
                };

                // Show experiencia by default
                function showSection(sectionId) {
                    // Hide all sections
                    Object.values(sections).forEach(section => {
                        if (section) {
                            section.classList.remove('active');
                            section.style.setProperty('display', 'none', 'important');
                            section.style.setProperty('visibility', 'hidden', 'important');
                        }
                    });

                    // Show selected section
                    if (sections[sectionId]) {
                        sections[sectionId].classList.add('active');
                        sections[sectionId].style.setProperty('display', 'block', 'important');
                        sections[sectionId].style.setProperty('visibility', 'visible', 'important');
                        sections[sectionId].style.setProperty('opacity', '1', 'important');

                        // Load data when Web3 section is shown
                        if (sectionId === 'web3') {
                            // Use setTimeout to ensure DOM is ready
                            setTimeout(() => {
                                // Load market data if not already loaded
                                if (typeof loadMarketData === 'function') {
                                    const defiGrid = document.getElementById('defi-grid');
                                    const stakingGrid = document.getElementById('staking-grid');
                                    const needsLoad = (defiGrid && (defiGrid.innerHTML.includes('loading') || defiGrid.innerHTML.includes('Cargando') || defiGrid.innerHTML.trim() === '')) ||
                                        (stakingGrid && (stakingGrid.innerHTML.includes('loading') || stakingGrid.innerHTML.includes('Cargando') || stakingGrid.innerHTML.trim() === ''));
                                    if (needsLoad) {
                                        loadMarketData();
                                    }
                                }
                                // Load crypto prices if not already loaded
                                if (typeof fetchCryptoPrices === 'function') {
                                    // Buscar el grid en la sección visible
                                    const marketIntelligence = document.getElementById('market-intelligence');
                                    const cryptoGrid = marketIntelligence ? marketIntelligence.querySelector('#cryptoPricesGrid') : document.getElementById('cryptoPricesGrid');
                                    if (cryptoGrid && (cryptoGrid.innerHTML.includes('loading') || cryptoGrid.innerHTML.includes('Cargando') || cryptoGrid.innerHTML.trim() === '' || cryptoGrid.querySelector('.crypto-loading'))) {
                                        // Esperar un poco más para asegurar que el DOM esté listo
                                        setTimeout(() => {
                                            fetchCryptoPrices();
                                            setupCryptoScrollListeners();
                                        }, 200);
                                    }
                                }
                            }, 100);
                        }
                    }

                    // Update nav links
                    sectionLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('data-section') === sectionId) {
                            link.classList.add('active');
                        }
                    });

                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }

                // Handle nav clicks
                sectionLinks.forEach(link => {
                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        const sectionId = this.getAttribute('data-section');
                        showSection(sectionId);

                        // Update URL hash without scrolling
                        if (history.pushState) {
                            history.pushState(null, null, '#' + sectionId);
                        }
                    });
                });

                // Contact link lives inside the "experiencia" section: switch tab then scroll
                const contactLink = document.querySelector('.nav-contact-link');
                if (contactLink) {
                    contactLink.addEventListener('click', function (e) {
                        e.preventDefault();
                        showSection('experiencia');
                        setTimeout(() => {
                            const contactSection = document.getElementById('contact');
                            if (contactSection) {
                                contactSection.scrollIntoView({ behavior: 'smooth' });
                            }
                        }, 150);
                    });
                }

                // Handle hash on load
                window.addEventListener('load', function () {
                    const hash = window.location.hash.substring(1);
                    if (hash && sections[hash]) {
                        showSection(hash);
                    } else {
                        showSection('experiencia');
                    }
                });

                // Handle browser back/forward
                window.addEventListener('popstate', function () {
                    const hash = window.location.hash.substring(1);
                    if (hash && sections[hash]) {
                        showSection(hash);
                    } else {
                        showSection('experiencia');
                    }
                });
            })();

            // Smooth Scroll & Active Nav (only for internal links within sections)
            (function () {
                const navLinks = document.querySelectorAll('.nav-menu a:not(.nav-section-link)');
                const sections = document.querySelectorAll('section[id]');

                function updateActiveNav() {
                    let current = '';
                    const scrollY = window.pageYOffset;

                    sections.forEach(section => {
                        const sectionTop = section.offsetTop - 150;
                        const sectionHeight = section.offsetHeight;

                        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                            current = section.getAttribute('id');
                        }
                    });

                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${current}`) {
                            link.classList.add('active');
                        }
                    });
                }

                window.addEventListener('scroll', updateActiveNav);
                updateActiveNav();
            })();

            // Fade-in Animations
            (function () {
                const observerOptions = {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                };

                const observer = new IntersectionObserver(function (entries) {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            observer.unobserve(entry.target);
                        }
                    });
                }, observerOptions);

                document.querySelectorAll('.fade-in').forEach(el => {
                    observer.observe(el);
                });
            })();

            // Timeline Animation
            (function () {
                const timelineItems = document.querySelectorAll('.timeline-item');

                const timelineObserver = new IntersectionObserver(function (entries) {
                    entries.forEach((entry, index) => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                entry.target.classList.add('visible');
                            }, index * 200); // Stagger animation
                            timelineObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.2, rootMargin: '0px 0px -100px 0px' });

                timelineItems.forEach(item => {
                    timelineObserver.observe(item);
                });
            })();

            // Skills Bar Animation
            (function () {
                const skillsSection = document.querySelector('#skills');
                if (!skillsSection) return;

                const skillBars = document.querySelectorAll('.skill-bar-fill');
                let hasAnimated = false;

                const skillsObserver = new IntersectionObserver(function (entries) {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !hasAnimated) {
                            hasAnimated = true;
                            skillBars.forEach((bar, index) => {
                                setTimeout(() => {
                                    const level = bar.closest('.skill-item').getAttribute('data-level');
                                    if (level === '3') {
                                        bar.style.width = '100%';
                                    } else if (level === '2') {
                                        bar.style.width = '66.66%';
                                    } else {
                                        bar.style.width = '33.33%';
                                    }
                                }, index * 100);
                            });
                            skillsObserver.disconnect();
                        }
                    });
                }, { threshold: 0.3 });

                skillsObserver.observe(skillsSection);
            })();

            // Counter Animation
            (function () {
                const counters = document.querySelectorAll('.stat-value.counter');
                let hasAnimated = false;

                const animateCounter = (counter) => {
                    const target = parseInt(counter.getAttribute('data-target'));
                    const suffix = counter.getAttribute('data-suffix') || '';
                    const duration = 2000; // 2 seconds
                    const increment = target / (duration / 16); // 60fps
                    let current = 0;

                    counter.classList.add('animating');

                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            counter.textContent = Math.floor(current) + suffix;
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = target + suffix;
                            counter.classList.remove('animating');
                        }
                    };

                    updateCounter();
                };

                const counterObserver = new IntersectionObserver(function (entries) {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !hasAnimated) {
                            hasAnimated = true;
                            counters.forEach(counter => {
                                animateCounter(counter);
                            });
                            counterObserver.disconnect();
                        }
                    });
                }, { threshold: 0.5 });

                if (counters.length > 0) {
                    const statsSection = document.querySelector('.hero-stats');
                    if (statsSection) {
                        counterObserver.observe(statsSection);
                    }
                }
            })();

            // Language Switcher with Translations
            const translations = {
                es: {
                    // Navigation
                    navProduct: 'Producto & Web3',
                    navTeaching: 'Docencia',
                    navArticles: 'Artículos',
                    navExperiencia: 'Experiencia',
                    navWeb3: 'Web3',
                    navContact: 'Contacto',
                    navSchedule: 'Agendar una llamada',
                    // Hero
                    heroSubtitle1: 'Senior Product Manager en Bitpanda | Custodia de Activos Digitales | Tokenización | DeFi | Infraestructura de Pagos',
                    heroSubtitle2: 'Diseño y lidero productos de custodia, tokenización y brokeraje para banca, fintechs y empresas Web3, alineando regulación, seguridad y negocio.',
                    heroSubtitle3: 'Conecto la infraestructura financiera tradicional con la innovación en activos digitales, combinando experiencia en arquitectura cloud y on‑premise, ciberseguridad y automatización de workflows para generar impacto real.',
                    heroCta1: 'Ver portfolio de producto',
                    heroCta2: 'Agendar una llamada estratégica',
                    heroDownloadCv: 'Descargar CV',
                    downloadCvContact: 'Descargar CV en PDF',
                    // About me
                    aboutTitle: 'Sobre mí',
                    aboutText: 'Empecé escribiendo backend en Java para sistemas de liquidación bancaria, aprendiendo desde dentro cómo funciona la infraestructura financiera tradicional. De ahí pasé a consultoría de riesgos de mercado con Murex y FRTB para BBVA, donde entendí cómo la banca mide, reporta y gestiona el riesgo a escala regulada. Ese conocimiento de sistemas y regulación es lo que me llevó a producto: primero liderando la evolución de una plataforma de custodia de activos digitales para banca e institucional, y hoy diseñando Custody-as-a-Service B2B en Bitpanda. En paralelo, imparto docencia en activos digitales y Product Management en CEDEU, Santander Financial Institute y Medusa Capital, porque explicar estos conceptos con claridad es, para mí, parte del mismo trabajo de conectar tecnología y negocio.',
                    // Stats
                    statYears: 'Años fintech & Web3',
                    statUniversities: 'Universidades (docencia)',
                    statProjects: 'Proyectos completados',
                    // Product Section
                    productTitle: 'Producto & Web3',
                    productDesc: 'Diseño y lidero productos Web3 y relacionados con activos digitales, conectando visión de negocio, tecnología y equipos para completar el ciclo de vida completo.',
                    card1Title: 'Infra Web3 & Activos Digitales',
                    card1Desc: 'Diseño plataformas de activos digitales construidas sobre wallets, custodia y servicios on‑chain, integradas con sistemas bancarios, fintech y DeFi. Trabajo sobre las bases de seguridad y cumplimiento normativo.',
                    card2Title: 'Liderazgo de Producto & proyectos',
                    card2Desc: 'Lidero la toma de decisiones de producto de principio a fin: qué problemas resolver, qué priorizar y cómo medir el impacto. Conecto equipos de negocio, tecnología y riesgo para transformar la visión en un roadmap claro.',
                    card3Title: 'Conceptualización y desarrollo',
                    card3Desc: 'Combino descubrimiento continuo y experimentación para validar qué construir y por qué. Acompaño la entrega con procesos documentados claros que permiten iterar rápido sin perder calidad ni seguridad.',
                    // Projects
                    bitpandaDesc: 'Custody-as-a-Service B2B para bancos y fintechs: roadmap, wallets, APIs y soporte multichain para clientes institucionales.',
                    onyzeDesc: 'Evolución de la plataforma SaaS de custodia, brokeraje y tokenización: roadmap, diseño de APIs y cumplimiento normativo.',
                    nfqDesc: 'Consultor Murex para riesgos de mercado FRTB en BBVA: automatización de workflows críticos y arquitectura de datos regulatoria.',
                    sopraDesc: 'Desarrollo backend en Java para procesos de liquidación y reporting en banca, con foco en clean code y despliegues productivos.',
                    metricArchitecture: 'Arquitectura',
                    metricOrchestration: 'Orquestación procesos',
                    metricScalability: 'Escalabilidad',
                    metricSecurity: 'Seguridad',
                    metricTimeReduction: 'Tecnología',
                    // Market Intelligence Section
                    marketIntelligenceKicker: 'Market Intelligence',
                    marketIntelligenceTitle: 'Crypto & DeFi',
                    marketIntelligenceDesc: 'Principales protocolos DeFi y liquid staking. Datos en tiempo real desde DefiLlama.',
                    marketTabDefi: 'Protocolos DeFi',
                    marketTabStaking: 'Liquid Staking',
                    marketLoadingProtocols: 'Cargando protocolos...',
                    marketLoadingStaking: 'Cargando protocolos de staking...',
                    marketViewProtocol: 'Ver protocolo',
                    marketNoProtocols: 'No se encontraron protocolos',
                    market7dChange: 'Cambio 7d',
                    marketGrowing: 'Creciendo',
                    marketDeclining: 'Bajando',
                    marketProtocolFallback: 'Protocolo',
                    marketPoweredBy: 'Datos actualizados en tiempo real •',
                    // Crypto Section (hidden)
                    cryptoKicker: 'Datos en tiempo real',
                    cryptoTitle: 'Mercado de criptoactivos',
                    cryptoSubtitle: 'Lista de activos que sigo para producto y gestión de tesorería digital.',
                    cryptoLoading: 'Cargando cotizaciones...',
                    cryptoTimestamp: 'Datos en tiempo real proporcionados por CoinGecko · Última actualización:',
                    cryptoRefresh: 'Refrescar mercado',
                    cryptoUpdating: 'Actualizando...',
                    cryptoError: '⚠️ Error al cargar cotizaciones. Intenta de nuevo en unos momentos.',
                    marketFooterUpdated: 'Datos actualizados en tiempo real',
                    poweredBy: 'Datos de DefiLlama',
                    footerPrivacy: 'Política de privacidad y aviso legal',
                    menuOpen: 'Abrir menú',
                    menuClose: 'Cerrar menú',
                    marketCapLabel: 'Cap. de mercado',
                    // Experience
                    experienceTitle: 'Experiencia Profesional',
                    experienceDesc: '',
                    timelineBitpanda: 'Senior PM en Bitpanda Technology Solutions, el brazo SaaS B2B de Bitpanda. Defino y priorizo requerimientos de producto para la plataforma de Custody-as-a-Service dirigida a clientes institucionales que quieren integrar activos digitales sin construir infraestructura propia.',
                    timelineBitpandaCompany: 'Bitpanda · Jun 2026 – Presente',
                    timelineOnyze: 'Responsable del área de producto. Diseño y conceptualizo la evolución de la plataforma SaaS de custodia, brokeraje y tokenización, definiendo roadmap, diseño de APIs y casos de uso para banca, institucional y fintechs. Prioridad en seguridad y cumplimiento normativo para el despliegue de una infraestructura de activos digitales en entornos regulados.',
                    timelineOnyzeCompany: 'Onyze (Digital Asset Custody) · 2024 – Mayo 2026',
                    timelineNfq: 'Consultor Murex para proyectos de riesgos de mercado FRTB para BBVA, automatización de workflows críticos y arquitectura de datos para banca, combinando Control‑M, microservicios y datamarts regulatorios. Resultados en eficiencia operativa, calidad de reporting y resiliencia de sistemas de trading y riesgo.',
                    timelineSopra: 'Desarrollador de servicios y módulos backend en Java para procesos de liquidación, reporting y operaciones diarias, siguiendo principios de clean code y patrones de diseño. Participé en el ciclo completo de desarrollo (análisis, diseño, pruebas y despliegue), aportando documentación técnica y soporte en la puesta en producción.',
                    achievementBitpanda1: 'Conceptualización y desarrollo de requerimientos de cumplimiento normativo para productos de custodia B2B en jurisdicciones reguladas (MiCA, BaFin, VASP)',
                    achievementBitpanda2: 'Diseño de soluciones de custodia ad-hoc para instituciones financieras que expanden su catálogo a activos digitales',
                    achievementBitpanda3: 'Definición del roadmap de Custody-as-a-Service como proveedor SaaS B2B, incluyendo gestión de wallets, integración de APIs y soporte multichain',
                    achievementBitpanda4: 'Expansión de la oferta de tokens y blockchains soportados, ampliando el catálogo de activos disponibles para clientes institucionales',
                    achievement1: 'Evolución y diseño de Crypto-as-a-service',
                    achievement2: 'Arquitectura API para integraciones con core banking',
                    achievement3: 'Desarrollo de herramienta de cumplimiento normativa Transaction monitoring',
                    achievement4: 'Desarrollo e integración de la Travel Rule en la regulación de transferencia de fondos.',
                    achievementCollateral: 'Gestión de collateral para activos digitales',
                    achievement5: 'Despliegue de módulo crypto en la banca online de Credit Andorra.',
                    achievement6: 'Automatización de procesos críticos con Control-M',
                    achievement7: 'Arquitectura de microservicios para banca',
                    achievement8: 'Despliegues CI/CD en entornos productivos',
                    achievement9: 'Desarrollo en Murex BBVA del instrumento BRS (Bond Return Swaps)',
                    achievement10: 'Desarrollo de componentes core para sistemas bancarios',
                    achievement11: 'Implementación de estándares de seguridad financiera',
                    // Skills
                    skillsTitle: 'Competencias Principales',
                    skillsDesc: 'Combinación de liderazgo de producto, expertise en activos digitales y base técnica para diseñar productos seguros, escalables y alineados con regulación.',
                    skillCategoryProduct: 'Producto y Liderazgo',
                    skillCategoryBlockchain: 'Blockchain y Activos Digitales',
                    skillCategoryTech: 'Tecnología y Arquitectura',
                    skillCategorySoft: 'Soft Skills',
                    productLeadership: 'Estrategia de producto, ownership extremo a extremo, priorización de roadmap, gestión de stakeholders y lanzamiento al mercado en entornos regulados.',
                    blockchainDesc: 'Custodia institucional, tokenización, DeFi y alineamiento regulatorio para infraestructuras de activos digitales.',
                    techDesc: 'Arquitecturas API-first, microservicios, cloud, datos y ciberseguridad aplicadas a plataformas financieras y Web3.',
                    softSkillsDesc: 'Automatización de procesos con Make y n8n, orquestación de agentes de IA e intelligent process automation para reducir fricción operativa.',
                    // Skill names
                    skillProductOwnership: 'Product Ownership',
                    skillRoadmappingGTM: 'Roadmapping y GTM',
                    skillUserResearch: 'Investigación de Usuarios',
                    skillStakeholderManagement: 'Gestión de Stakeholders',
                    skillAssetCustody: 'Custodia de Activos',
                    skillTokenization: 'Tokenización',
                    skillSmartContracts: 'Contratos Inteligentes',
                    skillDeFiProtocols: 'Protocolos DeFi',
                    skillControlM: 'Control-M',
                    skillAPIsMicroservices: 'APIs y Microservicios',
                    skillN8nMake: 'n8n / Make',
                    skillSQLJava: 'SQL / Java',
                    skillLeadership: 'Liderazgo',
                    skillTeachingMentoring: 'Docencia y Mentoring',
                    skillCommunication: 'Comunicación',
                    skillProblemSolving: 'Resolución de Problemas',
                    // Teaching
                    teachingTitle: 'Docencia & Formación',
                    teachingDesc: 'Profesor universitario y formador en Digital Assets, Blockchain, sistemas financieros y Product Management, conectando teoría con proyectos aplicados en entornos reales.',
                    cedeuDesc: 'Cursos sobre activos digitales, blockchain, APIs y producto, con un enfoque práctico en infraestructuras y flujos de sistemas financieros. Talleres y proyectos conectan conceptos académicos con casos de uso reales en banca, fintech y Web3.',
                    santanderDesc: 'Programas de formación en producto, Web3 y cripto para profesionales del mercado financiero, con un fuerte enfoque en regulación, riesgo y casos de uso institucionales. Las sesiones combinan práctica de mercado, marcos de supervisión y diseño de producto para bancos, brokers y gestores de activos.',
                    medusaDesc: 'Programas de blockchain y activos digitales para equipos que quieren pasar de forma segura de la teoría a implementaciones reales en producción. Trabajamos en arquitectura, modelos de custodia y marcos operativos para que los productos puedan escalar manteniéndose cumplidores y seguros.',
                    teachingCta: 'Solicita una consultoría',
                    // Articles
                    articlesTitle: 'Artículos & Publicaciones',
                    articlesDesc: 'Contenido sobre Product Management, Blockchain y Digital Assets con foco en aplicaciones reales para banca, fintech y empresas.',
                    article0Title: 'Aave Labs y DAO. El conflicto por el control',
                    article0Excerpt: 'El conflicto entre Aave Labs y la DAO por el control de activos estratégicos, revenue streams y gobernanza del protocolo. Análisis del caso de la integración con CoW Swap, donde Aave Labs capturó $10M en fees sin aprobación del DAO, y la propuesta de gobernanza para transferir dominios, marca y activos intelectuales al control de la comunidad.',
                    article0Link: 'Leer artículo',
                    article0Url: 'https://www.linkedin.com/pulse/aave-labs-y-dao-el-conflicto-por-control-alex-gilabert-l6yce/',
                    article1Title: '¿Se puede ser rentable con poco capital en pools de liquidez? Guía técnica de DAMM v2 (Meteora)',
                    article1Excerpt: 'DeFi no frena en verano. El pasado 31 de Julio apareció en escena el último producto lanzado al mercado por Meteora, uno de los protocolos más innovadores del entorno DeFi en Solana, pretende dar más opciones en la generación de comisiones a los proveedores de liquidez. DAMM v2 es un AMM de producto constante diseñado para optimizar la captura de comisiones por parte de los proveedores de liquidez (LPs) en cortos periodos de tiempo.',
                    article1Link: 'Leer artículo',
                    article1Url: 'https://www.linkedin.com/pulse/se-puede-ser-rentable-con-poco-capital-en-pools-de-v2-alejandro-nd58f/',
                    article2Title: 'Depósitos tokenizados, stablecoins y MMFs: shadow banking, colateral y la batalla por el dinero onchain',
                    article2Excerpt: 'En noviembre de 2025, vimos como JPMorgan lanzó JPM Coin, su depósito tokenizado en Base, la L2 desarrollada por Coinbase. Simultáneamente, stablecoins de emisores como Tether y Circle procesan más de $4 billones en transacciones de manera anual. Podemos identificar atisbos de una batalla silenciosa pero profunda en las trincheras de la blockchain: ¿quién controla el dinero onchain, cómo se emite y quién lo define?',
                    article2Link: 'Leer artículo',
                    article2Url: 'https://www.linkedin.com/pulse/dep%C3%B3sitos-tokenizados-stablecoins-y-mmfs-shadow-banking-alex-gilabert-clgse/',
                    article3Title: 'Product Roadmapping en Web3: Estrategias y Desafíos',
                    article3Excerpt: 'Claves para priorizar features y riesgos en productos Web3, equilibrando innovación, cumplimiento y mercado.',
                    article3Link: 'Leer más',
                    article4Title: 'Blockchain en Banca: Casos de Uso Reales',
                    article4Excerpt: 'Revisión de implementaciones reales de blockchain en banca, lecciones aprendidas y buenas prácticas para proyectos enterprise.',
                    article4Link: 'Leer artículo',
                    article5Title: 'Arquitectura de Microservicios para Fintech',
                    article5Excerpt: 'Patrones arquitectónicos para sistemas fintech escalables: orquestación, resiliencia y compliance en arquitecturas distribuidas.',
                    article5Link: 'Ver paper',
                    article6Title: 'Teaching Product Management: Metodologías y Herramientas',
                    article6Excerpt: 'Reflexiones sobre la enseñanza de Product Management en entornos universitarios, con metodologías prácticas y herramientas orientadas a proyectos aplicados.',
                    article6Link: 'Leer más',
                    // Contact
                    contactTitle: 'Contacto',
                    contactDesc: '¿Necesitas definir la estrategia de producto para activos digitales, lanzar una plataforma de custodia o diseñar un programa formativo en blockchain y Web3? Comparte contexto y objetivos y responderé en menos de 24 horas para evaluar próximos pasos.',
                    contactName: 'Nombre *',
                    contactEmail: 'Email *',
                    contactService: 'Tipo de consulta *',
                    contactSelect: 'Selecciona una opción',
                    contactService1: 'Producto & Web3',
                    contactService2: 'Docencia / Consultoría',
                    contactMessage: 'Mensaje *',
                    contactPlaceholder: 'Cuéntame brevemente tu contexto (empresa, rol, problema que quieres resolver) y qué te gustaría trabajar: producto, Web3 o formación.',
                    contactSend: 'Enviar mensaje',
                    contactSending: 'Enviando...',
                    connectionError: 'Error de conexión. Por favor, intenta de nuevo más tarde.',
                    contactFormError: 'Por favor, completa todos los campos requeridos.',
                    contactEmailError: 'Por favor, ingresa un email válido.',
                    contactSuccess: 'Muchas gracias por tu mensaje. Contactaremos contigo pronto.',
                    rateLimitError: 'Has enviado demasiados mensajes. Por favor, espera un momento antes de intentar de nuevo.',
                    successModalTitle: '¡Mensaje enviado!',
                    successModalClose: 'Cerrar',
                    errorModalTitle: 'Error',
                    // Modal
                    modalTitle: 'Agenda una llamada',
                    modalClose: 'Cerrar modal',
                    // Footer
                    footerArtist: 'Ver perfil artístico',
                    // Skip link
                    skipLink: 'Saltar al contenido principal',
                    // Time period
                    present: 'Presente',
                    // Skill levels
                    skillLevelExpert: 'Experto',
                    skillLevelAdvanced: 'Avanzado',
                    skillLevelMedium: 'Medio'
                },
                en: {
                    // Navigation
                    navProduct: 'Product & Web3',
                    navTeaching: 'Teaching',
                    navArticles: 'Articles',
                    navExperiencia: 'Experience',
                    navWeb3: 'Web3',
                    navContact: 'Contact',
                    navSchedule: 'Schedule a call',
                    // Hero
                    heroSubtitle1: 'Senior Product Manager at Bitpanda | Digital Assets Custody | Tokenization | DeFi | Payment Rails',
                    heroSubtitle2: 'I design and lead API-first products for custody, tokenization, and brokerage for banks, fintechs, and Web3 companies, aligning regulation, security, and business.',
                    heroSubtitle3: 'I connect traditional financial infrastructure with digital assets innovation, combining expertise in systems, cloud and on-premise architecture, cybersecurity, and workflow automation to generate real P&L impact.',
                    heroCta1: 'View product portfolio',
                    heroCta2: 'Schedule a strategic call',
                    heroDownloadCv: 'Download CV',
                    downloadCvContact: 'Download CV (PDF)',
                    // About me
                    aboutTitle: 'About me',
                    aboutText: 'I started out writing Java backend for banking settlement systems, learning traditional financial infrastructure from the inside. From there I moved into market risk consulting with Murex and FRTB for BBVA, where I saw how banks measure, report, and manage risk at a regulated scale. That grounding in systems and regulation is what pulled me into product: first leading the evolution of a digital asset custody platform for banking and institutional clients, and today designing B2B Custody-as-a-Service at Bitpanda. Alongside that, I teach digital assets and Product Management at CEDEU, Santander Financial Institute, and Medusa Capital — explaining these concepts clearly is, to me, part of the same work of connecting technology and business.',
                    // Stats
                    statYears: 'Years fintech & Web3',
                    statUniversities: 'Universities (teaching)',
                    statProjects: 'Projects completed',
                    // Product Section
                    productTitle: 'Product & Web3',
                    productDesc: 'I design and lead Web3 products and those related to digital assets, connecting business vision, technology, and teams to complete the full lifecycle.',
                    card1Title: 'Web3 Infra & Digital Assets',
                    card1Desc: 'I design digital asset platforms built on wallets, custody and on-chain services, integrated with banking, fintech and DeFi systems. I work on the foundations of security and regulatory compliance.',
                    card2Title: 'Product Leadership & Projects',
                    card2Desc: 'I lead product decision-making from start to finish: what problems to solve, what to prioritize, and how to measure impact. I connect business, technology, and risk teams to transform vision into a clear roadmap.',
                    card3Title: 'Conceptualization and Development',
                    card3Desc: 'I combine continuous discovery and experimentation to validate what to build and why. I support delivery with clear documented processes that allow fast iteration without losing quality or security.',
                    // Projects
                    bitpandaDesc: 'B2B Custody-as-a-Service for banks and fintechs: roadmap, wallets, APIs, and multichain support for institutional clients.',
                    onyzeDesc: 'Evolution of the SaaS custody, brokerage, and tokenization platform: roadmap, API design, and regulatory compliance.',
                    nfqDesc: 'Murex Consultant for FRTB market risk at BBVA: critical workflow automation and regulatory data architecture.',
                    sopraDesc: 'Backend development in Java for settlement and reporting processes in banking, focused on clean code and production deployments.',
                    metricArchitecture: 'Architecture',
                    metricOrchestration: 'Process orchestration',
                    metricScalability: 'Scalability',
                    metricSecurity: 'Security',
                    metricTimeReduction: 'Technology',
                    // Market Intelligence Section
                    marketIntelligenceKicker: 'Market Intelligence',
                    marketIntelligenceTitle: 'Crypto & DeFi',
                    marketIntelligenceDesc: 'Main DeFi protocols and liquid staking. Real-time data from DefiLlama.',
                    marketTabDefi: 'DeFi Protocols',
                    marketTabStaking: 'Liquid Staking',
                    marketLoadingProtocols: 'Loading protocols...',
                    marketLoadingStaking: 'Loading staking protocols...',
                    marketViewProtocol: 'View protocol',
                    marketNoProtocols: 'No protocols found',
                    market7dChange: '7D Change',
                    marketGrowing: 'Growing',
                    marketDeclining: 'Declining',
                    marketProtocolFallback: 'Protocol',
                    marketPoweredBy: 'Data updated in real-time •',
                    // Crypto Section (hidden)
                    cryptoKicker: 'Real-time data',
                    cryptoTitle: 'Digital Assets Market',
                    cryptoSubtitle: 'Watchlist of assets I follow for product and digital treasury management.',
                    cryptoLoading: 'Loading prices...',
                    cryptoTimestamp: 'Real-time data provided by CoinGecko · Last update:',
                    cryptoRefresh: 'Refresh market',
                    cryptoUpdating: 'Updating...',
                    cryptoError: '⚠️ Error loading prices. Please try again in a moment.',
                    marketFooterUpdated: 'Data updated in real time',
                    poweredBy: 'Powered by DefiLlama',
                    footerPrivacy: 'Privacy policy and legal notice',
                    menuOpen: 'Open menu',
                    menuClose: 'Close menu',
                    marketCapLabel: 'Market cap',
                    // Experience
                    experienceTitle: 'Professional Experience',
                    experienceDesc: '',
                    timelineBitpanda: 'Senior PM at Bitpanda Technology Solutions, Bitpanda\'s B2B SaaS arm. I define and prioritize product requirements for the Custody-as-a-Service platform aimed at institutional clients that want to integrate digital assets without building their own infrastructure.',
                    timelineBitpandaCompany: 'Bitpanda · Jun 2026 – Present',
                    timelineOnyze: 'Head of Product. I design and conceptualize the evolution of the SaaS custody, brokerage and tokenization platform, defining roadmap, API design and use cases for banking, institutional and fintechs. Priority on security and regulatory compliance for deploying digital asset infrastructure in regulated environments.',
                    timelineOnyzeCompany: 'Onyze (Digital Asset Custody) · 2024 – May 2026',
                    timelineNfq: 'Murex Consultant for FRTB market risk projects for BBVA, critical workflow automation, and data architecture for banking, combining Control-M, microservices, and regulatory datamarts. Results in operational efficiency, reporting quality, and resilience of trading and risk systems.',
                    timelineSopra: 'Developer of backend services and modules in Java for settlement, reporting, and daily operations processes, following clean code principles and design patterns. I participated in the complete development cycle (analysis, design, testing, and deployment), providing technical documentation and support during production deployment.',
                    achievementBitpanda1: 'Conceptualization and development of regulatory compliance requirements for B2B custody products in regulated jurisdictions (MiCA, BaFin, VASP)',
                    achievementBitpanda2: 'Design of ad-hoc custody solutions for financial institutions expanding their product catalogue to digital assets',
                    achievementBitpanda3: 'Roadmap definition for Custody-as-a-Service as a B2B SaaS provider, including wallet management, API integration, and multichain support',
                    achievementBitpanda4: 'Expansion of supported tokens and blockchains, broadening the asset catalogue available to institutional clients',
                    achievement1: 'Evolution and design of Crypto-as-a-service',
                    achievement2: 'API architecture for integrations with core banking',
                    achievement3: 'Development of regulatory compliance tool Transaction monitoring',
                    achievement4: 'Development and integration of Travel Rule in funds transfer regulation.',
                    achievementCollateral: 'Collateral management for digital assets',
                    achievement5: 'Deployment of crypto module in Credit Andorra online banking.',
                    achievement6: 'Automation of critical processes with Control-M',
                    achievement7: 'Microservices architecture for banking',
                    achievement8: 'CI/CD deployments in production environments',
                    achievement9: 'Development of BRS (Bond Return Swaps) instrument in Murex BBVA',
                    achievement10: 'Development of core components for banking systems',
                    achievement11: 'Implementation of financial security standards',
                    // Skills
                    skillsTitle: 'Core Competencies',
                    skillsDesc: 'Combination of product leadership, digital assets expertise, and technical foundation to design secure, scalable, and regulation-aligned products.',
                    skillCategoryProduct: 'Product & Leadership',
                    skillCategoryBlockchain: 'Blockchain & Digital Assets',
                    skillCategoryTech: 'Technology & Architecture',
                    skillCategorySoft: 'Soft Skills',
                    productLeadership: 'Product strategy, end-to-end ownership, roadmap prioritization, stakeholder management, and market launch in regulated environments.',
                    blockchainDesc: 'Institutional custody, tokenization, DeFi, and regulatory alignment for digital asset infrastructures.',
                    techDesc: 'API-first architectures, microservices, cloud, data, and cybersecurity applied to financial and Web3 platforms.',
                    softSkillsDesc: 'Process automation with Make and n8n, AI agent orchestration, and intelligent process automation to reduce operational friction.',
                    // Skill names
                    skillProductOwnership: 'Product Ownership',
                    skillRoadmappingGTM: 'Roadmapping & GTM',
                    skillUserResearch: 'User Research',
                    skillStakeholderManagement: 'Stakeholder Management',
                    skillAssetCustody: 'Asset Custody',
                    skillTokenization: 'Tokenization',
                    skillSmartContracts: 'Smart Contracts',
                    skillDeFiProtocols: 'DeFi Protocols',
                    skillControlM: 'Control-M',
                    skillAPIsMicroservices: 'APIs & Microservices',
                    skillN8nMake: 'n8n / Make',
                    skillSQLJava: 'SQL / Java',
                    skillLeadership: 'Leadership',
                    skillTeachingMentoring: 'Teaching & Mentoring',
                    skillCommunication: 'Communication',
                    skillProblemSolving: 'Problem Solving',
                    // Teaching
                    teachingTitle: 'Teaching & Training',
                    teachingDesc: 'University professor and trainer in Digital Assets, Blockchain, financial systems, and Product Management, connecting theory with applied projects in real environments.',
                    cedeuDesc: 'Courses on digital assets, blockchain, APIs and product, with a hands‑on focus on infrastructures and financial‑system flows. Workshops and projects connect academic concepts with real use cases in banking, fintech and Web3.',
                    santanderDesc: 'Training programs in product, Web3 and crypto for financial‑market professionals, with a strong focus on regulation, risk and institutional use cases. Sessions combine market practice, supervision frameworks and product design for banks, brokers and asset managers.',
                    medusaDesc: 'Blockchain and digital‑asset programs for teams that want to move safely from theory to real production implementations. We work on architecture, custody models and operating frameworks so products can scale while staying compliant and secure.',
                    teachingCta: 'Request a consultation',
                    // Articles
                    articlesTitle: 'Articles & Publications',
                    articlesDesc: 'Content on Product Management, Blockchain, and Digital Assets with focus on real applications for banking, fintech, and companies.',
                    article0Title: 'Aave Labs and DAO. The conflict for control',
                    article0Excerpt: 'The conflict between Aave Labs and the DAO over control of strategic assets, revenue streams, and protocol governance. Analysis of the CoW Swap integration case, where Aave Labs captured $10M in fees without DAO approval, and the governance proposal to transfer domains, brand, and intellectual assets to community control.',
                    article0Link: 'Read article',
                    article0Url: 'https://www.linkedin.com/pulse/aave-labs-y-dao-el-conflicto-por-control-alex-gilabert-l6yce/',
                    article1Title: 'Can you be profitable with low capital in liquidity pools? Technical guide to DAMM v2 (Meteora)',
                    article1Excerpt: 'DeFi doesn\'t slow down in summer. On July 31st, Meteora, one of the most innovative protocols in the DeFi ecosystem on Solana, launched its latest product to the market, aiming to provide more options for commission generation to liquidity providers. DAMM v2 is a constant product AMM designed to optimize fee capture by liquidity providers (LPs) in short time periods.',
                    article1Link: 'Read article',
                    article1Url: 'https://www.linkedin.com/pulse/se-puede-ser-rentable-con-poco-capital-en-pools-de-v2-alejandro-nd58f/',
                    article2Title: 'Tokenized deposits, stablecoins and MMFs: shadow banking, collateral and the battle for onchain money',
                    article2Excerpt: 'In November 2025, we saw JPMorgan launch JPM Coin, its tokenized deposit on Base, the L2 developed by Coinbase. Simultaneously, stablecoins from issuers like Tether and Circle process more than $4 trillion in transactions annually. We can identify hints of a silent but profound battle in the blockchain trenches: who controls onchain money, how is it issued, and who defines it?',
                    article2Link: 'Read article',
                    article2Url: 'https://www.linkedin.com/pulse/dep%C3%B3sitos-tokenizados-stablecoins-y-mmfs-shadow-banking-alex-gilabert-clgse/',
                    article3Title: 'Product Roadmapping in Web3: Strategies and Challenges',
                    article3Excerpt: 'Keys to prioritizing features and risks in Web3 products, balancing innovation, compliance, and market.',
                    article3Link: 'Read more',
                    article4Title: 'Blockchain in Banking: Real Use Cases',
                    article4Excerpt: 'Review of real blockchain implementations in banking, lessons learned, and best practices for enterprise projects.',
                    article4Link: 'Read article',
                    article5Title: 'Microservices Architecture for Fintech',
                    article5Excerpt: 'Architectural patterns for scalable fintech systems: orchestration, resilience, and compliance in distributed architectures.',
                    article5Link: 'View paper',
                    article6Title: 'Teaching Product Management: Methodologies and Tools',
                    article6Excerpt: 'Reflections on teaching Product Management in university environments, with practical methodologies and tools oriented to applied projects.',
                    article6Link: 'Read more',
                    // Contact
                    contactTitle: 'Contact',
                    contactDesc: 'Do you need to define product strategy for digital assets, launch a custody platform, or design a training program in blockchain and Web3? Share context and objectives and I\'ll respond within 24 hours to evaluate next steps.',
                    contactName: 'Name *',
                    contactEmail: 'Email *',
                    contactService: 'Type of inquiry *',
                    contactSelect: 'Select an option',
                    contactService1: 'Product & Web3',
                    contactService2: 'Teaching / Consulting',
                    contactMessage: 'Message *',
                    contactPlaceholder: 'Briefly tell me your context (company, role, problem you want to solve) and what you\'d like to work on: product, Web3, or training.',
                    contactSend: 'Send message',
                    contactSending: 'Sending...',
                    connectionError: 'Connection error. Please try again later.',
                    contactFormError: 'Please complete all required fields.',
                    contactEmailError: 'Please enter a valid email.',
                    contactSuccess: 'Thank you for your message! We will contact you soon.',
                    rateLimitError: 'You have sent too many messages. Please wait a moment before trying again.',
                    successModalTitle: 'Message sent!',
                    successModalClose: 'Close',
                    errorModalTitle: 'Error',
                    // Modal
                    modalTitle: 'Schedule a call',
                    modalClose: 'Close modal',
                    // Footer
                    footerArtist: 'View artistic profile',
                    // Skip link
                    skipLink: 'Skip to main content',
                    // Time period
                    present: 'Present',
                    // Skill levels
                    skillLevelExpert: 'Expert',
                    skillLevelAdvanced: 'Advanced',
                    skillLevelMedium: 'Medium'
                }
            };

            function changeLanguage(lang) {
                const t = translations[lang];
                if (!t) return;

                // Update HTML lang attribute
                document.documentElement.lang = lang;

                // Navigation - Update new section links
                const experienciaLink = document.querySelector('a[data-section="experiencia"]');
                if (experienciaLink) experienciaLink.textContent = t.navExperiencia || 'Experiencia';
                const web3Link = document.querySelector('a[data-section="web3"]');
                if (web3Link) web3Link.textContent = t.navWeb3 || 'Web3';
                const blogLink = document.querySelector('a[data-section="blog"]');
                if (blogLink) blogLink.textContent = t.navArticles || 'Blog';
                const contactLinkNav = document.querySelector('.nav-contact-link');
                if (contactLinkNav) contactLinkNav.textContent = t.navContact;
                const scheduleBtn = document.querySelector('.nav-cta');
                if (scheduleBtn) scheduleBtn.textContent = t.navSchedule;

                // Hero
                const heroSubtitles = document.querySelectorAll('.hero-subtitle');
                if (heroSubtitles[0]) heroSubtitles[0].textContent = t.heroSubtitle1;
                if (heroSubtitles[1]) heroSubtitles[1].textContent = t.heroSubtitle2;
                if (heroSubtitles[2]) heroSubtitles[2].textContent = t.heroSubtitle3;
                document.querySelector('.btn-primary[href="#producto"]').textContent = t.heroCta1;
                document.querySelector('.btn-secondary[onclick="openCalendlyModal()"]').textContent = t.heroCta2;
                const heroDownloadCvEl = document.querySelector('[data-i18n="heroDownloadCv"]');
                if (heroDownloadCvEl) heroDownloadCvEl.textContent = t.heroDownloadCv;
                const downloadCvContactEl = document.querySelector('[data-i18n="downloadCvContact"]');
                if (downloadCvContactEl) downloadCvContactEl.textContent = t.downloadCvContact;

                // About me
                const aboutTitleEl = document.querySelector('#sobre-mi h2');
                if (aboutTitleEl) aboutTitleEl.textContent = t.aboutTitle;
                const aboutTextEl = document.querySelector('#sobre-mi p');
                if (aboutTextEl) aboutTextEl.textContent = t.aboutText;

                // Stats
                const statLabels = document.querySelectorAll('.stat-label');
                if (statLabels[0]) statLabels[0].textContent = t.statYears;
                if (statLabels[1]) statLabels[1].textContent = t.statUniversities;
                if (statLabels[2]) statLabels[2].textContent = t.statProjects;

                // Product Section
                const productSection = document.querySelector('#producto h2');
                if (productSection) productSection.textContent = t.productTitle;
                const productDesc = document.querySelector('#producto .section-header p');
                if (productDesc) productDesc.textContent = t.productDesc;
                const serviceCards = document.querySelectorAll('#producto .service-card');
                if (serviceCards[0]) {
                    serviceCards[0].querySelector('h3').textContent = t.card1Title;
                    serviceCards[0].querySelector('p').textContent = t.card1Desc;
                }
                if (serviceCards[1]) {
                    serviceCards[1].querySelector('h3').textContent = t.card2Title;
                    serviceCards[1].querySelector('p').textContent = t.card2Desc;
                }
                if (serviceCards[2]) {
                    serviceCards[2].querySelector('h3').textContent = t.card3Title;
                    serviceCards[2].querySelector('p').textContent = t.card3Desc;
                }

                // Projects
                const projectDescs = document.querySelectorAll('.project-description');
                if (projectDescs[0]) projectDescs[0].textContent = t.bitpandaDesc;
                if (projectDescs[1]) projectDescs[1].textContent = t.onyzeDesc;
                if (projectDescs[2]) projectDescs[2].textContent = t.nfqDesc;
                if (projectDescs[3]) projectDescs[3].textContent = t.sopraDesc;

                // Metrics
                const metrics = document.querySelectorAll('.project-metric-label');
                metrics.forEach(metric => {
                    const text = metric.textContent.trim();
                    if (text === 'Architecture' || text === 'Arquitectura') metric.textContent = t.metricArchitecture;
                    if (text === 'Orchestration' || text === 'Orquestación' || text === 'Process orchestration' || text === 'Orquestación procesos') metric.textContent = t.metricOrchestration;
                    if (text === 'Scalability' || text === 'Escalabilidad') metric.textContent = t.metricScalability;
                    if (text === 'Security' || text === 'Seguridad') metric.textContent = t.metricSecurity;
                    if (text === 'Technology' || text === 'Tecnología') metric.textContent = t.metricTimeReduction;
                });

                // Market Intelligence Section
                const marketKicker = document.querySelector('#market-intelligence .section-kicker');
                if (marketKicker) marketKicker.textContent = t.marketIntelligenceKicker;
                const marketTitle = document.querySelector('#market-intelligence h2');
                if (marketTitle) marketTitle.textContent = t.marketIntelligenceTitle;
                const marketDesc = document.querySelector('#market-intelligence .section-header p');
                if (marketDesc) marketDesc.textContent = t.marketIntelligenceDesc;

                // Market tabs labels
                const tabDefi = document.querySelector('.market-tab-btn[data-tab="defi"] .tab-label');
                if (tabDefi) tabDefi.textContent = t.marketTabDefi;
                const tabStaking = document.querySelector('.market-tab-btn[data-tab="staking"] .tab-label');
                if (tabStaking) tabStaking.textContent = t.marketTabStaking;
                // Re-renderizar tarjetas de protocolos ya cargadas: sus categorías,
                // "7D Change" y "Creciendo/Bajando" dependen del idioma
                if (typeof rerenderMarketDataForLanguage === 'function') rerenderMarketDataForLanguage();

                // Loading texts
                const loadingDefi = document.querySelector('#tab-defi .loading-text');
                if (loadingDefi) loadingDefi.textContent = t.marketLoadingProtocols;
                const loadingStaking = document.querySelector('#tab-staking .loading-text');
                if (loadingStaking) loadingStaking.textContent = t.marketLoadingStaking;

                // Footer
                const marketFooterText = document.querySelector('.market-footer .market-timestamp');
                if (marketFooterText) {
                    const link = marketFooterText.querySelector('a');
                    const linkText = link ? link.outerHTML : '';
                    marketFooterText.innerHTML = t.marketPoweredBy + ' ' + linkText;
                }

                // Crypto ticker (vive dentro de #market-intelligence; kicker/h2/subtitle
                // de esa sección ya se traducen más arriba vía '#market-intelligence ...').
                // Antes esto buscaba dentro de '#crypto-prices', un id que no existe en el
                // HTML, así que el texto de carga se quedaba en español en cargas frescas
                // con inglés guardado como idioma preferido.
                const cryptoLoading = document.querySelector('.crypto-loading p');
                if (cryptoLoading) cryptoLoading.textContent = t.cryptoLoading;
                const marketIntelligence = document.getElementById('market-intelligence');
                const cryptoTimestamp = marketIntelligence ? marketIntelligence.querySelector('.crypto-timestamp') : document.querySelector('.crypto-timestamp');
                if (cryptoTimestamp) {
                    const timeSpan = cryptoTimestamp.querySelector('#cryptoTimestamp');
                    const currentTime = timeSpan ? timeSpan.textContent : '--:--';
                    cryptoTimestamp.innerHTML = t.cryptoTimestamp + ' <span id="cryptoTimestamp">' + currentTime + '</span>';
                }
                const cryptoRefresh = document.querySelector('#refreshBtn .refresh-text');
                if (cryptoRefresh) cryptoRefresh.textContent = t.cryptoRefresh;
                const privacyLink = document.querySelector('.footer-link[data-i18n="footerPrivacy"]');
                if (privacyLink) privacyLink.textContent = t.footerPrivacy;
                document.querySelectorAll('.market-footer .market-timestamp').forEach(p => {
                    if (p.childNodes[0]) p.childNodes[0].textContent = t.marketFooterUpdated + ' • ';
                    const dlLink = p.querySelector('a');
                    if (dlLink) dlLink.textContent = t.poweredBy;
                });

                // Experience
                const expTitle = document.querySelector('#producto .timeline-container')?.previousElementSibling?.querySelector('h2');
                if (expTitle) expTitle.textContent = t.experienceTitle;
                const timelineDescs = document.querySelectorAll('#producto .timeline-description');
                if (timelineDescs[0]) timelineDescs[0].textContent = t.timelineBitpanda;
                if (timelineDescs[1]) timelineDescs[1].textContent = t.timelineOnyze;
                if (timelineDescs[2]) timelineDescs[2].textContent = t.timelineNfq;
                if (timelineDescs[3]) timelineDescs[3].textContent = t.timelineSopra;
                // Compañía + fecha: "Presente"/"Mayo" no se traducían porque este texto
                // estaba hardcodeado en el HTML sin pasar nunca por el sistema de i18n.
                const timelineCompanies = document.querySelectorAll('#producto .timeline-company');
                if (timelineCompanies[0]) timelineCompanies[0].textContent = t.timelineBitpandaCompany;
                if (timelineCompanies[1]) timelineCompanies[1].textContent = t.timelineOnyzeCompany;
                const achievements = document.querySelectorAll('#producto .timeline-achievements li');
                const isSpanish = lang === 'es';
                // Bitpanda (4 bullets)
                if (achievements[0]) achievements[0].textContent = t.achievementBitpanda1;
                if (achievements[1]) achievements[1].textContent = t.achievementBitpanda2;
                if (achievements[2]) achievements[2].textContent = t.achievementBitpanda3;
                if (achievements[3]) achievements[3].textContent = t.achievementBitpanda4;
                // Onyze (desplazado a [4]..[9])
                if (achievements[4]) {
                    // Incluye un link, usar innerHTML
                    if (isSpanish) {
                        achievements[4].innerHTML = 'Evolución y diseño de <a href="https://onyze.com/es/#custody" target="_blank" rel="noopener noreferrer">Crypto-as-a-service</a>';
                    } else {
                        achievements[4].innerHTML = 'Evolution and design of <a href="https://onyze.com/es/#custody" target="_blank" rel="noopener noreferrer">Crypto-as-a-service</a>';
                    }
                }
                if (achievements[5]) achievements[5].textContent = t.achievement2;
                if (achievements[6]) achievements[6].textContent = t.achievement3;
                if (achievements[7]) achievements[7].textContent = t.achievement4;
                if (achievements[8]) achievements[8].textContent = t.achievementCollateral;
                if (achievements[9]) {
                    // Incluye un link, usar innerHTML
                    if (isSpanish) {
                        achievements[9].innerHTML = 'Despliegue de módulo crypto en la banca online de <a href="https://creand.ad/es/personas/ahorro-e-inversion/cryptowallet/" target="_blank" rel="noopener noreferrer">Credit Andorra</a>.';
                    } else {
                        achievements[9].innerHTML = 'Deployment of crypto module in <a href="https://creand.ad/es/personas/ahorro-e-inversion/cryptowallet/" target="_blank" rel="noopener noreferrer">Credit Andorra</a> online banking.';
                    }
                }
                // NFQ (desplazado a [10]..[13])
                if (achievements[10]) achievements[10].textContent = t.achievement6;
                if (achievements[11]) achievements[11].textContent = t.achievement7;
                if (achievements[12]) achievements[12].textContent = t.achievement8;
                if (achievements[13]) achievements[13].textContent = t.achievement9;
                // Sopra (desplazado a [14]..[15])
                if (achievements[14]) achievements[14].textContent = t.achievement10;
                if (achievements[15]) achievements[15].textContent = t.achievement11;

                // Skills
                const skillsTitle = document.querySelector('#skills h2');
                if (skillsTitle) skillsTitle.textContent = t.skillsTitle;
                const skillsDesc = document.querySelector('#skills .section-header p');
                if (skillsDesc) skillsDesc.textContent = t.skillsDesc;
                const skillDescs = document.querySelectorAll('#skills .skill-category p');
                if (skillDescs[0]) skillDescs[0].textContent = t.productLeadership;
                if (skillDescs[1]) skillDescs[1].textContent = t.blockchainDesc;
                if (skillDescs[2]) skillDescs[2].textContent = t.techDesc;
                if (skillDescs[3]) skillDescs[3].textContent = t.softSkillsDesc;

                // Skill category titles translation
                const skillCategoryTitles = document.querySelectorAll('#skills .skill-category h3');
                skillCategoryTitles.forEach((title, index) => {
                    const category = title.closest('.skill-category');
                    if (category) {
                        if (category.classList.contains('category-product')) {
                            title.textContent = t.skillCategoryProduct;
                        } else if (category.classList.contains('category-blockchain')) {
                            title.textContent = t.skillCategoryBlockchain;
                        } else if (category.classList.contains('category-tech')) {
                            title.textContent = t.skillCategoryTech;
                        } else if (category.classList.contains('category-soft')) {
                            title.textContent = t.skillCategorySoft;
                        }
                    }
                });

                // Skill chips translation
                // (el selector apuntaba a '.skill-name', una clase que no existe en el
                // HTML —los chips usan '.skill-chip'—, así que esto nunca se ejecutaba)
                const skillNames = document.querySelectorAll('#skills .skill-chip');
                skillNames.forEach(name => {
                    const text = name.textContent.trim();
                    // Map Spanish to translation keys
                    if (text === 'Product Ownership' || text === 'Product Ownership') {
                        name.textContent = t.skillProductOwnership;
                    } else if (text === 'Roadmapping y GTM' || text === 'Roadmapping & GTM') {
                        name.textContent = t.skillRoadmappingGTM;
                    } else if (text === 'Investigación de Usuarios' || text === 'User Research') {
                        name.textContent = t.skillUserResearch;
                    } else if (text === 'Gestión de Stakeholders' || text === 'Stakeholder Management') {
                        name.textContent = t.skillStakeholderManagement;
                    } else if (text === 'Custodia de Activos' || text === 'Asset Custody') {
                        name.textContent = t.skillAssetCustody;
                    } else if (text === 'Tokenización' || text === 'Tokenization') {
                        name.textContent = t.skillTokenization;
                    } else if (text === 'Contratos Inteligentes' || text === 'Smart Contracts') {
                        name.textContent = t.skillSmartContracts;
                    } else if (text === 'Protocolos DeFi' || text === 'DeFi Protocols') {
                        name.textContent = t.skillDeFiProtocols;
                    } else if (text === 'Control-M' || text === 'Control-M') {
                        name.textContent = t.skillControlM;
                    } else if (text === 'APIs y Microservicios' || text === 'APIs & Microservices') {
                        name.textContent = t.skillAPIsMicroservices;
                    } else if (text === 'n8n / Make' || text === 'n8n / Make') {
                        name.textContent = t.skillN8nMake;
                    } else if (text === 'SQL / Java' || text === 'SQL / Java') {
                        name.textContent = t.skillSQLJava;
                    } else if (text === 'Liderazgo' || text === 'Leadership') {
                        name.textContent = t.skillLeadership;
                    } else if (text === 'Docencia y Mentoring' || text === 'Teaching & Mentoring') {
                        name.textContent = t.skillTeachingMentoring;
                    } else if (text === 'Comunicación' || text === 'Communication') {
                        name.textContent = t.skillCommunication;
                    } else if (text === 'Resolución de Problemas' || text === 'Problem Solving') {
                        name.textContent = t.skillProblemSolving;
                    }
                });

                // Nota: se quitó un bloque que traducía '.skill-level' — esa clase no
                // existe en el HTML actual (era de un diseño anterior con niveles de
                // habilidad, sustituido por el sistema de chips), así que nunca hacía nada.

                // Present/Presente translation
                const presentBadges = document.querySelectorAll('.project-badge');
                presentBadges.forEach(badge => {
                    const text = badge.textContent.trim();
                    if (text.includes('Presente')) {
                        badge.textContent = text.replace('Presente', t.present);
                    } else if (text.includes('Present') && t.present === 'Presente') {
                        badge.textContent = text.replace('Present', t.present);
                    }
                    // "Mayo 2026" (Onyze) no se traducía a "May 2026" en inglés.
                    const dateText = badge.textContent;
                    if (/\bMayo\b/.test(dateText) && lang === 'en') {
                        badge.textContent = dateText.replace(/\bMayo\b/, 'May');
                    } else if (/\bMay\b/.test(dateText) && lang === 'es') {
                        badge.textContent = dateText.replace(/\bMay\b/, 'Mayo');
                    }
                });

                // Teaching
                const teachingTitle = document.querySelector('#teaching h2');
                if (teachingTitle) teachingTitle.textContent = t.teachingTitle;
                const teachingDesc = document.querySelector('#teaching .section-header p');
                if (teachingDesc) teachingDesc.textContent = t.teachingDesc;
                // Teaching cards descriptions are hidden, only used in modal
                const teachingCards = document.querySelectorAll('#teaching .teaching-card-description');
                if (teachingCards[0]) teachingCards[0].textContent = t.cedeuDesc;
                if (teachingCards[1]) teachingCards[1].textContent = t.santanderDesc;
                if (teachingCards[2]) teachingCards[2].textContent = t.medusaDesc;
                const teachingCta = document.querySelector('#teaching .btn-primary');
                if (teachingCta) teachingCta.textContent = t.teachingCta;

                // Articles
                const articlesTitle = document.querySelector('#articles h2');
                if (articlesTitle) articlesTitle.textContent = t.articlesTitle;
                const articlesDesc = document.querySelector('#articles .section-header p');
                if (articlesDesc) articlesDesc.textContent = t.articlesDesc;
                const articleCards = document.querySelectorAll('.article-card');
                if (articleCards[0]) {
                    articleCards[0].querySelector('.article-title').textContent = t.article0Title;
                    articleCards[0].querySelector('.article-excerpt').textContent = t.article0Excerpt;
                    const link0 = articleCards[0].querySelector('.article-link');
                    if (link0) {
                        link0.textContent = t.article0Link;
                        if (t.article0Url) link0.href = t.article0Url;
                    }
                }
                if (articleCards[1]) {
                    articleCards[1].querySelector('.article-title').textContent = t.article1Title;
                    articleCards[1].querySelector('.article-excerpt').textContent = t.article1Excerpt;
                    const link1 = articleCards[1].querySelector('.article-link');
                    if (link1) {
                        link1.textContent = t.article1Link;
                        if (t.article1Url) link1.href = t.article1Url;
                    }
                }
                if (articleCards[2]) {
                    articleCards[2].querySelector('.article-title').textContent = t.article2Title;
                    articleCards[2].querySelector('.article-excerpt').textContent = t.article2Excerpt;
                    const link2 = articleCards[2].querySelector('.article-link');
                    if (link2) {
                        link2.textContent = t.article2Link;
                        if (t.article2Url) link2.href = t.article2Url;
                    }
                }
                if (articleCards[3]) {
                    articleCards[3].querySelector('.article-title').textContent = t.article3Title;
                    articleCards[3].querySelector('.article-excerpt').textContent = t.article3Excerpt;
                    articleCards[3].querySelector('.article-link').textContent = t.article3Link;
                }
                if (articleCards[4]) {
                    articleCards[4].querySelector('.article-title').textContent = t.article4Title;
                    articleCards[4].querySelector('.article-excerpt').textContent = t.article4Excerpt;
                    articleCards[4].querySelector('.article-link').textContent = t.article4Link;
                }
                if (articleCards[5]) {
                    articleCards[5].querySelector('.article-title').textContent = t.article5Title;
                    articleCards[5].querySelector('.article-excerpt').textContent = t.article5Excerpt;
                    articleCards[5].querySelector('.article-link').textContent = t.article5Link;
                }
                if (articleCards[6]) {
                    articleCards[6].querySelector('.article-title').textContent = t.article6Title;
                    articleCards[6].querySelector('.article-excerpt').textContent = t.article6Excerpt;
                    articleCards[6].querySelector('.article-link').textContent = t.article6Link;
                }

                // Contact
                const contactTitle = document.querySelector('#contact h2');
                if (contactTitle) contactTitle.textContent = t.contactTitle;
                const contactDesc = document.querySelector('#contact p[style*="font-size"]');
                if (contactDesc) contactDesc.textContent = t.contactDesc;
                const contactLabels = document.querySelectorAll('#contact-form label');
                if (contactLabels[0]) contactLabels[0].textContent = t.contactName;
                if (contactLabels[1]) contactLabels[1].textContent = t.contactEmail;
                if (contactLabels[2]) contactLabels[2].textContent = t.contactService;
                if (contactLabels[3]) contactLabels[3].textContent = t.contactMessage;
                const contactSelect = document.querySelector('#service option[value=""]');
                if (contactSelect) contactSelect.textContent = t.contactSelect;
                const contactOptions = document.querySelectorAll('#service option');
                if (contactOptions[1]) contactOptions[1].textContent = t.contactService1;
                if (contactOptions[2]) contactOptions[2].textContent = t.contactService2;
                const contactPlaceholder = document.querySelector('#message');
                if (contactPlaceholder) contactPlaceholder.placeholder = t.contactPlaceholder;
                const contactSend = document.querySelector('#contact-form button[type="submit"]');
                if (contactSend) contactSend.textContent = t.contactSend;

                // Modal de docencia (el título #modal-title era del antiguo modal de
                // Calendly, eliminado; ese id ya no existe en el HTML)
                const modalClose = document.querySelector('.modal-close');
                if (modalClose) modalClose.setAttribute('aria-label', t.modalClose);

                // Skip link
                const skipLink = document.querySelector('.skip-link');
                if (skipLink) skipLink.textContent = t.skipLink;

                // Save preference
                localStorage.setItem('preferredLanguage', lang);
            }

            // Language Switcher
            (function () {
                const langButtons = document.querySelectorAll('.lang-btn');

                // Load saved language preference or default to Spanish
                const savedLang = localStorage.getItem('preferredLanguage');

                if (!savedLang) {
                    // No preference saved, default to Spanish and update content
                    changeLanguage('es');
                    langButtons.forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-pressed', 'false');
                        if (b.getAttribute('data-lang') === 'es') {
                            b.classList.add('active');
                            b.setAttribute('aria-pressed', 'true');
                        }
                    });
                } else if (savedLang === 'en') {
                    // Change to English if saved preference is English
                    changeLanguage('en');
                    langButtons.forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-pressed', 'false');
                        if (b.getAttribute('data-lang') === 'en') {
                            b.classList.add('active');
                            b.setAttribute('aria-pressed', 'true');
                        }
                    });
                } else {
                    // Spanish is saved preference
                    changeLanguage('es');
                    langButtons.forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-pressed', 'false');
                        if (b.getAttribute('data-lang') === 'es') {
                            b.classList.add('active');
                            b.setAttribute('aria-pressed', 'true');
                        }
                    });
                }

                langButtons.forEach(btn => {
                    btn.addEventListener('click', function () {
                        const lang = this.getAttribute('data-lang');
                        changeLanguage(lang);

                        langButtons.forEach(b => {
                            b.classList.remove('active');
                            b.setAttribute('aria-pressed', 'false');
                        });

                        this.classList.add('active');
                        this.setAttribute('aria-pressed', 'true');
                    });
                });
            })();

            // Mobile Menu Toggle
            (function () {
                const menuToggle = document.querySelector('.mobile-menu-toggle');
                const navMenu = document.querySelector('.nav-menu');

                if (menuToggle) {
                    const setMenu = (open) => {
                        navMenu.classList.toggle('active', open);
                        menuToggle.setAttribute('aria-expanded', String(open));
                        const lang = localStorage.getItem('preferredLanguage') || 'es';
                        const t = translations[lang] || translations['es'];
                        menuToggle.setAttribute('aria-label', open ? t.menuClose : t.menuOpen);
                    };

                    menuToggle.addEventListener('click', function (e) {
                        e.stopPropagation();
                        setMenu(this.getAttribute('aria-expanded') !== 'true');
                    });

                    navMenu.querySelectorAll('a, button').forEach(el => {
                        el.addEventListener('click', () => setMenu(false));
                    });

                    // Cerrar al pulsar fuera del menú
                    document.addEventListener('click', (e) => {
                        if (navMenu.classList.contains('active') &&
                            !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                            setMenu(false);
                        }
                    });

                    // Cerrar con Escape y devolver el foco al botón
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                            setMenu(false);
                            menuToggle.focus();
                        }
                    });

                    // Si se vuelve a escritorio con el menú abierto, resetear el estado
                    window.matchMedia('(min-width: 769px)').addEventListener('change', (ev) => {
                        if (ev.matches) setMenu(false);
                    });
                }
            })();

            // Form Validation & Submission
            (function () {
                const form = document.getElementById('contact-form');

                if (form) {
                    form.addEventListener('submit', async function (e) {
                        e.preventDefault();

                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData);

                        const currentLang = localStorage.getItem('preferredLanguage') || 'es';
                        const t = translations[currentLang];
                        // El backend usa esto para devolver los mensajes de error en el
                        // idioma correcto (antes siempre venían en español).
                        data.lang = currentLang;

                        // Validación cliente
                        if (!data.name || !data.email || !data.service || !data.message) {
                            showErrorModal(t.contactFormError);
                            return;
                        }

                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(data.email)) {
                            showErrorModal(t.contactEmailError);
                            return;
                        }

                        // Deshabilitar botón durante el envío
                        const submitBtn = form.querySelector('button[type="submit"]');
                        const originalText = submitBtn.textContent;
                        submitBtn.disabled = true;
                        submitBtn.textContent = t.contactSending;

                        try {
                            // Obtener CSRF token del formulario
                            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken') || '';

                            // Enviar a Django backend
                            const response = await fetch('/api/contact/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': csrfToken
                                },
                                body: JSON.stringify(data)
                            });

                            // Manejar respuesta según el status code
                            if (response.status === 429) {
                                // Rate limit excedido. El backend ya responde en el idioma
                                // correcto (se le manda 'lang' en el body); t.rateLimitError
                                // solo es un respaldo si por lo que sea no llega 'error'.
                                const result = await response.json().catch(() => ({}));
                                const errorMsg = result.error || t.rateLimitError;
                                showErrorModal(errorMsg);
                                return;
                            }

                            if (!response.ok) {
                                // Otros errores HTTP
                                const result = await response.json().catch(() => ({}));
                                showErrorModal(result.error || `Error ${response.status}`);
                                return;
                            }

                            const result = await response.json();

                            if (result.success) {
                                showSuccessModal(t.contactSuccess);
                                form.reset();
                            } else {
                                showErrorModal(result.error || t.connectionError);
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            showErrorModal('Error de conexión. Por favor, intenta de nuevo más tarde.');
                        } finally {
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                        }
                    });

                    // Función auxiliar para obtener CSRF token
                    function getCookie(name) {
                        let cookieValue = null;
                        if (document.cookie && document.cookie !== '') {
                            const cookies = document.cookie.split(';');
                            for (let i = 0; i < cookies.length; i++) {
                                const cookie = cookies[i].trim();
                                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                                    break;
                                }
                            }
                        }
                        return cookieValue;
                    }
                }

                // Funciones para mostrar/ocultar modales de éxito y error
                function showSuccessModal(message) {
                    const modal = document.getElementById('success-modal');
                    const titleEl = document.getElementById('success-modal-title');
                    const messageEl = document.getElementById('success-modal-message');
                    const closeBtn = document.getElementById('success-modal-close');
                    const iconEl = modal?.querySelector('.success-icon');

                    // Obtener traducciones
                    const currentLang = localStorage.getItem('preferredLanguage') || 'es';
                    const t = translations[currentLang];

                    if (modal && messageEl && titleEl) {
                        // Restaurar estado de éxito (por si venía de un error)
                        if (iconEl) {
                            iconEl.textContent = '✓';
                            iconEl.style.background = 'var(--color-primary)';
                        }

                        titleEl.textContent = t.successModalTitle || '¡Mensaje enviado!';
                        messageEl.textContent = message || t.contactSuccess || 'Muchas gracias por tu mensaje. Contactaremos contigo pronto.';

                        if (closeBtn) {
                            closeBtn.textContent = t.successModalClose || 'Cerrar';
                        }

                        modal.classList.add('active');
                        modal.setAttribute('aria-hidden', 'false');

                        // Cerrar al hacer clic en el botón
                        if (closeBtn) {
                            closeBtn.onclick = () => hideSuccessModal();
                        }

                        // Cerrar al hacer clic fuera del modal
                        modal.onclick = (e) => {
                            if (e.target === modal) {
                                hideSuccessModal();
                            }
                        };

                        // Cerrar con Escape
                        const escapeHandler = (e) => {
                            if (e.key === 'Escape') {
                                hideSuccessModal();
                                document.removeEventListener('keydown', escapeHandler);
                            }
                        };
                        document.addEventListener('keydown', escapeHandler);
                    }
                }

                function hideSuccessModal() {
                    const modal = document.getElementById('success-modal');
                    if (modal) {
                        modal.classList.remove('active');
                        modal.setAttribute('aria-hidden', 'true');
                    }
                }

                function showErrorModal(message) {
                    // Reutilizar el modal de éxito pero con estilo de error
                    const modal = document.getElementById('success-modal');
                    const titleEl = document.getElementById('success-modal-title');
                    const messageEl = document.getElementById('success-modal-message');
                    const closeBtn = document.getElementById('success-modal-close');
                    const iconEl = modal?.querySelector('.success-icon');

                    // Obtener traducciones
                    const currentLang = localStorage.getItem('preferredLanguage') || 'es';
                    const t = translations[currentLang];

                    if (modal && titleEl && messageEl) {
                        titleEl.textContent = t.errorModalTitle || 'Error';
                        messageEl.textContent = message || 'Ha ocurrido un error. Por favor, intenta de nuevo.';

                        if (closeBtn) {
                            closeBtn.textContent = t.successModalClose || 'Cerrar';
                        }

                        // Cambiar el icono a X y el color a rojo/error
                        if (iconEl) {
                            iconEl.textContent = '✕';
                            iconEl.style.background = '#EF4444';
                        }

                        modal.classList.add('active');
                        modal.setAttribute('aria-hidden', 'false');

                        // Cerrar al hacer clic en el botón
                        if (closeBtn) {
                            closeBtn.onclick = () => {
                                hideErrorModal();
                                // Restaurar el modal a su estado de éxito
                                if (iconEl) {
                                    iconEl.textContent = '✓';
                                    iconEl.style.background = 'var(--color-primary)';
                                }
                                titleEl.textContent = t.successModalTitle || '¡Mensaje enviado!';
                            };
                        }

                        // Cerrar al hacer clic fuera del modal
                        modal.onclick = (e) => {
                            if (e.target === modal) {
                                hideErrorModal();
                                // Restaurar el modal
                                if (iconEl) {
                                    iconEl.textContent = '✓';
                                    iconEl.style.background = 'var(--color-primary)';
                                }
                                titleEl.textContent = t.successModalTitle || '¡Mensaje enviado!';
                            }
                        };

                        // Cerrar con Escape
                        const escapeHandler = (e) => {
                            if (e.key === 'Escape') {
                                hideErrorModal();
                                // Restaurar el modal
                                if (iconEl) {
                                    iconEl.textContent = '✓';
                                    iconEl.style.background = 'var(--color-primary)';
                                }
                                titleEl.textContent = t.successModalTitle || '¡Mensaje enviado!';
                                document.removeEventListener('keydown', escapeHandler);
                            }
                        };
                        document.addEventListener('keydown', escapeHandler);
                    }
                }

                function hideErrorModal() {
                    const modal = document.getElementById('success-modal');
                    if (modal) {
                        modal.classList.remove('active');
                        modal.setAttribute('aria-hidden', 'true');
                    }
                }
            })();

            // Google Calendar - Redirigir a Google Calendar de agilabertcomunicaciones@gmail.com
            function openCalendlyModal() {
                // Crear evento nuevo en Google Calendar para agilabertcomunicaciones@gmail.com
                const eventTitle = 'Consulta con Alex Gilabert';
                const eventDetails = 'Consulta desde landing page profesional';
                const eventLocation = 'Online';
                const organizerEmail = 'agilabertcomunicaciones@gmail.com';

                // Fecha sugerida: mañana a las 10:00 AM (puedes cambiar)
                const suggestedDate = getNextAvailableDate();

                // URL de Google Calendar con el email del organizador.
                // El prefijo /u/<email>/ le pide a Google que use esa cuenta como contexto
                // en vez de la que esté activa por defecto en el navegador del visitante.
                const calendarUrl = 'https://calendar.google.com/calendar/u/' + encodeURIComponent(organizerEmail) + '/r?action=TEMPLATE' +
                    '&text=' + encodeURIComponent(eventTitle) +
                    '&dates=' + suggestedDate +
                    '&details=' + encodeURIComponent(eventDetails) +
                    '&location=' + encodeURIComponent(eventLocation) +
                    '&add=' + encodeURIComponent(organizerEmail) +
                    '&sf=true' +
                    '&output=xml';

                // Abrir en nueva pestaña
                window.open(calendarUrl, '_blank', 'noopener,noreferrer');
            }

            function getNextAvailableDate() {
                // Obtener fecha de mañana a las 10:00 AM (formato: YYYYMMDDTHHMMSS)
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(10, 0, 0, 0);

                const endDate = new Date(tomorrow);
                endDate.setHours(11, 0, 0, 0); // Duración de 1 hora

                // Formato: YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS (UTC)
                const formatDate = (date) => {
                    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                };

                return formatDate(tomorrow) + '/' + formatDate(endDate);
            }

            function closeCalendlyModal() {
                // Función mantenida por compatibilidad, pero ya no se usa
                // El modal de Calendly ya no existe
            }

            // Teaching Modal Functions
            function openTeachingModal(type) {
                const modal = document.getElementById('teaching-modal');
                const modalTitle = document.getElementById('teaching-modal-title');
                const modalContent = document.getElementById('teaching-modal-content');
                const currentLang = localStorage.getItem('preferredLanguage') || 'es';
                const t = translations[currentLang];

                if (!modal || !modalTitle || !modalContent) return;

                let title = '';
                let content = '';
                let imageSrc = '';
                let imageUrl = '';

                if (type === 'cede') {
                    title = 'CEDEU';
                    content = t.cedeuDesc;
                    imageSrc = STATIC_IMAGES_URL + 'cedeu3.png';
                    imageUrl = 'https://www.cedeu.es/';
                } else if (type === 'santander') {
                    title = 'Santander FI';
                    content = t.santanderDesc;
                    imageSrc = STATIC_IMAGES_URL + 'teaching/santander-logo.png';
                    imageUrl = 'https://sanfi.es/';
                } else if (type === 'medusa') {
                    title = 'Medusa Capital';
                    content = t.medusaDesc;
                    imageSrc = STATIC_IMAGES_URL + 'teaching/medusa-logo.png';
                    imageUrl = 'https://medusacapital.xyz/';
                }

                modalTitle.textContent = title;
                modalContent.innerHTML = `
                <div style="text-align: center; margin-bottom: var(--space-lg);">
                    <a href="${imageUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block;">
                        <img src="${imageSrc}" alt="${title} Logo" style="max-width: 200px; max-height: 100px; object-fit: contain; cursor: pointer; transition: opacity 0.3s ease;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'" />
                    </a>
                </div>
                <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-secondary);">${content}</p>
            `;

                // Add data-type attribute to modal container for styling
                const modalContainer = modal.querySelector('.modal-container');
                if (modalContainer) {
                    modalContainer.setAttribute('data-modal-type', type);
                }

                modal.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Focus management
                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    setTimeout(() => closeBtn.focus(), 100);
                }
            }

            function closeTeachingModal() {
                const modal = document.getElementById('teaching-modal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                    // Remove data-type attribute when closing
                    const modalContainer = modal.querySelector('.modal-container');
                    if (modalContainer) {
                        modalContainer.removeAttribute('data-modal-type');
                    }
                }
            }

            // Close teaching modal on overlay click and ESC key
            (function () {
                const teachingModal = document.getElementById('teaching-modal');
                if (teachingModal) {
                    teachingModal.addEventListener('click', function (e) {
                        if (e.target === teachingModal) {
                            closeTeachingModal();
                        }
                    });

                    // Close on ESC key
                    document.addEventListener('keydown', function (e) {
                        if (e.key === 'Escape' && teachingModal.classList.contains('active')) {
                            closeTeachingModal();
                        }
                    });
                }
            })();

            // Modal de Calendly eliminado - ahora se redirige a Google Calendar

            // Nota: se quitó un bloque que añadía tabindex="0" a todos los <a> y
            // <button> de la página. Ambos elementos ya son nativamente enfocables
            // (tabindex 0 implícito); forzarlo explícitamente no cambiaba nada y es
            // un anti-patrón de accesibilidad si algún día se necesita excluir uno
            // del orden de tabulación con tabindex="-1".

            // ============================================
            // CRYPTO PRICES - CoinGecko API
            // ============================================

            const CRYPTO_COLORS = {
                bitcoin: '#F7931A',
                ethereum: '#627EEA',
                solana: '#14F195',
                'avalanche-2': '#E84142',
                monero: '#FF6600',
                binancecoin: '#F3BA2F',
                ripple: '#23292F',
                hyperliquid: '#97FCE4'
            };

            const CRYPTO_IMAGES = {
                bitcoin: STATIC_IMAGES_URL + 'bitcoin.png',
                ethereum: STATIC_IMAGES_URL + 'eth.png',
                solana: STATIC_IMAGES_URL + 'solana.png',
                'avalanche-2': STATIC_IMAGES_URL + 'avalanche.png',
                monero: STATIC_IMAGES_URL + 'monero.png',
                binancecoin: STATIC_IMAGES_URL + 'bnb.png',
                ripple: STATIC_IMAGES_URL + 'xrp.png',
                hyperliquid: STATIC_IMAGES_URL + 'hyperliquid.jpeg'
            };

            const CRYPTOS = [
                { id: 'solana', symbol: 'SOL', name: 'Solana' },
                { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
                { id: 'monero', symbol: 'XMR', name: 'Monero' },
                { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
                { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
                { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
                { id: 'ripple', symbol: 'XRP', name: 'Ripple' },
                { id: 'hyperliquid', symbol: 'HYPE', name: 'Hyperliquid' }
            ];

            async function fetchCryptoPrices() {
                // Buscar el grid en la sección visible (market-intelligence), no en la oculta
                const marketIntelligence = document.getElementById('market-intelligence');
                const grid = marketIntelligence ? marketIntelligence.querySelector('#cryptoPricesGrid') : document.getElementById('cryptoPricesGrid');

                if (!grid) {
                    console.error('Crypto grid not found');
                    return;
                }

                // Verificar que el elemento esté visible
                const section = grid.closest('section');
                if (section && section.style.display === 'none') {
                    console.log('Crypto section is hidden, skipping fetch');
                    return;
                }

                // Ocultar loading si existe
                const loadingEl = grid.querySelector('.crypto-loading');
                if (loadingEl) {
                    loadingEl.style.display = 'none';
                }

                try {
                    const ids = CRYPTOS.map(c => c.id).join(',');
                    const endpoint = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

                    // Agregar timeout a la petición
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

                    const response = await fetch(endpoint, {
                        signal: controller.signal,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    if (!data || Object.keys(data).length === 0) {
                        throw new Error('Empty response from API');
                    }

                    // Fetch market cap rankings
                    let marketCapData = {};
                    try {
                        const marketCapEndpoint = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=7&page=1&sparkline=false`;
                        const marketCapController = new AbortController();
                        const marketCapTimeout = setTimeout(() => marketCapController.abort(), 8000);

                        const marketCapResponse = await fetch(marketCapEndpoint, {
                            signal: marketCapController.signal,
                            headers: {
                                'Accept': 'application/json'
                            }
                        });

                        clearTimeout(marketCapTimeout);

                        if (marketCapResponse.ok) {
                            const marketCapArray = await marketCapResponse.json();
                            marketCapArray.forEach(coin => {
                                marketCapData[coin.id] = {
                                    rank: coin.market_cap_rank,
                                    marketCap: coin.market_cap
                                };
                            });
                        }
                    } catch (marketCapError) {
                        console.warn('Market cap fetch failed, continuing without it:', marketCapError);
                    }

                    renderCryptoPrices(data, marketCapData);
                    updateTimestamp();

                } catch (error) {
                    console.error('Crypto fetch error:', error);
                    const currentLang = localStorage.getItem('preferredLanguage') || 'es';
                    const t = translations[currentLang] || translations['es'];

                    // Mostrar error pero mantener la estructura
                    grid.innerHTML = `
                    <div class="crypto-error" style="min-width: 100%;">
                        ${t.cryptoError}
                        <button id="refreshBtn" onclick="refreshCryptoPrices()" style="margin-top: var(--space-sm); padding: var(--space-xs) var(--space-md); background: var(--color-primary); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer;">
                            <span class="refresh-text">${t.cryptoRefresh}</span>
                        </button>
                    </div>
                `;
                }
            }

            function pauseCryptoScroll() {
                const marketIntelligence = document.getElementById('market-intelligence');
                const grid = marketIntelligence ? marketIntelligence.querySelector('#cryptoPricesGrid') : document.getElementById('cryptoPricesGrid');
                if (grid) {
                    grid.classList.add('paused');
                }
            }

            function resumeCryptoScroll() {
                const marketIntelligence = document.getElementById('market-intelligence');
                const grid = marketIntelligence ? marketIntelligence.querySelector('#cryptoPricesGrid') : document.getElementById('cryptoPricesGrid');
                if (grid) {
                    grid.classList.remove('paused');
                }
            }

            // Pause/resume on visibility change and hover
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    pauseCryptoScroll();
                } else {
                    resumeCryptoScroll();
                }
            });

            // Event listeners para pause/resume se configuran dinámicamente cuando se muestra la sección
            function setupCryptoScrollListeners() {
                const marketIntelligence = document.getElementById('market-intelligence');
                const gridEl = marketIntelligence ? marketIntelligence.querySelector('#cryptoPricesGrid') : document.getElementById('cryptoPricesGrid');
                if (gridEl) {
                    gridEl.addEventListener('mouseenter', pauseCryptoScroll);
                    gridEl.addEventListener('mouseleave', resumeCryptoScroll);
                    gridEl.addEventListener('scroll', updateCryptoScrollIndicator, { passive: true });
                    updateCryptoScrollIndicator();
                }
            }

            function updateCryptoScrollIndicator() {
                const marketIntelligence = document.getElementById('market-intelligence');
                const gridEl = marketIntelligence ? marketIntelligence.querySelector('#cryptoPricesGrid') : document.getElementById('cryptoPricesGrid');
                const thumb = document.getElementById('cryptoScrollThumb');
                if (!gridEl || !thumb) return;

                const scrollable = gridEl.scrollWidth - gridEl.clientWidth;
                if (scrollable <= 0) {
                    thumb.style.width = '100%';
                    thumb.style.transform = 'translateX(0)';
                    return;
                }

                const visibleRatio = Math.min(gridEl.clientWidth / gridEl.scrollWidth, 1);
                const progress = gridEl.scrollLeft / scrollable;
                const trackWidth = thumb.parentElement.clientWidth;
                const thumbWidth = Math.max(visibleRatio * trackWidth, 24);
                const maxTranslate = trackWidth - thumbWidth;

                thumb.style.width = thumbWidth + 'px';
                thumb.style.transform = `translateX(${progress * maxTranslate}px)`;
            }

            function hexToRgb(hex) {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            }

            function formatMarketCap(marketCap) {
                if (!marketCap) return '';
                if (marketCap >= 1e12) return (marketCap / 1e12).toFixed(2) + 'T';
                if (marketCap >= 1e9) return (marketCap / 1e9).toFixed(2) + 'B';
                if (marketCap >= 1e6) return (marketCap / 1e6).toFixed(2) + 'M';
                return marketCap.toLocaleString();
            }

            function renderCryptoPrices(data, marketCapData = {}) {
                // Buscar el grid en la sección visible (market-intelligence)
                const marketIntelligence = document.getElementById('market-intelligence');
                const grid = marketIntelligence ? marketIntelligence.querySelector('#cryptoPricesGrid') : document.getElementById('cryptoPricesGrid');
                if (!grid) {
                    console.error('Crypto grid not found for rendering');
                    return;
                }

                // Limpiar contenido anterior incluyendo loading
                grid.innerHTML = '';
                const isMobile = window.innerWidth <= 768;

                // Create cards twice for seamless loop (only on desktop)
                const iterations = isMobile ? 1 : 2;

                for (let i = 0; i < iterations; i++) {
                    CRYPTOS.forEach(crypto => {
                        const cryptoData = data[crypto.id];
                        if (!cryptoData) {
                            console.warn(`No data for ${crypto.id}`);
                            return;
                        }

                        const price = cryptoData.usd;
                        const change24h = cryptoData.usd_24h_change || 0;
                        const changeClass = change24h > 0 ? 'positive' : change24h < 0 ? 'negative' : 'neutral';
                        const changeSymbol = change24h > 0 ? '↑' : change24h < 0 ? '↓' : '→';

                        const marketInfo = marketCapData[crypto.id];
                        const cardLang = localStorage.getItem('preferredLanguage') || 'es';
                        const marketCapLabel = (translations[cardLang] || translations['es']).marketCapLabel;
                        const marketCapText = marketInfo && marketInfo.rank
                            ? `#${marketInfo.rank} · ${marketCapLabel} ${formatMarketCap(marketInfo.marketCap)}`
                            : '';

                        const card = document.createElement('div');
                        card.className = 'crypto-card fade-in visible';
                        card.dataset.assetId = crypto.id;
                        card.setAttribute('role', 'button');
                        card.setAttribute('tabindex', '0');

                        const borderColor = CRYPTO_COLORS[crypto.id] || CRYPTO_COLORS.bitcoin; // Fallback a bitcoin si no existe
                        card.style.borderTopColor = borderColor;
                        // Apply gradient background using the border color
                        const rgb = hexToRgb(borderColor);
                        if (rgb) {
                            card.style.setProperty('--card-accent-r', rgb.r);
                            card.style.setProperty('--card-accent-g', rgb.g);
                            card.style.setProperty('--card-accent-b', rgb.b);
                        }

                        // Make card clickable
                        card.addEventListener('click', () => {
                            window.open(`https://www.coingecko.com/en/coins/${crypto.id}`, '_blank', 'noopener');
                        });

                        card.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                card.click();
                            }
                        });

                        const imagePath = CRYPTO_IMAGES[crypto.id] || STATIC_IMAGES_URL + 'bitcoin.png';
                        const imageHTML = `<img src="${imagePath}" alt="Logotipo ${crypto.name}" class="crypto-icon">`;

                        // Format price - include decimals for XRP
                        const priceFormat = crypto.id === 'ripple'
                            ? { maximumFractionDigits: 2, minimumFractionDigits: 2 }
                            : { maximumFractionDigits: price > 1 ? 0 : 2, minimumFractionDigits: 0 };

                        card.innerHTML = `
                        ${imageHTML}
                        <div class="crypto-card-content">
                            <div class="crypto-card-main">
                                <div class="crypto-symbol">${crypto.symbol}</div>
                                <div class="crypto-name">${crypto.name}</div>
                                <div class="crypto-price">$${price.toLocaleString('en-US', priceFormat)}</div>
                                ${marketCapText ? `<div class="crypto-market-info">${marketCapText}</div>` : ''}
                            </div>
                            <div class="crypto-card-divider"></div>
                            <div class="crypto-change ${changeClass}" title="Variación porcentual del precio en las últimas 24 horas">
                                <span class="crypto-change-indicator">${changeSymbol}</span>
                                <span>${Math.abs(change24h).toFixed(2)}% · 24h</span>
                            </div>
                        </div>
                    `;

                        grid.appendChild(card);
                    });
                }
            }

            function updateTimestamp() {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const timeString = `${hours}:${minutes}`;

                // Buscar el timestamp en la sección visible (market-intelligence)
                const marketIntelligence = document.getElementById('market-intelligence');
                const timestampSpan = marketIntelligence ? marketIntelligence.querySelector('#cryptoTimestamp') : document.getElementById('cryptoTimestamp');

                if (timestampSpan) {
                    timestampSpan.textContent = timeString;
                }

                // También actualizar el texto completo con traducción si existe el contenedor
                const timestampContainer = marketIntelligence ? marketIntelligence.querySelector('.crypto-timestamp') : document.querySelector('.crypto-timestamp');
                if (timestampContainer) {
                    const currentLang = localStorage.getItem('preferredLanguage') || document.documentElement.lang || 'es';
                    const t = translations[currentLang] || translations['es'];
                    timestampContainer.innerHTML = t.cryptoTimestamp + ' <span id="cryptoTimestamp">' + timeString + '</span>';
                }
            }

            function refreshCryptoPrices() {
                const btn = document.getElementById('refreshBtn');
                const refreshText = btn.querySelector('.refresh-text');
                const currentLang = localStorage.getItem('preferredLanguage') || 'en';
                const t = translations[currentLang];
                btn.disabled = true;
                if (refreshText) {
                    refreshText.textContent = t.cryptoUpdating;
                }

                fetchCryptoPrices().finally(() => {
                    btn.disabled = false;
                    if (refreshText) {
                        refreshText.textContent = t.cryptoRefresh;
                    }
                });
            }

            // Intervalo de actualización: 4 minutos (x1.25 más rápido que antes)
            setInterval(fetchCryptoPrices, 4 * 60 * 1000);

            // NO cargar automáticamente - solo cuando se muestre la sección Web3
            // La función showSection ya maneja esto cuando sectionId === 'web3'

            // ============================================
            // MARKET INTELLIGENCE - DEFILLAMA API
            // ============================================
            // Protocol images mapping - usar STATIC_IMAGES_URL que ya está definido
            const PROTOCOL_IMAGES = {
                'Lido': STATIC_IMAGES_URL + 'lido_dao.jpeg',
                'Lido DAO': STATIC_IMAGES_URL + 'lido_dao.jpeg',
                'SSV Network': STATIC_IMAGES_URL + 'ssv.png',
                'SSV': STATIC_IMAGES_URL + 'ssv.png',
                'Aave': STATIC_IMAGES_URL + 'aave-aave-logo.png',
                'Aave V3': STATIC_IMAGES_URL + 'aave-aave-logo.png',
                'Aave Horizon': STATIC_IMAGES_URL + 'aave-aave-logo.png',
                'Aave Horizon RWA': STATIC_IMAGES_URL + 'aave-aave-logo.png',
                'MakerDAO': STATIC_IMAGES_URL + 'maker-mkr-logo.png',
                'Maker': STATIC_IMAGES_URL + 'maker-mkr-logo.png',
                'Curve': STATIC_IMAGES_URL + 'curve-dao-token-crv-logo.png',
                'Curve DEX': STATIC_IMAGES_URL + 'curve-dao-token-crv-logo.png',
                'Convex': STATIC_IMAGES_URL + 'convex-finance-cvx-logo.png',
                'Convex Finance': STATIC_IMAGES_URL + 'convex-finance-cvx-logo.png',
                'Rocket Pool': STATIC_IMAGES_URL + 'rocket-pool-rpl-glass-crypto-coin-3d-illustration-free-png.webp',
                'Stakewise': STATIC_IMAGES_URL + 'stakewise200.png',
                'StakeWise': STATIC_IMAGES_URL + 'stakewise200.png',
                'StakeWise ETH': STATIC_IMAGES_URL + 'stakewise200.png',
                'Frax Ether': STATIC_IMAGES_URL + 'frax_images.png',
                'Frax': STATIC_IMAGES_URL + 'frax_images.png',
                'FRAX Ether': STATIC_IMAGES_URL + 'frax_images.png'
            };

            // Las categorías vienen de la API de DefiLlama en inglés. Traducimos las
            // conocidas para la versión española; si aparece una categoría nueva que no
            // está en el mapa, se muestra tal cual la devuelve la API (mejor que ocultarla).
            const CATEGORY_ES = {
                'Liquid Staking': 'Staking Líquido',
                'Lending': 'Préstamos',
                'Dexes': 'Exchanges Descentralizados',
                'Dexs': 'Exchanges Descentralizados',
                'Yield': 'Rendimiento',
                'Yield Aggregator': 'Agregador de Rendimiento',
                'Bridge': 'Puente',
                'Derivatives': 'Derivados',
                'Restaking': 'Restaking',
                'RWA Lending': 'Préstamos RWA',
                'CDP': 'CDP'
            };

            function translateCategory(category) {
                if (!category) return null;
                const lang = document.documentElement.lang || 'es';
                if (lang === 'es' && CATEGORY_ES[category]) return CATEGORY_ES[category];
                return category;
            }

            const MARKET_CONFIG = {
                defi: {
                    names: ['Aave', 'MakerDAO', 'Curve', 'Lido', 'Balancer', 'Convex'],
                    minTVL: 100000000
                },
                staking: {
                    names: ['Lido', 'Rocket Pool', 'EigenLayer', 'Stakewise', 'Frax Ether'],
                    minTVL: 50000000
                }
            };

            // Se cachea para poder re-renderizar las tarjetas al cambiar de idioma
            // sin volver a pedir los datos a la API.
            // 'var' (no 'let'/'const') a propósito: changeLanguage('es') se ejecuta
            // en la carga inicial de la página, antes de llegar a esta línea del
            // script. Con 'let' eso lanza un ReferenceError (temporal dead zone) sin
            // capturar, que aborta el resto del script — incluido el registro de los
            // listeners de los botones de idioma. 'var' se inicializa a 'undefined'
            // desde el principio y evita el problema.
            var cachedProtocols = null;

            async function loadMarketData() {
                try {
                    const response = await fetch('https://api.llama.fi/protocols');
                    if (!response.ok) throw new Error('Error fetching protocols');

                    const allProtocols = await response.json();
                    cachedProtocols = allProtocols;

                    renderProtocolsTab('defi', allProtocols);
                    renderProtocolsTab('staking', allProtocols);

                    setupMarketTabs();

                } catch (error) {
                    console.error('Error loading market data:', error);
                    showMarketError();
                }
            }

            function rerenderMarketDataForLanguage() {
                if (!cachedProtocols) return;
                renderProtocolsTab('defi', cachedProtocols);
                renderProtocolsTab('staking', cachedProtocols);
            }

            function renderProtocolsTab(tabType, allProtocols) {
                const config = MARKET_CONFIG[tabType];
                const container = document.getElementById(`${tabType}-grid`);

                if (!container) return;

                const filtered = allProtocols
                    .filter(p =>
                        config.names.some(name =>
                            p.name.toLowerCase().includes(name.toLowerCase())
                        ) && p.tvl > config.minTVL
                        // Excluir Aave V2, Balancer V2 y Aave Horizon RWA (poco market cap)
                        && !p.name.toLowerCase().includes('aave v2')
                        && !p.name.toLowerCase().includes('balancer v2')
                        && !p.name.toLowerCase().includes('aave horizon rwa')
                    )
                    .sort((a, b) => b.tvl - a.tvl)
                    .slice(0, 6);

                if (filtered.length === 0) {
                    const t = translations[document.documentElement.lang || 'es'] || translations['es'];
                    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">${t.marketNoProtocols}</p>`;
                    return;
                }

                container.innerHTML = filtered
                    .map((p) => createProtocolCard(p))
                    .join('');
            }

            function createProtocolCard(protocol) {
                const tvl = formatCurrency(protocol.tvl);
                const change24h = protocol.change_1d || 0;
                const change7d = protocol.change_7d || 0;
                const changeClass = change24h >= 0 ? 'positive' : 'negative';
                const changeSymbol = change24h >= 0 ? '↑' : '↓';
                const t = translations[document.documentElement.lang || 'es'] || translations['es'];

                // Buscar imagen para el protocolo
                let logoHTML = '';
                let protocolImage = PROTOCOL_IMAGES[protocol.name];
                // Si no encuentra coincidencia exacta, buscar por coincidencia parcial (case-insensitive)
                if (!protocolImage) {
                    const protocolNameLower = protocol.name.toLowerCase();
                    for (const [key, imagePath] of Object.entries(PROTOCOL_IMAGES)) {
                        if (protocolNameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(protocolNameLower)) {
                            protocolImage = imagePath;
                            break;
                        }
                    }
                }
                if (protocolImage) {
                    logoHTML = `<img src="${protocolImage}" alt="${protocol.name} logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%;">`;
                } else {
                    // Fallback: usar las iniciales del protocolo
                    const initials = protocol.name.substring(0, 2).toUpperCase();
                    logoHTML = `<span style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">${initials}</span>`;
                }

                return `
                <div class="protocol-card">
                    <div class="protocol-header">
                        <div class="protocol-logo">${logoHTML}</div>
                        <div class="protocol-info">
                            <h3 class="protocol-name">${protocol.name}</h3>
                            <p class="protocol-category">${translateCategory(protocol.category) || t.marketProtocolFallback}</p>
                        </div>
                    </div>

                    <div class="protocol-metrics">
                        <div class="metric">
                            <p class="metric-label">TVL</p>
                            <p class="metric-value">${tvl}</p>
                            <div class="metric-change ${changeClass}">
                                ${changeSymbol} ${Math.abs(change24h).toFixed(2)}% (24h)
                            </div>
                        </div>
                        <div class="metric">
                            <p class="metric-label">${t.market7dChange}</p>
                            <p class="metric-value">
                                ${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%
                            </p>
                            <div class="metric-change ${change7d >= 0 ? 'positive' : 'negative'}">
                                ${change7d >= 0 ? t.marketGrowing : t.marketDeclining}
                            </div>
                        </div>
                    </div>

                    <a href="${protocol.url || '#'}" target="_blank" rel="noopener" class="protocol-link">
                        ${t.marketViewProtocol} <span>→</span>
                    </a>
                </div>
            `;
            }

            function formatCurrency(value) {
                if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
                if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
                return `$${value.toFixed(0)}`;
            }

            function setupMarketTabs() {
                const buttons = document.querySelectorAll('.market-tab-btn');
                const contents = document.querySelectorAll('.market-tab-content');
                const defiAttribution = document.getElementById('marketFooterAttribution');

                buttons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const tab = btn.getAttribute('data-tab');

                        buttons.forEach(b => {
                            b.classList.remove('active');
                            b.setAttribute('aria-selected', 'false');
                        });
                        contents.forEach(c => c.classList.remove('active'));

                        btn.classList.add('active');
                        btn.setAttribute('aria-selected', 'true');
                        const tabContent = document.getElementById(`tab-${tab}`);
                        if (tabContent) tabContent.classList.add('active');

                        // El aviso "Datos de DefiLlama" solo aplica a DeFi/Staking,
                        // no a las acciones cripto (precios simulados).
                        if (defiAttribution) defiAttribution.style.display = tab === 'stocks' ? 'none' : '';
                    });
                });
            }

            function showMarketError() {
                const containers = ['defi-grid', 'staking-grid'];
                containers.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.innerHTML = '<p style="grid-column: 1/-1; color: var(--color-primary);">Error loading data</p>';
                });
            }

            // Cargar datos de market intelligence cuando se muestre la sección Web3
            // No cargar automáticamente, solo cuando se muestre la sección
            // La función showSection ya maneja esto
