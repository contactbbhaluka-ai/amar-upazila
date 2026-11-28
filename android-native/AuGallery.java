package com.amarupazila.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Size;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * অ্যাপের ভেতরেই ফোনের ছবির গ্যালারি (Messenger-এর মতো): ছোট ছবির তালিকা, অ্যালবাম, আর বাছাই করা ছবি।
 * ছবি ফোন থেকে কোথাও যায় না; ব্যবহারকারী যেটা পাঠাতে বাছেন শুধু সেটাই অ্যাপ পায়।
 */
@CapacitorPlugin(name = "AuGallery", permissions = {
    @Permission(alias = "photos", strings = { "android.permission.READ_MEDIA_IMAGES" }),
    @Permission(alias = "partial", strings = { "android.permission.READ_MEDIA_VISUAL_USER_SELECTED" }),
    @Permission(alias = "storage", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
})
public class AuGallery extends Plugin {
    private static final String PARTIAL = "android.permission.READ_MEDIA_VISUAL_USER_SELECTED";

    private String alias() { return Build.VERSION.SDK_INT >= 33 ? "photos" : "storage"; }

    private String state() {
        if (getPermissionState(alias()) == PermissionState.GRANTED) return "granted";
        if (Build.VERSION.SDK_INT >= 34 && ContextCompat.checkSelfPermission(getContext(), PARTIAL) == PackageManager.PERMISSION_GRANTED) return "partial";
        PermissionState s = getPermissionState(alias());
        return s == PermissionState.DENIED ? "denied" : "prompt";
    }

    @PluginMethod
    public void status(PluginCall call) { JSObject r = new JSObject(); r.put("state", state()); call.resolve(r); }

    @PluginMethod
    public void request(PluginCall call) {
        if ("granted".equals(state())) { status(call); return; }
        // Android 14+: "কিছু ছবি বাছুন" বা "সব ছবি" — দুটোই চাওয়া হয়
        if (Build.VERSION.SDK_INT >= 34) requestPermissionForAliases(new String[]{ "photos", "partial" }, call, "permCb");
        else requestPermissionForAlias(alias(), call, "permCb");
    }

    @PermissionCallback
    private void permCb(PluginCall call) { status(call); }

    private boolean allowed() { String s = state(); return "granted".equals(s) || "partial".equals(s); }

    // ---------------------------------------------------------------- ছবির তালিকা (নতুনগুলো আগে)
    @PluginMethod
    public void list(PluginCall call) {
        if (!allowed()) { call.reject("permission"); return; }
        final String album = call.getString("album", "");
        final int offset = Math.max(0, call.getInt("offset", 0));
        final int limit = Math.min(120, Math.max(1, call.getInt("limit", 60)));
        final int thumb = Math.min(400, Math.max(96, call.getInt("thumb", 240)));
        new Thread(() -> {
            try {
                ContentResolver cr = getContext().getContentResolver();
                Uri base = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                String[] proj = { MediaStore.Images.Media._ID, MediaStore.Images.Media.DATE_ADDED, MediaStore.Images.Media.ORIENTATION };
                String sel = album.isEmpty() ? null : MediaStore.Images.Media.BUCKET_ID + "=?";
                String[] args = album.isEmpty() ? null : new String[]{ album };
                Cursor c;
                if (Build.VERSION.SDK_INT >= 30) {
                    Bundle q = new Bundle();
                    if (sel != null) { q.putString(ContentResolver.QUERY_ARG_SQL_SELECTION, sel); q.putStringArray(ContentResolver.QUERY_ARG_SQL_SELECTION_ARGS, args); }
                    q.putStringArray(ContentResolver.QUERY_ARG_SORT_COLUMNS, new String[]{ MediaStore.Images.Media.DATE_ADDED });
                    q.putInt(ContentResolver.QUERY_ARG_SORT_DIRECTION, ContentResolver.QUERY_SORT_DIRECTION_DESCENDING);
                    q.putInt(ContentResolver.QUERY_ARG_LIMIT, limit);
                    q.putInt(ContentResolver.QUERY_ARG_OFFSET, offset);
                    c = cr.query(base, proj, q, null);
                } else {
                    c = cr.query(base, proj, sel, args, MediaStore.Images.Media.DATE_ADDED + " DESC LIMIT " + limit + " OFFSET " + offset);
                }
                JSArray out = new JSArray();
                if (c != null) {
                    while (c.moveToNext()) {
                        long id = c.getLong(0);
                        String t = thumbB64(cr, id, c.getInt(2), thumb);
                        if (t == null) continue;
                        JSObject o = new JSObject();
                        o.put("id", String.valueOf(id)); o.put("thumb", t); o.put("date", c.getLong(1));
                        out.put(o);
                    }
                    c.close();
                }
                JSObject r = new JSObject(); r.put("items", out); r.put("more", out.length() >= limit);
                call.resolve(r);
            } catch (Exception e) { call.reject("list: " + e.getMessage()); }
        }).start();
    }

    // ---------------------------------------------------------------- অ্যালবাম (ক্যামেরা, স্ক্রিনশট, WhatsApp …)
    @PluginMethod
    public void albums(PluginCall call) {
        if (!allowed()) { call.reject("permission"); return; }
        new Thread(() -> {
            try {
                ContentResolver cr = getContext().getContentResolver();
                String[] proj = { MediaStore.Images.Media.BUCKET_ID, MediaStore.Images.Media.BUCKET_DISPLAY_NAME, MediaStore.Images.Media._ID, MediaStore.Images.Media.ORIENTATION };
                Cursor c = cr.query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, proj, null, null, MediaStore.Images.Media.DATE_ADDED + " DESC");
                Map<String, long[]> info = new LinkedHashMap<>();   // bucket → [count, coverId, orientation]
                Map<String, String> names = new LinkedHashMap<>();
                if (c != null) {
                    while (c.moveToNext()) {
                        String b = c.getString(0); if (b == null) continue;
                        long[] v = info.get(b);
                        if (v == null) { info.put(b, new long[]{ 1, c.getLong(2), c.getInt(3) }); names.put(b, c.getString(1) == null ? "অন্যান্য" : c.getString(1)); }
                        else v[0]++;
                    }
                    c.close();
                }
                JSArray out = new JSArray();
                for (Map.Entry<String, long[]> e : info.entrySet()) {
                    JSObject o = new JSObject();
                    o.put("id", e.getKey()); o.put("name", names.get(e.getKey())); o.put("count", e.getValue()[0]);
                    o.put("cover", thumbB64(cr, e.getValue()[1], (int) e.getValue()[2], 200));
                    out.put(o);
                }
                JSObject r = new JSObject(); r.put("albums", out); call.resolve(r);
            } catch (Exception e) { call.reject("albums: " + e.getMessage()); }
        }).start();
    }

    // ---------------------------------------------------------------- বাছাই করা ছবি (পাঠানোর মাপে ছোট করে)
    @PluginMethod
    public void get(PluginCall call) {
        if (!allowed()) { call.reject("permission"); return; }
        final long id; try { id = Long.parseLong(call.getString("id", "")); } catch (Exception e) { call.reject("id"); return; }
        final int max = Math.min(2560, Math.max(320, call.getInt("max", 1600)));
        new Thread(() -> {
            try {
                ContentResolver cr = getContext().getContentResolver();
                Uri u = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id);
                int rot = 0;
                Cursor c = cr.query(u, new String[]{ MediaStore.Images.Media.ORIENTATION }, null, null, null);
                if (c != null) { if (c.moveToFirst()) rot = c.getInt(0); c.close(); }
                BitmapFactory.Options o = new BitmapFactory.Options(); o.inJustDecodeBounds = true;
                InputStream in = cr.openInputStream(u); BitmapFactory.decodeStream(in, null, o); if (in != null) in.close();
                int s = 1; while (Math.max(o.outWidth, o.outHeight) / (s * 2) >= max) s *= 2;
                BitmapFactory.Options o2 = new BitmapFactory.Options(); o2.inSampleSize = s;
                in = cr.openInputStream(u); Bitmap b = BitmapFactory.decodeStream(in, null, o2); if (in != null) in.close();
                if (b == null) { call.reject("decode"); return; }
                float k = Math.min(1f, (float) max / Math.max(b.getWidth(), b.getHeight()));
                Matrix m = new Matrix(); if (k < 1f) m.postScale(k, k); if (rot != 0) m.postRotate(rot);
                if (k < 1f || rot != 0) b = Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true);
                ByteArrayOutputStream bo = new ByteArrayOutputStream();
                b.compress(Bitmap.CompressFormat.JPEG, 84, bo);
                JSObject r = new JSObject();
                r.put("data", Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP));
                r.put("mime", "image/jpeg"); r.put("w", b.getWidth()); r.put("h", b.getHeight());
                call.resolve(r);
            } catch (Exception e) { call.reject("get: " + e.getMessage()); }
        }).start();
    }

    private String thumbB64(ContentResolver cr, long id, int rot, int size) {
        try {
            Uri u = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id);
            Bitmap b;
            if (Build.VERSION.SDK_INT >= 29) b = cr.loadThumbnail(u, new Size(size, size), null);
            else {
                b = MediaStore.Images.Thumbnails.getThumbnail(cr, id, MediaStore.Images.Thumbnails.MINI_KIND, null);
                if (b != null && rot != 0) { Matrix m = new Matrix(); m.postRotate(rot); b = Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true); }
            }
            if (b == null) return null;
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.JPEG, 70, bo);
            return "data:image/jpeg;base64," + Base64.encodeToString(bo.toByteArray(), Base64.NO_WRAP);
        } catch (Exception e) { return null; }
    }
}
