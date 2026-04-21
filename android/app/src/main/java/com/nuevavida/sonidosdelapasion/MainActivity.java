package com.nuevavida.sonidosdelapasion;

import android.os.Bundle;
import android.view.View;
import android.view.animation.PathInterpolator;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

/** Splash: fondo negro + logo del header; salida con fundido y ligero zoom. */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        splashScreen.setOnExitAnimationListener(splashScreenView -> {
            View root = splashScreenView.getView();
            PathInterpolator ease = new PathInterpolator(0.25f, 0.1f, 0.25f, 1f);
            root.animate()
                .alpha(0f)
                .scaleX(0.93f)
                .scaleY(0.93f)
                .setDuration(480)
                .setInterpolator(ease)
                .withEndAction(splashScreenView::remove)
                .start();
        });
    }
}
