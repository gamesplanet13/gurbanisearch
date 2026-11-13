package in.gurbanisearch.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.content.ClipData;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.graphics.Color;
import android.content.Intent;
import android.net.Uri;

public class MainActivity extends Activity {
    private WebView web;
    private static final int FILE_PICKER_REQUEST=3804;
    private static final int CAMERA_PERMISSION_REQUEST=3805;
    private PermissionRequest pendingMediaPermission;
    private ValueCallback<Uri[]> fileCallback;
    private Updater updater;
    private WifiDiscovery wifiDiscovery;
    private static final String SITE = "https://gamesplanet13.github.io/gurbanisearch/";
    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setBuiltInZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        android.app.UiModeManager uiMode = getSystemService(android.app.UiModeManager.class);
        boolean tvProjection = ("projection".equals(BuildConfig.ROLE) || "book".equals(BuildConfig.ROLE)) && uiMode != null
                && uiMode.getCurrentModeType() == android.content.res.Configuration.UI_MODE_TYPE_TELEVISION;
        web.setWebViewClient(new WebViewClient() {
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view, android.webkit.WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (tvProjection && isTrustedOrigin(uri)
                        && "/gurbanisearch/gurbani-waheguru-wide.js".equals(uri.getPath())) {
                    try {
                        return new android.webkit.WebResourceResponse("application/javascript", "UTF-8",
                                getAssets().open("gurbani-waheguru-wide.js"));
                    } catch (java.io.IOException ignored) { }
                }
                return super.shouldInterceptRequest(view, request);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                return routeWebLink(request.getUrl(), request.isForMainFrame());
            }
            @SuppressWarnings("deprecation")
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return routeWebLink(Uri.parse(url), true);
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
                fileCallback = callback;
                try {
                    // Respect the web input's accepted MIME types and selection mode.
                    // The controller can also import offline data, not just images.
                    Intent choose = params.createIntent();
                    startActivityForResult(choose, FILE_PICKER_REQUEST);
                    return true;
                } catch (Exception ex) {
                    fileCallback.onReceiveValue(null);
                    fileCallback = null;
                    return true;
                }
            }
            @Override public void onPermissionRequest(PermissionRequest request){
                runOnUiThread(() -> {
                    if(!isTrustedOrigin(request.getOrigin())
                            || web.getUrl() == null || !web.getUrl().startsWith(SITE)
                            || !requestHasVideoOnly(request)){
                        request.deny(); return;
                    }
                    if(Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED){
                        if(pendingMediaPermission != null)pendingMediaPermission.deny();
                        pendingMediaPermission=request;
                        requestPermissions(new String[]{Manifest.permission.CAMERA},CAMERA_PERMISSION_REQUEST);
                    }else request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                });
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingMediaPermission == request) pendingMediaPermission = null;
            }
        });
        wifiDiscovery = new WifiDiscovery(this, web, BuildConfig.ROLE);
        web.addJavascriptInterface(wifiDiscovery, "GurbaniWifi");
        setContentView(web);
        updater = new Updater(this);
        web.addJavascriptInterface(new UpdateBridge(), "GurbaniUpdates");
        web.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            Uri uri = Uri.parse(url);
            if (isGurbaniApk(uri)) updater.check(true);
        });
        web.loadUrl(SITE + BuildConfig.START_PAGE + "?app=" + BuildConfig.VERSION_CODE + (tvProjection ? "&display=tv" : ""));
    }
    private boolean routeWebLink(Uri uri, boolean mainFrame) {
        if (isGurbaniApk(uri)) {
            if (mainFrame && updater != null) updater.check(true);
            return true;
        }
        if (isTrustedOrigin(uri) && uri.getPath() != null && uri.getPath().startsWith("/gurbanisearch/")) return false;
        if (mainFrame) {
            try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
            catch (android.content.ActivityNotFoundException ignored) { }
        }
        return true;
    }
    private static boolean isGurbaniApk(Uri uri) {
        String path = uri.getPath();
        return isTrustedOrigin(uri) && path != null && path.startsWith("/gurbanisearch/apk/")
                && path.endsWith(".apk");
    }
    public final class UpdateBridge {
        @android.webkit.JavascriptInterface public void check() {
            runOnUiThread(() -> {
                if (updater != null && web.getUrl() != null && web.getUrl().startsWith(SITE)) {
                    updater.check(true);
                }
            });
        }
    }
    private static boolean isTrustedOrigin(Uri origin) {
        return "https".equals(origin.getScheme()) && "gamesplanet13.github.io".equals(origin.getHost())
                && (origin.getPort() == -1 || origin.getPort() == 443);
    }
    private static boolean requestHasVideoOnly(PermissionRequest request){
        boolean video=false;
        for(String resource:request.getResources()){
            if(PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource))video=true;
            else return false;
        }
        return video;
    }
    @Override public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results){
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode != CAMERA_PERMISSION_REQUEST)return;
        PermissionRequest pending=pendingMediaPermission;
        pendingMediaPermission=null;
        if(pending!=null){
            if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED
                    && web.getUrl()!=null && web.getUrl().startsWith(SITE) && isTrustedOrigin(pending.getOrigin()))
                pending.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else pending.deny();
        }
    }
    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_PICKER_REQUEST) return;
        if (fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == Activity.RESULT_OK && data != null) {
            ClipData clip = data.getClipData();
            if (clip != null && clip.getItemCount() > 0) {
                int count = Math.min(clip.getItemCount(), 20);
                result = new Uri[count];
                for (int i=0; i<count; i++) result[i]=clip.getItemAt(i).getUri();
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }
    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if(focused) getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }
    @Override public void onBackPressed() {
        // Projection on Android TV: back must never quit without confirmation.
        if("projection".equals(BuildConfig.ROLE)) {
            new android.app.AlertDialog.Builder(this)
                .setTitle("Exit Projection?")
                .setMessage("Do you want to close Gurbani Projection?")
                .setNegativeButton("Cancel", (dialog, which) -> dialog.dismiss())
                .setPositiveButton("Exit", (dialog, which) -> finish())
                .show();
            return;
        }
        if(web != null && web.canGoBack()) web.goBack();
        else finish();
    }
    @Override protected void onResume() {
        super.onResume();
        if (updater != null) updater.resume();
    }
    @Override protected void onPause() {
        if (updater != null) updater.pause();
        super.onPause();
    }
    @Override protected void onDestroy() {
        if(pendingMediaPermission != null){pendingMediaPermission.deny();pendingMediaPermission=null;}
        if(fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        if(updater!=null) updater.close();
        if(wifiDiscovery!=null) wifiDiscovery.close();
        if(web!=null) {
            web.removeJavascriptInterface("GurbaniWifi");
            web.removeJavascriptInterface("GurbaniUpdates");
        }
        if(web!=null){web.loadUrl("about:blank");web.destroy();}
        super.onDestroy();
    }
}
