// আমার উপজেলা — অ্যাপের UI
import { createApi, PAGE } from './api.js';
import { POST_CATS, SERVICE_CATS, EMERGENCY, PUBLIC_URL, SETTING_KEYS, PLAY_URL } from './config.js';
import { DISTRICTS, DISTRICT_ORDER, HOME_UPAZILA, HOME_DISTRICT, BLOOD_GROUPS } from './bd-geo.js';

// সাধারণ এক রঙের রেখার আইকন (লেখার রং-ই আইকনের রং)
const ICONS = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  drop: '<path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
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
  work: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/>',
  school: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
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
// মেসেজে লিংক থাকলে চাপা যায়; অ্যাপের পোস্টের লিংক অ্যাপের ভেতরেই খোলে
const linkify = t => esc(t).replace(/https?:\/\/[^\s<]+/g, u => { const m = u.match(/#post-(\d+)$/); return m ? `<a href="${u}" data-openpost="${m[1]}">পোস্টটি দেখুন ↗</a>` : `<a href="${u}" target="_blank" rel="noopener">${u}</a>`; });

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
function errText(e) {
  const m = String(e?.message || e || '');
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
// ছবি ছোট করে JPEG বানানো (আপলোড দ্রুত হয়, ডেটা কম খরচ হয়)
async function compress(file, max = 1280, q = 0.8) {
  if (!/^image\//.test(file.type)) throw new Error('not image');
  let src;
  try { src = await createImageBitmap(file); } catch {
    src = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  }
  const r = Math.min(1, max / Math.max(src.width, src.height));
  const c = document.createElement('canvas'); c.width = Math.round(src.width * r); c.height = Math.round(src.height * r);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(res, 'image/jpeg', q));
}

const SVC_ICONS = { health: '<path d="M12 5v14M5 12h14" stroke-width="3"/>', gov: '<path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18"/>', edu: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>', police: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>', doc: '<circle cx="12" cy="7" r="4"/><path d="M5 21c1-4 4-6 7-6s6 2 7 6"/>', fix: '<path d="M14 6a4 4 0 0 0 5 5L10 20l-3-3 9-9z"/>', bus: '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M7 20v-3M17 20v-3"/>', bank: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="2.5"/>', shop: '<path d="M4 9h16l-1 11H5z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/>' };
const catName = k => (SERVICE_CATS.find(c => c[0] === k) || ['', ''])[1];

const S = {
  api: null, unions: [], union: local.get('union', ''), scope: 'area', fcat: '', dcat: '',
  feeds: { home: { posts: [], more: false }, me: { posts: [], more: false }, user: { posts: [], more: false }, post: { posts: [], more: false }, search: { posts: [], more: false }, saved: { posts: [], more: false }, page: { posts: [], more: false }, group: { posts: [], more: false } },
  open: new Map(), view: 'home', tab: 'home', stack: [], bgroup: '', bscope: 'home', bready: false, settings: { ...Object.fromEntries(Object.entries(SETTING_KEYS).map(([k, [, d]]) => [k, d])), ...local.get('settings', {}) }, userId: null, threadId: null, postId: null, pageId: null, groupId: null, photo: null, stopMsg: null, stopNotif: null,
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
  return src ? `<img class="av ${cls}" src="${esc(src)}" alt="" loading="lazy">` : `<div class="av ${cls}" aria-hidden="true">${esc(name.charAt(0))}</div>`;
}
const userLink = (id, inner, cls = 'avbtn') => `<button class="${cls}" data-user="${esc(id)}">${inner}</button>`;
const entAv = (e, icon) => e?.avatar ? `<img class="ent-av" src="${esc(e.avatar)}" alt="">` : `<div class="ent-av" aria-hidden="true">${icon || esc((e?.name || '?').charAt(0))}</div>`;
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
  const out = t => mentionize(esc(t), opts.mentions);
  return short === null ? out(text) : `${out(short)}… <button class="see-more" data-more="${esc(key)}">আরও দেখুন</button>`;
}
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
  else if (key.startsWith('c')) { const c = (S.comments || []).find(x => 'c' + x.id === key); if (c) host.innerHTML = esc(c.body); }
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
  if (im.length === 1) return `<button class="ph-one" data-view="${esc(p.id)}" data-i="0" aria-label="ছবি বড় করে দেখুন"><img class="post-img" src="${esc(im[0])}" alt="পোস্টের ছবি" loading="lazy"></button>`;
  return `<div class="car" data-car="${esc(p.id)}">
    <div class="car-track">${im.map((src, i) => `<button class="car-item" data-view="${esc(p.id)}" data-i="${i}" aria-label="ছবি ${bn(i + 1)}, বড় করে দেখুন"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join('')}</div>
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
  $('#v-track').innerHTML = im.map((src, i) => `<div class="v-item"><img src="${esc(src)}" alt="ছবি ${bn(i + 1)}"></div>`).join('');
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
  return `<article class="card post">
    <div class="top">${link(av(p), 'avbtn')}
      <div>${link(esc(p.author), 'who-btn')}${actLine(p)}${tagsLine(p)}${via}<div class="mut">${p.pageId ? 'পেইজ' : esc(p.union)} · ${esc(ago(p.createdAt))}${p.editedAt ? ` · <span class="edited" title="সম্পাদিত ${esc(ago(p.editedAt))}">সম্পাদিত</span>` : ''} · <span class="pv-mini" title="${PRIVACY[p.privacy || 'public'][1]}" aria-label="${PRIVACY[p.privacy || 'public'][1]}">${ic(PRIVACY[p.privacy || 'public'][0], 13)}</span></div></div>
      <button class="more" data-menu="${esc(p.id)}" aria-label="আরও অপশন">⋯</button></div>
    <span class="tag${p.category === 'সাহায্য চাই' ? ' help' : ''}" style="margin-top:8px">${esc(p.category)}</span>
    ${p.body ? `<p>${moreText(p.body, 'p' + p.id, { full: S.view === 'post' && S.feeds.post.posts[0]?.id === p.id, mentions: p.mentions })}</p>` : '<div style="height:8px"></div>'}
    ${photosHtml(p)}
    ${p.shared ? `<button class="shared-embed" data-openpost="${esc(p.shared.id)}"><span class="se-top">${av(p.shared, 'sm')}<span><b>${esc(p.shared.author)}</b><span class="mut"> · ${esc(ago(p.shared.createdAt))}</span></span></span>${p.shared.body ? `<span class="se-body">${esc(p.shared.body)}</span>` : ''}${p.shared.image ? `<img src="${esc(p.shared.image)}" alt="" loading="lazy">` : ''}</button>`
      : p.sharedMissing ? '<div class="shared-embed missing">এই পোস্টটি আর দেখা যাচ্ছে না</div>' : ''}
    ${p.likes ? `<div class="rsum"><button class="rsum-l" data-rxlist="${esc(p.id)}" aria-label="কে কে রিয়্যাক্ট দিয়েছেন"><span class="rsum-e">${Object.entries(p.reactions || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => `<span class="rs-i">${rxIcon(k, 18)}</span>`).join('')}</span><span class="rsum-who">কে কে রিয়্যাক্ট দিয়েছেন</span></button></div>` : ''}
    <div class="acts icons">
      <button data-like="${esc(p.id)}" class="${p.myReaction ? 'reacted rx-' + p.myReaction : ''}" aria-pressed="${!!p.myReaction}" aria-label="${p.myReaction ? `${rxName(p.myReaction)} দিয়েছেন, চাপলে তুলে নেবেন; চেপে ধরলে অন্য রিয়্যাক্ট` : 'লাইক; চেপে ধরলে অন্য রিয়্যাক্ট'}" title="রিয়্যাক্ট">${p.myReaction ? rxIcon(p.myReaction, 24) : ic('thumb', 22)}${p.likes ? `<span class="cnt">${bn(p.likes)}</span>` : ''}</button>
      <button data-cm="${esc(p.id)}" aria-label="মন্তব্য ${bn(p.comments || 0)}টি" title="মন্তব্য">${ic('comment', 22)}${p.comments ? `<span class="cnt">${bn(p.comments)}</span>` : ''}</button>
      <button data-share="${esc(p.id)}" aria-label="শেয়ার, ${bn(p.shares || 0)} বার" title="শেয়ার">${ic('share', 22)}${p.shares ? `<span class="cnt">${bn(p.shares)}</span>` : ''}</button>
      <button data-save="${esc(p.id)}" class="${p.saved ? 'saved' : ''}" aria-pressed="${!!p.saved}" aria-label="${p.saved ? 'সেভ থেকে সরান' : 'সেভ করুন'}" title="সেভ">${ic('bookmark', 22, p.saved ? 'currentColor' : 'none')}${p.saves ? `<span class="cnt">${bn(p.saves)}</span>` : ''}</button>
    </div>

  </article>`;
}
function renderFeed(key) {
  const f = S.feeds[key], box = $('#feed-' + key);
  box.innerHTML = f.posts.length ? f.posts.map(postHtml).join('')
    : key === 'search' ? '' : key === 'post' ? '<div class="empty">পোস্টটি আর নেই।</div>'
    : key === 'saved' ? '<div class="empty">কোনো সেভ করা পোস্ট নেই।<br>পোস্টের ⋯ মেনু থেকে "পোস্ট সেভ করুন" চাপুন।</div>'
    : key === 'page' || key === 'group' ? '<div class="empty">এখনো কোনো পোস্ট নেই।</div>'
    : `<div class="empty">${key === 'home' && S.scope === 'friends' ? 'বন্ধু বা যাদের ফলো করছেন তাদের কোনো পোস্ট এখনো নেই।<br>"বন্ধু" ট্যাব থেকে মানুষ খুঁজে যুক্ত হোন।' : key === 'home' ? 'এখানে এখনো কোনো পোস্ট নেই।<br>প্রথম পোস্টটি আপনিই করুন!' : 'এখনো কোনো পোস্ট নেই।'}</div>`;
  const more = $('#more-' + key); if (more) more.hidden = !f.more;
  watchCarousels(box);
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
    const rows = plainHome ? await cachedCall('feed', async () => (await call()).slice(0, PAGE)) : await call();
    f.posts = append ? [...f.posts, ...rows] : rows; f.more = !['post', 'saved'].includes(key) && rows.length >= PAGE;
  } catch (e) { toast(errText(e)); if (!append) f.posts = []; }
  renderFeed(key);
}
const feedOf = el => el.closest('[data-feed]')?.dataset.feed;
const findPost = (key, id) => S.feeds[key].posts.find(p => String(p.id) === String(id));

document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.user) { e.preventDefault(); return openUser(b.dataset.user); }
  if (b.dataset.page) return openPage(b.dataset.page);
  if (b.dataset.openpost) return openPost(b.dataset.openpost);
  if (b.dataset.group) return openGroup(b.dataset.group);
  const key = feedOf(b); if (!key) return;
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
    openPost(b.dataset.cm);
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
  busy(f.querySelector('button'), async () => { await S.api.addComment(p.id, body); p.comments++; S.open.set(p.id, await S.api.comments(p.id)); renderFeed(key); });
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
    const c = (S.comments || []).find(x => String(x.id) === btn.dataset.clike); if (!c) return;
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
function newDraft(opts = {}) { return { body: '', category: POST_CATS[0], photos: [], tags: [], mentions: new Map(), privacy: local.get('privacy', 'public'), ...opts }; }
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
  const d = S.draft, u = me(), own = !d.pageId && !d.groupId, pv = PRIVACY[d.privacy], photosOk = !d.shared;
  const tagLine = d.tags.length ? ` <span class="pc-with">— ${d.tags.length === 1 ? `<b>${esc(d.tags[0].name)}</b>-এর সাথে` : d.tags.length === 2 ? `<b>${esc(d.tags[0].name)}</b> ও <b>${esc(d.tags[1].name)}</b>-এর সাথে` : `<b>${esc(d.tags[0].name)}</b> ও আরও ${bn(d.tags.length - 1)} জনের সাথে`}</span>` : '';
  openSheet(`<div class="pc">
    <div class="pc-head"><b>${esc(d.title || 'পোস্ট তৈরি করুন')}</b><button class="pc-x" data-close aria-label="বন্ধ করুন">${ic('close', 20)}</button></div>
    <div class="pc-author">${av(u)}<div><div class="pc-name"><b>${esc(d.authorName || u.name)}</b>${tagLine}</div>
      ${d.albumId ? `<span class="pc-priv static" title="অ্যালবামের প্রাইভেসি">${ic(pv[0], 14)} ${pv[1]}</span>` : own ? `<button class="pc-priv" id="pc-priv" aria-label="কারা দেখবে: ${pv[1]}">${ic(pv[0], 14)} ${pv[1]} ▾</button>` : `<span class="pc-priv static">${ic('globe', 14)} পাবলিক</span>`}</div></div>
    ${d.albumId ? `<div class="pc-album">${ic('album', 16)} অ্যালবাম: <b>${esc(d.albumName)}</b></div>` : ''}
    <textarea id="pc-text" maxlength="1000" placeholder="আপনার মনে কী আছে, ${esc(u.name.split(' ')[0])}? (কাউকে উল্লেখ করতে @ লিখুন)">${esc(d.body)}</textarea>
    ${d.photos.length ? `<div class="pc-photos">${d.photos.map((ph, i) => `<div class="pc-ph"><img src="${esc(ph.url)}" alt="ছবি ${bn(i + 1)}"><button type="button" data-rmph="${i}" aria-label="ছবি বাদ দিন">${ic('close', 14)}</button></div>`).join('')}
      ${d.photos.length < MAX_PHOTOS && photosOk ? `<label class="pc-ph add" aria-label="আরও ছবি">${ic('plus', 24)}<span>${bn(d.photos.length)}/${bn(MAX_PHOTOS)}</span><input type="file" accept="image/*" multiple class="pc-more" hidden></label>` : ''}</div>` : ''}
    <div class="pc-foot"><div class="pc-add"><span class="pc-add-l">যোগ করুন</span>
      ${photosOk ? `<label class="pc-tool" title="ছবি" aria-label="ছবি যোগ করুন">${ic('photo', 22)}<input type="file" id="pc-file" accept="image/*" multiple hidden></label>` : ''}
      ${own ? `<button class="pc-tool" id="pc-tag" title="বন্ধুদের ট্যাগ করুন" aria-label="বন্ধুদের ট্যাগ করুন">${ic('tag', 22)}</button>` : ''}
      <select class="f pc-cat" id="pc-cat" aria-label="পোস্টের ধরন">${POST_CATS.map(c => `<option ${c === d.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
    <button class="btn wide" id="pc-post">${d.editId ? 'সংরক্ষণ করুন' : 'পোস্ট করুন'}</button></div></div>`);
  $('#sheet').classList.add('tall');
  const keep = () => { d.body = $('#pc-text')?.value ?? d.body; d.category = $('#pc-cat')?.value || d.category; };
  $('#pc-text').oninput = keep; $('#pc-cat').onchange = keep;
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
    const rm = e.target.closest('[data-rmph]'); if (rm) { keep(); const [x] = d.photos.splice(Number(rm.dataset.rmph), 1); if (x.blob) URL.revokeObjectURL(x.url); return renderComposerSheet(); }
    if (e.target.closest('#pc-priv')) { keep(); return privacyPicker(); }
    if (e.target.closest('#pc-tag')) { keep(); return tagPicker(); }
    if (e.target.closest('[data-close]')) { keep(); $('#sheet').classList.remove('tall'); }
  };
  $('#pc-post').onclick = e => {
    keep();
    if (!d.body.trim() && !d.photos.length && !d.shared) return toast('কিছু লিখুন বা ছবি দিন');
    if (d.editId) return saveEdit(e.currentTarget);
    busy(e.currentTarget, async () => {
      if (d.albumId && !d.photos.length) return toast('অ্যালবামে যোগ করতে অন্তত একটা ছবি দিন');
      await S.api.createPost({ body: d.body.trim(), category: d.category, images: d.photos.map(p => p.blob), pageId: d.pageId, groupId: d.groupId, privacy: d.privacy, tags: d.tags.map(t => t.id), mentions: mentionIds(d.body, d.mentions), albumId: d.albumId || null });
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
document.querySelector('[data-compose="photo"] .qi').innerHTML = ic('photo', 20);
document.querySelector('[data-compose="tag"] .qi').innerHTML = ic('tag', 20);
document.querySelector('[data-compose="privacy"] .qi').innerHTML = ic('globe', 20);
$('#cm-open').addEventListener('click', () => openPostComposer());
$('#composer').addEventListener('click', e => { const b = e.target.closest('[data-compose]'); if (b) openPostComposer({}, b.dataset.compose); });

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

// ================================================================ বন্ধু
const relBtns = u => {
  const r = u.rel || {};
  const main = r.friend === 'friends' ? `<button class="sbtn ghost" data-fr="menu" data-id="${esc(u.id)}" data-name="${esc(u.name)}">বন্ধু ✓</button>`
    : r.friend === 'received' ? `<button class="sbtn" data-fr="accept" data-id="${esc(u.id)}">গ্রহণ করুন</button><button class="sbtn ghost" data-fr="remove" data-id="${esc(u.id)}">মুছুন</button>`
    : r.friend === 'sent' ? `<button class="sbtn ghost" data-fr="cancel" data-id="${esc(u.id)}">রিকোয়েস্ট বাতিল</button>`
    : `<button class="sbtn" data-fr="add" data-id="${esc(u.id)}">বন্ধু হোন</button>`;
  return main;
};
const personRow = (u, btns) => `<div class="person">${userLink(u.id, av(u))}<div class="info">${userLink(u.id, esc(u.name), 'who-btn')}<div class="sub">${esc(u.union || '')}</div></div><div class="pbtns">${btns}</div></div>`;
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
      openSheet(`${head}<div class="empty pl-hidden">${ic('lock', 34)}<p><b>${esc(prof?.name || 'এই ব্যক্তি')}</b> ${PLIST[kind]} তালিকা ${vis === 'friends' ? 'শুধু বন্ধুদের জন্য রেখেছেন' : 'গোপন রেখেছেন'}।</p><p class="mut">মোট সংখ্যা প্রোফাইলেই দেখা যাচ্ছে।</p></div><button class="btn ghost wide" data-close>বন্ধ করুন</button>`);
      return;
    }
    const row = u => `<div class="person" data-pname="${esc(u.name.toLowerCase())}">${userLink(u.id, av(u))}<div class="info">${userLink(u.id, esc(u.name), 'who-btn')}<div class="sub">${esc(u.union)}</div></div></div>`;
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
});

// ================================================================ প্রোফাইল: কভার ছবি, পোস্ট/ছবি ট্যাব, অ্যালবাম
S.pstate = { me: { tab: 'posts', seg: 'all', album: null }, user: { tab: 'posts', seg: 'all', album: null, uid: null } };
function coverHtml(p, own) {
  return `<div class="cover${p.cover ? '' : ' empty'}">
    ${p.cover ? `<button class="cover-img" data-viewpic="${esc(p.cover)}" aria-label="কভার ছবি দেখুন"><img src="${esc(p.cover)}" alt=""></button>` : ''}
    ${own ? `<button class="cover-btn" id="cover-btn">${ic('camera', 16)} ${p.cover ? 'কভার বদলান' : 'কভার ছবি যোগ করুন'}</button>` : ''}
  </div>
  <div class="prof-av">${own
    ? `<label class="av-edit" title="প্রোফাইল ছবি বদলান">${av(p, 'lg')}<span class="av-cam">${ic('camera', 16)}</span><input type="file" id="avfile" accept="image/*" hidden></label>`
    : p.avatar ? `<button class="avbtn" data-viewpic="${esc(p.avatar)}" aria-label="প্রোফাইল ছবি দেখুন">${av(p, 'lg')}</button>` : av(p, 'lg')}</div>`;
}
function profTabs(key) {
  const st = S.pstate[key];
  return `<div class="ptabs" role="tablist">${[['posts', 'পোস্ট'], ['about', 'এবাউট'], ['photos', 'ছবি']].map(([k, l]) => `<button role="tab" data-ptab="${key}|${k}" aria-selected="${st.tab === k}" class="${st.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div id="${key}-pane"></div>`;
}
function profComposer() {
  const u = me();
  return `<div class="card composer-mini prof-comp"><div class="cm-top">${av(u)}<button class="cm-open" data-pcompose="">আপনার মনে কী আছে, ${esc(u.name.split(' ')[0])}?</button></div>
    <div class="cm-quick"><button data-pcompose="photo"><span class="qi">${ic('photo', 20)}</span>ছবি</button><button data-pcompose="tag"><span class="qi">${ic('tag', 20)}</span>ট্যাগ</button><button data-pcompose="privacy"><span class="qi">${ic('globe', 20)}</span>প্রাইভেসি</button></div></div>`;
}
// কোন ট্যাব খোলা সেই অনুযায়ী নিচের অংশ দেখানো
function showProfPane(key) {
  const st = S.pstate[key], pane = $('#' + key + '-pane'), feed = $('#feed-' + key), more = $('#more-' + key);
  if (!pane) return;
  const own = key === 'me';
  if (st.tab === 'posts') {
    pane.innerHTML = own ? profComposer() + '<h2 class="sec-h">আমার পোস্ট</h2>' : '';
    feed.hidden = false; loadFeed(key);
  } else if (st.tab === 'about') {
    feed.hidden = true; if (more) more.hidden = true;
    renderAbout(key);
  } else {
    feed.hidden = true; if (more) more.hidden = true;
    loadPhotosPane(key);
  }
}
const profUid = key => (key === 'me' ? me()?.id : S.userId);
async function loadPhotosPane(key) {
  const st = S.pstate[key], pane = $('#' + key + '-pane'), uid = profUid(key), own = key === 'me';
  if (!pane || !uid) return;
  const seg = `<div class="seg pseg">${[['all', 'সব ছবি'], ['albums', 'অ্যালবাম']].map(([k, l]) => `<button data-pseg="${key}|${k}" class="${st.seg === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  pane.innerHTML = (st.album ? '' : seg) + '<div class="ph-grid"><div class="skel"></div></div>';
  try {
    if (st.album) {
      const albums = await S.api.albums(uid), a = albums.find(x => String(x.id) === String(st.album));
      if (!a) { st.album = null; return loadPhotosPane(key); }
      const list = await S.api.photos(uid, VIRTUAL_KINDS.includes(a.id) ? { kind: a.id } : { albumId: a.id });
      S.phList = list;
      pane.innerHTML = `<div class="album-head"><button class="back" data-albumback="${key}" aria-label="সব অ্যালবাম">←</button>
          <div class="ah-t"><b>${esc(a.name)}</b><span class="mut">${bn(a.count)}টি ছবি${a.virtual ? '' : ` · ${ic(PRIVACY[a.privacy][0], 13)} ${PRIVACY[a.privacy][1]}`}</span></div>
          ${own && !a.virtual ? `<button class="sbtn" data-albumadd="${esc(a.id)}">${ic('plus', 16)} ছবি যোগ করুন</button><button class="more" data-albummenu="${esc(a.id)}" aria-label="অ্যালবামের অপশন">⋯</button>` : ''}</div>
        ${photoGrid(list, own && !a.virtual ? 'এখনো কোনো ছবি নেই। "ছবি যোগ করুন" চেপে শুরু করুন।' : 'এখনো কোনো ছবি নেই।')}`;
      S.curAlbum = a;
      return;
    }
    if (st.seg === 'all') {
      const list = await S.api.photos(uid); S.phList = list;
      pane.innerHTML = seg + photoGrid(list, own ? 'এখনো কোনো ছবি নেই। ছবিসহ পোস্ট করলে এখানে দেখাবে।' : 'এখনো কোনো ছবি নেই।');
    } else {
      const albums = await S.api.albums(uid);
      pane.innerHTML = seg + `<div class="al-grid">
        ${own ? `<button class="al-card new" data-albumnew>${ic('plus', 30)}<b>নতুন অ্যালবাম</b></button>` : ''}
        ${albums.map(a => `<button class="al-card" data-album="${key}|${esc(a.id)}">${a.cover ? `<img src="${esc(a.cover)}" alt="" loading="lazy">` : `<span class="al-empty">${ic('album', 30)}</span>`}
          <b>${esc(a.name)}</b><span class="mut">${bn(a.count)}টি ছবি${own && !a.virtual ? ` · ${ic(PRIVACY[a.privacy][0], 12)}` : ''}</span></button>`).join('')}
      </div>${!albums.length && !own ? '<div class="empty">কোনো অ্যালবাম নেই।</div>' : ''}`;
    }
  } catch (e) { pane.innerHTML = seg + `<div class="empty">${esc(errText(e))}</div>`; }
}
const VIRTUAL_KINDS = ['avatar', 'cover', 'uploads'];
const photoGrid = (list, emptyText) => list.length
  ? `<div class="ph-grid">${list.map((ph, i) => `<button class="ph-cell" data-phi="${i}" aria-label="ছবি ${bn(i + 1)}"><img src="${esc(ph.url)}" alt="" loading="lazy"></button>`).join('')}</div>`
  : `<div class="empty">${emptyText}</div>`;

function albumSheet(a, then) {
  const pv = a?.privacy || 'public';
  openSheet(`<h2>${a ? 'অ্যালবাম এডিট' : 'নতুন অ্যালবাম'}</h2>
    <label for="al-name">অ্যালবামের নাম</label><input id="al-name" maxlength="60" value="${esc(a?.name || '')}" placeholder="যেমন: ঈদ ২০২৬, ভ্রমণ, পরিবার">
    <label>কারা দেখবে</label><div class="pv-pick">${Object.entries(PRIVACY).map(([k, [icn, l, sub]]) => `<label class="pv-opt"><input type="radio" name="al-pv" value="${k}" ${k === pv ? 'checked' : ''}><span class="pv-ic">${ic(icn, 20)}</span><span class="pv-tx"><b>${l}</b><small>${sub}</small></span><span class="pv-radio" aria-hidden="true"></span></label>`).join('')}</div>
    ${a ? '<p class="mut" style="font-size:13px">প্রাইভেসি বদলালে অ্যালবামের সব ছবিতেও একই প্রাইভেসি হবে।</p>' : ''}
    <button class="btn wide" id="al-save" style="margin-top:12px">${a ? 'সংরক্ষণ' : 'অ্যালবাম তৈরি করুন'}</button><button class="btn ghost wide" data-close style="margin-top:8px">বাতিল</button>`);
  $('#al-save').onclick = e => {
    const name = $('#al-name').value.trim(), privacy = document.querySelector('[name=al-pv]:checked')?.value || 'public';
    if (!name) return toast('অ্যালবামের নাম দিন');
    busy(e.currentTarget, async () => {
      if (a) await S.api.updateAlbum(a.id, { name, privacy }); else { const id = await S.api.createAlbum({ name, privacy }); S.pstate.me.album = id; }
      closeSheet(); toast(a ? 'অ্যালবাম আপডেট হয়েছে' : 'অ্যালবাম তৈরি হয়েছে'); loadPhotosPane('me'); then?.();
    });
  };
}
function openAlbum(uid, albumId) {
  const key = me() && uid === me().id ? 'me' : 'user';
  Object.assign(S.pstate[key], { tab: 'photos', seg: 'albums', album: albumId, uid });
  if (key === 'me') { go('me'); renderMe(); } else openUser(uid, false, true);
}
// নতুন প্রোফাইল বা কভার ছবি: আগে দেখে নিয়ে, নিউজফিডে জানাবেন কিনা বেছে সেভ
function picSheet(kind, blob) {
  const url = URL.createObjectURL(blob), cover = kind === 'cover';
  openSheet(`<h2>${cover ? 'নতুন কভার ছবি' : 'নতুন প্রোফাইল ছবি'}</h2>
    <div class="pic-prev${cover ? ' cover' : ''}"><img src="${url}" alt=""></div>
    <label class="chk"><input type="checkbox" id="pic-share" checked> <span>নিউজফিডে শেয়ার করুন <small class="mut">(বন্ধ রাখলে শুধু আপনার "${cover ? 'কভার ছবি' : 'প্রোফাইল ছবি'}" অ্যালবামে থাকবে, অন্যরা দেখবে না)</small></span></label>
    <button class="btn wide" id="pic-save" style="margin-top:12px">সংরক্ষণ করুন</button><button class="btn ghost wide" data-close style="margin-top:8px">বাতিল</button>`);
  $('#pic-save').onclick = e => busy(e.currentTarget, async () => {
    const share = $('#pic-share').checked;
    if (cover) await S.api.setCover(blob, share); else await S.api.setAvatar(blob, share);
    URL.revokeObjectURL(url); closeSheet(); renderMe(); renderComposer(); loadFeed('home');
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
  if (b.dataset.albumnew !== undefined) return albumSheet(null);
  if (b.dataset.phi) {
    const list = S.phList || [], i = Number(b.dataset.phi);
    return openViewer({ images: list.map(x => x.url), postIds: list.map(x => x.postId) }, i);
  }
  if (b.dataset.albumadd) { const a = S.curAlbum; return openPostComposer({ albumId: a.id, albumName: a.name, privacy: a.privacy, title: 'অ্যালবামে ছবি যোগ করুন' }, 'photo'); }
  if (b.dataset.albummenu) {
    const a = S.curAlbum;
    openSheet(`<div class="menu"><button data-act="edit">${ic('edit', 18)} নাম ও প্রাইভেসি বদলান</button><button data-act="del" class="danger">অ্যালবাম মুছুন</button><button data-close>বন্ধ করুন</button></div>`);
    $('#sheet').onclick = async ev => {
      const act = ev.target.closest('[data-act]')?.dataset.act; if (!act) return;
      if (act === 'edit') return albumSheet(a);
      closeSheet();
      if (act === 'del' && await confirmSheet(`"${a.name}" অ্যালবাম মুছবেন? ভেতরের ছবির পোস্টগুলো মুছবে না, শুধু অ্যালবাম থেকে বেরিয়ে যাবে।`, 'মুছুন', true))
        await busy(null, async () => { await S.api.deleteAlbum(a.id); S.pstate.me.album = null; S.pstate.me.seg = 'albums'; loadPhotosPane('me'); toast('অ্যালবাম মুছে ফেলা হয়েছে'); });
    };
  }
});

// ================================================================ এবাউট (ফেসবুকের মতো): প্রতিটা অংশ চাপলে নিচে এডিট খোলে
const joinedText = d => { if (!d) return ''; const t = new Date(d); return `${bn(t.getFullYear())} সালের ${['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'][t.getMonth()]} থেকে সদস্য`; };
const ABOUT = [
  { id: 'intro', ic: 'info', t: 'পরিচিতি',
    sum: u => u.bio || '', empty: 'নিজের সম্পর্কে কিছু লিখুন',
    form: u => `<label for="ab-name">নাম</label><input id="ab-name" required minlength="2" maxlength="40" value="${esc(u.name)}">
      <label for="ab-bio">নিজের সম্পর্কে</label><textarea id="ab-bio" maxlength="160" rows="2" placeholder="যেমন: শিক্ষক, রক্তদাতা, ব্যবসায়ী…">${esc(u.bio || '')}</textarea>`,
    read: () => { const name = $('#ab-name').value.trim(); if (name.length < 2) return { err: 'নাম অন্তত ২ অক্ষরের দিন' }; return { name, bio: $('#ab-bio').value.trim() }; } },
  { id: 'work', ic: 'work', t: 'কাজ ও শিক্ষা',
    sum: u => [u.work && `${u.work}-এ কাজ করেন`, u.education && `${u.education}-এ পড়েছেন`].filter(Boolean).join(' · '), empty: 'কর্মস্থল ও শিক্ষাপ্রতিষ্ঠান যোগ করুন',
    form: u => `<label for="ab-work">${ic('work', 16)} কর্মস্থল / পেশা</label><input id="ab-work" maxlength="80" value="${esc(u.work || '')}" placeholder="যেমন: ভালুকা সরকারি কলেজ, নিজস্ব ব্যবসা">
      <label for="ab-edu">${ic('school', 16)} শিক্ষাপ্রতিষ্ঠান</label><input id="ab-edu" maxlength="80" value="${esc(u.education || '')}" placeholder="যেমন: ভালুকা পাইলট উচ্চ বিদ্যালয়">`,
    read: () => ({ work: $('#ab-work').value.trim(), education: $('#ab-edu').value.trim() }) },
  { id: 'addr', ic: 'pin', t: 'ঠিকানা',
    sum: u => u.union || '', empty: 'ঠিকানা দিন',
    form: u => addrHtml('ab', u), after: u => addrRefresh('ab', u),
    read: () => { const a = readAddr('ab'); if (!a.upazila || (a.upazila === HOME_UPAZILA && !a.unionId)) return { err: 'ঠিকানা সম্পূর্ণ বাছাই করুন' }; return a; } },
  { id: 'contact', ic: 'mobile', t: 'যোগাযোগ', own: true,
    sum: u => (u.phone ? bn(u.phone) : ''), empty: 'মোবাইল নম্বর দিন',
    form: u => `<label for="ab-ph">${ic('mobile', 16)} মোবাইল নম্বর</label><input id="ab-ph" required inputmode="tel" maxlength="17" value="${esc(u.phone ? bn(u.phone) : '')}" placeholder="০১XXXXXXXXX">
      <p class="mut ab-note">${ic('lock', 13)} প্রোফাইলে কেউ দেখে না। ব্লাড ব্যাংকে ডোনার হলে শুধু লগইন করা ব্যবহারকারীরা দেখতে পান।</p>`,
    read: () => { const phone = normPhone($('#ab-ph').value); return validPhone(phone) ? { phone } : { err: 'সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)' }; } },
  { id: 'blood', ic: 'drop', t: 'রক্তদান',
    sum: u => (u.bloodGroup ? `${u.bloodGroup} · ${u.donorVisible ? 'ব্লাড ব্যাংকে ডোনার' : 'ব্লাড ব্যাংকে দেখানো বন্ধ'}${u.lastDonated ? ` · সর্বশেষ ${bnDate(u.lastDonated)}` : ''}` : ''), empty: 'ব্লাড গ্রুপ দিন',
    pub: u => (u.bloodGroup && u.donorVisible ? `রক্তের গ্রুপ ${u.bloodGroup}` : ''),
    form: u => bloodHtml('ab', u.bloodGroup || '', u.donorVisible, u.lastDonated || ''),
    after: () => { if ($('#ab-never')?.checked) $('#ab-ld').disabled = true; },
    read: () => { const b = readBlood('ab'); if (b.err) return b; return { ...b, donorVisible: !!$('#ab-donor')?.checked }; } },
  { id: 'social', ic: 'link', t: 'সোশ্যাল লিংক',
    sum: u => SOCIALS.filter(([k]) => u.social?.[k]).map(([, l]) => l).join(', '), empty: 'Facebook, WhatsApp, TikTok, YouTube, Instagram যোগ করুন',
    form: u => `<div class="soc-edit flat">${SOCIALS.map(([k, l, ph]) => `<label for="soc-${k}" class="soc-l"><span class="soc-ic">${ic('s_' + k, 16)}</span>${l}</label><input id="soc-${k}" maxlength="200" inputmode="${k === 'whatsapp' ? 'tel' : 'url'}" autocomplete="off" value="${esc(k === 'whatsapp' && u.social?.[k] ? '+' + u.social[k].split('/').pop() : (u.social?.[k] || ''))}" placeholder="${esc(ph)}">`).join('')}</div>`,
    read: () => {
      const social = {};
      for (const [k, l] of SOCIALS) {
        const v = normSocial(k, $('#soc-' + k).value);
        if (v === null) { $('#soc-' + k).focus(); return { err: k === 'whatsapp' ? 'WhatsApp নম্বর ঠিক নেই (যেমন ০১৭১২৩৪৫৬৭৮)' : `${l} লিংক ঠিক নেই। ${l}-এর নিজের লিংক বা ইউজারনেম দিন।` }; }
        if (v) social[k] = v;
      }
      return { social };
    } },
  { id: 'lists', ic: 'lock', t: 'বন্ধু ও ফলো তালিকার প্রাইভেসি', own: true, action: () => listPrivacySheet(),
    sum: u => Object.entries(PLIST).map(([k, l]) => `${l}: ${PRIVACY[u[k + 'Visibility'] || 'public'][1]}`).join(' · ') },
];
function renderAbout(key) {
  const pane = $('#' + key + '-pane'); if (!pane) return;
  const own = key === 'me', u = own ? me() : S.viewProfile, open = S.pstate[key].open;
  if (!u) return;
  if (!own) {
    const blood = ABOUT.find(a => a.id === 'blood').pub(u);
    const rows = [
      u.work && [ic('work', 18), `<b>${esc(u.work)}</b>-এ কাজ করেন`],
      u.education && [ic('school', 18), `<b>${esc(u.education)}</b>-এ পড়েছেন`],
      u.union && [ic('pin', 18), `থাকেন <b>${esc(u.union)}</b>`],
      blood && [ic('drop', 18), esc(blood)],
      u.joinedAt && [ic('calendar', 18), joinedText(u.joinedAt)],
    ].filter(Boolean);
    pane.innerHTML = `<div class="card about-view">${u.bio ? `<p class="about-bio">${esc(u.bio)}</p>` : ''}
      ${rows.map(([i, t]) => `<div class="av-row"><span class="av-i">${i}</span><span>${t}</span></div>`).join('')}
      ${socialHtml(u, false)}
      ${!rows.length && !u.bio && !Object.keys(u.social || {}).length ? '<p class="mut" style="margin:0">এখনো কোনো তথ্য দেওয়া নেই।</p>' : ''}</div>`;
    return;
  }
  pane.innerHTML = `<div class="card about-edit">${ABOUT.map(a => {
    const sum = a.sum(u), isOpen = open === a.id;
    return `<div class="ab-sec${isOpen ? ' open' : ''}" data-absec="${a.id}">
      <button class="ab-head" data-abopen="${a.id}" aria-expanded="${isOpen}">
        <span class="ab-ic">${ic(a.ic, 18)}</span>
        <span class="ab-tx"><b>${a.t}${a.own ? ` <span class="ab-only">${ic('lock', 11)} শুধু আপনি</span>` : ''}</b><small class="${sum ? '' : 'ab-empty'}">${esc(sum || (a.empty ? '+ ' + a.empty : ''))}</small></span>
        <span class="ab-chev">${a.action ? ic('chevR', 18) : ic('chevD', 18)}</span>
      </button>
      ${isOpen ? `<form class="ab-form" data-abform="${a.id}">${a.form(u)}<div class="ab-btns"><button type="button" class="btn ghost sm" data-abcancel>বাতিল</button><button class="btn sm">সেভ করুন</button></div></form>` : ''}
    </div>`;
  }).join('')}
  ${u.joinedAt ? `<div class="ab-joined">${ic('calendar', 15)} ${joinedText(u.joinedAt)}</div>` : ''}</div>`;
  const a = ABOUT.find(x => x.id === open);
  if (a?.after) a.after(u);
  if (a) setTimeout(() => pane.querySelector('.ab-form input, .ab-form select, .ab-form textarea')?.focus({ preventScroll: true }), 30);
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
    $('#user').innerHTML = `<div class="card prof prof-fb">${coverHtml(p, false)}<h2 style="margin:8px 0 0">${esc(p.name)}</h2><div class="mut">${esc(p.union)}</div>${p.bloodGroup ? `<div style="margin-top:6px">${bgBadge(p.bloodGroup)} ${p.donorVisible ? donateStatus(p.lastDonated) : ''}</div>` : ''}
      ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
      ${socialHtml(p, false)}
      ${statsHtml(p)}
      ${r.blocked ? `<p class="mut">আপনি এই ব্যক্তিকে ব্লক করেছেন।</p><button class="btn ghost" id="unblock">আনব্লক করুন</button>`
      : `<div class="row">${relBtns(p)}<button class="sbtn ${r.following ? 'ghost' : ''}" data-fo="${esc(p.id)}" data-on="${r.following ? 1 : 0}">${r.following ? 'ফলো করছেন ✓' : 'ফলো করুন'}</button><button class="sbtn ghost" data-dm="${esc(p.id)}">মেসেজ</button><button class="more" id="umore" aria-label="আরও">⋯</button></div>`}</div>${r.blocked ? '' : profTabs('user')}`;
    $('#unblock')?.addEventListener('click', e => busy(e.currentTarget, async () => { await S.api.unblock(p.id); openUser(p.id, true); loadFeed('user'); }));
    $('#umore')?.addEventListener('click', () => {
      if (!needUser()) return;
      openSheet(`<div class="menu"><button data-act="report">প্রোফাইল রিপোর্ট করুন</button><button data-act="block" class="danger">ব্লক করুন</button><button data-close>বন্ধ করুন</button></div>`);
      $('#sheet').onclick = ev => { const a = ev.target.closest('[data-act]')?.dataset.act; if (a === 'report') reportSheet('user', p.id); if (a === 'block') { closeSheet(); blockUser(p.id, p.name); } };
    });
    if (r.blocked) $('#feed-user').hidden = true; else showProfPane('user');
  } catch (e) { $('#user').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}

// ================================================================ মেসেজ
async function loadConvs() {
  const box = $('#convs');
  if (!me()) { box.innerHTML = `<div class="empty">মেসেজ দেখতে আগে লগইন করুন।<br><button class="btn" style="margin-top:10px" data-go="me">লগইন / অ্যাকাউন্ট খুলুন</button></div>`; return; }
  try {
    const list = await S.api.conversations();
    box.innerHTML = list.length ? list.map(c => `<button class="conv${c.unread ? ' unread' : ''}" data-thread="${esc(c.userId)}">${av(c)}<div class="info"><b>${esc(c.name)}</b><div class="last">${c.lastMine ? 'আপনি: ' : ''}${esc(c.last)}</div></div><div style="text-align:right"><div class="time">${esc(ago(c.lastAt))}</div>${c.unread ? `<span class="badge">${bn(c.unread)}</span>` : ''}</div></button>`).join('')
      : '<div class="empty">এখনো কোনো মেসেজ নেই।<br>কারও প্রোফাইলে গিয়ে "মেসেজ" চাপুন।</div>';
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
$('#convs').addEventListener('click', e => { const b = e.target.closest('[data-thread]'); if (b) openThread(b.dataset.thread); });
async function openThread(id, silent) {
  if (!silent) { S.threadId = id; open('thread'); $('#thread').innerHTML = '<div class="mut">লোড হচ্ছে…</div>'; }
  try {
    const [p, msgs] = await Promise.all([silent ? null : S.api.profile(id), S.api.messages(id)]);
    if (p) $('#t-head').innerHTML = `${userLink(p.id, av(p, 'sm'))}${userLink(p.id, esc(p.name), 'who-btn')}`;
    if (p?.rel?.blocked) { $('#thread').innerHTML = '<div class="empty">আপনি এই ব্যক্তিকে ব্লক করেছেন।</div>'; return; }
    $('#thread').innerHTML = msgs.length ? msgs.map(m => `<div class="bub${m.mine ? ' mine' : ''}">${linkify(m.body)}<small>${esc(clock(m.createdAt))}</small></div>`).join('')
      : '<div class="empty">কথোপকথন শুরু করুন 👋</div>';
    window.scrollTo(0, document.body.scrollHeight);
    if (msgs.some(m => !m.mine && !m.read)) { await S.api.markRead(id); refreshBadges(); }
  } catch (e) { $('#thread').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
$('#tform').addEventListener('submit', e => {
  e.preventDefault(); const body = $('#tmsg').value.trim(); if (!body) return;
  busy(e.submitter, async () => { await S.api.sendMessage(S.threadId, body); $('#tmsg').value = ''; await openThread(S.threadId, true); $('#tmsg').focus(); });
});
async function refreshBadges() {
  if (!me()) { $('#b-msgs').hidden = $('#b-friends').hidden = $('#b-notif').hidden = true; return; }
  try {
    const [n, reqs, nt] = await Promise.all([S.api.unreadCount(), S.api.friendRequests(), S.api.unreadNotifications()]);
    const setB = (id, v) => { $(id).hidden = !v; $(id).textContent = v > 99 ? '৯৯+' : bn(v); };
    setB('#b-msgs', n); setB('#b-friends', reqs.length); setB('#b-notif', S.view === 'notif' ? 0 : nt);
  } catch { /* badge না দেখালেও চলে */ }
}
function listenMessages() {
  S.stopMsg?.(); S.stopMsg = null; S.stopNotif?.(); S.stopNotif = null;
  if (!me()) return;
  S.stopNotif = S.api.onNotify(() => { if (S.view === 'notif') loadNotifs(); else refreshBadges(); });
  S.stopMsg = S.api.onMessage(m => {
    if (S.view === 'thread' && S.threadId === m.from) openThread(m.from, true);
    else { toast('নতুন মেসেজ এসেছে'); if (S.view === 'msgs') loadConvs(); }
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
      <h2 style="margin:6px 0 0">${esc(u.name)}</h2><div class="mut">${ic('pin', 14)} ${esc(u.union)}${u.admin && S.api.mode !== 'demo' ? ' · অ্যাডমিন' : ''}</div>
      <div style="margin-top:6px">${u.bloodGroup ? `${bgBadge(u.bloodGroup)} <span class="mut" style="font-size:13px">${u.donorVisible ? 'ব্লাড ব্যাংকে ডোনার হিসেবে আছেন' : 'ব্লাড ব্যাংকে দেখানো বন্ধ'}</span>
        <div class="mut" style="font-size:14px;margin-top:4px">${ic('calendar', 14)} সর্বশেষ রক্তদান: ${u.lastDonated ? esc(bnDate(u.lastDonated)) : 'দেওয়া নেই'} · ${donateStatus(u.lastDonated)}</div>
        <div class="row" style="margin-top:8px;justify-content:center"><button class="sbtn ghost" data-donor-edit>${ic('edit', 15)} ডোনার তথ্য আপডেট</button><button class="sbtn ghost" id="donated-today">${ic('drop', 15)} আজ রক্ত দিয়েছি</button></div>` : `<span class="mut" style="font-size:13px">ব্লাড গ্রুপ দেওয়া নেই</span> <button class="sbtn ghost" data-add-donor>${ic('drop', 15)} নিজের ডোনার প্রোফাইল যোগ করুন</button>`}</div>
      ${u.bio ? `<p class="bio">${esc(u.bio)}</p>` : ''}
      ${socialHtml(u, true)}
      <div id="mystats">${statsHtml({ id: u.id, friends: '…', followers: '…', following: '…' })}</div>
      <div class="row"><button class="btn ghost" id="edit">${ic('edit', 15)} এবাউট এডিট</button><button class="btn ghost" data-v="menu">⚙️ সেটিং</button></div></div>
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
      extra = { ...addr, phone, bloodGroup: blood.bloodGroup, lastDonated: blood.lastDonated };
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
  try { picSheet(cover ? 'cover' : 'avatar', await compress(file, cover ? 1600 : 640, 0.85)); } catch { toast('ছবিটা পড়া গেল না, অন্য ছবি দিন'); }
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
  const u = me(); $('#comp-av').innerHTML = u ? av(u) : `<div class="av" aria-hidden="true">?</div>`; $('#tab-av').innerHTML = u ? av(u) : TAB_ME_ICON;
  $('#cm-open').textContent = u ? `আপনার মনে কী আছে, ${u.name.split(' ')[0]}?` : 'আপনার মনে কী আছে? পোস্ট করতে লগইন করুন';
}
function afterAuth() {
  if (!me() && S.scope === 'friends') S.scope = 'area';
  renderComposer(); renderFilters(); listenMessages(); refreshBadges(); loadFeed('home'); renderDemoBar();
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
};
async function loadNotifs(keep) {
  const box = $('#notifs');
  if (!me()) { box.innerHTML = `<div class="empty">নোটিফিকেশন দেখতে আগে লগইন করুন।<br><button class="btn" style="margin-top:10px" data-go="me">লগইন / অ্যাকাউন্ট খুলুন</button></div>`; return; }
  if (!keep) box.innerHTML = '<div class="skel"></div>';
  try {
    const [list, reqs] = await Promise.all([S.api.notifications(), S.api.friendRequests()]);
    const pending = new Set(reqs.map(r => r.id));
    box.innerHTML = list.length ? list.map(n => {
      const [ic, txt] = NT[n.type] || ['•', ''];
      const snip = n.groupName ? ` <span class="q">${esc(n.groupName)}</span>` : n.snippet ? ` <span class="q">"${esc(n.snippet.slice(0, 40))}${n.snippet.length > 40 ? '…' : ''}"</span>` : '';
      const reqBtns = n.type === 'friend_request' && pending.has(n.actor.id)
        ? `<div class="acts2"><button class="sbtn" data-fr="accept" data-id="${esc(n.actor.id)}">গ্রহণ করুন</button><button class="sbtn ghost" data-fr="remove" data-id="${esc(n.actor.id)}">মুছুন</button></div>` : '';
      return `<div class="notif${n.read ? '' : ' new'}" data-n-type="${esc(n.type)}" data-n-post="${esc(n.postId ?? '')}" data-n-group="${esc(n.groupId ?? '')}" data-n-user="${esc(n.actor.id)}" role="button" tabindex="0">
        <span class="ico">${av(n.actor)}<i>${ic}</i></span>
        <span class="txt"><b>${esc(n.actor.name)}</b> ${esc(txt)}${snip}<span class="time">${esc(ago(n.createdAt))}</span>${reqBtns}</span></div>`;
    }).join('') : '<div class="empty">এখনো কোনো নোটিফিকেশন নেই।<br>কেউ আপনার পোস্টে লাইক বা মন্তব্য করলে, বা ফ্রেন্ড রিকোয়েস্ট পাঠালে এখানে দেখাবে।</div>';
    if (list.some(n => !n.read)) { await S.api.markNotificationsRead(); $('#b-notif').hidden = true; }
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
function openNotif(el) {
  if (!el || el.closest('button')) return;
  const t = el.dataset.nType;
  if ((t === 'like' || t === 'comment' || t === 'reply' || t === 'mention' || t === 'share' || t === 'tag') && el.dataset.nPost) openPost(el.dataset.nPost);
  else if (t === 'friend_request') go('friends');
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
  $('#cm-wrap').hidden = false; $('#cm-comp').hidden = false; $('#cm-av').innerHTML = me() ? av(me(), 'sm') : '';
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
function repliesHtml(c, post) {
  const r = S.cmKids?.get(c.id) || []; if (!r.length) return '';
  const openAll = r.length <= 1 || S.cmOpen?.has(c.id);
  return `<div class="cm-replies" data-rof="${esc(c.id)}">${openAll ? r.map(x => commentHtml(x, post, false)).join('')
    : `<button class="cm-showrep" data-showrep="${esc(c.id)}">${ic('reply', 15)} ${bn(r.length)}টি উত্তর দেখুন</button>`}</div>`;
}
function commentHtml(c, post, pinned) {
  const top = Object.entries(c.reactions || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return `<div class="cm${pinned ? ' pinned' : ''}${c.parentId ? ' reply' : ''}" data-cid="${esc(c.id)}">
    ${pinned ? `<div class="pin-label">${ic('pushpin', 13)} পিন করা মন্তব্য</div>` : ''}
    <div class="cm-row">${userLink(c.userId, av(c, 'sm'))}
      <div class="cm-main"><div class="cm-bubble">${userLink(c.userId, esc(c.author), 'who-btn')}<div class="cm-text">${moreText(c.body, 'c' + c.id, { chars: 200, lines: 4, mentions: c.mentions })}</div>
        ${c.likes ? `<button class="cm-rx" data-crx="${esc(c.id)}" aria-label="কে কে রিয়্যাক্ট দিয়েছেন">${top.map(([k]) => `<span class="rs-i">${rxIcon(k, 16)}</span>`).join('')}<span>${bn(c.likes)}</span></button>` : ''}</div>
        <div class="cm-meta"><span>${esc(ago(c.createdAt))}${c.editedAt ? ' · সম্পাদিত' : ''}</span>
          <button class="cm-react${c.myReaction ? ' on rx-' + c.myReaction : ''}" data-clike="${esc(c.id)}" aria-label="${c.myReaction ? rxName(c.myReaction) + ' দিয়েছেন' : 'রিয়্যাক্ট দিন'}">${c.myReaction ? rxIcon(c.myReaction, 18) : ic('thumb', 17)}</button>
          <button class="cm-reply" data-creply="${esc(c.id)}" aria-label="উত্তর দিন">${ic('reply', 17)}</button>
          <button class="cm-more" data-cmenu="${esc(c.id)}" aria-label="আরও অপশন">${ic('dots', 18)}</button></div></div></div></div>`;
}
document.querySelector('#cm-sort').addEventListener('click', e => { const b = e.target.closest('[data-csort]'); if (b && b.dataset.csort !== S.csort) { S.csort = b.dataset.csort; loadComments(); } });
$('#cm-form').addEventListener('submit', e => {
  e.preventDefault(); const body = $('#cm-input').value.trim(); if (!body || !needUser()) return;
  const post = S.feeds.post.posts[0];
  const rt = S.replyTo, ments = mentionIds(body, S.cmMentions);
  busy(e.submitter, async () => {
    await S.api.addComment(post.id, body, rt?.id || null, ments); S.cmMentions.clear(); $('#cm-input').value = ''; post.comments++; renderFeed('post');
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
function editCommentInline(c) {
  const el = document.querySelector(`.cm[data-cid="${c.id}"] .cm-text`); if (!el) return;
  el.innerHTML = `<form class="cm-edit"><textarea maxlength="300" rows="2" aria-label="মন্তব্য এডিট করুন">${esc(c.body)}</textarea>
    <div class="cm-edit-b"><button type="button" class="btn ghost sm" data-ecancel>বাতিল</button><button class="btn sm">সংরক্ষণ</button></div></form>`;
  const f = el.querySelector('form'), ta = f.querySelector('textarea'), store = new Map((c.mentions || []).map(m => [m.id, m.name]));
  attachMention(ta, store);
  ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  const cancel = () => loadComments();
  f.querySelector('[data-ecancel]').onclick = cancel;
  ta.onkeydown = e => { if (e.key === 'Escape') cancel(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); f.requestSubmit(); } };
  f.onsubmit = e => {
    e.preventDefault(); const body = ta.value.trim();
    if (!body) return toast('মন্তব্য খালি রাখা যাবে না');
    const ids = mentionIds(body, store);
    if (body === c.body && ids.sort().join() === (c.mentions || []).map(m => m.id).sort().join()) return cancel();
    busy(e.submitter, async () => { await S.api.editComment(c.id, body, ids); toast('মন্তব্য আপডেট হয়েছে'); await loadComments(); });
  };
}
async function setCommentReaction(c, reaction) {
  if (!needUser()) return;
  const prev = c.myReaction || ''; if (prev === reaction) return;
  try { await S.api.reactComment(c.id, reaction, prev); } catch (e) { return toast(errText(e)); }
  c.reactions = { ...(c.reactions || {}) };
  if (prev) c.reactions[prev] = Math.max((c.reactions[prev] || 0) - 1, 0);
  if (reaction) c.reactions[reaction] = (c.reactions[reaction] || 0) + 1;
  c.likes += (reaction ? 1 : 0) - (prev ? 1 : 0); c.myReaction = reaction;
  const el = document.querySelector(`.cm[data-cid="${c.id}"]`), post = S.feeds.post.posts[0];
  if (el) el.outerHTML = commentHtml(c, post, el.classList.contains('pinned'));
}
$('#cm-list').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const findC = id => (S.comments || []).find(x => String(x.id) === String(id));
  if (b.dataset.clike) { if (S.suppressClick) { S.suppressClick = false; return; } clearTimeout(lpTimer); closePicker(); const c = findC(b.dataset.clike); return setCommentReaction(c, c.myReaction ? '' : 'like'); }
  if (b.dataset.crx) return reactorsSheet('comment', b.dataset.crx);
  if (b.dataset.showrep) { S.cmOpen.add(Number(b.dataset.showrep) || b.dataset.showrep); return loadComments(); }
  if (b.dataset.creply) {
    if (!needUser()) return;
    const c = findC(b.dataset.creply), topId = c.parentId || c.id, i = $('#cm-input');
    setReplyTo({ id: topId, name: c.author });
    // উত্তরের উত্তর দিলে নাম আগে বসিয়ে দেওয়া, যাতে বোঝা যায় কাকে বলছেন
    if (c.parentId && c.userId !== me().id && !i.value.trim()) { i.value = '@' + c.author + ' '; S.cmMentions.set(c.userId, c.author); }
    i.focus(); return;
  }
  if (b.dataset.creact) { closePicker(); const c = findC(b.dataset.cid); return setCommentReaction(c, b.dataset.creact === c.myReaction ? '' : b.dataset.creact); }
  if (b.dataset.cmenu) {
    const c = findC(b.dataset.cmenu), post = S.feeds.post.posts[0], u = me();
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
      if (a === 'edit') return editCommentInline(c);
      if (a === 'pin') await busy(null, async () => { const v = post.pinnedCommentId === c.id ? null : c.id; await S.api.pinComment(post.id, v); post.pinnedCommentId = v; toast(v ? 'মন্তব্য পিন করা হয়েছে, সবার উপরে দেখাবে' : 'পিন তুলে নেওয়া হয়েছে'); loadComments(); });
      const nKids = (S.cmKids?.get(c.id) || []).length;
      if (a === 'del' && await confirmSheet(nKids ? `মন্তব্যটি আর এর ${bn(nKids)}টি উত্তর মুছে ফেলবেন?` : 'মন্তব্যটি মুছে ফেলবেন?', 'মুছুন', true)) await busy(null, async () => { await S.api.deleteComment(c.id); post.comments -= 1 + nKids; if (S.replyTo?.id === c.id) setReplyTo(null); if (post.pinnedCommentId === c.id) post.pinnedCommentId = null; renderFeed('post'); loadComments(); });
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
          <div class="info">${userLink(u.id, esc(u.name), 'who-btn')}<div class="sub">${esc(u.union || '')}</div></div>
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
    <button data-sh="copy"><span class="sh-ic">${ic('link', 22)}</span>লিংক কপি</button>
  </div><button class="btn ghost wide" data-close style="margin-top:14px">বাতিল</button>`);
  $('#sheet').onclick = async e => {
    const a = e.target.closest('[data-sh]')?.dataset.sh; if (!a) return;
    if (a === 'fb' || a === 'wa') { setTimeout(closeSheet, 300); return; }
    if (a === 'copy') { try { await navigator.clipboard.writeText(link); toast('লিংক কপি হয়েছে'); } catch { toast('কপি করা যায়নি: ' + link); } return closeSheet(); }
    if (!needUser()) return closeSheet();
    if (a === 'profile') return shareToProfile(orig);
    if (a === 'msg') return shareInMessage(orig, link);
  };
}
function shareToProfile(orig) {
  openSheet(`<h2>নিজের প্রোফাইলে শেয়ার</h2><form id="spform">
    <textarea id="sp-text" maxlength="1000" placeholder="এ বিষয়ে কিছু লিখুন (ঐচ্ছিক)…"></textarea>
    <div class="shared-embed static"><span class="se-top">${av(orig, 'sm')}<span><b>${esc(orig.author)}</b></span></span>${orig.body ? `<span class="se-body">${esc(orig.body)}</span>` : ''}${orig.image ? `<img src="${esc(orig.image)}" alt="">` : ''}</div>
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
    ${u ? `<button class="me-row" data-v="me">${av(u)}<div class="info"><b>${esc(u.name)}</b><div class="sub">আপনার প্রোফাইল দেখুন</div></div></button>`
      : `${demoCard()}<div class="card"><b>আপনি লগইন করেননি</b><p class="mut" style="margin:4px 0 10px">পোস্ট, বন্ধু, গ্রুপ ও পেইজ ব্যবহার করতে লগইন করুন।</p><button class="btn wide" data-v="me">লগইন / অ্যাকাউন্ট খুলুন</button></div>`}
    ${u?.admin ? `<button class="me-row admin-row" data-mgo="admin"><span class="ent-av" style="width:42px;height:42px;border-radius:12px;font-size:0">${ic('shield', 22)}</span><div class="info"><b>অ্যাডমিন ড্যাশবোর্ড</b><div class="sub">অ্যাপের সংখ্যা ও সেটিংস</div></div></button>` : ''}
    <div class="sc-grid">
      ${sc('dir', '🏥', 'সেবা ডিরেক্টরি', 'উপজেলার সব সেবা')}
      ${sc('blood', '🩸', 'ব্লাড ব্যাংক', 'রক্তদাতা খুঁজুন', 'featBlood')}
      ${sc('sos', '🚨', 'জরুরি নম্বর', '৯৯৯ ও হেল্পলাইন')}
      ${sc('saved', '🔖', 'সেভ করা পোস্ট', '')}
      ${sc('groups', '👥', 'গ্রুপ', 'যোগ দিন বা তৈরি করুন', 'featGroups')}
      ${sc('pages', '🏳️', 'পেইজ', 'ব্যবসা ও প্রতিষ্ঠান', 'featPages')}
    </div>
    <details class="card"${u ? '' : ' hidden'}><summary>⚙️ সেটিংস ও প্রাইভেসি</summary><div class="setlist">
      <button id="edit">প্রোফাইল এডিট</button>
      <button id="chpw">পাসওয়ার্ড পরিবর্তন</button>
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
}
$('#menu').addEventListener('click', e => {
  const b = e.target.closest('[data-mgo]'); if (!b) return;
  const t = b.dataset.mgo;
  if (t === 'blood' && !featGuard('featBlood')) return;
  if (t === 'dir' || t === 'sos' || t === 'blood') { S.dcat = t === 'dir' ? '' : t; $('#q').value = ''; open('dir'); loadDir(); }
  else if (t === 'friends') go('friends');
  else if (!needUser()) return;
  else if (t === 'saved') { open('saved'); loadFeed('saved'); }
  else if (t === 'pages') { if (featGuard('featPages')) { open('pages'); loadPages(); } }
  else if (t === 'groups') { if (featGuard('featGroups')) { open('groups'); loadGroups(); } }
  else if (t === 'admin') { open('admin'); loadAdmin(); }
});

// ================================================================ অ্যাডমিন ড্যাশবোর্ড
async function loadAdmin() {
  const box = $('#admin');
  if (!me()?.admin) { box.innerHTML = '<div class="empty">এই পাতা শুধু অ্যাডমিনদের জন্য।</div>'; return; }
  box.innerHTML = '<div class="skel"></div>';
  try {
    const [st, set] = await Promise.all([S.api.adminStats(), S.api.settings()]);
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
        ${[['featBlood', 'ব্লাড ব্যাংক'], ['featGroups', 'গ্রুপ'], ['featPages', 'পেইজ']].map(([k, l]) => `
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
const photoField = (label, cur) => `<label>${esc(label)}</label><div class="row"><span class="pf-prev">${cur ? `<img class="av" src="${esc(cur)}" alt="">` : ''}</span><label class="photo-btn" style="margin:0">ছবি বাছুন<input type="file" class="pf-file" accept="image/*"></label></div>`;
function watchPhoto(store, max = 600) {
  const inp = $('#sheet .pf-file'); if (!inp) return;
  inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try { store.blob = await compress(f, max, 0.85); $('#sheet .pf-prev').innerHTML = `<img class="av" src="${URL.createObjectURL(store.blob)}" alt="">`; } catch { toast('ছবিটি খোলা যায়নি'); } };
}

// ================================================================ পেইজ বা গ্রুপের ভেতরে নতুন পোস্ট (একই পোস্ট বক্স)
function openComposer({ pageId, groupId, title }) { openPostComposer({ pageId, groupId, title, authorName: title }); }

// ================================================================ পেইজ
const pageRow = (pg, btn) => `<div class="ent-row"><button class="ent-btn" data-page="${esc(pg.id)}">${entAv(pg)}</button><div class="info"><button class="ent-btn" data-page="${esc(pg.id)}">${esc(pg.name)}</button><div class="sub">${esc(pg.category)} · ${bn(pg.followers)} ফলোয়ার</div></div>${btn || ''}</div>`;
async function loadPages() {
  const box = $('#pages'); box.innerHTML = '<div class="skel"></div>';
  try {
    const [mine, followed, all] = await Promise.all([S.api.myPages(), S.api.followedPages(), S.api.discoverPages()]);
    const known = new Set([...mine, ...followed].map(x => x.id)), more = all.filter(x => !known.has(x.id));
    box.innerHTML = `
      ${mine.length ? `<div class="card"><div class="sec-h"><h3>আমার পেইজ</h3></div>${mine.map(pg => pageRow(pg, '<span class="tag">অ্যাডমিন</span>')).join('')}</div>` : ''}
      <div class="card"><div class="sec-h"><h3>ফলো করা পেইজ</h3></div>${followed.length ? followed.map(pg => pageRow(pg, `<button class="sbtn ghost" data-pf="${esc(pg.id)}" data-on="1">ফলো করছেন ✓</button>`)).join('') : '<div class="mut">কোনো পেইজ ফলো করছেন না</div>'}</div>
      <div class="card"><div class="sec-h"><h3>আরও পেইজ</h3></div>${more.length ? more.map(pg => pageRow(pg, `<button class="sbtn" data-pf="${esc(pg.id)}" data-on="0">ফলো করুন</button>`)).join('') : '<div class="mut">আর কোনো পেইজ নেই</div>'}</div>`;
  } catch (e) { box.innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
async function openPage(id, silent) {
  if (!silent) { S.pageId = Number(id) || id; S.feeds.page.posts = []; open('page'); $('#page').innerHTML = '<div class="skel"></div>'; $('#feed-page').innerHTML = ''; }
  try {
    const pg = await S.api.page(S.pageId);
    const tel = String(pg.phone || '').replace(/[^\d+]/g, '');
    $('#page').innerHTML = `<div class="card ent-head">${entAv(pg)}<h2 style="margin:4px 0 0">${esc(pg.name)}</h2><div class="meta">${esc(pg.category)} · ${bn(pg.followers)} ফলোয়ার</div>
      ${pg.about ? `<p class="about">${esc(pg.about)}</p>` : ''}${pg.phone ? `<p class="meta" style="margin:6px 0 0">📞 ${esc(bn(pg.phone))}</p>` : ''}
      <div class="row">${pg.isOwner
        ? `<button class="sbtn" id="pg-post">+ পোস্ট করুন</button><button class="sbtn ghost" id="pg-edit">এডিট</button><button class="sbtn ghost" id="pg-del" style="color:var(--r)">মুছুন</button>`
        : `<button class="sbtn ${pg.following ? 'ghost' : ''}" data-pf="${esc(pg.id)}" data-on="${pg.following ? 1 : 0}">${pg.following ? 'ফলো করছেন ✓' : 'ফলো করুন'}</button>${tel ? `<a class="sbtn ghost" style="text-decoration:none;display:inline-grid;place-items:center" href="tel:${esc(tel)}">কল করুন</a>` : ''}<button class="more" id="pg-more" aria-label="আরও">⋯</button>`}</div></div>`;
    $('#pg-post')?.addEventListener('click', () => openPostComposer({ pageId: pg.id, title: `${pg.name}-এর পক্ষে পোস্ট`, authorName: pg.name }));
    $('#pg-edit')?.addEventListener('click', () => pageForm(pg));
    $('#pg-del')?.addEventListener('click', async () => { if (await confirmSheet(`"${pg.name}" পেইজ ও এর সব পোস্ট মুছে ফেলবেন?`, 'মুছুন', true)) busy(null, async () => { await S.api.deletePage(pg.id); toast('পেইজ মুছে ফেলা হয়েছে'); back(); }); });
    $('#pg-more')?.addEventListener('click', () => { if (!needUser()) return; openSheet('<div class="menu"><button data-act="r">পেইজ রিপোর্ট করুন</button><button data-close>বন্ধ করুন</button></div>'); $('#sheet').onclick = ev => { if (ev.target.closest('[data-act=r]')) reportSheet('user', 'page:' + pg.id); }; });
    if (!silent) loadFeed('page');
  } catch (e) { $('#page').innerHTML = `<div class="empty">${esc(errText(e))}</div>`; }
}
function pageForm(pg) {
  const st = {};
  openSheet(`<h2>${pg ? 'পেইজ এডিট' : 'নতুন পেইজ তৈরি করুন'}</h2><form id="pgform">
    <label for="pgn">পেইজের নাম</label><input id="pgn" required minlength="2" maxlength="60" value="${esc(pg?.name || '')}" placeholder="যেমন: রহিম ইলেকট্রনিক্স">
    <label for="pgc">ধরন</label><select class="f" id="pgc">${PAGE_CATS.map(c => `<option ${c === pg?.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
    <label for="pga">বিবরণ (ঐচ্ছিক)</label><textarea id="pga" maxlength="300" placeholder="কী করেন, কখন খোলা থাকে…">${esc(pg?.about || '')}</textarea>
    <label for="pgp">ফোন নম্বর (ঐচ্ছিক)</label><input id="pgp" inputmode="tel" maxlength="20" value="${esc(pg?.phone || '')}">
    ${photoField('পেইজের ছবি / লোগো (ঐচ্ছিক)', pg?.avatar)}
    <div class="row" style="margin-top:16px"><button class="btn" style="flex:1">${pg ? 'সেভ করুন' : 'পেইজ তৈরি করুন'}</button><button class="btn ghost" type="button" data-close>বাতিল</button></div></form>`);
  watchPhoto(st);
  $('#pgform').onsubmit = e => {
    e.preventDefault();
    const toEn = x => x.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
    const v = { name: $('#pgn').value.trim(), category: $('#pgc').value, about: $('#pga').value.trim(), phone: toEn($('#pgp').value.trim()), avatar: st.blob || null };
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
        ${admin ? `<button class="sbtn ghost" id="g-reqs">সদস্য অনুরোধ${reqs.length ? ` <span class="badge">${bn(reqs.length)}</span>` : ''}</button>` : ''}
        ${member ? `<button class="more" id="g-more" aria-label="আরও">⋯</button>` : ''}
      </div>${g.status === 'pending' ? '<p class="mut" style="margin:8px 0 0">অ্যাডমিনের অনুমোদনের অপেক্ষায়।</p>' : ''}</div>`;
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
  openSheet(`<h2>সদস্য (${bn(list.length)})</h2>${list.map(u => `<div class="person">${userLink(u.id, av(u))}<div class="info">${userLink(u.id, esc(u.name), 'who-btn')}<div class="sub">${u.role === 'admin' ? 'অ্যাডমিন' : 'সদস্য'}</div></div>${admin && u.id !== g.ownerId && u.id !== me()?.id ? `<button class="sbtn ghost" data-rm="${esc(u.id)}">বাদ দিন</button>` : ''}</div>`).join('')}<button class="btn ghost wide" data-close style="margin-top:12px">বন্ধ করুন</button>`);
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
  S.view = v;
  if (TABS.includes(v)) S.tab = v;
  document.body.classList.toggle('searching', v === 'search');
  document.querySelectorAll('.view').forEach(e => e.classList.toggle('on', e.id === 'v-' + v));
  document.querySelectorAll('header [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === S.tab));
  window.scrollTo(0, 0);
}
// প্রধান ট্যাবে যাওয়া
function go(v) {
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
    const deep = () => { const m = location.hash.match(/^#post-(\d+)$/); if (m && !(S.view === 'post' && String(S.postId) === m[1])) openPost(m[1]); };
    deep(); window.addEventListener('hashchange', deep);
  } catch (e) {
    $('#feed-home').innerHTML = `<div class="empty">${esc(errText(e))}<br><button class="btn" id="retry">আবার চেষ্টা করুন</button></div>`;
    $('#retry').onclick = () => location.reload();
  }
})();
