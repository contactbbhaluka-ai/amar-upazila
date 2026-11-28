package com.amarupazila.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import androidx.core.app.RemoteInput;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** নোটিফিকেশনের বোতাম: অ্যাপ না খুলেই সার্ভারে পাঠায় (push_reply) */
public class AuReplyReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        final String conv = intent.getStringExtra("conv");
        String a = intent.getAction() == null ? "" : intent.getAction();
        if (conv == null || !a.startsWith("com.amarupazila.app.PUSH_")) return;
        final String action = a.substring("com.amarupazila.app.PUSH_".length()).toLowerCase();
        if ("clear".equals(action)) { AuMessagingService.clear(c, conv); return; }
        final JSONObject st = AuMessagingService.load(c, conv);
        if (st == null) { AuMessagingService.cancel(c, conv); return; }
        String text = null;
        if ("reply".equals(action)) {
            Bundle r = RemoteInput.getResultsFromIntent(intent);
            CharSequence cs = r == null ? null : r.getCharSequence(AuMessagingService.KEY_REPLY);
            text = cs == null ? "" : cs.toString().trim();
            if (text.isEmpty()) return;
        }
        final String reply = text;
        final PendingResult pr = goAsync();
        new Thread(() -> {
            try {
                String rpcAction = "like".equals(action) ? "react" : action;
                JSONObject res = call(st, rpcAction, "like".equals(action) ? "👍" : reply, "like".equals(action) ? st.optString("mid") : null);
                boolean ok = res != null && res.optBoolean("ok");
                String err = res == null ? "net" : res.optString("error");
                if (ok) st.put("me", res.optString("me", "আপনি"));
                switch (action) {
                    case "reply":
                        if (ok) {
                            JSONObject m = new JSONObject();
                            m.put("me", true); m.put("t", reply); m.put("at", System.currentTimeMillis());
                            JSONArray h = st.getJSONArray("hist"); h.put(m);
                            while (h.length() > 7) h.remove(0);
                            AuMessagingService.save(c, conv, st);
                            AuMessagingService.show(c, conv, st, true, null);
                        } else AuMessagingService.show(c, conv, st, true, errText(err));
                        break;
                    case "read":
                    case "like":
                        if (ok) AuMessagingService.cancel(c, conv);
                        else AuMessagingService.show(c, conv, st, true, errText(err));
                        break;
                    case "accept":
                    case "decline":
                    case "donate":
                        String done = !ok ? ("gone".equals(err) ? "এটা আর নেই বা আগেই করা হয়েছে" : errText(err))
                            : "accept".equals(action) ? "✓ আপনারা এখন বন্ধু"
                            : "decline".equals(action) ? "রিকোয়েস্ট মুছে ফেলা হয়েছে"
                            : "ধন্যবাদ! আপনি রক্ত দিতে পারবেন, সেটা মেসেজে জানিয়ে দেওয়া হয়েছে 🩸";
                        st.put("rt", "");   // একবারই চাপা যায়
                        AuMessagingService.show(c, conv, st, true, done);
                        AuMessagingService.clear(c, conv);
                        break;
                }
            } catch (Exception ignored) {
            } finally {
                pr.finish();
            }
        }).start();
    }

    private static String errText(String err) {
        return "expired".equals(err) ? "⚠️ সময় শেষ, অ্যাপ খুলে করুন"
            : "blocked".equals(err) ? "⚠️ এই ব্যক্তিকে পাঠানো যাচ্ছে না"
            : "⚠️ হয়নি, ইন্টারনেট দেখে আবার চেষ্টা করুন";
    }

    private static JSONObject call(JSONObject st, String action, String text, String mid) {
        HttpURLConnection h = null;
        try {
            JSONObject body = new JSONObject();
            body.put("p_token", st.optString("rt"));
            body.put("p_action", action);
            if (text != null) body.put("p_text", text);
            if (mid != null && !mid.isEmpty()) body.put("p_mid", Long.parseLong(mid));
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
            byte[] buf = new byte[4096]; int n;
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
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
