package com.amarupazila.app;

import android.app.ActivityManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.os.Build;
import android.service.notification.StatusBarNotification;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.app.RemoteInput;
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
 * মেসেজের পুশ নোটিফিকেশন নিজে বানানো হয় (Messenger-এর মতো):
 * পাঠানোর নাম-ছবি, পুরো লেখা, আগের কয়েকটা মেসেজ, আর নোটিফিকেশন থেকেই "উত্তর দিন" ও "পড়েছি"।
 * অন্য সব নোটিফিকেশন আগের মতো Capacitor প্লাগইন সামলায়।
 */
public class AuMessagingService extends MessagingService {
    public static final String CH = "msgs";
    public static final int NID = 4201;
    public static final String KEY_REPLY = "au_reply";
    static final String PREF = "au_push";

    @Override
    public void onMessageReceived(RemoteMessage msg) {
        Map<String, String> d = msg.getData();
        if (!"1".equals(d.get("au_rich"))) { super.onMessageReceived(msg); return; }
        if (isForeground()) { super.onMessageReceived(msg); return; }   // অ্যাপ খোলা থাকলে অ্যাপের ভেতরেই দেখায়
        try {
            String conv = d.get("au_conv");
            JSONObject st = load(this, conv);
            if (st == null || !isActive(this, conv)) { st = new JSONObject(); st.put("hist", new JSONArray()); }
            st.put("title", d.get("au_title"));
            st.put("grp", "1".equals(d.get("au_grp")));
            st.put("rt", d.get("au_rt"));
            st.put("ru", d.get("au_ru"));
            st.put("rk", d.get("au_rk"));
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

    // ---------------------------------------------------------------- নোটিফিকেশন বানানো (নতুন মেসেজ ও উত্তরের পর আবার)
    static void show(Context c, String conv, JSONObject st, boolean silent, String note) throws Exception {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            NotificationChannel ch = new NotificationChannel(CH, "মেসেজ", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("কেউ মেসেজ দিলে; নোটিফিকেশন থেকেই উত্তর দেওয়া যায়");
            ch.enableLights(true); ch.setLightColor(Color.parseColor("#006a4e")); ch.enableVibration(true);
            nm.createNotificationChannel(ch);
        }
        boolean grp = st.optBoolean("grp");
        String title = st.optString("title", "আমার উপজেলা");
        String meName = st.optString("me", "আপনি");
        Person me = new Person.Builder().setName(meName).setKey("me").build();
        NotificationCompat.MessagingStyle style = new NotificationCompat.MessagingStyle(me);
        if (grp) { style.setConversationTitle(title); style.setGroupConversation(true); }
        JSONArray h = st.getJSONArray("hist");
        Bitmap large = null;
        for (int i = 0; i < h.length(); i++) {
            JSONObject m = h.getJSONObject(i);
            Person p = null;
            if (!m.optBoolean("me")) {
                Person.Builder pb = new Person.Builder().setName(m.optString("s", title)).setKey(m.optString("s"));
                Bitmap b = m.optString("av").isEmpty() ? null : BitmapFactory.decodeFile(m.optString("av"));
                if (b != null) { pb.setIcon(IconCompat.createWithBitmap(b)); if (!grp) large = b; }
                p = pb.build();
            }
            style.addMessage(m.optString("t"), m.optLong("at", System.currentTimeMillis()), p);
        }
        if (note != null) style.addMessage(note, System.currentTimeMillis(), (Person) null);

        Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (open == null) open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        JSONObject ex = st.optJSONObject("extras");
        if (ex != null) for (java.util.Iterator<String> it = ex.keys(); it.hasNext(); ) { String k = it.next(); open.putExtra(k, ex.optString(k)); }
        int rc = conv.hashCode();
        int imm = Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0;
        int mut = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        PendingIntent tap = PendingIntent.getActivity(c, rc, open, PendingIntent.FLAG_UPDATE_CURRENT | imm);

        NotificationCompat.Builder nb = new NotificationCompat.Builder(c, CH)
            .setSmallIcon(smallIcon(c))
            .setColor(Color.parseColor("#006a4e"))
            .setStyle(style)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(tap)
            .setAutoCancel(true)
            .setOnlyAlertOnce(silent)
            .setShowWhen(true)
            .setDeleteIntent(PendingIntent.getBroadcast(c, rc + 3, act(c, "clear", conv), PendingIntent.FLAG_UPDATE_CURRENT | imm));
        if (silent) nb.setSilent(true); else nb.setDefaults(NotificationCompat.DEFAULT_ALL);
        if (large != null) nb.setLargeIcon(large);

        if (!st.optString("rt").isEmpty()) {
            RemoteInput ri = new RemoteInput.Builder(KEY_REPLY).setLabel("উত্তর লিখুন…").build();
            PendingIntent rp = PendingIntent.getBroadcast(c, rc + 1, act(c, "reply", conv), PendingIntent.FLAG_UPDATE_CURRENT | mut);
            nb.addAction(new NotificationCompat.Action.Builder(IconCompat.createWithResource(c, smallIcon(c)), "উত্তর দিন", rp)
                .addRemoteInput(ri).setAllowGeneratedReplies(true)
                .setSemanticAction(NotificationCompat.Action.SEMANTIC_ACTION_REPLY).setShowsUserInterface(false).build());
            PendingIntent rd = PendingIntent.getBroadcast(c, rc + 2, act(c, "read", conv), PendingIntent.FLAG_UPDATE_CURRENT | imm);
            nb.addAction(new NotificationCompat.Action.Builder(IconCompat.createWithResource(c, smallIcon(c)), "পড়েছি", rd)
                .setSemanticAction(NotificationCompat.Action.SEMANTIC_ACTION_MARK_AS_READ).setShowsUserInterface(false).build());
        }
        try { NotificationManagerCompat.from(c).notify(tag(conv), NID, nb.build()); } catch (SecurityException ignored) {}
    }

    static Intent act(Context c, String a, String conv) {
        Intent i = new Intent(c, AuReplyReceiver.class);
        i.setAction("com.amarupazila.app.PUSH_" + a.toUpperCase());
        i.putExtra("conv", conv);
        return i;
    }

    static String tag(String conv) { return conv; }

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

    // ---------------------------------------------------------------- কথোপকথনের অবস্থা (শেষ কয়েকটা মেসেজ, উত্তরের টোকেন)
    static JSONObject load(Context c, String conv) {
        try { String s = c.getSharedPreferences(PREF, MODE_PRIVATE).getString(conv, null); return s == null ? null : new JSONObject(s); }
        catch (Exception e) { return null; }
    }
    static void save(Context c, String conv, JSONObject st) {
        c.getSharedPreferences(PREF, MODE_PRIVATE).edit().putString(conv, st.toString()).apply();
    }
    static void clear(Context c, String conv) {
        SharedPreferences p = c.getSharedPreferences(PREF, MODE_PRIVATE);
        p.edit().remove(conv).apply();
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
