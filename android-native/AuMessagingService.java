package com.amarupazila.app;

import android.app.ActivityManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.service.notification.StatusBarNotification;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.app.RemoteInput;
import androidx.core.content.LocusIdCompat;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;

import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

/**
 * অ্যাপের নিজের বানানো নোটিফিকেশন (Messenger/Facebook-এর মতো):
 *  - মেসেজ: নাম-ছবি, পুরো লেখা, আগের কয়েকটা মেসেজ; "উত্তর দিন", "👍", "পড়েছি"; চ্যাট বাবল (Android 11+)
 *  - ফ্রেন্ড রিকোয়েস্ট: "গ্রহণ করুন" / "মুছুন"
 *  - রক্তের অনুরোধ: "আমি দিতে পারব"
 * অন্য সব নোটিফিকেশন আগের মতো Capacitor প্লাগইন / Firebase সামলায়।
 */
public class AuMessagingService extends MessagingService {
    public static final String CH_MSG = "au_msg2";   // শব্দ বদলালে চ্যানেলের নামও বদলাতে হয় (Android পুরোনো চ্যানেলের শব্দ বদলাতে দেয় না)
    public static final String CH_GEN = "au_gen3";
    public static final int NID = 4201;
    public static final String KEY_REPLY = "au_reply";
    static final String PREF = "au_push";
    static final String GREEN = "#006a4e";

    @Override
    public void onMessageReceived(RemoteMessage msg) {
        Map<String, String> d = msg.getData();
        if (!"1".equals(d.get("au_rich"))) { super.onMessageReceived(msg); return; }
        if (isForeground()) { super.onMessageReceived(msg); return; }   // অ্যাপ খোলা থাকলে অ্যাপের ভেতরেই দেখায়
        try {
            String conv = d.get("au_conv");
            String kind = d.get("au_kind") == null || d.get("au_kind").isEmpty() ? "msg" : d.get("au_kind");
            JSONObject st = "msg".equals(kind) ? load(this, conv) : null;
            if (st == null || !isActive(this, conv)) { st = new JSONObject(); st.put("hist", new JSONArray()); }
            st.put("kind", kind);
            st.put("title", d.get("au_title"));
            st.put("grp", "1".equals(d.get("au_grp")));
            st.put("rt", d.get("au_rt"));
            st.put("ru", d.get("au_ru"));
            st.put("rk", d.get("au_rk"));
            st.put("mid", d.get("au_mid"));
            st.put("badge", d.get("au_badge"));
            JSONObject ex = new JSONObject();
            for (Map.Entry<String, String> e : d.entrySet()) if (!e.getKey().startsWith("au_")) ex.put(e.getKey(), e.getValue());
            ex.put("google.message_id", msg.getMessageId() == null ? String.valueOf(System.currentTimeMillis()) : msg.getMessageId());
            st.put("extras", ex);
            JSONObject m = new JSONObject();
            m.put("s", d.get("au_sender"));
            m.put("t", d.get("au_text"));
            m.put("av", avatar(this, d.get("au_av")));
            m.put("at", msg.getSentTime() > 0 ? msg.getSentTime() : System.currentTimeMillis());
            JSONArray h = st.getJSONArray("hist");
            h.put(m);
            while (h.length() > 7) h.remove(0);
            save(this, conv, st);
            show(this, conv, st, false, null);
        } catch (Exception e) {
            super.onMessageReceived(msg);
        }
    }

    private boolean isForeground() {
        ActivityManager.RunningAppProcessInfo i = new ActivityManager.RunningAppProcessInfo();
        ActivityManager.getMyMemoryState(i);
        return i.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND;
    }

    // ---------------------------------------------------------------- চ্যানেল (নিজস্ব শব্দ সহ)
    static void channels(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        Uri snd = sound(c, "au_notify"), sndN = sound(c, "au_notif");
        AudioAttributes aa = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
        if (nm.getNotificationChannel(CH_MSG) == null) {
            NotificationChannel ch = new NotificationChannel(CH_MSG, "মেসেজ", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("কেউ মেসেজ দিলে; নোটিফিকেশন থেকেই উত্তর দেওয়া যায়");
            ch.enableLights(true); ch.setLightColor(Color.parseColor(GREEN)); ch.enableVibration(true);
            if (snd != null) ch.setSound(snd, aa);
            if (Build.VERSION.SDK_INT >= 29) ch.setAllowBubbles(true);
            nm.createNotificationChannel(ch);
        }
        if (nm.getNotificationChannel(CH_GEN) == null) {
            NotificationChannel ch = new NotificationChannel(CH_GEN, "সাধারণ নোটিফিকেশন", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("মন্তব্য, রিয়্যাক্ট, ফ্রেন্ড রিকোয়েস্ট ও জরুরি খবর");
            ch.enableLights(true); ch.setLightColor(Color.parseColor(GREEN)); ch.enableVibration(true);
            if (sndN != null) ch.setSound(sndN, new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            nm.createNotificationChannel(ch);
        }
        for (String old : new String[]{"msgs", "au_msg", "au_general", "au_gen2"}) if (nm.getNotificationChannel(old) != null) nm.deleteNotificationChannel(old);   // আগের বিল্ডের চ্যানেল
    }

    // মেসেজ: au_notify (তিন নোটের ঘণ্টা), অন্য নোটিফিকেশন: au_notif (দুই নোটের ঝিনুক) — শুনেই বোঝা যায় কোনটা
    static Uri sound(Context c, String name) {
        int id = c.getResources().getIdentifier(name, "raw", c.getPackageName());
        return id == 0 ? null : Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + c.getPackageName() + "/raw/" + name);
    }

    // ---------------------------------------------------------------- নোটিফিকেশন বানানো (নতুন বার্তা ও বোতাম চাপার পর আবার)
    static void show(Context c, String conv, JSONObject st, boolean silent, String note) throws Exception {
        channels(c);
        String kind = st.optString("kind", "msg");
        boolean isMsg = "msg".equals(kind);
        boolean grp = st.optBoolean("grp");
        String title = st.optString("title", "আমার উপজেলা");
        JSONArray h = st.getJSONArray("hist");
        JSONObject last = h.length() > 0 ? h.getJSONObject(h.length() - 1) : new JSONObject();

        Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (open == null) open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        putExtras(open, st);
        int rc = conv.hashCode();
        int imm = Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0;
        int mut = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        PendingIntent tap = PendingIntent.getActivity(c, rc, open, PendingIntent.FLAG_UPDATE_CURRENT | imm);
        int small = smallIcon(c);

        NotificationCompat.Builder nb = new NotificationCompat.Builder(c, isMsg ? CH_MSG : CH_GEN)
            .setSmallIcon(small)
            .setColor(Color.parseColor(GREEN))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(tap)
            .setAutoCancel(true)
            .setOnlyAlertOnce(silent)
            .setShowWhen(true)
            .setDeleteIntent(PendingIntent.getBroadcast(c, rc + 3, act(c, "clear", conv), PendingIntent.FLAG_UPDATE_CURRENT | imm));
        if (silent) nb.setSilent(true);
        else { Uri snd = sound(c, isMsg ? "au_notify" : "au_notif"); if (snd != null && Build.VERSION.SDK_INT < 26) nb.setSound(snd); nb.setDefaults(NotificationCompat.DEFAULT_VIBRATE | NotificationCompat.DEFAULT_LIGHTS); }
        int badge = 0; try { badge = Integer.parseInt(st.optString("badge", "0")); } catch (Exception ignored) {}
        if (badge > 0) nb.setNumber(badge);
        boolean hasTok = !st.optString("rt").isEmpty();

        if (isMsg) {
            Person me = new Person.Builder().setName(st.optString("me", "আপনি")).setKey("me").build();
            NotificationCompat.MessagingStyle style = new NotificationCompat.MessagingStyle(me);
            if (grp) { style.setConversationTitle(title); style.setGroupConversation(true); }
            Bitmap face = null; Person who = null;
            for (int i = 0; i < h.length(); i++) {
                JSONObject m = h.getJSONObject(i);
                Person p = null;
                if (!m.optBoolean("me")) {
                    Person.Builder pb = new Person.Builder().setName(m.optString("s", title)).setKey(m.optString("s"));
                    Bitmap b = m.optString("av").isEmpty() ? null : BitmapFactory.decodeFile(m.optString("av"));
                    if (b != null) { pb.setIcon(IconCompat.createWithBitmap(b)); face = b; }
                    p = pb.build(); who = p;
                }
                style.addMessage(m.optString("t"), m.optLong("at", System.currentTimeMillis()), p);
            }
            if (note != null) style.addMessage(note, System.currentTimeMillis(), (Person) null);
            nb.setStyle(style).setCategory(NotificationCompat.CATEGORY_MESSAGE);
            if (face != null && !grp) nb.setLargeIcon(face);

            // কথোপকথনের শর্টকাট: নোটিফিকেশন বারের উপরে "কথোপকথন" অংশে আসে, আর চ্যাট বাবল হয়
            try {
                IconCompat ic = face != null ? IconCompat.createWithAdaptiveBitmap(padded(face)) : IconCompat.createWithResource(c, c.getApplicationInfo().icon);
                Intent si = new Intent(c, MainActivity.class).setAction(Intent.ACTION_VIEW);
                putExtras(si, st);
                ShortcutInfoCompat.Builder sb = new ShortcutInfoCompat.Builder(c, conv).setLongLived(true)
                    .setShortLabel(title).setIcon(ic).setIntent(si).setLocusId(new LocusIdCompat(conv));
                if (who != null && !grp) sb.setPerson(who);
                ShortcutManagerCompat.pushDynamicShortcut(c, sb.build());
                nb.setShortcutId(conv).setLocusId(new LocusIdCompat(conv));
                Intent bi = new Intent(c, BubbleActivity.class).setAction(Intent.ACTION_VIEW)
                    .setData(Uri.parse("amarupazila://bubble/" + conv)).putExtra("conv", conv);
                PendingIntent bp = PendingIntent.getActivity(c, rc + 5, bi, PendingIntent.FLAG_UPDATE_CURRENT | mut);
                nb.setBubbleMetadata(new NotificationCompat.BubbleMetadata.Builder(bp, ic).setDesiredHeight(640)
                    .setSuppressNotification(false).setAutoExpandBubble(false).build());
            } catch (Exception ignored) {}

            if (hasTok) {
                RemoteInput ri = new RemoteInput.Builder(KEY_REPLY).setLabel("উত্তর লিখুন…").build();
                PendingIntent rp = PendingIntent.getBroadcast(c, rc + 1, act(c, "reply", conv), PendingIntent.FLAG_UPDATE_CURRENT | mut);
                nb.addAction(new NotificationCompat.Action.Builder(IconCompat.createWithResource(c, small), "উত্তর দিন", rp)
                    .addRemoteInput(ri).setAllowGeneratedReplies(true)
                    .setSemanticAction(NotificationCompat.Action.SEMANTIC_ACTION_REPLY).setShowsUserInterface(false).build());
                if (!st.optString("mid").isEmpty()) nb.addAction(button(c, small, "👍", act(c, "like", conv), rc + 4, imm, NotificationCompat.Action.SEMANTIC_ACTION_THUMBS_UP));
                nb.addAction(button(c, small, "পড়েছি", act(c, "read", conv), rc + 2, imm, NotificationCompat.Action.SEMANTIC_ACTION_MARK_AS_READ));
            }
        } else {
            // ফ্রেন্ড রিকোয়েস্ট / রক্তের অনুরোধ
            String text = note != null ? note : last.optString("t");
            nb.setContentTitle(title).setContentText(text).setStyle(new NotificationCompat.BigTextStyle().bigText(text))
              .setCategory("friend".equals(kind) ? NotificationCompat.CATEGORY_SOCIAL : NotificationCompat.CATEGORY_RECOMMENDATION);
            Bitmap b = last.optString("av").isEmpty() ? null : BitmapFactory.decodeFile(last.optString("av"));
            if (b != null) nb.setLargeIcon(b);
            if (note != null) nb.setTimeoutAfter(6000);
            else if (hasTok && "friend".equals(kind)) {
                nb.addAction(button(c, small, "গ্রহণ করুন", act(c, "accept", conv), rc + 1, imm, NotificationCompat.Action.SEMANTIC_ACTION_NONE));
                nb.addAction(button(c, small, "মুছুন", act(c, "decline", conv), rc + 2, imm, NotificationCompat.Action.SEMANTIC_ACTION_DELETE));
            } else if (hasTok && "blood".equals(kind)) {
                nb.addAction(button(c, small, "🩸 আমি দিতে পারব", act(c, "donate", conv), rc + 1, imm, NotificationCompat.Action.SEMANTIC_ACTION_NONE));
            }
        }
        try { NotificationManagerCompat.from(c).notify(conv, NID, nb.build()); } catch (SecurityException ignored) {}
    }

    static NotificationCompat.Action button(Context c, int icon, String label, Intent i, int rc, int imm, int sem) {
        PendingIntent pi = PendingIntent.getBroadcast(c, rc, i, PendingIntent.FLAG_UPDATE_CURRENT | imm);
        return new NotificationCompat.Action.Builder(IconCompat.createWithResource(c, icon), label, pi)
            .setSemanticAction(sem).setShowsUserInterface(false).build();
    }

    static void putExtras(Intent i, JSONObject st) {
        JSONObject ex = st.optJSONObject("extras");
        if (ex != null) for (java.util.Iterator<String> it = ex.keys(); it.hasNext(); ) { String k = it.next(); i.putExtra(k, ex.optString(k)); }
    }

    static Intent act(Context c, String a, String conv) {
        Intent i = new Intent(c, AuReplyReceiver.class);
        i.setAction("com.amarupazila.app.PUSH_" + a.toUpperCase());
        i.putExtra("conv", conv);
        return i;
    }

    static int smallIcon(Context c) {
        int id = c.getResources().getIdentifier("ic_stat_notify", "drawable", c.getPackageName());
        return id != 0 ? id : c.getApplicationInfo().icon;
    }

    static boolean isActive(Context c, String conv) {
        if (Build.VERSION.SDK_INT < 23) return true;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        for (StatusBarNotification s : nm.getActiveNotifications()) if (s.getId() == NID && conv.equals(s.getTag())) return true;
        return false;
    }

    static void cancel(Context c, String conv) {
        NotificationManagerCompat.from(c).cancel(conv, NID);
        clear(c, conv);
    }

    // ---------------------------------------------------------------- অবস্থা (শেষ কয়েকটা বার্তা, টোকেন)
    static JSONObject load(Context c, String conv) {
        try { String s = c.getSharedPreferences(PREF, MODE_PRIVATE).getString(conv, null); return s == null ? null : new JSONObject(s); }
        catch (Exception e) { return null; }
    }
    static void save(Context c, String conv, JSONObject st) {
        c.getSharedPreferences(PREF, MODE_PRIVATE).edit().putString(conv, st.toString()).apply();
    }
    static void clear(Context c, String conv) {
        c.getSharedPreferences(PREF, MODE_PRIVATE).edit().remove(conv).apply();
    }

    // বাবলের আইকনের চারপাশে জায়গা (adaptive icon কেটে না যায়)
    static Bitmap padded(Bitmap b) {
        int s = 216, in = 144;
        Bitmap out = Bitmap.createBitmap(s, s, Bitmap.Config.ARGB_8888);
        Canvas cv = new Canvas(out);
        cv.drawColor(Color.parseColor(GREEN));
        int o = (s - in) / 2;
        cv.drawBitmap(b, null, new Rect(o, o, o + in, o + in), new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG));
        return out;
    }

    // প্রোফাইল ছবি নামিয়ে গোল করে রাখা (একবার নামালে পরে ফাইল থেকে)
    static String avatar(Context c, String url) {
        if (url == null || url.isEmpty()) return "";
        try {
            File f = new File(c.getCacheDir(), "nav_" + Integer.toHexString(url.hashCode()) + ".png");
            if (f.exists() && f.length() > 0) return f.getAbsolutePath();
            HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
            h.setConnectTimeout(4000); h.setReadTimeout(5000);
            InputStream in = h.getInputStream();
            Bitmap src = BitmapFactory.decodeStream(in);
            in.close(); h.disconnect();
            if (src == null) return "";
            int n = Math.min(src.getWidth(), src.getHeight()), size = 160;
            Bitmap out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas cv = new Canvas(out);
            Paint pt = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
            cv.drawCircle(size / 2f, size / 2f, size / 2f, pt);
            pt.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
            int x = (src.getWidth() - n) / 2, y = (src.getHeight() - n) / 2;
            cv.drawBitmap(src, new Rect(x, y, x + n, y + n), new Rect(0, 0, size, size), pt);
            FileOutputStream fo = new FileOutputStream(f);
            out.compress(Bitmap.CompressFormat.PNG, 100, fo);
            fo.close();
            return f.getAbsolutePath();
        } catch (Exception e) { return ""; }
    }
}
