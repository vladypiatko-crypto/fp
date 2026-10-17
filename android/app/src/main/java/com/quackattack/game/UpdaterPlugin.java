package com.quackattack.game;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

// Updates the game from inside it (www/js/update.js): downloads the newest APK from the game's GitHub releases,
// then opens Android's installer, which installs it over this version and offers to open it.
@CapacitorPlugin(name = "QuackUpdater")
public class UpdaterPlugin extends Plugin {

    private static final String RELEASES = "https://github.com/vladypiatko-crypto/fp/releases/download/";
    private volatile int progress = -1;

    @PluginMethod
    public void update(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !url.startsWith(RELEASES)) {
            call.reject("not a game download");
            return;
        }
        progress = 0;
        new Thread(() -> {
            try {
                File dir = new File(getContext().getCacheDir(), "update");
                dir.mkdirs();
                File apk = new File(dir, "QuackAttack.apk");
                HttpURLConnection con = open(url);
                long total = con.getContentLengthLong();
                try (InputStream in = con.getInputStream(); OutputStream out = new FileOutputStream(apk)) {
                    byte[] buf = new byte[65536];
                    long got = 0;
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n);
                        got += n;
                        if (total > 0) progress = (int) (got * 100 / total);
                    }
                }
                progress = 100;
                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
                Intent install = new Intent(Intent.ACTION_VIEW);
                install.setDataAndType(uri, "application/vnd.android.package-archive");
                install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().runOnUiThread(() -> getActivity().startActivity(install));
                call.resolve();
            } catch (Exception e) {
                progress = -1;
                call.reject("download failed: " + e.getMessage());
            }
        }).start();
    }

    // GitHub sends downloads on to another https address: follow it
    private HttpURLConnection open(String url) throws Exception {
        for (int hop = 0; hop < 6; hop++) {
            HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
            con.setInstanceFollowRedirects(false);
            con.setConnectTimeout(15000);
            con.setReadTimeout(30000);
            int code = con.getResponseCode();
            if (code >= 300 && code < 400) {
                url = con.getHeaderField("Location");
                con.disconnect();
                if (url == null || !url.startsWith("https://")) throw new Exception("bad redirect");
                continue;
            }
            if (code != 200) throw new Exception("HTTP " + code);
            return con;
        }
        throw new Exception("too many redirects");
    }

    // how far the download is: 0..100, or -1 when nothing is downloading
    @PluginMethod
    public void progress(PluginCall call) {
        JSObject r = new JSObject();
        r.put("p", progress);
        call.resolve(r);
    }

    // CLOSE on the update screen: leave the game
    @PluginMethod
    public void quit(PluginCall call) {
        call.resolve();
        getActivity().runOnUiThread(() -> getActivity().finishAndRemoveTask());
    }
}
