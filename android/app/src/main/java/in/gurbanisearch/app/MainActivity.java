package in.gurbanisearch.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.graphics.Color;
import android.text.InputType;

public class MainActivity extends Activity {
    private WebView web;
    private String baseUrl;
    private boolean projection;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        projection = BuildConfig.START_PAGE.equals("projection.html");
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);
        if (projection) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        web.setOnLongClickListener(v -> { showSettings(); return true; });
        setContentView(web);
        baseUrl = getPreferences(0).getString("server", "");
        if (baseUrl.isEmpty()) showSettings(); else load();
    }
    private void load() {
        if (baseUrl == null || baseUrl.isEmpty()) return;
        String url = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
        web.loadUrl(url + BuildConfig.START_PAGE);
    }
    private void showSettings() {
        EditText input = new EditText(this);
        input.setSingleLine(true);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setText(baseUrl);
        input.setHint("https://your-gurbani-server.example");
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(30, 18, 30, 0);
        TextView help = new TextView(this);
        help.setText("Enter the base URL of a deployed Gurbani Searcher sync server. Controller and Projection must use the same server. For LAN use http://SERVER-IP:PORT. Long press the screen to change URL.");
        help.setTextColor(Color.DKGRAY);
        box.addView(help);
        box.addView(input);
        new AlertDialog.Builder(this).setTitle(projection ? "Gurbani Projection Setup" : "Gurbani Controller Setup")
            .setView(box).setCancelable(false)
            .setPositiveButton("Connect", (d,w)-> {
                String value = input.getText().toString().trim();
                if (!(value.startsWith("https://") || value.startsWith("http://"))) {
                    showSettings(); return;
                }
                baseUrl = value.replaceAll("/+$", "");
                getPreferences(0).edit().putString("server", baseUrl).apply();
                load();
            })
            .setNegativeButton("Close", (d,w)->finish()).show();
    }
    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else showSettings();
    }
    @Override protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
