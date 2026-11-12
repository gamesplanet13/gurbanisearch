package in.gurbanisearch.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

final class Updater {
    private static final String MANIFEST = "https://gamesplanet13.github.io/gurbanisearch/android-updates.json";
    private final Activity activity;
    private final DownloadManager downloads;
    private long downloadId = -1;
    private final BroadcastReceiver receiver = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) {
            if (i.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1) != downloadId) return;
            Uri uri = downloads.getUriForDownloadedFile(downloadId);
            if (uri == null) { activity.runOnUiThread(() -> new AlertDialog.Builder(activity).setMessage("Update download failed. Please try again later.").setPositiveButton("OK", null).show()); return; }
            install(uri);
        }
    };
    Updater(Activity a) {
        activity = a;
        downloads = (DownloadManager) a.getSystemService(Context.DOWNLOAD_SERVICE);
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= 33) a.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED);
        else a.registerReceiver(receiver, filter);
    }
    void check() {
        new Thread(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(MANIFEST + "?v=" + System.currentTimeMillis()).openConnection();
                c.setConnectTimeout(8000); c.setReadTimeout(8000); c.setUseCaches(false);
                if (c.getResponseCode() != 200) { c.disconnect(); return; }
                InputStream input = c.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] b = new byte[4096]; int n; while ((n = input.read(b)) != -1) { out.write(b, 0, n); if (out.size() > 65536) return; }
                input.close(); c.disconnect();
                JSONObject app = new JSONObject(out.toString("UTF-8")).optJSONObject(BuildConfig.ROLE);
                if (app == null || app.optLong("versionCode", 0) <= activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0).versionCode) return;
                String url = app.optString("apkUrl", "");
                Uri uri = Uri.parse(url);
                if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || !(uri.getHost().equals("github.com") || uri.getHost().equals("gamesplanet13.github.io"))) return;
                activity.runOnUiThread(() -> download(url));
            } catch (Exception ignored) { }
        }).start();
    }
    private void download(String url) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("Gurbani app update");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setMimeType("application/vnd.android.package-archive");
            request.setDestinationInExternalFilesDir(activity, Environment.DIRECTORY_DOWNLOADS, "update-" + System.currentTimeMillis() + ".apk");
            downloadId = downloads.enqueue(request);
        } catch (Exception e) { new AlertDialog.Builder(activity).setMessage("Could not start update download.").setPositiveButton("OK", null).show(); }
    }
    private void install(Uri uri) {
        if (Build.VERSION.SDK_INT >= 26 && !activity.getPackageManager().canRequestPackageInstalls()) {
            new AlertDialog.Builder(activity).setTitle("Allow app updates")
              .setMessage("Allow this app to install updates, then open the downloaded update from your notifications.")
              .setPositiveButton("Settings", (d,w) -> activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + activity.getPackageName()))))
              .setNegativeButton("Later", null).show();
            return;
        }
        try { Intent i = new Intent(Intent.ACTION_VIEW); i.setDataAndType(uri, "application/vnd.android.package-archive"); i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION); activity.startActivity(i); }
        catch (Exception e) { new AlertDialog.Builder(activity).setMessage("Open the downloaded update from your notifications to install it.").setPositiveButton("OK", null).show(); }
    }
    void close() { try { activity.unregisterReceiver(receiver); } catch (Exception ignored) {} }
}
