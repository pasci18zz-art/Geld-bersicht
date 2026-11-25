package de.pasci.geld;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Gibt ein an „Geld“ geteiltes Bild (z. B. Bon-Screenshot) einmal an die App weiter. */
@CapacitorPlugin(name = "ShareIn")
public class ShareInPlugin extends Plugin {
    static volatile String pending = null;

    @PluginMethod
    public void take(PluginCall call) {
        JSObject ret = new JSObject();
        String data = pending;
        pending = null;
        if (data != null) ret.put("data", data);
        call.resolve(ret);
    }
}
