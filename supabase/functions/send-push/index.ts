// পুশ নোটিফিকেশন পাঠানো (Firebase Cloud Messaging, HTTP v1)
// ডাটাবেসের ট্রিগার (pg_net) নতুন নোটিফিকেশন বা মেসেজের আইডি পাঠায়; এখানে লেখা বানিয়ে ব্যবহারকারীর ফোনগুলোতে পাঠানো হয়।
// দরকারি সিক্রেট: FCM_SERVICE_ACCOUNT (Firebase সার্ভিস অ্যাকাউন্টের পুরো JSON)। ডাটাবেসের গোপন চাবি মিলিয়ে তবেই কাজ করে।
import { createClient } from 'npm:@supabase/supabase-js@2';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

const NT: Record<string, string> = {
  like: 'আপনার পোস্টে রিয়্যাক্ট দিয়েছেন', share: 'আপনার পোস্ট শেয়ার করেছেন', tag: 'আপনাকে একটি পোস্টে ট্যাগ করেছেন',
  comment: 'আপনার পোস্টে মন্তব্য করেছেন', reply: 'আপনার মন্তব্যে উত্তর দিয়েছেন', mention: 'আপনাকে মেনশন করেছেন',
  friend_request: 'আপনাকে ফ্রেন্ড রিকোয়েস্ট পাঠিয়েছেন', friend_accept: 'আপনার ফ্রেন্ড রিকোয়েস্ট গ্রহণ করেছেন', follow: 'আপনাকে ফলো করছেন',
  group_request: 'আপনার গ্রুপে যোগ দিতে চান', group_approved: 'আপনাকে গ্রুপে যুক্ত করেছেন',
  verify_ok: 'আপনার ভেরিফাইড ব্যাজের আবেদন অনুমোদন করেছেন', verify_no: 'আপনার ভেরিফাইড ব্যাজের আবেদন গ্রহণ করেননি',
  boost_ok: 'আপনার পোস্টের বুস্ট অনুমোদন করেছেন, এখন চলছে', boost_no: 'আপনার পোস্টের বুস্ট গ্রহণ করেননি, কয়েন ফেরত গেছে',
  page_admin: 'আপনাকে একটি পেইজের অ্যাডমিন বানিয়েছেন', chat_mention: 'গ্রুপ চ্যাটে আপনাকে উল্লেখ করেছেন',
  chat_join_request: 'আপনার গ্রুপ চ্যাটে যোগ দিতে চান', chat_join_ok: 'আপনাকে গ্রুপ চ্যাটে যুক্ত করেছেন',
};
const APP = 'আমার উপজেলা';
const cut = (s: string, n = 110) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t; };
const bnNum = (n: number) => String(n).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]);

// ---- Google OAuth টোকেন (সার্ভিস অ্যাকাউন্ট দিয়ে নিজে সই করা JWT)
let cached = { token: '', exp: 0 };
const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b as ArrayBuffer);
  let s = ''; bytes.forEach(x => { s += String.fromCharCode(x); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
async function accessToken(sa: { client_email: string; private_key: string }) {
  if (cached.token && Date.now() < cached.exp - 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${head}.${claim}`));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${b64url(sig)}` }) });
  const j = await r.json(); if (!j.access_token) throw new Error('oauth: ' + JSON.stringify(j));
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return cached.token;
}

type Job = { user: string; title: string; body: string; data: Record<string, string>; tag: string; high?: boolean };

async function notifJobs(id: number): Promise<Job[]> {
  const { data: n } = await sb.from('notifications').select('id,user_id,actor_id,type,post_id,group_id,meta, a:profiles!notifications_actor_id_fkey(name), p:posts!notifications_post_id_fkey(body), g:groups!notifications_group_id_fkey(name)').eq('id', id).maybeSingle();
  if (!n) return [];
  const [{ data: pref }, { data: mute }] = await Promise.all([
    sb.from('notif_prefs').select('off').eq('user_id', n.user_id).maybeSingle(),
    n.post_id ? sb.from('notif_mutes').select('post_id').eq('user_id', n.user_id).eq('post_id', n.post_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if ((pref?.off || []).includes(n.type) || mute) return [];
  const m = (n.meta || {}) as Record<string, any>, actor = (n as any).a?.name || APP, post = (n as any).p?.body || '', group = (n as any).g?.name || '';
  let title = actor, body = NT[n.type] || '', high = false;
  if (['comment', 'reply', 'mention'].includes(n.type) && m.text) body += `: "${cut(m.text, 90)}"`;
  else if (['like', 'share', 'tag'].includes(n.type) && post) body += `: "${cut(post, 60)}"`;
  if (n.type === 'share' && m.text) body = `${NT.share}: "${cut(m.text, 80)}"`;
  if (['group_request', 'group_approved'].includes(n.type) && group) body += ` (${group})`;
  if (n.type === 'announce') { title = `${actor} · ঘোষণা`; body = cut(m.text || post, 160); high = true; }
  else if (n.type === 'area_alert') { title = `${actor} · এলাকার খবর`; body = cut(m.text || post, 160); }
  else if (n.type === 'blood_request') { title = '🩸 জরুরি রক্ত দরকার'; body = `${actor}-এর ${m.bg || ''} রক্ত দরকার। আপনি কাছাকাছি একজন ডোনার, সাহায্য করতে পারবেন?`; high = true; }
  else if (n.type === 'login_alert') { title = 'নতুন ডিভাইসে লগইন'; body = 'আপনার অ্যাকাউন্টে নতুন ডিভাইস থেকে লগইন হয়েছে। আপনি না হলে এখনই পাসওয়ার্ড বদলান'; high = true; }
  else if (n.type === 'event_reminder') { title = 'অনুষ্ঠানের কথা মনে আছে?'; body = `${cut(post || 'আপনার অনুষ্ঠান', 70)}, আগামী ২৪ ঘণ্টার মধ্যে`; }
  else if (n.type === 'birthday') { title = APP; body = `আজ ${actor}-এর জন্মদিন 🎂 শুভেচ্ছা জানান`; }
  else if (n.type === 'friend_anniv') { title = APP; body = `আপনি আর ${actor} বন্ধু হওয়ার বর্ষপূর্তি আজ 🤝`; }
  else if (n.type === 'milestone') { title = APP; body = m.kind === 'friends' ? `অভিনন্দন! আপনার এখন ${bnNum(m.n || 0)} জন বন্ধু 🤝` : m.kind === 'reacts' ? `অভিনন্দন! আপনার পোস্টে ${bnNum(m.n || 0)}টি রিয়্যাক্ট হয়েছে ❤️` : `অভিনন্দন! আপনার পোস্ট ${bnNum(m.n || 0)} জন দেখেছেন 🎉`; }
  else if (n.type === 'follower_milestone') { title = APP; body = `অভিনন্দন! আপনার ফলোয়ার এখন ${bnNum(m.n || 0)} জন 🎉`; }
  else if (n.type === 'weekly') { title = APP; body = 'আপনার এই সপ্তাহের রিপোর্ট তৈরি, দেখে নিন 📊'; }
  if (!body) body = 'নতুন নোটিফিকেশন';
  const data: Record<string, string> = { type: n.type, nid: String(n.id) };
  if (n.post_id) data.post = String(n.post_id); if (n.group_id) data.group = String(n.group_id); if (n.actor_id) data.user = n.actor_id;
  if (m.chat_id) data.chat = String(m.chat_id); if (m.page_id) data.page = String(m.page_id);
  return [{ user: n.user_id, title, body, data, tag: n.post_id ? `p${n.post_id}-${n.type}` : `n${n.id}`, high }];
}

async function msgJobs(id: number): Promise<Job[]> {
  const { data: m } = await sb.from('messages').select('id,sender_id,recipient_id,chat_id,body,image_path,voice_path,sticker,loc,poll,mentions,is_auto,deleted_at,page_id, s:profiles!messages_sender_id_fkey(name)').eq('id', id).maybeSingle();
  if (!m || m.is_auto || m.deleted_at || m.page_id) return [];
  const sender = (m as any).s?.name || APP;
  const text = m.body ? cut(m.body, 140) : m.image_path ? '📷 একটি ছবি পাঠিয়েছেন' : m.voice_path ? '🎤 ভয়েস মেসেজ পাঠিয়েছেন' : m.sticker ? 'একটি স্টিকার পাঠিয়েছেন' : m.loc ? '📍 লোকেশন পাঠিয়েছেন' : m.poll ? '📊 একটি পোল দিয়েছেন' : 'নতুন মেসেজ';
  if (m.chat_id) {
    const [{ data: chat }, { data: mem }, { data: muted }] = await Promise.all([
      sb.from('chats').select('name').eq('id', m.chat_id).maybeSingle(),
      sb.from('chat_members').select('user_id').eq('chat_id', m.chat_id),
      sb.from('conv_settings').select('user_id').eq('key', 'g:' + m.chat_id).eq('muted', true),
    ]);
    const skip = new Set([m.sender_id, ...(muted || []).map(x => x.user_id), ...((m.mentions as string[]) || [])]);
    return (mem || []).filter(x => !skip.has(x.user_id)).map(x => ({ user: x.user_id, title: chat?.name || 'গ্রুপ চ্যাট', body: `${sender}: ${text}`, data: { type: 'msg', chat: String(m.chat_id) }, tag: 'g' + m.chat_id, high: true }));
  }
  const to = m.recipient_id; if (!to) return [];
  const [{ data: mu }, { data: fr }, { data: back }, { data: acc }] = await Promise.all([
    sb.from('conv_settings').select('muted').eq('user_id', to).eq('key', 'u:' + m.sender_id).maybeSingle(),
    sb.from('friendships').select('status').eq('status', 'accepted').or(`and(requester.eq.${m.sender_id},addressee.eq.${to}),and(requester.eq.${to},addressee.eq.${m.sender_id})`).limit(1),
    sb.from('messages').select('id').eq('sender_id', to).eq('recipient_id', m.sender_id).limit(1),
    sb.from('conv_settings').select('accepted').eq('user_id', to).eq('key', 'u:' + m.sender_id).eq('accepted', true).maybeSingle(),
  ]);
  if (mu?.muted) return [];
  const known = (fr || []).length || (back || []).length || acc;
  return [{ user: to, title: known ? sender : `${sender} (মেসেজ রিকোয়েস্ট)`, body: text, data: { type: 'msg', user: m.sender_id }, tag: 'u' + m.sender_id, high: true }];
}

Deno.serve(async req => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const { data: allowed } = await sb.rpc('push_secret_ok', { p: req.headers.get('x-push-secret') || '' });
  if (!allowed) return json({ error: 'forbidden' }, 403);
  const raw = Deno.env.get('FCM_SERVICE_ACCOUNT'); if (!raw) return json({ skipped: 'FCM_SERVICE_ACCOUNT নেই' });
  let sa: any; try { sa = JSON.parse(raw); } catch { return json({ error: 'FCM_SERVICE_ACCOUNT ঠিক JSON নয়' }, 500); }
  const { kind, id } = await req.json().catch(() => ({}));
  const jobs = kind === 'notif' ? await notifJobs(Number(id)) : kind === 'msg' ? await msgJobs(Number(id)) : [];
  if (!jobs.length) return json({ sent: 0 });
  const { data: toks } = await sb.from('push_tokens').select('token,user_id').in('user_id', [...new Set(jobs.map(j => j.user))]);
  if (!toks?.length) return json({ sent: 0 });
  const at = await accessToken(sa);
  let sent = 0; const dead: string[] = [];
  await Promise.all(toks.map(async t => {
    const j = jobs.find(x => x.user === t.user_id)!;
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: 'POST', headers: { Authorization: `Bearer ${at}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { token: t.token, notification: { title: j.title, body: j.body }, data: j.data,
        android: { priority: j.high ? 'HIGH' : 'NORMAL', notification: { channel_id: 'default', icon: 'ic_stat_notify', color: '#006a4e', tag: j.tag, sound: 'default' } } } }),
    });
    if (r.ok) { sent++; return; }
    const e = await r.json().catch(() => ({}));
    const code = JSON.stringify(e);
    if (r.status === 404 || /UNREGISTERED|registration-token-not-registered|INVALID_ARGUMENT.*token/i.test(code)) dead.push(t.token);
    else console.error('fcm', r.status, code.slice(0, 300));
  }));
  if (dead.length) await sb.from('push_tokens').delete().in('token', dead);
  return json({ sent, removed: dead.length });
});
