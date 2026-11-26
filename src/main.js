// আমার উপজেলা — অ্যাপের UI
import { createApi, PAGE, boostState } from './api.js';
import { POST_CATS, SERVICE_CATS, EMERGENCY, PUBLIC_URL, SETTING_KEYS, PLAY_URL } from './config.js';
import { DISTRICTS, DISTRICT_ORDER, HOME_UPAZILA, HOME_DISTRICT, BLOOD_GROUPS } from './bd-geo.js';

// সাধারণ এক রঙের রেখার আইকন (লেখার রং-ই আইকনের রং)
const ICONS = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  drop: '<path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  poll: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  message: '<path d="M4 5h16v11H9l-5 4z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  note: '<path d="M5 4h10l4 4v12H5z"/><path d="M8 12h8M8 16h5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  reply: '<path d="M9 7 4 12l5 5"/><path d="M4 12h9a7 7 0 0 1 7 7"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14.5c2.5 0 4.2 1.6 4.8 4.5"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8 12 3 3 5-6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  login: '<path d="M10 17l5-5-5-5M15 12H3M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>',
  thumb: '<path d="M7 11v9H4v-9zM7 11l4-8c1.5 0 2.5 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 6.5A2.5 2.5 0 0 1 16.8 20H7"/>',
  comment: '<path d="M12 4c4.7 0 8.5 3.1 8.5 7s-3.8 7-8.5 7c-1 0-2-.1-2.9-.4L4 19.5l1.4-3.6C4.2 14.6 3.5 12.9 3.5 11c0-3.9 3.8-7 8.5-7z"/>',
  share: '<path d="M14 5l7 7-7 7M21 12H10a7 7 0 0 0-7 7"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  pushpin: '<path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v8"/>',
  dots: '<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  photo: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  // সোশ্যাল লিংকের সাধারণ আইকন (কোম্পানির আসল লোগো নয়; পাশে নাম লেখা থাকে)
  s_facebook: '<circle cx="12" cy="12" r="9"/><path d="M13.5 8.5h-1.2c-.9 0-1.3.5-1.3 1.3V21M9 13h5"/>',
  s_whatsapp: '<path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z"/><path d="M9.5 9.5c.3 2 2.5 4.6 5 5l1-1.2-1.6-.9-.8.7c-.9-.4-1.8-1.3-2.2-2.2l.7-.8-.9-1.6z"/>',
  s_tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.4 2.3 2 3.8 4.5 4"/>',
  s_youtube: '<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="M10.5 9.5v5l4-2.5z"/>',
  s_instagram: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7"/>',
  org: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M12 3l8 6H4z"/><path d="M9 20v-5h6v5"/>',
  work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/>',
  school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  chevD: '<path d="M6 9l6 6 6-6"/>',
  album: '<rect x="3" y="6" width="15" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/><path d="M3 16l4-4 4 4 3-3 4 4"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/>',
  'wifi-off': '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/><path d="M3 3l18 18"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  post: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  store: '<path d="M4 9h16l-1 11H5z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
const ic = (name, size = 18, fill = 'none') => `<svg class="ic-line" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
// ফেসবুকের মতো রিয়্যাক্ট
const REACTIONS = [['like', '👍', 'লাইক'], ['love', '❤️', 'ভালোবাসা'], ['haha', '😂', 'হাহা'], ['wow', '😮', 'অবাক'], ['sad', '😢', 'দুঃখ'], ['angry', '😡', 'রাগ']];
// গোল রিয়্যাক্ট আইকন (সব ফোনে একই রকম দেখায়)
const RX_SVG = {
  like: '<circle cx="20" cy="20" r="20" fill="#2f7df6"/><circle cx="20" cy="20" r="20" fill="url(#rxs)"/><path d="M13 19h3v10h-3zM17.5 19.5l3.7-7.2c1.5.1 2.4 1.2 2.2 2.7l-.5 3h5.3c1.2 0 2 1.1 1.8 2.2l-1.3 6.4c-.2 1-1.1 1.7-2.1 1.7h-9.1z" fill="#fff"/>',
  love: '<circle cx="20" cy="20" r="20" fill="#f0405e"/><circle cx="20" cy="20" r="20" fill="url(#rxs)"/><path d="M20 30s-9-5.6-9-11.6A5 5 0 0 1 20 15a5 5 0 0 1 9 3.4C29 24.4 20 30 20 30z" fill="#fff"/>',
  haha: '<circle cx="20" cy="20" r="20" fill="#fcc537"/><circle cx="20" cy="20" r="20" fill="url(#rxs)"/><path d="M11 15.5l4.5 2-4.5 2M29 15.5l-4.5 2 4.5 2" stroke="#5b3a12" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.5 22.5h19c0 6-4.3 9.5-9.5 9.5s-9.5-3.5-9.5-9.5z" fill="#5b3a12"/><path d="M15 29.3c1.4-1.6 3.1-2.3 5-2.3s3.6.7 5 2.3c-1.4 1.1-3.1 1.7-5 1.7s-3.6-.6-5-1.7z" fill="#f2566f"/>',
  wow: '<circle cx="20" cy="20" r="20" fill="#fcc537"/><circle cx="20" cy="20" r="20" fill="url(#rxs)"/><path d="M11 12.5c1.3-1.4 3.2-1.9 5-1.3M29 12.5c-1.3-1.4-3.2-1.9-5-1.3" stroke="#5b3a12" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="14" cy="17.5" rx="2.2" ry="3" fill="#5b3a12"/><ellipse cx="26" cy="17.5" rx="2.2" ry="3" fill="#5b3a12"/><ellipse cx="20" cy="27.5" rx="4.3" ry="5.3" fill="#5b3a12"/>',
  sad: '<circle cx="20" cy="20" r="20" fill="#fcc537"/><circle cx="20" cy="20" r="20" fill="url(#rxs)"/><path d="M10.5 15c1.8-.3 3.5-1.3 4.6-2.8M29.5 15c-1.8-.3-3.5-1.3-4.6-2.8" stroke="#5b3a12" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="14.5" cy="19.5" rx="2" ry="2.5" fill="#5b3a12"/><ellipse cx="25.5" cy="19.5" rx="2" ry="2.5" fill="#5b3a12"/><path d="M14.5 30c1.3-2.3 3.2-3.4 5.5-3.4s4.2 1.1 5.5 3.4" stroke="#5b3a12" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M11.5 22.5c0 0-2.2 3.1-2.2 4.6a2.2 2.2 0 0 0 4.4 0c0-1.5-2.2-4.6-2.2-4.6z" fill="#4aa8ff"/>',
  angry: '<defs><linearGradient id="rxa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f05a36"/><stop offset=".75" stop-color="#fcc537"/></linearGradient></defs><circle cx="20" cy="20" r="20" fill="url(#rxa)"/><path d="M10.5 15.5l6.5 2.5M29.5 15.5L23 18" stroke="#5b1a0a" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="15" cy="20.5" rx="2" ry="2.2" fill="#5b1a0a"/><ellipse cx="25" cy="20.5" rx="2" ry="2.2" fill="#5b1a0a"/><path d="M15 29c1.5-1.4 3.2-2 5-2s3.5.6 5 2" stroke="#5b1a0a" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
};
const RX_DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><radialGradient id="rxs" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></radialGradient></defs></svg>';
document.body.insertAdjacentHTML('afterbegin', RX_DEFS);
const rxIcon = (k, size = 20) => `<svg class="rx-ic" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">${RX_SVG[k] || RX_SVG.like}</svg>`;
const rxEmoji = k => rxIcon(k, 18);
const rxName = k => (REACTIONS.find(r => r[0] === k) || REACTIONS[0])[2];
const FB_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4a21 21 0 0 0-2.4-.1c-2.3 0-3.9 1.4-3.9 4v2.2H7.7v3h2.6V21z"/></svg>';
const postLink = id => `${(PUBLIC_URL || location.href.split('#')[0]).replace(/#.*$/, '')}#post-${id}`;
const pageLink = id => `${(PUBLIC_URL || location.href.split('#')[0]).replace(/#.*$/, '')}#page-${id}`;
// মেসেজে লিংক থাকলে চাপা যায়; অ্যাপের পোস্টের লিংক অ্যাপের ভেতরেই খোলে
const linkify = t => esc(t).replace(/https?:\/\/[^\s<]+/g, u => { const m = u.match(/#post-(\d+)$/), pm = u.match(/#page-(\d+)$/); return pm ? `<a href="${u}" data-page="${pm[1]}">পেইজটি দেখুন ↗</a>` : m ? `<a href="${u}" data-openpost="${m[1]}">পোস্টটি দেখুন ↗</a>` : `<a href="${u}" target="_blank" rel="noopener">${u}</a>`; });

// ================================================================ সহায়ক
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bn = n => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const local = {
  get(k, d) { try { const v = localStorage.getItem('au_' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('au_' + k, JSON.stringify(v)); } catch { /* ignore */ } },
};
function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'এইমাত্র';
  if (s < 3600) return bn(Math.floor(s / 60)) + ' মিনিট আগে';
  if (s < 86400) return bn(Math.floor(s / 3600)) + ' ঘণ্টা আগে';
  if (s < 172800) return 'গতকাল';
  if (s < 604800) return bn(Math.floor(s / 86400)) + ' দিন আগে';
  return new Date(iso).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}
const clock = iso => new Date(iso).toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' });
// জন্মসাল: বয়স অন্তত ১৩ (অ্যাপের নিয়ম)
const MIN_AGE = 13;
const MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
// জন্মতারিখ: দিন / মাস / সাল তিনটা ড্রপডাউন
function dateSelect(p, cur, required) {
  const [cy, cm, cd] = (cur || '').split('-').map(Number), max = new Date().getFullYear() - MIN_AGE, req = required ? 'required' : '';
  let d = `<option value="">দিন</option>`; for (let i = 1; i <= 31; i++) d += `<option value="${i}" ${i === cd ? 'selected' : ''}>${bn(i)}</option>`;
  let m = `<option value="">মাস</option>`; MONTHS_BN.forEach((n, i) => { m += `<option value="${i + 1}" ${i + 1 === cm ? 'selected' : ''}>${n}</option>`; });
  let y = `<option value="">সাল</option>`; for (let i = max; i >= 1920; i--) y += `<option value="${i}" ${i === cy ? 'selected' : ''}>${bn(i)}</option>`;
  return `<div class="date3"><select class="f" id="${p}-d" ${req} aria-label="জন্মের দিন">${d}</select><select class="f" id="${p}-m" ${req} aria-label="জন্মের মাস">${m}</select><select class="f" id="${p}-y" ${req} aria-label="জন্মের সাল">${y}</select></div>`;
}
// '' (খালি), 'YYYY-MM-DD', অথবা { err }
function readDate(p, required) {
  const d = Number($(`#${p}-d`).value), m = Number($(`#${p}-m`).value), y = Number($(`#${p}-y`).value);
  if (!d && !m && !y) return required ? { err: 'জন্মতারিখ দিন (দিন, মাস, সাল)' } : '';
  if (!d || !m || !y) return { err: 'জন্মতারিখের দিন, মাস ও সাল তিনটাই বাছাই করুন' };
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return { err: `${MONTHS_BN[m - 1]} মাসে ${bn(d)} তারিখ নেই` };
  const t = new Date(), lim = new Date(Date.UTC(t.getFullYear() - MIN_AGE, t.getMonth(), t.getDate()));
  if (dt > lim) return { err: `বয়স অন্তত ${bn(MIN_AGE)} বছর হতে হবে` };
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
const birthText = u => (u.birthDate ? bnDate(u.birthDate) : u.birthYear ? `${bn(u.birthYear)} সাল` : '');
const GENDERS = { male: 'পুরুষ', female: 'নারী', other: 'অন্যান্য' };
const genderSelect = (id, cur, required) => `<select class="f" id="${id}" ${required ? 'required' : ''}>
  <option value="" disabled ${cur === undefined ? 'selected' : ''}>বাছাই করুন</option>
  ${Object.entries(GENDERS).map(([k, l]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${l}</option>`).join('')}
  <option value="none" ${cur === '' ? 'selected' : ''}>বলতে চাই না</option></select>`;
// ইউজারনেম: ছোট হাতের ইংরেজি অক্ষর, সংখ্যা, _ ও . (৩–২০)
const normUsername = v => (v || '').trim().replace(/^@/, '').toLowerCase();
const validUsername = u => /^[a-z0-9_.]{3,20}$/.test(u) && !/^\.|\.$|\.\./.test(u);
function errText(e) {
  const m = String(e?.message || e || '');
  if (/profiles_username_key/.test(m)) return 'এই ইউজারনেম আগে থেকেই কেউ নিয়েছে, অন্য একটা দিন';
  if (/Invalid login/i.test(m)) return 'ইমেইল বা পাসওয়ার্ড ভুল';
  if (/already registered|already been registered/i.test(m)) return 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট আছে। লগইন করুন।';
  if (/Password should be/i.test(m)) return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন';
  if (/Email not confirmed/i.test(m)) return 'আগে ইমেইলে পাঠানো লিংকে ক্লিক করে অ্যাকাউন্ট নিশ্চিত করুন';
  if (/rate limit/i.test(m)) return 'অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পরে আবার চেষ্টা করুন';
  if (/row-level security|blocked/i.test(m)) return 'এই কাজটি করা যাচ্ছে না';
  if (/duplicate key|already/i.test(m)) return 'আগেই করা হয়েছে';
  if (/Payload too large|exceeded the maximum/i.test(m)) return 'ছবিটি অনেক বড়';
  if (/Failed to fetch|NetworkError|network/i.test(m)) return 'ইন্টারনেট সংযোগ পরীক্ষা করুন';
  console.error(e);
  return 'সমস্যা হয়েছে, আবার চেষ্টা করুন';
}
// ছবি ছোট করে WebP বানানো (JPEG-এর চেয়ে ~৩০% ছোট: আপলোড দ্রুত, ডেটা ও ফোনের জায়গা কম লাগে)
// পুরোনো ফোনে WebP না হলে JPEG
async function compress(file, max = 1280, q = 0.75) {
  if (!/^image\//.test(file.type)) throw new Error('not image');
  let src;
  try { src = await createImageBitmap(file); } catch {
    src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  }
  const r = Math.min(1, max / Math.max(src.width, src.height));
  const c = document.createElement('canvas'); c.width = Math.round(src.width * r); c.height = Math.round(src.height * r);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  const blob = await new Promise(res => c.toBlob(res, 'image/webp', q));
  if (blob && blob.type === 'image/webp') return blob;
  return new Promise(res => c.toBlob(res, 'image/jpeg', q + 0.05));
}

const SVC_ICONS = { health: '<path d="M12 5v14M5 12h14" stroke-width="3"/>', gov: '<path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18"/>', edu: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>', police: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>', doc: '<circle cx="12" cy="7" r="4"/><path d="M5 21c1-4 4-6 7-6s6 2 7 6"/>', fix: '<path d="M14 6a4 4 0 0 0 5 5L10 20l-3-3 9-9z"/>', bus: '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M7 20v-3M17 20v-3"/>', bank: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="2.5"/>', shop: '<path d="M4 9h16l-1 11H5z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>' };
const catName = k => (SERVICE_CATS.find(c => c[0] === k) || ['', ''])[1];

const S = {
  api: null, unions: [], union: local.get('union', ''), scope: 'area', fcat: '', dcat: '',
  feeds: { home: { posts: [], more: false }, me: { posts: [], more: false }, user: { posts: [], more: false }, post: { posts: [], more: false }, search: { posts: [], more: false }, saved: { posts: [], more: false }, page: { posts: [], more: false }, group: { posts: [], more: false } },
  seenBoosts: new Set(), curPage: null, open: new Map(), view: 'home', tab: 'home', stack: [], bgroup: '', bscope: 'home', bready: false, settings: { ...Object.fromEntries(Object.entries(SETTING_KEYS).map(([k, [, d]]) => [k, d])), ...local.get('settings', {}) }, userId: null, threadId: null, postId: null, pageId: null, groupId: null, photo: null, stopMsg: null, stopNotif: null,
};
const me = () => S.api?.me();

// ================================================================ UI টুকরো
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600); }
function openSheet(html) { const s = $('#sheet'); s.onclick = null; s.onchange = null; s.classList.remove('tall'); s.innerHTML = html; $('#modal').classList.add('on'); s.querySelector('input,textarea,select,button')?.focus(); }
function closeSheet() { $('#modal').classList.remove('on'); $('#sheet').classList.remove('tall'); $('#sheet').innerHTML = ''; }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeSheet(); });
function confirmSheet(text, okLabel, danger) {
  return new Promise(res => {
    openSheet(`<h2>${esc(text)}</h2><div class="row" style="margin-top:16px"><button class="btn ${danger ? 'red' : ''}" id="cok" style="flex:1">${esc(okLabel)}</button><button class="btn ghost" data-close>বাতিল</button></div>`);
    $('#cok').onclick = () => { closeSheet(); res(true); };
    const obs = new MutationObserver(() => { if (!$('#modal').classList.contains('on')) { obs.disconnect(); res(false); } });
    obs.observe($('#modal'), { attributes: true });
  });
}
async function busy(btn, fn) {
  const old = btn?.textContent; if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try { return await fn(); } catch (e) { toast(errText(e)); } finally { if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = old; } }
}
function needUser() { if (me()) return true; toast('আগে লগইন বা নতুন অ্যাকাউন্ট খুলুন'); go('me'); return false; }
function av(u, cls = '') {
  const name = u?.name || u?.author || '?', src = u?.avatar;
  return src ? `<img class="av ${cls}" src="${esc(src)}" alt="" loading="lazy" decoding="async">` : `<div class="av ${cls}" aria-hidden="true">${esc(name.charAt(0))}</div>`;
}
const userLink = (id, inner, cls = 'avbtn') => `<button class="${cls}" data-user="${esc(id)}">${inner}</button>`;
// নীল ভেরিফাইড ব্যাজ (পাবলিক ফিগার ও কেনা ব্যাজ দুটোই নীল; প্রোফাইলে চাপলে কোনটা তা লেখা থাকে)
const VB_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1d9bf0" d="M12 1.8l2.4 1.9 3-.3 1 2.9 2.6 1.6-.6 3 1.4 2.7-2.2 2.1-.2 3-3 .6-1.8 2.5-2.8-1.1-2.8 1.1-1.8-2.5-3-.6-.2-3-2.2-2.1L2.3 11l-.6-3 2.6-1.6 1-2.9 3 .3z"/><path d="M7.8 12.3l2.8 2.8 5.6-5.8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const vb = (b, big) => (b ? `<span class="vbadge${big ? ' vb-lg' : ''}" ${big ? `role="button" tabindex="0" data-vbinfo="${b}"` : ''} title="ভেরিফাইড" aria-label="ভেরিফাইড">${VB_SVG}</span>` : '');
const entAv = (e, icon) => e?.avatar ? `<img loading="lazy" decoding="async" class="ent-av" src="${esc(e.avatar)}" alt="">` : `<div class="ent-av" aria-hidden="true">${icon || esc((e?.name || '?').charAt(0))}</div>`;
const PAGE_CATS = ['দোকান ও ব্যবসা', 'স্বাস্থ্য', 'শিক্ষা', 'সংগঠন ও ক্লাব', 'সরকারি প্রতিষ্ঠান', 'খাবার ও রেস্টুরেন্ট', 'চাকরি ও প্রশিক্ষণ', 'খবর ও মিডিয়া', 'কৃষি', 'ধর্মীয় প্রতিষ্ঠান', 'অন্যান্য'];

// ================================================================ বড় লেখা ছোট করে "আরও দেখুন"
S.expanded = new Set();
function clampText(text, maxChars, maxLines) {
  const lines = text.split('\n');
  let cut = text.length > maxChars ? maxChars : -1;
  if (lines.length > maxLines) { const byLines = lines.slice(0, maxLines).join('\n').length; cut = cut < 0 ? byLines : Math.min(cut, byLines); }
  if (cut < 0) return null;
  const nl = text.lastIndexOf('\n', cut);            // নতুন অনুচ্ছেদের মাত্র দু-একটা শব্দ থাকলে আগের অনুচ্ছেদেই থামি
  if (nl > cut * 0.5 && cut - nl < 40) cut = nl;
  else { const sp = text.lastIndexOf(' ', cut); if (sp > cut * 0.7) cut = sp; }   // শব্দের মাঝখানে না কেটে
  return text.slice(0, cut).replace(/[\s,]+$/, '');
}
function moreText(text, key, opts = {}) {
  const short = S.expanded.has(key) || opts.full ? null : clampText(text, opts.chars || 280, opts.lines || 5);
  const out = t => hashtagize(mentionize(esc(t), opts.mentions));
  return short === null ? out(text) : `${out(short)}… <button class="see-more" data-more="${esc(key)}">আরও দেখুন</button>`;
}
// #হ্যাশট্যাগ চাপলে সেই ট্যাগের সব পোস্ট
const TAG_RE = /(^|[\s(])#([^\s#.,!?।:;()\[\]{}"'<>/\\&]{2,40})/g;
const hashtagize = html => html.replace(TAG_RE, (_, pre, t) => `${pre}<button class="htag" data-htag="${t}">#${t}</button>`);
function openTag(tag) { open('search'); $('#sq').value = '#' + tag; runSearch(); }
document.addEventListener('click', e => { const b = e.target.closest('[data-htag]'); if (!b) return; e.stopPropagation(); openTag(b.dataset.htag); }, true);
// লেখার ভেতরের "@নাম" কে প্রোফাইলের লিংক বানানো (শুধু যাঁদের আসলেই মেনশন করা হয়েছে)
function mentionize(html, mentions) {
  if (!mentions?.length) return html;
  const list = [...mentions].sort((a, b) => b.name.length - a.name.length);
  const marks = [];
  for (const m of list) {
    const needle = '@' + esc(m.name);
    html = html.split(needle).join(`\u0000${marks.push(`<button class="mention" data-user="${esc(m.id)}">${needle}</button>`) - 1}\u0000`);
  }
  return html.replace(/\u0000(\d+)\u0000/g, (_, i) => marks[i]);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-more]'); if (!b) return;
  e.stopPropagation(); S.expanded.add(b.dataset.more);
  const host = b.parentElement; const key = b.dataset.more;
  if (key.startsWith('p')) { const f = feedOf(b); if (f) renderFeed(f); }
  else if (key.startsWith('c')) { const c = cmScope(b).list.find(x => 'c' + x.id === key); if (c) host.innerHTML = esc(c.body); }
  else if (key.startsWith('s')) host.textContent = host.dataset.full || host.textContent;
}, true);

// ================================================================ ট্যাগ লাইন ও ছবির ক্যারোসেল
function tagsLine(p) {
  const t = p.tags || []; if (!t.length) return '';
  const nm = x => userLink(x.id, esc(x.name), 'tag-name');
  return ` <span class="with">— ${t.length === 1 ? `${nm(t[0])}-এর সাথে` : t.length === 2 ? `${nm(t[0])} ও ${nm(t[1])}-এর সাথে` : `${nm(t[0])} ও <button class="tag-name" data-tags="${esc(p.id)}">আরও ${bn(t.length - 1)} জনের</button> সাথে`}</span>`;
}
function photosHtml(p) {
  const im = p.images || (p.image ? [p.image] : []); if (!im.length) return '';
  if (im.length === 1) return `<button class="ph-one" data-view="${esc(p.id)}" data-i="0" aria-label="ছবি বড় করে দেখুন"><img class="post-img" src="${esc(im[0])}" alt="পোস্টের ছবি" loading="lazy" decoding="async"></button>`;
  return `<div class="car" data-car="${esc(p.id)}">
    <div class="car-track">${im.map((src, i) => `<button class="car-item" data-view="${esc(p.id)}" data-i="${i}" aria-label="ছবি ${bn(i + 1)}, বড় করে দেখুন"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>
    <span class="car-count">১/${bn(im.length)}</span>
    <button class="car-nav prev" data-carnav="-1" aria-label="আগের ছবি" hidden>${ic('chevL', 20)}</button><button class="car-nav next" data-carnav="1" aria-label="পরের ছবি">${ic('chevR', 20)}</button>
    <div class="car-dots">${im.map((_, i) => `<span class="${i ? '' : 'on'}"></span>`).join('')}</div></div>`;
}
// ক্যারোসেল: সোয়াইপ করলে নম্বর ও ডট বদলায়
function carSync(track) {
  const car = track.closest('.car'), n = track.children.length, i = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
  car.querySelector('.car-count').textContent = `${bn(Math.min(i + 1, n))}/${bn(n)}`;
  car.querySelectorAll('.car-dots span').forEach((d, k) => d.classList.toggle('on', k === i));
  car.querySelector('.prev').hidden = i <= 0; car.querySelector('.next').hidden = i >= n - 1;
}
document.addEventListener('scroll', e => { if (e.target.classList?.contains('car-track')) carSync(e.target); }, true);

// অপেক্ষা করলে ছবি নিজে থেকে বদলায় (স্ক্রিনে দেখা গেলে; ছুঁলে/মাউস রাখলে থামে)
const AUTO_MS = 3500, PAUSE_MS = 6000;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const carSeen = new IntersectionObserver(entries => entries.forEach(en => { en.target._visible = en.intersectionRatio >= 0.6; }), { threshold: [0, 0.6, 1] });
function watchCarousels(root) { root.querySelectorAll('.car').forEach(c => { if (!c._watched) { c._watched = true; c._pauseUntil = 0; carSeen.observe(c); } }); }
setInterval(() => {
  if (reduceMotion.matches || document.hidden || S.viewerOpen || $('#modal').classList.contains('on')) return;
  const now = Date.now();
  document.querySelectorAll('.car').forEach(c => {
    if (!c._visible || now < c._pauseUntil || !c.isConnected) return;
    const t = c.querySelector('.car-track'), n = t.children.length, i = Math.round(t.scrollLeft / Math.max(t.clientWidth, 1));
    t.scrollTo({ left: i >= n - 1 ? 0 : (i + 1) * t.clientWidth, behavior: 'smooth' });
  });
}, AUTO_MS);
['pointerdown', 'touchstart', 'wheel', 'mouseover', 'focusin'].forEach(ev => document.addEventListener(ev, e => {
  const c = e.target.closest?.('.car'); if (c) c._pauseUntil = Date.now() + PAUSE_MS;
}, { passive: true, capture: true }));
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-carnav]'); if (nav) { const tr = nav.closest('.car').querySelector('.car-track'); tr.scrollBy({ left: tr.clientWidth * Number(nav.dataset.carnav), behavior: 'smooth' }); return; }
  const v = e.target.closest('[data-view]'); if (v) { const key = feedOf(v), p = key && findPost(key, v.dataset.view); if (p) openViewer(p, Number(v.dataset.i)); return; }
  const tg = e.target.closest('[data-tags]'); if (tg) { const key = feedOf(tg), p = findPost(key, tg.dataset.tags); openSheet(`<h2>যাঁদের সাথে</h2>${p.tags.map(t => `<div class="person">${userLink(t.id, `<div class="av">${esc(t.name.charAt(0))}</div>`)}<div class="info">${userLink(t.id, esc(t.name), 'who-btn')}</div></div>`).join('')}<button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`); $('#sheet').onclick = ev => { if (ev.target.closest('[data-user]')) closeSheet(); }; }
});

// ================================================================ পুরো স্ক্রিনে ছবি দেখা ও সেভ
S.viewer = null;
function openViewer(p, start = 0) {
  const im = p.images || [p.image]; S.viewer = { p, im, i: start };
  let vp = $('#v-gopost'); if (!vp) { $('#v-save').insertAdjacentHTML('beforebegin', '<button id="v-gopost" class="v-post">পোস্ট দেখুন</button>'); vp = $('#v-gopost'); vp.onclick = () => { const id = S.viewer?.p.postIds?.[S.viewer.i]; if (id) { back(); setTimeout(() => openPost(id), 60); } }; }
  vp.hidden = !p.postIds;
  $('#v-track').innerHTML = im.map((src, i) => `<div class="v-item"><img loading="lazy" decoding="async" src="${esc(src)}" alt="ছবি ${bn(i + 1)}"></div>`).join('');
  $('#v-save').innerHTML = ic('download', 22); $('#viewer').hidden = false; document.body.style.overflow = 'hidden';
  $('#v-prev').hidden = $('#v-next').hidden = im.length < 2;
  requestAnimationFrame(() => { $('#v-track').scrollLeft = start * $('#v-track').clientWidth; vSync(); });
  pushNav(); S.viewerOpen = true; $('#v-close').focus();
}
function vSync() {
  const t = $('#v-track'), v = S.viewer; if (!v) return;
  v.i = Math.round(t.scrollLeft / Math.max(t.clientWidth, 1));
  $('#v-count').textContent = v.im.length > 1 ? `${bn(v.i + 1)}/${bn(v.im.length)}` : '';
  $('#v-prev').disabled = v.i <= 0; $('#v-next').disabled = v.i >= v.im.length - 1;
}
function closeViewer() { $('#viewer').hidden = true; document.body.style.overflow = ''; S.viewer = null; S.viewerOpen = false; }
$('#v-track').addEventListener('scroll', vSync, { passive: true });
$('#v-close').addEventListener('click', () => back());
$('#v-prev').addEventListener('click', () => $('#v-track').scrollBy({ left: -$('#v-track').clientWidth, behavior: 'smooth' }));
$('#v-next').addEventListener('click', () => $('#v-track').scrollBy({ left: $('#v-track').clientWidth, behavior: 'smooth' }));
document.addEventListener('keydown', e => {
  if (!S.viewerOpen) return;
  if (e.key === 'ArrowLeft') $('#v-prev').click(); if (e.key === 'ArrowRight') $('#v-next').click(); if (e.key === 'Escape') back();
});
// ছবি ফোনে/কম্পিউটারে সেভ
$('#v-save').addEventListener('click', async () => {
  const v = S.viewer; if (!v) return;
  const src = v.im[v.i], name = `amar-upazila-${v.p.id}-${v.i + 1}.jpg`;
  try {
    const blob = await (await fetch(src)).blob();
    const file = new File([blob], name, { type: blob.type || 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) { await navigator.share({ files: [file], title: name }); return; }
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('ছবি সেভ হচ্ছে… ডাউনলোড ফোল্ডারে দেখুন');
  } catch (err) { if (err?.name !== 'AbortError') { window.open(src, '_blank'); toast('ছবিটি নতুন ট্যাবে খোলা হয়েছে, সেখান থেকে সেভ করুন'); } }
});

// ================================================================ পোস্ট (হোম, আমার, অন্যের প্রোফাইল — সব জায়গায় একই)
// প্রোফাইল/কভার ছবি বদল বা অ্যালবামে ছবি যোগের লাইন (ফেসবুকের মতো)
function actLine(p) {
  if (p.kind === 'avatar') return ' <span class="act-line">প্রোফাইল ছবি পরিবর্তন করেছেন</span>';
  if (p.kind === 'cover') return ' <span class="act-line">কভার ছবি পরিবর্তন করেছেন</span>';
  if (p.albumId && p.albumName) return ` <span class="act-line"><button class="link-b" data-openalbum="${esc(p.userId)}|${esc(p.albumId)}">${esc(p.albumName)}</button> অ্যালবামে ছবি যোগ করেছেন</span>`;
  return '';
}
function postHtml(p) {
  const u = me();
  const link = (inner, cls) => p.pageId ? `<button class="${cls}" data-page="${esc(p.pageId)}">${inner}</button>` : userLink(p.userId, inner, cls);
  const via = p.groupId && S.view !== 'group' ? ` <span class="via">▸ <button data-group="${esc(p.groupId)}">${esc(p.groupName)}</button></span>` : '';
  const own = u && p.userId === u.id;
  const urgent = p.category === 'সাহায্য চাই' && !p.resolvedAt && !p.groupId && Date.now() - new Date(p.createdAt) < 864e5;
  const showBg = p.bg && p.body && !p.images.length && !p.shared && !p.poll && p.body.length <= BG_MAX;
  return `<article class="card post${p.sponsored ? ' sponsored' : ''}${p.pinnedPage ? ' pinned-pg' : ''}${urgent ? ' urgent' : ''}${p.urgentTop ? ' urg-top' : ''}" data-pid="${esc(p.id)}"${own ? ' data-own="1"' : ''}${p.shared && p.shared.userId !== u?.id ? ` data-spid="${esc(p.shared.id)}"` : ''}>
    ${p.pinnedPage ? '<div class="pin-lbl">📌 পিন করা পোস্ট</div>' : ''}<div class="top">${!p.pageId && storyUserSet().has(p.userId) ? `<button class="avbtn av-story" data-avstory="${esc(p.userId)}" aria-label="${esc(p.author)}: স্টোরি বা প্রোফাইল">${av(p)}</button>` : link(av(p), 'avbtn')}
      <div>${link(esc(p.author) + vb(p.badge), 'who-btn')}${folBtn(p)}${actLine(p)}${tagsLine(p)}${via}<div class="mut">${p.sponsored ? `<span class="spons">স্পন্সরড</span> · ` : ''}${p.pageId ? 'পেইজ' : esc(p.union)} · ${esc(ago(p.createdAt))}${p.editedAt ? ` · <span class="edited" title="সম্পাদিত ${esc(ago(p.editedAt))}">সম্পাদিত</span>` : ''} · <span class="pv-mini" title="${PRIVACY[p.privacy || 'public'][1]}" aria-label="${PRIVACY[p.privacy || 'public'][1]}">${ic(PRIVACY[p.privacy || 'public'][0], 13)}</span></div></div>
      ${own ? `<button class="pinfo" data-pinfo="${esc(p.id)}" aria-label="পোস্টটি কতজন দেখেছেন" title="পোস্টের হিসাব">${ic('info', 19)}</button>` : ''}<button class="more" data-menu="${esc(p.id)}" aria-label="আরও অপশন">⋯</button></div>
    <span class="tag${p.category === 'সাহায্য চাই' ? ' help' : ''}" style="margin-top:8px">${esc(p.category)}</span>${urgent ? '<span class="urg-lbl">🚨 জরুরি</span>' : ''}${p.bloodGroup ? `<span class="blood-lbl">🩸 ${esc(p.bloodGroup)} রক্ত দরকার</span>` : ''}${p.resolvedAt && RESOLVE[p.category] ? `<span class="resolved">${RESOLVE[p.category][0]}</span>` : ''}
    ${showBg ? `<div class="pbg ${esc(p.bg)}">${esc(p.body)}</div>` : p.body ? `<p>${moreText(p.body, 'p' + p.id, { full: S.view === 'post' && S.feeds.post.posts[0]?.id === p.id, mentions: p.mentions })}</p>` : '<div style="height:8px"></div>'}
    ${photosHtml(p)}
    ${p.poll ? pollHtml(p) : ''}${p.eventAt ? eventHtml(p) : ''}${p.link && !p.images.length && !p.shared ? linkCardHtml(p.link) : ''}
    ${p.shared ? `<button class="shared-embed" data-openpost="${esc(p.shared.id)}"><span class="se-top">${av(p.shared, 'sm')}<span><b>${esc(p.shared.author)}${vb(p.shared.badge)}</b><span class="mut"> · ${esc(ago(p.shared.createdAt))}</span></span></span>${p.shared.body ? `<span class="se-body">${esc(p.shared.body)}</span>` : ''}${p.shared.image ? `<img src="${esc(p.shared.image)}" alt="" loading="lazy" decoding="async">` : ''}</button>`
      : p.sharedMissing ? '<div class="shared-embed missing">এই পোস্টটি আর দেখা যাচ্ছে না</div>' : ''}
    ${p.likes ? `<div class="rsum"><button class="rsum-l" data-rxlist="${esc(p.id)}" aria-label="কে কে রিয়্যাক্ট দিয়েছেন"><span class="rsum-e">${Object.entries(p.reactions || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => `<span class="rs-i">${rxIcon(k, 18)}</span>`).join('')}</span><span class="rsum-who">কে কে রিয়্যাক্ট দিয়েছেন</span></button></div>` : ''}
    <div class="acts icons">
      <button data-like="${esc(p.id)}" class="${p.myReaction ? 'reacted rx-' + p.myReaction : ''}" aria-pressed="${!!p.myReaction}" aria-label="${p.myReaction ? `${rxName(p.myReaction)} দিয়েছেন, চাপলে তুলে নেবেন; চেপে ধরলে অন্য রিয়্যাক্ট` : 'লাইক; চেপে ধরলে অন্য রিয়্যাক্ট'}" title="রিয়্যাক্ট">${p.myReaction ? rxIcon(p.myReaction, 24) : ic('thumb', 22)}${p.likes ? `<span class="cnt">${bn(p.likes)}</span>` : ''}</button>
      <button data-cm="${esc(p.id)}" aria-label="মন্তব্য ${bn(p.comments || 0)}টি" title="মন্তব্য">${ic('comment', 22)}${p.comments ? `<span class="cnt">${bn(p.comments)}</span>` : ''}</button>
      <button data-share="${esc(p.id)}" aria-label="শেয়ার, ${bn(p.shares || 0)} বার" title="শেয়ার">${ic('share', 22)}${p.shares ? `<span class="cnt">${bn(p.shares)}</span>` : ''}</button>
      <button data-save="${esc(p.id)}" class="${p.saved ? 'saved' : ''}" aria-pressed="${!!p.saved}" aria-label="${p.saved ? 'সেভ থেকে সরান' : 'সেভ করুন'}" title="সেভ">${ic('bookmark', 22, p.saved ? 'currentColor' : 'none')}${p.saves ? `<span class="cnt">${bn(p.saves)}</span>` : ''}</button>
      ${own ? `<button data-pinfo="${esc(p.id)}" class="views-btn" aria-label="মোট ভিউ ${bn(p.views || 0)}, চাপলে বিস্তারিত" title="মোট ভিউ">${ic('eye', 22)}<span class="cnt">${bn(p.views || 0)}</span></button>` : ''}
    </div>
    ${S.view !== 'post' && S.cmIn.has(String(p.id)) ? inlineCmHtml(p) : ''}
  </article>`;
}
// পোস্টের লেখা বা ফাঁকা জায়গায় চাপলে শুধু ঐ পোস্ট আর তার সব মন্তব্য (বাছাই সহ) আলাদা পাতায়
document.addEventListener('click', e => {
  if (S.view === 'post' || e.defaultPrevented) return;
  const art = e.target.closest('article.post[data-pid]'); if (!art || !art.closest('[data-feed]')) return;
  if (e.target.closest('button, a, input, textarea, select, label, form, .cmi, .rpick, [data-more]')) return;
  if (String(getSelection?.() || '').trim()) return;   // লেখা সিলেক্ট করলে নয়
  openPost(art.dataset.pid);
});
// ================================================================ ফিডেই পোস্টের নিচে মন্তব্য (ফেসবুকের মতো)
// মন্তব্য বাটনে চাপলে পোস্টের নিচেই কয়েকটি মন্তব্য আর লেখার বক্স খোলে; সব দেখতে আলাদা পাতায়
S.cmIn = new Map();   // postId → { list, draft, added, ments, open, replyTo, limit }
const CMI_SHOW = 3;
const kidsOf = list => { const m = new Map(); (list || []).filter(c => c.parentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach(c => { if (!m.has(c.parentId)) m.set(c.parentId, []); m.get(c.parentId).push(c); }); return m; };
// কোন জায়গার মন্তব্য: ফিডে পোস্টের নিচে, নাকি আলাদা মন্তব্যের পাতা
function cmScope(el) {
  const box = el?.closest?.('.cmi');
  if (box) {
    const id = box.dataset.cmi, key = feedOf(box), st = S.cmIn.get(id);
    return { inline: true, id, key, st, root: box, post: findPost(key, id), list: st?.list || [], kids: st?.kids || new Map(), open: st?.open || new Set(),
      redraw: () => { renderFeed(key); }, refresh: () => loadCmi(key, id) };
  }
  return { inline: false, root: $('#cm-list'), post: S.feeds.post.posts[0], list: S.comments || [], kids: S.cmKids || new Map(), open: S.cmOpen || new Set(), redraw: loadComments, refresh: loadComments };
}
function inlineCmHtml(p) {
  const st = S.cmIn.get(String(p.id)), u = me();
  let shown = [], tops = [];
  if (st.list) {
    st.kids = kidsOf(st.list);
    tops = st.list.filter(c => !c.parentId);
    const pinned = tops.find(c => c.id === p.pinnedCommentId);
    const mine = tops.filter(c => st.added.has(c.id) && c !== pinned);
    const best = tops.filter(c => c !== pinned && !st.added.has(c.id)).sort((a, b) => (b.likes || 0) - (a.likes || 0) || b.createdAt.localeCompare(a.createdAt));
    shown = [...(pinned ? [pinned] : []), ...best].slice(0, Math.max(st.limit - mine.length, 1)).concat(mine);
  }
  const left = tops.length - shown.length, sc = { kids: st.kids, open: st.open };
  return `<div class="cmi" data-cmi="${esc(p.id)}">
    ${!st.list ? '<div class="cmi-load mut">মন্তব্য লোড হচ্ছে…</div>' : shown.map(c => commentHtml(c, p, c.id === p.pinnedCommentId) + repliesHtml(c, p, sc)).join('')}
    ${left > 0 ? `<button class="cmi-all" data-cmimore="${esc(p.id)}">আরও ${bn(left)}টি মন্তব্য দেখুন</button>` : ''}
    ${st.replyTo ? `<div class="cmi-rep">${ic('reply', 14)} <span><b>${esc(st.replyTo.name)}</b>-কে উত্তর দিচ্ছেন</span><button type="button" data-cmirx="${esc(p.id)}" aria-label="উত্তর বাতিল">✕</button></div>` : ''}
    <form class="cmi-form" data-cmiform="${esc(p.id)}">${S.actAs ? entAv(S.actAs) : u ? av(u, 'sm') : ''}<input class="cmi-input" placeholder="${!u ? 'মন্তব্য করতে লগইন করুন' : st.replyTo ? `${esc(st.replyTo.name)}-কে উত্তর দিন…` : 'মন্তব্য লিখুন…'}" maxlength="300" autocomplete="off" aria-label="মন্তব্য লিখুন" value="${esc(st.draft || '')}"><button class="cmi-send" aria-label="মন্তব্য পাঠান">${ic('send', 20)}</button></form>
  </div>`;
}
function focusCmi(id) {
  const i = document.querySelector(`.cmi[data-cmi="${id}"] .cmi-input`); if (!i) return;
  i.focus({ preventScroll: true }); i.setSelectionRange(i.value.length, i.value.length);
  i.closest('.cmi').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
async function loadCmi(key, id) {
  const st = S.cmIn.get(String(id)); if (!st) return;
  try { st.list = await S.api.comments(Number(id) || id, 'top'); } catch { st.list = []; }
  const had = document.activeElement?.closest?.(`.cmi[data-cmi="${id}"]`);
  renderFeed(key); if (had) focusCmi(id);
}
async function toggleCmi(key, id) {
  id = String(id);
  if (S.cmIn.has(id)) { const i = document.querySelector(`.cmi[data-cmi="${id}"] .cmi-input`); if (i && document.activeElement !== i) return focusCmi(id); if (!S.cmIn.get(id).draft) { S.cmIn.delete(id); renderFeed(key); } return; }
  S.cmIn.set(id, { list: null, draft: '', added: new Set(), ments: new Map(), open: new Set(), replyTo: null, limit: CMI_SHOW });
  renderFeed(key); focusCmi(id);
  loadCmi(key, id);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cmimore],[data-cmirx]'); if (!b) return;
  const id = b.dataset.cmimore || b.dataset.cmirx, st = S.cmIn.get(id), key = feedOf(b); if (!st || !key) return;
  if (b.dataset.cmimore) st.limit += 10; else { st.replyTo = null; if (/^@\S/.test(st.draft) && st.ments.size) st.draft = ''; }
  renderFeed(key); if (b.dataset.cmirx) focusCmi(id);
});
document.addEventListener('input', e => { const i = e.target.closest?.('.cmi-input'); if (i) { const st = S.cmIn.get(i.closest('.cmi').dataset.cmi); if (st) st.draft = i.value; } });
document.addEventListener('focusin', e => { const i = e.target.closest?.('.cmi-input'); if (!i) return; if (!me()) { i.blur(); return needUser(); } if (!i._m) { i._m = true; attachMention(i, S.cmIn.get(i.closest('.cmi').dataset.cmi).ments); } });
document.addEventListener('submit', e => {
  const f = e.target.closest?.('[data-cmiform]'); if (!f) return;
  e.preventDefault(); if (!needUser()) return;
  const id = f.dataset.cmiform, key = feedOf(f), st = S.cmIn.get(id), post = key && findPost(key, id), i = f.querySelector('input'), body = i.value.trim();
  if (!body || !post || !st) return;
  busy(f.querySelector('button'), async () => {
    const ments = mentionIds(body, st.ments), rt = st.replyTo;
    await S.api.addComment(post.id, body, rt?.id || null, ments, S.actAs?.id || null);
    st.draft = ''; st.ments.clear(); st.replyTo = null; post.comments = (post.comments || 0) + 1;
    const list = await S.api.comments(post.id, 'new').catch(() => null);
    if (list) { if (rt) st.open.add(rt.id); else { const mine = list.find(c => !c.parentId && c.body === body && !st.added.has(c.id)); if (mine) st.added.add(mine.id); } st.list = list; }
    renderFeed(key); focusCmi(id);
  });
});
// ফলো করছেন না এমন কারো (বা পেইজের) পোস্টে নামের পাশে "ফলো করুন"
S.fol = null;
function folBtn(p) {
  const u = me(); if (!u || !S.fol || S.actAs || p.userId === u.id) return '';
  if (p.pageId ? S.fol.pages.has(p.pageId) : S.fol.users.has(p.userId)) return '';
  return ` <span class="fol-dot">·</span> <button class="fol-btn" data-folpost="${p.pageId ? 'p:' + esc(p.pageId) : 'u:' + esc(p.userId)}">ফলো করুন</button>`;
}
const rerenderFeeds = () => { for (const key of ['home', 'group', 'post', 'search', 'saved']) if (S.feeds[key]?.posts.length && $('#feed-' + key)) renderFeed(key); };
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-folpost]'); if (!b) return;
  e.stopPropagation(); if (!needUser() || !S.fol) return;
  const [k, id0] = b.dataset.folpost.split(':'), id = k === 'p' ? Number(id0) || id0 : id0, set = k === 'p' ? S.fol.pages : S.fol.users;
  set.add(id); rerenderFeeds();
  try { await (k === 'p' ? S.api.followPage(id) : S.api.follow(id)); toast('ফলো করছেন। এখন থেকে এর পোস্ট আপনার ফিডে আসবে।'); }
  catch (err) { set.delete(id); rerenderFeeds(); toast(errText(err)); }
}, true);
// স্টোরি আছে এমন কারো পোস্টে ছবির চারপাশে রঙিন বৃত্ত; চাপলে "স্টোরি দেখুন / প্রোফাইল দেখুন"
const storyUserSet = () => new Set((S.stories || []).map(x => x.userId));
document.addEventListener('click', e => {
  const b = e.target.closest('[data-avstory]'); if (!b) return;
  e.stopPropagation();
  const uid = b.dataset.avstory, name = b.getAttribute('aria-label')?.split(':')[0] || '';
  openSheet(`<div class="menu"><div class="menu-h">${esc(name)}</div>
    <button data-act="story">${ic('play', 18)} স্টোরি দেখুন</button>
    <button data-act="profile">${ic('user', 18)} প্রোফাইল দেখুন</button>
    <button data-close>বন্ধ করুন</button></div>`);
  $('#sheet').onclick = ev => {
    const a = ev.target.closest('[data-act]')?.dataset.act; if (!a) return;
    closeSheet();
    if (a === 'profile') return openUser(uid);
    const gi = storyGroups().findIndex(g => g.userId === uid); if (gi >= 0) openStories(gi); else toast('স্টোরিটি আর নেই');
  };
}, true);
// ================================================================ হোমের উপরের অংশ: নামাজ-আবহাওয়া, জন্মদিন, আলোচিত, পরিচিত হতে পারেন
const HOME_LOC = { lat: 24.3814, lng: 90.3816, name: 'ভালুকা', of: 'ভালুকার' };   // ভালুকা উপজেলা সদর
// নামাজের সময় অ্যাপের ভেতরেই হিসাব (ইন্টারনেট লাগে না): ফজর/এশা ১৮°, আসর হানাফি — বাংলাদেশে প্রচলিত পদ্ধতি
function prayerTimes(date, lat, lng, tz = 6) {
  const r = Math.PI / 180, sin = d => Math.sin(d * r), cos = d => Math.cos(d * r), tan = d => Math.tan(d * r);
  const asin = x => Math.asin(x) / r, acos = x => Math.acos(Math.max(-1, Math.min(1, x))) / r, atan2 = (y, x) => Math.atan2(y, x) / r, acot = x => Math.atan(1 / x) / r;
  const fix = (a, b) => { a -= b * Math.floor(a / b); return a < 0 ? a + b : a; };
  let y = date.getUTCFullYear(), m = date.getUTCMonth() + 1; const d = date.getUTCDate();
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), jd0 = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + (2 - A + Math.floor(A / 4)) - 1524.5;
  const jd = jd0 - lng / (15 * 24);
  const sun = t => { const D = jd + t - 2451545, g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360), L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D;
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24) }; };
  const mid = t => fix(12 - sun(t).eqt, 24);
  const at = (ang, t, ccw) => { const { decl } = sun(t), T = acos((-sin(ang) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15; return mid(t) + (ccw ? -T : T); };
  const asr = t => { const { decl } = sun(t); return at(-acot(2 + tan(Math.abs(lat - decl))), t); };
  let t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 };
  for (let i = 0; i < 2; i++) { const p = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / 24]));
    t = { fajr: at(18, p.fajr, true), sunrise: at(0.833, p.sunrise, true), dhuhr: mid(p.dhuhr), asr: asr(p.asr), maghrib: at(0.833, p.maghrib), isha: at(18, p.isha) }; }
  const extra = { dhuhr: 2, maghrib: 2 };   // সতর্কতামূলক কয়েক মিনিট
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v + tz - lng / 15 + (extra[k] || 0) / 60]));
}
const PRAYERS = [['fajr', 'ফজর'], ['sunrise', 'সূর্যোদয়'], ['dhuhr', 'যোহর'], ['asr', 'আসর'], ['maghrib', 'মাগরিব'], ['isha', 'এশা']];
const hm = h => { let mm = Math.round(h * 60); const H = Math.floor(mm / 60) % 24; mm %= 60; const per = H < 4 ? 'রাত' : H < 6 ? 'ভোর' : H < 12 ? 'সকাল' : H < 15 ? 'দুপুর' : H < 18 ? 'বিকাল' : H < 20 ? 'সন্ধ্যা' : 'রাত'; return `${per} ${bn(H % 12 || 12)}:${bn(String(mm).padStart(2, '0'))}`; };
const WX = { 0: ['☀️', 'রোদ'], 1: ['🌤️', 'হালকা মেঘ'], 2: ['⛅', 'আংশিক মেঘলা'], 3: ['☁️', 'মেঘলা'], 45: ['🌫️', 'কুয়াশা'], 48: ['🌫️', 'ঘন কুয়াশা'], 51: ['🌦️', 'গুঁড়ি গুঁড়ি বৃষ্টি'], 53: ['🌦️', 'গুঁড়ি গুঁড়ি বৃষ্টি'], 55: ['🌧️', 'বৃষ্টি'], 61: ['🌧️', 'হালকা বৃষ্টি'], 63: ['🌧️', 'বৃষ্টি'], 65: ['🌧️', 'ভারী বৃষ্টি'], 80: ['🌦️', 'বৃষ্টির ঝাপটা'], 81: ['🌧️', 'বৃষ্টি'], 82: ['⛈️', 'ভারী বৃষ্টি'], 95: ['⛈️', 'বজ্রবৃষ্টি'], 96: ['⛈️', 'বজ্রবৃষ্টি'], 99: ['⛈️', 'বজ্রবৃষ্টি'] };
// ব্যবহারকারীর লোকেশন (চাইলে): শুধু এই ফোনে রাখা হয়, প্রায় ১ কিমি পর্যন্ত গোল করে; আমাদের সার্ভারে পাঠানো হয় না
const myLoc = () => local.get('myloc') || null;
const curLoc = () => myLoc() || HOME_LOC;
const locTz = () => (myLoc() ? -new Date().getTimezoneOffset() / 60 : 6);   // নিজের লোকেশনে ফোনের সময় অঞ্চল
const localParts = d => { const x = new Date(new Date(d).getTime() + locTz() * 36e5); return { h: x.getUTCHours(), m: x.getUTCMinutes() }; };
async function placeName(lat, lng) {
  try {
    const j = await (await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=bn`, { signal: AbortSignal.timeout?.(6000) })).json();
    return (j.locality || j.city || j.principalSubdivision || '').replace(/\s*(উপজেলা|Upazila)$/i, '').slice(0, 40) || 'আপনার এলাকা';
  } catch { return 'আপনার এলাকা'; }
}
function useMyLocation(btn) {
  if (!navigator.geolocation) return toast('এই ফোনে লোকেশন পাওয়া যাচ্ছে না');
  if (btn) { btn.disabled = true; btn.textContent = 'লোকেশন খোঁজা হচ্ছে…'; }
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = Math.round(pos.coords.latitude * 100) / 100, lng = Math.round(pos.coords.longitude * 100) / 100;
    const name = await placeName(lat, lng);
    local.set('myloc', { lat, lng, name }); local.set('wx', null); S.wx = null;
    toast(`📍 ${name} অনুযায়ী নামাজের সময় ও আবহাওয়া দেখাচ্ছে`);
    renderDaily(); loadWeather().then(v => { if (v) { S.wx = v; renderDaily(); } });
  }, err => {
    if (btn?.isConnected) renderDaily();
    toast(err.code === 1 ? 'লোকেশনের অনুমতি দেওয়া হয়নি। ফোনের সেটিংস থেকে এই অ্যাপের লোকেশন চালু করুন।' : 'লোকেশন পাওয়া যায়নি, একটু পরে আবার চেষ্টা করুন');
  }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60 * 6e4 });
}
// আবহাওয়া (Open-Meteo, চাবি লাগে না); ৩০ মিনিট পর্যন্ত আগের তথ্যই দেখাই, তাই ডেটা কম খরচ
async function loadWeather() {
  const L = curLoc(), key = `${L.lat},${L.lng}`;
  const c = local.get('wx'); if (c && c.k === key && Date.now() - c.t < 30 * 6e4) return c.v;
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${L.lat}&longitude=${L.lng}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`;
    const j = await (await fetch(u, { signal: AbortSignal.timeout?.(6000) })).json();
    const v = { temp: Math.round(j.current.temperature_2m), code: j.current.weather_code, max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]), rain: j.daily.precipitation_probability_max?.[0] ?? null };
    local.set('wx', { t: Date.now(), k: key, v }); return v;
  } catch { return c?.k === key ? c.v : null; }
}
function renderDaily() {
  const box = $('#daily'); if (!box) return;
  if (local.get('daily-off')) { box.innerHTML = ''; return; }
  const L = curLoc(), tz = locTz(), now = new Date(), pt = prayerTimes(new Date(now.getTime() + tz * 36e5), L.lat, L.lng, tz);
  const t = localParts(now), nowH = t.h + t.m / 60;
  const list = PRAYERS.filter(([k]) => k !== 'sunrise');
  let next = list.find(([k]) => pt[k] > nowH), tomorrow = false;
  if (!next) { next = list[0]; tomorrow = true; }
  const leftM = Math.max(Math.round(((tomorrow ? pt[next[0]] + 24 : pt[next[0]]) - nowH) * 60), 0), lh = Math.floor(leftM / 60), lm = leftM % 60;
  const wx = S.wx, w = wx ? (WX[wx.code] || WX[Math.floor(wx.code / 10) * 10] || ['🌡️', '']) : null;
  const open = !!S.dailyOpen;
  box.innerHTML = `<div class="card daily${open ? ' open' : ''}"><button class="dl-top" id="dl-toggle" aria-expanded="${open}">
      <span class="dl-pr">🕌 <span><small>পরের নামাজ${tomorrow ? ' (কাল)' : ''} · 📍${esc(L.name)}</small><b>${next[1]} ${hm(pt[next[0]])}</b><small>${lh ? `${bn(lh)} ঘণ্টা ` : ''}${lm || !lh ? `${bn(lm)} মিনিট ` : ''}পর</small></span></span>
      ${w ? `<span class="dl-wx"><span class="dl-wi">${w[0]}</span><span><b>${bn(wx.temp)}°</b><small>${w[1]}</small></span></span>` : ''}
      <span class="dl-chev">${open ? '▴' : '▾'}</span></button>
    ${open ? `<div class="dl-more"><div class="dl-grid">${PRAYERS.map(([k, n]) => `<span class="${next[0] === k && !tomorrow ? 'on' : ''}"><small>${n}</small><b>${hm(pt[k])}</b></span>`).join('')}</div>
      ${wx ? `<p class="dl-wxl">${esc(L.name)}: আজ সর্বোচ্চ ${bn(wx.max)}°, সর্বনিম্ন ${bn(wx.min)}°${wx.rain != null ? ` · বৃষ্টির সম্ভাবনা ${bn(wx.rain)}%` : ''}</p>` : ''}
      <div class="dl-loc">${myLoc() ? `<span>📍 আপনার লোকেশন: <b>${esc(L.name)}</b></span><button class="link" id="dl-loc">আবার খুঁজুন</button><button class="link" id="dl-home">${esc(HOME_LOC.of)} সময় দেখান</button>`
        : `<button class="sbtn" id="dl-loc">📍 আমার লোকেশন অনুযায়ী দেখান</button><span class="mut">এখন ${esc(HOME_LOC.of)} সময় দেখাচ্ছে</span>`}</div>
      <p class="dl-note mut">নামাজের সময় আনুমানিক (${esc(L.name)}), স্থানীয় মসজিদের সময়সূচি দেখে নিন।${wx ? ' আবহাওয়া: Open-Meteo' : ''}${myLoc() ? ' লোকেশন শুধু এই ফোনে থাকে।' : ''}</p>
      <button class="link dl-off" id="dl-off">এই কার্ডটি লুকান</button></div>` : ''}</div>`;
}
$('#daily').addEventListener('click', e => {
  if (e.target.closest('#dl-toggle')) { S.dailyOpen = !S.dailyOpen; renderDaily(); }
  const lb = e.target.closest('#dl-loc'); if (lb) return useMyLocation(lb);
  if (e.target.closest('#dl-home')) { local.set('myloc', null); local.set('wx', null); S.wx = null; renderDaily(); loadWeather().then(v => { if (v) { S.wx = v; renderDaily(); } }); return toast(`${HOME_LOC.of} সময় দেখাচ্ছে`); }
  if (e.target.closest('#dl-off')) { local.set('daily-off', 1); renderDaily(); toast('লুকানো হয়েছে। ☰ মেনু → সেটিংস থেকে আবার চালু করা যাবে'); }
});
setInterval(() => { if (S.view === 'home' && !document.hidden) renderDaily(); }, 60000);
function renderBdays() {
  const box = $('#bdays'); if (!box) return;
  const hide = new Set(local.get('bday-hide', [])), day = new Date(Date.now() + 6 * 36e5).toISOString().slice(0, 10);
  const list = (S.bdays || []).filter(x => !hide.has(day + ':' + x.id));
  box.innerHTML = list.length ? `<div class="card bday"><span class="bd-ic">🎂</span><div class="bd-t">আজ ${list.length === 1 ? `<b>${esc(list[0].name)}</b>-এর` : list.length === 2 ? `<b>${esc(list[0].name)}</b> ও <b>${esc(list[1].name)}</b>-এর` : `<b>${esc(list[0].name)}</b> ও আরও ${bn(list.length - 1)} জনের`} জন্মদিন</div>
    <div class="bd-b">${list.slice(0, 3).map(x => `<button class="sbtn" data-bdwish="${esc(x.id)}">${list.length > 1 ? esc(x.name.split(' ')[0]) + '-কে ' : ''}শুভেচ্ছা জানান</button>`).join('')}<button class="bd-x" data-bdx aria-label="লুকান">${ic('close', 16)}</button></div></div>` : '';
}
$('#bdays').addEventListener('click', async e => {
  const w = e.target.closest('[data-bdwish]');
  if (w) { await openThread(w.dataset.bdwish); const i = $('#tmsg'); if (i && !i.value) { i.value = 'শুভ জন্মদিন! 🎂 অনেক অনেক শুভকামনা।'; i.focus(); } return; }
  if (e.target.closest('[data-bdx]')) { const day = new Date(Date.now() + 6 * 36e5).toISOString().slice(0, 10); local.set('bday-hide', [...local.get('bday-hide', []).filter(x => x.startsWith(day)), ...(S.bdays || []).map(x => day + ':' + x.id)]); renderBdays(); }
});
function renderTrend() {
  const box = $('#trend'); if (!box) return;
  const t = S.trend || []; box.hidden = !t.length;
  box.innerHTML = t.length ? `<span class="tr-l">🔥 এখন আলোচিত</span>${t.map(x => `<button class="chip tr-chip" data-htag="${esc(x.tag)}">#${esc(x.tag)}</button>`).join('')}` : '';
}
async function loadHomeExtras() {
  renderDaily();
  if (!local.get('daily-off')) loadWeather().then(v => { if (v) { S.wx = v; renderDaily(); } });
  S.api.trendingTags().then(t => { S.trend = t; renderTrend(); }).catch(() => {});
  if (me() && !S.actAs) {
    S.api.birthdays().then(b => { S.bdays = b; renderBdays(); }).catch(() => {});
    if (!S.pymkAt || Date.now() - S.pymkAt > 10 * 6e4) {
      S.pymkAt = Date.now();
      S.api.people({}).then(list => { S.pymk = list.filter(u => (!u.rel || u.rel.friend === 'none' || !u.rel.friend) && !u.rel?.following); if (S.feeds.home.posts.length > 3) renderFeed('home'); }).catch(() => {});
    }
  } else { S.bdays = []; S.pymk = []; renderBdays(); }
}
// ফিডের মাঝে "পরিচিত হতে পারেন"
function pymkHtml() {
  const hide = new Set(local.get('pymk-hide', [])), list = (S.pymk || []).filter(u => !hide.has(u.id)).slice(0, 10);
  if (!me() || S.actAs || !list.length) return '';
  return `<div class="card pymk"><div class="sec-h"><h3>পরিচিত হতে পারেন</h3><button class="link" data-go="friends">সব দেখুন</button></div>
    <div class="pymk-row">${list.map(u => `<div class="pymk-c"><button class="pymk-x" data-pymkx="${esc(u.id)}" aria-label="সরিয়ে দিন">${ic('close', 14)}</button>${userLink(u.id, av(u))}${userLink(u.id, esc(u.name) + vb(u.verified), 'who-btn')}<span class="mut">${esc(u.union || '')}</span>
      ${u.sent ? '<button class="sbtn ghost" disabled>রিকোয়েস্ট গেছে ✓</button>' : `<button class="sbtn" data-pymkadd="${esc(u.id)}">বন্ধু হোন</button>`}</div>`).join('')}</div></div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-pymkadd],[data-pymkx]'); if (!b) return;
  e.stopPropagation();
  if (b.dataset.pymkx) { local.set('pymk-hide', [...local.get('pymk-hide', []), b.dataset.pymkx].slice(-200)); return renderFeed('home'); }
  if (!needUser()) return;
  const u = (S.pymk || []).find(x => String(x.id) === b.dataset.pymkadd); if (!u) return;
  await busy(b, async () => { await S.api.sendFriendRequest(u.id); u.sent = true; toast('ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে'); renderFeed('home'); });
}, true);
// পোল: ভোট দিলে (বা নিজের পোস্টে) ফলাফল দেখায়
function pollHtml(p) {
  const votes = p.poll.map((_, i) => Number(p.votes?.[i]) || 0), total = votes.reduce((a, b) => a + b, 0);
  const voted = p.myVote != null, show = voted || p.userId === me()?.id;
  const head = voted ? `${ic('poll', 16)} আপনি ভোট দিয়েছেন` : `${ic('poll', 16)} ভোট দিন: নিচের যেকোনো একটিতে চাপুন`;
  return `<div class="poll${voted ? ' voted' : ''}"><div class="po-head">${head}</div>${p.poll.map((o, i) => {
    const pct = total ? Math.round(votes[i] * 100 / total) : 0, mine = p.myVote === i;
    const radio = `<span class="po-r${mine ? ' on' : ''}" aria-hidden="true">${mine ? '✓' : ''}</span>`;
    return show ? `<button class="po res${mine ? ' mine' : ''}" data-vote="${esc(p.id)}|${i}" aria-label="${esc(o)}: ${bn(pct)}%${mine ? ', আপনার ভোট' : ', এখানে ভোট দিন'}"><span class="po-bar" style="width:${pct}%"></span>${radio}<span class="po-t">${esc(o)}</span><span class="po-p">${bn(pct)}%</span></button>`
      : `<button class="po" data-vote="${esc(p.id)}|${i}" aria-label="${esc(o)}, এখানে ভোট দিন">${radio}<span class="po-t">${esc(o)}</span><span class="po-cta">ভোট দিন</span></button>`;
  }).join('')}<div class="po-foot mut">${bn(total)} জন ভোট দিয়েছেন${voted ? ' · মত বদলাতে অন্যটিতে চাপুন, ভোট তুলে নিতে নিজের ভোটে আবার চাপুন' : show ? '' : ' · ভোট দিলে ফলাফল দেখতে পাবেন'}</div></div>`;
}
const DHAKA = { timeZone: 'Asia/Dhaka' };
// বাংলায় তারিখ-সময় (ঢাকার সময়): "শুক্রবার, ২৭ নভেম্বর · বিকাল ৫:০০"
const BN_WD = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const BN_MON = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
function dhakaParts(d) {
  const x = new Date(new Date(d).getTime() + 6 * 36e5);   // ঢাকা UTC+6, দিবালোক সময় নেই
  return { wd: x.getUTCDay(), day: x.getUTCDate(), mon: x.getUTCMonth(), h: x.getUTCHours(), m: x.getUTCMinutes() };
}
function bnWhen(d, short) {
  const t = dhakaParts(d), per = t.h < 4 ? 'রাত' : t.h < 6 ? 'ভোর' : t.h < 12 ? 'সকাল' : t.h < 15 ? 'দুপুর' : t.h < 18 ? 'বিকাল' : t.h < 20 ? 'সন্ধ্যা' : 'রাত';
  const time = `${per} ${bn(t.h % 12 || 12)}:${bn(String(t.m).padStart(2, '0'))}`;
  return short ? `${BN_WD[t.wd]} ${time}` : `${BN_WD[t.wd]}, ${bn(t.day)} ${BN_MON[t.mon]} · ${time}`;
}
function eventHtml(p) {
  const at = new Date(p.eventAt), past = at < Date.now();
  const t = dhakaParts(at), day = bn(t.day), mon = BN_MON[t.mon], when = bnWhen(at);
  return `<div class="evt${past ? ' past' : ''}"><div class="evt-d"><b>${day}</b><span>${mon}</span></div>
    <div class="evt-i"><b>${esc(when)}</b>${p.eventPlace ? `<span>📍 ${esc(p.eventPlace)}</span>` : ''}<span class="mut">${p.going ? `${bn(p.going)} জন ${past ? 'গিয়েছিলেন' : 'যাচ্ছেন'}` : past ? 'অনুষ্ঠানটি শেষ হয়েছে' : 'প্রথম "যাব" আপনিই দিন'}</span></div>
    ${past ? '<span class="evt-past">শেষ</span>' : `<button class="evt-go${p.meGoing ? ' on' : ''}" data-going="${esc(p.id)}" aria-pressed="${!!p.meGoing}">${p.meGoing ? '✓ যাচ্ছি' : 'যাব'}</button>`}</div>`;
}
// ================================================================ স্টোরি (২৪ ঘণ্টা)
// ২৪ ঘণ্টা পর সার্ভার থেকে লেখা ও ছবিসহ চিরতরে মুছে যায়। ফোনেও ছবি জমা রাখা হয় না (দেখা শেষে মেমরি থেকে ফেলে দেওয়া হয়)।
S.stories = []; S.stImg = new Map();
const stSeen = () => new Set(local.get('stseen', []));
function markStSeen(id) { const s0 = stSeen(); if (s0.has(id)) return; s0.add(id); const live = new Set(S.stories.map(x => x.id)); local.set('stseen', [...s0].filter(x => live.has(x)).slice(-400)); }
async function loadStories() {
  const had = storyUserSet();
  try { S.stories = await S.api.stories(); } catch { S.stories = []; }
  renderStories();
  // কারো স্টোরি এল/গেল: ফিডের ছবির বৃত্ত হালনাগাদ
  const now = storyUserSet();
  if (S.feeds.home.posts.length && ([...now].some(x => !had.has(x)) || [...had].some(x => !now.has(x)))) renderFeed('home');
}
function storyGroups() {
  const m = new Map(), myId = me()?.id, seen = stSeen();
  for (const st of S.stories) { if (!m.has(st.userId)) m.set(st.userId, { userId: st.userId, name: st.name, avatar: st.avatar, items: [] }); m.get(st.userId).items.push(st); }
  const arr = [...m.values()];
  arr.forEach(g => { g.seen = g.items.every(x => seen.has(x.id)); g.last = g.items.at(-1).createdAt; });
  return arr.sort((a, b) => (b.userId === myId) - (a.userId === myId) || a.seen - b.seen || b.last.localeCompare(a.last));
}
function renderStories() {
  const box = $('#stories'); if (!box) return;
  const u = me(), groups = storyGroups(), myId = u?.id;
  if (S.actAs || (!u && !groups.length)) { box.hidden = true; return; }
  box.hidden = false;
  const mineHas = groups[0]?.userId === myId;
  box.innerHTML = (u && !mineHas ? `<button class="st-u st-add" id="st-add" aria-label="স্টোরি দিন"><span class="st-ring add">${av(u)}<i>+</i></span><span class="st-n">স্টোরি দিন</span></button>` : '')
    + groups.map((g, i) => `<button class="st-u${g.seen ? ' seen' : ''}" data-stg="${i}" aria-label="${esc(g.name)}-এর স্টোরি"><span class="st-ring">${av(g)}${g.userId === myId ? '<i class="st-plus" data-stadd="1" role="button" aria-label="আরেকটি স্টোরি দিন">+</i>' : ''}</span><span class="st-n">${g.userId === myId ? 'আপনার স্টোরি' : esc(g.name.split(' ')[0])}</span></button>`).join('');
}
$('#stories').addEventListener('click', e => {
  if (e.target.closest('#st-add, [data-stadd]')) { e.stopPropagation(); return storyCreator(); }
  const b = e.target.closest('[data-stg]'); if (b) openStories(Number(b.dataset.stg));
});
// ---------- দেখা
function openStories(gi) {
  const groups = storyGroups(); if (!groups[gi]) return;
  const seen = stSeen(), g = groups[gi];
  const si = Math.max(0, g.items.findIndex(x => !seen.has(x.id)));
  S.stv = { groups, gi, si, t0: 0, left: 0, timer: null, paused: false };
  document.querySelector('.st-ov')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="st-ov" role="dialog" aria-label="স্টোরি"><div class="st-frame"><div class="st-bars"></div><div class="st-head"></div><div class="st-body"></div><div class="st-foot"></div></div></div>`);
  const ov = document.querySelector('.st-ov');
  let downAt = 0;
  ov.addEventListener('pointerdown', e => { if (e.target.closest('button,a')) return; downAt = Date.now(); stPause(true); });
  ov.addEventListener('pointerup', e => {
    if (e.target.closest('button,a') || !downAt) return;
    const held = Date.now() - downAt; downAt = 0;
    if (held > 300) return stPause(false);
    const r = ov.querySelector('.st-frame').getBoundingClientRect();
    (e.clientX - r.left < r.width / 3) ? stStep(-1) : stStep(1);
  });
  ov.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.user) return closeStories();   // প্রোফাইলে যাওয়ার আগে স্টোরি বন্ধ
    if (b.dataset.stx !== undefined) return closeStories();
    if (b.dataset.stviews !== undefined) return storyViewersSheet();
    if (b.dataset.stdel !== undefined) return deleteStoryNow();
  });
  document.addEventListener('keydown', stKeys);
  showStory();
}
function stKeys(e) { if (!S.stv) return; if (e.key === 'Escape') closeStories(); if (e.key === 'ArrowRight') stStep(1); if (e.key === 'ArrowLeft') stStep(-1); }
function closeStories() {
  clearTimeout(S.stv?.timer); S.stv = null; document.removeEventListener('keydown', stKeys);
  document.querySelector('.st-ov')?.remove(); S.stImg.clear();   // দেখা শেষ, ছবি মেমরি থেকেও ফেলে দেওয়া
  renderStories();
}
function stStep(d) {
  const v = S.stv; if (!v) return; clearTimeout(v.timer);
  let { gi, si } = v; si += d;
  if (si < 0) { if (gi === 0) si = 0; else { gi--; si = v.groups[gi].items.length - 1; } }
  else if (si >= v.groups[gi].items.length) { gi++; si = 0; if (gi >= v.groups.length) return closeStories(); }
  v.gi = gi; v.si = si; showStory();
}
function stPause(on) {
  const v = S.stv; if (!v || v.paused === on) return; v.paused = on;
  const bar = document.querySelector('.st-bars .cur i');
  if (on) { clearTimeout(v.timer); v.left = Math.max(v.left - (Date.now() - v.t0), 300); if (bar) { bar.style.width = getComputedStyle(bar).width; bar.style.transition = 'none'; } }
  else stRun(v.left);
}
function stRun(ms) {
  const v = S.stv; if (!v) return; v.t0 = Date.now(); v.left = ms; v.paused = false;
  const bar = document.querySelector('.st-bars .cur i');
  if (bar) { bar.style.transition = `width ${ms}ms linear`; requestAnimationFrame(() => { bar.style.width = '100%'; }); }
  clearTimeout(v.timer); v.timer = setTimeout(() => stStep(1), ms);
}
async function showStory() {
  const v = S.stv; if (!v) return; const ov = document.querySelector('.st-ov'); if (!ov) return;
  const g = v.groups[v.gi], st = g.items[v.si], mine = st.userId === me()?.id;
  ov.querySelector('.st-bars').innerHTML = g.items.map((x, i) => `<span class="${i === v.si ? 'cur' : ''}"><i style="width:${i < v.si ? 100 : 0}%"></i></span>`).join('');
  ov.querySelector('.st-head').innerHTML = `<button class="st-who" data-user="${esc(g.userId)}">${av(g, 'sm')}<b>${esc(g.name)}</b><span>${esc(ago(st.createdAt))}${st.privacy === 'friends' ? ' · 👥' : ''}</span></button>
    ${mine ? '<button class="st-hb" data-stdel aria-label="স্টোরি মুছে ফেলুন">' + ic('trash', 20) + '</button>' : ''}<button class="st-hb" data-stx aria-label="বন্ধ করুন">${ic('close', 22)}</button>`;
  ov.querySelector('.st-foot').innerHTML = mine ? `<button class="st-views" data-stviews>${ic('eye', 18)} <span id="st-vc">…</span> জন দেখেছেন</button>` : '';
  const body = ov.querySelector('.st-body');
  markStSeen(st.id); if (!mine) S.api.storySeen([st.id]).catch(() => {});
  if (mine) S.api.myStoryViews().then(m => { const el = $('#st-vc'); if (el && S.stv && v.groups[v.gi].items[v.si] === st) el.textContent = bn(m.get(st.id) || 0); }).catch(() => {});
  if (st.kind === 'text') { body.innerHTML = `<div class="st-text ${esc(st.bg)}">${esc(st.body)}</div>`; return stRun(5000); }
  body.innerHTML = '<div class="st-load">লোড হচ্ছে…</div>';
  let src = S.stImg.get(st.id);
  if (!src) { src = await S.api.storyImage(st.id).catch(() => ''); if (src) S.stImg.set(st.id, src); }
  if (!S.stv || v.groups[v.gi].items[v.si] !== st) return;
  body.innerHTML = src ? `<img class="st-img" src="${esc(src)}" alt="">${st.body ? `<div class="st-cap">${esc(st.body)}</div>` : ''}` : '<div class="st-load">স্টোরিটি আর নেই</div>';
  // পরের ছবি আগেই এনে রাখা (শুধু মেমরিতে)
  const nx = g.items[v.si + 1]; if (nx?.kind === 'photo' && !S.stImg.has(nx.id)) S.api.storyImage(nx.id).then(x => x && S.stv && S.stImg.set(nx.id, x)).catch(() => {});
  stRun(6000);
}
async function storyViewersSheet() {
  const v = S.stv; if (!v) return; const st = v.groups[v.gi].items[v.si];
  stPause(true);
  openSheet(`<h2>${ic('eye', 20)} কারা দেখেছেন</h2><div id="stv-list"><div class="mut">লোড হচ্ছে…</div></div><button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
  $('#sheet').addEventListener('click', e => { if (e.target.closest('[data-close]')) setTimeout(() => stPause(false), 50); });
  const list = await S.api.storyViewers(st.id).catch(() => []);
  $('#stv-list').innerHTML = list.length ? list.map(x => `<div class="person">${av(x)}<div class="info"><b>${esc(x.name)}</b><div class="sub">${esc(ago(x.seenAt))}</div></div></div>`).join('') : '<p class="mut">এখনো কেউ দেখেননি।</p>';
}
async function deleteStoryNow() {
  const v = S.stv; if (!v) return; const st = v.groups[v.gi].items[v.si];
  stPause(true);
  if (!(await confirmSheet('স্টোরিটি এখনই মুছে ফেলবেন?', 'মুছুন', true))) return stPause(false);
  await busy(null, async () => {
    await S.api.deleteStory(st.id); S.stories = S.stories.filter(x => x.id !== st.id); S.stImg.delete(st.id);
    toast('স্টোরি মুছে ফেলা হয়েছে'); closeStories();
  });
}
// ---------- তৈরি
function storyCreator() {
  if (!needUser()) return;
  S.stDraft = { kind: 'text', body: '', bg: 'g1', blob: null, url: '', privacy: local.get('stpriv', 'public') };
  renderStoryCreator();
}
function renderStoryCreator() {
  const d = S.stDraft;
  openSheet(`<div class="stc"><div class="pc-head"><b>স্টোরি তৈরি করুন</b><button class="pc-x" data-close aria-label="বন্ধ করুন">${ic('close', 20)}</button></div>
    <div class="seg stc-kind"><button data-stk="text" class="${d.kind === 'text' ? 'on' : ''}">Aa লেখা</button><button data-stk="photo" class="${d.kind === 'photo' ? 'on' : ''}">${ic('photo', 16)} ছবি</button></div>
    ${d.kind === 'text' ? `<div class="stc-prev ${d.bg}"><textarea id="stc-text" maxlength="250" placeholder="কিছু লিখুন…">${esc(d.body)}</textarea></div>
      <div class="pc-bgs">${BGS.map(g => `<button type="button" class="pc-sw ${g}${d.bg === g ? ' on' : ''}" data-stbg="${g}" aria-label="রং ${g.slice(1)}"></button>`).join('')}</div>`
    : `<label class="stc-photo">${d.url ? `<img src="${d.url}" alt="">` : `${ic('photo', 36)}<span>ছবি বাছাই করুন</span>`}<input type="file" accept="image/*" id="stc-file" hidden></label>
      <input class="f" id="stc-cap" maxlength="250" placeholder="ছবির সাথে কিছু লিখতে চাইলে (ঐচ্ছিক)" value="${esc(d.body)}">`}
    <label class="stc-pv">কারা দেখবে <select class="f" id="stc-priv"><option value="public" ${d.privacy === 'public' ? 'selected' : ''}>সবাই</option><option value="friends" ${d.privacy === 'friends' ? 'selected' : ''}>শুধু বন্ধুরা</option></select></label>
    <p class="stc-note">⏳ ২৪ ঘণ্টা পর স্টোরি চিরতরে মুছে যাবে। লেখা বা ছবি কোথাও রেখে দেওয়া হয় না।</p>
    <button class="btn wide" id="stc-go">স্টোরি শেয়ার করুন</button></div>`);
  const keep = () => { d.body = ($('#stc-text') || $('#stc-cap'))?.value ?? d.body; d.privacy = $('#stc-priv').value; };
  $('#sheet').oninput = keep; $('#sheet').onchange = async e => {
    keep();
    if (e.target.id === 'stc-file' && e.target.files[0]) {
      try {
        let blob = await compress(e.target.files[0], 1080, 0.72);
        if (blob.size > 270000) blob = await compress(e.target.files[0], 800, 0.6);
        if (d.url) URL.revokeObjectURL(d.url);
        d.blob = blob; d.url = URL.createObjectURL(blob); renderStoryCreator();
      } catch { toast('ছবিটি খোলা যায়নি'); }
    }
  };
  $('#sheet').onclick = e => {
    const k = e.target.closest('[data-stk]'); if (k) { keep(); d.kind = k.dataset.stk; d.body = ''; return renderStoryCreator(); }
    const bgb = e.target.closest('[data-stbg]'); if (bgb) { keep(); d.bg = bgb.dataset.stbg; return renderStoryCreator(); }
  };
  $('#stc-go').onclick = e => {
    keep();
    if (d.kind === 'text' && !d.body.trim()) return toast('কিছু লিখুন');
    if (d.kind === 'photo' && !d.blob) return toast('একটি ছবি বাছাই করুন');
    local.set('stpriv', d.privacy);
    busy(e.currentTarget, async () => {
      try { await S.api.createStory({ kind: d.kind, body: d.body.trim(), bg: d.bg, blob: d.blob, privacy: d.privacy }); }
      catch (err) { if (/story limit/.test(err.message)) return toast('একসাথে সর্বোচ্চ ১৫টি স্টোরি রাখা যায়'); throw err; }
      if (d.url) URL.revokeObjectURL(d.url);
      S.stDraft = null; closeSheet(); toast('স্টোরি দেওয়া হয়েছে, ২৪ ঘণ্টা থাকবে'); loadStories();
    });
  };
}
// ================================================================ পোস্ট কতজন দেখেছেন
// অর্ধেকের বেশি অংশ অন্তত ১ সেকেন্ড স্ক্রিনে থাকলে "দেখা" ধরা হয়; কয়েক সেকেন্ড পরপর একসাথে সার্ভারে পাঠানো হয়
const seenPosts = new Set(), seenQueue = new Map(), seenTimers = new Map();
let viewObs = null, seenFlushT = null;
function flushSeen() {
  clearTimeout(seenFlushT); seenFlushT = null;
  const items = [...seenQueue].slice(0, 30).map(([id, src]) => ({ id, src })); items.forEach(x => seenQueue.delete(x.id));
  if (items.length) S.api.postSeen(items).catch(() => {});
  if (seenQueue.size) seenFlushT = setTimeout(flushSeen, 4000);
}
const VIEW_SRC = { home: 'feed', me: 'profile', user: 'profile', group: 'group', page: 'page', post: 'post', saved: 'saved', search: 'search' };
const markSeen = (id, src) => { if (seenPosts.has(id)) return; seenPosts.add(id); seenQueue.set(id, src); if (!seenFlushT) seenFlushT = setTimeout(flushSeen, 4000); };
function watchViews(box, key) {
  if (!me() || !('IntersectionObserver' in window)) return;
  box.querySelectorAll('article.post[data-pid]').forEach(el => { el.dataset.src = el.classList.contains('sponsored') ? 'boost' : (VIEW_SRC[key] || 'other'); });
  viewObs = viewObs || new IntersectionObserver(entries => {
    for (const en of entries) {
      const id = Number(en.target.dataset.pid);
      if (en.isIntersecting) {
        if (seenPosts.has(id) || seenTimers.has(id)) continue;
        seenTimers.set(id, setTimeout(() => {
          seenTimers.delete(id); viewObs.unobserve(en.target);
          if (!en.target.dataset.own) markSeen(id, en.target.dataset.src || 'other');
          const sp = Number(en.target.dataset.spid); if (sp) markSeen(sp, 'share');   // শেয়ার করা পোস্টের ভেতরের আসল পোস্টটিও দেখা হলো
        }, 1000));
      } else if (seenTimers.has(id)) { clearTimeout(seenTimers.get(id)); seenTimers.delete(id); }
    }
  }, { threshold: 0.5 });
  box.querySelectorAll('article.post[data-pid]').forEach(el => { if ((!el.dataset.own && !seenPosts.has(Number(el.dataset.pid))) || (el.dataset.spid && !seenPosts.has(Number(el.dataset.spid)))) viewObs.observe(el); });
}
// পোস্ট থেকে প্রোফাইলে যাওয়া, ছবি খোলা, "আরও দেখুন" চাপা (প্রতি পোস্টে একবার)
const clickSent = new Set();
document.addEventListener('click', e => {
  const art = e.target.closest('article.post[data-pid]'); if (!art || art.dataset.own || !me()) return;
  const kind = e.target.closest('.top [data-user], .top [data-page]') ? 'profile' : e.target.closest('[data-view]') ? 'photo' : e.target.closest('[data-more^="p"]') ? 'more' : '';
  const k = art.dataset.pid + ':' + kind;
  if (!kind || clickSent.has(k)) return;
  clickSent.add(k); S.api.postClick(Number(art.dataset.pid), kind).catch(() => {});
}, true);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && seenQueue.size) flushSeen(); });
const SRC_NAME = { feed: 'হোম ফিড', profile: 'আপনার প্রোফাইল', share: 'কারো শেয়ার থেকে', group: 'গ্রুপ', page: 'পেইজ', boost: 'বুস্ট (স্পন্সরড)', post: 'সরাসরি লিংক বা নোটিফিকেশন', search: 'সার্চ', saved: 'সেভ করা পোস্ট', other: 'অন্যান্য' };
const AGE_ORDER = ['13-17', '18-24', '25-34', '35-44', '45+', 'unknown'];
const srcRows = o => Object.entries(o || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([k, n]) => [SRC_NAME[k] || k, n]);
const WD = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
function chartBlock(title, daily) {
  const max = Math.max(1, ...daily.map(d => d.n)), many = daily.length > 10;
  return `<div class="ps-box"><b>${title}</b><div class="ps-chart${many ? ' many' : ''}">${daily.map((d, i) => {
    const dt = new Date(d.day + 'T00:00:00'), lbl = many ? (i % 5 === 0 || i === daily.length - 1 ? bn(dt.getDate()) : '') : WD[dt.getDay()];
    return `<div class="pc-col" title="${bn(dt.getDate())} তারিখ: ${bn(d.n)}"><small>${d.n && !many ? bn(d.n) : ''}</small><i style="height:${Math.max(3, (d.n / max) * 100)}%"></i><span>${lbl}</span></div>`;
  }).join('')}</div></div>`;
}
function listBlock(title, rows) {
  const total = rows.reduce((t, r) => t + r[1], 0);
  if (!total) return '';
  return `<div class="ps-box"><b>${title}</b>${rows.map(([l, n]) => `<div class="pl-row"><span>${esc(l)}</span><span class="pl-bar"><i style="width:${(n / total) * 100}%"></i></span><b>${bn(n)}</b></div>`).join('')}</div>`;
}
// আপনার সাম্প্রতিক ২০টা পোস্টের গড়ের সাথে তুলনা
function avgLine(n, avg) {
  if (avg == null) return '<small class="ps-avg">তুলনার জন্য আরও পোস্ট দরকার</small>';
  if (avg < 1) return n > 0 ? '<small class="ps-avg up">আপনার অন্য পোস্টগুলোর চেয়ে বেশি দেখা হয়েছে</small>' : '';
  const r = n / avg;
  if (r >= 1.5) return `<small class="ps-avg up">▲ আপনার সাধারণ পোস্টের চেয়ে ${bn(r >= 10 ? Math.round(r) : Math.round(r * 10) / 10)} গুণ বেশি</small>`;
  if (r >= 1.1) return `<small class="ps-avg up">▲ আপনার সাধারণ পোস্টের চেয়ে ${bn(Math.round((r - 1) * 100))}% বেশি</small>`;
  if (r > 0.9) return '<small class="ps-avg">আপনার সাধারণ পোস্টের মতোই</small>';
  return `<small class="ps-avg down">▼ আপনার সাধারণ পোস্টের চেয়ে ${bn(Math.round((1 - r) * 100))}% কম</small>`;
}
async function postStatsSheet(p) {
  if (!p) return;
  openSheet('<div class="skel"></div>');
  try {
    const st = await S.api.postStats(p.id);
    p.views = st.views; document.querySelectorAll(`.views-btn[data-pinfo="${p.id}"] .cnt`).forEach(c => { c.textContent = bn(st.views); });
    const rx = Object.values(p.reactions || {}).reduce((t, n) => t + n, 0) || p.likes || 0;
    const cell = (icon, n, l) => `<div class="ps-cell"><span>${icon}</span><b>${bn(n)}</b><small>${l}</small></div>`;
    openSheet(`<h2>পোস্টের হিসাব</h2>
      <div class="ps-big">${ic('users', 22)}<b>${bn(st.people)}</b><span>জন পোস্টটি দেখেছেন</span>${avgLine(st.people, st.avgPeople)}</div>
      <div class="ps-grid">
        ${cell('👁', st.views, 'মোট দেখা')}${cell('📅', st.today, 'আজ দেখেছেন')}${cell('👍', rx, 'রিয়্যাক্ট')}
        ${cell('💬', p.comments || 0, 'মন্তব্য')}${cell('↗', p.shares || 0, 'শেয়ার')}${cell('🔖', p.saves || 0, 'সেভ')}
      </div>
      <div class="ps-aud"><b>কারা দেখেছেন</b>
        <div class="ps-bar" role="img" aria-label="বন্ধু বা ফলোয়ার ${bn(st.close)} জন, অন্যরা ${bn(st.others)} জন"><i style="width:${st.people ? (st.close / st.people) * 100 : 0}%"></i></div>
        <div class="ps-leg"><span><i class="c1"></i>বন্ধু / ফলোয়ার <b>${bn(st.close)}</b></span><span><i class="c2"></i>অন্যরা (ফলো করেন না) <b>${bn(st.others)}</b></span></div>
      </div>
      ${chartBlock('গত ৭ দিন', st.daily)}
      <div class="ps-rate">${ic('thumb', 18)}<span>সাড়ার হার <b>${st.people ? bn(Math.round(((rx + (p.comments || 0) + (p.shares || 0)) / st.people) * 100)) : '০'}%</b><small>যারা দেখেছেন তাদের মধ্যে কতজন রিয়্যাক্ট, মন্তব্য বা শেয়ার করেছেন</small></span></div>
      ${listBlock('কোথা থেকে দেখেছেন', srcRows(st.sources))}
      ${listBlock('কোন এলাকার মানুষ', st.areas.map(a => [a.name, a.n]))}
      ${st.genders ? listBlock('লিঙ্গ', Object.entries(st.genders).map(([k, n]) => [GENDERS[k] || 'জানা নেই', n])) + listBlock('বয়স', AGE_ORDER.filter(k => st.ages?.[k]).map(k => [k === 'unknown' ? 'জানা নেই' : bn(k) + ' বছর', st.ages[k]])) : `<div class="ps-note">লিঙ্গ ও বয়সের ভাগ দেখাবে অন্তত ১০ জন দেখলে, যাতে কে দেখেছেন তা আন্দাজ করা না যায়।</div>`}
      <div class="ps-clicks"><b>পোস্টে যা যা করেছেন</b>
        <div><span>${ic('user', 16)} প্রোফাইলে গেছেন</span><b>${bn(st.clicks.profile)}</b></div>
        <div><span>${ic('photo', 16)} ছবি খুলে দেখেছেন</span><b>${bn(st.clicks.photo)}</b></div>
        <div><span>${ic('post', 16)} "আরও দেখুন" চেপেছেন</span><b>${bn(st.clicks.more)}</b></div>
      </div>
      <div class="ps-newf">${ic('user', 18)}<span>${st.newFollowers ? `পোস্টটি দেখার পর <b>${bn(st.newFollowers)} জন</b> নতুন করে আপনাকে ফলো করেছেন` : 'এই পোস্ট থেকে এখনো নতুন ফলোয়ার আসেনি'}</span></div>
      ${st.boostReach ? `<p class="ps-boost">🚀 এর মধ্যে বুস্ট থেকে পৌঁছেছে <b>${bn(st.boostReach)}</b> জনের কাছে</p>` : ''}
      <p class="mut" style="font-size:13px;margin:10px 0 0">এই হিসাব শুধু আপনি দেখতে পাচ্ছেন। একজন মানুষ যতবারই দেখুক, "দেখেছেন"-এ একবার গোনা হয়; মোট দেখা দিনে একবার করে বাড়ে। কে কে দেখেছেন তা দেখানো হয় না।</p>
      ${(p.privacy || 'public') === 'public' && !p.groupId && feat('featBoost') && !p.sponsored ? `<button class="btn wide" id="ps-boost" style="margin-top:12px">${ic('send', 16)} আরও মানুষের কাছে পৌঁছাতে বুস্ট করুন</button>` : ''}
      <button class="btn ghost wide" data-close style="margin-top:8px">ঠিক আছে</button>`);
    $('#ps-boost')?.addEventListener('click', () => boostSheet(p));
  } catch (e) { closeSheet(); toast(errText(e)); }
}

// ================================================================ ড্যাশবোর্ড: সব পোস্ট মিলিয়ে
const hourBn = h => { const n = h % 12 || 12, part = h < 4 ? 'রাত' : h < 6 ? 'ভোর' : h < 12 ? 'সকাল' : h < 15 ? 'দুপুর' : h < 18 ? 'বিকাল' : h < 20 ? 'সন্ধ্যা' : 'রাত'; return `${part} ${bn(n)}টা`; };
function bestWindow(hours) {
  let best = -1, at = 0;
  for (let h = 0; h < 24; h++) { const s2 = hours[h] + hours[(h + 1) % 24]; if (s2 > best) { best = s2; at = h; } }
  return best > 0 ? `${hourBn(at)} থেকে ${hourBn((at + 2) % 24)}` : '';
}
function followChart(daily, labels = ['ফলো', 'আনফলো']) {
  const max = Math.max(1, ...daily.map(d => Math.max(d.plus, d.minus))), many = daily.length > 10;
  return `<div class="ps-chart fol${many ? ' many' : ''}">${daily.map((d, i) => {
    const dt = new Date(d.day + 'T00:00:00'), lbl = many ? (i % 5 === 0 || i === daily.length - 1 ? bn(dt.getDate()) : '') : WD[dt.getDay()];
    return `<div class="pc-col" title="${bn(dt.getDate())} তারিখ: +${bn(d.plus)} / −${bn(d.minus)}"><div class="fc-bars"><i class="p" style="height:${d.plus ? Math.max(4, (d.plus / max) * 100) : 0}%"></i><i class="m" style="height:${d.minus ? Math.max(4, (d.minus / max) * 100) : 0}%"></i></div><span>${lbl}</span></div>`;
  }).join('')}</div><div class="ps-leg" style="margin-top:6px"><span><i class="c1"></i>${labels[0]}</span><span><i class="c3"></i>${labels[1]}</span></div>`;
}
async function loadInsights(days) {
  const box = $('#insights');
  if (!me()) { box.innerHTML = '<div class="empty">ড্যাশবোর্ড দেখতে লগইন করুন।</div>'; return; }
  S.insDays = days || S.insDays || 7;
  box.innerHTML = '<div class="skel"></div><div class="skel"></div>';
  try {
    const T = S.insTarget, kind = T?.kind || 'me';
    $('#v-insights .bar b').textContent = T ? `${T.name}: ড্যাশবোর্ড` : 'ড্যাশবোর্ড';
    let d, g;
    if (T) { d = await S.api.entInsights(T.kind, T.id, S.insDays); g = d.growth; }
    else [d, g] = await Promise.all([S.api.myInsights(S.insDays), S.api.myGrowth(S.insDays)]);
    const best = bestWindow(d.hours), hmax = Math.max(1, ...d.hours);
    const L = {   // কোন ড্যাশবোর্ডে কোন শব্দ
      me: { visit: 'প্রোফাইল ভিজিট', fol: 'ফলোয়ার', plus: 'নতুন ফলো করেছেন', minus: 'আনফলো করেছেন', close: 'বন্ধু / ফলোয়ার', you: 'আপনার' },
      page: { visit: 'পেইজ ভিজিট', fol: 'পেইজের ফলোয়ার', plus: 'নতুন ফলো করেছেন', minus: 'আনফলো করেছেন', close: 'পেইজের ফলোয়ার', you: 'পেইজের' },
      group: { visit: 'গ্রুপ ভিজিট', fol: 'সদস্য', plus: 'নতুন যোগ দিয়েছেন', minus: 'গ্রুপ ছেড়েছেন', close: 'গ্রুপের সদস্য', you: 'গ্রুপের' },
    }[kind];
    const tile = (icon, n, l) => `<div class="in-tile"><span>${icon}</span><b>${bn(n)}</b><small>${l}</small></div>`;
    box.innerHTML = `
      <div class="seg in-seg" role="tablist">${[7, 30].map(n => `<button role="tab" data-indays="${n}" class="${S.insDays === n ? 'on' : ''}" aria-selected="${S.insDays === n}">গত ${bn(n)} দিন</button>`).join('')}</div>
      <div class="in-tiles">${tile('👥', d.people, 'জন পোস্ট দেখেছেন')}${tile('👁', d.views, 'পোস্টের মোট ভিউ')}${tile('🏠', g.visits, L.visit)}${tile('📝', d.posts, kind === 'group' ? 'পোস্ট হয়েছে' : 'পোস্ট করেছেন')}${kind === 'group' ? tile('🙋', d.activeMembers, 'সক্রিয় সদস্য') + tile('⏳', d.pending, 'অপেক্ষমাণ অনুরোধ') : ''}</div>
      ${kind === 'group' ? '<p class="mut in-sub">সক্রিয় সদস্য: এই সময়ে যারা গ্রুপে পোস্ট বা মন্তব্য করেছেন।</p>' : ''}
      <div class="card">${chartBlock('প্রতিদিনের পোস্ট ভিউ', d.daily)}</div>
      <div class="card"><b class="in-h">${L.fol}</b>
        <div class="in-fol"><div><b>${bn(g.followers)}</b><small>এখন মোট</small></div><div class="up"><b>+${bn(g.gained)}</b><small>${L.plus}</small></div><div class="down"><b>−${bn(g.lost)}</b><small>${L.minus}</small></div><div><b>${g.gained - g.lost >= 0 ? '+' : '−'}${bn(Math.abs(g.gained - g.lost))}</b><small>মোট বদল</small></div></div>
        ${followChart(g.followDaily, kind === 'group' ? ['যোগ দিয়েছেন', 'ছেড়েছেন'] : ['ফলো', 'আনফলো'])}</div>
      <div class="card">${chartBlock(`${L.visit} · ${bn(g.visitors)} জন`, g.visitsDaily)}<p class="mut" style="margin:6px 0 0;font-size:12.5px">একজন দিনে একবার গোনা হয়। কে ভিজিট করেছেন তা দেখানো হয় না।</p></div>
      <div class="card"><div class="ps-aud" style="margin:0;border:0;padding:0"><b>কারা দেখেছেন</b>
        <div class="ps-bar"><i style="width:${d.people ? (d.close / d.people) * 100 : 0}%"></i></div>
        <div class="ps-leg"><span><i class="c1"></i>${L.close} <b>${bn(d.close)}</b></span><span><i class="c2"></i>অন্যরা <b>${bn(d.others)}</b></span></div></div></div>
      ${srcRows(d.sources).length ? `<div class="card">${listBlock('কোথা থেকে দেখেছেন', srcRows(d.sources))}</div>` : ''}
      <div class="card"><div class="ps-box" style="border:0;padding:0;margin:0"><b>পোস্ট করার সেরা সময়</b>
        <p class="mut" style="margin:2px 0 8px;font-size:13px">${best ? `গত ৩০ দিনে ${L.you} পোস্ট সবচেয়ে বেশি দেখা হয়েছে <b class="in-best">${best}</b>-এর মধ্যে। এই সময়ের একটু আগে পোস্ট করলে বেশি মানুষ দেখবেন।` : `আরও কিছু মানুষ ${L.you} পোস্ট দেখলে এখানে সেরা সময় দেখাবে।`}</p>
        <div class="in-hours">${d.hours.map((n, h) => `<i title="${hourBn(h)}: ${bn(n)}" style="height:${Math.max(3, (n / hmax) * 100)}%"></i>`).join('')}</div>
        <div class="in-hlbl"><span>রাত ১২</span><span>সকাল ৬</span><span>দুপুর ১২</span><span>সন্ধ্যা ৬</span><span>রাত ১১</span></div></div></div>
      <h3 class="res-h">সবচেয়ে বেশি দেখা পোস্ট</h3>
      <div class="card">${d.top.length ? d.top.map(t => `<button class="bo-row" data-openpost="${t.id}">${t.image ? `<img loading="lazy" decoding="async" src="${esc(t.image)}" alt="">` : `<span class="bo-ph">${ic('post', 18)}</span>`}<span class="bo-tx"><b>${esc(t.body || 'ছবি পোস্ট')}</b><small>${bn(t.people)} জন দেখেছেন · ${bn(t.views)} ভিউ · ${esc(ago(t.createdAt))}</small></span></button>`).join('') : `<p class="mut" style="margin:0">এই সময়ে ${L.you} কোনো পোস্ট কেউ দেখেননি। নতুন পোস্ট করুন!</p>`}</div>
      <p class="note">${kind === 'group' ? 'এই হিসাব শুধু গ্রুপ অ্যাডমিনরা দেখতে পান।' : kind === 'page' ? 'এই হিসাব শুধু পেইজের মালিক দেখতে পান।' : 'এই হিসাব শুধু আপনি দেখতে পাচ্ছেন।'} কে কে দেখেছেন তা দেখানো হয় না।${kind === 'group' ? '' : ' প্রতিটা পোস্টের বিস্তারিত পোস্টের ⓘ বাটনে।'}</p>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
document.addEventListener('click', e => {
  const ib = e.target.closest('[data-insights]');
  if (ib) { S.insTarget = ib.dataset.insights === '1' ? null : { kind: ib.dataset.insights, id: Number(ib.dataset.entid), name: ib.dataset.entname || '' }; open('insights'); loadInsights(); return; }
  const dd = e.target.closest('[data-indays]'); if (dd) loadInsights(Number(dd.dataset.indays));
});

// হোম ফিডে ৩, ৮, ১৩… নম্বর জায়গায় একটা করে বুস্ট করা পোস্ট
function withAds(f) {
  const ads = [...(f.ads || [])];
  if (!ads.length) return f.posts;
  const adIds = new Set(ads.map(a => a.id)), posts = f.posts.filter(p => !adIds.has(p.id)), out = [];   // একই পোস্ট দুইবার না দেখাই
  posts.forEach((p, i) => { out.push(p); if (i % 5 === 1 && ads.length) out.push(ads.shift()); });
  if (posts.length < 2 && ads.length) out.push(ads.shift());
  return out;
}
function renderFeed(key) {
  const f = S.feeds[key], box = $('#feed-' + key);
  let list = key === 'home' ? withAds(f) : f.posts;
  if (key === 'home' && f.urgent?.length) { const top = f.urgent.filter(p => !p.resolvedAt), ids = new Set(top.map(p => String(p.id))); list = [...top, ...list.filter(p => !ids.has(String(p.id)))]; }
  box.innerHTML = f.posts.length ? list.map((p, i) => postHtml(p) + (key === 'home' && i === 3 ? pymkHtml() : '')).join('')
    : key === 'search' ? '' : key === 'post' ? '<div class="empty">পোস্টটি আর নেই।</div>'
    : key === 'saved' ? '<div class="empty">কোনো সেভ করা পোস্ট নেই।<br>পোস্টের ⋯ মেনু থেকে "পোস্ট সেভ করুন" চাপুন।</div>'
    : key === 'page' || key === 'group' ? '<div class="empty">এখনো কোনো পোস্ট নেই।</div>'
    : `<div class="empty">${key === 'home' && S.scope === 'friends' ? 'বন্ধু বা যাদের ফলো করছেন তাদের কোনো পোস্ট এখনো নেই।<br>"বন্ধু" ট্যাব থেকে মানুষ খুঁজে যুক্ত হোন।' : key === 'home' ? 'এখানে এখনো কোনো পোস্ট নেই।<br>প্রথম পোস্টটি আপনিই করুন!' : 'এখনো কোনো পোস্ট নেই।'}</div>`;
  const more = $('#more-' + key); if (more) more.hidden = !f.more;
  watchCarousels(box);
  watchViews(box, key);
  if (key === 'home') {
    const fresh = list.filter(p => p.sponsored && !S.seenBoosts.has(p.boostId)).map(p => p.boostId);
    if (fresh.length) { fresh.forEach(id => S.seenBoosts.add(id)); S.api.boostSeen(fresh).catch(() => {}); }
  }
}
async function loadFeed(key, append) {
  const f = S.feeds[key], box = $('#feed-' + key);
  if (!append) box.innerHTML = '<div class="skel"></div><div class="skel"></div>';
  const q = key === 'home'
    ? { scope: S.scope, unionId: S.union ? Number(S.union) : null, category: S.fcat || null }
    : key === 'post' ? { postId: S.postId }
    : key === 'saved' ? { saved: true }
    : key === 'page' ? { pageId: S.pageId }
    : key === 'group' ? { groupId: S.groupId }
    : { userId: key === 'me' ? me()?.id : S.userId };
  try {
    if (key !== 'home' && !q.userId && !q.postId && !q.saved && !q.pageId && !q.groupId) { f.posts = []; box.innerHTML = ''; return; }
    const plainHome = key === 'home' && !append && S.scope === 'area' && !q.unionId && !q.category && !S.api.demoLogin;
    const call = () => S.api.posts({ ...q, before: append ? f.posts.at(-1)?.createdAt : undefined });
    const adsP = key === 'home' && !append && !q.category && feat('featBoost') ? S.api.boostedPosts(3).catch(() => []) : null;
    const urgP = key === 'home' && !append && S.scope === 'area' && (!q.category || q.category === 'সাহায্য চাই') ? S.api.posts({ urgent: true, unionId: q.unionId }).catch(() => []) : null;
    const pinId = append ? null : key === 'page' ? S.curPage?.pinnedPostId : key === 'me' ? me()?.pinnedPostId : key === 'user' ? (S.viewProfile?.id === S.userId ? S.viewProfile?.pinnedPostId : null) : null;
    const pinP = pinId ? S.api.posts({ postId: pinId }).catch(() => []) : null;
    const rows = plainHome ? await cachedCall('feed', async () => (await call()).slice(0, PAGE)) : await call();
    if (adsP) f.ads = await adsP;
    if (key === 'home' && !append) { loadStories(); loadHomeExtras(); if (me()) S.fol = await S.api.followState().catch(() => S.fol); }
    if (key === 'home' && !append) f.urgent = urgP ? (await urgP).map(p => ({ ...p, urgentTop: true })) : [];
    f.posts = append ? [...f.posts, ...rows] : rows; f.more = !['post', 'saved'].includes(key) && rows.length >= PAGE;
    if (pinP) { const pin = (await pinP)[0]; if (pin) f.posts = [{ ...pin, pinnedPage: true }, ...f.posts.filter(x => x.id !== pin.id)]; }
  } catch (e) { toast(errText(e)); if (!append) f.posts = []; }
  renderFeed(key);
}
const feedOf = el => el.closest('[data-feed]')?.dataset.feed;
const findPost = (key, id) => (S.feeds[key].urgent || []).find(p => String(p.id) === String(id)) || S.feeds[key].posts.find(p => String(p.id) === String(id)) || (S.feeds[key].ads || []).find(p => String(p.id) === String(id));

document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.user) { e.preventDefault(); return openUser(b.dataset.user); }
  if (b.dataset.page) return openPage(b.dataset.page);
  if (b.dataset.openpost) return openPost(b.dataset.openpost);
  if (b.dataset.group) return openGroup(b.dataset.group);
  const key = feedOf(b); if (!key) return;
  if (b.dataset.pinfo) return postStatsSheet(findPost(key, b.dataset.pinfo));
  if (b.dataset.vote) {
    if (!needUser()) return;
    const [id, i] = b.dataset.vote.split('|'), p = findPost(key, id), opt = Number(i); if (!p) return;
    const before = { votes: [...(p.votes || p.poll.map(() => 0))], myVote: p.myVote };
    const next = p.myVote === opt ? null : opt;
    p.votes = before.votes.slice(); if (p.myVote != null) p.votes[p.myVote] = Math.max((p.votes[p.myVote] || 0) - 1, 0); if (next != null) p.votes[next] = (p.votes[next] || 0) + 1;
    p.myVote = next; renderFeed(key);
    try { await S.api.votePoll(p.id, next); } catch (err) { Object.assign(p, before); renderFeed(key); toast(errText(err)); }
    return;
  }
  if (b.dataset.going) {
    if (!needUser()) return;
    const p = findPost(key, b.dataset.going); if (!p) return;
    const on = !p.meGoing; p.meGoing = on; p.going = Math.max((p.going || 0) + (on ? 1 : -1), 0); renderFeed(key);
    try { await S.api.setGoing(p.id, on); if (on) toast('ঠিক আছে! অনুষ্ঠানের আগের দিন মনে করিয়ে দেওয়া হবে'); }
    catch (err) { p.meGoing = !on; p.going = Math.max((p.going || 0) + (on ? -1 : 1), 0); renderFeed(key); toast(errText(err)); }
    return;
  }
  if (b.dataset.like) {
    if (S.suppressClick) { S.suppressClick = false; return; }
    clearTimeout(lpTimer); closePicker();
    const p = findPost(key, b.dataset.like);
    setReaction(key, p, p.myReaction ? '' : 'like');
  } else if (b.dataset.react) {
    const p = findPost(key, b.dataset.post); closePicker(); setReaction(key, p, b.dataset.react === p.myReaction ? '' : b.dataset.react);
  } else if (b.dataset.save) {
    if (!needUser()) return;
    const p = findPost(key, b.dataset.save), was = !!p.saved;
    p.saved = !was; p.saves = Math.max((p.saves || 0) + (was ? -1 : 1), 0); renderFeed(key);
    try { await (was ? S.api.unsavePost(p.id) : S.api.savePost(p.id)); toast(was ? 'সেভ থেকে সরানো হয়েছে' : 'সেভ হয়েছে। ☰ মেনু → সেভ করা পোস্টে পাবেন।'); if (key === 'saved' && was) { S.feeds.saved.posts = S.feeds.saved.posts.filter(x => x.id !== p.id); renderFeed('saved'); } }
    catch (err) { p.saved = was; p.saves = Math.max((p.saves || 0) + (was ? 1 : -1), 0); renderFeed(key); toast(errText(err)); }
  } else if (b.dataset.rxlist) {
    reactorsSheet('post', b.dataset.rxlist);
  } else if (b.dataset.cm) {
    if (key === 'post') { $('#cm-input').focus(); return; }
    toggleCmi(key, b.dataset.cm);
  } else if (b.dataset.share) {
    shareSheet(findPost(key, b.dataset.share));
  } else if (b.dataset.menu) {
    postMenu(key, findPost(key, b.dataset.menu));
  } else if (b.dataset.delc) {
    if (!(await confirmSheet('মন্তব্যটি মুছে ফেলবেন?', 'মুছুন', true))) return;
    const p = findPost(key, b.dataset.post);
    await busy(null, async () => { await S.api.deleteComment(Number(b.dataset.delc)); p.comments--; S.open.set(p.id, await S.api.comments(p.id)); renderFeed(key); });
  } else if (b.dataset.repc) reportSheet('comment', b.dataset.repc);
});
document.addEventListener('submit', e => {
  const f = e.target; if (!f.dataset.cf) return;
  e.preventDefault(); const key = feedOf(f), body = f.c.value.trim();
  if (!body || !needUser()) return;
  const p = findPost(key, f.dataset.cf);
  busy(f.querySelector('button'), async () => { await S.api.addComment(p.id, body, null, [], S.actAs?.id || null); p.comments++; S.open.set(p.id, await S.api.comments(p.id)); renderFeed(key); });
});
// রিয়্যাক্ট সেট (সঙ্গে সঙ্গে স্ক্রিনে দেখাই, সার্ভারে ব্যর্থ হলে ফিরিয়ে আনি)
async function setReaction(key, p, reaction) {
  if (!needUser()) return;
  const prev = p.myReaction || '', before = { likes: p.likes, reactions: { ...(p.reactions || {}) }, myReaction: prev, liked: p.liked };
  if (prev === reaction) return;
  p.reactions = { ...(p.reactions || {}) };
  if (prev) p.reactions[prev] = Math.max((p.reactions[prev] || 0) - 1, 0);
  if (reaction) p.reactions[reaction] = (p.reactions[reaction] || 0) + 1;
  p.likes += (reaction ? 1 : 0) - (prev ? 1 : 0); p.myReaction = reaction; p.liked = !!reaction;
  renderFeed(key);
  try { await S.api.react(p.id, reaction, prev); } catch (err) { Object.assign(p, before); renderFeed(key); toast(errText(err)); }
}
function closePicker() { document.querySelectorAll('.rpick').forEach(x => x.remove()); }
function openPicker(btn) {
  if (!needUser()) return;
  closePicker();
  if (btn.dataset.clike) { // মন্তব্যের রিয়্যাক্ট
    const c = cmScope(btn).list.find(x => String(x.id) === btn.dataset.clike); if (!c) return;
    const pk = document.createElement('div'); pk.className = 'rpick small'; pk.setAttribute('role', 'menu');
    pk.innerHTML = REACTIONS.map(([k, e, n], i) => `<button data-creact="${k}" data-cid="${esc(c.id)}" class="${c.myReaction === k ? 'on' : ''}" aria-label="${n}" style="--i:${i}"><span class="rx-tip">${n}</span>${rxIcon(k, 34)}</button>`).join('');
    btn.parentElement.appendChild(pk);
    pk.style.left = `${Math.max(-6, btn.offsetLeft + btn.offsetWidth / 2 - 30)}px`;   // বাটনের ঠিক উপরে
    placePicker(pk); return;
  }
  const key = feedOf(btn), id = btn.dataset.like, p = findPost(key, id);
  const pk = document.createElement('div'); pk.className = 'rpick'; pk.setAttribute('role', 'menu');
  pk.innerHTML = REACTIONS.map(([k, e, n], i) => `<button data-react="${k}" data-post="${esc(id)}" class="${p.myReaction === k ? 'on' : ''}" aria-label="${n}" style="--i:${i}"><span class="rx-tip">${n}</span>${rxIcon(k, 40)}</button>`).join('');
  btn.closest('.acts').appendChild(pk); placePicker(pk);
}
// উপরে জায়গা না থাকলে (হেডারের নিচে ঢাকা পড়লে) তালিকা বাটনের নিচে দেখাই
function placePicker(pk) {
  const head = document.querySelector('header')?.getBoundingClientRect().bottom || 0;
  if (pk.getBoundingClientRect().top < head + 6) pk.classList.add('below');
  const r = pk.getBoundingClientRect(); if (r.right > innerWidth - 6) pk.style.left = `${Math.max(-8, pk.offsetLeft - (r.right - innerWidth + 8))}px`;
}
let lpTimer = null;
document.addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-like],[data-clike]'); if (!b) { if (!e.target.closest('.rpick')) closePicker(); return; }
  S.suppressClick = false; clearTimeout(lpTimer); lpTimer = setTimeout(() => { S.suppressClick = true; openPicker(b); if (navigator.vibrate) try { navigator.vibrate(15); } catch { /* */ } }, 450);
});
['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, () => clearTimeout(lpTimer), { passive: true }));
document.addEventListener('scroll', () => { clearTimeout(lpTimer); closePicker(); }, { passive: true, capture: true });
document.addEventListener('contextmenu', e => { if (e.target.closest('[data-like],[data-clike]')) e.preventDefault(); });
// কীবোর্ড/মাউস: রিয়্যাক্ট বাটনের উপর মাউস রাখলেও তালিকা খোলে
document.addEventListener('mouseover', e => {
  if (e.target.closest('.rpick')) { clearTimeout(S.pkClose); return; }
  const b = e.target.closest('[data-like],[data-clike]'); if (!b || !matchMedia('(hover:hover)').matches) return;
  clearTimeout(S.pkClose);
  if (b.parentElement.querySelector('.rpick')) return;
  clearTimeout(lpTimer); lpTimer = setTimeout(() => openPicker(b), 600);
});
// মাউস বাটন বা তালিকা থেকে সরে গেলে তালিকা বন্ধ (বাটন আর তালিকার মাঝে যাতায়াত করলে নয়)
document.addEventListener('mouseout', e => {
  const from = e.target.closest('[data-like],[data-clike],.rpick'); if (!from) return;
  const zone = from.closest('.acts, .cm-meta'), to = e.relatedTarget;
  if (to && zone && zone.contains(to)) return;
  clearTimeout(lpTimer);
  clearTimeout(S.pkClose); S.pkClose = setTimeout(closePicker, 250);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePicker(); });

function postMenu(key, p) {
  const u = me(), mine = u && (p.userId === u.id || u.admin);
  openSheet(`<div class="menu">
    ${u && (p.tags || []).some(t => t.id === u.id) ? '<button data-act="untag">আমার ট্যাগ সরিয়ে দিন</button>' : ''}
    ${u && p.userId === u.id && (p.privacy || 'public') === 'public' && !p.groupId && feat('featBoost') ? `<button data-act="boost">${ic('send', 16)} পোস্ট বুস্ট করুন</button>` : ''}
    ${u && p.userId === u.id && !p.pageId && !p.groupId && p.kind === 'normal' && !S.actAs ? `<button data-act="pinme">📌 ${u.pinnedPostId === p.id ? 'প্রোফাইল থেকে পিন সরান' : 'প্রোফাইলের উপরে পিন করুন'}</button>` : ''}
    ${p.pageId && S.curPage?.id === p.pageId && S.curPage.canManage ? `<button data-act="pinpg">📌 ${S.curPage.pinnedPostId === p.id ? 'পিন সরান' : 'পেইজের উপরে পিন করুন'}</button>` : ''}
    ${u && p.userId === u.id && RESOLVE[p.category] ? `<button data-act="resolve">${p.resolvedAt ? 'চিহ্নটি তুলে নিন' : '✅ ' + RESOLVE[p.category][1]}</button>` : ''}
    ${u && p.userId === u.id ? '<button data-act="edit">পোস্ট এডিট করুন</button>' : ''}
    ${mine ? '<button data-act="del" class="danger">পোস্টটি মুছে ফেলুন</button>' : ''}
    ${u && p.userId !== u.id ? `<button data-act="report">পোস্টটি রিপোর্ট করুন</button>${p.pageId ? '' : `<button data-act="block" class="danger">${esc(p.author)}-কে ব্লক করুন</button>`}` : ''}
    ${!u ? '<button data-act="login">রিপোর্ট করতে লগইন করুন</button>' : ''}
    <button data-close>বন্ধ করুন</button></div>`);
  $('#sheet').onclick = async e => {
    const a = e.target.closest('[data-act]')?.dataset.act; if (!a) return;
    if (a === 'login') { closeSheet(); go('me'); }
    if (a === 'save') {
      closeSheet();
      await busy(null, async () => {
        await (p.saved ? S.api.unsavePost(p.id) : S.api.savePost(p.id)); p.saved = !p.saved;
        toast(p.saved ? 'পোস্ট সেভ হয়েছে। ☰ মেনু → সেভ করা পোস্টে পাবেন।' : 'সেভ থেকে সরানো হয়েছে');
        if (key === 'saved' && !p.saved) { S.feeds.saved.posts = S.feeds.saved.posts.filter(x => x.id !== p.id); renderFeed('saved'); }
      });
    }
    if (a === 'report') reportSheet('post', p.id);
    if (a === 'edit') { closeSheet(); openEditPost(p); }
    if (a === 'resolve') {
      closeSheet(); const on = !p.resolvedAt;
      await busy(null, async () => {
        await S.api.resolvePost(p.id, on); const at = on ? new Date().toISOString() : null;
        for (const k in S.feeds) for (const x of [...(S.feeds[k].posts || []), ...(S.feeds[k].urgent || [])]) if (x.id === p.id) x.resolvedAt = at;
        p.resolvedAt = at; renderFeed(key); if (key !== 'home' && S.feeds.home.posts.length) renderFeed('home');
        toast(on ? 'চিহ্ন দেওয়া হয়েছে। সবাই জানবে বিষয়টির সমাধান হয়েছে।' : 'চিহ্ন তুলে নেওয়া হয়েছে');
      });
    }
    if (a === 'boost') boostSheet(p);
    if (a === 'pinme') {
      closeSheet(); const un = me().pinnedPostId === p.id;
      return busy(null, async () => {
        await S.api.pinProfilePost(un ? null : p.id); me().pinnedPostId = un ? null : p.id;
        toast(un ? 'পিন সরানো হয়েছে' : '📌 পোস্টটি আপনার প্রোফাইলের উপরে পিন হয়েছে');
        if (S.view === 'me') loadFeed('me');
      });
    }
    if (a === 'pinpg') { closeSheet(); const pg = S.curPage, un = pg.pinnedPostId === p.id; return busy(null, async () => { await S.api.pinPagePost(pg.id, un ? null : p.id); pg.pinnedPostId = un ? null : p.id; await openPage(pg.id, true); toast(un ? 'পিন সরানো হয়েছে' : 'পোস্টটি পেইজের উপরে পিন হয়েছে'); }); }
    if (a === 'untag') { closeSheet(); await busy(null, async () => { await S.api.untagMe(p.id); p.tags = p.tags.filter(t => t.id !== me().id); renderFeed(key); toast('ট্যাগ সরানো হয়েছে'); }); }
    if (a === 'block') { closeSheet(); blockUser(p.userId, p.author); }
    if (a === 'del') {
      closeSheet();
      if (!(await confirmSheet('পোস্টটি স্থায়ীভাবে মুছে ফেলবেন?', 'মুছুন', true))) return;
      await busy(null, async () => { await S.api.deletePost(p.id); for (const k in S.feeds) S.feeds[k].posts = S.feeds[k].posts.filter(x => x.id !== p.id); renderFeed(key); toast('পোস্ট মুছে ফেলা হয়েছে'); });
    }
  };
}
function reportSheet(type, id) {
  if (!needUser()) return closeSheet();
  const reasons = ['ভুয়া বা ভুল তথ্য', 'গালিগালাজ বা হয়রানি', 'স্প্যাম বা প্রতারণা', 'অশ্লীল বা আপত্তিকর', 'ভুয়া অ্যাকাউন্ট', 'অন্য কারণ'];
  openSheet(`<h2>রিপোর্ট করুন</h2><form id="rform">${reasons.map((r, i) => `<label class="chk"><input type="radio" name="r" value="${esc(r)}" ${i ? '' : 'checked'}> ${esc(r)}</label>`).join('')}
    <label for="rnote">বিস্তারিত (ঐচ্ছিক)</label><input id="rnote" maxlength="200">
    <div class="row" style="margin-top:16px"><button class="btn" style="flex:1">রিপোর্ট পাঠান</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
  $('#rform').onsubmit = e => {
    e.preventDefault();
    const reason = [e.target.r.value, $('#rnote').value.trim()].filter(Boolean).join(': ');
    busy(e.submitter, async () => { await S.api.report(type, id, reason); closeSheet(); toast('ধন্যবাদ। অ্যাডমিন বিষয়টি দেখবেন।'); });
  };
}
async function blockUser(id, name) {
  if (!(await confirmSheet(`${name}-কে ব্লক করবেন? আপনারা একে অপরকে মেসেজ, ফ্রেন্ড রিকোয়েস্ট বা ফলো করতে পারবেন না, আর তার পোস্ট আপনার ফিডে দেখাবে না।`, 'ব্লক করুন', true))) return;
  await busy(null, async () => { await S.api.block(id); toast(`${name}-কে ব্লক করা হয়েছে`); if (S.view === 'user' || S.view === 'thread') back(); loadFeed('home'); refreshBadges(); });
}

// ================================================================ @মেনশন: লিখতে লিখতে নাম বেছে নেওয়া
const MP = document.createElement('div'); MP.className = 'mention-pop'; MP.hidden = true; MP.setAttribute('role', 'listbox'); MP.setAttribute('aria-label', 'কাকে মেনশন করবেন');
document.body.append(MP);
MP.addEventListener('pointerdown', e => e.preventDefault());   // ট্যাপ করলেও লেখার ঘর থেকে ফোকাস যায় না
MP.addEventListener('click', e => { const b = e.target.closest('[data-mi]'); if (b && MP._pick) MP._pick(MP._items[Number(b.dataset.mi)]); });
function closeMention() { MP.hidden = true; MP._owner = null; MP._items = []; }
async function mentionSearch(q) {
  if (!S.mfriends || Date.now() - S.mfriendsAt > 60000) { S.mfriends = await S.api.friends().catch(() => []); S.mfriendsAt = Date.now(); }
  const t = q.trim().toLowerCase(), meId = me()?.id;
  const fr = S.mfriends.filter(f => !t || f.name.toLowerCase().includes(t)).map(f => ({ ...f, friend: true }));
  const others = t ? (await S.api.people({ q: t }).catch(() => [])).filter(u => !fr.some(f => f.id === u.id)) : [];
  return [...fr, ...others].filter(u => u.id !== meId);
}
// বড় লেখার বক্সে কার্সর কোন লাইনে আছে (তালিকাটা ঠিক সেই লাইনের নিচে দেখাতে)
function caretY(el) {
  if (el.tagName !== 'TEXTAREA') return null;
  const cs = getComputedStyle(el), d = document.createElement('div');
  ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'paddingTop', 'paddingLeft', 'paddingRight', 'borderTopWidth', 'borderLeftWidth', 'boxSizing'].forEach(k => { d.style[k] = cs[k]; });
  Object.assign(d.style, { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', width: el.clientWidth + 'px', top: '0', left: '-9999px' });
  d.textContent = el.value.slice(0, el.selectionStart ?? el.value.length);
  const m = document.createElement('span'); m.textContent = '\u200b'; d.append(m); document.body.append(d);
  const top = m.offsetTop - el.scrollTop, h = m.offsetHeight || parseFloat(cs.fontSize) * 1.5; d.remove();
  const max = el.clientHeight; return { top: Math.max(0, Math.min(top, max)), bottom: Math.max(0, Math.min(top + h, max)) };
}
// store: Map(id → নাম) — এই লেখায় কাকে কাকে মেনশন করা হলো
function attachMention(el, store) {
  if (!el || el._mention) return; el._mention = true;
  let idx = 0, range = null, seq = 0;
  const position = () => {
    const r0 = el.getBoundingClientRect(), cy = caretY(el), r = cy == null ? r0 : { left: r0.left, width: r0.width, top: r0.top + cy.top, bottom: r0.top + cy.bottom }, w = Math.min(Math.max(r.width, 240), 340, innerWidth - 16);
    MP.style.left = Math.min(Math.max(8, r.left), innerWidth - w - 8) + 'px'; MP.style.width = w + 'px';
    const h = Math.min(MP.scrollHeight || 200, 260), below = innerHeight - r.bottom;
    if (below < h + 12 && r.top > below) { MP.style.top = ''; MP.style.bottom = (innerHeight - r.top + 4) + 'px'; } else { MP.style.bottom = ''; MP.style.top = (r.bottom + 4) + 'px'; }
  };
  const draw = () => {
    MP.innerHTML = MP._items.map((u, i) => `<button type="button" role="option" aria-selected="${i === idx}" class="mp-row${i === idx ? ' on' : ''}" data-mi="${i}">${av(u, 'sm')}<span class="mp-n"><b>${esc(u.name)}</b><small>${u.friend ? 'বন্ধু' : esc(u.union || '')}</small></span></button>`).join('');
    MP.hidden = false; position();
  };
  const pick = u => {
    if (!u || !range) return;
    const v = el.value, before = v.slice(0, range.start), after = v.slice(range.end).replace(/^ /, ''), ins = '@' + u.name + ' ';
    el.value = before + ins + after; const pos = (before + ins).length; el.setSelectionRange(pos, pos);
    store.set(u.id, u.name); closeMention(); el.focus();
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const update = async () => {
    const pos = el.selectionStart ?? el.value.length, m = el.value.slice(0, pos).match(/(^|\s)@([^\s@]{0,20}(?: [^\s@]{1,20})?)$/);
    if (!m) { if (MP._owner === el) closeMention(); return; }
    const q = m[2]; range = { start: pos - q.length - 1, end: pos };
    const my = ++seq, list = await mentionSearch(q);
    if (my !== seq || document.activeElement !== el) return;
    if (!list.length) { if (MP._owner === el) closeMention(); return; }
    MP._owner = el; MP._pick = pick; MP._items = list.slice(0, 6); idx = 0; draw();
  };
  el.addEventListener('input', update); el.addEventListener('click', update);
  el.addEventListener('keydown', e => {
    if (MP.hidden || MP._owner !== el) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + MP._items.length) % MP._items.length; draw(); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); pick(MP._items[idx]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeMention(); }
  }, true);
  el.addEventListener('blur', () => setTimeout(() => { if (MP._owner === el && document.activeElement !== el) closeMention(); }, 120));
}
// জমা দেওয়ার সময়: লেখায় এখনো "@নাম" আছে এমন মানুষদের id
const mentionIds = (text, store) => [...store].filter(([, name]) => text.includes('@' + name)).map(([id]) => id);
document.addEventListener('scroll', e => { if (!MP.hidden && !MP.contains(e.target)) closeMention(); }, { passive: true, capture: true });

// ================================================================ পোস্ট তৈরি (ফেসবুকের মতো)
const PRIVACY = { public: ['globe', 'পাবলিক', 'যে কেউ দেখতে পারবে'], friends: ['users', 'বন্ধুরা', 'শুধু আপনার বন্ধুরা'], only_me: ['lock', 'শুধু আমি', 'শুধু আপনি দেখবেন'] };
const MAX_PHOTOS = 10;
S.draft = null;
function newDraft(opts = {}) { return { body: '', category: POST_CATS[0], photos: [], tags: [], mentions: new Map(), privacy: local.get('privacy', 'public'), bg: '', poll: null, event: null, link: null, linkOff: '', ...opts }; }
const BGS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'];
const BG_MAX = 150;
const canBg = d => !d.photos.length && !d.poll && !d.shared && (d.body || '').trim().length <= BG_MAX;
const URL_RE = /https?:\/\/[^\s<>"']+/i;
const BLOOD_OK = d => d.category === 'সাহায্য চাই' && !d.pageId && !d.groupId;
const RESOLVE = { 'সাহায্য চাই': ['✅ সমাধান হয়েছে', 'সমাধান হয়েছে চিহ্ন দিন'], 'হারানো-প্রাপ্তি': ['✅ পাওয়া গেছে', 'পাওয়া গেছে চিহ্ন দিন'], 'কেনা-বেচা': ['✅ বিক্রি হয়ে গেছে', 'বিক্রি হয়ে গেছে চিহ্ন দিন'] };
const localDT = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 16); };
function linkCardHtml(l, rm) {
  if (!l?.url || !/^https?:\/\//i.test(l.url)) return '';
  const img = l.image && /^https:\/\//i.test(l.image) ? `<img src="${esc(l.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
  return `<div class="lnk-wrap">${rm ? `<button type="button" class="lnk-x" data-rmlink aria-label="লিংকের প্রিভিউ বাদ দিন">${ic('close', 14)}</button>` : ''}<a class="lnk" href="${esc(l.url)}" target="_blank" rel="noopener nofollow ugc">${img}<span class="lnk-b"><span class="lnk-site">${esc(l.site || '')}</span><b>${esc(l.title || l.url)}</b>${l.desc ? `<span class="lnk-d">${esc(l.desc)}</span>` : ''}</span></a></div>`;
}
function openPostComposer(opts = {}, then) {
  if (!needUser()) return;
  if (!S.draft || S.draft.editId || S.draft.albumId !== opts.albumId || S.draft.pageId !== opts.pageId || S.draft.groupId !== opts.groupId) S.draft = newDraft(opts);
  renderComposerSheet();
  if (then === 'photo') setTimeout(() => $('#pc-file')?.click(), 50);
  if (then === 'tag') tagPicker();
  if (then === 'privacy') privacyPicker();
}
// পোস্ট এডিট: একই কম্পোজারে আগের লেখা, ছবি, ট্যাগ ও প্রাইভেসি নিয়ে খোলে
function openEditPost(p) {
  if (!needUser()) return;
  const raw = p.rawImages || p.images || [];
  S.draft = { editId: p.id, body: p.body || '', category: p.category || POST_CATS[0], privacy: p.privacy || 'public',
    photos: (p.images || []).map((url, i) => ({ url, keep: raw[i] ?? url })), tags: (p.tags || []).map(t => ({ ...t })), mentions: new Map((p.mentions || []).map(m => [m.id, m.name])),
    pageId: p.pageId, groupId: p.groupId, shared: !!p.sharedPostId, title: 'পোস্ট এডিট করুন', authorName: p.pageId ? p.author : '', orig: raw.slice() };
  S.draft.start = draftSig(S.draft);
  renderComposerSheet();
}
const draftSig = d => JSON.stringify([d.body.trim(), d.category, d.privacy, d.photos.map(x => x.keep || x.url), d.tags.map(t => t.id).sort(), mentionIds(d.body.trim(), d.mentions).sort()]);
function renderComposerSheet() {
  const d = S.draft, u = me(), own = !d.pageId && !d.groupId, pv = PRIVACY[d.privacy], photosOk = !d.shared && !d.poll;
  const extras = !d.editId && !d.shared && !d.albumId;
  const tagLine = d.tags.length ? ` <span class="pc-with">— ${d.tags.length === 1 ? `<b>${esc(d.tags[0].name)}</b>-এর সাথে` : d.tags.length === 2 ? `<b>${esc(d.tags[0].name)}</b> ও <b>${esc(d.tags[1].name)}</b>-এর সাথে` : `<b>${esc(d.tags[0].name)}</b> ও আরও ${bn(d.tags.length - 1)} জনের সাথে`}</span>` : '';
  openSheet(`<div class="pc">
    <div class="pc-head"><b>${esc(d.title || 'পোস্ট তৈরি করুন')}</b><button class="pc-x" data-close aria-label="বন্ধ করুন">${ic('close', 20)}</button></div>
    <div class="pc-author">${d.pageId && d.authorName ? entAv({ name: d.authorName, avatar: d.authorAvatar }) : av(u)}<div><div class="pc-name"><b>${esc(d.authorName || u.name)}</b>${tagLine}</div>
      ${d.albumId ? `<span class="pc-priv static" title="অ্যালবামের প্রাইভেসি">${ic(pv[0], 14)} ${pv[1]}</span>` : own ? `<button class="pc-priv" id="pc-priv" aria-label="কারা দেখবে: ${pv[1]}">${ic(pv[0], 14)} ${pv[1]} ▾</button>` : `<span class="pc-priv static">${ic('globe', 14)} পাবলিক</span>`}</div></div>
    ${d.albumId ? `<div class="pc-album">${ic('album', 16)} অ্যালবাম: <b>${esc(d.albumName)}</b></div>` : ''}
    <textarea id="pc-text" class="${d.bg && canBg(d) ? 'pc-bg ' + d.bg : ''}" maxlength="1000" placeholder="${d.poll ? 'প্রশ্নটি লিখুন… (যেমন: কোন রাস্তা আগে মেরামত হওয়া দরকার?)' : `আপনার মনে কী আছে, ${esc(u.name.split(' ')[0])}? (কাউকে উল্লেখ করতে @ লিখুন)`}">${esc(d.body)}</textarea>
    ${extras && d.bgOpen && !d.photos.length && !d.poll ? `<div class="pc-bgs" role="radiogroup" aria-label="ব্যাকগ্রাউন্ড রং"><button type="button" class="pc-sw none${d.bg ? '' : ' on'}" data-bg="" aria-label="কোনো রং নয়">✕</button>${BGS.map(g => `<button type="button" class="pc-sw ${g}${d.bg === g ? ' on' : ''}" data-bg="${g}" aria-label="রং ${g.slice(1)}"></button>`).join('')}${(d.body || '').trim().length > BG_MAX ? `<span class="mut pc-bgnote">রঙিন পোস্ট ${bn(BG_MAX)} অক্ষরের মধ্যে হয়</span>` : ''}</div>` : ''}
    ${d.poll ? `<div class="pc-poll"><div class="pc-blk-h">${ic('poll', 16)} পোল<button type="button" class="link" data-rmpoll>বাদ দিন</button></div>${d.poll.map((o, i) => `<div class="pc-po"><input class="f pc-poll-opt" data-pi="${i}" maxlength="80" placeholder="অপশন ${bn(i + 1)}" value="${esc(o)}">${d.poll.length > 2 ? `<button type="button" data-rmopt="${i}" aria-label="অপশন বাদ দিন">${ic('close', 14)}</button>` : ''}</div>`).join('')}${d.poll.length < 4 ? '<button type="button" class="link pc-addopt" data-addopt>+ আরেকটি অপশন</button>' : ''}</div>` : ''}
    ${d.event ? `<div class="pc-ev"><div class="pc-blk-h">${ic('calendar', 16)} অনুষ্ঠানের সময় ও জায়গা<button type="button" class="link" data-rmev>বাদ দিন</button></div><label class="pc-evl">কবে, কখন<input type="datetime-local" class="f" id="pc-ev-at" min="${localDT(new Date())}" value="${esc(d.event.at || '')}"></label><label class="pc-evl">কোথায়<input class="f" id="pc-ev-place" maxlength="120" placeholder="যেমন: উথুরা স্কুল মাঠ" value="${esc(d.event.place || '')}"></label><p class="mut pc-evn">যারা "যাব" চাপবেন তারা অনুষ্ঠানের আগের দিন রিমাইন্ডার পাবেন।</p></div>` : ''}
    ${extras && BLOOD_OK(d) ? `<div class="pc-blood"><label for="pc-bg">🩸 রক্ত লাগবে?</label><select class="f" id="pc-bg"><option value="">না</option>${BLOOD_GROUPS.map(g => `<option ${d.blood === g ? 'selected' : ''}>${g}</option>`).join('')}</select>${d.blood ? `<p class="mut">উপজেলার যেসব ${esc(d.blood)} ডোনার গত ৯০ দিনে রক্ত দেননি, তারা নোটিফিকেশন পাবেন। পোস্টটি পাবলিক থাকলে তবেই পাঠানো হবে।</p>` : ''}</div>` : ''}
    <div id="pc-link">${!d.photos.length && d.link ? linkCardHtml(d.link, true) : ''}</div>
    ${d.photos.length ? `<div class="pc-photos">${d.photos.map((ph, i) => `<div class="pc-ph"><img loading="lazy" decoding="async" src="${esc(ph.url)}" alt="ছবি ${bn(i + 1)}"><button type="button" data-rmph="${i}" aria-label="ছবি বাদ দিন">${ic('close', 14)}</button></div>`).join('')}
      ${d.photos.length < MAX_PHOTOS && photosOk ? `<label class="pc-ph add" aria-label="আরও ছবি">${ic('plus', 24)}<span>${bn(d.photos.length)}/${bn(MAX_PHOTOS)}</span><input type="file" accept="image/*" multiple class="pc-more" hidden></label>` : ''}</div>` : ''}
    <div class="pc-foot"><div class="pc-add"><span class="pc-add-l">যোগ করুন</span>
      ${photosOk ? `<label class="pc-tool" title="ছবি" aria-label="ছবি যোগ করুন">${ic('photo', 22)}<input type="file" id="pc-file" accept="image/*" multiple hidden></label>` : ''}
      ${own ? `<button class="pc-tool" id="pc-tag" title="বন্ধুদের ট্যাগ করুন" aria-label="বন্ধুদের ট্যাগ করুন">${ic('tag', 22)}</button>` : ''}
      ${extras && !d.photos.length && !d.poll ? `<button class="pc-tool pc-aa${d.bgOpen ? ' on' : ''}" id="pc-bgt" title="রঙিন ব্যাকগ্রাউন্ড" aria-label="রঙিন ব্যাকগ্রাউন্ড">Aa</button>` : ''}
      ${extras && !d.photos.length && !d.poll ? `<button class="pc-tool" id="pc-pollt" title="পোল" aria-label="পোল যোগ করুন">${ic('poll', 22)}</button>` : ''}
      ${extras && !d.event ? `<button class="pc-tool" id="pc-evt" title="অনুষ্ঠান" aria-label="অনুষ্ঠানের তারিখ যোগ করুন">${ic('calendar', 22)}</button>` : ''}
      <select class="f pc-cat" id="pc-cat" aria-label="পোস্টের ধরন">${POST_CATS.map(c => `<option ${c === d.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
    <button class="btn wide" id="pc-post">${d.editId ? 'সংরক্ষণ করুন' : 'পোস্ট করুন'}</button></div></div>`);
  $('#sheet').classList.add('tall');
  const keep = () => {
    d.body = $('#pc-text')?.value ?? d.body; d.category = $('#pc-cat')?.value || d.category;
    if (d.poll) document.querySelectorAll('#sheet .pc-poll-opt').forEach(x => { d.poll[Number(x.dataset.pi)] = x.value; });
    if (d.event) { d.event.at = $('#pc-ev-at')?.value ?? d.event.at; d.event.place = $('#pc-ev-place')?.value ?? d.event.place; }
  };
  // লিংক দিলে নিচে প্রিভিউ (শিরোনাম, ছবি)
  const linkCheck = () => {
    clearTimeout(S.linkT);
    S.linkT = setTimeout(async () => {
      if (S.draft !== d || d.photos.length || d.editId || d.shared) return;
      const url = (d.body.match(URL_RE) || [])[0]?.replace(/[).,!?।]+$/, '');
      if (!url) { if (d.link) { d.link = null; $('#pc-link') && ($('#pc-link').innerHTML = ''); } return; }
      if (url === d.link?.url || url === d.linkOff || url === S.linkBusy) return;
      S.linkBusy = url;
      const r = await S.api.linkPreview(url).catch(() => null);
      S.linkBusy = '';
      if (S.draft !== d || !r || !(d.body || '').includes(url)) return;
      d.link = { url: r.url || url, title: r.title || '', desc: r.desc || '', image: r.image || '', site: r.site || '' };
      if ($('#pc-link')) $('#pc-link').innerHTML = linkCardHtml(d.link, true);
    }, 800);
  };
  $('#pc-text').oninput = () => {
    keep(); linkCheck();
    const t = $('#pc-text'), on = !!d.bg && canBg(d);
    t.classList.toggle('pc-bg', on); BGS.forEach(g => t.classList.toggle(g, on && d.bg === g));
  };
  $('#pc-cat').onchange = () => { keep(); if ((d.category === 'অনুষ্ঠান' && !d.event && extras) || (d.category === 'সাহায্য চাই') !== !!$('#pc-bg')) { if (d.category === 'অনুষ্ঠান' && !d.event && extras) d.event = { at: '', place: '' }; renderComposerSheet(); } };
  if ($('#pc-bg')) $('#pc-bg').onchange = () => { keep(); d.blood = $('#pc-bg').value; renderComposerSheet(); };
  $('#sheet').oninput = e => { if (e.target.closest('.pc-poll-opt, #pc-ev-at, #pc-ev-place')) keep(); };
  if (!d.link && !d.photos.length) linkCheck();
  attachMention($('#pc-text'), d.mentions);
  const addFiles = async files => {
    keep();
    const list = [...files].filter(f => /^image\//.test(f.type));
    const room = MAX_PHOTOS - d.photos.length;
    if (list.length > room) toast(`একসাথে সর্বোচ্চ ${bn(MAX_PHOTOS)}টি ছবি দেওয়া যায়`);
    for (const f of list.slice(0, room)) { try { const blob = await compress(f); d.photos.push({ blob, url: URL.createObjectURL(blob) }); } catch { /* ছবি নয় */ } }
    renderComposerSheet();
  };
  if ($('#pc-file')) $('#pc-file').onchange = e => addFiles(e.target.files);
  $('#sheet .pc-more')?.addEventListener('change', e => addFiles(e.target.files));
  $('#sheet').onclick = e => {
    const x = e.target.closest('[data-bg],[data-rmpoll],[data-addopt],[data-rmopt],[data-rmev],[data-rmlink],#pc-bgt,#pc-pollt,#pc-evt');
    if (x) {
      keep();
      if (x.id === 'pc-bgt') d.bgOpen = !d.bgOpen;
      else if (x.dataset.bg !== undefined) d.bg = x.dataset.bg;
      else if (x.id === 'pc-pollt') { d.poll = ['', '']; d.bg = ''; d.bgOpen = false; if (d.category === POST_CATS[0]) d.category = 'প্রশ্ন'; }
      else if (x.dataset.rmpoll !== undefined) d.poll = null;
      else if (x.dataset.addopt !== undefined) { if (d.poll.length < 4) d.poll.push(''); }
      else if (x.dataset.rmopt !== undefined) d.poll.splice(Number(x.dataset.rmopt), 1);
      else if (x.id === 'pc-evt') { d.event = { at: '', place: '' }; d.category = 'অনুষ্ঠান'; }
      else if (x.dataset.rmev !== undefined) d.event = null;
      else if (x.dataset.rmlink !== undefined) { d.linkOff = d.link?.url || ''; d.link = null; }
      renderComposerSheet();
      if (x.dataset.addopt !== undefined) document.querySelectorAll('#sheet .pc-poll-opt')[d.poll.length - 1]?.focus();
      if (x.id === 'pc-pollt') $('#sheet .pc-poll-opt')?.focus();
      return;
    }
    const rm = e.target.closest('[data-rmph]'); if (rm) { keep(); const [x] = d.photos.splice(Number(rm.dataset.rmph), 1); if (x.blob) URL.revokeObjectURL(x.url); return renderComposerSheet(); }
    if (e.target.closest('#pc-priv')) { keep(); return privacyPicker(); }
    if (e.target.closest('#pc-tag')) { keep(); return tagPicker(); }
    if (e.target.closest('[data-close]')) { keep(); $('#sheet').classList.remove('tall'); }
  };
  $('#pc-post').onclick = e => {
    keep();
    if (!d.body.trim() && !d.photos.length && !d.shared) return toast(d.poll ? 'পোলের প্রশ্নটি লিখুন' : 'কিছু লিখুন বা ছবি দিন');
    if (d.editId) return saveEdit(e.currentTarget);
    const poll = d.poll ? d.poll.map(o => o.trim()).filter(Boolean) : null;
    if (d.poll && poll.length < 2) return toast('পোলে অন্তত ২টি অপশন লিখুন');
    if (poll && new Set(poll).size !== poll.length) return toast('একই অপশন দুইবার দেওয়া যাবে না');
    if (d.event && !d.event.at) return toast('অনুষ্ঠানের তারিখ ও সময় দিন');
    const evAt = d.event?.at ? new Date(d.event.at) : null;
    if (evAt && (isNaN(evAt) || evAt < Date.now() - 6e4)) return toast('অনুষ্ঠানের সময় ভবিষ্যতের হতে হবে');
    busy(e.currentTarget, async () => {
      if (d.albumId && !d.photos.length) return toast('অ্যালবামে যোগ করতে অন্তত একটা ছবি দিন');
      await S.api.createPost({ body: d.body.trim(), category: d.category, images: d.photos.map(p => p.blob), pageId: d.pageId, groupId: d.groupId, privacy: d.privacy, tags: d.tags.map(t => t.id), mentions: mentionIds(d.body, d.mentions), albumId: d.albumId || null,
        bg: d.bg && canBg(d) ? d.bg : null, poll, eventAt: evAt ? evAt.toISOString() : null, eventPlace: d.event?.place?.trim() || null,
        link: !d.photos.length && d.link ? d.link : null, bloodGroup: BLOOD_OK(d) && d.blood ? d.blood : null });
      if (BLOOD_OK(d) && d.blood && d.privacy === 'public') setTimeout(() => toast(`🩸 উপজেলার ${d.blood} ডোনারদের জানানো হয়েছে`), 1200);
      d.photos.forEach(p => URL.revokeObjectURL(p.url));
      const where = d.pageId ? 'page' : d.groupId ? 'group' : 'home';
      S.draft = null; $('#sheet').classList.remove('tall'); closeSheet(); toast('পোস্ট হয়েছে');
      if (where === 'home') { S.fcat = ''; if (S.union && Number(S.union) !== me().unionId) { S.union = ''; $('#loc').value = ''; } renderFilters(); }
      loadFeed(where);
      if (S.view === 'me') { if (S.pstate.me.tab === 'photos') loadPhotosPane('me'); else loadFeed('me'); }
    });
  };
}
async function saveEdit(btn) {
  const d = S.draft;
  const done = () => { S.draft = null; $('#sheet').classList.remove('tall'); closeSheet(); };
  if (draftSig(d) === d.start) { done(); return toast('কোনো পরিবর্তন হয়নি'); }
  await busy(btn, async () => {
    const kept = d.photos.filter(x => !x.blob).map(x => x.keep);
    await S.api.updatePost(d.editId, { body: d.body.trim(), category: d.category, images: d.photos.map(x => x.blob || x.keep), privacy: d.privacy, tags: d.tags.map(t => t.id), mentions: mentionIds(d.body, d.mentions) },
      d.orig.filter(x => !kept.includes(x)));
    d.photos.forEach(x => { if (x.blob) URL.revokeObjectURL(x.url); });
    const id = d.editId; done(); toast('পোস্ট আপডেট হয়েছে');
    const [fresh] = await S.api.posts({ postId: id }).catch(() => []);
    for (const k in S.feeds) {
      const f = S.feeds[k], i = f.posts.findIndex(x => x.id === id); if (i < 0) continue;
      if (fresh) f.posts[i] = fresh; else f.posts.splice(i, 1);   // প্রাইভেসি বদলে আর দেখা না গেলে সরিয়ে দাও
      if ($('#feed-' + k)) renderFeed(k);
    }
  });
}
function privacyPicker() {
  const d = S.draft;
  openSheet(`<h2>কারা এই পোস্ট দেখতে পারবে?</h2><div class="menu">${Object.entries(PRIVACY).map(([k, [icon, name, desc]]) => `<button data-pv="${k}" class="pv-row${d.privacy === k ? ' on' : ''}"><span class="pv-ic">${ic(icon, 20)}</span><span><b>${name}</b><br><span class="mut">${desc}</span></span>${d.privacy === k ? '<span class="pv-ok">✓</span>' : ''}</button>`).join('')}</div>`);
  $('#sheet').onclick = e => { const b = e.target.closest('[data-pv]'); if (!b) return; d.privacy = b.dataset.pv; if (!d.editId) local.set('privacy', d.privacy); renderComposerSheet(); };
}
async function tagPicker() {
  const d = S.draft;
  openSheet(`<h2>বন্ধুদের ট্যাগ করুন</h2><input type="search" id="tg-q" placeholder="বন্ধু খুঁজুন…" aria-label="বন্ধু খুঁজুন"><div id="tg-list" style="margin-top:8px"><div class="mut">লোড হচ্ছে…</div></div>
    <button class="btn wide" id="tg-done" style="margin-top:12px">সম্পন্ন</button>`);
  const friends = await S.api.friends().catch(() => []);
  const sel = new Map(d.tags.map(t => [t.id, t]));
  const draw = () => {
    const q = ($('#tg-q')?.value || '').trim().toLowerCase(), list = friends.filter(f => !q || f.name.toLowerCase().includes(q));
    $('#tg-list').innerHTML = list.length ? list.map(f => `<label class="person tg-row">${av(f)}<div class="info"><b>${esc(f.name)}</b><div class="sub">${esc(f.union || '')}</div></div><input type="checkbox" data-tg="${esc(f.id)}" ${sel.has(f.id) ? 'checked' : ''} aria-label="${esc(f.name)}-কে ট্যাগ করুন"></label>`).join('')
      : `<p class="mut">${friends.length ? 'কাউকে পাওয়া যায়নি' : 'শুধু বন্ধুদের ট্যাগ করা যায়। আগে "বন্ধু" ট্যাব থেকে বন্ধু যোগ করুন।'}</p>`;
  };
  draw(); $('#tg-q').oninput = draw;
  $('#sheet').onchange = e => { const id = e.target.dataset?.tg; if (!id) return; const f = friends.find(x => String(x.id) === id); if (e.target.checked) sel.set(f.id, { id: f.id, name: f.name }); else sel.delete(f.id); };
  $('#tg-done').onclick = () => { d.tags = [...sel.values()]; renderComposerSheet(); };
}
document.querySelector('[data-compose="photo"] .qi').innerHTML = ic('photo', 24);
$('#cm-open').addEventListener('click', () => openPostComposer(actAsOpts()));
// পোস্ট বক্সের পাশের ছবিতে চাপলে নিজের প্রোফাইল (পেইজ হিসেবে থাকলে পেইজ)
$('#comp-av').addEventListener('click', () => { if (me()) go('me'); else $('#cm-open').click(); });
$('#composer').addEventListener('click', e => { const b = e.target.closest('[data-compose]'); if (b) openPostComposer(actAsOpts(), S.actAs && b.dataset.compose !== 'photo' ? undefined : b.dataset.compose); });

function renderFilters() {
  $('#fchips').innerHTML = ['', ...POST_CATS].map(c => `<button class="chip${c === S.fcat ? ' on' : ''}" data-f="${esc(c)}">${esc(c || 'সব')}</button>`).join('');
  document.querySelectorAll('#scope button').forEach(b => b.classList.toggle('on', b.dataset.s === S.scope));
  $('#locrow').hidden = S.scope === 'friends';
}
$('#fchips').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { S.fcat = b.dataset.f; renderFilters(); loadFeed('home'); } });
$('#scope').addEventListener('click', e => {
  const b = e.target.closest('[data-s]'); if (!b) return;
  if (b.dataset.s === 'friends' && !needUser()) return;
  S.scope = b.dataset.s; renderFilters(); loadFeed('home');
});
$('#loc').addEventListener('change', e => { S.union = e.target.value; local.set('union', S.union); loadFeed('home'); });
$('#more-home').addEventListener('click', e => busy(e.currentTarget, () => loadFeed('home', true)));
// নিচে পৌঁছানোর আগেই পরের পোস্টগুলো নিজে থেকে লোড (বাটনটা থাকে, দরকার হলে চাপা যায়)
let autoMoreT = 0;
addEventListener('scroll', () => {
  if (S.view !== 'home' || Date.now() - autoMoreT < 800) return;
  const b = $('#more-home'); if (!b || b.hidden || b.disabled) return;
  if (innerHeight + scrollY < document.documentElement.scrollHeight - 900) return;
  autoMoreT = Date.now(); b.click();
}, { passive: true });
// নিচে টেনে ছেড়ে দিলে রিফ্রেশ (হোম ও নোটিফিকেশন)
(function pullToRefresh() {
  let y0 = null, ind = null;
  const can = () => (S.view === 'home' || S.view === 'notif') && scrollY <= 0 && !$('#modal').classList.contains('on') && !document.querySelector('.st-ov');
  const hide = () => { ind?.remove(); ind = null; };
  addEventListener('touchstart', e => { y0 = e.touches.length === 1 && can() ? e.touches[0].clientY : null; }, { passive: true });
  addEventListener('touchmove', e => {
    if (y0 == null) return;
    const dy = e.touches[0].clientY - y0;
    if (dy <= 0 || scrollY > 0) { hide(); return; }
    if (!ind) { ind = document.createElement('div'); ind.className = 'ptr'; ind.setAttribute('role', 'status'); ind.setAttribute('aria-label', 'রিফ্রেশ'); ind.innerHTML = ic('refresh', 22); document.body.append(ind); }
    const d = Math.min(dy * 0.5, 90);
    ind.style.transform = `translate(-50%, ${d}px) rotate(${d * 4}deg)`; ind.classList.toggle('ready', d >= 60);
  }, { passive: true });
  addEventListener('touchend', async () => {
    if (y0 == null) return; y0 = null;
    if (!ind?.classList.contains('ready')) return hide();
    ind.classList.add('spin'); ind.style.transform = 'translate(-50%, 60px)';
    try { if (S.view === 'home') await loadFeed('home'); else await loadNotifs(); refreshBadges(); } finally { hide(); }
  });
})();

// ================================================================ বন্ধু
const relBtns = u => {
  const r = u.rel || {};
  const main = r.friend === 'friends' ? `<button class="sbtn ghost" data-fr="menu" data-id="${esc(u.id)}" data-name="${esc(u.name)}">বন্ধু ✓</button>`
    : r.friend === 'received' ? `<button class="sbtn" data-fr="accept" data-id="${esc(u.id)}">গ্রহণ করুন</button><button class="sbtn ghost" data-fr="remove" data-id="${esc(u.id)}">মুছুন</button>`
    : r.friend === 'sent' ? `<button class="sbtn ghost" data-fr="cancel" data-id="${esc(u.id)}">রিকোয়েস্ট বাতিল</button>`
    : `<button class="sbtn" data-fr="add" data-id="${esc(u.id)}">বন্ধু হোন</button>`;
  return main;
};
const personRow = (u, btns) => `<div class="person">${userLink(u.id, av(u))}<div class="info">${userLink(u.id, esc(u.name) + vb(u.verified), 'who-btn')}<div class="sub">${esc(u.union || '')}</div></div><div class="pbtns">${btns}</div></div>`;
async function loadFriends() {
  const box = $('#friends');
  if (!me()) { box.innerHTML = `<div class="card empty">বন্ধু খুঁজতে ও যুক্ত হতে আগে লগইন করুন।<br><button class="btn" style="margin-top:10px" data-go="me">লগইন / অ্যাকাউন্ট খুলুন</button></div>`; return; }
  box.innerHTML = '<div class="skel"></div>';
  try {
    const [reqs, friends, people] = await Promise.all([S.api.friendRequests(), S.api.friends(), S.api.people({})]);
    const fids = new Set(friends.map(f => f.id));
    const sugg = people.filter(p => !fids.has(p.id) && p.rel?.friend !== 'received');
    box.innerHTML = `
      ${reqs.length ? `<div class="card"><div class="sec-h"><h3>ফ্রেন্ড রিকোয়েস্ট <span class="badge">${bn(reqs.length)}</span></h3></div>${reqs.map(u => personRow(u, relBtns({ ...u, rel: { friend: 'received' } }))).join('')}</div>` : ''}
      <div class="card"><div class="sec-h"><h3>পরিচিত হতে পারেন</h3><span class="mut">আপনার এলাকা</span></div>${sugg.length ? sugg.map(u => personRow(u, relBtns(u))).join('') : '<div class="mut">এখন কোনো পরামর্শ নেই</div>'}</div>
      <div class="card"><div class="sec-h"><h3>আমার বন্ধু (${bn(friends.length)})</h3></div>${friends.length ? friends.map(u => personRow(u, `<button class="sbtn ghost" data-dm="${esc(u.id)}">মেসেজ</button>`)).join('') : '<div class="mut">এখনো কোনো বন্ধু নেই। উপরের তালিকা থেকে "বন্ধু হোন" চাপুন।</div>'}</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}

// বন্ধু/ফলো/মেসেজ বাটন — যেকোনো জায়গা থেকে
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-fr],[data-fo],[data-dm],[data-go]'); if (!b) return;
  if (b.dataset.go) return go(b.dataset.go);
  if (!needUser()) return;
  const id = b.dataset.id || b.dataset.fo || b.dataset.dm;
  if (b.dataset.dm) return openThread(id);
  const refresh = () => { if (S.view === 'friends') loadFriends(); if (S.view === 'user') openUser(S.userId, true); if (S.view === 'search') runSearch(); if (S.view === 'notif') loadNotifs(true); refreshBadges(); };
  if (b.dataset.fo) return busy(b, async () => { await (b.dataset.on === '1' ? S.api.unfollow(id) : S.api.follow(id)); refresh(); });
  const act = b.dataset.fr;
  if (act === 'menu') {
    openSheet(`<div class="menu"><button data-act="dm">মেসেজ পাঠান</button><button data-act="unf" class="danger">${esc(b.dataset.name)}-কে আনফ্রেন্ড করুন</button><button data-close>বন্ধ করুন</button></div>`);
    $('#sheet').onclick = async ev => {
      const a = ev.target.closest('[data-act]')?.dataset.act; if (!a) return;
      closeSheet();
      if (a === 'dm') openThread(id);
      if (a === 'unf' && await confirmSheet('আনফ্রেন্ড করবেন?', 'আনফ্রেন্ড', true)) busy(null, async () => { await S.api.removeFriend(id); refresh(); });
    };
    return;
  }
  busy(b, async () => {
    if (act === 'add') { await S.api.sendFriendRequest(id); toast('ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে'); }
    if (act === 'accept') { await S.api.acceptFriend(id); toast('আপনারা এখন বন্ধু'); }
    if (act === 'remove' || act === 'cancel') await S.api.removeFriend(id);
    refresh();
  });
});

// ================================================================ অন্যের প্রোফাইল
// ================================================================ সোশ্যাল লিংক
// [key, নাম, ইনপুটের উদাহরণ]
const SOCIALS = [
  ['facebook', 'Facebook', 'লিংক বা ইউজারনেম, যেমন facebook.com/arif'],
  ['whatsapp', 'WhatsApp', 'WhatsApp নম্বর, যেমন ০১৭১২৩৪৫৬৭৮'],
  ['tiktok', 'TikTok', '@ইউজারনেম বা লিংক'],
  ['youtube', 'YouTube', '@চ্যানেল বা লিংক'],
  ['instagram', 'Instagram', 'ইউজারনেম বা লিংক'],
];
// সার্ভারের নিয়মের সাথে মিল রেখে: প্রতিটা লিংক শুধু নিজের সাইটের
const SOCIAL_RX = {
  facebook: /^https:\/\/(www\.|m\.|web\.)?(facebook\.com|fb\.com)\/.+/i, instagram: /^https:\/\/(www\.)?instagram\.com\/.+/i,
  tiktok: /^https:\/\/(www\.|vm\.|vt\.)?tiktok\.com\/.+/i, youtube: /^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\/.+/i, whatsapp: /^https:\/\/wa\.me\/[0-9]{8,15}$/,
};
const enDigits = t => t.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
// লিংক, ইউজারনেম বা নম্বর থেকে ঠিকঠাক লিংক; খালি হলে '', ভুল হলে null
function normSocial(k, raw) {
  let v = enDigits((raw || '').trim()); if (!v) return '';
  if (k === 'whatsapp') {
    const m = v.match(/wa\.me\/(\d{8,15})/); if (m) return 'https://wa.me/' + m[1];
    let d = v.replace(/[^\d]/g, '');
    if (d.startsWith('00')) d = d.slice(2); else if (/^01\d{9}$/.test(d)) d = '88' + d;
    return /^\d{8,15}$/.test(d) ? 'https://wa.me/' + d : null;
  }
  if (!/^https?:\/\//i.test(v)) {
    if (/^(www\.|m\.|web\.|vm\.|vt\.)?(facebook\.com|fb\.com|instagram\.com|tiktok\.com|youtube\.com|youtu\.be)\//i.test(v)) v = 'https://' + v;
    else {
      const h = v.replace(/^@/, ''); if (!/^[\w.\-]{1,60}$/.test(h)) return null;
      v = { facebook: `https://facebook.com/${h}`, instagram: `https://instagram.com/${h}`, tiktok: `https://www.tiktok.com/@${h}`, youtube: `https://youtube.com/@${h}` }[k];
    }
  }
  v = v.replace(/^http:/i, 'https:');
  return v.length <= 200 && !/[\s<>"'\\]/.test(v) && SOCIAL_RX[k].test(v) ? v : null;
}
const socialHtml = (p, own) => {
  const s = p.social || {}, list = SOCIALS.filter(([k]) => s[k] && SOCIAL_RX[k].test(s[k]));
  if (!list.length) return own ? '<button class="soc-add" id="soc-add">+ সোশ্যাল লিংক যোগ করুন</button>' : '';
  return `<div class="soc-row">${list.map(([k, l]) => `<a class="soc-b soc-${k}" href="${esc(s[k])}" target="_blank" rel="noopener noreferrer" aria-label="${l}-এ ${esc(p.name)}"><span class="soc-ic">${ic('s_' + k, 17)}</span>${l}</a>`).join('')}</div>`;
};
document.addEventListener('click', e => { if (e.target.closest('#soc-add')) openAbout('social'); });

// ================================================================ বন্ধু / ফলোয়ার / ফলো করছেন তালিকা ও তার প্রাইভেসি
const PLIST = { friends: 'বন্ধু', followers: 'ফলোয়ার', following: 'ফলো করছেন' };
const PLIST_IC = { friends: 'users', followers: 'user', following: 'user' };
const statsHtml = p => `<div class="stats stat-tiles">${Object.entries(PLIST).map(([k, l]) => `<button class="stat-b" data-plist="${esc(p.id)}|${k}" aria-label="${l}: ${typeof p[k] === 'number' ? bn(p[k]) : ''} জন, তালিকা দেখুন"><span class="st-ic">${ic(PLIST_IC[k], 16)}</span><b>${typeof p[k] === 'number' ? bn(p[k]) : esc(p[k])}</b><span class="st-l">${l}</span></button>`).join('')}</div>`;
async function peopleSheet(uid, kind) {
  const own = me()?.id === uid;
  openSheet(`<h2>${PLIST[kind]}</h2><div class="skel"></div>`);
  try {
    const [r, prof] = await Promise.all([S.api.listPeople(uid, kind), own ? me() : S.api.profile(uid).catch(() => null)]);
    const vis = r.visibility || prof?.[kind + 'Visibility'] || 'public';
    const head = `<h2>${PLIST[kind]}${r.hidden ? '' : ` <span class="mut" style="font-weight:400;font-size:15px">(${bn(r.list.length)})</span>`}</h2>
      ${own ? `<button class="vis-line" id="pl-priv">${ic(PRIVACY[vis][0], 15)} এই তালিকা কারা দেখবে: <b>${PRIVACY[vis][1]}</b> <span class="link">বদলান</span></button>` : ''}`;
    if (r.hidden) {
      openSheet(`${head}<div class="empty pl-hidden">${ic('lock', 34)}<p><b>${esc(prof?.name || 'এই ব্যক্তি')}</b> ${r.locked ? 'প্রোফাইল লক করে রেখেছেন। শুধু বন্ধুরা তালিকা দেখতে পারেন' : `${PLIST[kind]} তালিকা ${vis === 'friends' ? 'শুধু বন্ধুদের জন্য রেখেছেন' : 'গোপন রেখেছেন'}`}।</p><p class="mut">মোট সংখ্যা প্রোফাইলেই দেখা যাচ্ছে।</p></div><button class="btn ghost wide" data-close>বন্ধ করুন</button>`);
      return;
    }
    const row = u => `<div class="person" data-pname="${esc(u.name.toLowerCase())}">${userLink(u.id, av(u))}<div class="info">${userLink(u.id, esc(u.name) + vb(u.verified), 'who-btn')}<div class="sub">${esc(u.union)}</div></div></div>`;
    openSheet(`${head}${r.list.length > 8 ? `<input class="f" id="pl-q" placeholder="নাম দিয়ে খুঁজুন" style="margin-bottom:8px">` : ''}
      <div class="pl-list">${r.list.length ? r.list.map(row).join('') : `<p class="mut">${own ? 'এখনো কেউ নেই।' : 'এখনো কেউ নেই।'}</p>`}</div>
      <button class="btn ghost wide" data-close style="margin-top:10px">বন্ধ করুন</button>`);
    $('#pl-q')?.addEventListener('input', e => { const t = e.target.value.trim().toLowerCase(); document.querySelectorAll('.pl-list .person').forEach(x => { x.hidden = t && !x.dataset.pname.includes(t); }); });
    $('#sheet').onclick = ev => { if (ev.target.closest('#pl-priv')) return oneListPrivacy(kind, () => peopleSheet(uid, kind)); if (ev.target.closest('[data-user]')) closeSheet(); };
  } catch (e) { openSheet(`<h2>${PLIST[kind]}</h2><div class="empty">${esc(errText(e))}</div><button class="btn ghost wide" data-close>বন্ধ করুন</button>`); }
}
// প্রতিটা তালিকার আলাদা প্রাইভেসি: তালিকা বাছলে পাশের সেটিং বদলানো যায়
function listPrivacySheet() {
  const u = me(); if (!u) return;
  openSheet(`<h2>তালিকা কারা দেখবে</h2>
    <p class="mut" style="margin-top:0">প্রতিটা তালিকার জন্য আলাদা বেছে নিন। লুকালেও অন্যরা প্রোফাইলে মোট সংখ্যা দেখবে, শুধু কারা আছে তা দেখবে না।</p>
    <div class="lp-rows">${Object.entries(PLIST).map(([k, l]) => { const v = u[k + 'Visibility'] || 'public'; return `<button class="lp-row" data-lpk="${k}"><span class="lp-l"><b>${l} তালিকা</b><small>${PRIVACY[v][2]}</small></span><span class="lp-v">${ic(PRIVACY[v][0], 15)} ${PRIVACY[v][1]} ›</span></button>`; }).join('')}</div>
    <button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
  $('#sheet').onclick = ev => { const b = ev.target.closest('[data-lpk]'); if (b) oneListPrivacy(b.dataset.lpk, listPrivacySheet); };
}
function oneListPrivacy(kind, back) {
  const u = me(), cur = u[kind + 'Visibility'] || 'public';
  openSheet(`<h2>${PLIST[kind]} তালিকা কারা দেখবে</h2>
    <p class="mut" style="margin:-4px 0 10px">একটা বেছে নিন</p>
    <div class="pv-pick" role="radiogroup">${Object.entries(PRIVACY).map(([k, [icn, l, sub]]) => `<button class="pv-opt${k === cur ? ' on' : ''}" data-pv1="${k}" role="radio" aria-checked="${k === cur}"><span class="pv-ic">${ic(icn, 20)}</span><span class="pv-tx"><b>${l}</b><small>${sub}</small></span><span class="pv-radio" aria-hidden="true"></span></button>`).join('')}</div>
    <button class="btn ghost wide" id="lp-back" style="margin-top:12px">ফিরে যান</button>`);
  $('#lp-back').onclick = () => back();
  $('#sheet').onclick = ev => {
    const b = ev.target.closest('[data-pv1]'); if (!b) return;
    const v = b.dataset.pv1; if (v === cur) return back();
    busy(b, async () => { await S.api.setListPrivacy({ [kind]: v }); u[kind + 'Visibility'] = v; toast(`${PLIST[kind]} তালিকা: ${PRIVACY[v][1]}`); back(); });
  };
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-plist]'); if (b) { const [uid, kind] = b.dataset.plist.split('|'); return peopleSheet(uid, kind); }
  if (e.target.closest('#listpriv')) listPrivacySheet();
  if (e.target.closest('#plock, .lock-chip')) lockSheet();
  if (e.target.closest('#daily-tog')) { const off = !local.get('daily-off'); local.set('daily-off', off ? 1 : 0); toast(off ? 'কার্ডটি লুকানো হয়েছে' : 'হোমে নামাজের সময় ও আবহাওয়া দেখাবে'); renderMenu(); renderDaily(); }
});
// ফেসবুকের মতো প্রোফাইল লক: বন্ধু ছাড়া কেউ পোস্ট, ছবি, বিস্তারিত ও তালিকা দেখবে না
function lockSheet() {
  const u = me(); if (!u) return;
  const on = !!u.locked;
  openSheet(`<div class="lock-sheet"><div class="lock-ic">🔒</div><h2>${on ? 'আপনার প্রোফাইল লক করা আছে' : 'প্রোফাইল লক করুন'}</h2>
    <p class="mut">${on ? 'এখন শুধু আপনার বন্ধুরা সব দেখতে পারছেন।' : 'লক করলে যারা আপনার বন্ধু নন তারা যা দেখবেন:'}</p>
    <ul class="lock-list">
      <li>✅ শুধু নাম, প্রোফাইল ছবি ও কভার (বড় করে দেখতে পারবেন না)</li>
      <li>🚫 প্রোফাইলের পোস্ট ও ছবি/অ্যালবাম দেখা যাবে না — পাবলিক পোস্টও না</li>
      <li>🚫 এবাউট বা বিস্তারিত তথ্য দেখা যাবে না</li>
      <li>🚫 বন্ধু ও ফলোয়ার তালিকা দেখা যাবে না</li>
      <li>👥 বন্ধুরা আগের মতোই সব দেখবেন; গ্রুপ ও পেইজের পোস্ট এর আওতায় নয়</li>
    </ul>
    <button class="btn wide${on ? ' ghost' : ''}" id="lock-go">${on ? 'প্রোফাইল আনলক করুন' : '🔒 প্রোফাইল লক করুন'}</button>
    <button class="btn ghost wide" data-close style="margin-top:8px">বাতিল</button></div>`);
  $('#lock-go').onclick = e => busy(e.currentTarget, async () => {
    await S.api.setLock(!on); u.locked = !on; closeSheet();
    toast(on ? 'প্রোফাইল আনলক করা হয়েছে' : '🔒 প্রোফাইল লক করা হয়েছে');
    if (S.view === 'me') renderMe(); if (S.view === 'menu') renderMenu();
  });
}

// ================================================================ প্রোফাইল: কভার ছবি, পোস্ট/ছবি ট্যাব, অ্যালবাম
S.pstate = { me: { tab: 'posts', seg: 'all', album: null }, user: { tab: 'posts', seg: 'all', album: null, uid: null }, page: { tab: 'posts', seg: 'all', album: null } };
function coverHtml(p, own) {
  if (p.lockedOut) p = { ...p, _noview: true };   // লক: বন্ধু ছাড়া বড় করে দেখা যাবে না
  return `<div class="cover${p.cover ? '' : ' empty'}">
    ${p.cover ? (p._noview ? `<div class="cover-img"><img loading="lazy" decoding="async" src="${esc(p.cover)}" alt=""></div>` : `<button class="cover-img" data-viewpic="${esc(p.cover)}" aria-label="কভার ছবি দেখুন"><img loading="lazy" decoding="async" src="${esc(p.cover)}" alt=""></button>`) : ''}
    ${own ? `<button class="cover-btn" id="cover-btn">${ic('camera', 16)} ${p.cover ? 'কভার বদলান' : 'কভার ছবি যোগ করুন'}</button>` : ''}
  </div>
  <div class="prof-av">${own
    ? `<label class="av-edit" title="প্রোফাইল ছবি বদলান">${av(p, 'lg')}<span class="av-cam">${ic('camera', 16)}</span><input type="file" id="avfile" accept="image/*" hidden></label>`
    : p.avatar && !p._noview ? `<button class="avbtn" data-viewpic="${esc(p.avatar)}" aria-label="প্রোফাইল ছবি দেখুন">${av(p, 'lg')}</button>` : av(p, 'lg')}</div>`;
}
function profTabs(key) {
  const st = S.pstate[key], tabs = key === 'page' ? [['posts', 'পোস্ট'], ['photos', 'ছবি']] : [['posts', 'পোস্ট'], ['about', 'এবাউট'], ['photos', 'ছবি']];
  return `<div class="ptabs${key === 'page' ? ' two' : ''}" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-ptab="${key}|${k}" aria-selected="${st.tab === k}" class="${st.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div id="${key}-pane"></div>`;
}
function profComposer() {
  const u = me();
  return `<div class="card composer-mini prof-comp"><div class="cm-top">${av(u)}<button class="cm-open" data-pcompose="">আপনার মনে কী আছে, ${esc(u.name.split(' ')[0])}?</button><button class="cm-photo" data-pcompose="photo" aria-label="ছবি দিয়ে পোস্ট করুন" title="ছবি">${ic('photo', 24)}</button></div></div>`;
}
// কোন ট্যাব খোলা সেই অনুযায়ী নিচের অংশ দেখানো
function showProfPane(key) {
  const st = S.pstate[key], pane = $('#' + key + '-pane'), feed = $('#feed-' + key), more = $('#more-' + key);
  if (!pane) return;
  const own = key === 'me';
  if (st.tab === 'posts') {
    pane.innerHTML = own ? profComposer() + '<h2 class="sec-h">আমার পোস্ট</h2>' : key === 'page' && S.curPage?.canManage ? pageComposer(S.curPage) : '';
    feed.hidden = false; loadFeed(key);
  } else if (st.tab === 'about') {
    feed.hidden = true; if (more) more.hidden = true;
    renderAbout(key);
  } else {
    feed.hidden = true; if (more) more.hidden = true;
    loadPhotosPane(key);
  }
}
const profUid = key => (key === 'me' ? me()?.id : key === 'page' ? S.curPage?.ownerId : S.userId);
const ownPane = key => key === 'me' || (key === 'page' && !!S.curPage?.isOwner);
const panePage = key => (key === 'page' ? S.curPage?.id : undefined);
function pageComposer(pg) {
  return `<div class="card composer-mini prof-comp"><div class="cm-top">${entAv(pg)}<button class="cm-open" data-pgcompose="">${esc(pg.name)}-এর পক্ষে কিছু লিখুন…</button><button class="cm-photo" data-pgcompose="photo" aria-label="ছবি দিয়ে পোস্ট করুন" title="ছবি">${ic('photo', 24)}</button><button class="cm-photo cm-album" data-pgcompose="album" aria-label="নতুন অ্যালবাম" title="অ্যালবাম">${ic('album', 24)}</button></div></div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pgcompose]'); if (!b || !S.curPage) return;
  const pg = S.curPage;
  if (b.dataset.pgcompose === 'album') { Object.assign(S.pstate.page, { tab: 'photos', seg: 'albums', album: null }); return openPage(pg.id, true); }
  openPostComposer({ pageId: pg.id, title: `${pg.name}-এর পক্ষে পোস্ট`, authorName: pg.name }, b.dataset.pgcompose || undefined);
});
async function loadPhotosPane(key) {
  const st = S.pstate[key], pane = $('#' + key + '-pane'), uid = profUid(key), own = ownPane(key), pgid = panePage(key), isPage = key === 'page';
  if (!pane || !uid) return;
  const seg = `<div class="seg pseg">${[['all', 'সব ছবি'], ['albums', 'অ্যালবাম']].map(([k, l]) => `<button data-pseg="${key}|${k}" class="${st.seg === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  pane.innerHTML = (st.album ? '' : seg) + '<div class="ph-grid"><div class="skel"></div></div>';
  try {
    if (st.album) {
      const albums = await S.api.albums(uid, pgid), a = albums.find(x => String(x.id) === String(st.album));
      if (!a) { st.album = null; return loadPhotosPane(key); }
      const list = await S.api.photos(uid, VIRTUAL_KINDS.includes(a.id) ? { kind: a.id, pageId: pgid } : { albumId: a.id, pageId: pgid });
      S.phList = list;
      pane.innerHTML = `<div class="album-head"><button class="back" data-albumback="${key}" aria-label="সব অ্যালবাম">←</button>
          <div class="ah-t"><b>${esc(a.name)}</b><span class="mut">${bn(a.count)}টি ছবি${a.virtual || isPage ? '' : ` · ${ic(PRIVACY[a.privacy][0], 13)} ${PRIVACY[a.privacy][1]}`}</span></div>
          ${own && !a.virtual ? `<button class="sbtn" data-albumadd="${esc(a.id)}">${ic('plus', 16)} ছবি যোগ করুন</button><button class="more" data-albummenu="${esc(a.id)}" aria-label="অ্যালবামের অপশন">⋯</button>` : ''}</div>
        ${photoGrid(list, own && !a.virtual ? 'এখনো কোনো ছবি নেই। "ছবি যোগ করুন" চেপে শুরু করুন।' : 'এখনো কোনো ছবি নেই।')}`;
      S.curAlbum = a; S.curAlbumKey = key;
      return;
    }
    if (st.seg === 'all') {
      const list = await S.api.photos(uid, { pageId: pgid }); S.phList = list;
      pane.innerHTML = seg + photoGrid(list, own ? 'এখনো কোনো ছবি নেই। ছবিসহ পোস্ট করলে এখানে দেখাবে।' : 'এখনো কোনো ছবি নেই।');
    } else {
      const albums = await S.api.albums(uid, pgid);
      pane.innerHTML = seg + `<div class="al-grid">
        ${own ? `<button class="al-card new" data-albumnew="${key}">${ic('plus', 30)}<b>নতুন অ্যালবাম</b></button>` : ''}
        ${albums.map(a => `<button class="al-card" data-album="${key}|${esc(a.id)}">${a.cover ? `<img src="${esc(a.cover)}" alt="" loading="lazy" decoding="async">` : `<span class="al-empty">${ic('album', 30)}</span>`}
          <b>${esc(a.name)}</b><span class="mut">${bn(a.count)}টি ছবি${own && !a.virtual && !isPage ? ` · ${ic(PRIVACY[a.privacy][0], 12)}` : ''}</span></button>`).join('')}
      </div>${!albums.length && !own ? '<div class="empty">কোনো অ্যালবাম নেই।</div>' : ''}`;
    }
  } catch (e) { pane.innerHTML = seg + `<div class="empty">${esc(errText(e))}</div>`; }
}
const VIRTUAL_KINDS = ['avatar', 'cover', 'uploads'];
const photoGrid = (list, emptyText) => list.length
  ? `<div class="ph-grid">${list.map((ph, i) => `<button class="ph-cell" data-phi="${i}" aria-label="ছবি ${bn(i + 1)}"><img src="${esc(ph.url)}" alt="" loading="lazy" decoding="async"></button>`).join('')}</div>`
  : `<div class="empty">${emptyText}</div>`;

function albumSheet(a, then, key = 'me') {
  const pv = a?.privacy || 'public', isPage = key === 'page';
  openSheet(`<h2>${a ? 'অ্যালবাম এডিট' : 'নতুন অ্যালবাম'}</h2>
    <label for="al-name">অ্যালবামের নাম</label><input id="al-name" maxlength="60" value="${esc(a?.name || '')}" placeholder="যেমন: ঈদ ২০২৬, ভ্রমণ, পরিবার">
    ${isPage ? '<p class="mut" style="font-size:13px">পেইজের অ্যালবাম সবাই দেখতে পান।</p>' : `<label>কারা দেখবে</label><div class="pv-pick">${Object.entries(PRIVACY).map(([k, [icn, l, sub]]) => `<label class="pv-opt"><input type="radio" name="al-pv" value="${k}" ${k === pv ? 'checked' : ''}><span class="pv-ic">${ic(icn, 20)}</span><span class="pv-tx"><b>${l}</b><small>${sub}</small></span><span class="pv-radio" aria-hidden="true"></span></label>`).join('')}</div>
    ${a ? '<p class="mut" style="font-size:13px">প্রাইভেসি বদলালে অ্যালবামের সব ছবিতেও একই প্রাইভেসি হবে।</p>' : ''}`}
    <button class="btn wide" id="al-save" style="margin-top:12px">${a ? 'সংরক্ষণ' : 'অ্যালবাম তৈরি করুন'}</button><button class="btn ghost wide" data-close style="margin-top:8px">বাতিল</button>`);
  $('#al-save').onclick = e => {
    const name = $('#al-name').value.trim(), privacy = document.querySelector('[name=al-pv]:checked')?.value || 'public';
    if (!name) return toast('অ্যালবামের নাম দিন');
    busy(e.currentTarget, async () => {
      if (a) await S.api.updateAlbum(a.id, { name, privacy: isPage ? 'public' : privacy }); else { const id = await S.api.createAlbum({ name, privacy, pageId: isPage ? S.curPage?.id : null }); S.pstate[key].album = id; }
      closeSheet(); toast(a ? 'অ্যালবাম আপডেট হয়েছে' : 'অ্যালবাম তৈরি হয়েছে'); loadPhotosPane(key); then?.();
    });
  };
}
function openAlbum(uid, albumId) {
  const key = me() && uid === me().id ? 'me' : 'user';
  Object.assign(S.pstate[key], { tab: 'photos', seg: 'albums', album: albumId, uid });
  if (key === 'me') { go('me'); renderMe(); } else openUser(uid, false, true);
}
// নতুন প্রোফাইল বা কভার ছবি: আগে দেখে নিয়ে, নিউজফিডে জানাবেন কিনা বেছে সেভ
function picSheet(kind, blob, page) {
  const url = URL.createObjectURL(blob), cover = kind === 'cover';
  openSheet(`<h2>${cover ? 'নতুন কভার ছবি' : 'নতুন প্রোফাইল ছবি'}</h2>
    <div class="pic-prev${cover ? ' cover' : ''}"><img loading="lazy" decoding="async" src="${url}" alt=""></div>
    <label class="chk"><input type="checkbox" id="pic-share" checked> <span>${page ? 'পেইজে পোস্ট হিসেবে জানান' : 'নিউজফিডে শেয়ার করুন'} <small class="mut">(${page ? `চালু থাকলে পেইজের "${cover ? 'কভার ছবি' : 'প্রোফাইল ছবি'}" অ্যালবামেও জমা থাকবে` : `বন্ধ রাখলে শুধু আপনার "${cover ? 'কভার ছবি' : 'প্রোফাইল ছবি'}" অ্যালবামে থাকবে, অন্যরা দেখবে না`})</small></span></label>
    <button class="btn wide" id="pic-save" style="margin-top:12px">সংরক্ষণ করুন</button><button class="btn ghost wide" data-close style="margin-top:8px">বাতিল</button>`);
  $('#pic-save').onclick = e => busy(e.currentTarget, async () => {
    const share = $('#pic-share').checked;
    if (page) { if (cover) await S.api.setPageCover(page.id, blob, share); else await S.api.setPageAvatar(page.id, blob, share); }
    else if (cover) await S.api.setCover(blob, share); else await S.api.setAvatar(blob, share);
    URL.revokeObjectURL(url); closeSheet();
    if (page) { openPage(page.id, true); loadFeed('page'); } else { renderMe(); renderComposer(); }
    loadFeed('home');
    toast(cover ? 'কভার ছবি বদলানো হয়েছে' : 'প্রোফাইল ছবি বদলানো হয়েছে');
  });
}
function coverMenu() {
  const u = me();
  if (!u.cover) return $('#coverfile').click();
  openSheet(`<div class="menu"><button data-act="up">${ic('camera', 18)} নতুন ছবি আপলোড করুন</button><button data-act="view">${ic('photo', 18)} কভার ছবি দেখুন</button><button data-act="rm" class="danger">কভার ছবি সরান</button><button data-close>বন্ধ করুন</button></div>`);
  $('#sheet').onclick = async ev => {
    const a = ev.target.closest('[data-act]')?.dataset.act; if (!a) return;
    closeSheet();
    if (a === 'up') $('#coverfile').click();
    if (a === 'view') openViewer({ images: [u.cover] });
    if (a === 'rm' && await confirmSheet('কভার ছবি সরাবেন? ছবিটা আপনার "কভার ছবি" অ্যালবামে থেকে যাবে।', 'সরান', true)) await busy(null, async () => { await S.api.removeCover(); renderMe(); toast('কভার ছবি সরানো হয়েছে'); });
  };
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-ptab],[data-pseg],[data-phi],[data-album],[data-albumnew],[data-albumback],[data-albumadd],[data-albummenu],[data-openalbum],[data-viewpic],[data-pcompose],#cover-btn');
  if (!b) return;
  if (b.id === 'cover-btn') return coverMenu();
  if (b.dataset.viewpic) return openViewer({ images: [b.dataset.viewpic] });
  if (b.dataset.pcompose !== undefined) return openPostComposer({}, b.dataset.pcompose || undefined);
  if (b.dataset.openalbum) { const [uid, aid] = b.dataset.openalbum.split('|'); return openAlbum(uid, aid); }
  if (b.dataset.ptab) { const [key, tab] = b.dataset.ptab.split('|'); S.pstate[key].tab = tab; S.pstate[key].album = null; document.querySelectorAll(`[data-ptab^="${key}|"]`).forEach(x => { const on = x.dataset.ptab === b.dataset.ptab; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); }); return showProfPane(key); }
  if (b.dataset.pseg) { const [key, seg] = b.dataset.pseg.split('|'); S.pstate[key].seg = seg; return loadPhotosPane(key); }
  if (b.dataset.album) { const [key, id] = b.dataset.album.split('|'); S.pstate[key].album = id; return loadPhotosPane(key); }
  if (b.dataset.albumback) { S.pstate[b.dataset.albumback].album = null; return loadPhotosPane(b.dataset.albumback); }
  if (b.dataset.albumnew !== undefined) return albumSheet(null, null, b.dataset.albumnew || 'me');
  if (b.dataset.phi) {
    const list = S.phList || [], i = Number(b.dataset.phi);
    return openViewer({ images: list.map(x => x.url), postIds: list.map(x => x.postId) }, i);
  }
  if (b.dataset.albumadd) {
    const a = S.curAlbum, pg = S.curAlbumKey === 'page' ? S.curPage : null;
    return openPostComposer(pg ? { albumId: a.id, albumName: a.name, pageId: pg.id, authorName: pg.name, title: `${pg.name}: অ্যালবামে ছবি যোগ করুন` } : { albumId: a.id, albumName: a.name, privacy: a.privacy, title: 'অ্যালবামে ছবি যোগ করুন' }, 'photo');
  }
  if (b.dataset.albummenu) {
    const a = S.curAlbum, key = S.curAlbumKey || 'me';
    openSheet(`<div class="menu"><button data-act="edit">${ic('edit', 18)} ${key === 'page' ? 'নাম বদলান' : 'নাম ও প্রাইভেসি বদলান'}</button><button data-act="del" class="danger">অ্যালবাম মুছুন</button><button data-close>বন্ধ করুন</button></div>`);
    $('#sheet').onclick = async ev => {
      const act = ev.target.closest('[data-act]')?.dataset.act; if (!act) return;
      if (act === 'edit') return albumSheet(a, null, key);
      closeSheet();
      if (act === 'del' && await confirmSheet(`"${a.name}" অ্যালবাম মুছবেন? ভেতরের ছবির পোস্টগুলো মুছবে না, শুধু অ্যালবাম থেকে বেরিয়ে যাবে।`, 'মুছুন', true))
        await busy(null, async () => { await S.api.deleteAlbum(a.id); S.pstate[key].album = null; S.pstate[key].seg = 'albums'; loadPhotosPane(key); toast('অ্যালবাম মুছে ফেলা হয়েছে'); });
    };
  }
});

// ================================================================ এবাউট (ফেসবুকের মতো): প্রতিটা অংশ চাপলে নিচে এডিট খোলে
const joinedText = d => { if (!d) return ''; const t = new Date(d); return `${bn(t.getFullYear())} সালের ${['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'][t.getMonth()]} থেকে সদস্য`; };
// এবাউটের প্রতিটা অংশ কারা দেখবে
const ABOUT_VIS0 = { works: 'public', educations: 'public', contact: 'only_me', social: 'public', birth: 'only_me', relationship: 'only_me', religion: 'only_me', orgs: 'public' };
const RELATIONSHIPS = { single: 'অবিবাহিত', married: 'বিবাহিত', engaged: 'বাগদান হয়েছে', divorced: 'তালাকপ্রাপ্ত', widowed: 'বিধবা / বিপত্নীক' };
const RELIGIONS = { islam: 'ইসলাম', hindu: 'হিন্দু', buddhist: 'বৌদ্ধ', christian: 'খ্রিস্টান', other: 'অন্যান্য' };
const choiceSelect = (id, map, cur) => `<select class="f" id="${id}"><option value="" ${cur ? '' : 'selected'}>বলতে চাই না</option>${Object.entries(map).map(([k, l]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
const MAX_ORG = 5;
const orgRow = (o, i) => `<div class="we-card"><div class="we-h"><b>সংগঠন ${bn(i + 1)}</b><button type="button" class="we-x" data-werm="org|${i}" aria-label="এই সংগঠন বাদ দিন">${ic('close', 14)}</button></div>
  <label>সংগঠন / ক্লাবের নাম</label><input class="og-name" maxlength="80" value="${esc(o.name || '')}" placeholder="যেমন: ভালুকা যুব সংঘ, রক্তদাতা ক্লাব">
  <label>পদ</label><input class="og-role" maxlength="40" value="${esc(o.role || '')}" placeholder="যেমন: সদস্য, সভাপতি, সাধারণ সম্পাদক"></div>`;
const readOrgsDom = () => [...document.querySelectorAll('#we-orgs .we-card')].map(c => ({ name: c.querySelector('.og-name').value.trim(), role: c.querySelector('.og-role').value.trim() }));
const orgText = o => (o.role ? `${o.name} (${o.role})` : o.name);
const aVis = (u, k) => (u.aboutVis || ABOUT_VIS0)[k] || ABOUT_VIS0[k];
const visSel = (id, cur, label = 'কারা দেখবে') => `<label class="vis-sel" for="${id}"><span>${ic(PRIVACY[cur][0], 14)} ${label}</span><select id="${id}" class="f">${Object.entries(PRIVACY).map(([k, [, l]]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
const visChip = (v, label) => `<span class="ab-vis" title="কারা দেখবে">${ic(PRIVACY[v][0], 11)} ${label ? label + ': ' : ''}${PRIVACY[v][1]}</span>`;
document.addEventListener('change', e => { const l = e.target.closest('.vis-sel'); if (l) l.querySelector('span').innerHTML = `${ic(PRIVACY[e.target.value][0], 14)} ${l.querySelector('span').textContent.trim()}`; });

// কাজ ও শিক্ষা: একাধিক কর্মস্থল ও শিক্ষাপ্রতিষ্ঠান
const MAX_WORK = 3, MAX_EDU = 5;
const SUBJECT_HINTS = ['বিজ্ঞান', 'মানবিক', 'ব্যবসায় শিক্ষা', 'কারিগরি', 'দাখিল', 'আলিম', 'ফাজিল', 'বাংলা', 'ইংরেজি', 'গণিত', 'পদার্থবিজ্ঞান', 'রসায়ন', 'প্রাণিবিজ্ঞান', 'উদ্ভিদবিজ্ঞান', 'হিসাববিজ্ঞান', 'ব্যবস্থাপনা', 'অর্থনীতি', 'রাষ্ট্রবিজ্ঞান', 'ইতিহাস', 'কম্পিউটার সায়েন্স', 'ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং', 'সিভিল ইঞ্জিনিয়ারিং', 'আইন', 'এমবিবিএস', 'নার্সিং', 'কৃষি'];
const workText = w => (w.title ? `${w.title}, ${w.place}` : w.place);
const eduText = e => `${e.school}${e.subject ? ` (${e.subject})` : ''}${e.status === 'running' ? ' · পড়ছেন' : e.year ? ` · পাশ ${bn(e.year)}` : ''}`;
const yearOpts = sel => { const now = new Date().getFullYear(); let o = '<option value="">সন বাছুন</option>'; for (let y = now + 6; y >= 1960; y--) o += `<option value="${y}" ${y === Number(sel) ? 'selected' : ''}>${bn(y)}</option>`; return o; };
const workRow = (w, i) => `<div class="we-card"><div class="we-h"><b>কর্মস্থল ${bn(i + 1)}</b><button type="button" class="we-x" data-werm="work|${i}" aria-label="এই কর্মস্থল বাদ দিন">${ic('close', 14)}</button></div>
  <label>কর্মস্থলের নাম</label><input class="we-place" maxlength="80" value="${esc(w.place || '')}" placeholder="যেমন: ভালুকা সরকারি কলেজ, নিজস্ব দোকান">
  <label>পদবি</label><input class="we-title" maxlength="60" value="${esc(w.title || '')}" placeholder="যেমন: প্রভাষক, ম্যানেজার, মালিক"></div>`;
const eduRow = (e, i) => `<div class="we-card"><div class="we-h"><b>শিক্ষাপ্রতিষ্ঠান ${bn(i + 1)}</b><button type="button" class="we-x" data-werm="edu|${i}" aria-label="এই শিক্ষাপ্রতিষ্ঠান বাদ দিন">${ic('close', 14)}</button></div>
  <label>প্রতিষ্ঠানের নাম</label><input class="ed-school" maxlength="80" value="${esc(e.school || '')}" placeholder="যেমন: ভালুকা পাইলট উচ্চ বিদ্যালয়">
  <div class="we-2"><div><label>অবস্থা</label><select class="f ed-status"><option value="passed" ${e.status !== 'running' ? 'selected' : ''}>পাশ করেছি</option><option value="running" ${e.status === 'running' ? 'selected' : ''}>এখন পড়ছি</option></select></div>
    <div class="ed-yearw" ${e.status === 'running' ? 'hidden' : ''}><label>পাশের সন</label><select class="f ed-year">${yearOpts(e.year)}</select></div></div>
  <label>বিষয় / গ্রুপ</label><input class="ed-subject" maxlength="60" list="subj-hints" value="${esc(e.subject || '')}" placeholder="যেমন: বিজ্ঞান, মানবিক, হিসাববিজ্ঞান"></div>`;
const weList = (kind, list) => { const l = list?.length ? list : [{}]; return l.map(kind === 'work' ? workRow : kind === 'org' ? orgRow : eduRow).join(''); };
const readWorksDom = () => [...document.querySelectorAll('#we-works .we-card')].map(c => ({ place: c.querySelector('.we-place').value.trim(), title: c.querySelector('.we-title').value.trim() }));
const readEdusDom = () => [...document.querySelectorAll('#we-edus .we-card')].map(c => ({ school: c.querySelector('.ed-school').value.trim(), status: c.querySelector('.ed-status').value, year: Number(c.querySelector('.ed-year').value) || 0, subject: c.querySelector('.ed-subject').value.trim() }));
function weSyncAdd() {
  const w = document.querySelectorAll('#we-works .we-card').length, e = document.querySelectorAll('#we-edus .we-card').length, o = document.querySelectorAll('#we-orgs .we-card').length;
  const aw = document.querySelector('[data-weadd=work]'), ae = document.querySelector('[data-weadd=edu]'), ao = document.querySelector('[data-weadd=org]');
  if (aw) aw.hidden = w >= MAX_WORK; if (ae) ae.hidden = e >= MAX_EDU; if (ao) ao.hidden = o >= MAX_ORG;
}
document.addEventListener('click', e => {
  const add = e.target.closest('[data-weadd]'), rm = e.target.closest('[data-werm]');
  if (!add && !rm) return;
  const kind = add ? add.dataset.weadd : rm.dataset.werm.split('|')[0];
  const box = { work: '#we-works', edu: '#we-edus', org: '#we-orgs' }[kind];
  const list = kind === 'work' ? readWorksDom() : kind === 'org' ? readOrgsDom() : readEdusDom();
  if (add) list.push(kind === 'edu' ? { status: 'passed' } : {});
  else list.splice(Number(rm.dataset.werm.split('|')[1]), 1);
  $(box).innerHTML = weList(kind, list);
  weSyncAdd();
  if (add) $(box).lastElementChild?.querySelector('input')?.focus();
});
document.addEventListener('change', e => {
  if (!e.target.classList?.contains('ed-status')) return;
  const w = e.target.closest('.we-card').querySelector('.ed-yearw'); w.hidden = e.target.value === 'running';
});
let unTimer = 0;
document.addEventListener('input', e => {
  if (e.target.id !== 'ab-un') return;
  const msg = $('#ab-un-msg'), u = normUsername(e.target.value);
  if (e.target.value !== u && e.target.value !== '@' + u) e.target.value = u;
  clearTimeout(unTimer); msg.className = 'un-msg mut';
  if (!u) { msg.textContent = 'ইউজারনেম খালি রাখলে কোনো ইউজারনেম থাকবে না।'; return; }
  if (!validUsername(u)) { msg.textContent = 'শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা, _ ও . দিয়ে ৩–২০ অক্ষর; শুরুতে বা শেষে . চলবে না।'; msg.className = 'un-msg bad'; return; }
  msg.textContent = 'যাচাই হচ্ছে…';
  unTimer = setTimeout(async () => {
    const free = await S.api.usernameFree(u).catch(() => null);
    if (normUsername($('#ab-un')?.value) !== u) return;
    msg.textContent = free === null ? '' : free ? `✓ @${u} পাওয়া যাচ্ছে` : `✗ @${u} আগে থেকেই কেউ নিয়েছে`;
    msg.className = 'un-msg ' + (free ? 'good' : 'bad');
  }, 400);
});
const ABOUT = [
  { id: 'intro', ic: 'info', t: 'পরিচিতি',
    chips: u => (u.birthDate || u.birthYear ? visChip(aVis(u, 'birth'), 'জন্মতারিখ') : ''),
    sum: u => [u.username && '@' + u.username, GENDERS[u.gender], birthText(u) && `জন্ম ${birthText(u)}`, u.bio].filter(Boolean).join(' · '), empty: 'ইউজারনেম, লিঙ্গ, জন্মতারিখ ও নিজের সম্পর্কে লিখুন',
    form: u => {
      const sub = (icn, label, val, body) => `<details class="ab-sub"><summary>${ic(icn, 16)} ${label} <small class="mut">· ${val ? esc(val) : 'দেওয়া নেই'}</small></summary>${body}</details>`;
      return sub('user', 'নাম', u.name, `<input id="ab-name" required minlength="2" maxlength="40" aria-label="নাম" value="${esc(u.name)}">`)
        + sub('info', 'ইউজারনেম', u.username && '@' + u.username, `<div class="un-wrap"><span class="un-at">@</span><input id="ab-un" maxlength="21" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="ইউজারনেম" value="${esc(u.username || '')}" placeholder="যেমন: arif.bhaluka"></div>
          <small class="un-msg mut" id="ab-un-msg">ছোট হাতের ইংরেজি অক্ষর, সংখ্যা, _ ও . দিয়ে ৩–২০ অক্ষর। প্রত্যেকের আলাদা।</small>`)
        + sub('users', 'লিঙ্গ', GENDERS[u.gender] || (u.gender === '' ? '' : ''), genderSelect('ab-g', u.gender || '', false))
        + sub('calendar', 'জন্মতারিখ', birthText(u), `${dateSelect('ab-bd', u.birthDate || '', false)}
          ${!u.birthDate && u.birthYear ? `<small class="mut">আগে শুধু সাল (${bn(u.birthYear)}) দেওয়া আছে, পুরো তারিখ দিন।</small>` : ''}
          ${visSel('ab-vis-birth', aVis(u, 'birth'), 'জন্মতারিখ কারা দেখবে')}`)
        + sub('note', 'নিজের সম্পর্কে', u.bio && (u.bio.length > 30 ? u.bio.slice(0, 30) + '…' : u.bio), `<textarea id="ab-bio" maxlength="160" rows="2" aria-label="নিজের সম্পর্কে" placeholder="যেমন: শিক্ষক, রক্তদাতা, ব্যবসায়ী…">${esc(u.bio || '')}</textarea>`);
    },
    read: () => {
      const name = $('#ab-name').value.trim(); if (name.length < 2) return { err: 'নাম অন্তত ২ অক্ষরের দিন' };
      const username = normUsername($('#ab-un').value);
      if (username && !validUsername(username)) return { err: 'ইউজারনেমে শুধু ছোট হাতের ইংরেজি অক্ষর, সংখ্যা, _ ও . দিন (৩–২০ অক্ষর)' };
      const g = $('#ab-g').value;
      const bd = readDate('ab-bd', false); if (bd.err) return bd;
      const u0 = me(), keepOld = !bd && !u0.birthDate && u0.birthYear;   // শুধু পুরনো সাল থাকলে মুছে না ফেলা
      return { name, username, gender: g === 'none' ? '' : g, ...(keepOld ? {} : { birthDate: bd }), bio: $('#ab-bio').value.trim(), aboutVis: { birth: $('#ab-vis-birth').value } };
    } },
  { id: 'work', ic: 'work', t: 'কাজ ও শিক্ষা', chips: u => visChip(aVis(u, 'works'), 'কাজ') + visChip(aVis(u, 'educations'), 'শিক্ষা'),
    sum: u => [...(u.works || []).map(workText), ...(u.educations || []).map(eduText)].join(' · '), empty: 'কর্মস্থল ও শিক্ষাপ্রতিষ্ঠান যোগ করুন',
    form: u => `<details class="ab-sub"><summary>${ic('work', 16)} কাজ <small class="mut">· ${u.works?.length ? `${bn(u.works.length)}টি কর্মস্থল` : 'এখনো যোগ করা হয়নি'}</small></summary>
        ${visSel('ab-vis-works', aVis(u, 'works'), 'কাজের তথ্য কারা দেখবে')}<div id="we-works">${weList('work', u.works)}</div><button type="button" class="we-add" data-weadd="work">${ic('plus', 15)} আরেকটি কর্মস্থল যোগ করুন</button></details>
      <details class="ab-sub"><summary>${ic('school', 16)} শিক্ষা <small class="mut">· ${u.educations?.length ? `${bn(u.educations.length)}টি শিক্ষাপ্রতিষ্ঠান` : 'এখনো যোগ করা হয়নি'}</small></summary>
        ${visSel('ab-vis-edu', aVis(u, 'educations'), 'শিক্ষার তথ্য কারা দেখবে')}<div id="we-edus">${weList('edu', u.educations)}</div><button type="button" class="we-add" data-weadd="edu">${ic('plus', 15)} আরেকটি শিক্ষাপ্রতিষ্ঠান যোগ করুন</button></details>
      <datalist id="subj-hints">${SUBJECT_HINTS.map(x => `<option value="${x}">`).join('')}</datalist>`,
    after: () => weSyncAdd(),
    read: () => {
      const works = [], educations = [];
      for (const w of readWorksDom()) {
        if (!w.place && !w.title) continue;
        if (!w.place) return { err: 'পদবির সাথে কর্মস্থলের নামও দিন' };
        works.push(w.title ? { place: w.place, title: w.title } : { place: w.place });
      }
      for (const e of readEdusDom()) {
        if (!e.school && !e.subject && !e.year) continue;
        if (!e.school) return { err: 'শিক্ষাপ্রতিষ্ঠানের নাম দিন' };
        const o = { school: e.school, status: e.status };
        if (e.status === 'passed' && e.year) o.year = e.year;
        if (e.subject) o.subject = e.subject;
        educations.push(o);
      }
      return { works, educations, aboutVis: { works: $('#ab-vis-works').value, educations: $('#ab-vis-edu').value } };
    } },
  { id: 'personal', ic: 'heart', t: 'সম্পর্ক ও ধর্ম',
    chips: u => visChip(aVis(u, 'relationship'), 'সম্পর্ক') + visChip(aVis(u, 'religion'), 'ধর্ম'),
    sum: u => [RELATIONSHIPS[u.relationship], RELIGIONS[u.religion] && `ধর্ম: ${RELIGIONS[u.religion]}`].filter(Boolean).join(' · '), empty: 'সম্পর্কের অবস্থা ও ধর্ম (ঐচ্ছিক)',
    form: u => `<details class="ab-sub"><summary>${ic('heart', 16)} সম্পর্কের অবস্থা <small class="mut">· ${RELATIONSHIPS[u.relationship] || 'দেওয়া নেই'}</small></summary>
        ${choiceSelect('ab-rel', RELATIONSHIPS, u.relationship)}${visSel('ab-vis-rel', aVis(u, 'relationship'), 'কারা দেখবে')}</details>
      <details class="ab-sub"><summary>${ic('book', 16)} ধর্ম <small class="mut">· ${RELIGIONS[u.religion] || 'দেওয়া নেই'}</small></summary>
        ${choiceSelect('ab-rlg', RELIGIONS, u.religion)}${visSel('ab-vis-rlg', aVis(u, 'religion'), 'কারা দেখবে')}</details>
      <p class="mut ab-note">${ic('lock', 13)} দুটোই ঐচ্ছিক, শুরুতে শুধু আপনি দেখতে পান।</p>`,
    read: () => ({ relationship: $('#ab-rel').value, religion: $('#ab-rlg').value, aboutVis: { relationship: $('#ab-vis-rel').value, religion: $('#ab-vis-rlg').value } }) },
  { id: 'orgs', ic: 'org', t: 'সংগঠন ও ক্লাব', chips: u => visChip(aVis(u, 'orgs')),
    sum: u => (u.orgs || []).map(orgText).join(' · '), empty: 'যেসব সংগঠন বা ক্লাবের সদস্য, যোগ করুন',
    form: u => `${visSel('ab-vis-orgs', aVis(u, 'orgs'), 'সংগঠনের তথ্য কারা দেখবে')}<div id="we-orgs">${weList('org', u.orgs)}</div>
      <button type="button" class="we-add" data-weadd="org">${ic('plus', 15)} আরেকটি সংগঠন যোগ করুন</button>`,
    after: () => weSyncAdd(),
    read: () => {
      const orgs = [];
      for (const o of readOrgsDom()) {
        if (!o.name && !o.role) continue;
        if (!o.name) return { err: 'পদের সাথে সংগঠনের নামও দিন' };
        orgs.push(o.role ? o : { name: o.name });
      }
      return { orgs, aboutVis: { orgs: $('#ab-vis-orgs').value } };
    } },
  { id: 'addr', ic: 'pin', t: 'ঠিকানা',
    sum: u => u.union || '', empty: 'ঠিকানা দিন',
    form: u => addrHtml('ab', u), after: u => addrRefresh('ab', u),
    read: () => { const a = readAddr('ab'); if (!a.upazila || (a.upazila === HOME_UPAZILA && !a.unionId)) return { err: 'ঠিকানা সম্পূর্ণ বাছাই করুন' }; return a; } },
  { id: 'contact', ic: 'mobile', t: 'যোগাযোগ', chips: u => visChip(aVis(u, 'contact')),
    sum: u => (u.phone ? bn(u.phone) : ''), empty: 'মোবাইল নম্বর দিন',
    form: u => `<label for="ab-ph">${ic('mobile', 16)} মোবাইল নম্বর</label><input id="ab-ph" required inputmode="tel" maxlength="17" value="${esc(u.phone ? bn(u.phone) : '')}" placeholder="০১XXXXXXXXX">
      ${visSel('ab-vis-contact', aVis(u, 'contact'), 'প্রোফাইলে নম্বর কারা দেখবে')}
      <p class="mut ab-note">${ic('drop', 13)} ব্লাড ব্যাংকে ডোনার হিসেবে থাকলে লগইন করা ব্যবহারকারীরা সেখানে নম্বর দেখতে পান, যাতে জরুরি দরকারে যোগাযোগ করা যায়।</p>`,
    read: () => { const phone = normPhone($('#ab-ph').value); return validPhone(phone) ? { phone, aboutVis: { contact: $('#ab-vis-contact').value } } : { err: 'সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)' }; } },
  { id: 'blood', ic: 'drop', t: 'রক্তদান',
    sum: u => (u.bloodGroup ? `${u.bloodGroup} · ${u.donorVisible ? 'ব্লাড ব্যাংকে ডোনার' : 'ব্লাড ব্যাংকে দেখানো বন্ধ'}${u.lastDonated ? ` · সর্বশেষ ${bnDate(u.lastDonated)}` : ''}` : ''), empty: 'ব্লাড গ্রুপ দিন',
    pub: u => (u.bloodGroup && u.donorVisible ? `রক্তের গ্রুপ ${u.bloodGroup}` : ''),
    form: u => bloodHtml('ab', u.bloodGroup || '', u.donorVisible, u.lastDonated || ''),
    after: () => { if ($('#ab-never')?.checked) $('#ab-ld').disabled = true; },
    read: () => { const b = readBlood('ab'); if (b.err) return b; return { ...b, donorVisible: !!$('#ab-donor')?.checked }; } },
  { id: 'social', ic: 'link', t: 'সোশ্যাল লিংক', chips: u => visChip(aVis(u, 'social')),
    sum: u => SOCIALS.filter(([k]) => u.social?.[k]).map(([, l]) => l).join(', '), empty: 'Facebook, WhatsApp, TikTok, YouTube, Instagram যোগ করুন',
    form: u => `${visSel('ab-vis-social', aVis(u, 'social'), 'সোশ্যাল লিংক কারা দেখবে')}<div class="soc-edit flat">${SOCIALS.map(([k, l, ph]) => `<label for="soc-${k}" class="soc-l"><span class="soc-ic">${ic('s_' + k, 16)}</span>${l}</label><input id="soc-${k}" maxlength="200" inputmode="${k === 'whatsapp' ? 'tel' : 'url'}" autocomplete="off" value="${esc(k === 'whatsapp' && u.social?.[k] ? '+' + u.social[k].split('/').pop() : (u.social?.[k] || ''))}" placeholder="${esc(ph)}">`).join('')}</div>`,
    read: () => {
      const social = {};
      for (const [k, l] of SOCIALS) {
        const v = normSocial(k, $('#soc-' + k).value);
        if (v === null) { $('#soc-' + k).focus(); return { err: k === 'whatsapp' ? 'WhatsApp নম্বর ঠিক নেই (যেমন ০১৭১২৩৪৫৬৭৮)' : `${l} লিংক ঠিক নেই। ${l}-এর নিজের লিংক বা ইউজারনেম দিন।` }; }
        if (v) social[k] = v;
      }
      return { social, aboutVis: { social: $('#ab-vis-social').value } };
    } },
  { id: 'lists', ic: 'lock', t: 'বন্ধু ও ফলো তালিকার প্রাইভেসি', own: true, action: () => listPrivacySheet(),
    sum: u => Object.entries(PLIST).map(([k, l]) => `${l}: ${PRIVACY[u[k + 'Visibility'] || 'public'][1]}`).join(' · ') },
];
// ================================================================ প্রোফাইলের "পরিচিতি" কার্ড: কোন বিষয় দেখাবে মালিক বেছে নেন
const FEATURED0 = ['works', 'educations', 'addr', 'social', 'joined'];
const DETAIL_ITEMS = [   // [key, নাম, প্রাইভেসির key (না থাকলে সবসময় দেখা যায়)] — "কী দেখাবে" বাছাইয়ের তালিকার ক্রম
  ['blood', 'রক্তের গ্রুপ ও রক্তদান', null], ['social', 'সোশ্যাল লিংক', 'social'],
  ['addr', 'কোথায় থাকেন', null], ['works', 'কাজ', 'works'], ['educations', 'শিক্ষা', 'educations'], ['phone', 'মোবাইল নম্বর', 'contact'],
  ['orgs', 'সংগঠন ও ক্লাব', 'orgs'], ['birth', 'জন্মতারিখ', 'birth'], ['relationship', 'সম্পর্কের অবস্থা', 'relationship'],
  ['gender', 'লিঙ্গ', null], ['religion', 'ধর্ম', 'religion'], ['joined', 'কবে থেকে সদস্য', null],
];
// প্রোফাইলে দেখানোর ক্রম (আগের মতোই)
const PROFILE_ORDER = ['works', 'educations', 'addr', 'gender', 'birth', 'relationship', 'religion', 'orgs', 'phone', 'social', 'joined', 'blood'];
const ALL_DETAIL_KEYS = PROFILE_ORDER.filter(k => k !== 'blood');   // রক্তদানের তথ্য শুধু মালিক বেছে নিলে
const row = (i, t) => `<div class="av-row"><span class="av-i">${ic(i, 18)}</span><span>${t}</span></div>`;
// একেকটা বিষয়ের লাইন (যা দেখার অনুমতি নেই তা আগেই সার্ভার থেকে বাদ পড়ে আসে)
function detailRows(u, keys) {
  const out = [];
  for (const k of keys) {
    if (k === 'works') (u.works || []).forEach(w => out.push(row('work', w.title ? `<b>${esc(w.place)}</b>-এ <b>${esc(w.title)}</b> হিসেবে কাজ করেন` : `<b>${esc(w.place)}</b>-এ কাজ করেন`)));
    if (k === 'educations') (u.educations || []).forEach(e => out.push(row('school', e.status === 'running'
      ? `<b>${esc(e.school)}</b>-এ ${e.subject ? `<b>${esc(e.subject)}</b> নিয়ে ` : ''}পড়ছেন`
      : `<b>${esc(e.school)}</b> থেকে ${e.subject ? `<b>${esc(e.subject)}</b> নিয়ে ` : ''}পাশ করেছেন${e.year ? ` (${bn(e.year)})` : ''}`)));
    if (k === 'addr' && u.union) out.push(row('pin', `থাকেন <b>${esc(u.union)}</b>`));
    if (k === 'gender' && GENDERS[u.gender]) out.push(row('users', GENDERS[u.gender]));
    if (k === 'birth' && birthText(u)) out.push(row('calendar', u.birthDate ? `জন্মতারিখ <b>${birthText(u)}</b>` : `জন্ম <b>${bn(u.birthYear)}</b> সালে`));
    if (k === 'relationship' && RELATIONSHIPS[u.relationship]) out.push(row('heart', RELATIONSHIPS[u.relationship]));
    if (k === 'religion' && RELIGIONS[u.religion]) out.push(row('book', `ধর্ম: <b>${RELIGIONS[u.religion]}</b>`));
    if (k === 'orgs') (u.orgs || []).forEach(o => out.push(row('users', o.role ? `<b>${esc(o.name)}</b>-এর <b>${esc(o.role)}</b>` : `<b>${esc(o.name)}</b>-এর সদস্য`)));
    if (k === 'phone' && u.phone) out.push(row('mobile', `<a href="tel:${esc(u.phone)}" class="link">${bn(u.phone)}</a>`));
    if (k === 'social' && SOCIALS.some(([sk]) => u.social?.[sk])) out.push(socialHtml(u, false));
    if (k === 'joined' && u.joinedAt) out.push(row('calendar', joinedText(u.joinedAt)));
    if (k === 'blood' && u.bloodGroup) out.push(bloodRow(u));
  }
  return out;
}
// প্রোফাইলে নামের নিচে: শুধু আইকন + মান, কোনো শিরোনাম নয়
function introRows(u, keys) {
  const out = [];
  for (const k of keys) {
    if (k === 'works') (u.works || []).forEach(w => out.push(row('work', w.title ? `${esc(w.title)}, ${esc(w.place)}` : esc(w.place))));
    if (k === 'educations') (u.educations || []).forEach(e => out.push(row('school', esc(e.school))));
    if (k === 'addr' && u.union) out.push(row('pin', esc(u.union)));
    if (k === 'gender' && GENDERS[u.gender]) out.push(row('users', GENDERS[u.gender]));
    if (k === 'birth' && birthText(u)) out.push(row('calendar', u.birthDate ? birthText(u) : bn(u.birthYear)));
    if (k === 'relationship' && RELATIONSHIPS[u.relationship]) out.push(row('heart', RELATIONSHIPS[u.relationship]));
    if (k === 'religion' && RELIGIONS[u.religion]) out.push(row('book', RELIGIONS[u.religion]));
    if (k === 'orgs') (u.orgs || []).forEach(o => out.push(row('users', o.role ? `${esc(o.role)}, ${esc(o.name)}` : esc(o.name))));
    if (k === 'phone' && u.phone) out.push(row('mobile', `<a href="tel:${esc(u.phone)}" class="link">${bn(u.phone)}</a>`));
    if (k === 'social' && SOCIALS.some(([sk]) => u.social?.[sk])) out.push(socialHtml(u, false));
    if (k === 'joined' && u.joinedAt) { const t = new Date(u.joinedAt); out.push(row('clock', `${MONTHS_BN[t.getMonth()]} ${bn(t.getFullYear())}`)); }
    if (k === 'blood' && u.bloodGroup) out.push(bloodRow(u, true));
  }
  return out;
}
// রক্তের গ্রুপ ও সর্বশেষ রক্তদান (মালিক "প্রোফাইলে কী দেখাবে"-তে বেছে নিলে তবেই দেখায়)
const bloodRow = (u, short) => row('drop', `<b>${esc(u.bloodGroup)}</b>${u.lastDonated ? `${short ? ' · ' : ' · সর্বশেষ রক্তদান '}${esc(bnDate(u.lastDonated))}` : ''}${u.donorVisible ? ` · ${donateStatus(u.lastDonated)}` : ''}`);
function introCard(u, own) {
  const sel = new Set(u.featured || FEATURED0), rows = introRows(u, PROFILE_ORDER.filter(k => sel.has(k)));
  if (!rows.length && !own) return '';
  return `<div class="intro-card">${rows.join('')}
    ${!rows.length ? '<p class="mut" style="margin:0;font-size:13px">কাজ, শিক্ষা, ঠিকানা ইত্যাদি এখানে দেখাতে পারেন</p>' : ''}
    ${own ? `<button class="intro-edit" id="feat-edit">${ic('edit', 13)} কী কী দেখাবে বাছাই করুন</button>` : ''}</div>`;
}
const profileBase = u => ({ name: u.name, district: u.district, upazila: u.upazila, unionId: u.unionId, bio: u.bio, phone: u.phone, bloodGroup: u.bloodGroup, donorVisible: u.donorVisible, lastDonated: u.lastDonated });
function featuredSheet() {
  const u = me(), cur = new Set(u.featured || FEATURED0);
  const has = k => detailRows(u, [k]).length > 0;
  openSheet(`<h2>কী কী দেখাবে বাছাই করুন</h2>
    <p class="mut" style="margin-top:0">যেগুলোতে টিক দেবেন, প্রোফাইলের উপরে নামের নিচে দেখাবে। এবাউট ট্যাবে সবকিছুই থাকবে। প্রতিটা বিষয় কারা দেখবে, তা প্রাইভেসি সেটিং অনুযায়ী।</p>
    <div class="feat-list">${DETAIL_ITEMS.map(([k, l, vk]) => `<label class="feat-row${has(k) ? '' : ' empty'}">
      <input type="checkbox" value="${k}" ${cur.has(k) ? 'checked' : ''}>
      <span class="feat-t"><b>${l}</b><small>${has(k) ? (vk ? `${ic(PRIVACY[aVis(u, vk)][0], 11)} ${PRIVACY[aVis(u, vk)][1]}` : `${ic('globe', 11)} সবাই দেখে`) : 'এখনো দেওয়া নেই'}</small></span></label>`).join('')}</div>
    <button class="btn wide" id="feat-save" style="margin-top:12px">সংরক্ষণ</button><button class="btn ghost wide" data-close style="margin-top:8px">বাতিল</button>`);
  $('#feat-save').onclick = e => {
    const featured = [...document.querySelectorAll('.feat-list input:checked')].map(x => x.value);
    busy(e.currentTarget, async () => { await S.api.updateProfile({ ...profileBase(me()), featured }); closeSheet(); renderMe(); toast('প্রোফাইল আপডেট হয়েছে'); });
  };
}
document.addEventListener('click', e => { if (e.target.closest('#feat-edit')) featuredSheet(); });

function renderAbout(key) {
  const pane = $('#' + key + '-pane'); if (!pane) return;
  const own = key === 'me', u = own ? me() : S.viewProfile, open = S.pstate[key].open;
  if (!u) return;
  if (!own) {
    const rows = detailRows(u, (u.featured || FEATURED0).includes('blood') ? [...ALL_DETAIL_KEYS, 'blood'] : ALL_DETAIL_KEYS);
    pane.innerHTML = `<div class="card about-view">${u.bio ? `<p class="about-bio">${esc(u.bio)}</p>` : ''}
      ${rows.join('')}
      ${!rows.length && !u.bio ? '<p class="mut" style="margin:0">এখনো কোনো তথ্য দেওয়া নেই।</p>' : ''}</div>`;
    return;
  }
  pane.innerHTML = `<div class="card about-edit">${ABOUT.map(a => {
    const sum = a.sum(u), isOpen = open === a.id;
    return `<div class="ab-sec${isOpen ? ' open' : ''}" data-absec="${a.id}">
      <button class="ab-head" data-abopen="${a.id}" aria-expanded="${isOpen}">
        <span class="ab-ic">${ic(a.ic, 18)}</span>
        <span class="ab-tx"><b>${a.t}${a.chips ? ` ${a.chips(u)}` : a.own ? ` <span class="ab-only">${ic('lock', 11)} শুধু আপনি</span>` : ''}</b>${sum ? `<small>${esc(sum)}</small>` : ''}</span>
        <span class="ab-chev">${a.action ? ic('chevR', 18) : ic('chevD', 18)}</span>
      </button>
      ${isOpen ? `<form class="ab-form" data-abform="${a.id}">${a.form(u)}<div class="ab-btns"><button type="button" class="btn ghost sm" data-abcancel>বাতিল</button><button class="btn sm">সেভ করুন</button></div></form>` : ''}
    </div>`;
  }).join('')}
  ${u.joinedAt ? `<div class="ab-joined">${ic('calendar', 15)} ${joinedText(u.joinedAt)}</div>` : ''}</div>`;
  const a = ABOUT.find(x => x.id === open);
  if (a?.after) a.after(u);
  if (a && !['work', 'intro', 'personal'].includes(a.id)) setTimeout(() => pane.querySelector('.ab-form input, .ab-form select, .ab-form textarea')?.focus({ preventScroll: true }), 30);
}
function openAbout(section) {
  Object.assign(S.pstate.me, { tab: 'about', open: section || null, album: null });
  if (S.view !== 'me') go('me'); else renderMe();
  setTimeout(() => document.querySelector(`[data-absec="${section}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);
}
document.addEventListener('click', e => {
  const h = e.target.closest('[data-abopen]');
  if (h) {
    const id = h.dataset.abopen, a = ABOUT.find(x => x.id === id);
    if (a.action) return a.action();
    S.pstate.me.open = S.pstate.me.open === id ? null : id; renderAbout('me');
    document.querySelector(`[data-absec="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }
  if (e.target.closest('[data-abcancel]')) { S.pstate.me.open = null; renderAbout('me'); }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-abform]'); if (!f) return;
  e.preventDefault();
  const a = ABOUT.find(x => x.id === f.dataset.abform), v = a.read(); if (v.err) return toast(v.err);
  const u = me();
  const base = { name: u.name, district: u.district, upazila: u.upazila, unionId: u.unionId, bio: u.bio, phone: u.phone, bloodGroup: u.bloodGroup, donorVisible: u.donorVisible, lastDonated: u.lastDonated };
  busy(e.submitter, async () => {
    await S.api.updateProfile({ ...base, ...v });
    S.pstate.me.open = null; renderMe(); renderComposer(); toast(`${a.t} সেভ হয়েছে`);
  });
});

async function openUser(id, silent, keepState) {
  if (me() && id === me().id) return go('me');
  if (!keepState && S.pstate.user.uid !== id) Object.assign(S.pstate.user, { tab: 'posts', seg: 'all', album: null });
  S.pstate.user.uid = id;
  if (!silent) { S.userId = id; open('user'); $('#user').innerHTML = '<div class="skel"></div>'; S.feeds.user.posts = []; $('#feed-user').innerHTML = ''; }
  try {
    const p = await S.api.profile(id), r = p.rel || {};
    S.viewProfile = p;
    if (!silent) S.api.profileVisit?.(id).catch(() => {});
    $('#user').innerHTML = `<div class="card prof prof-fb">${coverHtml(p, false)}<h2 style="margin:8px 0 0">${esc(p.name)}${vb(p.verified, true)}</h2>${p.username ? `<div class="uname">@${esc(p.username)}</div>` : ''}
      ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
      ${p.lockedOut ? `<div class="lock-banner">🔒 <div><b>${esc(p.name)} প্রোফাইল লক করে রেখেছেন</b><small>শুধু বন্ধুরা পোস্ট, ছবি ও বিস্তারিত দেখতে পারেন।</small></div></div>` : introCard(p, false)}
      ${statsHtml(p)}
      ${r.blocked ? `<p class="mut">আপনি এই ব্যক্তিকে ব্লক করেছেন।</p><button class="btn ghost" id="unblock">আনব্লক করুন</button>`
      : `<div class="row">${relBtns(p)}<button class="sbtn ${r.following ? 'ghost' : ''}" data-fo="${esc(p.id)}" data-on="${r.following ? 1 : 0}">${r.following ? 'ফলো করছেন ✓' : 'ফলো করুন'}</button><button class="sbtn ghost" data-dm="${esc(p.id)}">মেসেজ</button><button class="more" id="umore" aria-label="আরও">⋯</button></div>`}</div>${r.blocked || p.lockedOut ? '' : profTabs('user')}`;
    $('#unblock')?.addEventListener('click', e => busy(e.currentTarget, async () => { await S.api.unblock(p.id); openUser(p.id, true); loadFeed('user'); }));
    $('#umore')?.addEventListener('click', () => {
      if (!needUser()) return;
      openSheet(`<div class="menu">${me()?.admin ? `<button data-act="admin">${ic('shield', 16)} অ্যাডমিন: কয়েন ও ব্যাজ</button>` : ''}<button data-act="report">প্রোফাইল রিপোর্ট করুন</button><button data-act="block" class="danger">ব্লক করুন</button><button data-close>বন্ধ করুন</button></div>`);
      $('#sheet').onclick = ev => { const a = ev.target.closest('[data-act]')?.dataset.act; if (a === 'admin') adminUserSheet(p, () => openUser(p.id, true)); if (a === 'report') reportSheet('user', p.id); if (a === 'block') { closeSheet(); blockUser(p.id, p.name); } };
    });
    if (r.blocked || p.lockedOut) $('#feed-user').hidden = true; else showProfPane('user');
  } catch (e) { $('#user').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}

// ================================================================ মেসেজ
async function loadConvs() {
  const box = $('#convs');
  if (!me()) { box.innerHTML = `<div class="empty">মেসেজ দেখতে আগে লগইন করুন।<br><button class="btn" style="margin-top:10px" data-go="me">লগইন / অ্যাকাউন্ট খুলুন</button></div>`; return; }
  try {
    const list = await S.api.conversations();
    if (S.actAs && !S.convPage) S.convPage = S.actAs;
    const f = S.convPage, rows = f ? list.filter(c => c.asPage && c.pageId === f.id) : list.filter(c => !c.asPage);   // নিজের পেইজের মেসেজ শুধু পেইজের মেসেজ পাতায়
    const head = f ? `<div class="card conv-filter">${entAv(f)}<div class="info"><b>${esc(f.name)}</b><small>পেইজের মেসেজ · আপনি পেইজের নামে উত্তর দেবেন</small></div>${f.isOwner ? `<button class="sbtn ghost" id="auto-reply">⚡ অটো মেসেজ${f.autoReplyOn ? ' ✓' : ''}</button><button class="sbtn ghost" id="faq-btn">❓ প্রশ্ন-উত্তর${f.faqs?.length ? ' ✓' : ''}</button>` : ''}${S.actAs ? '' : '<button class="link" id="conv-all">← আমার মেসেজ</button>'}</div>` : '';
    box.innerHTML = head + (rows.length ? rows.map(c => `<button class="conv${c.unread ? ' unread' : ''}" data-thread="${esc(c.userId)}" data-tpage="${esc(c.pageId || '')}">${c.pageId && !c.asPage ? entAv({ name: c.name, avatar: c.avatar }) : av(c)}<div class="info"><b>${esc(c.name)}</b>${c.pageId ? `<span class="conv-tag">${c.asPage ? `📄 ${esc(c.pageName)} পেইজে` : '📄 পেইজ'}</span>` : ''}<div class="last">${c.lastMine ? (c.asPage ? 'পেইজ: ' : 'আপনি: ') : ''}${esc(c.last)}</div></div><div style="text-align:right"><div class="time">${esc(ago(c.lastAt))}</div>${c.unread ? `<span class="badge">${bn(c.unread)}</span>` : ''}</div></button>`).join('')
      : `<div class="empty">${f ? 'এই পেইজে এখনো কেউ মেসেজ পাঠাননি।' : 'এখনো কোনো মেসেজ নেই।<br>কারও প্রোফাইলে গিয়ে "মেসেজ" চাপুন।'}</div>`);
    $('#conv-all')?.addEventListener('click', () => { S.convPage = null; loadConvs(); });
    $('#auto-reply')?.addEventListener('click', () => autoReplySheet(f));
    $('#faq-btn')?.addEventListener('click', () => faqSheet(f));
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
$('#convs').addEventListener('click', e => { const b = e.target.closest('[data-thread]'); if (b) openThread(b.dataset.thread, false, b.dataset.tpage ? Number(b.dataset.tpage) : null); });
// pageId থাকলে পেইজের কথোপকথন: সাধারণ মানুষ পেইজের সাথে কথা বলেন, মালিক পেইজের নামে উত্তর দেন
async function openThread(id, silent, pageId = null) {
  if (!silent) { S.threadId = id; S.threadPage = pageId || null; open('thread'); $('#thread').innerHTML = '<div class="mut">লোড হচ্ছে…</div>'; }
  const pid = S.threadPage;
  try {
    if (!silent) S.threadPg = pid ? await S.api.page(pid) : null;
    const pg = S.threadPg, asPage = !!(pg && pg.canManage);
    const [p, msgs] = await Promise.all([silent ? null : S.api.profile(id), S.api.messages(id, pid, asPage)]);
    if (p && pg && !asPage) $('#t-head').innerHTML = `<button class="ent-btn" data-page="${esc(pg.id)}">${entAv(pg)}</button><button class="who-btn" data-page="${esc(pg.id)}">${esc(pg.name)}${vb(pg.verified)}</button>`;
    else if (p) $('#t-head').innerHTML = `${userLink(p.id, av(p, 'sm'))}<span class="t-who">${userLink(p.id, esc(p.name), 'who-btn')}${asPage ? `<small>📄 ${esc(pg.name)}-এর পক্ষে উত্তর দিচ্ছেন</small>` : ''}</span>`;
    if (p?.rel?.blocked) { $('#thread').innerHTML = '<div class="empty">আপনি এই ব্যক্তিকে ব্লক করেছেন।</div>'; return; }
    $('#thread').innerHTML = msgs.length ? msgs.map(m => `<div class="bub${m.mine ? ' mine' : ''}">${linkify(m.body)}<small>${m.auto ? '⚡ অটো মেসেজ · ' : ''}${esc(clock(m.createdAt))}</small></div>`).join('')
      : `<div class="empty">${pid && !asPage ? 'পেইজকে মেসেজ পাঠান 👋<br><small>পেইজের মালিক উত্তর দেবেন।</small>' : 'কথোপকথন শুরু করুন 👋'}</div>`;
    $('#tfaq').innerHTML = pg && !asPage && pg.faqs?.length ? `<small class="mut">দ্রুত প্রশ্ন:</small>${pg.faqs.map((f, i) => `<button type="button" data-faq="${i}">${esc(f.q)}</button>`).join('')}` : '';
    $('#tfaq').hidden = !$('#tfaq').innerHTML;
    window.scrollTo(0, document.body.scrollHeight);
    if (msgs.some(m => !m.mine && !m.read)) { await S.api.markRead(id, pid); refreshBadges(); }
  } catch (e) { $('#thread').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
$('#tfaq').addEventListener('click', e => {
  const b = e.target.closest('[data-faq]'); if (!b || !S.threadPage) return;
  busy(b, async () => { await S.api.askFaq(S.threadPage, Number(b.dataset.faq)); await openThread(S.threadId, true); });
});
$('#tform').addEventListener('submit', e => {
  e.preventDefault(); const body = $('#tmsg').value.trim(); if (!body) return;
  busy(e.submitter, async () => { await S.api.sendMessage(S.threadId, body, S.threadPage); $('#tmsg').value = ''; await openThread(S.threadId, true); $('#tmsg').focus(); });
});
async function refreshBadges() {
  if (!me()) { $('#b-msgs').hidden = $('#b-friends').hidden = $('#b-notif').hidden = true; return; }
  try {
    const [n, reqs, nt] = await Promise.all([S.actAs ? S.api.pageUnread().then(m => m.get(S.actAs.id) || 0) : S.api.unreadCount(), S.actAs ? [] : S.api.friendRequests(), S.api.unreadNotifications(S.actAs?.id)]);
    const setB = (id, v) => { $(id).hidden = !v; $(id).textContent = v > 99 ? '৯৯+' : bn(v); };
    setB('#b-msgs', n); setB('#b-friends', reqs.length); setB('#b-notif', S.view === 'notif' ? 0 : nt);
  } catch { /* badge না দেখালেও চলে */ }
}
function listenMessages() {
  S.stopMsg?.(); S.stopMsg = null; S.stopNotif?.(); S.stopNotif = null;
  if (!me()) return;
  S.stopNotif = S.api.onNotify(() => { if (S.view === 'notif') loadNotifs(); else refreshBadges(); });
  S.stopMsg = S.api.onMessage(m => {
    if (S.view === 'thread' && S.threadId === m.from && (S.threadPage || null) === (m.pageId || null)) openThread(m.from, true);
    else {
      toast('নতুন মেসেজ এসেছে'); if (S.view === 'msgs') loadConvs();
      if (S.view === 'page' && m.pageId && m.pageId === S.curPage?.id && S.curPage.canManage) S.api.pageUnread().then(u => { const n = u.get(m.pageId) || 0, b = $('#pg-unread'); if (b) { b.hidden = !n; b.textContent = bn(n); } }).catch(() => {});
    }
    refreshBadges();
  });
}

// ================================================================ ঠিকানা (ভালুকা → ইউনিয়ন; জেলা → উপজেলা), মোবাইল, ব্লাড গ্রুপ
const HOME = '__home';
function addrHtml(p, cur = {}) {
  const first = cur.upazila === HOME_UPAZILA && cur.district === HOME_DISTRICT ? HOME : (cur.district || '');
  return `<label for="${p}-a1">${ic('pin', 16)} ঠিকানা</label>
    <select class="f" id="${p}-a1" data-addr="${p}" required>
      <option value="" disabled ${first ? '' : 'selected'}>বাছাই করুন</option>
      <option value="${HOME}" ${first === HOME ? 'selected' : ''}>${esc(HOME_UPAZILA)} (${esc(HOME_DISTRICT)})</option>
      ${DISTRICT_ORDER.map(d => `<option value="${esc(d)}" ${first === d ? 'selected' : ''}>${esc(d)} জেলা</option>`).join('')}
    </select><div id="${p}-a2w"></div><div id="${p}-a3w"></div>`;
}
const unionSelect = (id, sel) => `<label for="${id}">${ic('home', 16)} পৌরসভা / ইউনিয়ন</label><select class="f" id="${id}" required><option value="" disabled ${sel ? '' : 'selected'}>বাছাই করুন</option>${S.unions.map(u => `<option value="${esc(u.id)}" ${String(u.id) === String(sel) ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>`;
function addrRefresh(p, cur = {}) {
  const a1 = $(`#${p}-a1`)?.value, w2 = $(`#${p}-a2w`), w3 = $(`#${p}-a3w`); if (!w2) return;
  w3.innerHTML = '';
  if (!a1) { w2.innerHTML = ''; return; }
  if (a1 === HOME) { w2.innerHTML = unionSelect(`${p}-un`, cur.unionId); return; }
  const ups = DISTRICTS[a1] || [], selU = cur.district === a1 ? cur.upazila : '';
  w2.innerHTML = `<label for="${p}-a2">${ic('map', 16)} উপজেলা</label><select class="f" id="${p}-a2" data-addr2="${p}" required><option value="" disabled ${selU ? '' : 'selected'}>বাছাই করুন</option>${ups.map(u => `<option ${u === selU ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`;
  if (a1 === HOME_DISTRICT && selU === HOME_UPAZILA) w3.innerHTML = unionSelect(`${p}-un`, cur.unionId);
}
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.addr) addrRefresh(t.dataset.addr);
  if (t.dataset.addr2) { const p = t.dataset.addr2; $(`#${p}-a3w`).innerHTML = t.value === HOME_UPAZILA && $(`#${p}-a1`).value === HOME_DISTRICT ? unionSelect(`${p}-un`) : ''; }
  if (t.id && t.id.endsWith('-bg')) { const d = $(`#${t.id.replace('-bg', '-donorw')}`); if (d) d.hidden = !t.value || t.value === 'none'; }
});
function readAddr(p) {
  const a1 = $(`#${p}-a1`).value;
  if (a1 === HOME) return { district: HOME_DISTRICT, upazila: HOME_UPAZILA, unionId: Number($(`#${p}-un`).value) || null };
  const up = $(`#${p}-a2`)?.value || '';
  return { district: a1, upazila: up, unionId: up === HOME_UPAZILA && a1 === HOME_DISTRICT ? Number($(`#${p}-un`)?.value) || null : null };
}
const toEnDigits = x => String(x).replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
function normPhone(x) { let v = toEnDigits(x).replace(/[\s\-()]/g, ''); if (v.startsWith('+88')) v = v.slice(3); else if (v.startsWith('88') && v.length === 13) v = v.slice(2); return v; }
const validPhone = v => /^01[3-9]\d{8}$/.test(v);
const fmtPhone = v => v ? bn(v.replace(/^(\d{5})(\d{6})$/, '$1-$2')) : '';
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const DONATE_GAP = 90; // রক্তদানের পর কমপক্ষে ৯০ দিন বিরতি
const daysSince = d => Math.floor((Date.now() - new Date(d + 'T00:00:00').getTime()) / 864e5);
const canDonate = d => !d || daysSince(d) >= DONATE_GAP;
const bnDate = d => new Date(d + 'T00:00:00').toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
function donateStatus(d) {
  if (!d) return '<span class="ok-chip">রক্ত দিতে পারবেন</span>';
  const left = DONATE_GAP - daysSince(d);
  return left <= 0 ? '<span class="ok-chip">রক্ত দিতে পারবেন</span>' : `<span class="wait-chip">আর ${bn(left)} দিন পর পারবেন</span>`;
}
function bloodHtml(p, cur = '', donorVisible = true, lastDonated = '', showVisible = true) {
  return `<label for="${p}-bg">${ic('drop', 16)} ব্লাড গ্রুপ</label><select class="f" id="${p}-bg" required>
    <option value="" disabled ${cur === null ? 'selected' : ''}>বাছাই করুন</option>
    ${BLOOD_GROUPS.map(g => `<option ${g === cur ? 'selected' : ''}>${g}</option>`).join('')}
    <option value="none" ${cur === '' ? 'selected' : ''}>জানা নেই</option></select>
    <div id="${p}-donorw" ${cur ? '' : 'hidden'}>
    <label for="${p}-ld">${ic('calendar', 16)} সর্বশেষ রক্তদানের তারিখ</label>
    <input type="date" id="${p}-ld" max="${today()}" value="${esc(lastDonated)}">
    <label class="chk"><input type="checkbox" id="${p}-never" ${cur && !lastDonated ? 'checked' : ''}> <span>কখনো রক্ত দেননি / তারিখ মনে নেই</span></label>
    <label class="chk" ${showVisible ? '' : 'hidden'}><input type="checkbox" id="${p}-donor" ${donorVisible ? 'checked' : ''}> <span>আমাকে ব্লাড ব্যাংকে ডোনার হিসেবে দেখান। আমার নাম, ব্লাড গ্রুপ, এলাকা ও মোবাইল নম্বর লগইন করা ব্যবহারকারীরা দেখতে পাবেন।</span></label></div>`;
}
const bgBadge = g => g ? `<span class="bg-badge">${ic('drop', 14)} ${esc(g)}</span>` : '';
const WA_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.2-1.2-.2-.2-.5-.3z"/></svg>';
const waLink = phone => `https://wa.me/88${phone}?text=${encodeURIComponent('আসসালামু আলাইকুম, "আমার উপজেলা" অ্যাপের ব্লাড ব্যাংক থেকে আপনার নম্বর পেয়েছি। রক্তের প্রয়োজন ছিল।')}`;
// রক্তের ফোঁটার ভেতরে ব্লাড গ্রুপ
const bloodDrop = g => `<span class="bdrop" role="img" aria-label="ব্লাড গ্রুপ ${esc(g)}"><svg viewBox="0 0 60 72" aria-hidden="true"><path d="M30 2C30 2 6 30 6 46a24 24 0 0 0 48 0C54 30 30 2 30 2z" fill="#e5303f"/></svg><b${g.length > 2 ? ' class="sm"' : ''}>${esc(g)}</b></span>`;
// ব্লাড ব্যাংকের ডোনার প্রোফাইল কার্ড (নিজের কার্ডে আপডেট বাটন)
function donorCard(d, mine) {
  const field = (ic, label, val) => `<div class="df"><span class="dfi" aria-hidden="true">${ic}</span><span class="dft"><span class="dfl">${label}</span><span class="dfv">${val}</span></span></div>`;
  const owner = d.manual && me() && d.addedBy === me().id;
  const top = d.manual
    ? `${av(d, 'md')}<div class="info"><b class="dname">${esc(d.name)}</b>${owner ? ' <span class="tag">আপনার যোগ করা</span>' : ''}<div class="meta">${ic('user', 13)} যোগ করেছেন: <button class="via-btn" data-user="${esc(d.addedBy)}">${esc(d.addedByName)}</button></div></div>`
    : `${userLink(d.id, av(d, 'md'))}<div class="info">${userLink(d.id, esc(d.name), 'who-btn dname')}${mine ? ' <span class="tag">আমি</span>' : ''}<div class="meta">${ic('user', 13)} প্রোফাইল দেখতে নামে চাপুন</div></div>`;
  return `<div class="card dcard${mine || owner ? ' mine' : ''}">
    <div class="dtop">${top}${bloodDrop(d.bloodGroup)}</div>
    <div class="dfields">
      ${field(ic('pin'), 'এলাকা', esc(d.area || '—'))}
      ${field(ic('mobile'), 'মোবাইল', d.phone ? esc(fmtPhone(d.phone)) : '<span class="mut">লগইন করলে দেখা যাবে</span>')}
      ${field(ic('calendar'), 'শেষ রক্তদান', d.lastDonated ? esc(bnDate(d.lastDonated)) : 'জানা নেই')}
      ${field(ic('clock'), 'অবস্থা', donateStatus(d.lastDonated))}
    </div>
    <div class="dacts">${mine
      ? `<button class="dbtn" data-donor-edit>${ic('edit')} তথ্য আপডেট</button><button class="dbtn" id="donated-today">${ic('drop')} আজ রক্ত দিয়েছি</button>`
      : d.phone
        ? `<a class="dbtn icon call-b" href="tel:${esc(d.phone)}" aria-label="কল করুন" title="কল করুন">${ic('phone', 22)}</a>${d.manual ? '' : `<button class="dbtn icon msg-b" data-dm="${esc(d.id)}" aria-label="মেসেজ পাঠান" title="মেসেজ পাঠান">${ic('message', 22)}</button>`}<a class="dbtn icon wa-b" href="${esc(waLink(d.phone))}" target="_blank" rel="noopener" aria-label="WhatsApp" title="WhatsApp">${WA_ICON}</a>${owner ? `<button class="dbtn icon" data-mdedit="${esc(d.manualId)}" aria-label="এডিট করুন" title="এডিট করুন">${ic('edit', 22)}</button><button class="dbtn icon del-b" data-mddel="${esc(d.manualId)}" data-name="${esc(d.name)}" aria-label="মুছে ফেলুন" title="মুছে ফেলুন">${ic('trash', 22)}</button>` : ''}`
        : `<button class="dbtn" data-go="me">${ic('login')} লগইন করে কল, মেসেজ ও WhatsApp করুন</button>`}</div>
  </div>`;
}
// ডোনার যোগ: নিজের ডোনার প্রোফাইল না থাকলে নিজেরটা, থাকলে অন্যের
const hasOwnDonor = () => { const u = me(); return !!(u && u.bloodGroup && u.donorVisible); };
function addDonor() {
  if (!needUser()) return;
  if (hasOwnDonor()) manualDonorSheet(null); else selfDonorSheet();
}
function selfDonorSheet() {
  const u = me();
  openSheet(`<h2>${ic('drop', 22)} নিজের ডোনার প্রোফাইল যোগ করুন</h2>
    <p class="mut" style="margin-top:0">শুধু ব্লাড গ্রুপ আর সর্বশেষ রক্তদানের তারিখ দিন। বাকি তথ্য আপনার প্রোফাইল থেকে নেওয়া হয়েছে, দরকার হলে জমা দেওয়ার আগে বদলে নিন।</p>
    <form id="sdform">
      ${bloodHtml('sd', u.bloodGroup || null, true, u.lastDonated || '', false)}
      <div class="from-profile"><div class="fp-h">${ic('user', 15)} আপনার প্রোফাইল থেকে</div>
        <label for="sd-n">${ic('user', 16)} নাম</label><input id="sd-n" required minlength="2" maxlength="40" value="${esc(u.name)}">
        ${addrHtml('sd', u)}
        <label for="sd-ph">${ic('mobile', 16)} মোবাইল নম্বর</label><input id="sd-ph" required inputmode="tel" maxlength="17" value="${esc(u.phone ? bn(u.phone) : '')}" placeholder="০১XXXXXXXXX"></div>
      <div class="row" style="margin-top:16px"><button class="btn" style="flex:1">ডোনার প্রোফাইল যোগ করুন</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
  addrRefresh('sd', u);
  $('#sdform').onsubmit = ev => {
    ev.preventDefault();
    const blood = readBlood('sd'), addr = readAddr('sd'), phone = normPhone($('#sd-ph').value);
    if (blood.err) return toast(blood.err);
    if (!blood.bloodGroup) return toast('ডোনার হতে ব্লাড গ্রুপ জানা থাকতে হবে');
    if (!addr.upazila || (addr.upazila === HOME_UPAZILA && !addr.unionId)) return toast('ঠিকানা সম্পূর্ণ বাছাই করুন');
    if (!validPhone(phone)) return toast('সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)');
    busy(ev.submitter, async () => {
      await S.api.updateProfile({ name: $('#sd-n').value.trim(), bio: u.bio, ...addr, phone, ...blood, donorVisible: true });
      closeSheet(); toast('আপনার ডোনার প্রোফাইল যোগ হয়েছে 🩸'); renderComposer();
      if (S.view === 'dir') loadBlood(); if (S.view === 'me') renderMe();
    });
  };
}
async function manualDonorSheet(id) {
  let d = { name: '', district: '', upazila: '', unionId: null, phone: '', bloodGroup: null, lastDonated: '' };
  if (id) { try { d = await S.api.manualDonor(id); } catch (e) { return toast(errText(e)); } }
  openSheet(`<h2>${ic(id ? 'edit' : 'plus', 22)} ${id ? 'ডোনার প্রোফাইল এডিট' : 'অন্য কারও ডোনার প্রোফাইল যোগ করুন'}</h2>
    <p class="mut" style="margin-top:0">${id ? 'এই প্রোফাইল আপনি যোগ করেছেন, তাই শুধু আপনিই বদলাতে বা মুছতে পারবেন।' : 'অ্যাপে অ্যাকাউন্ট নেই এমন আত্মীয়, প্রতিবেশী বা পরিচিত কাউকে ডোনার হিসেবে যোগ করুন। শুধু আপনিই এই প্রোফাইল এডিট করতে পারবেন।'}</p>
    <form id="mdform">
      <label for="md-n">${ic('user', 16)} ডোনারের নাম</label><input id="md-n" required minlength="2" maxlength="40" value="${esc(d.name)}">
      ${addrHtml('md', d)}
      <label for="md-ph">${ic('mobile', 16)} ডোনারের মোবাইল নম্বর</label><input id="md-ph" required inputmode="tel" maxlength="17" value="${esc(d.phone ? bn(d.phone) : '')}" placeholder="০১XXXXXXXXX">
      ${bloodHtml('md', d.bloodGroup, true, d.lastDonated || '', false)}
      ${id ? '' : '<label class="chk"><input type="checkbox" id="md-ok" required> <span>আমি ডোনারের অনুমতি নিয়ে তাঁর নাম ও মোবাইল নম্বর যোগ করছি।</span></label>'}
      <div class="row" style="margin-top:16px"><button class="btn" style="flex:1">${id ? 'সেভ করুন' : 'ডোনার যোগ করুন'}</button><button class="btn ghost" type="button" data-close>বাতিল</button></div>
      ${id ? `<button type="button" class="btn ghost wide" id="md-del" style="margin-top:8px;color:var(--r)">${ic('trash', 16)} এই ডোনার প্রোফাইল মুছে ফেলুন</button>` : ''}</form>`);
  addrRefresh('md', d);
  if ($('#md-never')?.checked) $('#md-ld').disabled = true;
  $('#md-del')?.addEventListener('click', () => { closeSheet(); deleteManual(id, d.name); });
  $('#mdform').onsubmit = ev => {
    ev.preventDefault();
    const addr = readAddr('md'), phone = normPhone($('#md-ph').value), blood = readBlood('md');
    if (!addr.upazila || (addr.upazila === HOME_UPAZILA && !addr.unionId)) return toast('ঠিকানা সম্পূর্ণ বাছাই করুন');
    if (!validPhone(phone)) return toast('সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)');
    if (blood.err) return toast(blood.err);
    if (!blood.bloodGroup) return toast('ডোনারের ব্লাড গ্রুপ বাছাই করুন');
    const v = { name: $('#md-n').value.trim(), ...addr, phone, ...blood };
    busy(ev.submitter, async () => {
      if (id) await S.api.updateManualDonor(id, v); else await S.api.addManualDonor(v);
      closeSheet(); toast(id ? 'ডোনার প্রোফাইল আপডেট হয়েছে' : 'ডোনার প্রোফাইল যোগ হয়েছে 🩸'); if (S.view === 'dir') loadBlood();
    });
  };
}
async function deleteManual(id, name) {
  if (!(await confirmSheet(`"${name}"-এর ডোনার প্রোফাইল মুছে ফেলবেন?`, 'মুছুন', true))) return;
  await busy(null, async () => { await S.api.deleteManualDonor(id); toast('মুছে ফেলা হয়েছে'); if (S.view === 'dir') loadBlood(); });
}
document.addEventListener('click', e => {
  if (e.target.closest('[data-add-donor]')) return addDonor();
  const ed = e.target.closest('[data-mdedit]'); if (ed) return manualDonorSheet(Number(ed.dataset.mdedit));
  const dl = e.target.closest('[data-mddel]'); if (dl) return deleteManual(Number(dl.dataset.mddel), dl.dataset.name);
});
function donorEditSheet() {
  if (!needUser()) return;
  const u = me();
  openSheet(`<h2>${ic('drop', 22)} ডোনার তথ্য আপডেট</h2><p class="mut" style="margin-top:0">এখানে বদলালে আপনার সোশ্যাল প্রোফাইলেও বদলে যাবে।</p><form id="dform">
    ${bloodHtml('de', u.bloodGroup || '', u.donorVisible, u.lastDonated || '')}
    <label for="de-ph">${ic('mobile', 16)} মোবাইল নম্বর <span class="mut" style="font-weight:400">(কল ও WhatsApp এই নম্বরে আসবে)</span></label><input id="de-ph" required inputmode="tel" maxlength="17" value="${esc(u.phone ? bn(u.phone) : '')}" placeholder="০১XXXXXXXXX">
    ${addrHtml('de', u)}
    <div class="row" style="margin-top:16px"><button class="btn" style="flex:1">সেভ করুন</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
  addrRefresh('de', u);
  if ($('#de-never')?.checked) $('#de-ld').disabled = true;
  $('#dform').onsubmit = ev => {
    ev.preventDefault();
    const addr = readAddr('de'), phone = normPhone($('#de-ph').value), blood = readBlood('de');
    if (blood.err) return toast(blood.err);
    if (!validPhone(phone)) return toast('সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)');
    if (!addr.upazila || (addr.upazila === HOME_UPAZILA && !addr.unionId)) return toast('ঠিকানা সম্পূর্ণ বাছাই করুন');
    busy(ev.submitter, async () => {
      await S.api.updateProfile({ name: u.name, bio: u.bio, ...addr, phone, ...blood, donorVisible: !!$('#de-donor')?.checked });
      closeSheet(); toast('ডোনার তথ্য আপডেট হয়েছে');
      if (S.view === 'dir') loadBlood(); if (S.view === 'me') renderMe();
    });
  };
}
document.addEventListener('click', e => { if (e.target.closest('[data-donor-edit]')) donorEditSheet(); });
// ব্লাড গ্রুপ ও তারিখ পড়া; ভুল থাকলে বার্তা ফেরত দেয়
function readBlood(p) {
  const bg = $(`#${p}-bg`).value;
  if (!bg) return { err: 'ব্লাড গ্রুপ বাছাই করুন' };
  if (bg === 'none') return { bloodGroup: '', lastDonated: '' };
  const never = $(`#${p}-never`).checked, ld = $(`#${p}-ld`).value;
  if (!never && !ld) return { err: 'সর্বশেষ রক্তদানের তারিখ দিন, অথবা "কখনো রক্ত দিইনি" চিহ্ন দিন' };
  if (!never && ld > today()) return { err: 'রক্তদানের তারিখ ভবিষ্যতের হতে পারে না' };
  return { bloodGroup: bg, lastDonated: never ? '' : ld };
}
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id?.endsWith('-never')) { const d = $('#' + t.id.replace('-never', '-ld')); if (d) { d.disabled = t.checked; if (t.checked) d.value = ''; } }
  if (t.id?.endsWith('-ld') && t.value) { const n = $('#' + t.id.replace('-ld', '-never')); if (n) n.checked = false; }
});

// ================================================================ আমার প্রোফাইল ও লগইন
const unionOptions = sel => S.unions.map(u => `<option value="${esc(u.id)}" ${String(u.id) === String(sel) ? 'selected' : ''}>${esc(u.name)}</option>`).join('');
async function renderMe(mode = 'login') {
  const u = me();
  if (u) {
    $('#me').innerHTML = `<div class="card prof prof-fb">${coverHtml(u, true)}<input type="file" id="coverfile" accept="image/*" hidden>
      <h2 style="margin:6px 0 0">${esc(u.name)}${vb(u.verified, true)}</h2>${u.username ? `<div class="uname">@${esc(u.username)}</div>` : ''}${u.locked ? '<button class="lock-chip">🔒 প্রোফাইল লক করা</button>' : ''}${u.admin && S.api.mode !== 'demo' ? '<div class="mut">অ্যাডমিন</div>' : ''}
      ${u.bio ? `<p class="bio">${esc(u.bio)}</p>` : ''}
      ${introCard(u, true)}
      <div id="mystats">${statsHtml({ id: u.id, friends: '…', followers: '…', following: '…' })}</div>
      <div class="row"><button class="btn ghost" id="edit">${ic('edit', 15)} এবাউট এডিট</button><button class="btn ghost" data-insights="1">${ic('eye', 15)} ড্যাশবোর্ড</button><button class="btn ghost" data-v="menu">⚙️ সেটিং</button></div></div>
      ${profTabs('me')}`;
    S.api.profile(u.id).then(p => { if ($('#mystats')) $('#mystats').innerHTML = statsHtml(p); }).catch(() => {});
    showProfPane('me');
    return;
  }
  $('#feed-me').innerHTML = ''; $('#feed-me').hidden = false;
  const signup = mode === 'signup';
  $('#me').innerHTML = `${demoCard()}<div class="card"><h2>${signup ? 'নতুন অ্যাকাউন্ট খুলুন' : 'লগইন করুন'}</h2>
    <p class="mut">পোস্ট, বন্ধু, মেসেজের জন্য অ্যাকাউন্ট লাগবে। ☰ মেনুর সেবা ডিরেক্টরি লগইন ছাড়াই দেখা যায়।</p>
    <form id="aform">
      ${signup ? `<label for="an">${ic('user', 16)} আপনার নাম</label><input id="an" required minlength="2" maxlength="40" autocomplete="name">
      <label for="su-g">${ic('users', 16)} লিঙ্গ</label>${genderSelect('su-g', undefined, true)}
      <label for="su-bd-d">${ic('calendar', 16)} জন্মতারিখ <span class="mut" style="font-weight:400">(বয়স ১৩ বছরের বেশি হতে হবে)</span></label>${dateSelect('su-bd', '', true)}
      ${addrHtml('su')}
      <label for="su-ph">${ic('mobile', 16)} মোবাইল নম্বর <span class="mut" style="font-weight:400">(WhatsApp থাকলে এই নম্বরেই)</span></label><input id="su-ph" required inputmode="tel" autocomplete="tel" placeholder="০১XXXXXXXXX" maxlength="17">
      ${bloodHtml('su', null)}` : ''}
      <label for="ae">${ic('mail', 16)} ইমেইল</label><input id="ae" type="email" required autocomplete="email" inputmode="email">
      <label for="ap">${ic('lock', 16)} পাসওয়ার্ড</label><input id="ap" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}">
      ${signup ? `<label class="chk"><input type="checkbox" id="agree" required> <span>আমার বয়স ১৩ বছরের বেশি, এবং আমি <a href="./privacy.html">ব্যবহারের নিয়ম</a> মেনে চলব: মিথ্যা খবর, গালিগালাজ বা আপত্তিকর কিছু পোস্ট করব না।</span></label>` : ''}
      <button class="btn wide" style="margin-top:14px">${signup ? 'অ্যাকাউন্ট খুলুন' : 'লগইন'}</button>
    </form>
    <p style="text-align:center;margin:10px 0 0">${signup ? 'আগে থেকে অ্যাকাউন্ট আছে?' : 'নতুন ব্যবহারকারী?'} <button class="link" id="swap">${signup ? 'লগইন করুন' : 'অ্যাকাউন্ট খুলুন'}</button></p></div>
    <p class="note"><a class="link" href="./privacy.html">গোপনীয়তা নীতি</a></p>`;
  $('#swap').onclick = () => renderMe(signup ? 'login' : 'signup');
  if (signup) addrRefresh('su');
  $('#aform').onsubmit = e => {
    e.preventDefault();
    const email = $('#ae').value.trim(), password = $('#ap').value;
    let extra = {};
    if (signup) {
      const addr = readAddr('su'), phone = normPhone($('#su-ph').value), blood = readBlood('su');
      if (!addr.upazila || (addr.upazila === HOME_UPAZILA && !addr.unionId)) return toast('ঠিকানা সম্পূর্ণ বাছাই করুন');
      if (!validPhone(phone)) return toast('সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)');
      if (blood.err) return toast(blood.err);
      const g = $('#su-g').value; if (!g) return toast('লিঙ্গ বাছাই করুন');
      const bd = readDate('su-bd', true); if (bd.err) return toast(bd.err);
      extra = { ...addr, phone, bloodGroup: blood.bloodGroup, lastDonated: blood.lastDonated, gender: g === 'none' ? '' : g, birthDate: bd };
    }
    busy(e.submitter, async () => {
      if (signup) {
        const r = await S.api.signUp({ email, password, name: $('#an').value.trim(), ...extra });
        if (extra.bloodGroup && $('#su-donor') && !$('#su-donor').checked && !r.needsConfirm) await S.api.updateProfile({ ...me(), ...extra, donorVisible: false });
        if (r.needsConfirm) { toast('আপনার ইমেইলে একটি লিংক পাঠানো হয়েছে। সেটিতে ক্লিক করে তারপর লগইন করুন।'); return renderMe('login'); }
      } else await S.api.signIn({ email, password });
      afterAuth(); toast('স্বাগতম, ' + me().name);
    });
  };
}
$('#me').addEventListener('change', async e => {
  if (e.target.id !== 'avfile' && e.target.id !== 'coverfile') return;
  const file = e.target.files[0]; e.target.value = ''; if (!file) return;
  const cover = e.target.id === 'coverfile';
  try { picSheet(cover ? 'cover' : 'avatar', await compress(file, cover ? 1280 : 512, 0.8)); } catch { toast('ছবিটা পড়া গেল না, অন্য ছবি দিন'); }
});
document.addEventListener('click', async e => {
  const id = e.target.closest('button')?.id; if (!id) return;
  if (id === 'logout') { await S.api.signOut(); afterAuth(); }
  if (id === 'donated-today') {
    if (!(await confirmSheet('আজকের তারিখকে সর্বশেষ রক্তদানের তারিখ হিসেবে সেভ করবেন? ব্লাড ব্যাংকে ৯০ দিন "অপেক্ষায়" দেখাবে।', 'হ্যাঁ, সেভ করুন'))) return;
    await busy(null, async () => { await S.api.setLastDonated(today()); if (S.view === 'dir') loadBlood(); else renderMe(); toast('ধন্যবাদ! আপনার রক্তদান একটা জীবন বাঁচাতে পারে 🩸'); });
  }
  if (id === 'blocked') {
    const list = await S.api.blockedList().catch(() => []);
    openSheet(`<h2>ব্লক করা মানুষ</h2>${list.length ? list.map(u => `<div class="person">${av(u)}<div class="info"><b>${esc(u.name)}</b></div><button class="sbtn ghost" data-unb="${esc(u.id)}">আনব্লক</button></div>`).join('') : '<p class="mut">কাউকে ব্লক করা নেই।</p>'}<button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
    $('#sheet').onclick = ev => { const b = ev.target.closest('[data-unb]'); if (b) busy(b, async () => { await S.api.unblock(b.dataset.unb); b.closest('.person').remove(); loadFeed('home'); }); };
  }
  if (id === 'edit') return openAbout(null);
  if (id === 'delacc') {
    if (!(await confirmSheet('অ্যাকাউন্ট, আপনার সব পোস্ট, ছবি, মন্তব্য ও মেসেজ স্থায়ীভাবে মুছে যাবে। নিশ্চিত?', 'হ্যাঁ, মুছে ফেলুন', true))) return;
    await busy(null, async () => { await S.api.deleteAccount(); afterAuth(); toast('অ্যাকাউন্ট মুছে ফেলা হয়েছে'); });
  }
});
const TAB_ME_ICON = $('#tab-av').innerHTML;
function renderComposer() {
  const u = me(), pg = u && S.actAs;
  $('#comp-av').innerHTML = pg ? entAv(pg) : u ? av(u) : `<div class="av" aria-hidden="true">?</div>`; $('#comp-av').setAttribute('aria-label', pg ? `${pg.name} পেইজ দেখুন` : 'নিজের প্রোফাইল দেখুন'); $('#tab-av').innerHTML = pg ? entAv(pg) : u ? av(u) : TAB_ME_ICON;
  $('#cm-open').textContent = pg ? `${pg.name}-এর পক্ষে কিছু লিখুন…` : u ? `আপনার মনে কী আছে, ${u.name.split(' ')[0]}?` : 'আপনার মনে কী আছে? পোস্ট করতে লগইন করুন';
  swapFriendsTab(!!pg);   // পেইজের পোস্ট সবসময় পাবলিক
  renderActAsBar();
}
// পেইজ হিসেবে থাকলে "বন্ধু" ট্যাবের জায়গায় পেইজের ড্যাশবোর্ড
const FRIENDS_TAB = { html: null, label: '' };
const DASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg><span class="badge" id="b-friends" hidden></span>';
function swapFriendsTab(page) {
  const b = document.querySelector('header [data-v="friends"], header [data-v="pinsights"]'); if (!b) return;
  if (FRIENDS_TAB.html === null) { FRIENDS_TAB.html = b.innerHTML; FRIENDS_TAB.label = b.getAttribute('aria-label'); }
  if (page && b.dataset.v !== 'pinsights') { b.dataset.v = 'pinsights'; b.innerHTML = DASH_ICON; b.setAttribute('aria-label', 'পেইজের ড্যাশবোর্ড'); }
  if (!page && b.dataset.v !== 'friends') { b.dataset.v = 'friends'; b.innerHTML = FRIENDS_TAB.html; b.setAttribute('aria-label', FRIENDS_TAB.label); }
}
// ---------- পেইজ হিসেবে চলা (ফেসবুকের মতো প্রোফাইল বদল)
const actAsOpts = () => (S.actAs ? { pageId: S.actAs.id, authorName: S.actAs.name, authorAvatar: S.actAs.avatar, title: `${S.actAs.name}-এর পক্ষে পোস্ট` } : {});
function renderActAsBar() {
  let bar = $('#actas-bar');
  if (!S.actAs || !me()) { bar?.remove(); document.body.classList.remove('acting'); return; }
  if (!bar) { bar = document.createElement('div'); bar.id = 'actas-bar'; document.querySelector('header').after(bar); }
  bar.innerHTML = `${entAv(S.actAs)}<span>আপনি এখন <b>${esc(S.actAs.name)}</b> হিসেবে আছেন</span><button id="actas-back">নিজের প্রোফাইলে ফিরুন</button>`;
  document.body.classList.add('acting');
  $('#actas-back').onclick = () => setActAs(null);
}
function setActAs(pg, quiet) {
  S.actAs = pg ? { id: pg.id, name: pg.name, avatar: pg.avatar || '', verified: pg.verified || '', autoReplyOn: pg.autoReplyOn, autoReply: pg.autoReply, faqs: pg.faqs, isOwner: pg.isOwner !== false && !pg.isAdmin, canManage: true } : null;
  local.set('actAs', S.actAs ? S.actAs.id : null);
  S.convPage = null; S.draft = null;
  renderComposer(); refreshBadges(); if (S.view === 'menu') renderMenu(); if (S.view === 'msgs') loadConvs(); if (S.view === 'notif') loadNotifs();
  if (!pg && S.tab === 'pinsights') go('home'); if (pg && S.view === 'friends') go('pinsights');
  if (!quiet) toast(pg ? `এখন "${pg.name}" হিসেবে আছেন: পোস্ট, মন্তব্য ও মেসেজ পেইজের নামে যাবে` : 'নিজের প্রোফাইলে ফিরেছেন');
}
async function restoreActAs() {
  const id = local.get('actAs', null); if (!id || !me()) return;
  try { const pg = await S.api.page(id); if (pg.canManage) setActAs(pg, true); else local.set('actAs', null); } catch { local.set('actAs', null); }
}
async function switcherHtml() {
  const pages = await S.api.myPages().catch(() => []);
  if (!pages.length) return '';
  const u = me(), cur = S.actAs?.id;
  return `<div class="switcher"><b class="sw-h">প্রোফাইল বা পেইজ বদলান</b>
    <button class="sw-row${!cur ? ' on' : ''}" data-actas="">${av(u, 'sm')}<span><b>${esc(u.name)}</b><small>আপনার প্রোফাইল</small></span>${!cur ? '<i>✓</i>' : ''}</button>
    ${pages.map(pg => `<button class="sw-row${cur === pg.id ? ' on' : ''}" data-actas="${esc(pg.id)}">${entAv(pg)}<span><b>${esc(pg.name)}${vb(pg.verified)}</b><small>পেইজ · ${pg.isAdmin ? 'অ্যাডমিন' : 'মালিক'}</small></span>${cur === pg.id ? '<i>✓</i>' : ''}</button>`).join('')}</div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-actas]'); if (!b) return;
  const id = b.dataset.actas;
  if (!id) return setActAs(null);
  await busy(b, async () => { const pg = await S.api.page(Number(id)); if (!pg.canManage) throw new Error('এই পেইজ চালানোর অনুমতি নেই'); setActAs(pg); });
});
function afterAuth() {
  if (!me() && S.scope === 'friends') S.scope = 'area';
  renderComposer(); renderFilters(); listenMessages(); refreshBadges(); loadFeed('home'); renderDemoBar();
  if (me()) S.api.weeklyReport?.().then(() => refreshBadges()).catch(() => {});
  if (me()) restoreActAs(); else if (S.actAs) setActAs(null, true);
  if (S.view === 'me') renderMe(); if (S.view === 'friends') loadFriends(); if (S.view === 'msgs') loadConvs(); if (S.view === 'notif') loadNotifs(); if (S.view === 'menu') renderMenu();
}

// ================================================================ ☰ সেবা ডিরেক্টরি
const svcCard = s => `<div class="card svc">
  <div class="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006a4e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SVC_ICONS[s.category] || ''}</svg></div>
  <div style="flex:1"><h3>${esc(s.name)}</h3><div class="meta">${esc(s.address)}</div>${s.hours ? `<div class="meta">🕘 ${esc(s.hours)}</div>` : ''}
    ${s.verified ? '<span class="ver">✔ যাচাইকৃত</span>' : `<span class="mut">যাচাই বাকি</span>${me()?.admin ? ` <button class="link" data-verify="${esc(s.id)}">যাচাই করুন</button>` : ''}`}</div>
  <a class="call" href="tel:${esc(String(s.phone).replace(/[^\d+]/g, ''))}">কল<b>${esc(bn(s.phone))}</b></a></div>`;
const emergencyHtml = () => `<a class="big" href="tel:999"><span class="n">৯৯৯</span><span><b>জাতীয় জরুরি সেবা</b><br>পুলিশ, ফায়ার সার্ভিস, অ্যাম্বুলেন্স: টোল ফ্রি</span></a>
  <div class="em">${EMERGENCY.map(e => `<a class="emc" href="tel:${e[2]}"><div class="n">${e[0]}</div><div class="t">${esc(e[1])}</div></a>`).join('')}</div>`;
let svcTimer;
async function loadDir() {
  if (S.dcat === 'blood' && !feat('featBlood')) S.dcat = '';
  $('#dchips').innerHTML = [['', 'সব সেবা'], ...(feat('featBlood') ? [['blood', '🩸 ব্লাড ব্যাংক']] : []), ['sos', 'জরুরি নম্বর'], ...SERVICE_CATS].map(c => `<button class="chip${c[0] === S.dcat ? ' on' : ''}" data-d="${c[0]}">${esc(c[1])}</button>`).join('');
  const q = $('#q').value.trim();
  if (S.dcat === 'sos') { $('#dir').innerHTML = emergencyHtml(); return; }
  if (S.dcat === 'blood') return loadBlood();
  $('#dir').innerHTML = '<div class="skel"></div>';
  try {
    const list = await S.api.services({ category: S.dcat || null, q });
    if (!list.length) { $('#dir').innerHTML = `<div class="empty">কিছু পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজুন বা নতুন সেবা যোগ করুন।</div>`; return; }
    if (S.dcat || q) { $('#dir').innerHTML = list.map(svcCard).join(''); return; }
    // "সব সেবা": উপরে জরুরি নম্বর, তারপর ধরন অনুযায়ী ভাগ করে সব সেবা
    const donors = await S.api.donors({ upazila: HOME_UPAZILA }).catch(() => []);
    const bloodCard = `<button class="card blood-sum" data-d="blood"><b>🩸 ব্লাড ব্যাংক</b><span class="mut">${esc(HOME_UPAZILA)} উপজেলায় ${bn(donors.length)} জন রক্তদাতা</span>
      <span class="bg-row">${BLOOD_GROUPS.map(g => `<span class="bg-pill">${g} <b>${bn(donors.filter(d => d.bloodGroup === g).length)}</b></span>`).join('')}</span></button>`;
    $('#dir').innerHTML = emergencyHtml() + bloodCard + SERVICE_CATS.map(([k, name]) => {
      const items = list.filter(s => s.category === k);
      return items.length ? `<h3 class="cat-h">${esc(name)} <span class="n">${bn(items.length)}টি</span></h3>${items.map(svcCard).join('')}` : '';
    }).join('');
  } catch (e) { $('#dir').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
$('#q').addEventListener('input', () => { clearTimeout(svcTimer); svcTimer = setTimeout(loadDir, 300); });
$('#dchips').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) { S.dcat = b.dataset.d; loadDir(); } });
$('#dir').addEventListener('click', e => {
  const b = e.target.closest('.blood-sum[data-d]'); if (b) { S.dcat = 'blood'; loadDir(); window.scrollTo(0, 0); return; }
  const g = e.target.closest('[data-bg]'); if (g) { S.bgroup = g.dataset.bg; loadBlood(); return; }
  const sc = e.target.closest('[data-bscope]'); if (sc) { S.bscope = sc.dataset.bscope; loadBlood(); }
});
$('#dir').addEventListener('change', e => { if (e.target.id === 'bready') { S.bready = e.target.checked; loadBlood(); } });
async function loadBlood() {
  const box = $('#dir');
  box.innerHTML = '<div class="skel"></div>';
  try {
    // এক বারে এলাকার সব ডোনার আনি; গ্রুপের সংখ্যা ও ফিল্টার এখান থেকেই
    const all = await S.api.donors({ upazila: S.bscope === 'home' ? HOME_UPAZILA : null });
    const u = me(), mineInList = u && all.find(d => d.id === u.id);
    const count = g => all.filter(d => d.bloodGroup === g).length;
    const readyCount = all.filter(d => canDonate(d.lastDonated)).length;
    let list = S.bgroup ? all.filter(d => d.bloodGroup === S.bgroup) : all;
    if (S.bready) list = list.filter(d => canDonate(d.lastDonated));
    list = list.filter(d => !u || d.id !== u.id);
    const myCard = !u ? ''
      : u.bloodGroup && u.donorVisible
        ? `<h3 class="res-h">আমার ডোনার প্রোফাইল</h3>${donorCard({ id: u.id, name: u.name, avatar: u.avatar, bloodGroup: u.bloodGroup, area: u.union, phone: u.phone, lastDonated: u.lastDonated }, true)}`
        : `<div class="card blood-head"><b>${u.bloodGroup ? '🙈 আপনার ডোনার প্রোফাইল লুকানো আছে' : '🩸 আপনি এখনো ডোনার নন'}</b><p class="mut" style="margin:4px 0 10px">${u.bloodGroup ? 'চালু করলে মানুষ জরুরি প্রয়োজনে আপনার সঙ্গে যোগাযোগ করতে পারবে।' : 'ব্লাড গ্রুপ দিলেই স্বয়ংক্রিয়ভাবে ব্লাড ব্যাংকে যুক্ত হবেন।'}</p><button class="btn" data-add-donor>${u.bloodGroup ? 'ডোনার প্রোফাইল চালু করুন' : 'নিজের ডোনার প্রোফাইল যোগ করুন'}</button></div>`;
    const addBtn = `<button class="btn ghost wide add-donor" data-add-donor>${ic('plus', 18)} ${!u ? 'লগইন করে ডোনার প্রোফাইল যোগ করুন' : hasOwnDonor() ? 'অন্য কারও ডোনার প্রোফাইল যোগ করুন' : 'নিজের ডোনার প্রোফাইল যোগ করুন'}</button>`;
    const myManual = u ? all.filter(d => d.manual && d.addedBy === u.id).length : 0;
    box.innerHTML = `<div class="card blood-head"><b>${ic('drop', 20)} ব্লাড ব্যাংক</b><p class="mut" style="margin:4px 0 0">অ্যাপে অ্যাকাউন্ট খোলা সবাই, যারা ব্লাড গ্রুপ দিয়েছেন, এখানে স্বয়ংক্রিয়ভাবে রক্তদাতা হিসেবে যুক্ত হন।${u ? '' : (S.settings.publicDonorPhone ? ' মেসেজ করতে লগইন করুন।' : ' কল, মেসেজ ও WhatsApp করতে লগইন করুন।')}</p>
      <div class="bstats"><span>${ic('users', 16)} মোট <b>${bn(all.length)}</b> জন</span><span>${ic('check', 16)} এখন দিতে পারবেন <b>${bn(readyCount)}</b> জন</span></div></div>
      ${myCard}
      ${addBtn}${myManual ? `<p class="mut" style="margin:6px 4px 0;font-size:13px">আপনি ${bn(myManual)} জনের ডোনার প্রোফাইল যোগ করেছেন। সেগুলোর কার্ডে এডিট ও মুছে ফেলার বাটন আছে।</p>` : ''}
      <div class="seg" style="margin:12px 0 8px"><button data-bscope="home" class="${S.bscope === 'home' ? 'on' : ''}">${ic('pin', 16)} ${esc(HOME_UPAZILA)}</button><button data-bscope="all" class="${S.bscope === 'all' ? 'on' : ''}">${ic('globe', 16)} সব এলাকা</button></div>
      <div class="bg-grid"><button class="bgc${!S.bgroup ? ' on' : ''}" data-bg=""><b>সব</b><span>${bn(all.length)} জন</span></button>${BLOOD_GROUPS.map(g => `<button class="bgc${g === S.bgroup ? ' on' : ''}" data-bg="${g}"><b>${g}</b><span>${bn(count(g))} জন</span></button>`).join('')}</div>
      <label class="chk" style="margin:4px 4px 10px"><input type="checkbox" id="bready" ${S.bready ? 'checked' : ''}> <span>শুধু যারা এখন রক্ত দিতে পারবেন (শেষ রক্তদানের ৯০ দিন পার)</span></label>
      <h3 class="res-h">${S.bgroup ? `${esc(S.bgroup)} গ্রুপের` : 'সব'} রক্তদাতা (${bn(list.length)} জন${mineInList && (!S.bgroup || mineInList.bloodGroup === S.bgroup) ? ', আপনি ছাড়া' : ''})</h3>
      ${list.length ? list.map(d => donorCard(d, false)).join('') : `<div class="empty">${S.bgroup ? `${esc(S.bgroup)} গ্রুপের` : 'কোনো'} রক্তদাতা ${S.bready ? 'এখন রক্ত দেওয়ার মতো অবস্থায় ' : ''}নেই।${S.bscope === 'home' ? '<br>"সব এলাকা" চেপে দেখুন।' : ''}</div>`}`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
$('#dir').addEventListener('click', e => {
  const b = e.target.closest('[data-verify]');
  if (b) busy(b, async () => { await S.api.verifyService(Number(b.dataset.verify)); await loadDir(); toast('যাচাইকৃত হিসেবে চিহ্নিত হয়েছে'); });
});
$('#addsvc').addEventListener('click', () => {
  if (!needUser()) return;
  openSheet(`<h2>নতুন সেবা যোগ করুন</h2><form id="sform">
    <label for="sn">নাম</label><input id="sn" required minlength="2" maxlength="80">
    <label for="sc">ধরন</label><select class="f" id="sc">${SERVICE_CATS.map(c => `<option value="${c[0]}">${esc(c[1])}</option>`).join('')}</select>
    <label for="sa">ঠিকানা / এলাকা</label><input id="sa" required maxlength="120">
    <label for="sp">ফোন নম্বর</label><input id="sp" required inputmode="tel" maxlength="20" pattern="[0-9০-৯+\\- ]{3,20}">
    <label for="sh">খোলার সময় (ঐচ্ছিক)</label><input id="sh" maxlength="60">
    <div class="row" style="margin-top:16px"><button class="btn" style="flex:1">জমা দিন</button><button class="btn ghost" type="button" data-close>বাতিল</button></div>
    <p class="mut">যাচাইয়ের পর তালিকায় "যাচাইকৃত" চিহ্ন দেখাবে।</p></form>`);
  $('#sform').onsubmit = e => {
    e.preventDefault();
    const toEn = s => s.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
    const v = { name: $('#sn').value.trim(), category: $('#sc').value, address: $('#sa').value.trim(), phone: toEn($('#sp').value.trim()), hours: $('#sh').value.trim() || null };
    busy(e.submitter, async () => { await S.api.addService(v); closeSheet(); S.dcat = ''; await loadDir(); toast('জমা হয়েছে, যাচাইয়ের অপেক্ষায়'); });
  };
});

// ================================================================ নোটিফিকেশন
const NT = {
  like: ['👍', 'আপনার পোস্টে রিয়্যাক্ট দিয়েছেন'],
  share: ['↗', 'আপনার পোস্ট শেয়ার করেছেন'],
  tag: ['🏷', 'আপনাকে একটি পোস্টে ট্যাগ করেছেন'],
  comment: ['💬', 'আপনার পোস্টে মন্তব্য করেছেন'],
  reply: ['↩', 'আপনার মন্তব্যে উত্তর দিয়েছেন'],
  mention: ['@', 'আপনাকে মেনশন করেছেন'],
  friend_request: ['👤', 'আপনাকে ফ্রেন্ড রিকোয়েস্ট পাঠিয়েছেন'],
  friend_accept: ['🤝', 'আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন'],
  follow: ['➕', 'আপনাকে ফলো করছেন'],
  group_request: ['👥', 'আপনার গ্রুপে যোগ দিতে চান'],
  group_approved: ['✅', 'আপনাকে গ্রুপে যুক্ত করেছেন'],
  verify_ok: ['✔', 'আপনার ভেরিফাইড ব্যাজের আবেদন অনুমোদন করেছেন'],
  verify_no: ['✖', 'আপনার ভেরিফাইড ব্যাজের আবেদন গ্রহণ করেননি'],
  boost_ok: ['🚀', 'আপনার পোস্টের বুস্ট অনুমোদন করেছেন, এখন চলছে'],
  boost_no: ['✖', 'আপনার পোস্টের বুস্ট গ্রহণ করেননি, কয়েন ফেরত গেছে'],
  page_admin: ['📄', 'আপনাকে একটি পেইজের অ্যাডমিন বানিয়েছেন'],
  blood_request: ['🩸', ''],
  event_reminder: ['📅', '-এর অনুষ্ঠান আগামী ২৪ ঘণ্টার মধ্যে, আপনি যাচ্ছেন'],
};
// নিজের অর্জনের নোটিফিকেশন (মাইলফলক, সাপ্তাহিক রিপোর্ট): কারো নাম নয়, শুধু খবরটা
const SELF_TYPES = ['milestone', 'follower_milestone', 'weekly'];
function selfNotif(n) {
  const m = n.meta || {};
  let icon = '🎉', text = '';
  if (n.type === 'milestone') text = `অভিনন্দন! আপনার পোস্ট <b>${bn(m.n || 0)} জন</b> দেখেছেন${n.snippet ? ` <span class="q">"${esc(n.snippet.slice(0, 40))}${n.snippet.length > 40 ? '…' : ''}"</span>` : ''}`;
  else if (n.type === 'follower_milestone') text = `অভিনন্দন! আপনার ফলোয়ার এখন <b>${bn(m.n || 0)} জন</b>`;
  else {
    icon = '📊';
    const ch = m.prev ? Math.round(((m.people - m.prev) / m.prev) * 100) : null;
    text = `<b>সাপ্তাহিক রিপোর্ট:</b> গত সপ্তাহে আপনার পোস্ট ${bn(m.people || 0)} জন দেখেছেন${ch === null ? '' : ch >= 0 ? `, আগের সপ্তাহের চেয়ে <b class="up">${bn(ch)}% বেশি</b>` : `, আগের সপ্তাহের চেয়ে <b class="down">${bn(-ch)}% কম</b>`}। প্রোফাইল ভিজিট ${bn(m.visits || 0)}, নতুন ফলোয়ার ${bn(m.followers || 0)}।`;
  }
  return `<div class="notif self${n.read ? '' : ' new'}" data-n-type="${esc(n.type)}" data-n-post="${esc(n.postId ?? '')}" data-n-group="" data-n-user="" role="button" tabindex="0">
    <span class="ico"><span class="self-ic">${icon}</span></span><span class="txt">${text}<span class="time">${esc(ago(n.createdAt))}</span></span></div>`;
}
async function loadNotifs(keep) {
  const box = $('#notifs');
  if (!me()) { box.innerHTML = `<div class="empty">নোটিফিকেশন দেখতে আগে লগইন করুন।<br><button class="btn" style="margin-top:10px" data-go="me">লগইন / অ্যাকাউন্ট খুলুন</button></div>`; return; }
  if (!keep) box.innerHTML = '<div class="skel"></div>';
  try {
    const [list, reqs] = await Promise.all([S.api.notifications(S.actAs?.id), S.actAs ? [] : S.api.friendRequests()]);
    const pending = new Set(reqs.map(r => r.id));
    box.innerHTML = list.length ? list.map(n => {
      if (SELF_TYPES.includes(n.type)) return selfNotif(n);
      const [ic, txt0] = NT[n.type] || ['•', ''];
      const txt1 = n.type === 'page_admin' && n.meta?.page ? `আপনাকে "${n.meta.page}" পেইজের অ্যাডমিন বানিয়েছেন` : n.meta?.page && (n.type === 'verify_ok' || n.type === 'verify_no') ? `আপনার পেইজ "${n.meta.page}"-এর ভেরিফাইড ব্যাজের আবেদন ${n.type === 'verify_ok' ? 'অনুমোদন করেছেন' : 'গ্রহণ করেননি'}` : txt0;
      const txt2 = n.type === 'blood_request' ? `-এর ${n.meta?.bg || ''} রক্ত দরকার। আপনি কাছাকাছি একজন ${n.meta?.bg || ''} ডোনার, সাহায্য করতে পারবেন?` : txt1;
      const txt = S.actAs ? txt2.replace('আপনার পোস্ট', 'পেইজের পোস্ট').replace('আপনার পেইজ', 'পেইজ') : txt1;
      const snip = n.groupName ? ` <span class="q">${esc(n.groupName)}</span>` : n.snippet ? ` <span class="q">"${esc(n.snippet.slice(0, 40))}${n.snippet.length > 40 ? '…' : ''}"</span>` : '';
      const reqBtns = n.type === 'friend_request' && pending.has(n.actor.id)
        ? `<div class="acts2"><button class="sbtn" data-fr="accept" data-id="${esc(n.actor.id)}">গ্রহণ করুন</button><button class="sbtn ghost" data-fr="remove" data-id="${esc(n.actor.id)}">মুছুন</button></div>` : '';
      return `<div class="notif${n.read ? '' : ' new'}" data-n-type="${esc(n.type)}" data-n-post="${esc(n.postId ?? '')}" data-n-group="${esc(n.groupId ?? '')}" data-n-user="${esc(n.actor.id)}" data-n-page="${esc(n.meta?.page_id ?? '')}" role="button" tabindex="0">
        <span class="ico">${av(n.actor)}<i>${ic}</i></span>
        <span class="txt"><b>${esc(n.actor.name)}</b>${n.type === 'event_reminder' || n.type === 'blood_request' ? '' : ' '}${esc(txt)}${n.type === 'event_reminder' && n.meta?.at ? ` <span class="q">${esc(bnWhen(n.meta.at, true))}${n.meta.place ? ' · ' + esc(n.meta.place) : ''}</span>` : snip}<span class="time">${esc(ago(n.createdAt))}</span>${reqBtns}</span></div>`;
    }).join('') : (S.actAs ? `<div class="empty">${esc(S.actAs.name)} পেইজের এখনো কোনো নোটিফিকেশন নেই।<br>কেউ পেইজের পোস্টে রিয়্যাক্ট বা মন্তব্য করলে এখানে দেখাবে।</div>` : '<div class="empty">এখনো কোনো নোটিফিকেশন নেই।<br>কেউ আপনার পোস্টে লাইক বা মন্তব্য করলে, বা ফ্রেন্ড রিকোয়েস্ট পাঠালে এখানে দেখাবে।</div>');
    if (list.some(n => !n.read)) { await S.api.markNotificationsRead(list.filter(n => !n.read).map(n => n.id)); $('#b-notif').hidden = true; }
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
function openNotif(el) {
  if (!el || el.closest('button')) return;
  const t = el.dataset.nType;
  if ((t === 'blood_request' || t === 'event_reminder' || t === 'like' || t === 'comment' || t === 'reply' || t === 'mention' || t === 'share' || t === 'tag' || t === 'boost_ok' || t === 'boost_no') && el.dataset.nPost) openPost(el.dataset.nPost);
  else if (t === 'friend_request') go('friends');
  else if (t === 'verify_ok' || t === 'verify_no') { open('wallet'); loadWallet(); }
  else if (t === 'milestone' && el.dataset.nPost) openPost(el.dataset.nPost);
  else if (t === 'page_admin' && el.dataset.nPage) openPage(el.dataset.nPage);
  else if (t === 'weekly' || t === 'follower_milestone' || t === 'milestone') { S.insTarget = null; open('insights'); loadInsights(); }
  else if (t.startsWith('group_') && el.dataset.nGroup) openGroup(el.dataset.nGroup);
  else openUser(el.dataset.nUser);
}
$('#notifs').addEventListener('click', e => openNotif(e.target.closest('.notif')));
$('#notifs').addEventListener('keydown', e => { if (e.key === 'Enter') openNotif(e.target.closest('.notif')); });
$('#notif-read').addEventListener('click', async () => { if (!me()) return; await S.api.markNotificationsRead(); loadNotifs(true); refreshBadges(); });
// ================================================================ পোস্ট ও মন্তব্যের পাতা (ফেসবুকের মতো)
async function openPost(id) {
  S.postId = Number(id) || id; S.feeds.post.posts = []; S.csort = S.csort || 'top'; S.cmOpen = new Set(); setReplyTo(null);
  open('post'); $('#cm-wrap').hidden = true; $('#cm-comp').hidden = true; $('#cm-list').innerHTML = '';
  await loadFeed('post');
  if (!S.feeds.post.posts.length) return;
  $('#cm-wrap').hidden = false; $('#cm-comp').hidden = false; $('#cm-av').innerHTML = S.actAs ? entAv(S.actAs) : me() ? av(me(), 'sm') : '';
  loadComments();
}
async function loadComments() {
  const post = S.feeds.post.posts[0]; if (!post) return;
  document.querySelectorAll('#cm-sort button').forEach(b => { b.classList.toggle('on', b.dataset.csort === S.csort); b.setAttribute('aria-selected', b.dataset.csort === S.csort); });
  $('#cm-list').innerHTML = '<div class="mut" style="padding:8px">লোড হচ্ছে…</div>';
  try {
    const list = await S.api.comments(post.id, S.csort);
    S.comments = list;
    $('#cm-title').textContent = `মন্তব্য (${bn(list.length)})`;
    // মূল মন্তব্য বাছাই অনুযায়ী; প্রতিটির উত্তর তার নিচে পুরনো থেকে নতুন ক্রমে
    const tops = list.filter(c => !c.parentId), kids = new Map();
    list.filter(c => c.parentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach(c => { if (!kids.has(c.parentId)) kids.set(c.parentId, []); kids.get(c.parentId).push(c); });
    S.cmKids = kids;
    const pinned = tops.find(c => c.id === post.pinnedCommentId), rest = tops.filter(c => c !== pinned);
    const block = (c, pin) => commentHtml(c, post, pin) + repliesHtml(c, post);
    $('#cm-list').innerHTML = list.length ? (pinned ? block(pinned, true) : '') + rest.map(c => block(c, false)).join('')
      : '<div class="empty" style="padding:20px">এখনো কোনো মন্তব্য নেই।<br>প্রথম মন্তব্যটি আপনিই করুন!</div>';
  } catch (e) { $('#cm-list').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
function repliesHtml(c, post, sc = { kids: S.cmKids, open: S.cmOpen }) {
  const r = sc.kids?.get(c.id) || []; if (!r.length) return '';
  const openAll = r.length <= 1 || sc.open?.has(c.id);
  return `<div class="cm-replies" data-rof="${esc(c.id)}">${openAll ? r.map(x => commentHtml(x, post, false)).join('')
    : `<button class="cm-showrep" data-showrep="${esc(c.id)}">${ic('reply', 15)} সব ${bn(r.length)}টি উত্তর দেখুন</button>`}</div>`;
}
function commentHtml(c, post, pinned) {
  const top = Object.entries(c.reactions || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `<div class="cm${pinned ? ' pinned' : ''}${c.parentId ? ' reply' : ''}" data-cid="${esc(c.id)}">
    ${pinned ? `<div class="pin-label">${ic('pushpin', 13)} পিন করা মন্তব্য</div>` : ''}
    <div class="cm-row">${c.pageId ? `<button class="avbtn" data-page="${esc(c.pageId)}">${entAv({ name: c.author, avatar: c.avatar })}</button>` : userLink(c.userId, av(c, 'sm'))}
      <div class="cm-main"><div class="cm-bubble">${c.pageId ? `<button class="who-btn" data-page="${esc(c.pageId)}">${esc(c.author)}${vb(c.badge)}</button>` : userLink(c.userId, esc(c.author) + vb(c.badge), 'who-btn')}<div class="cm-text">${moreText(c.body, 'c' + c.id, { chars: 200, lines: 4, mentions: c.mentions })}</div>
        ${c.likes ? `<button class="cm-rx" data-crx="${esc(c.id)}" aria-label="কে কে রিয়্যাক্ট দিয়েছেন">${top.map(([k]) => `<span class="rs-i">${rxIcon(k, 16)}</span>`).join('')}<span>${bn(c.likes)}</span></button>` : ''}</div>
        <div class="cm-meta"><span class="cm-time">${esc(ago(c.createdAt))}${c.editedAt ? ' · সম্পাদিত' : ''}</span>
          <button class="cm-tl cm-react${c.myReaction ? ' on rx-' + c.myReaction : ''}" data-clike="${esc(c.id)}" aria-label="${c.myReaction ? rxName(c.myReaction) + ' দিয়েছেন, চাপলে তুলে নেবেন' : 'লাইক দিন; চেপে ধরলে অন্য রিয়্যাক্ট'}">${c.myReaction ? rxName(c.myReaction) : 'লাইক'}</button>
          <button class="cm-tl cm-reply" data-creply="${esc(c.id)}">উত্তর</button>
          <button class="cm-more" data-cmenu="${esc(c.id)}" aria-label="আরও অপশন">${ic('dots', 16)}</button></div></div></div></div>`;
}
document.querySelector('#cm-sort').addEventListener('click', e => { const b = e.target.closest('[data-csort]'); if (b && b.dataset.csort !== S.csort) { S.csort = b.dataset.csort; loadComments(); } });
$('#cm-form').addEventListener('submit', e => {
  e.preventDefault(); const body = $('#cm-input').value.trim(); if (!body || !needUser()) return;
  const post = S.feeds.post.posts[0];
  const rt = S.replyTo, ments = mentionIds(body, S.cmMentions);
  busy(e.submitter, async () => {
    await S.api.addComment(post.id, body, rt?.id || null, ments, S.actAs?.id || null); S.cmMentions.clear(); $('#cm-input').value = ''; post.comments++; renderFeed('post');
    if (rt) { S.cmOpen.add(rt.id); setReplyTo(null); } else S.csort = 'new';
    await loadComments();
    if (rt) document.querySelector(`.cm-replies[data-rof="${rt.id}"] .cm:last-child`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
});
// কাকে উত্তর দিচ্ছেন (মন্তব্যের ঘরের উপরে ছোট লাইন)
function setReplyTo(r) {
  S.replyTo = r; const bar = $('#cm-replying');
  if (!bar) return;
  bar.hidden = !r;
  $('#cm-input').placeholder = r ? `${r.name}-কে উত্তর দিন…` : 'মন্তব্য লিখুন…';
  if (r) bar.querySelector('span').innerHTML = `${ic('reply', 14)} <b>${esc(r.name)}</b>-কে উত্তর দিচ্ছেন`;
}
S.cmMentions = new Map(); attachMention($('#cm-input'), S.cmMentions);
$('#cm-replying button').addEventListener('click', () => { setReplyTo(null); const i = $('#cm-input'); if (S.cmMentions.size && [...S.cmMentions.values()].some(n => i.value === '@' + n + ' ')) i.value = ''; });
// মন্তব্য এডিট: মন্তব্যের জায়গাতেই লেখার বক্স
function editCommentInline(c, sc = cmScope(null)) {
  const el = sc.root?.querySelector(`.cm[data-cid="${c.id}"] .cm-text`); if (!el) return;
  el.innerHTML = `<form class="cm-edit"><textarea maxlength="300" rows="2" aria-label="মন্তব্য এডিট করুন">${esc(c.body)}</textarea>
    <div class="cm-edit-b"><button type="button" class="btn ghost sm" data-ecancel>বাতিল</button><button class="btn sm">সংরক্ষণ</button></div></form>`;
  const f = el.querySelector('form'), ta = f.querySelector('textarea'), store = new Map((c.mentions || []).map(m => [m.id, m.name]));
  attachMention(ta, store);
  ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  const cancel = () => sc.redraw();
  f.querySelector('[data-ecancel]').onclick = cancel;
  ta.onkeydown = e => { if (e.key === 'Escape') cancel(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } };
  f.onsubmit = e => {
    e.preventDefault(); const body = ta.value.trim();
    if (!body) return toast('মন্তব্য খালি রাখা যাবে না');
    const ids = mentionIds(body, store);
    if (body === c.body && ids.sort().join() === (c.mentions || []).map(m => m.id).sort().join()) return cancel();
    busy(e.submitter, async () => { await S.api.editComment(c.id, body, ids); toast('মন্তব্য আপডেট হয়েছে'); await sc.refresh(); });
  };
}
async function setCommentReaction(c, reaction, sc = cmScope(null)) {
  if (!needUser()) return;
  const prev = c.myReaction || ''; if (prev === reaction) return;
  try { await S.api.reactComment(c.id, reaction, prev); } catch (e) { return toast(errText(e)); }
  c.reactions = { ...(c.reactions || {}) };
  if (prev) c.reactions[prev] = Math.max((c.reactions[prev] || 0) - 1, 0);
  if (reaction) c.reactions[reaction] = (c.reactions[reaction] || 0) + 1;
  c.likes += (reaction ? 1 : 0) - (prev ? 1 : 0); c.myReaction = reaction;
  if (sc.inline) return sc.redraw();
  const el = sc.root?.querySelector(`.cm[data-cid="${c.id}"]`);
  if (el) el.outerHTML = commentHtml(c, sc.post, el.classList.contains('pinned'));
}
document.addEventListener('click', async e => {
  const b = e.target.closest('#cm-list button, .cmi .cm button, .cmi .cm-replies button'); if (!b) return;
  const sc = cmScope(b);
  const findC = id => sc.list.find(x => String(x.id) === String(id));
  if (b.dataset.clike) { if (S.suppressClick) { S.suppressClick = false; return; } clearTimeout(lpTimer); closePicker(); const c = findC(b.dataset.clike); return c && setCommentReaction(c, c.myReaction ? '' : 'like', sc); }
  if (b.dataset.crx) return reactorsSheet('comment', b.dataset.crx);
  if (b.dataset.showrep) { sc.open.add(Number(b.dataset.showrep) || b.dataset.showrep); return sc.redraw(); }
  if (b.dataset.creply && sc.inline) {
    if (!needUser()) return;
    const c = findC(b.dataset.creply); if (!c || !sc.st) return;
    sc.st.replyTo = { id: c.parentId || c.id, name: c.author };
    if (c.parentId && c.userId !== me().id && !sc.st.draft.trim()) { sc.st.draft = '@' + c.author + ' '; sc.st.ments.set(c.userId, c.author); }
    sc.redraw(); return focusCmi(sc.id);
  }
  if (b.dataset.creply) {
    if (!needUser()) return;
    const c = findC(b.dataset.creply), topId = c.parentId || c.id, i = $('#cm-input');
    setReplyTo({ id: topId, name: c.author });
    // উত্তরের উত্তর দিলে নাম আগে বসিয়ে দেওয়া, যাতে বোঝা যায় কাকে বলছেন
    if (c.parentId && c.userId !== me().id && !i.value.trim()) { i.value = '@' + c.author + ' '; S.cmMentions.set(c.userId, c.author); }
    i.focus(); return;
  }
  if (b.dataset.creact) { closePicker(); const c = findC(b.dataset.cid); return c && setCommentReaction(c, b.dataset.creact === c.myReaction ? '' : b.dataset.creact, sc); }
  if (b.dataset.cmenu) {
    const c = findC(b.dataset.cmenu), post = sc.post, u = me(); if (!c || !post) return;
    const canPin = u && !c.parentId && (post.userId === u.id || u.admin), canDel = u && (c.userId === u.id || post.userId === u.id || u.admin);
    openSheet(`<div class="menu">
      ${canPin ? `<button data-act="pin">${post.pinnedCommentId === c.id ? 'আনপিন করুন' : 'মন্তব্যটি পিন করুন'}</button>` : ''}
      ${u && c.userId === u.id ? '<button data-act="edit">মন্তব্য এডিট করুন</button>' : ''}
      ${canDel ? '<button data-act="del" class="danger">মন্তব্যটি মুছে ফেলুন</button>' : ''}
      ${u && c.userId !== u.id ? '<button data-act="rep">মন্তব্যটি রিপোর্ট করুন</button>' : ''}
      ${!u ? '<button data-act="login">লগইন করুন</button>' : ''}
      <button data-close>বন্ধ করুন</button></div>`);
    $('#sheet').onclick = async ev => {
      const a = ev.target.closest('[data-act]')?.dataset.act; if (!a) return;
      if (a === 'login') { closeSheet(); return go('me'); }
      if (a === 'rep') return reportSheet('comment', c.id);
      closeSheet();
      if (a === 'edit') return editCommentInline(c, sc);
      if (a === 'pin') await busy(null, async () => { const v = post.pinnedCommentId === c.id ? null : c.id; await S.api.pinComment(post.id, v); post.pinnedCommentId = v; toast(v ? 'মন্তব্য পিন করা হয়েছে, সবার উপরে দেখাবে' : 'পিন তুলে নেওয়া হয়েছে'); sc.redraw(); });
      const nKids = (sc.kids.get(c.id) || []).length;
      if (a === 'del' && await confirmSheet(nKids ? `মন্তব্যটি আর এর ${bn(nKids)}টি উত্তর মুছে ফেলবেন?` : 'মন্তব্যটি মুছে ফেলবেন?', 'মুছুন', true)) await busy(null, async () => {
        await S.api.deleteComment(c.id); post.comments = Math.max((post.comments || 0) - 1 - nKids, 0); if (post.pinnedCommentId === c.id) post.pinnedCommentId = null;
        if (sc.inline) { if (sc.st?.replyTo?.id === c.id) sc.st.replyTo = null; return sc.refresh(); }
        if (S.replyTo?.id === c.id) setReplyTo(null); renderFeed('post'); loadComments(); });
    };
  }
});

// ================================================================ কে কে রিয়্যাক্ট দিয়েছেন (পোস্ট ও মন্তব্য)
async function reactorsSheet(kind, id) {
  openSheet(`<h2>রিয়্যাক্ট</h2><div class="mut">লোড হচ্ছে…</div>`);
  let data;
  try { data = await S.api.reactors(kind, Number(id) || id); } catch (e) { closeSheet(); return toast(errText(e)); }
  const { list, unnamed } = data;
  const counts = REACTIONS.map(([k]) => [k, list.filter(x => x.reaction === k).length]).filter(([, n]) => n > 0);
  const draw = tab => {
    const rows = tab ? list.filter(x => x.reaction === tab) : list;
    $('#sheet').innerHTML = `<h2>রিয়্যাক্ট</h2>
      <div class="rx-tabs" role="tablist">
        <button class="${!tab ? 'on' : ''}" data-rtab="">সব ${bn(list.length + unnamed)}</button>
        ${counts.map(([k, n]) => `<button class="${tab === k ? 'on' : ''}" data-rtab="${k}" aria-label="${rxName(k)} ${n}">${rxIcon(k, 20)} ${bn(n)}</button>`).join('')}
      </div>
      <div class="rx-people">${rows.length ? rows.map(u => `<div class="person">
          <span class="rxp-av">${userLink(u.id, av(u))}<span class="rxp-badge">${rxIcon(u.reaction, 18)}</span></span>
          <div class="info">${userLink(u.id, esc(u.name) + vb(u.verified), 'who-btn')}<div class="sub">${esc(u.union || '')}</div></div>
          ${me() && u.id !== me().id ? `<button class="sbtn ghost" data-dm="${esc(u.id)}" aria-label="মেসেজ">${ic('message', 16)}</button>` : ''}</div>`).join('')
        : '<p class="mut">এখনো কেউ রিয়্যাক্ট দেননি।</p>'}
        ${!tab && unnamed ? `<p class="mut" style="margin:10px 0 0">এবং আরও ${bn(unnamed)} জন</p>` : ''}</div>
      <button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`;
  };
  draw('');
  $('#sheet').onclick = e => {
    const t = e.target.closest('[data-rtab]'); if (t) return draw(t.dataset.rtab);
    if (e.target.closest('[data-user],[data-dm]')) closeSheet();
  };
}

// ================================================================ শেয়ার: প্রোফাইল, মেসেজ, Facebook, WhatsApp, লিংক কপি
function shareSheet(p) {
  const orig = p.shared ? { ...p.shared, category: p.category } : p, link = postLink(orig.id);
  const text = `${(orig.body || '').slice(0, 200)}${(orig.body || '').length > 200 ? '…' : ''}\n— ${orig.author}, আমার উপজেলা`;
  openSheet(`<h2>শেয়ার করুন</h2><div class="share-grid">
    <button data-sh="profile"><span class="sh-ic">${ic('share', 22)}</span>নিজের প্রোফাইলে</button>
    <button data-sh="msg"><span class="sh-ic">${ic('message', 22)}</span>মেসেজে পাঠান</button>
    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}" target="_blank" rel="noopener" data-sh="fb"><span class="sh-ic fb">${FB_ICON}</span>Facebook</a>
    <a href="https://wa.me/?text=${encodeURIComponent(text + '\n' + link)}" target="_blank" rel="noopener" data-sh="wa"><span class="sh-ic wa">${WA_ICON}</span>WhatsApp</a>
    <a href="fb-messenger://share/?link=${encodeURIComponent(link)}" data-sh="ms"><span class="sh-ic ms">${ic('message', 22)}</span>Messenger</a>
    <button data-sh="copy"><span class="sh-ic">${ic('link', 22)}</span>লিংক কপি</button>
    ${navigator.share ? `<button data-sh="more"><span class="sh-ic">${ic('dots', 22)}</span>অন্য অ্যাপে</button>` : ''}
  </div><button class="btn ghost wide" data-close style="margin-top:14px">বাতিল</button>`);
  $('#sheet').onclick = async e => {
    const a = e.target.closest('[data-sh]')?.dataset.sh; if (!a) return;
    if (a === 'fb' || a === 'wa' || a === 'ms') { setTimeout(closeSheet, 300); return; }
    if (a === 'more') { try { await navigator.share({ title: 'আমার উপজেলা', text, url: link }); } catch { /* বাতিল */ } return closeSheet(); }
    if (a === 'copy') { try { await navigator.clipboard.writeText(link); toast('লিংক কপি হয়েছে'); } catch { toast('কপি করা যায়নি: ' + link); } return closeSheet(); }
    if (!needUser()) return closeSheet();
    if (a === 'profile') return shareToProfile(orig);
    if (a === 'msg') return shareInMessage(orig, link);
  };
}
function shareToProfile(orig) {
  openSheet(`<h2>নিজের প্রোফাইলে শেয়ার</h2><form id="spform">
    <textarea id="sp-text" maxlength="1000" placeholder="এ বিষয়ে কিছু লিখুন (ঐচ্ছিক)…"></textarea>
    <div class="shared-embed static"><span class="se-top">${av(orig, 'sm')}<span><b>${esc(orig.author)}</b></span></span>${orig.body ? `<span class="se-body">${esc(orig.body)}</span>` : ''}${orig.image ? `<img loading="lazy" decoding="async" src="${esc(orig.image)}" alt="">` : ''}</div>
    <div class="row" style="margin-top:14px"><button class="btn" style="flex:1">এখনই শেয়ার করুন</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
  $('#spform').onsubmit = e => {
    e.preventDefault();
    busy(e.submitter, async () => {
      try { await S.api.createPost({ body: $('#sp-text').value.trim(), category: orig.category || 'খবর', sharedPostId: orig.id }); }
      catch (err) { if (/row-level|security/i.test(String(err?.message))) return toast('প্রাইভেট গ্রুপের পোস্ট বাইরে শেয়ার করা যায় না'); throw err; }
      closeSheet(); toast('আপনার প্রোফাইলে শেয়ার হয়েছে');
      for (const k in S.feeds) for (const x of S.feeds[k].posts) if (x.id === orig.id) x.shares = (x.shares || 0) + 1;
      if (S.view === 'home') loadFeed('home'); else if (S.view === 'post') renderFeed('post');
    });
  };
}
async function shareInMessage(orig, link) {
  openSheet(`<h2>মেসেজে পাঠান</h2><input type="search" id="sm-q" placeholder="নাম দিয়ে খুঁজুন…" aria-label="খুঁজুন"><div id="sm-list" style="margin-top:8px"><div class="mut">লোড হচ্ছে…</div></div><button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
  const [convs, friends] = await Promise.all([S.api.conversations().catch(() => []), S.api.friends().catch(() => [])]);
  const seen = new Set(), people = [];
  for (const c of convs) if (!seen.has(c.userId)) { seen.add(c.userId); people.push({ id: c.userId, name: c.name, avatar: c.avatar }); }
  for (const f of friends) if (!seen.has(f.id)) { seen.add(f.id); people.push(f); }
  const draw = () => {
    const q = ($('#sm-q')?.value || '').trim().toLowerCase(), list = people.filter(x => !q || x.name.toLowerCase().includes(q));
    $('#sm-list').innerHTML = list.length ? list.map(x => `<div class="person">${av(x)}<div class="info"><b>${esc(x.name)}</b></div><button class="sbtn" data-smsend="${esc(x.id)}">${ic('send', 15)} পাঠান</button></div>`).join('')
      : '<p class="mut">কাউকে পাওয়া যায়নি। বন্ধু বা আগে মেসেজ করেছেন এমন মানুষ এখানে দেখাবে।</p>';
  };
  draw(); $('#sm-q').oninput = draw;
  $('#sheet').onclick = e => {
    const b = e.target.closest('[data-smsend]'); if (!b || b.disabled) return;
    busy(b, async () => { await S.api.sendMessage(b.dataset.smsend, `${orig.author}-এর একটি পোস্ট শেয়ার করেছি:\n${(orig.body || '').slice(0, 120)}\n${link}`); });
    setTimeout(() => { if (b.isConnected) { b.textContent = 'পাঠানো হয়েছে ✓'; b.disabled = true; } }, 400);
  };
}

// ================================================================ সার্চ (উপরের সার্চবার)
let sqTimer;
function openSearch() { open('search'); $('#sq').focus(); if (!$('#sq').value) searchHint(); }
function searchHint() { $('#sres').innerHTML = '<div class="empty">মানুষের নাম, পোস্টের কোনো শব্দ, বা সেবার নাম (যেমন "হাসপাতাল") লিখুন।</div>'; S.feeds.search.posts = []; }
async function runSearch() {
  const q = $('#sq').value.trim();
  if (q.length < 2) return searchHint();
  $('#sres').innerHTML = '<div class="skel"></div>';
  try {
    const r = await S.api.search(q);
    if ($('#sq').value.trim() !== q) return;
    S.feeds.search.posts = r.posts;
    const none = !r.people.length && !r.posts.length && !r.services.length;
    $('#sres').innerHTML = none ? `<div class="empty">"${esc(q)}" দিয়ে কিছু পাওয়া যায়নি</div>` : `
      ${r.people.length ? `<h3 class="res-h">মানুষ</h3><div class="card" style="padding:4px 12px">${r.people.slice(0, 8).map(u => personRow(u, me() ? relBtns(u) : '')).join('')}</div>` : ''}
      ${r.services.length ? `<h3 class="res-h">সেবা</h3>${r.services.slice(0, 6).map(svcCard).join('')}` : ''}
      ${r.posts.length ? '<h3 class="res-h">পোস্ট</h3>' : ''}<div data-feed="search" id="feed-search"></div>`;
    if (r.posts.length) renderFeed('search');
  } catch (e) { $('#sres').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
$('#open-search').addEventListener('click', openSearch);
$('#sq').addEventListener('input', () => { clearTimeout(sqTimer); sqTimer = setTimeout(runSearch, 350); });

// ================================================================ ডেমো প্রোফাইল (শুধু ডেমো মোডে)
function renderDemoBar() {
  const bar = $('#demo'); bar.hidden = S.api.mode !== 'demo'; if (bar.hidden) return;
  bar.innerHTML = me()
    ? `ডেমো মোড: ডেটা শুধু এই ডিভাইসে সেভ হচ্ছে · <button id="demo-guide">🧪 চেকলিস্ট</button>`
    : `ডেমো মোড · <button id="demo-login">ডেমো প্রোফাইল দিয়ে সব দেখুন →</button>`;
}
function demoCard() {
  if (!S.api?.demoLogin) return '';
  const d = S.api.demoInfo;
  return `<div class="card demo-card"><b>🧪 ডেমো প্রোফাইল দিয়ে সব ফিচার চেক করুন</b>
    <p class="mut" style="margin:4px 0 10px">এক চাপে এমন একটা অ্যাকাউন্টে ঢুকবেন যেখানে আগে থেকেই বন্ধু, ফ্রেন্ড রিকোয়েস্ট, মেসেজ, নোটিফিকেশন, নিজের পেইজ, গ্রুপ আর সেভ করা পোস্ট আছে।</p>
    <button class="btn wide" id="demo-login">ডেমো প্রোফাইল দিয়ে ঢুকুন</button>
    <p class="mut" style="margin:8px 0 0;font-size:13px">অথবা লগইন করুন: ${esc(d.email)} / ${esc(d.password)}</p></div>`;
}
const DEMO_STEPS = [
  ['notif', '🔔', 'নোটিফিকেশন দেখুন', 'লাইক, মন্তব্য, ফ্রেন্ড ও গ্রুপের অনুরোধ। চাপলে সংশ্লিষ্ট পোস্ট বা গ্রুপ খুলবে।'],
  ['friends', '🤝', 'ফ্রেন্ড রিকোয়েস্ট গ্রহণ করুন', '২টি রিকোয়েস্ট অপেক্ষায়, আর "পরিচিত হতে পারেন" থেকে নতুন রিকোয়েস্ট পাঠান।'],
  ['msgs', '💬', 'মেসেজের উত্তর দিন', 'রাশেদুল হকের না-পড়া মেসেজ আছে। উত্তর পাঠালে ডেমো উত্তর আসবে।'],
  ['home', '📷', 'ছবিসহ পোস্ট দিন', 'হোমে লিখে ছবি যোগ করুন। কয়েক সেকেন্ড পর লাইক ও মন্তব্যের নোটিফিকেশন আসবে।'],
  ['page', '🏳️', 'নিজের পেইজ: ডেমো ফার্মেসী', 'পেইজের নামে পোস্ট দিন, এডিট করুন, লোগো বদলান।'],
  ['group', '👥', 'নিজের প্রাইভেট গ্রুপ: ডেমো যুব সংঘ', 'সদস্য হওয়ার একটি অনুরোধ অনুমোদনের অপেক্ষায়। সদস্য তালিকা দেখুন।'],
  ['groups', '🌐', 'অন্য গ্রুপে যোগ দিন', '"চরপাড়া কৃষক সমিতি" প্রাইভেট: অনুরোধ পাঠালে ৩ সেকেন্ডে অনুমোদন আসবে।'],
  ['saved', '🔖', 'সেভ করা পোস্ট', 'আগে থেকে ২টি সেভ করা আছে। যেকোনো পোস্টের ⋯ থেকে সেভ করুন।'],
  ['blood', '🩸', 'ব্লাড ব্যাংক', 'গ্রুপ বাছুন, ডোনারকে কল/মেসেজ/WhatsApp করুন। "অন্য কারও ডোনার প্রোফাইল যোগ করুন" চেপে নতুন ডোনার যোগ করুন; আপনার যোগ করা "মোঃ সেলিম মিয়া"-কে এডিট করে দেখুন।'],
  ['admin', '🛡️', 'অ্যাডমিন ড্যাশবোর্ড', 'অ্যাপের সংখ্যা দেখুন, আর "লগইন ছাড়া ডোনারের মোবাইল নম্বর দেখানো" চালু/বন্ধ করে লগআউট অবস্থায় ব্লাড ব্যাংক দেখুন।'],
  ['dir', '🏥', 'সেবা ডিরেক্টরি (অ্যাডমিন হিসেবে)', '"সুমন মোবাইল সার্ভিসিং" যাচাই বাকি: "যাচাই করুন" চাপুন। নতুন সেবাও যোগ করুন।'],
  ['search', '🔍', 'সার্চ করুন', '"রক্ত", "থানা" বা কারও নাম লিখে দেখুন।'],
  ['me', '👤', 'নিজের প্রোফাইল', 'প্রোফাইল এডিটে ঠিকানা (ভালুকা → ইউনিয়ন, বা অন্য জেলা → উপজেলা), মোবাইল ও ব্লাড গ্রুপ বদলে দেখুন।'],
  ['menu', '⚙️', 'সেটিং', '☰ মেনুতে থিম (ডার্ক), পাসওয়ার্ড, ব্লক করা মানুষ।'],
  ['user', '🚫', 'রিপোর্ট ও ব্লক', 'কারও পোস্টের ⋯ থেকে রিপোর্ট বা ব্লক করে দেখুন।'],
];
function demoGuide() {
  openSheet(`<h2>🧪 ডেমো চেকলিস্ট</h2><p class="mut" style="margin-top:0">যেকোনোটায় চাপ দিলে সেই জায়গায় নিয়ে যাবে। পরে ☰ মেনু → সাহায্য ও সহায়তা থেকে আবার খুলতে পারবেন।</p>
    <div class="menu">${DEMO_STEPS.map(([k, ic, t, d]) => `<button data-dg="${k}"><b>${ic} ${esc(t)}</b><br><span class="mut">${esc(d)}</span></button>`).join('')}</div>
    <button class="btn ghost wide" data-close style="margin-top:10px">বন্ধ করুন</button>`);
  $('#sheet').onclick = async e => {
    const k = e.target.closest('[data-dg]')?.dataset.dg; if (!k) return;
    closeSheet();
    if (['notif', 'friends', 'msgs', 'home', 'me', 'menu'].includes(k)) return go(k);
    go('menu');
    if (k === 'search') return openSearch();
    if (k === 'saved') { open('saved'); return loadFeed('saved'); }
    if (k === 'groups') { open('groups'); return loadGroups(); }
    if (k === 'dir') { S.dcat = 'fix'; $('#q').value = ''; open('dir'); return loadDir(); }
    if (k === 'blood') { S.dcat = 'blood'; $('#q').value = ''; open('dir'); return loadDir(); }
    if (k === 'admin') { open('admin'); return loadAdmin(); }
    if (k === 'page') { const pg = (await S.api.myPages())[0]; if (pg) openPage(pg.id); return; }
    if (k === 'group') { const g = (await S.api.myGroups()).find(x => x.role === 'admin'); if (g) openGroup(g.id); return; }
    if (k === 'user') return go('home');
  };
}
document.addEventListener('click', async e => {
  const id = e.target.closest('button')?.id;
  if (id === 'demo-login') busy(e.target.closest('button'), async () => { await S.api.demoLogin(); afterAuth(); go('home'); toast('ডেমো প্রোফাইলে স্বাগতম'); demoGuide(); });
  if (id === 'demo-guide') { if (!me()) await S.api.demoLogin(), afterAuth(); demoGuide(); }
  if (id === 'demo-reset') {
    if (!(await confirmSheet('ডেমো প্রোফাইলের সব পরিবর্তন মুছে আবার শুরুর অবস্থায় সাজাবেন?', 'হ্যাঁ, নতুন করে সাজান', false))) return;
    await busy(null, async () => { await S.api.demoLogin({ reset: true }); afterAuth(); go('home'); toast('ডেমো প্রোফাইল নতুন করে সাজানো হয়েছে'); demoGuide(); });
  }
});

// ================================================================ ☰ মেনু (ফেসবুকের মতো) ও সেটিং
const THEMES = [['', 'ফোনের মতো'], ['light', 'লাইট'], ['dark', 'ডার্ক']];
function applyTheme() { const t = local.get('theme', ''); if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
applyTheme();
function renderMenu() {
  const u = me(), wasOpen = [...document.querySelectorAll('#menu details')].map(d => d.open);
  const sc = (go2, icon, label, sub, flag) => {
    if (flag && S.settings[flag] === false && !u?.admin) return '';          // অ্যাডমিন বন্ধ করে রাখলে সাধারণ ব্যবহারকারী দেখেন না
    const off = flag && S.settings[flag] === false;
    return `<button class="sc${off ? ' off' : ''}" data-mgo="${go2}"><span class="si">${icon}</span>${esc(label)}${off ? '<small>বন্ধ আছে (শুধু অ্যাডমিন দেখছেন)</small>' : sub ? `<small>${esc(sub)}</small>` : ''}</button>`;
  };
  $('#menu').innerHTML = `
    ${u ? `<div class="me-wrap"><button class="me-row" data-v="me">${S.actAs ? entAv(S.actAs) : av(u)}<div class="info"><b>${esc(S.actAs ? S.actAs.name : u.name)}</b><div class="sub">${S.actAs ? 'পেইজ দেখুন' : 'আপনার প্রোফাইল দেখুন'}</div></div></button><button class="sw-toggle" id="sw-toggle" aria-label="প্রোফাইল বা পেইজ বদলান" aria-expanded="false" hidden>${ic('users', 16)}<span class="chev">▾</span></button><div id="switcher" class="sw-drop" hidden></div></div>`
      : `${demoCard()}<div class="card"><b>আপনি লগইন করেননি</b><p class="mut" style="margin:4px 0 10px">পোস্ট, বন্ধু, গ্রুপ ও পেইজ ব্যবহার করতে লগইন করুন।</p><button class="btn wide" data-v="me">লগইন / অ্যাকাউন্ট খুলুন</button></div>`}
    ${u?.admin ? `<button class="me-row admin-row" data-mgo="admin"><span class="ent-av" style="width:42px;height:42px;border-radius:12px;font-size:0">${ic('shield', 22)}</span><div class="info"><b>অ্যাডমিন ড্যাশবোর্ড</b><div class="sub">অ্যাপের সংখ্যা ও সেটিংস</div></div></button>` : ''}
    <div class="sc-grid">
      ${sc('dir', '🏥', 'সেবা ডিরেক্টরি', 'উপজেলার সব সেবা')}
      ${sc('blood', '🩸', 'ব্লাড ব্যাংক', 'রক্তদাতা খুঁজুন', 'featBlood')}
      ${sc('sos', '🚨', 'জরুরি নম্বর', '৯৯৯ ও হেল্পলাইন')}
      ${sc('saved', '🔖', 'সেভ করা পোস্ট', '')}
      ${sc('wallet', '🪙', 'কয়েন ও ব্যাজ', 'ভেরিফাইড ব্যাজ নিন')}
      ${sc('insights', '📊', 'ড্যাশবোর্ড', 'পোস্ট কতজন দেখছেন')}
      ${sc('groups', '👥', 'গ্রুপ', 'যোগ দিন বা তৈরি করুন', 'featGroups')}
      ${sc('pages', '🏳️', 'পেইজ', 'ব্যবসা ও প্রতিষ্ঠান', 'featPages')}
    </div>
    <details class="card"${u ? '' : ' hidden'}><summary>⚙️ সেটিংস ও প্রাইভেসি</summary><div class="setlist">
      <button id="edit">প্রোফাইল এডিট</button>
      <button id="chpw">পাসওয়ার্ড পরিবর্তন</button>
      <button id="plock">🔒 প্রোফাইল লক<span class="val">${u?.locked ? 'চালু' : 'বন্ধ'}</span></button>
      <button id="daily-tog">🕌 নামাজের সময় ও আবহাওয়া কার্ড<span class="val">${local.get('daily-off') ? 'বন্ধ' : 'চালু'}</span></button>
      <button id="listpriv">বন্ধু, ফলোয়ার ও ফলো করছেন তালিকা কারা দেখবে</button>
      <button id="blocked">ব্লক করা মানুষ</button>
      <button id="theme">থিম<span class="val">${esc((THEMES.find(t => t[0] === local.get('theme', '')) || THEMES[0])[1])}</span></button>
      <a href="./privacy.html">গোপনীয়তা নীতি ও ব্যবহারের নিয়ম</a>
      <button id="delacc" style="color:var(--r)">অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলুন</button></div></details>
    <details class="card"><summary>❓ সাহায্য ও সহায়তা</summary><div class="setlist">
      ${S.api.demoLogin ? '<button id="demo-guide">🧪 ডেমো চেকলিস্ট: কী কী দেখবেন</button><button id="demo-reset">🔄 ডেমো প্রোফাইল নতুন করে সাজান</button>' : ''}
      <button id="help">কোনো সমস্যা জানান</button>
      <button id="about">অ্যাপ সম্পর্কে<span class="val">${esc(versionLabel())}</span></button></div></details>
    ${u ? '<button class="btn ghost wide" id="logout" style="margin-top:4px">লগআউট</button>' : ''}`;
  document.querySelectorAll('#menu details').forEach((d, i) => { d.open = !!wasOpen[i]; });
  if (u) switcherHtml().then(h => { const el = $('#switcher'), t = $('#sw-toggle'); if (!el || !h) return; el.innerHTML = h; t.hidden = false; });
}
// ফেসবুকের মতো: নামের পাশের ▾ চাপলে প্রোফাইল/পেইজের তালিকা নামে
document.addEventListener('click', e => {
  const t = e.target.closest('#sw-toggle'), d = $('#switcher');
  if (t && d) { const open = d.hidden; d.hidden = !open; t.setAttribute('aria-expanded', open); t.classList.toggle('open', open); return; }
  if (d && !d.hidden && !e.target.closest('.me-wrap')) { d.hidden = true; $('#sw-toggle')?.classList.remove('open'); $('#sw-toggle')?.setAttribute('aria-expanded', 'false'); }
});
$('#menu').addEventListener('click', e => {
  const b = e.target.closest('[data-mgo]'); if (!b) return;
  const t = b.dataset.mgo;
  if (t === 'blood' && !featGuard('featBlood')) return;
  if (t === 'dir' || t === 'sos' || t === 'blood') { S.dcat = t === 'dir' ? '' : t; $('#q').value = ''; open('dir'); loadDir(); }
  else if (t === 'friends') go('friends');
  else if (!needUser()) return;
  else if (t === 'saved') { open('saved'); loadFeed('saved'); }
  else if (t === 'wallet') { open('wallet'); loadWallet(); }
  else if (t === 'insights') { S.insTarget = null; open('insights'); loadInsights(); }
  else if (t === 'pages') { if (featGuard('featPages')) { open('pages'); loadPages(); } }
  else if (t === 'groups') { if (featGuard('featGroups')) { open('groups'); loadGroups(); } }
  else if (t === 'admin') { open('admin'); loadAdmin(); }
});

// ================================================================ কয়েন ও ভেরিফাইড ব্যাজ
const COIN_RULES = [['earnPost', 'পোস্ট করলে'], ['earnComment', 'মন্তব্য করলে'], ['earnLike', 'লাইক/রিয়্যাক্ট দিলে'], ['earnShare', 'শেয়ার করলে'], ['earnCap', 'দিনে সর্বোচ্চ আয়'], ['badgePrice', 'ব্যাজের দাম (কয়েন)'], ['badgeDays', 'ব্যাজের মেয়াদ (দিন)'], ['boostPrice', 'বুস্টের দাম (প্রতিদিন)']];
const COIN_WHY = { post: 'পোস্ট করেছেন', comment: 'মন্তব্য করেছেন', like: 'রিয়্যাক্ট দিয়েছেন', share: 'শেয়ার করেছেন', badge: 'ভেরিফাইড ব্যাজ', boost: 'পোস্ট বুস্ট', refund: 'কয়েন ফেরত', admin: 'অ্যাডমিন দিয়েছেন' };
const VCATS = ['জনপ্রতিনিধি', 'রাজনীতিবিদ', 'সরকারি কর্মকর্তা', 'সাংবাদিক', 'শিল্পী / লেখক', 'খেলোয়াড়', 'ব্যবসায়ী / প্রতিষ্ঠান', 'শিক্ষক / চিকিৎসক', 'সমাজকর্মী', 'অন্যান্য'];
const coin = n => `🪙 ${bn(n)}`;
const setN = k => Number(S.settings[k] ?? SETTING_KEYS[k][1]) || 0;
const dateBn = d => new Date(d).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

async function loadWallet() {
  const box = $('#wallet'), u = me();
  if (!u) { box.innerHTML = '<div class="empty">কয়েন ও ব্যাজ দেখতে লগইন করুন।</div>'; return; }
  box.innerHTML = '<div class="skel"></div>';
  try {
    const [w, req, boosts] = await Promise.all([S.api.wallet(), S.api.myVerifyRequest(), S.api.myBoosts().catch(() => []), S.api.settings().then(v => { S.settings = { ...S.settings, ...v }; }).catch(() => {})]);
    S.walletCoins = w.coins;
    const price = setN('badgePrice'), days = setN('badgeDays'), cap = setN('earnCap'), pending = req?.status === 'pending';
    const badge = u.verified;
    let status;
    if (badge === 'authentic') status = `<div class="vb-status ok">${vb('authentic')} <span><b>আপনার অ্যাকাউন্ট ভেরিফাইড</b><small>পাবলিক ফিগার হিসেবে যাচাই করা</small></span></div>`;
    else if (badge === 'paid') status = `<div class="vb-status ok">${vb('paid')} <span><b>ব্যাজ চালু আছে</b><small>মেয়াদ ${dateBn(u.verifiedUntil)} পর্যন্ত</small></span></div>`;
    else status = `<div class="vb-status"><span class="vb-off">${VB_SVG}</span><span><b>এখনো ব্যাজ নেই</b><small>নামের পাশে নীল ব্যাজ দেখাতে আবেদন করুন</small></span></div>`;
    const reqBox = pending
      ? `<div class="vreq-box"><b>${req.kind === 'paid' ? 'কয়েন দিয়ে ব্যাজের' : 'পাবলিক ফিগার ব্যাজের'} আবেদন বিবেচনাধীন</b><small>${esc(ago(req.createdAt))} জমা দিয়েছেন${req.coinsHeld ? ` · ${coin(req.coinsHeld)} রাখা আছে, বাতিল বা প্রত্যাখ্যান হলে ফেরত পাবেন` : ''}</small><button class="btn ghost sm" id="vreq-cancel" data-id="${req.id}">আবেদন বাতিল করুন</button></div>`
      : req?.status === 'rejected' ? `<div class="vreq-box no"><b>আগের আবেদন গ্রহণ করা হয়নি</b>${req.adminNote ? `<small>কারণ: ${esc(req.adminNote)}</small>` : ''}</div>` : '';
    const canApply = !pending && badge !== 'authentic';
    box.innerHTML = `
      <div class="card wal-top"><span class="mut">আপনার কয়েন</span><b class="wal-n">${coin(w.coins)}</b>
        <div class="wal-bar" aria-label="আজকের আয়"><i style="width:${Math.min(100, cap ? (w.today / cap) * 100 : 0)}%"></i></div>
        <small class="mut">আজ পেয়েছেন ${bn(w.today)} / সর্বোচ্চ ${bn(cap)}</small></div>
      ${u.admin ? `<button class="btn ghost wide" id="adm-self" style="margin-bottom:4px">${ic('shield', 16)} অ্যাডমিন: নিজের কয়েন ও ব্যাজ</button>` : ''}
      <h3 class="res-h">ভেরিফাইড ব্যাজ</h3>
      <div class="card">${status}${reqBox}
        ${canApply ? `<div class="vb-opts">
          ${badge === 'paid' ? '' : `<button class="vb-opt" data-vapply="public_figure"><b>পাবলিক ফিগার? ফ্রিতে আবেদন করুন</b><small>জনপ্রতিনিধি, সাংবাদিক, শিল্পী, পরিচিত প্রতিষ্ঠান ইত্যাদি। অ্যাডমিন যাচাই করে অনুমোদন দেবেন।</small></button>`}
          <button class="vb-opt" data-vapply="paid"><b>${badge === 'paid' ? 'মেয়াদ বাড়ান' : 'কয়েন দিয়ে ব্যাজ নিন'}: ${coin(price)} · ${bn(days)} দিন</b><small>${w.coins >= price ? 'যে কেউ নিতে পারেন। অ্যাডমিন অনুমোদন দিলে চালু হবে।' : `আরও ${bn(price - w.coins)} কয়েন দরকার। পোস্ট, মন্তব্য, লাইক ও শেয়ার করে কয়েন জমান।`}</small></button>
        </div>` : ''}
      </div>
      <h3 class="res-h">আমার বুস্ট করা পোস্ট</h3>
      <div class="card">${boosts.length ? boosts.map(boostRow).join('') : `<p class="mut" style="margin:0">নিজের পাবলিক পোস্টের ⋯ মেনু থেকে "পোস্ট বুস্ট করুন" চাপলে পোস্টটি এলাকার আরও অনেকের হোম ফিডে "স্পন্সরড" হিসেবে দেখাবে। খরচ প্রতিদিন ${coin(setN('boostPrice'))}।</p>`}</div>
      <h3 class="res-h">কীভাবে কয়েন পাবেন</h3>
      <div class="card earn-rules">
        ${[['post', 'পোস্ট করলে', 'earnPost'], ['comment', 'অন্যের পোস্টে মন্তব্য করলে', 'earnComment'], ['like', 'অন্যের পোস্টে লাইক বা রিয়্যাক্ট দিলে', 'earnLike'], ['share', 'অন্যের পোস্ট শেয়ার করলে', 'earnShare']]
          .map(([, l, k]) => `<div class="er-row"><span>${l}</span><b>+${bn(setN(k))}</b></div>`).join('')}
        <p class="mut" style="margin:8px 0 0;font-size:13px">দিনে সর্বোচ্চ ${bn(cap)} কয়েন। একই পোস্টে বারবার লাইক দিলে বা নিজের পোস্টে কয়েন হয় না। কয়েন শুধু অ্যাপের ভেতরে ব্যাজ নিতে ও পোস্ট বুস্ট করতে খরচ করা যায়, টাকা হিসেবে তোলা যায় না।</p>
      </div>
      <h3 class="res-h">কয়েনের হিসাব</h3>
      <div class="card ledger">${w.ledger.length ? w.ledger.map(l => `<div class="lg-row"><span><b>${COIN_WHY[l.reason] || l.reason}</b><small>${esc(ago(l.createdAt))}</small></span><b class="${l.amount < 0 ? 'neg' : 'pos'}">${l.amount < 0 ? '−' : '+'}${bn(Math.abs(l.amount))}</b></div>`).join('') : '<p class="mut" style="margin:0">এখনো কোনো হিসাব নেই।</p>'}</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
$('#wallet').addEventListener('click', async e => {
  const bo = e.target.closest('[data-bopen]'); if (bo) return openPost(bo.dataset.bopen);
  if (e.target.closest('#adm-self')) return adminUserSheet(me(), async () => { await S.api.reloadMe?.(); loadWallet(); });
  const a = e.target.closest('[data-vapply]');
  if (a) return verifySheet(a.dataset.vapply);
  if (e.target.id === 'vreq-cancel') {
    if (!(await confirmSheet('ব্যাজের আবেদন বাতিল করবেন? কয়েন রাখা থাকলে ফেরত পাবেন।', 'হ্যাঁ, বাতিল করুন', true))) return;
    busy(e.target, async () => { await S.api.cancelVerification(Number(e.target.dataset.id)); toast('আবেদন বাতিল হয়েছে'); loadWallet(); });
  }
});
// পেইজের মালিক: পেইজের ব্যাজের অবস্থা ও আবেদন
async function pageBadgeSheet(pg) {
  openSheet('<div class="skel"></div>');
  try {
    const [req, w] = await Promise.all([S.api.myVerifyRequest(pg.id), S.api.wallet()]);
    S.walletCoins = w.coins;
    const price = setN('badgePrice'), days = setN('badgeDays'), pending = req?.status === 'pending';
    const status = pg.verified === 'authentic' ? `<div class="vb-status ok">${vb('authentic')} <span><b>পেইজটি ভেরিফাইড</b><small>পরিচিত প্রতিষ্ঠান হিসেবে যাচাই করা</small></span></div>`
      : pg.verified === 'paid' ? `<div class="vb-status ok">${vb('paid')} <span><b>পেইজের ব্যাজ চালু আছে</b><small>মেয়াদ ${dateBn(pg.verifiedUntil)} পর্যন্ত</small></span></div>`
      : `<div class="vb-status"><span class="vb-off">${VB_SVG}</span><span><b>পেইজে এখনো ব্যাজ নেই</b><small>পেইজের নামের পাশে নীল ব্যাজ দেখাতে আবেদন করুন</small></span></div>`;
    const reqBox = pending ? `<div class="vreq-box"><b>${req.kind === 'paid' ? 'কয়েন দিয়ে ব্যাজের' : 'প্রতিষ্ঠান হিসেবে'} আবেদন বিবেচনাধীন</b><small>${esc(ago(req.createdAt))} জমা দিয়েছেন${req.coinsHeld ? ` · ${coin(req.coinsHeld)} রাখা আছে` : ''}</small><button class="btn ghost sm" id="pvreq-cancel">আবেদন বাতিল করুন</button></div>`
      : req?.status === 'rejected' ? `<div class="vreq-box no"><b>আগের আবেদন গ্রহণ করা হয়নি</b>${req.adminNote ? `<small>কারণ: ${esc(req.adminNote)}</small>` : ''}</div>` : '';
    const canApply = !pending && pg.verified !== 'authentic';
    openSheet(`<h2>${esc(pg.name)}: ভেরিফাইড ব্যাজ</h2>${status}${reqBox}
      ${canApply ? `<div class="vb-opts">
        ${pg.verified === 'paid' ? '' : `<button class="vb-opt" data-pvapply="public_figure"><b>পরিচিত প্রতিষ্ঠান বা ব্র্যান্ড? ফ্রিতে আবেদন করুন</b><small>সরকারি অফিস, স্কুল-কলেজ, হাসপাতাল, পরিচিত দোকান বা সংগঠন। অ্যাডমিন যাচাই করে অনুমোদন দেবেন।</small></button>`}
        <button class="vb-opt" data-pvapply="paid"><b>${pg.verified === 'paid' ? 'মেয়াদ বাড়ান' : 'কয়েন দিয়ে ব্যাজ নিন'}: ${coin(price)} · ${bn(days)} দিন</b><small>${w.coins >= price ? `আপনার কয়েন থেকে কাটা হবে (আছে ${bn(w.coins)})। অ্যাডমিন অনুমোদন দিলে চালু হবে।` : `আপনার আছে ${bn(w.coins)}, আরও ${bn(price - w.coins)} কয়েন দরকার।`}</small></button>
      </div>` : ''}
      <button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
    $('#sheet').onclick = ev => {
      const a = ev.target.closest('[data-pvapply]'); if (a) return verifySheet(a.dataset.pvapply, pg);
      if (ev.target.id === 'pvreq-cancel') busy(ev.target, async () => { await S.api.cancelVerification(req.id); toast('আবেদন বাতিল হয়েছে'); pageBadgeSheet(pg); });
    };
  } catch (e) { closeSheet(); toast(errText(e)); }
}
function adminPageBadgeSheet(pg) {
  const cur = pg.verified || '';
  openSheet(`<h2>${esc(pg.name)}${vb(pg.verified)}</h2><p class="mut" style="margin-top:0">শুধু অ্যাডমিন দেখছেন</p>
    <div class="adm-sec"><b>${ic('check', 16)} পেইজের ভেরিফাইড ব্যাজ</b><div class="adm-opts">
      <label><input type="radio" name="apb" value="" ${cur ? '' : 'checked'}><span>ব্যাজ নেই</span></label>
      <label><input type="radio" name="apb" value="authentic" ${cur === 'authentic' ? 'checked' : ''}><span>${vb('authentic')} পরিচিত প্রতিষ্ঠান (স্থায়ী)</span></label>
      <label><input type="radio" name="apb" value="paid" ${cur === 'paid' ? 'checked' : ''}><span>${vb('paid')} মেয়াদি ব্যাজ</span></label></div>
      <label class="adm-days" id="apb-days-w" ${cur === 'paid' ? '' : 'hidden'}>কত দিন (আজ থেকে)<input class="f" type="number" id="apb-days" min="1" max="3650" value="${setN('badgeDays')}"></label>
      <button class="btn sm" id="apb-save" style="margin-top:8px">ব্যাজ সংরক্ষণ</button></div>
    <button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
  $('#sheet').onchange = ev => { if (ev.target.name === 'apb') $('#apb-days-w').hidden = ev.target.value !== 'paid'; };
  $('#apb-save').onclick = ev => {
    const v = document.querySelector('[name="apb"]:checked').value, d = Math.max(1, parseInt($('#apb-days').value, 10) || 30);
    busy(ev.currentTarget, async () => { await S.api.adminSetPageBadge(pg.id, v || null, v === 'paid' ? d : null); closeSheet(); toast(v ? 'পেইজে ব্যাজ দেওয়া হয়েছে' : 'পেইজের ব্যাজ সরানো হয়েছে'); openPage(pg.id, true); });
  };
}
const VCATS_PAGE = ['সরকারি প্রতিষ্ঠান', 'শিক্ষাপ্রতিষ্ঠান', 'হাসপাতাল / ক্লিনিক', 'ব্যবসা প্রতিষ্ঠান / ব্র্যান্ড', 'সংবাদমাধ্যম', 'স্বেচ্ছাসেবী সংগঠন', 'রাজনৈতিক সংগঠন', 'অন্যান্য'];
function verifySheet(kind, page) {
  const u = me(), paid = kind === 'paid', price = setN('badgePrice'), days = setN('badgeDays');
  if (paid && (S.walletCoins ?? 0) < price) return toast(`যথেষ্ট কয়েন নেই, দরকার ${bn(price)}`);
  openSheet(`<h2>${paid ? 'কয়েন দিয়ে ভেরিফাইড ব্যাজ' : page ? 'পরিচিত প্রতিষ্ঠান হিসেবে আবেদন' : 'পাবলিক ফিগার হিসেবে আবেদন'}</h2>${page ? `<p class="vf-for">${entAv(page)} <b>${esc(page.name)}</b> পেইজের জন্য</p>` : ''}
    <p class="mut" style="margin-top:0">${paid ? `${coin(price)} কাটা হবে, অনুমোদন পেলে ${bn(days)} দিন নামের পাশে নীল ব্যাজ দেখাবে। আবেদন বাতিল বা প্রত্যাখ্যাত হলে কয়েন ফেরত পাবেন।` : (page ? 'অ্যাডমিন প্রতিষ্ঠানটি যাচাই করে অনুমোদন দিলে পেইজের নামের পাশে স্থায়ী নীল ব্যাজ দেখাবে। এটা ফ্রি।' : 'অ্যাডমিন আপনার পরিচয় যাচাই করে অনুমোদন দিলে নামের পাশে স্থায়ী নীল ব্যাজ দেখাবে। এটা ফ্রি।')}</p>
    <form id="vform">
      <label for="vf-name">${page ? 'প্রতিষ্ঠানের পুরো নাম' : 'পুরো নাম (পরিচয়পত্র বা পরিচিতি অনুযায়ী)'}</label><input id="vf-name" required minlength="2" maxlength="80" value="${esc(page ? page.name : u.name)}">
      ${paid ? '' : `<label for="vf-cat">${page ? 'প্রতিষ্ঠানের ধরন' : 'আপনি কে'}</label><select id="vf-cat" required><option value="">বেছে নিন</option>${(page ? VCATS_PAGE : VCATS).map(c => `<option>${c}</option>`).join('')}</select>
      <label for="vf-links">পরিচিতির প্রমাণ (লিংক)</label><textarea id="vf-links" rows="2" maxlength="500" required placeholder="${page ? 'যেমন: প্রতিষ্ঠানের ওয়েবসাইট, ট্রেড লাইসেন্স বা নিবন্ধনের তথ্য, খবরের লিংক' : 'যেমন: আপনাকে নিয়ে খবর, অফিসিয়াল ওয়েবসাইট বা ফেসবুক পেইজের লিংক'}"></textarea>`}
      <label for="vf-note">${paid ? 'অ্যাডমিনকে কিছু জানাতে চাইলে (ঐচ্ছিক)' : 'আরও কিছু জানাতে চাইলে (ঐচ্ছিক)'}</label><textarea id="vf-note" rows="2" maxlength="500"></textarea>
      <div class="row" style="margin-top:14px"><button class="btn" style="flex:1">${paid ? `${coin(price)} দিয়ে আবেদন` : 'আবেদন জমা দিন'}</button><button class="btn ghost" type="button" data-close>বাতিল</button></div>
    </form>`);
  $('#vform').onsubmit = ev => {
    ev.preventDefault();
    const v = { kind, pageId: page?.id || null, name: $('#vf-name').value.trim(), category: $('#vf-cat')?.value || '', links: $('#vf-links')?.value.trim() || '', note: $('#vf-note').value.trim() };
    busy(ev.submitter, async () => { await S.api.requestVerification(v); closeSheet(); toast('আবেদন জমা হয়েছে, অ্যাডমিন দেখে জানাবেন'); if (page) openPage(page.id, true); else loadWallet(); });
  };
}
// প্রোফাইলে ব্যাজে চাপলে কী ধরনের ব্যাজ তা দেখায়
document.addEventListener('click', e => {
  const b = e.target.closest('[data-vbinfo]'); if (!b) return;
  e.stopPropagation();
  const auth = b.dataset.vbinfo === 'authentic';
  openSheet(`<div class="vb-info">${vb(b.dataset.vbinfo)}<h2>ভেরিফাইড অ্যাকাউন্ট</h2>
    <p>${auth ? 'অ্যাডমিন যাচাই করেছেন যে এটি এই পাবলিক ফিগার বা প্রতিষ্ঠানের আসল অ্যাকাউন্ট।' : 'এই অ্যাকাউন্ট কয়েন দিয়ে ভেরিফাইড ব্যাজ নিয়েছে এবং অ্যাডমিন অনুমোদন দিয়েছেন।'}</p>
    ${me() ? '<button class="btn wide" data-mgo2="wallet">আমিও ব্যাজ নিতে চাই</button>' : ''}<button class="btn ghost wide" data-close style="margin-top:8px">ঠিক আছে</button></div>`);
});
document.addEventListener('click', e => { if (e.target.closest('[data-mgo2="wallet"]')) { closeSheet(); open('wallet'); loadWallet(); } });

const BOOST_ST = { pending: ['অনুমোদনের অপেক্ষায়', 'wait'], active: ['চলছে', 'on'], ended: ['শেষ হয়েছে', 'off'], stopped: ['বন্ধ করা হয়েছে', 'off'], cancelled: ['বাতিল', 'off'], rejected: ['গ্রহণ হয়নি', 'no'] };
const BOOST_DAYS = [1, 3, 7, 15, 30];
const daysLeft = d => Math.max(0, Math.ceil((new Date(d) - Date.now()) / 864e5));
function boostRow(b) {
  const st = boostState(b), [lbl, cls] = BOOST_ST[st] || [st, 'off'];
  return `<button class="bo-row" data-bopen="${b.postId}">${b.postImage ? `<img loading="lazy" decoding="async" src="${esc(b.postImage)}" alt="">` : `<span class="bo-ph">${ic('post', 18)}</span>`}
    <span class="bo-tx"><b>${esc((b.postBody || 'ছবি পোস্ট').slice(0, 60))}</b><small>${bn(b.days)} দিন · ${b.unionName ? esc(b.unionName) : 'পুরো উপজেলা'} · ${coin(b.coins)}${st === 'active' ? ` · আর ${bn(daysLeft(b.endsAt))} দিন` : ''}</small>
    <small><span class="bo-st ${cls}">${lbl}</span>${b.reach || st === 'active' || st === 'ended' ? ` · ${bn(b.reach)} জন দেখেছেন` : ''}${b.adminNote && st === 'rejected' ? ` · কারণ: ${esc(b.adminNote)}` : ''}</small></span></button>`;
}
async function boostSheet(p) {
  openSheet('<div class="skel"></div>');
  try {
    const [b, w] = await Promise.all([S.api.postBoost(p.id), S.api.wallet()]);
    const st = b && boostState(b);
    if (b && (st === 'pending' || st === 'active')) {
      openSheet(`<h2>পোস্ট বুস্ট</h2>${boostRow(b).replace('<button class="bo-row"', '<div class="bo-row"').replace(/<\/button>$/, '</div>')}
        <p class="mut" style="font-size:13px">${st === 'pending' ? 'অ্যাডমিন অনুমোদন দিলে চালু হবে। এখন বাতিল করলে পুরো কয়েন ফেরত পাবেন।' : 'এখন বন্ধ করলে বাকি পুরো দিনগুলোর কয়েন ফেরত পাবেন।'}</p>
        <button class="btn danger wide" id="bo-cancel">${st === 'pending' ? 'বুস্ট বাতিল করুন' : 'বুস্ট বন্ধ করুন'}</button><button class="btn ghost wide" data-close style="margin-top:8px">ঠিক আছে</button>`);
      $('#bo-cancel').onclick = ev => busy(ev.currentTarget, async () => { await S.api.cancelBoost(b.id); closeSheet(); toast(st === 'pending' ? 'বুস্ট বাতিল হয়েছে, কয়েন ফেরত গেছে' : 'বুস্ট বন্ধ হয়েছে'); });
      return;
    }
    const per = setN('boostPrice');
    openSheet(`<h2>পোস্ট বুস্ট করুন</h2>
      <p class="mut" style="margin-top:0">পোস্টটি এলাকার আরও অনেকের হোম ফিডে "স্পন্সরড" হিসেবে দেখাবে। অ্যাডমিন অনুমোদন দিলে চালু হবে।</p>
      <div class="bo-prev">${esc((p.body || 'ছবি পোস্ট').slice(0, 90))}</div>
      <form id="boform">
        <label>কত দিন</label><div class="bo-days">${BOOST_DAYS.map((d, i) => `<label><input type="radio" name="bod" value="${d}" ${i === 2 ? 'checked' : ''}><span>${bn(d)} দিন</span></label>`).join('')}</div>
        <label for="bo-aud">কাদের দেখাবে</label><select class="f" id="bo-aud"><option value="">পুরো উপজেলার সবাই</option>${unionOptions('')}</select>
        <div class="bo-sum"><span>মোট খরচ</span><b id="bo-total"></b></div>
        <p class="mut" id="bo-bal" style="margin:4px 0 0;font-size:13px"></p>
        <div class="row" style="margin-top:14px"><button class="btn" style="flex:1" id="bo-go">বুস্ট করুন</button><button class="btn ghost" type="button" data-close>বাতিল</button></div>
      </form>`);
    const upd = () => {
      const d = Number(document.querySelector('[name="bod"]:checked').value), cost = d * per, ok = w.coins >= cost;
      $('#bo-total').textContent = coin(cost);
      $('#bo-bal').textContent = ok ? `আপনার আছে ${bn(w.coins)} কয়েন, বুস্টের পর থাকবে ${bn(w.coins - cost)}` : `আপনার আছে ${bn(w.coins)} কয়েন, আরও ${bn(cost - w.coins)} কয়েন দরকার`;
      $('#bo-bal').classList.toggle('err', !ok); $('#bo-go').disabled = !ok;
    };
    $('#boform').onchange = upd; upd();
    $('#boform').onsubmit = ev => {
      ev.preventDefault();
      const d = Number(document.querySelector('[name="bod"]:checked').value), un = $('#bo-aud').value;
      busy(ev.submitter, async () => { await S.api.requestBoost(p.id, d, un ? Number(un) : null); closeSheet(); toast('বুস্টের আবেদন জমা হয়েছে, অনুমোদন পেলে চালু হবে'); });
    };
  } catch (e) { closeSheet(); toast(errText(e)); }
}
const adminBoostCard = b => `<div class="card vreq-card">
  <div class="person" style="padding:0">${userLink(b.userId, av(b.user || { name: '?' }))}<div class="info">${userLink(b.userId, esc(b.user?.name || 'সদস্য') + vb(b.user?.verified), 'who-btn')}<div class="sub">${esc(ago(b.createdAt))}</div></div>
    <span class="vk paid">${coin(b.coins)}</span></div>
  <button class="bo-row" data-openpost="${b.postId}" style="margin-top:8px">${b.postImage ? `<img loading="lazy" decoding="async" src="${esc(b.postImage)}" alt="">` : `<span class="bo-ph">${ic('post', 18)}</span>`}<span class="bo-tx"><b>${esc((b.postBody || 'ছবি পোস্ট').slice(0, 80))}</b><small>${bn(b.days)} দিন · ${b.unionName ? esc(b.unionName) : 'পুরো উপজেলা'} · পোস্ট দেখুন ↗</small></span></button>
  <div class="row" style="margin-top:8px"><button class="btn sm" style="flex:1" data-bdec="${b.id}" data-ok="1">অনুমোদন</button><button class="btn ghost sm" style="flex:1" data-bdec="${b.id}" data-ok="0">প্রত্যাখ্যান</button></div></div>`;
function decideBoostUI(id, ok, btn) {
  if (ok) return busy(btn, async () => { await S.api.decideBoost(id, true); toast('বুস্ট চালু হয়েছে'); loadAdmin(); });
  openSheet(`<h2>বুস্ট প্রত্যাখ্যান</h2><form id="brjform"><label for="brj-note">কারণ (পোস্টদাতা দেখবেন)</label><textarea id="brj-note" rows="3" maxlength="300" placeholder="যেমন: পোস্টে ভুল বা বিভ্রান্তিকর তথ্য আছে"></textarea>
    <div class="row" style="margin-top:14px"><button class="btn danger" style="flex:1">প্রত্যাখ্যান করুন</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
  $('#brjform').onsubmit = ev => { ev.preventDefault(); busy(ev.submitter, async () => { await S.api.decideBoost(id, false, $('#brj-note').value.trim()); closeSheet(); toast('প্রত্যাখ্যান করা হয়েছে, কয়েন ফেরত গেছে'); loadAdmin(); }); };
}
// অ্যাডমিন: কাউকে কয়েন দেওয়া/কাটা এবং ব্যাজ দেওয়া/সরানো
async function adminUserSheet(u, after) {
  if (!me()?.admin) return;
  openSheet('<div class="skel"></div>');
  try {
    const w = await S.api.adminUserWallet(u.id), cur = u.verified || '';
    openSheet(`<h2>${esc(u.name)}${vb(u.verified)}</h2><p class="mut" style="margin-top:0">শুধু অ্যাডমিন দেখছেন</p>
      <div class="adm-sec"><b>${ic('check', 16)} ভেরিফাইড ব্যাজ</b>
        <div class="adm-opts">
          <label><input type="radio" name="abd" value="" ${cur ? '' : 'checked'}><span>ব্যাজ নেই</span></label>
          <label><input type="radio" name="abd" value="authentic" ${cur === 'authentic' ? 'checked' : ''}><span>${vb('authentic')} পাবলিক ফিগার (স্থায়ী)</span></label>
          <label><input type="radio" name="abd" value="paid" ${cur === 'paid' ? 'checked' : ''}><span>${vb('paid')} মেয়াদি ব্যাজ</span></label>
        </div>
        <label class="adm-days" id="abd-days-w" ${cur === 'paid' ? '' : 'hidden'}>কত দিন (আজ থেকে)<input class="f" type="number" id="abd-days" min="1" max="3650" value="${u.verifiedUntil && cur === 'paid' ? daysLeft(u.verifiedUntil) || 30 : setN('badgeDays')}"></label>
        ${cur === 'paid' && u.verifiedUntil ? `<small class="mut">এখনকার মেয়াদ: ${dateBn(u.verifiedUntil)} পর্যন্ত</small>` : ''}
        <button class="btn sm" id="abd-save" style="margin-top:8px">ব্যাজ সংরক্ষণ</button></div>
      <div class="adm-sec"><b>🪙 কয়েন</b><div class="mut" style="margin:2px 0 6px">এখন আছে: <b id="ac-bal">${bn(w.coins)}</b></div>
        <div class="row"><input class="f" type="number" id="ac-amt" min="1" max="100000" placeholder="পরিমাণ" style="flex:1"><input class="f" id="ac-note" maxlength="60" placeholder="কারণ (ঐচ্ছিক)" style="flex:1.4"></div>
        <div class="row" style="margin-top:8px"><button class="btn sm" style="flex:1" data-acoin="1">যোগ করুন</button><button class="btn ghost sm" style="flex:1" data-acoin="-1">কেটে নিন</button></div></div>
      <button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
    $('#sheet').onchange = ev => { if (ev.target.name === 'abd') $('#abd-days-w').hidden = ev.target.value !== 'paid'; };
    $('#abd-save').onclick = ev => {
      const v = document.querySelector('[name="abd"]:checked').value, days = Math.max(1, parseInt($('#abd-days').value, 10) || 30);
      busy(ev.currentTarget, async () => { await S.api.adminSetBadge(u.id, v || null, v === 'paid' ? days : null); toast(v ? 'ব্যাজ দেওয়া হয়েছে' : 'ব্যাজ সরানো হয়েছে'); closeSheet(); after?.(); });
    };
    $('#sheet').querySelectorAll('[data-acoin]').forEach(b => b.onclick = ev => {
      const n = parseInt($('#ac-amt').value, 10);
      if (!n || n < 1) return toast('কয়েনের পরিমাণ লিখুন');
      const amt = n * Number(b.dataset.acoin);
      busy(ev.currentTarget, async () => {
        await S.api.adminAdjustCoins(u.id, amt, $('#ac-note').value.trim());
        $('#ac-bal').textContent = bn((await S.api.adminUserWallet(u.id)).coins); $('#ac-amt').value = '';
        toast(amt > 0 ? `${bn(n)} কয়েন যোগ হয়েছে` : `${bn(n)} কয়েন কাটা হয়েছে`);
        if (u.id === me()?.id && S.view === 'wallet') loadWallet();
      });
    });
  } catch (e) { closeSheet(); toast(errText(e)); }
}
const adminReqCard = r => `<div class="card vreq-card">
  <div class="person" style="padding:0">${userLink(r.userId, av(r.user || { name: r.name }))}<div class="info">${userLink(r.userId, esc(r.user?.name || r.name) + vb(r.user?.verified), 'who-btn')}<div class="sub">${esc(ago(r.createdAt))}</div></div>
    <span class="vk ${r.kind}">${r.kind === 'paid' ? `কয়েন (${bn(r.coinsHeld)})` : r.pageId ? 'প্রতিষ্ঠান' : 'পাবলিক ফিগার'}</span></div>
  ${r.page ? `<button class="vreq-page" data-page="${esc(r.page.id)}">${entAv(r.page)}<span><small>পেইজের জন্য আবেদন</small><b>${esc(r.page.name)}</b></span></button>` : ''}
  <dl class="vreq-dl"><dt>পুরো নাম</dt><dd>${esc(r.name)}</dd>${r.category ? `<dt>পরিচয়</dt><dd>${esc(r.category)}</dd>` : ''}${r.links ? `<dt>প্রমাণ</dt><dd>${linkify(r.links)}</dd>` : ''}${r.note ? `<dt>বার্তা</dt><dd>${esc(r.note)}</dd>` : ''}</dl>
  <div class="row"><button class="btn sm" style="flex:1" data-vreq="${r.id}" data-ok="1">অনুমোদন</button><button class="btn ghost sm" style="flex:1" data-vreq="${r.id}" data-ok="0">প্রত্যাখ্যান</button></div></div>`;
function decideReq(id, ok, btn) {
  if (ok) return busy(btn, async () => { await S.api.decideVerification(id, true); toast('অনুমোদন হয়েছে, ব্যাজ চালু'); loadAdmin(); });
  openSheet(`<h2>আবেদন প্রত্যাখ্যান</h2><form id="rjform"><label for="rj-note">কারণ (আবেদনকারী দেখবেন)</label><textarea id="rj-note" rows="3" maxlength="300" placeholder="যেমন: পরিচয়ের যথেষ্ট প্রমাণ পাওয়া যায়নি"></textarea>
    <div class="row" style="margin-top:14px"><button class="btn danger" style="flex:1">প্রত্যাখ্যান করুন</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
  $('#rjform').onsubmit = ev => { ev.preventDefault(); busy(ev.submitter, async () => { await S.api.decideVerification(id, false, $('#rj-note').value.trim()); closeSheet(); toast('প্রত্যাখ্যান করা হয়েছে, কয়েন থাকলে ফেরত গেছে'); loadAdmin(); }); };
}

// ================================================================ অ্যাডমিন ড্যাশবোর্ড
async function loadAdmin() {
  const box = $('#admin');
  if (!me()?.admin) { box.innerHTML = '<div class="empty">এই পাতা শুধু অ্যাডমিনদের জন্য।</div>'; return; }
  box.innerHTML = '<div class="skel"></div>';
  try {
    const [st, set, vreqs, aboosts] = await Promise.all([S.api.adminStats(), S.api.settings(), S.api.adminVerifyRequests().catch(() => []), S.api.adminBoosts().catch(() => [])]);
    S.settings = set;
    const stat = (icon, n, label, go) => `<button class="astat" ${go ? `data-ago="${go}"` : 'disabled'}><span class="ai">${ic(icon, 20)}</span><b>${bn(n)}</b><span>${label}</span></button>`;
    box.innerHTML = `
      <h3 class="res-h">এক নজরে</h3>
      <div class="astats">
        ${stat('users', st.users, 'মোট ব্যবহারকারী')}
        ${stat('drop', st.donors, 'অ্যাকাউন্টধারী ডোনার', 'blood')}
        ${stat('plus', st.manualDonors, 'হাতে যোগ করা ডোনার', 'blood')}
        ${stat('post', st.posts, 'মোট পোস্ট')}
        ${stat('store', st.pendingServices, 'যাচাই বাকি সেবা', 'dir')}
        ${stat('flag', st.openReports, 'অমীমাংসিত রিপোর্ট')}
      </div>
      <h3 class="res-h">ভেরিফাইড ব্যাজের আবেদন${vreqs.length ? ` <span class="cnt">${bn(vreqs.length)}</span>` : ''}</h3>
      ${vreqs.length ? vreqs.map(adminReqCard).join('') : '<div class="card mut">এখন কোনো আবেদন অপেক্ষায় নেই।</div>'}
      <h3 class="res-h">বুস্টের আবেদন${aboosts.length ? ` <span class="cnt">${bn(aboosts.length)}</span>` : ''}</h3>
      ${aboosts.length ? aboosts.map(adminBoostCard).join('') : '<div class="card mut">এখন কোনো বুস্ট অপেক্ষায় নেই।</div>'}
      <div class="card">
        <b>কয়েন ও ব্যাজের নিয়ম</b><p class="mut" style="margin:2px 0 8px">প্রতিটা কাজে কত কয়েন, দিনে সর্বোচ্চ কত, আর ব্যাজের দাম ও মেয়াদ।</p>
        <div class="ver-grid coin-grid">
          ${COIN_RULES.map(([k, l]) => `<label>${l}<input class="f" type="number" min="0" max="100000" data-coinset="${k}" value="${Number(set[k]) || 0}"></label>`).join('')}
        </div>
        <button class="btn sm" id="save-coin" style="margin-top:8px">নিয়ম সংরক্ষণ</button>
      </div>
      <h3 class="res-h">সেটিংস</h3>
      <div class="card">
        <label class="switch-row" for="set-pdp">
          <span class="sw-text"><b>লগইন ছাড়া ডোনারের মোবাইল নম্বর দেখানো</b>
          <span class="mut">চালু থাকলে অ্যাকাউন্ট ছাড়াও যে কেউ ব্লাড ব্যাংকে ডোনারের নম্বর দেখতে, কল ও WhatsApp করতে পারবে। বন্ধ থাকলে নম্বর দেখতে লগইন লাগবে।</span>
          <span class="sw-state" id="pdp-state">${set.publicDonorPhone ? 'এখন: চালু, সবাই নম্বর দেখতে পাচ্ছে' : 'এখন: বন্ধ, শুধু লগইন করা ব্যবহারকারীরা দেখতে পাচ্ছে'}</span></span>
          <input type="checkbox" id="set-pdp" class="switch" role="switch" ${set.publicDonorPhone ? 'checked' : ''}>
        </label>
      </div>
      <h3 class="res-h">অ্যাপ নিয়ন্ত্রণ</h3>
      <div class="card">
        ${[['featBlood', 'ব্লাড ব্যাংক'], ['featGroups', 'গ্রুপ'], ['featPages', 'পেইজ'], ['featBoost', 'পোস্ট বুস্ট (বিজ্ঞাপন)']].map(([k, l]) => `
        <label class="switch-row" for="set-${k}">
          <span class="sw-text"><b>${l}</b><span class="mut">বন্ধ করলে মেনু থেকে লুকিয়ে যায়; অ্যাডমিনরা তখনো দেখতে পান।</span></span>
          <input type="checkbox" id="set-${k}" data-flag="${k}" class="switch" role="switch" ${set[k] !== false ? 'checked' : ''}>
        </label>`).join('')}
      </div>
      <div class="card">
        <b>ঘোষণা</b><p class="mut" style="margin:2px 0 8px">লিখে সংরক্ষণ করলে সবার হোম পেইজের উপরে দেখাবে। মুছে সংরক্ষণ করলে সরে যাবে।</p>
        <textarea class="f" id="set-ann" rows="2" maxlength="300" placeholder="যেমন: আগামীকাল উপজেলা পরিষদে বিনামূল্যে রক্তদান কর্মসূচি">${esc(set.announcement || '')}</textarea>
        <button class="btn sm" id="save-ann" style="margin-top:8px">ঘোষণা সংরক্ষণ</button>
      </div>
      <div class="card">
        <b>অ্যাপ ভার্সন ও আপডেট</b>
        <p class="mut" style="margin:2px 0 8px">নতুন ডিজাইন ও ফিচার Play Store আপডেট ছাড়াই সবার অ্যাপে চলে যায়। শুধু নেটিভ পরিবর্তনের (আইকন, পারমিশন, নতুন প্লাগইন) পর নিচের নম্বর বাড়ান। নম্বরটা হলো Play Console-এর version code।</p>
        <div class="ver-grid">
          <label>সর্বশেষ ভার্সন<small>এর চেয়ে পুরনো অ্যাপে "আপডেট করুন" বার্তা</small><input class="f" type="number" min="0" id="set-latest" value="${Number(set.latestVersion) || 0}"></label>
          <label>সর্বনিম্ন ভার্সন<small>এর চেয়ে পুরনো অ্যাপ আপডেট ছাড়া চলবে না</small><input class="f" type="number" min="0" id="set-min" value="${Number(set.minVersion) || 0}"></label>
        </div>
        <button class="btn sm" id="save-ver" style="margin-top:8px">ভার্সন সংরক্ষণ</button>
        <p class="mut" style="margin:8px 0 0;font-size:13px">এই ডিভাইস: ${esc(versionLabel())}</p>
      </div>
      <p class="note">সেটিং বদলালে সঙ্গে সঙ্গে সব ব্যবহারকারীর জন্য কার্যকর হয়।</p>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
$('#admin').addEventListener('change', async e => {
  const flag = e.target.dataset.flag;
  if (flag) {
    const on = e.target.checked;
    return busy(null, async () => { await S.api.setSetting(flag, on); S.settings[flag] = on; settingsChanged(); toast(on ? 'চালু হয়েছে' : 'বন্ধ হয়েছে: সাধারণ ব্যবহারকারীরা আর দেখবেন না'); })
      .catch(() => { e.target.checked = !on; });
  }
  if (e.target.id !== 'set-pdp') return;
  const on = e.target.checked;
  if (on && !(await confirmSheet('লগইন ছাড়া সবাইকে ডোনারদের মোবাইল নম্বর দেখাবেন? এতে নম্বরগুলো যে কেউ সংগ্রহ করতে পারবে।', 'হ্যাঁ, চালু করুন'))) { e.target.checked = false; return; }
  await busy(null, async () => {
    await S.api.setSetting('publicDonorPhone', on); S.settings.publicDonorPhone = on;
    $('#pdp-state').textContent = on ? 'এখন: চালু, সবাই নম্বর দেখতে পাচ্ছে' : 'এখন: বন্ধ, শুধু লগইন করা ব্যবহারকারীরা দেখতে পাচ্ছে';
    toast(on ? 'চালু হয়েছে: লগইন ছাড়াও নম্বর দেখা যাবে' : 'বন্ধ হয়েছে: নম্বর দেখতে লগইন লাগবে');
  });
});
$('#admin').addEventListener('click', e => {
  const bd = e.target.closest('[data-bdec]');
  if (bd) return decideBoostUI(Number(bd.dataset.bdec), bd.dataset.ok === '1', bd);
  const vr = e.target.closest('[data-vreq]');
  if (vr) return decideReq(Number(vr.dataset.vreq), vr.dataset.ok === '1', vr);
  if (e.target.id === 'save-coin') {
    const vals = [...document.querySelectorAll('[data-coinset]')].map(i => [i.dataset.coinset, Math.max(0, parseInt(i.value, 10) || 0)]);
    if (vals.find(([k]) => k === 'badgeDays')[1] < 1) return toast('ব্যাজের মেয়াদ অন্তত ১ দিন দিন');
    return busy(e.target, async () => { for (const [k, v] of vals) { await S.api.setSetting(k, v); S.settings[k] = v; } settingsChanged(); toast('নিয়ম সংরক্ষণ হয়েছে'); });
  }
  if (e.target.id === 'save-ann') {
    const v = $('#set-ann').value.trim();
    return busy(e.target, async () => { await S.api.setSetting('announcement', v); S.settings.announcement = v; settingsChanged(); toast(v ? 'ঘোষণা প্রকাশ হয়েছে' : 'ঘোষণা সরানো হয়েছে'); });
  }
  if (e.target.id === 'save-ver') {
    const latest = Math.max(0, parseInt($('#set-latest').value, 10) || 0), min = Math.max(0, parseInt($('#set-min').value, 10) || 0);
    if (min > latest) return toast('সর্বনিম্ন ভার্সন সর্বশেষ ভার্সনের চেয়ে বড় হতে পারে না');
    return busy(e.target, async () => {
      if (min > (Number(S.settings.minVersion) || 0) && !(await confirmSheet(`ভার্সন ${bn(min)}-এর চেয়ে পুরনো অ্যাপ আর চলবে না, আপডেট করতেই হবে। Play Store-এ নতুন ভার্সন প্রকাশ হয়েছে তো?`, 'হ্যাঁ, সংরক্ষণ করুন', true))) return;
      await S.api.setSetting('latestVersion', latest); await S.api.setSetting('minVersion', min);
      Object.assign(S.settings, { latestVersion: latest, minVersion: min }); settingsChanged(); toast('ভার্সন সংরক্ষণ হয়েছে');
    });
  }
  const b = e.target.closest('[data-ago]'); if (!b) return;
  S.dcat = b.dataset.ago === 'blood' ? 'blood' : ''; $('#q').value = ''; open('dir'); loadDir();
});
document.addEventListener('click', e => {
  const id = e.target.closest('button')?.id;
  if (id === 'chpw') {
    openSheet(`<h2>পাসওয়ার্ড পরিবর্তন</h2><form id="pwform"><label for="pw1">নতুন পাসওয়ার্ড</label><input id="pw1" type="password" minlength="6" required autocomplete="new-password">
      <label for="pw2">আবার লিখুন</label><input id="pw2" type="password" minlength="6" required autocomplete="new-password">
      <div class="row" style="margin-top:16px"><button class="btn" style="flex:1">পরিবর্তন করুন</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
    $('#pwform').onsubmit = ev => { ev.preventDefault(); if ($('#pw1').value !== $('#pw2').value) return toast('দুটো পাসওয়ার্ড মেলেনি'); busy(ev.submitter, async () => { await S.api.changePassword($('#pw1').value); closeSheet(); toast('পাসওয়ার্ড পরিবর্তন হয়েছে'); }); };
  }
  if (id === 'theme') {
    const cur = local.get('theme', '');
    openSheet(`<h2>থিম</h2><div class="seg3">${THEMES.map(([v, l]) => `<label><input type="radio" name="th" value="${v}" ${v === cur ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div><button class="btn ghost wide" data-close style="margin-top:14px">ঠিক আছে</button>`);
    $('#sheet').onchange = ev => { local.set('theme', ev.target.value); applyTheme(); renderMenu(); };
  }
  if (id === 'help') openSheet(`<h2>কোনো সমস্যা জানান</h2><p>অ্যাপে কোনো সমস্যা বা পরামর্শ থাকলে এই ইমেইলে লিখুন:</p><p><b>your-email@example.com</b></p><p class="mut">কোনো পোস্ট বা মানুষের বিরুদ্ধে অভিযোগ থাকলে সেই পোস্ট বা প্রোফাইলের ⋯ মেনু থেকে রিপোর্ট করুন।</p><button class="btn ghost wide" data-close>বন্ধ করুন</button>`);
  if (id === 'about') openSheet(`<h2>আমার উপজেলা</h2><p>ভার্সন ১.০</p><p class="mut">উপজেলার মানুষকে যুক্ত রাখা আর সব সেবার তথ্য এক জায়গায় আনার জন্য তৈরি।</p><a class="link" href="./privacy.html">গোপনীয়তা নীতি</a><button class="btn ghost wide" data-close style="margin-top:10px">বন্ধ করুন</button>`);
});

// ================================================================ ছবি বেছে নেওয়ার সাধারণ ফর্ম অংশ
const photoField = (label, cur) => `<label>${esc(label)}</label><div class="row"><span class="pf-prev">${cur ? `<img loading="lazy" decoding="async" class="av" src="${esc(cur)}" alt="">` : ''}</span><label class="photo-btn" style="margin:0">ছবি বাছুন<input type="file" class="pf-file" accept="image/*"></label></div>`;
function watchPhoto(store, max = 600) {
  const inp = $('#sheet .pf-file'); if (!inp) return;
  inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { store.blob = await compress(f, max, 0.8); $('#sheet .pf-prev').innerHTML = `<img loading="lazy" decoding="async" class="av" src="${URL.createObjectURL(store.blob)}" alt="">`; } catch { toast('ছবিটি খোলা যায়নি'); } };
}

// ================================================================ পেইজ বা গ্রুপের ভেতরে নতুন পোস্ট (একই পোস্ট বক্স)
function openComposer({ pageId, groupId, title }) { openPostComposer({ pageId, groupId, title, authorName: title }); }

// ================================================================ পেইজ
const pageRow = (pg, btn) => `<div class="ent-row"><button class="ent-btn" data-page="${esc(pg.id)}">${entAv(pg)}</button><div class="info"><button class="ent-btn" data-page="${esc(pg.id)}">${esc(pg.name)}${vb(pg.verified)}</button><div class="sub">${esc(pg.category)} · ${bn(pg.followers)} ফলোয়ার</div></div>${btn || ''}</div>`;
async function loadPages() {
  const box = $('#pages'); box.innerHTML = '<div class="skel"></div>';
  try {
    const [mine, followed, all, pun] = await Promise.all([S.api.myPages(), S.api.followedPages(), S.api.discoverPages(), S.api.pageUnread().catch(() => new Map())]);
    const known = new Set([...mine, ...followed].map(x => x.id)), more = all.filter(x => !known.has(x.id));
    box.innerHTML = `
      ${mine.length ? `<div class="card"><div class="sec-h"><h3>আমার পেইজ</h3></div>${mine.map(pg => pageRow(pg, `${pun.get(pg.id) ? `<span class="badge pg-ub" title="না-পড়া মেসেজ">💬 ${bn(pun.get(pg.id))}</span>` : ''}<span class="tag">${pg.isAdmin ? 'অ্যাডমিন' : 'মালিক'}</span>`)).join('')}</div>` : ''}
      <div class="card"><div class="sec-h"><h3>ফলো করা পেইজ</h3></div>${followed.length ? followed.map(pg => pageRow(pg, `<button class="sbtn ghost" data-pf="${esc(pg.id)}" data-on="1">ফলো করছেন ✓</button>`)).join('') : '<div class="mut">কোনো পেইজ ফলো করছেন না</div>'}</div>
      <div class="card"><div class="sec-h"><h3>আরও পেইজ</h3></div>${more.length ? more.map(pg => pageRow(pg, `<button class="sbtn" data-pf="${esc(pg.id)}" data-on="0">ফলো করুন</button>`)).join('') : '<div class="mut">আর কোনো পেইজ নেই</div>'}</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
async function openPage(id, silent) {
  if (!silent) { S.pageId = Number(id) || id; S.feeds.page.posts = []; open('page'); $('#page').innerHTML = '<div class="skel"></div>'; $('#feed-page').innerHTML = ''; }
  try {
    const pg = await S.api.page(S.pageId);
    const tel = String(pg.phone || '').replace(/[^\d+]/g, '');
    if (S.curPage?.id !== pg.id) Object.assign(S.pstate.page, { tab: 'posts', seg: 'all', album: null });
    S.curPage = pg;
    $('#page').innerHTML = `<div class="card ent-head prof-fb pg-head">${pageCoverHtml(pg)}<h2 style="margin:8px 0 0">${esc(pg.name)}${vb(pg.verified, true)}</h2><div class="meta">${esc(pg.category)} · ${bn(pg.followers)} ফলোয়ার</div>
      ${pg.about ? `<p class="about">${esc(pg.about)}</p>` : ''}${pg.phone ? `<p class="meta" style="margin:6px 0 0">📞 ${esc(bn(pg.phone))}</p>` : ''}
      ${pageAddrHtml(pg)}
      <div class="row">${pg.canManage
        ? `<button class="sbtn" id="pg-inbox">💬 মেসেজ<span class="badge" id="pg-unread" hidden></span></button><button class="sbtn ghost" data-insights="page" data-entid="${esc(pg.id)}" data-entname="${esc(pg.name)}">📊 ড্যাশবোর্ড</button>${pg.isOwner ? `<button class="sbtn ghost" id="pg-badge">${pg.verified ? '✔ ব্যাজ' : '✔ ব্যাজ নিন'}</button>` : ''}<button class="sbtn ghost" id="pg-share">🔗 শেয়ার</button><button class="sbtn ghost" data-actas="${S.actAs?.id === pg.id ? '' : esc(pg.id)}">${S.actAs?.id === pg.id ? '👤 নিজের প্রোফাইলে ফিরুন' : '🔄 পেইজ হিসেবে চলুন'}</button><button class="more" id="pg-set" aria-label="পেইজের সেটিং">⚙️</button>`
        : `<button class="sbtn ${pg.following ? 'ghost' : ''}" data-pf="${esc(pg.id)}" data-on="${pg.following ? 1 : 0}">${pg.following ? 'ফলো করছেন ✓' : 'ফলো করুন'}</button><button class="sbtn ghost" id="pg-msg">💬 মেসেজ</button><button class="sbtn ghost" id="pg-share">🔗</button>${tel ? `<a class="sbtn ghost" style="text-decoration:none;display:inline-grid;place-items:center" href="tel:${esc(tel)}">কল করুন</a>` : ''}<button class="more" id="pg-more" aria-label="আরও">⋯</button>`}</div></div>${profTabs('page')}`;
    if (!pg.isOwner && !silent) S.api.entVisit?.('page', pg.id).catch(() => {});
    $('#pg-badge')?.addEventListener('click', () => pageBadgeSheet(pg));
    $('#pg-msg')?.addEventListener('click', () => { if (needUser()) openThread(pg.ownerId, false, pg.id); });
    $('#pg-inbox')?.addEventListener('click', () => { S.convPage = pg; open('msgs'); loadConvs(); });
    $('#pg-post')?.addEventListener('click', () => openPostComposer({ pageId: pg.id, title: `${pg.name}-এর পক্ষে পোস্ট`, authorName: pg.name }));
    $('#pavfile')?.addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) picSheet('avatar', f, pg); });
    $('#pcoverfile')?.addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) picSheet('cover', f, pg); });
    $('#pcover-btn')?.addEventListener('click', () => pageCoverMenu(pg));
    $('#pg-share')?.addEventListener('click', () => sharePage(pg));
    if (pg.canManage) S.api.pageUnread().then(m => { const n = m.get(pg.id) || 0, b = $('#pg-unread'); if (b) { b.hidden = !n; b.textContent = bn(n); } }).catch(() => {});
    $('#pg-set')?.addEventListener('click', () => pageSettingsMenu(pg));
    $('#pg-more')?.addEventListener('click', () => { if (!needUser()) return; openSheet(`<div class="menu">${me()?.admin ? `<button data-act="ab">${ic('shield', 16)} অ্যাডমিন: পেইজের ব্যাজ</button>` : ''}<button data-act="r">পেইজ রিপোর্ট করুন</button><button data-close>বন্ধ করুন</button></div>`); $('#sheet').onclick = ev => { if (ev.target.closest('[data-act=r]')) reportSheet('user', 'page:' + pg.id); if (ev.target.closest('[data-act=ab]')) adminPageBadgeSheet(pg); }; });
    showProfPane('page');
  } catch (e) { $('#page').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
// পেইজের অটো মেসেজ: কেউ মেসেজ পাঠালেই সাথে সাথে এই উত্তর যায় (একই মানুষকে ২৪ ঘণ্টায় একবার)
const AUTO_SAMPLES = ['আসসালামু আলাইকুম! মেসেজ করার জন্য ধন্যবাদ। আমরা শীঘ্রই উত্তর দেব।', 'ধন্যবাদ! আমাদের দোকান প্রতিদিন সকাল ৯টা থেকে রাত ১০টা পর্যন্ত খোলা। জরুরি হলে কল করুন।', 'মেসেজের জন্য ধন্যবাদ। দাম ও বিস্তারিত জানতে পণ্যের নাম লিখে পাঠান।'];
function autoReplySheet(pg) {
  if (!pg) return;
  openSheet(`<h2>⚡ অটো মেসেজ</h2><p class="mut" style="margin-top:0">${esc(pg.name)} পেইজে কেউ মেসেজ পাঠালে সাথে সাথে এই উত্তরটা চলে যাবে। একই মানুষকে ২৪ ঘণ্টায় একবারই যায়, আর আপনি নিজে উত্তর দিয়ে থাকলে যায় না।</p>
    <label class="switch-row" for="ar-on"><span class="sw-text"><b>অটো মেসেজ চালু</b></span><input type="checkbox" id="ar-on" class="switch" role="switch" ${pg.autoReplyOn ? 'checked' : ''}></label>
    <label for="ar-text">অটো মেসেজ</label><textarea id="ar-text" rows="4" maxlength="1000" placeholder="যেমন: আসসালামু আলাইকুম! মেসেজ করার জন্য ধন্যবাদ। শীঘ্রই উত্তর দেব।">${esc(pg.autoReply || '')}</textarea>
    <div class="ar-samples"><small class="mut">নমুনা থেকে বেছে নিন:</small>${AUTO_SAMPLES.map((t, i) => `<button type="button" class="ar-s" data-ars="${i}">${esc(t)}</button>`).join('')}</div>
    <button class="btn wide" id="ar-save" style="margin-top:12px">সংরক্ষণ</button><button class="btn ghost wide" data-close style="margin-top:8px">বাতিল</button>`);
  $('#sheet').onclick = ev => { const b = ev.target.closest('[data-ars]'); if (b) { $('#ar-text').value = AUTO_SAMPLES[Number(b.dataset.ars)]; $('#ar-on').checked = true; } };
  $('#ar-save').onclick = ev => {
    const on = $('#ar-on').checked, text = $('#ar-text').value.trim();
    if (on && !text) return toast('অটো মেসেজ লিখুন');
    busy(ev.currentTarget, async () => { await S.api.setAutoReply(pg.id, { on, text }); Object.assign(pg, { autoReplyOn: on, autoReply: text }); closeSheet(); toast(on ? 'অটো মেসেজ চালু হয়েছে' : 'অটো মেসেজ বন্ধ হয়েছে'); if (S.view === 'msgs') loadConvs(); });
  };
}
// ---------- পেইজের ঠিকানা ও ম্যাপ
const dirUrl = pg => pg.lat != null && pg.lng != null ? `https://www.google.com/maps/dir/?api=1&destination=${pg.lat},${pg.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pg.address)}`;
function pageAddrHtml(pg) {
  if (!pg.address && pg.lat == null) return '';
  const d = 0.004, map = pg.lat != null && pg.lng != null
    ? `<iframe class="pg-map" title="ম্যাপে অবস্থান" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${pg.lng - d},${pg.lat - d},${pg.lng + d},${pg.lat + d}&layer=mapnik&marker=${pg.lat},${pg.lng}"></iframe>` : '';
  return `<div class="pg-addr">${pg.address ? `<p>📍 ${esc(pg.address)}</p>` : ''}${map}<a class="sbtn ghost pg-dir" href="${esc(dirUrl(pg))}" target="_blank" rel="noopener">🧭 দিক নির্দেশনা</a></div>`;
}
// গুগল ম্যাপের লিংক থেকে অক্ষাংশ-দ্রাঘিমাংশ বের করা (যেমন …@24.38,90.38… বা …q=24.38,90.38 বা !3d24.38!4d90.38)
function coordsFrom(text) {
  const t = String(text || ''), m = t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || t.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/) || t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || t.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]), lng = Number(m[2]);
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? { lat, lng } : null;
}
// ---------- শেয়ার
function sharePage(pg) {
  const url = pageLink(pg.id), text = `${pg.name} — আমার উপজেলা অ্যাপে দেখুন`;
  if (navigator.share) return navigator.share({ title: pg.name, text, url }).catch(() => {});
  openSheet(`<h2>পেইজ শেয়ার করুন</h2><div class="share-url"><input class="f" readonly value="${esc(url)}" id="sh-url"><button class="sbtn" id="sh-copy">কপি</button></div>
    <div class="menu" style="margin-top:10px"><a href="https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}" target="_blank" rel="noopener">🟢 WhatsApp-এ পাঠান</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">🔵 Facebook-এ শেয়ার করুন</a><button data-close>বন্ধ করুন</button></div>`);
  $('#sh-copy').onclick = async () => { try { await navigator.clipboard.writeText(url); } catch { $('#sh-url').select(); document.execCommand?.('copy'); } toast('লিংক কপি হয়েছে'); };
}
// ---------- পেইজের সেটিং (মালিক সব, অ্যাডমিন শুধু সরে যেতে পারেন)
function pageSettingsMenu(pg) {
  openSheet(`<div class="menu">${pg.isOwner ? `
    <button data-act="edit">${ic('edit', 18)} পেইজ এডিট (নাম, ঠিকানা, ম্যাপ…)</button>
    <button data-act="admins">👥 পেইজের অ্যাডমিন</button>
    <button data-act="faq">❓ মেসেজে প্রশ্নের তৈরি উত্তর</button>
    <button data-act="auto">⚡ অটো মেসেজ</button>
    <button data-act="del" class="danger">পেইজ মুছে ফেলুন</button>` : `
    <button data-act="leave" class="danger">অ্যাডমিন থেকে সরে যান</button>`}<button data-close>বন্ধ করুন</button></div>`);
  $('#sheet').onclick = async ev => {
    const a = ev.target.closest('[data-act]')?.dataset.act; if (!a) return;
    if (a === 'edit') return pageForm(pg);
    if (a === 'admins') return pageAdminsSheet(pg);
    if (a === 'faq') return faqSheet(pg);
    if (a === 'auto') return autoReplySheet(pg);
    closeSheet();
    if (a === 'del' && await confirmSheet(`"${pg.name}" পেইজ ও এর সব পোস্ট মুছে ফেলবেন?`, 'মুছুন', true)) busy(null, async () => { await S.api.deletePage(pg.id); toast('পেইজ মুছে ফেলা হয়েছে'); back(); });
    if (a === 'leave' && await confirmSheet(`"${pg.name}" পেইজের অ্যাডমিন থেকে সরে যাবেন?`, 'সরে যান', true)) busy(null, async () => { await S.api.removePageAdmin(pg.id, me().id); toast('আপনি আর এই পেইজের অ্যাডমিন নন'); openPage(pg.id, true); });
  };
}
async function pageAdminsSheet(pg) {
  openSheet('<div class="skel"></div>');
  try {
    const list = await S.api.pageAdmins(pg.id);
    openSheet(`<h2>👥 ${esc(pg.name)}-এর অ্যাডমিন</h2>
      <p class="mut" style="margin-top:0">অ্যাডমিনরা পেইজের নামে পোস্ট করতে, মেসেজের উত্তর দিতে, পোস্ট পিন করতে আর ড্যাশবোর্ড দেখতে পারেন। পেইজ এডিট, মুছে ফেলা আর অ্যাডমিন যোগ শুধু আপনি পারবেন। সর্বোচ্চ ১০ জন।</p>
      <div class="pa-list">${list.length ? list.map(u => personRow(u, `<button class="sbtn ghost" data-parm="${esc(u.id)}" style="color:var(--r)">বাদ দিন</button>`)).join('') : '<p class="mut">এখনো কোনো অ্যাডমিন নেই।</p>'}</div>
      <label for="pa-q" style="margin-top:12px">অ্যাডমিন যোগ করুন</label><input class="f" id="pa-q" placeholder="নাম লিখে খুঁজুন…" autocomplete="off">
      <div id="pa-res"></div>
      <button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
    let t;
    $('#pa-q').oninput = () => { clearTimeout(t); t = setTimeout(async () => {
      const q = $('#pa-q').value.trim(); if (q.length < 2) { $('#pa-res').innerHTML = ''; return; }
      const ids = new Set(list.map(u => u.id)), res = (await S.api.people({ q })).filter(u => !ids.has(u.id) && u.id !== me().id).slice(0, 6);
      $('#pa-res').innerHTML = res.length ? res.map(u => personRow(u, `<button class="sbtn" data-paadd="${esc(u.id)}">যোগ করুন</button>`)).join('') : '<p class="mut">কাউকে পাওয়া যায়নি।</p>';
    }, 300); };
    $('#sheet').onclick = ev => {
      const add = ev.target.closest('[data-paadd]'), rm = ev.target.closest('[data-parm]');
      if (add) busy(add, async () => { await S.api.addPageAdmin(pg.id, add.dataset.paadd); toast('অ্যাডমিন যোগ হয়েছে, তিনি নোটিফিকেশন পাবেন'); pageAdminsSheet(pg); });
      if (rm) busy(rm, async () => { await S.api.removePageAdmin(pg.id, rm.dataset.parm); toast('অ্যাডমিন বাদ দেওয়া হয়েছে'); pageAdminsSheet(pg); });
    };
  } catch (e) { closeSheet(); toast(errText(e)); }
}
function faqSheet(pg) {
  const rows = [...(pg.faqs || [])]; while (rows.length < 4) rows.push({ q: '', a: '' });
  openSheet(`<h2>❓ প্রশ্নের তৈরি উত্তর</h2><p class="mut" style="margin-top:0">কেউ পেইজকে মেসেজ করতে গেলে এই প্রশ্নগুলো বাটন হিসেবে দেখবেন। চাপলেই প্রশ্ন আর আপনার লেখা উত্তর সাথে সাথে চলে যাবে। সর্বোচ্চ ৪টা।</p>
    ${rows.map((r, i) => `<div class="faq-row"><b>প্রশ্ন ${bn(i + 1)}</b><input class="f" data-fq="${i}" maxlength="80" placeholder="যেমন: দাম কত?" value="${esc(r.q)}"><textarea class="f" data-fa="${i}" rows="2" maxlength="1000" placeholder="উত্তর লিখুন">${esc(r.a)}</textarea></div>`).join('')}
    <button class="btn wide" id="faq-save" style="margin-top:12px">সংরক্ষণ</button><button class="btn ghost wide" data-close style="margin-top:8px">বাতিল</button>`);
  $('#faq-save').onclick = ev => {
    const faqs = [];
    for (let i = 0; i < 4; i++) {
      const q = document.querySelector(`[data-fq="${i}"]`).value.trim(), a = document.querySelector(`[data-fa="${i}"]`).value.trim();
      if (q && !a) return toast(`প্রশ্ন ${bn(i + 1)}-এর উত্তর লিখুন`);
      if (q) faqs.push({ q, a });
    }
    busy(ev.currentTarget, async () => { await S.api.setFaqs(pg.id, faqs); pg.faqs = faqs; closeSheet(); toast(faqs.length ? 'প্রশ্ন-উত্তর সংরক্ষণ হয়েছে' : 'প্রশ্ন-উত্তর সরানো হয়েছে'); });
  };
}
function pageCoverHtml(pg) {
  const own = pg.isOwner;
  return `<div class="cover${pg.cover ? '' : ' empty'}">
    ${pg.cover ? `<button class="cover-img" data-viewpic="${esc(pg.cover)}" aria-label="কভার ছবি দেখুন"><img loading="lazy" decoding="async" src="${esc(pg.cover)}" alt=""></button>` : ''}
    ${own ? `<button class="cover-btn" id="pcover-btn">${ic('camera', 16)} ${pg.cover ? 'কভার বদলান' : 'কভার ছবি যোগ করুন'}</button><input type="file" id="pcoverfile" accept="image/*" hidden>` : ''}
  </div>
  <div class="prof-av pg-av">${own
    ? `<label class="av-edit" title="পেইজের ছবি বদলান">${entAv(pg)}<span class="av-cam">${ic('camera', 16)}</span><input type="file" id="pavfile" accept="image/*" hidden></label>`
    : pg.avatar ? `<button class="avbtn" data-viewpic="${esc(pg.avatar)}" aria-label="পেইজের ছবি দেখুন">${entAv(pg)}</button>` : entAv(pg)}</div>`;
}
function pageCoverMenu(pg) {
  if (!pg.cover) return $('#pcoverfile').click();
  openSheet(`<div class="menu"><button data-act="up">${ic('camera', 18)} নতুন ছবি আপলোড করুন</button><button data-act="view">${ic('photo', 18)} কভার ছবি দেখুন</button><button data-act="rm" class="danger">কভার ছবি সরান</button><button data-close>বন্ধ করুন</button></div>`);
  $('#sheet').onclick = async ev => {
    const a = ev.target.closest('[data-act]')?.dataset.act; if (!a) return;
    closeSheet();
    if (a === 'up') $('#pcoverfile').click();
    if (a === 'view') openViewer({ images: [pg.cover] });
    if (a === 'rm' && await confirmSheet('পেইজের কভার ছবি সরাবেন? ছবিটা পেইজের "কভার ছবি" অ্যালবামে থেকে যাবে।', 'সরান', true)) await busy(null, async () => { await S.api.removePageCover(pg.id); openPage(pg.id, true); toast('কভার ছবি সরানো হয়েছে'); });
  };
}
function pageForm(pg) {
  const st = {};
  openSheet(`<h2>${pg ? 'পেইজ এডিট' : 'নতুন পেইজ তৈরি করুন'}</h2><form id="pgform">
    <label for="pgn">পেইজের নাম</label><input id="pgn" required minlength="2" maxlength="60" value="${esc(pg?.name || '')}" placeholder="যেমন: রহিম ইলেকট্রনিক্স">
    <label for="pgc">ধরন</label><select class="f" id="pgc">${PAGE_CATS.map(c => `<option ${c === pg?.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
    <label for="pga">বিবরণ (ঐচ্ছিক)</label><textarea id="pga" maxlength="300" placeholder="কী করেন, কখন খোলা থাকে…">${esc(pg?.about || '')}</textarea>
    <label for="pgp">ফোন নম্বর (ঐচ্ছিক)</label><input id="pgp" inputmode="tel" maxlength="20" value="${esc(pg?.phone || '')}">
    ${photoField('পেইজের ছবি / লোগো (ঐচ্ছিক)', pg?.avatar)}
    <label for="pgad">ঠিকানা (ঐচ্ছিক)</label><input id="pgad" maxlength="200" value="${esc(pg?.address || '')}" placeholder="যেমন: বাজার রোড, ভালুকা পৌরসভা">
    <label>ম্যাপে অবস্থান (ঐচ্ছিক)</label>
    <div class="geo-box"><span id="geo-val">${pg?.lat != null ? `📌 ${pg.lat.toFixed(5)}, ${pg.lng.toFixed(5)}` : 'এখনো দেওয়া নেই'}</span>
      <button type="button" class="sbtn ghost" id="geo-here">📍 আমি এখন যেখানে আছি</button>${pg?.lat != null ? '<button type="button" class="link" id="geo-clear">মুছুন</button>' : ''}</div>
    <input class="f" id="geo-link" placeholder="অথবা গুগল ম্যাপের লিংক বা 24.38, 90.38 পেস্ট করুন" style="margin-top:6px">
    <div class="row" style="margin-top:16px"><button class="btn" style="flex:1">${pg ? 'সেভ করুন' : 'পেইজ তৈরি করুন'}</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
  watchPhoto(st);
  st.geo = pg?.lat != null ? { lat: pg.lat, lng: pg.lng } : null;
  const showGeo = () => { $('#geo-val').textContent = st.geo ? `📌 ${st.geo.lat.toFixed(5)}, ${st.geo.lng.toFixed(5)}` : 'এখনো দেওয়া নেই'; };
  $('#geo-here').onclick = () => {
    if (!navigator.geolocation) return toast('এই ডিভাইসে লোকেশন পাওয়া যাচ্ছে না');
    $('#geo-val').textContent = 'লোকেশন খুঁজছি…';
    navigator.geolocation.getCurrentPosition(p => { st.geo = { lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }; showGeo(); toast('লোকেশন নেওয়া হয়েছে'); },
      () => { showGeo(); toast('লোকেশন পাওয়া যায়নি। অনুমতি দিন বা ম্যাপের লিংক পেস্ট করুন।'); }, { enableHighAccuracy: true, timeout: 15000 });
  };
  $('#geo-clear')?.addEventListener('click', () => { st.geo = null; showGeo(); });
  $('#geo-link').oninput = () => { const c = coordsFrom($('#geo-link').value); if (c) { st.geo = c; showGeo(); } };
  $('#pgform').onsubmit = e => {
    e.preventDefault();
    const toEn = x => x.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
    if ($('#geo-link').value.trim() && !coordsFrom($('#geo-link').value)) return toast('ম্যাপের লিংক থেকে লোকেশন বোঝা যায়নি। লিংকটা আবার দেখুন বা "আমি এখন যেখানে আছি" চাপুন।');
    const v = { name: $('#pgn').value.trim(), category: $('#pgc').value, about: $('#pga').value.trim(), phone: toEn($('#pgp').value.trim()), avatar: st.blob || null,
      address: $('#pgad').value.trim(), lat: st.geo?.lat ?? null, lng: st.geo?.lng ?? null };
    busy(e.submitter, async () => {
      if (pg) { await S.api.updatePage(pg.id, v); closeSheet(); openPage(pg.id, true); toast('সেভ হয়েছে'); }
      else { const n = await S.api.createPage(v); closeSheet(); toast('পেইজ তৈরি হয়েছে'); openPage(n.id); }
    });
  };
}
$('#new-page').addEventListener('click', () => { if (needUser()) pageForm(null); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pf]'); if (!b || !needUser()) return;
  busy(b, async () => {
    await (b.dataset.on === '1' ? S.api.unfollowPage(Number(b.dataset.pf)) : S.api.followPage(Number(b.dataset.pf)));
    if (S.view === 'pages') loadPages(); if (S.view === 'page') openPage(S.pageId, true);
  });
});

// ================================================================ গ্রুপ
const groupRow = (g, btn) => `<div class="ent-row"><button class="ent-btn" data-group="${esc(g.id)}">${entAv(g, '👥')}</button><div class="info"><button class="ent-btn" data-group="${esc(g.id)}">${esc(g.name)}</button><div class="sub">${g.privacy === 'private' ? '🔒 প্রাইভেট' : '🌐 পাবলিক'} · ${bn(g.members)} সদস্য</div></div>${btn || ''}</div>`;
async function loadGroups() {
  const box = $('#groups'); box.innerHTML = '<div class="skel"></div>';
  try {
    const [mine, all] = await Promise.all([S.api.myGroups(), S.api.discoverGroups()]);
    const active = mine.filter(g => g.status === 'active'), pending = mine.filter(g => g.status === 'pending');
    const known = new Set(mine.map(g => g.id)), more = all.filter(g => !known.has(g.id));
    box.innerHTML = `
      <div class="card"><div class="sec-h"><h3>আমার গ্রুপ</h3></div>${active.length ? active.map(g => groupRow(g, g.role === 'admin' ? '<span class="tag">অ্যাডমিন</span>' : '')).join('') : '<div class="mut">এখনো কোনো গ্রুপে যোগ দেননি</div>'}</div>
      ${pending.length ? `<div class="card"><div class="sec-h"><h3>অনুরোধ পাঠানো হয়েছে</h3></div>${pending.map(g => groupRow(g, '<span class="mut" style="font-size:13px">অনুমোদনের অপেক্ষায়</span>')).join('')}</div>` : ''}
      <div class="card"><div class="sec-h"><h3>আরও গ্রুপ</h3></div>${more.length ? more.map(g => groupRow(g, `<button class="sbtn" data-gj="${esc(g.id)}">যোগ দিন</button>`)).join('') : '<div class="mut">আর কোনো গ্রুপ নেই</div>'}</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
async function openGroup(id, silent) {
  if (!silent) { S.groupId = Number(id) || id; S.feeds.group.posts = []; open('group'); $('#group').innerHTML = '<div class="skel"></div>'; $('#feed-group').innerHTML = ''; }
  try {
    const g = await S.api.group(S.groupId);
    const member = g.status === 'active', admin = member && g.role === 'admin';
    const reqs = admin ? await S.api.groupMembers(g.id, 'pending') : [];
    $('#group').innerHTML = `<div class="card ent-head">${entAv(g, '👥')}<h2 style="margin:4px 0 0">${esc(g.name)}</h2>
      <div class="meta">${g.privacy === 'private' ? '🔒 প্রাইভেট গ্রুপ' : '🌐 পাবলিক গ্রুপ'} · <button class="link" id="g-members" style="padding:0;min-height:0;font-size:14px">${bn(g.members)} সদস্য</button></div>
      ${g.about ? `<p class="about">${esc(g.about)}</p>` : ''}
      <div class="row">
        ${!g.status ? `<button class="sbtn" data-gj="${esc(g.id)}">${g.privacy === 'private' ? 'যোগ দেওয়ার অনুরোধ' : 'গ্রুপে যোগ দিন'}</button>` : ''}
        ${g.status === 'pending' ? `<button class="sbtn ghost" id="g-cancel">অনুরোধ বাতিল</button>` : ''}
        ${member ? `<button class="sbtn" id="g-post">+ পোস্ট করুন</button>` : ''}
        ${admin ? `<button class="sbtn ghost" data-insights="group" data-entid="${esc(g.id)}" data-entname="${esc(g.name)}">📊 ড্যাশবোর্ড</button>` : ''}
        ${admin ? `<button class="sbtn ghost" id="g-reqs">সদস্য অনুরোধ${reqs.length ? ` <span class="badge">${bn(reqs.length)}</span>` : ''}</button>` : ''}
        ${member ? `<button class="more" id="g-more" aria-label="আরও">⋯</button>` : ''}
      </div>${g.status === 'pending' ? '<p class="mut" style="margin:8px 0 0">অ্যাডমিনের অনুমোদনের অপেক্ষায়।</p>' : ''}</div>`;
    if (!admin && !silent) S.api.entVisit?.('group', g.id).catch(() => {});
    const canSee = g.privacy === 'public' || member;
    if (!canSee) { $('#feed-group').innerHTML = '<div class="card lock"><b>🔒</b>এটি একটি প্রাইভেট গ্রুপ। শুধু সদস্যরা পোস্ট দেখতে পারেন।</div>'; }
    else if (!silent || !S.feeds.group.posts.length) loadFeed('group');
    $('#g-post')?.addEventListener('click', () => openComposer({ groupId: g.id, title: `${g.name}-এ পোস্ট` }));
    $('#g-cancel')?.addEventListener('click', e => busy(e.currentTarget, async () => { await S.api.leaveGroup(g.id); openGroup(g.id, true); }));
    $('#g-members').addEventListener('click', () => memberSheet(g, admin));
    $('#g-reqs')?.addEventListener('click', () => requestSheet(g, reqs));
    $('#g-more')?.addEventListener('click', () => {
      openSheet(`<div class="menu">${g.isOwner ? '<button data-act="edit">গ্রুপ এডিট করুন</button><button data-act="del" class="danger">গ্রুপ মুছে ফেলুন</button>' : '<button data-act="leave" class="danger">গ্রুপ ছেড়ে দিন</button>'}<button data-close>বন্ধ করুন</button></div>`);
      $('#sheet').onclick = async ev => {
        const a = ev.target.closest('[data-act]')?.dataset.act; if (!a) return; closeSheet();
        if (a === 'edit') groupForm(g);
        if (a === 'leave' && await confirmSheet('গ্রুপ ছেড়ে দেবেন?', 'ছেড়ে দিন', true)) busy(null, async () => { await S.api.leaveGroup(g.id); toast('গ্রুপ ছেড়ে দিয়েছেন'); openGroup(g.id, true); });
        if (a === 'del' && await confirmSheet(`"${g.name}" গ্রুপ ও এর সব পোস্ট মুছে ফেলবেন?`, 'মুছুন', true)) busy(null, async () => { await S.api.deleteGroup(g.id); toast('গ্রুপ মুছে ফেলা হয়েছে'); back(); });
      };
    });
  } catch (e) { $('#group').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
async function memberSheet(g, admin) {
  if (g.privacy === 'private' && !g.status) return toast('প্রাইভেট গ্রুপের সদস্য তালিকা শুধু সদস্যরা দেখতে পারেন');
  const list = await S.api.groupMembers(g.id).catch(() => []);
  openSheet(`<h2>সদস্য (${bn(list.length)})</h2>${list.map(u => `<div class="person">${userLink(u.id, av(u))}<div class="info">${userLink(u.id, esc(u.name) + vb(u.verified), 'who-btn')}<div class="sub">${u.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}</div></div>${admin && u.id !== g.ownerId && u.id !== me()?.id ? `<button class="sbtn ghost" data-rm="${esc(u.id)}">বাদ দিন</button>` : ''}</div>`).join('')}<button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
  $('#sheet').onclick = ev => { const b = ev.target.closest('[data-rm]'); if (b) busy(b, async () => { await S.api.removeMember(g.id, b.dataset.rm); b.closest('.person').remove(); openGroup(g.id, true); }); if (ev.target.closest('[data-user]')) closeSheet(); };
}
function requestSheet(g, reqs) {
  openSheet(`<h2>সদস্য হওয়ার অনুরোধ</h2>${reqs.length ? reqs.map(u => `<div class="person">${av(u)}<div class="info"><b>${esc(u.name)}</b><div class="sub">${esc(u.union)}</div></div><div class="pbtns"><button class="sbtn" data-ok="${esc(u.id)}">অনুমোদন</button><button class="sbtn ghost" data-no="${esc(u.id)}">বাতিল</button></div></div>`).join('') : '<p class="mut">কোনো অনুরোধ নেই।</p>'}<button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
  $('#sheet').onclick = ev => {
    const ok = ev.target.closest('[data-ok]'), no = ev.target.closest('[data-no]');
    if (ok) busy(ok, async () => { await S.api.approveMember(g.id, ok.dataset.ok); ok.closest('.person').remove(); toast('সদস্য হিসেবে যুক্ত হয়েছেন'); openGroup(g.id, true); });
    if (no) busy(no, async () => { await S.api.removeMember(g.id, no.dataset.no); no.closest('.person').remove(); openGroup(g.id, true); });
  };
}
function groupForm(g) {
  const st = {};
  openSheet(`<h2>${g ? 'গ্রুপ এডিট' : 'নতুন গ্রুপ তৈরি করুন'}</h2><form id="gform">
    <label for="gn">গ্রুপের নাম</label><input id="gn" required minlength="2" maxlength="60" value="${esc(g?.name || '')}" placeholder="যেমন: সদর ইউনিয়ন যুব সংঘ">
    <label for="ga">বিবরণ (ঐচ্ছিক)</label><textarea id="ga" maxlength="300" placeholder="গ্রুপটি কী নিয়ে, কারা যোগ দিতে পারবেন…">${esc(g?.about || '')}</textarea>
    <label>গোপনীয়তা</label>
    <label class="chk"><input type="radio" name="gp" value="public" ${g?.privacy !== 'private' ? 'checked' : ''}> <span><b>🌐 পাবলিক:</b> যে কেউ পোস্ট দেখতে ও সঙ্গে সঙ্গে যোগ দিতে পারবে</span></label>
    <label class="chk"><input type="radio" name="gp" value="private" ${g?.privacy === 'private' ? 'checked' : ''}> <span><b>🔒 প্রাইভেট:</b> শুধু সদস্যরা পোস্ট দেখবে, যোগ দিতে অ্যাডমিনের অনুমোদন লাগবে</span></label>
    ${photoField('গ্রুপের ছবি (ঐচ্ছিক)', g?.avatar)}
    <div class="row" style="margin-top:16px"><button class="btn" style="flex:1">${g ? 'সেভ করুন' : 'গ্রুপ তৈরি করুন'}</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
  watchPhoto(st);
  $('#gform').onsubmit = e => {
    e.preventDefault();
    const v = { name: $('#gn').value.trim(), about: $('#ga').value.trim(), privacy: e.target.gp.value, avatar: st.blob || null };
    busy(e.submitter, async () => {
      if (g) { await S.api.updateGroup(g.id, v); closeSheet(); openGroup(g.id, true); toast('সেভ হয়েছে'); }
      else { const n = await S.api.createGroup(v); closeSheet(); toast('গ্রুপ তৈরি হয়েছে'); openGroup(n.id); }
    });
  };
}
$('#new-group').addEventListener('click', () => { if (needUser()) groupForm(null); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-gj]'); if (!b || !needUser()) return;
  busy(b, async () => {
    const st = await S.api.joinGroup(Number(b.dataset.gj));
    toast(st === 'active' ? 'গ্রুপে যোগ দিয়েছেন' : 'অনুরোধ পাঠানো হয়েছে, অ্যাডমিন অনুমোদন দিলে যুক্ত হবেন');
    if (S.view === 'groups') loadGroups(); if (S.view === 'group') openGroup(S.groupId, true);
  });
});

// ================================================================ নেভিগেশন (ফোনের Back বাটনও কাজ করে)
const TABS = ['home', 'friends', 'notif', 'me', 'menu', 'msgs'];
const RELOAD = {
  msgs: () => loadConvs(), friends: () => loadFriends(), notif: () => loadNotifs(true), me: () => renderMe(), menu: () => renderMenu(),
  pages: () => loadPages(), groups: () => loadGroups(), saved: () => loadFeed('saved'), dir: () => loadDir(),
  page: () => openPage(S.pageId, true), group: () => openGroup(S.groupId, true), user: () => openUser(S.userId, true), admin: () => loadAdmin(), post: () => { renderFeed('post'); loadComments(); },
};
function pushNav() { try { history.pushState({ au: 1 }, ''); } catch { /* sandbox */ } }
function show(v) {
  if (v !== 'msgs' && v !== 'thread') S.convPage = null;   // পেইজের মেসেজ-ফিল্টার শুধু ওই পাতায়
  S.view = v;
  if (TABS.includes(v)) S.tab = v;
  document.body.classList.toggle('searching', v === 'search');
  document.querySelectorAll('.view').forEach(e => e.classList.toggle('on', e.id === 'v-' + v));
  document.querySelectorAll('header [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === S.tab));
  window.scrollTo(0, 0);
}
// প্রধান ট্যাবে যাওয়া
function go(v) {
  if (v === 'me' && S.actAs && me()) { closeSheet(); S.stack = []; return openPage(S.actAs.id); }
  if (v === 'pinsights') {
    if (!S.actAs) return go('friends');
    closeSheet(); S.stack = []; S.insTarget = { kind: 'page', id: S.actAs.id, name: S.actAs.name };
    show('insights'); S.tab = 'pinsights'; document.querySelectorAll('header [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === 'pinsights'));
    return loadInsights();
  }
  if (v === 'friends' && S.actAs) return go('pinsights');
  closeSheet(); S.stack = [];
  show(v);
  if (v === 'me') renderMe(); if (v === 'friends') loadFriends(); if (v === 'msgs') loadConvs();
  if (v === 'notif') loadNotifs(); if (v === 'menu') renderMenu();
}
// ভেতরের পেজ খোলা (Back চাপলে আগের পেজে ফেরে)
function open(v) { closeSheet(); if (S.view !== v) S.stack.push(S.view); pushNav(); show(v); }
function back() { try { history.back(); } catch { onPop(); } }
function onPop() {
  if (S.viewerOpen) return closeViewer();
  if ($('#modal').classList.contains('on')) return closeSheet();
  if (!S.stack.length) return;
  const prev = S.stack.pop(); show(prev); RELOAD[prev]?.();
}
window.addEventListener('popstate', onPop);
document.addEventListener('click', e => {
  const op = e.target.closest('a[data-openpost]'); if (op) { e.preventDefault(); return openPost(op.dataset.openpost); }
  if (e.target.closest('[data-back]')) return back();
  const t = e.target.closest('[data-v]'); if (t && !t.closest('#modal')) go(t.dataset.v);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modal').classList.contains('on')) closeSheet(); });

// ================================================================ ফিচার চালু/বন্ধ, ঘোষণা ও আপডেট (অ্যাডমিন থেকে নিয়ন্ত্রিত)
const feat = name => S.settings[name] !== false || !!me()?.admin;
function featGuard(name) { if (feat(name)) return true; toast('এই ফিচারটি এখন সাময়িকভাবে বন্ধ আছে'); return false; }
// Android অ্যাপের নেটিভ ভার্সন (Play Store-এর version code); ওয়েবে 0
// বিল্ডের পরিচয় (vite বিল্ডে বসে; সরাসরি সোর্স চালালে 'dev')
const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
const nativeVersion = () => Number(navigator.userAgent.match(/AmarUpazilaApp\/(\d+)/)?.[1]) || 0;
const versionLabel = () => (nativeVersion() ? `অ্যাপ ${bn(nativeVersion())}` : 'ওয়েব') + ` · আপডেট ${bn(String(BUILD_ID).split('-')[0].slice(-6))}`;
function settingsChanged() { local.set('settings', S.settings); renderNotices(); if (S.view === 'menu') renderMenu(); checkForceUpdate(); }
const hashStr = t => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) | 0; return String(h); };
function renderNotices() {
  const box = $('#notices'); if (!box) return;
  const out = [], ann = (S.settings.announcement || '').trim(), v = nativeVersion(), latest = Number(S.settings.latestVersion) || 0;
  if (ann && local.get('ann-hide') !== hashStr(ann)) out.push(`<div class="notice ann" role="status"><span class="n-ic">${ic('bell', 18)}</span><div class="n-txt">${linkify(ann)}</div><button class="n-x" data-nhide="ann" aria-label="ঘোষণা বন্ধ করুন">✕</button></div>`);
  if (v && latest > v && local.get('upd-hide') !== latest) out.push(`<div class="notice upd" role="status"><span class="n-ic">${ic('download', 18)}</span><div class="n-txt"><b>অ্যাপের নতুন ভার্সন এসেছে</b><br><a href="${PLAY_URL}" target="_blank" rel="noopener">Play Store থেকে আপডেট করুন</a></div><button class="n-x" data-nhide="upd" aria-label="পরে করব">✕</button></div>`);
  box.innerHTML = out.join('');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-nhide]'); if (!b) return;
  if (b.dataset.nhide === 'ann') local.set('ann-hide', hashStr((S.settings.announcement || '').trim())); else local.set('upd-hide', Number(S.settings.latestVersion) || 0);
  renderNotices();
});
function checkForceUpdate() {
  const v = nativeVersion(), min = Number(S.settings.minVersion) || 0, el = $('#force-update');
  if (!v || min <= v) { el?.remove(); return; }
  if (el) return;
  document.body.insertAdjacentHTML('beforeend', `<div id="force-update" role="alertdialog" aria-modal="true" aria-labelledby="fu-h"><div class="fu-box">
    <div class="fu-ic">${ic('download', 34)}</div><h2 id="fu-h">অ্যাপটি আপডেট করুন</h2>
    <p>এই ভার্সনটি আর সমর্থিত নয়। নতুন ফিচার ও নিরাপত্তার জন্য Play Store থেকে সর্বশেষ ভার্সন নিন। আপডেট করতে এক মিনিটও লাগবে না।</p>
    <a class="btn wide" href="${PLAY_URL}" target="_blank" rel="noopener">Play Store-এ আপডেট করুন</a></div></div>`);
}
async function refreshSettings() {
  try { const v = await S.api.settings(); S.settings = { ...S.settings, ...v }; settingsChanged(); } catch { /* অফলাইনে আগের সেটিং থাকে */ }
}

// ================================================================ লাইভ আপডেট: নতুন ডিজাইন/ফিচার Play Store ছাড়াই
// ওয়েবসাইটে নতুন বিল্ড প্রকাশ হলে version.json বদলায়। অ্যাপ খোলা থাকলে মাঝে মাঝে মিলিয়ে দেখে;
// নতুন পেলে অ্যাপ ব্যাকগ্রাউন্ড থেকে ফিরলে নিঃশব্দে নতুনটা চালু করে (কিছু লেখা বা খোলা না থাকলে),
// নইলে উপরে ছোট করে "নতুন আপডেট এসেছে" দেখায়। ফেসবুক যেভাবে চুপচাপ আপডেট নেয়।
S.hiddenAt = 0; S.newBuild = null;
async function checkLiveUpdate() {
  if (!/^https?:$/.test(location.protocol) || location.hostname === 'localhost' && !location.port) return;
  try {
    const r = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return;
    const { build } = await r.json();
    if (build && BUILD_ID !== 'dev' && build !== BUILD_ID) { S.newBuild = build; showUpdatePill(); }
  } catch { /* অফলাইন */ }
}
const busyUI = () => $('#modal').classList.contains('on') || S.viewerOpen || !!document.querySelector('.cm-edit') || !!$('#cm-input')?.value.trim();
function showUpdatePill() {
  if ($('#upd-pill')) return;
  document.body.insertAdjacentHTML('beforeend', `<button id="upd-pill">${ic('refresh', 16)} নতুন আপডেট এসেছে · চালু করুন</button>`);
  $('#upd-pill').onclick = () => location.reload();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { S.hiddenAt = Date.now(); return; }
  const away = S.hiddenAt ? Date.now() - S.hiddenAt : 0;
  if (S.newBuild && away > 60000 && !busyUI()) return location.reload();   // অনেকক্ষণ পর ফিরলে নিঃশব্দে নতুন ভার্সন
  if (away > 60000) { checkLiveUpdate(); refreshSettings(); }
});
setInterval(() => { if (!document.hidden) checkLiveUpdate(); }, 30 * 60000);
// শুধু আসল বিল্ডে (ওয়েবসাইট/অ্যাপ); সরাসরি সোর্স চালালে (ডেভেলপমেন্ট) নয়, যাতে পুরনো কপি আটকে না থাকে
if ('serviceWorker' in navigator && BUILD_ID !== 'dev' && location.protocol === 'https:' && location.hostname !== 'localhost') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// ================================================================ অফলাইন: ইন্টারনেট না থাকলে আগের পোস্ট দেখানো
function renderNetBar() {
  const off = !navigator.onLine; let bar = $('#netbar');
  if (!off) { bar?.remove(); return; }
  if (!bar) { $('#top').insertAdjacentHTML('afterend', `<div id="netbar" role="status">${ic('wifi-off', 16)} ইন্টারনেট সংযোগ নেই · আগে লোড করা পোস্ট দেখাচ্ছে</div>`); }
}
window.addEventListener('offline', renderNetBar);
window.addEventListener('online', () => { renderNetBar(); toast('ইন্টারনেট ফিরে এসেছে'); if (S.view === 'home') loadFeed('home'); refreshBadges(); refreshSettings(); });
// ডেটা আনতে না পারলে (অফলাইন) শেষবার সফলভাবে আনা কপি ব্যবহার
async function cachedCall(key, fn) {
  try { const v = await fn(); local.set('c_' + key, v); return v; }
  catch (e) { const c = local.get('c_' + key); if (c != null) return c; throw e; }
}

// ================================================================ শুরু
(async () => {
  try {
    S.api = await createApi();
    renderDemoBar();
    await S.api.init(() => afterAuth());
    renderNetBar(); renderNotices(); checkForceUpdate();
    const [up, unions] = await Promise.all([cachedCall('upazila', () => S.api.upazila()), cachedCall('unions', () => S.api.unions())]);
    S.unions = unions;
    $('#upname').textContent = `${up.name}, ${up.district}`;
    $('#loc').innerHTML = '<option value="">সব এলাকা</option>' + unions.map(u => `<option value="${esc(u.id)}">${esc(u.name)}</option>`).join('');
    if (!unions.some(u => String(u.id) === String(S.union))) S.union = '';
    $('#loc').value = S.union;
    renderComposer(); renderFilters(); listenMessages(); refreshBadges();
    refreshSettings(); setTimeout(checkLiveUpdate, 8000);
    await loadFeed('home');
    setInterval(() => { if (document.visibilityState === 'visible') refreshBadges(); }, 60000);
    const deep = () => { const m = location.hash.match(/^#post-(\d+)$/), pm = location.hash.match(/^#page-(\d+)$/); if (m && !(S.view === 'post' && String(S.postId) === m[1])) openPost(m[1]); if (pm && !(S.view === 'page' && String(S.pageId) === pm[1])) openPage(pm[1]); };
    deep(); window.addEventListener('hashchange', deep);
  } catch (e) {
    $('#feed-home').innerHTML = `<div class="empty">${esc(errText(e))}<br><button class="btn" id="retry">আবার চেষ্টা করুন</button></div>`;
    $('#retry').onclick = () => location.reload();
  }
})();
