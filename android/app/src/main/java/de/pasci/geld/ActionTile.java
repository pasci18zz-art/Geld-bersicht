package de.pasci.geld;

import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.drawable.Icon;
import android.net.Uri;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/** Kachel in der Schnellzugriff-Leiste (von oben herunterziehen): öffnet die App direkt bei einer Aktion. */
public abstract class ActionTile extends TileService {
    abstract String uri();
    abstract int iconRes();
    abstract int labelRes();

    @Override
    public void onStartListening() {
        Tile tile = getQsTile();
        if (tile == null) return;
        tile.setLabel(getString(labelRes()));
        tile.setIcon(Icon.createWithResource(this, iconRes()));
        tile.setState(Tile.STATE_INACTIVE);
        tile.updateTile();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onClick() {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(uri()), this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (Build.VERSION.SDK_INT >= 34) {
            startActivityAndCollapse(PendingIntent.getActivity(this, 0, intent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        } else {
            startActivityAndCollapse(intent);
        }
    }
}
