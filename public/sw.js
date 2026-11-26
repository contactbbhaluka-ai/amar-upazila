// সার্ভিস ওয়ার্কার: অ্যাপের ডিজাইন ও কোড ফোনে জমা রাখে, যাতে
//  • ইন্টারনেট না থাকলেও অ্যাপ খোলে (শেষবার যে ভার্সন নামানো হয়েছিল সেটা)
//  • ইন্টারনেট থাকলে খোলার সময় সর্বশেষ ভার্সন আসে (Play Store আপডেট ছাড়াই)
// শুধু এই সাইটের নিজের ফাইল জমা রাখা হয়; Supabase-এর ডেটা বা লগইন কখনো জমা রাখা হয় না।
const SHELL = 'au-shell-v1', ASSETS = 'au-assets-v1', MAX_ASSETS = 80;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (![SHELL, ASSETS].includes(k)) await caches.delete(k);
  await self.clients.claim();
})()));

const timeout = (ms, p) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_ASSETS; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js')) return;   // সবসময় সার্ভার থেকে

  // পাতা খোলা: আগে সার্ভার (৪ সেকেন্ড পর্যন্ত), না পেলে জমা রাখা কপি
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(SHELL);
      try {
        const res = await timeout(4000, fetch(req, { cache: 'no-store' }));
        if (res.ok) cache.put('./', res.clone());
        return res;
      } catch {
        return (await cache.match('./')) || (await caches.match('./offline.html')) || Response.error();
      }
    })());
    return;
  }

  // assets/ ফাইলের নামে হ্যাশ থাকে (কখনো বদলায় না): জমা থাকলে সেটাই, না থাকলে নামিয়ে জমা রাখা
  if (url.pathname.includes('/assets/')) {
    e.respondWith((async () => {
      const cache = await caches.open(ASSETS), hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) { await cache.put(req, res.clone()); trim(cache); }
      return res;
    })());
    return;
  }

  // বাকি (আইকন, privacy.html ইত্যাদি): জমা থাকা কপি সঙ্গে সঙ্গে, পেছনে নতুনটা নামিয়ে রাখা
  e.respondWith((async () => {
    const cache = await caches.open(SHELL), hit = await cache.match(req);
    const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })());
});
