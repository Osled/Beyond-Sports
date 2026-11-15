package com.osled.mythbond;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Exposes window.MythbondAndroid to the game (see src/main.ts).
        getBridge().getWebView().addJavascriptInterface(new AppBridge(), "MythbondAndroid");
    }

    @Override
    public void onResume() {
        super.onResume();
        // Opening the app always brings her back from the home screen into the device.
        stopService(new Intent(this, PetOverlayService.class));
    }

    private class AppBridge {
        /** Starts home-screen mode. Returns false (and opens the permission screen) if overlays aren't allowed yet. */
        @JavascriptInterface
        public boolean startOverlay() {
            if (Build.VERSION.SDK_INT >= 23 && !Settings.canDrawOverlays(MainActivity.this)) {
                Intent ask = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName()));
                startActivity(ask);
                return false;
            }
            Intent service = new Intent(MainActivity.this, PetOverlayService.class);
            if (Build.VERSION.SDK_INT >= 26) startForegroundService(service);
            else startService(service);
            runOnUiThread(() -> moveTaskToBack(true));
            return true;
        }
    }
}
