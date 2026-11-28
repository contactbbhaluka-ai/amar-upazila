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

// পোস্টের ধরন (ঐচ্ছিক: না বাছলে খালি থাকে)
export const POST_CATS = ['খবর', 'সাহায্য চাই', 'হারানো-প্রাপ্তি', 'কেনা-বেচা', 'অনুষ্ঠান', 'প্রশ্ন', 'গান', 'কবিতা', 'গল্প', 'শুভেচ্ছা', 'চাকরি', 'শিক্ষা', 'খেলাধুলা', 'কৃষি', 'স্বাস্থ্য', 'ধর্ম', 'রান্না', 'ভ্রমণ'];
export const CAT_ICON = { 'খবর': '📰', 'সাহায্য চাই': '🆘', 'হারানো-প্রাপ্তি': '🔎', 'কেনা-বেচা': '🛒', 'অনুষ্ঠান': '📅', 'প্রশ্ন': '❓', 'গান': '🎵', 'কবিতা': '✒️', 'গল্প': '📖', 'শুভেচ্ছা': '💐', 'চাকরি': '💼', 'শিক্ষা': '🎓', 'খেলাধুলা': '⚽', 'কৃষি': '🌾', 'স্বাস্থ্য': '🩺', 'ধর্ম': '🕌', 'রান্না': '🍲', 'ভ্রমণ': '🧳' };

// সেবার ধরন: [কী, নাম, আইকন]। blood/sale/job অ্যাপের নিজস্ব পাতায় যায় (ব্লাড ব্যাংক, ফিডের কেনা-বেচা ও চাকরি)
export const SERVICE_CATS = [
  ['upz', 'উপজেলা', '🏛️'],
  ['pouro', 'পৌরসভা', '🏢'],
  ['union', 'ইউনিয়ন', '🏘️'],
  ['fire', 'ফায়ার সার্ভিস', '🚒'],
  ['police', 'থানা পুলিশ', '👮'],
  ['gov', 'প্রশাসন', '⚖️'],
  ['doc', 'ডাক্তার', '👨‍⚕️'],
  ['amb', 'এ্যাম্বুলেন্স', '🚑'],
  ['health', 'হাসপাতাল', '🏥'],
  ['press', 'সাংবাদিক', '🎤'],
  ['lawyer', 'আইনজীবী', '🎓'],
  ['famous', 'প্রসিদ্ধ ব্যক্তি', '🌟'],
  ['ff', 'মুক্তিযোদ্ধা', '🎖️'],
  ['voter', 'ভোটার তালিকা', '🗳️'],
  ['edu', 'স্কুল কলেজ', '🏫'],
  ['tour', 'দর্শনীয় স্থান', '🌳'],
  ['food', 'রেস্টুরেন্ট', '🍽️'],
  ['hotel', 'আবাসিক হোটেল', '🏨'],
  ['courier', 'কুরিয়ার', '📦'],
  ['bank', 'ব্যাংক', '🏦'],
  ['rentcar', 'গাড়ি ভাড়া', '🚗'],
  ['net', 'ব্রডব্যান্ড', '🌐'],
  ['clean', 'পরিচ্ছন্নতা', '🧹'],
  ['power', 'বিদ্যুৎ', '⚡'],
  ['gym', 'জিম', '🏋️'],
  ['ladies', 'লেডিস পার্লার', '💄'],
  ['gents', 'জেন্টস পার্লার', '✂️'],
  ['office', 'অফিস', '💼'],
  ['kazi', 'কাজী অফিস', '💍'],
  ['shop', 'হাট বাজার', '🛒'],
  ['cook', 'কসাই ও বাবুর্চি', '👨‍🍳'],
  ['fix', 'সকল মিস্ত্রি', '🛠️'],
  ['air', 'এয়ার ট্রাভেল', '✈️'],
  ['graphics', 'গ্রাফিক্স', '🎨'],
  ['tutor', 'টিউশন', '👨‍🏫'],
  ['it', 'সাইবার এক্সপার্ট', '💻'],
  ['video', 'ভিডিও', '🎬'],
  ['band', 'ব্যান্ডপার্টি', '🥁'],
  ['pride', 'কৃতি সন্তান', '🏅'],
  ['tolet', 'বাসা ভাড়া', '🏠'],
  ['bride', 'পাত্রপাত্রী', '👰'],
  ['ghotok', 'ঘটক', '🤝'],
  ['blood', 'ব্লাড ব্যাংক', '🩸'],
  ['sale', 'ক্রয়বিক্রয়', '🛍️'],
  ['job', 'চাকরি', '💼'],
  ['bus', 'পরিবহন', '🚌'],
];
export const SVC_SPECIAL = { blood: 'blood', sale: 'কেনা-বেচা', job: 'চাকরি' };

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
  // কয়েন ও ভেরিফাইড ব্যাজ
  earnPost: ['earn_post', 5], earnComment: ['earn_comment', 2], earnLike: ['earn_like', 1], earnShare: ['earn_share', 3],
  earnCap: ['earn_daily_cap', 50], badgePrice: ['badge_price', 500], badgeDays: ['badge_days', 30],
  // পোস্ট বুস্ট (বিজ্ঞাপন)
  boostPrice: ['boost_price_day', 50], featBoost: ['feature_boost', true],
  // Google দিয়ে লগইন: Supabase-এ Google provider চালু করার পর অ্যাডমিন ড্যাশবোর্ড থেকে চালু করুন
  featGoogle: ['feature_google', false],
  // পুরো অ্যাপের ডিফল্ট বাংলা ফন্ট: hind | noto | system
  defaultFont: ['default_font', 'hind'],
};
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.amarupazila.app';
