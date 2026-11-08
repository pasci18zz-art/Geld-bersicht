package de.pasci.geld;

public class TileLidl extends ActionTile {
    @Override String uri() { return "geld://lidl"; }
    @Override int iconRes() { return R.drawable.ic_tile_lidl; }
    @Override int labelRes() { return R.string.sc_lidl_short; }
}
