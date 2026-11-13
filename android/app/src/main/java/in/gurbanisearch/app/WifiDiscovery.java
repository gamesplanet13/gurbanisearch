package in.gurbanisearch.app;

import android.app.Activity;
import android.content.Context;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.json.JSONObject;

/** Discovers Gurbani displays on the local Wi-Fi network; media stays on PeerJS. */
public final class WifiDiscovery {
    private static final int PORT = 46823;
    private static final String QUERY = "GURBANI_FIND_V1:";
    private final Activity activity;
    private final WebView web;
    private final String role;
    private volatile boolean running = true;
    private volatile boolean scanning = false;
    private volatile String code = "";
    private volatile String deviceName = "";
    private volatile DatagramSocket listener;
    private WifiManager.MulticastLock lock;

    WifiDiscovery(Activity activity, WebView web, String role) {
        this.activity = activity; this.web = web; this.role = role;
        if ("projection".equals(role) || "book".equals(role)) listen();
    }
    private void callback(String js) {
        activity.runOnUiThread(() -> { if (running && !activity.isFinishing()) web.evaluateJavascript(js, null); });
    }
    @JavascriptInterface public void advertise(String value, String name) {
        if ("controller".equals(role) || value == null || !value.matches("[0-9]{5}")) return;
        code = value;
        deviceName = name == null ? "" : name.trim().substring(0, Math.min(name.trim().length(), 50));
    }
    @JavascriptInterface public void search() {
        if (!"controller".equals(role)) return;
        synchronized (this) { if (scanning) return; scanning = true; }
        new Thread(() -> {
            String error = "";
            String nonce = UUID.randomUUID().toString();
            try (DatagramSocket socket = new DatagramSocket()) {
                socket.setBroadcast(true); socket.setSoTimeout(600);
                byte[] query = (QUERY + nonce).getBytes(StandardCharsets.UTF_8);
                InetAddress broadcast = InetAddress.getByName("255.255.255.255");
                long until = System.currentTimeMillis() + 7000, next = 0;
                while (running && System.currentTimeMillis() < until) {
                    if (System.currentTimeMillis() >= next) {
                        socket.send(new DatagramPacket(query, query.length, broadcast, PORT));
                        next = System.currentTimeMillis() + 1500;
                    }
                    try {
                        byte[] data = new byte[1200]; DatagramPacket packet = new DatagramPacket(data, data.length); socket.receive(packet);
                        JSONObject reply = new JSONObject(new String(packet.getData(), 0, packet.getLength(), StandardCharsets.UTF_8));
                        String c = reply.optString("code", ""), n = reply.optString("name", "Projection"), k = reply.optString("role", "");
                        if (!nonce.equals(reply.optString("nonce")) || !"GURBANI_DISPLAY_V1".equals(reply.optString("type")) || !c.matches("[0-9]{5}") || !("book".equals(k) || "projection".equals(k))) continue;
                        n = n.substring(0, Math.min(80, n.length()));
                        callback("if(window.gbWifiFound)window.gbWifiFound(" + JSONObject.quote(c) + "," + JSONObject.quote(n) + "," + JSONObject.quote(k) + ")");
                    } catch (SocketTimeoutException ignored) {} catch (org.json.JSONException ignored) {}
                }
            } catch (Exception e) { error = "Wi-Fi search unavailable. Check Wi-Fi and try again."; }
            finally {
                scanning = false;
                callback("if(window.gbWifiFinished)window.gbWifiFinished(" + JSONObject.quote(error) + ")");
            }
        }, "gurbani-wifi-search").start();
    }
    private void listen() {
        new Thread(() -> {
            try {
                WifiManager wifi = (WifiManager) activity.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                if (wifi != null) { try { lock = wifi.createMulticastLock("gurbani-discovery"); lock.setReferenceCounted(false); lock.acquire(); } catch (Exception e) { android.util.Log.w("GurbaniWifi", "Wi-Fi lock unavailable", e); } }
                DatagramSocket sock = new DatagramSocket(null); listener = sock;
                sock.setReuseAddress(true); sock.setBroadcast(true); sock.bind(new InetSocketAddress(PORT)); sock.setSoTimeout(1000);
                while (running) {
                    try {
                        byte[] data = new byte[512]; DatagramPacket request = new DatagramPacket(data, data.length); sock.receive(request);
                        String text = new String(request.getData(), 0, request.getLength(), StandardCharsets.UTF_8);
                        String currentCode = code;
                        if (!text.startsWith(QUERY) || !currentCode.matches("[0-9]{5}")) continue;
                        String nonce = text.substring(QUERY.length());
                        if (!nonce.matches("[a-f0-9-]{36}")) continue;
                        String model = Build.MODEL == null ? "Android" : Build.MODEL;
                        String label = deviceName.isEmpty() ? ("book".equals(role) ? "Book View" : "Projection") : deviceName;
                        if (!label.toLowerCase().contains(model.toLowerCase())) label += " · " + model;
                        if (label.length() > 80) label = label.substring(0,80);
                        JSONObject reply = new JSONObject(); reply.put("type", "GURBANI_DISPLAY_V1"); reply.put("nonce", nonce); reply.put("code", currentCode); reply.put("name", label); reply.put("role", role);
                        byte[] out = reply.toString().getBytes(StandardCharsets.UTF_8);
                        sock.send(new DatagramPacket(out, out.length, request.getAddress(), request.getPort()));
                    } catch (SocketTimeoutException ignored) {} catch (org.json.JSONException ignored) {}
                }
            } catch (Exception e) { android.util.Log.w("GurbaniWifi", "Discovery listener unavailable", e); }
            finally { if (listener != null) listener.close(); if (lock != null && lock.isHeld()) lock.release(); }
        }, "gurbani-wifi-listen").start();
    }
    void close() { running = false; if (listener != null) listener.close(); }
}
