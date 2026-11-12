package in.gurbanisearch.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/** Checks for an update; installation is always handled by the user's browser and Android. */
final class Updater {
    private static final String MANIFEST = "https://gamesplanet13.github.io/gurbanisearch/android-updates.json";
    private final Activity activity;
    private volatile boolean closed;
    Updater(Activity activity) { this.activity = activity; }
    void check() {
        new Thread(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(MANIFEST + "?v=" + System.currentTimeMillis()).openConnection();
                c.setConnectTimeout(8000); c.setReadTimeout(8000); c.setUseCaches(false);
                if (c.getResponseCode() != 200) { c.disconnect(); return; }
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                try (InputStream in = c.getInputStream()) {
                    byte[] b = new byte[4096]; int n;
                    while ((n = in.read(b)) != -1) { out.write(b, 0, n); if (out.size() > 65536) return; }
                } finally { c.disconnect(); }
                JSONObject app = new JSONObject(out.toString("UTF-8")).optJSONObject(BuildConfig.ROLE);
                if (app == null || app.optLong("versionCode", 0) <= activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0).versionCode) return;
                Uri uri = Uri.parse(app.optString("apkUrl", ""));
                if (!"https".equalsIgnoreCase(uri.getScheme()) || !"gamesplanet13.github.io".equalsIgnoreCase(uri.getHost()) || uri.getPath() == null || !uri.getPath().startsWith("/gurbanisearch/apk/")) return;
                activity.runOnUiThread(() -> {
                    if (closed || activity.isFinishing()) return;
                    new AlertDialog.Builder(activity).setTitle("App update available")
                        .setMessage("A new version is available. Open the browser to download it? Android will ask you to confirm installation.")
                        .setPositiveButton("Download", (d,w) -> {
                            try { activity.startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                            catch (Exception e) { new AlertDialog.Builder(activity).setMessage("Could not open a browser to download the update.").setPositiveButton("OK", null).show(); }
                        }).setNegativeButton("Later", null).show();
                });
            } catch (Exception ignored) { }
        }).start();
    }
    void close() { closed = true; }
}
