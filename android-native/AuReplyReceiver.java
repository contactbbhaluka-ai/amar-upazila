package com.amarupazila.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.RemoteInput;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** নোটিফিকেশনের "উত্তর দিন" / "পড়েছি" বোতাম: অ্যাপ না খুলেই সার্ভারে পাঠায় (push_reply) */
public class AuReplyReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        final String conv = intent.getStringExtra("conv");
        final String action = intent.getAction() == null ? "" : intent.getAction();
        if (conv == null) return;
        if (action.endsWith("_CLEAR")) { AuMessagingService.clear(c, conv); return; }
        final JSONObject st = AuMessagingService.load(c, conv);
        if (st == null) { NotificationManagerCompat.from(c).cancel(conv, AuMessagingService.NID); return; }
        String text = null;
        if (action.endsWith("_REPLY")) {
            Bundle r = RemoteInput.getResultsFromIntent(intent);
            CharSequence cs = r == null ? null : r.getCharSequence(AuMessagingService.KEY_REPLY);
            text = cs == null ? "" : cs.toString().trim();
            if (text.isEmpty()) return;
        }
        final String reply = text;
        final PendingResult pr = goAsync();
        new Thread(() -> {
            try {
                JSONObject res = call(st, reply == null ? "read" : "reply", reply);
                boolean ok = res != null && res.optBoolean("ok");
                if (reply == null) {
                    // পড়েছি: নোটিফিকেশন সরিয়ে দেওয়া
                    NotificationManagerCompat.from(c).cancel(conv, AuMessagingService.NID);
                    AuMessagingService.clear(c, conv);
                } else if (ok) {
                    st.put("me", res.optString("me", "আপনি"));
                    JSONObject m = new JSONObject();
                    m.put("me", true); m.put("t", reply); m.put("at", System.currentTimeMillis());
                    JSONArray h = st.getJSONArray("hist"); h.put(m);
                    while (h.length() > 7) h.remove(0);
                    AuMessagingService.save(c, conv, st);
                    AuMessagingService.show(c, conv, st, true, null);
                } else {
                    String err = res == null ? "" : res.optString("error");
                    String note = "expired".equals(err) ? "⚠️ উত্তর দেওয়ার সময় শেষ, অ্যাপ খুলে পাঠান"
                        : "blocked".equals(err) ? "⚠️ এই কথোপকথনে মেসেজ পাঠানো যাচ্ছে না"
                        : "⚠️ পাঠানো যায়নি, ইন্টারনেট দেখে আবার চেষ্টা করুন";
                    AuMessagingService.show(c, conv, st, true, note);
                }
            } catch (Exception ignored) {
            } finally {
                pr.finish();
            }
        }).start();
    }

    private static JSONObject call(JSONObject st, String action, String text) {
        HttpURLConnection h = null;
        try {
            JSONObject body = new JSONObject();
            body.put("p_token", st.optString("rt"));
            body.put("p_action", action);
            if (text != null) body.put("p_text", text);
            h = (HttpURLConnection) new URL(st.optString("ru")).openConnection();
            h.setRequestMethod("POST");
            h.setConnectTimeout(8000); h.setReadTimeout(8000);
            h.setDoOutput(true);
            h.setRequestProperty("Content-Type", "application/json");
            h.setRequestProperty("apikey", st.optString("rk"));
            h.setRequestProperty("Authorization", "Bearer " + st.optString("rk"));
            OutputStream o = h.getOutputStream();
            o.write(body.toString().getBytes(StandardCharsets.UTF_8));
            o.close();
            if (h.getResponseCode() >= 300) return null;
            InputStream in = h.getInputStream();
            byte[] buf = new byte[4096]; StringBuilder sb = new StringBuilder(); int n;
            java.io.ByteArrayOutputStream bo = new java.io.ByteArrayOutputStream();
            while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
            in.close();
            return new JSONObject(new String(bo.toByteArray(), StandardCharsets.UTF_8));
        } catch (Exception e) {
            return null;
        } finally {
            if (h != null) h.disconnect();
        }
    }
}
