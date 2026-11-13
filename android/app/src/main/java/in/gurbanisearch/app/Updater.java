package in.gurbanisearch.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.net.HttpURLConnection;
import java.net.URL;

final class Updater {
    private static final String HOST = "gamesplanet13.github.io";
    private static final String SITE = "https://" + HOST + "/gurbanisearch/";
    private static final String APK_TYPE = "application/vnd.android.package-archive";
    private final Activity activity;
    private final DownloadManager downloads;
    private final SharedPreferences state;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean active;
    private boolean closed;
    private boolean prompted;
    private boolean waitingForPermission;
    private AlertDialog dialog;
    private boolean checking;
    private boolean startupChecked;

    Updater(Activity activity) {
        this.activity = activity;
        downloads = activity.getSystemService(DownloadManager.class);
        state = activity.getSharedPreferences("app-update", Activity.MODE_PRIVATE);
    }

    void check(boolean manual) {
        if (downloads == null) {
            if (manual) showError("Android Download Manager is unavailable on this device.");
            return;
        }
        if (checking) return;
        checking = true;
        new Thread(() -> {
            try {
                JSONObject update = readManifest().getJSONObject(BuildConfig.ROLE);
                long version = update.getLong("versionCode");
                Uri uri = Uri.parse(update.getString("apkUrl"));
                String filename = "Gurbani_" + BuildConfig.ROLE + "_" + version + ".apk";
                if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getAuthority())
                        || !("/gurbanisearch/apk/" + filename).equals(uri.getPath())) {
                    throw new IllegalStateException("Unexpected update URL");
                }
                handler.post(() -> {
                    checking = false;
                    if (closed) return;
                    if (!active) { if (!manual) startupChecked = false; return; }
                    if (version <= BuildConfig.VERSION_CODE) {
                        if (manual) showError("Latest on GitHub: " + filename + "\nThis app is up to date.");
                    } else if (state.getLong("version", 0) == version && state.getLong("download", -1) >= 0) {
                        prompted = false;
                        poll();
                        if (manual && !prompted && state.getLong("download", -1) >= 0) {
                            showError("Downloading " + filename + "… The Install button appears when it is ready.");
                        }
                    } else {
                        if (dialog != null) dialog.dismiss();
                        dialog = new AlertDialog.Builder(activity).setTitle("Update available")
                                .setMessage(filename)
                                .setPositiveButton("Update", (d, w) -> enqueue(version, uri))
                                .setNegativeButton("Later", null).show();
                    }
                });
            } catch (Exception error) {
                Log.w("GurbaniUpdater", "Update check failed", error);
                handler.post(() -> {
                    checking = false;
                    if (manual) showError("Could not check GitHub for updates. Try again when online.");
                });
            }
        }, "gurbani-update-check").start();
    }

    private JSONObject readManifest() throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(SITE + "android-updates.json").openConnection();
        connection.setConnectTimeout(8000);
        connection.setReadTimeout(8000);
        connection.setUseCaches(false);
        connection.setInstanceFollowRedirects(false);
        try {
            if (connection.getResponseCode() != 200) throw new IllegalStateException("Update manifest unavailable");
            try (InputStream input = connection.getInputStream()) {
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                byte[] buffer = new byte[4096];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > 65536) throw new IllegalStateException("Update manifest too large");
                    output.write(buffer, 0, count);
                }
                return new JSONObject(output.toString("UTF-8"));
            }
        } finally {
            connection.disconnect();
        }
    }

    private void enqueue(long version, Uri uri) {
        if (closed) return;
        if (state.getLong("version", 0) != version || state.getLong("download", -1) < 0) {
            forgetDownload();
            try {
                DownloadManager.Request request = new DownloadManager.Request(uri)
                        .setTitle("Gurbani app update")
                        .setAllowedOverRoaming(false)
                        .setMimeType(APK_TYPE)
                        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                        .setDestinationInExternalFilesDir(activity, Environment.DIRECTORY_DOWNLOADS,
                                "gurbani-update-" + version + "-" + System.currentTimeMillis() + ".apk");
                state.edit().putLong("download", downloads.enqueue(request)).putLong("version", version).apply();
                prompted = false;
                showError("Downloading update… The Install button appears when it is ready.");
            } catch (RuntimeException error) {
                Log.w("GurbaniUpdater", "Update download could not start", error);
                showError("Could not start the update download. Reopen the app to try again.");
            }
        }
        poll();
    }

    void resume() {
        active = true;
        if (downloads == null) return;
        if (!startupChecked) { startupChecked = true; check(false); }
        if (state.getLong("version", 0) <= BuildConfig.VERSION_CODE) forgetDownload();
        if (waitingForPermission) {
            waitingForPermission = false;
            if (canInstall()) {
                long id = state.getLong("download", -1);
                Uri uri = downloads.getUriForDownloadedFile(id);
                if (uri != null) { launchInstaller(uri); return; }
            }
            prompted = false;
        }
        poll();
    }

    void pause() {
        active = false;
        handler.removeCallbacks(pollDownload);
    }

    private final Runnable pollDownload = this::poll;

    private void poll() {
        handler.removeCallbacks(pollDownload);
        if (!active || closed || prompted || downloads == null) return;
        long id = state.getLong("download", -1);
        if (id < 0) return;
        try (Cursor cursor = downloads.query(new DownloadManager.Query().setFilterById(id))) {
            if (cursor == null || !cursor.moveToFirst()) {
                forgetDownload();
                return;
            }
            int status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                Uri uri = downloads.getUriForDownloadedFile(id);
                String location = cursor.getString(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI));
                if (uri != null && isMatchingUpdate(location, state.getLong("version", 0))) {
                    showInstall(uri);
                } else {
                    forgetDownload();
                    showError("The download did not match this app’s package, version, or signing certificate.");
                }
            } else if (status == DownloadManager.STATUS_FAILED) {
                forgetDownload();
                showError("Update download failed. Reopen the app to try again.");
            } else {
                handler.postDelayed(pollDownload, 900);
            }
        } catch (RuntimeException error) {
            Log.w("GurbaniUpdater", "Update download status unavailable", error);
        }
    }

    @SuppressWarnings("deprecation")
    private boolean isMatchingUpdate(String location, long version) {
        if (location == null) return false;
        Uri file = Uri.parse(location);
        if (!"file".equals(file.getScheme()) || file.getPath() == null) return false;
        PackageManager packages = activity.getPackageManager();
        PackageInfo apk = packages.getPackageArchiveInfo(file.getPath(), PackageManager.GET_SIGNATURES);
        if (apk == null || !activity.getPackageName().equals(apk.packageName)
                || (Build.VERSION.SDK_INT >= 28 ? apk.getLongVersionCode() : apk.versionCode) != version) return false;
        try {
            PackageInfo installed = packages.getPackageInfo(activity.getPackageName(), PackageManager.GET_SIGNATURES);
            return apk.signatures != null && installed.signatures != null && Arrays.equals(apk.signatures, installed.signatures);
        } catch (PackageManager.NameNotFoundException error) {
            return false;
        }
    }

    private void showInstall(Uri uri) {
        prompted = true;
        if (dialog != null) dialog.dismiss();
        dialog = new AlertDialog.Builder(activity).setTitle("Update ready")
                .setMessage("Gurbani update " + state.getLong("version", 0) + " has downloaded. Install it now?")
                .setPositiveButton("Install", (d, w) -> install(uri))
                .setNegativeButton("Later", null).show();
    }

    private boolean canInstall() {
        return Build.VERSION.SDK_INT < 26 || activity.getPackageManager().canRequestPackageInstalls();
    }

    private void install(Uri uri) {
        if (canInstall()) { launchInstaller(uri); return; }
        dialog = new AlertDialog.Builder(activity).setTitle("Allow Gurbani updates")
                .setMessage("Allow installs from this app in Android Settings. The installer will open when you return.")
                .setPositiveButton("Settings", (d, w) -> {
                    try {
                        waitingForPermission = true;
                        activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                                Uri.parse("package:" + activity.getPackageName())));
                    } catch (RuntimeException error) {
                        waitingForPermission = false;
                        showError("Open Android Settings and allow installs from this Gurbani app.");
                    }
                })
                .setNegativeButton("Later", null).show();
    }

    @SuppressWarnings("deprecation")
    private void launchInstaller(Uri uri) {
        try {
            Intent intent = new Intent(Intent.ACTION_INSTALL_PACKAGE, uri);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(intent);
        } catch (RuntimeException error) {
            showError("Android could not open its package installer. Reopen the app to try again.");
        }
    }

    private void forgetDownload() {
        long id = state.getLong("download", -1);
        if (id >= 0) downloads.remove(id);
        state.edit().remove("download").remove("version").apply();
    }

    private void showError(String message) {
        if (!active || closed) return;
        if (dialog != null) dialog.dismiss();
        dialog = new AlertDialog.Builder(activity).setMessage(message).setPositiveButton("OK", null).show();
    }

    void close() {
        closed = true;
        handler.removeCallbacksAndMessages(null);
        if (dialog != null) dialog.dismiss();
    }
}
