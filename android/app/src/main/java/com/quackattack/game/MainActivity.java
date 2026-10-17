package com.quackattack.game;

import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(UpdaterPlugin.class); // in-game updates (www/js/update.js)
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        goFullscreen();
    }

    // Home button, app switcher or screen off: tell the game, so it stops the music and pauses (engine.js appAway)
    @Override
    public void onPause() {
        callGame("window.__appPause && window.__appPause()");
        super.onPause();
    }

    @Override
    public void onResume() {
        super.onResume();
        callGame("window.__appResume && window.__appResume()");
    }

    private void callGame(String js) {
        if (getBridge() != null && getBridge().getWebView() != null) getBridge().getWebView().evaluateJavascript(js, null);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) goFullscreen();
    }

    // Hide status + navigation bars so the whole screen is game; swipe from an edge to peek at them.
    private void goFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.hide(WindowInsetsCompat.Type.systemBars());
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
