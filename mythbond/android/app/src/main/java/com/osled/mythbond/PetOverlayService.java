package com.osled.mythbond;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;

/**
 * Home-screen mode: a small transparent window that floats over other apps and shows the
 * companion walking along the bottom of the screen. It runs the same web game in "?overlay=1"
 * mode from the same origin as the app (https://localhost), so both share one save.
 */
public class PetOverlayService extends Service {
    private static final String CHANNEL = "home_screen";
    // Window sizes in dp: pet only, and with her menu / speech bubble open.
    private static final int COMPACT_W = 130, COMPACT_H = 150, EXPANDED_W = 320, EXPANDED_H = 340;
    private static final int BOTTOM_MARGIN = 56;

    private final Handler ui = new Handler(Looper.getMainLooper());
    private WindowManager wm;
    private WebView web;
    private WindowManager.LayoutParams lp;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        goForeground();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        createWindow();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        if (web != null) {
            wm.removeView(web);
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private void goForeground() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "Home-screen companion", NotificationManager.IMPORTANCE_MIN));
        }
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent tap = PendingIntent.getActivity(this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        Notification n = b
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle("Your companion is on the home screen")
            .setContentText("Tap to open Mythbond")
            .setContentIntent(tap)
            .setOngoing(true)
            .build();
        if (Build.VERSION.SDK_INT >= 34) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        else startForeground(1, n);
    }

    @SuppressLint({ "SetJavaScriptEnabled", "AddJavascriptInterface" })
    private void createWindow() {
        web = new WebView(this);
        web.setBackgroundColor(Color.TRANSPARENT);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .setDomain("localhost")
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });
        web.addJavascriptInterface(new OverlayBridge(), "MythbondOverlay");

        int type = Build.VERSION.SDK_INT >= 26
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;
        lp = new WindowManager.LayoutParams(
            dp(COMPACT_W), dp(COMPACT_H), type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        DisplayMetrics dm = getResources().getDisplayMetrics();
        lp.x = (dm.widthPixels - lp.width) / 2;
        lp.y = dm.heightPixels - lp.height - dp(BOTTOM_MARGIN);
        wm.addView(web, lp);
        // Capacitor copies the web build to assets/public; same https://localhost origin as the app.
        web.loadUrl("https://localhost/public/index.html?overlay=1");
    }

    private void resize(int wDp, int hDp) {
        DisplayMetrics dm = getResources().getDisplayMetrics();
        int centre = lp.x + lp.width / 2;
        int bottom = lp.y + lp.height;
        lp.width = dp(wDp);
        lp.height = dp(hDp);
        lp.x = Math.max(0, Math.min(dm.widthPixels - lp.width, centre - lp.width / 2));
        lp.y = Math.max(0, bottom - lp.height);
        wm.updateViewLayout(web, lp);
    }

    /** window.MythbondOverlay, called from the game running inside the overlay. */
    private class OverlayBridge {
        @JavascriptInterface
        public void moveBy(final int dxDp) {
            ui.post(() -> {
                if (web == null) return;
                DisplayMetrics dm = getResources().getDisplayMetrics();
                lp.x = Math.max(0, Math.min(dm.widthPixels - lp.width, lp.x + dp(dxDp)));
                wm.updateViewLayout(web, lp);
            });
        }

        /** Drag the window by the given distance (used by the docked device). */
        @JavascriptInterface
        public void dragBy(final int dxDp, final int dyDp) {
            ui.post(() -> {
                if (web == null) return;
                DisplayMetrics dm = getResources().getDisplayMetrics();
                lp.x = Math.max(0, Math.min(dm.widthPixels - lp.width, lp.x + dp(dxDp)));
                lp.y = Math.max(0, Math.min(dm.heightPixels - lp.height, lp.y + dp(dyDp)));
                wm.updateViewLayout(web, lp);
            });
        }

        /** Set the window size, keeping its bottom-centre in place (used by the docked device). */
        @JavascriptInterface
        public void setWindow(final int wDp, final int hDp) {
            ui.post(() -> {
                if (web != null) resize(wDp, hDp);
            });
        }

        @JavascriptInterface
        public void setExpanded(final boolean on) {
            ui.post(() -> {
                if (web != null) resize(on ? EXPANDED_W : COMPACT_W, on ? EXPANDED_H : COMPACT_H);
            });
        }

        @JavascriptInterface
        public void openApp() {
            ui.post(() -> {
                Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
                if (open != null) {
                    open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(open);
                }
                stopSelf();
            });
        }
    }
}
