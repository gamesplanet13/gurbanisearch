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
import android.webkit.WebChromeClient.FileChooserParams;
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
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                Uri uri=request.getUrl();
                if ("gamesplanet13.github.io".equals(uri.getHost()) && uri.getPath()!=null && uri.getPath().startsWith("/gurbanisearch/")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); }catch(Exception ignored){}
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
                fileCallback = callback;
                try {
                    Intent choose = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    choose.addCategory(Intent.CATEGORY_OPENABLE);
                    choose.setType("image/*");
                    choose.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
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
                    if(!request.getOrigin().toString().startsWith(SITE) || !requestHasVideoOnly(request)){
                        request.deny(); return;
                    }
                    if(Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED){
                        if(pendingMediaPermission != null)pendingMediaPermission.deny();
                        pendingMediaPermission=request;
                        requestPermissions(new String[]{Manifest.permission.CAMERA},CAMERA_PERMISSION_REQUEST);
                    }else request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                });
            }
        });
        wifiDiscovery = new WifiDiscovery(this, web, BuildConfig.ROLE);
        web.addJavascriptInterface(wifiDiscovery, "GurbaniWifi");
        setContentView(web);
        web.loadUrl(SITE + BuildConfig.START_PAGE + "?app=20261116");
        updater = new Updater(this);
        updater.check();
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
            if(results.length>0 && results[0]==PackageManager.PERMISSION_GRANTED)
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
        if(web != null && web.canGoBack()) web.goBack();
        else finish();
    }
    @Override protected void onDestroy() {
        if(pendingMediaPermission != null){pendingMediaPermission.deny();pendingMediaPermission=null;}
        if(fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback = null; }
        if(updater!=null) updater.close();
        if(wifiDiscovery!=null) wifiDiscovery.close();
        if(web!=null) web.removeJavascriptInterface("GurbaniWifi");
        if(web!=null){web.loadUrl("about:blank");web.destroy();}
        super.onDestroy();
    }
}