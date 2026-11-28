package com.amarupazila.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

/**
 * কিবোর্ড খুললে অ্যাপের পাতা কিবোর্ডের উপর পর্যন্ত ছোট হয়, যাতে মেসেজ লেখার ঘর আর পাঠানোর বোতাম
 * কিবোর্ডের নিচে চাপা না পড়ে। (Android 11+ এবং পুরো-স্ক্রিন / edge-to-edge অ্যাপে ফোন নিজে এটা করে না)
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return;   // পুরোনো ফোনে adjustResize নিজেই কাজ করে
        final View root = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            // নিচের নেভিগেশন বারের জায়গা Capacitor নিজেই রাখে, তাই কিবোর্ডের বাকি অংশটুকু
            int bottom = Math.max(0, ime.bottom - bars.bottom);
            if (v.getPaddingBottom() != bottom) v.setPadding(v.getPaddingLeft(), v.getPaddingTop(), v.getPaddingRight(), bottom);
            return insets;
        });
    }
}
