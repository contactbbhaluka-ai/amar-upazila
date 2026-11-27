// ডেটা লেয়ার: একই ফাংশনগুলো দুইভাবে কাজ করে —
//   Supabase মোড (আসল সার্ভার) এবং ডেমো মোড (ব্রাউজারের localStorage)।
// UI কোড শুধু এই ফাইলের ফাংশন ডাকে, তাই ব্যাকএন্ড বদলালেও UI বদলাতে হয় না।
//
// সাধারণ আকার:
//   User     { id, name, unionId, union, avatar, bio }
//   Relation { friend: 'none'|'sent'|'received'|'friends', following, blocked }
//   Post     { id, body, image, category, createdAt, likes, comments, userId, author, avatar, union, liked }
import { DEMO_TOURS } from './demo-tours.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, UPAZILA_ID, DEMO, SETTING_KEYS, PUBLIC_URL } from './config.js';
// অ্যালবামের ছবি: পোস্টের তালিকা থেকে একেকটা ছবি আলাদা করে [{ url, postId, i, createdAt }]
const flattenPhotos = rows => rows.flatMap(r => (r.images || []).map((url, i) => ({ url, postId: r.id, i, createdAt: r.createdAt })));
// নিজে থেকে তৈরি অ্যালবাম: প্রোফাইল ছবি, কভার ছবি, আর বাকি সব ছবি "মোবাইল আপলোড"-এ (ফেসবুকের মতো)
const VIRTUAL_ALBUMS = { avatar: 'প্রোফাইল ছবি', cover: 'কভার ছবি', uploads: 'মোবাইল আপলোড' };
const inVirtual = (k, p) => (k === 'uploads' ? (p.kind || 'normal') === 'normal' && !p.albumId : p.kind === k);
const FEATURED0 = ['works', 'educations', 'addr', 'social', 'joined'];
// ব্যাজ চালু আছে কিনা: পাবলিক ফিগার (authentic) স্থায়ী, কেনা ব্যাজ (paid) মেয়াদ পর্যন্ত
export const badgeOf = p => (p?.verified === 'authentic' ? 'authentic' : p?.verified === 'paid' && new Date(p.verified_until ?? p.verifiedUntil) > Date.now() ? 'paid' : '');
const EARN_REASONS = ['post', 'comment', 'like', 'share'];
const dhakaMidnight = () => { const d = new Date(Date.now() + 6 * 3600e3); d.setUTCHours(0, 0, 0, 0); return new Date(d.getTime() - 6 * 3600e3); };
const toBoost = r => r && ({ id: r.id, postId: r.post_id, userId: r.user_id, days: r.days, coins: r.coins, unionId: r.union_id || null, unionName: r.un?.name || r.unionName || '', status: r.status, adminNote: r.admin_note || '',
  startsAt: r.starts_at || null, endsAt: r.ends_at || null, reach: r.reach || 0, createdAt: r.created_at, postBody: r.po?.body ?? r.postBody ?? '', postImage: r.po?.image_urls?.[0] || r.po?.image_url || r.postImage || '' });
// চালু = অনুমোদিত এবং মেয়াদ শেষ হয়নি; মেয়াদ পার হলে "শেষ"
export const boostState = b => (b.status === 'active' ? (new Date(b.endsAt) > Date.now() ? 'active' : 'ended') : b.status);
const toStats = r => ({ people: r.people || 0, views: r.views || 0, today: r.today || 0, close: r.close || 0, others: r.others || 0, newFollowers: r.new_followers || 0, boostReach: r.boost_reach || 0,
  sources: r.sources || {}, areas: r.areas || [], genders: r.genders || null, ages: r.ages || null, daily: r.daily || [], clicks: r.clicks || { profile: 0, photo: 0, more: 0 } });
const toInsights = r => ({ days: r.days || 7, people: r.people || 0, views: r.views || 0, close: r.close || 0, others: r.others || 0, newFollowers: r.new_followers || 0, posts: r.posts || 0,
  sources: r.sources || {}, daily: r.daily || [], hours: r.hours || Array(24).fill(0), top: (r.top || []).map(t => ({ id: t.id, body: t.body || '', image: t.image || '', createdAt: t.created_at, people: t.people || 0, views: t.views || 0 })) });
const SELF_NT = ['milestone', 'follower_milestone', 'weekly'];
// নোটিফিকেশন কোন পেইজের: পেইজের পোস্টে লাইক/মন্তব্য ইত্যাদি, বা পেইজের ব্যাজ (অ্যাডমিন বানানোর খবরটা ব্যক্তিগত)
const notifPage = n => n.p?.page_id || ((n.type === 'verify_ok' || n.type === 'verify_no') && n.meta?.page_id) || null;
const inScope = (n, pageId) => (pageId ? Number(notifPage(n)) === Number(pageId) : !notifPage(n));
const toGrowth = r => ({ visits: r.visits || 0, visitors: r.visitors || 0, visitsDaily: r.visits_daily || [], followers: r.followers || 0, gained: r.gained || 0, lost: r.lost || 0, followDaily: r.follow_daily || [] });
const toEnt = r => ({ ...toInsights(r), growth: toGrowth(r), pending: r.pending || 0, activeMembers: r.active_members || 0 });
const lastDays = n => Array.from({ length: n }, (_, i) => { const d = new Date(Date.now() + 6 * 3600e3 - (n - 1 - i) * 864e5); return d.toISOString().slice(0, 10); });
const toReq = r => r && ({ id: r.id, userId: r.user_id, pageId: r.page_id || null, kind: r.kind, name: r.full_name, category: r.category || '', links: r.links || '', note: r.note || '', status: r.status, adminNote: r.admin_note || '', coinsHeld: r.coins_held || 0, createdAt: r.created_at, decidedAt: r.decided_at || null });
const settingDefaults = () => Object.fromEntries(Object.entries(SETTING_KEYS).map(([k, [, d]]) => [k, d]));

export const PAGE = 20;
const DHAKA_MD = iso => new Date(new Date(iso).getTime() + 6 * 36e5).toISOString().slice(5, 10);

// ================================================================ Supabase
async function supabaseApi() {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  const ok = ({ data, error, count }) => { if (error) throw error; return count ?? data; };
  // !…_fkey: একাধিক সম্পর্ক থাকলে কোনটা ধরতে হবে Supabase-কে বলে দেওয়া (না দিলে 400 এরর)
  let recoveryPending = false, recoveryCb = null, delCancelled = false, delCb = null; const delChecked = new Set();
  const PROFILE = 'id,name,union_id,district,upazila,blood_group,donor_visible,last_donated,avatar_url,cover_url,bio,role,friends_visibility,followers_visibility,following_visibility,created_at,gender,username,verified,verified_until,locked,pinned_post_id,donor_ready,friend_req_from,delete_requested_at,unions!profiles_union_id_fkey(name)';
  const toUser = p => p && ({
    gone: !!p.delete_requested_at, id: p.id, name: p.name, unionId: p.union_id, district: p.district || '', upazila: p.upazila || '',
    union: (p.unions?.name ? [p.unions.name, p.upazila] : [p.upazila, p.district]).filter(Boolean).join(', '),
    bloodGroup: p.blood_group || '', donorVisible: p.donor_visible !== false, lastDonated: p.last_donated || '',
    avatar: p.avatar_url || '', cover: p.cover_url || '', bio: p.bio || '', admin: p.role === 'admin',
    friendsVisibility: p.friends_visibility || 'public', followersVisibility: p.followers_visibility || 'public', followingVisibility: p.following_visibility || 'public', joinedAt: p.created_at || '',
    gender: p.gender || '', username: p.username || '', verified: badgeOf(p), verifiedUntil: p.verified_until || null, locked: !!p.locked, pinnedPostId: p.pinned_post_id || null, donorReady: !!p.donor_ready, friendReqFrom: p.friend_req_from || 'everyone',
    social: {}, works: [], educations: [],
  });
  const toPost = (r, mine, saved) => ({
    id: r.id, body: r.body, image: r.image_url || '', images: r.image_urls?.length ? r.image_urls : (r.image_url ? [r.image_url] : []),
    privacy: r.privacy || 'public', tags: (r.post_tags || []).map(t => t.profiles).filter(Boolean).map(t => ({ id: t.id, name: t.name })),
    mentions: (r.post_mentions || []).map(t => t.profiles).filter(Boolean).map(t => ({ id: t.id, name: t.name })),
    category: r.category, createdAt: r.created_at, editedAt: r.edited_at || null, rawImages: r.image_urls?.length ? r.image_urls : (r.image_url ? [r.image_url] : []),
    likes: r.like_count, reactions: r.reactions || {}, myReaction: mine.get(r.id) || '', comments: r.comment_count, userId: r.user_id,
    author: r.pages?.name || r.profiles?.name || 'সদস্য', avatar: (r.page_id ? r.pages?.avatar_url : r.profiles?.avatar_url) || '', badge: r.page_id ? badgeOf(r.pages) : badgeOf(r.profiles),
    union: r.unions?.name || r.profiles?.upazila || '', liked: mine.has(r.id), saved: saved.has(r.id),
    pageId: r.page_id || null, groupId: r.group_id || null, groupName: r.groups?.name || '', poster: r.profiles?.name || '',
    shares: r.share_count || 0, saves: r.save_count || 0, pinnedCommentId: r.pinned_comment_id || null,
    sharedPostId: r.shared_post_id || null, sharedMissing: !!r.shared_post_id && !r.sp,
    kind: r.kind || 'normal', albumId: r.album_id || null, albumName: r.al?.name || '',
    bg: r.bg || '', poll: r.poll || null, eventAt: r.event_at || null, eventPlace: r.event_place || '', link: r.link || null, resolvedAt: r.resolved_at || null, bloodGroup: r.blood_group || '', lifeEvent: r.life_event || '', lifeDate: r.life_date || '',
    votes: [], myVote: null, going: 0, meGoing: false,
    shared: r.sp ? { id: r.sp.id, body: r.sp.body, image: r.sp.image_urls?.[0] || r.sp.image_url || '', createdAt: r.sp.created_at, userId: r.sp.user_id, pageId: r.sp.page_id || null,
      author: r.sp.pages?.name || r.sp.profiles?.name || 'সদস্য', avatar: (r.sp.page_id ? r.sp.pages?.avatar_url : r.sp.profiles?.avatar_url) || '', badge: r.sp.page_id ? badgeOf(r.sp.pages) : badgeOf(r.sp.profiles) } : null,
  });
  const POST_COLS = 'id,body,image_url,image_urls,privacy,post_tags(profiles(id,name)),post_mentions(profiles(id,name)),category,created_at,like_count,reactions,comment_count,share_count,save_count,pinned_comment_id,shared_post_id,edited_at,sp:shared_post_id(id,body,image_url,image_urls,created_at,user_id,page_id,profiles!posts_user_id_fkey(name,avatar_url,verified,verified_until),pages!posts_page_id_fkey(name,avatar_url,verified,verified_until)),kind,album_id,bg,poll,event_at,event_place,link,resolved_at,blood_group,life_event,life_date,al:albums!posts_album_id_fkey(id,name),user_id,union_id,page_id,group_id,profiles!posts_user_id_fkey(name,avatar_url,upazila,verified,verified_until),unions!posts_union_id_fkey(name),pages!posts_page_id_fkey(name,avatar_url,verified,verified_until),groups!posts_group_id_fkey(name)';
  const toPage = r => r && ({ id: r.id, ownerId: r.owner_id, name: r.name, category: r.category, about: r.about || '', phone: r.phone || '', avatar: r.avatar_url || '', followers: r.follower_count, verified: badgeOf(r), verifiedUntil: r.verified_until || null, cover: r.cover_url || '', autoReply: r.auto_reply || '', autoReplyOn: !!r.auto_reply_on, pinnedPostId: r.pinned_post_id || null, faqs: r.faqs || [], address: r.address || '', lat: r.lat ?? null, lng: r.lng ?? null });
  const toGroup = r => r && ({ id: r.id, ownerId: r.owner_id, name: r.name, about: r.about || '', privacy: r.privacy, avatar: r.avatar_url || '', members: r.member_count });
  const inList = ids => `(${ids.join(',')})`;

  let me = null, unionIds = [], blocked = new Set();

  async function loadMe(session) {
    if (!session) { me = null; blocked = new Set(); return null; }
    const p = ok(await sb.from('profiles').select(PROFILE).eq('id', session.user.id).maybeSingle());
    me = p ? { ...toUser(p), email: session.user.email } : null;
    // মুছে ফেলার অনুরোধের পর আবার লগইন করলে অনুরোধ বাতিল
    if (me && !delChecked.has(me.id)) { delChecked.add(me.id); sb.rpc('cancel_account_deletion').then(r => { if (r.data) { delCancelled = true; delCb?.(); } }, () => {}); }
    if (me) me.phone = ok(await sb.from('profile_private').select('phone').eq('user_id', me.id).maybeSingle())?.phone || '';
    if (me) {
      // কাজ, শিক্ষা, সোশ্যাল লিংক ও তাদের প্রাইভেসি (এই টেবিল শুধু নিজে পড়তে পারে)
      const d = ok(await sb.from('profile_details').select('*').eq('user_id', me.id).maybeSingle()) || {};
      Object.assign(me, { works: d.works || [], educations: d.educations || [], social: d.social || {}, birthYear: d.birth_year || 0, birthDate: d.birth_date || '', relationship: d.relationship || '', religion: d.religion || '', orgs: d.orgs || [], featured: d.featured || FEATURED0,
        aboutVis: { works: d.works_visibility || 'public', educations: d.educations_visibility || 'public', contact: d.contact_visibility || 'only_me', social: d.social_visibility || 'public', birth: d.birth_visibility || 'only_me', relationship: d.relationship_visibility || 'only_me', religion: d.religion_visibility || 'only_me', orgs: d.orgs_visibility || 'public' } });
    }
    if (me) blocked = new Set(ok(await sb.from('blocks').select('blocked_id').eq('blocker_id', me.id)).map(b => b.blocked_id));
    return me;
  }
  async function friendIds(of) {
    const rows = ok(await sb.from('friendships').select('requester,addressee').eq('status', 'accepted').or(`requester.eq.${of},addressee.eq.${of}`));
    return rows.map(r => (r.requester === of ? r.addressee : r.requester));
  }
  async function relations(ids) {
    const map = new Map(ids.map(id => [id, { friend: 'none', following: false, blocked: blocked.has(id) }]));
    if (!me || !ids.length) return map;
    const [fr, fo] = await Promise.all([
      sb.from('friendships').select('requester,addressee,status')
        .or(`and(requester.eq.${me.id},addressee.in.${inList(ids)}),and(addressee.eq.${me.id},requester.in.${inList(ids)})`),
      sb.from('follows').select('followee_id').eq('follower_id', me.id).in('followee_id', ids),
    ]);
    for (const f of ok(fr)) {
      const other = f.requester === me.id ? f.addressee : f.requester;
      map.get(other).friend = f.status === 'accepted' ? 'friends' : (f.requester === me.id ? 'sent' : 'received');
    }
    for (const f of ok(fo)) map.get(f.followee_id).following = true;
    return map;
  }
  // মেনশনের তালিকা নতুন করে বসানো: বাদ পড়াগুলো মুছে, নতুনগুলো যোগ (নতুনরাই শুধু নোটিফিকেশন পান)
  async function setMentions(kind, id, ids = [], replace = false) {
    const t = kind === 'post' ? 'post_mentions' : 'comment_mentions', col = kind === 'post' ? 'post_id' : 'comment_id';
    ids = [...new Set(ids || [])].filter(x => x && x !== me.id && !blocked.has(x)).slice(0, 20);
    if (replace) { let d = sb.from(t).delete().eq(col, id); if (ids.length) d = d.not('user_id', 'in', `(${ids.join(',')})`); ok(await d); }
    if (ids.length) ok(await sb.from(t).upsert(ids.map(uid => ({ [col]: id, user_id: uid })), { onConflict: `${col},user_id`, ignoreDuplicates: true }));
  }
  const fileCache = new Map();   // স্বাক্ষরিত লিংক (১ ঘণ্টা), শুধু মেমরিতে
  const convKey = t => (t.kind === 'group' ? 'g:' + t.id : t.pageId ? `p:${t.pageId}:${t.id}` : 'u:' + t.id);   // my_inbox-এর key-র সঙ্গে মিল
  const chatFolder = t => (t.kind === 'group' ? 'g_' + t.id : t.pageId ? `p_${t.pageId}_${t.asPage ? t.id : me.id}` : 'd_' + [me.id, t.id].sort().join('_'));
  async function upload(blob, kind) {
    const webp = blob.type === 'image/webp';
    const path = `${me.id}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${webp ? 'webp' : 'jpg'}`;
    ok(await sb.storage.from('media').upload(path, blob, { contentType: webp ? 'image/webp' : 'image/jpeg', cacheControl: '31536000' }));
    return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
  }

  return {
    mode: 'supabase',
    // ইমেইলের "পাসওয়ার্ড ভুলে গেছেন" লিংক থেকে ফিরলে নতুন পাসওয়ার্ড চাওয়া
    onDeletionCancelled(cb) { delCb = cb; if (delCancelled) setTimeout(cb, 0); },
    async requestAccountDeletion(password) {
      const r = await sb.auth.signInWithPassword({ email: me.email, password }); if (r.error) throw new Error('wrong password');
      const until = ok(await sb.rpc('request_account_deletion')); delChecked.delete(me.id); await sb.auth.signOut(); me = null; return until;
    },
    onPasswordRecovery(cb) { recoveryCb = cb; if (recoveryPending) setTimeout(cb, 0); },
    async init(onAuth) {
      const { data } = await sb.auth.getSession();
      await loadMe(data.session);
      sb.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED') return;
        if (event === 'PASSWORD_RECOVERY') { recoveryPending = true; setTimeout(() => recoveryCb?.(), 0); }
        setTimeout(async () => { try { await loadMe(session); } catch { me = null; } onAuth?.(me); }, 0);
      });
      return me;
    },
    me: () => me,
    async reloadMe() { return loadMe((await sb.auth.getSession()).data.session); },
    async upazila() { return ok(await sb.from('upazilas').select('id,name,district').eq('id', UPAZILA_ID).single()); },
    async unions() {
      const rows = ok(await sb.from('unions').select('id,name').eq('upazila_id', UPAZILA_ID).order('sort'));
      unionIds = rows.map(r => r.id); return rows;
    },

    // ---------- অ্যাকাউন্ট
    async signUp({ email, password, name, district, upazila, unionId, phone, bloodGroup, lastDonated, gender, birthDate }) {
      const data = ok(await sb.auth.signUp({ email, password, options: { data: { name, district, upazila, union_id: unionId ? String(unionId) : '', phone, blood_group: bloodGroup || '', last_donated: lastDonated || '', gender: gender || '', birth_date: birthDate || '' } } }));
      if (!data.session) return { needsConfirm: true };
      await loadMe(data.session); return { user: me };
    },
    async signIn({ email, password }) { return loadMe(ok(await sb.auth.signInWithPassword({ email, password })).session); },
    async signOut(all) { await sb.auth.signOut(all ? { scope: 'global' } : undefined); me = null; },
    // আমার কার্যকলাপ: রিয়্যাক্ট, মন্তব্য, শেয়ার (সবচেয়ে নতুন আগে)
    async myActivity() {
      const P = 'body,image_url,user_id,profiles!posts_user_id_fkey(name)';
      const [l, c, sh] = await Promise.all([
        sb.from('likes').select(`post_id,reaction,created_at,p:post_id(${P})`).eq('user_id', me.id).order('created_at', { ascending: false }).limit(60),
        sb.from('comments').select(`id,post_id,body,parent_id,created_at,p:post_id(${P})`).eq('user_id', me.id).order('created_at', { ascending: false }).limit(60),
        sb.from('posts').select(`id,shared_post_id,created_at,p:shared_post_id(${P})`).eq('user_id', me.id).not('shared_post_id', 'is', null).order('created_at', { ascending: false }).limit(60)]);
      const own = r => ({ postText: r.p?.body || (r.p?.image_url ? '📷' : ''), owner: r.p?.user_id === me.id ? '' : r.p?.profiles?.name || '', gone: !r.p });
      return [
        ...ok(l).map(r => ({ kind: 'react', postId: r.post_id, at: r.created_at, reaction: r.reaction, ...own(r) })),
        ...ok(c).map(r => ({ kind: r.parent_id ? 'reply' : 'comment', postId: r.post_id, at: r.created_at, text: r.body, ...own(r) })),
        ...ok(sh).map(r => ({ kind: 'share', postId: r.shared_post_id, myPostId: r.id, at: r.created_at, ...own(r) })),
      ].sort((a, b) => b.at.localeCompare(a.at));
    },
    async updateProfile({ name, district, upazila, unionId, bio, phone, bloodGroup, donorVisible, lastDonated, social, works, educations, aboutVis, gender, username, birthDate, relationship, religion, orgs, featured }) {
      const row = { name, district, upazila, union_id: unionId || null, bio: bio || null, blood_group: bloodGroup || null, donor_visible: donorVisible !== false, last_donated: (bloodGroup && lastDonated) || null };
      if (gender !== undefined) row.gender = gender || null;
      if (username !== undefined) row.username = username || null;
      ok(await sb.from('profiles').update(row).eq('id', me.id));
      // কাজ/শিক্ষা/সোশ্যাল লিংক ও প্রাইভেসি আলাদা সুরক্ষিত টেবিলে; যা দেওয়া হয়নি তা যেমন আছে থাকে
      const d = { user_id: me.id };
      if (social) d.social = social; if (works) d.works = works; if (educations) d.educations = educations;
      if (birthDate !== undefined) { d.birth_date = birthDate || null; if (!birthDate) d.birth_year = null; }
      if (relationship !== undefined) d.relationship = relationship || null;
      if (religion !== undefined) d.religion = religion || null;
      if (orgs) d.orgs = orgs;
      if (featured) d.featured = featured;
      if (aboutVis) for (const [k, col] of [['works', 'works_visibility'], ['educations', 'educations_visibility'], ['contact', 'contact_visibility'], ['social', 'social_visibility'], ['birth', 'birth_visibility'], ['relationship', 'relationship_visibility'], ['religion', 'religion_visibility'], ['orgs', 'orgs_visibility']]) if (aboutVis[k]) d[col] = aboutVis[k];
      if (Object.keys(d).length > 1) ok(await sb.from('profile_details').upsert(d, { onConflict: 'user_id' }));
      ok(await sb.from('profile_private').upsert({ user_id: me.id, phone: phone || null }));
      return loadMe((await sb.auth.getSession()).data.session);
    },
    async setLastDonated(date) { ok(await sb.from('profiles').update({ last_donated: date || null }).eq('id', me.id)); me.lastDonated = date || ''; },
    async donors({ group, upazila } = {}) {
      return ok(await sb.rpc('blood_donors', { p_group: group || null, p_upazila: upazila || null }))
        .map(d => ({
          id: d.id || 'm' + d.manual_id, manual: !!d.manual_id, manualId: d.manual_id, addedBy: d.added_by, addedByName: d.added_by_name || '',
          name: d.name, avatar: d.avatar_url || '', bloodGroup: d.blood_group,
          area: (d.union_name ? [d.union_name, d.upazila] : [d.upazila, d.district]).filter(Boolean).join(', '), phone: d.phone || '', lastDonated: d.last_donated || '', ready: !!d.donor_ready,
        }));
    },
    // অ্যাপ সেটিংস ও অ্যাডমিন ড্যাশবোর্ড
    async settings() {
      const rows = ok(await sb.from('app_settings').select('key,value'));
      const out = settingDefaults();
      for (const [name, [key]] of Object.entries(SETTING_KEYS)) { const r = rows.find(x => x.key === key); if (r && r.value !== null) out[name] = r.value; }
      return out;
    },
    async setSetting(name, value) {
      const key = SETTING_KEYS[name]?.[0]; if (!key) throw new Error('unknown setting');
      ok(await sb.from('app_settings').upsert({ key, value, updated_by: me.id, updated_at: new Date().toISOString() }));
    },
    // ---------- পোস্ট কতজন দেখেছেন
    async postSeen(items) { if (me && items.length) await sb.rpc('post_seen2', { p_ids: items.map(x => x.id), p_src: items.map(x => x.src) }); },
    async postClick(id, kind) { if (me) await sb.rpc('post_click', { p_post: id, p_kind: kind }); },
    async postStats(id) {
      const [st, avg] = await Promise.all([sb.rpc('post_stats', { p_id: id }), sb.rpc('post_avg_people', { p_id: id })]);
      return { ...toStats(ok(st) || {}), avgPeople: avg.data == null ? null : Number(avg.data) };
    },
    async profileVisit(uid) { if (me && uid !== me.id) await sb.rpc('profile_visit', { p_user: uid }); },
    async myGrowth(days) { return toGrowth(ok(await sb.rpc('my_growth', { p_days: days })) || {}); },
    async entVisit(kind, id) { if (me) await sb.rpc('ent_visit', { p_kind: kind, p_id: id }); },
    async entInsights(kind, id, days) { return toEnt(ok(await sb.rpc('ent_insights', { p_kind: kind, p_id: id, p_days: days })) || {}); },
    async weeklyReport() { if (me) await sb.rpc('ensure_weekly_report'); },
    async myInsights(days) { return toInsights(ok(await sb.rpc('my_insights', { p_days: days })) || {}); },
    // ---------- পোস্ট বুস্ট
    async boostedPosts(n = 3) {
      const rows = ok(await sb.rpc('active_boosts', { p_limit: n })) || [];
      if (!rows.length) return [];
      const posts = await this.posts({ ids: rows.map(r => r.post_id) });
      return rows.map(r => { const p = posts.find(x => x.id === r.post_id); return p && { ...p, sponsored: true, boostId: r.boost_id }; }).filter(Boolean);
    },
    async boostSeen(ids) { if (me && ids.length) await sb.rpc('boost_seen', { p_ids: ids }); },
    async requestBoost(postId, days, unionId) { return ok(await sb.rpc('request_boost', { p_post: postId, p_days: days, p_union: unionId || null })); },
    async cancelBoost(id) { ok(await sb.rpc('cancel_boost', { p_id: id })); },
    async myBoosts() { return ok(await sb.from('boosts').select('id,post_id,user_id,days,coins,union_id,status,admin_note,starts_at,ends_at,reach,created_at,po:posts!boosts_post_id_fkey(body,image_url,image_urls),un:unions!boosts_union_id_fkey(name)').eq('user_id', me.id).order('created_at', { ascending: false }).limit(30)).map(toBoost); },
    async postBoost(postId) { const r = ok(await sb.from('boosts').select('id,post_id,user_id,days,coins,union_id,status,admin_note,starts_at,ends_at,reach,created_at,po:posts!boosts_post_id_fkey(body,image_url,image_urls),un:unions!boosts_union_id_fkey(name)').eq('post_id', postId).order('created_at', { ascending: false }).limit(1)); return toBoost(r[0]) || null; },
    async adminBoosts() {
      const rows = ok(await sb.from('boosts').select('id,post_id,user_id,days,coins,union_id,status,admin_note,starts_at,ends_at,reach,created_at,po:posts!boosts_post_id_fkey(body,image_url,image_urls),un:unions!boosts_union_id_fkey(name),p:profiles!boosts_user_id_fkey(' + PROFILE + ')').eq('status', 'pending').order('created_at'));
      return rows.map(r => ({ ...toBoost(r), user: toUser(r.p) }));
    },
    async decideBoost(id, approve, note) { ok(await sb.rpc('decide_boost', { p_id: id, p_approve: approve, p_note: note || null })); },
    // ---------- কয়েন ও ভেরিফাইড ব্যাজ
    async wallet() {
      const [w, led, today] = await Promise.all([
        sb.from('wallets').select('coins').eq('user_id', me.id).maybeSingle(),
        sb.from('coin_ledger').select('amount,reason,ref,created_at').eq('user_id', me.id).order('created_at', { ascending: false }).limit(60),
        sb.from('coin_ledger').select('amount').eq('user_id', me.id).in('reason', EARN_REASONS).gte('created_at', dhakaMidnight().toISOString()),
      ]);
      return { coins: ok(w)?.coins || 0, today: ok(today).reduce((t, r) => t + r.amount, 0), ledger: ok(led).map(r => ({ amount: r.amount, reason: r.reason, ref: r.ref, createdAt: r.created_at })) };
    },
    async myVerifyRequest(pageId) {
      let q = sb.from('verify_requests').select('*').eq('user_id', me.id);
      q = pageId ? q.eq('page_id', pageId) : q.is('page_id', null);
      const rows = ok(await q.order('created_at', { ascending: false }).limit(1));
      return toReq(rows[0]) || null;
    },
    async requestVerification(v) { return ok(await sb.rpc('request_verification', { p_kind: v.kind, p_name: v.name, p_category: v.category || '', p_links: v.links || '', p_note: v.note || '', p_page: v.pageId || null })); },
    async cancelVerification(id) { ok(await sb.rpc('cancel_verification', { p_id: id })); },
    async adminVerifyRequests() {
      const rows = ok(await sb.from('verify_requests').select('*, p:profiles!verify_requests_user_id_fkey(' + PROFILE + '), pg:pages!verify_requests_page_id_fkey(*)').eq('status', 'pending').order('created_at'));
      return rows.map(r => ({ ...toReq(r), user: toUser(r.p), page: toPage(r.pg) }));
    },
    async decideVerification(id, approve, note) { ok(await sb.rpc('decide_verification', { p_id: id, p_approve: approve, p_note: note || null })); },
    async adminSetPageBadge(pid, verified, days) { ok(await sb.rpc('admin_set_page_badge', { p_page: pid, p_verified: verified || null, p_days: days || null })); },
    async adminSetBadge(uid, verified, days) { ok(await sb.rpc('admin_set_badge', { p_user: uid, p_verified: verified || null, p_days: days || null })); },
    async adminAdjustCoins(uid, amount, note) { ok(await sb.rpc('admin_adjust_coins', { p_user: uid, p_amount: amount, p_note: note || null })); },
    async adminUserWallet(uid) { return { coins: ok(await sb.from('wallets').select('coins').eq('user_id', uid).maybeSingle())?.coins || 0 }; },
    async adminStats() {
      const r = ok(await sb.rpc('admin_stats'));
      return { users: r.users, donors: r.donors, manualDonors: r.manual_donors, posts: r.posts, pendingServices: r.pending_services, openReports: r.open_reports };
    },
    // হাতে যোগ করা ডোনার (শুধু যোগকারী এডিট/মুছতে পারেন)
    async manualDonor(id) {
      const r = ok(await sb.from('manual_donors').select('*').eq('id', id).single());
      return { id: r.id, name: r.name, district: r.district || '', upazila: r.upazila || '', unionId: r.union_id, phone: r.phone, bloodGroup: r.blood_group, lastDonated: r.last_donated || '' };
    },
    async addManualDonor(v) {
      ok(await sb.from('manual_donors').insert({ created_by: me.id, name: v.name, district: v.district, upazila: v.upazila, union_id: v.unionId || null, phone: v.phone, blood_group: v.bloodGroup, last_donated: v.lastDonated || null }));
    },
    async updateManualDonor(id, v) {
      ok(await sb.from('manual_donors').update({ name: v.name, district: v.district, upazila: v.upazila, union_id: v.unionId || null, phone: v.phone, blood_group: v.bloodGroup, last_donated: v.lastDonated || null }).eq('id', id));
    },
    async deleteManualDonor(id) { ok(await sb.from('manual_donors').delete().eq('id', id)); },
    // share: নিউজফিডে জানানো হবে কিনা (না চাইলে শুধু নিজের অ্যালবামে থাকে)
    async setAvatar(blob, share = true) {
      const url = await upload(blob, 'avatar');
      ok(await sb.from('profiles').update({ avatar_url: url }).eq('id', me.id));
      me.avatar = url;
      await this.createPost({ body: '', category: null, imageUrls: [url], kind: 'avatar', privacy: share ? 'public' : 'only_me' });
      return url;
    },
    async setCover(blob, share = true) {
      const url = await upload(blob, 'cover');
      ok(await sb.from('profiles').update({ cover_url: url }).eq('id', me.id));
      me.cover = url;
      await this.createPost({ body: '', category: null, imageUrls: [url], kind: 'cover', privacy: share ? 'public' : 'only_me' });
      return url;
    },
    async removeCover() { ok(await sb.from('profiles').update({ cover_url: null }).eq('id', me.id)); me.cover = ''; },
    // আগের ছবিকে আবার প্রোফাইল/কভার করা: নতুন পোস্ট হয় না, আগের পোস্টের রিয়্যাক্ট-মন্তব্য যেমন ছিল তেমনই থাকে
    async useOldPhoto(kind, url) { ok(await sb.from('profiles').update(kind === 'cover' ? { cover_url: url } : { avatar_url: url }).eq('id', me.id)); if (kind === 'cover') me.cover = url; else me.avatar = url; },
    // ছবি: কারও সব ছবি, বা একটা অ্যালবামের (albumId), বা প্রোফাইল/কভার ছবির (kind)
    async photos(userId, { albumId, kind, pageId } = {}) {
      let q = sb.from('posts').select('id,image_url,image_urls,created_at');
      q = (pageId ? q.eq('page_id', pageId) : q.eq('user_id', userId).is('page_id', null)).is('group_id', null).order('created_at', { ascending: false }).limit(300);
      if (albumId) q = q.eq('album_id', albumId);
      if (kind === 'uploads') q = q.eq('kind', 'normal').is('album_id', null); else if (kind) q = q.eq('kind', kind);
      return flattenPhotos(ok(await q).map(r => ({ id: r.id, createdAt: r.created_at, images: r.image_urls?.length ? r.image_urls : (r.image_url ? [r.image_url] : []) })));
    },
    async albums(userId, pageId) {
      const aq = sb.from('albums').select('id,name,privacy,created_at'), pq = sb.from('posts').select('id,image_url,image_urls,album_id,kind,created_at');
      const [al, ps] = await Promise.all([
        (pageId ? aq.eq('page_id', pageId) : aq.eq('user_id', userId).is('page_id', null)).order('created_at', { ascending: false }),
        (pageId ? pq.eq('page_id', pageId) : pq.eq('user_id', userId).is('page_id', null)).is('group_id', null).order('created_at', { ascending: false }).limit(500),
      ]);
      const posts = ok(ps).map(r => ({ id: r.id, albumId: r.album_id, kind: r.kind, createdAt: r.created_at, images: r.image_urls?.length ? r.image_urls : (r.image_url ? [r.image_url] : []) }));
      const pack = (id, name, privacy, rows, own) => { const ph = flattenPhotos(rows); return { id, name, privacy, count: ph.length, cover: ph[0]?.url || '', virtual: !own }; };
      const out = Object.entries(VIRTUAL_ALBUMS).map(([k, name]) => pack(k, name, 'public', posts.filter(p => inVirtual(k, p)), false)).filter(a => a.count);
      return [...out, ...ok(al).map(a => pack(a.id, a.name, a.privacy, posts.filter(p => p.albumId === a.id), true))];
    },
    async createAlbum({ name, privacy, pageId }) { return ok(await sb.from('albums').insert({ user_id: me.id, page_id: pageId || null, name, privacy: pageId ? 'public' : (privacy || 'public') }).select('id').single()).id; },
    // পেইজের প্রোফাইল ও কভার ছবি (পেইজের নামে পোস্টও হয়, পেইজের অ্যালবামে জমা থাকে)
    async setPageAvatar(pageId, blob, share = true) {
      const url = await upload(blob, 'page'); ok(await sb.from('pages').update({ avatar_url: url }).eq('id', pageId));
      if (share) await this.createPost({ body: '', category: null, imageUrls: [url], kind: 'avatar', pageId }); return url;
    },
    async setPageCover(pageId, blob, share = true) {
      const url = await upload(blob, 'page'); ok(await sb.from('pages').update({ cover_url: url }).eq('id', pageId));
      if (share) await this.createPost({ body: '', category: null, imageUrls: [url], kind: 'cover', pageId }); return url;
    },
    async removePageCover(pageId) { ok(await sb.from('pages').update({ cover_url: null }).eq('id', pageId)); },
    async updateAlbum(id, { name, privacy }) { ok(await sb.from('albums').update({ name, privacy }).eq('id', id)); },
    async deleteAlbum(id) { ok(await sb.from('albums').delete().eq('id', id)); },
    async deleteAccount() {
      // আগে নিজের সব ছবি মুছে ফেলি, তারপর অ্যাকাউন্ট
      for (;;) {
        const files = ok(await sb.storage.from('media').list(me.id, { limit: 100 }));
        if (!files.length) break;
        ok(await sb.storage.from('media').remove(files.map(f => `${me.id}/${f.name}`)));
        if (files.length < 100) break;
      }
      ok(await sb.rpc('delete_my_account')); await sb.auth.signOut(); me = null;
    },

    // ---------- পোস্ট
    async posts({ scope = 'area', unionId, category, before, userId, postId, q: text, groupId, pageId, saved, ids, urgent, memories }) {
      let q = sb.from('posts').select(POST_COLS).order('created_at', { ascending: false }).limit(PAGE);
      if (urgent) {   // জরুরি সাহায্য: ২৪ ঘণ্টার মধ্যে, এখনো সমাধান হয়নি
        q = q.eq('category', 'সাহায্য চাই').is('resolved_at', null).is('group_id', null).gt('created_at', new Date(Date.now() - 864e5).toISOString()).limit(3);
        if (unionId) q = q.eq('union_id', unionId);
      } else if (postId) q = q.eq('id', postId);
      else if (ids) q = q.in('id', ids.length ? ids : [0]).limit(10);
      else if (memories) {   // এই দিনে: আগের বছরগুলোর আজকের তারিখের নিজের পোস্ট
        const y0 = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1) - 6 * 36e5).toISOString();
        const all = ok(await sb.from('posts').select('id,created_at').eq('user_id', me.id).is('page_id', null).is('group_id', null).lt('created_at', y0).order('created_at', { ascending: false }).limit(3000));
        const md = DHAKA_MD(new Date().toISOString()), mids = all.filter(r => DHAKA_MD(r.created_at) === md).map(r => r.id);
        if (!mids.length) return [];
        q = q.in('id', mids).limit(50);
      }
      else if (saved) {
        const ids = ok(await sb.from('saved_posts').select('post_id').eq('user_id', me.id).order('created_at', { ascending: false }).limit(100)).map(r => r.post_id);
        if (!ids.length) return [];
        q = q.in('id', ids).limit(100);
      }
      else if (text) q = q.ilike('body', `%${text.replace(/[,%()*\\]/g, ' ').trim()}%`);
      else if (groupId) q = q.eq('group_id', groupId);
      else if (pageId) q = q.eq('page_id', pageId);
      else if (userId) q = q.eq('user_id', userId).is('page_id', null).is('group_id', null);
      else if (scope === 'friends' && me) {
        const [fr, fo, pf] = await Promise.all([friendIds(me.id), sb.from('follows').select('followee_id').eq('follower_id', me.id), sb.from('page_follows').select('page_id').eq('user_id', me.id)]);
        const users = [...new Set([me.id, ...fr, ...ok(fo).map(f => f.followee_id)])], pages = ok(pf).map(f => f.page_id);
        q = q.is('group_id', null).or(`and(user_id.in.${inList(users)},page_id.is.null)${pages.length ? `,page_id.in.${inList(pages)}` : ''}`);
      } else {
        q = q.is('group_id', null);
        if (unionId) q = q.eq('union_id', unionId);
      }
      if (blocked.size && !userId) q = q.not('user_id', 'in', inList([...blocked]));
      if (category) q = q.eq('category', category);
      if (before) q = q.lt('created_at', before);
      let rows = ok(await q);
      // ৩০ দিনের বিরতি দেওয়া বন্ধুর পোস্ট ফিডে নয়; ক্লোজ ফ্রেন্ডের পোস্ট চিহ্নিত (ফিডে আগে দেখাতে)
      const feedScope = !urgent && !postId && !ids && !memories && !saved && !text && !groupId && !pageId && !userId;
      const marks = me && feedScope ? await this.friendMarks().catch(() => new Map()) : new Map();
      if (marks.size) rows = rows.filter(r => r.page_id || !(marks.get(r.user_id)?.snoozeUntil > new Date().toISOString()));
      let mine = new Map(), sv = new Set(), views = new Map(), ex = {};
      const exIds = rows.filter(r => r.poll || r.event_at).map(r => r.id);
      const exP = exIds.length ? sb.rpc('post_extras', { p_ids: exIds }).then(r => r.data || {}, () => ({})) : Promise.resolve({});
      if (me && rows.length) {
        const ids = rows.map(r => r.id);
        const ownIds = rows.filter(r => r.user_id === me.id).map(r => r.id);
        const [l, s2, vc] = await Promise.all([sb.from('likes').select('post_id,reaction').eq('user_id', me.id).in('post_id', ids), sb.from('saved_posts').select('post_id').eq('user_id', me.id).in('post_id', ids),
          ownIds.length ? sb.rpc('post_view_counts', { p_ids: ownIds }) : { data: [] }]);
        mine = new Map(ok(l).map(x => [x.post_id, x.reaction])); sv = new Set(ok(s2).map(x => x.post_id));
        views = new Map((vc.data || []).map(x => [x.post_id, Number(x.views)]));   // নিজের পোস্টের মোট ভিউ (না এলে ০)
      }
      ex = await exP;
      return rows.map(r => { const e = ex[r.id]; return { ...toPost(r, mine, sv), closeFriend: !r.page_id && !!marks.get(r.user_id)?.close, views: views.get(r.id) || 0, ...(e ? { votes: e.votes || [], myVote: e.my ?? null, going: Number(e.going) || 0, meGoing: !!e.me_going } : {}) }; });
    },
    async createPost({ body, category, image, images, pageId, groupId, sharedPostId, privacy, tags, mentions, albumId, kind = 'normal', imageUrls, bg, poll, eventAt, eventPlace, link, bloodGroup, lifeEvent, lifeDate }) {
      const files = images?.length ? images.slice(0, 10) : image ? [image] : [];
      const urls = [...(imageUrls || [])];
      for (const f of files) urls.push(await upload(f, 'post'));   // একটার পর একটা আপলোড
      const row = ok(await sb.from('posts').insert({
        user_id: me.id, union_id: me.unionId, body: body || '', category, image_url: urls[0] || null, image_urls: urls,
        privacy: pageId || groupId ? 'public' : (privacy || 'public'), page_id: pageId || null, group_id: groupId || null, shared_post_id: sharedPostId || null,
        album_id: albumId || null, kind, bg: bg || null, poll: poll?.length ? poll : null, event_at: eventAt || null, event_place: eventPlace || null, link: link || null, blood_group: bloodGroup || null, life_event: lifeEvent || null, life_date: lifeDate || null,
      }).select('id').single());
      if (tags?.length) ok(await sb.from('post_tags').insert(tags.map(uid => ({ post_id: row.id, user_id: uid }))));
      await setMentions('post', row.id, mentions);
      return row.id;
    },
    async setDonorReady(on) { ok(await sb.from('profiles').update({ donor_ready: !!on }).eq('id', me.id)); me.donorReady = !!on; },
    async mutualFriends(uid) { if (!me || uid === me.id) return { count: 0, list: [] }; const r = ok(await sb.rpc('mutual_friends', { uid })); return { count: Number(r?.count) || 0, list: (r?.list || []).map(x => ({ id: x.id, name: x.name, avatar: x.avatar || '' })) }; },
    async lifeEvents(uid) {
      return ok(await sb.from('posts').select('id,body,life_event,life_date,created_at').eq('user_id', uid).is('page_id', null).is('group_id', null).not('life_event', 'is', null).order('life_date', { ascending: false }).limit(50))
        .map(r => ({ id: r.id, body: r.body || '', type: r.life_event, date: r.life_date || r.created_at.slice(0, 10) }));
    },
    async trendingTags() { return ok(await sb.rpc('trending_tags')).map(r => ({ tag: r.tag, n: Number(r.n) })); },
    async birthdays() { if (!me) return []; return ok(await sb.rpc('friends_birthdays')).filter(r => !blocked.has(r.id)).map(r => ({ id: r.id, name: r.name, avatar: r.avatar_url || '' })); },
    async resolvePost(id, on) { ok(await sb.rpc('resolve_post', { p_post: id, p_on: !!on })); },
    async votePoll(id, opt) { ok(await sb.rpc('vote_poll', { p_post: id, p_opt: opt == null ? -1 : opt })); },
    async setGoing(id, on) { ok(await sb.rpc('set_going', { p_post: id, p_on: !!on })); },
    async linkPreview(url) {
      const { data, error } = await sb.functions.invoke('link-preview', { body: { url } });
      if (error || !data || data.error) return null;
      return data.title || data.image ? data : null;
    },
    // ---------- স্টোরি (২৪ ঘণ্টা)
    async stories() {
      const rows = ok(await sb.from('stories').select('id,user_id,kind,body,bg,privacy,created_at,expires_at,profiles!stories_user_id_fkey(name,avatar_url)').order('created_at').limit(300));
      return rows.filter(r => !blocked.has(r.user_id)).map(r => ({ id: r.id, userId: r.user_id, kind: r.kind, body: r.body || '', bg: r.bg || 'g1', privacy: r.privacy, createdAt: r.created_at, expiresAt: r.expires_at, name: r.profiles?.name || 'সদস্য', avatar: r.profiles?.avatar_url || '' }));
    },
    async storyImage(id) { const r = ok(await sb.from('stories').select('image').eq('id', id).maybeSingle()); return r?.image || ''; },
    async createStory({ kind, body, bg, blob, privacy }) {
      const image = blob ? await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); }) : null;
      ok(await sb.from('stories').insert({ user_id: me.id, kind, body: body || null, bg: kind === 'text' ? bg : null, image, privacy: privacy || 'public' }));
    },
    async deleteStory(id) { ok(await sb.from('stories').delete().eq('id', id)); },
    async storySeen(ids) { if (me && ids.length) await sb.rpc('story_seen', { p_ids: ids }); },
    async storyViewers(id) { return ok(await sb.rpc('story_viewers', { p_story: id })).map(r => ({ id: r.user_id, name: r.name, avatar: r.avatar_url || '', seenAt: r.seen_at })); },
    async myStoryViews() { return new Map(ok(await sb.rpc('my_story_view_counts')).map(r => [r.story_id, Number(r.views)])); },
    async untagMe(postId) { ok(await sb.from('post_tags').delete().eq('post_id', postId).eq('user_id', me.id)); },
    // images: আগের ছবির URL (string) বা নতুন ছবি (Blob), যে ক্রমে দেখাবে সেই ক্রমে
    async updatePost(id, { body, category, images = [], privacy, tags = [], mentions = [] }, removed = []) {
      const urls = [];
      for (const x of images.slice(0, 10)) urls.push(typeof x === 'string' ? x : await upload(x, 'post'));
      ok(await sb.rpc('edit_post', { p_id: id, p_body: body || '', p_category: category, p_images: urls, p_privacy: privacy || 'public', p_tags: tags }));
      await setMentions('post', id, mentions, true);
      // বাদ দেওয়া নিজের ছবি স্টোরেজ থেকেও মুছে ফেলা (ব্যর্থ হলে সমস্যা নেই)
      const paths = removed.map(u => decodeURIComponent(u.split('/object/public/media/')[1] || '')).filter(x => x.startsWith(me.id + '/'));
      if (paths.length) await sb.storage.from('media').remove(paths).catch(() => {});
    },
    async savePost(id) { ok(await sb.from('saved_posts').insert({ user_id: me.id, post_id: id })); },
    async unsavePost(id) { ok(await sb.from('saved_posts').delete().eq('user_id', me.id).eq('post_id', id)); },
    async changePassword(password, oldPassword) {
      if (oldPassword != null) { const r = await sb.auth.signInWithPassword({ email: me.email, password: oldPassword }); if (r.error) throw new Error('wrong password'); }
      ok(await sb.auth.updateUser({ password })); recoveryPending = false;
    },
    async sendPasswordReset(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: (PUBLIC_URL || location.href.split('#')[0]).replace(/#.*$/, '') })); },
    async changeName(name) { ok(await sb.from('profiles').update({ name: name.trim() }).eq('id', me.id)); me.name = name.trim(); },
    async changeUsername(u) { ok(await sb.from('profiles').update({ username: u || null }).eq('id', me.id)); me.username = u || ''; },
    async changePhone(phone) { ok(await sb.from('profile_private').upsert({ user_id: me.id, phone: phone || null })); me.phone = phone || ''; },
    async changeEmail(email, password) {
      const r = await sb.auth.signInWithPassword({ email: me.email, password }); if (r.error) throw new Error('wrong password');
      ok(await sb.auth.updateUser({ email: email.trim() }, { emailRedirectTo: (PUBLIC_URL || location.href.split('#')[0]).replace(/#.*$/, '') }));
    },

    // ---------- পেইজ
    async myPages() {
      const [own, adm] = await Promise.all([sb.from('pages').select('*').eq('owner_id', me.id).order('created_at'), sb.from('page_admins').select('p:pages(*)').eq('user_id', me.id)]);
      return [...ok(own).map(toPage), ...ok(adm).map(r => toPage(r.p)).filter(Boolean).map(x => ({ ...x, isAdmin: true }))];
    },
    async pageAdmins(pageId) { return ok(await sb.from('page_admins').select('created_at, p:profiles!page_admins_user_id_fkey(' + PROFILE + ')').eq('page_id', pageId).order('created_at')).map(r => toUser(r.p)).filter(Boolean); },
    async addPageAdmin(pageId, uid) { ok(await sb.rpc('add_page_admin', { p_page: pageId, p_user: uid })); },
    async removePageAdmin(pageId, uid) { ok(await sb.rpc('remove_page_admin', { p_page: pageId, p_user: uid })); },
    async pinPagePost(pageId, postId) { ok(await sb.rpc('pin_page_post', { p_page: pageId, p_post: postId || null })); },
    async pinProfilePost(postId) { ok(await sb.rpc('pin_profile_post', { p_post: postId || null })); me.pinnedPostId = postId || null; },
    async setFaqs(pageId, faqs) { ok(await sb.from('pages').update({ faqs }).eq('id', pageId)); },
    async askFaq(pageId, idx) { ok(await sb.rpc('ask_page_faq', { p_page: pageId, p_idx: idx })); },
    async followedPages() { return ok(await sb.from('page_follows').select('p:pages(*)').eq('user_id', me.id).order('created_at', { ascending: false })).map(r => toPage(r.p)).filter(Boolean); },
    async discoverPages({ q } = {}) {
      let s = sb.from('pages').select('*').order('follower_count', { ascending: false }).limit(40);
      const term = (q || '').replace(/[,%()*\\]/g, ' ').trim(); if (term) s = s.ilike('name', `%${term}%`);
      return ok(await s).map(toPage);
    },
    async page(id) {
      const p = toPage(ok(await sb.from('pages').select('*').eq('id', id).single()));
      const [f, a] = me ? await Promise.all([sb.from('page_follows').select('page_id').eq('page_id', id).eq('user_id', me.id), sb.from('page_admins').select('page_id').eq('page_id', id).eq('user_id', me.id)]) : [{ data: [] }, { data: [] }];
      const isOwner = !!me && p.ownerId === me.id, isAdmin = !isOwner && (a.data || []).length > 0;
      return { ...p, following: (f.data || []).length > 0, isOwner, isAdmin, canManage: isOwner || isAdmin };
    },
    async createPage({ name, category, about, phone, avatar }) {
      const avatar_url = avatar ? await upload(avatar, 'page') : null;
      return toPage(ok(await sb.from('pages').insert({ owner_id: me.id, name, category, about: about || null, phone: phone || null, avatar_url }).select().single()));
    },
    async updatePage(id, { name, category, about, phone, avatar, address, lat, lng }) {
      const v = { name, category, about: about || null, phone: phone || null, address: address || null, lat: lat ?? null, lng: lng ?? null };
      if (avatar) v.avatar_url = await upload(avatar, 'page');
      ok(await sb.from('pages').update(v).eq('id', id));
    },
    async deletePage(id) { ok(await sb.from('pages').delete().eq('id', id)); },
    async followPage(id) { ok(await sb.from('page_follows').upsert({ page_id: id, user_id: me.id }, { ignoreDuplicates: true })); },
    async unfollowPage(id) { ok(await sb.from('page_follows').delete().eq('page_id', id).eq('user_id', me.id)); },

    // ---------- গ্রুপ
    async myGroups() {
      return ok(await sb.from('group_members').select('role,status,g:groups(*)').eq('user_id', me.id).order('created_at', { ascending: false }))
        .filter(r => r.g).map(r => ({ ...toGroup(r.g), role: r.role, status: r.status }));
    },
    async discoverGroups({ q } = {}) {
      let s = sb.from('groups').select('*').order('member_count', { ascending: false }).limit(40);
      const term = (q || '').replace(/[,%()*\\]/g, ' ').trim(); if (term) s = s.ilike('name', `%${term}%`);
      return ok(await s).map(toGroup);
    },
    async group(id) {
      const g = toGroup(ok(await sb.from('groups').select('*').eq('id', id).single()));
      const m = me ? ok(await sb.from('group_members').select('role,status').eq('group_id', id).eq('user_id', me.id).maybeSingle()) : null;
      return { ...g, role: m?.role || null, status: m?.status || null, isOwner: !!me && g.ownerId === me.id };
    },
    async createGroup({ name, about, privacy, avatar }) {
      const avatar_url = avatar ? await upload(avatar, 'group') : null;
      return toGroup(ok(await sb.from('groups').insert({ owner_id: me.id, name, about: about || null, privacy, avatar_url }).select().single()));
    },
    async updateGroup(id, { name, about, privacy, avatar }) {
      const v = { name, about: about || null, privacy };
      if (avatar) v.avatar_url = await upload(avatar, 'group');
      ok(await sb.from('groups').update(v).eq('id', id));
    },
    async deleteGroup(id) { ok(await sb.from('groups').delete().eq('id', id)); },
    async joinGroup(id) { return ok(await sb.rpc('join_group', { gid: id })); },
    async leaveGroup(id) { ok(await sb.from('group_members').delete().eq('group_id', id).eq('user_id', me.id)); },
    async groupMembers(id, status = 'active') {
      return ok(await sb.from('group_members').select('role,status,p:profiles(' + PROFILE + ')').eq('group_id', id).eq('status', status).order('created_at'))
        .filter(r => r.p).map(r => ({ ...toUser(r.p), role: r.role }));
    },
    async approveMember(gid, uid) { ok(await sb.rpc('approve_member', { gid, uid })); },
    async removeMember(gid, uid) { ok(await sb.from('group_members').delete().eq('group_id', gid).eq('user_id', uid)); },
    async deletePost(id) { ok(await sb.from('posts').delete().eq('id', id)); },
    // রিয়্যাক্ট দেওয়া/বদলানো/তুলে নেওয়া (reaction খালি = তুলে নেওয়া)
    async react(id, reaction, prev) {
      if (!reaction) ok(await sb.from('likes').delete().eq('post_id', id).eq('user_id', me.id));
      else if (prev) ok(await sb.from('likes').update({ reaction }).eq('post_id', id).eq('user_id', me.id));
      else ok(await sb.from('likes').insert({ post_id: id, user_id: me.id, reaction }));
    },
    // sort: 'top' (বেশি রিয়্যাক্ট), 'new' (নতুন), 'old' (পুরাতন)
    async comments(postId, sort = 'old') {
      let q = sb.from('comments').select('id,body,created_at,edited_at,parent_id,user_id,like_count,reactions,page_id,pg:pages!comments_page_id_fkey(name,avatar_url,verified,verified_until),profiles!comments_user_id_fkey(name,avatar_url,verified,verified_until),comment_mentions(profiles(id,name))').eq('post_id', postId).limit(300);
      q = sort === 'top' ? q.order('like_count', { ascending: false }).order('created_at') : q.order('created_at', { ascending: sort === 'old' });
      const rows = ok(await q).filter(r => !blocked.has(r.user_id));
      let mine = new Map();
      if (me && rows.length) mine = new Map(ok(await sb.from('comment_likes').select('comment_id,reaction').eq('user_id', me.id).in('comment_id', rows.map(r => r.id))).map(x => [x.comment_id, x.reaction]));
      return rows.map(r => ({ id: r.id, body: r.body, createdAt: r.created_at, editedAt: r.edited_at || null, parentId: r.parent_id || null, userId: r.user_id,
        mentions: (r.comment_mentions || []).map(t => t.profiles).filter(Boolean).map(t => ({ id: t.id, name: t.name })), author: r.pg?.name || r.profiles?.name || 'সদস্য', avatar: (r.page_id ? r.pg?.avatar_url : r.profiles?.avatar_url) || '', badge: r.page_id ? badgeOf(r.pg) : badgeOf(r.profiles), pageId: r.page_id || null,
        likes: r.like_count, reactions: r.reactions || {}, myReaction: mine.get(r.id) || '' }));
    },
    async reactComment(id, reaction, prev) {
      if (!reaction) ok(await sb.from('comment_likes').delete().eq('comment_id', id).eq('user_id', me.id));
      else if (prev) ok(await sb.from('comment_likes').update({ reaction }).eq('comment_id', id).eq('user_id', me.id));
      else ok(await sb.from('comment_likes').insert({ comment_id: id, user_id: me.id, reaction }));
    },
    async pinComment(postId, commentId) { ok(await sb.rpc('pin_comment', { p_post: postId, p_comment: commentId || null })); },
    // কে কে রিয়্যাক্ট দিয়েছেন
    async reactors(kind, id) {
      const t = kind === 'comment' ? 'comment_likes' : 'likes', col = kind === 'comment' ? 'comment_id' : 'post_id';
      const rows = ok(await sb.from(t).select('reaction, p:profiles(' + PROFILE + ')').eq(col, id).limit(500));
      return { list: rows.filter(r => r.p && !blocked.has(r.p.id)).map(r => ({ ...toUser(r.p), reaction: r.reaction })), unnamed: 0 };
    },
    async addComment(postId, body, parentId = null, mentions = [], pageId = null) {
      const row = ok(await sb.from('comments').insert({ post_id: postId, user_id: me.id, body, parent_id: parentId, page_id: pageId || null }).select('id').single());
      await setMentions('comment', row.id, mentions);
    },
    async editComment(id, body, mentions = []) { ok(await sb.rpc('edit_comment', { p_id: id, p_body: body })); await setMentions('comment', id, mentions, true); },
    async deleteComment(id) { ok(await sb.from('comments').delete().eq('id', id)); },

    // ---------- মানুষ, বন্ধু, ফলো, ব্লক
    async profile(id) {
      const p = toUser(ok(await sb.from('profiles').select(PROFILE).eq('id', id).single()));
      // সংখ্যা সবাই দেখে (তালিকা গোপন থাকলেও)
      const [counts, rel, about] = await Promise.all([sb.rpc('profile_counts', { uid: id }), relations([id]), sb.rpc('profile_about', { uid: id })]);
      const c = ok(counts) || {}, a = ok(about) || {};
      // মালিকের প্রাইভেসি অনুযায়ী যা দেখার অনুমতি আছে শুধু তাই আসে
      if (a.gone) return { ...p, gone: true, lockedOut: true, bio: '', avatar: '', cover: '', bloodGroup: '', works: [], educations: [], social: {}, phone: '', orgs: [], featured: FEATURED0, friends: 0, followers: 0, following: 0, rel: rel.get(id) };
      if (a.locked) return { ...p, locked: true, lockedOut: true, bloodGroup: '', lastDonated: '', works: [], educations: [], social: {}, phone: '', orgs: [], featured: FEATURED0, friends: c.friends || 0, followers: c.followers || 0, following: c.following || 0, rel: rel.get(id) };
      return { ...p, works: a.works || [], educations: a.educations || [], social: a.social || {}, phone: a.phone || '', birthYear: a.birth_year || 0, birthDate: a.birth_date || '', relationship: a.relationship || '', religion: a.religion || '', orgs: a.orgs || [], featured: a.featured || FEATURED0,
        friends: c.friends || 0, followers: c.followers || 0, following: c.following || 0, rel: rel.get(id) };
    },
    // ইউজারনেম খালি আছে কিনা (নিজেরটা হলে খালি ধরা হয়)
    async usernameFree(u) {
      const rows = ok(await sb.from('profiles').select('id').ilike('username', u.replace(/[%_\\]/g, c => '\\' + c)).limit(1));
      return !rows.length || rows[0].id === me?.id;
    },
    // বন্ধু/ফলোয়ার/ফলো করছেন তালিকা; মালিক গোপন রাখলে { hidden: true, visibility }
    async listPeople(uid, kind) {
      const r = ok(await sb.rpc('list_people', { uid, kind }));
      if (!r.allowed) return { hidden: true, locked: r.visibility === 'locked', visibility: r.visibility || 'only_me', list: [] };
      const ids = r.ids || [], out = [];
      for (let i = 0; i < ids.length; i += 150) out.push(...ok(await sb.from('profiles').select(PROFILE).in('id', ids.slice(i, i + 150))).map(toUser));
      const pos = new Map(ids.map((x, i) => [x, i]));
      return { hidden: false, visibility: r.visibility, list: out.filter(u => !blocked.has(u.id)).sort((a, b) => pos.get(a.id) - pos.get(b.id)) };
    },
    // কোন তালিকা কারা দেখবে: { friends, followers, following } প্রতিটা 'public' | 'friends' | 'only_me'
    async setLock(on) { ok(await sb.from('profiles').update({ locked: !!on }).eq('id', me.id)); me.locked = !!on; },
    async setListPrivacy(v) {
      const cols = { friends: 'friends_visibility', followers: 'followers_visibility', following: 'following_visibility' }, row = {};
      for (const k in cols) if (v[k]) { row[cols[k]] = v[k]; me[k + 'Visibility'] = v[k]; }
      ok(await sb.from('profiles').update(row).eq('id', me.id));
    },
    async people({ q }) {
      let s = sb.from('profiles').select(PROFILE).limit(30);
      const term = (q || '').replace(/[,%()*\\]/g, ' ').trim();
      if (term) s = s.ilike('name', `%${term}%`);
      else if (me?.unionId) s = s.eq('union_id', me.unionId).order('created_at', { ascending: false });
      else if (me?.upazila) s = s.eq('upazila', me.upazila).order('created_at', { ascending: false });
      else s = s.order('created_at', { ascending: false });
      const rows = ok(await s).map(toUser).filter(u => u.id !== me?.id && !u.gone && !blocked.has(u.id));
      const rel = await relations(rows.map(u => u.id));
      return rows.map(u => ({ ...u, rel: rel.get(u.id) }));
    },
    async friendRequests() {
      const rows = ok(await sb.from('friendships').select('created_at, p:profiles!friendships_requester_fkey(' + PROFILE + ')').eq('addressee', me.id).eq('status', 'pending').order('created_at', { ascending: false }));
      return rows.map(r => toUser(r.p)).filter(u => u && !u.gone && !blocked.has(u.id));
    },
    async friends(of) {
      const id = of || me.id;
      const rows = ok(await sb.from('friendships').select(`requester,addressee, r:profiles!friendships_requester_fkey(${PROFILE}), a:profiles!friendships_addressee_fkey(${PROFILE})`).eq('status', 'accepted').or(`requester.eq.${id},addressee.eq.${id}`));
      return rows.map(r => toUser(r.requester === id ? r.a : r.r)).filter(u => u && !u.gone);
    },
    async sendFriendRequest(id) {
      const r = await sb.from('friendships').insert({ requester: me.id, addressee: id });
      if (r.error && /row-level security/i.test(r.error.message)) { const rule = ok(await sb.rpc('friend_req_rule', { uid: id })); throw new Error('friend_req:' + (rule || 'everyone')); }
      ok(r);
      ok(await sb.from('follows').upsert({ follower_id: me.id, followee_id: id }, { ignoreDuplicates: true }));
    },
    async acceptFriend(id) { ok(await sb.rpc('accept_friend', { from_user: id })); },
    // ---------- বন্ধু (২)
    async sentRequests() {
      const rows = ok(await sb.from('friendships').select('created_at, p:profiles!friendships_addressee_fkey(' + PROFILE + ')').eq('requester', me.id).eq('status', 'pending').order('created_at', { ascending: false }));
      return rows.map(r => r.p && { ...toUser(r.p), sentAt: r.created_at }).filter(u => u && !u.gone && !blocked.has(u.id));
    },
    async friendMeta(ids) {
      if (!me || !ids.length) return new Map();
      const out = new Map();
      for (let i = 0; i < ids.length; i += 200) ok(await sb.rpc('friend_meta', { p_ids: ids.slice(i, i + 200) })).forEach(r => out.set(r.id, { mutual: r.mutual, joinedAt: r.joined_at, since: r.friends_since, posts: r.posts }));
      return out;
    },
    async suggestions() {
      const sg = ok(await sb.rpc('friend_suggestions', { p_limit: 60 })).filter(r => !blocked.has(r.id));
      if (!sg.length) return [];
      const ps = new Map(ok(await sb.from('profiles').select(PROFILE).in('id', sg.map(r => r.id))).map(p => [p.id, toUser(p)]));
      return sg.filter(r => ps.has(r.id)).map(r => ({ ...ps.get(r.id), rel: { friend: 'none' }, mutual: r.mutual, sameArea: r.same_area, school: r.school || '', isNew: r.is_new }));
    },
    async areaPeople(area) {
      const [k, v] = [area.slice(0, 1), area.slice(2)];
      const sg = ok(await sb.rpc('area_people', { p_union: k === 'u' ? Number(v) : null, p_upazila: k === 'x' ? v : null, p_limit: 60 })).filter(r => !blocked.has(r.id));
      if (!sg.length) return [];
      const ps = new Map(ok(await sb.from('profiles').select(PROFILE).in('id', sg.map(r => r.id))).map(p => [p.id, toUser(p)]));
      return sg.filter(r => ps.has(r.id)).map(r => ({ ...ps.get(r.id), rel: { friend: 'none' }, mutual: r.mutual, sameArea: false, school: r.school || '', isNew: r.is_new }));
    },
    async hideSuggestion(id) { ok(await sb.from('friend_suggest_hidden').upsert({ user_id: me.id, other_id: id }, { ignoreDuplicates: true })); },
    async newNearMe() { return me ? Number(ok(await sb.rpc('new_near_me'))) || 0 : 0; },
    async birthdaysUpcoming(days = 31) { return ok(await sb.rpc('friends_birthdays_upcoming', { p_days: days })).filter(r => !blocked.has(r.id)).map(r => ({ id: r.id, name: r.name, avatar: r.avatar_url || '', nextDate: r.next_date, days: r.days })); },
    async anniversaries() { if (!me) return []; return ok(await sb.rpc('friend_anniversaries')).filter(r => !blocked.has(r.id)).map(r => ({ id: r.id, name: r.name, avatar: r.avatar_url || '', years: r.years })); },
    async acceptAllFriends() { return Number(ok(await sb.rpc('accept_all_friends'))) || 0; },
    async friendMarks(force) {
      if (!me) return new Map();
      if (!force && this._marks && Date.now() - this._marksAt < 60000) return this._marks;
      this._marks = new Map(ok(await sb.from('friend_marks').select('other_id,close,snooze_until').eq('user_id', me.id)).map(r => [r.other_id, { close: r.close, snoozeUntil: r.snooze_until }]));
      this._marksAt = Date.now(); return this._marks;
    },
    async setFriendMark(id, patch) {
      const cur = (await this.friendMarks(true)).get(id) || { close: false, snoozeUntil: null };
      const row = { user_id: me.id, other_id: id, close: patch.close ?? cur.close, snooze_until: patch.snoozeUntil !== undefined ? patch.snoozeUntil : cur.snoozeUntil };
      ok(await sb.from('friend_marks').upsert(row, { onConflict: 'user_id,other_id' })); this._marksAt = 0;
    },
    async friendLists() { return ok(await sb.from('friend_lists').select('id,name,friend_list_members(member_id)').eq('user_id', me.id).order('created_at')).map(l => ({ id: l.id, name: l.name, members: (l.friend_list_members || []).map(m => m.member_id) })); },
    async createFriendList(name) { return ok(await sb.from('friend_lists').insert({ user_id: me.id, name: name.trim() }).select('id').single()).id; },
    async renameFriendList(id, name) { ok(await sb.from('friend_lists').update({ name: name.trim() }).eq('id', id)); },
    async deleteFriendList(id) { ok(await sb.from('friend_lists').delete().eq('id', id)); },
    async setListMember(listId, uid, on) { if (on) ok(await sb.from('friend_list_members').upsert({ list_id: listId, member_id: uid }, { ignoreDuplicates: true })); else ok(await sb.from('friend_list_members').delete().eq('list_id', listId).eq('member_id', uid)); },
    async setFriendReqFrom(v) { ok(await sb.from('profiles').update({ friend_req_from: v }).eq('id', me.id)); me.friendReqFrom = v; },
    async removeFriend(id) { ok(await sb.from('friendships').delete().or(`and(requester.eq.${me.id},addressee.eq.${id}),and(requester.eq.${id},addressee.eq.${me.id})`)); },
    // ফিডে "ফলো করুন" দেখানোর জন্য: কাদের বন্ধু/ফলো করছি, কোন পেইজ ফলো করছি
    async followState() {
      if (!me) return null;
      const [fr, fo, pf] = await Promise.all([friendIds(me.id), sb.from('follows').select('followee_id').eq('follower_id', me.id), sb.from('page_follows').select('page_id').eq('user_id', me.id)]);
      return { users: new Set([me.id, ...fr, ...ok(fo).map(x => x.followee_id)]), pages: new Set(ok(pf).map(x => x.page_id)) };
    },
    async follow(id) { ok(await sb.from('follows').upsert({ follower_id: me.id, followee_id: id }, { ignoreDuplicates: true })); },
    async unfollow(id) { ok(await sb.from('follows').delete().eq('follower_id', me.id).eq('followee_id', id)); },
    async block(id) { ok(await sb.from('blocks').insert({ blocker_id: me.id, blocked_id: id })); blocked.add(id); },
    async unblock(id) { ok(await sb.from('blocks').delete().eq('blocker_id', me.id).eq('blocked_id', id)); blocked.delete(id); },
    async blockedList() {
      const rows = ok(await sb.from('blocks').select('p:profiles!blocks_blocked_id_fkey(' + PROFILE + ')').eq('blocker_id', me.id));
      return rows.map(r => toUser(r.p)).filter(Boolean);
    },

    // ---------- মেসেজ
    // ---------- মেসেজ
    // ইনবক্স: সাধারণ, পেইজ ও গ্রুপ কথোপকথন; মিউট ও মেসেজ রিকোয়েস্টসহ
    async inbox() {
      const rows = ok(await sb.rpc('my_inbox')), gp = rows.filter(c => c.kind === 'group' && c.avatar_url).map(c => c.avatar_url);
      const urls = gp.length ? await this.fileUrls(gp) : new Map();
      rows.forEach(c => { if (c.kind === 'group' && c.avatar_url) c.avatar_url = urls.get(c.avatar_url) || ''; });
      return rows.filter(c => !c.partner_id || !blocked.has(c.partner_id)).map(c => ({
        kind: c.kind, userId: c.partner_id || null, pageId: c.page_id || null, chatId: c.chat_id || null, asPage: !!c.as_page, pageName: c.page_name || '',
        name: c.name, avatar: c.avatar_url || '', last: c.last_body, lastAt: c.last_at, lastMine: c.last_mine, unread: Number(c.unread) || 0,
        muted: !!c.muted, request: !!c.request, members: c.members || 0 }));
    },
    async conversations() { return (await this.inbox()).filter(c => c.kind !== 'group'); },
    // ব্যাজের হিসাব: সাধারণ চ্যাটের না-পড়া, আর নতুন (না-পড়া) মেসেজ রিকোয়েস্ট কতজনের
    async msgBadges() { const l = await this.inbox(); return { unread: l.filter(c => !c.asPage && !c.muted && !c.request).reduce((a, c) => a + c.unread, 0), requests: l.filter(c => c.request && c.unread > 0).length }; },
    // t = { kind: 'dm'|'page'|'group', id, pageId, asPage }
    async thread(t) {
      const sel = 'id,sender_id,recipient_id,body,created_at,read_at,is_auto,image_path,voice_path,voice_secs,reply_to,deleted_at,chat_id,edited_at,forwarded,pinned_at,sticker,loc,poll,mentions,expires_at,rt:reply_to(id,body,sender_id,image_path,voice_path,deleted_at),sp:profiles!messages_sender_id_fkey(id,name,avatar_url)';
      let q = sb.from('messages').select(sel);
      const cust = t.asPage ? t.id : me.id;
      if (t.kind === 'group') q = q.eq('chat_id', t.id);
      else if (t.pageId) q = q.eq('page_id', t.pageId).or(`sender_id.eq.${cust},recipient_id.eq.${cust}`);
      else q = q.is('page_id', null).is('chat_id', null).or(`and(sender_id.eq.${me.id},recipient_id.eq.${t.id}),and(sender_id.eq.${t.id},recipient_id.eq.${me.id})`);
      const key = convKey(t);
      const [rowsR, setR] = await Promise.all([q.order('created_at', { ascending: false }).limit(200), sb.from('conv_settings').select('muted,accepted,cleared_at,marked_unread').eq('user_id', me.id).eq('key', key).maybeSingle()]);
      const set = setR.data || {};
      let rows = ok(rowsR).reverse();
      if (set.cleared_at) rows = rows.filter(m => m.created_at > set.cleared_at);
      const ids = rows.map(m => m.id);
      const pollIds = rows.filter(m => m.poll).map(m => m.id), shKey = t.kind === 'page' ? null : chatFolder(t);
      const shQ = () => (shKey ? sb.from('conv_shared').select('theme,nicknames,disappear').eq('key', shKey).maybeSingle() : Promise.resolve({ data: null }));
      const [rx, hid, sv, pv, sh] = ids.length ? await Promise.all([sb.from('message_reactions').select('message_id,user_id,emoji').in('message_id', ids), sb.from('message_hidden').select('message_id').eq('user_id', me.id).in('message_id', ids),
        sb.from('message_saved').select('message_id').eq('user_id', me.id).in('message_id', ids), pollIds.length ? sb.from('chat_poll_votes').select('message_id,user_id,opt').in('message_id', pollIds) : { data: [] }, shQ()])
        : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, await shQ()];
      const hidden = new Set((hid.data || []).map(h => h.message_id)), saved = new Set((sv.data || []).map(x => x.message_id)), rxBy = new Map(), votesBy = new Map();
      for (const v of pv.data || []) { if (!votesBy.has(v.message_id)) votesBy.set(v.message_id, []); votesBy.get(v.message_id).push(v); }
      for (const r of rx.data || []) { if (!rxBy.has(r.message_id)) rxBy.set(r.message_id, []); rxBy.get(r.message_id).push(r); }
      const mineOf = m => (t.pageId ? (t.asPage ? m.sender_id !== cust : m.sender_id === me.id) : m.sender_id === me.id);
      const msgs = rows.filter(m => !hidden.has(m.id)).map(m => {
        const rs = rxBy.get(m.id) || [], counts = {};
        rs.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
        return { id: m.id, mine: mineOf(m), senderId: m.sender_id, sender: m.sp ? { id: m.sp.id, name: m.sp.name, avatar: m.sp.avatar_url || '' } : null,
          body: m.body || '', createdAt: m.created_at, read: !!m.read_at, auto: !!m.is_auto, image: m.image_path || '', voice: m.voice_path || '', voiceSecs: m.voice_secs || 0,
          deleted: !!m.deleted_at, reactions: counts, myReaction: rs.find(r => r.user_id === me.id)?.emoji || '',
          reply: m.rt ? { id: m.rt.id, body: m.rt.body || '', mine: m.rt.sender_id === me.id, image: !!m.rt.image_path, voice: !!m.rt.voice_path, deleted: !!m.rt.deleted_at } : null,
          editedAt: m.edited_at || null, forwarded: !!m.forwarded, pinnedAt: m.pinned_at || null, sticker: m.sticker || '', loc: m.loc || null, mentions: m.mentions || [], expiresAt: m.expires_at || null, saved: saved.has(m.id),
          poll: m.poll ? { q: m.poll.q || '', options: m.poll.options || [], votes: (m.poll.options || []).map((_, i) => (votesBy.get(m.id) || []).filter(v => v.opt === i).length), my: (votesBy.get(m.id) || []).find(v => v.user_id === me.id)?.opt ?? null } : null };
      });
      let members = [];
      if (t.kind === 'group') members = ok(await sb.from('chat_members').select('user_id,role,last_read_at,p:profiles(name,avatar_url)').eq('chat_id', t.id)).map(x => ({ id: x.user_id, role: x.role, lastReadAt: x.last_read_at, name: x.p?.name || 'সদস্য', avatar: x.p?.avatar_url || '' }));
      const shared = sh?.data || {};
      return { msgs, muted: !!set.muted, accepted: !!set.accepted, marked: !!set.marked_unread, members, shared: { theme: shared.theme || '', nicknames: shared.nicknames || {}, disappear: !!shared.disappear } };
    },
    async messages(id, pageId, asPage) { return (await this.thread({ kind: pageId ? 'page' : 'dm', id, pageId, asPage })).msgs; },
    async sendMessage(id, body, pageId, opts = {}) { return this.send({ kind: pageId ? 'page' : 'dm', id, pageId, asPage: opts.asPage }, body, opts); },
    async send(t, body, { replyTo, image, voice, voiceSecs, sticker, loc, poll, mentions, forwarded, imagePath, voicePath } = {}) {
      const folder = chatFolder(t), up = async (blob, ext) => { const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`; ok(await sb.storage.from('chat').upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })); return path; };
      // ফরওয়ার্ড: আগের ফাইল নতুন চ্যাটের ফোল্ডারে কপি
      const cp = async (from, ext) => { const to = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`; ok(await sb.storage.from('chat').copy(from, to)); return to; };
      const image_path = image ? await up(image, image.type === 'image/webp' ? 'webp' : 'jpg') : imagePath ? await cp(imagePath, imagePath.split('.').pop()) : null;
      const voice_path = voice ? await up(voice, (voice.type.split('/')[1] || 'webm').split(';')[0]) : voicePath ? await cp(voicePath, voicePath.split('.').pop()) : null;
      const row = { sender_id: me.id, body: body || '', image_path, voice_path, voice_secs: voice || voicePath ? Math.max(1, Math.min(180, Math.round(voiceSecs || 1))) : null, reply_to: replyTo || null,
        sticker: sticker || null, loc: loc || null, poll: poll || null, mentions: mentions?.length ? mentions : null, forwarded: !!forwarded };
      if (t.kind === 'group') Object.assign(row, { chat_id: t.id, recipient_id: null });
      else Object.assign(row, { recipient_id: t.id, page_id: t.pageId || null });
      ok(await sb.from('messages').insert(row));
    },
    async fileUrls(paths) {
      const need = [...new Set(paths.filter(p => p && !fileCache.has(p)))];
      if (need.length) { const { data } = await sb.storage.from('chat').createSignedUrls(need, 3600); (data || []).forEach(d => { if (d.signedUrl) fileCache.set(d.path, d.signedUrl); }); }
      return new Map(paths.filter(p => fileCache.has(p)).map(p => [p, fileCache.get(p)]));
    },
    async reactMessage(id, emoji) {
      if (!emoji) ok(await sb.from('message_reactions').delete().eq('message_id', id).eq('user_id', me.id));
      else ok(await sb.from('message_reactions').upsert({ message_id: id, user_id: me.id, emoji }, { onConflict: 'message_id,user_id' }));
    },
    async unsendMessage(m) {
      const paths = [m.image, m.voice].filter(Boolean);
      ok(await sb.rpc('unsend_message', { p_id: m.id }));
      if (paths.length) await sb.storage.from('chat').remove(paths).catch(() => {});
    },
    async editMessage(id, body) { ok(await sb.rpc('edit_message', { p_id: id, p_body: body })); },
    async pinMessage(id, on) { ok(await sb.rpc('pin_message', { p_id: id, p_on: !!on })); },
    async saveMessage(id, on) { if (on) ok(await sb.from('message_saved').upsert({ user_id: me.id, message_id: id }, { ignoreDuplicates: true })); else ok(await sb.from('message_saved').delete().eq('user_id', me.id).eq('message_id', id)); },
    async savedMessages() {
      return ok(await sb.from('message_saved').select('created_at,m:messages(id,body,sender_id,recipient_id,chat_id,page_id,created_at,image_path,sticker,loc,deleted_at,sp:profiles!messages_sender_id_fkey(name,avatar_url))').eq('user_id', me.id).order('created_at', { ascending: false }).limit(100))
        .filter(r => r.m).map(r => ({ id: r.m.id, body: r.m.body || '', mine: r.m.sender_id === me.id, sender: r.m.sp?.name || '', avatar: r.m.sp?.avatar_url || '', createdAt: r.m.created_at, image: !!r.m.image_path, sticker: r.m.sticker || '', loc: !!r.m.loc, deleted: !!r.m.deleted_at,
          t: r.m.chat_id ? { kind: 'group', id: r.m.chat_id } : { kind: r.m.page_id ? 'page' : 'dm', id: r.m.sender_id === me.id ? r.m.recipient_id : r.m.sender_id, pageId: r.m.page_id || null } }));
    },
    async voteChatPoll(id, opt) { ok(await sb.rpc('vote_chat_poll', { p_id: id, p_opt: opt == null ? -1 : opt })); },
    async mediaOf(t) {
      let q = sb.from('messages').select('id,image_path,created_at').not('image_path', 'is', null);
      const cust = t.asPage ? t.id : me.id;
      if (t.kind === 'group') q = q.eq('chat_id', t.id);
      else if (t.pageId) q = q.eq('page_id', t.pageId).or(`sender_id.eq.${cust},recipient_id.eq.${cust}`);
      else q = q.is('page_id', null).is('chat_id', null).or(`and(sender_id.eq.${me.id},recipient_id.eq.${t.id}),and(sender_id.eq.${t.id},recipient_id.eq.${me.id})`);
      return ok(await q.order('created_at', { ascending: false }).limit(100)).map(r => ({ id: r.id, path: r.image_path, createdAt: r.created_at }));
    },
    async setShared(t, { theme, nickUser, nick, disappear }) { ok(await sb.rpc('set_conv_shared', { p_key: chatFolder(t), p_theme: theme ?? null, p_nick_user: nickUser || null, p_nick: nick ?? null, p_disappear: disappear ?? null })); },
    async updateChat(id, { name, about, photo, removePhoto }) {
      let path = null;
      if (photo) { path = `g_${id}/group-${Date.now()}.${photo.type === 'image/webp' ? 'webp' : 'jpg'}`; ok(await sb.storage.from('chat').upload(path, photo, { contentType: photo.type, cacheControl: '31536000' })); }
      ok(await sb.rpc('update_chat', { p_chat: id, p_name: name || '', p_about: about || '', p_photo: removePhoto ? '' : path }));
    },
    async hideMessage(id) { ok(await sb.from('message_hidden').upsert({ user_id: me.id, message_id: id }, { ignoreDuplicates: true })); },
    async convSet(t, patch) {
      const key = convKey(t), cur = ok(await sb.from('conv_settings').select('muted,accepted,cleared_at').eq('user_id', me.id).eq('key', key).maybeSingle()) || {};
      ok(await sb.from('conv_settings').upsert({ user_id: me.id, key, muted: cur.muted || false, accepted: cur.accepted || false, cleared_at: cur.cleared_at || null, ...patch }, { onConflict: 'user_id,key' }));
    },
    async clearConversation(t) { await this.convSet(t, { cleared_at: new Date().toISOString() }); await this.markThreadRead(t).catch(() => {}); },
    async markThreadRead(t) { if (t.kind === 'group') ok(await sb.rpc('mark_chat_read', { p_chat: t.id })); else ok(await sb.rpc('mark_read2', { partner: t.id, p_page: t.pageId || null })); },
    async markRead(id, pageId) { ok(await sb.rpc('mark_read2', { partner: id, p_page: pageId || null })); },
    // অনলাইন চিহ্ন
    async touchPresence() { if (me) await sb.rpc('touch_presence'); },
    async presence(ids) { if (!me || !ids.length) return new Map(); return new Map(ok(await sb.rpc('presence_of', { p_ids: ids })).map(r => [r.user_id, r.last_seen])); },
    async showActive() { return me ? !!ok(await sb.rpc('my_show_active')) : true; },
    async setShowActive(on) { ok(await sb.rpc('set_show_active', { p_on: !!on })); },
    // গ্রুপ চ্যাট
    async createChat(name, ids) { return ok(await sb.rpc('create_chat', { p_name: name, p_members: ids })); },
    async chatInfo(id) { const c = ok(await sb.from('chats').select('id,name,created_by,created_at,about,photo_path,admins_only,join_approval').eq('id', id).maybeSingle()); return c && { id: c.id, name: c.name, createdBy: c.created_by, about: c.about || '', adminsOnly: !!c.admins_only, approval: c.join_approval !== false, photo: c.photo_path ? (await this.fileUrls([c.photo_path])).get(c.photo_path) || '' : '' }; },
    async addChatMembers(id, ids) { ok(await sb.rpc('add_chat_members', { p_chat: id, p_members: ids })); },
    async removeChatMember(id, uid) { ok(await sb.rpc('remove_chat_member', { p_chat: id, p_user: uid })); },
    async renameChat(id, name) { ok(await sb.rpc('rename_chat', { p_chat: id, p_name: name })); },
    async markUnread(t, on) { await this.convSet(t, { marked_unread: !!on }); },
    async chatInvite(id, reset) { return ok(await sb.rpc('chat_invite', { p_chat: id, p_reset: !!reset })); },
    async chatByCode(code) { const r = ok(await sb.rpc('chat_by_code', { p_code: code }))[0]; return r && { id: r.id, name: r.name, about: r.about || '', members: r.members, isMember: r.is_member, pending: r.pending, approval: r.approval }; },
    async joinChat(code) { return ok(await sb.rpc('join_chat', { p_code: code })); },
    async chatJoinList(id) { return ok(await sb.rpc('chat_join_list', { p_chat: id })).map(r => ({ id: r.user_id, name: r.name, avatar: r.avatar_url || '', createdAt: r.created_at })); },
    async decideChatJoin(id, uid, okk) { ok(await sb.rpc('decide_chat_join', { p_chat: id, p_user: uid, p_ok: !!okk })); },
    async setChatOptions(id, { adminsOnly, approval }) { ok(await sb.rpc('set_chat_options', { p_chat: id, p_admins_only: adminsOnly ?? null, p_approval: approval ?? null })); },
    async setChatAdmin(id, uid, on) { ok(await sb.rpc('set_chat_admin', { p_chat: id, p_user: uid, p_on: !!on })); },
    // "লিখছেন…": শুধু মুহূর্তের সংকেত, কোথাও জমা হয় না
    typing(t, onTyping) {
      const ch = sb.channel('typing-' + chatFolder(t), { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'typing' }, p => { if (p.payload?.u !== me.id) onTyping(p.payload); }).subscribe();
      return { send: () => ch.send({ type: 'broadcast', event: 'typing', payload: { u: me.id, n: me.name } }), stop: () => sb.removeChannel(ch) };
    },
    async pageUnread() { return new Map((ok(await sb.rpc('my_page_unread')) || []).map(r => [r.page_id, Number(r.unread)])); },
    async setAutoReply(pageId, { on, text }) { ok(await sb.from('pages').update({ auto_reply_on: !!on, auto_reply: (text || '').trim() || null }).eq('id', pageId)); },
    async unreadCount() {
      if (!me) return 0;
      return Number(ok(await sb.rpc('my_unread'))) || 0;   // নিজের আর যেসব পেইজ চালান সেগুলোর না-পড়া মেসেজ
    },
    onMessage(cb) {
      if (!me) return () => {};
      // RLS অনুযায়ী যেসব মেসেজ দেখার অনুমতি আছে শুধু সেগুলোর খবর আসে (সাধারণ, পেইজ, গ্রুপ)
      const ev = (kind, n) => { if (!n || blocked.has(n.sender_id)) return; cb({ type: kind, id: n.id, from: n.sender_id, to: n.recipient_id, mine: n.sender_id === me.id, body: n.body, pageId: n.page_id || null, chatId: n.chat_id || null }); };
      const ch = sb.channel('dm-' + me.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => ev('new', p.new))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, p => ev('update', p.new))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, p => cb({ type: 'rx', id: (p.new || p.old)?.message_id }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_poll_votes' }, p => cb({ type: 'rx', id: (p.new || p.old)?.message_id }))
        .subscribe();
      return () => sb.removeChannel(ch);
    },

    // ---------- নোটিফিকেশন
    // pageId দিলে শুধু ওই পেইজের নোটিফিকেশন; না দিলে পেইজেরগুলো বাদে বাকি সব
    async notifications(pageId) {
      const rows = ok(await sb.from('notifications').select('id,type,post_id,group_id,read,created_at,actor_id,meta, a:profiles!notifications_actor_id_fkey(id,name,avatar_url), p:posts!notifications_post_id_fkey(body,page_id,image_url,bg), g:groups!notifications_group_id_fkey(name)')
        .eq('user_id', me.id).order('created_at', { ascending: false }).limit(100));
      return rows.filter(n => n.a && !blocked.has(n.actor_id) && inScope(n, pageId)).slice(0, 60).map(n => ({
        id: n.id, type: n.type, postId: n.post_id, groupId: n.group_id, groupName: n.g?.name || '', read: n.read, createdAt: n.created_at,
        actor: { id: n.a.id, name: n.a.name, avatar: n.a.avatar_url || '' }, snippet: n.p?.body || '', postImage: n.p?.image_url || '', postBg: n.p?.bg || '', meta: n.meta || {},
      }));
    },
    async unreadNotifications(pageId) {
      if (!me) return 0;
      const rows = ok(await sb.from('notifications').select('id,type,meta,p:posts!notifications_post_id_fkey(page_id)').eq('user_id', me.id).eq('read', false).limit(300));
      return rows.filter(n => inScope(n, pageId)).length;
    },
    async myAnnouncer() { if (!me) return null; const r = ok(await sb.from('announcers').select('title,union_id').eq('user_id', me.id).maybeSingle()); return r && { title: r.title, unionId: r.union_id }; },
    async announcersList() { return ok(await sb.rpc('announcers_list')).map(r => ({ id: r.user_id, name: r.name, avatar: r.avatar_url || '', title: r.title, unionId: r.union_id, unionName: r.union_name || '' })); },
    async setAnnouncer(uid, title, unionId) { ok(await sb.rpc('admin_set_announcer', { p_user: uid, p_title: title, p_union: unionId || null })); },
    async removeAnnouncer(uid) { ok(await sb.rpc('admin_remove_announcer', { p_user: uid })); },
    async adminBroadcast(text, unionId) { return Number(ok(await sb.rpc('admin_broadcast', { p_text: text, p_union: unionId || null }))) || 0; },
    async announcements() { return ok(await sb.from('announcements').select('id,body,union_id,recipients,created_at').order('created_at', { ascending: false }).limit(10)); },
    async deleteNotification(id) { ok(await sb.from('notifications').delete().eq('id', id).eq('user_id', me.id)); },
    async markNotificationUnread(id) { ok(await sb.rpc('mark_notification_unread', { p_id: id })); },
    async notifMutes() { return me ? new Set(ok(await sb.from('notif_mutes').select('post_id').eq('user_id', me.id)).map(r => r.post_id)) : new Set(); },
    async muteNotifPost(postId, on) { if (on) ok(await sb.from('notif_mutes').upsert({ user_id: me.id, post_id: postId }, { ignoreDuplicates: true })); else ok(await sb.from('notif_mutes').delete().eq('user_id', me.id).eq('post_id', postId)); },
    async notifPrefs() { return me ? (ok(await sb.from('notif_prefs').select('off').eq('user_id', me.id).maybeSingle())?.off || []) : []; },
    async setNotifPrefs(off) { ok(await sb.from('notif_prefs').upsert({ user_id: me.id, off, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })); },
    async markNotificationsRead(ids) { if (ids) { if (ids.length) ok(await sb.rpc('mark_notifications_read_ids', { p_ids: ids })); } else ok(await sb.rpc('mark_notifications_read')); },
    onNotify(cb) {
      if (!me) return () => {};
      const ch = sb.channel('nt-' + me.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${me.id}` }, () => cb())
        .subscribe();
      return () => sb.removeChannel(ch);
    },

    // ---------- সার্চ (মানুষ, পোস্ট, সেবা একসঙ্গে)
    async search(q) {
      const [people, posts, services] = await Promise.all([this.people({ q }), this.posts({ q }), this.services({ q })]);
      return { people, posts, services };
    },

    // ---------- সেবা ডিরেক্টরি ও রিপোর্ট
    async services({ category, q }) {
      let s = sb.from('services').select('id,name,category,address,phone,hours,verified,union_id,call_count,lat,lng,url,image_url,details,images,subtype,amenities,how_to_go,best_time,rating_avg,rating_count,videos,tagline,life,timeline,facts,honors,quote,born_md,died_md,burial,burial_lat,burial_lng,related,family_verified,tribute_count,phones,email')
        .eq('upazila_id', UPAZILA_ID).order('verified', { ascending: false }).order('name').limit(500);
      if (category) s = s.eq('category', category);
      const term = (q || '').replace(/[,%()*\\]/g, ' ').trim();
      if (term) s = s.or(`name.ilike.%${term}%,address.ilike.%${term}%`);
      return ok(await s);
    },
    async addService(v) { ok(await sb.from('services').insert({ ...v, upazila_id: UPAZILA_ID, created_by: me.id, verified: false })); },
    async serviceFavs() { return me ? ok(await sb.from('service_favs').select('service_id').eq('user_id', me.id)).map(r => r.service_id) : []; },
    async setServiceFav(id, on) { if (on) ok(await sb.from('service_favs').upsert({ user_id: me.id, service_id: id }, { ignoreDuplicates: true })); else ok(await sb.from('service_favs').delete().eq('user_id', me.id).eq('service_id', id)); },
    async serviceCalled(id) { await sb.rpc('service_called', { sid: id }); },
    async dirBanners() { return ok(await sb.from('dir_banners').select('id,title,subtitle,image_url,color,link,sort').eq('active', true).order('sort').order('created_at', { ascending: false }).limit(10)); },
    async addDirBanner(v) { const image_url = v.image ? await upload(v.image, 'banner') : null; ok(await sb.from('dir_banners').insert({ title: v.title, subtitle: v.subtitle, color: v.color, link: v.link, image_url })); },
    async delDirBanner(id) { ok(await sb.from('dir_banners').delete().eq('id', id)); },
    async popularServiceCats() { return ok(await sb.from('service_cat_visits').select('category,visits').gt('visits', 0).order('visits', { ascending: false }).limit(10)); },
    async serviceCatVisit(c) { await sb.rpc('svc_cat_visit', { c }); },
    async setServiceLoc(id, lat, lng) { ok(await sb.from('services').update({ lat, lng }).eq('id', id)); },
    async verifyService(id) { ok(await sb.from('services').update({ verified: true }).eq('id', id)); },
    async serviceReviews(id) {
      const rows = ok(await sb.from('service_reviews').select('id,user_id,rating,body,created_at').eq('service_id', id).order('created_at', { ascending: false }).limit(50));
      const ids = [...new Set(rows.map(r => r.user_id))];
      const ps = ids.length ? ok(await sb.from('profiles').select('id,name,avatar_url').in('id', ids)) : [];
      const pm = new Map(ps.map(p => [p.id, p]));
      return rows.filter(r => pm.has(r.user_id) && !blocked.has(r.user_id)).map(r => ({ ...r, name: pm.get(r.user_id).name, avatar: pm.get(r.user_id).avatar_url || '', mine: r.user_id === me?.id }));
    },
    async saveReview(id, rating, body) { ok(await sb.from('service_reviews').upsert({ service_id: id, user_id: me.id, rating, body: body || null }, { onConflict: 'service_id,user_id' })); },
    async delReview(rid) { ok(await sb.from('service_reviews').delete().eq('id', rid)); },
    async uploadServiceImage(blob) { return upload(blob, 'svc'); },
    async myTributes() { if (!me) return []; return ok(await sb.from('service_tributes').select('service_id').eq('user_id', me.id)).map(r => r.service_id); },
    async setTribute(id, on) { if (on) ok(await sb.from('service_tributes').upsert({ service_id: id, user_id: me.id }, { onConflict: 'service_id,user_id', ignoreDuplicates: true })); else ok(await sb.from('service_tributes').delete().eq('service_id', id).eq('user_id', me.id)); },
    async suggest(kind, v) { ok(await sb.from('service_suggestions').insert({ user_id: me.id, kind, service_id: v.service_id || null, category: v.category || 'famous', payload: v.payload || {}, images: v.images || [] })); },
    async suggestions(category) {
      const rows = ok(await sb.from('service_suggestions').select('id,user_id,kind,service_id,category,payload,images,created_at').eq('status', 'pending').eq('category', category).order('created_at', { ascending: false }).limit(50));
      const ids = [...new Set(rows.map(r => r.user_id))], ps = ids.length ? ok(await sb.from('profiles').select('id,name').in('id', ids)) : [];
      const pm = new Map(ps.map(p => [p.id, p.name])); return rows.map(r => ({ ...r, by: pm.get(r.user_id) || 'সদস্য' }));
    },
    async pendingSuggestions(category) { return ok(await sb.from('service_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('category', category)) || 0; },
    async setSuggestion(id, status) { ok(await sb.from('service_suggestions').update({ status }).eq('id', id)); },
    async quizStart() { return ok(await sb.rpc('famous_quiz_start')); },
    async quizSubmit(answers) { return ok(await sb.rpc('famous_quiz_submit', { p_answers: answers })); },
    async serviceReports(id) { return ok(await sb.from('reports').select('id,reason,created_at').eq('target_type', 'service').eq('target_id', String(id)).eq('resolved', false).order('created_at', { ascending: false }).limit(20)); },
    async resolveReport(rid) { ok(await sb.from('reports').update({ resolved: true }).eq('id', rid)); },
    async saveService(id, v) {
      if (id) { ok(await sb.from('services').update(v).eq('id', id)); return id; }
      const r = ok(await sb.from('services').insert({ ...v, upazila_id: UPAZILA_ID, created_by: me.id, verified: false }).select('id').single());
      ok(await sb.from('services').update({ verified: true }).eq('id', r.id)); return r.id;
    },
    async report(targetType, targetId, reason) {
      ok(await sb.from('reports').insert({ reporter_id: me.id, target_type: targetType, target_id: String(targetId), reason }));
    },
  };
}

// ================================================================ ডেমো মোড
function demoApi() {
  const K = 'au_demo7_';
  const get = (k, d) => { try { const v = localStorage.getItem(K + k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(K + k, JSON.stringify(v)); } catch { /* জায়গা না থাকলে শুধু মেমরিতে */ } };
  const ago = h => new Date(Date.now() - h * 3600e3).toISOString();
  const wait = v => new Promise(r => setTimeout(() => r(v), 100));
  const nid = arr => arr.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
  const toBlobUrl = blob => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });

  const UNIONS = ['ভালুকা পৌরসভা', 'উথুরা ইউনিয়ন', 'কাচিনা ইউনিয়ন', 'ডাকাতিয়া ইউনিয়ন', 'ধীতপুর ইউনিয়ন', 'বিরুনিয়া ইউনিয়ন', 'ভরাডোবা ইউনিয়ন', 'ভালুকা ইউনিয়ন', 'মল্লিকবাড়ী ইউনিয়ন', 'মেদুয়ারী ইউনিয়ন', 'রাজৈ ইউনিয়ন', 'হবিরবাড়ী ইউনিয়ন'].map((name, i) => ({ id: i + 1, name }));
  const uname = id => UNIONS.find(u => u.id === Number(id))?.name || '';
  const BH = { district: 'ময়মনসিংহ', upazila: 'ভালুকা' };
  const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const PEOPLE = [
    { id: 'd1', name: 'রাশেদুল হক', ...BH, unionId: 2, bio: 'শিক্ষক, উথুরা উচ্চ বিদ্যালয়', bloodGroup: 'A+', phone: '01700000101', lastDonated: daysAgo(150) },
    { id: 'd2', name: 'সুমি আক্তার', ...BH, unionId: 2, bio: '', bloodGroup: 'O+', phone: '01700000102', lastDonated: '' },
    { id: 'd3', name: 'নাসরিন সুলতানা', joinedAt: '2025-03-10T08:00:00.000Z', verified: 'authentic', ...BH, unionId: 3, bio: 'স্বেচ্ছাসেবী, রক্তদান ক্লাব', bloodGroup: 'B+', phone: '01700000103', lastDonated: daysAgo(40) },
    { id: 'd4', name: 'তানভীর আহমেদ', ...BH, unionId: 3, bio: 'নিয়মিত রক্তদাতা', bloodGroup: 'B+', phone: '01700000104', lastDonated: daysAgo(120), joinedAt: daysAgo(2) + 'T08:00:00.000Z' },
    { id: 'd5', name: 'মিজানুর রহমান', verified: 'paid', verifiedUntil: new Date(Date.now() + 20 * 864e5).toISOString(), ...BH, unionId: 4, bio: 'ব্যবসায়ী, ডাকাতিয়া বাজার', bloodGroup: 'AB+', phone: '01700000105', lastDonated: daysAgo(200) },
    { id: 'd6', name: 'উপজেলা যুব উন্নয়ন', ...BH, unionId: 1, bio: 'প্রশিক্ষণ ও চাকরির খবর', bloodGroup: '', phone: '' },
    { id: 'd7', name: 'রুমানা আক্তার', locked: true, ...BH, unionId: 12, bio: '', bloodGroup: 'A-', phone: '01700000107', lastDonated: daysAgo(20), joinedAt: daysAgo(3) + 'T08:00:00.000Z' },
    { id: 'd8', name: 'জাহিদ হাসান', district: 'ময়মনসিংহ', upazila: 'ত্রিশাল', unionId: null, bio: '', bloodGroup: 'O-', phone: '01700000108', lastDonated: daysAgo(95) },
    { id: 'd9', name: 'শফিকুল ইসলাম', district: 'ঢাকা', upazila: 'সাভার', unionId: null, bio: 'ভালুকার কারখানায় কাজ করি', bloodGroup: 'AB-', phone: '01700000109', lastDonated: '' },
  ];

  const db = {
    users: get('users', []),
    posts: get('posts', [
      { id: 1, userId: 'd1', sv: 3, unionId: 2, category: 'খবর', createdAt: ago(2), body: 'আগামীকাল সকাল ৯টা থেকে বিকাল ৩টা পর্যন্ত সদর ও বাজার এলাকায় বিদ্যুৎ বন্ধ থাকবে। লাইন মেরামতের কাজ চলবে।', image: '', likes: 24, rx: { like: 18, love: 4, wow: 2 }, cm: [{ id: 1, userId: 'd2', body: 'জানানোর জন্য ধন্যবাদ ভাই।', createdAt: ago(1) }] },
      { id: 10, userId: 'd2', sv: 3, unionId: 2, category: 'অনুষ্ঠান', createdAt: ago(0.2), body: 'আজ বিকেলে উথুরা স্কুল মাঠে ফুটবল টুর্নামেন্টের ফাইনাল হলো। দারুণ খেলা হয়েছে!', images: ['demo:1', 'demo:2', 'demo:3', 'demo:4'], tags: ['d1', 'd4'], likes: 22, rx: { like: 15, love: 7 }, cm: [] },
      { id: 9, userId: 'd1', sv: 6, unionId: 2, category: 'খবর', createdAt: ago(0.5), body: 'উথুরা ইউনিয়নের সবার জন্য একটি গুরুত্বপূর্ণ ঘোষণা।\n\nআগামী শনিবার সকাল ১০টা থেকে ইউনিয়ন পরিষদ চত্বরে বিনামূল্যে স্বাস্থ্য ক্যাম্প হবে। এখানে চোখ, দাঁত, ডায়াবেটিস ও রক্তচাপ পরীক্ষা করা হবে। শিশুদের জন্য আলাদা ডাক্তার থাকবেন এবং প্রয়োজনীয় ওষুধও বিনামূল্যে দেওয়া হবে।\n\nযারা আসবেন, জাতীয় পরিচয়পত্র বা জন্ম নিবন্ধনের ফটোকপি সঙ্গে আনবেন। বয়স্ক ও প্রতিবন্ধী ভাই-বোনদের জন্য আলাদা লাইনের ব্যবস্থা থাকবে। সকাল সকাল এলে ভিড় কম পাবেন।\n\nদয়া করে পোস্টটি শেয়ার করে সবাইকে জানিয়ে দিন, যাতে কেউ বাদ না পড়েন।', image: '', likes: 16, rx: { like: 12, love: 4 }, cm: [{ id: 5, userId: 'd2', sv: 4, body: 'অনেক ভালো উদ্যোগ। আমার বাবা-মাকে নিয়ে আসব ইনশাআল্লাহ। আগের বারও এমন ক্যাম্প হয়েছিল, তখন অনেক ভিড় ছিল কিন্তু ডাক্তাররা খুব যত্ন নিয়ে সবাইকে দেখেছিলেন। এবারও আশা করি ভালো ব্যবস্থা থাকবে, আর ওষুধের পরিমাণ যেন যথেষ্ট থাকে সেটা খেয়াল রাখবেন। ধন্যবাদ সবাইকে যারা এর আয়োজন করছেন।', createdAt: ago(0.3) }] },
      { id: 8, userId: 'd5', unionId: 4, category: 'খবর', createdAt: ago(1.5), body: 'সবাই শেয়ার করুন, রক্ত দরকার।', image: '', likes: 3, rx: { like: 3 }, sharedPostId: 2, cm: [] },
      { id: 2, userId: 'd3', sv: 14, unionId: 3, category: 'সাহায্য চাই', createdAt: ago(4), body: 'জরুরি ভিত্তিতে B+ রক্ত দরকার। রোগী উপজেলা স্বাস্থ্য কমপ্লেক্সে ভর্তি। কেউ দিতে পারলে কমেন্ট বা মেসেজ করুন।', image: '', likes: 41, rx: { like: 22, love: 9, sad: 10 }, cm: [{ id: 2, userId: 'd4', body: 'আমি B+, এক ঘণ্টার মধ্যে আসছি।', createdAt: ago(3), likes: 12, rx: { like: 8, love: 4 }, rk: { d1: 'like', d2: 'love', d3: 'like', d5: 'love', d7: 'like' } }, { id: 3, userId: 'd1', body: 'কোন ওয়ার্ডে ভর্তি আছেন জানাবেন।', createdAt: ago(3.5), likes: 2, rx: { like: 2 }, rk: { d2: 'like', d5: 'like' } }, { id: 4, userId: 'd7', sv: 9, body: 'আমার পরিচিত একজন B+ আছেন, যোগাযোগ করছি।', createdAt: ago(2), likes: 5, rx: { like: 3, love: 2 }, rk: { d1: 'like', d3: 'love', d4: 'like', d6: 'love', d9: 'like' } }], pinned: 2 },
      { id: 3, userId: 'd5', unionId: 4, category: 'হারানো-প্রাপ্তি', createdAt: ago(26), body: 'নদীপাড় মোড়ে একটি কালো মানিব্যাগ পাওয়া গেছে, ভেতরে জাতীয় পরিচয়পত্র আছে। পরিচয় দিয়ে নিয়ে যান।', image: '', likes: 18, rx: { like: 15, wow: 3 }, cm: [] },
      { id: 4, userId: 'd6', pageId: 2, unionId: 1, category: 'অনুষ্ঠান', createdAt: ago(50), body: 'ফ্রিল্যান্সিং ও কম্পিউটার প্রশিক্ষণে ভর্তি চলছে। বয়স ১৮–৩৫। আবেদনের শেষ তারিখ ৩০ নভেম্বর।', image: '', likes: 57, rx: { like: 40, love: 12, haha: 5 }, cm: [] },
      { id: 5, userId: 'd1', pageId: 1, unionId: 2, category: 'খবর', createdAt: ago(8), body: 'এই শুক্রবার বিনামূল্যে ডায়াবেটিস ও রক্তচাপ পরীক্ষা, সকাল ১০টা থেকে দুপুর ২টা।', image: '', likes: 33, rx: { like: 28, love: 5 }, cm: [] },
      { id: 6, userId: 'd4', groupId: 1, unionId: 3, category: 'সাহায্য চাই', createdAt: ago(6), body: 'O- রক্তের দাতা খুঁজছি, আগামী সোমবার অপারেশন। কেউ থাকলে জানাবেন।', image: '', likes: 9, rx: { like: 6, sad: 3 }, cm: [] },
      { id: 7, userId: 'd5', groupId: 2, unionId: 4, category: 'খবর', createdAt: ago(10), body: 'এ সপ্তাহে ইউরিয়া সারের দাম বস্তাপ্রতি ৫০ টাকা কমেছে।', image: '', likes: 4, rx: { like: 4 }, cm: [] },
    ]),
    likes: get('likes', []),            // "userId:postId"
    reacts: get('reacts', {}),          // "userId:postId" -> রিয়্যাক্টের ধরন
    friendships: get('friendships', []), // { requester, addressee, status }
    follows: get('follows', []),         // "follower:followee"
    blocks: get('blocks', []),           // "blocker:blocked"
    messages: get('messages', []),       // { id, from, to, body, createdAt, read }
    notifs: get('notifs', []),           // { id, to, from, type, postId, groupId, createdAt, read }
    saved: get('saved', []),             // "userId:postId"
    settings: get('settings', { publicDonorPhone: false }),
    wallet: get('wallet', { coins: 120, ledger: [{ amount: 100, reason: 'admin', ref: 'স্বাগতম', createdAt: ago(30) }, { amount: 5, reason: 'post', ref: 'x1', createdAt: ago(20) }, { amount: 15, reason: 'like', ref: 'x2', createdAt: ago(19) }] }),
    chats: get('chats', []),
    dirBanners: get('dirBanners', [{ id: 1, title: 'বিনামূল্যে রক্তদান ক্যাম্প', subtitle: 'শুক্রবার সকাল ১০টা · উপজেলা পরিষদ চত্বর', color: 'red', link: 'cat:blood', image_url: null }, { id: 2, title: 'ডেঙ্গু থেকে সাবধান', subtitle: 'জমে থাকা পানি ফেলে দিন · জ্বর হলে উপজেলা স্বাস্থ্য কমপ্লেক্সে যান', color: 'orange', link: 'cat:health', image_url: null }]), svcFavs: get('svcFavs', {}), svcCatVisits: get('svcCatVisits', { health: 14, doc: 11, police: 8, blood: 6, edu: 4, bank: 2 }), msgSaved: get('msgSaved', []), shared: get('shared', {}), friendMarks: get('friendMarks', {}), friendLists: get('friendLists', []), sugHidden: get('sugHidden', []), notifMutes: get('notifMutes', []), notifOff: get('notifOff', []), annc: get('annc', []), announcers: get('announcers', []),             // গ্রুপ চ্যাট { id, name, createdBy, createdAt, members: [{ id, role, lastReadAt }] }
    convSet: get('convSet', {}),         // কথোপকথনের সেটিং (মিউট, রিকোয়েস্ট, মুছা)
    votes: get('votes', {}),             // postId -> { userId: অপশন }
    going: get('going', {}),             // postId -> [userId]
    stories: get('stories', []),         // ২৪ ঘণ্টার স্টোরি
    storyViews: get('storyViews', {}),   // storyId -> [{ id, at }]
    pageAdmins: get('pageAdmins', []),   // "pageId:userId"
    boosts: get('boosts', [{ id: 1, post_id: 3, user_id: 'd5', days: 7, coins: 350, union_id: null, status: 'active', starts_at: ago(24), ends_at: new Date(Date.now() + 6 * 864e5).toISOString(), reach: 214, created_at: ago(25) }]),
    vreqs: get('vreqs', [{ id: 1, user_id: 'd7', kind: 'public_figure', full_name: 'রুমানা আক্তার', category: 'সাংবাদিক', links: 'https://example.com/rumana', note: 'স্থানীয় পত্রিকার প্রতিবেদক', status: 'pending', coins_held: 0, created_at: ago(5) }]),
    albums: get('albums', []),           // { id, userId, name, privacy, createdAt }
    manual: get('manual', [            // হাতে যোগ করা ডোনার
      { id: 1, createdBy: 'd3', name: 'আব্দুল করিম', district: 'ময়মনসিংহ', upazila: 'ভালুকা', unionId: 7, phone: '01700000140', bloodGroup: 'O-', lastDonated: '' },
    ]),
    pages: get('pages', [
      { id: 1, ownerId: 'd1', verified: 'authentic', address: 'বাজার রোড, ভালুকা, ময়মনসিংহ', lat: 24.3814, lng: 90.3816, faqs: [{ q: 'রক্ত পরীক্ষার খরচ কত?', a: 'CBC ৪০০ টাকা, সুগার ১৫০ টাকা, লিপিড প্রোফাইল ১২০০ টাকা।' }, { q: 'কখন খোলা থাকে?', a: 'প্রতিদিন সকাল ৯টা থেকে রাত ১০টা, শুক্রবারও খোলা।' }, { q: 'রিপোর্ট কখন পাব?', a: 'বেশিরভাগ রিপোর্ট একই দিন বিকাল ৫টার মধ্যে।' }], autoReplyOn: true, autoReply: 'আসসালামু আলাইকুম! জননী ডায়াগনস্টিকে মেসেজ করার জন্য ধন্যবাদ। আমরা সকাল ৯টা থেকে রাত ১০টা পর্যন্ত খোলা। শীঘ্রই উত্তর দেব।', name: 'জননী ডায়াগনস্টিক সেন্টার', category: 'স্বাস্থ্য', about: 'সব ধরনের পরীক্ষা ও বিশেষজ্ঞ ডাক্তার। শুক্রবার খোলা।', phone: '01700-000020', avatar: '' },
      { id: 2, ownerId: 'd6', name: 'উপজেলা চাকরির খবর', category: 'চাকরি ও প্রশিক্ষণ', about: 'উপজেলার সরকারি-বেসরকারি চাকরি ও প্রশিক্ষণের খবর।', phone: '', avatar: '' },
    ]),
    pageFollows: get('pageFollows', ['d2:1', 'd3:1', 'd4:2']),
    groups: get('groups', [
      { id: 1, ownerId: 'd3', name: 'উপজেলা রক্তদান ক্লাব', about: 'জরুরি রক্তের প্রয়োজনে একে অপরের পাশে।', privacy: 'public', avatar: '' },
      { id: 2, ownerId: 'd5', name: 'চরপাড়া কৃষক সমিতি', about: 'চাষাবাদ, বীজ, সার ও বাজারদর নিয়ে আলোচনা। শুধু সদস্যদের জন্য।', privacy: 'private', avatar: '' },
    ]),
    members: get('members', [
      { groupId: 1, userId: 'd3', role: 'admin', status: 'active' }, { groupId: 1, userId: 'd4', role: 'member', status: 'active' },
      { groupId: 2, userId: 'd5', role: 'admin', status: 'active' },
    ]),
    services: get('services', [
      ...DEMO_TOURS,
      { id: 1, name: 'উপজেলা স্বাস্থ্য কমপ্লেক্স', category: 'health', address: 'হাসপাতাল রোড, সদর', phone: '01700-000001', hours: 'জরুরি বিভাগ ২৪ ঘণ্টা', verified: true },
      { id: 2, name: 'উপজেলা নির্বাহী অফিসারের কার্যালয়', category: 'gov', address: 'উপজেলা পরিষদ চত্বর', phone: '01700-000002', hours: 'রবি–বৃহস্পতি, সকাল ৯টা–বিকাল ৫টা', verified: true },
      { id: 3, name: 'সহকারী কমিশনার (ভূমি) অফিস', category: 'gov', address: 'উপজেলা পরিষদ চত্বর', phone: '01700-000003', hours: 'রবি–বৃহস্পতি, সকাল ৯টা–বিকাল ৫টা', verified: true },
      { id: 12, name: 'উপজেলা কৃষি অফিস', category: 'gov', address: 'উপজেলা পরিষদ চত্বর', phone: '01700-000013', hours: 'রবি–বৃহস্পতি, সকাল ৯টা–বিকাল ৫টা', verified: true },
      { id: 4, name: 'থানা', category: 'police', address: 'থানা মোড়, সদর', phone: '01700-000004', hours: '২৪ ঘণ্টা', verified: true },
      { id: 5, name: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স স্টেশন', category: 'police', address: 'বাসস্ট্যান্ডের পাশে', phone: '01700-000005', hours: '২৪ ঘণ্টা', verified: true },
      { id: 6, name: 'সরকারি পাইলট উচ্চ বিদ্যালয়', category: 'edu', address: 'স্কুল রোড, সদর', phone: '01700-000006', hours: 'শনি–বৃহস্পতি', verified: true },
      { id: 13, name: 'উপজেলা সরকারি কলেজ', category: 'edu', address: 'কলেজ রোড', phone: '01700-000014', hours: 'শনি–বৃহস্পতি', verified: true },
      { id: 7, name: 'ডা. ফারহানা ইসলাম (শিশু বিশেষজ্ঞ)', category: 'doc', address: 'জননী ডায়াগনস্টিক, বাজার রোড', phone: '01700-000007', hours: 'বিকাল ৪টা–রাত ৯টা', verified: true },
      { id: 8, name: 'রফিক ইলেকট্রিক', category: 'fix', address: 'চরপাড়া বাজার', phone: '01700-000008', hours: 'সকাল ৮টা–রাত ৮টা', verified: true },
      { id: 14, name: 'কামাল প্লাম্বিং ও স্যানিটারি', category: 'fix', address: 'নদীপাড় মোড়', phone: '01700-000009', hours: 'যেকোনো সময় কল করুন', verified: true },
      { id: 9, name: 'উপজেলা–জেলা সদর বাস কাউন্টার', category: 'bus', address: 'কেন্দ্রীয় বাসস্ট্যান্ড', phone: '01700-000010', hours: 'ভোর ৬টা থেকে প্রতি ৩০ মিনিটে', verified: true },
      { id: 10, name: 'কৃষি ব্যাংক শাখা', category: 'bank', address: 'কলেজ রোড, সদর', phone: '01700-000011', hours: 'রবি–বৃহস্পতি, সকাল ১০টা–বিকাল ৪টা', verified: true },
      { id: 11, name: 'বটতলা সাপ্তাহিক হাট', category: 'shop', address: 'বটতলা ইউনিয়ন', phone: '01700-000012', hours: 'প্রতি মঙ্গলবার', verified: true },
    ]),
  };
  // পুরোনো ডেমো ডেটাতেও নতুন দর্শনীয় স্থানগুলো বসাই
  for (const t of DEMO_TOURS) { const i = db.services.findIndex(x => x.id === t.id); if (i < 0) db.services.unshift({ ...t }); else db.services[i] = { ...db.services[i], ...t, lat: db.services[i].lat, lng: db.services[i].lng }; }
  db.services = db.services.filter((x, i, a) => a.findIndex(y => y.id === x.id) === i);
  db.svcReports = get('svcReports', []); db.tributes = get('tributes', []); db.suggs = get('suggs', []); db.quiz = get('quiz', null);
  db.svcReviews = get('svcReviews', [
    { id: 1, service_id: 901, user_id: 'd3', rating: 5, body: 'শালবনের ভেতর হাঁটতে দারুণ লাগে, ওয়াচ টাওয়ার থেকে পুরো বন দেখা যায়।', created_at: ago(30) },
    { id: 2, service_id: 901, user_id: 'd4', rating: 4, body: 'সুন্দর জায়গা, তবে খাবার সাথে নিয়ে যাবেন।', created_at: ago(80) },
    { id: 3, service_id: 904, user_id: 'd5', rating: 5, body: 'পরিবার নিয়ে পিকনিকে গিয়েছিলাম, খাবার ভালো ছিল।', created_at: ago(50) },
  ]);
  const svcRate = id => { const rs = db.svcReviews.filter(r => r.service_id === id), s = db.services.find(x => x.id === id); if (s) { s.rating_count = rs.length; s.rating_avg = rs.length ? Math.round(rs.reduce((a, r) => a + r.rating, 0) / rs.length * 10) / 10 : 0; } };
  [...new Set(db.svcReviews.map(r => r.service_id))].forEach(svcRate);
  let meId = get('me', null);
  const save = () => { for (const k of ['tributes', 'suggs', 'quiz', 'svcReports', 'svcReviews', 'dirBanners', 'svcCatVisits', 'svcFavs', 'chats', 'convSet', 'votes', 'going', 'stories', 'storyViews', 'pageAdmins', 'boosts', 'wallet', 'vreqs', 'albums', 'users', 'posts', 'likes', 'reacts', 'friendships', 'follows', 'blocks', 'messages', 'notifs', 'saved', 'settings', 'manual', 'pages', 'pageFollows', 'groups', 'members', 'services', 'msgSaved', 'shared', 'friendMarks', 'friendLists', 'sugHidden', 'notifMutes', 'notifOff', 'annc', 'announcers']) if (db[k] !== undefined) set(k, db[k]); set('me', meId); };
  const person = id => db.users.find(u => u.id === id) || PEOPLE.find(u => u.id === id);
  const user = id => { const p = person(id); return p && { id: p.id, name: p.name, unionId: p.unionId, district: p.district || '', upazila: p.upazila || '', union: (uname(p.unionId) ? [uname(p.unionId), p.upazila] : [p.upazila, p.district]).filter(Boolean).join(', '), bloodGroup: p.bloodGroup || '', donorVisible: p.donorVisible !== false, lastDonated: p.lastDonated || '', avatar: p.avatar || '', cover: p.cover || '', bio: p.bio || '', friendsVisibility: p.friendsVisibility || 'public', followersVisibility: p.followersVisibility || 'public', followingVisibility: p.followingVisibility || 'public', social: p.social || {}, works: p.works || [], educations: p.educations || [], joinedAt: p.joinedAt || '', gender: p.gender || '', username: p.username || '', birthYear: p.birthYear || 0, birthDate: p.birthDate || '', relationship: p.relationship || '', religion: p.religion || '', orgs: p.orgs || [], featured: p.featured || FEATURED0, verified: badgeOf(p), verifiedUntil: p.verifiedUntil || null, locked: !!p.locked, pinnedPostId: p.pinnedPostId || null, donorReady: !!p.donorReady, friendReqFrom: p.friendReqFrom || 'everyone', gone: !!p.deleteAt && p.id !== meId }; };
  const ABOUT_VIS0 = { works: 'public', educations: 'public', contact: 'only_me', social: 'public', birth: 'only_me', relationship: 'only_me', religion: 'only_me', orgs: 'public' };
  const meUser = () => (meId && person(meId) ? { ...user(meId), email: person(meId).email, phone: person(meId).phone || '', admin: true, aboutVis: { ...ABOUT_VIS0, ...(person(meId).aboutVis || {}) } } : null);
  const isBlocked = id => db.blocks.includes(meId + ':' + id);
  const demoN = n => ({ ...n, p: { page_id: db.posts.find(x => x.id === n.postId)?.pageId || null }, meta: n.meta || {} });
  // ডেমো: কাজ করলে কয়েন (আসল সার্ভারে এটা ডাটাবেসের ট্রিগার করে)
  const sett = k => Number(db.settings[k] ?? SETTING_KEYS[k][1]);
  function earn(why, ref, ownerId) {
    if (!meId || ownerId === meId) return;
    const w = db.wallet, key = why + ':' + ref, since = dhakaMidnight().toISOString();
    if (w.ledger.some(l => l.reason === why && l.ref === key)) return;
    const today = w.ledger.filter(l => EARN_REASONS.includes(l.reason) && l.createdAt >= since).reduce((t, l) => t + l.amount, 0);
    const amt = Math.min(sett('earn' + why[0].toUpperCase() + why.slice(1)), sett('earnCap') - today);
    if (amt <= 0) return;
    w.coins += amt; w.ledger.unshift({ amount: amt, reason: why, ref: key, createdAt: new Date().toISOString() }); save();
  }
  // ডেমো: নমুনা মানুষের দেখা (রিয়্যাক্ট ও মন্তব্যের অনুপাতে) + এই ডিভাইসে গোনা দেখা
  function demoViews(p) {
    const real = Object.values(get('pviews', {})[p.id] || {}), base = (p.likes || 0) * 4 + p.cm.length * 3 + (p.userId === meId ? 2 : 6);
    const boostReach = db.boosts.filter(b => b.post_id === p.id).reduce((t, b) => t + (b.reach || 0), 0);
    const people = base + real.length + boostReach, close = Math.round(people * 0.6), others = people - close, f = k => Math.round(people * k);
    const days = lastDays(7), share = days.map((_, i) => (i === 6 ? 0.35 : i === 5 ? 0.3 : 0.35 / 5));
    return toStats({ people, views: Math.round(base * 1.4) + real.reduce((t, r) => t + r.t, 0) + boostReach, today: Math.ceil(base / 3), close, others, new_followers: Math.floor(others / 6), boost_reach: boostReach,
      sources: { feed: f(0.55), profile: f(0.15), share: f(0.12), group: f(0.03), boost: boostReach, post: people - f(0.55) - f(0.15) - f(0.12) - f(0.03) - boostReach },
      areas: [{ name: 'উথুরা ইউনিয়ন', n: f(0.4) }, { name: 'ভালুকা পৌরসভা', n: f(0.25) }, { name: 'কাচিনা ইউনিয়ন', n: f(0.15) }, { name: 'অন্যান্য', n: people - f(0.4) - f(0.25) - f(0.15) }],
      genders: people >= 10 ? { male: f(0.58), female: f(0.37), unknown: people - f(0.58) - f(0.37) } : null,
      ages: people >= 10 ? { '13-17': f(0.06), '18-24': f(0.34), '25-34': f(0.31), '35-44': f(0.16), '45+': f(0.08), unknown: people - f(0.06) - f(0.34) - f(0.31) - f(0.16) - f(0.08) } : null,
      daily: days.map((day, i) => ({ day, n: Math.round(people * share[i]) })), clicks: { profile: f(0.12), photo: (p.images?.length || p.image) ? f(0.3) : 0, more: (p.body || '').length > 200 ? f(0.18) : 0 } });
  }
  const addCoins = (amount, reason, ref) => { db.wallet.coins += amount; db.wallet.ledger.unshift({ amount, reason, ref: String(ref), createdAt: new Date().toISOString() }); };
  // প্রোফাইল লক: বন্ধু ছাড়া অন্যরা প্রোফাইলের কিছু দেখবে না
  const lockedOut = uid => !!person(uid)?.locked && uid !== meId && !(meId && friendIds(meId).includes(uid));
  const albumVisible = a => (a.pageId || !lockedOut(a.userId)) && a.privacy === 'public' || a.userId === meId || (a.privacy === 'friends' && meId && friendIds(meId).includes(a.userId));
  // স্টোরি: ২৪ ঘণ্টা পেরোলেই ছবি/লেখাসহ মুছে ফেলা
  function purgeStories() {
    const now = new Date().toISOString(), n = db.stories.length;
    db.stories = db.stories.filter(x => x.expiresAt > now);
    for (const k in db.storyViews) if (!db.stories.some(x => String(x.id) === k)) delete db.storyViews[k];
    if (db.stories.length !== n) save();
  }
  // ডেমোর নমুনা: পোল, অনুষ্ঠান, রঙিন পোস্ট, স্টোরি
  (function seedExtras() {
    const h = n => new Date(Date.now() - n * 36e5).toISOString();
    if (!db.posts.some(p => p.id === 11)) db.posts.push({ id: 11, userId: 'd4', unionId: 3, category: 'প্রশ্ন', createdAt: h(1), body: 'উপজেলায় কোন রাস্তাটা আগে মেরামত হওয়া দরকার বলে মনে করেন?', image: '', likes: 4, rx: { like: 4 }, cm: [], poll: ['ভালুকা-গফরগাঁও রোড', 'উথুরা বাজার রোড', 'হবিরবাড়ি সংযোগ সড়ক'] });
    if (!db.votes[11]) db.votes[11] = { d1: 0, d2: 0, d3: 1, d5: 0, d6: 2 };
    const p10 = db.posts.find(p => p.id === 10);
    if (p10 && !p10.eventAt) { const d = new Date(); d.setHours(17, 0, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); p10.eventAt = d.toISOString(); p10.eventPlace = 'উথুরা স্কুল মাঠ'; db.going[10] = ['d1', 'd3', 'd5']; }
    if (!db.posts.some(p => p.id === 13)) db.posts.push({ id: 13, userId: 'd5', unionId: 4, category: 'খবর', createdAt: h(2), body: 'আজ ভালুকা হাটে শীতের সবজির দাম কমেছে। #ভালুকা_হাট #বাজারদর', image: '', likes: 5, rx: { like: 5 }, cm: [] });
    if (!db.posts.some(p => p.id === 14)) db.posts.push({ id: 14, userId: 'd1', unionId: 2, category: 'খবর', createdAt: h(5), body: 'শনিবার ভালুকা হাটে বিশেষ গরুর হাট বসবে। #ভালুকা_হাট', image: '', likes: 3, rx: { like: 3 }, cm: [] });
    if (!db.posts.some(p => p.id === 12)) db.posts.push({ id: 12, userId: 'd6', unionId: 2, category: 'খবর', createdAt: h(3), body: 'শীত আসছে, পুরোনো গরম কাপড় দান করুন। পাশে দাঁড়ান অসহায় মানুষের 🤝', image: '', likes: 9, rx: { like: 6, love: 3 }, cm: [], bg: 'g5' });
    if (!db.friendships.some(f => [f.requester, f.addressee].sort().join() === 'd1,d2')) db.friendships.push({ requester: 'd1', addressee: 'd2', status: 'accepted' });
    if (!db.posts.some(p => p.id === 15)) db.posts.push({ id: 15, userId: 'd2', unionId: 2, category: 'খবর', createdAt: h(30), body: 'আলহামদুলিল্লাহ, আজ থেকে ভালুকা উপজেলা স্বাস্থ্য কমপ্লেক্সে নার্স হিসেবে যোগ দিলাম। সবার দোয়া চাই।', image: '', likes: 24, rx: { like: 14, love: 10 }, cm: [], lifeEvent: 'job', lifeDate: h(30).slice(0, 10) });
    // ডেমো: আজ সুমি আক্তারের জন্মদিন (বন্ধু), যাতে জন্মদিনের কার্ড দেখা যায়
    { const t = new Date(Date.now() + 6 * 36e5), d2 = person('d2'); if (d2) d2.birthDate = `1996-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`; }
    purgeStories();
    if (!db.stories.some(x => x.seed)) {
      const now = Date.now();
      [['d2', 'আজ বিকেলে ফুটবল ফাইনাল ⚽ সবাই আসবেন!', 'g2', 2], ['d3', 'রক্ত দিয়ে জীবন বাঁচান ❤️', 'g6', 5], ['d1', 'বিনামূল্যে স্বাস্থ্য ক্যাম্প: শনিবার সকাল ১০টা', 'g4', 8], ['d2', 'টিকিট লাগবে না, সবাই আমন্ত্রিত 🎉', 'g7', 1]]
        .forEach(([u, b, bg, hh]) => db.stories.push({ id: nid(db.stories), seed: true, userId: u, kind: 'text', body: b, bg, privacy: 'public', createdAt: new Date(now - hh * 36e5).toISOString(), expiresAt: new Date(now - hh * 36e5 + 864e5).toISOString() }));
    }
  })();
  const friendRow = (a, b) => db.friendships.find(f => (f.requester === a && f.addressee === b) || (f.requester === b && f.addressee === a));
  const friendIds = of => db.friendships.filter(f => f.status === 'accepted' && (f.requester === of || f.addressee === of)).map(f => (f.requester === of ? f.addressee : f.requester));
  const rel = id => {
    const f = meId && friendRow(meId, id);
    return { friend: !f ? 'none' : f.status === 'accepted' ? 'friends' : f.requester === meId ? 'sent' : 'received', following: db.follows.includes(meId + ':' + id), blocked: isBlocked(id) };
  };
  const listeners = new Set(), notifyListeners = new Set(), typingListeners = new Set();
  const demoShKey = t => (t.kind === 'group' ? 'g_' + t.id : 'd_' + [meId, t.id].sort().join('_'));
  const demoSh = t => { db.shared = db.shared || {}; return db.shared[demoShKey(t)] || {}; };
  const demoKey = t => (t.kind === 'group' ? 'g:' + t.id : t.pageId ? `p:${t.pageId}:${t.id}` : 'u:' + t.id);
  // ডেমোর নমুনা ছবি (মাঠ, আকাশ, খেলোয়াড়)
  const PICS = [['#7fc8f8', '#5cb85c', '#f5b700'], ['#ffb37a', '#4caf50', '#e5303f'], ['#9ad0ff', '#3f9b4f', '#1d6fd8'], ['#c6b8ff', '#66bb6a', '#ff7043']];
  function demoPic(src) {
    const m = /^demo:(\d+)$/.exec(src || ''); if (!m) return src;
    const [sky, field, shirt] = PICS[(Number(m[1]) - 1) % PICS.length], n = Number(m[1]);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${sky}"/><circle cx="${150 + n * 120}" cy="110" r="55" fill="#fff6c2"/><rect y="330" width="800" height="270" fill="${field}"/><path d="M0 330h800" stroke="#fff" stroke-width="6"/><circle cx="400" cy="465" r="70" stroke="#fff" stroke-width="5" fill="none"/><rect x="${200 + n * 60}" y="250" width="40" height="90" rx="12" fill="${shirt}"/><circle cx="${220 + n * 60}" cy="232" r="20" fill="#8d5524"/><circle cx="${300 + n * 70}" cy="520" r="18" fill="#fff" stroke="#333" stroke-width="3"/><text x="30" y="570" font-family="sans-serif" font-size="30" fill="#fff">${n}/4</text></svg>`);
  }
  function reactAs(uid, postId, reaction, prev) {
    const k = uid + ':' + postId, p = db.posts.find(x => x.id === postId); if (!p) return;
    p.rx = p.rx || { like: p.likes };
    if (prev) { p.rx[prev] = Math.max((p.rx[prev] || 0) - 1, 0); }
    if (reaction) { p.rx[reaction] = (p.rx[reaction] || 0) + 1; db.reacts[k] = reaction; if (!prev) (p.rxAt = p.rxAt || {})[uid] = new Date().toISOString(); if (!db.likes.includes(k)) db.likes.push(k); if (uid === meId && !prev) earn('like', postId, p.userId); }
    else { delete db.reacts[k]; db.likes = db.likes.filter(x => x !== k); }
    p.likes += (reaction ? 1 : 0) - (prev ? 1 : 0);
    save();
  }
  const ready = d => !d.lastDonated || (Date.now() - new Date(d.lastDonated).getTime()) / 864e5 >= 90;
  const member = (gid, uid) => db.members.find(m => m.groupId === Number(gid) && m.userId === uid);
  const canSeeGroup = gid => { const g = db.groups.find(x => x.id === gid); return !g || g.privacy === 'public' || member(gid, meId)?.status === 'active'; };
  const pageOf = id => db.pages.find(x => x.id === Number(id));
  const groupOut = g => ({ ...g, members: db.members.filter(m => m.groupId === g.id && m.status === 'active').length });
  const pageOut = pg => ({ ...pg, followers: db.pageFollows.filter(f => f.endsWith(':' + pg.id)).length, verified: badgeOf(pg), verifiedUntil: pg.verifiedUntil || null });
  // ডেমো: মেনশন — শুধু যাঁরা পোস্ট দেখতে পারেন তাঁদের নোটিফিকেশন
  function mentionNotify(p, ids, from, old = []) {
    const fr = new Set(friendIds(p.userId)), g = p.groupId && db.groups.find(x => x.id === p.groupId);
    const pair = (a, b) => db.blocks.includes(a + ':' + b) || db.blocks.includes(b + ':' + a);
    const sees = uid => !pair(uid, p.userId) && (!g || g.privacy === 'public' || member(g.id, uid)?.status === 'active') && (p.privacy === 'public' || !p.privacy || uid === p.userId || (p.privacy === 'friends' && fr.has(uid)));
    const clean = [...new Set(ids || [])].filter(uid => uid && uid !== from && person(uid) && !pair(uid, from)).slice(0, 20);
    clean.filter(uid => !old.includes(uid) && sees(uid)).forEach(uid => notify(uid, from, 'mention', p.id));
    return clean;
  }
  function notify(to, from, type, postId = null, groupId = null, meta = null) {
    if (!to || (to === from && !SELF_NT.includes(type)) || db.blocks.includes(to + ':' + from)) return;
    if (to === meId && ((db.notifOff || []).includes(type) || (postId && (db.notifMutes || []).includes(Number(postId))))) return;
    if (type !== 'comment' && type !== 'reply') db.notifs = db.notifs.filter(n => !(n.to === to && n.from === from && n.type === type && n.postId === postId && n.groupId === groupId));
    db.notifs.push({ id: nid(db.notifs), to, from, type, postId, groupId, meta, createdAt: new Date().toISOString(), read: false });
    save(); if (to === meId) notifyListeners.forEach(cb => cb());
  }

  function seedFor(id) { // নতুন ডেমো ইউজারের জন্য কিছু নমুনা সম্পর্ক
    db.friendships.push({ requester: 'd3', addressee: id, status: 'pending' });
    db.friendships.push({ requester: 'd1', addressee: id, status: 'accepted' });
    db.follows.push(id + ':d1', 'd1:' + id, id + ':d6');
    db.messages.push({ id: nid(db.messages), from: 'd1', to: id, body: 'আসসালামু আলাইকুম! আমার উপজেলা অ্যাপে স্বাগতম 🙂', createdAt: new Date().toISOString(), read: false });
    db.notifs.push({ id: nid(db.notifs), to: id, from: 'd1', type: 'follow', postId: null, createdAt: ago(0.1), read: false });
    db.notifs.push({ id: nid(db.notifs), to: id, from: 'd3', type: 'friend_request', postId: null, createdAt: new Date().toISOString(), read: false });
  }

  // ---------- ডেমো প্রোফাইল: সব ফিচার চেক করার জন্য আগে থেকে সাজানো অ্যাকাউন্ট
  const DEMO_ID = 'demo', DEMO_EMAIL = 'demo@amarupazila.app', DEMO_PASS = 'demo1234';
  const demoImg = (sky, field, label) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="${sky}"/><circle cx="640" cy="110" r="60" fill="#ffd54a"/>` +
    `<path d="M0 330 Q200 260 400 320 T800 300 V500 H0z" fill="${field}"/><path d="M0 400 Q250 350 500 400 T800 390 V500 H0z" fill="#2f7d4f"/>` +
    `<rect x="150" y="250" width="120" height="90" fill="#c0563b"/><path d="M140 255 L210 200 L280 255z" fill="#7a2e1d"/><rect x="195" y="295" width="30" height="45" fill="#4a2a1a"/>` +
    `<text x="30" y="470" font-family="sans-serif" font-size="26" fill="#fff">${label}</text></svg>`);
  function seedDemo() {
    const id = DEMO_ID, t = h => ago(h);
    // আগের ডেমো ডেটা মুছে নতুন করে সাজাই
    const oldPages = db.pages.filter(x => x.ownerId === id).map(x => x.id), oldGroups = db.groups.filter(g => g.ownerId === id).map(g => g.id);
    db.users = db.users.filter(u => u.id !== id);
    db.posts = db.posts.filter(p => p.userId !== id && !oldPages.includes(p.pageId) && !oldGroups.includes(p.groupId));
    for (const p of db.posts) p.cm = p.cm.filter(c => c.userId !== id);
    db.pages = db.pages.filter(x => x.ownerId !== id); db.groups = db.groups.filter(g => g.ownerId !== id);
    db.members = db.members.filter(m => m.userId !== id && !oldGroups.includes(m.groupId));
    const mine = x => x.startsWith(id + ':') || x.endsWith(':' + id);
    db.likes = db.likes.filter(x => !x.startsWith(id + ':')); db.saved = db.saved.filter(x => !x.startsWith(id + ':'));
    db.follows = db.follows.filter(x => !mine(x)); db.blocks = db.blocks.filter(x => !mine(x)); db.pageFollows = db.pageFollows.filter(x => !x.startsWith(id + ':'));
    db.friendships = db.friendships.filter(f => f.requester !== id && f.addressee !== id);
    db.messages = db.messages.filter(m => m.from !== id && m.to !== id); db.notifs = db.notifs.filter(n => n.to !== id && n.from !== id);
    db.services = db.services.filter(x => x.demo !== true);
    db.manual = db.manual.filter(m => m.createdBy !== id);
    db.manual.push({ id: nid(db.manual), createdBy: id, name: 'মোঃ সেলিম মিয়া', district: 'ময়মনসিংহ', upazila: 'ভালুকা', unionId: 12, phone: '01700000150', bloodGroup: 'A+', lastDonated: daysAgo(60) });

    db.users.push({ id, email: DEMO_EMAIL, password: DEMO_PASS, name: 'ডেমো ব্যবহারকারী', district: 'ময়মনসিংহ', upazila: 'ভালুকা', unionId: 12, phone: '01700000100', bloodGroup: 'B+', lastDonated: daysAgo(100), donorVisible: true, avatar: '', bio: 'অ্যাপের সব ফিচার চেক করার প্রোফাইল' });
    // বন্ধু, রিকোয়েস্ট, ফলো
    { const yr = new Date(); yr.setFullYear(yr.getFullYear() - 2); const ann = yr.toISOString();   // ডেমো: রাশেদুলের সাথে আজ বন্ধুত্বের ২ বছর
    db.friendships.push({ requester: 'd1', addressee: id, status: 'accepted', acceptedAt: ann }, { requester: id, addressee: 'd2', status: 'accepted', acceptedAt: daysAgo(200) + 'T10:00:00.000Z' }, 
      { requester: 'd3', addressee: id, status: 'pending' }, { requester: 'd4', addressee: id, status: 'pending' }, { requester: id, addressee: 'd5', status: 'pending' }); }
    db.follows.push(`${id}:d1`, `d1:${id}`, `${id}:d2`, `d2:${id}`, `d6:${id}`, `${id}:d5`);
    // নিজের পোস্ট (একটিতে ছবি)
    const p1 = { id: nid(db.posts), userId: id, unionId: 2, category: 'খবর', createdAt: t(3), body: 'আমাদের সদর ইউনিয়নের নতুন রাস্তার কাজ শেষ হয়েছে। সবাইকে ধন্যবাদ যারা সহযোগিতা করেছেন।', image: demoImg('#8fd0f0', '#7cc36b', 'সদর ইউনিয়ন'), likes: 2, cm: [] };
    p1.cm.push({ id: Date.now() + 1, userId: 'd1', body: 'অনেক ভালো খবর 👏', createdAt: t(2.5) }, { id: Date.now() + 2, userId: 'd2', body: 'রাস্তাটা এখন অনেক সুন্দর।', createdAt: t(2) });
    db.posts.push(p1);
    const p2 = { id: nid(db.posts), userId: id, unionId: 2, category: 'প্রশ্ন', createdAt: t(30), body: 'উপজেলায় ভালো কম্পিউটার প্রশিক্ষণ কেন্দ্র কোথায় আছে? কেউ জানলে জানাবেন।', image: '', likes: 1, cm: [{ id: Date.now() + 3, userId: 'd6', body: 'যুব উন্নয়ন অফিসে কোর্স চলছে, পেইজে দেখুন।', createdAt: t(29) }] };
    db.posts.push(p2);
    { const yd = new Date(); yd.setFullYear(yd.getFullYear() - 1); db.posts.push({ id: nid(db.posts), userId: id, unionId: 2, category: '', createdAt: yd.toISOString(), body: 'আজ প্রথম আমার উপজেলা অ্যাপে যোগ দিলাম! সবাইকে শুভেচ্ছা 🌾', image: '', likes: 4, rx: { like: 3, love: 1 }, cm: [] }); }
    db.likes.push(`d1:${p1.id}`, `d2:${p1.id}`, `d1:${p2.id}`, `${id}:2`, `${id}:5`);
    db.saved.push(`${id}:2`, `${id}:4`);
    // নিজের পেইজ
    const pg = { id: nid(db.pages), ownerId: id, name: 'ডেমো ফার্মেসী', category: 'স্বাস্থ্য', about: 'সব ধরনের ওষুধ পাওয়া যায়। প্রতিদিন সকাল ৮টা থেকে রাত ১১টা।', phone: '01700-000099', avatar: '' };
    db.pages.push(pg); db.pageFollows.push(`d1:${pg.id}`, `d3:${pg.id}`, `d4:${pg.id}`, `${id}:1`);
    db.messages.push({ id: nid(db.messages), from: 'd2', to: id, pageId: pg.id, body: 'আজ কি নাপা এক্সট্রা পাওয়া যাবে? কত টাকা পাতা?', createdAt: ago(0.4), read: false });
    db.posts.push({ id: nid(db.posts), userId: id, pageId: pg.id, unionId: 2, category: 'খবর', createdAt: t(6), body: 'শীতের ওষুধ ও ভিটামিন এখন ১০% ছাড়ে পাওয়া যাচ্ছে।', image: '', likes: 0, cm: [] });
    // নিজের প্রাইভেট গ্রুপ (একজনের যোগদানের অনুরোধসহ) + একটি পাবলিক গ্রুপের সদস্য
    const g = { id: nid(db.groups), ownerId: id, name: 'ডেমো যুব সংঘ', about: 'সদর ইউনিয়নের তরুণদের খেলাধুলা ও সামাজিক কাজের গ্রুপ।', privacy: 'private', avatar: '' };
    db.groups.push(g);
    db.members.push({ groupId: g.id, userId: id, role: 'admin', status: 'active' }, { groupId: g.id, userId: 'd1', role: 'member', status: 'active' },
      { groupId: g.id, userId: 'd2', role: 'member', status: 'active' }, { groupId: g.id, userId: 'd4', role: 'member', status: 'pending' },
      { groupId: 1, userId: id, role: 'member', status: 'active' });
    db.posts.push({ id: nid(db.posts), userId: 'd2', groupId: g.id, unionId: 2, category: 'অনুষ্ঠান', createdAt: t(5), body: 'শুক্রবার বিকেল ৪টায় স্কুল মাঠে ফুটবল ম্যাচ। সবাই চলে আসবেন!', image: '', likes: 3, cm: [] });
    // মেসেজ
    const msg = (from, to, body, h, read) => db.messages.push({ id: nid(db.messages), from, to, body, createdAt: t(h), read });
    msg('d1', id, 'আসসালামু আলাইকুম, কেমন আছেন?', 5, true); msg(id, 'd1', 'ওয়ালাইকুম আসসালাম, ভালো আছি। আপনি?', 4.9, true);
    msg('d1', id, 'আলহামদুলিল্লাহ। কাল ইউনিয়ন পরিষদে মিটিং আছে, আসবেন?', 1, false); msg('d1', id, 'সকাল ১০টায় শুরু।', 0.9, false);
    msg('d2', id, 'ফুটবল ম্যাচের জার্সি রেডি হয়েছে 👕', 7, false); msg(id, 'd6', 'প্রশিক্ষণের আবেদন ফর্ম কোথায় পাব?', 26, true);
    // মেসেজ রিকোয়েস্ট (বন্ধু নন এমন কেউ) আর একটি গ্রুপ চ্যাট
    msg('d7', id, 'আসসালামু আলাইকুম, আপনার ফার্মেসীতে কি ইনসুলিন পাওয়া যায়?', 3, false);
    db.chats = db.chats.filter(c => !c.members.some(x => x.id === id));
    db.messages = db.messages.filter(m => !m.chatId || db.chats.some(c => c.id === m.chatId));
    { const at = t(30), g2 = { id: nid(db.chats), name: 'উথুরা ফুটবল দল ⚽', createdBy: 'd2', createdAt: at, members: [{ id: 'd2', role: 'admin', lastReadAt: t(0.5), joinedAt: at }, { id: 'd1', role: 'member', lastReadAt: t(2), joinedAt: at }, { id, role: 'member', lastReadAt: t(3), joinedAt: at }] };
      db.chats.push(g2);
      [['d2', 'শুক্রবার বিকেলে প্র্যাকটিস, সবাই সময়মতো আসবেন', 4], ['d1', 'ইনশাআল্লাহ আসব', 2.5], ['d2', 'জার্সির টাকা ২০০ করে দিতে হবে', 1]].forEach(([f, b, h]) => db.messages.push({ id: nid(db.messages), from: f, to: null, chatId: g2.id, body: b, createdAt: t(h), rx: {} })); }
    db.convSet = {};
    // নোটিফিকেশন (সব ধরনের)
    const nt = (from, type, h, postId = null, groupId = null, read = false) => db.notifs.push({ id: nid(db.notifs), to: id, from, type, postId, groupId, createdAt: t(h), read });
    nt('d2', 'like', 2.6, p1.id); nt('d1', 'comment', 2.5, p1.id); nt('d2', 'comment', 2, p1.id);
    nt('d4', 'friend_request', 1.5); nt('d3', 'friend_request', 1.2); nt('d4', 'group_request', 1, null, g.id);
    { const ntm = (from, type, h, meta, postId = null, read = false) => db.notifs.push({ id: nid(db.notifs), to: id, from, type, postId, groupId: null, meta, createdAt: t(h), read });
      ntm('d6', 'announce', 0.3, { text: 'আগামীকাল সকাল ৯টা থেকে বিকেল ৩টা পর্যন্ত ভালুকা পৌরসভা ও আশেপাশে বিদ্যুৎ থাকবে না। প্রয়োজনীয় কাজ আগেই সেরে নিন।' });
      ntm('d2', 'birthday', 0.5, { count: 1, names: ['সুমি আক্তার'] });
      ntm('d1', 'friend_anniv', 0.6, { years: 2 });
      ntm('d4', 'area_alert', 1.4, { cat: 'হারানো-প্রাপ্তি', union: 'হবিরবাড়ী ইউনিয়ন' }, p1.id);
      ntm(id, 'milestone', 3, { kind: 'reacts', n: 10 }, p1.id, true); }
    nt('d6', 'follow', 20, null, null, true); nt('d2', 'friend_accept', 40, null, null, true); nt('d3', 'group_approved', 45, null, 1, true);
    // যাচাই বাকি একটি সেবা (অ্যাডমিন হিসেবে যাচাই করে দেখার জন্য)
    db.services.push({ id: nid(db.services), name: 'সুমন মোবাইল সার্ভিসিং', category: 'fix', address: 'সদর বাজার', phone: '01700-000077', hours: 'সকাল ৯টা–রাত ৯টা', verified: false, demo: true });
    meId = id; save();
  }

  return {
    mode: 'demo',
    async init() { return meUser(); },
    me: meUser,
    async upazila() { return { id: 1, name: 'ভালুকা', district: 'ময়মনসিংহ' }; },
    async unions() { return UNIONS; },

    async signUp({ email, password, name, district, upazila, unionId, phone, bloodGroup, lastDonated, gender, birthDate }) {
      if (db.users.some(u => u.email === email)) throw new Error('User already registered');
      const u = { id: 'u' + Date.now(), email, password, name, gender: gender || '', birthDate: birthDate || '', birthYear: birthDate ? Number(birthDate.slice(0, 4)) : 0, district, upazila, unionId: unionId ? Number(unionId) : null, phone: phone || '', bloodGroup: bloodGroup || '', lastDonated: (bloodGroup && lastDonated) || '', donorVisible: true, avatar: '', bio: '' };
      db.users.push(u); meId = u.id; seedFor(u.id); save(); return { user: meUser() };
    },
    async signIn({ email, password }) {
      const u = db.users.find(x => x.email === email && x.password === password);
      if (!u) throw new Error('Invalid login credentials');
      meId = u.id; if (u.deleteAt) { delete u.deleteAt; this._delCancelled = true; setTimeout(() => this._delCb?.(), 0); } save(); return meUser();
    },
    onDeletionCancelled(cb) { this._delCb = cb; if (this._delCancelled) setTimeout(cb, 0); },
    async requestAccountDeletion(password) { const p = person(meId); if (p.password !== password) throw new Error('wrong password'); p.deleteAt = new Date(Date.now() + 30 * 864e5).toISOString(); meId = null; save(); return wait(p.deleteAt); },
    async signOut() { meId = null; save(); },
    async myActivity() {
      const own = p => ({ postText: p?.body || (p?.image ? '📷' : ''), owner: p && p.userId !== meId ? user(p.userId)?.name || '' : '', gone: !p });
      const out = [];
      for (const k of new Set([...db.likes, ...Object.keys(db.reacts || {})])) { const [uid, pid] = k.split(':'); if (uid !== meId) continue; const r = db.reacts?.[k] || 'like'; const p = db.posts.find(x => x.id === Number(pid)); out.push({ kind: 'react', postId: Number(pid), at: p?.rxAt?.[meId] || p?.createdAt || new Date().toISOString(), reaction: r, ...own(p) }); }
      for (const p of db.posts) {
        for (const c of p.cm || []) if (c.userId === meId) out.push({ kind: c.parentId ? 'reply' : 'comment', postId: p.id, at: c.createdAt, text: c.body, ...own(p) });
        if (p.userId === meId && p.sharedPostId) { const sp = db.posts.find(x => x.id === p.sharedPostId); out.push({ kind: 'share', postId: p.sharedPostId, myPostId: p.id, at: p.createdAt, ...own(sp) }); }
      }
      return wait(out.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 150));
    },
    demoInfo: { email: DEMO_EMAIL, password: DEMO_PASS },
    async demoLogin({ reset } = {}) { if (reset || !db.users.some(u => u.id === DEMO_ID)) seedDemo(); else { meId = DEMO_ID; const p = person(DEMO_ID); if (p?.deleteAt) { delete p.deleteAt; this._delCancelled = true; setTimeout(() => this._delCb?.(), 0); } save(); } return meUser(); },
    async updateProfile({ name, district, upazila, unionId, bio, phone, bloodGroup, donorVisible, lastDonated, social, works, educations, aboutVis, gender, username, birthDate, relationship, religion, orgs, featured }) {
      for (const [k, v] of Object.entries({ relationship, religion, orgs, featured })) if (v !== undefined) person(meId)[k] = v;
      if (birthDate !== undefined) { person(meId).birthDate = birthDate || ''; if (birthDate) person(meId).birthYear = Number(birthDate.slice(0, 4)); }
      if (username && [...PEOPLE, ...db.users].some(x => x.id !== meId && (x.username || '').toLowerCase() === username.toLowerCase())) throw new Error('duplicate key value violates unique constraint "profiles_username_key"');
      if (gender !== undefined) person(meId).gender = gender || '';
      if (username !== undefined) person(meId).username = username || '';
      if (aboutVis) person(meId).aboutVis = { ...(person(meId).aboutVis || {}), ...aboutVis };
      if (works) person(meId).works = works;
      if (educations) person(meId).educations = educations;
      Object.assign(person(meId), { name, district, upazila, unionId: unionId ? Number(unionId) : null, bio: bio || '', phone: phone || '', bloodGroup: bloodGroup || '', lastDonated: (bloodGroup && lastDonated) || '', donorVisible: donorVisible !== false }, social ? { social } : {});
      save(); return meUser();
    },
    async donors({ group, upazila } = {}) {
      const ok2 = p => (!group || p.bloodGroup === group) && (!upazila || p.upazila === upazila);
      const showPhone = !!meId || db.settings.publicDonorPhone;
      const users = [...PEOPLE, ...db.users].filter(p => p.bloodGroup && p.donorVisible !== false && ok2(p) && !isBlocked(p.id))
        .map(p => { const u = user(p.id); return { id: p.id, manual: false, name: p.name, avatar: p.avatar || '', bloodGroup: p.bloodGroup, area: u.union, phone: showPhone ? (p.phone || '') : '', lastDonated: p.lastDonated || '', ready: !!p.donorReady && (!p.lastDonated || Date.now() - new Date(p.lastDonated) >= 90 * 864e5) }; });
      const manual = db.manual.filter(m => ok2(m) && !isBlocked(m.createdBy) && person(m.createdBy))
        .map(m => ({ id: 'm' + m.id, manual: true, manualId: m.id, addedBy: m.createdBy, addedByName: person(m.createdBy)?.name || '', name: m.name, avatar: '', bloodGroup: m.bloodGroup,
          area: (uname(m.unionId) ? [uname(m.unionId), m.upazila] : [m.upazila, m.district]).filter(Boolean).join(', '), phone: showPhone ? m.phone : '', lastDonated: m.lastDonated || '' }));
      return wait([...users, ...manual].sort((a, b) => (b.ready - a.ready) || (ready(b) - ready(a)) || a.bloodGroup.localeCompare(b.bloodGroup) || a.name.localeCompare(b.name, 'bn')));
    },
    async settings() { return { ...settingDefaults(), ...db.settings }; },
    async setSetting(name, value) { db.settings[name] = value; save(); },
    async boostedPosts(n = 3) {
      if (db.settings.featBoost === false) return [];
      const me = person(meId);
      const live = db.boosts.filter(b => b.status === 'active' && new Date(b.ends_at) > Date.now() && b.user_id !== meId && !isBlocked(b.user_id) && (!b.union_id || b.union_id === me?.unionId))
        .sort(() => Math.random() - 0.5).slice(0, n);
      const posts = await this.posts({ ids: live.map(b => b.post_id) });
      return live.map(b => { const p = posts.find(x => x.id === b.post_id); return p && { ...p, sponsored: true, boostId: b.id }; }).filter(Boolean);
    },
    async postClick() { return true; },
    async myInsights(days) {
      const d = days >= 30 ? 30 : 7, mine = db.posts.filter(p => p.userId === meId), st = mine.map(p => ({ p, v: demoViews(p) }));
      const people = st.reduce((t, x) => t + x.v.people, 0), close = st.reduce((t, x) => t + x.v.close, 0);
      const seed = n => (Math.sin(n * 9301 + 49297) + 1) / 2;
      return wait(toInsights({ days: d, people, views: st.reduce((t, x) => t + x.v.views, 0), close, others: people - close, new_followers: st.reduce((t, x) => t + x.v.newFollowers, 0),
        posts: mine.length, sources: { feed: Math.round(people * 0.55), profile: Math.round(people * 0.2), share: Math.round(people * 0.12), group: Math.round(people * 0.05), boost: Math.round(people * 0.08) },
        daily: lastDays(d).map((day, i) => ({ day, n: Math.round(seed(i + d) * people / 3) })),
        hours: Array.from({ length: 24 }, (_, h) => Math.round((h >= 19 && h <= 22 ? 12 : h >= 7 && h <= 9 ? 7 : h >= 12 && h <= 14 ? 5 : h < 6 ? 0 : 3) * (0.6 + seed(h)))),
        top: st.sort((a, b) => b.v.people - a.v.people).slice(0, 5).map(x => ({ id: x.p.id, body: (x.p.body || '').slice(0, 80), image: demoPic(x.p.images?.[0] || x.p.image || ''), created_at: x.p.createdAt, people: x.v.people, views: x.v.views })) }));
    },
    async postSeen(items) {
      const v = get('pviews', {}), day = new Date().toISOString().slice(0, 10), ids = items.map(x => x.id);
      for (const id of ids) { const p = db.posts.find(x => x.id === id); if (!p || p.userId === meId) continue; const r = v[id] = v[id] || {}; const m = r[meId]; if (!m) r[meId] = { t: 1, d: day }; else if (m.d < day) { m.t++; m.d = day; } }
      set('pviews', v);
    },
    async postStats(id) {
      const p = db.posts.find(x => x.id === Number(id)); if (!p) throw new Error('পোস্ট পাওয়া যায়নি');
      const others = db.posts.filter(x => x.userId === p.userId && x.id !== p.id).slice(-20).map(x => demoViews(x).people);
      return wait({ ...demoViews(p), avgPeople: others.length ? others.reduce((t, n) => t + n, 0) / others.length : null });
    },
    async profileVisit() { return true; },
    async entVisit() { return true; },
    async entInsights(kind, id, days) {
      const d = days >= 30 ? 30 : 7, seed = n => (Math.sin(n * 7919 + id * 31 + 17) + 1) / 2;
      const posts = db.posts.filter(p => (kind === 'page' ? p.pageId : p.groupId) === Number(id)), st = posts.map(p => ({ p, v: demoViews(p) }));
      const people = st.reduce((t, x) => t + x.v.people, 0) + 12, close = Math.round(people * (kind === 'group' ? 0.75 : 0.5));
      const vd = lastDays(d).map((day, i) => ({ day, n: Math.round(seed(i) * 8) })), fd = lastDays(d).map((day, i) => ({ day, plus: Math.round(seed(i + 4) * 3), minus: seed(i + 11) > 0.8 ? 1 : 0 }));
      const members = kind === 'page' ? db.pageFollows.filter(f => f.endsWith(':' + id)).length : db.members.filter(m => m.groupId === Number(id) && m.status === 'active').length;
      return wait(toEnt({ days: d, people, views: Math.round(people * 1.5), close, others: people - close, posts: posts.length,
        sources: kind === 'group' ? { group: Math.round(people * 0.7), feed: Math.round(people * 0.2), share: Math.round(people * 0.1) } : { feed: Math.round(people * 0.5), page: Math.round(people * 0.3), share: Math.round(people * 0.2) },
        daily: lastDays(d).map((day, i) => ({ day, n: Math.round(seed(i + 2) * people / 3) })),
        hours: Array.from({ length: 24 }, (_, h) => Math.round((h >= 19 && h <= 22 ? 10 : h >= 8 && h <= 10 ? 6 : h < 6 ? 0 : 3) * (0.6 + seed(h)))),
        top: st.sort((a, b) => b.v.people - a.v.people).slice(0, 5).map(x => ({ id: x.p.id, body: (x.p.body || '').slice(0, 80), image: demoPic(x.p.images?.[0] || x.p.image || ''), created_at: x.p.createdAt, people: x.v.people, views: x.v.views })),
        visits: vd.reduce((t, x) => t + x.n, 0), visitors: Math.round(vd.reduce((t, x) => t + x.n, 0) * 0.8), visits_daily: vd,
        followers: members, gained: fd.reduce((t, x) => t + x.plus, 0), lost: fd.reduce((t, x) => t + x.minus, 0), follow_daily: fd,
        pending: kind === 'group' ? db.members.filter(m => m.groupId === Number(id) && m.status === 'pending').length : null, active_members: kind === 'group' ? Math.max(1, members) : null }));
    },
    async myGrowth(days) {
      const d = days >= 30 ? 30 : 7, seed = n => (Math.sin(n * 7919 + 104729) + 1) / 2;
      const vd = lastDays(d).map((day, i) => ({ day, n: Math.round(seed(i) * 6) })), fd = lastDays(d).map((day, i) => ({ day, plus: Math.round(seed(i + 3) * 3), minus: seed(i + 9) > 0.8 ? 1 : 0 }));
      return wait(toGrowth({ visits: vd.reduce((t, x) => t + x.n, 0), visitors: Math.round(vd.reduce((t, x) => t + x.n, 0) * 0.8), visits_daily: vd,
        followers: db.follows.filter(f => f.endsWith(':' + meId)).length, gained: fd.reduce((t, x) => t + x.plus, 0), lost: fd.reduce((t, x) => t + x.minus, 0), follow_daily: fd }));
    },
    async weeklyReport() {
      const today = new Date(Date.now() + 6 * 3600e3), dow = today.getUTCDay(), wk = new Date(today.getTime() - ((dow - 5 + 7) % 7) * 864e5).toISOString().slice(0, 10);
      if (db.notifs.some(n => n.to === meId && n.type === 'weekly' && n.meta?.week === wk)) return;
      const mine = db.posts.filter(p => p.userId === meId), people = mine.reduce((t, p) => t + demoViews(p).people, 0);
      notify(meId, meId, 'weekly', null, null, { week: wk, people, prev: Math.round(people * 0.75), visits: 9, followers: 2 });
      const top = mine.sort((a, b) => demoViews(b).people - demoViews(a).people)[0];
      if (top && !db.notifs.some(n => n.to === meId && n.type === 'milestone')) notify(meId, meId, 'milestone', top.id, null, { n: 10 });
    },
    async boostSeen(ids) { const seen = get('bseen', {}), day = new Date().toISOString().slice(0, 10); for (const id of ids) { const k = id + ':' + day; if (seen[k]) continue; seen[k] = 1; const b = db.boosts.find(x => x.id === id); if (b) b.reach++; } set('bseen', seen); save(); },
    async requestBoost(postId, days, unionId) {
      const p = db.posts.find(x => x.id === Number(postId));
      if (!p || p.userId !== meId) throw new Error('শুধু নিজের পোস্ট বুস্ট করা যায়');
      if ((p.privacy || 'public') !== 'public' || p.groupId) throw new Error('শুধু পাবলিক পোস্ট বুস্ট করা যায়');
      if (db.boosts.some(b => b.post_id === p.id && (b.status === 'pending' || (b.status === 'active' && new Date(b.ends_at) > Date.now())))) throw new Error('এই পোস্টের একটি বুস্ট আগে থেকেই চলছে বা অপেক্ষায় আছে');
      const price = days * sett('boostPrice');
      if (db.wallet.coins < price) throw new Error(`যথেষ্ট কয়েন নেই (দরকার ${price})`);
      const b = { id: nid(db.boosts), post_id: p.id, user_id: meId, days, coins: price, union_id: unionId || null, status: 'pending', reach: 0, created_at: new Date().toISOString() };
      db.boosts.push(b); addCoins(-price, 'boost', b.id); save(); return b.id;
    },
    async cancelBoost(id) {
      const b = db.boosts.find(x => x.id === id && x.user_id === meId); if (!b) throw new Error('বুস্ট পাওয়া যায়নি');
      let back = 0;
      if (b.status === 'pending') { b.status = 'cancelled'; back = b.coins; }
      else if (b.status === 'active' && new Date(b.ends_at) > Date.now()) { back = Math.min(b.coins, Math.floor((new Date(b.ends_at) - Date.now()) / 864e5) * Math.floor(b.coins / b.days)); b.status = 'stopped'; b.ends_at = new Date().toISOString(); }
      else throw new Error('এই বুস্ট আর বন্ধ করা যায় না');
      if (back) addCoins(back, 'refund', 'boost:' + id); save();
    },
    __boost(b) { const po = db.posts.find(x => x.id === b.post_id); return toBoost({ ...b, unionName: uname(b.union_id), postBody: po?.body || '', postImage: demoPic(po?.images?.[0] || po?.image || '') }); },
    async myBoosts() { return wait(db.boosts.filter(b => b.user_id === meId).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(b => this.__boost(b))); },
    async postBoost(postId) { const b = [...db.boosts].reverse().find(x => x.post_id === Number(postId)); return wait(b ? this.__boost(b) : null); },
    async adminBoosts() { return wait(db.boosts.filter(b => b.status === 'pending').map(b => ({ ...this.__boost(b), user: user(b.user_id) }))); },
    async decideBoost(id, approve, note) {
      const b = db.boosts.find(x => x.id === id && x.status === 'pending'); if (!b) throw new Error('বুস্ট পাওয়া যায়নি');
      Object.assign(b, approve ? { status: 'active', starts_at: new Date().toISOString(), ends_at: new Date(Date.now() + b.days * 864e5).toISOString(), admin_note: note || '' } : { status: 'rejected', admin_note: note || '' });
      if (!approve && b.user_id === meId) addCoins(b.coins, 'refund', 'boost:' + id);
      if (b.user_id === meId) notify(meId, 'd6', approve ? 'boost_ok' : 'boost_no', b.post_id);
      save();
    },
    async wallet() {
      const since = dhakaMidnight().toISOString(), w = db.wallet;
      return wait({ coins: w.coins, today: w.ledger.filter(l => EARN_REASONS.includes(l.reason) && l.createdAt >= since).reduce((t, l) => t + l.amount, 0), ledger: w.ledger.slice(0, 60) });
    },
    async myVerifyRequest(pageId) { return wait(toReq([...db.vreqs].reverse().find(r => r.user_id === meId && (r.page_id || null) === (pageId || null))) || null); },
    async requestVerification(v) {
      const pg = v.pageId ? pageOf(v.pageId) : null;
      if (v.pageId && (!pg || pg.ownerId !== meId)) throw new Error('শুধু পেইজের মালিক আবেদন করতে পারেন');
      if (badgeOf(pg || person(meId)) === 'authentic') throw new Error('আগেই ভেরিফাইড');
      if (db.vreqs.some(r => r.user_id === meId && (r.page_id || null) === (v.pageId || null) && r.status === 'pending')) throw new Error('একটি আবেদন এখনো বিবেচনাধীন');
      const price = v.kind === 'paid' ? sett('badgePrice') : 0;
      if (db.wallet.coins < price) throw new Error(`যথেষ্ট কয়েন নেই (দরকার ${price})`);
      const r = { id: nid(db.vreqs), user_id: meId, page_id: v.pageId || null, kind: v.kind, full_name: v.name, category: v.category || '', links: v.links || '', note: v.note || '', status: 'pending', coins_held: price, created_at: new Date().toISOString() };
      db.vreqs.push(r); if (price) addCoins(-price, 'badge', r.id); save(); return r.id;
    },
    async cancelVerification(id) {
      const r = db.vreqs.find(x => x.id === id && x.user_id === meId && x.status === 'pending'); if (!r) throw new Error('আবেদন পাওয়া যায়নি');
      r.status = 'cancelled'; if (r.coins_held) addCoins(r.coins_held, 'refund', id); save();
    },
    async adminVerifyRequests() { return wait(db.vreqs.filter(r => r.status === 'pending').map(r => ({ ...toReq(r), user: user(r.user_id), page: r.page_id && pageOf(r.page_id) ? pageOut(pageOf(r.page_id)) : null }))); },
    async decideVerification(id, approve, note) {
      const r = db.vreqs.find(x => x.id === id && x.status === 'pending'); if (!r) throw new Error('আবেদন পাওয়া যায়নি');
      Object.assign(r, { status: approve ? 'approved' : 'rejected', admin_note: note || '', decided_at: new Date().toISOString() });
      const p = r.page_id ? pageOf(r.page_id) : person(r.user_id);
      if (approve && p) {
        if (r.kind === 'public_figure') Object.assign(p, { verified: 'authentic', verifiedUntil: null });
        else { const base = p.verified === 'paid' && new Date(p.verifiedUntil) > Date.now() ? new Date(p.verifiedUntil).getTime() : Date.now(); Object.assign(p, { verified: 'paid', verifiedUntil: new Date(base + sett('badgeDays') * 864e5).toISOString() }); }
      } else if (!approve && r.coins_held && r.user_id === meId) addCoins(r.coins_held, 'refund', id);
      if (r.user_id === meId) notify(meId, 'd6', approve ? 'verify_ok' : 'verify_no', null, null, r.page_id ? { page: pageOf(r.page_id)?.name } : null);
      save();
    },
    async adminSetPageBadge(pid, verified, days) { const p = pageOf(pid); if (p) Object.assign(p, { verified: verified || null, verifiedUntil: verified === 'paid' ? new Date(Date.now() + (days || 30) * 864e5).toISOString() : null }); save(); },
    async adminSetBadge(uid, verified, days) { const p = person(uid); if (p) Object.assign(p, { verified: verified || null, verifiedUntil: verified === 'paid' ? new Date(Date.now() + (days || 30) * 864e5).toISOString() : null }); save(); },
    async adminAdjustCoins(uid, amount, note) {
      const cur = uid === meId ? db.wallet.coins : (person(uid)?.coins || 0);
      if (cur + amount < 0) throw new Error('ব্যালান্স শূন্যের নিচে যাবে');
      if (uid === meId) addCoins(amount, 'admin', note || ''); else if (person(uid)) person(uid).coins = cur + amount;
      save();
    },
    async adminUserWallet(uid) { return wait({ coins: uid === meId ? db.wallet.coins : (person(uid)?.coins || 0) }); },
    async adminStats() {
      const all = [...PEOPLE, ...db.users];
      return wait({ users: all.length, donors: all.filter(p => p.bloodGroup && p.donorVisible !== false).length, manualDonors: db.manual.length,
        posts: db.posts.length, pendingServices: db.services.filter(x => !x.verified).length, openReports: 0 });
    },
    async manualDonor(id) { const m = db.manual.find(x => x.id === Number(id) && x.createdBy === meId); if (!m) throw new Error('not found'); return wait({ ...m }); },
    async addManualDonor(v) {
      if (db.manual.some(m => m.createdBy === meId && m.phone === v.phone)) throw new Error('duplicate key');
      db.manual.push({ id: nid(db.manual), createdBy: meId, ...v, unionId: v.unionId || null }); save();
    },
    async updateManualDonor(id, v) { const m = db.manual.find(x => x.id === Number(id) && x.createdBy === meId); if (!m) throw new Error('row-level security'); Object.assign(m, v, { unionId: v.unionId || null }); save(); },
    async deleteManualDonor(id) { db.manual = db.manual.filter(x => !(x.id === Number(id) && x.createdBy === meId)); save(); },
    async setLastDonated(date) { person(meId).lastDonated = date || ''; save(); },
    async setAvatar(blob, share = true) { const url = await toBlobUrl(blob); person(meId).avatar = url; save(); await this.createPost({ body: '', category: null, imageUrls: [url], kind: 'avatar', privacy: share ? 'public' : 'only_me' }); return url; },
    async setCover(blob, share = true) { const url = await toBlobUrl(blob); person(meId).cover = url; save(); await this.createPost({ body: '', category: null, imageUrls: [url], kind: 'cover', privacy: share ? 'public' : 'only_me' }); return url; },
    async removeCover() { person(meId).cover = ''; save(); },
    async useOldPhoto(kind, url) { if (kind === 'cover') person(meId).cover = url; else person(meId).avatar = url; save(); return wait(); },
    async photos(userId, { albumId, kind, pageId } = {}) {
      const mine = this.__visiblePosts().filter(p => (pageId ? p.pageId === Number(pageId) : p.userId === userId && !p.pageId) && !p.groupId && (!albumId || p.albumId === Number(albumId)) && (!kind || inVirtual(kind, p)));
      return wait(flattenPhotos(mine.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(p => ({ id: p.id, createdAt: p.createdAt, images: (p.images?.length ? p.images : (p.image ? [p.image] : [])).map(demoPic) }))));
    },
    async albums(userId, pageId) {
      const posts = this.__visiblePosts().filter(p => (pageId ? p.pageId === Number(pageId) : p.userId === userId && !p.pageId) && !p.groupId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(p => ({ id: p.id, kind: p.kind || 'normal', albumId: p.albumId || null, createdAt: p.createdAt, images: (p.images?.length ? p.images : (p.image ? [p.image] : [])).map(demoPic) }));
      const pack = (id, name, privacy, rows, own) => { const ph = flattenPhotos(rows); return { id, name, privacy, count: ph.length, cover: ph[0]?.url || '', virtual: !own }; };
      const out = Object.entries(VIRTUAL_ALBUMS).map(([k, name]) => pack(k, name, 'public', posts.filter(p => inVirtual(k, p)), false)).filter(a => a.count);
      const own = db.albums.filter(a => (pageId ? a.pageId === Number(pageId) : a.userId === userId && !a.pageId) && albumVisible(a)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return wait([...out, ...own.map(a => pack(a.id, a.name, a.privacy, posts.filter(p => p.albumId === a.id), true))]);
    },
    async createAlbum({ name, privacy, pageId }) { const a = { id: nid(db.albums), userId: meId, pageId: pageId ? Number(pageId) : null, name, privacy: pageId ? 'public' : (privacy || 'public'), createdAt: new Date().toISOString() }; db.albums.push(a); save(); return a.id; },
    async setPageAvatar(pageId, blob, share = true) { const url = await toBlobUrl(blob), pg = pageOf(pageId); pg.avatar = url; save(); if (share) await this.createPost({ body: '', category: null, imageUrls: [url], kind: 'avatar', pageId }); return url; },
    async setPageCover(pageId, blob, share = true) { const url = await toBlobUrl(blob), pg = pageOf(pageId); pg.cover = url; save(); if (share) await this.createPost({ body: '', category: null, imageUrls: [url], kind: 'cover', pageId }); return url; },
    async removePageCover(pageId) { const pg = pageOf(pageId); if (pg) pg.cover = ''; save(); },
    async updateAlbum(id, { name, privacy }) {
      const a = db.albums.find(x => x.id === Number(id) && x.userId === meId); if (!a) throw new Error('row-level security');
      if (privacy && privacy !== a.privacy) db.posts.filter(p => p.albumId === a.id).forEach(p => { p.privacy = privacy; });
      Object.assign(a, { name, privacy }); save();
    },
    async deleteAlbum(id) { db.albums = db.albums.filter(a => !(a.id === Number(id) && a.userId === meId)); db.posts.forEach(p => { if (p.albumId === Number(id)) p.albumId = null; }); save(); },
    __visiblePosts() {
      const myFriends = meId ? new Set(friendIds(meId)) : new Set();
      return db.posts.filter(p => !isBlocked(p.userId) && (p.pageId || p.groupId || !lockedOut(p.userId)) && (!p.privacy || p.privacy === 'public' || p.userId === meId || (p.privacy === 'friends' && myFriends.has(p.userId))));
    },
    async deleteAccount() {
      const id = meId;
      db.users = db.users.filter(u => u.id !== id); db.posts = db.posts.filter(p => p.userId !== id);
      db.friendships = db.friendships.filter(f => f.requester !== id && f.addressee !== id);
      db.messages = db.messages.filter(m => m.from !== id && m.to !== id);
      const myGroups = db.groups.filter(g => g.ownerId === id).map(g => g.id), myPages = db.pages.filter(x => x.ownerId === id).map(x => x.id);
      db.groups = db.groups.filter(g => g.ownerId !== id); db.pages = db.pages.filter(x => x.ownerId !== id); db.manual = db.manual.filter(m => m.createdBy !== id);
      db.members = db.members.filter(m => m.userId !== id && !myGroups.includes(m.groupId));
      db.posts = db.posts.filter(p => !myGroups.includes(p.groupId) && !myPages.includes(p.pageId));
      meId = null; save();
    },

    async posts({ scope = 'area', unionId, category, before, userId, postId, q, groupId, pageId, saved, ids, urgent, memories }) {
      const myFriends = meId ? new Set(friendIds(meId)) : new Set();
      const visible = db.posts.filter(p => (!p.groupId || canSeeGroup(p.groupId))
        && (!p.privacy || p.privacy === 'public' || p.userId === meId || (p.privacy === 'friends' && myFriends.has(p.userId))));
      if (urgent) return this.__map(visible.filter(p => p.category === 'সাহায্য চাই' && !p.resolvedAt && !p.groupId && Date.now() - new Date(p.createdAt) < 864e5 && (!unionId || p.unionId === unionId) && !isBlocked(p.userId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3));
      if (ids) return this.__map(visible.filter(p => ids.includes(p.id) && !isBlocked(p.userId)));
      if (memories) { const md = DHAKA_MD(new Date().toISOString()), yr = new Date().getFullYear(); return this.__map(visible.filter(p => p.userId === meId && !p.pageId && !p.groupId && DHAKA_MD(p.createdAt) === md && new Date(p.createdAt).getFullYear() < yr).sort((a, b) => b.createdAt.localeCompare(a.createdAt))); }
      if (postId || q || saved) {
        const t = (q || '').trim().toLowerCase();
        const savedIds = db.saved.filter(x => x.startsWith(meId + ':')).map(x => Number(x.split(':')[1]));
        const hits = visible.filter(p => (postId ? p.id === Number(postId) : saved ? savedIds.includes(p.id) : p.body.toLowerCase().includes(t)) && !isBlocked(p.userId));
        if (saved) hits.sort((a, b) => savedIds.indexOf(b.id) - savedIds.indexOf(a.id)); else hits.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return this.__map(hits.slice(0, saved ? 100 : PAGE));
      }
      const circle = scope === 'friends' && meId ? new Set([meId, ...friendIds(meId), ...db.follows.filter(f => f.startsWith(meId + ':')).map(f => f.split(':')[1])]) : null;
      const myPages = new Set(db.pageFollows.filter(f => f.startsWith(meId + ':')).map(f => Number(f.split(':')[1])));
      const rows = visible.filter(p => (groupId ? p.groupId === Number(groupId)
          : pageId ? p.pageId === Number(pageId)
          : userId ? p.userId === userId && !p.pageId && !p.groupId
          : !p.groupId && (circle ? (p.pageId ? myPages.has(p.pageId) : circle.has(p.userId)) : (!unionId || p.unionId === unionId)) && !isBlocked(p.userId))
        && (!category || p.category === category) && (!before || p.createdAt < before))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const marks = db.friendMarks || {}, feed = !groupId && !pageId && !userId, nowI = new Date().toISOString();
      const rows2 = (feed ? rows.filter(p => p.pageId || !(marks[p.userId]?.snoozeUntil > nowI)) : rows).slice(0, PAGE);
      return this.__map(rows2).then(list => list.map(x => ({ ...x, closeFriend: feed && !x.pageId && !!marks[x.userId]?.close })));
    },
    __map(rows) {
      return wait(rows.map(p => {
        const u = user(p.userId) || { name: 'সদস্য', avatar: '' }, pg = p.pageId && pageOf(p.pageId), g = p.groupId && db.groups.find(x => x.id === p.groupId);
        const sp = p.sharedPostId ? db.posts.find(x => x.id === p.sharedPostId) : null, spPg = sp?.pageId && pageOf(sp.pageId), spU = sp && user(sp.userId);
        const imgs = (p.images?.length ? p.images : (p.image ? [p.image] : [])).map(demoPic);
        return { id: p.id, body: p.body, image: imgs[0] || '', images: imgs, privacy: p.privacy || 'public', tags: (p.tags || []).map(uid => user(uid)).filter(Boolean).map(u => ({ id: u.id, name: u.name })),
          mentions: (p.mentions || []).map(uid => user(uid)).filter(Boolean).map(u => ({ id: u.id, name: u.name })),
          category: p.category, createdAt: p.createdAt, editedAt: p.editedAt || null, rawImages: p.images?.length ? p.images : (p.image ? [p.image] : []), likes: p.likes, comments: p.cm.length, userId: p.userId,
          shares: db.posts.filter(x => x.sharedPostId === p.id).length, saves: (p.sv || 0) + db.saved.filter(k => k.endsWith(':' + p.id)).length, pinnedCommentId: p.pinned || null, sharedPostId: p.sharedPostId || null, sharedMissing: !!p.sharedPostId && !sp,
          shared: sp ? { id: sp.id, body: sp.body, image: demoPic(sp.images?.[0] || sp.image || ''), createdAt: sp.createdAt, userId: sp.userId, pageId: sp.pageId || null, author: spPg ? spPg.name : spU?.name || 'সদস্য', avatar: spPg ? spPg.avatar : spU?.avatar || '', badge: spPg ? badgeOf(spPg) : (spU?.verified || '') } : null,
          author: pg ? pg.name : u.name, avatar: pg ? pg.avatar : u.avatar, badge: pg ? badgeOf(pg) : (u.verified || ''), poster: u.name, union: uname(p.unionId), liked: db.likes.includes(meId + ':' + p.id),
          reactions: p.rx || { like: p.likes }, myReaction: db.reacts[meId + ':' + p.id] || (db.likes.includes(meId + ':' + p.id) ? 'like' : ''),
          saved: db.saved.includes(meId + ':' + p.id), pageId: p.pageId || null, groupId: p.groupId || null, groupName: g ? g.name : '',
          bg: p.bg || '', poll: p.poll || null, eventAt: p.eventAt || null, eventPlace: p.eventPlace || '', link: p.link || null, resolvedAt: p.resolvedAt || null, bloodGroup: p.bloodGroup || '', lifeEvent: p.lifeEvent || '', lifeDate: p.lifeDate || '',
          ...(p.poll ? { votes: p.poll.map((_, i) => Object.values(db.votes[p.id] || {}).filter(v => v === i).length), myVote: db.votes[p.id]?.[meId] ?? null } : { votes: [], myVote: null }),
          going: (db.going[p.id] || []).length, meGoing: (db.going[p.id] || []).includes(meId),
          views: p.userId === meId ? demoViews(p).views : 0, kind: p.kind || 'normal', albumId: p.albumId || null, albumName: p.albumId ? (db.albums.find(a => a.id === p.albumId && albumVisible(a))?.name || '') : '' };
      }));
    },
    async savePost(id) { if (!db.saved.includes(meId + ':' + id)) db.saved.push(meId + ':' + id); save(); },
    async untagMe(postId) { const p = db.posts.find(x => x.id === Number(postId)); if (p) p.tags = (p.tags || []).filter(u => u !== meId); save(); },
    async updatePost(id, { body, category, images = [], privacy, tags = [], mentions = [] }) {
      const p = db.posts.find(x => x.id === Number(id)); if (!p || p.userId !== meId) throw new Error('row-level security');
      const imgs = []; for (const x of images.slice(0, 10)) imgs.push(typeof x === 'string' ? x : await toBlobUrl(x));
      if (!(body || '').trim() && !imgs.length && !p.sharedPostId) throw new Error('check constraint');
      const fr = new Set(friendIds(meId)), old = new Set(p.tags || []);
      Object.assign(p, { body: body || '', category, images: imgs, image: imgs[0] || '', privacy: p.pageId || p.groupId ? 'public' : (privacy || 'public'), editedAt: new Date().toISOString() });
      if (!p.pageId && !p.groupId) { p.tags = tags.filter(uid => fr.has(uid)); p.tags.filter(uid => !old.has(uid)).forEach(uid => notify(uid, meId, 'tag', p.id)); }
      p.mentions = mentionNotify(p, mentions, meId, p.mentions || []);
      save();
    },
    async unsavePost(id) { db.saved = db.saved.filter(x => x !== meId + ':' + id); save(); },
    async changePassword(pw, oldPw) { const p = person(meId); if (oldPw != null && p.password !== oldPw) throw new Error('wrong password'); p.password = pw; save(); },
    async sendPasswordReset() { return wait(); },
    onPasswordRecovery() {},
    async changeName(name) { person(meId).name = name.trim(); save(); return wait(); },
    async changeUsername(u) { if (u && [...PEOPLE, ...db.users].some(x => x.id !== meId && (x.username || '').toLowerCase() === u)) throw new Error('duplicate key value violates unique constraint "profiles_username_key"'); person(meId).username = u || ''; save(); return wait(); },
    async changePhone(phone) { person(meId).phone = phone || ''; save(); return wait(); },
    async changeEmail(email, password) { const p = person(meId); if (p.password !== password) throw new Error('wrong password'); p.email = email.trim(); save(); return wait(); },

    async myPages() { return wait([...db.pages.filter(x => x.ownerId === meId).map(pageOut), ...db.pages.filter(x => db.pageAdmins.includes(x.id + ':' + meId)).map(x => ({ ...pageOut(x), isAdmin: true }))]); },
    async followedPages() { return wait(db.pageFollows.filter(f => f.startsWith(meId + ':')).map(f => pageOf(f.split(':')[1])).filter(Boolean).map(pageOut)); },
    async discoverPages({ q } = {}) { const t = (q || '').toLowerCase(); return wait(db.pages.filter(x => !t || x.name.toLowerCase().includes(t)).map(pageOut).sort((a, b) => b.followers - a.followers)); },
    async page(id) {
      const pg = pageOf(id); if (!pg) throw new Error('not found');
      const isOwner = pg.ownerId === meId, isAdmin = !isOwner && db.pageAdmins.includes(pg.id + ':' + meId);
      return wait({ ...pageOut(pg), following: db.pageFollows.includes(meId + ':' + pg.id), isOwner, isAdmin, canManage: isOwner || isAdmin });
    },
    async pageAdmins(pageId) { return wait(db.pageAdmins.filter(k => k.startsWith(pageId + ':')).map(k => user(k.split(':')[1])).filter(Boolean)); },
    async addPageAdmin(pageId, uid) {
      const pg = pageOf(pageId); if (!pg || pg.ownerId !== meId) throw new Error('শুধু পেইজের মালিক অ্যাডমিন যোগ করতে পারেন');
      if (db.pageAdmins.filter(k => k.startsWith(pageId + ':')).length >= 10) throw new Error('সর্বোচ্চ ১০ জন অ্যাডমিন রাখা যায়');
      if (!db.pageAdmins.includes(pageId + ':' + uid)) db.pageAdmins.push(pageId + ':' + uid); save();
    },
    async removePageAdmin(pageId, uid) { db.pageAdmins = db.pageAdmins.filter(k => k !== pageId + ':' + uid); save(); },
    async pinPagePost(pageId, postId) { const pg = pageOf(pageId); if (pg) pg.pinnedPostId = postId || null; save(); },
    async pinProfilePost(postId) {
      const p = postId && db.posts.find(x => x.id === Number(postId));
      if (postId && (!p || p.userId !== meId || p.pageId || p.groupId)) throw new Error('not allowed');
      person(meId).pinnedPostId = postId ? Number(postId) : null; save(); return wait();
    },
    async setFaqs(pageId, faqs) { const pg = pageOf(pageId); if (pg) pg.faqs = faqs; save(); },
    async askFaq(pageId, idx) {
      const pg = pageOf(pageId), it = pg?.faqs?.[idx]; if (!it) throw new Error('প্রশ্ন পাওয়া যায়নি');
      const t = Date.now();
      db.messages.push({ id: nid(db.messages), from: meId, to: pg.ownerId, body: it.q, pageId: pg.id, createdAt: new Date(t).toISOString(), read: false });
      db.messages.push({ id: nid(db.messages) + 1, from: pg.ownerId, to: meId, body: it.a, pageId: pg.id, auto: true, createdAt: new Date(t + 1).toISOString(), read: false }); save();
    },
    async createPage({ name, category, about, phone, avatar }) {
      const pg = { id: nid(db.pages), ownerId: meId, name, category, about: about || '', phone: phone || '', avatar: avatar ? await toBlobUrl(avatar) : '' };
      db.pages.push(pg); save(); return pageOut(pg);
    },
    async updatePage(id, v) { const pg = pageOf(id); Object.assign(pg, { name: v.name, category: v.category, about: v.about || '', phone: v.phone || '', address: v.address || '', lat: v.lat ?? null, lng: v.lng ?? null }); if (v.avatar) pg.avatar = await toBlobUrl(v.avatar); save(); },
    async deletePage(id) { db.pages = db.pages.filter(x => x.id !== Number(id)); db.posts = db.posts.filter(p => p.pageId !== Number(id)); save(); },
    async followPage(id) { if (!db.pageFollows.includes(meId + ':' + id)) db.pageFollows.push(meId + ':' + id); save(); },
    async unfollowPage(id) { db.pageFollows = db.pageFollows.filter(f => f !== meId + ':' + id); save(); },

    async myGroups() { return wait(db.members.filter(m => m.userId === meId).map(m => ({ ...groupOut(db.groups.find(g => g.id === m.groupId)), role: m.role, status: m.status }))); },
    async discoverGroups({ q } = {}) { const t = (q || '').toLowerCase(); return wait(db.groups.filter(g => !t || g.name.toLowerCase().includes(t)).map(groupOut).sort((a, b) => b.members - a.members)); },
    async group(id) {
      const g = db.groups.find(x => x.id === Number(id)); if (!g) throw new Error('not found');
      const m = member(g.id, meId); return wait({ ...groupOut(g), role: m?.role || null, status: m?.status || null, isOwner: g.ownerId === meId });
    },
    async createGroup({ name, about, privacy, avatar }) {
      const g = { id: nid(db.groups), ownerId: meId, name, about: about || '', privacy, avatar: avatar ? await toBlobUrl(avatar) : '' };
      db.groups.push(g); db.members.push({ groupId: g.id, userId: meId, role: 'admin', status: 'active' }); save();
      if (privacy === 'private') { const uid = meId; setTimeout(() => { db.members.push({ groupId: g.id, userId: 'd2', role: 'member', status: 'pending' }); notify(uid, 'd2', 'group_request', null, g.id); }, 4000); }
      return groupOut(g);
    },
    async updateGroup(id, v) { const g = db.groups.find(x => x.id === Number(id)); Object.assign(g, { name: v.name, about: v.about || '', privacy: v.privacy }); if (v.avatar) g.avatar = await toBlobUrl(v.avatar); save(); },
    async deleteGroup(id) { id = Number(id); db.groups = db.groups.filter(g => g.id !== id); db.members = db.members.filter(m => m.groupId !== id); db.posts = db.posts.filter(p => p.groupId !== id); save(); },
    async joinGroup(id) {
      const g = db.groups.find(x => x.id === Number(id)); if (member(g.id, meId)) return member(g.id, meId).status;
      const status = g.privacy === 'public' ? 'active' : 'pending';
      db.members.push({ groupId: g.id, userId: meId, role: 'member', status }); save();
      if (status === 'pending' && g.ownerId.startsWith('d')) { const uid = meId; setTimeout(() => { const m = member(g.id, uid); if (m && m.status === 'pending') { m.status = 'active'; notify(uid, g.ownerId, 'group_approved', null, g.id); } }, 3000); }
      return status;
    },
    async leaveGroup(id) { db.members = db.members.filter(m => !(m.groupId === Number(id) && m.userId === meId)); save(); },
    async groupMembers(id, status = 'active') { return wait(db.members.filter(m => m.groupId === Number(id) && m.status === status).map(m => ({ ...user(m.userId), role: m.role })).filter(u => u.id)); },
    async approveMember(gid, uid) { const m = member(gid, uid); if (!m) throw new Error('no pending request'); m.status = 'active'; db.notifs = db.notifs.filter(n => !(n.groupId === Number(gid) && n.from === uid && n.type === 'group_request')); save(); },
    async removeMember(gid, uid) { db.members = db.members.filter(m => !(m.groupId === Number(gid) && m.userId === uid)); save(); },
    async createPost({ body, category, image, images, pageId, groupId, sharedPostId, privacy, tags, mentions, albumId, kind = 'normal', imageUrls, bg, poll, eventAt, eventPlace, link, bloodGroup, lifeEvent, lifeDate }) {
      const files = images?.length ? images.slice(0, 10) : image ? [image] : [];
      const imgs = [...(imageUrls || [])]; for (const f of files) imgs.push(await toBlobUrl(f));
      if (poll && (poll.length < 2 || poll.length > 4 || poll.some(o => !o.trim() || o.length > 80))) throw new Error('bad poll option');
      if (albumId && !db.albums.some(a => a.id === Number(albumId) && a.userId === meId)) throw new Error('row-level security');
      const img = imgs[0] || '';
      if (sharedPostId) { const o = db.posts.find(x => x.id === Number(sharedPostId)), g = o?.groupId && db.groups.find(x => x.id === o.groupId); if (!o || (g && g.privacy === 'private')) throw new Error('row-level security'); }
      const fr = new Set(friendIds(meId));
      const post = { id: nid(db.posts), userId: meId, pageId: pageId ? Number(pageId) : null, groupId: groupId ? Number(groupId) : null, sharedPostId: sharedPostId ? Number(sharedPostId) : null, unionId: person(meId).unionId, category, body: body || '', image: img, images: imgs,
        privacy: pageId || groupId ? 'public' : (privacy || 'public'), tags: (tags || []).filter(uid => fr.has(uid)), createdAt: new Date().toISOString(), likes: 0, cm: [],
        albumId: albumId ? Number(albumId) : null, kind, bg: bg || '', poll: poll?.length ? poll : null, eventAt: eventAt || null, eventPlace: eventPlace || '', link: link || null, bloodGroup: bloodGroup || '', lifeEvent: lifeEvent || '', lifeDate: lifeDate || '' };
      post.tags.forEach(uid => notify(uid, meId, 'tag', post.id));
      post.mentions = mentionNotify(post, mentions, meId);
      if (post.sharedPostId) { const o = db.posts.find(x => x.id === post.sharedPostId); db.posts.push(post); save(); notify(o.userId, meId, 'share', o.id); earn('share', o.id, o.userId); return; }
      db.posts.push(post); save();
      if (kind === 'normal') earn('post', post.id, null);
      // ডেমো: কিছুক্ষণ পর নমুনা মানুষেরা লাইক ও মন্তব্য করে, যাতে নোটিফিকেশন দেখা যায়
      const uid = meId;
      setTimeout(() => { if (!db.posts.includes(post)) return; reactAs('d2', post.id, 'love', ''); notify(uid, 'd2', 'like', post.id); }, 3000);
      setTimeout(() => { if (!db.posts.includes(post)) return; post.cm.push({ id: Date.now(), userId: 'd4', body: 'খুব ভালো লাগলো 👍', createdAt: new Date().toISOString() }); notify(uid, 'd4', 'comment', post.id); }, 5000);
    },
    async setDonorReady(on) { person(meId).donorReady = !!on; save(); return wait(); },
    async mutualFriends(uid) { if (!meId || uid === meId) return wait({ count: 0, list: [] }); const mine = new Set(friendIds(meId)); const l = friendIds(uid).filter(x => mine.has(x) && !isBlocked(x)).map(user).filter(Boolean); return wait({ count: l.length, list: l.slice(0, 3).map(u => ({ id: u.id, name: u.name, avatar: u.avatar })) }); },
    async lifeEvents(uid) {
      const fr = meId ? new Set(friendIds(meId)) : new Set();
      return wait(db.posts.filter(p => p.userId === uid && p.lifeEvent && !p.pageId && !p.groupId && (p.privacy === 'public' || !p.privacy || uid === meId || (p.privacy === 'friends' && fr.has(uid))))
        .sort((a, b) => (b.lifeDate || b.createdAt).localeCompare(a.lifeDate || a.createdAt)).map(p => ({ id: p.id, body: p.body, type: p.lifeEvent, date: p.lifeDate || p.createdAt.slice(0, 10) })));
    },
    async trendingTags() {
      const m = new Map(), since = new Date(Date.now() - 7 * 864e5).toISOString();
      for (const p of db.posts) if (p.createdAt > since && (p.privacy || 'public') === 'public' && !p.groupId)
        for (const t of new Set([...(' ' + (p.body || '')).matchAll(/[\s(]#([^\s#.,!?।:;()\[\]{}"'<>/\\]{2,40})/g)].map(x => x[1].toLowerCase()))) m.set(t, (m.get(t) || 0) + 1);
      return wait([...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([tag, n]) => ({ tag, n })));
    },
    async birthdays() {
      if (!meId) return wait([]);
      const t = new Date(Date.now() + 6 * 36e5), md = `-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
      return wait(friendIds(meId).map(user).filter(u => u && u.birthDate && u.birthDate.endsWith(md)).map(u => ({ id: u.id, name: u.name, avatar: u.avatar })));
    },
    async resolvePost(id, on) { const p = db.posts.find(x => x.id === Number(id)); if (!p || p.userId !== meId) throw new Error('not allowed'); p.resolvedAt = on ? new Date().toISOString() : null; save(); return wait(); },
    async votePoll(id, opt) { const p = db.posts.find(x => x.id === Number(id)); if (!p?.poll) throw new Error('no poll'); const v = db.votes[p.id] = db.votes[p.id] || {}; if (opt == null) delete v[meId]; else v[meId] = opt; save(); return wait(); },
    async setGoing(id, on) {
      const g = db.going[id] = (db.going[id] || []).filter(u => u !== meId); if (on) g.push(meId); save();
      // ডেমো: অনুষ্ঠান ২৪ ঘণ্টার মধ্যে হলে কিছুক্ষণ পর রিমাইন্ডার (আসল অ্যাপে সার্ভার প্রতি ঘণ্টায় পাঠায়)
      const p = db.posts.find(x => x.id === Number(id)), uid = meId;
      if (on && p?.eventAt && new Date(p.eventAt) - Date.now() < 864e5 && !db.notifs.some(n => n.to === uid && n.type === 'event_reminder' && n.postId === p.id))
        setTimeout(() => notify(uid, p.userId, 'event_reminder', p.id, null, { at: p.eventAt, place: p.eventPlace }), 4000);
      return wait();
    },
    async linkPreview(url) {   // ডেমোতে ইন্টারনেটে যাওয়া হয় না, নমুনা প্রিভিউ
      let h = ''; try { h = new URL(url).hostname.replace(/^www\./, ''); } catch { return null; }
      return wait({ url, title: h === 'prothomalo.com' ? 'প্রথম আলো: সর্বশেষ খবর' : `${h} — লিংকের শিরোনাম`, desc: 'ডেমো প্রিভিউ: আসল অ্যাপে লিংকের পাতার শিরোনাম, বিবরণ ও ছবি দেখাবে।', site: h });
    },
    async stories() {
      purgeStories();
      const fr = meId ? new Set(friendIds(meId)) : new Set();
      return wait(db.stories.filter(x => !isBlocked(x.userId) && (x.userId === meId || x.privacy === 'public' || fr.has(x.userId)) && !lockedOut(x.userId))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map(x => { const u = user(x.userId) || { name: 'সদস্য', avatar: '' }; return { id: x.id, userId: x.userId, kind: x.kind, body: x.body || '', bg: x.bg || 'g1', privacy: x.privacy, createdAt: x.createdAt, expiresAt: x.expiresAt, name: u.name, avatar: u.avatar }; }));
    },
    async storyImage(id) { return wait(db.stories.find(x => x.id === id)?.image || ''); },
    async createStory({ kind, body, bg, blob, privacy }) {
      purgeStories();
      if (db.stories.filter(x => x.userId === meId).length >= 15) throw new Error('story limit');
      const image = blob ? await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); }) : null;
      const now = Date.now();
      db.stories.push({ id: nid(db.stories), userId: meId, kind, body: body || '', bg: kind === 'text' ? bg : null, image, privacy: privacy || 'public', createdAt: new Date(now).toISOString(), expiresAt: new Date(now + 864e5).toISOString() });
      save(); return wait();
    },
    async deleteStory(id) { db.stories = db.stories.filter(x => !(x.id === id && x.userId === meId)); save(); return wait(); },
    async storySeen(ids) { for (const id of ids) { const st = db.stories.find(x => x.id === id); if (!st || st.userId === meId) continue; const v = db.storyViews[id] = db.storyViews[id] || []; if (!v.some(x => x.id === meId)) v.push({ id: meId, at: new Date().toISOString() }); } save(); },
    async storyViewers(id) { return wait((db.storyViews[id] || []).map(v => { const u = user(v.id) || { name: 'সদস্য' }; return { id: v.id, name: u.name, avatar: u.avatar || '', seenAt: v.at }; }).reverse()); },
    async myStoryViews() { return wait(new Map(db.stories.filter(x => x.userId === meId).map(x => [x.id, (db.storyViews[x.id] || []).length]))); },
    async deletePost(id) { db.posts = db.posts.filter(p => p.id !== id); save(); },
    async react(id, reaction, prev) { reactAs(meId, id, reaction, prev); },
    async comments(postId, sort = 'old') {
      const list = (db.posts.find(p => p.id === Number(postId))?.cm || []).filter(c => !isBlocked(c.userId)).map(c => ({ ...c, mentions: (c.mentions || []).map(uid => user(uid)).filter(Boolean).map(u => ({ id: u.id, name: u.name })), author: c.pageId && pageOf(c.pageId) ? pageOf(c.pageId).name : user(c.userId)?.name || 'সদস্য', avatar: c.pageId && pageOf(c.pageId) ? pageOf(c.pageId).avatar || '' : user(c.userId)?.avatar || '', badge: c.pageId && pageOf(c.pageId) ? badgeOf(pageOf(c.pageId)) : user(c.userId)?.verified || '', pageId: c.pageId || null,
        likes: c.likes || 0, reactions: c.rx || {}, myReaction: (c.rk || {})[meId] || '' }));
      list.sort((a, b) => sort === 'top' ? (b.likes - a.likes) || a.createdAt.localeCompare(b.createdAt) : sort === 'new' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt));
      return wait(list);
    },
    async reactComment(id, reaction, prev) {
      for (const p of db.posts) for (const c of p.cm) if (c.id === id) {
        c.rx = c.rx || {}; c.rk = c.rk || {}; c.likes = c.likes || 0;
        if (prev) c.rx[prev] = Math.max((c.rx[prev] || 0) - 1, 0);
        if (reaction) { c.rx[reaction] = (c.rx[reaction] || 0) + 1; c.rk[meId] = reaction; } else delete c.rk[meId];
        c.likes += (reaction ? 1 : 0) - (prev ? 1 : 0);
      }
      save();
    },
    async reactors(kind, id) {
      let named = [], total = 0;
      if (kind === 'comment') {
        for (const p of db.posts) for (const c of p.cm) if (c.id === Number(id)) { named = Object.entries(c.rk || {}); total = c.likes || 0; }
      } else {
        const p = db.posts.find(x => x.id === Number(id)); total = p?.likes || 0;
        named = db.likes.filter(k => k.endsWith(':' + id)).map(k => { const uid = k.slice(0, k.lastIndexOf(':')); return [uid, db.reacts[k] || 'like']; });
      }
      const list = named.filter(([uid]) => person(uid) && !isBlocked(uid)).map(([uid, reaction]) => ({ ...user(uid), reaction }));
      return wait({ list, unnamed: Math.max(total - list.length, 0) });   // ডেমোর নমুনা সংখ্যার সবার নাম নেই
    },
    async pinComment(postId, commentId) {
      const p = db.posts.find(x => x.id === Number(postId)); if (!p) throw new Error('post not found');
      // ডেমোতে সবাই অ্যাডমিন, তাই যেকোনো পোস্টে পিন করা যায় (আসল সার্ভারে: পোস্টের মালিক, গ্রুপ অ্যাডমিন বা অ্যাপ অ্যাডমিন)
      p.pinned = commentId || null; save();
    },
    async addComment(postId, body, parentId = null, mentions = [], pageId = null) {
      const p = db.posts.find(x => x.id === postId), parent = parentId && p.cm.find(c => c.id === parentId);
      if (parentId && (!parent || parent.parentId)) throw new Error('row-level security');
      const c = { id: Date.now(), userId: meId, body, createdAt: new Date().toISOString(), parentId: parentId || null, pageId: pageId || null }; p.cm.push(c);
      c.mentions = mentionNotify(p, mentions, meId);
      if (parent) notify(parent.userId, meId, 'reply', p.id);
      if (!parent || parent.userId !== p.userId) notify(p.userId, meId, 'comment', p.id);
      save();
      if (body.trim().length >= 3) earn('comment', p.id + ':' + c.id, p.userId);
      // ডেমো: নমুনা মানুষের মন্তব্যে উত্তর দিলে সে-ও কিছুক্ষণ পর উত্তর দেয়
      if (parent && parent.userId !== meId && person(parent.userId)) setTimeout(() => { if (!p.cm.includes(c)) return; p.cm.push({ id: Date.now(), userId: parent.userId, body: 'ধন্যবাদ 🙂', createdAt: new Date().toISOString(), parentId: parent.id }); notify(meId, parent.userId, 'reply', p.id); }, 4000);
    },
    async editComment(id, body, mentions = []) {
      for (const p of db.posts) for (const c of p.cm) if (c.id === id) { if (c.userId !== meId) throw new Error('not allowed'); c.body = body.trim(); c.editedAt = new Date().toISOString(); c.mentions = mentionNotify(p, mentions, meId, c.mentions || []); }
      save();
    },
    async deleteComment(id) { for (const p of db.posts) { p.cm = p.cm.filter(c => c.id !== id && c.parentId !== id); if (p.pinned === id) p.pinned = null; } save(); },

    async profile(id) {
      const u = user(id);
      if (!u) throw new Error('not found');
      // ডেমো: মালিকের প্রাইভেসি মেনে কাজ/শিক্ষা/সোশ্যাল/মোবাইল
      if (u.gone) return wait({ ...u, lockedOut: true, bio: '', avatar: '', cover: '', works: [], educations: [], social: {}, phone: '', orgs: [], featured: FEATURED0, friends: 0, followers: 0, following: 0, rel: rel(id) });
      if (lockedOut(id)) return wait({ ...u, lockedOut: true, bloodGroup: '', lastDonated: '', works: [], educations: [], social: {}, phone: '', orgs: [], featured: FEATURED0, friends: friendIds(id).length, followers: db.follows.filter(f => f.endsWith(':' + id)).length, following: db.follows.filter(f => f.startsWith(id + ':')).length, rel: rel(id) });
      const vis = { ...ABOUT_VIS0, ...(person(id).aboutVis || {}) };
      const can = v => id === meId || v === 'public' || (v === 'friends' && meId && friendIds(meId).includes(id));
      Object.assign(u, { works: can(vis.works) ? u.works : [], educations: can(vis.educations) ? u.educations : [], social: can(vis.social) ? u.social : {}, phone: can(vis.contact) ? (person(id).phone || '') : '', birthYear: can(vis.birth) ? (person(id).birthYear || 0) : 0, birthDate: can(vis.birth) ? (person(id).birthDate || '') : '', relationship: can(vis.relationship) ? (person(id).relationship || '') : '', religion: can(vis.religion) ? (person(id).religion || '') : '', orgs: can(vis.orgs) ? (person(id).orgs || []) : [], featured: person(id).featured || FEATURED0 });
      return wait({ ...u, friends: friendIds(id).length, followers: db.follows.filter(f => f.endsWith(':' + id)).length, following: db.follows.filter(f => f.startsWith(id + ':')).length, rel: rel(id) });
    },
    async usernameFree(u) { return wait(![...PEOPLE, ...db.users].some(x => x.id !== meId && (x.username || '').toLowerCase() === u.toLowerCase())); },
    async listPeople(uid, kind) {
      const u = user(uid); if (!u) throw new Error('not found');
      if (lockedOut(uid)) return wait({ hidden: true, locked: true, visibility: 'locked', list: [] });
      const vis = u[kind + 'Visibility'] || 'public';
      const allowed = uid === meId || vis === 'public' || (vis === 'friends' && meId && friendIds(meId).includes(uid));
      if (!allowed) return wait({ hidden: true, visibility: vis, list: [] });
      const ids = kind === 'friends' ? friendIds(uid) : kind === 'followers' ? db.follows.filter(f => f.endsWith(':' + uid)).map(f => f.split(':')[0]) : db.follows.filter(f => f.startsWith(uid + ':')).map(f => f.split(':')[1]);
      return wait({ hidden: false, visibility: vis, list: ids.filter(x => !isBlocked(x)).map(user).filter(Boolean) });
    },
    async setLock(on) { person(meId).locked = !!on; save(); return wait(); },
    async setListPrivacy(v) {
      const p = person(meId); for (const k of ['friends', 'followers', 'following']) if (v[k]) p[k + 'Visibility'] = v[k]; save();
    },
    async people({ q }) {
      const t = (q || '').trim().toLowerCase();
      const all = [...PEOPLE, ...db.users].map(p => user(p.id)).filter(u => u.id !== meId && !u.gone && !isBlocked(u.id));
      const me = meUser();
      const near = u => (me?.unionId && u.unionId === me.unionId ? 2 : 0) + (u.upazila === me?.upazila ? 1 : 0);
      const rows = t ? all.filter(u => u.name.toLowerCase().includes(t)) : all.sort((a, b) => near(b) - near(a));
      return wait(rows.slice(0, 30).map(u => ({ ...u, rel: rel(u.id) })));
    },
    async friendRequests() { return wait(db.friendships.filter(f => f.addressee === meId && f.status === 'pending' && !isBlocked(f.requester)).map(f => user(f.requester)).filter(u => u && !u.gone)); },
    async friends(of) { return wait(friendIds(of || meId).map(user).filter(u => u && !u.gone)); },
    async sendFriendRequest(id) {
      if (friendRow(meId, id)) throw new Error('already');
      const rule = person(id)?.friendReqFrom || 'everyone', mineF = new Set(friendIds(meId));
      if (rule === 'mutual' && !friendIds(id).some(x => mineF.has(x))) throw new Error('friend_req:mutual');
      if (rule === 'upazila' && !(person(id)?.unionId && meUser()?.unionId)) throw new Error('friend_req:upazila');
      db.friendships.push({ requester: meId, addressee: id, status: 'pending', createdAt: new Date().toISOString() });
      if (!db.follows.includes(meId + ':' + id)) db.follows.push(meId + ':' + id); save();
      // ডেমোতে নমুনা মানুষেরা কিছুক্ষণ পর রিকোয়েস্ট গ্রহণ করে
      const uid = meId;
      if (id.startsWith('d')) setTimeout(() => { const f = friendRow(uid, id); if (f && f.status === 'pending') { f.status = 'accepted'; notify(uid, id, 'friend_accept'); } }, 4000);
    },
    async acceptFriend(id) {
      const f = db.friendships.find(x => x.requester === id && x.addressee === meId && x.status === 'pending');
      if (!f) throw new Error('no pending request');
      f.status = 'accepted'; f.acceptedAt = new Date().toISOString(); if (!db.follows.includes(meId + ':' + id)) db.follows.push(meId + ':' + id);
      db.notifs = db.notifs.filter(n => !(n.to === meId && n.from === id && n.type === 'friend_request')); save();
    },
    // ---------- বন্ধু (২)
    async sentRequests() { return wait(db.friendships.filter(f => f.requester === meId && f.status === 'pending' && !isBlocked(f.addressee)).map(f => user(f.addressee) && { ...user(f.addressee), sentAt: f.createdAt || '' }).filter(u => u && !u.gone)); },
    async friendMeta(ids) {
      const mine = new Set(friendIds(meId));
      return wait(new Map(ids.map(id => { const u = person(id), f = friendRow(meId, id);
        return [id, { mutual: friendIds(id).filter(x => mine.has(x)).length, joinedAt: u?.joinedAt || '', since: f?.status === 'accepted' ? f.acceptedAt || f.createdAt || '' : null, posts: db.posts.filter(p => p.userId === id && !p.pageId && !p.groupId).length }]; })));
    },
    async suggestions() {
      const me0 = meUser(), mine = new Set(friendIds(meId)), hidden = new Set(db.sugHidden || []);
      const mySchools = new Set((me0?.educations || []).map(e => (e.school || '').trim().toLowerCase()).filter(Boolean));
      const out = [...PEOPLE, ...db.users].map(p => user(p.id)).filter(u => u && u.id !== meId && !u.gone && !isBlocked(u.id) && !friendRow(meId, u.id) && !hidden.has(u.id)).map(u => {
        const school = (u.educations || []).find(e => mySchools.has((e.school || '').trim().toLowerCase()))?.school || '';
        return { ...u, rel: { friend: 'none' }, mutual: friendIds(u.id).filter(x => mine.has(x)).length, sameArea: !!(me0?.unionId && u.unionId === me0.unionId), school, isNew: !!u.joinedAt && Date.now() - new Date(u.joinedAt) < 7 * 864e5 };
      });
      return wait(out.sort((a, b) => b.mutual - a.mutual || (!!b.school - !!a.school) || (b.sameArea - a.sameArea)).slice(0, 60));
    },
    async areaPeople(area) {
      const k = area.slice(0, 1), v = area.slice(2), me0 = meUser(), mine = new Set(friendIds(meId)), hidden = new Set(db.sugHidden || []);
      const mySchools = new Set((me0?.educations || []).map(e => (e.school || '').trim().toLowerCase()).filter(Boolean));
      return wait([...PEOPLE, ...db.users].map(p => user(p.id)).filter(u => u && u.id !== meId && !u.gone && !isBlocked(u.id) && !friendRow(meId, u.id) && !hidden.has(u.id) && (k === 'u' ? String(u.unionId) === v : !u.unionId && u.upazila === v))
        .map(u => ({ ...u, rel: { friend: 'none' }, mutual: friendIds(u.id).filter(x => mine.has(x)).length, sameArea: false, school: (u.educations || []).find(e => mySchools.has((e.school || '').trim().toLowerCase()))?.school || '', isNew: !!u.joinedAt && Date.now() - new Date(u.joinedAt) < 7 * 864e5 }))
        .sort((a, b) => b.mutual - a.mutual));
    },
    async hideSuggestion(id) { db.sugHidden = [...new Set([...(db.sugHidden || []), id])]; save(); return wait(); },
    async newNearMe() { const me0 = meUser(); return wait([...PEOPLE, ...db.users].map(p => user(p.id)).filter(u => u && u.id !== meId && me0?.unionId && u.unionId === me0.unionId && u.joinedAt && Date.now() - new Date(u.joinedAt) < 7 * 864e5).length); },
    async birthdaysUpcoming(days = 31) {
      const t0 = new Date(Date.now() + 6 * 36e5), today = Date.UTC(t0.getUTCFullYear(), t0.getUTCMonth(), t0.getUTCDate());
      return wait(friendIds(meId).map(user).filter(u => u && u.birthDate).map(u => {
        const [, m, d] = u.birthDate.split('-').map(Number); let y = t0.getUTCFullYear(), nd = Date.UTC(y, m - 1, d);
        if (nd < today) nd = Date.UTC(y + 1, m - 1, d);
        return { id: u.id, name: u.name, avatar: u.avatar, nextDate: new Date(nd).toISOString().slice(0, 10), days: Math.round((nd - today) / 864e5) };
      }).filter(x => x.days <= days).sort((a, b) => a.days - b.days));
    },
    async anniversaries() {
      const t0 = new Date(Date.now() + 6 * 36e5), md = t0.toISOString().slice(5, 10);
      return wait(db.friendships.filter(f => f.status === 'accepted' && (f.requester === meId || f.addressee === meId) && f.acceptedAt && f.acceptedAt.slice(5, 10) === md && t0.getUTCFullYear() - Number(f.acceptedAt.slice(0, 4)) >= 1)
        .map(f => { const u = user(f.requester === meId ? f.addressee : f.requester); return u && { id: u.id, name: u.name, avatar: u.avatar, years: t0.getUTCFullYear() - Number(f.acceptedAt.slice(0, 4)) }; }).filter(Boolean));
    },
    async acceptAllFriends() {
      const now = new Date().toISOString(); let n = 0;
      for (const f of db.friendships) if (f.addressee === meId && f.status === 'pending' && !isBlocked(f.requester)) { f.status = 'accepted'; f.acceptedAt = now; n++; if (!db.follows.includes(meId + ':' + f.requester)) db.follows.push(meId + ':' + f.requester); }
      save(); return wait(n);
    },
    async friendMarks() { db.friendMarks = db.friendMarks || {}; return new Map(Object.entries(db.friendMarks)); },
    async setFriendMark(id, patch) { db.friendMarks = db.friendMarks || {}; const cur = db.friendMarks[id] || { close: false, snoozeUntil: null }; db.friendMarks[id] = { close: patch.close ?? cur.close, snoozeUntil: patch.snoozeUntil !== undefined ? patch.snoozeUntil : cur.snoozeUntil }; save(); return wait(); },
    async friendLists() { return wait((db.friendLists || []).map(l => ({ ...l, members: [...l.members] }))); },
    async createFriendList(name) { db.friendLists = db.friendLists || []; if (db.friendLists.length >= 20) throw new Error('lists max 20'); if (db.friendLists.some(l => l.name === name.trim())) throw new Error('duplicate key'); const l = { id: nid(db.friendLists), name: name.trim(), members: [] }; db.friendLists.push(l); save(); return wait(l.id); },
    async renameFriendList(id, name) { const l = (db.friendLists || []).find(x => x.id === id); if (l) l.name = name.trim(); save(); return wait(); },
    async deleteFriendList(id) { db.friendLists = (db.friendLists || []).filter(x => x.id !== id); save(); return wait(); },
    async setListMember(listId, uid, on) { const l = (db.friendLists || []).find(x => x.id === listId); if (!l) return; l.members = l.members.filter(x => x !== uid); if (on) l.members.push(uid); save(); return wait(); },
    async setFriendReqFrom(v) { const p = person(meId); if (p) p.friendReqFrom = v; save(); return wait(); },
    async removeFriend(id) { const f = friendRow(meId, id); db.friendships = db.friendships.filter(x => x !== f); save(); },
    async followState() {
      if (!meId) return null;
      return wait({ users: new Set([meId, ...friendIds(meId), ...db.follows.filter(f => f.startsWith(meId + ':')).map(f => f.split(':')[1])]), pages: new Set(db.pageFollows.filter(f => f.startsWith(meId + ':')).map(f => Number(f.split(':')[1]))) });
    },
    async follow(id) { if (!db.follows.includes(meId + ':' + id)) db.follows.push(meId + ':' + id); save(); },
    async unfollow(id) { db.follows = db.follows.filter(f => f !== meId + ':' + id); save(); },
    async block(id) {
      db.blocks.push(meId + ':' + id);
      db.friendships = db.friendships.filter(f => f !== friendRow(meId, id));
      db.follows = db.follows.filter(f => f !== meId + ':' + id && f !== id + ':' + meId); save();
    },
    async unblock(id) { db.blocks = db.blocks.filter(b => b !== meId + ':' + id); save(); },
    async blockedList() { return wait(db.blocks.filter(b => b.startsWith(meId + ':')).map(b => user(b.split(':')[1])).filter(Boolean)); },

    // ---------- মেসেজ (ডেমো)
    async inbox() {
      const map = new Map(), mine = new Set(db.pages.filter(p => p.ownerId === meId).map(p => p.id));
      const label = m => (m.deletedAt ? '🚫 মেসেজটি মুছে ফেলা হয়েছে' : m.voice ? '🎤 ভয়েস মেসেজ' : m.image ? (m.body ? '📷 ' + m.body : '📷 ছবি') : m.sticker ? '✨ স্টিকার' : m.loc ? '📍 লোকেশন' : m.poll ? '📊 পোল: ' + m.poll.q : m.body);
      const nowIso = new Date().toISOString(); db.messages = db.messages.filter(m => !m.expiresAt || m.expiresAt > nowIso);
      for (const m of db.messages) {
        if (m.chatId || (m.from !== meId && m.to !== meId) || (m.hid || []).includes(meId)) continue;
        const other = m.from === meId ? m.to : m.from, key = other + ':' + (m.pageId || 0);
        if (isBlocked(other)) continue;
        const c = map.get(key) || { kind: m.pageId ? 'page' : 'dm', userId: other, pageId: m.pageId || null, chatId: null, unread: 0, members: 2 };
        if (!c.lastAt || m.createdAt >= c.lastAt) Object.assign(c, { last: label(m), lastAt: m.createdAt, lastMine: m.from === meId });
        if (m.to === meId && !m.read) c.unread++;
        map.set(key, c);
      }
      const fr = new Set(friendIds(meId));
      const out = [...map.values()].map(c => {
        const pg = c.pageId && pageOf(c.pageId), asPage = !!pg && mine.has(pg.id), set = db.convSet[demoKey({ kind: c.kind, id: c.userId, pageId: c.pageId })] || {};
        const request = !c.pageId && !set.accepted && !fr.has(c.userId) && !db.messages.some(m => m.from === meId && m.to === c.userId && !m.pageId && !m.chatId);
        return { ...c, asPage, pageName: pg?.name || '', name: pg && !asPage ? pg.name : user(c.userId)?.name || 'সদস্য', avatar: pg && !asPage ? pg.avatar || '' : user(c.userId)?.avatar || '', muted: !!set.muted, request, _cleared: set.clearedAt, unread: c.unread || (set.marked_unread ? 1 : 0) };
      }).filter(c => !c._cleared || c.lastAt > c._cleared);
      for (const g of db.chats.filter(g => g.members.some(x => x.id === meId))) {
        const me2 = g.members.find(x => x.id === meId), ms = db.messages.filter(m => m.chatId === g.id && !(m.hid || []).includes(meId)), lm = ms.at(-1), set = db.convSet['g:' + g.id] || {};
        const lastAt = lm?.createdAt || g.createdAt; if (set.clearedAt && lastAt <= set.clearedAt) continue;
        out.push({ kind: 'group', userId: null, pageId: null, chatId: g.id, asPage: false, pageName: '', name: g.name, avatar: g.photo || '', last: lm ? label(lm) : 'গ্রুপ তৈরি হয়েছে', lastAt, lastMine: lm?.from === meId,
          unread: Math.max(ms.filter(m => m.from !== meId && m.createdAt > me2.lastReadAt).length, set.marked_unread ? 1 : 0), muted: !!set.muted, request: false, members: g.members.length });
      }
      return wait(out.sort((a, b) => b.lastAt.localeCompare(a.lastAt)));
    },
    async conversations() { return (await this.inbox()).filter(c => c.kind !== 'group'); },
    // ব্যাজের হিসাব: সাধারণ চ্যাটের না-পড়া, আর নতুন (না-পড়া) মেসেজ রিকোয়েস্ট কতজনের
    async msgBadges() { const l = await this.inbox(); return { unread: l.filter(c => !c.asPage && !c.muted && !c.request).reduce((a, c) => a + c.unread, 0), requests: l.filter(c => c.request && c.unread > 0).length }; },
    async thread(t) {
      const set = db.convSet[demoKey(t)] || {};
      const rows = db.messages.filter(m => (t.kind === 'group' ? m.chatId === Number(t.id) : !m.chatId && ((m.from === meId && m.to === t.id) || (m.from === t.id && m.to === meId)) && (m.pageId || null) === (t.pageId ? Number(t.pageId) : null))
        && !(m.hid || []).includes(meId) && (!set.clearedAt || m.createdAt > set.clearedAt));
      const nowIso = new Date().toISOString();
      const msgs = rows.filter(m => !m.expiresAt || m.expiresAt > nowIso).map(m => {
        const counts = {}; Object.values(m.rx || {}).forEach(e => { counts[e] = (counts[e] || 0) + 1; });
        const r = m.replyTo && db.messages.find(x => x.id === m.replyTo), u = user(m.from) || { id: m.from, name: 'সদস্য', avatar: '' };
        return { id: m.id, mine: m.from === meId, senderId: m.from, sender: { id: u.id, name: u.name, avatar: u.avatar }, body: m.body || '', createdAt: m.createdAt, read: !!m.read, auto: !!m.auto,
          image: m.image || '', voice: m.voice || '', voiceSecs: m.voiceSecs || 0, deleted: !!m.deletedAt, reactions: counts, myReaction: (m.rx || {})[meId] || '',
          reply: r ? { id: r.id, body: r.body || '', mine: r.from === meId, image: !!r.image, voice: !!r.voice, deleted: !!r.deletedAt } : null,
          editedAt: m.editedAt || null, forwarded: !!m.forwarded, pinnedAt: m.pinnedAt || null, sticker: m.sticker || '', loc: m.loc || null, mentions: m.mentions || [], expiresAt: m.expiresAt || null, saved: (db.msgSaved || []).includes(m.id),
          poll: m.poll ? { q: m.poll.q, options: m.poll.options, votes: m.poll.options.map((_, i) => Object.values(m.votes || {}).filter(v => v === i).length), my: (m.votes || {})[meId] ?? null } : null };
      });
      const g = t.kind === 'group' && db.chats.find(x => x.id === Number(t.id));
      const members = g ? g.members.map(x => { const u = user(x.id) || { name: 'সদস্য', avatar: '' }; return { id: x.id, role: x.role, lastReadAt: x.lastReadAt, name: u.name, avatar: u.avatar }; }) : [];
      const sh = t.kind === 'page' || t.pageId ? {} : demoSh(t);
      return wait({ msgs, muted: !!set.muted, accepted: !!set.accepted, marked: !!set.marked_unread, members, shared: { theme: sh.theme || '', nicknames: sh.nicknames || {}, disappear: !!sh.disappear } });
    },
    async messages(id, pageId) { return (await this.thread({ kind: pageId ? 'page' : 'dm', id, pageId })).msgs; },
    async sendMessage(id, body, pageId, opts = {}) { return this.send({ kind: pageId ? 'page' : 'dm', id, pageId }, body, opts); },
    async send(t, body, { replyTo, image, voice, voiceSecs, sticker, loc, poll, mentions, forwarded, imagePath, voicePath } = {}) {
      const toData = b => b ? new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(b); }) : null;
      const dis = !t.pageId && t.kind !== 'page' && demoSh(t).disappear;
      if (dis && (image || voice || imagePath || voicePath)) throw new Error('disappearing: no media');
      if (poll && t.kind !== 'group') throw new Error('poll only in groups');
      const base = { id: nid(db.messages), from: meId, body: body || '', image: (await toData(image)) || imagePath || null, voice: (await toData(voice)) || voicePath || null, voiceSecs: voice || voicePath ? Math.round(voiceSecs || 1) : 0, replyTo: replyTo || null, createdAt: new Date().toISOString(), read: false, rx: {},
        sticker: sticker || null, loc: loc || null, poll: poll ? { q: poll.q.trim(), options: poll.options.map(o => o.trim()).filter(Boolean).slice(0, 6) } : null, forwarded: !!forwarded, expiresAt: dis ? new Date(Date.now() + 864e5).toISOString() : null };
      if (t.kind === 'group') { const g0 = db.chats.find(x => x.id === Number(t.id)); base.mentions = (mentions || []).filter(u => g0?.members.some(x => x.id === u && u !== meId)); }
      if (t.kind === 'group') {
        const g = db.chats.find(x => x.id === Number(t.id)); if (!g || !g.members.some(x => x.id === meId)) throw new Error('row-level security');
        if (g.adminsOnly && g.members.find(x => x.id === meId)?.role !== 'admin') throw new Error('admins only');
        db.messages.push({ ...base, chatId: g.id, to: null }); save();
        const other = g.members.find(x => x.id !== meId && String(x.id).startsWith('d'));
        if (other) setTimeout(() => { db.messages.push({ id: nid(db.messages), from: other.id, to: null, chatId: g.id, body: 'ঠিক আছে 👍 (ডেমো উত্তর)', createdAt: new Date().toISOString(), rx: {} }); g.members.forEach(x => { if (x.id === other.id) x.lastReadAt = new Date().toISOString(); }); save(); listeners.forEach(cb => cb({ type: 'new', from: other.id, chatId: g.id })); }, 1800);
        return;
      }
      const id = t.id;
      if (isBlocked(id)) throw new Error('blocked');
      const pid = t.pageId ? Number(t.pageId) : null, pg = pid && pageOf(pid);
      db.messages.push({ ...base, to: id, pageId: pid }); save();
      if (pg && pg.ownerId === id) {   // পেইজকে মেসেজ: অটো মেসেজ চালু থাকলে সাথে সাথে উত্তর (২৪ ঘণ্টায় একবার)
        const recent = db.messages.some(m => m.pageId === pid && m.from === id && m.to === meId && Date.now() - new Date(m.createdAt) < 864e5);
        if (pg.autoReplyOn && (pg.autoReply || '').trim() && !recent) setTimeout(() => {
          db.messages.push({ id: nid(db.messages), from: id, to: meId, body: pg.autoReply, pageId: pid, auto: true, createdAt: new Date().toISOString(), read: false }); save();
          listeners.forEach(cb => cb({ type: 'new', from: id, pageId: pid }));
        }, 600);
        return;
      }
      if (pid) return;
      if (String(id).startsWith('d')) {   // ডেমো: নমুনা মানুষ দেখে, লেখে, তারপর উত্তর দেয়
        setTimeout(() => { for (const m of db.messages) if (m.from === meId && m.to === id && !m.pageId) m.read = true; save(); listeners.forEach(cb => cb({ type: 'update', from: meId, to: id })); }, 900);
        setTimeout(() => typingListeners.forEach(fn => fn(id)), 1100);
        setTimeout(() => {
          const reply = 'ধন্যবাদ! (এটি ডেমো উত্তর — আসল অ্যাপে মানুষটি নিজে উত্তর দেবেন)';
          db.messages.push({ id: nid(db.messages), from: id, to: meId, body: reply, createdAt: new Date().toISOString(), read: false, rx: {} }); save();
          listeners.forEach(cb => cb({ type: 'new', from: id }));
        }, 2600);
      }
    },
    async fileUrls(paths) { return new Map(paths.filter(Boolean).map(p => [p, p])); },
    async reactMessage(id, emoji) { const m = db.messages.find(x => x.id === id); if (!m || m.deletedAt) return; m.rx = m.rx || {}; if (emoji) m.rx[meId] = emoji; else delete m.rx[meId]; save(); return wait(); },
    async unsendMessage(m0) { const m = db.messages.find(x => x.id === m0.id); if (!m || m.from !== meId) throw new Error('not allowed'); Object.assign(m, { deletedAt: new Date().toISOString(), body: '', image: null, voice: null, rx: {} }); save(); return wait(); },
    async editMessage(id, body) {
      const m = db.messages.find(x => x.id === id);
      if (!m || m.from !== meId || m.deletedAt) throw new Error('not allowed');
      if (Date.now() - new Date(m.createdAt) > 15 * 6e4) throw new Error('edit window over');
      if (!(body || '').trim()) throw new Error('empty');
      Object.assign(m, { body: body.trim(), editedAt: new Date().toISOString() }); save(); listeners.forEach(cb => cb({ type: 'update', id })); return wait();
    },
    async pinMessage(id, on) { const m = db.messages.find(x => x.id === id); if (m) { m.pinnedAt = on ? new Date().toISOString() : null; save(); } return wait(); },
    async saveMessage(id, on) { db.msgSaved = (db.msgSaved || []).filter(x => x !== id); if (on) db.msgSaved.unshift(id); save(); return wait(); },
    async savedMessages() {
      return wait((db.msgSaved || []).map(id => db.messages.find(m => m.id === id)).filter(Boolean).map(m => {
        const u = user(m.from) || { name: 'সদস্য', avatar: '' };
        return { id: m.id, body: m.body || '', mine: m.from === meId, sender: u.name, avatar: u.avatar, createdAt: m.createdAt, image: !!m.image, sticker: m.sticker || '', loc: !!m.loc, deleted: !!m.deletedAt,
          t: m.chatId ? { kind: 'group', id: m.chatId } : { kind: m.pageId ? 'page' : 'dm', id: m.from === meId ? m.to : m.from, pageId: m.pageId || null } };
      }));
    },
    async voteChatPoll(id, opt) { const m = db.messages.find(x => x.id === id); if (!m?.poll) return; m.votes = m.votes || {}; if (opt == null || m.votes[meId] === opt) delete m.votes[meId]; else m.votes[meId] = opt; save(); return wait(); },
    async mediaOf(t) { const { msgs } = await this.thread(t); return msgs.filter(m => m.image && !m.deleted).reverse().map(m => ({ id: m.id, path: m.image, createdAt: m.createdAt })); },
    async setShared(t, { theme, nickUser, nick, disappear }) {
      db.shared = db.shared || {}; const k = demoShKey(t), cur = { nicknames: {}, ...(db.shared[k] || {}) };
      if (theme != null) cur.theme = theme;
      if (nickUser) { if ((nick || '').trim()) cur.nicknames = { ...cur.nicknames, [nickUser]: nick.trim().slice(0, 40) }; else { const n = { ...cur.nicknames }; delete n[nickUser]; cur.nicknames = n; } }
      if (disappear != null) cur.disappear = !!disappear;
      db.shared[k] = cur; save(); return wait();
    },
    async updateChat(id, { name, about, photo, removePhoto }) {
      const g = db.chats.find(x => x.id === Number(id)); if (!g) return;
      if (!g.members.some(x => x.id === meId)) throw new Error('not allowed');
      if ((name || '').trim()) g.name = name.trim(); g.about = (about || '').trim().slice(0, 300);
      if (photo) g.photo = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(photo); });
      if (removePhoto) g.photo = '';
      save(); return wait();
    },
    async hideMessage(id) { const m = db.messages.find(x => x.id === id); if (m) { m.hid = [...new Set([...(m.hid || []), meId])]; save(); } return wait(); },
    async convSet(t, patch) { const k = demoKey(t); db.convSet[k] = { ...(db.convSet[k] || {}), ...Object.fromEntries(Object.entries(patch).map(([a, b]) => [a === 'cleared_at' ? 'clearedAt' : a, b])) }; save(); return wait(); },
    async clearConversation(t) { await this.convSet(t, { cleared_at: new Date().toISOString() }); await this.markThreadRead(t); },
    async markThreadRead(t) {
      if (t.kind === 'group') { const g = db.chats.find(x => x.id === Number(t.id)); g?.members.forEach(x => { if (x.id === meId) x.lastReadAt = new Date().toISOString(); }); save(); return; }
      return this.markRead(t.id, t.pageId);
    },
    async markRead(id, pageId) { for (const m of db.messages) if (m.from === id && m.to === meId && (m.pageId || null) === (pageId ? Number(pageId) : null)) m.read = true; save(); },
    async touchPresence() {},
    async presence(ids) { const now = Date.now(), seen = { d2: 0, d1: 6, d3: 45, d4: 180 }; if (db.settings.showActive === false) return new Map(); return wait(new Map(ids.filter(i => seen[i] !== undefined && (friendIds(meId).includes(i) || db.messages.some(m => (m.from === i && m.to === meId) || (m.to === i && m.from === meId)))).map(i => [i, new Date(now - seen[i] * 6e4).toISOString()]))); },
    async showActive() { return db.settings.showActive !== false; },
    async setShowActive(on) { db.settings.showActive = !!on; save(); },
    async createChat(name, ids) {
      const fr = new Set(friendIds(meId)), now = new Date().toISOString();
      const g = { id: nid(db.chats), name: name.trim(), createdBy: meId, createdAt: now, members: [{ id: meId, role: 'admin', lastReadAt: now, joinedAt: now }, ...ids.filter(i => fr.has(i)).map(i => ({ id: i, role: 'member', lastReadAt: now, joinedAt: now }))] };
      db.chats.push(g); save(); return wait(g.id);
    },
    async chatInfo(id) { const g = db.chats.find(x => x.id === Number(id)); return wait(g && g.members.some(x => x.id === meId) ? { id: g.id, name: g.name, createdBy: g.createdBy, about: g.about || '', photo: g.photo || '', adminsOnly: !!g.adminsOnly, approval: g.joinApproval !== false } : null); },
    async addChatMembers(id, ids) { const g = db.chats.find(x => x.id === Number(id)), fr = new Set(friendIds(meId)), now = new Date().toISOString(); ids.filter(i => fr.has(i) && !g.members.some(x => x.id === i)).forEach(i => g.members.push({ id: i, role: 'member', lastReadAt: now, joinedAt: now })); save(); return wait(); },
    async removeChatMember(id, uid) {
      const g = db.chats.find(x => x.id === Number(id)); if (!g) return;
      if (uid !== meId && g.members.find(x => x.id === meId)?.role !== 'admin') throw new Error('not allowed');
      g.members = g.members.filter(x => x.id !== uid);
      if (!g.members.length) db.chats = db.chats.filter(x => x !== g); else if (!g.members.some(x => x.role === 'admin')) g.members[0].role = 'admin';
      save(); return wait();
    },
    async renameChat(id, name) { const g = db.chats.find(x => x.id === Number(id)); if (g) g.name = name.trim(); save(); return wait(); },
    async markUnread(t, on) { await this.convSet(t, { marked_unread: !!on }); },
    async chatInvite(id, reset) {
      const g = db.chats.find(x => x.id === Number(id)), mine = g?.members.find(x => x.id === meId); if (!mine) throw new Error('not allowed');
      if (reset && mine.role !== 'admin') throw new Error('not allowed');
      if (!g.joinCode || reset) { g.joinCode = Math.random().toString(16).slice(2, 14); save(); }
      return wait(g.joinCode);
    },
    async chatByCode(code) { const g = db.chats.find(x => x.joinCode === code); return wait(g && { id: g.id, name: g.name, about: g.about || '', members: g.members.length, isMember: g.members.some(x => x.id === meId), pending: (g.joinReqs || []).some(r => r.id === meId), approval: g.joinApproval !== false }); },
    async joinChat(code) {
      const g = db.chats.find(x => x.joinCode === code); if (!g) throw new Error('invalid link');
      if (g.members.some(x => x.id === meId)) return 'member';
      if (g.members.length >= 50) throw new Error('members max 50');
      const now = new Date().toISOString();
      if (g.joinApproval !== false) { g.joinReqs = [...(g.joinReqs || []).filter(r => r.id !== meId), { id: meId, at: now }]; save(); return 'pending'; }
      g.members.push({ id: meId, role: 'member', lastReadAt: now, joinedAt: now }); save(); return 'joined';
    },
    async chatJoinList(id) { const g = db.chats.find(x => x.id === Number(id)); if (g?.members.find(x => x.id === meId)?.role !== 'admin') throw new Error('not allowed'); return wait((g.joinReqs || []).map(r => { const u = user(r.id) || { name: 'সদস্য', avatar: '' }; return { id: r.id, name: u.name, avatar: u.avatar, createdAt: r.at }; })); },
    async decideChatJoin(id, uid, okk) {
      const g = db.chats.find(x => x.id === Number(id)); if (g?.members.find(x => x.id === meId)?.role !== 'admin') throw new Error('not allowed');
      g.joinReqs = (g.joinReqs || []).filter(r => r.id !== uid);
      if (okk && !g.members.some(x => x.id === uid)) { const now = new Date().toISOString(); g.members.push({ id: uid, role: 'member', lastReadAt: now, joinedAt: now }); }
      save(); return wait();
    },
    async setChatOptions(id, { adminsOnly, approval }) { const g = db.chats.find(x => x.id === Number(id)); if (g?.members.find(x => x.id === meId)?.role !== 'admin') throw new Error('not allowed'); if (adminsOnly != null) g.adminsOnly = !!adminsOnly; if (approval != null) g.joinApproval = !!approval; save(); return wait(); },
    async setChatAdmin(id, uid, on) {
      const g = db.chats.find(x => x.id === Number(id)); if (g?.members.find(x => x.id === meId)?.role !== 'admin') throw new Error('not allowed');
      const m = g.members.find(x => x.id === uid); if (!m) throw new Error('not found');
      if (!on && g.members.filter(x => x.role === 'admin').length <= 1) throw new Error('last admin');
      m.role = on ? 'admin' : 'member'; save(); return wait();
    },
    typing(t, onTyping) { const fn = from => { if (t.kind !== 'group' && from === t.id) onTyping({ u: from, n: user(from)?.name || '' }); }; typingListeners.add(fn); return { send: () => {}, stop: () => typingListeners.delete(fn) }; },
    async unreadCount() { return (await this.inbox()).filter(c => !c.asPage && !c.muted && !c.request).reduce((a, c) => a + c.unread, 0); },
    async pageUnread() { const out = new Map(); for (const m of db.messages) if (m.to === meId && !m.read && m.pageId && pageOf(m.pageId)?.ownerId === meId) out.set(m.pageId, (out.get(m.pageId) || 0) + 1); return wait(out); },
    onMessage(cb) { listeners.add(cb); return () => listeners.delete(cb); },

    async notifications(pageId) {
      return wait(db.notifs.filter(n => n.to === meId && !isBlocked(n.from) && inScope(demoN(n), pageId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 60)
        .map(n => ({ id: n.id, type: n.type, postId: n.postId, groupId: n.groupId || null, groupName: db.groups.find(g => g.id === n.groupId)?.name || '', read: n.read, createdAt: n.createdAt, actor: user(n.from) || { id: n.from, name: 'সদস্য', avatar: '' }, snippet: db.posts.find(p => p.id === n.postId)?.body || '', postImage: demoPic((db.posts.find(p => p.id === n.postId)?.images || [])[0] || db.posts.find(p => p.id === n.postId)?.image || '') || '', postBg: db.posts.find(p => p.id === n.postId)?.bg || '', meta: n.meta || {} })));
    },
    async unreadNotifications(pageId) { return db.notifs.filter(n => n.to === meId && !n.read && !isBlocked(n.from) && inScope(demoN(n), pageId)).length; },
    async myAnnouncer() { const a = (db.announcers || []).find(x => x.id === meId); return wait(a ? { title: a.title, unionId: a.unionId } : null); },
    async announcersList() { return wait((db.announcers || []).map(a => { const u = user(a.id) || { name: 'সদস্য', avatar: '' }; return { ...a, name: u.name, avatar: u.avatar, unionName: uname(a.unionId) || '' }; })); },
    async setAnnouncer(uid, title, unionId) { db.announcers = (db.announcers || []).filter(x => x.id !== uid); db.announcers.push({ id: uid, title: title.trim(), unionId: unionId || null }); save(); return wait(); },
    async removeAnnouncer(uid) { db.announcers = (db.announcers || []).filter(x => x.id !== uid); save(); return wait(); },
    async adminBroadcast(text, unionId) {
      db.annc = db.annc || []; if (db.annc.filter(a => Date.now() - new Date(a.created_at) < 864e5).length >= 5) throw new Error('announce limit');
      db.annc.unshift({ id: nid(db.annc), body: text.trim(), union_id: unionId || null, recipients: 1, created_at: new Date().toISOString() });
      db.notifs.push({ id: nid(db.notifs), to: meId, from: 'd6', type: 'announce', meta: { text: text.trim(), union: unionId ? (db.unions || []).find?.(u => u.id === unionId)?.name || null : null }, createdAt: new Date().toISOString(), read: false });
      save(); notifyListeners.forEach(cb => cb()); return wait(1);
    },
    async announcements() { return wait(db.annc || []); },
    async deleteNotification(id) { db.notifs = db.notifs.filter(n => !(n.id === id && n.to === meId)); save(); return wait(); },
    async markNotificationUnread(id) { const n = db.notifs.find(x => x.id === id && x.to === meId); if (n) n.read = false; save(); return wait(); },
    async notifMutes() { return new Set(db.notifMutes || []); },
    async muteNotifPost(postId, on) { db.notifMutes = (db.notifMutes || []).filter(x => x !== Number(postId)); if (on) db.notifMutes.push(Number(postId)); save(); return wait(); },
    async notifPrefs() { return [...(db.notifOff || [])]; },
    async setNotifPrefs(off) { db.notifOff = [...off]; save(); return wait(); },
    async markNotificationsRead(ids) { for (const n of db.notifs) if (n.to === meId && (!ids || ids.includes(n.id))) n.read = true; save(); },
    onNotify(cb) { notifyListeners.add(cb); return () => notifyListeners.delete(cb); },
    async search(q) {
      const [people, posts, services] = await Promise.all([this.people({ q }), this.posts({ q }), this.services({ q })]);
      return { people, posts, services };
    },

    async services({ category, q }) {
      const t = (q || '').trim().toLowerCase();
      // ডেমো: অবস্থান না থাকলে ভালুকার আশেপাশে একটা আন্দাজি অবস্থান
      const geo = s => (s.lat == null && !s.noGeo ? { ...s, lat: 24.38 + ((s.id * 37) % 50 - 25) / 1000, lng: 90.385 + ((s.id * 53) % 50 - 25) / 1000 } : s);
      return wait(db.services.map(geo).filter(s => (!category || s.category === category) && (!t || (s.name + ' ' + s.address).toLowerCase().includes(t)))
        .sort((a, b) => (b.verified - a.verified) || a.name.localeCompare(b.name, 'bn')));
    },
    async addService(v) { db.services.push({ ...v, id: nid(db.services), verified: false }); save(); },
    async serviceFavs() { return wait(meId ? (db.svcFavs[meId] || []) : []); },
    async setServiceFav(id, on) { const l = new Set(db.svcFavs[meId] || []); on ? l.add(id) : l.delete(id); db.svcFavs[meId] = [...l]; save(); return wait(); },
    async setServiceLoc(id, lat, lng) { const s = db.services.find(x => x.id === id); if (s) { s.lat = lat; s.lng = lng; s.noGeo = lat == null; } save(); return wait(); },
    async dirBanners() { return wait([...db.dirBanners]); },
    async addDirBanner(v) { const image_url = v.image ? await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(v.image); }) : null; db.dirBanners.unshift({ id: Date.now(), title: v.title, subtitle: v.subtitle, color: v.color, link: v.link, image_url }); save(); return wait(); },
    async delDirBanner(id) { db.dirBanners = db.dirBanners.filter(b => b.id !== id); save(); return wait(); },
    async popularServiceCats() { return wait(Object.entries(db.svcCatVisits).map(([category, visits]) => ({ category, visits })).sort((a, b) => b.visits - a.visits).slice(0, 10)); },
    async serviceCatVisit(c) { db.svcCatVisits[c] = (db.svcCatVisits[c] || 0) + 1; save(); },
    async serviceCalled(id) { const s = db.services.find(x => x.id === id); if (s) { s.call_count = (s.call_count || 0) + 1; save(); } },
    async verifyService(id) { const s = db.services.find(x => x.id === id); if (s) s.verified = true; save(); },
    async serviceReviews(id) {
      return wait((db.svcReviews || []).filter(r => r.service_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(r => { const u = person(r.user_id) || {}; return { ...r, name: u.name || 'সদস্য', avatar: u.avatar || '', mine: r.user_id === meId }; }));
    },
    async saveReview(id, rating, body) {
      db.svcReviews ||= []; const o = db.svcReviews.find(r => r.service_id === id && r.user_id === meId);
      if (o) Object.assign(o, { rating, body: body || null }); else db.svcReviews.push({ id: Date.now(), service_id: id, user_id: meId, rating, body: body || null, created_at: new Date().toISOString() });
      svcRate(id); save(); return wait();
    },
    async delReview(rid) { const r = (db.svcReviews || []).find(x => x.id === rid); db.svcReviews = (db.svcReviews || []).filter(x => x.id !== rid); if (r) svcRate(r.service_id); save(); return wait(); },
    async uploadServiceImage(blob) { return toBlobUrl(blob); },
    async myTributes() { return wait([...(db.tributes || [])]); },
    async setTribute(id, on) { db.tributes ||= []; const s = db.services.find(x => x.id === id); const had = db.tributes.includes(id);
      if (on && !had) { db.tributes.push(id); if (s) s.tribute_count = (s.tribute_count || 0) + 1; } if (!on && had) { db.tributes = db.tributes.filter(x => x !== id); if (s) s.tribute_count = Math.max(0, (s.tribute_count || 1) - 1); } save(); return wait(); },
    async suggest(kind, v) { db.suggs ||= []; db.suggs.unshift({ id: Date.now(), user_id: meId, by: person(meId)?.name || 'আপনি', kind, service_id: v.service_id || null, category: v.category || 'famous', payload: v.payload || {}, images: v.images || [], created_at: new Date().toISOString() }); save(); return wait(); },
    async suggestions(category) { return wait((db.suggs || []).filter(x => x.category === category)); },
    async pendingSuggestions(category) { return wait((db.suggs || []).filter(x => x.category === category).length); },
    async setSuggestion(id) { db.suggs = (db.suggs || []).filter(x => x.id !== id); save(); return wait(); },
    async quizStart() {
      const coreName = n => String(n).replace(/^((ভাষা সৈনিক|বীর মুক্তিযোদ্ধা|মুক্তিযোদ্ধা|অধ্যাপক|অধ্যাপিকা|ডক্টর|ডা|মেজর|কর্নেল|ক্যাপ্টেন|মরহুম|মরহুমা|শহীদ|আলহাজ্ব|এডভোকেট|অ্যাডভোকেট)[.:ঃ]?\s+)+/u, '').trim();
      const day = new Date().toISOString().slice(0, 10); if (db.quiz?.day === day && db.quiz.score != null) return wait({ done: true, score: db.quiz.score, total: db.quiz.answers.length });
      const fam = db.services.filter(x => x.category === 'famous' && (x.tagline || x.address)).sort(() => Math.random() - 0.5).slice(0, 5);
      if (fam.length < 3) return wait({ error: 'কুইজের জন্য যথেষ্ট তথ্য নেই' });
      const all = db.services.filter(x => x.category === 'famous');
      const questions = fam.map(r => ({ q: r.tagline && (!r.address || Math.random() < 0.6) ? `কার পরিচিতি: “${r.tagline}”?` : `কার জন্মস্থান ${r.address}?`,
        options: [r, ...all.filter(x => x.id !== r.id).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5).map(x => ({ id: x.id, name: coreName(x.name) })) }));
      db.quiz = { day, answers: fam.map(x => x.id), score: null }; save(); return wait({ questions });
    },
    async quizSubmit(ans) { const q = db.quiz; if (!q) throw new Error('আগে কুইজ শুরু করুন'); if (q.score != null) return wait({ score: q.score, total: q.answers.length, coins: 0, answers: q.answers });
      q.score = q.answers.filter((x, i) => x === ans[i]).length; const coins = q.score * 2; if (coins) addCoins(coins, 'quiz', 'famous:' + q.day); save(); return wait({ score: q.score, total: q.answers.length, coins, answers: q.answers }); },
    async saveService(id, v) {
      if (id) { const s = db.services.find(x => x.id === id); if (s) Object.assign(s, v); save(); return wait(id); }
      const nidv = nid(db.services); db.services.unshift({ ...v, id: nidv, verified: true }); save(); return wait(nidv);
    },
    async report(t, id, reason) { if (t === 'service') { db.svcReports ||= []; if (db.svcReports.some(r => r.sid === String(id) && r.by === meId)) throw Object.assign(new Error('duplicate'), { code: '23505' }); db.svcReports.push({ by: meId, id: Date.now(), sid: String(id), reason, created_at: new Date().toISOString() }); save(); } return wait(true); },
    async serviceReports(id) { return wait((db.svcReports || []).filter(r => r.sid === String(id))); },
    async resolveReport(rid) { db.svcReports = (db.svcReports || []).filter(r => r.id !== rid); save(); return wait(); },
  };
}

export async function createApi() {
  return DEMO ? demoApi() : supabaseApi();
}
