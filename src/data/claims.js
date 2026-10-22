/* Claims registry. Every factual statement shown in the apps lives here with a tag, sources and a check date.
   The shell refuses to render a claim that lacks a source or date.
   Tags: documented, practice, illustrative, simulated, mandatory, recommended, some, verified, plausible, unverified. */
(function () {
  const D = '2026-10-22';
  const S = {
    rfc: (n, t) => ({ title: `IETF RFC ${n}: ${t}`, url: `https://www.rfc-editor.org/rfc/rfc${n}` }),
    starlinkTech: { title: 'Starlink — Technology (official page)', url: 'https://www.starlink.com/technology' },
    fcc2148: { title: 'US FCC Order FCC 21-48 (Space Exploration Holdings, April 2021)', url: 'https://docs.fcc.gov/public/attachments/FCC-21-48A1.pdf' },
    esaBands: { title: 'ESA — Satellite frequency bands', url: 'https://www.esa.int/Applications/Connectivity_and_Secure_Communications/Satellite_frequency_bands' },
    esaOrbits: { title: 'ESA — Types of orbits', url: 'https://www.esa.int/Enabling_Support/Space_Transportation/Types_of_orbits' },
    ts33501: { title: '3GPP TS 33.501: Security architecture and procedures for 5G System', url: 'https://www.3gpp.org/dynareport/33501.htm' },
    kit: { title: 'Educational simplification by the kit authors (not a measurement or official statement)' },
    kitArch: { title: 'Architectural reasoning by the kit authors; possible in principle, not evidence of any event' },
    dotAct: { title: 'Sanchar Saathi (Ministry of Communications) — Gazette copy of the Telecommunications Act, 2023', url: 'https://www.sancharsaathi.gov.in/Home/documents.jsp' },
    gaz2026: { title: 'Gazette of India — section 3(1) and 3(6) in force from 23 June 2026', url: 'https://egazette.gov.in/WriteReadData/2026/273762.pdf' },
    wireAct: { title: 'The Wire — Telecom Act notified partially (June 2024)', url: 'https://m.thewire.in/article/government/telecom-act-notified-partially-govt-to-get-more-powers-to-intercept-and-stop-messages' },
    interceptIFF: { title: 'Internet Freedom Foundation — First read on the Telecommunications Interception Rules, 2024', url: 'https://www.internetfreedom.in/first-read-telecom-interception-rules-2024/' },
    interceptMN: { title: 'MediaNama — Telecom interception rules notified (Dec 2024)', url: 'https://www.medianama.com/2024/12/223-telecom-interception-rules-notified-interception-records-destroying-secrecy/' },
    cyberRules: { title: 'DoT eServices — Telecom Cyber Security (Rules notified 21.11.2024)', url: 'https://www.eservices.dot.gov.in/cyber-security/' },
    certin: { title: 'CERT-In — Directions under section 70B(6) of the IT Act, 2000 (28 April 2022)', url: 'https://www.cert-in.org.in/Directions70B.jsp' },
    certinPSA: { title: 'PSA Legal — New CERT-In Directions: Overview and Implications', url: 'https://psalegal.com/new-cert-in-directions-overview-and-implications/' },
    trusted: { title: 'Tribune — Telecom companies allowed to install only govt-approved gear from June 15 (2021)', url: 'https://www.tribuneindia.com/news/business/telecom-companies-will-be-allowed-to-instal-only-govt-approved-gears-from-june-15-223310' },
    dpdp: { title: 'MeitY — Digital Personal Data Protection Act, 2023', url: 'https://www.meity.gov.in/data-protection-framework' },
    trai: { title: 'Telecom Regulatory Authority of India (TRAI Act, 1997)', url: 'https://www.trai.gov.in/' },
    traiSat: { title: 'Tribune — TRAI releases spectrum allocation guidelines and prices for satcom (May 2025)', url: 'https://www.tribuneindia.com/news/business/trai-releases-spectrum-allocation-guidelines-and-prices-for-satcom/' },
    traiSat2: { title: 'Outlook Business — TRAI proposes 4% AGR spectrum charge', url: 'https://www.outlookbusiness.com/corporate/trai-releases-service-conditions-for-satcoms-proposes-4-agr-spectrum-charge' },
    nixi: { title: 'NIXI — National Internet Exchange of India', url: 'https://nixi.in/' },
    nkn: { title: 'National Knowledge Network', url: 'https://nkn.gov.in/' },
    cables: { title: 'TeleGeography — Submarine Cable Map (India landing points)', url: 'https://www.submarinecablemap.com/country/india' },
    aws: { title: 'AWS — Global infrastructure regions (Mumbai, Hyderabad)', url: 'https://aws.amazon.com/about-aws/global-infrastructure/regions_az/' },
    inspace: { title: 'IN-SPACe (Indian National Space Promotion and Authorization Centre)', url: 'https://www.inspace.gov.in/' },
    air: { title: 'All India Radio News — Starlink receives licence (31 July 2025)', url: 'https://www.newsonair.gov.in/starlink-receives-license-to-launch-satellite-internet-service-in-india' },
    mnGmpcs: { title: 'MediaNama — Starlink receives GMPCS permit (June 2025)', url: 'https://www.medianama.com/2025/06/223-starlink-india-gmpcs-license-dot-approval/' },
    print: { title: 'ThePrint — Starlink says 20 gateways built, Indian user data to stay in India (7 Oct 2026)', url: 'https://theprint.in/tech/as-launch-awaits-clearance-starlink-says-20-gateways-built-indian-user-data-to-stay-in-india/3064053/' },
    bs: { title: 'Business Standard — Why Starlink\'s India launch is stalled (Oct 2026)', url: 'https://www.business-standard.com/industry/news/starlink-india-entry-why-elon-musk-satellite-internet-launch-clearance-126100800416_1.html' },
    outage: { title: 'Daily Maverick / Reuters — Starlink network suffers rare global outage (25 July 2025)', url: 'https://www.dailymaverick.co.za/article/2025-07-25-elon-musks-starlink-network-suffers-rare-global-outage/' },
    fips203: { title: 'NIST FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM), Aug 2024', url: 'https://csrc.nist.gov/pubs/fips/203/final' },
    noPrimary: { title: 'Example of a claim type seen in public debate. The kit authors found no primary evidence for it.' },
    eyTariff: { title: 'EY — US imposes additional tariffs on India for buying oil from Russia (Aug 2025)', url: 'https://www.ey.com/en_gl/technical/tax-alerts/us-imposes-additional-tariffs-on-india-for-buying-oil-from-russia' },
    outlookTariff: { title: 'Outlook Business — Additional 25% tariff on India comes into effect', url: 'https://www.outlookbusiness.com/economy-and-policy/additional-25-tariff-imposed-by-us-president-trump-on-india-comes-into-effect' },
    cbsCrimea: { title: 'CBS News — Musk says he denied Ukraine satellite request near Crimea (Sept 2023)', url: 'https://www.cbsnews.com/amp/miami/news/elon-musk-ukraine-russia-war-starlink-satellite-denied-major-act-of-war' },
    snopesCrimea: { title: 'Snopes — Musk, internet access and Crimea', url: 'https://www.snopes.com/news/2023/09/14/musk-internet-access-crimea-ukraine/' },
    kiMinerals: { title: 'Kyiv Independent — US threatens to shut off Starlink if Ukraine won’t sign minerals deal, sources tell Reuters (Feb 2025)', url: 'https://kyivindependent.com/us-threatens-to-shut-off-starlink-if-ukraine-wont-sign-minerals-deal-sources-tell-reuters/' },
    hillOct: { title: 'The Hill — Questions flare over US role in Ukraine’s Starlink shut-off (Oct 2026)', url: 'https://thehill.com/policy/technology/6152345-elon-musk-starlink-ukraine-starshield/' },
    axiosOct: { title: 'Axios — Ukraine’s Starlink restrictions (14 Oct 2026)', url: 'https://www.axios.com/2026/10/14/ukraine-starlink-zelensky-spacex-musk-trump' },
    wsjOct: { title: 'U.S. News / WSJ — Musk ordered Starlink slowdown that blindsided Ukraine (20 Oct 2026)', url: 'https://www.usnews.com/news/world/articles/2026-10-20/musk-ordered-starlink-slowdown-that-blindsided-ukraine-wsj-reports' },
    stripesOct: { title: 'Stars and Stripes — Lawmakers call for investigation into Starlink disruptions (21 Oct 2026)', url: 'https://www.stripes.com/theaters/us/2026-10-21/lawmakers-investigation-ukraine-starlink-disruptions-23218791.html' },
    wikiUA: { title: 'Wikipedia — 2026 in Ukraine (secondary summary; 1 February entry)', url: 'https://en.wikipedia.org/wiki/2026_in_Ukraine' },
    outlookBrahmos: { title: 'Outlook India — BrahMos engineer arrested for allegedly leaking data over Facebook (Oct 2018)', url: 'https://www.outlookindia.com/national/spying-for-pakistan-brahmos-engineer-arrested-for-allegedly-leaking-sensitive-data-over-facebook-news-318012' },
    weekBrahmos2024: { title: 'The Week — Former BrahMos engineer sentenced to life (3 June 2024)', url: 'https://www.theweek.in/news/india/2024/06/03/former-brahmos-engineer-sentenced-to-life-for-spying-for-pakistans-isi.amp.html' },
    weekBrahmos2025: { title: 'The Week / PTI — Ex-BrahMos engineer walks out of jail after 7 years (3 Dec 2025)', url: 'https://www.theweek.in/wire-updates/national/2025/12/03/bom26-mh-brahmos-engineer.html' },
    wireKurulkar: { title: 'The Wire — Maharashtra ATS arrests DRDO scientist (May 2023)', url: 'https://thewire.in/security/maharashtra-ats-arrests-senior-drdo-scientist-for-wrongful-communication-with-pakistani-agent' },
    scrollKurulkar: { title: 'Scroll — DRDO scientist Pradeep Kurulkar chargesheeted (June 2023)', url: 'https://scroll.in/latest/1052271/drdo-scientist-pradeep-kurulkar-chargesheeted-in-espionage-case-by-maharashtra-police' },
    weekArmy: { title: 'The Week — Beware of honey trap: Army warns soldiers (Nov 2019)', url: 'https://www.theweek.in/news/india/2019/11/07/beware-of-honey-trap-army-warns-soldiers.html' },
    dhApps: { title: 'Deccan Herald — Army asks personnel to delete 89 apps (July 2020)', url: 'https://www.deccanherald.com/amp/story/india%2Findian-army-asks-personnel-to-delete-facebook-tiktok-pubg-86-other-apps-858884.html' },
    navyBan: { title: 'Inc42 — Indian Navy bans Facebook and smartphones after honey traps (Dec 2019)', url: 'https://inc42.com/?p=186193' },
    puttaswamy: { title: 'Justice K.S. Puttaswamy (Retd.) v. Union of India (2017) — summary', url: 'https://www.understandupsc.com/justice-k-s-puttaswamy-retd-v-union-of-india-2017/' },
    waWhitepaper: { title: 'WhatsApp Encryption Overview (technical white paper)', url: 'https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf' },
    signalDocs: { title: 'Signal Protocol technical documentation', url: 'https://signal.org/docs/' },
  };

  const C = {
    /* ---------------- App 1: satellite internet ---------------- */
    'leo-altitude': { tag: 'documented', text: 'Low Earth orbit is generally below about 2,000 km. The US FCC authorised Starlink\'s first-generation shells at roughly 540–570 km.', sources: [S.esaOrbits, S.fcc2148] },
    'starlink-isl': { tag: 'documented', text: 'Starlink says each current satellite carries three optical inter-satellite links ("space lasers"), which can pass traffic between satellites before it reaches a gateway.', sources: [S.starlinkTech] },
    'starlink-antennas': { tag: 'documented', text: 'Starlink says its satellites use Ku-band phased-array antennas and dual-band Ka/E-band antennas.', sources: [S.starlinkTech] },
    'bands': { tag: 'documented', text: 'Satellite broadband commonly uses Ku-band (about 12–18 GHz) and Ka-band (about 26.5–40 GHz) radio frequencies.', sources: [S.esaBands] },
    'terminal-array': { tag: 'practice', text: 'LEO user terminals use electronically steered phased-array antennas that follow satellites across the sky and hand over from one satellite to the next.', sources: [S.starlinkTech, S.kit] },
    'route-depends': { tag: 'practice', text: 'Which satellite, inter-satellite path and gateway carry a packet depends on satellite visibility, congestion, gateway location and operator configuration. Operators do not publish per-packet routes.', sources: [S.kit] },
    'gateway-role': { tag: 'practice', text: 'A ground gateway (ground station) connects the satellite network to terrestrial fibre and to the operator\'s core network.', sources: [S.kit] },
    'tls-protects': { tag: 'documented', text: 'TLS 1.3 encrypts the content of an HTTPS exchange and authenticates the website, so networks in between cannot read or silently alter page content.', sources: [S.rfc(8446, 'TLS 1.3')] },
    'tls-limits': { tag: 'documented', text: 'TLS does not hide IP addresses, timing or traffic volume. The site name sent in the handshake (SNI) stays visible unless Encrypted Client Hello is used, which many sites do not support yet.', sources: [S.rfc(8446, 'TLS 1.3'), S.rfc(6066, 'TLS Extensions (SNI)')] },
    'dns-visible': { tag: 'documented', text: 'Classic DNS lookups are not encrypted. DNS over HTTPS or TLS hides them from networks along the path, but not from the resolver that answers them.', sources: [S.rfc(8484, 'DNS over HTTPS'), S.rfc(7858, 'DNS over TLS')] },
    'quic': { tag: 'documented', text: 'QUIC runs over UDP with TLS 1.3 built in. HTTP/3 runs on QUIC.', sources: [S.rfc(9000, 'QUIC'), S.rfc(9114, 'HTTP/3')] },
    'tcp': { tag: 'documented', text: 'TCP gives a reliable, ordered byte stream and retransmits lost segments. On long or lossy paths, this adds delay.', sources: [S.rfc(9293, 'TCP')] },
    'bgp': { tag: 'documented', text: 'Independent networks (autonomous systems) exchange reachability with BGP-4. Routers forward IP packets hop by hop using those routes.', sources: [S.rfc(4271, 'BGP-4'), S.rfc(791, 'Internet Protocol')] },
    'link-separate': { tag: 'practice', text: 'Encryption on the terminal–satellite radio link and security inside the operator network are set by the operator. They are separate from TLS and protect against different attackers.', sources: [S.kit] },
    'mobile-auth': { tag: 'documented', text: 'In 5G, the mobile core authenticates each subscriber with keys held on the SIM, and radio traffic between phone and base station is encrypted.', sources: [S.ts33501] },
    'complementary': { tag: 'practice', text: 'Satellite and mobile networks both hand traffic to terrestrial fibre. Satellite reaches places without towers or fibre; dense areas are usually served more cheaply by mobile and fixed networks.', sources: [S.kit] },
    'latency-sim': { tag: 'simulated', text: 'All latency, hop and availability numbers in this app come from a teaching model. They are not measured performance of Starlink or any other service.', sources: [S.kit] },
    'outage-2025': { tag: 'verified', text: 'On 24 July 2025 Starlink had a global outage of about two and a half hours. Its engineering lead attributed it to a failure of internal software services that operate the core network.', sources: [S.outage] },

    /* ---------------- App 2: India ---------------- */
    'telecom-act': { tag: 'documented', text: 'The Telecommunications Act, 2023 (44 of 2023) replaces the Indian Telegraph Act, 1885 framework. It is coming into force in stages: the first sections on 26 June 2024, and the authorisation provisions of section 3(1) and 3(6) on 23 June 2026.', sources: [S.dotAct, S.wireAct, S.gaz2026] },
    'intercept-rules': { tag: 'documented', text: 'The Telecommunications (Procedures and Safeguards for Lawful Interception of Messages) Rules, 2024, notified in December 2024, set who may order interception, how orders are reviewed and how records are destroyed. Critics note that oversight is executive, not judicial.', sources: [S.interceptMN, S.interceptIFF] },
    'cyber-rules': { tag: 'documented', text: 'The Telecommunications (Telecom Cyber Security) Rules, 2024, notified on 21 November 2024, require telecom entities to report security incidents within six hours and to appoint a Chief Telecommunication Security Officer.', sources: [S.cyberRules] },
    'certin': { tag: 'documented', text: 'CERT-In directions of 28 April 2022 (in force 27 June 2022) require specified cyber incidents to be reported within 6 hours and ICT logs to be kept in India for 180 days.', sources: [S.certin, S.certinPSA] },
    'trusted-source': { tag: 'documented', text: 'Since 15 June 2021, telecom licence conditions require operators to connect only "trusted products" from "trusted sources" designated by the National Cyber Security Coordinator.', sources: [S.trusted] },
    'dpdp': { tag: 'documented', text: 'The Digital Personal Data Protection Act, 2023 sets duties for organisations that process digital personal data, including security safeguards and breach notification.', sources: [S.dpdp] },
    'trai-role': { tag: 'documented', text: 'TRAI, set up under the TRAI Act, 1997, regulates tariffs and quality of service and makes recommendations such as on spectrum. Licensing decisions sit with the Department of Telecommunications.', sources: [S.trai] },
    'trai-satcom': { tag: 'documented', text: 'In May 2025 TRAI recommended administrative assignment of satellite spectrum at 4% of adjusted gross revenue, plus ₹500 per urban subscriber per year for non-geostationary broadband. These were recommendations to DoT, not final rules.', sources: [S.traiSat, S.traiSat2] },
    'nixi': { tag: 'documented', text: 'NIXI operates internet exchange points in many Indian cities, so traffic between Indian networks can be exchanged within India.', sources: [S.nixi] },
    'nkn': { tag: 'documented', text: 'The National Knowledge Network is a government network that links research and education institutions.', sources: [S.nkn] },
    'cables': { tag: 'documented', text: 'Most of India\'s international submarine cables land in Mumbai and Chennai, with others in Kerala and Tamil Nadu.', sources: [S.cables] },
    'cloud-regions': { tag: 'documented', text: 'Major cloud providers run regions inside India, for example in Mumbai and Hyderabad.', sources: [S.aws] },
    'inspace': { tag: 'documented', text: 'IN-SPACe authorises space activities by non-government entities, including satellite constellations serving India.', sources: [S.inspace] },
    'rpki': { tag: 'documented', text: 'RPKI route-origin validation lets a network reject routes announced by an origin that is not authorised for that address block. Deployment varies by operator.', sources: [S.rfc(6811, 'BGP Prefix Origin Validation'), S.rfc(6480, 'RPKI')] },
    'no-https-read': { tag: 'documented', text: 'Without control of a device or the website, an operator cannot read the content of a correctly configured HTTPS connection. It can see addresses, timing, volume and often the site name.', sources: [S.rfc(8446, 'TLS 1.3')] },
    'resilience-model': { tag: 'illustrative', text: 'The Resilience Lab is an educational model, not an official Indian government rating. Its weights are chosen for teaching and shown in full.', sources: [S.kit] },

    /* ---------------- Satellite in India: status ---------------- */
    'starlink-gmpcs': { tag: 'verified', text: 'The Department of Telecommunications granted Starlink a GMPCS authorisation in June 2025.', sources: [S.mnGmpcs, S.air] },
    'starlink-inspace': { tag: 'verified', text: 'IN-SPACe authorised Starlink\'s first-generation constellation for India on 8 July 2025.', sources: [S.air] },
    'satcom-pending': { tag: 'verified', text: 'As of October 2026, Starlink, Jio Satellite and OneWeb India were reported to be awaiting final security clearance and spectrum assignment before starting commercial service.', sources: [S.print, S.bs] },
    'starlink-gateways': { tag: 'verified', text: 'In October 2026 a SpaceX executive said Starlink had built 20 gateway sites in India and that its goal is to keep Indian user data in India.', sources: [S.print] },
    'satcom-conditions': { tag: 'verified', text: 'DoT security conditions for satcom operators, as reported, require network traffic and monitoring systems to be located in India.', sources: [S.print] },
    'ml-kem': { tag: 'verified', text: 'NIST published ML-KEM (FIPS 203) in August 2024 as a standard post-quantum key-establishment method.', sources: [S.fips203] },


    /* ---------------- Dependency and leverage: the case for the challenge ---------------- */
    'us-tariff': { tag: 'verified', text: 'In August 2025 the US imposed an additional 25% tariff on Indian goods, citing India’s purchases of Russian oil. India’s Ministry of External Affairs called it "unfair, unjustified and unreasonable".', sources: [S.eyTariff, S.outlookTariff] },
    'crimea-2022': { tag: 'verified', text: 'Elon Musk has said that in 2022 he declined a Ukrainian government request to activate Starlink coverage near Crimea for an attack. Ukraine could not override that decision.', sources: [S.cbsCrimea, S.snopesCrimea] },
    'ukraine-feb2026': { tag: 'verified', text: 'In February 2026 SpaceX switched off unapproved Starlink terminals across Ukraine because Russian forces were using the service. Terminals approved by Ukraine’s defence ministry kept working.', sources: [S.wikiUA] },
    'ukraine-oct2026': { tag: 'verified', text: 'In October 2026 the military version of Starlink (Starshield) used by Ukraine was capped at about 100 mph (160 km/h), so fast drones lost connection. The Wall Street Journal reported that Musk ordered the slowdown. Musk said limits are decided by the US military and ultimately the President; the White House and Pentagon denied any role. Zelensky said access was "still limited", and US lawmakers have called for an investigation.', sources: [S.stripesOct, S.wsjOct, S.hillOct, S.axiosOct] },
    'reuters-minerals': { tag: 'unverified', text: 'Reported, not confirmed: in February 2025 Reuters, citing anonymous sources, reported that US negotiators raised cutting Ukraine’s Starlink access to secure a minerals deal. Elon Musk denied it.', sources: [S.kiMinerals] },
    'pl-killswitch': { tag: 'plausible', text: 'A country that relies on one foreign-controlled network for critical connectivity can have that service limited by the operator or by the operator’s home government, and cannot override the decision. This applies to any foreign provider, whatever its nationality.', sources: [S.kitArch, S.hillOct, S.cbsCrimea] },


    /* ---------------- Honey traps and social-engineering espionage ---------------- */
    'ht-agarwal': { tag: 'verified', text: 'A BrahMos Aerospace engineer, Nishant Agarwal, was arrested in 2018 after contact through fake social-media profiles linked by investigators to Pakistan’s ISI, and was convicted in 2024. In December 2025 the Bombay High Court cleared him of spying, finding intent and wrongful communication not proven, but upheld one charge of failing to take reasonable care after he downloaded malware at a fake contact’s request.', sources: [S.outlookBrahmos, S.weekBrahmos2024, S.weekBrahmos2025] },
    'ht-kurulkar': { tag: 'verified', text: 'In May 2023 a senior DRDO scientist, Pradeep Kurulkar, was arrested and later charged under the Official Secrets Act, accused of passing information to a Pakistani operative he met on social media, through WhatsApp voice and video calls. The charges have not been proven in court as of the last check.', sources: [S.wireKurulkar, S.scrollKurulkar] },
    'ht-forces': { tag: 'verified', text: 'The Indian armed forces treat honey traps as a live threat: the Army warned soldiers about fake profiles in 2019, the Navy restricted social media after sailors were honey-trapped, and in July 2020 the Army ordered personnel to delete 89 apps including Facebook, WhatsApp and Tinder.', sources: [S.weekArmy, S.navyBan, S.dhApps] },
    'e2e': { tag: 'documented', text: 'End-to-end encrypted messengers such as WhatsApp and Signal encrypt messages on the sender’s device. Networks that carry the traffic, including gateways, cannot read the content; they can see metadata such as which servers are contacted, when and how much.', sources: [S.waWhitepaper, S.signalDocs] },
    'puttaswamy': { tag: 'documented', text: 'In 2017 a nine-judge Supreme Court bench held privacy to be a fundamental right. Any intrusion must meet three tests: legality, a legitimate aim, and proportionality.', sources: [S.puttaswamy] },
    'pl-blindspot': { tag: 'plausible', text: 'If satellite traffic for Indian users did not pass through Indian gateways, lawful, targeted interception and metadata requests would not work on it, and a suspect could use satellite internet to avoid an investigation.', sources: [S.kitArch, S.print] },

    /* ---------------- App 3: plausible risks ---------------- */
    'pl-central': { tag: 'plausible', text: 'When one operator runs the control plane for every terminal, a single failure or misconfiguration can disconnect all users at once. The July 2025 outage shows that this failure mode is real, but it is not evidence of intent.', sources: [S.kitArch, S.outage] },
    'pl-jurisdiction': { tag: 'plausible', text: 'An operator subject to laws in several countries can face conflicting legal orders, for example on data access or service suspension.', sources: [S.kitArch] },
    'pl-metadata': { tag: 'plausible', text: 'Even with TLS, the operator of any access network can see subscriber location, timing and volume metadata. Where that metadata is stored and who can access it decides the risk.', sources: [S.kitArch, S.rfc(8446, 'TLS 1.3')] },
    'pl-supply': { tag: 'plausible', text: 'Satellites, terminals and gateway equipment are complex supply chains. Compromise of any component or update channel is possible in principle for any vendor.', sources: [S.kitArch] },
    'pl-harvest': { tag: 'plausible', text: 'Traffic recorded today could be decrypted later if a large quantum computer breaks today\'s key exchange ("harvest now, decrypt later"). Post-quantum key exchange reduces this risk.', sources: [S.kitArch, S.fips203] },

    /* ---------------- App 3: unverified allegations (examples of claim types) ---------------- */
    'un-killswitch': { tag: 'unverified', text: 'Claim type: "The October 2026 restriction in Ukraine was ordered because of US–Russia fuel or energy deals." Reports note that it followed an announced Russia–Ukraine "energy ceasefire" and US moves to ease some Russia sanctions over fuel costs, but no source establishes that this was the reason, and who ordered it is disputed. The verified point is narrower: the restriction happened, and Ukraine could not stop it.', sources: [S.noPrimary, S.stripesOct] },
    'un-bypass': { tag: 'unverified', text: 'Claim type: "Satellite internet lets users bypass Indian lawful interception entirely." This is contradicted by reported licence conditions requiring in-India gateways and monitoring, and it has not been shown for any licensed operator.', sources: [S.noPrimary, S.print] },
    'un-backdoor': { tag: 'unverified', text: 'Claim type: "Satellite terminals contain hidden backdoors." No public technical evidence was found. Supply-chain compromise remains a plausible risk category for any vendor.', sources: [S.noPrimary] },
  };

  for (const k of Object.keys(C)) C[k].verified = C[k].verified || D;
  window.CLAIMS = C;
  window.CLAIM_SOURCES = S;
})();
