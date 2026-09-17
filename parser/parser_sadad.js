// parser/parser_sadad.js
// Parses SADAD bill payment numbers from text.
//
// Extraction is label-anchored: a digit run is only treated as a bill number
// when it sits adjacent to a known Arabic bill-label, and a 1-3 digit code is
// only treated as a type when it sits adjacent to a known biller-label.
// This deliberately rejects IBANs, phone numbers, court/case numbers, and
// time-of-day digits, which the older loose-matching parser stored as bills.

const SADAD_TYPES = [                                        // catalog of every known SADAD biller type code
    "001", // STC
    "002", // Saudi Electricity Company
    "003", // Tawuniya
    "004", // Marafiq
    "005", // Mobily
    "006", // Medina Region Municipality
    "007", // Home Computer Initiative
    "008", // Qiyas
    "009", // KAU
    "010", // Riyadh Municipality
    "013", // MC
    "014", // STC Specialized
    "015", // Water Services
    "016", // Al Ahli Finance and Credit Cards
    "017", // Arab Open University
    "018", // American Express
    "020", // Zakat, Tax and Customs Authority
    "021", // Saudi Post
    "022", // Saudi Arabian Airlines
    "024", // Al Yusr Leasing and Financing Company
    "025", // Eastern Province Municipality
    "026", // FlyNas
    "027", // Holy Makkah Municipality
    "028", // Municipality of Jeddah
    "029", // Saudi Awwal Services
    "032", // OSN
    "033", // GO Telecom
    "034", // Mubasher
    "035", // Cadre Economic
    "036", // SIMAH
    "039", // Awan For Market Data
    "040", // Real Estate Fund
    "041", // Ministry of Interior
    "042", // Communications and Information Technology Commission
    "043", // Adahi
    "044", // Zain
    "045", // Agricultural Fund
    "046", // The Royal Commission in Yanbu
    "047", // Al Riyad Press Est.
    "048", // Sahara Net
    "049", // Saudi Standards Metrology and Quality Organization
    "050", // Ministry of Human Resources and Social Development
    "051", // MOM
    "052", // TAYSEER COMPANY
    "053", // Al Jazirah Newspaper
    "054", // Al Rajhi Services
    "055", // Salam
    "056", // Falcon Credit Card
    "057", // Ministry of tourism
    "058", // Social Development Bank
    "59",  // un-padded legacy entry for biller code 059
    "060", // GOSI
    "061", // Hail Municipality
    "062", // Tabouk Municipality
    "063", // Taajeer Group
    "064", // Jazan Municipality
    "065", // Abdul Latif Jameel United Finance
    "067", // Riyad Bank Payments
    "068", // Modon
    "069", // Tamwily
    "070", // Al Qassim Municipality
    "071", // Al Fransi Payment Services
    "072", // Al Yamamah University
    "073", // Riyadh Chamber of Commerce and Industry
    "75",  // un-padded legacy entry for biller code 075
    "075", // Ministry of Transport
    "076", // Arab Media Company
    "077", // Assemblies of teaching Quran
    "078", // Bank Al Jazira Payment Services
    "079", // Al Amthal Leasing
    "080", // King Saud University
    "081", // Al Majd TV channels
    "082", // ANB Payments
    "084", // Aseer Province Municipality
    "085", // Elm Company
    "086", // Al Jaber Finance
    "087", // Najran Province Municipality
    "88",  // un-padded legacy entry for biller code 088
    "088", // Ministry of Finance
    "089", // Saudi Ports Authority
    "090", // Ministry of Industry and Mineral Resources
    "92",  // un-padded legacy entry for biller code 092
    "098", // General Authority of Civil Aviation
    "100", // Ministry of Economy and Planning
    "101", // Ministry of Foreign Affairs
    "102", // Municipality of Northern Borders
    "103", // Al Jouf Municipality
    "104", // Municipality of Al-Baha
    "105", // KACST
    "106", // Taibah University
    "107", // Smart Cash
    "108", // MISA
    "109", // Saudi Food And Drugs Authority
    "110", // Al Rajhi Takaful
    "111",  // biller code 111 (biller name not catalogued)
    "112", // Municipality Of Al Ahsa
    "113", // Municipality of Al Taif
    "114", // General Entertainment Authority
    "115", // TVTC
    "116", // Deputy Ministry for Mineral Resources
    "117", // King Fahad University of Petroleum and Minerals
    "118", // King Faisal University
    "119", // King Abdullah University of Science and Technology
    "120", // Al Mashaaer Al Muqaddasah Metro
    "122", // TAWZEA
    "123", // Saudi Council of Engineers
    "124", // Nayifat Finance Company
    "125", // Emirates NBD Payments
    "128", // Ministry of Health
    "129", // Saudi Commission For Health Specialties
    "130", // Bupa Arabia
    "131", // Raya Financing Co.
    "132", // UMM AL-QURA UNIVERSITY
    "133", // Saudi Heart Association
    "134", // United Electronics company-Extra
    "135", // Saudi E-Tabadul Company
    "136", // Arabian Shield Cooperative Insurance Co.
    "137", // Saudi Electronic University
    "138", // National Water Company
    "139", // ASHARQIA Chamber of Commerce and Industry
    "140", // AlBilad
    "141", // E_PROCURE
    "142", // Human Resources Development Fund
    "143", // Saudi Industrial Development Fund
    "144", // My Business Services
    "145", // Industrial Cities Development and Operating Co.
    "146", // Royal Commission of Jubail
    "147", // SHL Finance Company
    "148", // GASCO
    "149", // Saudi Telecom Company (SAWA)
    "150", // SAPTCO
    "151", // Virgin Mobile
    "152", // Gulf International Bank
    "153", // EJAR
    "154", // Economic Cities Authority
    "155", // Saudi Data and Artificial Intelligence Authority (SDAIA)
    "156", // Tamkeen Technologies
    "157", // Almawardir Manpower Company
    "158", // Civil Defense Directorate
    "159", // EEC
    "160", // Ministry of Justice
    "161", // Ministry of Haj and Umrah
    "162", // Saudi Grains Organization
    "163", // Saudi Investment Bank Payments
    "165", // Yanal Finance Company
    "166", // Ministry of Investment
    "167", // Saudi Manpower Solutions Co.
    "168", // IPA-BC
    "169", // Ministry of Justice Execution Agency
    "170", // Arabian Agricultural Services Company
    "171", // Ministry of Housing
    "172", // Aljasriah
    "175", // Bidaya Finance
    "176", // KACare
    "177", // Ministry of Municipal and Rural Affairs
    "179", // ARCO Human resources
    "180", // Public Transport Authority
    "181", // Flyadeal
    "182", // Sakani National Housing Company
    "183", // SAL
    "184", // Lebara
    "185", // SECB
    "186", // LEAN Business Services Company
    "187", // Ijarah Finance
    "188", // AJIL Financial Services Company
    "189", // Bayan Credit Bureau
    "190", // Pension
    "191", // Saudi Railway Company
    "192", // NMEC
    "193", // Nesma Air
    "195", // TWK
    "196", // ACIG
    "198", // Malath Insurance
    "199", // Takamol
    "200", // Mawhiba
    "201", // NatRec
    "204", // General Authority of Media Regulation
    "206", // HHSR
    "207", // STC bank
    "208", // SCA
    "210", // Sahab
    "211", // Taajeer Finance
    "213", // Maharah Human Resources Company
    "214", // ESAD for Human Resources Solutions and Management
    "216", // KAF
    "217", // RC_Jazan
    "218", // QU
    "219", // General Authority for Statistics
    "220", // General Administration of Ministry of Interior Personnel Club
    "221", // Saudi Irrigation Orgnization
    "222", // GDBG
    "223", // Majmaah University
    "224", // IMAM ABDULRAHMAN BIN FAISAL UNIVERSITY
    "225", // Advanced
    "226", // RC_Jazan
    "227", // General Commission for Survival
    "228", // Facilities Security Forces SAUDI
    "229", // Saudi Water Authority
    "230", // University of Tabuk
    "231", // RSLF
    "232", // FAB CC
    "233", // REGA
    "234", // PSD
    "235", // Saudi Geological Survey
    "236", // HafrBatin Amana
    "237", // MRPE
    "238", // islamic researches & ifta
    "239", // National Center for Wildlife
    "240", // MRDA
    "241", // Ministry Of Education
    "242", // SAIP
    "243", // ALBAHA UNIVERSITY
    "244", // Taif University
    "245", // Jazan University
    "246", // Najran university
    "247", // King Fahad Security College
    "248", // Royal Saudi Air Force
    "249", // King Khalid University
    "251", // University of Jeddah / Saudi Export Development Authority
    "252", // SANG
    "253", // MRDA
    "254", // SRCA
    "255", // Musaned
    "256", // NBU
    "257", // KFSH
    "258", // Saudi Energy Efficiency Center
    "259", // Premium Residency Center
    "260", // Rasid Jack
    "261", // Tasheel
    "262", // General Directorate of Passports
    "263", // Masar Al numou Finance
    "264", // Ministry of Islamic Affairs, Dawah and Guidance
    "265", // Royal Saudi Naval Forces
    "266", // General Authority for Competition
    "267", // Ministry of Energy
    "268", // NFSC
    "269", // Nuclear and Radiological Regulatory Commission
    "270", // Nafaqah
    "271", // Royal Commission for Makhak City and Holy Sites
    "272", // Royal Commission for Jubail and Yanbu
    "273", // Emirates Of Eastern Province
    "274", // Ministry of Culture
    "275", // GEA
    "276", // Saudi Central Board For Accreditation Of Universities & Colleges
    "278", // General Organization for military Industries
    "279", // Saudi Center For Economics Business
    "280", // ST
    "282", // Ministry of environment, water and agriculture
    "283", // Prince Sultan University
    "284", // Princess Nourah Bint Abdul Rahman University
    "285", // National Cybersecurity Authority
    "286", // CAMEL CLUB
    "287", // National Center of Metrology
    "288", // Saudi Accreditation Center
    "289", // Aljouf University
    "291", // King Khalid Military Academy
    "293", // General Authority for Military Industries
    "294", // Saudi Authority for Data and Artificial Intelligence
    "295", // Saudi Broadcasting Authority
    "296", // Royal Saudi Air Defense Forces
    "297", // Ministry of Sport
    "298", // The presidency of the staff
    "299", // Islamic University of Madinah
    "300", // University of Hail
    "301", // Shaqra University
    "302", // Emirate Of Madinah Province
    "303", // King Abdullah Air Defense College
    "305", // General Administration of Mujahideen
    "306", // Saudi Press Agency
    "307", // Aljouf Province Emirate
    "308", // AlQassim Province Emirate
    "309", // Albaha Emirates
    "310", // National Competitiveness Center
    "312", // Electronic Property Transfer
    "313", // Ministry of national
    "314", // MSLP
    "315", // General Department of Weapons and Explosives - Ministry of Interior
    "317", // King Khaled Eye Specialist Hospital
    "318", // Imam Mohammad Ibn Saud Islamic University
    "319", // Ras Al Khair City
    "320", // Royal Commission Health Services Program in Jubail
    "322", // Directorate General of Armed Forces Medical Services
    "323", // King Abdulaziz Royal Reserve
    "324", // Literature, Publishing & Translation Commission
    "325", // Museums Commission
    "326", // Heritage Commission
    "327", // Film Commission
    "328", // Libraries Commission
    "329", // Architecture and Design Commission
    "330", // Music Commission
    "331", // Theater and Performing Arts Commission
    "332", // Visual Arts Commission
    "333", // Culinary Arts Commission
    "334", // Fashion Commission
    "335", // National Center for Waste Management
    "336", // Emirates of Northern Borders Province
    "337", // Saudi Tourism Authority
    "338", // General Authority for Awqaf
    "339", // National Center for Non-Profit Sector
    "341", // Red Bull MOBILE
    "342", // Ministry Of Justice Judicial Costs
    "343", // Public Health Authority
    "346", // Salam Mobile
    "347", // Gas Solution Co.
    "349", // Emirate of hail region
    "351", // Strategic Missile Force
    "353", // Wataniya Finance Company
    "355", // Diriyah Gate Company Limited
    "356", // Imam Abdulaziz bin Mohammed Royal Reserve Development Authority
    "357", // Saudi Health Council
    "358", // Dhamen
    "359", // King Abdulaziz Arabian Horse Center
    "360", // National eLearning Center
    "361", // National Real Estate Registration Services company
    "363", // Saudi Auctions Co.
    "365", // Prince Sattam bin Abdulaziz University
    "366", // Heavy Equipment Regulatory Center
    "367", // UNIVERSITY OF HAFR AL BATIN
    "368", // QIWA
    "369", // Royal Commission for Riyadh City
    "370", // Emirate Of Jazan Province
    "371", // Sharqia Development Authority
    "372", // Real Estate General Authority
    "373", // Self-Financial Revenue Fund at King Abdullah Medical City
    "376", // King Saud bin Abdulaziz University for Health Sciences
    "377", // The General Authority for the Custodianship of the Affairs of the Prophet's Mosque
    "378", // General Secretariat of Government Tenders and Procurement Law Committees
    "379", // King Salman Global Academy for Arabic Language
    "380", // National Carrier Transportation Company
    "381", // Education & Training Authority
    "383", // Capital Market Authority
    "384", // Tazweed
    "385", // Emirate of Tabuk Province
    "387", // Saudi Red Sea Authority
    "388", // Emirate of Riyadh region
    "389", // Saudi Central Bank
    "390", // Imam Turki Bin Abdullah Royal Nature Reserve Development Authority
    "391", // University of Bisha
    "392", // General Directorate for Prisons
    "393", // King Abdullah International Medical Research Center
    "394", // Roads General Authority
    "396", // The General Organization for the Conservation of Coral Reefs and Turtles in the Red Sea
    "397", // National Center for Vegetation Development and Combating Desertification
    "398", // Medical Services Ministry of Interior
    "399", // National Center for Mental Health Promotion
    "400", // Riyadh Infrastructure Projects Center
    "402", // Medical Cities Operating Program
    "403", // Security Forces Hospital Program - Riyadh
    "404", // security forces hospital Makkah
    "405", // security forces hospital Dammam
    "406", // Emkan
    "407", // Digital Government Authority
    "408", // National industrial development center
    "410", // Council of health insurance
    "411", // Alinma Bank
    "412", // SABER
    "414", // SNBC Saving Plans Collection Account
    "415", // Diriyah Gate Development
    "416", // National Gas Supply Company
    "417", // Khazeen
    "418", // Government programs and facilities
    "419", // Mahd Sports Academy
    "420", // Al Ahsa Development Authority
    "421", // Emirate Of Aseer Province
    "422", // Jazan Region Development Strategic Office
    "423", // Special Security Forces
    "429", // National Center for Inspection and Monitoring
    "430", // General Directorate of Narcotic Control
    "431", // Armed Forces Officers Clubs Fund
    "433", // Ministry of the interior
    "434", // Royal Guard Presidency
    "435", // Presidency of State Security
    "436", // Presidency of state security General investigation
    "437", // General directorate of civil status
    "438", // General Authority for Foreign Trade
    "439", // High Authority for Industrial Security
    "440", // Special Emergency Forces
    "441", // Private Affairs of the Custodian of the Two Holy Mosques
    "443", // Ministry of Communications and Information Technology
    "444", // Self-Financing Fund Development
    "445", // King Abdulaziz Complex For Endowment Libraries
    "446", // King Fahad National Library
    "447", // Supreme Council Judicial
    "448", // Hail Region Development Authority
    "449", // Control and Anti-Corruption Commision
    "450", // Prince Mohammed bin Salman Royal Reserve Development Authority
    "451", // National Center for Privatization
    "454", // MINISTRY OF DEFENSE - GENERAL BUREAU
    "455", // Agriculture R and D Center
    "456", // Public prosecution
    "457", // King Salman for Prophet Hadith
    "458", // National Institute For Educational Professional Development
    "459", // Quality of life program center
    "460", // MAEE CENTER
    "465", // Family Affairs Council
    "471", // Human Rights Commission
    "901", // Rosom
    "902", // GoPay
    "903", // EDAAT
];                                                          // end of SADAD_TYPES table

// Zero-padded for membership checks (table contains a handful of un-padded
// legacy entries; padding here lets the lookup work without mutating data).
const KNOWN_TYPES = new Set(SADAD_TYPES.map(t => t.padStart(3, '0')));  // 3-digit-padded lookup set of valid biller codes

// Bill-number labels — the 8-16 digit bill must follow one of these.
// Both ة (Teh-Marbuta) and ه (Heh) spellings are observed in real messages.
const BILL_RE = /(?:فاتورة\s+سداد\s+برقم|رقم\s+السداد|رقم\s+الفاتور[ةه]|الفاتور[ةه]\s*:|معرف\s+سداد|رقم\s+سداد|فاتورة\s+رقم)[\s:*\n]*(\d{8,16})/g;  // capture an 8-16 digit bill number that follows a bill-number label

// Type-code labels — 1-3 digit code following one of these.
const TYPE_RE = /(?:رمز\s+المفوتر|رقم\s+المفوتر|رقم\s+معرف\s+سداد|المفوتر|مفوتر)[\s:*\.\n]*\(?(\d{1,3})\)?/g;  // capture a 1-3 digit biller code that follows a biller label

// Fallback: bare 3-digit token matching a known type. Handles messages where
// the type code sits alone above the labeled bill. The comma in the lookbehind
// rejects thousands groups inside amounts ("1,068﷼", "18,858") that would
// otherwise be misread as a biller code.
const STANDALONE_3DIGIT_RE = /(?<![\d,])\d{3}(?![\d,])/g;  // match a bare 3-digit token not embedded in a longer/comma-grouped number

// WhatsApp @mentions are numeric user IDs (LIDs), never bills — they must be
// stripped before matching or a thank-you note that tags people gets stored
// as bills. e.g. "@71288487952499" is a mention, not a SADAD bill.
const MENTION_RE = /@\d+/g;  // match WhatsApp @mention numeric IDs so they can be stripped

// Bare 8-16 digit run with no label. Used only inside the SADAD group, and
// only when no labeled bill was found.
const BARE_BILL_RE = /(?<!\d)\d{8,16}(?!\d)/g;  // match an unlabeled standalone 8-16 digit bill number

// Placeholder biller code for a real bill posted WITHOUT its biller code.
// Rather than dropping such a bill (it would be lost forever unless a reply
// happened to carry the code), we store it as '000' = "biller unknown". A later
// post/reply carrying the real code overwrites it (see add_or_update_sadad).
const PLACEHOLDER_TYPE = '000';  // "biller unknown" code stored for a code-less bill

// A code-less bill is only trusted enough to store as '000' when the message
// actually reads like a bill — this keeps bare phone numbers, reference numbers
// and filenames (e.g. TRANSACTION_BILLPAYMENT_123.pdf) out of the table. Covers
// the real code-less bills seen in the group: work permits (رخصة عمل / مكتب
// العمل / استقدام), and generic bill/amount wording (فاتورة / سداد / مبلغ / ريال
// / مفوتر / رسوم / تأمين / غرامة / إيجار / جوازات / أبشر / مقيم / مخالفة).
const BILL_CONTEXT_RE = /رخص|مكتب\s*العمل|استقدام|فاتور|فواتير|مفوتر|سداد|تسدد|رسوم|تأمين|تامين|جوازات|أبشر|ابشر|[إا]يجار|مبلغ|ريال|مقيم|غرام|مخالف/;  // does the message read like an actual bill (gate for '000' placeholder)

// Position of a captured group inside a full regex match (absolute in text).
function group_pos(match, group) {  // compute absolute text position of a captured group
    return match.index + match[0].lastIndexOf(group);  // match start plus offset of the group within the match
}  // end group_pos

// The type code whose occurrence sits closest to a bill (by absolute distance).
// A message can carry several bills from different billers, each labeled with
// its own code before or after it — so per-bill nearest beats one global type.
function nearest_type(pos, type_occs) {  // pick the biller code closest to a given bill position
    if (type_occs.length === 0) return '';  // no codes seen -> empty type
    let best = type_occs[0];  // start with the first code occurrence as the current best
    for (const t of type_occs) {  // scan every code occurrence
        if (Math.abs(t.pos - pos) < Math.abs(best.pos - pos)) best = t;  // keep the one nearest the bill
    }  // end scan loop
    return best.code;  // return the nearest code's value
}  // end nearest_type

function parser_sadad(text, from_sadad_group = false, allow_placeholder = true) {  // parse SADAD bills+codes from a message body
    if (typeof text !== 'string') return [];  // guard: only strings are parseable
    if (!from_sadad_group && !text.includes('سداد') && !text.includes('مفوتر')) return [];  // outside SADAD group, need a SADAD keyword

    // Drop @mentions so their numeric IDs can never be read as bills.
    const clean = text.replace(MENTION_RE, ' ');  // strip @mention IDs, leaving a space in their place

    // Type occurrences with positions: labeled codes plus bare known-type
    // tokens (e.g. a standalone "153" above the bill).
    const type_occs = [];  // collect every detected biller-code occurrence
    for (const m of clean.matchAll(TYPE_RE)) {  // iterate label-anchored biller codes
        type_occs.push({ code: m[1].padStart(3, '0'), pos: group_pos(m, m[1]) });  // record padded code and its text position
    }  // end labeled-code loop
    for (const m of clean.matchAll(STANDALONE_3DIGIT_RE)) {  // iterate bare 3-digit tokens
        if (KNOWN_TYPES.has(m[0])) type_occs.push({ code: m[0], pos: m.index });  // keep only ones matching a known biller code
    }  // end bare-token loop

    // Bill occurrences with positions: labeled bills first; only if none are
    // found (and we're in the SADAD group) fall back to bare digit runs.
    const bill_occs = [];  // collect every detected bill-number occurrence
    for (const m of clean.matchAll(BILL_RE)) {  // iterate label-anchored bill numbers
        bill_occs.push({ num: m[1], pos: group_pos(m, m[1]) });  // record bill number and its text position
    }  // end labeled-bill loop
    if (bill_occs.length === 0 && from_sadad_group) {  // no labeled bill and inside the SADAD group?
        for (const m of clean.matchAll(BARE_BILL_RE)) {  // iterate unlabeled 8-16 digit runs
            bill_occs.push({ num: m[0], pos: m.index });  // record the bare bill number and position
        }  // end bare-bill loop
    }  // end SADAD-group fallback

    // No bill number => nothing to report. A real SADAD bill always carries both
    // the number and the biller code in the same message, so a type without a
    // bill is just chatter (e.g. an info note mentioning a biller) — skip it.
    if (bill_occs.length === 0) return [];  // no bills found -> return nothing

    // Outside the SADAD group, require a detected type (stricter, as before).
    if (!from_sadad_group && type_occs.length === 0) return [];  // outside SADAD group with no code -> reject

    // A code-less bill is stored as '000' (biller unknown) instead of being
    // dropped — but only in the SADAD group, only when placeholders are allowed
    // (typed text, not OCR), and only when the message reads like a bill.
    const has_bill_context = allow_placeholder && from_sadad_group && BILL_CONTEXT_RE.test(clean);  // may a code-less bill use the '000' placeholder?

    const seen = new Set();  // track bill numbers already emitted (dedup)
    const out = [];  // accumulate the result rows
    for (const b of bill_occs) {  // walk each detected bill
        if (seen.has(b.num)) continue;  // skip duplicate bill numbers
        seen.add(b.num);  // mark this bill number as emitted
        let sadad_type = nearest_type(b.pos, type_occs);  // find the biller code nearest this bill
        if (sadad_type === '' && has_bill_context) sadad_type = PLACEHOLDER_TYPE;  // fall back to '000' when code-less but bill-like
        out.push({ sadad_number: b.num, sadad_type });  // emit the bill number with its resolved type
    }  // end per-bill loop
    return out;  // return all parsed bills
}  // end parser_sadad

// Extract just the biller code from text (no bill needed). Used for reply-based
// code linking: a reply like "لمفوتر 050" carries the code for the quoted bill.
// Prefers a labeled code (TYPE_RE); falls back to a bare known-type token.
function extract_sadad_code(text) {  // pull just a biller code out of text (for reply-linking)
    if (typeof text !== 'string') return '';  // guard: only strings are parseable
    const clean = text.replace(MENTION_RE, ' ');  // strip @mention IDs first
    for (const m of clean.matchAll(TYPE_RE)) return m[1].padStart(3, '0');  // return the first label-anchored code, padded
    for (const m of clean.matchAll(STANDALONE_3DIGIT_RE)) {  // otherwise scan bare 3-digit tokens
        if (KNOWN_TYPES.has(m[0])) return m[0];  // return the first one matching a known biller code
    }  // end bare-token scan
    return '';  // no code found
}  // end extract_sadad_code

parser_sadad.extract_sadad_code = extract_sadad_code;  // expose the code extractor on the main function
module.exports = parser_sadad;  // export the parser as this module
