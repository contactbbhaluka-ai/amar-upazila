package com.amarupazila.app;

import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/** চ্যাট বাবল (Android 11+): ভাসমান গোল ছবিতে চাপলে ছোট জানালায় শুধু ওই চ্যাট খোলে */
public class BubbleActivity extends BridgeActivity {
    private String conv = "";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        String c = getIntent() == null ? null : getIntent().getStringExtra("conv");
        conv = c == null ? "" : c.replaceAll("[^A-Za-z0-9-]", "");
        if (bridge != null) bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView w) {
                w.evaluateJavascript("window.__auBubble='" + conv + "';window.auBubble&&window.auBubble('" + conv + "')", null);
            }
        });
    }
}
