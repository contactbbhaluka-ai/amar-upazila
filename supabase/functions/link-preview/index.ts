// লিংক প্রিভিউ: পোস্টে লিংক দিলে তার শিরোনাম, বিবরণ ও ছবি এনে দেয়।
// শুধু লগইন করা ব্যবহারকারী; ভেতরের/প্রাইভেট নেটওয়ার্কে যাওয়া নিষেধ; ৫ সেকেন্ড, ৫০০ KB সীমা।
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });

function privateV4(ip: string) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => isNaN(n))) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}
function privateV6(ip: string) {
  const x = ip.toLowerCase();
  if (x === '::1' || x === '::') return true;
  if (x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe8') || x.startsWith('fe9') || x.startsWith('fea') || x.startsWith('feb') || x.startsWith('ff')) return true;
  const m = x.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/); if (m) return privateV4(m[1]);
  return false;
}
async function safeHost(u: URL) {
  if (!/^https?:$/.test(u.protocol) || u.username || u.password) return false;
  if (u.port && !['80', '443'].includes(u.port)) return false;
  const h = u.hostname.replace(/^\[|\]$/g, '');
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return !privateV4(h);
  if (h.includes(':')) return !privateV6(h);
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || !h.includes('.')) return false;
  const [v4, v6] = await Promise.all([Deno.resolveDns(h, 'A').catch(() => []), Deno.resolveDns(h, 'AAAA').catch(() => [])]);
  if (!v4.length && !v6.length) return false;
  return v4.every(ip => !privateV4(ip)) && v6.every(ip => !privateV6(ip));
}
const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
function meta(html: string, keys: string[]) {
  for (const k of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, 'i');
    const m = html.match(re1) || html.match(re2);
    if (m && m[1].trim()) return decode(m[1]);
  }
  return '';
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  // গেটওয়ে JWT যাচাই করে; এখানে দেখি এটি লগইন করা ব্যবহারকারীর টোকেন কিনা
  try {
    const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const pl = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (pl.role !== 'authenticated' || !pl.sub) return json({ error: 'login required' }, 401);
  } catch { return json({ error: 'login required' }, 401); }

  let url: URL;
  try { const b = await req.json(); url = new URL(String(b.url || '').slice(0, 1000)); } catch { return json({ error: 'bad url' }, 400); }

  try {
    let res: Response | null = null;
    for (let hop = 0; hop < 4; hop++) {
      if (!(await safeHost(url))) return json({ error: 'blocked' }, 400);
      res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AmarUpazilaBot/1.0; +link-preview)', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'bn,en;q=0.8' } });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) { url = new URL(res.headers.get('location')!, url); await res.body?.cancel(); continue; }
      break;
    }
    if (!res || !res.ok) return json({ error: 'fetch failed' }, 502);
    if (!(res.headers.get('content-type') || '').includes('html')) { await res.body?.cancel(); return json({ url: url.href, site: url.hostname.replace(/^www\./, '') }); }
    const reader = res.body!.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    while (size < 500_000) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); size += value.length; }
    reader.cancel().catch(() => {});
    const buf = new Uint8Array(size); let o = 0; for (const c of chunks) { buf.set(c.subarray(0, Math.min(c.length, size - o)), o); o += c.length; if (o >= size) break; }
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf).slice(0, 500_000);
    const title = meta(html, ['og:title', 'twitter:title']) || decode(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '');
    const desc = meta(html, ['og:description', 'twitter:description', 'description']);
    let image = meta(html, ['og:image:secure_url', 'og:image', 'twitter:image']);
    try { image = image ? new URL(image, url).href : ''; } catch { image = ''; }
    if (image.startsWith('http://')) image = '';   // শুধু নিরাপদ (https) ছবি
    const site = meta(html, ['og:site_name']) || url.hostname.replace(/^www\./, '');
    return json({ url: url.href, title: title.slice(0, 200), desc: desc.slice(0, 300), image: image.slice(0, 800), site: site.slice(0, 80) },);
  } catch { return json({ error: 'fetch failed' }, 502); }
});
