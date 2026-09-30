import type { ResourceCard, UserPlace } from '../types';

/**
 * Seed service directory. These are ILLUSTRATIVE local entries for the demo
 * plus REAL national helpline numbers. Local rows must be replaced with a live
 * feed (state PDS portal, NDMA/SDMA shelter lists, PM-JAY hospital registry)
 * before this is put in front of real users — a wrong shelter address in a
 * flood is worse than no address.
 */

export const PLACES: UserPlace[] = [
  { label: 'Patna — Danapur', district: 'Patna', state: 'Bihar', lat: 25.6357, lng: 85.0476 },
  { label: 'Delhi — Seelampur', district: 'North East Delhi', state: 'Delhi', lat: 28.6702, lng: 77.2673 },
  { label: 'Mumbai — Govandi', district: 'Mumbai Suburban', state: 'Maharashtra', lat: 19.0553, lng: 72.9195 },
  { label: 'Lucknow — Gomti Nagar', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8524, lng: 81.0055 },
  { label: 'Guwahati — Jalukbari', district: 'Kamrup Metro', state: 'Assam', lat: 26.1533, lng: 91.6638 },
];

/** Helplines that are genuinely national and stable. */
export const HELPLINES: ResourceCard[] = [
  { id: 'h-112', kind: 'helpline', name: '112', detail: 'All emergencies — police, fire, ambulance, disaster', phone: '112', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-108', kind: 'helpline', name: '108', detail: 'Free ambulance (most states)', phone: '108', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-101', kind: 'helpline', name: '101', detail: 'Fire brigade', phone: '101', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-1098', kind: 'helpline', name: '1098', detail: 'Childline — child in danger, child labour, missing child', phone: '1098', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-181', kind: 'helpline', name: '181', detail: 'Women helpline — violence, shelter, counselling', phone: '181', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-104', kind: 'helpline', name: '104', detail: 'Health advice and medical guidance', phone: '104', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-1078', kind: 'helpline', name: '1078', detail: 'National disaster management helpline', phone: '1078', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-1967', kind: 'helpline', name: '1967', detail: 'Ration / food security complaints (with 1800-11-0841)', phone: '1967', status: { label: 'Office hours', tone: 'warn' } },
  { id: 'h-15100', kind: 'helpline', name: '15100', detail: 'Free legal aid — NALSA', phone: '15100', status: { label: 'Office hours', tone: 'warn' } },
  { id: 'h-14567', kind: 'helpline', name: '14567', detail: 'Elder line — help for senior citizens', phone: '14567', status: { label: '8am–8pm', tone: 'warn' } },
  { id: 'h-1930', kind: 'helpline', name: '1930', detail: 'Cyber fraud — report money stolen online', phone: '1930', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-14416', kind: 'helpline', name: '14416', detail: 'Tele-MANAS — free mental health support', phone: '14416', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-1800111565', kind: 'helpline', name: '1800-111-565', detail: 'Ayushman Bharat PM-JAY helpline', phone: '1800111565', status: { label: '24x7', tone: 'ok' } },
  { id: 'h-14445', kind: 'helpline', name: '14445', detail: 'One Nation One Ration Card — ration away from home', phone: '14445', status: { label: 'Office hours', tone: 'warn' } },
  { id: 'h-1947', kind: 'helpline', name: '1947', detail: 'Aadhaar (UIDAI) — enrolment and update help', phone: '1947', status: { label: '24x7 IVR', tone: 'ok' } },
  { id: 'h-1800110001', kind: 'helpline', name: '1800-110-001', detail: 'MGNREGA / rural employment grievances', phone: '1800110001', status: { label: 'Office hours', tone: 'warn' } },
  { id: 'h-155261', kind: 'helpline', name: '155261', detail: 'PM-KISAN helpline — instalment, e-KYC, status', phone: '155261', status: { label: 'Office hours', tone: 'warn' } },
  { id: 'h-14447', kind: 'helpline', name: '14447', detail: 'Crop insurance (PMFBY) — report crop loss within 72 hours', phone: '14447', status: { label: 'Office hours', tone: 'warn' } },
  { id: 'h-18001801551', kind: 'helpline', name: '1800-180-1551', detail: 'Kisan Call Centre — crop, pest and scheme advice in local languages', phone: '18001801551', status: { label: '6am–10pm', tone: 'ok' } },
  { id: 'h-14434', kind: 'helpline', name: '14434', detail: 'e-Shram — unorganised worker registration help', phone: '14434', status: { label: 'Office hours', tone: 'warn' } },
];

export const RATION_SHOPS: ResourceCard[] = [
  { id: 'r1', kind: 'ration-shop', name: 'FPS 2041 — Ram Prasad Kirana', detail: 'Wheat, rice, sugar. e-POS machine working.', address: 'Ward 4, near Hanuman Mandir', hours: 'Mon–Sat 8–11am, 4–7pm', phone: '1967', lat: 25.6371, lng: 85.0501, status: { label: 'Stock available', tone: 'ok' } },
  { id: 'r2', kind: 'ration-shop', name: 'FPS 1187 — Sushila Devi', detail: 'Rice and dal. Portability (ONORC) accepted here.', address: 'Bus stand road, opposite school', hours: 'Daily 9am–1pm', phone: '1967', lat: 25.6290, lng: 85.0442, status: { label: 'Accepts other-state cards', tone: 'ok' } },
  { id: 'r3', kind: 'ration-shop', name: 'FPS 3320 — Block Godown Outlet', detail: 'Wheat only this week. Long queue after 10am.', address: 'Block office compound', hours: 'Mon/Wed/Fri 9am–2pm', lat: 25.6442, lng: 85.0398, status: { label: 'Wheat only', tone: 'warn' } },
  { id: 'r4', kind: 'ration-shop', name: 'Community Kitchen — Ward 7', detail: 'Free cooked meal, no card needed. Run with district administration.', address: 'Community hall, Ward 7', hours: 'Lunch 12–2pm, dinner 7–9pm', lat: 25.6333, lng: 85.0550, status: { label: 'No card needed', tone: 'ok' } },
];

export const SHELTERS: ResourceCard[] = [
  { id: 's1', kind: 'shelter', name: 'Govt. Middle School Relief Camp', detail: 'Pucca roof, drinking water, separate women\u2019s room, medical desk twice a day.', address: 'School campus, Ward 3 (raised ground)', hours: 'Open now, 24x7', phone: '1078', lat: 25.6402, lng: 85.0519, status: { label: 'Space available', tone: 'ok' } },
  { id: 's2', kind: 'shelter', name: 'Rain Basera — Night Shelter', detail: '40 beds, blankets, free tea. Families and single men in separate halls.', address: 'Near old bus depot', hours: '6pm–8am daily', lat: 25.6285, lng: 85.0473, status: { label: 'Few beds left', tone: 'warn' } },
  { id: 's3', kind: 'shelter', name: 'Panchayat Bhavan Flood Shelter', detail: 'Highest point in the panchayat. Boat rescue point outside.', address: 'Panchayat Bhavan, main road', hours: 'Open during warnings', phone: '112', lat: 25.6501, lng: 85.0361, status: { label: 'Open — warning active', tone: 'danger' } },
  { id: 's4', kind: 'shelter', name: 'Women & Children Shelter (Sakhi Centre)', detail: 'Safe stay for women facing violence, with children. Free, confidential.', address: 'District hospital campus', hours: '24x7', phone: '181', lat: 25.6318, lng: 85.0604, status: { label: '24x7', tone: 'ok' } },
];

export const HOSPITALS: ResourceCard[] = [
  { id: 'm1', kind: 'hospital', name: 'Primary Health Centre (PHC), Ward 5', detail: 'Free OPD, free medicines, immunisation, ASHA desk.', address: 'Ward 5 main lane', hours: 'Mon–Sat 8am–2pm', lat: 25.6349, lng: 85.0462, status: { label: 'Free', tone: 'ok' } },
  { id: 'm2', kind: 'hospital', name: 'District Hospital — Emergency', detail: 'Casualty, free delivery, Ayushman help desk at Gate 2.', address: 'Hospital road', hours: '24x7 emergency', phone: '108', lat: 25.6205, lng: 85.0588, status: { label: 'PM-JAY empanelled', tone: 'ok' } },
  { id: 'm3', kind: 'hospital', name: 'Jan Aushadhi Kendra', detail: 'Generic medicines at 50–80% lower price. Ask for the salt name.', address: 'Beside district hospital gate', hours: 'Mon–Sat 9am–7pm', lat: 25.6211, lng: 85.0594, status: { label: 'Cheap medicine', tone: 'ok' } },
];

export const OFFICES: ResourceCard[] = [
  { id: 'o1', kind: 'office', name: 'Jan Seva Kendra / CSC', detail: 'Certificates, Aadhaar update, scheme applications. Fees are posted on the wall — ask to see the board.', address: 'Block office, Room 3', hours: 'Mon–Fri 10am–5pm', lat: 25.6440, lng: 85.0402, status: { label: 'Check posted fee', tone: 'warn' } },
  { id: 'o2', kind: 'office', name: 'Block Development Office (MGNREGA)', detail: 'Job card, written work demand, wage complaints. Ask for a dated receipt.', address: 'Block office, ground floor', hours: 'Mon–Fri 10am–5pm', phone: '1800110001', lat: 25.6438, lng: 85.0405, status: { label: 'Receipt is your proof', tone: 'warn' } },
  { id: 'o3', kind: 'office', name: 'District Supply Office (PDS)', detail: 'Ration card problems, dealer complaints, card blocked or e-KYC failure.', address: 'Collectorate, first floor', hours: 'Mon–Fri 10am–5pm', phone: '1967', lat: 25.6180, lng: 85.0620, status: { label: 'Escalation point', tone: 'muted' } },
  { id: 'o4', kind: 'office', name: 'District Legal Services Authority (DLSA)', detail: 'Free lawyer, free legal advice, help writing complaints.', address: 'Civil court campus', hours: 'Mon–Sat 10am–4pm', phone: '15100', lat: 25.6162, lng: 85.0641, status: { label: 'Free', tone: 'ok' } },
];

export const ALL_RESOURCES: ResourceCard[] = [
  ...RATION_SHOPS,
  ...SHELTERS,
  ...HOSPITALS,
  ...OFFICES,
];

/** Haversine, in km. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearest(
  kinds: ResourceCard['kind'][],
  place: { lat: number; lng: number },
  limit = 3,
): ResourceCard[] {
  return ALL_RESOURCES.filter((r) => kinds.includes(r.kind))
    .map((r) => ({
      ...r,
      distanceKm:
        r.lat != null && r.lng != null
          ? Number(distanceKm(place, { lat: r.lat, lng: r.lng }).toFixed(1))
          : undefined,
    }))
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, limit);
}

export function helplinesFor(ids: string[]): ResourceCard[] {
  return ids
    .map((id) => HELPLINES.find((h) => h.name.replace(/-/g, '') === id.replace(/-/g, '')))
    .filter((h): h is ResourceCard => Boolean(h));
}
