// ইংরেজি মোড: পাতায় যে বাংলা লেখা আসে তা অভিধান দেখে ইংরেজি করে দেয়।
// শুধু ইংরেজি বাছাই করলে লোড হয়, বাংলা মোডে এর কোনো খরচ নেই।
// ব্যবহারকারীর লেখা (পোস্ট, মন্তব্য, মেসেজ, নাম) অনুবাদ হয় না।
const BEN = /[ঀ-৿]/;
const DIG = '০১২৩৪৫৬৭৮৯';
// ব্যবহারকারীর লেখা থাকে এমন জায়গা: এগুলোর ভেতরে হাত দেওয়া হয় না
const SKIP = '#v-dir,[translate="no"],textarea,script,style,.m-t,.cm-text,.pbg,.ptext,.se-body,.st-cap,.bio,.ann-full,.n-txt,.more-t,.who-btn b,.avbtn b,.cmention,.mention';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

// বাংলায় ফেরার জন্য আসল লেখা মনে রাখি
let ST = null;
const touched = new Set(), orig = new WeakMap(), origA = new WeakMap();
const OBS = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };

export async function startI18n() {
  if (ST) { ST.walk(document.body); ST.mo.observe(document.body, OBS); return; }
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
    if (v != null && v !== t) { orig.set(n, t); touched.add(n); n.nodeValue = v; }
  }
  function attrs(el) {
    for (const a of ATTRS) {
      const t = el.getAttribute(a);
      if (t && BEN.test(t)) { const v = tr(t); if (v != null && v !== t) { const o = origA.get(el) || {}; o[a] = t; origA.set(el, o); touched.add(el); el.setAttribute(a, v); } }
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
      if (touched.size > 3000) touched.forEach(n => { if (!n.isConnected) touched.delete(n); });
    } finally { busy = false; }
  });
  walk(document.body);
  if (BEN.test(document.title)) document.title = tr(document.title) || document.title;
  mo.observe(document.body, OBS);
  ST = { walk, mo };
  document.documentElement.classList.remove('i18n-wait');
  window.__tr = tr;
}

// ইংরেজি থেকে বাংলায়: অনুবাদ থামিয়ে আসল বাংলা লেখা ফিরিয়ে দিই
export function stopI18n() {
  if (!ST) return;
  ST.mo.disconnect();
  touched.forEach(n => {
    if (!n.isConnected) return;
    if (n.nodeType === 3) { const o = orig.get(n); if (o != null) n.nodeValue = o; }
    else { const o = origA.get(n); if (o) for (const a in o) n.setAttribute(a, o[a]); }
  });
  touched.clear();
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
  // লগইন ও সাইনআপ
  "এডিট করুন": "Edit", "পাঠানোর ১৫ মিনিটের মধ্যে": "Within 15 minutes of sending", "লেখা কপি করুন": "Copy text", "ফরওয়ার্ড করুন": "Forward", "পিন করুন": "Pin", "পিন সরান": "Unpin",
  "চ্যাটের সবাই উপরে দেখবেন": "Everyone in the chat sees it at the top", "সেভ করুন": "Save", "সেভ থেকে সরান": "Remove from saved", "শুধু আপনি দেখবেন": "Only you will see it",
  "সবার জন্য মুছে ফেলুন": "Unsend for everyone", "শুধু আমার জন্য মুছুন": "Delete for me",
  "সব ছবি": "All photos", "ক্যামেরা": "Camera", "{x}টি ছবি বাছাই করা": "{x} photos selected", "ছবি দেখাতে অনুমতি দিন": "Allow access to photos", "অনুমতি দিন": "Allow",
  "ফাইল থেকে ছবি বাছুন": "Pick from files", "এখানে কোনো ছবি নেই": "No photos here", "তৈরি হচ্ছে…": "Preparing…", "আপনি কিছু ছবির অনুমতি দিয়েছেন": "You allowed some photos", "আরও ছবি বাছুন": "Pick more photos",
  "পাঠান": "Send", "ছবি": "Photo", "গ্যালারি বা ক্যামেরা থেকে, একসাথে ১০টি পর্যন্ত": "From gallery or camera, up to 10 at once", "স্টিকার": "Sticker", "মজার অ্যানিমেটেড স্টিকার": "Fun animated stickers",
  "লোকেশন": "Location", "আপনি এখন কোথায় আছেন, ম্যাপে": "Where you are now, on a map", "পোল": "Poll", "গ্রুপে ভোট নিন": "Take a vote in the group", "পাঠানো হচ্ছে…": "Sending…", "একসাথে সর্বোচ্চ ১০টি ছবি পাঠানো যায়": "You can send up to 10 photos at once",
  "দ্রুত রিয়্যাক্ট": "Quick reaction", "লেখার ঘর খালি থাকলে এই ইমোজি এক চাপে পাঠানো যায়": "When the message box is empty, send this emoji with one tap", "দ্রুত রিয়্যাক্ট: {n}": "Quick reaction: {n}",
  "শব্দ": "Sounds", "অ্যাপ খোলা থাকলে মেসেজ ও নোটিফিকেশনের শব্দ": "Message and notification sounds while the app is open", "সব শব্দ": "All sounds", "চালু আছে": "On", "সব শব্দ বন্ধ": "All sounds off",
  "কখন শব্দ হবে": "When to play a sound", "মেসেজ পাঠালে": "When you send a message", "খোলা চ্যাটে মেসেজ এলে": "New message in the open chat", "নতুন মেসেজ এলে": "New message",
  "অন্য পাতায় থাকলে": "While on another page", "মেসেজ দেখলে": "When a message is seen", "সিন হলে ছোট টিক শব্দ": "A small tick when seen", "রিয়্যাক্ট দিলে বা পেলে": "When you react or get a reaction",
  "নতুন নোটিফিকেশন এলে": "New notification", "মিউট করা চ্যাটে বা ফোন সাইলেন্ট থাকলে শব্দ হবে না": "No sound in muted chats or when the phone is on silent",
  "নোটিফিকেশন চালু করবেন?": "Turn on notifications?", "অ্যাপ বন্ধ থাকলেও সাথে সাথে জানতে পারবেন:": "Get notified right away, even when the app is closed:", "কেউ মেসেজ দিলে": "When someone messages you", "পোস্টে মন্তব্য, রিয়্যাক্ট বা মেনশন হলে": "Comments, reactions or mentions on your posts", "কাছাকাছি কারো জরুরি রক্তের দরকার হলে": "When someone nearby urgently needs blood", "উপজেলার জরুরি ঘোষণা এলে": "Urgent upazila announcements", "চালু করুন": "Turn on", "কোন কোন নোটিফিকেশন আসবে, পরে মেনু → সেটিংস → নোটিফিকেশন সেটিং থেকে বদলাতে পারবেন": "You can change which notifications you get later in Menu → Settings → Notification settings", "ফোনে নোটিফিকেশন": "Phone notifications", "অ্যাপ বন্ধ থাকলেও ফোনের উপরে দেখাবে": "Shown on your phone even when the app is closed", "ফোনে নোটিফিকেশন বন্ধ করা হয়েছে": "Phone notifications turned off", "ফোনের সেটিং থেকে \"আমার উপজেলা\"-র নোটিফিকেশন চালু করুন": "Turn on notifications for \"Amar Upazila\" in your phone settings",
  "উত্তর দিন": "Reply", "উত্তর লিখুন": "Write a reply", "উত্তর পাঠানো হয়েছে": "Reply sent", "পোস্টে দেখুন": "View in post", "ভালোবাসা": "Love", "হাহা": "Haha", "ওয়াও": "Wow", "দুঃখিত": "Sad", "রাগ": "Angry", "লাইক": "Like",
  "বাংলা ফন্ট": "Bangla font", "হিন্দ শিলিগুড়ি": "Hind Siliguri", "নোটো সান্স বাংলা": "Noto Sans Bengali", "ফোনের নিজস্ব ফন্ট": "Phone's own font", "যেটা পড়তে সবচেয়ে আরাম লাগে সেটা বাছাই করুন। শুধু আপনার এই ফোনে বদলাবে": "Pick the one that is most comfortable to read. It changes only on this phone", "অ্যাপের ডিফল্ট": "App default", "এখন:": "Now:", "অ্যাপের ডিফল্ট বাংলা ফন্ট": "Default Bangla font for the app", "অ্যাপ ও ওয়েবসাইটে সবার জন্য এই ফন্ট দেখাবে। কেউ সেটিং থেকে নিজের পছন্দের ফন্ট বাছাই করলে তার ফোনে সেটাই দেখাবে": "This font is shown to everyone in the app and website. If someone picks their own font in settings, their phone shows that instead", "ডিফল্ট ফন্ট বদলানো হয়েছে": "Default font changed", "ফন্ট (Font": "Font",
  "Google দিয়ে চালিয়ে যান": "Continue with Google", "Google দিয়ে লগইন এখনো চালু হয়নি": "Google login is not enabled yet", "Google দিয়ে লগইন হয়নি, আবার চেষ্টা করুন": "Google login failed, please try again", "প্রোফাইল সম্পূর্ণ করুন": "Complete your profile", "Google দিয়ে ইমেইল যাচাই হয়েছে": "Email verified with Google", "অ্যাকাউন্ট চালু করতে নিচের ধাপগুলো পূরণ করুন": "Fill in the steps below to activate your account", "অথবা নিচের ফর্ম পূরণ করুন": "or fill in the form below", "আপনার Google ইমেইল দিয়েই অ্যাকাউন্ট খোলা হবে": "Your account will use your Google email", "যাচাই করা ইমেইল": "Verified email", "চাইলে একটা পাসওয়ার্ডও দিন, তাহলে মোবাইল নম্বর বা ইউজারনেম দিয়েও লগইন করতে পারবেন (ঐচ্ছিক": "You can also set a password to log in with your mobile number or username (optional", "পাসওয়ার্ড (ঐচ্ছিক": "Password (optional", "বাতিল করে বের হয়ে যান": "Cancel and leave", "প্রোফাইল সম্পূর্ণ না করে বের হবেন? পরে Google দিয়ে আবার ঢুকলে এখান থেকেই শুরু করতে পারবেন": "Leave without completing your profile? You can continue from here next time you sign in with Google", "বের হয়ে যান": "Leave", "আগে প্রোফাইলের ধাপগুলো সম্পূর্ণ করুন": "Please complete your profile steps first", "Google দিয়ে লগইন (Supabase-এ Google চালু করার পর": "Google login (after enabling Google in Supabase",
  "আরও পোস্ট দেখতে লগইন করুন": "Log in to see more posts", "ভালুকার মানুষের সব পোস্ট, ছবি আর এলাকার খবর দেখতে অ্যাকাউন্ট খুলুন। এক মিনিটেই হয়ে যাবে": "Create an account to see all posts, photos and local news from the people of Bhaluka. It only takes a minute", "প্রোফাইল দেখতে লগইন করুন": "Log in to see this profile", "পোস্ট, ছবি ও বিস্তারিত তথ্য শুধু অ্যাপের সদস্যরা দেখতে পান। এতে সবার গোপনীয়তা সুরক্ষিত থাকে": "Posts, photos and details are visible only to members. This keeps everyone's privacy safe", "প্রোফাইলটি পাওয়া যায়নি": "Profile not found",
  "আমার উপজেলায় স্বাগতম": "Welcome to Amar Upazila", "বন্ধু, পোস্ট ও এলাকার খবর": "Friends, posts & local news", "পরিচিতদের সাথে যুক্ত থাকুন": "Stay connected with people you know", "মেসেজ ও গ্রুপ চ্যাট": "Messages & group chats", "যখন খুশি কথা বলুন": "Talk any time", "ব্লাড ব্যাংক ও জরুরি সাহায্য": "Blood bank & emergency help", "দরকারে কাছের রক্তদাতা": "Nearby donors when you need them", "উপজেলার সব সেবা এক জায়গায়": "All upazila services in one place", "হাসপাতাল, অফিস, হাট বাজার": "Hospitals, offices, markets", "অ্যাপের সব সুবিধা পেতে একটি অ্যাকাউন্ট খুলুন": "Create an account to get everything the app offers", "সেভ করা অ্যাকাউন্টে লগইন করুন": "Log in to a saved account", "অ্যাকাউন্ট আছে? লগইন করুন": "Have an account? Log in", "লগইন ছাড়াই ঘুরে দেখুন": "Look around without logging in", "ডেমো প্রোফাইল দিয়ে সব ফিচার দেখুন": "See every feature with the demo profile", "লগইন ছাড়াই উপজেলার সেবা ও খবর দেখতে পারবেন": "You can browse upazila services and news without logging in",
  "নতুন এসেছেন": "New here", "আগে থেকে অ্যাকাউন্ট আছে": "Already have an account", "লগআউট করবেন": "Log out", "পাসওয়ার্ড ভুলে গেছেন": "Forgot password",
  "এই অ্যাকাউন্টটা এই ফোনের তালিকা থেকে সরাবেন": "Remove this account from this phone", "ঠিকানায় পাসওয়ার্ড বদলানোর কোড পাঠাব": "— send a password reset code to this address",
  "ভালুকার মানুষের নিজের সামাজিক অ্যাপ": "The social app of the people of Bhaluka",
  "বন্ধু, পোস্ট আর মেসেজে ফিরে যান": "Get back to your friends, posts and messages",
  "ইমেইল, মোবাইল নম্বর বা ইউজারনেম": "Email, mobile number or username",
  "ইমেইল, মোবাইল নম্বর বা ইউজারনেম লিখুন": "Enter your email, mobile number or username",
  "এই ফোনে মনে রাখুন": "Remember me on this phone",
  "অথবা": "or",
  "পোস্ট, বন্ধু ও মেসেজের জন্য অ্যাকাউন্ট লাগবে। সেবা ডিরেক্টরি লগইন ছাড়াই দেখা যায়": "An account is needed for posts, friends and messages. The service directory works without logging in",
  "তথ্য বা পাসওয়ার্ড মেলেনি। আবার দেখে লিখুন": "Login details or password did not match. Please check and try again",
  "অনেকবার ভুল হয়েছে। {x} মিনিট পরে চেষ্টা করুন, অথবা \"পাসওয়ার্ড ভুলে গেছেন?\" চাপুন": "Too many wrong attempts. Try again in {x} minutes, or tap \"Forgot password?\"",
  "ইমেইলটা ঠিক মনে হচ্ছে না, আবার দেখুন": "That email doesn't look right, please check",
  "পাসওয়ার্ড লিখুন": "Enter your password",
  "পাসওয়ার্ড ভুলে গেছেন?": "Forgot password?",
  "নতুন অ্যাকাউন্ট খুলুন": "Create new account",
  "নতুন এসেছেন?": "New here?",
  "আবার স্বাগতম": "Welcome back",
  "আপনার অ্যাকাউন্টে চাপলেই ঢুকে যাবেন": "Tap your account to log in",
  "এক চাপে লগইন": "One-tap login",
  "পাসওয়ার্ড লাগবে": "Password needed",
  "অন্য অ্যাকাউন্ট": "Other account",
  "নতুন করে লগইন": "Log in again",
  "সেভ করা অ্যাকাউন্টগুলো": "Saved accounts",
  "{x} তালিকা থেকে সরান": "Remove {x} from the list",
  "তালিকা থেকে সরান": "Remove from the list",
  "\"{n}\" এই ফোনের তালিকা থেকে সরাবেন?": "Remove \"{n}\" from this phone?",
  "এই ফোনের তালিকা থেকে সরাবেন?": "Remove from this phone?",
  "সরান": "Remove",
  "আপনি এই অ্যাকাউন্টেই আছেন": "You are already on this account",
  "অ্যাকাউন্ট বদলান": "Switch account",
  "এই ফোনে সেভ করা অ্যাকাউন্ট। চাপলেই সেটায় চলে যাবেন": "Accounts saved on this phone. Tap one to switch to it",
  "এখন এই অ্যাকাউন্টে আছেন": "You are on this account now",
  "অন্য অ্যাকাউন্ট যোগ করুন": "Add another account",
  "এই অ্যাকাউন্টটাও মনে থাকবে": "This account will be remembered too",
  "নতুন অ্যাকাউন্ট": "New account",
  "আপনার পরিচয়": "About you",
  "ঠিকানা ও যোগাযোগ": "Address & contact",
  "লগইনের তথ্য": "Login details",
  "আসল নাম দিন, যাতে বন্ধুরা আপনাকে চিনতে পারেন": "Use your real name so friends can recognise you",
  "আপনার এলাকার খবর আর মানুষ দেখাতে কাজে লাগবে": "Used to show you news and people from your area",
  "এই ইমেইল ও পাসওয়ার্ড দিয়ে পরে লগইন করবেন": "You'll log in later with this email and password",
  "আপনার পূর্ণ নাম": "Your full name",
  "লিঙ্গ": "Gender",
  "জন্মতারিখ": "Date of birth",
  "বয়স {x} বছরের বেশি হতে হবে": "must be over {x} years old",
  "পরবর্তী": "Next",
  "পেছনে": "Back",
  "অ্যাকাউন্ট খুলুন": "Create account",
  "আগে থেকে অ্যাকাউন্ট আছে?": "Already have an account?",
  "লগইন করুন": "Log in",
  "আপনার নাম লিখুন (কমপক্ষে {x} অক্ষর": "Enter your name (at least {x} letters",
  "মোবাইল নম্বর (WhatsApp থাকলে এটাই": "Mobile number (your WhatsApp number, if any",
  "এই নম্বর দিয়েও পরে লগইন করতে পারবেন": "You can also log in with this number later",
  "ভালুকা (ময়মনসিংহ": "Bhaluka (Mymensingh",
  "{x} জেলা": "{x} District",
  "ইউনিয়নের তালিকা আনা হচ্ছে": "Loading the union list",
  "ইউনিয়নের তালিকা আনা যায়নি। ইন্টারনেট চালু করে আবার বাছাই করুন": "Couldn't load the union list. Turn on the internet and select again",
  "সঠিক ইমেইল দিন (যেমন": "Enter a valid email (e.g.",
  "সঠিক মোবাইল নম্বর দিন (যেমন": "Enter a valid mobile number (e.g.",
  "নতুন পাসওয়ার্ড": "New password",
  "পাসওয়ার্ড আবার লিখুন": "Re-enter password",
  "কমপক্ষে {x} অক্ষর দিন": "Use at least {x} characters",
  "দুর্বল": "Weak",
  "সংখ্যা ও চিহ্ন মেশান": "mix in numbers and symbols",
  "মাঝারি": "Medium",
  "আরও একটু লম্বা করুন": "make it a bit longer",
  "শক্ত পাসওয়ার্ড": "Strong password",
  "দুটো পাসওয়ার্ড মিলেছে": "Passwords match",
  "এখনো মেলেনি": "Doesn't match yet",
  "দুটো পাসওয়ার্ড মেলেনি": "The two passwords don't match",
  "পাসওয়ার্ড কমপক্ষে {x} অক্ষরের হতে হবে": "Password must be at least {x} characters",
  "আমার বয়স {x} বছরের বেশি। আমি": "I am over {x} years old. I will follow the",
  "এগোতে নিয়মে সম্মতি দিন": "Please agree to the rules to continue",
  "এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন, বা পাসওয়ার্ড ভুলে গেলে রিসেট করুন": "An account already exists with this email. Log in, or reset your password if you forgot it",
  "পাসওয়ার্ডটা আরও শক্ত করুন (অক্ষর, সংখ্যা ও চিহ্ন মিশিয়ে": "Make the password stronger (mix letters, numbers and symbols",
  "এই ইমেইলটা ঠিক নয়, আবার দেখুন": "This email isn't valid, please check",
  "অ্যাকাউন্টের ইমেইল দিন। সেখানে একটি কোড যাবে, সেটা দিয়ে নতুন পাসওয়ার্ড দিতে পারবেন": "Enter your account's email. We'll send a code there so you can set a new password",
  "আপনার ইমেইল": "Your email",
  "কোড পাঠান": "Send code",
  "কোডটি লিখুন": "Enter the code",
  "ইমেইল যাচাই করুন": "Verify your email",
  "ঠিকানায় একটি কোড পাঠানো হয়েছে। ইমেইল খুলে কোডটি এখানে লিখুন": "— we sent a code to this address. Open the email and enter the code here",
  "খুলুন": "Open",
  "আবার পাঠান": "Resend",
  "যাচাই কোড": "Verification code",
  "যাচাই করুন": "Verify",
  "অ্যাকাউন্ট চালু করুন": "Activate account",
  "ইমেইল না পেলে স্প্যাম ফোল্ডার দেখুন। ইমেইলে লিংক থাকলে সেটায় চাপলেও হবে": "Didn't get the email? Check the spam folder. You can also tap the link in the email",
  "ইমেইলে আসা পুরো কোডটি লিখুন": "Enter the full code from the email",
  "কোডটি ভুল বা মেয়াদ শেষ। \"আবার পাঠান\" চেপে নতুন কোড নিন": "The code is wrong or expired. Tap \"Resend\" to get a new one",
  "নতুন কোড পাঠানো হয়েছে": "A new code has been sent",
  "{n} ঠিকানায় পাসওয়ার্ড বদলানোর কোড পাঠাব?": "Send a password reset code to {n}?",
  "স্বাগতম,": "Welcome,",
  "স্বাগতম, {n}": "Welcome, {n}",
  "একটা প্রোফাইল ছবি দিন, যাতে বন্ধুরা আপনাকে সহজে চিনতে পারেন": "Add a profile photo so friends can easily recognise you",
  "একটা কভার ছবি দিন": "Add a cover photo",
  "প্রোফাইলের উপরের বড় ছবি। আপনার এলাকা, প্রিয় জায়গা বা যেকোনো সুন্দর ছবি": "The big photo at the top of your profile. Your area, a favourite place or any nice picture",
  "কভার ছবি বাছাই করুন": "Choose a cover photo",
  "ছবি বাছাই করুন": "Choose photo",
  "এখন না": "Not now",
  "আপনার এলাকার মানুষ": "People in your area",
  "পরিচিতদের ফ্রেন্ড রিকোয়েস্ট পাঠান, তাদের পোস্ট আপনার হোমে দেখাবে": "Send friend requests to people you know, their posts will show on your home",
  "এখনো কাউকে পাওয়া যায়নি। পরে \"বন্ধু\" ট্যাবে দেখবেন": "No one found yet. Check the \"Friends\" tab later",
  "শুরু করুন": "Get started",
  "সব তৈরি! আপনার প্রথম পোস্টটা লিখে ফেলুন": "All set! Write your first post",
  "পাঠানো হয়েছে": "Sent",
  "আপনার এলাকার": "From your area",
  "এই ফোনে অ্যাকাউন্ট মনে রাখুন": "Remember account on this phone",
  "পরের বার পাসওয়ার্ড ছাড়াই ছবিতে চেপে ঢুকতে পারবেন। ফোনটা অন্য কেউ ব্যবহার করলে বন্ধ রাখুন": "Next time just tap your photo to log in without a password. Turn this off if someone else uses this phone",
  "লগইন করা ডিভাইস": "Logged-in devices",
  "যেসব ফোন বা কম্পিউটারে আপনার অ্যাকাউন্ট খোলা আছে। অচেনা কিছু দেখলে লগআউট করে পাসওয়ার্ড বদলান": "Phones and computers where your account is open. If you see anything unfamiliar, log it out and change your password",
  "কম্পিউটার": "computer",
  "অজানা ডিভাইস": "Unknown device",
  "ব্রাউজার": "Browser",
  "আমার উপজেলা অ্যাপ": "Amar Upazila app",
  "এই ডিভাইস": "This device",
  "প্রথম লগইন": "first login",
  "এটা ছাড়া সব ডিভাইস থেকে লগআউট": "Log out of all other devices",
  "শুধু এই ডিভাইসেই লগইন করা আছে": "Logged in on this device only",
  "পাসওয়ার্ড বদলান": "Change password",
  "ওই ডিভাইস থেকে লগআউট হয়েছে": "Logged out of that device",
  "অন্য সব ডিভাইস থেকে লগআউট হয়েছে": "Logged out of all other devices",
  "তালিকা আনা যায়নি, পরে আবার চেষ্টা করুন": "Couldn't load the list, please try again later",
  "নতুন ডিভাইস থেকে আপনার অ্যাকাউন্টে লগইন হয়েছে": "Your account was logged in from a new device",
  "আপনি না হলে এখনই পাসওয়ার্ড বদলান": "If this wasn't you, change your password now",
  "লগআউট করবেন?": "Log out?",
  "অপেক্ষা করুন": "Please wait",
  'বিস্তারিত': 'Details',
  'উপরে ফিরুন': 'Back to top',
  'বৃষ্টি হতে পারে, বের হলে ছাতা সাথে রাখতে পারেন': 'Rain is possible, take an umbrella if you go out', 'আজকের আবহাওয়া ভালো, বাইরে যাওয়ার জন্য উপযুক্ত দিন': 'Nice weather today, a good day to go out', '°সে': '°C',
  'বৃষ্টি {x}%': 'Rain {x}%', 'আজ': 'Today',
  'শুভ সকাল, {n}': 'Good morning, {n}', 'শুভ দুপুর, {n}': 'Good afternoon, {n}', 'শুভ বিকাল, {n}': 'Good afternoon, {n}', 'শুভ সন্ধ্যা, {n}': 'Good evening, {n}', 'শুভ রাত্রি, {n}': 'Good night, {n}',
  'ভালুকাবাসী': 'people of Bhaluka', 'ভালুকার সব সেবা এক জায়গায় · {x}টি ধরন · মোট {x}টি সেবা': 'All Bhaluka services in one place · {x} categories · {x} services',
  'বঙ্গাব্দ': 'Bangabda', 'আজকের আবহাওয়া ভালো · সর্বোচ্চ {x}°, সর্বনিম্ন {x}°': 'Good weather today · high {x}°, low {x}°', 'আজ বৃষ্টির সম্ভাবনা {x}%, ছাতা সাথে রাখুন': '{x}% chance of rain today, carry an umbrella',
  'আজ গরম বেশি ({x}°), বেশি করে পানি খান, রোদে কম থাকুন': 'Hot today ({x}°), drink plenty of water and stay out of the sun', 'আজ শীত বেশি ({x}°), গরম কাপড় পরুন': 'Cold today ({x}°), wear warm clothes',
  'কুয়াশা আছে, সাবধানে গাড়ি চালান': 'Foggy, drive carefully', 'বজ্রঝড়ের সম্ভাবনা, খোলা মাঠ বা গাছের নিচে থাকবেন না': 'Thunderstorms likely, avoid open fields and trees',
  'বৃষ্টি হতে পারে ({x}%) · সর্বোচ্চ {x}°, সর্বনিম্ন {x}°': 'Rain possible ({x}%) · high {x}°, low {x}°', 'আবহাওয়ার তথ্য এখন আনা যায়নি': "Couldn't load the weather right now", 'ডিরেক্টরিতে ব্যানার যোগ করুন': 'Add a banner to the directory',
  'ব্যানার': 'Banners', 'ডিরেক্টরির ব্যানার': 'Directory banners', 'নতুন ব্যানার': 'New banner', 'শিরোনাম': 'Title', 'নিচের লেখা (ঐচ্ছিক': 'Subtitle (optional', 'রং (ছবি না দিলে': 'Color (without a photo',
  'চাপলে কোথায় যাবে (ঐচ্ছিক': 'Opens when tapped (optional', 'ব্যানার যোগ হয়েছে': 'Banner added', 'ব্যানার মুছে ফেলা হয়েছে': 'Banner deleted', 'এখনো কোনো ব্যানার নেই': 'No banners yet', 'যোগ করুন': 'Add', 'বন্ধ': 'Close',
  'এগুলো সেবা ডিরেক্টরির উপরে পালাক্রমে ঘুরবে। উপজেলার সবুজ ব্যানার সবসময় শেষে থাকে। সর্বোচ্চ ১০টি': 'These rotate at the top of the directory. The green upazila banner always stays last. Up to 10',
  'বিপদে আছি': "I'm in danger", 'প্রাথমিক চিকিৎসা': 'First aid', 'বিপদে আছেন': 'In danger', 'লোকেশনসহ SMS পাঠান': 'Send SMS with location', 'WhatsApp-এ লোকেশন পাঠান': 'Send location on WhatsApp',
  '৯৯৯-এ কল করুন (পুলিশ, ফায়ার, অ্যাম্বুলেন্স': 'Call 999 (police, fire, ambulance', '৯৯৯-এ কল করুন': 'Call 999', 'পরিচিতজন বদলান': 'Change contacts', 'পরিচিতজনের নম্বর যোগ করুন': 'Add contact numbers',
  'বিপদের পরিচিতজন': 'Emergency contacts', 'পরিচিতজন সংরক্ষণ হয়েছে': 'Contacts saved', 'লোকেশন খুঁজছি…': 'Finding location…', 'জরুরি অবস্থায় কী করবেন': 'What to do in an emergency', 'সব বিষয়': 'All topics',
  'যা করবেন': 'Do', 'যা করবেন না': "Don't", 'রাতে দরকার হতে পারে': 'May be needed at night', 'সকালের দরকারি সেবা': 'Useful this morning', 'এখন দরকারি সেবা': 'Useful now', 'সন্ধ্যার দরকারি সেবা': 'Useful this evening',
  'নম্বরগুলো শুধু এই ফোনে থাকে, কোথাও পাঠানো হয় না। SMS-এর সাধারণ খরচ লাগতে পারে': 'The numbers stay only on this phone and are never uploaded. Normal SMS charges may apply',
  'এগুলো প্রাথমিক সাহায্য, চিকিৎসার বিকল্প নয়': 'This is first aid, not a substitute for medical care',
  'কণ্ঠে খুঁজুন': 'Voice search', 'বলুন… (যেমন: হাসপাতাল': 'Speak… (e.g. hospital', 'কিছু শোনা যায়নি, আবার চেষ্টা করুন': "Didn't catch that, please try again", 'কণ্ঠে খোঁজা যায়নি, আবার চেষ্টা করুন': "Voice search didn't work, please try again",
  'মাইক্রোফোনের অনুমতি দিন': 'Allow the microphone', 'ইন্টারনেট নেই · {n} তারিখে সেভ করা তালিকা দেখাচ্ছেন। কল করা যাবে': 'No internet · showing the list saved on {n}. You can still call',
  'ইন্টারনেট নেই, আর আগে সেভ করা কোনো তালিকাও নেই। নেট চালু করে একবার খুললে পরের বার নেট ছাড়াও দেখা যাবে': 'No internet and no saved list yet. Open it once with internet and next time it will work offline',
  'জনপ্রিয় ক্যাটাগরি': 'Popular categories',
  'কাছের সেবা': 'Nearby', 'আমার কাছের সেবা': 'Services near me', 'লোকেশন দিলে কাছের হাসপাতাল, ডাক্তার, ব্যাংক দূরত্বসহ দেখাবে': 'Share your location to see nearby hospitals, doctors and banks with distance',
  'আবার খুঁজুন': 'Refresh', 'পথ দেখুন': 'Directions', 'অবস্থান দিন': 'Set location', 'অবস্থান বদলান': 'Change location', 'অবস্থান সংরক্ষণ হয়েছে': 'Location saved', 'মিটার': 'm', 'কিমি': 'km',
  '{x} মিটার': '{x} m', '{x} কিমি': '{x} km', 'আপনার অবস্থান খোঁজা হচ্ছে…': 'Finding your location…', 'আপনার অবস্থান খোঁজা হচ্ছে': 'Finding your location',
  'কাছাকাছি অবস্থান দেওয়া কোনো সেবা পাওয়া যায়নি। সেবা যোগ করার সময় "ম্যাপে অবস্থান" দিলে এখানে দেখাবে': 'No services with a map location found nearby. Services added with a "Location on map" will show here',
  'শুধু যে সেবাগুলোর ম্যাপে অবস্থান দেওয়া আছে সেগুলো দেখাচ্ছে। দূরত্ব সোজা পথে, রাস্তায় একটু বেশি হতে পারে': 'Only services with a map location are shown. Distance is straight-line; by road it may be a bit more',
  'সেবার জায়গায় দাঁড়িয়ে "আমি এখন যেখানে আছি" চাপুন, অথবা গুগল ম্যাপের লিংক দিন': 'Stand at the service location and tap "Where I am now", or paste a Google Maps link',
  'আমার প্রিয় সেবা': 'My favorite services', 'প্রিয়': 'Favorites', 'প্রিয় সেবায় রাখুন': 'Add to favorites', 'প্রিয় থেকে সরান': 'Remove from favorites', 'প্রিয় সেবায় রাখা হয়েছে': 'Added to favorites',
  'প্রিয় থেকে সরানো হয়েছে': 'Removed from favorites', 'এখনো কোনো প্রিয় সেবা নেই। যেকোনো সেবার কার্ডে 🤍 চাপলে এখানে থাকবে': 'No favorite services yet. Tap 🤍 on any service card to keep it here',
  'সাম্প্রতিক খোঁজা': 'Recent searches', 'জনপ্রিয় সেবা': 'Popular services', '{x}টি সেবা': '{x} services', 'খুঁজুন: হাসপাতাল, doctor, bidyut…': 'Search: hospital, doctor, electricity…',
  'ভালুকার সব সেবা এক জায়গায়': 'All Bhaluka services in one place', '{x}টি ধরন · মোট {x}টি সেবা যুক্ত': '{x} categories · {x} services listed', 'জরুরি সেবা': 'Emergency', 'সরকারি ও প্রশাসন': 'Government & administration',
  'শিক্ষা ও পেশাজীবী': 'Education & professionals', 'গুণী মানুষ ও বিয়ে': 'Notable people & marriage', 'ভ্রমণ, যাতায়াত ও থাকা': 'Travel, transport & stay', 'খাবার, বাজার ও কাজ': 'Food, market & jobs', 'দৈনন্দিন সেবা': 'Everyday services',
  'উপজেলা': 'Upazila', 'পৌরসভা': 'Pourashava', 'ইউনিয়ন': 'Union', 'ফায়ার সার্ভিস': 'Fire service', 'থানা পুলিশ': 'Police station', 'প্রশাসন': 'Administration', 'এ্যাম্বুলেন্স': 'Ambulance',
  'হাসপাতাল': 'Hospital', 'সাংবাদিক': 'Journalists', 'আইনজীবী': 'Lawyers', 'প্রসিদ্ধ ব্যক্তি': 'Notable people', 'মুক্তিযোদ্ধা': 'Freedom fighters', 'ভোটার তালিকা': 'Voter list', 'স্কুল কলেজ': 'Schools & colleges',
  'দর্শনীয় স্থান': 'Places to visit', 'রেস্টুরেন্ট': 'Restaurants', 'আবাসিক হোটেল': 'Hotels', 'কুরিয়ার': 'Courier', 'ব্যাংক': 'Banks', 'গাড়ি ভাড়া': 'Car rental', 'ব্রডব্যান্ড': 'Broadband',
  'পরিচ্ছন্নতা': 'Cleaning', 'বিদ্যুৎ': 'Electricity', 'জিম': 'Gym', 'লেডিস পার্লার': 'Ladies parlour', 'জেন্টস পার্লার': 'Gents parlour', 'অফিস': 'Offices', 'কাজী অফিস': 'Kazi office',
  'হাট বাজার': 'Markets', 'কসাই ও বাবুর্চি': 'Butchers & cooks', 'সকল মিস্ত্রি': 'All mechanics', 'এয়ার ট্রাভেল': 'Air travel', 'গ্রাফিক্স': 'Graphics', 'টিউশন': 'Tuition', 'সাইবার এক্সপার্ট': 'Cyber expert',
  'ভিডিও': 'Video', 'ব্যান্ডপার্টি': 'Band party', 'কৃতি সন্তান': 'Achievers', 'বাসা ভাড়া': 'House rent', 'পাত্রপাত্রী': 'Matrimony', 'ঘটক': 'Matchmaker', 'ক্রয়বিক্রয়': 'Buy & sell', 'পরিবহন': 'Transport',
  'সব সেবা': 'All services', 'এই ধরনের কোনো সেবা এখনো যোগ হয়নি। নিচের বোতাম চেপে প্রথমটি যোগ করুন': 'No services of this type yet. Tap the button below to add the first one', '{x}টি': '{x}',
  'উপজেলা সেবা ডিরেক্টরি': 'Upazila service directory',
  'আমার শর্টকাট': 'My shortcuts', 'সাজান': 'Arrange', '"সাজান" চেপে পছন্দের শর্টকাট এখানে রাখুন': 'Tap "Arrange" to keep favorite shortcuts here',
  'শর্টকাট সাজান': 'Arrange shortcuts', 'মেনুর একদম উপরে কোন শর্টকাটগুলো থাকবে বেছে নিন। ↑ ↓ দিয়ে আগে-পরে করুন। সর্বোচ্চ {x}টি': 'Choose which shortcuts stay at the top of the menu. Reorder with ↑ ↓. Up to {x}',
  'উপরে আছে ({x}': 'At the top ({x}', 'বাকি শর্টকাট': 'Other shortcuts', '＋ যোগ': '＋ Add', 'যোগ': 'Add', 'কিছু নেই': 'Nothing', 'হয়ে গেছে': 'Done', 'উপরে': 'Up', 'নিচে': 'Down',
  'এই দিনে': 'On this day', 'আগের বছরের আজকের পোস্ট': "Your posts from this day", 'আমার কার্যকলাপ': 'My activity', 'লাইক, মন্তব্য ও শেয়ার': 'Likes, comments & shares',
  'আগের বছরগুলোতে ঠিক আজকের তারিখে আপনি যা পোস্ট করেছিলেন': 'What you posted on this date in past years',
  'আগের বছরগুলোতে আজকের তারিখে আপনার কোনো পোস্ট নেই': 'You have no posts from this date in past years', 'পরের বছর এই দিনে আজকের পোস্টগুলো এখানে দেখাবে': "Next year on this day, today's posts will show here",
  'রিয়্যাক্ট': 'Reactions', 'নিজের পোস্টে': 'On your own post', 'এর পোস্টে': "'s post:", 'রিয়্যাক্ট দিয়েছেন': 'you reacted', 'মন্তব্য করেছেন': 'you commented', 'একটি মন্তব্যের উত্তর দিয়েছেন': 'you replied to a comment',
  'নিজের পোস্টে {x} রিয়্যাক্ট দিয়েছেন': 'You reacted {x} to your own post', 'নিজের পোস্টে মন্তব্য করেছেন': 'You commented on your own post', 'নিজের পোস্টে একটি মন্তব্যের উত্তর দিয়েছেন': 'You replied to a comment on your own post',
  'এর পোস্টে {x} রিয়্যাক্ট দিয়েছেন': "'s post: you reacted {x}", 'এর পোস্টে মন্তব্য করেছেন': "'s post: you commented", 'এর পোস্টে একটি মন্তব্যের উত্তর দিয়েছেন': "'s post: you replied to a comment",
  'এর পোস্ট শেয়ার করেছেন': "'s post: you shared it", 'নিজের পোস্ট শেয়ার করেছেন': 'You shared your own post',
  'এখানে এখনো কিছু নেই। লাইক, মন্তব্য বা শেয়ার করলে এখানে দেখাবে': 'Nothing here yet. Your likes, comments and shares will show here', 'শুধু আপনি এই তালিকা দেখতে পান': 'Only you can see this list',
  'লগআউট করবেন': 'Log out', 'আবার ঢুকতে ইমেইল ও পাসওয়ার্ড লাগবে': "You'll need your email and password to log back in", 'সব ডিভাইস থেকে লগআউট': 'Log out of all devices',
  'অন্য কোনো ফোনে বা কম্পিউটারে লগইন করা থাকলে সেখান থেকেও বের হয়ে যাবেন। ফোন হারালে বা পাসওয়ার্ড অন্য কেউ জানলে এটা ব্যবহার করুন': 'You will also be logged out on any other phone or computer. Use this if you lose your phone or someone else knows your password',
  'সব ডিভাইস থেকে লগআউট হয়েছে': 'Logged out of all devices', 'সাধারণ প্রশ্নোত্তর (FAQ': 'FAQ (frequently asked questions',
  'ফন্ট সাইজ': 'Font size',
  'ডার্ক মোড': 'Dark mode', 'চালু · চোখের আরাম, রাতে ভালো': 'On · easy on the eyes at night', 'বন্ধ · এখন দিনের (লাইট) মোড': 'Off · day (light) mode now', 'লাইট': 'Light',
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
