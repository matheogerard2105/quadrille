package com.matheo.quadrille;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // After super.onCreate so Capacitor's no-action-bar theme is applied before the window decor is created.
        EdgeToEdge.enable(this);
    }
}
