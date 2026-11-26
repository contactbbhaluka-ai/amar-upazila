// অ্যাপের সেটিংস। আসল মানগুলো .env ফাইল (লোকাল) বা GitHub Secrets (বিল্ড) থেকে আসে।
// Supabase URL/key না দিলে অ্যাপ "ডেমো মোডে" চলে: ডেটা শুধু ব্রাউজারে সেভ হয়।
const env = (import.meta && import.meta.env) || {};

export const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';
export const UPAZILA_ID = Number(env.VITE_UPAZILA_ID || 1);
// শেয়ার লিংকের জন্য ওয়েব ভার্সনের ঠিকানা (যেমন https://username.github.io/amar-upazila/); না দিলে বর্তমান পেজের ঠিকানা
export const PUBLIC_URL = env.VITE_PUBLIC_URL || '';
export const APP_NAME = 'আমার উপজেলা';
export const DEMO = !(SUPABASE_URL && SUPABASE_ANON_KEY);

export const POST_CATS = ['খবর', 'সাহায্য চাই', 'হারানো-প্রাপ্তি', 'কেনা-বেচা', 'অনুষ্ঠান', 'প্রশ্ন'];

export const SERVICE_CATS = [
  ['health', 'হাসপাতাল ও স্বাস্থ্য'],
  ['gov', 'সরকারি অফিস'],
  ['edu', 'শিক্ষা'],
  ['police', 'পুলিশ ও আইন'],
  ['doc', 'ডাক্তার'],
  ['fix', 'মিস্ত্রি ও কারিগর'],
  ['bus', 'পরিবহন'],
  ['bank', 'ব্যাংক ও মোবাইল ব্যাংকিং'],
  ['shop', 'দোকান ও বাজার'],
];

// জাতীয় হেল্পলাইন (সারা দেশে একই)
export const EMERGENCY = [
  ['৩৩৩', 'সরকারি তথ্য ও সেবা, জাতীয় কল সেন্টার', '333'],
  ['১৬২৬৩', 'স্বাস্থ্য বাতায়ন: ডাক্তারের পরামর্শ', '16263'],
  ['১০৯', 'নারী ও শিশু নির্যাতন প্রতিরোধ', '109'],
  ['১০৯৮', 'শিশু সহায়তা হেল্পলাইন', '1098'],
  ['১০৬', 'দুর্নীতি দমন কমিশন', '106'],
  ['১০২', 'ফায়ার সার্ভিস', '102'],
];

// অ্যাডমিন ড্যাশবোর্ড থেকে নিয়ন্ত্রিত সেটিং (Play Store আপডেট ছাড়াই সঙ্গে সঙ্গে সব অ্যাপে কার্যকর)
// নাম: [ডেটাবেসের key, ডিফল্ট মান]
export const SETTING_KEYS = {
  publicDonorPhone: ['public_donor_phone', false],
  featBlood: ['feature_blood', true],
  featGroups: ['feature_groups', true],
  featPages: ['feature_pages', true],
  announcement: ['announcement', ''],
  minVersion: ['min_app_version', 0],       // এর চেয়ে পুরনো অ্যাপ হলে আপডেট বাধ্যতামূলক
  latestVersion: ['latest_app_version', 0], // এর চেয়ে পুরনো অ্যাপ হলে "আপডেট করুন" বার্তা
};
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.amarupazila.app';
