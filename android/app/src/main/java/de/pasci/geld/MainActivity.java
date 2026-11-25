package de.pasci.geld;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import com.getcapacitor.BridgeActivity;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareInPlugin.class);
        super.onCreate(savedInstanceState);
        readShared(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        readShared(intent);
    }

    /** „Teilen → Geld“: Bild lesen und als data-URL bereitlegen (die App holt es beim Öffnen ab) */
    private void readShared(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String type = intent.getType();
        if (type == null || !type.startsWith("image/")) return;
        Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri == null) return;
        try (InputStream in = getContentResolver().openInputStream(uri)) {
            if (in == null) return;
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                if (out.size() > 15 * 1024 * 1024) return; // zu groß
            }
            ShareInPlugin.pending = "data:" + type + ";base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        } catch (Exception e) {
            // nicht lesbar → ignorieren
        }
        intent.setAction(Intent.ACTION_MAIN);
    }
}
