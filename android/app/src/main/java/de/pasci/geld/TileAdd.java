package de.pasci.geld;

/** Schnellkachel „Eintragen“: öffnet direkt das ＋-Formular (Ausgabe · Einnahme · Zurück · Umbuchen) */
public class TileAdd extends ActionTile {
    @Override String uri() { return "geld://eintragen"; }
    @Override int iconRes() { return R.drawable.ic_tile_add; }
    @Override int labelRes() { return R.string.sc_add_short; }
}
