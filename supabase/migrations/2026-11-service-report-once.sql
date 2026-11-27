-- একজন অ্যাকাউন্টধারী একটি সেবার বিষয়ে একবারই (অমীমাংসিত) ভুল তথ্যের রিপোর্ট দিতে পারবেন
create unique index if not exists reports_service_once on public.reports (reporter_id, target_id) where target_type = 'service' and not resolved;
