// ইংরেজি মোড: পাতায় যে বাংলা লেখা আসে তা অভিধান দেখে ইংরেজি করে দেয়।
// শুধু ইংরেজি বাছাই করলে লোড হয়, বাংলা মোডে এর কোনো খরচ নেই।
// ব্যবহারকারীর লেখা (পোস্ট, মন্তব্য, মেসেজ, নাম) অনুবাদ হয় না।
const BEN = /[ঀ-৿]/;
const DIG = '০১২৩৪৫৬৭৮৯';
// ব্যবহারকারীর লেখা থাকে এমন জায়গা: এগুলোর ভেতরে হাত দেওয়া হয় না
const SKIP = '[translate="no"],textarea,script,style,.m-t,.cm-text,.pbg,.ptext,.se-body,.st-cap,.bio,.ann-full,.n-txt,.more-t,.who-btn b,.avbtn b,.cmention,.mention';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

export async function startI18n() {
  const D = (await import('./i18n-en.js')).default;
  Object.assign(D, EXTRA, PLACES);
  const exact = new Map(), pats = [];
  for (const [k, v] of Object.entries(D)) {
    exact.set(k, v);
    if (/\{[xn]\}/.test(k)) {
      const parts = k.split(/\{[xn]\}/), raw = [...k.matchAll(/\{([xn])\}/g)].map(m => m[1] === 'n');
      const re = new RegExp('^' + parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+?)') + '$');
      pats.push({ re, v, raw, anchor: parts.reduce((a, b) => (b.length > a.length ? b : a), '') });
    }
  }
  const fill = (v, caps) => { let i = 0; return v.replace(/\{[xn]\}/g, () => caps[i++] ?? ''); };
  const cache = new Map();
  // মূল অংশ (প্রথম থেকে শেষ বাংলা অক্ষর) অনুবাদ, আগে-পরের ইমোজি/সংখ্যা/চিহ্ন যেমন আছে থাকে
  function core(n) {
    let v = exact.get(n);
    if (v != null) return v;
    const nums = [];
    const nn = n.replace(/\d+(?:[.,:]\d+)*/g, m => (nums.push(m), '{x}'));
    if (nums.length && (v = exact.get(nn)) != null) return fill(v, nums);
    for (const p of pats) {
      if (p.anchor && !n.includes(p.anchor)) continue;
      const m = n.match(p.re);
      if (!m) continue;
      const caps = m.slice(1).map((c, i) => (p.raw[i] || !BEN.test(c) ? c : tr(c)));
      if (caps.some(c => c == null)) continue; // ব্যবহারকারীর লেখা হতে পারে, ছেড়ে দিই
      return fill(p.v, caps);
    }
    return null;
  }
  function tr(t) {
    if (!BEN.test(t)) return t;
    if (cache.has(t)) return cache.get(t);
    const s = t.replace(/[০-৯]/g, d => DIG.indexOf(d));
    const a = s.search(BEN);
    let b = s.length - 1; while (b > a && !BEN.test(s[b])) b--;
    const pre = s.slice(0, a).replace(/।/g, '.'), mid = s.slice(a, b + 1).replace(/\s+/g, ' '), post = s.slice(b + 1);
    let v = null, p2 = pre;
    const lead = pre.match(/(\d+(?:[.,:]\d+)*)\s*$/);
    if (lead) { const k = exact.get('{x} ' + mid) ?? exact.get('{x}' + mid); if (k != null) { v = fill(k, [lead[1]]); p2 = pre.slice(0, lead.index); } }
    if (v == null) v = core(mid);
    let p3 = post;
    const tail = post.match(/^\s*(\d+(?:[.,:]\d+)*)/);
    if (v == null && tail) {
      const nums = [], nn = mid.replace(/\d+(?:[.,:]\d+)*/g, m => (nums.push(m), '{x}'));
      const k = exact.get(nn + ' {x}') ?? exact.get(nn + '{x}');
      if (k != null) { v = fill(k, [...nums, tail[1]]); p3 = post.slice(tail[0].length); }
    }
    if (v == null && mid.includes(', ')) { const ps = mid.split(', '); if (ps.every(x => PLACES[x])) v = ps.map(x => PLACES[x]).join(', '); }
    if (v != null && v[0] === "'") p2 = p2.replace(/[-\s]+$/, '');
    const out = v == null ? null : (p2 + (/\d$/.test(p2) && /^[A-Za-z]/.test(v) ? ' ' : '') + v + p3.replace(/।/g, '.')).replace(/ {2,}/g, ' ');
    let res = out;
    if (res == null && s.includes(' · ')) { const ps = s.split(' · ').map(x => tr(x) ?? x); const j = ps.join(' · '); if (j !== s) res = j; }
    if (cache.size > 5000) cache.clear();
    cache.set(t, res);
    return res;
  }
  const skip = el => !el || el.closest?.(SKIP);
  function textNode(n) {
    const t = n.nodeValue;
    if (!t || !BEN.test(t) || skip(n.parentElement)) return;
    const v = tr(t);
    if (v != null && v !== t) n.nodeValue = v;
  }
  function attrs(el) {
    for (const a of ATTRS) {
      const t = el.getAttribute(a);
      if (t && BEN.test(t)) { const v = tr(t); if (v != null && v !== t) el.setAttribute(a, v); }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1 || skip(root)) return;
    attrs(root);
    root.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(el => { if (!skip(el)) attrs(el); });
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) textNode(n);
  }
  let busy = false;
  const mo = new MutationObserver(list => {
    if (busy) return; busy = true;
    try {
      for (const m of list) {
        if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') { if (!skip(m.target)) attrs(m.target); }
        else m.addedNodes.forEach(walk);
      }
    } finally { busy = false; }
  });
  walk(document.body);
  if (BEN.test(document.title)) document.title = tr(document.title) || document.title;
  mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  document.documentElement.classList.remove('i18n-wait');
  window.__tr = tr;
}

// জায়গার নাম (ভালুকার ইউনিয়ন, ময়মনসিংহের উপজেলা, ৬৪ জেলা)
const PLACES = {
  'ভালুকা পৌরসভা': 'Bhaluka Pourashava', 'উথুরা ইউনিয়ন': 'Uthura Union', 'কাচিনা ইউনিয়ন': 'Kachina Union', 'ডাকাতিয়া ইউনিয়ন': 'Dakatia Union', 'ধীতপুর ইউনিয়ন': 'Dhitpur Union',
  'বিরুনিয়া ইউনিয়ন': 'Birunia Union', 'ভরাডোবা ইউনিয়ন': 'Bharadoba Union', 'ভালুকা ইউনিয়ন': 'Bhaluka Union', 'মল্লিকবাড়ী ইউনিয়ন': 'Mallikbari Union', 'মেদুয়ারী ইউনিয়ন': 'Meduari Union',
  'রাজৈ ইউনিয়ন': 'Rajoi Union', 'হবিরবাড়ী ইউনিয়ন': 'Habirbari Union', 'হবিরবাড়ি ইউনিয়ন': 'Habirbari Union', 'সদর ইউনিয়ন': 'Sadar Union',
  'ভালুকা': 'Bhaluka', 'ময়মনসিংহ সদর': 'Mymensingh Sadar', 'ত্রিশাল': 'Trishal', 'মুক্তাগাছা': 'Muktagachha', 'ফুলবাড়িয়া': 'Phulbaria', 'গফরগাঁও': 'Gaffargaon', 'নান্দাইল': 'Nandail',
  'ঈশ্বরগঞ্জ': 'Ishwarganj', 'গৌরীপুর': 'Gouripur', 'ফুলপুর': 'Phulpur', 'হালুয়াঘাট': 'Haluaghat', 'ধোবাউড়া': 'Dhobaura', 'তারাকান্দা': 'Tarakanda', 'সাভার': 'Savar',
  'ময়মনসিংহ': 'Mymensingh', 'জামালপুর': 'Jamalpur', 'নেত্রকোণা': 'Netrokona', 'শেরপুর': 'Sherpur', 'ঢাকা': 'Dhaka', 'গাজীপুর': 'Gazipur', 'নারায়ণগঞ্জ': 'Narayanganj', 'নরসিংদী': 'Narsingdi',
  'মুন্সীগঞ্জ': 'Munshiganj', 'মানিকগঞ্জ': 'Manikganj', 'টাঙ্গাইল': 'Tangail', 'কিশোরগঞ্জ': 'Kishoreganj', 'ফরিদপুর': 'Faridpur', 'গোপালগঞ্জ': 'Gopalganj', 'মাদারীপুর': 'Madaripur',
  'রাজবাড়ী': 'Rajbari', 'শরীয়তপুর': 'Shariatpur', 'চট্টগ্রাম': 'Chattogram', 'কক্সবাজার': "Cox's Bazar", 'কুমিল্লা': 'Cumilla', 'ব্রাহ্মণবাড়িয়া': 'Brahmanbaria', 'চাঁদপুর': 'Chandpur',
  'নোয়াখালী': 'Noakhali', 'ফেনী': 'Feni', 'লক্ষ্মীপুর': 'Lakshmipur', 'খাগড়াছড়ি': 'Khagrachhari', 'রাঙ্গামাটি': 'Rangamati', 'বান্দরবান': 'Bandarban', 'রাজশাহী': 'Rajshahi', 'বগুড়া': 'Bogura',
  'পাবনা': 'Pabna', 'সিরাজগঞ্জ': 'Sirajganj', 'নওগাঁ': 'Naogaon', 'নাটোর': 'Natore', 'চাঁপাইনবাবগঞ্জ': 'Chapainawabganj', 'জয়পুরহাট': 'Joypurhat', 'রংপুর': 'Rangpur', 'দিনাজপুর': 'Dinajpur',
  'গাইবান্ধা': 'Gaibandha', 'কুড়িগ্রাম': 'Kurigram', 'নীলফামারী': 'Nilphamari', 'লালমনিরহাট': 'Lalmonirhat', 'ঠাকুরগাঁও': 'Thakurgaon', 'পঞ্চগড়': 'Panchagarh', 'খুলনা': 'Khulna', 'যশোর': 'Jashore',
  'সাতক্ষীরা': 'Satkhira', 'বাগেরহাট': 'Bagerhat', 'কুষ্টিয়া': 'Kushtia', 'ঝিনাইদহ': 'Jhenaidah', 'চুয়াডাঙ্গা': 'Chuadanga', 'মাগুরা': 'Magura', 'মেহেরপুর': 'Meherpur', 'নড়াইল': 'Narail',
  'বরিশাল': 'Barishal', 'পটুয়াখালী': 'Patuakhali', 'ভোলা': 'Bhola', 'পিরোজপুর': 'Pirojpur', 'বরগুনা': 'Barguna', 'ঝালকাঠি': 'Jhalokathi', 'সিলেট': 'Sylhet', 'সুনামগঞ্জ': 'Sunamganj',
  'মৌলভীবাজার': 'Moulvibazar', 'হবিগঞ্জ': 'Habiganj',
};

// অভিধানের বাইরের কিছু শব্দ (তারিখ, ভাষার সুইচ ইত্যাদি)
const EXTRA = {
  'বেশি': 'more', 'কম': 'less', '(কাল': '(tomorrow', 'কাল': 'tomorrow', 'ঘণ্টা {x} মিনিট পর': 'h {x} min left', 'মিনিট পর': 'min left', 'পরের ওয়াক্ত': 'next',
  'কভার ছবি যোগ করুন': 'Add cover photo', 'আপনার প্রোফাইল দেখুন': 'View your profile', 'পোস্ট কতজন দেখছেন': 'How many see your posts', 'ডেমো ব্যবহারকারী': 'Demo User',
  'অ্যাপের সব ফিচার চেক করার প্রোফাইল': 'A profile to check all the app features', 'সাপ্তাহিক রিপোর্ট:': 'Weekly report:',
  'গত সপ্তাহে আপনার পোস্ট {x} জন দেখেছেন, আগের সপ্তাহের চেয়ে': 'Last week {x} people saw your posts, compared to the week before', 'গত সপ্তাহে আপনার পোস্ট {x} জন দেখেছেন': 'Last week {x} people saw your posts',
  'প্রোফাইল ভিজিট {x}, নতুন ফলোয়ার {x}': 'Profile visits {x}, new followers {x}', 'আপনার এলাকায় ({n}) একটি': 'In your area ({n}) a',
  'আপনার মনে কী আছে, {n}': "What's on your mind, {n}", '{n}-এর পক্ষে কিছু লিখুন': 'Write something as {n}', 'আপনি: {n}': 'You: {n}', 'পেইজ: {n}': 'Page: {n}',
  'এর জন্মদিন': "'s birthday", 'এর জন্মদিন। শুভেচ্ছা জানাতে চাপুন': "'s birthday. Tap to send wishes", 'জন যাচ্ছেন': 'going', 'জন গিয়েছিলেন': 'went', 'যাব': 'Going?', 'যাচ্ছি': 'Going',
  '{x} মিনিট আগে': '{x} min ago', '{x} ঘণ্টা আগে': '{x} h ago', '{x} দিন আগে': '{x} days ago', '{x} দিন আগে অ্যাকাউন্ট খোলা': 'Account opened {x} days ago',
  '{x} জন': '{x} people', '{x} জন সদস্য': '{x} members', '{x} জন বন্ধু': '{x} friends', '{x} জন মিউচুয়াল বন্ধু': '{x} mutual friends', '{x}টি মন্তব্য': '{x} comments', '{x}টি শেয়ার': '{x} shares',
  'আবহাওয়া': 'Weather', 'আনা যায়নি': "couldn't load", 'ঘণ্টা': 'h', 'মিনিট পর': 'min left', 'ঘণ্টা {x} মিনিট পর': 'h {x} min left',
  'ভাষা': 'Language', 'ভাষা: ইংরেজি': 'Language: English', 'রবিবার': 'Sunday', 'সোমবার': 'Monday', 'মঙ্গলবার': 'Tuesday', 'বুধবার': 'Wednesday',
  'বৃহস্পতিবার': 'Thursday', 'শুক্রবার': 'Friday', 'শনিবার': 'Saturday', 'ইউজারনেম পরিবর্তন': 'Change username', 'ইউজারনেম পরিবর্তন হয়েছে': 'Username changed',
  'ইউজারনেম সরানো হয়েছে': 'Username removed', 'আপনার প্রোফাইলের লিংক হবে': 'Your profile link will be',
  'অন্যরা @ইউজারনেম দিয়ে আপনাকে খুঁজে পাবেন ও মেনশন করতে পারবেন। খালি রাখলে কোনো ইউজারনেম থাকবে না': 'Others can find and mention you with your @username. Leave blank to have no username',
  'দেওয়া নেই': 'Not set', 'যাচাই হচ্ছে…': 'Checking…', 'পাওয়া যাচ্ছে': 'is available', 'আগে থেকেই কেউ নিয়েছে': 'is already taken',
};
