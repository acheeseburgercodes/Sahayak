import type { SubAgentSpec, WorkerId } from '../types';

type Def = Omit<SubAgentSpec, 'id' | 'parent'> & { slug: string };

/**
 * Sub-agents: narrow specialists inside each teammate. The sub-router picks one
 * automatically from trigger scores; developer mode lets you pick by hand.
 * The FIRST entry of each list is the default when nothing matches.
 */
const DEFS: Partial<Record<WorkerId, Def[]>> = {
  emergency: [
    {
      slug: 'medical', name: 'First aid', focus: 'Unconscious, bleeding, fall, snake bite, seizure',
      triggers: ['fell', 'unconscious', 'not waking', 'not breathing', 'bleeding', 'snake', 'heart', 'fits', 'seizure', 'बेहोश', 'होश', 'सांप', 'साँप', 'खून', 'गिर', 'दौरा', 'saans', 'behosh'],
      system: 'Focus on first aid until the ambulance arrives: recovery position for an unconscious person who is breathing, firm pressure on bleeding, keep a snake-bite victim still and take them to a government hospital for anti-venom. Never advise cutting, sucking or a tourniquet.',
      tip: {
        en: 'Snake bite: keep the person still, remove tight bangles or rings, and go straight to a government hospital — anti-venom there is free. Do not cut or suck the wound.',
        hi: 'साँप काटे तो: व्यक्ति को हिलने न दें, कसी चूड़ी-अँगूठी उतार दें, और सीधे सरकारी अस्पताल जाएँ — वहाँ दवा मुफ़्त है। घाव को न काटें, न चूसें।',
      },
    },
    {
      slug: 'violence', name: 'Violence & safety', focus: 'Domestic violence, assault, missing or trafficked child',
      triggers: ['beaten', 'beating', 'violence', 'rape', 'assault', 'kidnap', 'missing child', 'husband', 'threat', 'मारपीट', 'हिंसा', 'अपहरण', 'गुम', 'पति', 'धमकी'],
      system: 'Focus on immediate safety: getting away from the attacker, 181 for women, 1098 for children, 112 for police. One-Stop (Sakhi) Centres give free shelter, medical help and legal aid.',
      tip: {
        en: 'If you are not safe at home, 181 (women) and 1098 (children) can arrange rescue and a free shelter — you do not need to file anything first.',
        hi: 'घर में सुरक्षित नहीं हैं तो 181 (महिला) और 1098 (बच्चे) बचाव और मुफ़्त आश्रय दिलाते हैं — पहले कोई कागज़ भरने की ज़रूरत नहीं।',
      },
    },
    {
      slug: 'hazard', name: 'Fire, shock & drowning', focus: 'Fire, gas leak, electric shock, drowning',
      triggers: ['fire', 'burning', 'electric', 'current', 'shock', 'drowning', 'gas', 'cylinder', 'आग', 'करंट', 'डूब', 'सिलेंडर', 'गैस'],
      system: 'Focus on hazard safety: 101 for fire, cut the electricity at the mains before touching a shock victim, never enter water to rescue without a rope or float.',
      tip: {
        en: 'Electric shock: switch off the mains or push the person away with dry wood — never touch them with bare hands. Fire: call 101.',
        hi: 'करंट लगे तो: मेन स्विच बंद करें या सूखी लकड़ी से अलग करें — नंगे हाथ से न छुएँ। आग के लिए 101 पर कॉल करें।',
      },
    },
  ],

  ration: [
    {
      slug: 'dealer', name: 'Dealer disputes', focus: 'Refused, short weight, "no stock", card blocked',
      triggers: ['dealer', 'shop', 'refused', 'less', 'short', 'stock', 'weight', 'blocked', 'kotedar', 'कोटेदार', 'दुकान', 'कम', 'लौटा', 'वज़न', 'स्टॉक', 'ब्लॉक'],
      system: 'Focus on the dealer dispute: e-POS printed slip as proof, stock register, 1967 complaint, then District Supply Office.',
      tip: {
        en: 'Ask for the printed e-POS slip — it records the quantity you were given, and it is your proof if the weight was short.',
        hi: 'e-POS मशीन की छपी पर्ची माँगिए — उसमें लिखा होता है कितना अनाज मिला, कम तौलने पर वही आपका सबूत है।',
      },
    },
    {
      slug: 'portability', name: 'Migrants (ONORC)', focus: 'Ration away from home state or city',
      triggers: ['migrant', 'moved', 'another state', 'other city', 'onorc', 'portability', 'away from home', 'प्रवासी', 'दूसरे राज्य', 'दूसरे शहर', 'परदेस'],
      system: 'Focus on One Nation One Ration Card: an NFSA card works at any e-POS fair-price shop in India with Aadhaar authentication of any family member; Mera Ration app lists shops; helpline 14445.',
      tip: {
        en: 'Working away from home? Your existing card works at any e-POS ration shop in India; the Mera Ration app shows the nearest one and 14445 answers ONORC problems.',
        hi: 'घर से दूर काम कर रहे हैं? आपका पुराना कार्ड भारत की किसी भी e-POS राशन दुकान पर चलेगा; "मेरा राशन" ऐप पास की दुकान बताता है, दिक़्क़त हो तो 14445।',
      },
    },
    {
      slug: 'new-card', name: 'New or lost card', focus: 'Applying, adding names, replacing a lost card',
      triggers: ['new card', 'no card', 'lost', 'apply', 'make card', 'add name', 'नया कार्ड', 'कार्ड नहीं', 'खो', 'बनवा', 'नाम जुड़', 'kaise banwaye', 'இழந்து'],
      system: 'Focus on getting or replacing a card: free application at the block supply office or state food portal; adding a newborn or new bride; interim help from community kitchens.',
      tip: {
        en: 'Applying for a card is free at the block supply office or your state food portal; adding a newborn or a new bride needs only a birth or marriage proof.',
        hi: 'कार्ड का आवेदन ब्लॉक आपूर्ति कार्यालय या राज्य के खाद्य पोर्टल पर मुफ़्त है; नवजात या नई बहू का नाम जोड़ने के लिए जन्म या विवाह का सबूत काफ़ी है।',
      },
    },
  ],

  shelter: [
    {
      slug: 'flood', name: 'Flood & evacuation', focus: 'Rising water, river, dam release',
      triggers: ['flood', 'water', 'rising', 'river', 'dam', 'बाढ़', 'पानी', 'नदी', 'बांध', 'বন্যা'],
      system: 'Focus on flood evacuation: move to high ground by road, switch off mains, never cross flowing water.',
      tip: {
        en: 'Switch off the main electricity switch before you leave, and never cross a bridge or causeway with water flowing over it.',
        hi: 'निकलने से पहले बिजली का मेन स्विच बंद करें, और जिस पुल या रपटे पर पानी बह रहा हो उसे कभी पार न करें।',
      },
    },
    {
      slug: 'night', name: 'Night shelter', focus: 'Homeless, sleeping outside, cold wave',
      triggers: ['homeless', 'night shelter', 'sleep', 'footpath', 'cold', 'rain basera', 'रैन बसेरा', 'बेघर', 'सोने', 'फुटपाथ', 'ठंड'],
      system: 'Focus on night shelters (rain basera): free, open evenings, families separated from single men; how to find one via the municipal office.',
      tip: {
        en: 'City night shelters (rain basera) are free. If you have no ID, go anyway and ask — many take people in without it.',
        hi: 'शहर के रैन बसेरे मुफ़्त हैं। पहचान पत्र न हो तब भी जाइए और पूछिए — कई जगह बिना उसके भी रख लेते हैं।',
      },
    },
    {
      slug: 'relief', name: 'Relief & compensation', focus: 'After the disaster: damage, relief money',
      triggers: ['compensation', 'relief', 'damage', 'house collapsed', 'crop loss', 'मुआवज़ा', 'मुआवजा', 'राहत', 'नुकसान', 'घर गिर'],
      system: 'Focus on post-disaster relief: damage survey list, gratuitous relief, house damage assistance, replacing lost documents free.',
      tip: {
        en: 'Photograph the damage before you repair anything and make sure your name is on the survey list — compensation is paid from that list.',
        hi: 'मरम्मत से पहले नुकसान की फ़ोटो लीजिए और सर्वे सूची में अपना नाम ज़रूर लिखवाइए — मुआवज़ा उसी सूची से मिलता है।',
      },
    },
  ],

  health: [
    {
      slug: 'medicines', name: 'Free medicines & tests', focus: 'Medicines, tests, private doctor too costly',
      triggers: ['medicine', 'tablet', 'test', 'xray', 'fever', 'doctor', 'dawa', 'दवा', 'दवाई', 'जांच', 'टेस्ट', 'बुखार', 'bukhar'],
      system: 'Focus on free OPD, essential medicines and diagnostics at government facilities, and Jan Aushadhi generics.',
      tip: {
        en: 'Government hospitals must give essential medicines free; if they say "out of stock", ask the doctor to write the generic name and buy it at a Jan Aushadhi Kendra.',
        hi: 'सरकारी अस्पताल में ज़रूरी दवाएँ मुफ़्त मिलनी चाहिए; "स्टॉक नहीं" कहें तो डॉक्टर से दवा का साल्ट नाम लिखवाकर जन औषधि केंद्र से लीजिए।',
      },
    },
    {
      slug: 'maternal', name: 'Pregnancy & newborn', focus: 'Delivery, check-ups, newborn care',
      triggers: ['pregnant', 'pregnancy', 'delivery', 'baby', 'newborn', 'asha', 'गर्भ', 'प्रसव', 'डिलीवरी', 'आशा', 'नवजात'],
      system: 'Focus on JSSK: free delivery including C-section, free medicines, tests, food and transport (102) in government facilities; JSY cash benefit; ASHA support.',
      tip: {
        en: 'Delivery in a government hospital is free under JSSK — medicines, tests, food and the 102 ambulance included. Nobody may charge you for it.',
        hi: 'सरकारी अस्पताल में प्रसव JSSK के तहत मुफ़्त है — दवा, जाँच, खाना और 102 एम्बुलेंस सहित। कोई पैसा नहीं ले सकता।',
      },
    },
    {
      slug: 'ayushman', name: 'Ayushman card & bills', focus: 'Operation, admission, big hospital bill',
      triggers: ['ayushman', 'pmjay', 'pm-jay', 'golden card', 'hospital bill', 'operation', 'admit', 'surgery', 'आयुष्मान', 'ऑपरेशन', 'भर्ती', 'बिल'],
      system: 'Focus on Ayushman Bharat PM-JAY: up to ₹5 lakh per family per year at empanelled hospitals, cashless, Ayushman Mitra desk, helpline 1800-111-565.',
      tip: {
        en: 'Ayushman Bharat covers up to ₹5 lakh a year per family at empanelled hospitals, cashless. Ask for the Ayushman Mitra desk; helpline 1800-111-565.',
        hi: 'आयुष्मान भारत में सूचीबद्ध अस्पतालों में परिवार को साल में ₹5 लाख तक का इलाज बिना पैसे के। आयुष्मान मित्र डेस्क पूछिए; हेल्पलाइन 1800-111-565।',
      },
    },
  ],

  livelihood: [
    {
      slug: 'unpaid', name: 'Unpaid wages', focus: 'Contractor or employer not paying',
      triggers: ['contractor', 'not paid', 'wages', 'salary', 'owner', 'ठेकेदार', 'मज़दूरी', 'मजदूरी', 'तनख्वाह', 'मालिक', 'मजुरी'],
      system: 'Focus on recovering unpaid wages: written record of days, site and contractor; Labour Commissioner complaint; free legal aid.',
      tip: {
        en: 'Write down every day you worked, the site address and the contractor’s phone number — the Labour Commissioner takes unpaid-wage complaints for free.',
        hi: 'हर काम का दिन, साइट का पता और ठेकेदार का फ़ोन नंबर लिख लीजिए — श्रम आयुक्त कार्यालय बकाया मज़दूरी की शिकायत मुफ़्त लेता है।',
      },
    },
    {
      slug: 'mgnrega', name: 'MGNREGA', focus: 'Job card, demanding work, 100 days, delayed payment',
      triggers: ['mgnrega', 'nrega', 'job card', '100 days', 'manrega', 'मनरेगा', 'जॉब कार्ड', 'नरेगा'],
      system: 'Focus on MGNREGA rights: job card, written work demand with dated receipt, work within 15 days or unemployment allowance, payment within 15 days, delay compensation.',
      tip: {
        en: 'Ask for work in writing and keep the dated receipt — if no work is given within 15 days, you are owed an unemployment allowance.',
        hi: 'काम की माँग लिखकर दीजिए और तारीख़ वाली रसीद रखिए — 15 दिन में काम न मिले तो बेरोज़गारी भत्ता आपका हक़ है।',
      },
    },
    {
      slug: 'migrant', name: 'Migrant & construction', focus: 'e-Shram, construction workers’ board',
      triggers: ['migrant', 'construction', 'e-shram', 'eshram', 'building worker', 'प्रवासी', 'निर्माण', 'ई-श्रम', 'मजदूर कार्ड'],
      system: 'Focus on registration: e-Shram card, state Building and Other Construction Workers welfare board benefits.',
      tip: {
        en: 'Register free on e-Shram and with your state construction workers’ board — members get accident cover and help with children’s education and maternity.',
        hi: 'ई-श्रम और राज्य के निर्माण मज़दूर बोर्ड में मुफ़्त पंजीकरण कराइए — सदस्यों को दुर्घटना बीमा, बच्चों की पढ़ाई और प्रसव में मदद मिलती है।',
      },
    },
  ],

  documents: [
    {
      slug: 'pension', name: 'Pensions', focus: 'Old-age, widow, disability pension',
      triggers: ['pension', 'widow', 'old age', 'disability', 'विधवा', 'पेंशन', 'बुढ़ापा', 'वृद्धा', 'विकलांग', 'दिव्यांग', 'పెన్షన్'],
      system: 'Focus on social pensions (NSAP: IGNOAPS old-age from 60, widow, disability) applied at the block office or gram panchayat.',
      tip: {
        en: 'Apply for pension at the block office or gram panchayat; the national old-age pension starts at 60 for BPL households.',
        hi: 'पेंशन का आवेदन ब्लॉक कार्यालय या ग्राम पंचायत में होता है; गरीबी रेखा वाले परिवारों को राष्ट्रीय वृद्धावस्था पेंशन 60 साल से मिलती है।',
      },
    },
    {
      slug: 'aadhaar', name: 'Aadhaar', focus: 'Enrolment with no documents, updates, biometric failure',
      triggers: ['aadhaar', 'aadhar', 'biometric', 'uid', 'fingerprint', 'आधार', 'अंगूठा'],
      system: 'Focus on Aadhaar: free enrolment, introducer route for people with no documents, free mandatory biometric update, helpline 1947.',
      tip: {
        en: 'Aadhaar enrolment is free, and a person with no documents can enrol through an introducer. Helpline 1947.',
        hi: 'आधार बनवाना मुफ़्त है, और जिसके पास कोई कागज़ नहीं वह "परिचयकर्ता" के ज़रिए बनवा सकता है। हेल्पलाइन 1947।',
      },
    },
    {
      slug: 'certificates', name: 'Certificates', focus: 'Caste, income, birth, death, domicile',
      triggers: ['certificate', 'caste', 'income', 'birth', 'death', 'domicile', 'प्रमाण पत्र', 'प्रमाणपत्र', 'जाति', 'आय', 'जन्म', 'मृत्यु', 'निवास'],
      system: 'Focus on certificates from the tehsil or CSC: small fixed fees, printed receipts, time limits under the state service guarantee act.',
      tip: {
        en: 'Certificates are issued at the tehsil or a CSC for a small fixed fee — ask for the printed receipt; anyone asking for ₹500 or more is a middleman.',
        hi: 'प्रमाण पत्र तहसील या CSC से छोटी तय फ़ीस पर बनते हैं — छपी रसीद माँगिए; ₹500 या उससे ज़्यादा माँगने वाला दलाल है।',
      },
    },
  ],

  money: [
    {
      slug: 'moneylender', name: 'Moneylender & bonded labour', focus: 'High interest, threats, held documents, forced work',
      triggers: ['moneylender', 'money lender', 'sahukar', 'interest', 'byaj', 'bonded', 'begaar', 'साहूकार', 'महाजन', 'ब्याज', 'सूद', 'बेगार', 'गिरवी', 'ਸ਼ਾਹੂਕਾਰ'],
      system: 'Focus on usurious private debt and bonded labour: state money-lending laws, Bonded Labour System (Abolition) Act 1976 cancels bonded debt, District Magistrate, DLSA 15100.',
      tip: {
        en: 'Forcing someone to work off a debt is bonded labour and a crime — the District Magistrate must free you, and that debt is cancelled by law.',
        hi: 'कर्ज़ के बदले ज़बरदस्ती काम कराना बंधुआ मज़दूरी और अपराध है — ज़िलाधिकारी को आपको छुड़ाना होगा, और वह कर्ज़ क़ानूनन ख़त्म हो जाता है।',
      },
    },
    {
      slug: 'dbt', name: 'Scheme money not received', focus: 'DBT, subsidy, PM-Kisan instalment missing',
      triggers: ['dbt', 'subsidy', 'not received', 'pm kisan', 'not credited', 'instalment', 'सब्सिडी', 'पैसा नहीं आया', 'किस्त', 'खाते में नहीं'],
      system: 'Focus on failed DBT: Aadhaar seeding / NPCI mapping, frozen or dormant account, KYC lapse, bank complaint ladder to the RBI Ombudsman.',
      tip: {
        en: 'Ask the bank whether your Aadhaar is seeded to the account (NPCI mapping) — most missing scheme money is a seeding problem the bank can fix.',
        hi: 'बैंक से पूछिए कि आधार खाते से जुड़ा (NPCI मैपिंग) है या नहीं — ज़्यादातर रुका हुआ योजना का पैसा इसी वजह से अटकता है और बैंक ठीक कर सकता है।',
      },
    },
    {
      slug: 'fraud-loss', name: 'Money lost to fraud', focus: 'Money already left the account',
      triggers: ['fraud', 'cheated', 'money gone', 'deducted', 'left my account', 'upi', 'धोखा', 'ठगी', 'कट गए', 'निकल गए', 'फ्रॉड'],
      system: 'Focus on fraud already committed: call 1930 at once, block the card/UPI via the bank, file on cybercrime.gov.in, report to the bank within 3 days to limit liability.',
      tip: {
        en: 'Call 1930 within the first hour if you can — the bank can freeze the money before the fraudster withdraws it.',
        hi: 'हो सके तो पहले एक घंटे में 1930 पर कॉल कीजिए — तब बैंक ठग के निकालने से पहले पैसा रोक सकता है।',
      },
    },
  ],

  grievance: [
    {
      slug: 'bribe', name: 'Bribes & refusals', focus: 'Office demanding money or refusing service',
      triggers: ['bribe', 'corruption', 'refused', 'asking money', 'returned me', 'रिश्वत', 'घूस', 'भ्रष्टाचार', 'पैसे माँग', 'लौटा दिया', 'ଲାଞ୍ଚ'],
      system: 'Focus on refusals and bribe demands: written refusal with officer name, state public-service guarantee act, CPGRAMS/state portal, anti-corruption helpline.',
      tip: {
        en: 'Ask for the refusal in writing with the officer’s name — an office that refuses in writing must give a reason, and that reason is what you appeal.',
        hi: 'मना करने की बात लिखित में और अफ़सर के नाम के साथ माँगिए — लिखित मना करने पर कारण बताना पड़ता है, और उसी के ख़िलाफ़ अपील होती है।',
      },
    },
    {
      slug: 'police', name: 'Police & FIR', focus: 'Police refusing to register an FIR',
      triggers: ['police', 'fir', 'thana', 'station', 'पुलिस', 'थाना', 'एफआईआर'],
      system: 'Focus on FIR refusal: send the written complaint to the Superintendent of Police by registered post, then the magistrate; zero FIR at any station.',
      tip: {
        en: 'If the station refuses an FIR for a serious offence, send the written complaint by registered post to the Superintendent of Police — that is your legal next step.',
        hi: 'गंभीर अपराध में थाना FIR न लिखे तो लिखित शिकायत रजिस्टर्ड डाक से पुलिस अधीक्षक (SP) को भेजिए — यही अगला क़ानूनी क़दम है।',
      },
    },
    {
      slug: 'rti', name: 'RTI', focus: 'Asking an office for the status of your file',
      triggers: ['rti', 'right to information', 'status of my application', 'आरटीआई', 'सूचना का अधिकार'],
      system: 'Focus on RTI: ₹10 fee, waived for BPL, 30-day reply, first appeal, asking for the status of a dated application.',
      tip: {
        en: 'An RTI costs ₹10 (free for BPL card holders) and the office must reply within 30 days.',
        hi: 'RTI की फ़ीस ₹10 है (BPL कार्ड वालों के लिए मुफ़्त) और दफ़्तर को 30 दिन में जवाब देना होता है।',
      },
    },
  ],

  scam: [
    {
      slug: 'sms-link', name: 'SMS & links', focus: 'KYC, electricity cut, account blocked messages',
      triggers: ['sms', 'message', 'link', 'kyc', 'blocked', 'electricity', 'मैसेज', 'लिंक', 'केवाईसी', 'बिजली'],
      system: 'Focus on the message itself: sender, link, urgency, what it asks the person to do.',
      tip: {
        en: 'Banks and electricity boards never send a link asking you to update KYC or pay to avoid disconnection tonight.',
        hi: 'बैंक और बिजली विभाग कभी लिंक भेजकर KYC अपडेट या "आज रात कनेक्शन कटेगा" कहकर पैसे नहीं माँगते।',
      },
    },
    {
      slug: 'call', name: 'Calls & fake officers', focus: 'OTP calls, digital arrest, screen-share apps',
      triggers: ['call', 'called', 'officer', 'cbi', 'digital arrest', 'otp', 'anydesk', 'screen share', 'video call', 'कॉल', 'फ़ोन आया', 'अफ़सर', 'ओटीपी', 'डिजिटल अरेस्ट'],
      system: 'Focus on phone and video-call fraud: impersonated police/CBI/bank staff, OTP and screen-share tricks.',
      tip: {
        en: 'Police and CBI never arrest anyone over a video call and never ask for money to "settle" a case — hang up.',
        hi: 'पुलिस या CBI कभी वीडियो कॉल पर गिरफ़्तार नहीं करती और केस "निपटाने" के पैसे नहीं माँगती — फ़ोन काट दीजिए।',
      },
    },
    {
      slug: 'job-loan', name: 'Jobs, loans & prizes', focus: 'Fees for a job, loan or lottery prize',
      triggers: ['job', 'loan', 'lottery', 'prize', 'won', 'registration fee', 'kbc', 'work from home', 'नौकरी', 'लोन', 'लॉटरी', 'इनाम', 'रजिस्ट्रेशन फीस'],
      system: 'Focus on advance-fee fraud: fake jobs, instant loans, lottery and KBC prizes.',
      tip: {
        en: 'A real job, loan or government scheme never asks you to pay a "registration" or "processing" fee first.',
        hi: 'असली नौकरी, लोन या सरकारी योजना कभी पहले "रजिस्ट्रेशन" या "प्रोसेसिंग" फ़ीस नहीं माँगती।',
      },
    },
  ],

  calculator: [
    {
      slug: 'ration', name: 'Ration entitlement', focus: 'Free grain owed per card and family size',
      triggers: ['ration', 'grain', 'kg', 'card', 'antyodaya', 'aay', 'phh', 'राशन', 'अनाज', 'किलो', 'कार्ड', 'अंत्योदय'],
      system: 'Tool: NFSA entitlement (PHH 5 kg/person, AAY 35 kg/family, free).',
      tip: { en: 'Show this number to the dealer, and put it in any complaint.', hi: 'यह हिसाब कोटेदार को दिखाइए, और शिकायत में भी लिखिए।' },
    },
    {
      slug: 'wages', name: 'Wages due', focus: 'Days × rate, MGNREGA days left, delay compensation',
      triggers: ['wage', 'wages', 'days', 'mgnrega', 'nrega', 'per day', 'मज़दूरी', 'मजदूरी', 'दिन', 'दिहाड़ी', 'majduri', 'din'],
      system: 'Tool: wages = days × daily rate; MGNREGA 100-day balance; delay compensation 0.05% per day after 16 days.',
      tip: { en: 'Keep this total with your list of work dates — it is what you claim.', hi: 'यह जोड़ अपने काम के दिनों की सूची के साथ रखिए — यही आपका दावा है।' },
    },
    {
      slug: 'interest', name: 'Loan interest check', focus: 'What a moneylender loan really costs per year',
      triggers: ['interest', 'loan', 'borrowed', 'byaj', 'sood', 'saikda', 'ब्याज', 'सूद', 'उधार', 'कर्ज', 'सैकड़ा', 'सैकड़े', 'per month', 'महीना'],
      system: 'Tool: converts monthly / per-hundred interest to a yearly rate and rupee cost.',
      tip: { en: 'Compare this yearly rate before you borrow again — an SHG or bank loan usually costs far less.', hi: 'दोबारा उधार लेने से पहले यह सालाना दर देखिए — स्वयं सहायता समूह या बैंक का लोन आमतौर पर बहुत सस्ता होता है।' },
    },
  ],

  farmer: [
    {
      slug: 'income', name: 'PM-KISAN money', focus: 'Rs 6,000/year instalments, e-KYC, stopped payments',
      triggers: ['pm kisan', 'pm-kisan', 'kisan samman', 'kisan instalment', 'instalment', 'installment', '6000', 'e-kyc', 'ekyc', 'kisan nidhi', 'किसान सम्मान', 'किसान निधि', 'किस्त', 'क़िस्त', '6000', 'kist'],
      system: 'Focus on PM-KISAN: check Beneficiary Status on pmkisan.gov.in with the registered mobile; the three usual blockers are pending e-KYC (OTP, biometric at CSC, or face authentication), land records not seeded, and Aadhaar not linked/seeded to the bank account (NPCI mapper). Helpline 155261.',
      tip: {
        en: 'An instalment that stops is usually pending e-KYC or an unseeded bank account — check "Beneficiary Status" on pmkisan.gov.in, then fix e-KYC free at a CSC.',
        hi: 'किस्त रुक जाए तो अक्सर e-KYC बाक़ी होती है या बैंक खाता आधार से नहीं जुड़ा — pmkisan.gov.in पर "लाभार्थी स्थिति" देखें, फिर CSC पर e-KYC मुफ़्त करवाएँ।',
      },
    },
    {
      slug: 'insurance', name: 'Crop insurance', focus: 'PMFBY enrolment, crop loss claims within 72 hours',
      triggers: ['insurance', 'pmfby', 'fasal bima', 'crop loss', 'crop damage', 'hailstorm', 'hail', 'drought', 'flooded field', 'unseasonal rain', 'pest attack', 'claim', 'फसल बीमा', 'फ़सल बीमा', 'बीमा', 'ओले', 'सूखा', 'नुकसान', 'बर्बाद', 'पीक विमा'],
      system: 'Focus on PMFBY: localised calamities (hailstorm, inundation, landslide, cloudburst, unseasonal rain after harvest) must be intimated within 72 hours via helpline 14447, the Crop Insurance app, the insurer, the bank or the agriculture office; keep photos and the complaint docket number. Enrolment windows are notified per season by the state.',
      tip: {
        en: 'Report crop loss within 72 hours on 14447 or the Crop Insurance app, and write down the docket number — a late report is the most common reason a claim is rejected.',
        hi: 'फसल के नुकसान की सूचना 72 घंटे के अंदर 14447 या क्रॉप इंश्योरेंस ऐप पर दें और शिकायत नंबर लिख लें — देर से सूचना देना दावा ख़ारिज होने की सबसे आम वजह है।',
      },
    },
    {
      slug: 'credit', name: 'Kisan Credit Card', focus: 'Cheap crop loans instead of the moneylender',
      triggers: ['kcc', 'kisan credit card', 'crop loan', 'farm loan', 'loan', 'credit', 'किसान क्रेडिट कार्ड', 'केसीसी', 'लोन', 'कर्ज', 'कर्ज़', 'ऋण'],
      system: 'Focus on the Kisan Credit Card: apply at any bank branch with land records (or a tenancy/sharecropping proof, or via an SHG/JLG), ID and a photo; prompt repayment keeps short-term crop credit up to Rs 3 lakh at a heavily subsidised effective rate; banks may not charge processing fees for small KCC loans. Also available for animal husbandry and fisheries.',
      tip: {
        en: 'A KCC loan repaid on time costs a few percent a year — compare that with a moneylender or an input dealer\u2019s credit before you borrow for seed.',
        hi: 'समय पर चुकाया गया KCC लोन साल में कुछ ही प्रतिशत का पड़ता है — बीज के लिए उधार लेने से पहले इसे साहूकार या खाद-दुकान के उधार से तुलना कीजिए।',
      },
    },
    {
      slug: 'market', name: 'Selling & MSP', focus: 'Mandi prices, MSP procurement, e-NAM',
      triggers: ['mandi', 'msp', 'minimum support price', 'enam', 'e-nam', 'sell', 'selling', 'price', 'rate', 'procurement', 'मंडी', 'समर्थन मूल्य', 'बेच', 'भाव', 'दाम', 'mandi bhav', 'kharid'],
      system: 'Focus on selling: MSP applies only at government procurement centres after registration on the state procurement portal; e-NAM (enam.gov.in) shows live mandi prices and allows online trading; farmer producer organisations help small farmers bargain. Never predict a price.',
      tip: {
        en: 'MSP is paid only at a government procurement centre after you register on your state\u2019s procurement portal — register before harvest, not after.',
        hi: 'MSP सिर्फ़ सरकारी ख़रीद केंद्र पर मिलता है, और उसके लिए राज्य के ख़रीद पोर्टल पर पंजीकरण ज़रूरी है — कटाई से पहले पंजीकरण कराइए।',
      },
    },
    {
      slug: 'soil', name: 'Soil, seeds & inputs', focus: 'Soil Health Card, fertiliser, pests, Kisan Call Centre',
      triggers: ['soil', 'soil health', 'fertiliser', 'fertilizer', 'urea', 'dap', 'seed', 'pest', 'pesticide', 'disease', 'yield', 'मिट्टी', 'खाद', 'यूरिया', 'बीज', 'कीड़ा', 'कीट', 'रोग', 'khad', 'beej'],
      system: 'Focus on inputs: a free Soil Health Card tells how much fertiliser the field actually needs; fertiliser must be sold at the printed MRP against Aadhaar authentication at the POS machine; the Kisan Call Centre 1800-180-1551 advises on pests in local languages. Never recommend a brand.',
      tip: {
        en: 'Fertiliser must be sold at the MRP printed on the bag — ask for the POS bill. For pest problems call the Kisan Call Centre on 1800-180-1551, free.',
        hi: 'खाद बोरी पर छपे MRP पर ही बिकनी चाहिए — POS की पर्ची माँगिए। कीट या रोग के लिए किसान कॉल सेंटर 1800-180-1551 पर मुफ़्त पूछिए।',
      },
    },
  ],

  education: [
    {
      slug: 'scholarship', name: 'Scholarships', focus: 'NSP pre/post-matric and merit scholarships',
      triggers: ['scholarship', 'nsp', 'post matric', 'pre matric', 'merit', 'fees', 'class 10', 'class 12', 'छात्रवृत्ति', 'वज़ीफ़ा', 'वजीफा', 'फीस', 'wazifa'],
      system: 'Focus on scholarships: National Scholarship Portal (scholarships.gov.in) for central and many state schemes; one-time registration; documents are income certificate, caste certificate if applicable, previous marksheet, fee receipt, and a bank account in the student\u2019s own name seeded with Aadhaar. Applying is free.',
      tip: {
        en: 'Open a bank account in the student\u2019s own name and link Aadhaar to it before the portal opens — an unseeded account is the most common reason a scholarship is not paid.',
        hi: 'पोर्टल खुलने से पहले छात्र के अपने नाम से बैंक खाता खुलवाकर आधार से जोड़ें — बिना जुड़े खाते की वजह से ही सबसे ज़्यादा वज़ीफ़ा अटकता है।',
      },
    },
    {
      slug: 'school', name: 'School seats (RTE)', focus: '25% free seats in private schools, admission',
      triggers: ['rte', 'right to education', 'free seat', 'admission', 'school admission', 'private school', 'दाखिला', 'दाख़िला', 'स्कूल', 'शिक्षा का अधिकार', 'dakhila'],
      system: 'Focus on RTE Section 12(1)(c): 25% of entry-level seats in private unaided schools are free for weaker-section and disadvantaged children, applied for on the state RTE portal or at the block education office, usually by lottery; no fee, no donation, no screening test is allowed.',
      tip: {
        en: 'Under RTE a private school cannot take a donation or test your child for a free seat — apply on your state\u2019s RTE portal in the admission window.',
        hi: 'RTE की मुफ़्त सीट के लिए निजी स्कूल न दान ले सकता है, न बच्चे की परीक्षा — दाख़िले के समय राज्य के RTE पोर्टल पर आवेदन कीजिए।',
      },
    },
    {
      slug: 'skills', name: 'Skills & apprenticeships', focus: 'Free courses, ITI, paid apprenticeships',
      triggers: ['skill', 'skills', 'training', 'course', 'pmkvy', 'skill india', 'apprentice', 'apprenticeship', 'iti', 'job', 'कौशल', 'ट्रेनिंग', 'प्रशिक्षण', 'कोर्स', 'आईटीआई', 'अप्रेंटिस', 'नौकरी'],
      system: 'Focus on skills: free short courses under Skill India (skillindiadigital.gov.in), ITIs for trades, and apprenticeships (apprenticeshipindia.gov.in) that pay a monthly stipend. Any course that charges a "placement fee" is a warning sign.',
      tip: {
        en: 'An apprenticeship pays you a monthly stipend while you learn — search apprenticeshipindia.gov.in, and never pay an agent a "placement fee".',
        hi: 'अप्रेंटिसशिप में सीखते हुए हर महीने वज़ीफ़ा मिलता है — apprenticeshipindia.gov.in देखिए, और किसी एजेंट को "प्लेसमेंट फ़ीस" मत दीजिए।',
      },
    },
  ],

  enterprise: [
    {
      slug: 'vendor', name: 'Street vendors', focus: 'PM SVANidhi loans, vending certificate',
      triggers: ['vendor', 'street vendor', 'hawker', 'thela', 'cart', 'stall', 'svanidhi', 'vending', 'रेहड़ी', 'ठेला', 'पटरी', 'फेरीवाला', 'स्वनिधि', 'rehri', 'thele'],
      system: 'Focus on PM SVANidhi: collateral-free working-capital loans in rising tranches for urban street vendors, with interest subsidy on timely repayment and cashback on digital transactions; apply at pmsvanidhi.mohua.gov.in, a CSC or a bank; a vendor without a vending certificate can get a Letter of Recommendation from the municipality.',
      tip: {
        en: 'No vending certificate? Ask the municipality for a Letter of Recommendation — it is enough to apply for PM SVANidhi, and repaying on time unlocks a bigger next loan.',
        hi: 'वेंडिंग सर्टिफ़िकेट नहीं है? नगर निकाय से सिफ़ारिश पत्र माँगिए — PM स्वनिधि के लिए वही काफ़ी है, और समय पर चुकाने से अगला बड़ा लोन मिलता है।',
      },
    },
    {
      slug: 'artisan', name: 'Artisans (Vishwakarma)', focus: 'Traditional trades: toolkit, training, cheap credit',
      triggers: ['artisan', 'vishwakarma', 'carpenter', 'tailor', 'potter', 'cobbler', 'blacksmith', 'barber', 'washerman', 'weaver', 'mason', 'goldsmith', 'toolkit', 'कारीगर', 'विश्वकर्मा', 'बढ़ई', 'दर्जी', 'कुम्हार', 'मोची', 'लोहार', 'नाई', 'धोबी', 'बुनकर', 'राजमिस्त्री', 'सुनार', 'karigar'],
      system: 'Focus on PM Vishwakarma: for artisans in the notified traditional trades, aged 18+, working with hands and tools; registration free at a CSC with Aadhaar and mobile, verified by the gram panchayat or ULB; gives a certificate and ID card, basic training with a daily stipend, a toolkit incentive and collateral-free loans at a concessional rate in two tranches. One member per family.',
      tip: {
        en: 'PM Vishwakarma registration is free at any CSC — you get paid training, a toolkit voucher and a cheap loan without collateral. Nobody should charge you to register.',
        hi: 'PM विश्वकर्मा का पंजीकरण किसी भी CSC पर मुफ़्त है — इसमें वज़ीफ़े वाली ट्रेनिंग, औज़ार का वाउचर और बिना गारंटी सस्ता लोन मिलता है। पंजीकरण के पैसे किसी को न दें।',
      },
    },
    {
      slug: 'loan', name: 'Mudra & Udyam', focus: 'Mudra loans, Udyam registration, SHG finance',
      triggers: ['mudra', 'mudra loan', 'loan', 'business', 'small business', 'start', 'udyam', 'msme', 'shg', 'working capital', 'मुद्रा', 'लोन', 'व्यापार', 'धंधा', 'कारोबार', 'उद्यम', 'dhandha'],
      system: 'Focus on Mudra (Shishu / Kishore / Tarun categories) through any bank, NBFC or MFI without collateral, and free Udyam registration at udyamregistration.gov.in. A simple one-page business plan with expected sales helps the bank say yes.',
      tip: {
        en: 'For a first small business loan ask the bank for a Mudra "Shishu" loan — no collateral, no agent needed. Udyam registration is free online.',
        hi: 'पहले छोटे कारोबार के लिए बैंक से मुद्रा "शिशु" लोन माँगिए — न गारंटी, न एजेंट की ज़रूरत। उद्यम पंजीकरण ऑनलाइन मुफ़्त है।',
      },
    },
  ],
};

export const SUB_AGENTS: Record<string, SubAgentSpec> = {};
export const SUBS_BY_PARENT: Partial<Record<WorkerId, SubAgentSpec[]>> = {};

for (const [parent, defs] of Object.entries(DEFS) as Array<[WorkerId, Def[]]>) {
  SUBS_BY_PARENT[parent] = defs.map(({ slug, ...rest }) => {
    const spec: SubAgentSpec = { ...rest, id: `${parent}.${slug}`, parent };
    SUB_AGENTS[spec.id] = spec;
    return spec;
  });
}

export function subAgentsOf(parent: WorkerId): SubAgentSpec[] {
  return SUBS_BY_PARENT[parent] ?? [];
}
