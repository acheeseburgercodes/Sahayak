import type { ActionStep, AgentId, LangCode, ResourceCard } from '../types';

export interface DemoAnswer {
  body: string;
  steps?: ActionStep[];
  resourceKinds?: ResourceCard['kind'][];
  helplines?: string[];
}

/**
 * Offline answers used when no Sarvam key is configured. They are deliberately
 * useful rather than placeholder text — a demo of a service like this is worth
 * nothing if it cannot answer without a paid key.
 */
const EN: Record<Exclude<AgentId, 'router'>, DemoAnswer> = {
  emergency: {
    body: `**Call 112 right now.** Say the village or landmark first, then what happened, then how many people are hurt. Do not hang up until they repeat the address back to you.

While you wait:
- Keep the injured person still and warm. Do not move anyone with a neck, back or head injury.
- Do not give water or food to a person who is unconscious or vomiting.
- Send someone to the main road to wave the ambulance in.

Do not carry a serious casualty on a bike. Free ambulance on **108** is faster and it can start treatment on the way.`,
    steps: [
      { text: 'Call 112. Give the landmark before anything else.' },
      { text: 'Call 108 for a free ambulance if 112 does not connect.' },
      { text: 'Send one person to the road to guide the ambulance in.' },
      { text: 'Carry any ID and old prescriptions if you can grab them in 30 seconds.', carry: ['Aadhaar or any ID', 'Old prescriptions', 'Phone + charger'] },
    ],
    resourceKinds: ['hospital'],
    helplines: ['112', '108', '101', '1098', '181'],
  },
  ration: {
    body: `Under the food security law you get **5 kg of grain per person every month, free**. An Antyodaya (AAY) household gets **35 kg for the family**. The dealer cannot charge you for it and cannot refuse you because the shop "has no stock" — stock is recorded in a register you are allowed to see.

If the shop turned you away:
1. Ask the dealer to show the **stock register** and the **e-POS machine reading**. Stand where you can see the weight.
2. Note the date, the shop number and what you were told.
3. Complain on **1967** (or 1800-11-0841), then in person at the **District Supply Office**.

Moved for work? Your card works anywhere in India under **One Nation One Ration Card** — you do not need a new card, only your Aadhaar-linked fingerprint at any e-POS shop.`,
    steps: [
      { text: 'Go to the fair-price shop in its open hours with your card and the Aadhaar of the family member whose fingerprint is registered.', carry: ['Ration card', 'Aadhaar card', 'Bag for grain'] },
      { text: 'Ask to see the stock register if you are refused. Photograph it if you can.' },
      { text: 'Call 1967 the same day and write down the complaint number.' },
      { text: 'No card at all? A community kitchen serves free cooked food with no card.' },
    ],
    resourceKinds: ['ration-shop', 'office'],
    helplines: ['1967'],
  },
  shelter: {
    body: `**If water is entering your house, or the walls or hillside have cracked, move now.** Do not wait for an official order and do not wait for daylight.

How to move:
- Go towards **higher ground on a road**, never a shortcut through fields or along the riverbank.
- Never walk into moving water above your knee. It takes an adult off their feet.
- Move the elderly, pregnant women, small children and anyone disabled **first**. Ask any relief worker for a vehicle or stretcher — that is what they are there for.

One bag, packed in five minutes: drinking water, dry food, medicines, copies of your ID, a blanket, a torch, phone and charger, and any cash in the house.

Afterwards you are entitled to immediate relief, a food kit, and compensation for a damaged house. A lost ration card or Aadhaar can be re-issued free — losing them does not lose you your entitlement.`,
    steps: [
      { text: 'Decide now: move if water is rising, walls cracked, or a warning siren sounded.' },
      { text: 'Pack one bag in five minutes.', carry: ['Drinking water', 'Dry food', 'Medicines', 'ID copies', 'Blanket', 'Torch', 'Phone + charger', 'Cash'] },
      { text: 'Walk to the nearest shelter on the list below. Tell a neighbour where you are going.' },
      { text: 'At the shelter, get your family\u2019s name written in the register — that entry is what relief is paid against.' },
      { text: 'Call 1078 or 112 if you cannot reach a shelter on foot.' },
    ],
    resourceKinds: ['shelter'],
    helplines: ['112', '1078', '181'],
  },
  health: {
    body: `Start with the **government path — it is free or nearly free**, and skip the private clinic that asks for thousands up front.

- **PHC / Health & Wellness Centre**: free consultation, free medicines, free immunisation.
- **District Hospital**: free emergency care and free delivery, 24x7.
- **Ayushman Bharat (PM-JAY)**: up to ₹5 lakh a year of free hospital treatment for the family. The card is made **free** at the hospital's Ayushman help desk. Anyone asking ₹500 to "make the card" is a middleman — refuse and go to the desk yourself.
- **Jan Aushadhi Kendra**: the same medicine at 50–80% less. Ask the doctor to write the **salt name**, not a brand name.

Go to emergency care immediately, not tomorrow, for: chest pain, one-sided weakness or slurred speech, heavy bleeding, a fit, a snake bite, a baby who will not feed, or breathing difficulty.

A private hospital demanding a deposit before treating an emergency is breaking the law.`,
    steps: [
      { text: 'Go to the PHC first with the patient. Consultation and most medicines are free.', carry: ['Aadhaar', 'Ration card', 'Any old prescription or report'] },
      { text: 'Ask the ASHA worker in your ward for help — her help is free.' },
      { text: 'At a district hospital, go to the Ayushman help desk and ask them to check eligibility and make the card. Free.' },
      { text: 'Buy medicines at a Jan Aushadhi Kendra with the salt name written down.' },
    ],
    resourceKinds: ['hospital'],
    helplines: ['104', '108', '1800-111-565', '14416'],
  },
  livelihood: {
    body: `**Unpaid wages are recoverable, but only if you create paper.** Verbal complaints disappear.

1. Write down: the contractor's name and number, the worksite, the dates you worked, the agreed daily rate, and the amount due. Names of two co-workers who will confirm it.
2. Give a **written demand** to the contractor and keep a photo of it. Send it by registered post if he refuses to take it.
3. Complain to the **Labour Inspector**, then the **Labour Commissioner**. Keep the dated receipt each time.

In a village, MGNREGA guarantees your household **100 days of work a year**. Demand work **in writing** at the Block office and take a **dated receipt** — if you do not get work within 15 days, an unemployment allowance is due. Wages must reach your bank account within 15 days, and the worksite must be within 5 km or travel money is owed.

Never borrow from the contractor to survive until he pays. That is how a wage dispute turns into bonded labour.`,
    steps: [
      { text: 'Write the full record of work and money owed today, while you remember dates.' },
      { text: 'Hand a written demand to the employer and photograph it.', carry: ['Aadhaar', 'Bank passbook', 'Job card if you have one', 'Any attendance slip'] },
      { text: 'File at the Block office / Labour office and get a dated receipt with a number.' },
      { text: 'Register free on e-Shram so your next job is on record.' },
      { text: 'Call 1800-110-001 for MGNREGA problems.' },
    ],
    resourceKinds: ['office', 'work-site'],
    helplines: ['1800-110-001', '15100'],
  },
  documents: {
    body: `Having **no documents is not the end of the road** — the system has a path for exactly this, and most of it is free.

- **Aadhaar**: enrolment is free. With no proof at all, an **introducer** or a **panchayat/ward head's certificate** is accepted at an Aadhaar Seva Kendra. The biometric update at 5 and 15 years is free.
- **Certificates (caste, income, residence, birth, death)**: apply at the tehsil/taluk office or a Jan Seva Kendra (CSC). The official fee is tens of rupees. **The fee board is required to be displayed — ask to see it.** Anyone quoting ₹1000–2000 is a middleman.
- **Pensions (old age, widow, disability)**: apply at the panchayat/ward office. Usually needs Aadhaar, a bank passbook, an age or disability certificate, and a photo. There is no fee.

Take a photocopy of everything you submit, and never hand over your only original without a receipt.`,
    steps: [
      { text: 'Go to the panchayat / ward office and ask which single form covers your case. Ask for the checklist in writing.' },
      { text: 'Collect the documents you have; ask about a self-declaration or ward certificate for what you lack.', carry: ['Aadhaar or any ID', 'Bank passbook', 'Two photos', 'Old ration card if any'] },
      { text: 'Submit and get a dated acknowledgement slip with an application number. No slip, no application.' },
      { text: 'Ask the counter for the expected date and check status with that number.' },
    ],
    resourceKinds: ['office'],
    helplines: ['14567', '15100'],
  },
  money: {
    body: `**Interest above your state's legal cap is not recoverable, and the threats are crimes.** A moneylender cannot keep your ration card, Aadhaar or land papers, cannot force you to work off a debt, and cannot threaten your family.

Do this:
1. Write down every amount taken and every amount repaid, with dates. His own notebook is not the only record.
2. Report to the **police station** and the **District Collector**. Taking documents as security and forced labour are both offences.
3. Get a **free lawyer** from the District Legal Services Authority — call **15100**. Free means free.

Instead of borrowing again: a **Jan Dhan** zero-balance account, an **SHG** loan through the local women's group, or a **Mudra** loan all cost a fraction of a moneylender's rate.

If money just disappeared from your account, call the bank and **1930** within three days — after that you may have to bear the loss yourself. Never share an OTP, not with a "bank officer", not with anyone.`,
    steps: [
      { text: 'Write the full debt history with dates and amounts today.' },
      { text: 'Call 15100 for a free lawyer before you sign or repay anything new.' },
      { text: 'Report document-holding or forced work at the police station; ask for a copy of the complaint.', carry: ['Any loan paper', 'Bank passbook', 'Aadhaar'] },
      { text: 'Open a Jan Dhan account at the nearest bank branch — zero balance, no fee.' },
    ],
    resourceKinds: ['office'],
    helplines: ['15100', '1930'],
  },
  grievance: {
    body: `Here is a complaint you can copy out and submit. Fill in the brackets.

---
**To:** The [District Supply Officer / Block Development Officer / Station House Officer], [district].
**Subject:** Complaint regarding [what was refused or demanded].

Sir/Madam, I, [full name], resident of [village/ward, district], [card/application number if any], went to [office or shop name] on [date] at about [time] to [what you wanted]. I was told [exactly what they said] and [money demanded / refused / sent back] by [name or designation, if known]. This is my [number] visit for the same matter.

I request you to [what you want done] and to inform me in writing. Please provide a dated acknowledgement number for this complaint.

[Signature / thumb impression], [date], [phone number]
---

**Submit it three ways so it cannot vanish:** in person with a stamped copy for yourself, by registered post (keep the slip), and online on the CPGRAMS / state grievance portal (keep the ticket number).

No reply in 30 days? File an **RTI** asking "what action was taken on my complaint dated [date]" — ₹10, waived if you are below the poverty line, reply due in 30 days. Free legal help: **15100**.`,
    steps: [
      { text: 'Copy the complaint out, filling every bracket. Keep it under one page.' },
      { text: 'Make three copies before you leave the house.', carry: ['Complaint copies x3', 'Aadhaar copy', 'Card or application number', 'Any receipt you already have'] },
      { text: 'Submit in person and insist on a stamp or a register entry number on your copy.' },
      { text: 'Post one copy by registered post and keep the slip.' },
      { text: 'If nothing happens in 30 days, file an RTI on the status, and call 15100.' },
    ],
    resourceKinds: ['office'],
    helplines: ['15100'],
  },

  farmer: {
    body: `**PM-KISAN pays ₹6,000 a year in three instalments — free, straight into your Aadhaar-linked bank account.** Nobody can charge you to register or to "release" an instalment.

If an instalment stopped, check these three things, in this order:
1. **e-KYC** — done free with an OTP, a fingerprint at a CSC, or face authentication.
2. **Land records** — your land must be seeded with your name at the agriculture or revenue office.
3. **Bank account** — Aadhaar must be linked (seeded) to the account, and the name must match exactly.

Crop damaged by hail, flooding of the field or unseasonal rain? **Report it within 72 hours on 14447** or the Crop Insurance app, and keep the docket number and photos. For cheap crop credit, ask any bank for a **Kisan Credit Card** instead of borrowing from the input dealer.`,
    steps: [
      { text: 'Open "Beneficiary Status" on pmkisan.gov.in with your registered mobile, or ask at the CSC.' },
      { text: 'Finish e-KYC at the CSC if it shows pending. It is free.', carry: ['Aadhaar card', 'Registered mobile phone'] },
      { text: 'If land records are the problem, go to the agriculture office with your land papers.', carry: ['Khatauni / land record copy', 'Bank passbook'] },
      { text: 'Still stuck? Call 155261 and write down the complaint number.' },
    ],
    resourceKinds: ['office'],
    helplines: ['155261', '14447', '1800-180-1551'],
  },

  education: {
    body: `**Most scholarships for students from poor families are applied for on the National Scholarship Portal — and applying is free.** Your state may run its own portal as well; apply on both if you are eligible for both.

Get these ready before the portal opens:
1. A **bank account in the student's own name**, linked to Aadhaar. This is the single most common reason money does not arrive.
2. **Income certificate**, and caste certificate if it applies.
3. Last year's **marksheet** and this year's **fee receipt**.

For school: under the Right to Education Act, private schools must keep **25% of entry-class seats free** for poor families — no donation, no test. For work: free Skill India courses, ITIs, and apprenticeships that **pay a stipend while you learn**. Never pay a "placement agent".`,
    steps: [
      { text: 'Open a bank account in the student\u2019s name and link Aadhaar to it.', carry: ['Aadhaar card', 'Photo', 'School ID'] },
      { text: 'Get an income certificate from the tehsil / e-District portal.' },
      { text: 'Register once on scholarships.gov.in when the window opens, then apply for the schemes it lists for you.' },
      { text: 'Print the application and submit it to the school or college for verification — this step is often forgotten.' },
    ],
    resourceKinds: ['office'],
    helplines: ['1947'],
  },

  enterprise: {
    body: `**You do not need a guarantor, collateral or an agent for these loans.**

- **Street vendor?** PM SVANidhi gives a working-capital loan without collateral. No vending certificate? A **Letter of Recommendation** from the municipality is enough. Repay on time and the next loan is bigger, with an interest subsidy and cashback on digital payments.
- **Carpenter, tailor, potter, cobbler, barber, mason and other traditional trades?** Register free for **PM Vishwakarma** at a CSC: training with a daily stipend, a toolkit voucher and a cheap loan.
- **Any other small business?** Ask any bank for a **Mudra "Shishu" loan**, and register free on the Udyam portal.

A moneylender's "daily collection" loan often costs more than 100% a year. Compare before you sign anything.`,
    steps: [
      { text: 'Pick the scheme that fits: SVANidhi (vendor), Vishwakarma (traditional trade) or Mudra (anything else).' },
      { text: 'Go to a CSC or bank branch. Registration is free.', carry: ['Aadhaar card', 'Mobile linked to Aadhaar', 'Bank passbook', 'Vending certificate or ULB letter (vendors)'] },
      { text: 'Write one line on what the money is for and how much you sell in a day — banks ask for this.' },
      { text: 'If anyone asks for a fee to "pass" the loan, refuse and report it to the bank manager.' },
    ],
    resourceKinds: ['office'],
    helplines: ['1930'],
  },

  scam: {
    body: `**Until you are sure: do not click, do not call back, do not share any OTP or PIN.**

To check it yourself, call the number printed on the back of your bank card or passbook, or visit the branch or office in person. Never use a number or link given in the message.

If money has already left your account, call **1930** at once — the first hour matters most — and report it on cybercrime.gov.in.`,
    steps: [
      { text: 'Do not reply, click, call back, or install anything the message asks for.' },
      { text: 'Verify only through the official number on your card, passbook or bill.' },
      { text: 'Report the message or number on the Sanchar Saathi portal ("Chakshu") so it can be checked and blocked.' },
      { text: 'Money gone? Call 1930 immediately and note the complaint number.' },
    ],
    helplines: ['1930'],
  },

  calculator: {
    body: `Take this number with you. It is what the law says you are owed, and writing it into a complaint makes the complaint much harder to ignore.`,
    helplines: ['1967', '15100'],
  },

  planner: {
    body: `Here is one plan across all your problems, in the order that protects life and food first:`,
    helplines: ['112', '1078', '15100'],
  },
};

const HI: Partial<Record<Exclude<AgentId, 'router'>, DemoAnswer>> = {
  emergency: {
    body: `**अभी 112 पर कॉल करें।** पहले गाँव या पास की पहचान वाली जगह बताइए, फिर क्या हुआ, फिर कितने लोग घायल हैं। जब तक वे पता दोहरा न दें, फ़ोन न काटें।

जब तक मदद आए:
- घायल को हिलाइए नहीं, गरम रखिए। गर्दन, कमर या सिर की चोट में तो बिल्कुल न हिलाएँ।
- बेहोश या उलटी कर रहे व्यक्ति को पानी या खाना न दें।
- एक आदमी को मुख्य सड़क पर भेजिए जो एम्बुलेंस को रास्ता दिखाए।

गंभीर घायल को बाइक पर न ले जाएँ। **108** की मुफ़्त एम्बुलेंस जल्दी आती है और रास्ते में ही इलाज शुरू कर देती है।`,
    steps: [
      { text: '112 पर कॉल करें। सबसे पहले जगह की पहचान बताइए।' },
      { text: '112 न लगे तो 108 पर मुफ़्त एम्बुलेंस बुलाइए।' },
      { text: 'एक व्यक्ति को सड़क पर भेजिए ताकि एम्बुलेंस भटके नहीं।' },
      { text: '30 सेकंड में जो मिल जाए वो साथ रख लें।', carry: ['आधार या कोई पहचान', 'पुरानी पर्ची', 'फ़ोन + चार्जर'] },
    ],
    resourceKinds: ['hospital'],
    helplines: ['112', '108', '101', '1098', '181'],
  },
  ration: {
    body: `खाद्य सुरक्षा कानून के तहत हर व्यक्ति को हर महीने **5 किलो अनाज मुफ़्त** मिलता है। अंत्योदय (AAY) परिवार को **35 किलो** मिलता है। कोटेदार इसका पैसा नहीं ले सकता, और "स्टॉक नहीं है" कहकर मना नहीं कर सकता — स्टॉक रजिस्टर में लिखा होता है और आप उसे देख सकते हैं।

अगर दुकान से लौटा दिया गया:
1. कोटेदार से **स्टॉक रजिस्टर** और **e-POS मशीन का वज़न** दिखाने को कहिए। वहीं खड़े रहिए जहाँ से तराज़ू दिखे।
2. तारीख़, दुकान नंबर और जो कहा गया, लिख लीजिए।
3. **1967** पर शिकायत करें (या 1800-11-0841), फिर **जिला आपूर्ति कार्यालय** में जाकर।

काम के लिए दूसरे शहर आए हैं? **वन नेशन वन राशन कार्ड** से आपका कार्ड पूरे भारत में चलता है — नया कार्ड नहीं चाहिए, बस किसी e-POS दुकान पर आधार से अंगूठा लगाइए।`,
    steps: [
      { text: 'दुकान खुलने के समय कार्ड और जिस सदस्य का अंगूठा दर्ज है उसका आधार लेकर जाइए।', carry: ['राशन कार्ड', 'आधार कार्ड', 'अनाज का थैला'] },
      { text: 'मना करने पर स्टॉक रजिस्टर दिखाने को कहिए, हो सके तो फ़ोटो लीजिए।' },
      { text: 'उसी दिन 1967 पर शिकायत कीजिए और शिकायत नंबर लिख लीजिए।' },
      { text: 'कार्ड ही नहीं है? कम्युनिटी किचन में बिना कार्ड मुफ़्त पका खाना मिलता है।' },
    ],
    resourceKinds: ['ration-shop', 'office'],
    helplines: ['1967'],
  },
  shelter: {
    body: `**घर में पानी घुस रहा है, या दीवार/पहाड़ी में दरार आई है — तो अभी निकलिए।** सरकारी आदेश का इंतज़ार न करें, सुबह का भी नहीं।

कैसे निकलें:
- **सड़क से ऊँची जगह** की तरफ़ जाइए, खेत का शॉर्टकट या नदी किनारा कभी नहीं।
- घुटने से ऊपर बहते पानी में कभी न उतरें। वह बड़े आदमी को भी गिरा देता है।
- बुज़ुर्ग, गर्भवती महिला, छोटे बच्चे और दिव्यांग को **पहले** निकालिए। राहतकर्मी से गाड़ी या स्ट्रेचर माँगिए — वे इसी के लिए हैं।

पाँच मिनट में एक थैला: पीने का पानी, सूखा खाना, दवा, पहचान पत्र की कॉपी, कंबल, टॉर्च, फ़ोन-चार्जर, और घर में रखा नगद।

बाद में आपको तुरंत राहत राशि, खाद्य किट और मकान के नुकसान का मुआवज़ा मिलने का हक़ है। खोया राशन कार्ड या आधार मुफ़्त दोबारा बनता है — कागज़ खोने से हक़ नहीं खोता।`,
    steps: [
      { text: 'अभी तय कीजिए: पानी बढ़ रहा है, दीवार चटकी है, या सायरन बजा — तो निकलिए।' },
      { text: 'पाँच मिनट में एक थैला तैयार कीजिए।', carry: ['पीने का पानी', 'सूखा खाना', 'दवाइयाँ', 'पहचान पत्र की कॉपी', 'कंबल', 'टॉर्च', 'फ़ोन + चार्जर', 'नगद'] },
      { text: 'नीचे दी गई नज़दीकी शरण जगह तक पैदल जाइए। पड़ोसी को बता दीजिए कहाँ जा रहे हैं।' },
      { text: 'शिविर में परिवार का नाम रजिस्टर में लिखवाइए — राहत उसी के आधार पर मिलती है।' },
      { text: 'पैदल न पहुँच सकें तो 1078 या 112 पर कॉल कीजिए।' },
    ],
    resourceKinds: ['shelter'],
    helplines: ['112', '1078', '181'],
  },

  farmer: {
    body: `**PM-KISAN में साल के ₹6,000 तीन किस्तों में सीधे आधार से जुड़े बैंक खाते में आते हैं — बिल्कुल मुफ़्त।** पंजीकरण या किस्त "निकलवाने" के पैसे कोई नहीं ले सकता।

किस्त रुक गई है तो इसी क्रम में जाँचिए:
1. **e-KYC** — OTP से, CSC पर अंगूठे से, या चेहरे से, मुफ़्त।
2. **ज़मीन का रिकॉर्ड** — कृषि या राजस्व कार्यालय में आपके नाम से जुड़ा होना चाहिए।
3. **बैंक खाता** — आधार से जुड़ा हो और नाम हूबहू मिले।

ओले, खेत में पानी भरने या बेमौसम बारिश से फसल ख़राब हुई? **72 घंटे के अंदर 14447 पर सूचना दीजिए** और शिकायत नंबर व फ़ोटो रखिए। सस्ते फसली कर्ज़ के लिए खाद-दुकान के उधार की जगह बैंक से **किसान क्रेडिट कार्ड** माँगिए।`,
    steps: [
      { text: 'pmkisan.gov.in पर पंजीकृत मोबाइल से "लाभार्थी स्थिति" देखिए, या CSC पर पूछिए।' },
      { text: 'e-KYC बाक़ी हो तो CSC पर पूरी कराइए। यह मुफ़्त है।', carry: ['आधार कार्ड', 'पंजीकृत मोबाइल'] },
      { text: 'ज़मीन के रिकॉर्ड की दिक़्क़त हो तो कागज़ लेकर कृषि कार्यालय जाइए।', carry: ['खतौनी / भूमि रिकॉर्ड', 'बैंक पासबुक'] },
      { text: 'फिर भी न हो तो 155261 पर कॉल करके शिकायत नंबर लिख लीजिए।' },
    ],
    resourceKinds: ['office'],
    helplines: ['155261', '14447', '1800-180-1551'],
  },

  education: {
    body: `**ग़रीब परिवारों के छात्रों की ज़्यादातर छात्रवृत्तियाँ राष्ट्रीय छात्रवृत्ति पोर्टल पर मिलती हैं — और आवेदन मुफ़्त है।** राज्य का पोर्टल भी हो सकता है; दोनों के लायक़ हों तो दोनों पर आवेदन कीजिए।

पोर्टल खुलने से पहले तैयार रखिए:
1. **छात्र के अपने नाम का बैंक खाता**, आधार से जुड़ा हुआ — पैसा न आने की सबसे बड़ी वजह यही है।
2. **आय प्रमाण पत्र**, और लागू हो तो जाति प्रमाण पत्र।
3. पिछले साल की **मार्कशीट** और इस साल की **फ़ीस रसीद**।

स्कूल के लिए: शिक्षा के अधिकार क़ानून में निजी स्कूलों को पहली कक्षा की **25% सीटें ग़रीब परिवारों के लिए मुफ़्त** रखनी होती हैं — न दान, न परीक्षा। काम के लिए: मुफ़्त स्किल इंडिया कोर्स, ITI, और **वज़ीफ़े वाली अप्रेंटिसशिप**। किसी "प्लेसमेंट एजेंट" को पैसे न दें।`,
    steps: [
      { text: 'छात्र के नाम से बैंक खाता खुलवाकर आधार से जोड़िए।', carry: ['आधार कार्ड', 'फ़ोटो', 'स्कूल पहचान पत्र'] },
      { text: 'तहसील / ई-डिस्ट्रिक्ट पोर्टल से आय प्रमाण पत्र बनवाइए।' },
      { text: 'पोर्टल खुलने पर scholarships.gov.in पर एक बार पंजीकरण करके बताई गई योजनाओं में आवेदन कीजिए।' },
      { text: 'आवेदन का प्रिंट स्कूल या कॉलेज में सत्यापन के लिए जमा कीजिए — यह क़दम अक्सर छूट जाता है।' },
    ],
    resourceKinds: ['office'],
    helplines: ['1947'],
  },

  enterprise: {
    body: `**इन लोन के लिए न गारंटर चाहिए, न गिरवी, न कोई एजेंट।**

- **रेहड़ी-पटरी वाले?** PM स्वनिधि बिना गारंटी कामकाजी पूँजी का लोन देती है। वेंडिंग सर्टिफ़िकेट नहीं है तो नगर निकाय का **सिफ़ारिश पत्र** काफ़ी है। समय पर चुकाने पर अगला लोन बड़ा, ब्याज में छूट और डिजिटल भुगतान पर कैशबैक।
- **बढ़ई, दर्जी, कुम्हार, मोची, नाई, राजमिस्त्री जैसे पारंपरिक काम?** CSC पर **PM विश्वकर्मा** में मुफ़्त पंजीकरण: वज़ीफ़े वाली ट्रेनिंग, औज़ार का वाउचर और सस्ता लोन।
- **कोई और छोटा कारोबार?** किसी भी बैंक से **मुद्रा "शिशु" लोन** माँगिए, और उद्यम पोर्टल पर मुफ़्त पंजीकरण कीजिए।

साहूकार का "रोज़ की वसूली" वाला लोन अक्सर साल में 100% से ज़्यादा पड़ता है। दस्तख़त से पहले तुलना कीजिए।`,
    steps: [
      { text: 'सही योजना चुनिए: स्वनिधि (रेहड़ी), विश्वकर्मा (पारंपरिक काम) या मुद्रा (बाक़ी सब)।' },
      { text: 'CSC या बैंक शाखा जाइए। पंजीकरण मुफ़्त है।', carry: ['आधार कार्ड', 'आधार से जुड़ा मोबाइल', 'बैंक पासबुक', 'वेंडिंग सर्टिफ़िकेट या नगर निकाय का पत्र (रेहड़ी वालों के लिए)'] },
      { text: 'एक लाइन लिखिए कि पैसा किस काम के लिए है और रोज़ कितनी बिक्री होती है — बैंक यही पूछता है।' },
      { text: 'लोन "पास" कराने के लिए कोई फ़ीस माँगे तो मना कीजिए और बैंक मैनेजर से शिकायत कीजिए।' },
    ],
    resourceKinds: ['office'],
    helplines: ['1930'],
  },

  scam: {
    body: `**पक्का होने तक: न क्लिक करें, न वापस कॉल करें, न कोई OTP या PIN बताएँ।**

जाँचना हो तो अपने बैंक कार्ड या पासबुक पर छपे नंबर पर कॉल कीजिए, या ख़ुद शाखा/दफ़्तर जाइए। मैसेज में दिया नंबर या लिंक कभी इस्तेमाल न करें।

अगर पैसा खाते से निकल चुका है तो तुरंत **1930** पर कॉल कीजिए — पहला घंटा सबसे ज़रूरी है — और cybercrime.gov.in पर शिकायत दर्ज कीजिए।`,
    steps: [
      { text: 'मैसेज में जो कहा है — जवाब, क्लिक, कॉल या ऐप डालना — कुछ न करें।' },
      { text: 'सिर्फ़ कार्ड, पासबुक या बिल पर छपे आधिकारिक नंबर से जाँचिए।' },
      { text: 'संचार साथी पोर्टल ("चक्षु") पर उस मैसेज या नंबर की शिकायत कीजिए।' },
      { text: 'पैसा गया? तुरंत 1930 पर कॉल कीजिए और शिकायत नंबर लिख लीजिए।' },
    ],
    helplines: ['1930'],
  },

  calculator: {
    body: `यह हिसाब अपने साथ रखिए। क़ानून के हिसाब से यही आपका हक़ है, और शिकायत में यह लिखने से उसे टालना मुश्किल हो जाता है।`,
    helplines: ['1967', '15100'],
  },

  planner: {
    body: `आपकी सभी परेशानियों के लिए एक योजना — पहले जान और खाना, फिर बाक़ी:`,
    helplines: ['112', '1078', '15100'],
  },
};

const TABLE: Partial<Record<LangCode, Partial<Record<Exclude<AgentId, 'router'>, DemoAnswer>>>> = {
  'hi-IN': HI,
};

export function demoAnswer(id: AgentId, lang: LangCode): DemoAnswer {
  if (id === 'router') return { body: '' };
  return TABLE[lang]?.[id] ?? EN[id];
}

export function demoAnswerEnglish(id: AgentId): DemoAnswer {
  if (id === 'router') return { body: '' };
  return EN[id];
}
