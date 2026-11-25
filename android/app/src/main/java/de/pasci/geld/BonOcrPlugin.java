package de.pasci.geld;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Rect;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

/** Bon lesen mit Googles Texterkennung im Handy (offline). Gibt jede Zeile mit Position zurück. */
@CapacitorPlugin(name = "BonOcr")
public class BonOcrPlugin extends Plugin {
    @PluginMethod
    public void read(PluginCall call) {
        String data = call.getString("data");
        if (data == null) { call.reject("Kein Bild"); return; }
        byte[] bytes;
        try {
            int comma = data.indexOf(',');
            bytes = Base64.decode(comma >= 0 ? data.substring(comma + 1) : data, Base64.DEFAULT);
        } catch (Exception e) { call.reject("Bild nicht lesbar"); return; }
        BitmapFactory.Options bounds = new BitmapFactory.Options();
        bounds.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(bytes, 0, bytes.length, bounds);
        int max = Math.max(bounds.outWidth, bounds.outHeight);
        int sample = 1;
        while (max / sample > 3000) sample *= 2;
        BitmapFactory.Options opts = new BitmapFactory.Options();
        opts.inSampleSize = sample;
        Bitmap bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length, opts);
        if (bmp == null) { call.reject("Bild nicht lesbar"); return; }
        final TextRecognizer rec = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        rec.process(InputImage.fromBitmap(bmp, 0))
            .addOnSuccessListener(text -> {
                JSArray lines = new JSArray();
                for (Text.TextBlock b : text.getTextBlocks()) {
                    for (Text.Line l : b.getLines()) {
                        Rect r = l.getBoundingBox();
                        if (r == null) continue;
                        JSObject j = new JSObject();
                        j.put("t", l.getText());
                        j.put("x", r.left);
                        j.put("y", r.top);
                        j.put("w", r.width());
                        j.put("h", r.height());
                        lines.put(j);
                    }
                }
                JSObject ret = new JSObject();
                ret.put("text", text.getText());
                ret.put("lines", lines);
                call.resolve(ret);
                rec.close();
            })
            .addOnFailureListener(e -> { call.reject("Texterkennung fehlgeschlagen: " + e.getMessage()); rec.close(); });
    }
}
